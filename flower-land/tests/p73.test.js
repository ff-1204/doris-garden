// P73 🧱 돌담 (11-04 사용자 확정): 꽃이 만드는 땅의 영향이 돌담을 못 넘음 · 광산 공방에서 돌 2 · 500원
const path = require('path');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return c.slotStart + 0.01 * H; t += H / 4; } };
const base = E.create(at(c => c.month === 5 && !c.frozen), () => 0.5); base.gardenId = 'p73-test'; base.money = 1e6;
const rose = { id: 7001, type: 'rose', x: 8, y: 8, q: 1, startQ: 1, origin: '화원', stage: 'mature', bloomed: true, withered: false, ageH: 99 * M, lifeH: 99 * M, waterH: 1e4, weedH: 1e4, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: 3, ripeH: 0 };
const wall = (st, cells) => { let id = 9000; for (const [x, y] of cells) st.decos.push({ id: id++, key: 'stonewall', x, y }); return st; };
const WALL = [[10, 6], [10, 7], [10, 8], [10, 9], [10, 10]];
const tile = (st, x, y) => st.tiles[y * E.W + x];
const same = (a, b) => Math.abs(a.t - b.t) < 1e-9 && Math.abs(a.m - b.m) < 1e-9 && Math.abs(a.life - b.life) < 1e-9;
const run = (st, h) => { E.advance(st, st.virtual + h * H, ctx); return st; };

console.log('[P73-01 격자 직선 (Bresenham) — 난수 없음]');
{ const w = new Set([8 * E.W + 10]);
  check(E.wallBlocks(w, 8, 8, 12, 8) && E.wallBlocks(w, 8, 8, 10, 8) && !E.wallBlocks(w, 8, 8, 9, 8) && !E.wallBlocks(w, 8, 8, 8, 8), '담 너머 · 담 칸은 막힘 · 담 앞 · 꽃 칸 자신은 그대로');
  check(!E.wallBlocks(w, 8, 8, 12, 4) && E.wallBlocks(w, 8, 8, 11, 8), '직선이 담을 지나지 않으면 막지 않음');
  check(E.wallSet(base) === null && E.wallSet(wall(copy(base), [[1, 1]])).has(1 * E.W + 1), '돌담이 없으면 null (검사 건너뜀) · 놓인 칸만'); }

console.log('[P73-01 꽃이 만드는 땅이 담을 못 넘음]');
{ const A = wall(copy(base), WALL); A.flowers.push(copy(rose));          // 장미 + 돌담
  const B = copy(base); B.flowers.push(copy(rose));                       // 장미만
  const C = wall(copy(base), WALL);                                        // 돌담만 (꽃 없음)
  for (const s of [A, B, C]) run(s, 24);
  check(!same(tile(B, 12, 8), tile(C, 12, 8)), '돌담이 없으면 3칸 너머(12, 8)도 장미 쪽으로 바뀜');
  check(same(tile(A, 12, 8), tile(C, 12, 8)) && same(tile(A, 11, 7), tile(C, 11, 7)), '돌담이 있으면 담 너머 칸은 꽃이 없는 정원과 같음 (t · m · life 그대로)');
  check(same(tile(A, 10, 8), tile(C, 10, 8)), '돌담 칸 자체도 영향을 받지 않음');
  check(same(tile(A, 8, 8), tile(B, 8, 8)) && same(tile(A, 6, 8), tile(B, 6, 8)) && same(tile(A, 9, 8), tile(B, 9, 8)), '꽃 칸 · 담 앞 같은 쪽 칸은 돌담이 없을 때와 같음'); }
{ const B = copy(base); B.flowers.push(copy(rose)); const D = copy(B); D.decos.push({ id: 9100, key: 'stonewall', x: null, y: null });
  run(B, 30); run(D, 30);
  check(JSON.stringify(B.tiles) === JSON.stringify(D.tiles) && JSON.stringify(B.flowers) === JSON.stringify(D.flowers), '돌담이 정원에 없으면(창고) 결과가 똑같음'); }
{ const A = wall(copy(base), WALL); A.grade.xp = E.gradeXpAt(3);
  const f = copy(rose); f.x = 11; f.weedH = 0; A.flowers.push(f);
  const d = E.buyDeco(A, 'ladybug', ctx).deco; E.placeDeco(A, d.id, 9, 8);   // 둘레 2칸 · 사이에 담
  E.advance(A, E.calendar(A.virtual).slotEnd + 0.1 * H, ctx);
  check(f.weedH > 20, '막는 건 꽃이 만드는 땅만 — 🐞 곤충 둘레 일은 담 너머도 그대로'); }

console.log('[P73-02 🧱 광산 공방 돌담 — 돌 2 · 500원 · 여럿]');
{ const st = copy(base);
  check(E.WORKSHOP.stonewall === 500 && JSON.stringify(E.CRAFTS.stonewall.need) === JSON.stringify({ stone: 2 }) && E.DECOS.stonewall && !E.DECOS.stonewall.one && !E.DECOS.stonewall.need, '공방 항목 · 돌 2개 또는 500원 · 등급 조건 없음 · 여럿');
  check(E.DECOS.fence.name === '꽃 울타리' && E.DECOS.stonewall.name === '나무 울타리' && !E.WORKSHOP.fence && E.wallSet(Object.assign(copy(base), { decos: [{ id: 1, key: 'fence', x: 3, y: 3 }] })) === null, '11월 꽃 울타리는 꾸밈 그대로 (땅을 막지 않음) · 공방 나무 울타리가 막음 (P77-A)');
  const m0 = st.money, a = E.workshopBuy(st, 'stonewall', ctx), b = E.workshopBuy(st, 'stonewall', ctx);
  check(a.ok && b.ok && st.money === m0 - 1000 && st.decos.filter(d => d.key === 'stonewall').length === 2, '500원씩 두 개');
  E.mineOf(st).bag.stone = 5;
  check(E.craft(st, 'stonewall', ctx).ok && E.mineOf(st).bag.stone === 3 && st.decos.filter(d => d.key === 'stonewall').length === 3, '돌 2개로 만들기');
  st.flowers.push(copy(rose));
  check(!E.placeDeco(st, a.deco.id, 8, 8).ok && E.placeDeco(st, a.deco.id, 9, 8).ok && E.placeDeco(st, b.deco.id, 9, 9).ok, '꽃이 있는 칸엔 못 놓음 · 빈 칸엔 줄지어 놓음');
  check(E.decoBuffLine(st, 'stonewall') === '' || typeof E.decoBuffLine(st, 'stonewall') === 'string', '장식 설명 한 줄'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
