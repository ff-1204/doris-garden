// 도리의 정원 — 화면: 정원: 도구 · 지도 그리기 · 누르기와 드래그 · 꽃 상태창 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고 · ⛏️ 광산 탭은 R-D4부터 app-mine.js)
'use strict';
// ---------------------------------------------------------------- 정원: 도구 (P13)
const BATCH = ['water', 'weed', 'prune', 'fert', 'harvest'];
const HINT = {
  look: '꽃을 누르면 둘레에 돌보기 단추가 떠요 · 옮겨심기 · 번식은 상태창에서, 빈 칸을 누르면 심어요',
  plant: '위에서 꽃을 고르고 빈 칸을 눌러요',
  water: '목마른 꽃을 눌러 물을 줘요 · 한 번 주면 하루 괜찮아요',
  weed: '잡초 난 꽃을 눌러 뽑아요 · 하루 괜찮고, 뽑은 잡초는 비료가 돼요',
  prune: '나무와 덤불(장미, 라벤더, 재스민, 동백, 매화, 납매)의 가지를 쳐요 · 12시간 동안 품질이 올라요',
  fert: '꽃에 비료를 뿌려요 · 12시간 동안 품질이 오르고, 그만큼 꽃의 땅도 넓어져요',
  harvest: '노란 점이 뜬 핀 꽃에서 꽃잎을 거두면 제다실로 가요 · 꽃마다 1장부터 꽃잎 수까지 · 거두면 6시간 뒤 다시 펴요',
  prop: '다 자란 꽃을 눌러 번식해요 · 꽃마다 되는 달이 있고(꽃잠엔 언제든), 한 해에 한 번이에요',
  move: '옮길 꽃을 누르고 빈 칸을 눌러요 · 심는 달 · 휴면기 · 꽃잠에 돼요',
};
const decoById = id => (st.decos || []).find(d => d.id === id);
function plantable() {
  const cal = E.calendar(st.virtual), by = {};
  if (cal.frozen) return by;
  for (const it of st.items) {
    if (E.germOf(it) <= 0 || !FLOWERS[it.type].sow.includes(cal.month)) continue;
    by[it.type] = (by[it.type] || 0) + 1;
  }
  return by;
}
function careNeed(cal) {
  const need = { water: 0, weed: 0, prune: 0, harvest: 0, fert: 0 };   // 꽃잠에도 돌보기 · 수확 (수확은 핀 채로 잠든 꽃만 꽃잠에 한 번 — canCare가 셈, P04-01-09)
  for (const f of st.flowers) if (!f.withered) for (const t in need) if (E.canCare(st, f, t, cal)) need[t]++;
  return need;
}
// 돌봄 색 (아이콘 색에 맞춤): 물 파랑, 잡초 초록, 가지치기 분홍, 비료 갈색, 수확 노랑
const CARE_COLOR = { water: '#3d8fd6', weed: '#4f9a3a', prune: '#d4466e', fert: '#9a6a3a', harvest: '#d08a12' };
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
const NEEDS = [['water', '💧', '목마른 꽃'], ['weed', '🌿', '잡초 난 꽃'], ['prune', '✂️', '가지 칠 수 있는 꽃'], ['fert', '🌱', '비료 줄 수 있는 꽃'], ['harvest', '🧺', '꽃이 핀 꽃']];
// P28-11 한꺼번에 돌보기 (M2-5): 두 포기부터 (한 포기는 꽃 둘레 단추로). 느긋하게 보기여도 둠 — 숫자도 위 칩과 같은 돌볼 꽃 수라 그대로
const CARE_ALL = [['water', '💧 모두 물 주기'], ['harvest', '🧺 모두 거두기']];
const careAllBtns = (need, cls) => CARE_ALL.filter(([k]) => need[k] >= 2).map(([k, nm]) => `<button type="button" class="${cls}" style="--k:${CARE_COLOR[k]}" data-all="${k}">${nm} <b>(${need[k]})</b></button>`).join('');
function careAllOn(k) { return after(E.careAll(st, k, ctx), k === 'water' ? 'watered' : 'harvested', k === 'harvest' ? { label: '🌿 제다실', fn: () => setTab('tearoom') } : null); }
// P28-04 🧺 정원 저장고 (M2-7): 돌볼 꽃 칩 줄에 쌓인 양 / 상한 — 누르면 모두 거두기. 🐢 느긋하게 보기면 숫자 없이 (쌓였을 때만)
const PANTRY_K = '#b07a2a';
const pantryText = v => v.list.map(x => `${x.ic} ${x.name} ${x.n}`).join(' · ');
function pantryChip() {
  const v = E.pantryView(st); if (!v || (v.slow && !v.has)) return '';
  const tip = `🧺 정원 저장고${v.slow ? '' : ` ${v.n} / ${v.cap}${v.full ? ' · 가득 찼어요' : ' · 2시간마다 한 칸'}`}${v.has ? ` · ${pantryText(v)} · 눌러서 모두 거두기` : ''}`;
  return `<button type="button" class="nd pantry-chip ${v.has ? 'on' : ''}" style="--k:${PANTRY_K}" data-pantry="1" title="${tip}" aria-label="${tip}"><span>🧺</span>${v.slow ? '' : `<b>${v.n}/${v.cap}</b>`}</button>`;
}
function pantryAllBtn(cls) {
  const v = E.pantryView(st); if (!v || !v.has) return '';
  return `<button type="button" class="${cls}" style="--k:${PANTRY_K}" data-pantry="1" title="${pantryText(v)}">🧺 저장고 · 모두 거두기${v.slow ? '' : ` <b>(${v.n})</b>`}</button>`;
}
function takePantryOn() { const r = E.takePantry(st, ctx); return after(r, null, r.ok && r.petals ? { label: '🌿 제다실', fn: () => setTab('tearoom') } : null); }
function renderToolbar(force) {
  const pl = plantable(), cal = E.calendar(st.virtual), need = careNeed(cal);
  const sig = JSON.stringify([ui.tool, ui.plantType, ui.moveFrom, ui.decoId, st.fert, pl, cal.frozen, need, E.mineOf(st).energy, (v => v && [v.n, v.cap, v.has, v.slow, v.list.length])(E.pantryView(st))]);
  if (!force && ui.sigs.toolbar === sig) return;
  ui.sigs.toolbar = sig;
  if (ui.tool === 'plant' && ui.plantType && !pl[ui.plantType]) ui.plantType = null;   // 다 심으면 다시 "선택 안 함"
  const needSum = NEEDS.reduce((a, [k]) => a + need[k], 0);   // 칩 앞에 한마디: 돌볼 게 있으면 "누르면 반짝", 없으면 쉬어도 된다고
  $('#needs').innerHTML = `<span class="nd-say">${cal.frozen && !needSum ? '🌙 꽃들이 자는 중' : needSum ? '돌볼 꽃 · 누르면 반짝여요' : soonLine(cal)}</span>` + NEEDS.map(([k, ic, nm]) => `<button type="button" class="nd ${need[k] ? 'on' : ''}" style="--k:${CARE_COLOR[k]}" data-flash="${k}" title="${nm} ${need[k]}포기 · 눌러서 찾기"><span>${ic}</span><b>${need[k]}</b></button>`).join('') + careAllBtns(need, 'nd on nd-all') + pantryChip();   // ⛏️ 광산 입구는 10-30 탭으로 옮김 · 🔍 돋보기(모바일 확대, QA 6회차)는 10-30 사용자 요청으로 뺌
  const tray = $('#tray');
  if (ui.tool === 'plant') {
    const keys = Object.keys(pl);
    tray.hidden = false;
    tray.innerHTML = keys.length ? `<button type="button" class="seedchip none" data-seed="" aria-pressed="${!ui.plantType}">선택 안 함</button>` + keys.map(k => {
      const F = FLOWERS[k], best = Math.max(...st.items.filter(i => i.type === k && E.germOf(i) > 0).map(i => i.q));
      return `<button type="button" class="seedchip" data-seed="${k}" aria-pressed="${ui.plantType === k}"><span class="dot" style="background:${F.petal}"></span>${F.name} ${FORM[F.form].name} <span class="data">×${pl[k]}</span> <span class="stars" style="font-size:var(--fs-xs)">★${E.stars(best)}</span></button>`;
    }).join('') + '<button type="button" class="btn small" data-act="endMode">✓ 심기 끝</button>'
      : `<span class="muted" style="font-size:var(--fs-md)">${cal.frozen ? '꽃잠엔 심기가 쉬어요' : '창고에 지금 심을 게 없어요'}</span> <button type="button" class="btn small primary" data-go="shop">💐 화원</button> <button type="button" class="btn small" data-act="endMode">닫기</button>`;
  } else if (ui.tool === 'deco') {                // P17-16 장식 놓기 · 옮기기
    const d = decoById(ui.decoId);
    if (!d) { ui.tool = 'look'; ui.decoId = null; tray.hidden = true; tray.innerHTML = ''; return renderHint(); }
    tray.hidden = false;
    tray.innerHTML = `<span class="muted deco-tray">${decoImg(E.decoKey(d), 1)} 🪴 ${d.x == null ? '놓는' : '옮기는'} 중이에요</span><button type="button" class="btn small" data-act="endMode">취소</button>`;
  } else if (ui.tool === 'move') {
    tray.hidden = false;
    tray.innerHTML = '<span class="muted" style="font-size:var(--fs-md)">↔ 옮겨 심는 중이에요</span><button type="button" class="btn small" data-act="endMode">취소</button>';
  } else { tray.hidden = true; tray.innerHTML = ''; }
  renderHint();
}
$('#needs').addEventListener('click', e => {
  if (e.target.closest('[data-pantry]')) return takePantryOn();
  const all = e.target.closest('[data-all]'); if (all) return careAllOn(all.dataset.all);
  const b = e.target.closest('[data-flash]'); if (!b) return;
  const t = b.dataset.flash, nm = NEEDS.find(n => n[0] === t)[2];
  if (!careNeed(E.calendar(st.virtual))[t]) return feedback(`지금은 ${nm}이 없어요`);
  ui.flash = { t, until: performance.now() + 2400 };
});
// 안내 문구는 심기·옮겨 심기 중일 때만 (평소 설명은 상태창과 첫걸음 안내에 있음)
function renderHint() {
  let msg = '';
  if (E.calendar(st.virtual).frozen && ui.tool !== 'move') msg = '';      // 꽃잠은 지도 가운데 팝업이 알려 줌 (옮겨심기는 꽃잠에도)
  else if (ui.tool === 'plant') msg = ui.plantType ? `${josa(FLOWERS[ui.plantType].name, '을/를')} 심을 빈 칸을 누르세요` : HINT.plant;
  else if (ui.tool === 'deco') { const d = decoById(ui.decoId); msg = d ? `${josa(E.decoInfo(E.decoKey(d)).name, '을/를')} 놓을 빈 칸을 누르세요` : ''; }
  else if (ui.tool === 'move') { const f = ui.moveFrom && st.flowers.find(x => x.id === ui.moveFrom); msg = f ? `${josa(FLOWERS[f.type].name, '을/를')} 옮길 빈 칸을 누르세요` : HINT.move; }
  $('#hint').textContent = msg;
  $('#hint').hidden = !msg;
}
$('#tray').addEventListener('click', e => {
  if (e.target.closest('[data-act="endMode"]')) { ui.tool = 'look'; ui.moveFrom = null; ui.decoId = null; ui.gearPreview = null; renderToolbar(true); renderEmpty(true); return; }
  const b = e.target.closest('[data-seed]'); if (!b) return;
  ui.plantType = b.dataset.seed && b.dataset.seed !== ui.plantType ? b.dataset.seed : null; renderToolbar(true);   // 다시 누르면 선택 풀기
});
// ---------------------------------------------------------------- 정원: 지도 그리기
const canvas = $('#map');
let g = canvas.getContext('2d');   // let: P55 공유 그림이 잠깐 다른 캔버스로 바꿔 그림 (shareMap)
let cell = 20, dpr = 1, hover = null, drag = null;
const shade = Array.from({ length: W * H }, (_, i) => (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.07);
function resize() {                              // R-C4 (11-05 검토): 휴대폰(375px)에선 한 칸 11px라 🔍 2배 확대(ui.zoom) — 지도 틀 안에서 밀어 옮김(tileAt은 getBoundingClientRect라 그대로)
  const base = canvas.parentElement.clientWidth; if (!base) return;
  const z = ui.zoom || 1, w = base * z;
  dpr = window.devicePixelRatio || 1; cell = w / W;
  canvas.style.width = z > 1 ? w + 'px' : ''; canvas.style.height = cell * H + 'px';
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(cell * H * dpr);
  canvas.parentElement.classList.toggle('zoomed', z > 1);
}
new ResizeObserver(resize).observe(canvas.parentElement);
$('#mapZoom').addEventListener('click', () => { ui.zoom = ui.zoom === 2 ? 1 : 2; $('#mapZoom').setAttribute('aria-pressed', String(ui.zoom === 2)); resize(); feedback(ui.zoom === 2 ? '🔍 지도를 2배로 키웠어요 · 밀어서 옮겨요' : '지도를 원래 크기로'); });   // R-C4
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const LCOL = Object.fromEntries(LAND_KEYS.map(k => [k, hex(LANDS[k].color)]));
// P28-03 🧩 땅 무늬 보기 (M4-2 10-30): decos.js LAND_PATTERNS를 땅마다 16×16 한 장으로 — 지도엔 무늬만 겹치고, 범례 · 창의 땅 네모는 땅색 + 무늬.
// 무늬 색은 땅 밝기로만 고름(밝은 땅은 어둡게 · 어두운 땅은 밝게) — 색상이 아니라 모양으로 구분. 보기뿐이라 규칙은 그대로
const patInk = k => { const [r, gr, b] = LCOL[k]; return 0.299 * r + 0.587 * gr + 0.114 * b > 140 ? 'rgba(20,26,18,.34)' : 'rgba(255,255,255,.4)'; };
const patCache = {};
function landPat(k, bg) {
  const id = k + (bg ? ':bg' : ''); if (patCache[id]) return patCache[id];
  const P = (window.LAND_PATTERNS || {})[k], c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
  if (bg) { x.fillStyle = LANDS[k].color; x.fillRect(0, 0, 16, 16); }
  if (P) { x.fillStyle = patInk(k); P.grid.forEach((row, y) => { for (let i = 0; i < 16; i++) if (row[i] === '#') x.fillRect(i, y, 1, 1); }); }
  return (patCache[id] = c);
}
const patURL = k => patCache[k + ':url'] || (patCache[k + ':url'] = landPat(k, true).toDataURL());
// 땅 네모 하나 (범례 · 빈 칸 · 꽃 창 · 매뉴얼): 땅 무늬 보기면 16px 무늬 그림(정수배), 아니면 색만 — style은 색 네모일 때만
const landSw = (k, style) => E.patternView(st) ? `<span class="sw pat" style="background-image:url(${patURL(k)})"></span>` : `<span class="sw" style="background:${LANDS[k].color};${style || ''}"></span>`;
function tileColor(i) {
  const tl = st.tiles[i], bare = LCOL.barren, target = LCOL[E.classify(tl.t, tl.m)];
  const a = Math.min(1, Math.max(0, (tl.life - 0.1) / (E.LIFE_MIN + 0.15 - 0.1)));
  const sh = 1 + shade[i];
  return `rgb(${[0, 1, 2].map(j => Math.round((bare[j] + (target[j] - bare[j]) * a) * sh)).join(',')})`;
}
function ell(x, y, rx, ry, rot, fill) { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, 7); g.fill(); }
// 🗓️ 올해만 오는 것 (P30-05-02, L1-4 10-30): 지금 계절 것이 날씨면 지도 위에 반투명 도트 한 겹(decos.js YEARLY_ART — 16px 정수배, CSS로 아주 느리게 · 움직임 줄이기면 멈춤),
// 꽃빛이면 그 꽃의 지도 꽃잎 색만 바꿈. 그림뿐이라 꽃 값 · 자람 · 수확은 그대로. 판단은 E.yearlyNow 하나
const yartCache = {};
function yartURL(k) {
  if (yartCache[k]) return yartCache[k];
  const A = window.YEARLY_ART[k], sp = A.sparse || 1, c = document.createElement('canvas'); c.width = c.height = 16 * sp; const x = c.getContext('2d');
  for (const [ox, oy] of A.spots || [[0, 0]]) A.grid.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && A.pal[ch]) { x.fillStyle = A.pal[ch]; x.fillRect((ox + i) % c.width, (oy + j) % c.height, 1, 1); } }));   // 성긴 타일: 한 칸 안 여러 자리에 (넘치면 맞은편으로 — 이음매 없음)
  return (yartCache[k] = c.toDataURL());
}
let yearSkyMemo = null;
function yearSkyNow(cal) {   // { key: 날씨 키 | null, bloom: 꽃빛 꽃 | null } — draw는 프레임마다라 같은 달 · 같은 달력이면 다시 셈하지 않음
  const Y = st.yearly || {}, id = [cal.abs, st.gardenId, (st.yearLog || []).length, Y.at, (Y.missed || []).length, (Y.years || []).length].join('|');
  if (!yearSkyMemo || yearSkyMemo.id !== id) { const it = E.yearlyNow(st, cal); yearSkyMemo = { id, key: it && it.kind === 'weather' ? it.key : null, bloom: it && it.kind === 'bloom' ? it.flower : null }; }
  return yearSkyMemo;
}
function renderYearSky(cal) {
  const el = $('#yearSky'); if (!el) return;
  const k = yearSkyNow(cal).key, A = k && window.YEARLY_ART[k], big = Math.max(3, Math.floor(canvas.clientWidth * 0.24 / 16));
  const sig = [k, big, canvas.offsetTop, canvas.offsetHeight].join('|');
  if (el.dataset.sig === sig) return;
  el.dataset.sig = sig; el.hidden = !A;
  if (!A) { el.innerHTML = ''; return; }
  el.style.top = canvas.offsetTop + 'px'; el.style.height = canvas.offsetHeight + 'px'; el.style.background = A.tint || '';
  el.innerHTML = A.tile ? `<i class="ys-tile ys-${A.tile}" style="background-image:url(${yartURL(k)});background-size:${48 * (A.sparse || 1)}px;--p:${48 * (A.sparse || 1)}px"></i>` : `<img class="px ys-big ys-${A.big}" src="${yartURL(k)}" width="${16 * big}" height="${16 * big}" alt="">`;
}
function drawFlower(f, cal) {
  const F0 = FLOWERS[f.type], mut = E.mutShown(f) ? E.mutStage(f) : 0;   // P36-03 🧬 변이 꽃빛 · 단계 (올해의 꽃빛보다 먼저)
  const alt = mut ? mutPetal(f.type, mut) : yearSkyMemo && yearSkyMemo.bloom === f.type && window.YEARLY_ART.bloom[f.type];   // P30-05-02 올해의 꽃빛: 그 꽃의 꽃잎 색만 바꿈
  const F = alt ? Object.assign({}, F0, { petal: alt.petal, center: alt.center }) : F0, cx = (f.x + 0.5) * cell, cy = (f.y + 0.5) * cell, R = cell * 0.46;
  g.save(); g.translate(cx, cy);
  // 심은 칸 받침: 옅은 흙빛 동그라미 — 땅 색 위에서도 꽃이 잘 보이게 (10-06)
  g.fillStyle = 'rgba(255,248,236,.42)'; g.strokeStyle = 'rgba(90,70,50,.22)'; g.lineWidth = Math.max(1, cell * 0.04);
  g.beginPath(); g.ellipse(0, R * 0.12, R * 0.98, R * 0.9, 0, 0, 7); g.fill(); g.stroke();
  switch (f.stage) {
    case 'germ': ell(0, 0, R * 0.22, R * 0.15, 0, '#5b4632'); break;
    case 'sprout': ell(-R * 0.2, 0, R * 0.25, R * 0.12, -0.5, '#3f8a3a'); ell(R * 0.2, 0, R * 0.25, R * 0.12, 0.5, '#3f8a3a'); break;
    case 'withered':
      g.strokeStyle = '#6e5a43'; g.lineWidth = Math.max(1, cell * 0.07); g.lineCap = 'round';
      g.beginPath(); g.moveTo(-R * 0.4, R * 0.3); g.quadraticCurveTo(0, -R * 0.5, R * 0.45, R * 0.2); g.moveTo(0, R * 0.4); g.lineTo(-R * 0.1, -R * 0.15); g.stroke(); break;
    case 'dormant':
      g.strokeStyle = '#6b5440'; g.lineWidth = Math.max(1, cell * 0.06); g.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.45; g.beginPath(); g.moveTo(0, R * 0.35); g.lineTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6 + R * 0.1); g.stroke(); }
      break;
    case 'young': case 'mature': {
      const s = f.stage === 'young' ? 0.55 : 0.8;
      ell(R * 0.08, R * 0.1, R * s, R * s * 0.9, 0, 'rgba(0,0,0,.15)');
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ell(Math.cos(a) * R * s * 0.4, Math.sin(a) * R * s * 0.4, R * s * 0.5, R * s * 0.35, a, i % 2 ? '#3d7f3a' : '#4d9445'); }
      break;
    }
    case 'bloom': {
      const open = 1;   // P72-01 거두면 다 자람으로 돌아가 "거둔 핀 꽃"(예전엔 오므려 그림)은 없음
      ell(R * 0.08, R * 0.12, R * 0.95, R * 0.85, 0, 'rgba(0,0,0,.16)');
      if (mut >= 3) {                                // P36-03 3단계: 짙은 그림자 + 테두리 1px (흔들림은 없음 — 움직임 줄이기와 상관없이 가만히)
        ell(R * 0.16, R * 0.22, R * 1.02, R * 0.92, 0, 'rgba(30,8,36,.32)');
        g.strokeStyle = window.MUT_RIM; g.lineWidth = Math.max(1, cell * 0.05); g.beginPath(); g.arc(0, 0, R * 0.98, 0, 7); g.stroke();
      }
      if (F.look === 'lotus') { g.fillStyle = '#3c7d4a'; g.beginPath(); g.arc(0, 0, R * 0.95, 0.5, Math.PI * 2 - 0.1); g.lineTo(0, 0); g.fill(); }
      else for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; ell(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45, R * 0.38, R * 0.22, a, '#467f3d'); }
      if (F.look === 'spike') {
        for (let s = -1; s <= 1; s++) for (let j = 0; j < F.n; j++) ell(s * R * 0.35, R * 0.45 - j * R * 0.14 * open, R * 0.11, R * 0.08, 0, j % 2 ? F.petal : F.center);
      } else if (F.look === 'rose') {
        // 꽃잎 5장 + 안쪽 4장 + 가운데 (10-06: 예전엔 동그라미 세 겹이라 꽃으로 안 보였음)
        g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 0.8;
        for (let i = 0; i < 5; i++) { g.save(); g.rotate(i / 5 * Math.PI * 2 + f.x); g.fillStyle = F.petal; g.beginPath(); g.ellipse(0, -R * 0.4 * open, R * 0.34 * open, R * 0.3 * open, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
        for (let i = 0; i < 4; i++) { g.save(); g.rotate(i / 4 * Math.PI * 2 + 0.6 + f.y); g.fillStyle = F.center; g.beginPath(); g.ellipse(0, -R * 0.17 * open, R * 0.2 * open, R * 0.15 * open, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
        g.fillStyle = F.look === 'rose' && F.key === 'dongbaek' ? '#f2c94c' : F.petal; g.beginPath(); g.arc(0, 0, R * 0.1 * open, 0, 7); g.fill();
      } else {
        const len = { daisy: 0.55, star: 0.5, round: 0.5, lotus: 0.7 }[F.look], wid = { daisy: 0.13, star: 0.14, round: 0.3, lotus: 0.24 }[F.look];
        g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 0.8;
        for (let i = 0; i < F.n; i++) {
          g.save(); g.rotate(i / F.n * Math.PI * 2 + f.x);
          g.fillStyle = F.petal; g.beginPath(); g.ellipse(0, -R * len * 0.62 * open, R * wid * open, R * len * 0.6 * open, 0, 0, 7); g.fill(); g.stroke();
          g.restore();
        }
        g.fillStyle = F.center; g.beginPath(); g.arc(0, 0, R * (F.look === 'daisy' ? 0.26 : 0.14), 0, 7); g.fill();
      }
      if (!mut) { g.fillStyle = '#ffd84a'; g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; g.beginPath(); g.arc(0, -R * 0.95, Math.max(2, R * 0.14), 0, 7); g.fill(); g.stroke(); }
      break;
    }
  }
  g.restore();
}
function draw(clean) {   // clean: P55 공유 그림 — 지도 · 꽃 · 장식 · 손님만 (고른 칸 · 둘레 · 반짝임 · 단추 고리 없이)
  if (!clean && !canvas.width) return;
  if (!clean) updateRing();
  const cal = E.calendar(st.virtual);
  if (!clean) renderYearSky(cal);                              // P30-05-02 올해만 오는 날씨 (꽃빛은 아래 drawFlower가 읽음)
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pat = E.patternView(st); g.imageSmoothingEnabled = false;   // P28-03 땅 무늬
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, tl = st.tiles[i];
    g.fillStyle = tileColor(i);
    g.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
    if (tl.life > E.LIFE_MIN && E.classify(tl.t, tl.m) === 'pond') {
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1;
      g.beginPath(); g.arc((x + 0.5) * cell, (y + 0.55) * cell, cell * 0.22, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    }
    if (pat) { const k = E.landOf(tl); if (k !== 'barren') g.drawImage(landPat(k), x * cell, y * cell, cell, cell); }   // 땅이 덜 바뀐 칸(황무지)은 민무늬
  }
  g.fillStyle = ['rgba(255,190,210,.06)', 'rgba(255,220,120,.05)', 'rgba(220,140,60,.07)', 'rgba(215,232,255,.16)', 'rgba(0,0,0,0)'][cal.season];
  g.fillRect(0, 0, W * cell, H * cell);
  // P05-01: 낮과 밤, 꽃잠에는 새벽빛으로 멈춤
  if (cal.frozen) { g.fillStyle = 'rgba(150,140,200,.22)'; g.fillRect(0, 0, W * cell, H * cell); g.fillStyle = 'rgba(255,200,190,.10)'; g.fillRect(0, 0, W * cell, H * cell * 0.4); }
  else if ((st.speed || 1) <= 60) {
    const h = cal.hour, night = h < 5 || h >= 20 ? 1 : h < 7 ? (7 - h) / 2 : h >= 18 ? (h - 18) / 2 : 0;
    if (night > 0) { g.fillStyle = `rgba(14,22,52,${0.18 * night})`; g.fillRect(0, 0, W * cell, H * cell); }
  }
  for (const f of st.flowers) drawFlower(f, cal);
  // P17-16 장식: 칸에 맞춰 도트 그림 (지도 칸은 화면 폭에 따라 변해서 정수배가 아닐 수 있음 — 흐려지지 않게만, imageSmoothingEnabled는 위 땅 그리기에서 껐음)
  const wallAt = new Set((st.decos || []).filter(d => d.key === 'stonewall' && d.x != null).map(d => `${d.x},${d.y}`));   // P77-A 🪵 나무 울타리 이음: 위 · 아래 이웃만 있으면 세로(_v), 가로 · 세로 둘 다면 _x, 그 밖엔 가로
  const wallVariant = d => { if (d.key !== 'stonewall') return ''; const h = wallAt.has(`${d.x - 1},${d.y}`) || wallAt.has(`${d.x + 1},${d.y}`), v = wallAt.has(`${d.x},${d.y - 1}`) || wallAt.has(`${d.x},${d.y + 1}`); return h && v ? '_x' : v ? '_v' : ''; };
  for (const d of st.decos || []) if (d.x != null) {
    const im = decoBitmap(E.decoKey(d), wallVariant(d)); if (im) { if (clean) g.drawImage(im, d.x * cell, d.y * cell, cell, cell); else g.drawImage(im, d.x * cell + cell * 0.04, d.y * cell + cell * 0.04, cell * 0.92, cell * 0.92); }   // 공유 그림은 칸 = 16px 정수배라 칸 가득
  }
  for (const v of E.visitorsOf(st, cal)) { const im = visitorBitmap(v.key); if (im) { if (clean) g.drawImage(im, v.x * cell, v.y * cell, cell, cell); else g.drawImage(im, v.x * cell + cell * 0.04, v.y * cell + cell * 0.04, cell * 0.92, cell * 0.92); } }   // P30-06-02 🐾 특별 손님 (장식과 같은 길 · 빈 칸에만 앉음)
  if (clean) return;
  // P27 장치 효과 범위: 놓거나 옮기는 중엔 가리킨 칸 둘레, 놓인 장치를 누르면 잠깐 그 둘레 (QA 12회차 제안)
  const gearAt = (key, x, y) => { const G = { r: decoReach(key) }; if (G.r == null) return; g.save(); g.fillStyle = 'rgba(255, 216, 74, .18)'; g.strokeStyle = 'rgba(255, 216, 74, .9)'; g.lineWidth = 1.5; g.setLineDash([3, 3]);
    const x0 = Math.max(0, x - G.r), y0 = Math.max(0, y - G.r), x1 = Math.min(W - 1, x + G.r), y1 = Math.min(H - 1, y + G.r);
    g.fillRect(x0 * cell, y0 * cell, (x1 - x0 + 1) * cell, (y1 - y0 + 1) * cell); g.strokeRect(x0 * cell + 1, y0 * cell + 1, (x1 - x0 + 1) * cell - 2, (y1 - y0 + 1) * cell - 2); g.restore(); };
  const placing = ui.tool === 'deco' && decoById(ui.decoId);
  if (placing && decoReach(placing.key) != null) { const p = ui.gearPreview || hover || (placing.x != null ? [placing.x, placing.y] : null); if (p) gearAt(placing.key, p[0], p[1]); }
  if (ui.gearShow && performance.now() < ui.gearShow.until) { const d = decoById(ui.gearShow.id); if (d && d.x != null) gearAt(d.key, d.x, d.y); } else if (ui.gearShow) ui.gearShow = null;
  const sd = !placing && selDecoOf(); if (sd) gearAt(sd.key, sd.x, sd.y);   // 고른 장식의 둘레 — 상태창을 닫을 때까지 (11-01)
  const dm = ui.tool === 'deco' && decoById(ui.decoId);
  if (dm && dm.x != null) { g.save(); g.strokeStyle = '#ffd84a'; g.lineWidth = 2.5; g.setLineDash([4, 3]); g.strokeRect(dm.x * cell + 1, dm.y * cell + 1, cell - 2, cell - 2); g.restore(); }
  if (ui.flash) {                                  // 숫자를 누른 돌봄이 필요한 꽃들 반짝이기
    const now = performance.now(), left = ui.flash.until - now;
    if (left <= 0) ui.flash = null;
    else {
      const a = 0.45 + 0.55 * Math.abs(Math.sin((2400 - left) / 2400 * Math.PI * 4));
      const col = CARE_COLOR[ui.flash.t];
      g.save(); g.lineWidth = 3; g.strokeStyle = rgba(col, a); g.fillStyle = rgba(col, a * 0.3);
      g.shadowColor = rgba(col, 0.9); g.shadowBlur = 10;
      for (const f of st.flowers) if (!f.withered && E.canCare(st, f, ui.flash.t, cal)) {
        const r = cell * (0.7 + 0.15 * a);
        g.beginPath(); g.arc((f.x + 0.5) * cell, (f.y + 0.5) * cell, r, 0, Math.PI * 2); g.fill(); g.stroke();
      }
      g.restore();
    }
  }
  const pot = !ui.selected && !(st.guide && (st.guide.pot || st.guide.hidden)) && E.potFlower(st);
  if (pot) {                                       // 첫걸음 "정원의 첫 꽃 돌보기": 누를 때까지 화분 둘레가 분홍으로 반짝 (변경 10-27)
    const a = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.8 : 0.35 + 0.45 * Math.abs(Math.sin(performance.now() / 600));   // 움직임 줄이기면 깜빡이지 않음
    g.save(); g.lineWidth = 2.5; g.strokeStyle = rgba('#ff8fbf', a); g.shadowColor = rgba('#ff8fbf', 0.9); g.shadowBlur = 8;
    g.beginPath(); g.arc((pot.x + 0.5) * cell, (pot.y + 0.5) * cell, cell * (0.72 + 0.1 * a), 0, Math.PI * 2); g.stroke(); g.restore();
  }
  const sel = st.flowers.find(f => f.id === ui.selected);
  if (sel) {
    const r = E.stageRadius(sel);
    g.save(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2;
    g.strokeRect(sel.x * cell + 1, sel.y * cell + 1, cell - 2, cell - 2);
    if (r > 0) { g.setLineDash([5, 4]); g.lineWidth = 1.5; g.beginPath(); g.arc((sel.x + 0.5) * cell, (sel.y + 0.5) * cell, (r + 0.5) * cell, 0, 7); g.stroke(); }
    g.restore();
  }
  if (ui.selTile && !sel) { const [sx, sy] = ui.selTile; g.save(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.setLineDash([4, 3]); g.strokeRect(sx * cell + 1, sy * cell + 1, cell - 2, cell - 2); g.restore(); }
  const mv = ui.moveFrom && st.flowers.find(f => f.id === ui.moveFrom);
  if (mv) { g.save(); g.strokeStyle = '#ffd84a'; g.lineWidth = 2.5; g.setLineDash([4, 3]); g.strokeRect(mv.x * cell + 1, mv.y * cell + 1, cell - 2, cell - 2); g.restore(); }
  if (hover) { g.save(); g.strokeStyle = 'rgba(255,255,255,.65)'; g.setLineDash([4, 3]); g.lineWidth = 1.5; g.strokeRect(hover[0] * cell + 1, hover[1] * cell + 1, cell - 2, cell - 2); g.restore(); }
}
function snapshot() {
  const c = document.createElement('canvas'); c.width = 240; c.height = 160;
  c.getContext('2d').drawImage(canvas, 0, 0, 240, 160);
  return c.toDataURL('image/jpeg', 0.75);
}

// ---------------------------------------------------------------- 정원: 누르기와 드래그 (P13-06-01)
// R-C2 (11-05 검토 · 재방문): 돌볼 게 없을 때 한 줄 — 가장 먼저 필 꽃 · 다음 6시에 식을 찻잔 (다시 필 때 알림은 R-C1로 줄였으니 여기서 미리 알려 줌)
function soonLine(cal) {
  const parts = []; let best = null;
  for (const f of st.flowers) { if (f.withered || f.mut) continue; const h = E.bloomLeftH(st, f); if (h != null && h > 0 && (best == null || h < best.h)) best = { h, f }; }
  if (best) parts.push(`🌸 ${realH(best.h / (st.speed || 1))} 뒤 ${josa(FLOWERS[best.f.type].name, '이/가')} 펴요`);
  const warm = E.readyCups(st).filter(c => !E.cupCold(c, cal)).length;
  if (warm) parts.push(`🧊 찻잔 ${warm}잔은 ${slotLeftText()} 뒤 식어요`);
  return parts.length ? `🌿 돌볼 꽃이 없어요 · ${parts.join(' · ')}` : '🌿 지금은 돌볼 꽃이 없어요';
}
function tileAt(e) {
  const r = canvas.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / cell), y = Math.floor((e.clientY - r.top) / cell);
  return x >= 0 && y >= 0 && x < W && y < H ? [x, y] : null;
}
const tipEl = $('#tip');
// 위 막대 · 안내 줄이 나타나거나 사라지면 지도가 위아래로 밀림 → 그 직후 누름은 무시 (QA 16회차 메모: 연달아 누르면 다른 칸이 눌림)
// 지도 위 칸들의 크기가 바뀔 때 지도가 실제로 움직였을 때만 (QA 17회차: 다시 그리기만 해도 막던 것 고침)
{ let lastTop = null; const ro = new ResizeObserver(() => { const top = canvas.getBoundingClientRect().top + window.scrollY; if (lastTop != null && Math.abs(top - lastTop) > 4 && performance.now() > (ui.noShiftUntil || 0)) ui.mapShiftAt = performance.now(); lastTop = top; });
  for (const id of ['#guideBox', '#today', '#tray', '.hintbar']) ro.observe($(id)); }
// 위 막대 · 안내 줄이 실제로 나타나거나 사라질 때만 (같은 값으로 다시 넣는 것은 빼고 — QA 17회차)
for (const id of ['#tray', '#hint']) new MutationObserver(ms => { if (ms.some(m => (m.oldValue !== null) !== m.target.hidden) && performance.now() > (ui.noShiftUntil || 0)) ui.mapShiftAt = performance.now(); }).observe($(id), { attributes: true, attributeFilter: ['hidden'], attributeOldValue: true });
function tipHTML([x, y]) {
  const f = E.flowerAt(st, x, y), tl = st.tiles[y * W + x], land = LANDS[E.landOf(tl)].name, dc = E.decoAt(st, x, y), vs = !f && !dc && E.visitorAt(st, x, y);
  if (vs) return `<b>${vs.icon} ${esc(vs.name)}</b><br><span class="muted">${land} · 눌러서 말 걸기</span>`;   // P30-06-02
  if (!f && dc) return `<b>🪴 ${esc(E.decoInfo(E.decoKey(dc)).name)}</b><br><span class="muted">${land} · 눌러서 옮기기</span>`;
  if (!f) return `<b>${land}</b><br><span class="muted">${tl.t.toFixed(1)}°C · 습도 ${Math.round(tl.m)}%</span>`;
  const F = FLOWERS[f.type], cal = E.calendar(st.virtual), v = Math.round(E.vigorOf(st, f));
  const needs = [];
  if (!f.withered) {
    if (E.canCare(st, f, 'water', cal)) needs.push('💧 목말라요');
    if (E.canCare(st, f, 'weed', cal)) needs.push('🌿 잡초가 났어요');
    if (E.canCare(st, f, 'harvest', cal)) needs.push('🧺 거둘 수 있어요');
  }
  if (E.mutShown(f)) return `<b>🧬 ${esc(E.MUTANTS[f.type].name)}</b> · ${E.mutStage(f)}단계<br><span class="stars">${starStr(f.q)}</span> ${E.pct(f.q)}%${needs.length ? '<br>' + needs.join('<br>') : ''}<br><span class="muted">${land}</span>`;   // P36 변이 꽃
  return `<b>${F.name}</b> · ${E.STAGE[f.stage]}<br><span class="stars">${starStr(f.q)}</span> ${E.pct(f.q)}% · 기운 ${v}%${needs.length ? '<br>' + needs.join('<br>') : ''}<br><span class="muted">${land}</span>`;
}
canvas.addEventListener('pointerdown', e => {
  tipEl.hidden = true; hideVisitorBubble();
  const t = tileAt(e); if (!t) return;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 일부 환경에서는 지원하지 않음 */ }
  drag = { start: t, cur: t, path: new Map([[t.join(','), t]]), moved: false, x: e.clientX, y: e.clientY, top: canvas.getBoundingClientRect().top, early: performance.now() - (ui.mapShiftAt || 0) < 600 };   // 지도가 막 움직였으면 (QA 16회차 메모)
});
canvas.addEventListener('pointermove', e => {
  const t = tileAt(e); hover = t;
  if (drag) {
    tipEl.hidden = true;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) drag.moved = true;   // 밀어 본 것이면 누름이 아님 (확대 · QA 7회차)
    return;                                       // 드래그로 여러 칸 고르기는 지금은 꺼 둠
  }
  if (e.pointerType === 'mouse' && t) {
    tipEl.innerHTML = tipHTML(t); tipEl.hidden = false;
    tipEl.style.left = Math.min(innerWidth - 262, e.clientX + 14) + 'px';
    tipEl.style.top = Math.min(innerHeight - 110, e.clientY + 16) + 'px';
  } else tipEl.hidden = true;
});
canvas.addEventListener('pointerup', e => {
  ui.lastPointer = e.pointerType;                 // 터치면 장치를 놓기 전에 범위를 먼저 (QA 14회차)
  if (!drag) return;
  const t = drag.start, moved = drag.moved || drag.early || Math.abs(canvas.getBoundingClientRect().top - drag.top) > 4;   // 지도가 밀린 뒤 곧바로 누른 것은 누름으로 치지 않음
  drag = null;
  if (!moved) onTiles([t]);
});
canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('pointerleave', () => { hover = null; tipEl.hidden = true; });

