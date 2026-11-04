const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fail = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
const sum = (parts, q) => parts.reduce((a, k) => a + E.teaValue(E.FLOWERS[k], q, false), 0);
const r = { parts: ['chamomile', 'rose'], q: 0.8 }, f = { parts: ['chamomile', 'bpea'], q: 0.8 };
check(E.blendValue(r) === Math.round(sum(r.parts, .8) * 1.5 / 10) * 10, `레시피(봄 들판) × 1.5 = ${E.blendValue(r)}`);
check(E.blendValue(f) === Math.round(sum(f.parts, .8) * 1.2 / 10) * 10, `레시피에 없는 블렌드 × 1.2 = ${E.blendValue(f)}`);
check(E.blendValue({ parts: ['rose', 'chamomile'], q: .8 }) === E.blendValue(r), '재료 순서가 달라도 같음');
check(E.blendValue({ parts: ['chamomile', 'rose', 'bpea'], q: .8 }) === Math.round(sum(['chamomile', 'rose', 'bpea'], .8) * 1.2 / 10) * 10, '레시피에 하나를 더 넣으면 레시피가 아님 × 1.2');
console.log(fail ? `결과: ${fail}개 실패` : '결과: 모두 통과');
