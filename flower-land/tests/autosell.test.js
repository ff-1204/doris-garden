// 카운터 찻잔 자동 판매 (P17-11)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };
const st = E.create(MON);
E.advance(st, MON + 5 * 24 * E.HOUR + 60e3, ctx);   // 토요일 (열림)
for (let i = 0; i < 3; i++) st.teas.push({ id: 700 + i, type: 'lotus', q: 0.8, seasonKey: -1 });
E.brew(st, [700, 701, 702], []);
const m0 = st.money;
E.advance(st, st.virtual + 2.5 * E.HOUR, ctx);
check(st.cups.length === 1 && st.money > m0, '2시간 반 뒤 찻잔 2잔이 저절로 팔림, 1잔 남음');
check(st.log.some(l => l.type === 13 && l.text.includes('2잔')), '정원 일지에 "손님이 찻잔 2잔을 사 갔어요"');
check(st.dex.tea.lotus != null, '자동 판매도 차 도감 등록');
E.advance(st, st.virtual + 1 * E.HOUR, ctx);
check(st.cups.length === 0 && st.cupTimerH === 0, '마지막 잔도 팔리고 타이머 초기화');
// 닫혔을 땐 팔리지 않음
const st2 = E.create(MON); st2.cups = [{ id: 1, kind: 'tea', type: 'rose', q: 0.5, seasonKey: -1, brewAbs: 0 }];
E.advance(st2, MON + 3 * E.HOUR, ctx);
check(st2.cups.length === 1, '찻집이 닫힌 평일엔 팔리지 않음');
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