function onTiles(tiles) {
  const [x, y] = tiles[tiles.length - 1];
  const f = E.flowerAt(st, x, y);
  tapPot(f);                                       // 첫걸음 "정원의 첫 꽃 돌보기" (변경 10-27)
  if (BATCH.includes(ui.tool)) {
    const r = E.care(st, ui.tool, tiles, ctx);
    if (tiles.length === 1 && f) select(f.id);
    return after(r, ui.tool === 'water' ? 'watered' : ui.tool === 'harvest' ? 'harvested' : null, ui.tool === 'harvest' ? { label: '🌿 제다실', fn: () => setTab('tearoom') } : null);
  }
  if (ui.tool === 'deco') {
    if (f) return feedback('꽃이 없는 빈 칸에 놓아요', true);
    const pd = decoById(ui.decoId);
    if (pd && decoReach(pd.key) != null && ui.lastPointer === 'touch' && !(ui.gearPreview && ui.gearPreview[0] === x && ui.gearPreview[1] === y)) {
      ui.gearPreview = [x, y]; hover = [x, y];
      return feedback('노란 칸이 효과 범위예요 · 같은 칸을 한 번 더 누르면 놓아요');
    }
    ui.gearPreview = null;
    const r = E.placeDeco(st, ui.decoId, x, y);
    if (r.ok) { ui.tool = 'look'; ui.decoId = null; }
    return after(r);
  }
  const dc = !f && E.decoAt(st, x, y);
  if (dc && ui.tool === 'look') return openDecoTile(dc);
  ui.selDeco = null;                               // 장식 말고 다른 칸을 누르면 장식 고르기는 끝 (11-01)
  const vs = !f && !dc && ui.tool === 'look' && E.visitorAt(st, x, y);
  if (vs) { ui.selected = null; ui.selTile = null; renderStatus(true); return showVisitorBubble(vs); }   // P30-06-02 손님 칸: 둘레 단추 · 심기 대신 말풍선 (손님은 빈 칸에만 앉아 꽃 · 장식 누르기를 막지 않음)
  if (ui.tool === 'look') {
    if (f) select(f.id);
    else { ui.selected = null; ui.selTile = [x, y]; ui.sheetOpen = true; }   // 빈 칸: 상태창에서 심기
    return renderStatus(true);
  }
  if (ui.tool === 'plant') {
    if (f) { ui.tool = 'look'; ui.plantType = null; renderToolbar(true); return select(f.id); }   // 10-24: 경고 대신 그 꽃 보기
    if (!ui.plantType) { $('#tray').classList.remove('nudge'); void $('#tray').offsetWidth; $('#tray').classList.add('nudge'); return feedback('먼저 위에서 심을 꽃을 골라 주세요', true); }
    return plantAt(ui.plantType, x, y);
  }
  if (ui.tool === 'prop') { if (!f) return feedback('번식할 꽃을 눌러 주세요', true); select(f.id); return after(E.propagate(st, f.id, ctx.rng, ctx)); }
  if (ui.tool === 'move') {
    if (!ui.moveFrom) { if (!f) return feedback('먼저 옮길 꽃을 눌러 주세요', true); ui.moveFrom = f.id; select(f.id); renderHint(); return renderToolbar(true); }
    const r = E.move(st, ui.moveFrom, x, y, ctx);
    if (r.ok) { ui.moveFrom = null; ui.tool = 'look'; }                     // 옮긴 뒤에는 관찰로 돌아감
    return after(r);
  }
}
// 🐾 특별 손님 말풍선 (P30-06-02, L1-7 10-30): 그 칸 위에 말 한 줄 + "🧺 n번째 방문" (느긋하게 보기면 말만) + "심으면 손님이 비켜요" (검토 10-30). 지도를 다시 누르거나 8초 뒤 닫힘
var visitorBubbleEl = document.getElementById('visitorBubble'), visitorBubbleT = 0;
function hideVisitorBubble() { if (visitorBubbleEl && !visitorBubbleEl.hidden) { visitorBubbleEl.hidden = true; clearTimeout(visitorBubbleT); } }
function showVisitorBubble(v) {
  if (!visitorBubbleEl) return;
  const el = visitorBubbleEl, fw = el.parentElement.clientWidth;
  el.innerHTML = `<span class="vb-art">${visitorImg(v.key, 2)}</span><span class="vb-main"><b>${v.icon} ${esc(v.name)}</b><span class="vb-line">“${esc(v.line)}”</span>${E.slowView(st) ? '' : `<small class="muted">🧺 ${v.times}번째 방문</small>`}<small class="muted">심으면 손님이 비켜요</small></span>`;
  el.hidden = false;
  const cx = canvas.offsetLeft + (v.x + 0.5) * cell, top = canvas.offsetTop + v.y * cell, w = el.offsetWidth, h = el.offsetHeight;
  const left = Math.max(6, Math.min(fw - w - 6, cx - w / 2)), below = top - h - 6 < 4;   // 지도 위쪽 끝이면 칸 아래로
  el.style.left = left + 'px'; el.style.top = (below ? top + cell + 6 : top - h - 6) + 'px';
  el.style.setProperty('--tail', Math.max(12, Math.min(w - 12, cx - left)) + 'px'); el.classList.toggle('below', below);
  clearTimeout(visitorBubbleT); visitorBubbleT = setTimeout(hideVisitorBubble, 8000);
}
// ---------------------------------------------------------------- 정원: 장식 상태창 · 심기 (R-D4 11-05: 예전엔 광산 구역 뒤에 붙어 있던 것 — 광산 탭만 app-mine.js로)
// 놓인 장식을 누르면: 그림 · 이름 · 옮기기 · 창고에 넣기 (P17-16-03)
// 변경 11-01 (사용자 요청): 창 대신 옆 상태창에 — 고른 동안 지도에 둘레(범위)를 계속 보임 (ui.selDeco)
// 심은 지: 한 해(14달)가 넘으면 해 단위로 (QA 13회차)
const ageText = h => { const m = Math.floor(h / E.MONTH_H + 1e-6), d = Math.round((h - m * E.MONTH_H) / 0.8); return m >= 14 ? `${Math.floor(m / 14)}년 ${m % 14 ? `${m % 14}달` : ''}`.trim() : [m ? m + '달' : '', d && d < 15 ? d + '일' : ''].filter(Boolean).join(' ') || '1일 미만'; };   // 꽃 나이는 정원 달력으로 (P46에도 그대로 — 걸리는 시간이 아님)
function openDecoTile(d) { ui.selected = null; ui.selTile = null; ui.selDeco = d.id; ui.sheetOpen = true; renderStatus(true); }
const selDecoOf = () => { const d = ui.selDeco != null && decoById(ui.selDeco); return d && d.x != null ? d : null; };
function decoExtra(d) {
  let extra = '';
  if (d.key === 'hive') {                          // P18 벌통 → P65-01 꿀은 바로 📦 창고로: 둘레의 핀 꽃 · 다음에 들어올 꿀 · 창고 꿀 (손으로 거두기 없음)
    const bl = E.hiveBlooms(st, d), h = E.honeyOf(bl), frozen = E.calendar(st.virtual).frozen, left = E.honeyLeft(st), full = left >= E.hiveMax(st);
    extra = `<div class="hive-info"><small class="muted">둘레 ${E.hiveR(st)}칸에 핀 꽃 ${bl.length}포기 · ${frozen ? '🌙 꽃잠에는 벌도 쉬어요' : full ? '창고 꿀이 가득해 벌이 쉬어요 · 🍵 꿀차로 우려요' : h ? `${slotLeftText()} 뒤 ${E.honeyName(h.type)} ${Math.min(h.jars, E.hiveMax(st) - left)}병이 창고로` : '꽃이 피면 꿀이 모여요'} · 📦 창고 꿀 ${left} / ${E.hiveMax(st)}병</small></div>`;
  }
  if (d.key === 'autobasket') {                   // P28-10-01 · P39-02 🐜 개미: 이 달이 끝나면 거둘 꽃 · 지도에 둘레
    const cal = E.calendar(st.virtual), bl = E.basketBlooms(st, d, cal);
    extra = `<p class="muted">${d.x == null ? '정원에 놓으면 일해요' : cal.frozen ? '🌙 꽃잠엔 개미 일꾼도 쉬어요 · 잠든 꽃은 직접 거둬요' : bl.length ? (E.slowView(st) ? `${slotLeftText()} 뒤 둘레에 핀 꽃의 꽃잎을 거둬 제다실로 보내요` : `${slotLeftText()} 뒤 핀 꽃 ${bl.length}포기의 꽃잎을 거둬 제다실로 보내요`) : '지금 둘레에 거둘 핀 꽃이 없어요'} · 바구니 용품은 안 써요 · 꽃잎 품질은 손으로 거둔 것의 90%${E.slowView(st) ? '' : ` · 지금까지 ${d.n || 0}장`}</p>`;
  } else if (E.INSECTS[d.key] && d.key !== 'hive') {   // P39 🐌 · 🐞 · 🪱 · 🐛 · 🦋: 맡은 일 한 줄 (곤충농장 카드와 같은 말)
    const cal = E.calendar(st.virtual), w = E.farmOf(st).workers.find(x => x.key === d.key);
    extra = `<p class="muted">${d.x == null ? '정원에 놓으면 일해요' : cal.frozen ? '🌙 꽃잠엔 곤충도 쉬어요' : esc(w.work || '')}</p>`;   // P65-04 얼마마다는 위 효과 한 줄(insectLine)에
  }
  if (d.key === 'hive' && d.x != null) extra += `<p class="muted">🐝 둘레 ${E.insectR(st, 'hive')}칸 꽃은 번식할 때 품질이 덜 깎여요</p>`;
  if (d.key === 'dryshelf') {                     // P39-09-01 🧺 건조 선반 (예전 P28-10-02 누에 말리기): 이 달이 끝나면 널 꽃잎 · 꽃방에서 마르는 중
    const racks = E.placedOf(st, 'dryshelf').length, frozen = E.calendar(st.virtual).frozen, mine = st.drying.filter(x => x.auto).length, take = Math.min(st.petals.length, racks * E.rackN());
    extra = `<p class="muted">${d.x == null ? '정원에 놓으면 일해요' : frozen ? '🌙 꽃잠엔 건조 선반도 쉬어요' : take ? `${slotLeftText()} 뒤 제다실 꽃잎 ${take}장을 꽃방에 널어요` : '지금 제다실에 널 꽃잎이 없어요'} · 하나에 12시간마다 ${E.rackN()}장, 오래된 꽃잎부터 · 다 마르면 티백까지 · 블렌드는 직접 해요${mine ? ` · 꽃방에서 마르는 중 ${mine}장` : ''}${E.slowView(st) ? '' : ` · 지금까지 ${d.n || 0}장`}</p>`;
  }
  if (d.key === 'autodryer') extra = `<p class="muted">${d.x == null ? '정원에 놓으면 일해요' : '제다실에 꽃잎이 들어오면 바로 꽃방에 널어요'} · 장수 제한 없이 · 다 마르면 말린 꽃잎 칸으로 · 티백 · 블렌드는 직접 해요${E.slowView(st) || !d.n ? '' : ` · 지금까지 ${d.n}장`}</p>`;   // P72-02 ⚙️
  if (d.key === 'teastand') {                     // P39-09-02 🫖 찻집 도우미 (예전 P28-10-03 나비 차 우리기): 열려 있으면 카운터를 채움 · 남은 티백
    const cal = E.calendar(st.virtual), open = E.teaShopOpen(cal), bags = st.teas.length;
    extra = `<p class="muted">${d.x == null ? '정원에 놓으면 일해요' : open ? (bags ? `카운터에 갓 우린 잔이 ${E.helperKeep(st)}잔이 되게 채워요 · 남은 티백 ${bags}개` : '우릴 티백이 없어요 · 제다실에서 티백을 만들어요') : '🔒 찻집이 열리면 일해요'} · 가장 오래된 티백부터 · 블렌드 티백 · 🍯 꿀은 직접 해요${E.slowView(st) ? '' : ` · 지금까지 ${d.n || 0}잔`}</p>`;
  }
  if (E.GEAR[d.key]) {                           // P27 장치: 지금 몇 포기가 빨리 자라는지 · 지도에 범위
    const G = E.GEAR[d.key], frozen = E.calendar(st.virtual).frozen;
    const n = st.flowers.filter(f => !f.withered && Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) <= G.r && f.ageH < FLOWERS[f.type].mature * E.MONTH_H
      && (!G.young || f.stage === 'germ' || f.stage === 'sprout' || (f.lifeH != null ? f.lifeH : f.ageH) < E.MONTH_H)).length;   // 이 장치 덕분인 꽃만 (QA 14회차)
    extra = `<p class="muted">${frozen ? '🌙 꽃잠엔 장치도 쉬어요' : n ? `지금 ${n}포기가 빨리 자라는 중이에요` : '지금 둘레에 빨리 자랄 꽃이 없어요'} · 둘레 ${E.GEAR[d.key].r}칸</p>`;
  }
  return extra;
}
// 장식 상태창: 꽃 상태창과 같은 머리(그림 · 이름 · 닫기) + 설명 · 하는 일 · 옮기기 / 창고에 (11-01)
function renderDecoStatus(force) {
  const el = $('#status'), d = selDecoOf(), cal = E.calendar(st.virtual);
  const info = E.decoInfo(E.decoKey(d)), reach = decoReach(d.key), bug = E.INSECTS[d.key] && E.FARM.find(w => w.key === d.key);   // 곤충은 곤충 이름으로 (11-01)
  const sig = JSON.stringify(['deco', d.id, d.x, d.y, E.honeyLeft(st), d.n || 0, cal.abs, cal.frozen, st.petals.length, st.teas.length, st.drying.length, st.flowers.length, reach, E.slowView(st), ui.sheetOpen]);
  if (!force && ui.sigs.status === sig) return;
  ui.sigs.status = sig;
  el.className = 'status' + (ui.sheetOpen ? ' sheet' : '');
  el.innerHTML = `
    <div class="sx-head">
      <div class="sx-art">${decoImg(E.decoKey(d), 3)}</div>
      <div class="sx-title"><h3>${bug ? `${bug.icon} ${esc(bug.name)}` : `${info.jar ? '🫙 ' : ''}${esc(info.name)}`}</h3>
        <div class="muted" style="font-size:var(--fs-sm)">가로 ${d.x + 1} · 세로 ${d.y + 1}${reach != null ? ` · 둘레 ${reach}칸` : ''}</div></div>
      <button type="button" class="iconbtn sx-close" data-act="closeSheet" aria-label="상태창 닫기">✕</button>
    </div>
    <div class="sx-deco">${bug ? `<p class="muted">${esc(E.insectLine(st, d.key))}</p>` : info.desc ? `<p class="muted">${esc(info.desc)}</p>` : ''}${decoBuffHTML(E.decoKey(d))}${decoExtra(d)}</div>
    ${reach != null ? '<div class="sx-note">💛 지도의 노란 칸이 둘레예요</div>' : ''}
    <div class="sx-acts"><button type="button" class="btn" data-act="decoStore">📦 창고에</button><button type="button" class="btn" data-act="decoTop">🎀 대표로 달기</button><button type="button" class="btn primary" data-act="decoMove">↔ 옮기기</button></div>`;
}
// P35 · P36 장식 카드 한 줄 (화원 · 창고 · 정원 장식 창이 같이 씀): 놓아야 효과 · 느긋하게 보기면 숫자 없이 (엔진 decoBuffLine)
// P75-01 📍 놓아야 효과 · ✨ 사면 바로 — 효과가 있는 카드에만 작은 표시 하나
const ACTIVE_TAG = { place: '📍 놓아야 효과', buy: '✨ 사면 바로' };
const activeTagHTML = kind => kind ? `<small class="act-tag act-${kind}">${ACTIVE_TAG[kind]}</small>` : '';
function decoBuffHTML(key, cls) { const t = E.decoBuffLine(st, key); return t ? `<small class="${cls || 'dk-buff'}">${esc(t)}</small>` : ''; }
// 지도에 범위를 그리는 장식의 둘레 칸 수 (P27 장치 · P39 곤충 일곱 — 기르면 2 → 4 → 6칸, P61-01), 없으면 null
function decoReach(key) { return E.GEAR[key] ? E.GEAR[key].r : E.DECO_REACH[key] != null ? E.DECO_REACH[key] : E.INSECTS[key] ? E.insectR(st, key) : null; }   // P44 👣 · 💧 · 🏮 둘레
// P39-12-04 꽃 상태창: 이 꽃을 돌보는 곤충 아이콘 줄 — 누르지 않아도 제목(title)에 하는 일
const INSECT_DO = { barrel: '물', autobasket: '거두기', ladybug: '잡초', earthworm: '비료', dryrack: '가지치기', hive: '번식', teahelper: '첫 꽃잎' };
function insectNote(f) {
  const ks = E.insectsOn(st, f); if (!ks.length) return '';
  const ic = k => E.FARM.find(w => w.key === k).icon;
  return ` · <span class="sx-bugs" title="${ks.map(k => `${ic(k)} ${INSECT_DO[k]}`).join(' · ')}">${ks.map(ic).join('')} 곤충이 돌봐요</span>`;
}
function select(id) { ui.selected = id; ui.selTile = null; ui.selDeco = null; ui.sheetOpen = true; renderStatus(true); }
function plantAt(type, x, y) {
  if (E.flowerAt(st, x, y)) return feedback('이 자리엔 꽃이 있어요 · 빈 칸을 골라 주세요', true);
  const best = st.items.filter(i => i.type === type && E.germOf(i) > 0).sort((a, b) => b.q - a.q)[0];
  if (!best) return feedback('창고에 심을 게 없어요', true);
  const r = E.plant(st, best.id, x, y, ctx.rng, ctx);
  if (r.flower) select(r.flower.id);
  if (ui.tool === 'plant' && !Object.keys(plantable()).length) { ui.tool = 'look'; ui.plantType = null; }   // 다 심으면 심기 모드를 끝냄 (10-24)
  after(r, 'planted');
  renderToolbar(true);
}

