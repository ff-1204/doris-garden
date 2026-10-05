const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fail = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
const H = E.HOUR;
// 월요일 아침 6시 조금 뒤에 시작
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 400; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 1) return t; t += H; } })();
const st = E.create(mon + 0.5 * H);
const m0 = st.money;
E.advance(st, st.virtual + 10 * H);
check(st.money === m0, '같은 날 안에는 용돈 없음');
E.advance(st, st.virtual + 20 * H);   // 화요일 아침 지남
check(st.money - m0 === 500, '화요일 아침 6시에 500원');
check(st.log.some(l => l.text.includes('화요일 아침, 용돈 500원')), '정원 일지에 한 줄');
const m1 = st.money;
E.advance(st, st.virtual + 6 * 24 * H);   // 한 주 뒤 (일요일 꽃잠 포함)
const n = (st.money - m1) / 500;   // 일지는 쉼달에 기록으로 옮겨지니 돈으로 셈
check(n === 6, `화요일부터 6일 동안 6번 (수~월, 꽃잠 일요일 포함): ${n}번`);
check(st.log.some(l => l.text.includes('월요일 아침, 용돈')), '꽃잠이 지나도 월요일 아침에 받음');
console.log(fail ? `결과: ${fail}개 실패` : '결과: 모두 통과');
