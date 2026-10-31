// P40 🌼 그 밖에 세 칸 (10-31): 🌱 자라는 속도 · 🌾 말리는 속도 ×1 → ×10 · 🌼 꽃가루 늘리기 1 → 3알 — 🧺 선반 넓히기 · 🌙 늦잠은 없앰 (예전 저장은 쓴 꽃가루를 돌려받음)
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = g => { const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.gardenId = 'p40-test'; st.money = 1e6; st.onboarded = true; st.grade.xp = E.gradeXpAt(g || 2); return st; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'young', bloomed: false, withered: false, ageH: 0, lifeH: 0, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const set = (st, k, n) => { st.grade.xp = E.gradeXpAt(200); return E.bonusSet(st, k, n); };   // 꽃가루가 넉넉한 정원에서 n단계로
const go = (st, h) => E.advance(st, st.virtual + h * H, ctx);
const petals = (st, n) => { for (let i = 0; i < n; i++) st.petals.push({ id: st.nextId++, type: 'rose', q: 0.7, seasonKey: 11 }); return st.petals.map(p => p.id); };

console.log('[칸 · 값 · 꽃가루 (P40-01 · 02 · 03 · 04)]');
check(E.BONUS_KEYS.slice(-3).join() === 'grow,dry,pollen' && !E.BONUS.pantry && !E.BONUS.catchup, '그 밖에 세 칸 — 🧺 선반 넓히기 · 🌙 늦잠은 없음');
check(['grow', 'dry', 'pollen'].every(k => E.BONUS[k].worker === null), '곤충 카드가 아닌 "🌼 그 밖에" 줄');
check(E.bonusCostTo(9, 'grow') === 25 && E.bonusCostTo(9, 'dry') === 25 && E.bonusCostTo(2, 'pollen') === 8, '꽃가루: 자라는 · 말리는 속도 25알씩 · 꽃가루 늘리기 8알');
check([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(E.dryText).join() === '15일,7일 반,5일,4일,3일,2일 반,2일,2일,1일 반,1일 반', '말리는 시간 1달(15일) ÷ n — 반나절 단위');

console.log('[🌱 자라는 속도 (P40-01)]');
{ const st = garden(), f = fl(st, 'rose', 3, 3);
  check(E.growRate(st, f) === 1, '0단계 ×1');
  set(st, 'grow', 2);
  check(E.growRate(st, f) === 3, '2단계 ×3');
  const a0 = f.ageH, l0 = f.lifeH; go(st, 2);
  check(Math.abs((f.ageH - a0) - 6) < 1e-6 && Math.abs((f.lifeH - l0) - 2) < 1e-6, `자란 시간만 ×3 — 심은 뒤 흐른 시간(lifeH · 한해살이 수명)은 그대로 (${(f.ageH - a0).toFixed(2)} · ${(f.lifeH - l0).toFixed(2)})`);
  set(st, 'grow', 9);
  check(E.growRate(st, f) === 10 && E.bonusVal(st, 'grow') === 10, '끝단계 ×10'); }
{ const st = garden(), f = fl(st, 'rose', 3, 3), g = E.buyDeco(st, 'greenhouse', ctx);
  if (g.ok) E.placeDeco(st, g.deco.id, 4, 4);
  const gear = E.growRate(st, f);
  set(st, 'grow', 0); const r1 = E.growRate(st, f);
  set(st, 'grow', 1); const r2 = E.growRate(st, f);
  set(st, 'grow', 4); const r5 = E.growRate(st, f);
  check(g.ok && gear === 2 && r1 === 2 && r2 === 2 && r5 === 5, `🔆 장치와 겹치면 더 빠른 쪽 하나 (온실 ×2 · 기르기 ×1 → 2 · ×2 → 2 · ×5 → 5)`); }
{ const st = garden(), f = fl(st, 'chamomile', 3, 3, { stage: 'bloom', bloomed: true, ageH: 1000, lifeH: 1000 }); set(st, 'grow', 9);
  go(st, 1);
  check(f.stage === 'bloom' && Math.abs(f.lifeH - 1001) < 1e-6, '다 자란 꽃은 피는 달을 기다릴 뿐 — 6월에 피는 꽃은 그대로 피어 있음 · 수명 시간은 그대로'); }

console.log('[🌾 말리는 속도 (P40-02)]');
{ const st = garden(); E.dryPetals(st, petals(st, 2), ctx); go(st, 3);
  check(st.drying.length === 2 && Math.abs(st.drying[0].leftH - (M - 3)) < 1e-6 && Math.abs(E.dryLeftH(st, st.drying[0]) - 9) < 1e-6, '0단계: 1달(12시간) — 3시간 뒤 9시간 남음'); }
{ const st = garden(); set(st, 'dry', 3);
  const r = E.dryPetals(st, petals(st, 2), ctx);
  check(r.ok && r.msg === '꽃잎 2장을 꽃방에 널었어요. 4일 뒤에 다 말라요' && Math.abs(E.dryLeftH(st, st.drying[0]) - 3) < 1e-6, `×4: 널 때 안내 · 남은 시간 3시간 ("${r.msg}")`);
  go(st, 3.1);
  check(st.drying.length === 0 && st.dried.length === 2, '×4: 3시간이면 다 마름'); }
{ const st = garden(); E.dryPetals(st, petals(st, 1), ctx); go(st, 6);
  set(st, 'dry', 1);   // 이미 널린 꽃잎 — 남은 6시간이 ×2로 3시간
  check(Math.abs(E.dryLeftH(st, st.drying[0]) - 3) < 1e-6, '이미 널린 꽃잎은 남은 시간에 새 빠르기 (6시간 → 3시간)');
  go(st, 2.9); const still = st.drying.length; go(st, 0.2);
  check(still === 1 && st.drying.length === 0 && st.dried.length === 1, '올린 순간부터 빨라짐 — 3시간 뒤 다 마름'); }
{ const st = garden(5); const d = E.buyDeco(st, 'dryshelf', ctx); E.placeDeco(st, d.deco.id, 0, 0); petals(st, 4); E.rackTick(st, ctx); set(st, 'dry', 9);
  const t0 = st.teas.length; go(st, 1.3);
  check(st.drying.length === 0 && st.teas.length === t0 + 4, '🧺 건조 선반이 넌 꽃잎도 ×10 — 1.2시간이면 티백'); }

console.log('[🌼 꽃가루 늘리기 (P40-03)]');
{ const st = garden(4);   // 3알
  check(E.bonusPoints(st) === 3 && E.bonusView(st).perUp === 1 && E.bonusView(st).nextAt === 5, '0단계: 등급마다 1알 · 다음 알은 등급 5');
  check(E.bonusSet(st, 'pollen', 1).ok && E.bonusLeft(st) === 0 && E.bonusPoints(st) === 3 && E.pollenExtra(st) === 0, '1단계 = 3알 — 지난 등급까지 거슬러 주지 않음');
  st.grade.xp = E.gradeXpAt(5) - 1; E.addXp(st, 'quest', 1, ctx);
  check(E.gradeOf(st).grade === 5 && E.pollenExtra(st) === 1 && E.bonusPoints(st) === 5 && E.bonusLeft(st) === 2 && E.bonusView(st).perUp === 2 && E.bonusView(st).nextAt === 6, '올린 뒤 등급이 오르면 2알 (1알 더 — pollenExtra)');
  E.addXp(st, 'quest', Math.ceil((E.gradeXpAt(7) - st.grade.xp) / E.XP.quest), ctx);
  check(E.gradeOf(st).grade === 7 && E.pollenExtra(st) === 3 && E.bonusPoints(st) === 9, '한 번에 두 등급 → 2알씩');
  const back = E.bonusSet(st, 'pollen', 0);
  check(back.ok && back.msg === '🌼 꽃가루 늘리기 0단계로 내렸어요 · 🌼 꽃가루 3알이 돌아왔어요' && E.pollenExtra(st) === 3 && E.bonusLeft(st) === 9, '다시 어리게: 낸 3알만 돌아오고 더 받은 3알은 그대로');
  st.grade.xp = E.gradeXpAt(200); set(st, 'pollen', 2); const ex = E.pollenExtra(st), g = E.gradeOf(st).grade;
  E.addXp(st, 'quest', Math.ceil((E.gradeXpAt(g + 1) - st.grade.xp) / E.XP.quest), ctx);
  check(E.pollenExtra(st) === ex + 2, '2단계: 등급마다 3알 (2알 더)'); }
{ const st = garden(3); st.settings.slow = true; E.bonusSet(st, 'grow', 1);
  check(E.bonusVal(st, 'grow') === 2 && E.bonusLeft(st) === 1, '🐢 느긋하게 보기여도 똑같이 (숨김은 화면 몫)'); }

console.log('[🧺 · 🌙 없앰 (P40-04)]');
{ const st = garden(4); st.bonus.pantry = 3; st.bonus.catchup = 2;
  check(E.pantryCap(st) === 4 && E.catchUpH(st) === 21 * 24 && E.farmOf(st).catchup.weeks === 3, '저장고 상한은 등급 기본값만 · 따라잡기는 3주 (저장에 예전 값이 남아도)');
  check(E.bonusUsed(st) === 0, '없는 칸은 꽃가루 셈에 안 들어감'); }
{ const P40N = E.MIGRATIONS.findIndex(x => x[0].includes('P40-04'));
  check(P40N === E.MIGRATIONS.length - 1, `MIGRATIONS ${P40N + 1}번째 (맨 끝)`);
  const old = copy(garden(30)); old.mig = P40N; delete old.pollenExtra;
  old.bonus = { barrel: 0, basket: 2, weed: 0, worm: 0, rack: 0, hive: 0, brew: 0, pantry: 3, catchup: 2 }; old.bonusFree = { pantry: 1, basket: 0 };
  const usedBefore = 5 + 6 + 3 - 1;   // 개미 5 · 선반 6 · 늦잠 3 − 덜어 준 1 (예전 표로)
  const m = E.migrateSave(old);
  check(!('pantry' in m.bonus) && !('catchup' in m.bonus) && !('pantry' in m.bonusFree) && m.bonus.basket === 2 && ['grow', 'dry', 'pollen'].every(k => m.bonus[k] === 0), '두 칸을 지우고 새 세 칸은 0단계 · 다른 칸은 그대로');
  check(E.bonusUsed(m) === 5 && E.bonusLeft(m) === E.bonusPoints(m) - 5 && usedBefore - 5 === 8, `선반 · 늦잠에 쓴 꽃가루는 모두 돌아옴 (남은 ${E.bonusLeft(m)}알)`);
  check(m.pollenExtra === 0 && m.mig === E.MIGRATIONS.length, '더 받은 꽃가루 0 · 보정 끝');
  const again = copy(m); again.mig = P40N; again.pollenExtra = 4; const m2 = E.migrateSave(again);
  check(m2.pollenExtra === 4 && E.bonusUsed(m2) === 5, '여러 번 돌아도 같음 (더 받은 꽃가루는 그대로)'); }
{ const st = garden(10); st.pollenExtra = 7;
  check(E.SEASON_KEEP.includes('pollenExtra') && E.create(Date.now(), () => 0.5).pollenExtra === 0 && E.pollenExtra({}) === 0, '🌸 새 철에도 이어짐 · 새 정원은 0'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