// ---------------------------------------------------------------- 정원: 꽃 상태창 (P14)
function blockers(f) {
  const tile = { x: f.x, y: f.y }, mine = homeLand(FLOWERS[f.type]);
  return st.flowers.filter(o => o !== f && !o.withered && homeLand(FLOWERS[o.type]) !== mine && Math.hypot(o.x - tile.x, o.y - tile.y) <= E.stageRadius(o) + 0.01);
}
// 기운이 낮은 이유 (목마름 / 땅이 아직 바뀌는 중 / 다른 꽃에 밀림)
function vigorCause(f, match) {   // 10-06: 이유가 여럿이면 함께 (목마름 + 옆 꽃)
  const out = [];
  if (f.thirstH > 0) out.push('물을 주면 기운이 돌아와요');
  const blk = blockers(f);
  if (blk.length) {   // ⑭ 좋아하는 환경이 아주 다른 꽃이 옆이면 이름을 대고 띄워 심기를 권함
    const F = FLOWERS[f.type], far = blk.map(o => FLOWERS[o.type]).map(O => ({ O, d: Math.abs(O.t - F.t) / 12 + Math.abs(O.m - F.m) / 30 })).sort((x, y) => y.d - x.d)[0];
    out.push(far.d >= 1 ? `옆 ${josa(far.O.name, '과/와')} 좋아하는 환경이 너무 달라요 · 한 칸 띄워 심어 보세요` : '다른 꽃의 땅에 밀리고 있어요');
  } else if (!out.length && match < 0.8) out.push(f.adaptH > 0 ? '땅이 아직 바뀌는 중이에요 · 적응하는 동안이라 품질은 그대로예요' : '땅이 아직 바뀌는 중이에요');
  return out.join(' · ');
}
function renderStatus(force) {
  const el = $('#status'), f = st.flowers.find(x => x.id === ui.selected);
  if (!f && selDecoOf()) return renderDecoStatus(force);   // 고른 장식 (11-01)
  if (!f && ui.selTile && !E.flowerAt(st, ui.selTile[0], ui.selTile[1])) return renderTileStatus(force);
  if (!f) {
    // 아무것도 고르지 않았을 때: 오늘의 한 마디만 (게임 하루, 현실 48분마다 바뀌고 옆 도트 꽃도 함께 바뀜)
    const cal0 = E.calendar(st.virtual), mw = monthWord(cal0), qi = (cal0.abs * 15 + cal0.day) % GARDEN_WORDS.length, qf = mw ? mw.k : FLOWER_KEYS[qi % FLOWER_KEYS.length];
    const sig0 = ['none', cal0.month, cal0.day, qi].join('|');
    if (!force && ui.sigs.status === sig0) return;
    ui.sigs.status = sig0;
    el.className = 'status idle';
    el.innerHTML = `
    <div class="sx-head">
      <div class="sx-art" style="background:color-mix(in srgb, ${FLOWERS[qf].petal} 16%, var(--sunk))">${spriteImg(qf, 'flower', 56, false, '')}</div>
      <div class="sx-title"><p class="sx-quote">${mw ? mw.w : GARDEN_WORDS[qi]}</p>${mw ? `<div class="sx-lang">${monthName(cal0.month)}의 꽃 · <b>${FLOWERS[mw.k].name}</b> · ${FLOWER_WORDS[mw.k].own ? '정원의 꽃말' : '꽃말'} 「${FLOWER_WORDS[mw.k].lang}」</div>` : ''}</div>
    </div>`;
    return;
  }
  const cal = E.calendar(st.virtual), F = FLOWERS[f.type];
  const ch = E.monthlyChange(st, f), v = ch.v;
  const next = Math.min(1, Math.max(f.q > 0.3 ? 0.3 : f.q, f.q + (ch.pos - ch.neg) / 100));
  const tl = st.tiles[f.y * W + f.x], land = E.landOf(tl), home = homeLand(F), match = E.landMatch(st, f);
  const rel = land === home ? '같아요' : match > 0.5 ? '가까워요' : '멀어요';
  const blk = blockers(f);
  const can = {}; for (const t of ['water', 'weed', 'prune', 'fert', 'harvest']) can[t] = E.canCare(st, f, t, cal);
  const have = t => t === 'water' ? st.water > 0 : t === 'prune' ? st.shears > 0 : t === 'weed' ? st.hoe > 0 : t === 'harvest' ? st.basket > 0 : t === 'fert' ? st.fert > 0 : true;
  const TOOLNAME = { water: '물병', weed: '호미', prune: '가위', harvest: '바구니', fert: '비료' };
  ui.careNeed = []; ui.careLack = []; ui.careNeedFor = f.id;
  const careTile = (t, ic, label) => {
    let state, sub;
    const hH = { water: f.waterH, weed: f.weedH, prune: f.pruneH, fert: f.fertH }[t];
    if (f.withered) { state = 'na'; sub = '-'; }
    else if (t === 'prune' && !F.prune) { state = 'na'; sub = '안 해도 돼요'; }
    else if (t === 'harvest' && !can.harvest) { const bl = E.bloomLeftH(st, f); state = bl != null ? 'done' : 'na'; sub = bl != null ? `${realH(bl)} 뒤 핌` : f.stage === 'dormant' ? '쉬는 중' : '자란 뒤에'; }   // P72-01 다 자란 뒤 6시간 · 거두면 다시
    else if (t !== 'harvest' && hH > 0) { state = 'done'; sub = flowH(hH) + ' 남음'; }
    else if (!can[t]) { state = 'na'; sub = '자란 뒤에'; }
    else if (!have(t)) { state = 'lack'; sub = josa(TOOLNAME[t], '이/가') + ' 없어요'; }
    else { state = 'need'; sub = { water: '목말라요', weed: '잡초 났어요', prune: '칠 수 있어요', fert: '줄 수 있어요', harvest: '피었어요' }[t]; }
    const act = state === 'need';
    if (act) ui.careNeed.push(t);   // 꽃 둘레 단추로 (10-06)
    if (state === 'lack') ui.careLack.push(t);   // ⑯ 도구가 없으면 흐린 단추 (누르면 사기 창)
    return `<button type="button" class="ct ${state}" style="--k:${CARE_COLOR[t]}" ${act ? `data-care="${t}"` : 'disabled'} title="${label} · ${sub}"><span class="ci">${ic}${state === 'done' ? '<i>✓</i>' : ''}</span><span class="cl">${label}</span><span class="cs">${sub}</span></button>`;
  };
  ['water', 'weed', 'prune', 'fert', 'harvest'].forEach(t => careTile(t, '', ''));   // 지금 할 수 있는 돌보기 → 꽃 둘레 단추 (10-06)
  const canMove = E.canMoveNow(f, cal);   // 꽃잠엔 모든 꽃 (P04-01-09)
  // 옮겨 심기와 번식: 할 수 있으면 버튼, 아니면 이유
  const propReason = (() => {
    if (f.withered) return '시든 꽃이에요';
    if (F.prop === '채종') return '시들 때 자동으로 거둬요';
    if (f.propYear === E.propYearOf(st, cal)) return cal.frozen ? '새해 몫을 이미 했어요' : f.propRest ? '꽃잠에 새해 몫을 했어요' : '올해 이미 했어요';   // 꽃잠 번식은 새해 몫
    if (!E.propGrown(f)) return '다 자라면 돼요';   // 휴면 달의 어린 꽃은 나이로 (QA 19회차)
    if (!cal.frozen && !F.propMonths.includes(cal.month)) return `${monthsText(F.propMonths)}에 할 수 있어요`;
    return '';
  })();
  const moveReason = canMove ? '' : f.withered ? '시든 꽃이에요' : '심는 달 · 휴면기 · 꽃잠에 할 수 있어요';
  const actBtn = (act, label, reason) => `<div class="sx-act"><button type="button" class="btn ${reason ? '' : 'primary'}" data-act="${act}" ${reason ? 'disabled' : ''}>${label}</button>${reason ? `<span class="muted">${reason}</span>` : ''}</div>`;
  const mut = E.mutShown(f) ? E.mutStage(f) : 0, M = mut && E.MUTANTS[f.type];   // P36-02 🧬 변이 꽃: 꽃잎은 못 따고 유리 관에 담아 장식으로 (호미 · 뽑기 없음)
  const actions = `<div class="sx-acts">${actBtn('move', ui.tool === 'move' && ui.moveFrom === f.id ? '↔ 옮길 빈 칸을 누르세요' : '↔ 옮겨심기', moveReason)}${actBtn('prop', `🌾 ${F.prop}${propReason ? '' : ` · ${E.propCount(f.q)}개`}`, propReason)}${mut ? actBtn('jar', '🫙 유리 관에 담기', st.jar > 0 ? '' : '유리 관이 없어요 · ⛏️ 광산에서 만들어요') : ''}${!f.withered ? actBtn('pres', '🌹 프리저브드', E.presReason(st, f)) : ''}</div>`;   // P53 단추는 늘 두고, 조건이 안 되면 까닭(다 핀 꽃 · 100% · 용액)을 보임
  const sig = JSON.stringify([can, have('water'), have('weed'), have('prune'), have('fert'), have('harvest'), st.fert, st.water, st.shears, st.hoe, st.basket, ui.tool, ui.moveFrom, propReason, moveReason, f.id, f.stage, E.pct(f.q), Math.round(v), E.pct(next), Math.round(f.waterH * 2), Math.round(f.weedH * 2), Math.round(f.pruneH * 2), Math.round(f.fertH * 2), Math.round(f.adaptH * 2), Math.round((f.ripeH || 0) * 4), f.propYear, cal.idx, mut, st.jar, st.presol, ui.detailsOpen, ui.sheetOpen, land, blk.length, Math.round(tl.t), Math.round(tl.m)]);
  if (!force && ui.sigs.status === sig) return;
  ui.sigs.status = sig;
  el.className = 'status' + (ui.sheetOpen ? ' sheet' : ' idle-mobile');
  const vCol = v >= 80 ? 'var(--good)' : v >= 50 ? '#c2a33a' : 'var(--warn)';
  const note = [f.adaptH > 0 ? `새 자리에 적응하는 중 (${flowH(f.adaptH)} 남음)` : '', v < 80 ? vigorCause(f, match) : ''].filter(Boolean).join(' · ');
  // 자라는 단계 길: 발아 → 새싹 → 자라는 중 → 다 자람 → 개화 (휴면·시듦은 따로 표시)
  const PATH = ['germ', 'sprout', 'young', 'mature', 'bloom'], si = PATH.indexOf(f.stage);
  const stagePath = `<div class="stagepath">${PATH.map((s, i) => `<span class="${si >= 0 && i < si ? 'past' : i === si ? 'cur' : ''}">${E.STAGE[s]}</span>`).join('')}${si < 0 ? `<span class="cur odd">${f.stage === 'dormant' ? '💤 ' : ''}${E.STAGE[f.stage]}</span>` : ''}</div>`;
  const nextArrow = next > f.q + 0.004 ? '↑' : next < f.q - 0.004 ? '↓' : '→';
  const bl = E.bloomLeftH(st, f), bloomLine = bl != null ? `<div class="muted sx-bloom" style="font-size:var(--fs-sm)">🌸 ${realH(bl / (st.speed || 1))} 뒤 핌${cal.frozen ? ' · 🌙 꽃잠엔 쉬어요' : ''}</div>` : f.stage === 'bloom' && !mut ? `<div class="muted sx-bloom" style="font-size:var(--fs-sm)">🧺 거두면 ${realH(E.RIPE_H / (st.speed || 1))} 뒤 다시 펴요</div>` : '';   // P72-01
  el.innerHTML = `
    <div class="sx-head">
      <div class="sx-art" style="background:color-mix(in srgb, ${mut ? mutPetal(f.type, mut).petal : F.petal} 16%, var(--sunk))">${spriteImg(f.type, mut ? 'mut' + mut : 'flower', 56, false, M ? M.name : F.name)}</div>
      <div class="sx-title"><h3>${M ? `🧬 ${esc(M.name)}` : F.name}</h3>${M ? `<div class="sx-mut"><b>변이 · ${mut}단계</b> · ${F.name}<br><i>${esc(M.lore)}</i></div>` : ''}<div><span class="stars">${starStr(f.q)}</span> <span class="muted" style="font-size:var(--fs-sm)">${qualityWord(f.q, f.stage === 'bloom')}</span></div>
        <div class="muted" style="font-size:var(--fs-sm)">${LIFE[F.life]} · ${FORM[F.form].name} · ${f.origin === '이웃' ? '이웃이 준 화분' : `심은 지 ${ageText(f.lifeH != null ? f.lifeH : f.ageH)}`}${insectNote(f)}${E.growRate(st, f) > 1 && f.stage !== 'bloom' && f.ageH < F.mature * E.MONTH_H && !E.calendar(st.virtual).frozen ? ` · 🔆 ${f.stage === 'dormant' ? `쉬는 동안에도 ${E.growRate(st, f)}배로 자라요` : `${E.growRate(st, f)}배로 자라는 중`}` : E.bloomLeads(st, f) && f.stage !== 'bloom' && !E.calendar(st.virtual).frozen ? ` · 🌱 ${E.bonusVal(st, 'grow')}배 빨리 피는 중` : ''}</div></div>
      <button type="button" class="iconbtn sx-close" data-act="closeSheet" aria-label="상태창 닫기">✕</button>
    </div>
    ${stagePath}${bloomLine}
    <div class="sx-stats">
      <div title="${qualityWord(f.q, f.stage === 'bloom')}"><span class="lbl">품질</span><b>${E.pct(f.q)}%</b><span class="mini"><i style="width:${E.pct(f.q)}%;background:#d39b12"></i></span><span class="sub${cal.frozen ? ' wrap' : ''}">${realH((cal.frozen ? E.flowLeftH(st.virtual, E.MONTH_H) : (cal.slotEnd - st.virtual) / HOUR) / (st.speed || 1))} 뒤 ${nextArrow} ${E.pct(next)}%</span></div>
      <div title="${vigorWord(v, f.thirstH > 0, f.waterH > 18)}"><span class="lbl">기운</span><b style="color:${vCol}">${Math.round(v)}%</b><span class="mini"><i style="width:${Math.round(v)}%;background:${vCol}"></i></span><span class="sub">${vigorWord(v, f.thirstH > 0, f.waterH > 18)}</span></div>
      <div title="꽃이 바꾸는 땅의 범위"><span class="lbl">땅</span><b>${E.qualityRadius(f)}칸</b><span class="mini land"><i style="background:${LANDS[land].color}"></i></span><span class="sub">${LANDS[land].name}</span></div>
    </div>
    ${note ? `<div class="sx-note">💬 ${note}</div>` : ''}
    <!-- 돌보기 다섯 칸은 꽃 둘레 단추로 옮김 (10-06) -->
    ${actions}
    <details ${ui.detailsOpen ? 'open' : ''} data-act="details"><summary>자세히 보기 · 땅 · 일정 · 출신</summary>
      <h3 style="margin:var(--sp-5) 0 var(--sp-2);font-size:var(--fs-base)">땅</h3>
      <dl class="kv">
        <dt>지금 땅</dt><dd>${landSw(land)} ${LANDS[land].name}</dd>
        <dt>원하는 땅</dt><dd>${LANDS[home].name} · ${rel}</dd>
      </dl>
      <div class="gauges" title="색칸은 이 꽃이 좋아하는 범위(±3) · ▲는 지금 이 칸">${envGauges(F, tl)}</div>
      <dl class="kv">
        <dt>바꾸는 범위</dt><dd>${Math.max(0, E.stageRadius(f))}칸 (다 자라면 ${E.qualityRadius(f)}칸)</dd>
        ${blk.length ? `<dt>밀리는 중</dt><dd>옆의 ${josa(FLOWERS[blk[0].type].name, '이/가')} 만든 땅에 밀리고 있어요</dd>` : ''}
      </dl>
      <h3 style="margin:var(--sp-5) 0 var(--sp-2);font-size:var(--fs-base)">일정</h3>
      ${flowerStrip(F, cal.idx)}
      <dl class="kv">
        ${mut ? '<dt>수확</dt><dd>🧬 변이 꽃은 꽃잎을 딸 수 없어요 · 품질이 낮을수록 낯설어져요</dd>' : f.stage === 'bloom' ? `<dt>수확</dt><dd>지금 수확할 수 있어요 · 꽃잎 1~${F.petals}장 · 거두면 ${realH(E.RIPE_H)} 뒤 다시 펴요</dd>` : E.bloomLeftH(st, f) != null ? `<dt>수확</dt><dd>${realH(E.bloomLeftH(st, f))} 뒤 펴요</dd>` : ''}
        <dt>번식</dt><dd>${F.prop === '채종' ? '채종 · 시들 때 자동' : F.prop}</dd>
        <dt>옮겨심기</dt><dd>${canMove ? '지금 할 수 있어요' : '심는 달 · 휴면기 · 꽃잠에'}</dd>
      </dl>
      <h3 style="margin:var(--sp-5) 0 var(--sp-2);font-size:var(--fs-base)">출신</h3>
      <dl class="kv">
        <dt>어디서</dt><dd>${esc(f.origin)}${f.parent ? ` (${esc(f.parent)}에서)` : ''}</dd>
        <dt>심을 때 품질</dt><dd>${qLabel(f.startQ)}</dd>
      </dl>
      <div class="row" style="margin-top:var(--sp-4)"><button type="button" class="btn small" data-act="dex" data-key="${f.type}">📖 도감</button></div>
    </details>`;
}
// 빈 칸 상태창: 땅 정보와 이 칸에 심기
function renderTileStatus(force) {
  const el = $('#status'), [x, y] = ui.selTile, tl = st.tiles[y * W + x], land = E.landOf(tl), cal = E.calendar(st.virtual);
  const pl = plantable(), keys = Object.keys(pl);
  const dps = E.decoPlaceable(st, x, y);   // P78-02 (11-05) 이 칸에 바로 놓을 장식 — 창고에 있는 종류마다 하나
  const sig = JSON.stringify(['tile', x, y, land, Math.round(tl.t), Math.round(tl.m), pl, cal.frozen, ui.sheetOpen, dps.map(d => [d.key, d.n])]);
  if (!force && ui.sigs.status === sig) return;
  ui.sigs.status = sig;
  const best = k => Math.max(...st.items.filter(i => i.type === k && E.germOf(i) > 0).map(i => i.q));
  // 꽃 상태창과 같은 카드형: 땅 그림 · 세 칸 수치 · 심을 꽃 카드
  const list = keys.slice().sort((a, b) => (homeLand(FLOWERS[b]) === land) - (homeLand(FLOWERS[a]) === land)).map(k => {   // 이 땅과 맞는 꽃이 먼저
    const F = FLOWERS[k], fits = homeLand(F) === land, L = LANDS[homeLand(F)];
    return `<button type="button" class="pcard ${fits ? 'fits' : ''}" data-plantat="${k}" style="--pc:${F.petal}" title="누르면 이 칸에 심어요">
      <span class="pc-art">${spriteImg(k, 'flower', 40, false, F.name)}<span class="pc-count">×${pl[k]}</span></span>
      <span class="pc-name"><b>${F.name}</b> <span class="muted">${FORM[F.form].name}</span></span>
      <span class="stars">${starStr(best(k))}</span>
      <span class="pc-land"><span class="sw" style="background:${L.color}"></span>${josa(L.name, '을/를')} 만들어요</span>
      ${fits ? '<span class="pc-fit">이 땅과 잘 맞아요</span>' : ''}<span class="pc-go">🌰 심기</span></button>`;
  }).join('');
  const cnt = E.landCounts(st)[land] || 0;
  // 이 땅이 고향인 꽃 (도감에서 만난 꽃만 이름을 보여 줌)
  const homes = FLOWER_KEYS.filter(k => homeLand(FLOWERS[k]) === land), known = homes.filter(k => st.dex.flower[k]).map(k => FLOWERS[k].name);
  const say = land === 'barren' ? '아직 아무 꽃의 땅도 아니에요 · 꽃을 심으면 그 꽃이 좋아하는 땅으로 천천히 바뀌어요'
    : known.length ? `${known.join(', ')}${josa(known[known.length - 1], '이/가').slice(-1)} 좋아하는 땅이에요` : homes.length ? '어떤 꽃이 좋아하는 땅일까요?' : '꽃과 꽃 사이에서 생긴 땅이에요';
  const tPct = Math.max(0, Math.min(100, tl.t / 35 * 100)), mPct = Math.max(0, Math.min(100, tl.m));
  el.className = 'status' + (ui.sheetOpen ? ' sheet' : '');
  el.innerHTML = `
    <div class="sx-head">
      <div class="sx-art" style="background:color-mix(in srgb, ${LANDS[land].color} 22%, var(--sunk))"><span class="sx-land" style="background-color:${LANDS[land].color}"></span></div>
      <div class="sx-title"><h3>빈 칸</h3><div><span class="chip" style="font-size:calc(11.5 * var(--u))">${landSw(land, 'width:9px;height:9px;margin-right:4px')}${LANDS[land].name}</span></div>
        <div class="muted" style="font-size:var(--fs-sm)">가로 ${x + 1} · 세로 ${y + 1}</div></div>
      <button type="button" class="iconbtn sx-close" data-act="closeSheet" aria-label="상태창 닫기">✕</button>
    </div>
    <div class="sx-stats">
      <div><span class="lbl">기온</span><b>${tl.t.toFixed(1)}°</b><span class="mini"><i style="width:${tPct}%;background:${tl.t < 12 ? '#86abc3' : tl.t < 23 ? '#64a653' : '#cc8636'}"></i></span><span class="sub">${tl.t < 12 ? '서늘해요' : tl.t < 23 ? '온화해요' : '따뜻해요'}</span></div>
      <div><span class="lbl">습도</span><b>${Math.round(tl.m)}%</b><span class="mini"><i style="width:${mPct}%;background:#3d8fd6"></i></span><span class="sub">${tl.m < 30 ? '메말라요' : tl.m < 60 ? '보통이에요' : tl.m < 80 ? '촉촉해요' : '물이 많아요'}</span></div>
      <div><span class="lbl">이 땅</span><b>${cnt}<small> 칸</small></b><span class="mini land"><i style="background:${LANDS[land].color}"></i></span><span class="sub">정원 전체에서</span></div>
    </div>
    <div class="sx-note">💬 ${say}</div>
    <div class="sx-sec">🌰 이 칸에 심기${keys.length && !cal.frozen ? ` <span class="muted" style="font-family:var(--font-body);font-weight:400;font-size:var(--fs-sm)">${keys.length}가지 · 누르면 바로 심어요</span>` : ''}</div>
    ${cal.frozen ? '<p class="note">꽃잠엔 심기가 쉬어요 · 화원에서 다음 해 꽃을 예약해 두세요</p><div><button type="button" class="btn small" data-go="shop">💐 예약</button></div>'
      : keys.length ? `<div class="pgrid">${list}</div>`
      : '<p class="note">창고에 지금 심을 게 없어요 · 화원에서 제철 꽃을 사 보세요</p><div><button type="button" class="btn small primary" data-go="shop">💐 화원</button></div>'}
    ${dps.length ? `<div class="sx-sec">🪴 이 칸에 놓기 <span class="muted" style="font-family:var(--font-body);font-weight:400;font-size:var(--fs-sm)">${dps.length}가지 · 누르면 바로 놓아요</span></div>
    <div class="dplace">${dps.map(d => { const max = E.decoMax(d.key); return `<button type="button" class="dpcard" data-decoat="${d.id}" title="누르면 이 칸에 놓아요"><span class="dk-art">${decoImg(d.key, 2)}</span><span class="dp-main"><b>${esc(E.decoInfo(d.key).name)}</b><small>창고에 ${d.n}개${max ? ` · 최대 ${max}` : ''}</small></span></button>`; }).join('')}</div>` : ''}`;
}
function careOn(f, t) { tapPot(f); return after(E.care(st, t, [[f.x, f.y]], ctx), t === 'water' ? 'watered' : t === 'harvest' ? 'harvested' : null, t === 'harvest' ? { label: '🌿 제다실', fn: () => setTab('tearoom') } : null); }
// 꽃 둘레 돌보기 단추 (10-06): 고른 꽃에 지금 할 수 있는 돌보기만 꽃 위에 부채꼴로. (상태창의 다섯 칸은 뺌)
const RING_TOOL = { water: 'water', weed: 'hoe', prune: 'shears', fert: 'fert', harvest: 'basket' };
const RING_IC = { water: '💧', weed: '🌿', prune: '✂️', fert: '🌱', harvest: '🧺' }, RING_NM = { water: '물', weed: '잡초', prune: '가지치기', fert: '비료', harvest: '수확' };
var ringEl = document.getElementById('careRing');   // var: draw()가 먼저 불려도 안전하게
function updateRing() {
  if (!ringEl) return;
  const f = ui.tab === 'garden' && ui.tool === 'look' && st.flowers.find(x => x.id === ui.selected);
  const mine = f && ui.careNeedFor === f.id, need = mine ? (ui.careNeed || []) : [], lack = mine ? (ui.careLack || []) : [];
  const cares = ['water', 'weed', 'prune', 'fert', 'harvest'].filter(t => need.includes(t) || lack.includes(t));
  if (!cares.length) { if (!ringEl.hidden) { ringEl.hidden = true; ringEl.innerHTML = ''; ui.ringSig = ''; } return; }
  const cx = canvas.offsetLeft + (f.x + 0.5) * cell, cy = canvas.offsetTop + (f.y + 0.5) * cell;
  const big = E.bigView(st), R = big ? Math.max(58, cell * 1.8) : Math.max(46, cell * 1.6), step = big ? 60 : 52, n = cares.length;   // 단추끼리 겹치지 않게 (활꼴 간격 ≥ 40px) · P28-01 큰 글씨면 48px 단추라 더 넓게
  // 꽃 자리에 따라 (10-06): 지도 가운데 쪽으로 펼침 (오른쪽 끝 꽃 → 왼쪽, 위쪽 꽃 → 아래). 가운데 가까운 꽃은 위로. 안 들어가면 옆 방향을 차례로
  const fw = ringEl.clientWidth, fh = ringEl.clientHeight, M = big ? 26 : 20;
  const pos = base => cares.map((t, i) => { const ang = (base + (i - (n - 1) / 2) * step) * Math.PI / 180; return [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R]; });
  const fits = ps => ps.every(([x, y]) => x >= M && x <= fw - M && y >= M && y <= fh - M);
  const dx = fw / 2 - cx, dy = fh / 2 - cy, toC = Math.round(Math.atan2(dy, dx) * 180 / Math.PI / 45) * 45;   // 가운데 쪽 (45° 단위)
  const first = Math.hypot(dx, dy) < Math.min(fw, fh) * 0.18 ? -90 : toC;
  const bases = [first, first - 45, first + 45, first - 90, first + 90, -90, 90, 0, 180];
  let base = bases.find(b => fits(pos(b)));
  let pts;
  if (base != null) pts = pos(base);
  else {   // 지도 모서리 · 가장자리라 부채꼴이 안 들어가면: 지도 안쪽으로 한 줄 (좌우 끝이면 세로 줄, 위아래 끝이면 가로 줄)
    const gap = big ? 54 : 42, nearSide = Math.min(cx, fw - cx) < Math.min(cy, fh - cy);
    base = nearSide ? 'col' : 'row';
    const clampLine = (c0, lim) => Math.min(lim - M - (n - 1) * gap / 2, Math.max(M + (n - 1) * gap / 2, c0));
    if (nearSide) { const x = cx < fw / 2 ? cx + R : cx - R, y0 = clampLine(cy, fh); pts = cares.map((t, i) => [x, y0 + (i - (n - 1) / 2) * gap]); }
    else { const y = cy < fh / 2 ? cy + R : cy - R, x0 = clampLine(cx, fw); pts = cares.map((t, i) => [x0 + (i - (n - 1) / 2) * gap, y]); }
  }
  const sig = [f.id, cares.join(','), lack.join(','), Math.round(cx), Math.round(cy), Math.round(R), base, fw, fh].join('|');
  if (sig === ui.ringSig) return;
  ui.ringSig = sig; ringEl.hidden = false;
  ringEl.innerHTML = cares.map((t, i) => {
    const lk = lack.includes(t);
    return `<button type="button" class="ring-btn ${lk ? 'lack' : ''}" data-ring="${t}" ${lk ? `data-ringbuy="${RING_TOOL[t]}"` : ''} style="--k:${CARE_COLOR[t]};left:${pts[i][0].toFixed(1)}px;top:${pts[i][1].toFixed(1)}px;--d:${i * 40}ms" title="${lk ? `${RING_NM[t]} · ${josa(E.SUPPLIES[RING_TOOL[t]].name, '이/가')} 없어요 · 눌러서 사요` : RING_NM[t]}" aria-label="${RING_NM[t]}${lk ? ' (도구 없어요)' : ''}"><span>${RING_IC[t]}</span>${lk ? '<i class="ring-lack">+</i>' : ''}</button>`;
  }).join('');
}
ringEl.addEventListener('click', e => {
  const b = e.target.closest('[data-ring]'); if (!b) return;
  e.stopPropagation();
  if (b.dataset.ringbuy) return openSupply(b.dataset.ringbuy);
  const f = st.flowers.find(x => x.id === ui.selected); if (f) careOn(f, b.dataset.ring);
});
$('#status').addEventListener('click', e => {
  const b = e.target.closest('[data-act], [data-plantat], [data-decoat], [data-care]'); if (!b || b.disabled) return;
  const f = st.flowers.find(x => x.id === ui.selected);
  if (b.dataset.care && f) return careOn(f, b.dataset.care);
  if (b.dataset.plantat && ui.selTile) return plantAt(b.dataset.plantat, ui.selTile[0], ui.selTile[1]);
  if (b.dataset.decoat && ui.selTile) { const r = E.placeDeco(st, +b.dataset.decoat, ui.selTile[0], ui.selTile[1]); if (r.ok) { ui.selTile = null; ui.sheetOpen = false; } return after(r); }   // P78-02
  const sd = selDecoOf();                         // 장식 상태창 단추 (11-01)
  if (sd && b.dataset.act === 'decoStore') { ui.selDeco = null; return after(E.storeDeco(st, sd.id)); }
  if (sd && b.dataset.act === 'decoTop') { ui.selDeco = null; ui.sheetOpen = false; return after(E.setTopDeco(st, sd.id)); }   // P52 ⬆️ 정원에서 빠져 위 칸으로
  if (sd && b.dataset.act === 'decoMove') { ui.selDeco = null; ui.tool = 'deco'; ui.decoId = sd.id; renderToolbar(true); return renderStatus(true); }
  if (b.dataset.act === 'closeSheet') { ui.sheetOpen = false; ui.selected = null; ui.selTile = null; ui.selDeco = null; if (ui.tool === 'move') { ui.tool = 'look'; ui.moveFrom = null; renderToolbar(true); } renderStatus(true); }
  if (b.dataset.act === 'dex') openDexDetail('flower', b.dataset.key);
  if (b.dataset.act === 'move' && f) {
    if (ui.tool === 'move' && ui.moveFrom === f.id) { ui.tool = 'look'; ui.moveFrom = null; }
    else { ui.tool = 'move'; ui.moveFrom = f.id; }
    renderToolbar(true); renderStatus(true);
  }
  if (b.dataset.act === 'prop' && f) after(E.propagate(st, f.id, ctx.rng, ctx));
  if (b.dataset.act === 'pres' && f) { const nm = E.presName(f.type, E.mutShown(f)); return askPreserve(f, nm); }   // P53 🌹
  if (b.dataset.act === 'jar' && f) { const r = E.jarCapture(st, f.id, ctx); if (r.ok) { ui.selected = null; ui.sheetOpen = false; } after(r, null, r.ok ? { label: '📦 창고', fn: () => setTab('store') } : null); }   // P36-04 🫙
});
$('#status').addEventListener('toggle', e => { if (e.target.matches('details')) ui.detailsOpen = e.target.open; }, true);
// P53 🌹 프리저브드 확인 창: 꽃을 꺾으면 되돌릴 수 없어서 한 번 더 물어봄 (값 · 용액 · 하루)
function askPreserve(f, nm) {
  const mut = E.mutShown(f), v = E.presValue(st, f.type, mut);
  openModal('🌹 프리저브드로 만들까요?', `<div class="buy-ask"><span class="ba-art">${presImg(f.type, mut, 3)}</span><p><b>${esc(nm)}</b><br><small class="muted">꽃을 꺾어 꽃방 유리 돔에 넣어요 · 정원의 이 자리는 빈 칸이 돼요</small></p>
    <div class="rc-pay"><div><span class="muted">🧪 특수 용액</span><span class="data">${st.presol}병 → ${st.presol - 1}병</span></div><div><span class="muted">완성</span><span class="data">${E.timeText(E.PRES_H / E.titlePerk(st, 'presSpeed'))} 뒤</span></div><div><span class="muted">💐 화원 값</span><b class="data">${won(v)}</b></div></div></div>`, [
    { label: '취소', act: () => closeModal() },
    { label: '🌹 만들기', primary: true, act: () => { closeModal(); const r = E.preserve(st, f.id, ctx); if (r.ok) { ui.selected = null; ui.sheetOpen = false; } after(r, null, r.ok ? { label: '🌾 꽃방', fn: () => setTab('tearoom') } : null); } },
  ]);
}

