// 처음부터 다시 시작은 1년차 동안만 (변경 10-27, 사용자 요청) — 2년차부터는 설정에 줄째로 안 보임
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };
const at = (st, ms) => E.canReset(st, E.calendar(ms));

const st = E.create(MON + 30 * H);
check(E.yearOf(st, E.calendar(st.virtual)) === 1 && at(st, st.virtual), '1년차 새 정원은 다시 시작이 보임');

// 1년차 꽃잠 (일요일 쉼달 · 꽃샘달)은 아직 1년차
const SUN = MON + 6 * 24 * H;
check(E.calendar(SUN + 3 * H).frozen && at(st, SUN + 3 * H), '1년차 꽃잠(쉼달)에도 보임');
check(E.calendar(SUN + 20 * H).month === 14 && at(st, SUN + 20 * H), '1년차 꽃샘달에도 보임');

// 일요일에 시작한 0년차 꽃잠도 첫해라 보임
const sun = E.create(SUN + 3 * H);
check(E.yearOf(sun, E.calendar(sun.virtual)) === 0 && at(sun, sun.virtual), '일요일에 시작한 0년차 꽃잠에도 보임');

// 시간을 흘려 2년차 3월이 되면 숨김
E.advance(st, MON + 7 * 24 * H + 60e3, ctx);
const c2 = E.calendar(st.virtual);
check(E.yearOf(st, c2) === 2 && c2.month === 3 && !E.canReset(st, c2), '2년차 첫 달(3월)엔 숨김');

// 이미 5년차인 정원도 숨김
const c5 = E.calendar(MON + 4 * 7 * 24 * H + 5 * H);
check(E.yearOf(st, c5) === 5 && !E.canReset(st, c5), '5년차 정원은 숨김');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
