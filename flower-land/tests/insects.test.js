// P39 🐝 곤충은 모두 꽃을 돕는다 (10-31): 곤충 7이 놓은 자리 둘레 r칸(1 → 2 → 3)의 꽃을 꽃잠이 아닌 달 끝마다 돌봄
// 🐌 물 · 🐜 거두기 · 🐞 잡초 · 🪱 비료 · 🐛 가지치기 · 🐝 번식 품질 깎임 절반 + 꿀 · 🦋 그해 첫 수확 꽃잎 +1 — 겹쳐도 한 번 · 🧬 변이 꽃은 거두기만 건너뜀 · 손 돌봄 덤은 없음 (P17-14)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = pred => { const st = E.create(at(pred || (c => c.month === 6 && !c.frozen)), () => 0.5); st.gardenId = 'insects-test'; st.money = 1e6; st.grade.xp = E.gradeXpAt(12); return st; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 0, weedH: 0, pruneH: 0, fertH: 0, thirstH: 5, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const put = (st, key, x, y) => { const r = E.buyDeco(st, key, ctx); if (!r.ok) throw new Error(r.msg); E.placeDeco(st, r.deco.id, x, y); return r.deco; };
const tick = st => E.insectTick(st, Object.assign({}, E.calendar(st.virtual), { abs: 0 }), ctx);   // 끝난 달 번호 0 — 🪱 석 달에 한 번이 일하는 달

console.log('[곤충 표 · 둘레]');
check(E.INSECT_KEYS.length === 7 && E.INSECT_KEYS.every(k => E.DECOS[k].insect && E.DECOS[k].auto) && !E.DECOS.dryshelf.insect && !E.DECOS.teastand.insect, '곤충 7 (장치 둘은 곤충 아님)');
{ const st = garden();
  check(E.INSECT_KEYS.map(k => E.insectR(st, k)).join() === '1,1,1,1,1,1,1', '0단계 둘레 1칸');
  for (const k of E.INSECT_KEYS) st.bonus[E.INSECTS[k]] = 2;
  check(E.INSECT_KEYS.map(k => E.insectR(st, k)).join() === '3,3,3,3,3,3,3', '끝단계 둘레 3칸'); }

console.log('[🐌 · 🐞 · 🪱 · 🐛 돌봄 (달 끝 한 번)]');
{ const st = garden();
  put(st, 'barrel', 5, 5); put(st, 'ladybug', 5, 5 + 10); put(st, 'earthworm', 15, 5); put(st, 'dryrack', 15, 15);
  const w = fl(st, 'chamomile', 6, 6), w2 = fl(st, 'chamomile', 7, 7);                 // 🐌 1칸 · 2칸
  const g = fl(st, 'chamomile', 4, 14);                                                // 🐞
  const e = fl(st, 'chamomile', 16, 4);                                                // 🪱
  const prunable = Object.keys(E.FLOWERS).find(k => E.FLOWERS[k].prune), noPrune = Object.keys(E.FLOWERS).find(k => !E.FLOWERS[k].prune);
  const p = fl(st, prunable, 14, 16), np = fl(st, noPrune, 16, 16);                    // 🐛
  const s0 = { water: st.water, hoe: st.hoe, fert: st.fert, shears: st.shears, wc: st.weedCount, pc: st.pruneCount };
  tick(st);
  check(w.waterH === 2 * M && w.thirstH === 0 && w2.waterH === 0, '🐌 둘레 1칸에 물 (2달) · 2칸 떨어진 꽃은 아님');
  check(g.weedH === 2 * M, '🐞 잡초 (2달)');
  check(e.fertH === M, '🪱 비료 효과 (1달)');
  check(p.pruneH === M && np.pruneH === 0, '🐛 가지치기하는 꽃만 (1달)');
  check(st.water === s0.water && st.hoe === s0.hoe && st.fert === s0.fert && st.shears === s0.shears && st.weedCount === s0.wc && st.pruneCount === s0.pc, '물병 · 호미 · 비료 · 가위를 안 씀 · 손 돌봄 비료 덤(weedCount · pruneCount) 없음');
  check(st.stats.autoWater === 1 && st.stats.autoWeed === 1 && st.stats.autoFert === 1 && st.stats.autoPrune === 1, '한 일 셈');
  check(['달팽이가 꽃 1포기에 물을 줬어요', '무당벌레가 꽃 1포기의 잡초를 치웠어요', '지렁이가 꽃 1포기의 흙을 기름지게 했어요', '누에 일꾼이 꽃 1포기의 가지를 쳤어요'].every(t => st.log.some(l => l.type === 20 && l.text === t)), '일지 네 줄 (🐝 20)');
  tick(st);
  check(st.stats.autoWater === 1 && st.stats.autoFert === 1, '아직 효과가 한 달 넘게 남으면 그대로 · 셈도 안 늘어남');
  const w3 = garden(); put(w3, 'earthworm', 5, 5); const wf = fl(w3, 'chamomile', 6, 6);
  const done = [0, 1, 2, 3, 4, 5].map(abs => { wf.fertH = 0; return E.insectCareTick(w3, 'earthworm', { abs }); });
  check(done.join() === '1,0,0,1,0,0' && E.INSECT_CARE.earthworm.every === 3, '🪱 지렁이는 석 달에 한 번 (끝난 달 번호로 — P39-13 시뮬 조정)'); }