// ---------------------------------------------------------------- P55 ↗ 인스타 스토리 공유 (11-02 사용자 확정 · 시안 A)
// 9:16 그림 한 장(1080×1920): 지금 정원 지도를 칸 32px(16px 도트의 2배)로 다시 그려 크게, 위에 제목, 아래에 해 · 달 · 포기 수 · 정원 등급 · 대표 칭호 라벨-값 칸 · 주소 · 오른쪽 아래 QR (P55-05).
// 그림은 이 기기 안에서만 만들고 아무 데도 보내지 않음(개인정보처리방침) — 공유는 기기의 공유 시트, 저장은 내려받기. 보상 없음 · 저장 형식 그대로
const SHARE_W = 1080, SHARE_H = 1920, SHARE_CELL = 32, SHARE_M = 60;   // 가장자리 여백 60 · 지도 960×640이 가로를 거의 채움
const SHARE_INK = '#1f2a22', SHARE_SUB = '#5a675c', SHARE_ACCENT = '#5b8a6e', SHARE_PAPER = '#f8f9f4';   // 앱 팔레트(--ink · --muted · --accent · --panel0)만
// P55-05 QR (11-02): 배포 주소(SHARE_URL의 https 주소 · 끝 /) · 버전 3 · 오류 정정 M · 29×29. 주소가 고정이라 미리 만든 모듈 행렬만 넣음 (외부 서버 · 라이브러리 없음)
// 한 줄 = 29칸 비트를 36진수로. 다시 만들 때는 QR 인코더로 같은 주소를 만들어 행렬만 바꾸고, 그린 그림을 디코드해 주소가 나오는지 볼 것
const SHARE_QR = ['8tfjwf', '4jd6pt', '6gifkt', '6gn61p', '6help9', '4in875', '8tz2pr', '26tc', '5weolu', '1j4vvt', '54cdx3', '23m57m', '6w66p7', '1kw3ft', '7qdmkb',
  '6obhy2', '3epsuj', '1fstwt', '54hltv', '2j3uyy', '5xx1ps', 'o8wn', '8teau3', '4iwjkp', '6h94vn', '6ggg53', '6h0dvd', '4ij0j6', '8u944z'];
