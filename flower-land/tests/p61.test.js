// P61 🐝 곤충농장 (11-03 사용자 확정): 곤충 둘레 2배(2 → 4 → 6칸) · 🌱 자라는 속도가 처음 피기까지 · 「🌼 정원 손길」 이름
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
const fs = require('fs');
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const fl = (st, type, x, y, ageH) => { const f = { id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'young', withered: false, ageH, lifeH: ageH, waterH: 1e4, weedH: 1e4, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1, bloomed: false }; st.flowers.push(f); return f; };
const put = (st, key, x, y) => { const d = { id: st.nextId++, key, x, y }; st.decos.push(d); return d; };

console.log('[P61-01 곤충 둘레 2 → 4 → 6칸]');
{ const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5);
  check(E.INSECT_KEYS.every(k => E.insectR(st, k) === 2) && E.HONEY_R === 2 && E.hiveR(st) === 2 && E.hiveMax(st) === 3, '0단계: 곤충 일곱 모두 둘레 2칸 · 🐝 꿀은 3병 그대로');
  for (const k of E.BONUS_KEYS) if (E.BONUS[k].worker) st.bonus[k] = 1;
  check(E.INSECT_KEYS.every(k => E.insectR(st, k) === 4) && E.hiveMax(st) === 6, '1단계: 둘레 4칸 · 꿀 6병');
  for (const k of E.BONUS_KEYS) if (E.BONUS[k].worker) st.bonus[k] = 2;
  check(E.INSECT_KEYS.every(k => E.insectR(st, k) === 6) && E.hiveMax(st) === 9, '2단계(끝): 둘레 6칸 · 꿀 9병');
  check(E.bonusStepName('barrel', 1) === '🐌 달팽이 둘레 4칸' && E.bonusStepName('hive', 2) === '🐝 꿀벌 둘레 6칸' && E.BONUS.barrel.desc(E.BONUS.barrel.vals[2]) === '둘레 6칸 꽃에 달마다 물을 줘요', '단계 이름 · 카드 설명 "둘레 n칸"');
  check(E.bonusView(st).rows.find(r => r.key === 'worm').desc === '둘레 6칸 꽃에서 달마다 흙을 기름지게 해요 · 비료를 써요', 'bonusView 카드 설명');
  st.bonusOwn = { hive: 2 }; st.bonus.hive = 0;
  const hv = E.bonusView(st).rows.find(r => r.key === 'hive');
  check(hv.reach === 2 && hv.ownReach === 6 && E.bonusView(st).rows.find(r => r.key === 'grow').reach === null, '카드 머리 "둘레 n칸" · 사 둔 단계 칸 수는 엔진 reach · ownReach (곤충만)'); }
{ const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5);   // 정원 경계: 모서리 곤충은 정원 안 칸만
  const d = put(st, 'barrel', 0, 0);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (x || y) fl(st, 'rose', x, y, 1);
  const n2 = E.insectFlowers(st, d).length; st.bonus.barrel = 2;
  const n6 = E.insectFlowers(st, d).length;
  const far = put(st, 'ladybug', E.W - 1, E.H - 1); fl(st, 'rose', E.W - 7, E.H - 7, 1); fl(st, 'rose', E.W - 8, E.H - 1, 1); st.bonus.weed = 2;
  check(n2 === 8 && n6 === 15, `모서리(0, 0) 달팽이: 2칸이면 3 × 3 − 1 = 8포기 · 6칸이면 4 × 4 − 1 = 15포기 모두 (${n2} · ${n6})`);
  check(E.insectFlowers(st, far).length === 1 && E.insectR(st, 'ladybug') === 6, '오른쪽 아래 모서리 무당벌레 6칸: 대각선 6칸 꽃은 닿고 7칸은 안 닿음'); }
{ const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5);   // 예전 저장: 반지름이 아니라 단계 번호라 열면 바로 새 칸 수
  st.bonus.barrel = 1; st.bonusOwn = { barrel: 1 }; st.bonus.hive = 2; st.bonusOwn.hive = 2;
  const s2 = E.migrateSave(JSON.parse(JSON.stringify(st)));
  check(E.insectR(s2, 'barrel') === 4 && E.insectR(s2, 'hive') === 6 && E.hiveMax(s2) === 9, '예전 저장(단계 1 · 2)을 다시 열면 둘레 4칸 · 6칸 (저장엔 칸 수가 없어 MIGRATIONS 없음)'); }

