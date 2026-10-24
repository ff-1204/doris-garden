// 경제 시뮬레이션: 부지런한 정원사가 몇 해 동안 어떻게 벌고 쓰는지 (node flower-land/tools/sim-economy.js [해 수] [씨앗] [--no-spend])
// --no-spend: 찻집 가꾸기 · 장식을 사지 않는 정원사 (P17-14-08 기준선과 비교할 때)
// 정책: 판매 기간마다 꽃마다 3포기까지 사서 3칸 간격으로 심고, 2시간마다 돌보기 · 용품은 모자라기 전에 삼
//       꽃잎은 모두 꽃방에 말리고, 찻집이 열리면 레시피 블렌드 → 블렌드 티백, 남은 말린 꽃잎은 티백 → 모두 우려 바로 판매
const path = require('path');
const E = require(path.join(__dirname, '..', 'engine.js'));
const args = process.argv.slice(2).filter(a => !a.startsWith('--')), NO_SPEND = process.argv.includes('--no-spend');
const YEARS = +(args[0] || 4), SEED = +(args[1] || 7);
let s = SEED; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
const H = E.HOUR;
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const st = E.create(mon + 0.1 * H, rng);
const ctx = { live: false, rng };   // rng가 없으면 번식이 Math.random을 써서 같은 씨앗이어도 결과가 달라짐
const ledger = {}; const add = (yr, k, v) => { (ledger[yr] = ledger[yr] || {})[k] = (ledger[yr][k] || 0) + v; };
const spots = []; for (let y = 2; y < E.H - 1; y += 3) for (let x = 2; x < E.W - 1; x += 3) spots.push([x, y]);
const yearNow = () => E.yearOf(st, E.calendar(st.virtual));
const KEEP = { water: 8, hoe: 6, basket: 6, shears: 4 };
function spend(k, fn) { const m = st.money, r = fn(); if (r && r.ok) add(yearNow(), k, st.money - m); return r; }
function act() {
  const cal = E.calendar(st.virtual), yr = yearNow();
  // 용품
  for (const [k, n] of Object.entries(KEEP)) while ((st[k] || 0) < n && st.money >= E.SUPPLIES[k].price + 500) spend('용품', () => E.buySupply(st, k, 1));
  // 찻집 가꾸기 (P17-15): 돈이 넉넉하면(값 + 20,000원 남음) 손님 자리 → 찻잔 세트 → 간판 순서로
  const sh = E.shopOf(st), nx = E.SEATS[sh.seats + 1];
  if (!NO_SPEND && nx && st.money >= nx.price + 20000) spend('찻집 가꾸기', () => E.addSeat(st));
  for (const [kind, list] of [['cup', E.CUP_SETS], ['sign', E.SIGNS]]) for (const [k, it] of Object.entries(list)) if (!NO_SPEND && !(kind === 'cup' ? sh.cups : sh.signs).includes(k) && st.money >= it.price + 20000) spend('찻집 가꾸기', () => E.buyDecor(st, kind, k));
  // 정원 장식 (P17-16): 이달 장식을 아직 없고 돈이 넉넉하면(값 + 20,000원 남음) 하나
  for (const k of E.decoOffer(cal)) if (!NO_SPEND && !(st.dex.deco || {})[k] && st.money >= E.DECOS[k].price + 20000) spend('장식', () => E.buyDeco(st, k));
  if (!cal.frozen) {
    // 꽃 사기 (꽃마다 정원 + 창고 3포기까지, 돈은 2,000원 남김)
    for (const k of E.FLOWER_KEYS) {
      const F = E.FLOWERS[k]; if (!F.sow.includes(cal.month)) continue;
      const have = st.flowers.filter(f => f.type === k && !f.withered).length + st.items.filter(i => i.type === k).length;
      if (have < 3 && st.money - F.price >= 2000) spend('꽃 사기', () => E.buy(st, k, 1));
    }
    // 심기
    for (const it of st.items.slice()) {
      if (!E.FLOWERS[it.type].sow.includes(cal.month) || E.germOf(it) <= 0) continue;
      const sp = spots.find(([x, y]) => !E.flowerAt(st, x, y)); if (!sp) break;
      const r = E.plant(st, it.id, sp[0], sp[1], rng);
      if (r.ok && r.flower) add(yr, '심은 꽃', 1);   // 싹이 터서 정원에 자리 잡은 것만 (안 튼 씨앗은 비료)
    }
    // 돌보기
    const tiles = st.flowers.map(f => [f.x, f.y]);
    for (const t of ['water', 'weed', 'prune', 'harvest', 'fert']) for (const tl of tiles) E.care(st, t, [tl], ctx);
    for (const f of st.flowers) E.propagate(st, f.id, rng, ctx);
    // 꽃잎은 모두 꽃방에
    if (st.petals.length) E.dryPetals(st, st.petals.map(p => p.id));
  }
  // 찻집이 열리면: 레시피 블렌드 → 블렌드 티백 → 남은 말린 꽃잎 티백 → 우려서 바로 판매
  if (E.teaShopOpen(cal)) {
    let made = true;
    while (made) {
      made = false;
      for (const k of E.BLEND_KEYS) {
        const ids = E.BLENDS[k].parts.map(p => st.dried.filter(d => d.type === p).sort((a, b) => b.q - a.q)[0]);
        if (ids.every(Boolean)) { E.blend(st, ids.map(d => d.id), ctx); made = true; }
      }
    }
    const loose = st.blends.filter(b => !b.bagged); if (loose.length) E.bagBlends(st, loose.map(b => b.id), ctx);
    if (st.dried.length) E.makeTeaDried(st, st.dried.map(d => d.id), ctx);
    if (st.teas.length || st.blends.length) E.brew(st, st.teas.map(t => t.id), st.blends.map(b => b.id));
    if (st.cups && st.cups.length) {
      for (const c of st.cups) add(yr, c.kind === 'blend' ? (c.recipe ? '찻집: 레시피 블렌드' : '찻집: 블렌드') : '찻집: 티백 차', E.cupValue(st, c, cal));
      add(yr, '잔 수', st.cups.length);
      add(yr, '제철 잔', st.cups.filter(c => c.kind === 'tea' && E.isFresh(st, c, cal)).length);
      add(yr, '식은 잔', st.cups.filter(c => E.cupCold(c, cal)).length);
      E.sellCups(st, st.cups.map(c => c.id), ctx);
    }
  }
}
const end = st.virtual + YEARS * 7 * 24 * H;
let lastIdx = E.calendar(st.virtual).idx, help0 = st.helpYear;
while (st.virtual < end) {
  act();
  const m0 = st.money, yr = yearNow();
  E.advance(st, st.virtual + 2 * H, ctx);
  const c = E.calendar(st.virtual);
  if (c.idx !== lastIdx && c.idx % 2 === 0) add(yr, '하루 용돈', E.DAILY_GIFT);
  if (st.helpYear !== help0) { add(yr, '막힘 방지', 5000); help0 = st.helpYear; }
  lastIdx = c.idx;
  add(yr, '_기타', st.money - m0);
  ledger[yr]['연말 돈'] = st.money;   // 해마다 마지막으로 덮어쓴 값 = 그해 끝의 돈
}
// 표
const keys = ['하루 용돈', '찻집: 티백 차', '찻집: 블렌드', '찻집: 레시피 블렌드', '막힘 방지', '꽃 사기', '용품', '찻집 가꾸기', '장식', '잔 수', '제철 잔', '식은 잔', '연말 돈', '심은 꽃'];
console.log(['해', ...keys].join('\t'));
for (const yr of Object.keys(ledger).sort((a, b) => a - b)) {
  const L = ledger[yr];
  console.log([yr, ...keys.map(k => Math.round(L[k] || 0))].join('\t'));
}
console.log(`끝: 돈 ${st.money} · 정원 ${st.flowers.filter(f => !f.withered).length}포기 · 도감 ${E.dexCount(st)}/${E.DEX_TOTAL}`);
