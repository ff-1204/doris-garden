// P57 🎨 화면 깨짐 검사 — 개발용, 배포본(build-site FILES)에 넣지 않음 · 화면에 단추도 없음
// 쓰는 법 (localhost 미리보기에서 브라우저 개발자 도구 콘솔):
//   const s = document.createElement('script'); s.src = 'tools/layout-check.js'; document.head.append(s);
//   layoutCheck()               지금 보이는 화면만 → { n, list }
//   await layoutCheck.tabs()    보이는 탭을 차례로 눌러 모두 → { 탭: { n, list } } (끝나면 처음 탭으로)
//   await layoutCheck.all()     탭 모두 + 화원 "모든 꽃" + 주요 창(용품 · 편지함 · 일지 · 도감 꽃 · 설정)
//   layoutCheck.sum(r) · layoutCheck.detail(r)   보기마다 건수 · 한 줄씩 자세히
//   layoutCheck.print(r)        console.table로
// 찾는 것 네 가지 (1px 넘게):
//   out   카드(CARD 목록 · 창) 안 요소가 카드 박스 밖으로 나감 — 스크롤 칸 안은 빼고, 일부러 걸친 배지(ALLOW_OUT)는 8px까지 봐줌
//   over  같은 부모의 형제 카드끼리 겹침 (grid · flex 안 칸)
//   hscroll  가로 스크롤 — 문서 · 탭 판(scrollWidth > clientWidth)
//   clip  글자 잘림 — nowrap인데 scrollWidth > clientWidth (줄임표 text-overflow: ellipsis는 일부러 줄인 것이라 셈하지 않음)
(function () {
  const CARD = ['.card', '.shopcard', '.decocard', '.decotile', '.dexcard', '.pcard', '.arcard', '.mcraft', '.suptile',
    '.up-tile', '.setcard2', '.mn-sec', '.fo-slot', '.rc-item', '.ttl-card', '.yc-cell', '.gr-deco', '.status', '.counter', '.blendbox',
    '.cab-empty', '.rv-bar', '.shop-sign', '.shop-news', '.mine-it', '.mn-blend', '.cf-slip', '.q-row', '.wk-row', '.sp-path', '.imp-col', '.speedgrid button',
    '.modal', '.guide', '.rec-chip', '.dexchip', '.fs-step', '.rv-row', '.sx-stats > div', '.ct', '.decotop', '.rv-chip', '.honeyshelf'].join(',');
  const ALLOW_OUT = ['.ar-n', '.ct .ci i', '.beq-x', '.sc-form', '.sc-last', '.tab-dot', '.ib-new', '.yg-dot', '.fo-vis', '.blend-art img', '.ss-board', '.mc-st', '.cf-more', '.cf-cup'].join(',');
  const SCROLLER = v => v === 'auto' || v === 'scroll' || v === 'hidden' || v === 'clip';
  const visible = el => {
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    if (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) return false;   // 닫힌 <details> 안 · visibility: hidden
    if (el.closest('details:not([open]) > :not(summary)')) return false;
    const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; const c = [...el.classList].slice(0, 3).join('.'); if (c) s += '.' + c; const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24); return t ? `${s} "${t}"` : s; };
  const where = el => { const p = el.closest('.panel, .modal, .topbar, nav.tabs'); return p ? (p.id || p.className.split(' ')[0]) : '-'; };
  // 카드와 요소 사이에 스크롤 · 잘림 칸이 있으면 밖으로 나가도 보이지 않음
  const clippedWithin = (el, card) => { for (let p = el.parentElement; p && p !== card; p = p.parentElement) { const cs = getComputedStyle(p); if (SCROLLER(cs.overflowX) || SCROLLER(cs.overflowY)) return true; } return false; };
  function check(root) {
    root = root || document;
    const list = [], add = (kind, el, info) => list.push({ kind, where: where(el), el: name(el), info, node: el });
    const scope = [...root.querySelectorAll(CARD)].filter(visible);
    // out
    for (const card of scope) {
      const cr = card.getBoundingClientRect(), ccs = getComputedStyle(card);
      if (SCROLLER(ccs.overflowX) && SCROLLER(ccs.overflowY)) continue;
      const hit = [];
      for (const el of card.querySelectorAll('*')) {
        if (hit.some(h => h.contains(el)) || !visible(el) || clippedWithin(el, card)) continue;
        const r = el.getBoundingClientRect(), d = Math.max(cr.left - r.left, r.right - cr.right, cr.top - r.top, r.bottom - cr.bottom);
        if (d <= 1) continue;
        if (d <= 8 && el.matches(ALLOW_OUT)) continue;
        if (el.closest(CARD) !== card && el.closest(CARD) && card.contains(el.closest(CARD))) continue;   // 안쪽 카드가 따로 봄
        add('out', el, `${Math.round(d)}px 밖 (${name(card).split(' ')[0]})`);
        hit.push(el);   // 그 안쪽 요소는 다시 세지 않음
      }
    }
    // over: grid · flex 안 형제 카드
    const parents = new Set(scope.map(c => c.parentElement));
    for (const p of parents) {
      const ds = getComputedStyle(p).display; if (!/grid|flex/.test(ds)) continue;
      const kids = [...p.children].filter(k => k.matches(CARD) && visible(k) && !/absolute|fixed/.test(getComputedStyle(k).position));
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 1 && h > 1) add('over', kids[i], `${Math.round(w)}×${Math.round(h)} 겹침 ↔ ${name(kids[j])}`);
      }
    }
    // hscroll
    const de = document.documentElement;
    if (de.scrollWidth > de.clientWidth + 1) add('hscroll', de, `문서 ${de.scrollWidth} > ${de.clientWidth}`);
    for (const el of document.querySelectorAll('main, .panel.on, .modal .content, .overlay')) {
      if (!visible(el)) continue; const cs = getComputedStyle(el);
      if (cs.overflowX !== 'visible' && cs.overflowX !== 'clip' && el.scrollWidth > el.clientWidth + 1) add('hscroll', el, `${el.scrollWidth} > ${el.clientWidth}`);
    }
    // clip
    for (const el of root.querySelectorAll('body *')) {
      if (!el.firstChild || !visible(el)) continue;
      const cs = getComputedStyle(el); if (!/nowrap|pre/.test(cs.whiteSpace) || cs.textOverflow === 'ellipsis') continue;
      if (el.closest('canvas, svg, .stable .st-wrap, .ec-wrap, .yg-table, .legend2.on-map, .sup-tabs')) continue;   // 일부러 옆으로 미는 표 · 칩 줄
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && !/inline$/.test(cs.display)) add('clip', el, `${el.scrollWidth} > ${el.clientWidth}`);
    }
    return { n: list.length, list };
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function tabs(opt) {
    opt = opt || {};
    const btns = [...document.querySelectorAll('nav.tabs button')].filter(b => !b.hidden);
    const start = btns.find(b => b.getAttribute('aria-selected') === 'true'), out = {};
    for (const b of btns) { b.click(); await wait(opt.wait || 250); out[b.dataset.tab] = check(); }
    if (start) { start.click(); await wait(100); }
    return out;
  }
  // 탭 모두 + 화원 "모든 꽃" 보기 + 주요 창 몇 개 (이 게임의 전역 함수를 부름 — 없으면 건너뜀)
  async function all(opt) {
    opt = opt || {};
    const out = await tabs(opt), g = window;
    // ui는 app.js의 맨 위 const라 window에 없음 — 같은 전역 범위라 이름으로 읽음
    if (typeof g.setTab === 'function' && typeof ui === 'object') {
      const f = ui.shopFilter; g.setTab('shop'); ui.shopFilter = !f; g.renderAll(true); await wait(200); out['shop:' + (f ? 'all' : 'now')] = check(); ui.shopFilter = f; g.renderAll(true);   // eslint-disable-line no-undef
    }
    const modals = [['supply', () => g.openSupply('fert')], ['inbox', () => g.openInbox()], ['log', () => g.openLog()], ['dex', () => g.openDexDetail('flower', 'rose')], ['settings', () => g.openSettings()]];
    for (const [k, f] of modals) {
      try { f(); } catch (e) { continue; }
      await wait(200); if (document.querySelector('.modal')) out['modal:' + k] = check(document.querySelector('.overlay:not([hidden])') || document);
      if (typeof g.closeModal === 'function') g.closeModal(); await wait(50);
    }
    if (typeof g.setTab === 'function') g.setTab(opt.back || 'garden');
    return out;
  }
  function print(r) {
    if (r && r.list) { console.table(r.list.map(({ node, ...x }) => x)); return r.n; }
    console.table(Object.entries(r).map(([t, v]) => ({ tab: t, n: v.n, out: v.list.filter(x => x.kind === 'out').length, over: v.list.filter(x => x.kind === 'over').length, hscroll: v.list.filter(x => x.kind === 'hscroll').length, clip: v.list.filter(x => x.kind === 'clip').length })));
  }
  // 한 줄 요약: { 보기: 건수 } — 0이 아닌 것만 자세히
  const sum = r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.n]));
  const detail = r => Object.entries(r).flatMap(([k, v]) => v.list.map(x => `${k} | ${x.kind} | ${x.el} | ${x.info}`));
  const api = check; api.tabs = tabs; api.all = all; api.print = print; api.check = check; api.sum = sum; api.detail = detail;
  window.layoutCheck = api;
})();
