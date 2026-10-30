// 도리의 정원 — 화면: 픽셀 설명 · 도감일지 · 칭호 · 탭 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 픽셀 설명 (글로 쓰던 설명을 도트 그림으로, 10-17)
const seasonOfIdx = i => Math.min(4, Math.floor(i / 3));
// 달 띠: 3월부터 꽃샘달까지 14칸. rows = [[아이콘, 이름, 달 배열, 색]], 빈 줄은 뺌. 지금 달은 테두리
function monthStrip(rows, nowIdx) {
  rows = rows.filter(r => r[2].length);
  const cell = (i, cls, c) => `<i class="${cls}${i === nowIdx ? ' now' : ''}" style="--c:${c}"></i>`;
  return `<div class="mstrip" role="img" aria-label="${rows.map(r => `${r[1]} ${monthsText(r[2])}`).join(', ')}"><span></span>`
    + MONTHS.map((m, i) => `<i class="ms-h${i === nowIdx ? ' now' : ''}" style="--c:${SEASON_COLOR[seasonOfIdx(i)]}">${MONTH_SHORT(m)}</i>`).join('')
    + rows.map(([ic, nm, arr, c]) => `<span class="ms-l">${ic}<small>${nm}</small></span>${MONTHS.map((m, i) => cell(i, arr.includes(m) ? 'on' : '', c)).join('')}`).join('')
    + '</div>';
}
const flowerStrip = (F, nowIdx) => monthStrip([['🌰', '심기', F.sow, 'var(--seed)'], ['🌸', '개화', F.bloom, F.petal], ['🌱', '번식', F.prop === '채종' ? [] : F.propMonths, 'var(--good)'], ['💤', '휴면', F.dormant, 'var(--muted)']], nowIdx);
// 온도·습도 막대: 20칸, 원하는 범위(±3)는 색칸, 지금 값은 ▲
function envGauge(ic, name, want, now, lo, hi, unit, c) {
  const N = 20, at = v => Math.max(0, Math.min(N - 1, Math.floor((v - lo) / (hi - lo) * N)));
  const a = at(want - 3), b = at(want + 3), n = now == null ? -1 : at(now), ok = now != null && Math.abs(now - want) <= 3;
  const fmt = v => unit === '°C' ? v.toFixed(1) : Math.round(v);
  return `<div class="gauge" role="img" aria-label="${name}: 원하는 ${want}${unit}${now != null ? `, 지금 ${fmt(now)}${unit}` : ''}"><span class="g-l">${ic} ${name}</span>`
    + `<span class="g-bar" style="--c:${c}">${Array.from({ length: N }, (_, i) => `<i class="${i >= a && i <= b ? 'band' : ''}${i === n ? ' here' : ''}"></i>`).join('')}</span>`
    + `<span class="g-v data">${now != null ? `<b class="${ok ? 'val-up' : 'val-down'}">${fmt(now)}</b> / ` : ''}${want}${unit}</span></div>`;
}
const envGauges = (F, tl) => envGauge('🌡️', '온도', F.t, tl ? tl.t : null, 0, 35, '°C', '#d9823b') + envGauge('💧', '습도', F.m, tl ? tl.m : null, 0, 100, '%', '#4788b5');
// 첫 안내: 한 주 = 한 해. 요일마다 낮(06–18시) · 밤(18–06시) 두 칸, 칸 색은 계절
function weekPixel(cal) {
  return `<div class="wkpx" role="img" aria-label="월요일 오전 6시 3월부터 일요일 꽃잠까지, 반나절마다 한 달"><span></span>${WEEKDAY.map((d, i) => `<b class="${i === 6 ? 'rest' : ''}">${d}</b>`).join('')}`
    + ['☀️', '🌙'].map((ic, half) => `<span class="wk-l">${ic}</span>${WEEKDAY.map((_, d) => { const i = d * 2 + half; return `<i class="${i === cal.idx ? 'now' : ''}" style="--c:${SEASON_COLOR[seasonOfIdx(i)]}">${MONTH_SHORT(MONTHS[i])}</i>`; }).join('')}`).join('')
    + '</div>';
}
// 첫 안내: 꽃 한 포기가 둘레 땅을 바꿈 (7×7, 가운데 캐모마일, 2칸 안은 초원)
function landPixel() {
  const F = FLOWERS.chamomile, L = LANDS[homeLand(F)];
  let html = '';
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
    const d = Math.max(Math.abs(x), Math.abs(y));
    html += `<i style="background:${d <= 2 ? L.color : LANDS.barren.color};opacity:${d <= 2 ? 1 - d * 0.15 : 1}">${!x && !y ? spriteImg('chamomile', 'flower', 32, false, F.name) : ''}</i>`;
  }
  return `<div class="landpx" role="img" aria-label="${F.name} 둘레 2칸이 ${L.name}으로 바뀐 모습">${html}</div>`;
}
// ---------------------------------------------------------------- 도감일지 · 칭호 (P19, 10-17)
const TIER_NAME = { s: '🌱 새싹', f: '🌸 꽃', g: '👑 정원' };
const titleCache = {};
function titleURL(k, locked, frame) {
  const T = E.TITLES[k], f = T.tier === 'g' && !locked ? frame % 22 : 0, id = `${k}|${locked ? 1 : 0}|${f}`;
  if (titleCache[id]) return titleCache[id];
  const c = document.createElement('canvas'); c.width = c.height = TITLE_ART.SIZE;
  TITLE_ART.draw(c.getContext('2d'), k, T.tier, { locked, frame: f });
  return (titleCache[id] = c.toDataURL());
}
// 칭호 그림은 22px의 정수배로만 (P16-14)
const titleImg = (k, size, locked) => { size = 22 * Math.max(1, Math.round(size / 22)); return `<img class="px ttl-img" data-ttl="${k}" data-locked="${locked ? 1 : 0}" src="${titleURL(k, locked, 0)}" width="${size}" height="${size}" alt="${locked ? '아직 얻지 못한 칭호' : esc(E.TITLES[k].name)}">`; };
let ttlFrame = 0;
setInterval(() => {   // 👑 정원 칭호: 반짝이가 번갈아 (보이는 그림만 0.4초마다 바꿈)
  ttlFrame++;
  document.querySelectorAll('img.ttl-img[data-locked="0"]').forEach(im => { if (E.TITLES[im.dataset.ttl].tier === 'g') im.src = titleURL(im.dataset.ttl, false, ttlFrame); });
}, 400);
// abs(달 번호) → "1년차 5월" (0년차는 "첫 해 전")
const absText = abs => { const y = Math.floor(abs / 14) - st.firstWeek + 1; return `${y < 1 ? '첫 해 전' : `${y}년차`} ${monthName(MONTHS[abs % 14])}`; };
// 퀘스트 그림: 그 꽃 · 땅 색 칸 · 찻잔
const QART = {
  c0_visit: ['form', 'chamomile'],
  c1_bloom: ['flower', 'chamomile'], c1_petal: ['petal', 'chamomile'], c1_dry: ['dried', 'chamomile'], c1_bag: ['teabag', 'chamomile'], c1_land: ['land', 'grassland'], c1_sell: ['tea', 'chamomile'],
  c2_foothill: ['land', 'foothill'], c2_med: ['land', 'med'], c2_sub: ['land', 'subtropic'], c2_trop: ['land', 'tropical'], c2_edge: ['land', 'mossy'],
  c3_root: ['form', 'lotus'], c3_bloom: ['flower', 'lotus'], c3_pond: ['land', 'pond'], c3_wet: ['land', 'wetland'], c3_sell: ['tea', 'lotus'],
  c4_spring: ['tea', 'chamomile'], c4_sleep: ['tea', 'lavender'], c4_violet: ['tea', 'bpea'], c4_five: ['dried', 'rose'], c4_bag: ['teabag', 'rose'],
  c5_guest: ['tea', 'rose'], c5_warm: ['tea', 'jasmine'], c5_hat: ['tea', 'lotus'], c5_blend: ['tea', 'hibiscus'], c5_five: ['tea', 'gamguk'],
  c6_dongbaek: ['flower', 'dongbaek'], c6_maehwa: ['flower', 'maehwa'], c6_napmae: ['flower', 'napmae'], c6_plum: ['tea', 'maehwa'],
};
const questArt = q => { const ff = E.firstFlower(st), c1 = { c1_bloom: ['flower', ff], c1_petal: ['petal', ff], c1_dry: ['dried', ff], c1_bag: ['teabag', ff], c1_land: ['land', homeLand(FLOWERS[ff])], c1_sell: ['tea', ff] };   // P22-01 1장은 첫 꽃
  const [k, v] = c1[q.key] || QART[q.key]; return k === 'land' ? `<span class="q-land" style="background:${LANDS[v].color}"></span>` : spriteImg(v, k, 32, false, ''); };
