// P27 🔆 생장 장치: 생장등 · 온상 매트 · 유리 온실 — 다 자라기까지 걸리는 시간만 줄임
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const fl = (st, type, x, y, stage) => { const f = { id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: stage || 'young', withered: false, ageH: 1, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }; st.flowers.push(f); return f; };

console.log('[사기 · 늘 팖]');
const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); st.money = 1e6;
check(['growlight', 'heatmat', 'greenhouse'].every(k => E.decoOffer(E.calendar(st.virtual)).includes(k)), '3월 화원에 세 가지 모두');
const sl = E.create(at(c => c.month === 13), () => 0.5); sl.money = 1e6;
check(E.buyDeco(sl, 'growlight').ok, '꽃잠에도 살 수 있음');
const gh = E.buyDeco(st, 'greenhouse');
check(gh.ok && st.money === 1e6 - 120000 && !E.buyDeco(st, 'greenhouse').ok, '유리 온실 120,000원 · 하나만');
const gl = E.buyDeco(st, 'growlight').deco, hm = E.buyDeco(st, 'heatmat').deco;

console.log('[둘레 · 배율]');
E.placeDeco(st, gl.id, 5, 5); E.placeDeco(st, hm.id, 20, 5); E.placeDeco(st, gh.deco.id, 10, 15);
const a = fl(st, 'rose', 6, 6), far = fl(st, 'rose', 8, 5), s1 = fl(st, 'chamomile', 21, 5, 'sprout'), s2 = fl(st, 'rose', 21, 6, 'young'), g2 = fl(st, 'maehwa', 12, 13);
check(E.growRate(st, a) === 1.5 && E.growRate(st, far) === 1, '생장등: 바로 옆 1.5배, 2칸 밖은 그대로');
check(E.growRate(st, s1) === 2 && E.growRate(st, s2) === 1, '온상 매트: 싹 · 새싹만 2배 (자라는 중이면 그대로)');
check(E.growRate(st, g2) === 2, '유리 온실: 둘레 2칸 2배');
const both = fl(st, 'rose', 6, 4); const gl2 = E.buyDeco(st, 'growlight').deco; E.placeDeco(st, gl2.id, 6, 3);
check(E.growRate(st, both) === 1.5, '겹쳐도 가장 빠른 것 하나만 (1.5 × 1.5가 아님)');

console.log('[실제로 빨리 자람 · 피는 달은 그대로]');
const run = rate => {
  const s = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); s.money = 1e6;
  const f = fl(s, 'maehwa', 3, 3);
  if (rate) { const d = E.buyDeco(s, 'greenhouse').deco; E.placeDeco(s, d.id, 3, 4); }
  E.advance(s, s.virtual + 24 * H, { live: false, rng: () => 0.5 });
  return f;
};
const plain = run(false), fast = run(true);
check(Math.abs(fast.ageH / plain.ageH - 2) < 0.05, `온실 안 매화는 같은 시간에 2배 자람 (${Math.round(plain.ageH)} → ${Math.round(fast.ageH)}시간)`);
const big = E.create(at(c => c.month === 5 && !c.frozen), () => 0.5); big.money = 1e6;
const mt = fl(big, 'maehwa', 3, 3); mt.ageH = 9999; const d = E.buyDeco(big, 'greenhouse').deco; E.placeDeco(big, d.id, 3, 4);
E.advance(big, big.virtual + 2 * H, { live: false, rng: () => 0.5 });
check(mt.stage !== 'bloom', '다 자란 매화도 온실 안에서 5월엔 피지 않음 (피는 달 2 · 3월 그대로)');
const fr = E.create(at(c => c.month === 13), () => 0.5); fr.money = 1e6; const ff = fl(fr, 'rose', 3, 3); const age0 = ff.ageH;
const gd = E.buyDeco(fr, 'greenhouse').deco; E.placeDeco(fr, gd.id, 3, 4); E.advance(fr, fr.virtual + 3 * H);
check(ff.ageH === age0, '꽃잠엔 온실 안에서도 자라지 않음');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
