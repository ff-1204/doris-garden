// 도리의 정원 — 화면: 🐝 곤충농장 (P32-03, 10-30) — app-forest 다음 · app-dex 앞에 불림 (showAway · openModal은 누를 때만 써서 뒤 파일 것이어도 됨)
'use strict';
// ---------------------------------------------------------------- 🐝 곤충농장 (P32)
// 흩어져 있던 자동 기능을 한 탭에: 곤충 7(P39 — 🐌 달팽이 · 🐜 개미 · 🐞 무당벌레 · 🪱 지렁이 · 🐛 누에 · 🐝 꿀벌 · 🦋 나비, 모두 놓은 자리 둘레 꽃을 도움) · 🌼 꽃가루 · 기르기(P37) · 🌙 자리를 비운 동안
// 고르는 일은 엔진 farmOf만 — 데려오기는 buyDeco, 놓기는 창고와 같은 정원 놓기 모드, 기르기는 bonusSet (🧺 입구 선반 · 🔆 장치는 ⛏️ 광산 탭)
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
// P37 🌼 일꾼 기르기 (10-31): 카드마다 단계 점(●●○) · "🌼 기르기 n단계 · 다음: 이름 — 값 (꽃가루 n알)" · 먹이기 · 다시 어리게
// 🐢 느긋하게 보기면 단계 · 꽃가루 · 다음 값을 숨기고 "조금 더 부지런해요"만 (기르기 전엔 말 없이 단추만)
// 아직 데려오지 않은 곤충(🔒 · 💐)은 먹이기를 막음 — 꽃가루를 미리 쓰는 헷갈림 막기 (P37 검토)
const growDots = r => r.worker   // P39-12-02 곤충: 단계 점 3개(둘레 1 · 2 · 3칸) · "둘레 n칸"
  ? `<span class="fm-dots" aria-label="둘레 ${r.level + 1}칸 · 기르기 ${r.level} / ${r.max}단계">${'●'.repeat(r.level + 1)}${'○'.repeat(r.max - r.level)} 둘레 ${r.level + 1}칸</span>`
  : `<span class="fm-dots" aria-label="기르기 ${r.level} / ${r.max}단계">${r.max > 4 ? `${r.level} / ${r.max}` : `${'●'.repeat(r.level)}${'○'.repeat(r.max - r.level)}`}</span>`;   // P38 8단계(🐜 · 🐛)는 점 대신 "n / 8"