console.log('[달 끝마다 끊기지 않음 · 손으로 다 준 것과 같은 품질 (P17-14)]');
{ const run = mode => { const st = garden(c => c.idx === 0 && c.yh < 1); const f = fl(st, 'lavender', 6, 6, { q: 0.5, startQ: 0.5, waterH: 99, weedH: 99, thirstH: 0 });
    if (mode === 'worm') put(st, 'earthworm', 5, 5);
    const end = st.virtual + 5 * 24 * H;
    while (st.virtual < end) { if (mode === 'hand') E.care(st, 'fert', [[6, 6]], ctx); if (st.fert < 3) st.fert = 10; E.advance(st, st.virtual + 2 * H, ctx); }
    return f.q; };
  const none = run(null), hand = run('hand'), worm = run('worm');
  console.log(`    품질: 없음 ${none.toFixed(3)} · 손 비료 ${hand.toFixed(3)} · 🪱 ${worm.toFixed(3)}`);
  check(worm > none && worm <= hand + 0.02, '🪱 지렁이 = 사람이 비료를 다 준 것과 거의 같음 (넘지 않음)'); }

console.log('[겹쳐도 한 번 · 창고 · 꽃잠]');
{ const st = garden(); st.decos.push({ id: 1, key: 'barrel', x: 5, y: 5 }, { id: 2, key: 'barrel', x: 6, y: 5 });   // 예전부터 여럿 가진 정원
  const f = fl(st, 'chamomile', 6, 6);
  check(E.insectCareTick(st, 'barrel') === 1 && st.stats.autoWater === 1 && f.waterH === 2 * M, '두 마리 둘레가 겹쳐도 한 꽃에 한 번');
  const sto = garden(); sto.decos.push({ id: 1, key: 'earthworm', x: null, y: null }); const g = fl(sto, 'chamomile', 0, 0);
  tick(sto); check(g.fertH === 0, '창고의 곤충은 쉼');
  const sl = garden(c => c.month === 13); sl.decos.push({ id: 1, key: 'earthworm', x: 2, y: 2 }); const h = fl(sl, 'chamomile', 2, 3);
  E.advance(sl, E.calendar(sl.virtual).slotEnd + 0.2 * H, ctx); check(h.fertH === 0, '꽃잠 달이 끝날 땐 쉼'); }

