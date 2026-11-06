// P42 🌱 자라는 속도 · 🌾 말리는 속도 ×1.5 → ×5 (11-01 사용자 확정): 0.5배씩 8단계 · 등급 3부터 2씩 · 10,000원부터 5,000원씩 —
// 소수 배수가 자람 · 꽃방 · 🔆 장치 겹침에 맞는지 · 문구 · 예전 ×2 · ×3 저장 옮기기 (MIGRATIONS 49번째)
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = g => { const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.gardenId = 'p42-test'; st.money = 1e6; st.onboarded = true; st.grade.xp = E.gradeXpAt(g || 2); return st; };
const fl = (st, type, x, y) => { const f = { id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'young', bloomed: false, withered: false, ageH: 0, lifeH: 0, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }; st.flowers.push(f); return f; };
const set = (st, k, n) => { st.bonusOwn = Object.assign({}, st.bonusOwn, { [k]: E.bonusMax(k) }); return E.bonusSet(st, k, n); };
const go = (st, h) => E.advance(st, st.virtual + h * H, ctx);
const petals = (st, n) => { for (let i = 0; i < n; i++) st.petals.push({ id: st.nextId++, type: 'rose', q: 0.7, seasonKey: 11 }); return st.petals.map(p => p.id); };

console.log('[표 (P42)]');
check(['grow', 'dry'].every(k => E.bonusMax(k) === 8 && E.BONUS[k].vals.slice(1).join() === '1.5,2,2.5,3,3.5,4,4.5,5'), '8단계 ×1.5 → ×5 · 0.5배씩');
check(['grow', 'dry'].every(k => [1, 2, 3, 4, 5, 6, 7, 8].every(lv => E.bonusNeed(k, lv) === 1 + 2 * lv && E.bonusPrice(k, lv) === 5000 + 5000 * lv)), '등급 3 · 5 · … · 17 · 값 10,000 · 15,000 · … · 45,000원');
check(E.BONUS.grow.price.reduce((a, b) => a + b, 0) === 220000, '한 칸 모두 220,000원');
check(E.BONUS.dry.vals.slice(1).map(E.dryText).join() === '8시간,6시간,5시간,4시간,3시간 반,3시간,2시간 반,2시간 반', '꽃방 12시간 ÷ n — 현실 시간 글자 (P46 · ×1.5 8시간 · ×2.5 5시간 · ×5 2시간 반)');
{ const g = garden(5); g.bonusOwn = { grow: 2 }; g.bonus.grow = 1; const r = E.bonusView(g).rows.find(x => x.key === 'grow'); check(E.bonusView(garden(2)).rows.find(x => x.key === 'grow').buyVal === '×1.5' && r.val === '×1.5' && r.ownVal === '×2', '화면 값 "×1.5" · 사 둔 단계 ownVal "×2" (단계 + 1이 아님)'); }

console.log('[소수 배수가 규칙에 맞음]');
{ const st = garden(), f = fl(st, 'rose', 3, 3); set(st, 'grow', 1);
  const a0 = f.ageH, l0 = f.lifeH; go(st, 2);
  check(E.growRate(st, f) === 1.5 && Math.abs((f.ageH - a0) - 3) < 1e-6 && Math.abs((f.lifeH - l0) - 2) < 1e-6, `🌱 ×1.5: 2시간에 자란 시간 3시간 · 수명 시간은 2시간 (${(f.ageH - a0).toFixed(2)})`);
  set(st, 'grow', 3); check(E.growRate(st, f) === 2.5, '🌱 ×2.5'); }
{ const st = garden(), f = fl(st, 'rose', 3, 3), g = E.buyDeco(st, 'growlight', ctx); E.placeDeco(st, g.deco.id, 4, 4);
  const r = [0, 1, 2, 3].map(n => { set(st, 'grow', n); return E.growRate(st, f); });
  check(g.ok && r.join() === '1.5,1.5,2,2.5', `🔆 생장 등(×1.5)과 겹치면 더 빠른 쪽 하나 (${r.join(' · ')})`); }
{ const st = garden(), f = fl(st, 'rose', 3, 3), g = E.buyDeco(st, 'greenhouse', ctx); E.placeDeco(st, g.deco.id, 4, 4);
  const r = [1, 2, 3].map(n => { set(st, 'grow', n); return E.growRate(st, f); });
  check(r.join() === '2,2,2.5', `🔆 온실(×2): ×1.5 → 2 · ×2 → 2 · ×2.5 → 2.5 (${r.join(' · ')})`); }
{ const st = garden(); set(st, 'dry', 1);
  const r = E.dryPetals(st, petals(st, 2), ctx);
  check(r.ok && r.msg === '꽃잎 2장을 꽃방에 널었어요. 8시간 뒤에 다 말라요' && Math.abs(E.dryLeftH(st, st.drying[0]) - 8) < 1e-6, `🌾 ×1.5: 12시간 → 8시간 ("${r.msg}")`);
  go(st, 7.9); const still = st.drying.length; go(st, 0.2);
  check(still === 2 && st.drying.length === 0 && st.dried.length === 2, '🌾 ×1.5: 8시간이면 다 마름'); }

