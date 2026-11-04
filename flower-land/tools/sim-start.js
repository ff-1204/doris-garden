// 첫 방문 시뮬레이션 (P22, 10-24): 요일 · 시각마다 처음 시작한 정원사가 언제 무엇을 처음 하게 되는지
// node flower-land/tools/sim-start.js [씨앗] [--no-gift] (--no-gift: 이웃의 화분 P22-02 없이, 10-24 조사 때와 같게) — 14달(월 06시 3월 ~ 일 18시 꽃샘달) 시작마다 한 줄
// 정원사: 1시간마다 들어와 화원의 제철 꽃(싼 것부터, 캐모마일 먼저)을 사서 심고, 돌보고, 거두고, 꽃방에 말리고, 티백 · 우림 · 판매
const path = require('path');
const E = require(path.join(__dirname, '..', 'engine.js'));
const SEED = +(process.argv.slice(2).find(a => !a.startsWith('--')) || 7), H = E.HOUR, GIFT = !process.argv.includes('--no-gift');
const weekStart = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 2000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const DAY = '월화수목금토일';
const fmt = h => h == null ? '—' : h < 24 ? `${Math.round(h)}시간` : `${(h / 24).toFixed(1)}일`;
function run(startT) {
  let s = SEED; const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const st = E.create(startT, rng), ctx = { live: false, rng }; st.gardenId = `start-${SEED}`;   // 매번 같은 값
  st.onboarded = true; if (GIFT) E.giftPot(st, ctx);
  const first = {}, mark = (k, t) => { if (first[k] == null) first[k] = (t - startT) / H; };
  let idle = 0, steps = 0;
  const spots = []; for (let y = 2; y < E.H - 1; y += 3) for (let x = 2; x < E.W - 1; x += 3) spots.push([x, y]);
  const end = startT + 7 * 24 * H;
  while (st.virtual < end) {
    const cal = E.calendar(st.virtual), t = st.virtual; let did = false;
    if (!cal.frozen) {
      const sale = E.FLOWER_KEYS.filter(k => E.FLOWERS[k].sow.includes(cal.month)).sort((a, b) => (b === 'chamomile') - (a === 'chamomile') || E.FLOWERS[a].price - E.FLOWERS[b].price);
      for (const k of sale) {
        const have = st.flowers.filter(f => f.type === k).length + st.items.filter(i => i.type === k).length;
        if (have < 3 && st.money - E.FLOWERS[k].price >= 1000 && E.buy(st, k, 1).ok) { did = true; mark('buy', t); }
      }
      for (const it of st.items.slice()) {
        if (!E.FLOWERS[it.type].sow.includes(cal.month) || E.germOf(it) <= 0) continue;
        const sp = spots.find(([x, y]) => !E.flowerAt(st, x, y)); if (!sp) break;
        if (E.plant(st, it.id, sp[0], sp[1], rng).ok) { did = true; mark('plant', t); }
      }
      for (const k of ['water', 'weed', 'prune', 'harvest', 'fert']) for (const f of st.flowers) if (E.canCare(st, f, k, cal)) { const r = E.care(st, k, [[f.x, f.y]], ctx); if (r.ok) { did = true; if (k === 'harvest') mark('harvest', t); } }
      if (st.petals.length) { E.dryPetals(st, st.petals.map(p => p.id)); did = true; }
    }
    if (st.flowers.some(f => f.stage === 'bloom')) mark('bloom', t);
    if (st.dex.flower.chamomile) mark('chamomile', t);
    if (st.dried.filter(p => p.gift).length >= 2) { const b = E.blend(st, st.dried.filter(p => p.gift).map(p => p.id), ctx); if (b.ok) { E.bagBlends(st, [b.blend.id], ctx); did = true; mark('blend', t); } }   // P22-05 꾸러미 꽃잎은 블렌딩
    if (st.dried.length) { E.makeTeaDried(st, st.dried.map(d => d.id), ctx); did = true; mark('teabag', t); }
    if (E.firstGuestReady && E.firstGuestReady(st) && st.teas.length) { const f = E.firstGuest(st, st.teas[0].id, ctx); if (f.ok) { did = true; mark('sell', t); } }   // P22-05 🍵 첫 손님
    if (E.teaShopOpen(cal) && st.teas.length) { E.brew(st, st.teas.map(x => x.id), []); did = true; }
    if (st.cups && st.cups.length && E.teaShopOpen(cal)) { E.sellCups(st, st.cups.map(c => c.id), ctx); did = true; mark('sell', t); }
    if (E.chapterDone && E.chapterDone(st, 'c1')) mark('c1', t);
    steps++; if (!did) idle++;
    E.advance(st, st.virtual + H, ctx);
  }
  return { first, idle: idle / steps, money: st.money, dex: E.dexCount(st), titles: Object.keys(st.titles).length };
}
console.log(['시작', '처음 심기', '첫 개화', '첫 수확', '첫 티백', '첫 판매', '첫 블렌딩', '캐모마일 개화', '1장 끝', '할 일 없는 시간', '1주 뒤 돈', '도감'].join('\t'));
for (let slot = 0; slot < 14; slot++) for (const off of [0.5, 9]) {          // 그 달이 막 시작했을 때 · 거의 끝날 때 (한 달 = 12시간)
  const t0 = weekStart + slot * 12 * H + off * H, c = E.calendar(t0), r = run(t0);
  const hAll = 6 + slot * 12 + Math.floor(off), hh = hAll % 24, day = Math.floor(hAll / 24) % 7;   // 월 06시부터 센 현실 시각
  console.log([`${DAY[day]} ${String(hh).padStart(2, '0')}시 (${E.monthName(c.month)})`, fmt(r.first.plant), fmt(r.first.bloom), fmt(r.first.harvest), fmt(r.first.teabag), fmt(r.first.sell), fmt(r.first.blend), fmt(r.first.chamomile), fmt(r.first.c1), `${Math.round(r.idle * 100)}%`, r.money, r.dex].join('\t'));
}