console.log('[🐜 개미 — 둘레 핀 꽃 모두 · 🧬 변이 꽃은 건너뜀 (P39-01-06)]');
{ const st = garden(); put(st, 'autobasket', 10, 10);
  const fs = [[9, 9], [10, 9], [11, 9], [9, 10], [11, 10], [9, 11], [10, 11], [11, 11]].map(([x, y]) => fl(st, 'chamomile', x, y));
  fs[0].mut = { k: 'chamomile', stage: 1 };
  const n = E.basketTick(st, E.calendar(st.virtual), ctx);
  check(n === 7 && fs[0].harvestKey === -1, '둘레 1칸 8포기 중 변이 꽃만 빼고 7포기 (포기 수 제한 없음)');
  const st2 = garden(); put(st2, 'autobasket', 10, 10); put(st2, 'earthworm', 10, 12); const m = fl(st2, 'chamomile', 10, 11, { mut: { k: 'chamomile', stage: 1 } });
  tick(st2); check(m.fertH === M && E.insectsOn(st2, m).join() === 'earthworm', '변이 꽃도 다른 돌봄은 받음 · 상태창 아이콘에서 개미는 빠짐'); }

console.log('[🦋 나비 — 둘레 꽃의 그해 첫 수확에 꽃잎 +1 (P39-03)]');
{ const st = garden(); put(st, 'teahelper', 5, 5);
  const a = fl(st, 'chamomile', 6, 6), b = fl(st, 'chamomile', 9, 9);
  const p0 = st.petals.length, xp0 = st.grade.xp;
  E.care(st, 'harvest', [[6, 6]], ctx);
  check(st.petals.length === p0 + 2 && st.stats.autoPetal === 1 && a.hy === E.yearOf(st, E.calendar(st.virtual)), '손으로 거두면 꽃잎 2장 (첫 수확)');
  check(st.grade.xp === xp0 + 2 * E.XP.harvest, '덤 꽃잎도 거둔 꽃잎으로 셈 (경험치)');
  E.care(st, 'harvest', [[9, 9]], ctx);
  check(st.petals.length === p0 + 3, '둘레 밖 꽃은 1장');
  a.harvestKey = -1; E.care(st, 'harvest', [[6, 6]], ctx);
  check(st.petals.length === p0 + 4 && st.stats.autoPetal === 1, '같은 해 두 번째 수확은 1장 (꽃마다 한 해 한 번)');
  const y = E.yearOf(st, E.calendar(st.virtual));
  a.harvestKey = -1; a.hy = y - 1; a.bfy = y - 1; E.care(st, 'harvest', [[6, 6]], ctx);
  check(st.petals.length === p0 + 5, '다음 해 첫 수확은 1장 — 두 해에 한 번 (P39-13 시뮬 조정)');
  a.harvestKey = -1; a.hy = y - 1; a.bfy = y - 2; E.care(st, 'harvest', [[6, 6]], ctx);
  check(st.petals.length === p0 + 7 && a.bfy === y, '두 해가 지나면 다시 2장');
  const s2 = garden(); put(s2, 'teahelper', 5, 5); put(s2, 'autobasket', 6, 5); fl(s2, 'chamomile', 6, 6);
  const n = E.basketTick(s2, E.calendar(s2.virtual), ctx);
  check(n === 2 && s2.petals.every(p => p.auto && Math.abs(p.q - 0.7 * E.AUTO_Q) < 1e-9), '🐜 개미가 거둬도 2장 (품질 90%)');
  const s3 = garden(); put(s3, 'teahelper', 5, 5); fl(s3, 'chamomile', 6, 6); fl(s3, 'chamomile', 4, 4); s3.basket = 10;
  const r = E.careAll(s3, 'harvest', ctx);
  check(r.ok && r.petals === 4, '모두 거두기도 같음 (2포기 × 2장)');
  const sv = garden(); fl(sv, 'chamomile', 6, 6); E.care(sv, 'harvest', [[6, 6]], ctx);
  check(sv.petals.length === 1 && !sv.stats.autoPetal, '나비가 없으면 1장'); }

