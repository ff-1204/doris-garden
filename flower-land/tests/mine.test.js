// ⛏️ 광산 (P24 · P48 6×6 · 기력 15 · 💎 보석): 기력 · 파기 · 계단 · 만들기 · 도감 · 예전 저장
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };

console.log('[판 · 기력]');
const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); st.gardenId = 'test-garden';   // 판이 늘 같게
const m = E.mineOf(st);
check(m.energy === E.MINE_MAX_E && m.depth === 1 && m.board.cells.length === E.MINE_W * E.MINE_H, '처음: 기력 15 · 1층 · 6×6칸 (P48)');
check(m.board.cells.filter(c => c.stairs).length === 1, '계단은 한 칸');
check(m.board.cells.every(c => ['dirt', 'stone', 'quartz', 'feldspar', 'jewel'].includes(c.k)), '1층엔 흙 · 돌 · 석영 · 장석 · 💎 보석만');
const st2 = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); st2.gardenId = st.gardenId;
check(JSON.stringify(E.mineOf(st2).board) === JSON.stringify(m.board), '같은 정원 · 층 · 판이면 같은 판 (Math.random 안 씀)');

console.log('[파기]');
const i0 = m.board.cells.findIndex(c => c.k !== 'jewel');
const r = E.dig(st, i0);
check(r.ok && m.energy === 14 && m.board.cells[i0].dug && m.bag[m.board.cells[i0].k] === 1, '파면 기력 1 · 나온 것은 광산 가방에');
check(!E.dig(st, i0).ok && m.energy === 14, '판 칸은 다시 못 팜');
check(!E.dig(st, 999).ok && !E.dig(st, 1.5).ok && !E.dig(st, '2').ok, '없는 칸 거절');
const stairsAt = m.board.cells.findIndex(c => c.stairs);
for (let i = 0, n = 0; n < 14; i++) if (i !== stairsAt && i !== i0) { E.dig(st, i); n++; }   // 계단 칸은 남겨 둠
const left = m.board.cells.findIndex((c, i) => !c.dug && i !== stairsAt);
check(m.energy === 0 && !E.dig(st, left).ok && E.dig(st, left).msg.includes('1분마다'), '기력이 없으면 못 팜 · "1분마다 한 칸씩"');

console.log('[기력은 1분마다 (P43-02) · 꺼 둔 동안에도 · 꽃잠에도]');
E.advance(st, st.virtual + H / 60);
check(m.energy === 1, '1분에 1칸');
for (let k = 0; k < 4; k++) E.advance(st, st.virtual + H / 60);
check(m.energy === 5, '1분씩 끊어 흘러도 1분에 1칸 (5분 → 5칸)');
E.advance(st, st.virtual + 1 * H);
check(m.energy === E.MINE_MAX_E && E.MINE_MAX_E === 15, '15칸에서 멈춤');
const sl = E.create(at(c => c.month === 13), () => 0.5); const sm = E.mineOf(sl); sm.energy = 0;
E.advance(sl, sl.virtual + 10.5 * H / 60);
check(sm.energy === 10, '꽃잠에도 참 (10분 반 → 10칸)');

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
cm.bag = { dirt: 21, stone: 31, quartz: 2, jade: 2, oldseed: 2 };
const f0 = cs.fert;
check(E.craft(cs, 'fert').ok && cs.fert === f0 + 1 && cm.bag.dirt === 16, '흙 5 → 비료 1');
check(E.craft(cs, 'oldpot').ok && cm.bag.oldseed === 0 && cm.bag.dirt === 6 && cs.decos.some(x => x.key === 'oldpot') && cs.dex.deco.oldpot, '옛 씨앗 2 + 흙 10 → 옛 씨앗 화분 (창고 · 꾸밈 도감)');
check(!E.craft(cs, 'fossilcase').ok, '재료가 모자라면 못 만듦');
check(E.craft(cs, 'cheongja').ok && E.shopOf(cs).cups.includes('cheongja') && cm.bag.jade === 0, '비취 2 → 청자 찻잔 (돈 없이)');
cm.bag.jade = 3;
check(!E.craft(cs, 'cheongja').ok && cm.bag.jade === 3, '이미 있는 찻잔은 다시 안 구움');
check(!E.craft(cs, 'toString').ok, '없는 만들기 거절');

console.log('[호미 · 가위 만들기 (10-31)]');
{
  const s = E.create(at(c => c.month === 3), () => 0.5); s.mine.bag.stone = 5; s.mine.bag.feldspar = 1; s.mine.bag.mica = 1;
  const h0 = s.hoe, sh0 = s.shears, m0 = s.money;
  const r1 = E.craft(s, 'hoe', {}); check(r1.ok && s.hoe === h0 + E.SUPPLIES.hoe.per && s.mine.bag.stone === 2 && s.mine.bag.feldspar === 0, '돌 3 · 장석 1 → 호미 10번');
  const r2 = E.craft(s, 'shears', {}); check(r2.ok && s.shears === sh0 + E.SUPPLIES.shears.per && s.mine.bag.stone === 0 && s.mine.bag.mica === 0, '돌 2 · 운모 1 → 가위 5번');
  check(!E.canCraft(s, 'hoe') && !E.craft(s, 'hoe', {}).ok && s.money === m0, '재료가 모자라면 안 됨 · 돈은 그대로');
}