// 언제 할 수 있는지 (P19-04-03): 화원에 들어오는 달 · 심어 둔 꽃이 피는 달 · 찻집 여는 달
function questWhen(q, cal) {
  const w = E.questWhenOf(q, st);
  if (!w) return { now: true };
  if (w === 'cafe') return E.teaShopOpen(cal) ? { now: true } : { now: false, label: `${SEASON_IC[3]} 12월부터` };
  if (w.need === 'dry') return st.petals.length || st.drying.length ? { now: true } : { now: false, label: '꽃잎을 거두면' };   // 널 꽃잎 (QA 16회차)
  if (w.need === 'sell') return !E.teaShopOpen(cal) ? { now: false, label: `${SEASON_IC[3]} 12월부터` } : st.teas.some(t => t.type === w.flower) || (st.cups || []).some(c => c.kind === 'tea' && c.type === w.flower) ? { now: true } : { now: false, label: '티백을 만들면' };   // 그 꽃 차만 (QA 19회차)
  if (w.need === 'petal') return [st.petals, st.drying, st.dried].some(l => l.some(p => p.type === w.flower)) ? { now: true } : { now: false, label: '꽃잎을 거두면' };   // QA 6회차: 정확한 "지금" · 그 꽃 꽃잎만 (QA 19회차)
  if (w.need === 'land') return { now: false, label: '꽃 둘레 땅이 바뀌면 (2달쯤)' };
  const F = FLOWERS[w.sow || w.bloom];
  const next = test => { const n = E.untilMonth(st.virtual, c => !c.frozen && test(c)); return n ? `${monthIc(n.cal.month)} ${monthName(n.cal.month)}부터` : ''; };
  if (w.bloom && st.flowers.some(f => f.type === F.key && !f.withered)) return F.bloom.includes(cal.month) && !cal.frozen ? { now: true } : { now: false, label: next(c => F.bloom.includes(c.month)).replace('부터', '에 펴요') };
  if (st.items.some(it => it.type === F.key) || (!cal.frozen && F.sow.includes(cal.month))) return { now: !cal.frozen, label: next(() => true) };
  return { now: false, label: next(c => F.sow.includes(c.month)) };
}
// 다음에 할 퀘스트: 열린 장에서 지금 할 수 있는 것 먼저, 없으면 첫 번째
function nextQuest(cal) {
  const pend = [];
  for (const c of E.CHAPTERS) if (E.chapterOpen(st, c.key)) for (const q of c.quests) if (st.journal.done[q.key] == null) pend.push({ c, q, w: questWhen(q, cal) });
  return pend.find(p => p.w.now) || pend[0] || null;
}
const hiddenBlendOf = tk => Object.keys(E.BLENDS).find(b => E.BLENDS[b].hidden === tk) || null;
function journalHTML() {
  const cal = E.calendar(st.virtual), done = st.journal.done, got = E.TITLE_KEYS.filter(k => st.titles[k] != null).length;
  // 한 페이지에 🏅 칭호 → 📜 퀘스트 순서로 (10-17, 예전엔 두 화면으로 나눔)
  const qDone = E.QUESTS.filter(q => done[q.key] != null).length;
  const head = (id, ic, title, n, total) => `<div class="cab-head dex-head j-head" id="${id}"><span class="sb-title">${ic} ${title}</span><span class="dh-count data">${n} / ${total}</span></div>`;
  // 열린 장은 펼쳐 두고, 닫힌 장은 아래에 접어 둠 (10-17)
  const chs = E.CHAPTERS.map(c => ({ c, open: E.chapterOpen(st, c.key) })), closed = chs.filter(x => !x.open);
  const card = c => {
    const open = E.chapterOpen(st, c.key), n = c.quests.filter(q => done[q.key] != null).length, tk = c.title, has = st.titles[tk] != null, hb = hiddenBlendOf(tk);
    const lockMsg = c.key === 'c1' ? '🌱 첫걸음을 마치면 열려요' : c.key === 'c6' ? '🌳 나무는 오래 걸려서 2년차 3월에 열려요 · 첫해에 심어 두세요' : '1장 첫 꽃밭을 마치면 열려요';
    const rows = open ? c.quests.map(q => {
      const d = done[q.key], w = d != null ? null : questWhen(q, cal);
      const state = d != null ? `<span class="q-st">🔖 ${absText(d)}</span>` : w.now ? '<span class="q-st">지금 할 수 있어요</span>' : `<span class="q-st">${w.label || '때가 되면'}</span>`;
      return `<button type="button" class="q-row ${d != null ? 'done' : w.now ? 'now' : 'later'}" data-qgo="${q.go}"><span class="q-art">${questArt(q)}</span><span class="q-name">${E.questName(q, st)}</span>${state}</button>`;
    }).join('') : '';
    return `<div class="card jch ${open ? '' : 'closed'} ${has ? 'cleared' : ''}">
      <div class="jch-head">${titleImg(tk, 44, !has)}<div class="jch-t"><small>${c.no}장</small><b>${c.name}</b><span class="jch-stamps" aria-label="${n} / ${c.quests.length}">${c.quests.map(q => `<i class="${done[q.key] != null ? 'on' : ''}"></i>`).join('')}</span></div><span class="data jch-n">${n} / ${c.quests.length}</span></div>
      ${open ? `<div class="q-list">${rows}</div>` : `<p class="note">${lockMsg}</p>`}
      <div class="jch-reward">🏅 ${has ? `<b>${E.TITLES[tk].name}</b> 칭호를 얻었어요` : `마치면 칭호 「${E.TITLES[tk].name}」`}${hb ? ` · 📖 숨은 레시피${has ? ` 「${E.BLENDS[hb].name}」` : ''}` : ''}</div></div>`;
  };
  const openHTML = chs.filter(x => x.open).map(x => card(x.c)).join('');
  return gradeHTML() + layerHTML() + bonusHTML() + weeklyHTML() + head('jTitles', '🏅', '칭호', got, E.TITLE_KEYS.length) + titlesHTML()
    + head('jQuests', '📜', '퀘스트', qDone, E.QUESTS.length)
    + (openHTML || '<p class="note">🌱 첫걸음을 마치면 1장이 열려요.</p>')
    + (closed.length ? foldBox('j-closed', `아직 열리지 않은 장 ${closed.length}개`, `<div class="stack">${closed.map(x => card(x.c)).join('')}</div>`) : '');
}
// 🌱 정원 등급 쪽 (P28-05-01, M1-4 10-28): 도감일지 맨 위 — 칭호 · 퀘스트처럼 "정원에서 한 일이 쌓인 곳"이라 같은 쪽에, 위 막대 🌱를 누르면 여기로
// 🐢 느긋하게 보기면 숫자를 빼고 이름 · 막대 · 등급 장식만 (판단은 E.gradeView의 slow = E.slowView 하나)
function gradeHTML() {
  const g = E.gradeView(st), slow = g.slow, pct = Math.floor(g.progress * 100), n = x => x.toLocaleString('ko-KR');
  const max = Math.max(1, ...g.sources.map(s => s.xp)), nd = g.nextDeco;
  const src = slow ? '' : `<div class="gr-src">${g.sources.map(s => `<span class="gr-row"><span>${s.ic} ${s.label}</span><i><b style="width:${Math.round(s.xp / max * 100)}%"></b></i><span class="data">${n(s.xp)}</span></span>`).join('')}</div>`;
  const decos = `<div class="gr-decos">${g.decos.map(d => `<span class="gr-deco ${d.open ? '' : 'locked'}" title="${esc(d.name)}${d.open ? ' · 화원에 있어요' : slow ? '' : ` · 정원 등급 ${d.grade}에 열려요`}">${decoImg(d.key, 2)}<small>${d.open ? esc(d.name) : slow ? '?' : `${d.grade}등급`}</small></span>`).join('')}</div>`;
  const next = nd ? (slow ? `다음 등급 장식은 「${esc(nd.name)}」` : `다음 등급 장식 「${esc(nd.name)}」 · ${nd.grade}등급 (경험치 ${n(g.nextDecoLeft)} 남음)`) : '등급 장식을 모두 열었어요';
  return `<div class="cab-head dex-head j-head" id="jGrade"><span class="sb-title">🌱 정원 등급</span>${slow ? '' : `<span class="dh-count data">${g.grade}등급</span>`}</div>
    <div class="card gr-card"><div class="gr-head"><b>${g.name}</b>${slow ? '<small>거두고 팔고 돌본 만큼 천천히 자라요</small>' : `<small class="data">경험치 ${n(g.xp)} · 다음 등급까지 ${n(g.left)}</small>`}</div>
      <div class="gr-bar" role="img" aria-label="${slow ? '다음 등급까지 차는 막대' : `다음 등급까지 ${pct}%`}"><b style="width:${pct}%"></b></div>
      ${src}${decos}
      <p class="note">🪴 ${next} · 열린 장식은 💐 화원에서 언제든 사요</p>
      ${slow ? '' : '<p class="note muted">정원에서 한 일만큼 쌓여요 · 돈으로 산 것은 세지 않아요</p>'}</div>`;
}
// 🌳 정원의 층 쪽 (P30-01-02, L1-2 10-30): 등급 쪽 바로 아래 · 손길 점 위 — 지금 층 · 1~4층 칩 · 다음 층 조건 두 줄 (값은 E.layerOf 그대로, 위 막대엔 넣지 않음)
// 🐢 느긋하게 보기면 남은 해 · 조건 숫자 · "n층" 대신 새싹 그림과 "다음 층은 아직 자라는 중이에요" 한 줄 (P30-08, 판단은 E.slowView 하나)
let layerArtURL = '';
function layerSprout(scale) {
  if (!layerArtURL) {
    const A = window.LAYER_ART.sprout, c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
    A.grid.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && A.pal[ch]) { x.fillStyle = A.pal[ch]; x.fillRect(i, j, 1, 1); } }));
    layerArtURL = c.toDataURL();
  }
  return `<img class="px" src="${layerArtURL}" width="${16 * scale}" height="${16 * scale}" alt="">`;
}
function layerHTML() {
  const o = E.layerOf(st), slow = E.slowView(st), N = o.next;
  const chips = `<div class="ly-chips">${o.layers.map(l => `<span class="ly-chip ${l.open ? 'on' : ''} ${l.layer === o.layer ? 'now' : ''}"${!l.open && slow ? ' role="img" aria-label="아직 안 열린 층"' : ''}><span aria-hidden="true">${l.open ? l.icon : '?'}</span>${l.open ? esc(l.name) : slow ? '' : `${l.layer}층`}</span>`).join('')}</div>`;
  const cond = (ok, ic, text) => `<div class="ly-cond ${ok ? 'ok' : ''}"><span aria-hidden="true">${ic}</span><span>${text}</span>${ok ? '<b class="ly-ok">✔</b>' : ''}</div>`;
  let next = '';
  if (!N) next = '<p class="note">모든 층을 열었어요</p>';
  else if (slow) next = `<div class="ly-slow">${layerSprout(2)}<span>다음 층은 아직 자라는 중이에요</span></div>`;
  else {
    const rows = N.how ? cond(false, N.icon, `${esc(N.how)} 열려요`)
      : cond(N.yearsLeft === 0, '🗓️', N.yearsLeft ? `${N.yearsLeft}해 더` : `${N.needYears}해가 지났어요`) + cond(N.dexOk, '📖', `꽃 도감 <span class="data">${N.dex} / ${N.needDex}</span>`);
    const when = N.ready ? (N.held ? '조건을 다 채웠어요 · 작은 숲은 곧 업데이트로 열려요' : '새해 3월 아침에 열려요') : N.how ? '' : '흐른 해는 쉬어도 쌓여요 · 새해 3월 아침에 열려요';
    next = `<div class="ly-next"><small>다음 층</small><b>${N.icon} ${N.layer}층 ${esc(N.name)}</b></div>${rows}${when ? `<p class="note muted">${when}</p>` : ''}`;
  }
  return `<div class="cab-head dex-head j-head" id="jLayer"><span class="sb-title">🌳 정원의 층</span>${slow ? '' : `<span class="dh-count data">${o.layer}층</span>`}</div>
    <div class="card ly-card"><div class="ly-head"><span class="ly-ic" aria-hidden="true">${o.icon}</span><b>${slow ? '' : `${o.layer}층 `}${esc(o.name)}</b></div>${chips}${next}</div>`;
}
// 🌟 손길 점 (P28-05-02-03, M3-2 10-29): 등급 쪽 바로 아래 — 5등급마다 1점으로 장치 · 저장고 · 따라잡기를 덜어 주는 4칸을 고름 (탭을 늘리지 않음)
// 🐢 느긋하게 보기면 숫자(남은 점 · 모은 점 · 단계 · 드는 점 · 다음 점까지 · 다음 단계)를 빼고 아이콘 · 이름 · 지금 설명 · 단추만 (판단은 E.slowView 하나)
function bonusHTML() {
  const v = E.bonusView(st), slow = E.slowView(st);
  const rows = v.rows.map(r => {
    const can = !r.maxed && r.costNext <= v.left;
    const why = r.maxed || can || slow ? '' : `<small class="bn-why">🌟 ${r.costNext - v.left}점이 더 있어야 올려요</small>`;
    return `<div class="bn-row ${r.maxed ? 'maxed' : ''}"><span class="bn-ic" aria-hidden="true">${r.icon}</span>
      <span class="bn-txt"><b>${esc(r.name)}${slow ? '' : ` <span class="bn-lv data">${r.level} / ${r.max}단계</span>`}${r.maxed ? ' <span class="bn-max">✨ 끝까지</span>' : ''}</b><small>${esc(r.desc)}</small>${!slow && r.nextDesc ? `<small class="bn-next">다음 단계: ${esc(r.nextDesc)}</small>` : ''}${why}</span>
      <span class="bn-btns">${r.maxed ? '' : `<button type="button" class="btn small primary" data-bonus="${r.key}" data-lv="${r.level + 1}"${can ? '' : ' disabled'}>올리기${slow ? '' : ` (🌟 ${r.costNext}점)`}</button>`}${r.level ? `<button type="button" class="btn small" data-bonus="${r.key}" data-lv="${r.level - 1}">내리기</button>` : ''}</span></div>`;
  }).join('');
  return `<div class="cab-head dex-head j-head" id="jBonus"><span class="sb-title">🌟 손길 점</span>${slow ? '' : `<span class="dh-count data">${v.left} / ${v.points}점</span>`}</div>
    <div class="card bn-card">${slow ? '' : `<p class="bn-sum"><b>남은 점 ${v.left}점</b><small class="data">모은 점 ${v.points}점 · ${v.nextAt}등급에 1점 더</small></p>`}${rows}
      <p class="note muted">${slow ? '정원이 자라면 손을 덜어 주는 보너스를 골라요' : `정원 등급 ${v.per}마다 1점 · 돈으로는 못 얻어요`} · 언제든 내리면 점이 돌아와요</p></div>`;
}
// 🗓️ 이번 주 목표 (P28-09, 10-28): 등급 쪽 바로 아래 — 끝내면 등급 경험치라 같은 자리에. 🐢 느긋하게 보기면 통째로 숨김 (E.weeklyView가 null)
const weekLeft = h => h >= 24 ? `${Math.floor(h / 24)}일` : h >= 1 ? `${Math.floor(h)}시간` : '곧';
function weeklyRows(v) {
  return v.goals.map(g => `<div class="wk-row ${g.done ? 'done' : ''}"><span class="wk-ic">${g.done ? '✅' : g.ic}</span><span class="wk-name">${esc(g.text)}<small>${g.tierName} · 🌱 +${g.xp}</small></span><span class="wk-n data">${g.got} / ${g.n}</span><i class="wk-bar" aria-hidden="true"><b style="width:${Math.round(g.got / g.n * 100)}%"></b></i></div>`).join('');
}
function weeklyHTML() {
  const v = E.weeklyView(st); if (!v) return '';
  return `<div class="cab-head dex-head j-head" id="jWeekly"><span class="sb-title">🗓️ 이번 주 목표</span><span class="dh-count data">${v.done} / ${v.goals.length}</span></div>
    <div class="card wk-card">${weeklyRows(v)}
      <p class="note">${v.bonus ? `🎉 셋 다 끝냈어요 · 덤 🌱 +${v.bonusXp}` : `셋 다 끝내면 덤 🌱 +${v.bonusXp}`} · 월요일 아침 6시에 새 목표로 바뀌어요 (${weekLeft(v.leftH / (st.speed || 1))} 남음)</p>
      <p class="note muted">주 안에 언제 해도 돼요 · 꽃잠에도 돼요 · 못 끝낸 목표는 그냥 사라져요</p></div>`;
}
function titlesHTML() {
  // 얻은 칭호는 펼쳐 두고, 못 얻은 칭호는 접어 둠 (10-17)
  const has = [...E.TITLE_KEYS, ...E.EXTRA_TITLE_KEYS].filter(k => st.titles[k] != null), not = E.TITLE_KEYS.filter(k => st.titles[k] == null);   // 덤 칭호(P20-16)는 얻었을 때만 보이고 수에는 안 셈
  return `<p class="note">칭호를 하나 골라 대표로 걸면 위 막대에 보여요. 숨은 칭호는 수수께끼를 풀어 보세요.</p>`
    + (has.length ? `<div class="ttl-grid">${has.map(titleCard).join('')}</div>` : '<p class="note">아직 얻은 칭호가 없어요. 아래 📜 퀘스트의 장을 마치면 얻어요.</p>')
    + (not.length ? foldBox('t-locked', `아직 얻지 못한 칭호 ${not.length}개`, `<div class="ttl-grid">${not.map(titleCard).join('')}</div>`) : '');
}
// 접기 상자: 펼친 상태는 다시 그려도 유지 (ui.fold)
const foldBox = (key, label, inner) => `<details class="fold" data-fold="${key}"${ui.fold[key] ? ' open' : ''}><summary>${label}</summary>${inner}</details>`;
// 도감 칸 묶음: 모은 칸은 그대로, 못 모은 칸(.locked)은 접기 상자로
function foldGrid(key, gridHTML) {   // 티백 · 차처럼 그리드가 여럿(꽃 + 블렌드)이어도 그리드마다 나눔
  const t = document.createElement('template'); t.innerHTML = gridHTML.trim();
  let shown = '', folded = '', n = 0;
  for (const el of [...t.content.children]) {
    const off = el.classList.contains('dexgrid') ? [...el.children].filter(c => c.classList.contains('locked')) : [];
    off.forEach(c => c.remove()); n += off.length;
    if (!off.length || el.children.length) shown += el.outerHTML;
    if (off.length) folded += `<div class="${el.className}">${off.map(c => c.outerHTML).join('')}</div>`;
  }
  return n ? shown + foldBox(key, `아직 못 모은 ${n}칸`, `<div class="stack" style="gap:8px">${folded}</div>`) : gridHTML;
}
function titleCard(k) {
  const T = E.TITLES[k], has = st.titles[k] != null, hidden = !T.chapter, ch = T.chapter && E.CHAPTERS.find(c => c.key === T.chapter), on = st.titleOn === k;
  const acct = k === 't_visit' && st.account && st.account.gave && st.account.firstVisit ? new Date(st.account.firstVisit) : null;   // P20-08 계정 날짜로 받은 첫 방문
  const sub = has ? `${hidden ? `${T.cond} · ` : ''}${acct ? `${acct.getFullYear()}년 ${acct.getMonth() + 1}월 ${acct.getDate()}일 · 계정 첫 방문` : absText(st.titles[k])}` : hidden ? `“${T.hint}”` : `${ch.no}장 ${ch.name}을 마치면`;
  return `<div class="ttl-card t-${T.tier} ${has ? '' : 'locked'} ${on ? 'on' : ''}">${titleImg(k, 66, !has)}<b>${has || !hidden ? T.name : '???'}</b><span class="ttl-tier">${TIER_NAME[T.tier]}${T.extra ? ' · 덤 칭호' : hidden ? ' · 숨은 칭호' : ''}</span><small>${sub}</small>${has ? `<button type="button" class="btn small" data-ttlon="${on ? '' : k}">${on ? '대표 내리기' : '대표로 걸기'}</button>` : ''}</div>`;
}
// 얻을 때 연출 (P19-05-06): 문장이 위에서 아래로 한 줄씩 그려진 뒤 테두리가 켜짐
function showNewTitles() {
  if (!st._newTitles || !st._newTitles.length || $('#modalRoot').innerHTML) return;
  if (E.slowView(st)) { st._newTitles = []; return; }   // 🐢 느긋하게 보기: 켜기 전에 쌓인 창도 띄우지 않음 — 칭호는 도감에 이미 있음 (P28-02)
  if (ui.titleHold && performance.now() < ui.titleHold) return;   // 첫 화분을 먼저 보고 (QA 6회차)
  if (st._newTitles[0] === 't_visit') {            // 첫 방문 칭호는 창 대신 알림 한 줄 — 첫 화면을 화분과 첫걸음에 (QA 15회차)
    st._newTitles.shift(); queueToast('🏅 새 칭호 「정원 문을 연 사람」 · 문장 장식은 📦 창고에'); save(); return showNewTitles();
  }
  const k = st._newTitles.shift(), T = E.TITLES[k], ch = T.chapter && E.CHAPTERS.find(c => c.key === T.chapter), hb = hiddenBlendOf(k);
  openModal('🏅 새 칭호', `<div class="ttl-pop t-${T.tier}"><canvas width="22" height="22" id="ttlAnim" class="ttl-anim" role="img" aria-label="${esc(T.name)} 칭호 문장"></canvas>
    <b>${T.name}</b><span class="ttl-tier">${TIER_NAME[T.tier]}${T.extra ? ' · 덤 칭호' : T.chapter ? '' : ' · 숨은 칭호'}</span><small>${ch ? (ch.no === 0 ? '도리의 정원에 처음 왔어요' : `${ch.no}장 ${ch.name}을 마쳤어요`) : T.cond}</small>
    ${hb ? `<p class="note">📖 숨은 레시피 「${E.BLENDS[hb].name}」이(가) 제다실 레시피에 생겼어요</p>` : ''}<p class="note">🪴 「${T.name} 문장」${k === 't_cloud' ? ' · 구름 돌' : ''} 장식이 📦 창고에 들어왔어요</p></div>`,
    [{ label: '닫기', act: () => { closeModal(); save(); showNewTitles(); } }, { label: '대표로 걸기', primary: true, act: () => { E.setTitleOn(st, k); closeModal(); save(); renderAll(true); } }]);
  const x = $('#ttlAnim').getContext('2d'); let r = 0;
  const tick = () => { if (!$('#ttlAnim')) return; TITLE_ART.draw(x, k, T.tier, { rows: r }); if (r++ < 16) setTimeout(tick, 38); };
  tick();
  save();
}
// 상태창 "오늘의 한 마디" (게임을 위해 새로 쓴 문장)
const GARDEN_WORDS = [
  '꽃은 서두르지 않아요. 그래도 늘 제때 피어요.',
  '오늘 심은 씨앗은 오늘의 나를 믿는다는 뜻이에요.',
  '천천히 자라는 것도 자라는 거예요.',
  '꽃이 핀 자리에는 누군가의 기다림이 있어요.',
  '물을 주는 동안, 마음도 함께 촉촉해져요.',
  '시든 꽃도 땅에 돌아가 다음 꽃을 키워요.',
  '작은 새싹 하나가 땅의 빛깔을 바꿔요.',
  '바람이 부는 날에도 뿌리는 조용히 자라요.',
  '모든 꽃이 봄에 피지는 않아요. 저마다의 계절이 있어요.',
  '쉬어 가는 날의 정원도 여전히 아름다워요.',
  '오늘 거둔 꽃잎 한 장이 내일의 차 한 잔이 돼요.',
  '흙을 만지면 마음이 낮고 따뜻해져요.',
  '피지 않은 꽃봉오리에도 이미 향기가 있어요.',
  '잡초를 뽑는 시간은 마음을 고르는 시간이에요.',
  '빈 땅은 비어 있는 게 아니라 기다리고 있는 거예요.',
  '꽃은 남과 견주지 않고, 그저 자기 빛깔로 피어요.',
  '한 해를 돌보면, 정원이 나를 기억해요.',
  '느리게 걷는 사람만 보이는 꽃이 있어요.',
  '겨울에 피는 꽃은 추위 속에서도 다정해요.',
  '오늘 하루도 정원과 함께 잘 지냈어요.',
  '햇살 한 줌, 물 한 모금이면 충분할 때가 있어요.',
  '꽃이 지는 건 끝이 아니라 씨앗이 되는 시간이에요.',
  '좋아하는 꽃 곁에는 좋아하는 땅이 생겨요.',
  '잠든 정원도 꿈속에서 봄을 준비해요.',
];
// 달마다 제철 꽃의 꽃말과 한 마디 (10-06). 꽃말은 흔히 알려진 것, own: true는 널리 알려진 꽃말이 없어 정원에서 붙인 것
const FLOWER_WORDS = {
  maehwa: { lang: '고결한 마음 · 인내', words: ['추위가 다 가시지 않아도 매화는 피어요. 오늘의 나도 충분히 피어날 수 있어요.', '기다림을 견딘 꽃이 가장 먼저 봄을 알려요.'] },
  chamomile: { lang: '역경 속의 힘', words: ['밟혀도 다시 일어서는 캐모마일처럼, 오늘의 나도 다시 피어나요.', '힘든 날에도 작은 꽃은 사과 향을 잃지 않아요.'] },
  rose: { lang: '사랑 · 아름다움', words: ['나를 아끼는 마음도 사랑이에요. 오늘은 나에게 장미 한 송이를.', '가시가 있어도 장미는 아름다워요. 모난 마음도 나의 일부예요.'] },
  lavender: { lang: '기다림 · 내게 대답해 주세요', words: ['대답이 늦어도 괜찮아요. 라벤더는 조용히 기다리며 향을 남겨요.', '말없이 곁에 있어 주는 것도 다정한 대답이에요.'] },
  lotus: { lang: '깨끗한 마음', words: ['흙탕물 속에서도 연꽃은 맑게 피어요. 내 마음도 다시 맑아질 수 있어요.', '흐린 날을 지나온 마음이 가장 깨끗하게 피어요.'] },
  jasmine: { lang: '상냥함 · 사랑스러움', words: ['작은 상냥함 하나가 하루를 향기롭게 해요.', '밤에 더 짙어지는 재스민처럼, 어두운 날에도 나의 다정함은 남아 있어요.'] },
  bpea: { lang: '새로운 빛깔', own: true, words: ['레몬 한 방울에 파랑이 보라로 바뀌듯, 작은 일 하나로 하루가 달라져요.'] },
  marigold: { lang: '반드시 오고야 말 행복', words: ['행복은 늦게 와도 반드시 와요. 메리골드가 그렇게 말해요.', '오늘이 흐려도 괜찮아요. 금빛 꽃은 가을까지 피어 있어요.'] },
  hibiscus: { lang: '섬세한 아름다움', words: ['섬세한 마음은 약한 게 아니라 아름다운 거예요.', '하루만 피는 꽃도 온 힘을 다해 붉어요.'] },
  celosia: { lang: '건강 · 시들지 않는 사랑', words: ['몸과 마음이 건강한 것, 그게 가장 큰 꽃이에요.', '맨드라미는 말라도 빛깔이 남아요. 진심도 그래요.'] },
  gamguk: { lang: '성실 (국화)', words: ['늦가을에 피는 꽃은 서두르지 않았을 뿐이에요.', '찬 서리에도 감국은 노랗게 웃어요. 성실한 하루는 빛이 나요.'] },
  dongbaek: { lang: '누구보다 그대를 사랑합니다', words: ['가장 추운 날 피는 꽃이 가장 따뜻한 마음을 전해요.', '동백은 꽃송이째 떨어져요. 끝까지 나답게 살아도 괜찮아요.'] },
  napmae: { lang: '자애', words: ['한겨울의 노란 꽃처럼, 나에게 먼저 다정해지기로 해요.', '추운 날에도 향은 멀리 가요. 작은 친절도 그래요.'] },
};
// 달마다 제철 꽃 (게임에서 그달에 피는 꽃 위주, 4월은 심는 철인 캐모마일, 꽃잠은 겨울 꽃)
const MONTH_FLOWERS = { 3: ['maehwa'], 4: ['chamomile'], 5: ['rose', 'chamomile'], 6: ['lavender', 'rose'], 7: ['lotus', 'jasmine', 'bpea'], 8: ['marigold', 'jasmine', 'lotus'], 9: ['marigold', 'hibiscus', 'celosia'], 10: ['celosia', 'gamguk', 'hibiscus'], 11: ['gamguk', 'celosia'], 12: ['dongbaek'], 1: ['napmae', 'dongbaek'], 2: ['maehwa', 'napmae', 'dongbaek'], 13: ['napmae'], 14: ['maehwa'] };
function monthWord(cal) {          // 그달 꽃들의 한 마디를 게임 하루(현실 48분)마다 돌아가며
  const list = (MONTH_FLOWERS[cal.month] || []).flatMap(k => FLOWER_WORDS[k].words.map(w => ({ k, w })));
  return list.length ? list[(cal.day - 1) % list.length] : null;
}
function renderTop() {
  const cal = E.calendar(st.virtual);
  const info = yearInfo(cal), ti = $('#topInfo'); if (ti.textContent !== info) ti.textContent = info;
  const tt = $('#topTitle'), tk = st.titleOn || '';   // P19-05-05 대표 칭호
  if (tt.dataset.k !== tk) { tt.dataset.k = tk; tt.hidden = !tk; tt.innerHTML = tk ? `${titleImg(tk, 22, false)}<span>${E.TITLES[tk].name}</span>` : ''; }
  const sb = E.seasonBadge(st), ts = $('#topSeason'), sk = sb ? String(sb.n) : '';   // 🌸 새 철 (P28-08-05): 1철이면 없음 · 느긋하게 보기여도 보임(숫자가 아니라 이름) · 640px 이하는 "🌸 2"
  if (ts.dataset.k !== sk) { ts.dataset.k = sk; ts.hidden = !sb; ts.title = sb ? `${sb.n}철 정원` : ''; ts.innerHTML = sb ? `<span class="ts-l">${sb.text}</span><span class="ts-s">🌸 ${sb.n}</span>` : ''; }
  const gb = E.gradeBadge(st), tg = $('#topGrade'), gk = gb ? `${gb.grade}|${gb.pct}` : '';   // 🌱 정원 등급 (P28-05-01, M1-4) · 느긋하게 보기면 null → 숨김
  if (tg.dataset.k !== gk) { tg.dataset.k = gk; tg.hidden = !gb; tg.title = gb ? `정원 등급 ${gb.grade} · ${gb.name} · 다음 등급까지 ${gb.pct}% · 눌러서 등급 보기` : ''; tg.innerHTML = gb ? `🌱<span class="tg-name">${gb.name}</span><span class="tg-n">${gb.grade}</span><i class="tg-bar" aria-hidden="true"><b style="width:${gb.pct}%"></b></i>` : ''; }
  if (document.documentElement.dataset.season !== String(cal.season)) { document.documentElement.dataset.season = cal.season; requestAnimationFrame(() => document.documentElement.classList.add('season-anim')); }   // 계절 바탕색
  cloudTop();                                       // ☁️ 드라이브 저장 표시 (P20-04-02, 로그인했을 때만)
}

