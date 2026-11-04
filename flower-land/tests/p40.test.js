// P40 🌼 그 밖에 (10-31): 🌱 자라는 속도 · 🌾 말리는 속도 — 🧺 선반 넓히기 · 🌙 늦잠은 없앰 (예전 저장은 쓴 꽃가루를 돌려받음)
// 🔄 P41 (10-31): ×3까지 · 돈 + 등급으로 사서 올림 · 🌼 꽃가루 늘리기는 없앰 — 사기 규칙은 p41.test.js, 여기는 빠르기가 규칙에 닿는 것만
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = g => { const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.gardenId = 'p40-test'; st.money = 1e6; st.onboarded = true; st.grade.xp = E.gradeXpAt(g || 2); return st; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'young', bloomed: false, withered: false, ageH: 0, lifeH: 0, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const set = (st, k, n) => { st.bonusOwn = Object.assign({}, st.bonusOwn, { [k]: E.bonusMax(k) }); return E.bonusSet(st, k, n); };   // 끝까지 산 정원에서 n단계로 (P41 — 산 단계 안은 공짜)
const go = (st, h) => E.advance(st, st.virtual + h * H, ctx);
const petals = (st, n) => { for (let i = 0; i < n; i++) st.petals.push({ id: st.nextId++, type: 'rose', q: 0.7, seasonKey: 11 }); return st.petals.map(p => p.id); };

console.log('[칸 · 값 (P40-01 · 02 · 04 → P41)]');
check(E.BONUS_KEYS.slice(-2).join() === 'grow,dry' && !E.BONUS.pantry && !E.BONUS.catchup && !E.BONUS.pollen, '그 밖에 두 칸 — 🧺 선반 넓히기 · 🌙 늦잠 · 🌼 꽃가루 늘리기(P41)는 없음');
check(['grow', 'dry'].every(k => E.BONUS[k].worker === null && E.BONUS[k].vals.join() === '1,1.5,2,2.5,3,3.5,4,4.5,5'), '곤충 카드가 아닌 "🌼 그 밖에" 줄 · ×1 → ×5 0.5배씩 8단계 (P42)');
check([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(E.dryText).join() === '12시간,6시간,4시간,3시간,2시간 반,2시간,1시간 반,1시간 반,1시간 반,1시간', '말리는 시간 12시간 ÷ n — 현실 시간 글자 (P46, 예전 게임 15일 ÷ n)');

console.log('[🌱 자라는 속도 (P40-01)]');
{ const st = garden(), f = fl(st, 'rose', 3, 3);
  check(E.growRate(st, f) === 1, '0단계 ×1');
  set(st, 'grow', 4);
  check(E.growRate(st, f) === 3 && E.bonusVal(st, 'grow') === 3, '4단계 ×3');
  const a0 = f.ageH, l0 = f.lifeH; go(st, 2);
  check(Math.abs((f.ageH - a0) - 6) < 1e-6 && Math.abs((f.lifeH - l0) - 2) < 1e-6, `자란 시간만 ×3 — 심은 뒤 흐른 시간(lifeH · 한해살이 수명)은 그대로 (${(f.ageH - a0).toFixed(2)} · ${(f.lifeH - l0).toFixed(2)})`); }
{ const st = garden(), f = fl(st, 'rose', 3, 3), g = E.buyDeco(st, 'greenhouse', ctx);
  if (g.ok) E.placeDeco(st, g.deco.id, 4, 4);
  const gear = E.growRate(st, f);
  set(st, 'grow', 0); const r1 = E.growRate(st, f);
  set(st, 'grow', 2); const r2 = E.growRate(st, f);
  set(st, 'grow', 4); const r3 = E.growRate(st, f);
  check(g.ok && gear === 2 && r1 === 2 && r2 === 2 && r3 === 3, `🔆 장치와 겹치면 더 빠른 쪽 하나 (온실 ×2 · 기르기 ×1 → 2 · ×2 → 2 · ×3 → 3)`); }
{ const st = garden(), f = fl(st, 'chamomile', 3, 3, { stage: 'bloom', ripeH: 6, bloomed: true, ageH: 1000, lifeH: 1000 }); set(st, 'grow', 4);
  go(st, 1);
  check(f.stage === 'bloom' && Math.abs(f.lifeH - 1001) < 1e-6, '다 자란 꽃은 피는 달을 기다릴 뿐 — 6월에 피는 꽃은 그대로 피어 있음 · 수명 시간은 그대로'); }

console.log('[🌾 말리는 속도 (P40-02)]');
{ const st = garden(); E.dryPetals(st, petals(st, 2), ctx); go(st, 3);
  check(st.drying.length === 2 && Math.abs(st.drying[0].leftH - (M - 3)) < 1e-6 && Math.abs(E.dryLeftH(st, st.drying[0]) - 9) < 1e-6, '0단계: 1달(12시간) — 3시간 뒤 9시간 남음'); }
{ const st = garden(); set(st, 'dry', 4);
  const r = E.dryPetals(st, petals(st, 2), ctx);
  check(r.ok && r.msg === '꽃잎 2장을 꽃방에 널었어요. 4시간 뒤에 다 말라요' && Math.abs(E.dryLeftH(st, st.drying[0]) - 4) < 1e-6, `×3: 널 때 안내 · 남은 시간 4시간 ("${r.msg}")`);
  go(st, 4.1);
  check(st.drying.length === 0 && st.dried.length === 2, '×3: 4시간이면 다 마름'); }
{ const st = garden(); E.dryPetals(st, petals(st, 1), ctx); go(st, 6);
  set(st, 'dry', 2);   // 이미 널린 꽃잎 — 남은 6시간이 ×2로 3시간
  check(Math.abs(E.dryLeftH(st, st.drying[0]) - 3) < 1e-6, '이미 널린 꽃잎은 남은 시간에 새 빠르기 (6시간 → 3시간)');
  go(st, 2.9); const still = st.drying.length; go(st, 0.2);
  check(still === 1 && st.drying.length === 0 && st.dried.length === 1, '올린 순간부터 빨라짐 — 3시간 뒤 다 마름'); }
{ const st = garden(5); const d = E.buyDeco(st, 'dryshelf', ctx); E.placeDeco(st, d.deco.id, 0, 0); petals(st, E.FLOWERS.rose.petals); E.rackTick(st, ctx); E.rackTick(st, ctx); set(st, 'dry', 4);   // P77-C 장미 5장 (선반은 한 번에 4장 — 두 번 넒)
  const t0 = st.teas.length; go(st, 4.1);
  check(st.drying.length === 0 && st.teas.length === t0 + 1 && !st.dried.some(p => p.auto), 'P77-C 🧺 건조 선반이 넌 꽃잎도 ×3 — 4시간이면 장미 5장이 티백 하나'); }

console.log('[🧺 · 🌙 없앰 (P40-04)]');
{ const st = garden(4); st.bonus.pantry = 3; st.bonus.catchup = 2;
  check(E.pantryCap(st) === 4 && E.catchUpH(st) === 21 * 24 && E.farmOf(st).catchup.weeks === 3, '저장고 상한은 등급 기본값만 · 따라잡기는 3주 (저장에 예전 값이 남아도)'); }
{ const P40N = E.MIGRATIONS.findIndex(x => x[0].includes('P40-04'));
  check(P40N === E.MIGRATIONS.length - 10, `MIGRATIONS ${P40N + 1}번째 (뒤로 P41 · P42 · P43 · P48)`);
  const old = copy(garden(30)); delete old.pollenExtra;
  old.bonus = { barrel: 0, basket: 2, weed: 0, worm: 0, rack: 0, hive: 0, brew: 0, pantry: 3, catchup: 2 }; old.bonusFree = { pantry: 1, basket: 0 };
  E.MIGRATIONS[P40N][1](old);   // 이 보정만 (P41이 뒤에서 모두 0단계로 돌림)
  check(!('pantry' in old.bonus) && !('catchup' in old.bonus) && !('pantry' in old.bonusFree) && old.bonus.basket === 2 && ['grow', 'dry'].every(k => old.bonus[k] === 0), '두 칸을 지우고 새 칸은 0단계 · 다른 칸은 그대로');
  check(old.pollenExtra === 0, '더 받은 꽃가루 0');
  old.pollenExtra = 4; E.MIGRATIONS[P40N][1](old);
  check(old.pollenExtra === 4, '여러 번 돌아도 같음 (더 받은 꽃가루는 그대로)'); }
{ check(E.SEASON_KEEP.includes('pollenExtra') && E.create(Date.now(), () => 0.5).pollenExtra === 0 && E.pollenExtra({}) === 0, '🌸 새 철에도 이어짐 · 새 정원은 0 (P41 옮기기가 읽음)'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