console.log('[도감 · 돈]');
const money = st.money;
m.energy = 10; { const oi = m.board.cells.findIndex(c => !c.dug && E.ORE_KEYS.includes(c.k)); if (oi >= 0) E.dig(st, oi); }
check(E.mineCount(st) >= 1 && st.dex.mine && Object.keys(st.dex.mine).every(k => E.MINE_DEX_KEYS.includes(k)), '광물을 처음 파면 광산 도감 (흙 · 돌은 안 셈)');
check(st.money === money && E.dexTotal(st) === E.DEX_TOTAL, '광물은 돈을 주지 않고 도감 93칸에 안 들어감 (💎 보석만 돈 — 아래)');

console.log('[예전 저장]');
const old = JSON.parse(JSON.stringify(E.create(at(c => c.month === 3), () => 0.5))); delete old.mine; delete old.dex.mine; old.mig = 13;
const o = E.migrateSave(old);
check(o.mine && o.mine.energy === E.MINE_MAX_E && o.dex.mine && o.mig === E.MIGRATIONS.length, '광산 · 광산 도감이 생김 (기력 가득)');

console.log('[💎 보석 (P43-04)]');
{ const g = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); g.gardenId = 'jewel-garden';
  check(E.jewelWon(1) === 2500 && E.jewelWon(2) === 3000 && E.jewelWon(20) === 12000, '값: 1층 2,500 · 2층 3,000 · 20층 12,000원 (P72-04 ½ — 예전 5,000 · 6,000 · 24,000원)');
  let cells = 0, jewels = 0;
  for (let d = 1; d <= 20; d++) for (let b = 0; b < 40; b++) { const mm = E.mineOf(g); mm.depth = d; mm.board.cells.forEach(c => { c.dug = true; }); E.freshBoard(g); cells += mm.board.cells.length; jewels += mm.board.cells.filter(c => c.k === 'jewel').length; }
  const p = jewels / cells;
  check(p > 0.04 && p < 0.06, `칸마다 5%쯤 (${cells}칸 중 ${jewels} · ${(p * 100).toFixed(1)}%)`);
  const mm = E.mineOf(g); mm.depth = 3; mm.energy = 15;
  let bd; for (let t = 0; t < 200; t++) { mm.board.cells.forEach(c => { c.dug = true; }); E.freshBoard(g); if (mm.board.cells.some(c => c.k === 'jewel')) break; }
  bd = mm.board; const ji = bd.cells.findIndex(c => c.k === 'jewel');
  const m0 = g.money, bag0 = JSON.stringify(mm.bag), dex0 = JSON.stringify(g.dex.mine || {});
  const jr = E.dig(g, ji);
  check(jr.ok && jr.jewel === 3500 && g.money === m0 + 3500 && jr.msg.startsWith('💎 보석! 3,500원'), `3층 보석: 바로 3,500원 (P72-04) · 알림 "${jr.msg}"`);
  check(JSON.stringify(mm.bag) === bag0 && JSON.stringify(g.dex.mine || {}) === dex0 && !E.MINE_DEX_KEYS.includes('jewel'), '가방 · 광산 도감엔 넣지 않음');
  check(g.stats.jewels === 1 && g.stats.jewelWon === 3500 && mm.energy === 14, '기력 1 · 셈(stats.jewels · jewelWon)');
  // 계단과 겹치면 둘 다
  bd.cells.forEach(c => { c.dug = true; }); E.freshBoard(g);
  const b2 = mm.board; b2.cells.forEach(c => { delete c.stairs; }); b2.cells[0].k = 'jewel'; b2.cells[0].stairs = true;
  const m1 = g.money, sr = E.dig(g, 0);
  check(sr.ok && g.money === m1 + 3500 && sr.stairs && sr.msg.includes('계단') && E.descend(g).ok && mm.depth === 4, '계단과 겹치면 돈도 받고 내려갈 수도 있음');
  // 느긋하게 보기
  g.settings.slow = true; mm.board.cells[0].k = 'jewel'; mm.board.cells[0].dug = false; mm.energy = 1;
  const m2 = g.money, lr = E.dig(g, 0);
  check(lr.ok && g.money === m2 + 4000 && lr.msg === '💎 보석을 캤어요' && !/\d/.test(lr.msg), '🐢 느긋하게 보기: 돈은 받고 숫자는 숨김 ("💎 보석을 캤어요")');
  g.settings.slow = false; }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
