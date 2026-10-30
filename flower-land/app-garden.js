// 도리의 정원 — 화면: 정원: 도구 · 지도 그리기 · 누르기와 드래그 · 꽃 상태창 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 정원: 도구 (P13)
const TOOL_GROUPS = [
  [{ id: 'look', ic: '🔍', label: '관찰' }],
  [{ id: 'water', ic: '💧', label: '물' }, { id: 'weed', ic: '🌿', label: '잡초' }, { id: 'prune', ic: '✂️', label: '가지치기' }, { id: 'fert', ic: '🌱', label: '비료' }, { id: 'harvest', ic: '🧺', label: '수확' }],
];
const BATCH = ['water', 'weed', 'prune', 'fert', 'harvest'];
const HINT = {
  look: '꽃을 누르면 꽃 둘레에서 돌보기를, 상태창에서 옮겨심기·번식을, 빈 칸을 누르면 심기를 할 수 있어요.',
  plant: '위에서 심을 꽃을 고른 뒤, 빈 칸을 누르세요.',
  water: '목마른 꽃을 눌러 물을 줘요. 한 번 주면 2달(현실 하루) 동안 괜찮아요.',
  weed: '잡초 난 꽃을 눌러 잡초를 뽑아요. 2달(현실 하루) 동안 괜찮아요. 뽑은 잡초는 비료가 돼요.',
  prune: '나무와 덤불(장미, 라벤더, 재스민, 동백, 매화, 납매)의 가지를 쳐요. 1달 동안 품질이 올라요.',
  fert: '꽃이 있는 칸에 비료를 뿌려요. 1달 동안 품질이 오르고, 품질이 오르면 땅이 넓어져요.',
  harvest: '노란 점이 있는 꽃(개화)에서 꽃잎을 거둬 제다실에 넣어요. 한 달에 한 번, 꽃잠엔 한 번이에요.',
  prop: '다 자란 꽃을 눌러 번식해요. 꽃마다 할 수 있는 달이 정해져 있고(꽃잠엔 언제든), 한 해에 한 번이에요.',
  move: '옮길 꽃을 누른 다음, 빈 칸을 누르세요. 심는 기간이나 휴면기, 꽃잠에 할 수 있어요.',
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
  $('#needs').innerHTML = `<span class="nd-say">${cal.frozen && !needSum ? '🌙 꽃들이 자는 중' : needSum ? '돌볼 꽃 · 누르면 반짝여요' : '🌿 지금은 돌볼 꽃이 없어요'}</span>` + NEEDS.map(([k, ic, nm]) => `<button type="button" class="nd ${need[k] ? 'on' : ''}" style="--k:${CARE_COLOR[k]}" data-flash="${k}" title="${nm} ${need[k]}포기 · 눌러서 찾기"><span>${ic}</span><b>${need[k]}</b></button>`).join('') + careAllBtns(need, 'nd on nd-all') + pantryChip();   // ⛏️ 광산 입구는 10-30 탭으로 옮김 · 🔍 돋보기(모바일 확대, QA 6회차)는 10-30 사용자 요청으로 뺌
  const tray = $('#tray');
  if (ui.tool === 'plant') {
    const keys = Object.keys(pl);
    tray.hidden = false;
    tray.innerHTML = keys.length ? `<button type="button" class="seedchip none" data-seed="" aria-pressed="${!ui.plantType}">선택 안 함</button>` + keys.map(k => {
      const F = FLOWERS[k], best = Math.max(...st.items.filter(i => i.type === k && E.germOf(i) > 0).map(i => i.q));
      return `<button type="button" class="seedchip" data-seed="${k}" aria-pressed="${ui.plantType === k}"><span class="dot" style="background:${F.petal}"></span>${F.name} ${FORM[F.form].name} <span class="data">×${pl[k]}</span> <span class="stars" style="font-size:calc(11 * var(--u))">★${E.stars(best)}</span></button>`;
    }).join('') + '<button type="button" class="btn small" data-act="endMode">✓ 심기 끝</button>'
      : `<span class="muted" style="font-size:calc(13 * var(--u))">${cal.frozen ? '꽃잠에는 심을 수 없어요.' : '지금 심을 수 있는 게 창고에 없어요.'}</span> <button type="button" class="btn small primary" data-go="shop">💐 화원</button> <button type="button" class="btn small" data-act="endMode">닫기</button>`;
  } else if (ui.tool === 'deco') {                // P17-16 장식 놓기 · 옮기기
    const d = decoById(ui.decoId);
    if (!d) { ui.tool = 'look'; ui.decoId = null; tray.hidden = true; tray.innerHTML = ''; return renderHint(); }
    tray.hidden = false;
    tray.innerHTML = `<span class="muted deco-tray">${decoImg(d.key, 1)} 🪴 ${d.x == null ? '놓는' : '옮기는'} 중이에요</span><button type="button" class="btn small" data-act="endMode">취소</button>`;
  } else if (ui.tool === 'move') {
    tray.hidden = false;
    tray.innerHTML = '<span class="muted" style="font-size:calc(13 * var(--u))">↔ 옮겨 심는 중이에요</span><button type="button" class="btn small" data-act="endMode">취소</button>';
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
  else if (ui.tool === 'deco') { const d = decoById(ui.decoId); msg = d ? `${josa(E.decoInfo(d.key).name, '을/를')} 놓을 빈 칸을 누르세요` : ''; }
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
const canvas = $('#map'), g = canvas.getContext('2d');
let cell = 20, dpr = 1, hover = null, drag = null;
const shade = Array.from({ length: W * H }, (_, i) => (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.07);
function resize() {
  const w = canvas.parentElement.clientWidth; if (!w) return;
  dpr = window.devicePixelRatio || 1; cell = w / W;
  canvas.style.height = cell * H + 'px';
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(cell * H * dpr);
}
new ResizeObserver(resize).observe(canvas.parentElement);
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
  const F0 = FLOWERS[f.type], alt = yearSkyMemo && yearSkyMemo.bloom === f.type && window.YEARLY_ART.bloom[f.type];   // P30-05-02 올해의 꽃빛: 그 꽃의 꽃잎 색만 바꿈
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
      const picked = f.harvestKey === E.harvestSlot(cal), open = picked ? 0.6 : 1;
      ell(R * 0.08, R * 0.12, R * 0.95, R * 0.85, 0, 'rgba(0,0,0,.16)');
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
      if (!picked) { g.fillStyle = '#ffd84a'; g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; g.beginPath(); g.arc(0, -R * 0.95, Math.max(2, R * 0.14), 0, 7); g.fill(); g.stroke(); }
      break;
    }
  }
  g.restore();
}
// P13-06-02: 돌봄이 필요한 꽃(물·잡초)에 "!" 말풍선 하나. 무엇이 필요한지는 꽃을 눌러 상태창에서
function drawMarks(f, cal) {
  if (f.withered) return;
  if (!E.canCare(st, f, 'water', cal) && !E.canCare(st, f, 'weed', cal)) return;
  const r = Math.max(8, cell * 0.26), cx = f.x * cell + cell - r * 0.75, cy = f.y * cell + r * 0.75;
  g.save();
  g.beginPath(); g.moveTo(cx - r * 0.5, cy + r * 0.7); g.lineTo(cx - r * 0.9, cy + r * 1.35); g.lineTo(cx + r * 0.1, cy + r * 0.85); g.closePath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = '#fffaf2'; g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 3; g.fill();
  g.shadowBlur = 0; g.lineWidth = 1.5; g.strokeStyle = '#b8456b'; g.stroke();
  g.fillStyle = '#b8456b'; g.font = `bold ${Math.round(r * 1.4)}px system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', cx, cy + r * 0.05);
  g.restore();
}
function dragTiles() {
  if (!drag) return [];
  if (ui.mode === 'rect') {
    const out = [], [x1, y1] = drag.start, [x2, y2] = drag.cur;
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) out.push([x, y]);
    return out;
  }
  return [...drag.path.values()];
}
function draw() {
  if (!canvas.width) return;
  updateRing();
  const cal = E.calendar(st.virtual);
  renderYearSky(cal);                              // P30-05-02 올해만 오는 날씨 (꽃빛은 아래 drawFlower가 읽음)
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
  for (const d of st.decos || []) if (d.x != null) {
    const im = decoBitmap(d.key); if (im) g.drawImage(im, d.x * cell + cell * 0.04, d.y * cell + cell * 0.04, cell * 0.92, cell * 0.92);
    if (d.honey && d.honey.length) { g.fillStyle = '#f2b632'; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(d.x * cell + cell * 0.82, d.y * cell + cell * 0.2, Math.max(2.5, cell * 0.14), 0, 7); g.fill(); g.stroke(); }   // 🍯 거둘 꿀이 있음
  }
  for (const v of E.visitorsOf(st, cal)) { const im = visitorBitmap(v.key); if (im) g.drawImage(im, v.x * cell + cell * 0.04, v.y * cell + cell * 0.04, cell * 0.92, cell * 0.92); }   // P30-06-02 🐾 특별 손님 (장식과 같은 길 · 빈 칸에만 앉음)
  // P27 장치 효과 범위: 놓거나 옮기는 중엔 가리킨 칸 둘레, 놓인 장치를 누르면 잠깐 그 둘레 (QA 12회차 제안)
  const gearAt = (key, x, y) => { const G = { r: decoReach(key) }; if (G.r == null) return; g.save(); g.fillStyle = 'rgba(255, 216, 74, .18)'; g.strokeStyle = 'rgba(255, 216, 74, .9)'; g.lineWidth = 1.5; g.setLineDash([3, 3]);
    const x0 = Math.max(0, x - G.r), y0 = Math.max(0, y - G.r), x1 = Math.min(W - 1, x + G.r), y1 = Math.min(H - 1, y + G.r);
    g.fillRect(x0 * cell, y0 * cell, (x1 - x0 + 1) * cell, (y1 - y0 + 1) * cell); g.strokeRect(x0 * cell + 1, y0 * cell + 1, (x1 - x0 + 1) * cell - 2, (y1 - y0 + 1) * cell - 2); g.restore(); };
  const placing = ui.tool === 'deco' && decoById(ui.decoId);
  if (placing && decoReach(placing.key) != null) { const p = ui.gearPreview || hover || (placing.x != null ? [placing.x, placing.y] : null); if (p) gearAt(placing.key, p[0], p[1]); }
  if (ui.gearShow && performance.now() < ui.gearShow.until) { const d = decoById(ui.gearShow.id); if (d && d.x != null) gearAt(d.key, d.x, d.y); } else if (ui.gearShow) ui.gearShow = null;
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
  if (!f && dc) return `<b>🪴 ${esc(E.decoInfo(dc.key).name)}</b><br><span class="muted">${land} · 눌러서 옮기기</span>`;
  if (!f) return `<b>${land}</b><br><span class="muted">${tl.t.toFixed(1)}°C · 습도 ${Math.round(tl.m)}%</span>`;
  const F = FLOWERS[f.type], cal = E.calendar(st.virtual), v = Math.round(E.vigorOf(st, f));
  const needs = [];
  if (!f.withered) {
    if (E.canCare(st, f, 'water', cal)) needs.push('💧 물이 필요해요');
    if (E.canCare(st, f, 'weed', cal)) needs.push('🌿 잡초가 났어요');
    if (E.canCare(st, f, 'harvest', cal)) needs.push('🧺 수확할 수 있어요');
  }
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
    if (f) return feedback('꽃이 있는 칸에는 놓을 수 없어요', true);
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
    const r = E.move(st, ui.moveFrom, x, y);
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
// ---------------------------------------------------------------- ⛏️ 광산 탭 (P24, 10-24 · 10-30 창 → 탭, 사용자 요청 "창고 밑에 광산 메뉴 따로"): 층 · 기력 · 8×6 판 · 가방 · 만들기
function renderMine(force) {
  const m = E.mineOf(st), b = m.board; ui.mineTab = ui.mineTab || 'bag';
  const nextE = m.energy >= E.MINE_MAX_E ? '가득 찼어요' : `다음 기력 ${realH((E.MINE_REGEN_H - m.regenH) / (st.speed || 1))} 뒤`;
  const stairsFound = b.cells.some(c => c.dug && c.stairs), allDug = b.cells.every(c => c.dug);
  const cell = (c, i) => c.dug ? `<span class="mc dug" title="${E.mineName(c.k)}${c.stairs ? ' · 계단' : ''}">${c.k === 'dirt' ? '' : mineImg(c.k, 2)}${c.stairs ? `<span class="mc-st">${mineImg('stairs', 1)}</span>` : ''}</span>`
    : `<button type="button" class="mc" data-dig="${i}" aria-label="${Math.floor(i / E.MINE_W) + 1}번째 줄 ${i % E.MINE_W + 1}번째 칸 파기" ${m.energy < 1 ? 'disabled' : ''}></button>`;
  const bagKeys = ['dirt', 'stone', ...E.ORE_KEYS, ...E.FOSSIL_KEYS, 'oldseed'].filter(k => m.bag[k] > 0);
  const bag = bagKeys.length ? `<div class="mine-bag">${bagKeys.map(k => `<span class="hj">${mineImg(k, 2)}<small>${E.mineName(k)} <b class="data">×${m.bag[k]}</b></small></span>`).join('')}</div>` : '<p class="muted">아직 판 게 없어요 · 칸을 눌러 파 보세요</p>';
  const crafts = `<div class="mine-crafts">${E.CRAFT_KEYS.map(k => { const C = E.CRAFTS[k], can = E.canCraft(st, k), have = C.cup && E.shopOf(st).cups.includes(C.cup);
    const art = C.deco ? decoImg(C.deco, 2) : C.cup ? `<img class="px" src="${cupPreview(C.cup)}" width="32" height="32" alt="">` : '<span class="mn-ico">🌱</span>';
    return `<div class="mcraft ${can && !have ? 'can' : ''}"><span>${art}</span><span class="mcr-main"><b>${C.name}</b><small>${Object.entries(C.need).map(([n, q]) => `${E.mineName(n)} ${m.bag[n] || 0}/${q}${!(m.bag[n] >= q) && E.ORES[n] && E.ORES[n].from > 1 ? ` (${E.ORES[n].from}층부터)` : ''}`).join(' · ')}</small></span>${have ? '<span class="muted">✓ 있어요</span>' : `<button type="button" class="btn small ${can ? 'primary' : ''}" data-craft="${k}" ${can ? '' : 'disabled'}>만들기</button>`}</div>`; }).join('')}</div>`;
  const sig = JSON.stringify([m, nextE, ui.mineTab, st.money, E.shopOf(st).cups]);
  if (!force && ui.sigs.mine === sig) return;
  ui.sigs.mine = sig;
  $('#p-mine').innerHTML = `<div class="cab-head"><span class="sb-title">⛏️ 정원 뒤 광산</span><span class="muted">기다리는 동안 조금씩 파요</span></div>
    <div class="card mine-pop">
    <div class="mine-head"><b>지하 ${m.depth}층</b><span class="muted">가장 깊이 ${m.deepest}층</span></div>
    <div class="mine-energy" title="${nextE}"><span>⛏️ 기력</span><span class="me-bar">${Array.from({ length: E.MINE_MAX_E }, (_, i) => `<i class="${i < m.energy ? 'on' : ''}"></i>`).join('')}</span><small class="muted">${m.energy} / ${E.MINE_MAX_E} · ${nextE}</small></div>
    <div class="mine-grid" style="--mw:${E.MINE_W}">${b.cells.map(cell).join('')}</div>
    <div class="mine-acts">${stairsFound && m.depth < E.MINE_DEEPEST ? '<button type="button" class="btn primary small" data-mact="down">🪜 아래층으로</button>' : ''}${m.depth > 1 ? '<button type="button" class="btn small" data-mact="up">⬆️ 1층으로</button>' : ''}${m.depth < m.deepest ? `<button type="button" class="btn small" data-mact="deep" ${m.energy < 3 ? 'disabled' : ''}>🪜 지하 ${m.deepest}층으로 · 기력 3</button>` : ''}${allDug ? '<button type="button" class="btn small" data-mact="fresh">🔄 새 굴</button>' : ''}</div>
    <div class="seg" role="group"><button type="button" data-mtab="bag" aria-pressed="${ui.mineTab === 'bag'}">🎒 가방</button><button type="button" data-mtab="craft" aria-pressed="${ui.mineTab === 'craft'}">🔨 만들기</button></div>
    ${ui.mineTab === 'craft' ? crafts : bag}
    <p class="note">기력은 30분마다 한 칸씩, 꺼 둔 동안에도 차요 · 나온 것은 팔지 않고 만들기 · 도감에 써요</p></div>`;
}
$('#p-mine').addEventListener('click', e => {
  const d = e.target.closest('[data-dig]'); if (d && !d.disabled) { const r = E.dig(st, +d.dataset.dig, ctx); if (!r.ok) return feedback(r.msg, true); save(); if (r.first || r.stairs || r.cell.k === 'oldseed') feedback(r.msg); return renderAll(true); }
  const x = e.target.closest('[data-mact]');
  if (x && !x.disabled) {
    const a = x.dataset.mact, m = E.mineOf(st), go = () => { closeModal(); const r = a === 'down' ? E.descend(st) : a === 'up' ? E.mineUp(st) : a === 'deep' ? E.toDeepest(st) : E.freshBoard(st); feedback(r.msg, !r.ok); save(); renderAll(true); };
    if (a !== 'up') return go();
    return openModal('⬆️ 1층으로', `<p>지하 ${m.depth}층의 판을 두고 1층으로 올라가요</p><p class="muted">다시 내려올 땐 "🪜 지하 ${m.deepest}층으로"(기력 3)로 바로 갈 수 있어요</p>`, [{ label: '취소', act: () => closeModal() }, { label: '올라가기', primary: true, act: go }]);
  }
  const t = e.target.closest('[data-mtab]'); if (t) { ui.mineTab = t.dataset.mtab; return renderMine(true); }
  const c = e.target.closest('[data-craft]'); if (c && !c.disabled) { const r = E.craft(st, c.dataset.craft, ctx); feedback(r.msg, !r.ok); if (r.ok) save(); ui.mineTab = 'craft'; return renderAll(true); }
});
// 놓인 장식을 누르면: 그림 · 이름 · 옮기기 · 창고에 넣기 (P17-16-03)
// 심은 지: 한 해(14달)가 넘으면 해 단위로 (QA 13회차)
const ageText = h => { const m = Math.floor(h / E.MONTH_H); return m >= 14 ? `${Math.floor(m / 14)}년 ${m % 14 ? `${m % 14}달` : ''}`.trim() : flowH(h); };
function openDecoTile(d) {
  const info = E.decoInfo(d.key);
  let extra = '';
  if (d.key === 'hive') {                          // P18 벌통: 모인 꿀 · 둘레의 핀 꽃 · 다음에 모일 꿀
    const hn = d.honey || [], by = {}; for (const k of hn) by[k] = (by[k] || 0) + 1;
    const bl = E.hiveBlooms(st, d), h = E.honeyOf(bl), frozen = E.calendar(st.virtual).frozen;
    extra = `<div class="hive-info"><div class="hive-jars">${hn.length ? Object.entries(by).map(([k, n]) => `<span class="hj">${honeyImg(k, 2)}<small>${E.honeyName(k)} ×${n}</small></span>`).join('') : '<span class="muted">아직 모인 꿀이 없어요</span>'}</div>
      <small class="muted">둘레 ${E.HONEY_R}칸에 핀 꽃 ${bl.length}포기 · ${frozen ? '🌙 꽃잠에는 벌도 쉬어요' : h ? `이 달이 끝나면 ${E.honeyName(h.type)} ${h.jars}병` : '꽃이 피면 꿀이 모여요'} · 벌통엔 ${E.HIVE_MAX}병까지</small>
      ${hn.length ? '<button type="button" class="btn primary" data-takehoney="1">🍯 거두기</button>' : ''}</div>`;
  }
  if (d.key === 'autobasket') {                   // P28-10-01 자동 수확 바구니: 이 달이 끝나면 거둘 꽃 · 지도에 범위
    const cal = E.calendar(st.virtual), bl = E.basketBlooms(st, d, cal);
    extra = `<p class="muted">${cal.frozen ? '🌙 꽃잠엔 개미 일꾼도 쉬어요 · 잠든 꽃은 직접 거둬요' : bl.length ? `이 달이 끝나면 핀 꽃 ${bl.length}포기의 꽃잎을 거둬 제다실로 보내요` : `지금 ${E.basketReach(st) > 1 ? '둘레' : '바로 옆'}에 거둘 핀 꽃이 없어요`} · 둘레 ${E.basketReach(st)}칸 ${E.bonusVal(st, 'basket')}포기까지 · 바구니 용품은 안 써요 · 꽃잎 품질은 손으로 거둔 것의 90%${E.slowView(st) ? '' : ` · 지금까지 ${d.n || 0}장`}</p>`;
    ui.gearShow = { id: d.id, until: performance.now() + 60000 };
  }
  if (d.key === 'dryrack') {                      // P28-10-02 자동 건조대: 이 달이 끝나면 널 꽃잎 · 꽃방에서 마르는 중
    const racks = E.placedOf(st, 'dryrack').length, frozen = E.calendar(st.virtual).frozen, mine = st.drying.filter(x => x.auto).length, take = Math.min(st.petals.length, racks * E.rackN(st));   // P28-05-02 🍂 건조대 넉넉히면 10 · 12 · 14장
    extra = `<p class="muted">${d.x == null ? '정원에 놓으면 일해요' : frozen ? '🌙 꽃잠엔 누에 일꾼도 쉬어요' : take ? `이 달이 끝나면 제다실 꽃잎 ${take}장을 꽃방에 널어요` : '지금 제다실에 널 꽃잎이 없어요'} · 하나에 한 달 ${E.rackN(st)}장, 오래된 꽃잎부터 · 다 마르면 티백까지 · 블렌드는 직접 해요${mine ? ` · 꽃방에서 마르는 중 ${mine}장` : ''}${E.slowView(st) ? '' : ` · 지금까지 ${d.n || 0}장`}</p>`;
  }
  if (d.key === 'teahelper') {                    // P28-10-03 찻집 일손: 열려 있으면 카운터를 채움 · 남은 티백
    const cal = E.calendar(st.virtual), open = E.teaShopOpen(cal), bags = st.teas.length;
    extra = `<p class="muted">${d.x == null ? '정원에 놓으면 일해요' : open ? (bags ? `카운터에 갓 우린 잔이 ${E.helperKeep(st)}잔이 되게 채워요 · 남은 티백 ${bags}개` : '우릴 티백이 없어요 · 제다실에서 티백을 만들어요') : '🔒 찻집이 열리는 겨울(12월)부터 일해요'} · 가장 오래된 티백부터 · 블렌드 티백 · 🍯 꿀은 직접 해요${E.slowView(st) ? '' : ` · 지금까지 ${d.n || 0}잔`}</p>`;
  }
  if (E.GEAR[d.key]) {                           // P27 장치: 지금 몇 포기가 빨리 자라는지 · 지도에 범위
    const G = E.GEAR[d.key], frozen = E.calendar(st.virtual).frozen;
    const n = st.flowers.filter(f => !f.withered && Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) <= G.r && f.ageH < FLOWERS[f.type].mature * E.MONTH_H
      && (!G.young || f.stage === 'germ' || f.stage === 'sprout' || (f.lifeH != null ? f.lifeH : f.ageH) < E.MONTH_H)).length;   // 이 장치 덕분인 꽃만 (QA 14회차)
    extra = `<p class="muted">${frozen ? '🌙 꽃잠엔 장치도 쉬어요' : n ? `지금 ${n}포기가 빨리 자라는 중이에요` : '지금 둘레에 빨리 자랄 꽃이 없어요'} · 둘레 ${E.GEAR[d.key].r}칸 (창을 닫으면 지도에 잠깐 보여요)</p>`;
    ui.gearShow = { id: d.id, until: performance.now() + 60000 };
  }
  openModal(`🪴 ${esc(info.name)}`, `<div class="deco-pop">${decoImg(d.key, 4)}<p class="muted">${esc(info.desc || '')}</p>${extra}</div>`, [
    { label: '📦 창고에', act: () => { closeModal(); after(E.storeDeco(st, d.id)); } },
    { label: '↔ 옮기기', primary: true, act: () => { closeModal(); ui.tool = 'deco'; ui.decoId = d.id; renderToolbar(true); } },
  ]);
  const tb = $('#modalRoot [data-takehoney]');
  if (tb) tb.onclick = () => { closeModal(); after(E.takeHoney(st, d.id, ctx), null, { label: '🍵 찻집', fn: () => setTab('cab') }); };
}
// 지도에 범위를 그리는 장식의 둘레 칸 수 (P27 장치 · P28-10 자동 수확 바구니), 없으면 null
function decoReach(key) { return E.GEAR[key] ? E.GEAR[key].r : key === 'autobasket' ? E.basketReach(st) : null; }   // P28-05-02 🧺 바구니 넓게면 둘레 2칸
// 상태창 한 줄: 자동 수확 바구니가 맡은 꽃 (P28-10-01 · P28-05-02 바구니 넓게: 둘레 2칸에서 가까운 꽃부터 n포기 — 엔진 basketFlowers 그대로)
function basketNote(f) {
  const cal = E.calendar(st.virtual);
  if (cal.frozen || !E.placedOf(st, 'autobasket').some(d => E.basketFlowers(st, d).includes(f))) return '';
  return E.canCare(st, f, 'harvest', cal) ? ' · 🐜 달이 끝나면 개미 일꾼이 물어 가요' : ' · 🐜 개미 일꾼 둘레';
}
function select(id) { ui.selected = id; ui.selTile = null; ui.sheetOpen = true; renderStatus(true); }
function plantAt(type, x, y) {
  if (E.flowerAt(st, x, y)) return feedback('이 자리에는 이미 꽃이 있어요', true);
  const best = st.items.filter(i => i.type === type && E.germOf(i) > 0).sort((a, b) => b.q - a.q)[0];
  if (!best) return feedback('창고에 심을 것이 없어요', true);
  const r = E.plant(st, best.id, x, y, ctx.rng);
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
  } else if (!out.length && match < 0.8) out.push(f.adaptH > 0 ? '땅이 아직 바뀌는 중이에요. 적응 기간이라 품질은 그대로예요' : '땅이 아직 바뀌는 중이에요');
  return out.join(' · ');
}
function renderStatus(force) {
  const el = $('#status'), f = st.flowers.find(x => x.id === ui.selected);
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
    else if (t === 'prune' && !F.prune) { state = 'na'; sub = '필요 없어요'; }
    else if (t === 'harvest' && !can.harvest) { state = f.stage === 'bloom' && f.harvestKey === E.harvestSlot(cal) ? 'done' : 'na'; sub = state === 'done' ? '거뒀어요' : monthsText(F.bloom); }
    else if (t !== 'harvest' && hH > 0) { state = 'done'; sub = flowH(hH) + ' 남음'; }
    else if (!can[t]) { state = 'na'; sub = '자란 뒤에'; }
    else if (!have(t)) { state = 'lack'; sub = TOOLNAME[t] + ' 없음'; }
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
    if (!E.propGrown(f)) return '다 자란 뒤에 할 수 있어요';   // 휴면 달의 어린 꽃은 나이로 (QA 19회차)
    if (!cal.frozen && !F.propMonths.includes(cal.month)) return `${monthsText(F.propMonths)}에 할 수 있어요`;
    return '';
  })();
  const moveReason = canMove ? '' : f.withered ? '시든 꽃이에요' : '심는 달 · 휴면기 · 꽃잠에 할 수 있어요';
  const actBtn = (act, label, reason) => `<div class="sx-act"><button type="button" class="btn ${reason ? '' : 'primary'}" data-act="${act}" ${reason ? 'disabled' : ''}>${label}</button>${reason ? `<span class="muted">${reason}</span>` : ''}</div>`;
  const actions = `<div class="sx-acts">${actBtn('move', ui.tool === 'move' && ui.moveFrom === f.id ? '↔ 옮길 빈 칸을 누르세요' : '↔ 옮겨심기', moveReason)}${actBtn('prop', `🌾 ${F.prop}${propReason ? '' : ` · ${E.propCount(f.q)}개`}`, propReason)}</div>`;
  const sig = JSON.stringify([can, have('water'), have('weed'), have('prune'), have('fert'), have('harvest'), st.fert, st.water, st.shears, st.hoe, st.basket, ui.tool, ui.moveFrom, propReason, moveReason, f.id, f.stage, E.pct(f.q), Math.round(v), E.pct(next), Math.round(f.waterH * 2), Math.round(f.weedH * 2), Math.round(f.pruneH * 2), Math.round(f.fertH * 2), Math.round(f.adaptH * 2), f.harvestKey === E.harvestSlot(cal), f.propYear, cal.idx, ui.detailsOpen, ui.sheetOpen, land, blk.length, Math.round(tl.t), Math.round(tl.m)]);
  if (!force && ui.sigs.status === sig) return;
  ui.sigs.status = sig;
  el.className = 'status' + (ui.sheetOpen ? ' sheet' : ' idle-mobile');
  const vCol = v >= 80 ? 'var(--good)' : v >= 50 ? '#c2a33a' : 'var(--warn)';
  const note = [f.adaptH > 0 ? `새 자리에 적응하는 중 (${flowH(f.adaptH)} 남음)` : '', v < 80 ? vigorCause(f, match) : ''].filter(Boolean).join(' · ');
  // 자라는 단계 길: 발아 → 새싹 → 자라는 중 → 다 자람 → 개화 (휴면·시듦은 따로 표시)
  const PATH = ['germ', 'sprout', 'young', 'mature', 'bloom'], si = PATH.indexOf(f.stage);
  const stagePath = `<div class="stagepath">${PATH.map((s, i) => `<span class="${si >= 0 && i < si ? 'past' : i === si ? 'cur' : ''}">${E.STAGE[s]}</span>`).join('')}${si < 0 ? `<span class="cur odd">${f.stage === 'dormant' ? '💤 ' : ''}${E.STAGE[f.stage]}</span>` : ''}</div>`;
  const nextArrow = next > f.q + 0.004 ? '↑' : next < f.q - 0.004 ? '↓' : '→';
  el.innerHTML = `
    <div class="sx-head">
      <div class="sx-art" style="background:color-mix(in srgb, ${F.petal} 16%, var(--sunk))">${spriteImg(f.type, 'flower', 56, false, F.name)}</div>
      <div class="sx-title"><h3>${F.name}</h3><div><span class="stars">${starStr(f.q)}</span> <span class="muted" style="font-size:calc(12 * var(--u))">${qualityWord(f.q, f.stage === 'bloom')}</span></div>
        <div class="muted" style="font-size:calc(12 * var(--u))">${LIFE[F.life]} · ${FORM[F.form].name} · ${f.origin === '이웃' ? '이웃이 준 화분' : `심은 지 ${ageText(f.lifeH != null ? f.lifeH : f.ageH)}`}${basketNote(f)}${E.growRate(st, f) > 1 && f.stage !== 'bloom' && f.ageH < F.mature * E.MONTH_H && !E.calendar(st.virtual).frozen ? ` · 🔆 ${f.stage === 'dormant' ? `쉬는 동안에도 ${E.growRate(st, f)}배로 자라요` : `${E.growRate(st, f)}배로 자라는 중`}` : ''}</div></div>
      <button type="button" class="iconbtn sx-close" data-act="closeSheet" aria-label="상태창 닫기">✕</button>
    </div>
    ${stagePath}
    <div class="sx-stats">
      <div title="${qualityWord(f.q, f.stage === 'bloom')}"><span class="lbl">품질</span><b>${E.pct(f.q)}%</b><span class="mini"><i style="width:${E.pct(f.q)}%;background:#d39b12"></i></span><span class="sub${cal.frozen ? ' wrap' : ''}">${cal.frozen ? '깨어나고 1달 뒤' : '다음 달'} ${nextArrow} ${E.pct(next)}%</span></div>
      <div title="${vigorWord(v, f.thirstH > 0, f.waterH > 18)}"><span class="lbl">기운</span><b style="color:${vCol}">${Math.round(v)}%</b><span class="mini"><i style="width:${Math.round(v)}%;background:${vCol}"></i></span><span class="sub">${vigorWord(v, f.thirstH > 0, f.waterH > 18)}</span></div>
      <div title="꽃이 바꾸는 땅의 범위"><span class="lbl">땅</span><b>${E.qualityRadius(f)}칸</b><span class="mini land"><i style="background:${LANDS[land].color}"></i></span><span class="sub">${LANDS[land].name}</span></div>
    </div>
    ${note ? `<div class="sx-note">💬 ${note}</div>` : ''}
    <!-- 돌보기 다섯 칸은 꽃 둘레 단추로 옮김 (10-06) -->
    ${actions}
    <details ${ui.detailsOpen ? 'open' : ''} data-act="details"><summary>자세히 보기 · 땅 · 일정 · 출신</summary>
      <h3 style="margin:10px 0 4px;font-size:calc(14 * var(--u))">땅</h3>
      <dl class="kv">
        <dt>지금 땅</dt><dd>${landSw(land)} ${LANDS[land].name}</dd>
        <dt>원하는 땅</dt><dd>${LANDS[home].name} · ${rel}</dd>
      </dl>
      <div class="gauges" title="색칸이 이 꽃이 원하는 범위(±3), ▲가 지금 이 칸">${envGauges(F, tl)}</div>
      <dl class="kv">
        <dt>바꾸는 범위</dt><dd>${Math.max(0, E.stageRadius(f))}칸 (다 자라면 ${E.qualityRadius(f)}칸)</dd>
        ${blk.length ? `<dt>밀리는 중</dt><dd>옆의 ${josa(FLOWERS[blk[0].type].name, '이/가')} 만든 땅에 밀리고 있어요</dd>` : ''}
      </dl>
      <h3 style="margin:10px 0 4px;font-size:calc(14 * var(--u))">일정</h3>
      ${flowerStrip(F, cal.idx)}
      <dl class="kv">
        ${f.stage === 'bloom' ? `<dt>수확</dt><dd>${f.harvestKey === E.harvestSlot(cal) ? (cal.frozen ? '이번 꽃잠엔 수확했어요' : '이번 달은 수확했어요') : '지금 수확할 수 있어요'}</dd>` : ''}
        <dt>번식</dt><dd>${F.prop === '채종' ? '채종 · 시들 때 자동' : F.prop}</dd>
        <dt>옮겨심기</dt><dd>${canMove ? '지금 할 수 있어요' : '심는 달 · 휴면기 · 꽃잠에'}</dd>
      </dl>
      <h3 style="margin:10px 0 4px;font-size:calc(14 * var(--u))">출신</h3>
      <dl class="kv">
        <dt>어디서</dt><dd>${f.origin}${f.parent ? ` (${f.parent}에서)` : ''}</dd>
        <dt>심을 때 품질</dt><dd>${qLabel(f.startQ)}</dd>
      </dl>
      <div class="row" style="margin-top:8px"><button type="button" class="btn small" data-act="dex" data-key="${f.type}">📖 도감</button></div>
    </details>`;
}
// 빈 칸 상태창: 땅 정보와 이 칸에 심기
function renderTileStatus(force) {
  const el = $('#status'), [x, y] = ui.selTile, tl = st.tiles[y * W + x], land = E.landOf(tl), cal = E.calendar(st.virtual);
  const pl = plantable(), keys = Object.keys(pl);
  const sig = JSON.stringify(['tile', x, y, land, Math.round(tl.t), Math.round(tl.m), pl, cal.frozen, ui.sheetOpen]);
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
  const say = land === 'barren' ? '아직 아무 꽃의 땅도 아니에요. 꽃을 심으면 그 꽃이 좋아하는 땅으로 바뀌어요'
    : known.length ? `${known.join(', ')}${josa(known[known.length - 1], '이/가').slice(-1)} 좋아하는 땅이에요` : homes.length ? '어떤 꽃이 좋아하는 땅일까요?' : '꽃과 꽃 사이에서 생긴 땅이에요';
  const tPct = Math.max(0, Math.min(100, tl.t / 35 * 100)), mPct = Math.max(0, Math.min(100, tl.m));
  el.className = 'status' + (ui.sheetOpen ? ' sheet' : '');
  el.innerHTML = `
    <div class="sx-head">
      <div class="sx-art" style="background:color-mix(in srgb, ${LANDS[land].color} 22%, var(--sunk))"><span class="sx-land" style="background-color:${LANDS[land].color}"></span></div>
      <div class="sx-title"><h3>빈 칸</h3><div><span class="chip" style="font-size:calc(11.5 * var(--u))">${landSw(land, 'width:9px;height:9px;margin-right:4px')}${LANDS[land].name}</span></div>
        <div class="muted" style="font-size:calc(12 * var(--u))">가로 ${x + 1} · 세로 ${y + 1}</div></div>
      <button type="button" class="iconbtn sx-close" data-act="closeSheet" aria-label="상태창 닫기">✕</button>
    </div>
    <div class="sx-stats">
      <div><span class="lbl">기온</span><b>${tl.t.toFixed(1)}°</b><span class="mini"><i style="width:${tPct}%;background:${tl.t < 12 ? '#86abc3' : tl.t < 23 ? '#64a653' : '#cc8636'}"></i></span><span class="sub">${tl.t < 12 ? '서늘해요' : tl.t < 23 ? '온화해요' : '따뜻해요'}</span></div>
      <div><span class="lbl">습도</span><b>${Math.round(tl.m)}%</b><span class="mini"><i style="width:${mPct}%;background:#3d8fd6"></i></span><span class="sub">${tl.m < 30 ? '메말라요' : tl.m < 60 ? '보통이에요' : tl.m < 80 ? '촉촉해요' : '물이 많아요'}</span></div>
      <div><span class="lbl">이 땅</span><b>${cnt}<small> 칸</small></b><span class="mini land"><i style="background:${LANDS[land].color}"></i></span><span class="sub">정원 전체에서</span></div>
    </div>
    <div class="sx-note">💬 ${say}</div>
    <div class="sx-sec">🌰 이 칸에 심기${keys.length && !cal.frozen ? ` <span class="muted" style="font-family:var(--font-body);font-weight:400;font-size:calc(12 * var(--u))">${keys.length}가지 · 누르면 바로 심어요</span>` : ''}</div>
    ${cal.frozen ? '<p class="note">꽃잠에는 심을 수 없어요. 화원에서 다음 해 꽃을 예약할 수 있어요.</p><div><button type="button" class="btn small" data-go="shop">💐 예약</button></div>'
      : keys.length ? `<div class="pgrid">${list}</div>`
      : '<p class="note">지금 심을 수 있는 게 창고에 없어요. 화원에서 제철 꽃을 사 보세요.</p><div><button type="button" class="btn small primary" data-go="shop">💐 화원</button></div>'}`;
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
    return `<button type="button" class="ring-btn ${lk ? 'lack' : ''}" data-ring="${t}" ${lk ? `data-ringbuy="${RING_TOOL[t]}"` : ''} style="--k:${CARE_COLOR[t]};left:${pts[i][0].toFixed(1)}px;top:${pts[i][1].toFixed(1)}px;--d:${i * 40}ms" title="${lk ? `${RING_NM[t]} · ${E.SUPPLIES[RING_TOOL[t]].name} 없음 · 누르면 살 수 있어요` : RING_NM[t]}" aria-label="${RING_NM[t]}${lk ? ' (도구 없음)' : ''}"><span>${RING_IC[t]}</span>${lk ? '<i class="ring-lack">+</i>' : ''}</button>`;
  }).join('');
}
ringEl.addEventListener('click', e => {
  const b = e.target.closest('[data-ring]'); if (!b) return;
  e.stopPropagation();
  if (b.dataset.ringbuy) return openSupply(b.dataset.ringbuy);
  const f = st.flowers.find(x => x.id === ui.selected); if (f) careOn(f, b.dataset.ring);
});
$('#status').addEventListener('click', e => {
  const b = e.target.closest('[data-act], [data-plantat], [data-care]'); if (!b || b.disabled) return;
  const f = st.flowers.find(x => x.id === ui.selected);
  if (b.dataset.care && f) return careOn(f, b.dataset.care);
  if (b.dataset.plantat && ui.selTile) return plantAt(b.dataset.plantat, ui.selTile[0], ui.selTile[1]);
  if (b.dataset.act === 'closeSheet') { ui.sheetOpen = false; ui.selected = null; ui.selTile = null; if (ui.tool === 'move') { ui.tool = 'look'; ui.moveFrom = null; renderToolbar(true); } renderStatus(true); }
  if (b.dataset.act === 'dex') openDexDetail('flower', b.dataset.key);
  if (b.dataset.act === 'move' && f) {
    if (ui.tool === 'move' && ui.moveFrom === f.id) { ui.tool = 'look'; ui.moveFrom = null; }
    else { ui.tool = 'move'; ui.moveFrom = f.id; }
    renderToolbar(true); renderStatus(true);
  }
  if (b.dataset.act === 'prop' && f) after(E.propagate(st, f.id, ctx.rng, ctx));
});
$('#status').addEventListener('toggle', e => { if (e.target.matches('details')) ui.detailsOpen = e.target.open; }, true);
