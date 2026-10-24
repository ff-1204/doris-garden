// ⛏️ 광산 (P24): 기력 · 파기 · 계단 · 만들기 · 도감 · 예전 저장
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };

console.log('[판 · 기력]');
const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); st.gardenId = 'test-garden';   // 판이 늘 같게
const m = E.mineOf(st);
check(m.energy === E.MINE_MAX_E && m.depth === 1 && m.board.cells.length === E.MINE_W * E.MINE_H, '처음: 기력 10 · 1층 · 8×6칸');
check(m.board.cells.filter(c => c.stairs).length === 1, '계단은 한 칸');
check(m.board.cells.every(c => ['dirt', 'stone', 'quartz', 'feldspar'].includes(c.k)), '1층엔 흙 · 돌 · 석영 · 장석만');
const st2 = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); st2.gardenId = st.gardenId;
check(JSON.stringify(E.mineOf(st2).board) === JSON.stringify(m.board), '같은 정원 · 층 · 판이면 같은 판 (Math.random 안 씀)');

console.log('[파기]');
const r = E.dig(st, 0);
check(r.ok && m.energy === 9 && m.board.cells[0].dug && m.bag[m.board.cells[0].k] === 1, '파면 기력 1 · 나온 것은 광산 가방에');
check(!E.dig(st, 0).ok && m.energy === 9, '판 칸은 다시 못 팜');
check(!E.dig(st, 999).ok && !E.dig(st, 1.5).ok && !E.dig(st, '2').ok, '없는 칸 거절');
const stairsAt = m.board.cells.findIndex(c => c.stairs);
for (let i = 1, n = 0; n < 9; i++) if (i !== stairsAt) { E.dig(st, i); n++; }   // 계단 칸은 남겨 둠
check(m.energy === 0 && !E.dig(st, 20).ok, '기력이 없으면 못 팜');

console.log('[기력은 30분마다 · 꺼 둔 동안에도 · 꽃잠에도]');
E.advance(st, st.virtual + 1.01 * H);
check(m.energy === 2, '1시간에 2칸');
E.advance(st, st.virtual + 10 * H);
check(m.energy === E.MINE_MAX_E, '10칸에서 멈춤');
const sl = E.create(at(c => c.month === 13), () => 0.5); const sm = E.mineOf(sl); sm.energy = 0;
E.advance(sl, sl.virtual + 2.01 * H);
check(sm.energy === 4, '꽃잠에도 참');

console.log('[계단]');
check(!m.board.cells[stairsAt].dug && !E.descend(st).ok && m.depth === 1, '계단을 찾기 전엔 못 내려감');
const si = m.board.cells.findIndex(c => c.stairs);
m.energy = 10; if (!m.board.cells[si].dug) E.dig(st, si);
const d = E.descend(st);
check(d.ok && m.depth === 2 && m.deepest === 2 && m.board.cells.every(c => !c.dug), '계단을 파면 아래층 · 새 판');
check(E.mineUp(st).ok && m.depth === 1 && m.deepest === 2, '1층으로 돌아가도 가장 깊은 기록은 남음');
check(!E.freshBoard(st).ok, '안 판 칸이 있으면 새 판 못 만듦');
m.board.cells.forEach(c => { c.dug = true; });
check(E.freshBoard(st).ok && m.board.cells.every(c => !c.dug), '다 파면 새 굴');

console.log('[깊은 층]');
const deep = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); const dm = E.mineOf(deep);
const seen = new Set();
for (let b = 0; b < 40; b++) { dm.depth = 12; dm.board = null; E.mineOf(deep).board.cells.forEach(c => seen.add(c.k)); }
check(['amber', 'jade', 'amethyst'].every(k => seen.has(k)) && E.FOSSIL_KEYS.some(k => seen.has(k)), `12층엔 호박 · 비취 · 자수정 · 화석이 나옴 (${[...seen].join(',')})`);

console.log('[만들기]');
const cs = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); const cm = E.mineOf(cs);
cm.bag = { dirt: 11, stone: 13, quartz: 1, jade: 3 };
const f0 = cs.fert;
check(E.craft(cs, 'fert').ok && cs.fert === f0 + 1 && cm.bag.dirt === 6, '흙 5 → 비료 1');
check(E.craft(cs, 'stonelamp').ok && cm.bag.stone === 1 && cm.bag.quartz === 0 && cs.decos.some(x => x.key === 'stonelamp') && cs.dex.deco.stonelamp, '돌 12 + 석영 1 → 석등 (창고 · 꾸밈 도감)');
check(!E.craft(cs, 'stepstone').ok, '재료가 모자라면 못 만듦');
check(E.craft(cs, 'cheongja').ok && E.shopOf(cs).cups.includes('cheongja') && cm.bag.jade === 0, '비취 3 → 청자 찻잔 (돈 없이)');
cm.bag.jade = 3;
check(!E.craft(cs, 'cheongja').ok && cm.bag.jade === 3, '이미 있는 찻잔은 다시 안 구움');
check(!E.craft(cs, 'toString').ok, '없는 만들기 거절');

console.log('[도감 · 돈]');
const money = st.money;
m.energy = 10; { const oi = m.board.cells.findIndex(c => !c.dug && E.ORE_KEYS.includes(c.k)); if (oi >= 0) E.dig(st, oi); }
check(E.mineCount(st) >= 1 && st.dex.mine && Object.keys(st.dex.mine).every(k => E.MINE_DEX_KEYS.includes(k)), '광물을 처음 파면 광산 도감 (흙 · 돌은 안 셈)');
check(st.money === money && E.dexTotal(st) === E.DEX_TOTAL, '광산은 돈을 주지 않고 도감 93칸에 안 들어감');

console.log('[예전 저장]');
const old = JSON.parse(JSON.stringify(E.create(at(c => c.month === 3), () => 0.5))); delete old.mine; delete old.dex.mine; old.mig = 13;
const o = E.migrateSave(old);
check(o.mine && o.mine.energy === E.MINE_MAX_E && o.dex.mine && o.mig === E.MIGRATIONS.length, '광산 · 광산 도감이 생김 (기력 가득)');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
