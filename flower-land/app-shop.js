// 도리의 정원 — 화면: 💐 화원 · 📦 창고 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 💐 화원 (P06, P17)
function strip(F, cal) {
  const c = ['#ffffff', '#fbfbf5', '#fbe3ea', '#f1d36a'].includes(F.petal) ? '#e0b4c3' : F.petal;
  return `<div class="strip" style="--c:${c}">${MONTHS.map(m => `<i class="${F.sow.includes(m) ? 'sow ' : ''}${F.bloom.includes(m) ? 'bloom ' : ''}${m > 12 ? 'rest ' : ''}${m === cal.month ? 'now' : ''}" title="${monthName(m)}"></i>`).join('')}</div>`;
}
// 정원: 올해의 흐름 (지도 아래)
function yearInfo(cal) {
  const night = cal.hour >= 18 || cal.hour < 7;
  return `${cal.frozen ? `${monthName(cal.month)} · 정원이 쉬는 중` : `${SEASON_IC[cal.season]} ${SEASONS[cal.season]} ${monthName(cal.month)} ${cal.day}일 ${night ? '밤' : '낮'}`}${st.speed > 1 ? ` · ${st.speed}배속` : ''}`;   // 10-06: 년차 · 다음 달까지는 뺌
}
function renderYear(force) {
  const cal = E.calendar(st.virtual), pct = Math.min(100, Math.max(0, (st.virtual - cal.slotStart) / (cal.slotEnd - cal.slotStart) * 100));
  const sig = [cal.idx, Math.floor(pct / 2)].join('|');
  if (!force && ui.sigs.year === sig) return;
  ui.sigs.year = sig;
  $('#yearBox').innerHTML = MONTHS.map((m, i) => `<i class="${i === cal.idx ? 'now ' : ''}${Math.min(4, Math.floor(i / 3)) === cal.season ? 'cur' : ''}" style="--c:${SEASON_COLOR[Math.min(4, Math.floor(i / 3))]};--p:${pct.toFixed(1)}%" title="${monthName(m)}"><b style="width:${i < cal.idx ? 100 : i === cal.idx ? pct.toFixed(1) : 0}%"></b></i>`).join('');
  $('#yearBox').setAttribute('aria-label', `올해의 흐름: ${monthName(cal.month)}, 이번 달 ${Math.round(pct)}% 지남`);
}
function nextSale(F) { return E.untilMonth(st.virtual, c => !c.frozen && F.sow.includes(c.month)); }
const wallet = () => `<span class="wallet" aria-label="가진 돈">💰 ${won(st.money)}</span>`;
function renderShop(force) {
  const cal = E.calendar(st.virtual), yr = E.yearOf(st, cal);
  const sig = JSON.stringify([st.forest && st.forest.trees, E.forestOpen(st), E.gradeOf(st).grade, cal.idx, realH((cal.slotEnd - st.virtual) / HOUR / (st.speed || 1)), cal.frozen, st.money, (st.decos || []).length, st.gifts, E.letterCount(st), st.fert, st.water, st.shears, st.hoe, st.basket, ui.shopQty, ui.cart, ui.shopFilter, st.items.length, st.reservations.map(r => [r.id, r.done])]);
  if (!force && ui.sigs.shop === sig) { updateCountdowns(); return; }
  ui.sigs.shop = sig;
  const onSale = FLOWER_KEYS.filter(k => !cal.frozen && FLOWERS[k].sow.includes(cal.month));
  const order = FLOWER_KEYS.slice().sort((a, b) => {
    const A = onSale.includes(a), B = onSale.includes(b);
    if (A !== B) return B - A;
    if (A) { const la = !FLOWERS[a].sow.includes(MONTHS[cal.idx + 1]), lb = !FLOWERS[b].sow.includes(MONTHS[cal.idx + 1]); if (la !== lb) return lb - la; return 0; }
    const na = nextSale(FLOWERS[a]), nb = nextSale(FLOWERS[b]);
    return (na ? na.hours : 999) - (nb ? nb.hours : 999);
  });
  const shown = ui.shopFilter && !cal.frozen ? order.filter(k => onSale.includes(k)) : order;
  const own = {}; for (const it of st.items) own[it.type] = (own[it.type] || 0) + 1;
  const rsv = {}; for (const r of st.reservations) if (!r.done) rsv[r.type] = (rsv[r.type] || 0) + r.qty;   // 카드 오른쪽 아래 "🗓️ 예약 ○"   // 카드에 "📦 창고에 ○개"
  const cards = shown.map(k => {
    const F = FLOWERS[k], on = onSale.includes(k);
    let action;
    if (cal.frozen) {
      const used = E.reservedCount(st, k, yr + 1), inCart = Object.values(ui.cart[k] || {}).reduce((a, b) => a + b, 0), left = 3 - used - inCart;
      // 예약 카드: 할인 가격 · 심는 때마다 수량 · 남은 예약
      action = `<div class="rv-box">
        <div class="rv-price"><s>${won(F.price)}</s><b>${won(E.reservationPrice(F))}</b><span class="rv-left">${3 - used > 0 ? `남은 예약 ${3 - used}개` : '예약을 다 했어요'}</span></div>
        ${F.windows.map(w => { const q = (ui.cart[k] || {})[w[0]] || 0; return `<div class="rv-row ${q ? 'on' : ''}"><span>${monthIc(w[0])} ${windowText(w)} 심기</span>
          <span class="stepper"><button type="button" data-cart="-" data-key="${k}" data-win="${w[0]}" ${q <= 0 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${q}</span><button type="button" data-cart="+" data-key="${k}" data-win="${w[0]}" ${left <= 0 ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>`; }).join('')}
      </div>`;
    } else if (on) {
      const n = ui.shopQty[k] || 1;
      action = `<div class="sc-buy"><span class="stepper"><button type="button" data-qty="-" data-key="${k}" aria-label="줄이기">−</button><span>${n}</span><button type="button" data-qty="+" data-key="${k}" aria-label="늘리기">+</button></span>
        <button type="button" class="btn primary" data-buy="${k}" ${st.money < F.price * n ? 'disabled' : ''}>${st.money < F.price * n ? '잔액 부족' : `구매${n > 1 ? ` · ${n}${FORM[F.form].unit}` : ''}`}</button></div>`;
    } else {
      const ns = nextSale(F);
      action = `<div class="sc-next">다음 판매 ${ns ? `<b>${monthName(ns.cal.month)}</b> · <span data-next="${k}">${realH(ns.hours / (st.speed || 1))} 뒤</span>` : '-'}</div>`;
    }
    const L = LANDS[homeLand(F)], inC = cal.frozen ? Object.values(ui.cart[k] || {}).reduce((a, b) => a + b, 0) : 0;
    const last = on && !F.sow.includes(MONTHS[cal.idx + 1]);   // 다음 달엔 안 팔면 "이번 달까지"
    return `<div class="shopcard ${on || cal.frozen ? '' : 'off'} ${inC ? 'incart' : ''}" data-on="${on ? 1 : 0}" style="--pc:${F.petal}">
      <div class="sc-art">${formArt(k, 64)}<span class="chip sc-form">${FORM[F.form].name}</span>${last ? '<span class="sc-last">이번 달까지</span>' : ''}${own[k] ? `<span class="sc-own" title="창고에 ${own[k]}개 있어요">📦 ${own[k]}</span>` : ''}${rsv[k] ? `<span class="sc-rsv" title="예약한 것 ${rsv[k]}개 · 창고에서 도착 날짜를 볼 수 있어요">🗓️ ${rsv[k]}</span>` : ''}</div>
      <div class="sc-name"><b>${F.name}</b><span class="sc-price">${won(F.price)}</span></div>
      <div class="sc-meta"><span>${LIFE[F.life]} · 개화 ${monthsText(F.bloom)}</span><span><span class="sw" style="background:${L.color}"></span>${josa(L.name, '을/를')} 만들어요</span></div>
      ${action}</div>`;
  });
  // 일반 판매: 지금 파는 꽃 / 곧 들어올 꽃을 나눠서
  const onCards = shown.map((k, i) => onSale.includes(k) ? cards[i] : '').join(''), soonCards = shown.map((k, i) => onSale.includes(k) ? '' : cards[i]).join('');
  const nextIn = order.map(k => [k, nextSale(FLOWERS[k])]).filter(x => x[1] && !onSale.includes(x[0])).sort((a, b) => a[1].hours - b[1].hours)[0];
  const stockN = Object.values(plantable()).reduce((a, b) => a + b, 0);
  const seg = `<span class="seg" role="group" aria-label="보기"><button type="button" data-shopf="on" aria-pressed="${!!ui.shopFilter}">지금 파는 꽃</button><button type="button" data-shopf="off" aria-pressed="${!ui.shopFilter}">모든 꽃</button></span>`;
  // 일반 판매: 맨 위 한 줄 소식 → 지금 파는 꽃 → 곧 들어올 꽃
  const news = `<div class="shop-news">
      <span><b>${SEASON_IC[cal.season]} ${monthName(cal.month)}</b> ${realH((cal.slotEnd - st.virtual) / HOUR / (st.speed || 1))} 남음</span>
      ${nextIn ? `<span>다음엔 <b>${monthName(nextIn[1].cal.month)} ${FLOWERS[nextIn[0]].name}</b></span>` : ''}
      ${stockN ? `<button type="button" data-go="store">📦 창고에 지금 심을 것 <b>${stockN}개</b> ›</button>` : ''}${wallet()}</div>`;
  const saleView = `${news}
    <div class="cab-head"><span class="sb-title">🌸 지금 파는 꽃 <span class="sh-n">${onSale.length}</span></span><span class="right">${seg}</span></div>
    ${onCards ? `<div class="shopgrid">${onCards}</div>` : `<div class="cab-empty"><span>🌱</span><div><b>지금은 심는 기간인 꽃이 없어요</b><br><span class="muted">${nextIn ? `${monthName(nextIn[1].cal.month)}에 ${josa(FLOWERS[nextIn[0]].name, '이/가')} 들어와요` : ''}</span></div>${ui.shopFilter ? '<button type="button" class="btn small" data-shopf="off">모든 꽃</button>' : ''}</div>`}
    ${!ui.shopFilter && soonCards ? `<div class="cab-head"><span class="sb-title">🗓️ 곧 들어올 꽃</span><span class="muted">들어오는 순서대로 · 심는 기간에만 팔아요</span></div><div class="shopgrid">${soonCards}</div>` : ''}`;
  const cart = Object.entries(ui.cart).flatMap(([k, ws]) => Object.entries(ws).map(([w, q]) => ({ type: k, window: +w, qty: q }))).filter(c => c.qty > 0);
  const cartTotal = cart.reduce((a, c) => a + E.reservationPrice(FLOWERS[c.type]) * c.qty, 0);
  const cartN = cart.reduce((a, c) => a + c.qty, 0), short = cart.length && st.money < cartTotal;
  // 꽃잠 예약: 한 줄 안내 → 예약한 꽃 → 꽃 카드 → 아래에 붙는 예약 바구니
  const rvView = `<div class="shop-news rv-intro"><span class="rv-badge">🗓️ 예약 기간</span><span>심는 때가 오는 날 아침 6시에 창고로 와요</span><span>꽃마다 3개까지 · 취소할 수 없어요</span></div>
    <div class="shopgrid rv">${cards.join('')}</div>
    <div class="rv-bar ${cart.length ? 'on' : ''}"><span class="rv-bar-ic">🧺</span>
      <span class="rv-bar-main">${cart.length ? `<b>담은 예약 ${cartN}개</b><small>${[...new Set(cart.map(c => FLOWERS[c.type].name))].join(' · ')}</small>` : '<b>담은 예약이 없어요</b><small>꽃 카드에서 + 를 눌러 담아요</small>'}</span>
      ${cart.length ? `<span class="rv-bar-sum"><b class="data">${won(cartTotal)}</b>${short ? '<small class="rv-warn">돈이 모자라요</small>' : '<small>10% 할인</small>'}</span><button type="button" class="btn" data-act="clearCart">초기화</button>` : ''}
      <button type="button" class="btn primary" data-act="reserve" ${cart.length && !short ? '' : 'disabled'}>예약</button></div>`;
  // P17-16 🪴 이달의 장식: 달마다 하나, 그 달에만 (꽃잠에도)
  const decoNow = E.decoOffer(cal).filter(k => !E.DECOS[k].gear && !E.DECOS[k].auto), decoNext = E.DECO_KEYS.find(k => E.DECOS[k].month === MONTHS[(cal.idx + 1) % MONTHS.length]);
  const decoSection = decoNow.length ? `<div class="cab-head"><span class="sb-title">🪴 이달의 장식</span><span class="muted">달마다 바뀌어요 · 정원에 놓아 꾸며요</span></div>
    <div class="decoshop">${decoNow.map(k => { const D = E.DECOS[k], own = (st.decos || []).filter(d => d.key === k).length, short = st.money < D.price;
      return `<div class="decocard"><span class="dk-art">${decoImg(k, 4)}${own ? `<span class="sc-own" title="가진 것 ${own}개 (정원 · 창고)">🪴 ${own}</span>` : ''}</span>
        <span class="dk-main"><b>${D.name}</b><small>${D.desc}</small><small class="muted">${E.decoMonths(k).map(monthName).join('·')}에만 들어와요${D.func ? '' : ' · 땅 · 꽃에는 영향이 없어요'}${decoNext && !D.months && decoNext !== k ? ` · 다음 달엔 ${E.DECOS[decoNext].name}` : ''}</small></span>
        <span class="dk-buy"><span class="sc-price">${won(D.price)}</span>${D.one && own ? '<span class="muted">✓ 있어요</span>' : `<button type="button" class="btn primary" data-decobuy="${k}" ${short ? 'disabled' : ''}>${short ? '잔액 부족' : '구매'}</button>`}</span></div>`; }).join('')}</div>` : '';
  // P28-05-01 🌱 등급 장식 (M1-4, 10-28): 정원 등급이 닿으면 달과 상관없이 늘 팖 · 안 열린 것은 잠가 둠 (느긋하게 보기여도 그대로 — 꾸미기는 쉬는 즐거움)
  const gNow = E.gradeOf(st).grade;
  const gradeSection = `<div class="cab-head"><span class="sb-title">🌱 등급 장식</span><span class="muted">정원 등급이 오르면 하나씩 들어와요 · 땅 · 꽃에는 영향이 없어요</span></div>
    <div class="decoshop">${E.GRADE_DECO_KEYS.map(k => { const D = E.DECOS[k], open = D.grade <= gNow, own = (st.decos || []).filter(d => d.key === k).length, short = st.money < D.price;
      return `<div class="decocard ${open ? '' : 'locked'}"><span class="dk-art">${decoImg(k, 4)}${own ? `<span class="sc-own" title="가진 것 ${own}개 (정원 · 창고)">🪴 ${own}</span>` : ''}</span>
        <span class="dk-main"><b>${D.name}</b><small>${D.desc}</small></span>
        <span class="dk-buy"><span class="sc-price">${won(D.price)}</span>${open ? `<button type="button" class="btn primary" data-decobuy="${k}" ${short ? 'disabled' : ''}>${short ? '잔액 부족' : '구매'}</button>` : `<span class="muted">🔒 ${D.grade}등급에 열려요</span>`}</span></div>`; }).join('')}</div>`;
  // P30-03 🌳 숲: 4층이 열린 뒤에만 · 묘목 6가지를 돈으로 (나무는 팔지 않고 열매 · 수입 없음) — 사면 바로 숲의 첫 빈 자리에 심음 (꽃잠에도)
  const fo = E.forestOpen(st) ? E.forestOf(st) : null;
  const forestSection = !fo ? '' : `<div class="cab-head"><span class="sb-title">🌳 숲</span><span class="muted">묘목을 사면 숲 빈 자리에 심어요 · 해가 바뀔 때마다 자라요 · 열매 · 돈은 나오지 않아요${fo.slow ? '' : ` · 빈 자리 ${fo.empty} / ${E.FOREST_N}`}</span></div>
    <div class="decoshop">${E.TREE_KEYS.map(k => { const T = E.TREES[k], short = st.money < T.price, own = fo.slots.filter(t => t && t.key === k).length;
      return `<div class="decocard"><span class="dk-art">${treeImg(k, 0, 4, 1)}${own && !fo.slow ? `<span class="sc-own" title="숲에 ${own}그루">🌳 ${own}</span>` : ''}</span>
        <span class="dk-main"><b>${T.icon} ${T.name} 묘목</b><small>${T.desc}</small></span>
        <span class="dk-buy"><span class="sc-price">${won(T.price)}</span>${!fo.empty ? '<span class="muted">자리가 다 찼어요</span>' : `<button type="button" class="btn primary" data-treebuy="${k}" ${short ? 'disabled' : ''}>${short ? '잔액 부족' : '심기'}</button>`}</span></div>`; }).join('')}</div>`;
  $('#p-shop').innerHTML = `<div class="stack">
    ${cal.frozen ? rvView : saleView}${forestSection}${decoSection}${gradeSection}</div>`;   // 10-30: 🐝 곤충 일꾼 · 🔆 정원 장치 줄은 🐝 곤충농장 탭으로, 💐 이웃에게 선물 줄은 뺌 (사용자 요청 — 엔진 · 받은 편지는 그대로)
}
function updateCountdowns() {
  document.querySelectorAll('[data-next]').forEach(el => { const ns = nextSale(FLOWERS[el.dataset.next]); if (ns) el.textContent = realH(ns.hours / (st.speed || 1)) + ' 뒤'; });
}
$('#p-shop').addEventListener('change', e => { if (e.target.id === 'shopFilter') { ui.shopFilter = e.target.checked; renderShop(true); } });
$('#p-shop').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const k = b.dataset.key;
  if (b.dataset.qty) { ui.shopQty[k] = Math.max(1, Math.min(20, (ui.shopQty[k] || 1) + (b.dataset.qty === '+' ? 1 : -1))); return renderShop(true); }
  if (b.dataset.shopf) { ui.shopFilter = b.dataset.shopf === 'on'; return renderShop(true); }
  if (b.dataset.treebuy) return after(E.plantTree(st, b.dataset.treebuy, null, ctx), null, { label: '🌳 숲', fn: () => setTab('forest') });   // P30-03
  if (b.dataset.gofarm) return setTab('farm');   // P32-03
  if (b.dataset.decobuy) return after(E.buyDeco(st, b.dataset.decobuy, ctx), null, { label: '🪴 놓기', fn: () => { const d = st.decos[st.decos.length - 1]; ui.tool = 'deco'; ui.decoId = d.id; setTab('garden', true); } });
  if (b.dataset.buy) { const key = b.dataset.buy, n = ui.shopQty[key] || 1; ui.shopQty[key] = 1; return after(E.buy(st, key, n), 'bought', { label: '🌰 심기', fn: () => { ui.tool = 'plant'; ui.plantType = key; setTab('garden', true); } }); }
  if (b.dataset.cart) {
    const w = +b.dataset.win; ui.cart[k] = ui.cart[k] || {};
    ui.cart[k][w] = Math.max(0, (ui.cart[k][w] || 0) + (b.dataset.cart === '+' ? 1 : -1));
    return renderShop(true);
  }
  if (b.dataset.act === 'clearCart') { ui.cart = {}; return renderShop(true); }
  if (b.dataset.act === 'reserve') return openReserveConfirm();
});
function cartList() { return Object.entries(ui.cart).flatMap(([k, ws]) => Object.entries(ws).map(([w, q]) => ({ type: k, window: +w, qty: q }))).filter(c => c.qty > 0); }
function openReserveConfirm() {                                                   // P06-06-05
  const cart = cartList(), sum = E.cartSummary(st, cart);
  const total = sum.reduce((a, s) => a + s.total, 0), full = sum.reduce((a, s) => a + s.F.price * s.qty, 0), short = st.money < total;
  // 예약 확인: 담은 꽃 카드 줄 + 합계 상자 + 안내
  const body = `<div class="rc">
    <div class="rc-list">${sum.map(s => {
      const di = MONTHS.indexOf(s.deliverMonth);
      return `<div class="rc-item" style="--pc:${s.F.petal}"><span class="rc-art">${spriteImg(s.F.key, 'flower', 40, false, s.F.name)}</span>
        <span class="rc-main"><b>${s.F.name} ${FORM[s.F.form].name} <span class="data">×${s.qty}</span></b>
          <small>${monthIc(s.window[0])} ${monthsText(s.window)} 심기</small>
          <small>📦 내년 ${monthName(s.deliverMonth)} 1일 (${WEEKDAY[Math.floor(di / 2)]}) 오전 6시 도착</small></span>
        <span class="rc-price data">${won(s.total)}</span></div>`;
    }).join('')}</div>
    <div class="rc-total"><div><span class="muted">일반가</span><s class="data">${won(full)}</s></div><div><span class="muted">예약 할인</span><span class="data good">−${won(full - total)}</span></div><div class="rc-sum"><b>합계</b><b class="data">${won(total)}</b></div></div>
    <div class="rc-pay ${short ? 'short' : ''}"><div class="rc-pay-t">💰 선금 · 예약할 때 바로 내요</div>
      <div><span class="muted">가진 돈</span><span class="data">${won(st.money)}</span></div>
      <div><span class="muted">예약 뒤 남는 돈</span><b class="data">${short ? `${won(total - st.money)} 모자라요` : won(st.money - total)}</b></div></div>
    <div class="rc-notes"><span>📦 특수 포장이라 심는 기간이 시작될 때까지 품질이 그대로예요</span><span class="rc-warn">⚠️ 예약은 취소할 수 없어요</span></div></div>`;
  openModal('🗓️ 예약 확인', body, [
    { label: '취소', act: () => closeModal() },
    { label: `예약 · ${won(total)}`, primary: true, act: () => { if (short) return; const r = E.reserve(st, cart); if (r.ok) ui.cart = {}; closeModal(); after(r, 'reserved'); } },
  ]);
  if (short) $('#modalRoot [data-mb="1"]').disabled = true;
}

