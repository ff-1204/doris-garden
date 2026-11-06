// 도리의 정원 — 화면: ⛏️ 광산 탭 (app-garden.js 다음에 불림 — R-D4 11-05 검토: 94KB이던 app-garden.js에서 광산 구역을 그대로 옮김, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- ⛏️ 광산 탭 (P24, 10-24 · 10-30 창 → 탭, 사용자 요청 "창고 밑에 광산 메뉴 따로"): 층 · 기력 · 8×6 판 · 가방 · 만들기
const mineFrom = n => E.ORES[n] ? E.ORES[n].from : E.FOSSILS[n] ? E.FOSSILS[n].from : n === 'oldseed' ? 8 : 1;   // 10-31 QA: 광석 · 화석 · 옛 씨앗(8층부터) 모두 "n층부터"
// P44-01 ⛏️ 광산 공방 (11-01 사용자): 정원에 놓는 12가지 — 카드마다 ⛏️ 재료로 · 💰 돈으로 (값 · 재료 · 효과는 엔진 WORKSHOP · CRAFTS · decoBuffLine)
const wsArt = k => k === 'jar' ? decoImg('mutjar', 3) : decoImg(E.CRAFTS[k].deco, 3);
const wsNote = k => { const C = E.CRAFTS[k], D = C.deco && E.DECOS[C.deco];
  return k === 'jar' ? '🫙 변이 꽃을 담아 장식으로 · 그 꽃의 돌연변이가 더 자주' : E.decoBuffLine(st, C.deco) || `${D.desc}${D.one ? ' · 하나만' : ''}`; };