function growHTML(r, left, slow, away) {
  if (!r || !r.open) return '';
  const can = !away && !r.maxed && r.costNext <= left;
  const text = slow ? (r.level ? (r.worker ? '🌼 둘레가 넓어졌어요' : '🌼 조금 더 부지런해요') : '🌼 꽃가루를 먹이면 자라요')
    : r.maxed ? `🌼 기르기 ${r.level}단계 · ✨ 다 자랐어요 — ${r.desc}`
    : `🌼 기르기 ${r.level}단계 · 다음: ${r.name} — ${r.nextDesc} (꽃가루 ${r.costNext}알)`;
  const why = r.maxed || can ? '' : away ? '<small class="muted">데려오면 길러요</small>' : slow ? '' : `<small class="bn-why">꽃가루 ${r.costNext - left}알이 더 있어야 해요</small>`;
  return `<div class="fm-grow${r.maxed ? ' maxed' : ''}"><span class="fm-gtxt"><small>${esc(text)}</small>${why}</span>
    <span class="bn-btns">${r.maxed ? '' : `<button type="button" class="btn small primary" data-bonus="${r.key}" data-lv="${r.level + 1}"${can ? '' : ' disabled'}>먹이기</button>`}${r.level ? `<button type="button" class="btn small" data-bonus="${r.key}" data-lv="${r.level - 1}">다시 어리게</button>` : ''}</span></div>`;
}
function pollenHead(v, slow) {
  return `<p class="note fm-pollen">${slow ? '🌼 정원이 자라면 꽃가루가 생겨요 · 일꾼에게 먹이면 자라요' : `🌼 꽃가루 남은 <b class="data">${v.left}알</b> · 모은 ${v.points}알 · 다음 알은 등급 ${v.nextAt}`}</p>`;
}
const OTHER_SLOW = { pantry: '입구 선반에 작은 것이 쌓여요', catchup: '오래 비워도 따라잡아요' };   // 🐢 느긋하게 보기면 숫자 없는 말 (P37 검토)
function farmOtherHTML(v, slow) {                  // 🧺 입구 선반 · 🌙 따라잡기 — 일꾼이 아니라 카드 아래 작은 줄 둘
  const rows = v.rows.filter(r => !r.worker).map(r => `<div class="fm-other"><span class="bn-ic" aria-hidden="true">${r.icon}</span><span class="fm-otxt"><b>${esc(r.who.replace(/^\S+ /, ''))}${slow ? '' : ` ${growDots(r)}`}</b><small>${esc(slow ? OTHER_SLOW[r.key] || '' : r.desc)}</small></span>${growHTML(r, v.left, slow)}</div>`).join('');
  return `<div class="cab-head"><span class="sb-title">🌼 그 밖에</span><span class="muted">곤충은 아니지만 꽃가루로 자라요</span></div><div class="card fm-others">${rows}</div>`;
}
function farmCard(w, slow) {
  const say = `<span class="fm-say">“${esc(w.line)}”</span>`;
  const sub = w.deco && w.deco !== w.name ? ` <small class="muted">· ${esc(w.deco)}</small>` : '';
  const working = w.state === 'placed';   // 일하는 곤충은 말풍선을 끝에 · 🐢 느긋하게 보기면 설명 대신 말 한 줄
  let info = '', act = '';
  if (w.state === 'locked') act = `<span class="muted fm-when">🔒 ${esc(w.when)}</span>`;
  else if (w.state === 'shop') act = `<button type="button" class="btn primary" data-fbuy="${w.key}"${st.money < w.price ? ' disabled' : ''}>${st.money < w.price ? '잔액 부족' : `💐 ${won(w.price)}에 데려오기`}</button>`;
  else if (w.state === 'stored') { info = `<small class="fm-work">📦 창고에서 쉬고 있어요</small>`; act = `<button type="button" class="btn primary" data-fplace="${w.storedId}">🪴 정원에 놓기</button>`; }
  else if (w.state === 'placed') {
    const where = w.placed.map(p => `(${p.x + 1}, ${p.y + 1})`).join(' · ');
    info = slow ? `<small class="fm-work">🌿 ${esc(w.work)}</small>` : `<small class="fm-work">📍 ${where} · ${esc(w.work)}${w.didText ? ` · 지난달 ${esc(w.didText)}` : ''}</small>`;   // P39-12-01 "둘레 1칸 · 꽃 6포기에 비료" · 🐢 "둘레 꽃의 흙이 기름져요"
    act = (w.stored ? `<button type="button" class="btn small primary" data-fplace="${w.storedId}">🪴 하나 더 놓기</button>` : '')
      + (w.canBuy && !w.one ? `<button type="button" class="btn small" data-fbuy="${w.key}"${st.money < w.price ? ' disabled' : ''}>💐 ${won(w.price)} 하나 더</button>` : '');
    info += say;
  }
  const g = w.grow;
  return `<div class="decocard fm-card ${w.state}"><span class="dk-art">${insectImg(w.key, 3)}</span>
    <span class="dk-main"><b>${w.icon} ${esc(w.name)}${sub}${g && g.open && !slow ? ` ${growDots(g)}` : ''}</b>${slow ? (working ? '' : say) : `<small>${esc(w.desc)}</small>`}${info}</span>
    <span class="dk-buy">${act}</span>${growHTML(g, w.left, slow, w.state === 'locked' || w.state === 'shop')}</div>`;
}
function farmAwayHTML(c, slow) {
  const last = c.last ? `<button type="button" class="btn small" data-faway="1">🌙 지난번 비운 동안 다시 보기${slow ? '' : ` <span class="muted">(${c.last.h >= 48 ? `${Math.round(c.last.h / 24)}일` : `${Math.round(c.last.h)}시간`})</span>`}</button>` : '<p class="note muted">3시간 넘게 비웠다 오면 그동안 한 일을 한 장으로 보여 줘요</p>';
  return `<div class="cab-head"><span class="sb-title">🌙 자리를 비운 동안</span></div>
    <div class="card fm-away"><p class="note">${slow ? '오래 비워도 다시 열면 그동안 흐른 시간을 따라잡아요' : `오래 비워도 다시 열면 ${c.weeks}주까지 따라잡아요 · 🌼 그 밖에 늦잠으로 늘려요`}</p>${last}</div>`;
}
// P27 🔆 정원 장치 (10-30 화원에서 옮김): 늘 팖 · 다 자라기까지 걸리는 시간만 줄임
function renderFarm(force) {
  const f = E.farmOf(st), slow = f.slow;
  const v = f.bonus, grow = Object.fromEntries(v.rows.filter(r => r.worker).map(r => [r.worker, r]));   // P37 카드 ↔ 기르기 칸 (bonusView worker)
  f.workers.forEach(w => { w.grow = grow[w.key] || null; w.left = v.left; });
  const sig = JSON.stringify([f, st.money]);
  if (!force && ui.sigs.farm === sig) return;
  ui.sigs.farm = sig;
  $('#p-farm').innerHTML = `<div class="stack farm">
    <div class="cab-head"><span class="sb-title">🐝 곤충농장</span><span class="muted">꽃을 돌보는 작은 곤충들</span></div>
    <p class="note fm-month">${esc(f.month)}</p>
    ${pollenHead(v, slow)}
    <div class="decoshop fm-grid">${f.workers.map(w => farmCard(w, slow)).join('')}</div>
    ${farmOtherHTML(v, slow)}
    ${farmAwayHTML(f.catchup, slow)}
    <p class="note muted fm-foot">곤충은 놓은 자리 둘레의 꽃을 돌봐요 · 정원에서 곤충을 누르면 둘레가 보여요 · 사람이 하던 손을 덜 뿐, 더 벌지는 않아요 · 🧺 저장고 · 🔆 장치(건조 선반 · 찻집 도우미)는 ⛏️ 광산에 있어요</p></div>`;
}
$('#p-farm').addEventListener('click', e => {
  const b = e.target.closest('[data-fbuy]'); if (b && !b.disabled) return askDeco(b.dataset.fbuy);   // 사기 전 확인 (askBuy, app-shop)
  const p = e.target.closest('[data-fplace]'); if (p) { ui.tool = 'deco'; ui.decoId = +p.dataset.fplace; return setTab('garden', true); }   // 창고 🪴 놓기와 같은 흐름
  const bn = e.target.closest('[data-bonus]'); if (bn && !bn.disabled) return after(E.bonusSet(st, bn.dataset.bonus, +bn.dataset.lv));   // 🌼 먹이기 · 다시 어리게 (P37)
  if (e.target.closest('[data-faway]') && st.awayLast) { awayInfo = Object.assign({}, st.awayLast, { again: true }); showAway(); }
});