// ---------------------------------------------------------------- 📦 창고 (P06-14)
function groupItems() {
  const map = new Map();
  for (const it of st.items) {
    const g0 = E.germOf(it), key = [it.type, it.origin, E.pct(it.q), Math.round(g0 * 100), it.packaged].join('|');
    if (!map.has(key)) map.set(key, { type: it.type, origin: it.origin, q: it.q, g: g0, ageH: it.ageH, packaged: it.packaged, got: it.got, parent: it.parent, ids: [] });
    const gr = map.get(key); gr.ids.push(it.id); gr.got = Math.max(gr.got, it.got);
  }
  return [...map.values()];
}
function renderStore(force) {
  const cal = E.calendar(st.virtual), yr0 = E.yearOf(st, cal);
  const relYear = y => y <= yr0 ? '올해' : y === yr0 + 1 ? '내년' : `${y - yr0}년 뒤`;   // 10-06: ○년차 대신
  const groups = groupItems();
  const sig = JSON.stringify([E.inboxUnread(st), groups.map(g0 => [g0.type, E.pct(g0.q), Math.round(g0.g * 100), g0.packaged, g0.ids.length, Math.floor(g0.ageH / E.MONTH_H)]), ui.storeSort, st.fert, st.water, st.shears, st.hoe, st.basket, st.pending.map(p => [p.id, Math.ceil(p.dueH)]), st.reservations.length, cal.idx, (st.decos || []).map(d => [d.id, d.x])]);
  if (!force && ui.sigs.store === sig) return;
  ui.sigs.store = sig;
  const nextSow = F => { const n = E.untilMonth(st.virtual, c => !c.frozen && F.sow.includes(c.month)); return n ? n.hours : 999; };
  const sorters = {
    flower: (a, b) => FLOWER_KEYS.indexOf(a.type) - FLOWER_KEYS.indexOf(b.type) || b.q - a.q,
    month: (a, b) => (FLOWERS[a.type].sow.includes(cal.month) && !cal.frozen ? -1 : nextSow(FLOWERS[a.type])) - (FLOWERS[b.type].sow.includes(cal.month) && !cal.frozen ? -1 : nextSow(FLOWERS[b.type])),
    quality: (a, b) => b.q - a.q,
    got: (a, b) => b.got - a.got,
  };
  groups.sort(sorters[ui.storeSort]);
  // 씨앗·묘목 카드: 품질 막대 · 싱싱한 기간 · 곧 시들면 표시. 지금 심을 것 / 나중에 심을 것으로 나눔
  const qbar = q => `<span class="qbar"><i style="width:${Math.round(q * 100)}%"></i></span>`;
  const card = gr => {
    const F = FLOWERS[gr.type], now = !cal.frozen && F.sow.includes(cal.month) && gr.g > 0;
    const comp = gr.ids.filter(id => E.compostable(st.items.find(it => it.id === id), true));   // 곧 시들고 품질 5% 이하 → 비료로
    const exp = gr.ageH < 12 * E.MONTH_H ? E.calendarAfterFlow(st.virtual, 12 * E.MONTH_H - gr.ageH) : null;
    const soon = !gr.packaged && gr.g > 0 && gr.ageH >= 10 * E.MONTH_H;          // 싹 트는 힘이 곧 줄기 시작함
    const expTxt = gr.packaged ? '📦 심을 때까지 그대로' : exp ? `<span title="이때까지 싱싱해요 (그 뒤엔 싹 트는 힘이 줄어요)">🌿 ${relYear(E.yearOf(st, exp))} ${monthName(exp.month)}까지</span>` : `${FORM[F.form].rate} ${Math.round(gr.g * 100)}%`;
    return `<div class="shopcard storecard ${now ? 'ready' : ''}" style="--pc:${F.petal}">
      <div class="sc-art">${formArt(gr.type, 64)}<span class="chip sc-form">${FORM[F.form].name}</span><span class="sc-count left">×${gr.ids.length}</span>${gr.packaged ? '<span class="sc-pack" title="특수 포장">📦</span>' : soon ? '<span class="sc-last">곧 시들어요</span>' : ''}</div>
      <div class="cc-name"><b>${F.name}</b><span class="stars">${starStr(gr.q)}</span></div>
      <div class="cc-q">${qbar(gr.q)}<span class="data">${E.pct(gr.q)}%</span></div>
      <div class="cc-meta"><span class="st-from">${gr.origin}</span> ${expTxt}</div>
      ${now ? `<button type="button" class="btn primary" data-plant="${gr.type}">🌰 심기</button>` : `<div class="sc-next">${gr.g <= 0 ? '싹이 트지 않아요' : (ns => ns ? `다음 심는 때 <b>${monthName(ns.cal.month)}</b> · ${realH(ns.hours / (st.speed || 1))} 뒤` : `심는 때 <b>${sowText(F)}</b>`)(nextSale(F))}</div>`}
      ${comp.length ? `<button type="button" class="btn compost" data-compost="${comp.join(',')}">🌱 비료</button>` : ''}</div>`;
  };
  const isNow = gr => !cal.frozen && FLOWERS[gr.type].sow.includes(cal.month) && gr.g > 0;
  const nowCards = groups.filter(isNow).map(card).join(''), laterCards = groups.filter(g0 => !isNow(g0)).map(card).join('');
  const total = groups.reduce((a, g0) => a + g0.ids.length, 0), nowN = groups.filter(isNow).reduce((a, g0) => a + g0.ids.length, 0);
  const soonN = groups.filter(g0 => !g0.packaged && g0.g > 0 && g0.ageH >= 10 * E.MONTH_H).reduce((a, g0) => a + g0.ids.length, 0);
  const rows = nowCards || laterCards;
  // 도착할 것: 번식 중(뿌리 내리는 중)과 예약 배송을 작은 카드로
  const arrive = (k, n, tag, tagCls, when, sub) => { const F = FLOWERS[k]; return `<div class="arcard" style="--pc:${F.petal}">
      <span class="ar-art">${spriteImg(k, 'flower', 36, false, F.name)}<span class="ar-n">×${n}</span></span>
      <span class="ar-main"><b>${F.name} <span class="muted">${FORM[F.form].name}</span></b><span class="ar-tag ${tagCls}">${tag}</span></span>
      <span class="ar-when"><b>${when}</b><small>${sub}</small></span></div>`; };
  const pend = st.pending.map(p => arrive(p.type, p.qs.length, `🌱 ${p.method}`, 'grow', `${cal.frozen ? '정원이 깨어나고 ' : ''}${flowH(Math.max(0, p.dueH))} 뒤`, '뿌리 내리는 중')).join('');
  const resv = st.reservations.filter(r => !r.done).map(r => arrive(r.type, r.qty, '🗓️ 예약', 'resv', `${monthName(MONTHS[r.deliverIdx])} 1일`, `${relYear(r.year)} · 특수 포장`)).join('');
  const ibOn = E.inboxUnread(st);   // ✉️ 편지함 (P31, 10-30 창고로)
  $('#p-store').innerHTML = `<div class="stack">
    <div class="card ib-row"><button type="button" class="btn topinbox-btn ${ibOn ? 'on' : ''}" id="storeInbox" data-inbox="1">✉️ 편지함</button><span class="muted">편지와 소식을 한곳에${ibOn ? ' · 새로 온 것이 있어요' : ''}</span></div>
    <div class="shop-news">
      <span><b>🌰 ${total}개</b> ${groups.length ? `${new Set(groups.map(g0 => g0.type)).size}가지 꽃` : '비어 있어요'}</span>
      <span>${cal.frozen ? '🌙 꽃잠에는 품질이 그대로예요' : '한 달에 품질 5%씩 줄어요'}</span>
      ${soonN ? `<span class="warn">⏳ 곧 시들 것 <b>${soonN}개</b></span>` : ''}</div>
    <div class="cab-head"><span class="sb-title">🧺 정원 용품</span><span class="muted">누르면 살 수 있어요</span></div>
    <div class="suptiles">${Object.entries(E.SUPPLIES).map(([k, S]) => {
      const n = st[k] || 0, low = n <= (S.per > 1 ? S.per / 2 : 3);   // 얼마 안 남으면 주황
      return `<button type="button" class="suptile ${n ? (low ? 'low' : '') : 'empty'}" data-sup="${k}" title="${S.desc}"><span class="si">${S.icon}</span><b>${S.name}</b><small>${n ? `${n}${S.unit} 남음` : '다 썼어요'}</small><span class="sp" aria-hidden="true">+</span></button>`;
    }).join('')}</div>
    ${decoStoreHTML()}
    ${pend || resv ? `<div class="cab-head"><span class="sb-title">🚚 도착할 것</span><span class="muted">때가 되면 창고로 들어와요</span></div><div class="argrid">${pend}${resv}</div>` : ''}
    ${rows ? `
    <div class="cab-head"><span class="sb-title">🌰 지금 심을 수 있어요 <span class="sh-n">${nowN}</span></span>
      <span class="right"><select id="storeSort" class="plantsel" aria-label="정렬"><option value="flower">꽃별</option><option value="month">심는 달별</option><option value="quality">품질별</option><option value="got">받은 날짜별</option></select></span></div>
    ${nowCards ? `<div class="shopgrid">${nowCards}</div>` : `<div class="cab-empty slim"><span>🌱</span><div class="muted">${cal.frozen ? '꽃잠에는 심을 수 없어요' : `${monthName(cal.month)}에 심는 꽃이 창고에 없어요`}</div></div>`}
    ${laterCards ? `<div class="cab-head"><span class="sb-title">📦 나중에 심을 것 <span class="sh-n">${total - nowN}</span></span><span class="muted">심는 때가 오면 위로 올라가요</span></div><div class="shopgrid">${laterCards}</div>` : ''}`
    : '<div class="cab-empty"><span>📦</span><div><b>창고가 비어 있어요</b><br><span class="muted">화원에서 제철 꽃을 사면 여기에 들어와요</span></div><button type="button" class="btn small primary" data-go="shop">💐 화원</button></div>'}</div>`;
  const ss = $('#storeSort'); if (ss) ss.value = ui.storeSort;   // 창고가 비면 정렬 칸이 없음
}
$('#p-store').addEventListener('change', e => { if (e.target.id === 'storeSort') { ui.storeSort = e.target.value; renderStore(true); } });
$('#p-store').addEventListener('click', e => {
  if (e.target.closest('[data-inbox]')) return openInbox();   // ✉️ 편지함 (10-30)
  const s = e.target.closest('[data-sup]'); if (s) return openSupply(s.dataset.sup);
  const c = e.target.closest('[data-compost]'); if (c) return openCompost(c.dataset.compost.split(',').map(Number));
  const dp = e.target.closest('[data-decoplace]'); if (dp) { ui.tool = 'deco'; ui.decoId = +dp.dataset.decoplace; return setTab('garden', true); }
  const b = e.target.closest('[data-plant]'); if (!b) return;
  ui.tool = 'plant'; ui.plantType = b.dataset.plant; setTab('garden', true);
});
// P17-16 창고의 🪴 장식: 종류마다 한 칸 · 창고에 있는 것 / 정원에 놓은 것
function decoStoreHTML() {
  const ds = st.decos || []; if (!ds.length) return '';
  const keys = [...new Set(ds.map(d => d.key))];
  const tiles = keys.map(k => { const all = ds.filter(d => d.key === k), inStore = all.filter(d => d.x == null), out = all.length - inStore.length;
    return `<div class="decotile"><span class="dk-art">${decoImg(k, 3)}</span><b>${esc(E.decoInfo(k).name)}</b><small>${[inStore.length ? `창고에 ${inStore.length}개` : '', out ? `정원에 ${out}개` : '', all.some(d => (d.honey || []).length) ? '🍯 꿀이 있어요' : ''].filter(Boolean).join(' · ')}</small>
      ${inStore.length ? `<button type="button" class="btn small primary" data-decoplace="${inStore[0].id}">🪴 놓기</button>` : '<span class="muted dk-hint">정원에서 눌러 옮겨요</span>'}</div>`; }).join('');
  return `<div class="cab-head"><span class="sb-title">🪴 장식 <span class="sh-n">${ds.length}</span></span><span class="muted">꽃이 없는 칸에 놓아요 · 땅은 바뀌지 않아요</span></div><div class="decotiles">${tiles}</div>`;
}
// 비료로 만들기 확인 창 (P06-16): 씨앗·묘목 › 비료, 몇 개 바꿀지 −/+
function openCompost(ids, n) {
  const list = st.items.filter(it => ids.includes(it.id) && E.compostable(it, true));
  if (!list.length) return;
  const it = list[0], F = FLOWERS[it.type]; n = Math.max(1, Math.min(list.length, n || list.length));
  const body = `<div class="rc">
    <div class="rc-item tc-item" style="--pc:${F.petal}"><span class="rc-art tc-pair">${spriteImg(it.type, 'form', 34, false, F.name)}<span class="sc-to">›</span><span class="cp-fert">🌱</span></span>
      <span class="rc-main"><b>${F.name} ${FORM[F.form].name} → 비료</b><small>품질 ${E.pct(it.q)}% · 품질 5% 이하라 비료가 돼요 · ${list.length}개 중</small></span>
      <span class="stepper"><button type="button" data-cq="-" ${n <= 1 ? 'disabled' : ''} aria-label="줄이기">−</button><span>${n}</span><button type="button" data-cq="+" ${n >= list.length ? 'disabled' : ''} aria-label="늘리기">+</button></span></div>
    <div class="rc-pay"><div><span class="muted">가진 비료</span><span class="data">${st.fert || 0}개</span></div><div><span class="muted">만든 뒤</span><b class="data">${(st.fert || 0) + n}개</b></div></div>
    <div class="rc-notes"><span>🌱 품질 5% 이하로 떨어진 씨앗·묘목은 1개가 비료 1개가 돼요</span></div></div>`;
  openModal('🌱 비료', body, [
    { label: '취소', act: () => closeModal() },
    { label: `비료 · ${n}개`, primary: true, act: () => { closeModal(); after(E.compostItems(st, list.slice(0, n).map(x => x.id))); } },
  ]);
  $('#modalRoot').querySelectorAll('[data-cq]').forEach(b => b.onclick = () => openCompost(ids, n + (b.dataset.cq === '+' ? 1 : -1)));
}
// 정원 용품 사기 (P13-07): 창고의 용품 칩을 누르면 뜨는 작은 창
// 위에 용품 고르기 줄 → 그림과 설명 → 수량 → 사기 전/후 영수증
function openSupply(k, n) {
  const S = E.SUPPLIES[k]; n = Math.max(1, Math.min(20, n || 1));
  const have = st[k] || 0, cost = S.price * n, short = st.money < cost;
  const body = `<div class="sup-pop">
    <div class="sup-tabs" role="tablist">${Object.entries(E.SUPPLIES).map(([kk, T]) => `<button type="button" role="tab" class="sup-tab ${(st[kk] || 0) ? '' : 'empty'}" data-st="${kk}" aria-selected="${kk === k}"><span>${T.icon}</span><em>${T.name}</em></button>`).join('')}</div>
    <div class="sup-hero"><span class="sup-art">${S.icon}</span>
      <div><b class="sup-name">${S.name}</b><span class="sup-desc">${S.desc}</span>
        <span class="sup-price"><b class="data">${won(S.price)}</b> · 1개로 ${S.per}번</span></div></div>
    <div class="sup-qty">
      <span class="sup-step"><button type="button" data-sq="-" ${n <= 1 ? 'disabled' : ''} aria-label="줄이기">−</button><b class="data">${n}<small>개</small></b><button type="button" data-sq="+" ${n >= 20 ? 'disabled' : ''} aria-label="늘리기">+</button></span>
      <span class="sup-quick">${[1, 5, 10].map(q => `<button type="button" data-sq="${q}" aria-pressed="${q === n}">${q}개</button>`).join('')}</span></div>
    <div class="sup-bill">
      <div><span>${S.icon} 가진 ${S.unit === '번' ? '횟수' : '개수'}</span><span class="data">${have}${S.unit} <i>→</i> <b>${have + S.per * n}${S.unit}</b></span></div>
      <div><span>💰 가진 돈</span><span class="data ${short ? 'bad' : ''}">${won(st.money)} <i>→</i> <b>${short ? '모자라요' : won(st.money - cost)}</b></span></div></div></div>`;
  openModal('🧺 정원 용품 구매', body, [
    { label: '닫기', act: () => closeModal() },
    { label: short ? `${won(cost - st.money)} 모자라요` : `구매 · ${won(cost)}`, primary: true, act: () => { if (short) return; closeModal(); after(E.buySupply(st, k, n)); } },
  ]);
  const root = $('#modalRoot'), buy = root.querySelector('[data-mb="1"]');
  if (short) buy.disabled = true;
  root.querySelectorAll('[data-sq]').forEach(b => b.onclick = () => {
    const v = b.dataset.sq; openSupply(k, v === '+' ? n + 1 : v === '-' ? n - 1 : +v);
  });
  root.querySelectorAll('[data-st]').forEach(b => b.onclick = () => openSupply(b.dataset.st));
}
