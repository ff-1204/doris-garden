// R-B (11-05 전체 검토 고침 B — 경제): ① 모두 물 주기 · 모두 거두기는 주간 목표에 안 셈(곤충은 셈) ② 저절로 판 잔이 채운 주문은 경험치 · 주간 목표 없음 (③ 광산 기준표는 체크리스트)
const path = require('path');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return c.slotStart + 0.01 * H; t += H / 4; } };
const garden = () => { const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.gardenId = 'revb-test'; st.money = 1e6; st.onboarded = true; st.grade.xp = E.gradeXpAt(10); E.weeklyOf(st); return st; };
const fl = (st, type, x, y) => { const f = { id: 7000 + st.flowers.length, type, x, y, q: 0.8, startQ: 0.8, origin: '화원', stage: 'bloom', bloomed: true, withered: false, ageH: 99 * M, lifeH: 99 * M, waterH: 0, weedH: 1e4, pruneH: 0, fertH: 0, thirstH: 30, adaptH: 0, harvestKey: -1, bloomKey: 3, ripeH: 0 }; st.flowers.push(f); return f; };
const got = (st, k) => { const g = st.weekly.goals.find(x => x.k === k); return g ? g.got : null; };
const force = (st, k) => { const g = st.weekly.goals[0]; g.k = k; g.got = 0; g.done = false; g.n = E.WEEKLY[k].n; return g; };   // 이번 주 첫 목표를 k로 바꿔 둠 (테스트용)

console.log('[R-B1 모두 물 주기 · 모두 거두기는 주간 목표에 안 셈]');
{ const st = garden(); force(st, 'water'); for (let i = 0; i < 4; i++) fl(st, 'rose', 3 + i, 3);
  const xp0 = st.grade.xp, r = E.careAll(st, 'water', ctx);
  check(r.ok && r.count === 4 && got(st, 'water') === 0 && st.grade.xp + (st.grade.frac || 0) > xp0, '모두 물 주기 4포기: 목표 0 · 경험치는 오름(frac)');
  const s2 = garden(); force(s2, 'water'); for (let i = 0; i < 4; i++) fl(s2, 'rose', 3 + i, 3);
  for (let i = 0; i < 4; i++) E.care(s2, 'water', [[3 + i, 3]], ctx);
  check(got(s2, 'water') === 4, '한 송이씩 물 주면 4');
  const s3 = garden(); force(s3, 'petal'); for (let i = 0; i < 3; i++) fl(s3, 'rose', 3 + i, 3);
  const h = E.careAll(s3, 'harvest', ctx);
  check(h.ok && h.petals === 9 && got(s3, 'petal') === 0, '모두 거두기 9장: 목표 0'); }
console.log('[R-B1 곤충이 돌본 것은 셈 (P77-B-03)]');
{ const st = garden(); force(st, 'water'); const d = E.buyDeco(st, 'barrel', ctx).deco; E.placeDeco(st, d.id, 5, 5); fl(st, 'rose', 6, 6); fl(st, 'rose', 4, 4);
  E.insectTick(st, Object.assign({}, E.calendar(st.virtual), { abs: 1 }), ctx);
  check(got(st, 'water') === 2, '🐌 달팽이가 준 물 2포기 → 목표 2'); }

console.log('[R-B2 저절로 판 잔이 채운 주문은 경험치 · 주간 목표 없음]');
{ const st = garden(); force(st, 'order'); const cal = E.calendar(st.virtual);
  st.orders = { abs: cal.abs, list: [{ kind: 'any', done: false }, { kind: 'any', done: false }] };
  const cup = () => ({ id: E.nid ? E.nid(st) : 9000 + Math.floor(Math.random() * 0), kind: 'tea', type: 'rose', q: 0.8, brewAbs: cal.abs });
  const xp0 = st.grade.xp;
  E.countCup(st, Object.assign(cup(), { id: 9001 }), cal, true, ctx);    // 🫖 도우미 · 카운터
  const filledAuto = st.orders.list.filter(o => o.done).length, xpAuto = st.grade.xp - xp0, gotAuto = got(st, 'order');
  E.countCup(st, Object.assign(cup(), { id: 9002 }), cal, false, ctx);   // 손으로 팔기
  check(filledAuto === 1 && gotAuto === 0 && xpAuto < E.XP.order, `자동 판매: 주문은 ✓(1) · 주문 경험치 없음(+${xpAuto}) · 목표 0`);
  check(st.orders.list.filter(o => o.done).length === 2 && got(st, 'order') === 1 && st.grade.xp - xp0 >= E.XP.order, '손으로 팔면 주문 경험치 · 목표 1'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
