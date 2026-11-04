// 햇차 (★5) · 생차 (P12-09, P12-10)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const st = E.create(new Date(2026, 9, 5, 6, 0, 0).getTime()), cal = E.calendar(st.virtual), sk = E.seasonKey(st, cal);
const P = (type, q) => { const p = { id: st.nextId++, type, q, seasonKey: sk }; st.petals.push(p); return p; };
// P77-C 티백 하나 = 같은 꽃 petals장 (장미 5 · 연꽃 8)
const Pn = (type, q) => Array.from({ length: E.FLOWERS[type].petals }, () => P(type, q)).map(p => p.id);
const a = Pn('rose', 0.95), b = Pn('rose', 0.6), c = Pn('lotus', 0.85), d = Pn('lotus', 0.85);
check(!E.makeTea(st, [a[0]], {}).ok && st.petals.length === 26, 'P77-C 장미 1장으로는 티백이 안 됨');
const rt = E.makeTea(st, [...a, ...b], {});
check(rt.ok && rt.msg === '꽃잎 10장으로 티백 2개를 만들었어요' && st.teas.length === 2, `P77-C 장미 10장 → 티백 2개 (좋은 것부터 5장씩 · "${rt.msg}")`);
const ta = st.teas.find(t => t.q === 0.95), tb = st.teas.find(t => t.q === 0.6);
check(ta.hat && !tb.hat, '★5 꽃잎 티백만 햇차');
const base = E.teaValue(E.FLOWERS.rose, 0.95, true);
check(E.teaItemValue(st, ta, cal) === Math.round(E.FLOWERS.rose.teaBase * 1.45 * 1.1 / 10) * 10, '햇차 값 +10% (제철 보너스는 10-06에 없앰)');
const r = E.makeRaw(st, c, {});
const tr = st.teas.find(t => t.raw);
check(r.ok && tr && tr.hat && st.dex.teabag.lotus, '생화 티백도 티백 도감에 등록 (★5면 햇차)');
check(E.teaItemValue(st, tr, cal) === Math.round(E.FLOWERS.lotus.teaBase * 8 / 5 * 1.35 * 1.1 * 0.9 / 10) * 10, 'P77-C 생화 티백 값 −10% (연꽃 8장이라 × 8/5)');
E.makeTea(st, d, {});
const tbag = st.teas.find(t => !t.raw && t.type === 'lotus');
E.advance(st, st.virtual + 12 * E.HOUR, { live: false, rng: () => 0.5 });
check(Math.abs(tr.q - 0.85) < 0.001 && Math.abs(tbag.q - 0.85) < 0.001, '한 달 뒤에도 생화 티백 · 티백 품질 그대로');
const pp = { id: st.nextId++, type: 'rose', q: 0.9, seasonKey: 0 }; st.petals.push(pp); E.advance(st, st.virtual + 12 * E.HOUR, { live: false, rng: () => 0.5 });
check(Math.abs(pp.q - 0.7) < 0.01, '티백으로 안 만든 생화는 한 달에 −20%');
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
