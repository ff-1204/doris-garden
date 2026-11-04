// P50 🪜 광산 층 내려가기 돈 (11-01 사용자 요청 "광산 층 내려갈때마다 2000원씩"): 계단으로 한 층 내려갈 때마다 2,000원
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const ctx = { live: false, rng: () => 0.5 };
const st = E.create(Date.UTC(2026, 9, 5, 3), () => 0.5); st.onboarded = true; st.gardenId = 'p50';
const m = E.mineOf(st); m.energy = 999;
const findStairs = () => { const i = m.board.cells.findIndex(c => c.stairs); E.dig(st, i, ctx); };

console.log('[층 내려가기]');
check(E.DESCEND_WON === 2000, '2,000원');
let m0 = st.money; check(!E.descend(st, ctx).ok && st.money === m0, '계단을 못 찾으면 못 내려가고 돈 없음');
findStairs(); m0 = st.money; const r = E.descend(st, ctx);
check(r.ok && m.depth === 2 && st.money - m0 === 2000 && r.won === 2000, `지하 2층 · +2,000원 ("${r.msg}")`);
check(r.msg.includes('2,000원'), '알림에 2,000원');
findStairs(); m0 = st.money; E.descend(st, ctx);
check(st.money - m0 === 2000 && m.depth === 3, '다음 층도 2,000원');
E.mineUp(st); findStairs(); m0 = st.money; E.descend(st, ctx);
check(st.money - m0 === 2000 && m.depth === 2, '1층으로 올라갔다 다시 내려가도 2,000원');
m0 = st.money; E.toDeepest(st); check(st.money === m0, '가장 깊은 층으로 바로 가기는 돈 없음');
check(st.stats.descendWon === 6000, '기록: 내려가기로 번 돈 6,000원');
while (m.depth < E.MINE_DEEPEST) { findStairs(); E.descend(st, ctx); }
findStairs(); m0 = st.money; check(!E.descend(st, ctx).ok && st.money === m0, '가장 깊은 층에선 더 없음');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
