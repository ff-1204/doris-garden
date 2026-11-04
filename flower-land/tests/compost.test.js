// 곧 시드는 씨앗·묘목 5% 이하 → 비료 (P06-14-05)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const st = E.create(new Date(2026, 9, 5, 6, 0, 0).getTime());
const mk = (q, ageM, packaged) => { const it = { id: st.nextId++, type: 'chamomile', q, ageH: ageM * E.MONTH_H, packaged: !!packaged, origin: '화원', got: st.virtual }; st.items.push(it); return it; };
const a = mk(0.05, 11), b = mk(0.04, 12), c = mk(0.3, 11), d = mk(0.03, 5), e = mk(0.02, 11, true);
check(E.compostable(a) && E.compostable(b), '10달 넘고 5% 이하면 비료로 만들 수 있음');
check(!E.compostable(c), '품질 30%는 안 됨');
check(!E.compostable(d), '받은 지 5달이면 안 됨 (곧 시드는 것만)');
check(!E.compostable(e), '특수 포장(예약)은 안 됨');
const f0 = st.fert, n0 = st.items.length;
const r = E.compostItems(st, [a.id, b.id, c.id]);
check(r.ok && st.fert === f0 + 2 && st.items.length === n0 - 2, '되는 것 2개만 비료 2개로');
check(!E.compostItems(st, [c.id]).ok, '안 되는 것만 고르면 거절');
// 0%는 저절로 비료
const z = mk(0.001, 21), y = mk(0.001, 21, true), w = mk(0.2, 21);
const f1 = st.fert;
check(E.autoCompost(st) === 1 && st.fert === f1 + 1 && !st.items.includes(z), '0%이고 곧 시드는 것은 저절로 비료 1개');
check(st.items.includes(y) && st.items.includes(w), '특수 포장과 20%는 그대로');
check(st.log.some(l => l.text.includes('다 시들어 비료가 되었어요')), '정원 일지에 한 줄');
const v = mk(0.0, 20); E.advance(st, st.virtual + 2 * E.HOUR, { live: false, rng: () => 0.5 });
check(!st.items.includes(v), '시간이 흐르면 저절로 처리');
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
