// 꽃잠(일요일)에 시작하면 그 꽃잠은 0년차, 1년차는 다음 월요일 3월부터 (P04-05)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };

// 평일 시작은 예전 그대로
const wk = E.create(MON + 30 * H);
check(!wk.startedInSleep && E.yearOf(wk, E.calendar(wk.virtual)) === 1, '화요일에 시작하면 바로 1년차');

// 일요일 오후 시작
const SUN = MON + 6 * 24 * H + 3 * H;
const st = E.create(SUN);
check(st.startedInSleep && E.calendar(SUN).frozen, '일요일 시작은 꽃잠 시작으로 표시');
check(E.yearOf(st, E.calendar(SUN)) === 0, '시작한 꽃잠은 0년차');
const r = E.reserve(st, [{ type: 'chamomile', window: E.FLOWERS.chamomile.windows[0][0], qty: 1 }]);
check(r.ok && st.reservations[0].year === 1, '꽃잠에 한 예약은 1년차 몫');

// 월요일 06시가 지나면 1년차 3월
E.advance(st, SUN + 21 * H + 60e3, ctx);   // 일요일 09시 + 21시간 = 월요일 06시
const c1 = E.calendar(st.virtual);
check(c1.month === 3 && E.yearOf(st, c1) === 1, '다음 월요일 06시 = 1년차 3월');
check(st.items.some(it => it.type === 'chamomile'), '예약한 캐모마일이 1년차에 창고로 옴');
check(!st.records.length, '1년차 3월이 오기 전엔 한 해 기록이 없음');

// 그다음 꽃잠에서 1년차가 기록됨 (1년차가 몇 시간으로 끝나지 않음)
E.advance(st, SUN + 7 * 24 * H, ctx);
check(st.records.length === 1 && st.records[0].year === 1, '다음 일요일에 1년차 기록');

// 일요일 저녁(꽃샘달) 시작도 같음
const eve = E.create(MON + 6 * 24 * H + 13 * H);
check(E.calendar(eve.virtual).month === 14 && E.yearOf(eve, E.calendar(eve.virtual)) === 0, '꽃샘달 시작도 0년차');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