const SHARE_QR_N = 29, SHARE_QR_PX = 6;           // 모듈 6px 정수 · QR 174px + 조용한 영역 4모듈(24px) 둘레 비움
function shareMapCanvas(px) {                     // 지도만 따로: draw(true)를 잠깐 다른 캔버스 · 정수 칸으로 (고른 칸 · 둘레 표시 없이)
  const c = document.createElement('canvas'); c.width = W * px; c.height = H * px;
  const keep = [g, cell, dpr, hover]; g = c.getContext('2d'); cell = px; dpr = 1; hover = null;
  try { draw(true); } finally { [g, cell, dpr, hover] = keep; }
  return c;
}
function shareFonts() {                           // 앱 글꼴이 아직 안 왔으면 잠깐 기다림 (못 오면 그냥 기본 글꼴로)
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const want = ['400 120px Jua', '700 52px "Gowun Batang"', '600 48px "IBM Plex Sans KR"', '500 30px "IBM Plex Mono"'].map(f => document.fonts.load(f, '도리의 정원 0123').catch(() => null));
  return Promise.race([Promise.all(want), new Promise(r => setTimeout(r, 1500))]);
}
function shareText(x, text, px, y, font, color, maxW, align) {   // 왼쪽(기본) · 오른쪽 맞춤 · 넓으면 글자를 줄임
  let size = +font.match(/(\d+)px/)[1];
  x.font = font; while (x.measureText(text).width > maxW && size > 16) { size -= 2; x.font = font.replace(/\d+px/, size + 'px'); }
  x.fillStyle = color; x.textAlign = align || 'left'; x.textBaseline = 'alphabetic'; x.fillText(text, px, y);
}
function shareQr(x, left, top) {                  // 모듈마다 정수 px 네모 (QR 둘레 24px는 비워 둠 — 그리는 쪽이 지킴)
  x.fillStyle = SHARE_INK;
  SHARE_QR.forEach((r, j) => {
    const bits = parseInt(r, 36).toString(2).padStart(SHARE_QR_N, '0');
    for (let i = 0; i < SHARE_QR_N; i++) if (bits[i] === '1') x.fillRect(left + i * SHARE_QR_PX, top + j * SHARE_QR_PX, SHARE_QR_PX, SHARE_QR_PX);
  });
}
function shareStoryCanvas() {
  const c = document.createElement('canvas'); c.width = SHARE_W; c.height = SHARE_H;
  const x = c.getContext('2d'), info = E.shareCard(st), map = shareMapCanvas(SHARE_CELL);
  // P55-05 (11-02 사용자 "디자인 세련되게 · 오른쪽 하단에 QR"): 잡지 표지처럼 — 왼쪽 정렬 · 작은 영문 라벨 + 굵은 한글 제목 + 얇은 선 · 지도가 주인공 · 정보는 라벨-값 칸
  const M = SHARE_M, R = SHARE_W - M, LABEL = '500 24px "IBM Plex Mono", monospace', rule = (y, w) => { x.fillStyle = SHARE_INK; x.fillRect(M, y, w || R - M, 2); };
  x.imageSmoothingEnabled = false;
  x.fillStyle = SHARE_PAPER; x.fillRect(0, 0, SHARE_W, SHARE_H);
  const no = (info.file.match(/-(\d+)-(\d+)\.png$/) || []).slice(1).map(v => String(v).padStart(2, '0')).join('.');
  shareText(x, "DORI'S GARDEN", M, 112, LABEL, SHARE_ACCENT, 520);                                        // 머리 줄: 라벨 · 호수(해.달)
  if (no) shareText(x, `NO. ${no}`, R, 112, LABEL, SHARE_SUB, 400, 'right');
  rule(136);
  shareText(x, info.title, M - 4, 318, '400 168px Jua, "Gowun Batang", serif', SHARE_INK, R - M);
  const mw = map.width, mh = map.height, mx = M, my = 404;                                                  // 지도 960×640 · 1:1 (칸 32px = 16px 도트의 2배)
  x.fillStyle = SHARE_INK; x.fillRect(mx - 12, my - 12, mw + 24, 2); x.fillRect(mx - 12, my + mh + 10, mw + 24, 2); x.fillRect(mx - 12, my - 12, 2, mh + 24); x.fillRect(mx + mw + 10, my - 12, 2, mh + 24);   // 얇은 선 테
  x.drawImage(map, mx, my);
  shareText(x, 'FIG. 01 — THE GARDEN, NOW', M, my + mh + 58, '400 22px "IBM Plex Mono", monospace', SHARE_SUB, 600);
  shareText(x, `${E.W} × ${E.H}`, R, my + mh + 58, '400 22px "IBM Plex Mono", monospace', SHARE_SUB, 300, 'right');
  const top = my + mh + 96, bottom = SHARE_H - M - SHARE_QR_N * SHARE_QR_PX - 24 - 40;                     // 정보 칸: 지도 아래 ~ QR 조용한 영역 위 (선 포함)
  rule(top);
  // 라벨-값 칸 (두 열). 🐢 느긋하게 보기면 꽃 칸이 빠지고, 칭호가 없으면 칭호 줄이 빠짐 → 남은 칸을 두 선 사이 가운데로
  const pairs = [['SEASON', `${info.year} ${info.month}`], info.count ? ['FLOWERS', info.count] : null, ['GRADE', info.grade]].filter(Boolean);
  const ROW = 132, rows = Math.ceil(pairs.length / 2), TS = TITLE_ART.SIZE * 4, TROW = info.titleName ? 40 + TS : 0;
  const h = rows * ROW + (TROW ? TROW + 36 : 0), col = (SHARE_W - 2 * M) / 2;
  let y = top + Math.max(36, Math.round((bottom - top - h) / 2));
  for (let r = 0; r < rows; r++) {
    pairs.slice(r * 2, r * 2 + 2).forEach(([k, v], i) => {
      const px = M + i * col;
      shareText(x, k, px, y + 26, LABEL, SHARE_ACCENT, col - 40);
      shareText(x, v, px, y + 92, '600 54px "IBM Plex Sans KR", sans-serif', SHARE_INK, col - 40);
    });
    y += ROW;
  }
  if (info.titleName) {
    x.fillStyle = SHARE_SUB; x.fillRect(M, y - 10, R - M, 1);                                              // 가는 칸막이
    shareText(x, 'TITLE', M, y + 34, LABEL, SHARE_ACCENT, 300);
    const T = E.TITLES[st.titleOn], tc = document.createElement('canvas'); tc.width = tc.height = TITLE_ART.SIZE;
    TITLE_ART.draw(tc.getContext('2d'), st.titleOn, T.tier, { frame: 0 });
    x.drawImage(tc, M, y + 56, TS, TS);                                                                     // 칭호 문장 22px × 4
    shareText(x, info.titleName, M + TS + 28, y + 56 + TS / 2 + 18, '700 52px "Gowun Batang", serif', SHARE_INK, R - M - TS - 28);
  }
  rule(bottom);
  // 바닥: 왼쪽 안내 · 오른쪽 아래 QR (모듈 6px · 둘레 24px 비움)
  const qs = SHARE_QR_N * SHARE_QR_PX, qx = R - qs, qy = SHARE_H - M - qs;
  shareText(x, 'VISIT', M, qy + 30, LABEL, SHARE_ACCENT, 300);
  shareText(x, '정원 놀러 오기 →', M, qy + 104, '700 52px "Gowun Batang", serif', SHARE_INK, qx - 24 - 40 - M);
  shareText(x, info.url, M, qy + qs - 4, '500 26px "IBM Plex Mono", monospace', SHARE_SUB, qx - 24 - 40 - M);
  shareQr(x, qx, qy);
  return c;
}
async function openShareStory() {
  await shareFonts();
  const c = shareStoryCanvas(), info = E.shareCard(st), url = c.toDataURL('image/png');
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = blob && typeof File === 'function' ? new File([blob], info.file, { type: 'image/png' }) : null;
  let can = false; try { can = !IN_APP && !!file && !!navigator.canShare && navigator.canShare({ files: [file] }); } catch (e) { can = false; }
  const saveImg = () => { const a = document.createElement('a'); a.href = url; a.download = info.file; document.body.appendChild(a); a.click(); a.remove(); feedback('📷 사진을 저장했어요'); };
  const shareImg = async () => {
    try { await navigator.share({ files: [file], title: info.title }); }
    catch (e) { if (e && e.name !== 'AbortError') feedback('공유하지 못했어요 · 사진 저장으로 받아 주세요', true); }
  };
  openModal('↗ 공유', `<div class="share-pv"><img class="share-img" id="shareImg" src="${url}" width="${SHARE_W}" height="${SHARE_H}" alt="정원 스토리 그림"></div>`
    + (can ? '' : '<p class="note share-note">사진을 저장한 뒤 인스타에서 올려요</p>'),
    can ? [{ label: '사진 저장', act: saveImg }, { label: '인스타에 공유', primary: true, act: shareImg }] : [{ label: '사진 저장', primary: true, act: saveImg }]);
}
$('#shareBtn').addEventListener('click', () => { openShareStory().catch(() => feedback('그림을 만들지 못했어요', true)); });
// P55 끝