console.log('[문구]');
{ const st = garden(17); st.money = 1e6;
  const m = [1, 2, 3, 4, 5, 6, 7, 8].map(lv => E.bonusSet(st, 'grow', lv).msg);
  check(m[0] === '🌱 자라는 속도가 ×1.5로 빨라졌어요' && m[3] === '🌱 자라는 속도가 ×3으로 빨라졌어요' && m[6] === '🌱 자라는 속도가 ×4.5로 빨라졌어요' && m[7] === '🌱 자라는 속도가 ×5로 빨라졌어요', `사면 "×1.5로 · ×3으로 · ×4.5로 · ×5로" (${m[0]})`);
  check(st.money === 1e6 - 220000, '8단계 모두 220,000원');
  check(E.bonusSet(st, 'grow', 4).msg === '🌱 자라는 속도를 ×3으로 낮췄어요' && E.bonusSet(st, 'grow', 5).msg === '🌱 자라는 속도를 다시 ×3.5로 올렸어요', '낮추기 · 다시 올리기 문구'); }

console.log('[예전 저장 ×2 · ×3 → 같은 배수 (MIGRATIONS 49번째)]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P42'));
  check(N === 48 && N === E.MIGRATIONS.length - 11, '49번째 보정 (바로 뒤 50번째 P43 · 51번째 P48)');
  const old = copy(garden(12)); old.mig = N; delete old.speedSteps; old.mailGot = { [E.P41_LETTER]: 1 }; /* P41 옮기기를 이미 한 정원 */ old.bonus.grow = 2; old.bonus.dry = 1; old.bonusOwn = { grow: 2, dry: 2, barrel: 1 }; const m0 = old.money;
  const m = E.migrateSave(old);
  check(m.bonus.grow === 4 && m.bonus.dry === 2 && E.bonusVal(m, 'grow') === 3 && E.bonusVal(m, 'dry') === 2, '쓰는 단계: ×3 → 4단계 · ×2 → 2단계 (배수 그대로)');
  check(m.bonusOwn.grow === 4 && m.bonusOwn.dry === 4 && m.bonusOwn.barrel === 1 && m.money === m0, '산 단계도 같이 (×3까지 사 두고 ×2로 낮춘 칸 → 4단계까지 산 것) · 곤충 칸 · 돈은 그대로');
  check(m.speedSteps === E.SPEED_V, '옮긴 표시 speedSteps');
  const again = copy(m); delete again.mig; const a2 = E.migrateSave(again);
  check(a2.bonus.grow === 4 && a2.bonusOwn.dry === 4, 'mig 없이 다시 돌아도 한 번만 옮김');
  const z = copy(garden(2)); z.mig = N; delete z.speedSteps; delete z.bonusOwn; z.bonus.grow = 0; const zm = E.migrateSave(z);
  check(zm.bonus.grow === 0 && zm.bonus.dry === 0, '0단계는 그대로');
  const nw = E.create(Date.now(), () => 0.5);
  check(nw.speedSteps === E.SPEED_V && E.SEASON_KEEP.includes('speedSteps'), '새 정원은 옮긴 것으로 시작 · 🌸 새 철에도 이어짐'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
