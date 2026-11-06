// 도리의 정원 — 화면: 🐝 곤충농장 (P32-03, 10-30) — app-forest 다음 · app-dex 앞에 불림 (showAway · openModal은 누를 때만 써서 뒤 파일 것이어도 됨)
'use strict';
// ---------------------------------------------------------------- 🐝 곤충농장 (P32)
// 흩어져 있던 자동 기능을 한 탭에: 곤충 7(P39 — 🐌 달팽이 · 🐜 개미 · 🐞 무당벌레 · 🪱 지렁이 · 🐛 누에 · 🐝 꿀벌 · 🦋 나비, 모두 놓은 자리 둘레 꽃을 도움) · 💰 기르기(P37 → P41 돈 + 등급) · 🌙 자리를 비운 동안
// 고르는 일은 엔진 farmOf만 — 데려오기는 buyDeco, 놓기는 창고와 같은 정원 놓기 모드, 기르기는 bonusSet (사기는 askBuy 창 뒤) (🧺 입구 선반 · 🔆 장치는 ⛏️ 광산 탭 · P40 그 밖에 → P61-03 🌼 정원 손길 줄은 카드 아래)
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
// P37 일꾼 기르기 → 🔄 P41 💰 돈 + 등급으로 (10-31): 카드마다 단계 점(●○ — ◍는 산 단계 아래로 낮춰 둔 칸) · "다음: 둘레 2칸 꽃에 물" · 💰 사기 단추 · 낮추기 · 올리기(산 단계까지 공짜)
// 사기 단추: "💰 넓히기 10,000원" · "💰 ×1.5 10,000원" — 등급이 모자라면 "🌱 등급 3부터"(눌리지 않음), 돈이 모자라면 눌리지 않고 "💰 n원 더 있어야 해요". 사기 전 💰 살까요? 창(askBuy, app-shop)
// 🐢 느긋하게 보기면 단계 숫자 · 등급 숫자를 빼고 말만 (사는 값은 그대로 보임 — 사는 데 필요) · 아직 데려오지 않은 곤충(🔒 · 💐)은 넓히기를 막음 (bonusView has)
const growDots = r => {   // ● 쓰는 단계 · ◍ 사 두고 낮춘 단계 · ○ 아직
  const dots = (n0, n1, n2) => `${'●'.repeat(n0)}${'◍'.repeat(n1)}${'○'.repeat(n2)}`;
  return r.worker   // P39-12-02 곤충: 단계 점 3개 · "둘레 n칸" (P61-01 칸 수는 엔진 reach — 2 · 4 · 6칸)
    ? `<span class="fm-dots" aria-label="둘레 ${r.reach}칸 · ${r.level} / ${r.max}단계">${dots(r.level + 1, r.own - r.level, r.max - r.own)} 둘레 ${r.reach}칸</span>`
    : `<span class="fm-dots" aria-label="${r.level} / ${r.max}단계">${dots(r.level, r.own - r.level, r.max - r.own)}${r.val ? ` <span class="data">${esc(r.val)}</span>` : ''}</span>`;   // P40 그 밖에: 점 2개 + 지금 값 "×2"
};
function growHTML(r, slow, away) {
  if (!r || !r.open) return '';
  const label = r.worker ? `💰 넓히기 ${won(r.price)}` : `💰 ${r.buyVal} ${won(r.price)}`;
  const text = slow ? (r.own ? (r.worker ? '🌼 둘레가 넓어졌어요' : '🌼 빨라졌어요') : r.worker ? '🌼 돈을 모아 둘레를 넓혀요' : '🌼 돈을 모아 빠르게 해요')
    : r.maxed ? `✨ 끝까지 샀어요 — ${r.desc}`
    : r.level < r.own ? `◍ ${r.worker ? `둘레 ${r.ownReach}칸` : r.ownVal}까지 사 두었어요 · 올리면 공짜예요`
    : r.buyLv ? `다음: ${r.buyDesc}${r.gradeOk || !away ? '' : ` · 🌱 등급 ${r.need}부터`}` : r.desc;
  const why = !r.buyLv || r.level < r.own ? '' : away ? '<small class="muted">데려오면 넓힐 수 있어요</small>' : r.gradeOk && !r.moneyOk ? `<small class="bn-why">💰 ${won(r.price - st.money)} 더 모으면 돼요</small>` : '';
  const buy = !r.buyLv || away || r.level < r.own ? ''   // 사 둔 단계가 남았으면 그것부터 (올리기)
    : r.gradeOk ? `<button type="button" class="btn small primary" data-bonus="${r.key}" data-lv="${r.buyLv}" data-pay="1"${r.moneyOk ? '' : ' disabled'}>${label}</button>`
    : `<button type="button" class="btn small" disabled>${slow ? '🌱 정원이 더 자라면' : `🌱 등급 ${r.need}부터`}</button>`;
  const up = r.level < r.own ? `<button type="button" class="btn small primary" data-bonus="${r.key}" data-lv="${r.level + 1}">올리기</button>` : '';
  const down = r.level ? `<button type="button" class="btn small" data-bonus="${r.key}" data-lv="${r.level - 1}">낮추기</button>` : '';
  return `<div class="fm-grow${r.maxed ? ' maxed' : ''}"><span class="fm-gtxt">${activeTagHTML('buy')}<small>${esc(text)}</small>${why}</span>
    <span class="bn-btns">${up}${buy}${down}</span></div>`;
}
const OTHER_SLOW = { grow: '꽃이 처음 피기까지 빨라져요', dry: '꽃방에서 꽃잎이 빨리 말라요' };   // 🐢 느긋하게 보기면 숫자 없는 말 (P40)
function farmOtherHTML(v, slow) {                  // P40 🌱 자라는 속도 · 🌾 말리는 속도 — 일꾼이 아니라 카드 아래 작은 줄 (P41 돈으로)
  const rows = v.rows.filter(r => !r.worker).map(r => `<div class="fm-other"><span class="bn-ic" aria-hidden="true">${r.icon}</span><span class="fm-otxt"><b>${esc(r.who.replace(/^\S+ /, ''))}${slow ? '' : ` ${growDots(r)}`}</b><small>${esc(slow ? OTHER_SLOW[r.key] || '' : r.desc)}</small></span>${growHTML(r, slow)}</div>`).join('');
  return `<div class="cab-head"><span class="sb-title">🌼 정원 손길</span><span class="muted">곤충은 아니지만 정원을 빠르게 해요</span></div><div class="card fm-others">${rows}</div>`;
}
function farmCard(w, slow) {
  const say = `<span class="fm-say">“${esc(w.line)}”</span>`;
  const sub = w.deco && w.deco !== w.name ? ` <small class="muted">· ${esc(w.deco)}</small>` : '';
  const working = w.state === 'placed';   // 일하는 곤충은 말풍선을 끝에 · 🐢 느긋하게 보기면 설명 대신 말 한 줄
  let info = '', act = '';
  if (w.state === 'locked') act = `<span class="muted fm-when">🔒 ${esc(w.when)}</span>`;
  else if (w.state === 'shop') act = `<button type="button" class="btn primary" data-fbuy="${w.key}"${st.money < w.price ? ' disabled' : ''}>${st.money < w.price ? '돈이 모자라요' : `💐 ${won(w.price)}에 데려오기`}</button>`;
  else if (w.state === 'stored') { info = `<small class="fm-work">📦 창고에서 쉬고 있어요</small>`; act = `<button type="button" class="btn primary" data-fplace="${w.storedId}">🪴 정원에 놓기</button>`; }
  else if (w.state === 'placed') {
    const where = w.placed.map(p => `(${p.x + 1}, ${p.y + 1})`).join(' · ');
    info = slow ? `<small class="fm-work">🌿 ${esc(w.work)}</small>` : `<small class="fm-work">📍 ${where} · ${esc(w.work)}${w.didText ? ` · 지난달 ${esc(w.didText)}` : ''}${w.supply ? ` · ${esc(w.supply.name)} ${w.supply.left}${esc(w.supply.unit)} 남음` : ''}</small>`;   // P77-B 쓰는 용품 · 남은 수
    if (w.short) info += `<small class="fm-work warn">⚠️ ${esc(w.short)}</small>`;   // P77-B 용품이 없어 쉴 까닭   // P39-12-01 "둘레 1칸 · 꽃 6포기에 비료" · 🐢 "둘레 꽃의 흙이 기름져요"
    act = (w.stored ? `<button type="button" class="btn small primary" data-fplace="${w.storedId}">🪴 하나 더 놓기</button>` : '')
      + (w.canBuy && !w.one ? `<button type="button" class="btn small" data-fbuy="${w.key}"${st.money < w.price ? ' disabled' : ''}>💐 ${won(w.price)} 하나 더</button>` : '');
    info += say;
  }
  const g = w.grow;
  return `<div class="decocard fm-card ${w.state}"><span class="dk-art">${insectImg(w.key, 3)}</span>
    <span class="dk-main"><b>${w.icon} ${esc(w.name)}${sub}${g && g.open && !slow ? ` ${growDots(g)}` : ''}</b>${activeTagHTML('place')}${slow ? (working ? '' : say) : `<small>${esc(w.desc)}</small>`}${info}</span>
    <span class="dk-buy">${act}</span>${growHTML(g, slow, w.state === 'locked' || w.state === 'shop')}</div>`;
}
function farmAwayHTML(c, slow) {
  const last = c.last ? `<button type="button" class="btn small" data-faway="1">🌙 지난번 비운 동안 다시 보기${slow ? '' : ` <span class="muted">(${c.last.h >= 48 ? `${Math.round(c.last.h / 24)}일` : `${Math.round(c.last.h)}시간`})</span>`}</button>` : '<p class="note muted">3시간 넘게 비웠다 오면 그동안 한 일을 한 장으로 보여 줘요</p>';
  return `<div class="cab-head"><span class="sb-title">🌙 자리를 비운 동안</span></div>
    <div class="card fm-away"><p class="note">${slow ? '오래 비워도 다시 열면 그동안 흐른 시간을 따라잡아요' : `오래 비워도 다시 열면 ${c.weeks}주까지 따라잡아요`}</p>${last}</div>`;
}
// P27 🔆 정원 장치 (10-30 화원에서 옮김): 늘 팖 · 다 자라기까지 걸리는 시간만 줄임
function renderFarm(force) {
  const f = E.farmOf(st), slow = f.slow;
  const v = f.bonus, grow = Object.fromEntries(v.rows.filter(r => r.worker).map(r => [r.worker, r]));   // P37 카드 ↔ 기르기 칸 (bonusView worker)
  f.workers.forEach(w => { w.grow = grow[w.key] || null; });
  const sig = JSON.stringify([f, st.money]);
  if (!force && ui.sigs.farm === sig) return;
  ui.sigs.farm = sig;
  $('#p-farm').innerHTML = `<div class="stack farm">
    <div class="cab-head"><span class="sb-title">🐝 곤충농장</span><span class="muted">꽃을 돌보는 작은 곤충들</span><span class="right">${wallet()}</span></div>
    <p class="note fm-month">${esc(f.month)}</p>
    <p class="note fm-pollen">${slow ? '🌱 정원이 자라면 곤충 둘레를 넓힐 수 있어요' : '🌱 정원 등급이 닿으면 💰 돈으로 둘레를 넓혀요 · 사 둔 단계 아래로는 언제든 낮춰 써요'}</p>
    <div class="decoshop fm-grid">${f.workers.map(w => farmCard(w, slow)).join('')}</div>
    ${farmOtherHTML(v, slow)}
    ${farmAwayHTML(f.catchup, slow)}
    <p class="note muted fm-foot">곤충은 놓은 자리 둘레의 꽃을 돌봐요 · 정원에서 곤충을 누르면 둘레가 보여요 · 손을 덜어 줘요 · 🐝 꿀벌 꿀은 🍵 꿀차로 팔 수 있어요 · 🔆 장치(건조 선반 · 찻집 도우미)는 ⛏️ 광산에 있어요</p></div>`;
}
$('#p-farm').addEventListener('click', e => {
  const b = e.target.closest('[data-fbuy]'); if (b && !b.disabled) return askDeco(b.dataset.fbuy);   // 사기 전 확인 (askBuy, app-shop)
  const p = e.target.closest('[data-fplace]'); if (p) { ui.tool = 'deco'; ui.decoId = +p.dataset.fplace; return setTab('garden', true); }   // 창고 🪴 놓기와 같은 흐름
  const bn = e.target.closest('[data-bonus]'); if (bn && !bn.disabled) {   // P41 💰 사기(살까요? 창) · 올리기 · 낮추기 (산 단계 안은 바로)
    const k = bn.dataset.bonus, lv = +bn.dataset.lv, go = () => after(E.bonusSet(st, k, lv));
    if (!bn.dataset.pay) return go();
    const r = E.bonusView(st).rows.find(x => x.key === k);
    return askBuy({ name: r.buyName, note: r.buyDesc, price: r.price, art: r.worker ? insectImg(r.worker, 3) : `<span class="ba-ic">${r.icon}</span>` }, go);
  }
  if (e.target.closest('[data-faway]') && st.awayLast) { awayInfo = Object.assign({}, st.awayLast, { again: true }); showAway(); }
});
