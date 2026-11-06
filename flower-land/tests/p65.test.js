// P65 (11-03): 🍯 꿀은 바로 창고 · 🍵 꿀차 · 🐜 개미는 꽃을 핀 그대로 · 곤충 효과 한 줄
const path = require('path'), fs = require('fs');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const ctx = { live: false, rng: () => 0.5 };
const bloom = (st, type, x, y) => { const f = { id: 90000 + st.nextId++, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', ripeH: 6, withered: false, bloomed: true, ageH: 3000, lifeH: 3000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }; st.flowers.push(f); return f; };
const garden = pred => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'p65'; st.money = 1e6; st.grade.xp = E.gradeXpAt(12); return st; };

console.log('[P65-01 🍯 꿀은 바로 📦 창고]');
{ const st = garden(c => c.month === 6 && !c.frozen), cal = E.calendar(st.virtual);
  const d = E.buyDeco(st, 'hive', ctx).deco; E.placeDeco(st, d.id, 10, 10);
  for (let i = 0; i < 3; i++) bloom(st, 'lavender', 9 + i, 11);
  st.onboarded = true; st.basket = 0; st.weekly = { week: cal.week, goals: [{ k: 'honey', tier: 2, n: 3, got: 0, done: false }], bonus: false, full: 0, doneAll: 0 };
  const xp0 = (st.grade.by || {}).honey || 0;
  E.advance(st, cal.slotEnd + 0.2 * H, ctx);
  check(st.honey.lavender === 2 && !(d.honey || []).length, '6월이 끝나면 라벤더꿀 2병이 손으로 거두지 않아도 창고에');
  check(st.dex.honey.lavender && E.honeyCount(st) === 1 && st.yearSeen.honey.lavender, '들어올 때 꿀 도감 · 올해 꿀');
  check(st.weekly.goals[0].got === 2 && ((st.grade.by || {}).honey || 0) === xp0 + 2 * E.XP.honey, '주간 목표 "벌통 꿀 n병 모으기" · 등급 경험치 honey도 들어올 때 셈');
  check(E.WEEKLY.honey.text({ n: 3 }) === '벌통 꿀 3병 모으기' && st.log.some(l => l.text === '꿀벌이 라벤더꿀 2병을 📦 창고에 넣었어요'), '목표 글 · 일지 한 줄');
  for (let i = 0; i < 4; i++) E.hiveTick(st, ctx);
  check(E.honeyLeft(st) === E.hiveMax(st), `창고 꿀이 ${E.hiveMax(st)}병이면 벌이 쉼 (예전 벌통 상한)`);
  const t = E.TITLES.t_honey; st.dex.honey = Object.fromEntries(E.HONEY_KEYS.map(k => [k, true]));
  check(t.test(st), '칭호 「꿀 열네 병」은 꿀 도감으로 그대로'); }

console.log('[P65-01 예전 저장 — 벌통에 쌓인 꿀 · 꿀 선반]');
{ const st = garden(c => c.month === 6 && !c.frozen);
  const N = E.MIGRATIONS.findIndex(x => x[0].includes('P65-01'));
  const old = JSON.parse(JSON.stringify(st)); old.mig = N; old.honey = { wild: 1 };
  old.decos = [{ id: 7001, key: 'hive', x: 4, y: 4, honey: ['rose', 'rose'] }];
  const m = E.migrateSave(old);
  check(N === E.MIGRATIONS.length - 6 && m.honey.rose === 2 && m.honey.wild === 1 && m.dex.honey.rose && !('honey' in m.decos[0]), '벌통 꿀 2병 → 창고 · 선반 꿀 1병은 그 자리(같은 칸) · 맨 끝 보정');
  check(!E.takeHoney(m, 7001).ok, '옮긴 뒤 벌통엔 거둘 꿀이 없음'); }

console.log('[P65-02 🍵 꿀차]');
{ const st = garden(c => c.month === 6 && !c.frozen), cal = E.calendar(st.virtual);
  st.honey = { lavender: 2, wild: 1 };
  check(E.honeyTeaName('lavender') === '라벤더 꿀차' && E.honeyTeaName('wild') === '들꽃 꿀차', '이름: 꽃마다 "○○ 꿀차"');
  check(E.honeyTeaValue('lavender') === 240 && E.honeyTeaValue('rose') === 300 && E.honeyTeaValue('lotus') === 1200 && E.honeyTeaValue('wild') === 150 && E.HONEY_KEYS.every(k => k === 'wild' || E.honeyTeaValue(k) === Math.round(E.FLOWERS[k].teaBase * 0.3 / 10) * 10), '값: 그 꽃 차 값의 30% · 10원 단위 (라벤더 240 · 장미 300 · 연꽃 1,200 · 들꽃 150)');
  check(E.HONEY_KEYS.every(k => k === 'wild' || E.honeyTeaValue(k) < E.FLOWERS[k].teaBase * 0.5), '꿀차는 그 꽃 티백 차(품질 0%)보다 늘 쌈');
  const r = E.brew(st, [], [], { lavender: 1, wild: 5 });
  const hc = st.cups.filter(c => c.kind === 'honey');
  check(r.ok && hc.length === 2 && st.honey.lavender === 1 && st.honey.wild === 0, '꿀 한 병 = 한 잔 · 가진 병 수까지만 (들꽃 5 → 1)');
  check(hc.every(c => c.honey === c.type && c.steepUntil && E.cupSteeping(st, c)), '손 우림 3분 (P56) · 꿀 표시');
  check(!E.sellCups(st, hc.map(c => c.id), ctx).ok, '우리는 동안엔 못 팖');
  st.virtual += E.STEEP_H * H + 1;
  const m0 = st.money, cal2 = E.calendar(st.virtual), want = hc.reduce((a, c) => a + E.cupValue(st, c, cal2), 0);
  check(E.cupValue(st, hc[0], cal2) === Math.round(240 * E.teaPriceMul(cal2, st) / 10) * 10, '찻잔 값 = 꿀차 값 × 철 값');
  const s = E.sellCups(st, hc.map(c => c.id), ctx);
  check(s.ok && st.money === m0 + want && st.stats.cups >= 2, '팔면 돈 · 판 잔 수');
  check(!E.brew(st, [], [], { rose: 3 }).ok, '없는 꿀은 못 우림');
  check(E.orderMatch({ kind: 'honey', done: false }, { kind: 'honey', type: 'rose', honey: 'rose' }) && E.orderMatch({ kind: 'any', done: false }, { kind: 'honey', type: 'rose', honey: 'rose' }) && !E.orderMatch({ kind: 'tea', type: 'rose', stars: 3, done: false }, { kind: 'honey', type: 'rose', honey: 'rose' }), '주문: "꿀 넣은 차 아무거나" · "차 아무거나"는 들어줌 · 꽃 차 주문은 아님');
  const cold = { kind: 'honey', type: 'lavender', honey: 'lavender', brewAbs: cal.abs - 1 };
  check(E.cupValue(st, cold, cal2) === Math.round(240 * 0.5 * E.teaPriceMul(cal2, st) / 10) * 10, '식으면 반값 (다른 찻잔과 같음)');
  check(E.dexTotal(st) === E.DEX_TOTAL || E.DEX_TOTAL === 93, '도감 93칸 그대로 (꿀차 칸 없음)'); }

console.log('[P65-03 🐜 개미 → P77-C 꽃잎 1 ~ 5장 · 꽃은 핀 그대로 (예전 P72-01 다 자람으로는 없어짐)]');
{ const st = garden(c => c.month === 6 && !c.frozen), cal = E.calendar(st.virtual);
  const d = E.buyDeco(st, 'autobasket', ctx).deco; E.placeDeco(st, d.id, 5, 5);
  const f = bloom(st, 'lavender', 6, 5), q0 = f.q;
  E.advance(st, cal.slotEnd + 0.2 * H, ctx);
  const c2 = E.calendar(st.virtual);
  check(st.petals.length === E.antCount(ctx.rng) && st.petals.length === 3 && f.antKey === cal.abs, 'P77-C 꽃잎 수: 6월이 끝나면 꽃잎 3장(antCount, rng 0.5) · 개미 표시');
  check(f.stage === 'bloom' && !f.withered && Math.abs(f.q - q0) < 0.05 && E.canCare(st, f, 'harvest', c2), 'P77-C 꽃잎 수: 개미가 거둔 꽃은 핀 그대로 (예전 P72-01 다 자람으로는 없어짐) · 손으로 바로 거둘 수 있음');
  check(E.basketTick(st, cal, ctx) === 0, '같은 꽃을 두 번 거두지 않음');
  E.advance(st, st.virtual + (E.RIPE_H - 0.2) * H, ctx);
  check(f.stage === 'bloom' && E.canCare(st, f, 'harvest', E.calendar(st.virtual)), 'P77-C 꽃잎 수: 6시간 뒤에도 핀 그대로 · 손으로 거둘 수 있음');
  E.care(st, 'harvest', [[6, 5]], ctx);
  const p1 = st.petals.length, c3 = E.calendar(st.virtual);
  check(f.stage === 'mature' && !E.canCare(st, f, 'harvest', c3), '손으로 거두면 다시 다 자람');
  check(E.basketTick(st, c3, ctx) === 0 && st.petals.length === p1, '안 핀 꽃은 개미도 안 거둠'); }

console.log('[P65-04 곤충 효과 한 줄]');
{ const st = garden(c => c.month === 6 && !c.frozen);
  check(E.INSECT_KEYS.length === 7 && E.INSECT_KEYS.every(k => /^둘레 \d칸 (핀 )?꽃(에|에서) 달마다 /.test(E.insectLine(st, k)) && /요$/.test(E.insectLine(st, k))), '일곱 모두 "둘레 n칸 꽃에서 · 얼마마다 · 무엇을 해요"');
  st.bonus.barrel = 2; st.bonusOwn = { barrel: 2 };
  check(E.insectLine(st, 'barrel') === '둘레 6칸 꽃에 달마다 물을 줘요' && E.insectR(st, 'barrel') === 6, '둘레 칸 수는 엔진 값(기르면 6칸)');
  E.buyDeco(st, 'barrel', ctx);
  const w = E.farmOf(st).workers.find(x => x.key === 'barrel');
  check(w.desc === E.insectLine(st, 'barrel'), '곤충농장 카드 설명 = insectLine');
  check(E.INSECT_KEYS.every(k => E.DECOS[k].desc === E.INSECT_LINE[k](2)), '장식 카드 설명 = 기르기 전 둘레 2칸 한 줄');
  const readme = fs.readFileSync(path.join(__dirname, '..', '..', 'README.md'), 'utf8');
  check(E.FARM.every(x => readme.includes(`${x.icon} ${x.name} — ${E.DECOS[x.key].desc}`)), 'README 곤충 일곱 줄이 엔진 문구와 같음');
  const man = fs.readFileSync(path.join(__dirname, '..', 'app-manual.js'), 'utf8'), gar = fs.readFileSync(path.join(__dirname, '..', 'app-garden.js'), 'utf8');
  check(man.includes('E.INSECT_LINE[w.key]') && gar.includes('E.insectLine(st, d.key)'), '매뉴얼 · 정원 곤충 창도 같은 한 줄을 읽음'); }

console.log('[화면]');
{ const tea = fs.readFileSync(path.join(__dirname, '..', 'app-teashop.js'), 'utf8'), shop = fs.readFileSync(path.join(__dirname, '..', 'app-shop.js'), 'utf8'), gar = fs.readFileSync(path.join(__dirname, '..', 'app-garden.js'), 'utf8');
  check(tea.includes('data-brewhoney') && tea.includes('E.brew(st, pickT, pickB, pickH)') && !tea.replace(/\/\/ .*$/gm, '').includes('꿀 선반'), '찻집: 꿀차 카드 → 🫖 우리기 창(꿀차 줄) · 꿀 선반은 없앰');
  check(shop.includes('function honeyStoreHTML') && shop.includes('${honeyStoreHTML()}'), '창고: 🍯 꿀 칸');
  check(!gar.includes('takehoney') && !gar.includes('d.honey'), '정원: 벌통 🍯 거두기 단추 · 꿀 점 없앰'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
