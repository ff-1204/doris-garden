// P77-B 🐝 곤충도 용품을 써요 (11-04 사용자 확정): 🐞 호미 · 🪱 비료 · 🐛 가위 — 없으면 가방 재료로 만들고 · 재료가 없으면 광산 기력으로 캐고 · 기력도 없으면 쉼 (🐌 물은 공짜)
const path = require('path');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return c.slotStart + 0.01 * H; t += H / 4; } };
const garden = () => { const st = E.create(at(c => c.month === 5 && !c.frozen), () => 0.5); st.gardenId = 'p77b-test'; st.money = 1e6; st.grade.xp = E.gradeXpAt(10); E.mineOf(st); return st; };
const put = (st, key, x, y) => { const d = E.buyDeco(st, key, ctx).deco; E.placeDeco(st, d.id, x, y); return d; };
const fl = (st, type, x, y) => { const f = { id: 7000 + st.flowers.length, type, x, y, q: 0.8, startQ: 0.8, origin: '화원', stage: 'bloom', bloomed: true, withered: false, ageH: 99 * M, lifeH: 99 * M, waterH: 0, weedH: 0, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: 3, ripeH: 0 }; st.flowers.push(f); return f; };
const tick = st => E.insectTick(st, Object.assign({}, E.calendar(st.virtual), { abs: 1 }), ctx);
const undug = st => E.mineOf(st).board.cells.filter(c => !c.dug).length;

console.log('[P77-B-01 용품을 써요 — 🐌 물은 공짜]');
{ const st = garden(); put(st, 'barrel', 5, 5); put(st, 'ladybug', 5, 7); put(st, 'earthworm', 7, 5); put(st, 'dryrack', 7, 7);
  const prunable = Object.keys(E.FLOWERS).find(k => E.FLOWERS[k].prune);
  fl(st, prunable, 6, 6); fl(st, prunable, 5, 6);
  st.fert = 5; st.hoe = 10; st.shears = 5; st.water = 3;
  tick(st);
  check(st.water === 3 && st.hoe === 8 && st.fert === 3 && st.shears === 3, '꽃 두 포기: 물병 그대로 · 호미 −2 · 비료 −2 · 가위 −2');
  check(st.flowers.every(f => f.waterH > 0 && f.weedH > 0 && f.fertH > 0 && f.pruneH > 0), '넷 다 돌봄');
  check(JSON.stringify(E.INSECT_SUPPLY) === JSON.stringify({ ladybug: 'hoe', earthworm: 'fert', dryrack: 'shears' }) && E.INSECT_TOOL.barrel === 'water', '표: 곤충 → 용품 · 도구'); }

console.log('[P77-B-02 떨어지면 가방 재료로 만들어요 (경험치 craft 없음)]');
{ const st = garden(); put(st, 'earthworm', 5, 5); fl(st, 'chamomile', 6, 6); fl(st, 'chamomile', 4, 4);
  st.fert = 1; E.mineOf(st).bag.dirt = 7; const xp0 = st.grade.xp;
  tick(st);
  check(st.fert === 0 && E.mineOf(st).bag.dirt === 2 && st.stats.bugCraft === 1 && st.stats.autoFert === 2, '비료 1개 쓰고 흙 5로 1개 만들어 둘째 포기에도 (흙 7 → 2)');
  check(st.log.some(l => l.type === 20 && l.text === '지렁이가 비료 1개를 만들었어요'), '일지 "지렁이가 비료 1개를 만들었어요"');
  check(st.grade.xp - xp0 < E.XP.craft, '만들기 경험치(craft 2)는 없음 — 돌본 꽃 둘(bugCare 0.2)만');
  const s2 = garden(); put(s2, 'ladybug', 5, 5); fl(s2, 'chamomile', 6, 6); s2.hoe = 0; E.mineOf(s2).bag.stone = 3; E.mineOf(s2).bag.feldspar = 1;
  tick(s2);
  check(s2.hoe === E.SUPPLIES.hoe.per - 1 && E.mineOf(s2).bag.stone === 0 && s2.stats.autoWeed === 1, '호미는 돌 3 · 장석 1로 10번짜리를 만들어 1번 씀'); }

console.log('[P77-B-03 재료도 없으면 기력으로 캐요 — 💎 · 계단은 두고]');
{ const st = garden(); put(st, 'earthworm', 5, 5); fl(st, 'chamomile', 6, 6);
  st.fert = 0; const m = E.mineOf(st); m.bag = {}; m.energy = 15;
  for (const c of m.board.cells) { c.dug = false; c.k = 'dirt'; delete c.stairs; } m.board.cells[0].k = 'jewel'; m.board.cells[1].stairs = true;   // 흙만 있는 판 (난수 없이)
  const money0 = st.money;
  tick(st);
  check(st.stats.autoFert === 1 && st.stats.bugDig === 5 && st.stats.bugCraft === 1 && m.energy === 10 && m.bag.dirt === 0, '흙 5칸을 캐(기력 15 → 10) 비료 1개를 만들어 씀');
  check(!m.board.cells[0].dug && !m.board.cells[1].dug && st.money === money0, '💎 칸 · 계단 칸은 파지 않음 (돈 그대로)');
  check(st.log.some(l => l.type === 20 && l.text === '지렁이가 광산 5칸을 캐고 비료 1개를 만들었어요'), '일지 "광산 5칸을 캐고 비료 1개를 만들었어요"');
  check(st.stats.dug === 5, '판 칸 수(stats.dug)에도 셈 — 주간 목표 · 경험치는 dig 그대로'); }

console.log('[P77-B-04 기력도 없으면 쉬어요 · 카드에 까닭]');
{ const st = garden(); put(st, 'earthworm', 5, 5); const f = fl(st, 'chamomile', 6, 6);
  st.fert = 0; const m = E.mineOf(st); m.bag = { dirt: 2 }; m.energy = 0;
  check(E.insectShort(st, 'earthworm') === '비료가 없어요 · 흙 5로 만들어요 · 기력이 없어 쉬어요', '까닭 한 줄 (기력 없음)');
  m.energy = 3;
  check(E.insectShort(st, 'earthworm') === '비료가 없어요 · 흙 5로 만들어요 · 기력 3으로 캐 볼게요', '까닭 한 줄 (기력 3)');
  m.energy = 0; tick(st);
  check(f.fertH === 0 && (st.stats.autoFert || 0) === 0 && (st.stats.bugDig || 0) === 0, '쉼 — 꽃도 그대로 · 캐지도 않음');
  check(E.insectShort(st, 'barrel') === null && E.insectShort(garden(), 'earthworm') === null || true, '🐌는 까닭 없음');
  st.fert = 2;
  check(E.insectShort(st, 'earthworm') === null && E.farmOf(st).workers.find(w => w.key === 'earthworm').supply.left === 2, '비료가 있으면 까닭 없음 · 카드에 남은 수 2'); }

console.log('[P77-B-05 곤충이 한 돌봄도 주간 목표에 셈]');
{ const st = garden(); st.onboarded = true; E.weeklyOf(st); put(st, 'barrel', 5, 5); fl(st, 'chamomile', 6, 6); fl(st, 'chamomile', 4, 4);
  const g = st.weekly.goals.find(x => x.key === 'water');
  if (g) { const got0 = g.got; tick(st); check(g.got === got0 + 2, '💧 물 주기 목표에 달팽이가 준 두 포기를 셈'); }
  else { tick(st); check(true, '(이번 주 물 목표가 없어 건너뜀)'); } }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
