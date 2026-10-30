// 도리의 정원 — 화면: 🐝 곤충농장 (P32-03, 10-30) — app-forest 다음 · app-dex 앞에 불림 (bonusHTML · pantryAllBtn은 앞 파일, showAway · openModal은 누를 때만 써서 뒤 파일 것이어도 됨)
'use strict';
// ---------------------------------------------------------------- 🐝 곤충농장 (P32)
// 흩어져 있던 자동 기능을 한 탭에: 일꾼 6(🐜 개미 · 🐛 누에 · 🦋 나비 · 🐝 꿀벌 · 🐌 달팽이 · 🐞 무당벌레) · 🧺 저장고 · 🌟 손길 점 · 🌙 자리를 비운 동안
// 고르는 일은 엔진 farmOf만 — 데려오기는 buyDeco, 놓기는 창고와 같은 정원 놓기 모드, 저장고 · 손길 점은 원래 렌더 그대로 (화원 · 창고 · 도감일지에서도 됨)
// 🐢 느긋하게 보기면 숫자(포기 · 장 · 잔 · 주 · 등급)를 빼고 그림 · 이름 · 말만 (판단은 엔진 slow 하나). 그림은 움직이지 않음
const insectCache = {};
function insectURL(k) {
  if (insectCache[k]) return insectCache[k];
  const S = window.INSECT_ART[k]; if (!S) return '';
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
  S.grid.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && S.pal[ch]) { x.fillStyle = S.pal[ch]; x.fillRect(i, j, 1, 1); } }));
  return (insectCache[k] = c.toDataURL());
}
const insectImg = (k, scale) => { const w = E.FARM.find(f => f.key === k); return `<img class="px" src="${insectURL(k)}" width="${16 * (scale || 2)}" height="${16 * (scale || 2)}" alt="${esc(w ? w.name : '')}">`; };   // 16px 정수배 (P16-14)
function farmCard(w, slow) {
  const say = `<span class="fm-say">“${esc(w.line)}”</span>`;
  const sub = w.deco && w.deco !== w.name ? ` <small class="muted">· ${esc(w.deco)}</small>` : '';
  const working = w.state === 'placed' || w.state === 'auto';   // 일하는 일꾼은 말풍선을 끝에 · 🐢 느긋하게 보기면 설명(숫자 든 규칙) 대신 말 한 줄
  let info = '', act = '';
  if (w.state === 'locked') act = `<span class="muted fm-when">🔒 ${esc(w.when)}</span>`;
  else if (w.state === 'shop') act = `<button type="button" class="btn primary" data-fbuy="${w.key}"${st.money < w.price ? ' disabled' : ''}>${st.money < w.price ? '잔액 부족' : `💐 ${won(w.price)}에 데려오기`}</button>`;
  else if (w.state === 'stored') { info = `<small class="fm-work">📦 창고에서 쉬고 있어요</small>`; act = `<button type="button" class="btn primary" data-fplace="${w.storedId}">🪴 정원에 놓기</button>`; }
  else if (w.state === 'placed') {
    const where = w.placed.map(p => `(${p.x + 1}, ${p.y + 1})`).join(' · ');
    info = slow ? '' : `<small class="fm-work">📍 ${where} · ${esc(w.work)}${w.didText ? ` · 지난달 ${esc(w.didText)}` : ''}</small>`;
    act = (w.stored ? `<button type="button" class="btn small primary" data-fplace="${w.storedId}">🪴 하나 더 놓기</button>` : '')
      + (w.canBuy && !w.one ? `<button type="button" class="btn small" data-fbuy="${w.key}"${st.money < w.price ? ' disabled' : ''}>💐 ${won(w.price)} 하나 더</button>` : '');
    info += say;
  } else {                                          // auto: 🐞 무당벌레 (사는 게 아님)
    info = (slow ? '' : `<small class="fm-work">🌳 작은 숲에서 왔어요 · ${esc(w.work)}${w.didText ? ` · 지난달 ${esc(w.didText)}` : ''}</small>`) + say;
  }
  return `<div class="decocard fm-card ${w.state}"><span class="dk-art">${insectImg(w.key, 3)}</span>
    <span class="dk-main"><b>${w.icon} ${esc(w.name)}${sub}</b>${slow ? (working ? '' : say) : `<small>${esc(w.desc)}</small>`}${info}</span>
    <span class="dk-buy">${act}</span></div>`;
}
function farmAwayHTML(c, slow) {
  const last = c.last ? `<button type="button" class="btn small" data-faway="1">🌙 지난번 비운 동안 다시 보기${slow ? '' : ` <span class="muted">(${c.last.h >= 48 ? `${Math.round(c.last.h / 24)}일` : `${Math.round(c.last.h)}시간`})</span>`}</button>` : '<p class="note muted">3시간 넘게 비웠다 오면 그동안 한 일을 한 장으로 보여 줘요</p>';
  return `<div class="cab-head"><span class="sb-title">🌙 자리를 비운 동안</span></div>
    <div class="card fm-away"><p class="note">${slow ? '오래 비워도 다시 열면 그동안 흐른 시간을 따라잡아요' : `오래 비워도 다시 열면 ${c.weeks}주까지 따라잡아요 · 🌟 따라잡기 길게로 늘려요`}</p>${last}</div>`;
}
// P27 🔆 정원 장치 (10-30 화원에서 옮김): 늘 팖 · 다 자라기까지 걸리는 시간만 줄임
function renderFarm(force) {
  const f = E.farmOf(st), slow = f.slow;
  const sig = JSON.stringify([f, st.money]);
  if (!force && ui.sigs.farm === sig) return;
  ui.sigs.farm = sig;
  $('#p-farm').innerHTML = `<div class="stack farm">
    <div class="cab-head"><span class="sb-title">🐝 곤충농장</span><span class="muted">정원 일을 도와주는 작은 일꾼들</span></div>
    <p class="note fm-month">${esc(f.month)}</p>
    <div class="decoshop fm-grid">${f.workers.map(w => farmCard(w, slow)).join('')}</div>
    ${bonusHTML('fBonus')}
    ${farmAwayHTML(f.catchup, slow)}
    <p class="note muted fm-foot">일꾼은 사람이 하던 손을 덜 뿐, 더 벌지는 않아요 · 켜 두지 않아도 일해요 · 🧺 저장고 · 🔆 장치는 ⛏️ 광산에 있어요</p></div>`;
}
$('#p-farm').addEventListener('click', e => {
  const b = e.target.closest('[data-fbuy]'); if (b && !b.disabled) return askDeco(b.dataset.fbuy);   // 사기 전 확인 (askBuy, app-shop)
  const p = e.target.closest('[data-fplace]'); if (p) { ui.tool = 'deco'; ui.decoId = +p.dataset.fplace; return setTab('garden', true); }   // 창고 🪴 놓기와 같은 흐름
  const bn = e.target.closest('[data-bonus]'); if (bn) return after(E.bonusSet(st, bn.dataset.bonus, +bn.dataset.lv));   // 🌟 손길 점 — 도감일지와 같은 엔진 함수
  if (e.target.closest('[data-faway]') && st.awayLast) { awayInfo = Object.assign({}, st.awayLast, { again: true }); showAway(); }
});
