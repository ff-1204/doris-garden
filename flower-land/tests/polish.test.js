// 10-24 다듬기: ★5 꽃잎만 섞은 블렌드는 🍃 햇차 (값은 블렌드 배율 그대로, 햇차 잔 수에 셈)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const st = E.create(at(c => c.month === 12 && !c.frozen), () => 0.5);
st.dried.push({ id: 1, type: 'chamomile', q: 0.95 }, { id: 2, type: 'rose', q: 0.92 }, { id: 3, type: 'lavender', q: 0.95 }, { id: 4, type: 'rose', q: 0.7 });
const a = E.blend(st, [1, 2]).blend, b = E.blend(st, [3, 4]).blend;
check(a.hat === true && b.hat === false, '★5 꽃잎만이면 햇차, 하나라도 아니면 아님');
check(E.blendValue(a) === E.blendValue({ ...a, hat: false }), '값은 그대로');
E.bagBlends(st, [a.id]); E.brew(st, [], [a.id]);
const h0 = (st.stats || {}).hatCups || 0; E.sellCups(st, st.cups.map(c => c.id));
check(((st.stats || {}).hatCups || 0) === h0 + 1, '햇차 블렌드 잔도 햇차 잔 수에 셈');
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
