// 도리의 정원 — 화면: 🌳 작은 숲 (P30-03 · P30-01-03, L3-2 10-30) — app-teashop 다음 · app-dex 앞에 불림 (openModal · closeModal은 누를 때만 써서 뒤 파일 것이어도 됨)
'use strict';
// ---------------------------------------------------------------- 🌳 작은 숲 (P30-03)
// 4층이 열리면 탭 줄에 🌳 숲 탭이 생김(그 전엔 hidden). 나무 자리 6칸(3 × 2) — 빈 자리를 눌러 묘목을 고르고 돈으로 심음, 나무를 누르면 자라는 차례
// 그림은 decos.js TREE_ART(묘목 · 어린나무 16×16, 나무 · 큰 나무 32×32)를 정수배로만: 묘목 ×2 · 어린나무 ×3 · 나무 ×2 · 큰 나무 ×3 → 32 · 48 · 64 · 96px
// 🐢 느긋하게 보기면 단계 이름 · "n해 더" · 숲 도감 n / 24를 빼고 그림 · 이름 · "자라는 중이에요" 한 줄만 (P30-08, 판단은 E.slowView 하나)
const TREE_SCALE = [2, 3, 2, 3], TREE_SMALL = [2, 3, 2, 2];   // 숲 자리 32 · 48 · 64 · 96px · 도감 · 차례 줄 32 · 48 · 64 · 64px
const treeCache = {};
function treeURL(k, stage, season) {
  const id = `${k}|${stage}|${season}`; if (treeCache[id]) return treeCache[id];
  const A = window.TREE_ART, grid = A.grid(k, stage), pal = A.pal(k, stage, season), n = grid.length;
  const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d');
  grid.forEach((row, j) => [...row].forEach((ch, i) => { const col = ch !== '.' && pal[ch]; if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } }));
  return (treeCache[id] = c.toDataURL());
}
const treeSeason = () => Math.min(3, E.calendar(st.virtual).season);   // 꽃잠(4)은 겨울 그림
function treeImg(k, stage, scale, season) {
  const n = window.TREE_ART.grid(k, stage).length, s = scale || TREE_SCALE[stage];
  return `<img class="px" src="${treeURL(k, stage, season == null ? treeSeason() : season)}" width="${n * s}" height="${n * s}" alt="${esc(`${E.TREES[k].name} ${E.TREE_STAGES[stage]}`)}">`;
}
// 탭 줄의 🌳 숲 단추: 4층이 열린 정원에만 (renderAll마다 — 열리는 순간 · 새 철 · 불러오기 뒤에도 맞게)
function forestTabSync() {
  const b = document.querySelector('nav.tabs button[data-tab="forest"]'), open = E.forestOpen(st);
  if (b && b.hidden === open) b.hidden = !open;
  if (!open && ui.tab === 'forest') setTab('garden');
}
function renderForest(force) {
  const cal = E.calendar(st.virtual), f = E.forestOf(st), season = treeSeason(), vs = E.forestVisitors(st, cal), slow = f.slow;
  const sig = JSON.stringify([st.forest, season, slow, st.money, vs.map(v => [v.key, v.slot, v.line])]);
  if (!force && ui.sigs.forest === sig) return;
  ui.sigs.forest = sig;
  if (!f.open) { $('#p-forest').innerHTML = '<div class="cab-empty"><span>🌳</span><div><b>작은 숲은 4층이 열리면 생겨요</b></div></div>'; return; }
  const cells = f.slots.map((t, i) => {
    if (!t) return `<button type="button" class="fo-slot empty" data-fslot="${i}" aria-label="빈 자리 · 눌러서 묘목 심기"><span class="fo-art"><span class="fo-plus" aria-hidden="true">＋</span></span><span class="fo-name">빈 자리</span><span class="fo-sub">눌러서 심기</span></button>`;
    const v = vs.find(x => x.slot === i);
    const vis = v ? `<span class="fo-vis ${v.key === 'tit' ? 'up' : ''}" title="${esc(`${v.icon} ${v.name} · ${v.line}`)}">${visitorImg(v.key, 2)}</span>` : '';
    const sub = slow ? (t.big ? '다 자랐어요' : '자라는 중이에요') : t.big ? `${t.stageName} · 다 자랐어요` : `${t.stageName} · ${t.yearsLeft}해 더`;
    return `<button type="button" class="fo-slot" data-ftree="${i}"><span class="fo-art">${treeImg(t.key, t.stage)}${vis}</span><span class="fo-name">${t.icon} ${esc(t.name)}</span><span class="fo-sub">${sub}</span></button>`;
  }).join('');
  const guests = vs.map(v => `<p class="note">${v.icon} ${esc(josa(v.name, '이/가'))} ${esc(v.where)}에 있어요 · “${esc(v.line)}”</p>`).join('');
  $('#p-forest').innerHTML = `<div class="stack">
    <div class="cab-head"><span class="sb-title">🌳 작은 숲</span>${slow ? '' : `<span class="dh-count data">숲 도감 ${f.dex} / ${f.total}</span>`}</div>
    <div class="fo-grid">${cells}</div>${guests}
    <p class="note muted">${slow ? '나무는 해가 바뀔 때마다 천천히 자라요' : '해가 바뀔 때마다(새해 3월 아침) 한 단계씩 자라요 · 묘목 → 어린나무 → 나무 → 큰 나무'} · 물 · 돌봄 없이 자라고 시들지 않아요 · 심은 나무는 그 자리에 있어요</p></div>`;
}
// 빈 자리 → 묘목 고르기 (값은 E.TREES, 심기는 E.plantTree — 돈만 나감)
function openPlantPicker(slot) {
  const rows = E.TREE_KEYS.map(k => { const T = E.TREES[k], short = st.money < T.price;
    return `<div class="decocard"><span class="dk-art">${treeImg(k, 0, 3, 1)}</span><span class="dk-main"><b>${T.icon} ${esc(T.name)}</b><small>${esc(T.desc)}</small></span>
      <span class="dk-buy"><span class="sc-price">${won(T.price)}</span><button type="button" class="btn primary" data-fplant="${k}" ${short ? 'disabled' : ''}>${short ? '잔액 부족' : '심기'}</button></span></div>`; }).join('');
  openModal('🌳 묘목 심기', `<div class="fo-pick">${rows}</div><p class="note muted">한 번 심은 나무는 옮기거나 베지 않아요 · 열매 · 돈은 나오지 않아요 · ${wallet()}</p>`, [{ label: '닫기', act: () => closeModal() }]);
  const root = $('#modalRoot'), base = root.onclick;
  root.onclick = e => { const b = e.target.closest('[data-fplant]'); if (b && !b.disabled) { closeModal(); return after(E.plantTree(st, b.dataset.fplant, slot, ctx), null); } base(e); };
}
// 나무 → 자라는 차례 (4단계 그림, 아직 안 온 단계는 흐리게) · 앉은 손님 말 한 줄
function openTreeInfo(slot) {
  const t = E.forestOf(st).slots[slot]; if (!t) return;
  const slow = E.slowView(st), v = E.forestVisitors(st).find(x => x.slot === slot);
  const strip = E.TREE_STAGES.map((name, s) => `<span class="mn-item" style="${s > t.stage ? 'opacity:.35' : ''}">${treeImg(t.key, s, TREE_SMALL[s])}<small><b>${name}</b></small></span>`).join('');
  openModal(`${t.icon} ${t.name}`, `<div class="mn-flow" style="align-items:flex-end;justify-content:center">${strip}</div>
    <p class="note" style="text-align:center">${slow ? (t.big ? '다 자랐어요' : '자라는 중이에요') : t.big ? '큰 나무로 다 자랐어요' : `지금 ${t.stageName} · ${t.yearsLeft}해 더 자라면 큰 나무예요`}</p>
    ${v ? `<p class="note" style="text-align:center">${visitorImg(v.key, 2)}<br>${v.icon} ${esc(v.name)} · “${esc(v.line)}”</p>` : t.big ? '<p class="note muted" style="text-align:center">큰 나무엔 가끔 손님이 와 앉아요</p>' : ''}
    <p class="note muted" style="text-align:center">${esc(E.TREES[t.key].desc)}</p>`, [{ label: '닫기', act: () => closeModal() }]);
}
$('#p-forest').addEventListener('click', e => {
  const s = e.target.closest('[data-fslot]'); if (s) return openPlantPicker(+s.dataset.fslot);
  const t = e.target.closest('[data-ftree]'); if (t) return openTreeInfo(+t.dataset.ftree);
});