function mineWorkshopHTML() {
  const m = E.mineOf(st), grade = E.gradeOf(st).grade, slow = E.slowView(st);
  return `<div class="cab-head"><span class="sb-title">⛏️ 광산 공방</span><span class="muted">재료로 만들거나 돈으로 사요 · 정원에 놓으면 일해요</span></div>
    <div class="decoshop ws-shop">${E.WORKSHOP_KEYS.map(k => { const C = E.CRAFTS[k], Dk = C.deco, Dd = Dk && E.DECOS[Dk], price = E.WORKSHOP[k];
      const own = Dk ? (st.decos || []).filter(d => d.key === Dk).length : (st.jar || 0), lock = Dd && Dd.need && grade < Dd.need, have = Dd && Dd.one && own;
      const need = Object.entries(C.need).map(([n, q]) => `${E.mineName(n)} ${m.bag[n] || 0}/${q}${!(m.bag[n] >= q) && mineFrom(n) > 1 ? ` (${mineFrom(n)}층부터)` : ''}`).join(' · ');
      const canMake = E.canCraft(st, k), canPay = st.money >= price;
      const acts = have ? '<span class="muted">✓ 있어요</span>' : lock ? `<span class="muted">🔒 ${slow ? '정원이 더 자라면' : `정원 등급 ${Dd.need}부터`}</span>`
        : `<button type="button" class="btn small ${canMake ? 'primary' : ''}" data-craft="${k}" ${canMake ? '' : 'disabled'}>⛏️ 재료로</button><button type="button" class="btn small" data-wsbuy="${k}" ${canPay ? '' : 'disabled'}>💰 ${won(price)}</button>`;
      return `<div class="decocard ws-card${lock ? ' locked' : ''}${canMake && !have && !lock ? ' can' : ''}"><span class="dk-art">${wsArt(k)}${own ? `<span class="sc-own" title="가진 것 ${own}개${Dk ? ' (정원 · 창고)' : ''}">${Dk ? '🪴' : '🫙'} ${own}</span>` : ''}</span>
        <span class="dk-main"><b>${C.name}</b>${activeTagHTML(Dk ? E.decoActive(Dk) : k === 'jar' ? 'place' : null)}<small class="dk-buff">${esc(wsNote(k))}</small><small class="muted">${need}</small></span>
        <span class="dk-buy">${acts}</span></div>`; }).join('')}</div>`;
}
// P83-02 🧺 키우는 도구 (11-06 사용자 확정): 여섯을 모두 재료로 — 재료가 모자라면 그 카드에서 바로 💰 (화원 값 SUPPLIES · 사기 전 askBuy 창)
function mineToolsHTML() {
  const m = E.mineOf(st);
  return `<div class="cab-head"><span class="sb-title">🧺 키우는 도구</span><span class="muted">재료로 만들고 · 재료가 없으면 사요</span></div>
    <div class="decoshop ws-shop">${E.TOOL_CRAFTS.map(k => { const C = E.CRAFTS[k], S = E.SUPPLIES[k], can = E.canCraft(st, k), have = st[k] || 0;
      const need = Object.entries(C.need).map(([n, q]) => `${E.mineName(n)} ${m.bag[n] || 0}/${q}${!(m.bag[n] >= q) && mineFrom(n) > 1 ? ` (${mineFrom(n)}층부터)` : ''}`).join(' · ');
      return `<div class="decocard ws-card${can ? ' can' : ''}"><span class="dk-art"><span class="mn-ico">${S.icon}</span></span>
        <span class="dk-main"><b>${C.name}</b><small class="dk-buff">${have}${S.unit} 남음 · ${S.per > 1 ? `1개로 ${S.per}번` : '1개로 1번'}</small><small class="muted">${need}</small></span>
        <span class="dk-buy"><button type="button" class="btn small ${can ? 'primary' : ''}" data-craft="${k}" ${can ? '' : 'disabled'}>⛏️ 재료로</button>${can ? '' : `<button type="button" class="btn small" data-toolbuy="${k}" ${st.money >= S.price ? '' : 'disabled'}>💰 ${won(S.price)}</button>`}</span></div>`; }).join('')}</div>`;
}
// P83-01 ⛏️ 자동 캐기 칸 (값 · 근거는 엔진 autoDigWon) — 🐢 느긋하게 보기면 돈 숫자 없이
function mineAutoHTML() {
  const a = E.mineAutoView(st), slow = E.slowView(st), keep = a.keep ? ` · 곤충 몫 기력 ${a.keep}칸은 남겨요` : '';
  const line = a.on ? `켜져 있어요 · 기력이 찰 때마다 파요${slow ? '' : ` · 지금 한 칸 ${won(a.price)}${a.n ? ` · 이번 달 ${a.n}칸 ${won(a.paid)}` : ''}`}${keep}`
    : a.stop === 'money' ? '돈이 모자라 멈췄어요 · 돈을 모아 다시 켜요'
    : `꺼 둔 동안에도 기력이 찰 때마다 파요 · ${slow ? '칸마다 돈을 내요' : `지금 한 칸 ${won(a.price)}`}`;
  return `<div class="mine-auto${a.on ? ' on' : ''}${a.stop ? ' stop' : ''}"><span class="ma-main"><b>⛏️ 자동 캐기</b><small class="${a.stop && !a.on ? 'warn' : 'muted'}">${line}</small></span><button type="button" class="btn small ${a.on ? '' : 'primary'}" data-mauto="${a.on ? 'off' : 'on'}" aria-pressed="${a.on}">${a.on ? '끄기' : '켜기'}</button></div>`;
}
function askMineAuto() {
  const a = E.mineAutoView(st), slow = E.slowView(st), go = () => { closeModal(); const r = E.mineAutoSet(st, true, ctx); feedback(r.msg, !r.ok); if (r.ok) save(); renderAll(true); };
  openModal('⛏️ 자동 캐기를 켤까요?', `<div class="buy-ask"><span class="ba-art"><span class="ba-ic">⛏️</span></span><p><b>기력이 찰 때마다 한 칸씩 파요</b><br><small class="muted">계단을 찾으면 내려가고, 판을 다 파면 새 판으로 가요 · 꺼 둔 동안에도 파요 · 돈이 모자라면 멈춰요 · 경험치와 주간 목표엔 들지 않아요</small></p>
    ${slow ? '<p class="muted">한 칸 팔 때마다 돈을 내요</p>' : `<div class="rc-pay"><div><span class="muted">지금 한 칸</span><b class="data">${won(a.price)}</b></div><div><span class="muted">가진 돈</span><span class="data">${won(st.money)}</span></div><div><span class="muted">값</span><span class="data">깊을수록 올라요</span></div></div>`}</div>`, [
    { label: '취소', act: () => closeModal() },
    { label: '켜기', primary: true, act: go },
  ]);
}
function minePantryHTML(v, slow) {   // 10-31 사용자: 🧺 정원 저장고를 곤충농장에서 ⛏️ 광산 "입구 선반"으로 (규칙 그대로)
  if (!v) return '<p class="note muted">첫 안내를 마치면 저장고가 열려요</p>';
  const has = v.has ? `<p class="note">${slow ? v.list.map(x => `${x.ic} ${x.name}`).join(' · ') : pantryText(v)}</p>` : `<p class="note muted">${slow ? '조금씩 쌓여요' : `광산 입구 선반에 2시간마다 하나씩 올라와요${v.full ? '' : ` · 다음 것까지 ${Math.ceil(v.next)}시간`}`}</p>`;
  return `<div class="cab-head"><span class="sb-title">🧺 입구 선반 · 정원 저장고</span>${slow ? '' : `<span class="dh-count data">${v.n} / ${v.cap}${v.full ? ' · 가득' : ''}</span>`}</div>
    <div class="card fm-pantry mine-pantry">${has}${pantryAllBtn('btn small care') || ''}</div>`;
}
function renderMine(force) {
  const m = E.mineOf(st), b = m.board;
  const wait = realH((E.MINE_REGEN_H - m.regenH) / (st.speed || 1));
  const maxE = E.mineMaxE(st), nextE = m.energy >= maxE ? '가득 찼어요' : `다음 기력 ${wait} 뒤`;
  const stairsFound = b.cells.some(c => c.dug && c.stairs), allDug = b.cells.every(c => c.dug);
  // P24 UI (10-30): 칸 그림은 32px로 넣고 칸 크기에 따라 CSS가 ×1 · ×2로만 보여 줌 (정수배). 빈 흙 칸의 계단은 가운데에 크게, 광석 칸의 계단은 귀퉁이에
  const cell = (c, i) => c.dug ? `<span class="mc dug${c.stairs ? ' st' : ''}" title="${c.k === 'jewel' ? '💎 보석 · 돈이 되었어요' : E.mineName(c.k)}${c.stairs ? ' · 계단' : ''}">${c.k === 'dirt' ? (c.stairs ? mineImg('stairs', 2) : '') : mineImg(c.k, 2)}${c.stairs && c.k !== 'dirt' ? `<span class="mc-st">${mineImg('stairs', 1)}</span>` : ''}</span>`
    : `<button type="button" class="mc" data-dig="${i}" aria-label="${Math.floor(i / E.MINE_W) + 1}번째 줄 ${i % E.MINE_W + 1}번째 칸 파기" ${m.energy < 1 ? 'disabled' : ''}></button>`;
  // P24 UI (10-30): 재료마다 "어디에 쓰나" — 이름 셋까지 (P59 찻잔 세트도 다시 셈)
  const usesOf = k => { const n = E.CRAFT_KEYS.filter(c => E.CRAFTS[c].need[k]).map(c => E.CRAFTS[c].name); return n.length > 3 ? n.slice(0, 3).join(' · ') + ' …' : n.join(' · '); };
  const bagKeys = ['dirt', 'stone', ...E.ORE_KEYS, ...E.FOSSIL_KEYS, 'oldseed'].filter(k => m.bag[k] > 0);
  const bag = bagKeys.length ? `<div class="mine-bag">${bagKeys.map(k => { const u = usesOf(k); return `<span class="mine-it">${mineImg(k, 2)}<small>${E.mineName(k)} <b class="data">×${m.bag[k]}</b></small>${u ? `<small class="mine-use">${u}</small>` : ''}</span>`; }).join('')}</div>` : '<p class="muted">아직 판 게 없어요 · 칸을 눌러 파 보세요</p>';
  // P24 UI (10-30): 재료 진행 막대(가장 모자란 재료 기준) · 만들 수 있는 것을 맨 위로
  const craftRows = E.CRAFT_KEYS.filter(k => !E.WORKSHOP[k] && !E.TOOL_CRAFTS.includes(k)).map(k => { const C = E.CRAFTS[k], have = C.cup && E.shopOf(st).cups.includes(C.cup), can = E.canCraft(st, k) && !have;
    const pct = Math.floor(100 * Math.min(...Object.entries(C.need).map(([n, q]) => Math.min(1, (m.bag[n] || 0) / q))));
    const art = C.deco ? decoImg(C.deco, 2) : C.item === 'jar' ? decoImg('mutjar', 2) : C.item === 'presol' ? '<span class="mn-ico">🧪</span>' : C.cup ? `<img class="px" src="${cupPreview(C.cup)}" width="32" height="32" alt="">` : '<span class="mn-ico">🌱</span>';
    return { can, html: `<div class="mcraft ${can ? 'can' : ''}"><span>${art}</span><span class="mcr-main"><b>${C.name}</b><span class="mcr-bar" role="img" aria-label="재료 ${pct}%"><i style="width:${pct}%"></i></span><small>${Object.entries(C.need).map(([n, q]) => `${E.mineName(n)} ${m.bag[n] || 0}/${q}${!(m.bag[n] >= q) && mineFrom(n) > 1 ? ` (${mineFrom(n)}층부터)` : ''}`).join(' · ')}</small></span>${have ? '<span class="muted">✓ 있어요</span>' : `<button type="button" class="btn small ${can ? 'primary' : ''}" data-craft="${k}" ${can ? '' : 'disabled'}>만들기</button>`}</div>` }; });
  const order = rows => [...rows.filter(r => r.can), ...rows.filter(r => !r.can)];   // 만들 수 있는 것 위로
  const crafts = `<div class="mine-crafts">${order(craftRows).map(r => r.html).join('')}</div>`;   // P83-02 비료 · 호미 · 가위는 공방 「🧺 키우는 도구」로
  const sig = JSON.stringify([m, nextE, maxE, E.slowView(st), E.gradeOf(st).grade, E.pantryView(st), st.money, (st.decos || []).map(d => d.key + (d.x == null ? 0 : 1)).join(), st.money, E.shopOf(st).cups, st.jar, st.presol, E.TOOL_CRAFTS.map(k => st[k])]);
  if (!force && ui.sigs.mine === sig) return;
  ui.sigs.mine = sig;
  const downBtn = stairsFound && m.depth < E.MINE_DEEPEST;
  $('#p-mine').innerHTML = `<div class="cab-head"><span class="sb-title">⛏️ 정원 뒤 광산</span><span class="muted">기다리는 동안 조금씩 파요</span></div>
    <div class="card mine-pop">
    <div class="mine-main">
    <div class="mine-head"><b>지하 ${m.depth}층</b><span class="muted">가장 깊이 ${m.deepest}층</span></div>
    <div class="mine-energy" title="${nextE}"><span>⛏️ 기력</span><span class="me-bar">${Array.from({ length: Math.max(maxE, m.energy) }, (_, i) => `<i class="${i < m.energy ? 'on' : ''}"></i>`).join('')}</span><small class="muted"><b class="data">${m.energy} / ${maxE}</b> · ${nextE}</small></div>
    ${m.energy < 1 && !allDug ? `<p class="mine-wait">기력이 차면 팔 수 있어요 · ${wait} 뒤</p>` : ''}
    <div class="mine-grid" style="--mw:${E.MINE_W}">${b.cells.map(cell).join('')}</div>
    ${allDug ? `<p class="mine-done">이 판은 다 팠어요 · ${downBtn ? '아래층으로 가거나 ' : ''}새 굴을 파요</p>` : ''}
    <div class="mine-acts">${downBtn ? '<button type="button" class="btn primary small" data-mact="down">🪜 아래층으로</button>' : ''}${m.depth > 1 ? '<button type="button" class="btn small" data-mact="up">⬆️ 1층으로</button>' : ''}${m.depth < m.deepest ? `<button type="button" class="btn small" data-mact="deep" ${m.energy < 3 ? 'disabled' : ''}>🪜 지하 ${m.deepest}층으로 · 기력 3</button>` : ''}${allDug ? `<button type="button" class="btn small ${downBtn ? '' : 'primary'}" data-mact="fresh">🔄 새 굴</button>` : ''}</div>
    ${mineAutoHTML()}
    </div>
    <div class="mine-side">
    <section class="mine-sec"><h3 class="mine-sub">🔨 재료 만들기</h3>${crafts}</section>
    <section class="mine-sec"><h3 class="mine-sub">🎒 가방</h3>${bag}</section>
    </div>
    <p class="note">기력은 1분마다 한 칸씩, 꺼 둔 동안에도 차요 · 💎 보석은 파면 바로 돈이 되고, 나머지는 팔지 않고 만들기 · 공방 · 도감에 써요</p></div>
    <div class="mine-ws">${mineToolsHTML()}${mineWorkshopHTML()}</div>
    <div class="mine-extra"><div class="stack">${minePantryHTML(E.pantryView(st), E.slowView(st))}</div></div>`;   // 10-31 🧺 선반 (P44 🔆 공방은 위 ⛏️ 광산 공방 카드로)
}
// 10-31 QA: 광산은 눌릴 때마다 통째로 다시 그려 키보드 포커스가 BODY로 떨어짐 → 같은 자리(판 칸은 그 칸부터 다음 안 판 칸)로 되돌림
function mineRefocus(sel, kind) {
  const root = $('#p-mine'); let el = root.querySelector(sel);
  if (!el && kind === 'dig') { const i = +sel.replace(/D/g, ''), cells = [...root.querySelectorAll('[data-dig]')]; el = cells.find(b => +b.dataset.dig >= i) || cells[0] || root.querySelector('[data-mact]'); }
  if (el && !el.disabled) el.focus({ preventScroll: true });
}
$('#p-mine').addEventListener('click', e => {
  const d = e.target.closest('[data-dig]'); if (d && !d.disabled) {   // 10-31 QA: 연속 클릭 — 판 전체를 다시 그리지 않고 광산 탭만 바로 다시 그림(renderAll은 다음 프레임에), 같은 칸 두 번은 조용히
    const r = E.dig(st, +d.dataset.dig, ctx); if (!r.ok) return r.msg.startsWith('이미') ? undefined : feedback(r.msg, true);
    save(); if (r.first || r.stairs || r.jewel || r.cell.k === 'oldseed') feedback(r.msg);   // P43-04 💎 보석은 늘 알림
    const sel = `[data-dig="${d.dataset.dig}"]`; renderMine(true); mineRefocus(sel, 'dig');
    return requestAnimationFrame(() => { renderAll(true); mineRefocus(sel, 'dig'); });   // 전체 다시 그리기 뒤에도 포커스 한 번 더
  }
  const x = e.target.closest('[data-mact]');
  if (x && !x.disabled) {
    const a = x.dataset.mact, m = E.mineOf(st), go = () => { closeModal(); const r = a === 'down' ? E.descend(st, ctx) : a === 'up' ? E.mineUp(st) : a === 'deep' ? E.toDeepest(st) : E.freshBoard(st); feedback(r.msg, !r.ok); save(); renderAll(true); };
    if (a !== 'up') return go();
    return openModal('⬆️ 1층으로', `<p>지하 ${m.depth}층의 판을 두고 1층으로 올라가요</p><p class="muted">다시 내려올 땐 "🪜 지하 ${m.deepest}층으로"(기력 3)로 바로 갈 수 있어요</p>`, [{ label: '취소', act: () => closeModal() }, { label: '올라가기', primary: true, act: go }]);
  }
  const au = e.target.closest('[data-mauto]'); if (au) { if (au.dataset.mauto === 'on') return askMineAuto(); const r = E.mineAutoSet(st, false, ctx); feedback(r.msg); save(); return renderAll(true); }   // P83-01
  const tb = e.target.closest('[data-toolbuy]'); if (tb && !tb.disabled) { const k = tb.dataset.toolbuy, S = E.SUPPLIES[k];   // P83-02 재료가 모자라면 그 카드에서 (화원 값)
    return askBuy({ name: S.name, note: S.desc, price: S.price, art: `<span class="ba-ic">${S.icon}</span>` }, () => { after(E.buySupply(st, k, 1)); renderAll(true); }); }
  if (e.target.closest('[data-pantry]')) return takePantryOn();   // 🧺 입구 선반 (10-31)
  const wb = e.target.closest('[data-wsbuy]'); if (wb && !wb.disabled) { const k = wb.dataset.wsbuy, C = E.CRAFTS[k];   // P44-01 💰 돈으로 사기 (화원과 같은 확인 창)
    return askBuy({ name: C.name, note: wsNote(k), price: E.WORKSHOP[k], art: k === 'jar' ? decoImg('mutjar', 3) : decoImg(C.deco, 3) }, () => { const r = E.workshopBuy(st, k, ctx); after(r, null, r.deco ? { label: '🪴 놓기', fn: () => { ui.tool = 'deco'; ui.decoId = r.deco.id; setTab('garden', true); } } : undefined); renderAll(true); }); }
  const c = e.target.closest('[data-craft]'); if (c && !c.disabled) { const k = c.dataset.craft, r = E.craft(st, k, ctx); feedback(r.msg, !r.ok); if (r.ok) save(); renderAll(true); return mineRefocus(`[data-craft="${k}"]`); }
});