// ---------------------------------------------------------------- 탭 (P16-02)
document.querySelectorAll('nav.tabs button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
$('#brandBtn').addEventListener('click', () => { setTab('garden'); window.scrollTo({ top: 0, behavior: 'smooth' }); });   // 상단 로고 → 정원 (10-17)
$('#topTitle').addEventListener('click', () => { ui.dexTab = 'journal'; setTab('dex'); });
$('#topGrade').addEventListener('click', () => { ui.dexTab = 'journal'; setTab('dex'); window.scrollTo({ top: 0 }); });   // 🌱 → 도감일지 맨 위 등급 쪽
$('#restBanner').addEventListener('click', e => { if (e.target.closest('[data-rest="close"]')) { st.restClosed = E.calendar(st.virtual).week; save(); $('#restBanner').hidden = true; } });
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]'); if (!go) return;
  if (go.dataset.go === 'rec') { ui.dexTab = 'rec'; return setTab('dex'); }
  setTab(go.dataset.go);
});
function setTab(t, keepTool) {
  ui.tab = t;
  if (t === 'garden' && !keepTool) { ui.tool = 'look'; ui.moveFrom = null; }   // 정원은 늘 관찰에서 시작
  document.querySelectorAll('nav.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + t));
  ui.sigs = {};
  $('#feedbackTop').hidden = true; $('#snack').hidden = true; $('#tip').hidden = true;
  renderAll(true);
  if (t === 'garden') { resize(); ui.noShiftUntil = performance.now() + 800; }   // 탭을 바꿔 지도가 새로 보일 땐 밀림으로 치지 않음 (QA 18회차)
}