console.log('[🐝 꿀벌 — 둘레 꽃의 번식 품질 깎임 절반 (P39-06-01)]');
{ const r = (seq => { let i = 0; return () => seq[i++ % seq.length]; });
  check(Math.abs(E.propQuality(0.8, r([0.9, 0.5])) - (0.8 - 0.15)) < 1e-9 && Math.abs(E.propQuality(0.8, r([0.9, 0.5]), true) - (0.8 - 0.075)) < 1e-9, 'propQuality: 같은 뽑기에서 깎임만 절반 (뽑는 수는 같음)');
  const qs = hive => { const st = garden(c => c.month === 4 && !c.frozen); if (hive) put(st, 'hive', 5, 5);
    const k = Object.keys(E.FLOWERS).find(t => E.FLOWERS[t].prop === '꺾꽂이' && E.FLOWERS[t].propMonths.includes(4));
    const f = fl(st, k, 6, 6, { q: 0.9, stage: 'mature', ageH: 99999, lifeH: 99999 });
    const res = E.propagate(st, f.id, () => 0.9, ctx); return res.ok ? st.pending[st.pending.length - 1].qs : null; };
  const a = qs(false), b = qs(true);
  check(a && b && a.length === b.length && b.every((q, i) => q > a[i] && Math.abs((0.9 - q) * 2 - (0.9 - a[i])) < 1e-9), `꿀벌 둘레 꽃 번식: 깎임 절반 (${a && a.map(q => q.toFixed(3))} → ${b && b.map(q => q.toFixed(3))})`); }

console.log('[곤충농장 · 상태창이 읽는 것]');
{ const st = garden(); put(st, 'barrel', 5, 5); put(st, 'earthworm', 6, 5); put(st, 'teahelper', 7, 5);
  const f = fl(st, 'chamomile', 6, 6);
  check(E.insectsOn(st, f).join() === 'barrel,earthworm,teahelper', '꽃 상태창: 받는 곤충 돌봄 (P39-12-04)');
  const v = E.farmOf(st).workers.find(w => w.key === 'earthworm');
  check(v.work === '둘레 1칸 · 꽃 1포기에 비료' && v.r === 1, '농장 카드: "둘레 1칸 · 꽃 1포기에 비료" (P39-12-01)'); }

console.log('[돈 · 규칙 — 손보다 더 벌지 않음 (P17-14)]');
{ // 같은 꽃 · 같은 때: 사람이 물 · 잡초 · 비료 · 가지치기를 다 하는 정원과 곤충 넷이 맡은 정원
  const twin = bugs => {
    const st = garden(c => c.idx === 0 && c.yh < 1);
    if (bugs) { for (const k of ['barrel', 'ladybug', 'earthworm', 'dryrack']) { st.bonus[E.INSECTS[k]] = 2; } put(st, 'barrel', 10, 10); put(st, 'ladybug', 11, 10); put(st, 'earthworm', 9, 10); put(st, 'dryrack', 10, 11); }
    const prunable = Object.keys(E.FLOWERS).find(k => E.FLOWERS[k].prune);
    const fs = [[9, 9], [10, 9], [11, 9], [9, 11], [11, 11]].map(([x, y], i) => fl(st, i % 2 ? prunable : 'lavender', x, y, { q: 0.4, startQ: 0.4, thirstH: 0 }));
    const end = st.virtual + 30 * H;
    while (st.virtual < end) { if (!bugs) { for (const t of ['water', 'weed', 'prune', 'fert']) for (const f of fs) E.care(st, t, [[f.x, f.y]], ctx); st.water = st.hoe = st.shears = st.fert = 99; } E.advance(st, st.virtual + 2 * H, ctx); }
    return fs.reduce((a, f) => a + f.q, 0) / fs.length;
  };
  const hand = twin(false), bug = twin(true);
  console.log(`    평균 품질: 손 ${hand.toFixed(3)} · 곤충 ${bug.toFixed(3)}`);
  check(bug <= hand + 0.02, '곤충 넷이 맡아도 손으로 다 돌본 정원보다 품질이 높지 않음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