console.log('[P61-02 🌱 자라는 속도는 처음 피기까지 — P72-01 피는 달 대신 다 자란 뒤 6시간]');
const runBloom = (type, startMonth, ageH, grow, hours, pick) => {
  const st = E.create(at(c => c.month === startMonth && !c.frozen), () => 0.5); st.bonus.grow = grow; st.basket = 99;
  const f = fl(st, type, 3, 3, ageH), log = [];
  for (let h = 0; h < hours; h++) { E.advance(st, st.virtual + H, ctx); const c = E.calendar(st.virtual); log.push({ h, month: c.month, abs: c.abs, stage: f.stage, frozen: c.frozen }); if (pick && f.stage === 'bloom') E.care(st, 'harvest', [[3, 3]], ctx); }
  const blooms = log.filter(l => l.stage === 'bloom' && !l.frozen);
  return { st, f, log, first: blooms.length ? blooms[0] : null, n: blooms.length };
};
{ const base = runBloom('lotus', 3, 2 * M, 0, 40, true), fast = runBloom('lotus', 3, 2 * M, 8, 40, true);   // 연꽃 · 다 자란 채로 3월
  const gaps = r => { const hs = r.log.filter((l, i) => l.stage === 'bloom' && (i === 0 || r.log[i - 1].stage !== 'bloom')).map(l => l.h); return hs.slice(1).map((h, i) => h - hs[i]); };
  check(base.first && base.first.month === 3 && base.first.h === 5, `×1: 다 자란 연꽃은 피는 달(7월)을 기다리지 않고 6시간 뒤 3월에 핌 (${base.first && base.first.h + 1}시간)`);
  check(fast.first && fast.first.h === 1, `×5: 처음 피기까지 기다림도 5배 (${fast.first && fast.first.h + 1}시간)`);
  check(gaps(base).length >= 4 && gaps(base).every(g => g === 6) && gaps(fast).length >= 4 && gaps(fast).every(g => g === 6), `거두면 6시간 뒤 다시 핌 — ×5여도 다시 피는 시간은 그대로 (${gaps(fast).join(',')})`);
  check(fast.f.leadH == null && fast.f.leadEnd == null && E.bloomMonth === undefined, '앞선 달력(leadH · leadEnd · bloomMonth)은 없음'); }
{ const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5);
  const f = fl(st, 'lotus', 3, 3, 2 * M); E.advance(st, st.virtual + 30 * H, ctx);
  check(f.stage === 'bloom', '안 거두면 핀 그대로'); }
{ const base = runBloom('chamomile', 3, 1, 0, 160), fast = runBloom('chamomile', 3, 1, 8, 160);   // 한해살이: 핀 뒤 예전 피는 달 수(3달)만큼 흐르면 시듦
  const wb = base.log.findIndex(l => l.stage === 'withered'), wf = fast.log.findIndex(l => l.stage === 'withered');
  check(base.first && fast.first.h < base.first.h, `캐모마일(씨앗): ×5면 싹부터 피기까지 빨라짐 — ${base.first.h} → ${fast.first.h}시간`);
  check(wb - base.first.h === 36 && wf - fast.first.h === 36 && wf < wb, `한해살이는 핀 뒤 사는 시간(${wb - base.first.h} · ${wf - fast.first.h}시간 = 예전 피는 달 3달) 그대로, 시드는 때는 핀 만큼만 당겨짐`); }
{ const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); st.money = 1e6;   // 🔆 장치는 예전처럼 다 자라기까지만
  const f = fl(st, 'lotus', 3, 3, 2 * M); const d = E.buyDeco(st, 'greenhouse').deco; E.placeDeco(st, d.id, 3, 4);
  E.advance(st, st.virtual + 5 * H, ctx);
  check(f.stage === 'mature' && Math.abs(f.ripeH - 5) < 1e-6, '유리 온실(×2)만 있으면 다 자란 연꽃은 6시간을 그대로 기다림 (P27)'); }
{ const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); st.bonus.grow = 2;   // ×2 → 낮추면 그대로
  const f = fl(st, 'lotus', 3, 3, 2 * M); E.advance(st, st.virtual + 2 * H, ctx); const l1 = f.ripeH;
  st.bonus.grow = 0; E.advance(st, st.virtual + 1 * H, ctx);
  check(Math.abs(l1 - 4) < 1e-6 && Math.abs(f.ripeH - 5) < 1e-6 && E.bloomLeads(st, f) === false, `×2로 2시간이면 시계 4시간 · ×1로 낮추면 그대로 (${l1.toFixed(2)} → ${f.ripeH.toFixed(2)})`); }
{ const st = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); st.bonus.grow = 8;
  const young = fl(st, 'lotus', 3, 3, 1), done = fl(st, 'lotus', 5, 5, 2 * M); done.bloomKey = 5; const ok = fl(st, 'lotus', 7, 7, 2 * M);
  for (const f of st.flowers) f.stage = E.computeStage(f, 3);
  check(!E.bloomLeads(st, young) && !E.bloomLeads(st, done) && E.bloomLeads(st, ok), '빨리 피는 꽃: 다 자랐고 아직 한 번도 안 핀 꽃만 (자라는 중은 ageH로 · 한 번 핀 꽃은 6시간 그대로)');
  check(Math.abs(E.bloomLeftFlowH(st, ok) - 6 / 5) < 1e-9 && E.bloomLeftFlowH(st, done) === 6 && E.bloomLeftFlowH(st, young) === null, '남은 시간: 처음이면 ÷5 · 그 뒤 6시간 · 다 자라기 전엔 없음');
  check(E.BONUS.grow.desc(2) === '꽃이 처음 피기까지 ×2 빨라요', '설명 "꽃이 처음 피기까지 ×n 빨라요"'); }

console.log('[P61-03 이름 「🌼 정원 손길」]');
{ const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const farm = read('app-farm.js'), manual = read('app-manual.js');
  check(farm.includes('🌼 정원 손길') && !/🌼 그 밖에/.test(farm.replace(/\/\/.*$/gm, '')), '곤충농장 화면: 「🌼 정원 손길」 (코드에 「🌼 그 밖에」 글자 없음)');
  check(!farm.includes('level + 1}칸') && !farm.includes('own + 1}칸') && farm.includes('r.reach') && farm.includes('r.ownReach'), '곤충 카드 칸 수는 단계 번호 + 1이 아니라 엔진 reach (예전 1 · 2 · 3칸 셈 없앰)');
  check(farm.includes('곤충은 아니지만 정원을 빠르게 해요'), '아래 줄 「곤충은 아니지만 정원을 빠르게 해요」 그대로');
  check(manual.includes('🌼 정원 손길') && !manual.includes('🌼 그 밖에'), '매뉴얼도 「🌼 정원 손길」');
  check(manual.includes('둘레') && !/둘레 1칸|1 → 2 → 3칸/.test(manual), '매뉴얼에 예전 칸 수 없음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
