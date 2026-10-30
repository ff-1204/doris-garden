// 우림 → 찻잔 → 판매 (P17-10)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };
const st = E.create(MON);
st.teas.push({ id: 800, type: 'lotus', q: 0.9, seasonKey: -1, hat: true });
st.blends.push({ id: 801, parts: ['chamomile', 'rose'], q: 0.8, recipe: 'springfield', name: '봄 들판' });
check(E.bagBlends(st, [801], ctx).ok && st.blends[0].bagged && st.dex.bagBlend.springfield, '블렌드를 티백으로 (블렌드 티백 도감)');
check(E.teaShopOpen(E.calendar(st.virtual)), 'P34 평일(3월)에도 찻집이 열려 있음');
E.advance(st, MON + 5 * 24 * E.HOUR + 60e3, ctx);                     // 토요일 1월
const r = E.brew(st, [800], [801]);
check(r.ok && st.cups.length === 2 && !st.teas.length && !st.blends.length, '토요일에 우려서 찻잔 2잔');
const cal = E.calendar(st.virtual), v = st.cups.map(c => E.cupValue(st, c, cal));
check(v[0] === E.teaItemValue(st, st.cups[0], cal) && v[1] === E.blendValue(st.cups[1]), '갓 우린 찻잔 값 = 원래 값');
const cal2 = E.calendar(cal.slotEnd + 60e3);                           // 다음 달 달력으로 식음 확인 (자동 판매 전에)
check(E.cupCold(st.cups[0], cal2) && E.cupValue(st, st.cups[0], cal2) === Math.round(E.teaItemValue(st, st.cups[0], cal2) * 0.5 / 10) * 10, '달이 지나면 식어서 값 반');
const m0 = st.money, s = E.sellCups(st, st.cups.map(c => c.id), ctx);
check(s.ok && st.money > m0 && !st.cups.length && st.dex.tea.lotus != null, '찻잔 판매, 차 도감 등록');
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
