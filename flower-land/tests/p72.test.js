// P72 (11-04 사용자 확정): 다시 피는 꽃 · ⚙️ 자동 건조기 · 꽃잎 사기 · 보석 값 ½
const path = require('path');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return c.slotStart + 0.01 * H; t += H / 4; } };
const garden = pred => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'p72-test'; st.money = 1e6; st.basket = 99; return st; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, origin: '화원', stage: 'mature', bloomed: false, withered: false, ageH: 99 * M, lifeH: 99 * M, waterH: 1e4, weedH: 1e4, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: 3, ripeH: 0 }, extra); st.flowers.push(f); return f; };
const go = (st, h) => E.advance(st, st.virtual + h * H, ctx);

console.log('[P72-01 다 자란 뒤 6시간이면 핌 · 거두면 6시간 뒤 다시 핌]');
{ const st = garden(c => c.month === 4 && !c.frozen), f = fl(st, 'lavender', 3, 3);   // 라벤더: 예전 피는 달 6 · 7월 — 4월에도 핌
  check(E.RIPE_H === 6, '다시 피는 시간 6시간 (RIPE_H)');
  go(st, 5.9);
  check(f.stage === 'mature' && !E.canCare(st, f, 'harvest', E.calendar(st.virtual)), '5.9시간: 아직 다 자람 · 못 거둠');
  check(E.timeText(E.bloomLeftH(st, f)) === '6분', `남은 시간 글자 "${E.timeText(E.bloomLeftH(st, f))} 뒤 핌"`);
  go(st, 0.2);
  check(f.stage === 'bloom' && E.calendar(st.virtual).month === 4, '6시간: 피는 달이 아니어도 핌 (4월)');
  check(st.log.some(l => l.type === 8 && l.text.startsWith('라벤더가 피었어요')), '필 때 일지 한 줄');
  const p0 = st.petals.length;
  check(E.care(st, 'harvest', [[3, 3]], ctx).ok && st.petals.length === p0 + 4 && E.harvestCount(E.FLOWERS.lavender, ctx.rng) === 4, 'P77-C 꽃잎 수: 거둠 → 꽃잎 1 + floor(0.5 × 7) = 4장');
  check(f.stage === 'mature' && f.ripeH === 0 && E.bloomLeftH(st, f) === 6, '거두면 다시 다 자람 · 시계 0 · 6시간 뒤 핌');
  check(E.timeText(E.bloomLeftH(st, f)) === '6시간', '"6시간 뒤 핌"');
  go(st, 6.05);
  check(f.stage === 'bloom' && E.care(st, 'harvest', [[3, 3]], ctx).ok, '6시간 뒤 다시 피어 같은 달에 또 거둠 (예전 한 달 한 번은 없어짐)');
  go(st, 30);
  check(f.stage === 'bloom', '안 거두면 핀 그대로'); }

console.log('[P72-01 휴면 · 꽃잠엔 시계가 멈춤]');
{ const st = garden(c => c.month === 11 && !c.frozen), f = fl(st, 'lavender', 3, 3);
  E.advance(st, E.calendar(st.virtual).slotEnd - 3 * H, ctx);   // 11월 끝 3시간 전 · 시계 5시간 남음
  f.ripeH = 1; f.stage = 'mature'; const r0 = f.ripeH;
  check(f.stage === 'mature' && Math.abs(E.bloomLeftFlowH(st, f) - (6 - r0)) < 1e-9 && E.bloomLeftH(st, f) > 3 * 12, `11월 끝: 휴면(12 · 1 · 2월)을 건너뛰어 현실 ${E.timeText(E.bloomLeftH(st, f))} 뒤 핌`);
  go(st, 3 + 18);
  check(E.calendar(st.virtual).month === 1 && f.stage === 'dormant' && Math.abs(f.ripeH - r0 - 3) < 0.01, '휴면 동안 시계가 멈춤 (12 · 1월)');
  E.advance(st, at(c => c.idx === 13 && c.week === E.calendar(st.virtual).week) + 2 * H, ctx);
  check(E.calendar(st.virtual).frozen && Math.abs(f.ripeH - r0 - 3) < 0.01, '꽃잠에도 멈춤');
  E.advance(st, E.calendar(st.virtual).slotEnd + 3.05 * H, ctx);   // 다음 주 3월 3시간
  check(E.calendar(st.virtual).month === 3 && f.stage === 'bloom', '3월에 깨어 남은 2시간 뒤 핌'); }
{ const st = garden(c => c.month === 13), f = fl(st, 'dongbaek', 3, 3, { stage: 'bloom', ripeH: 6 });
  check(E.care(st, 'harvest', [[3, 3]], ctx).ok && f.stage === 'mature', '꽃잠에 핀 채 잠든 꽃은 한 번 거둠 → 다 자람');
  go(st, 10);
  check(f.stage === 'mature' && f.ripeH === 0 && !E.canCare(st, f, 'harvest', E.calendar(st.virtual)), '꽃잠 동안엔 다시 피지 않음'); }

console.log('[P72-01 🌱 자라는 속도 · 변이 꽃 · 한해살이 · 화분]');
{ const st = garden(c => c.month === 4 && !c.frozen); st.bonus.grow = 8;   // ×5
  const first = fl(st, 'rose', 3, 3, { bloomKey: -1 }), again = fl(st, 'rose', 5, 5);
  go(st, 1.3);
  check(first.stage === 'bloom' && again.stage === 'mature', '처음 피기까지는 ×5 (1.2시간) · 한 번 핀 꽃은 6시간 그대로 (P61-02 흐름)'); }
{ const st = garden(c => c.month === 4 && !c.frozen), f = fl(st, 'rose', 3, 3, { mut: true, stage: 'bloom', ripeH: 6 });
  check(!E.canCare(st, f, 'harvest', E.calendar(st.virtual)), '🧬 변이 꽃은 여전히 못 거둠'); }
{ const st = garden(c => c.month === 3 && !c.frozen), f = fl(st, 'chamomile', 3, 3, { ageH: 2 * M, lifeH: 2 * M, bloomKey: -1 });
  let n = 0; for (let h = 0; h < 50; h += 0.5) { go(st, 0.5); if (E.care(st, 'harvest', [[3, 3]], ctx).ok) n++; }
  check(f.withered && n === E.harvestsPerYear(E.FLOWERS.chamomile) && n === 6, `한해살이(캐모마일)는 핀 뒤 예전 피는 달 수(3달)만큼 피고 지고 시듦 — ${n}번 거둠`); }
{ const st = garden(c => c.month === 5 && !c.frozen);
  check(E.harvestsPerYear(E.FLOWERS.lavender) === 18 && E.harvestsPerYear(E.FLOWERS.dongbaek) === 24, '📊 한 해 수확: 라벤더 18번(깨어 있는 9달 × 2) · 동백 24번');
  { const L = E.FLOWERS.lavender, row = E.flowerEconomy().find(r => r.key === 'lavender');
    check(row.petals === 7 && row.tea === E.teaValue(L, 0.5, false) && Math.abs(row.income - 18 * (8 / 2 / 7) * row.tea) < 1e-6, 'P77-C 꽃잎 수: 📊 한 해 수입도 따라 바뀜 (18번 × 평균 4장 / 티백 7장 × 찻값)'); }
  E.giftPot(st, ctx); const pot = st.flowers[0];
  check(pot.stage === 'bloom' && E.canCare(st, pot, 'harvest', E.calendar(st.virtual)), '🪴 이웃의 화분은 핀 채로 옴 (첫걸음 수확)'); }

console.log('[P72-01 예전 저장 — MIGRATIONS 55번째]');
{ const st = garden(c => c.month === 6 && !c.frozen), cal = E.calendar(st.virtual);
  const N = E.MIGRATIONS.findIndex(x => x[0].includes('P72-01'));
  check(N === 54 && N === E.MIGRATIONS.length - 3, 'MIGRATIONS 55번째 · 맨 끝');
  const old = copy(st); old.mig = N;
  old.flowers = [
    { id: 1, type: 'rose', x: 1, y: 1, stage: 'bloom', ageH: 999, harvestKey: -1, bloomKey: cal.abs, leadH: 3, leadEnd: 99 },
    { id: 2, type: 'rose', x: 3, y: 1, stage: 'bloom', ageH: 999, harvestKey: E.harvestSlot(cal), bloomKey: cal.abs },
    { id: 3, type: 'rose', x: 5, y: 1, stage: 'mature', ageH: 999, harvestKey: -1, bloomKey: 3 },
    { id: 4, type: 'chamomile', x: 7, y: 1, stage: 'bloom', ageH: 99, bloomed: true, harvestKey: -1, bloomKey: cal.abs }];
  const m = E.migrateSave(old), [a, b, c, d] = m.flowers;
  check(a.stage === 'bloom' && a.ripeH === E.RIPE_H && a.leadH === undefined && a.leadEnd === undefined, '안 거둔 핀 꽃은 핀 채로 · 앞선 달력은 지움');
  check(b.stage === 'mature' && b.ripeH === 0, '이번 달에 이미 거둔 꽃은 다 자람 · 6시간 뒤 다시 핌');
  check(c.stage === 'mature' && c.ripeH === 0, '다 자란 꽃은 시계 0부터');
  check(d.ripeT === E.RIPE_H, '핀 한해살이는 지금부터 예전 피는 달 수만큼 더');
  const again = copy(m); E.MIGRATIONS[N][1](again);
  check(JSON.stringify(again) === JSON.stringify(m), '여러 번 돌아도 같음'); }

console.log('[P72-02 ⚙️ 자동 건조기 — 꽃잎이 들어오는 즉시 꽃방에]');
{ const st = garden(c => c.month === 5 && !c.frozen); st.grade.xp = E.gradeXpAt(5);
  const D = E.DECOS.autodryer, C = E.CRAFTS.autodryer;
  check(D && D.auto && D.one && D.need === 6 && E.WORKSHOP.autodryer === 30000 && E.WORKSHOP_KEYS.includes('autodryer'), '광산 공방 항목 · 30,000원 · 등급 6 · 하나만 (건조 선반 18,000원 · 등급 4 한 단계 위)');
  check(JSON.stringify(C.need) === JSON.stringify({ stone: 20, dirt: 10, quartz: 3 }) && C.deco === 'autodryer', '재료 돌 20 · 흙 10 · 석영 3 (건조 선반 돌 15 · 흙 10)');
  check(!E.workshopBuy(st, 'autodryer', ctx).ok, '등급 6 전엔 못 삼');
  st.grade.xp = E.gradeXpAt(6);
  const m0 = st.money, r = E.workshopBuy(st, 'autodryer', ctx);
  check(r.ok && st.money === m0 - 30000 && !E.workshopBuy(st, 'autodryer', ctx).ok, '사면 창고로 · 하나면 충분');
  for (let i = 0; i < 6; i++) fl(st, 'rose', 2 + i, 2, { stage: 'bloom', ripeH: 6 });
  E.careAll(st, 'harvest', ctx);
  check(st.petals.length === 6 * 3 && st.drying.length === 0, 'P77-C 꽃잎 수: 창고에 있으면 쉼 — 생화 그대로 (장미 6포기 × 3장)');
  st.petals = []; for (const f of st.flowers) { f.stage = 'bloom'; f.ripeH = 6; }
  E.placeDeco(st, r.deco.id, 10, 10);
  const dried0 = st.stats.dried || 0;
  E.careAll(st, 'harvest', ctx);
  check(st.petals.length === 0 && st.drying.length === 18 && st.drying.every(x => !x.auto && x.leftH === E.DRY_H), 'P77-C 꽃잎 수: 놓으면 거두는 즉시 18장 모두 꽃방에 (장수 제한 없음)');
  check((st.stats.dried || 0) === dried0 && st.stats.autoDry === 18 && E.autoAwayLines(st, {}).includes('자동 건조기가 꽃잎 18장을 꽃방에 널었어요'), 'P77-C 꽃잎 수: 말린 수(퀘스트)엔 안 셈 · 자리를 비운 동안 한 줄');
  const t0 = st.teas.length;
  go(st, E.DRY_H + 0.1);
  check(st.dried.length === 18 && st.teas.length === t0, 'P77-C 꽃잎 수: 꽃방 시간 뒤 말린 꽃잎 칸으로 — 티백은 만들지 않음 (건조 선반과 다름)'); }
{ const st = garden(c => c.month === 5 && !c.frozen); st.bonus.dry = 8;   // 🌾 말리는 속도 ×5
  st.decos.push({ id: 1, key: 'autodryer', x: 0, y: 0 }); st.petals.push({ id: 99, type: 'rose', q: 0.5, seasonKey: -1 });
  go(st, 0.1); check(st.drying.length === 1 && st.petals.length === 0, '다른 길(저장고 · 산 꽃잎)로 들어온 꽃잎도 다음 걸음에 바로');
  go(st, E.DRY_H / 5 + 0.1); check(st.dried.length === 1, '🌾 말리는 속도가 걸림'); }
{ const st = garden(c => c.month === 5 && !c.frozen);
  st.decos.push({ id: 1, key: 'autodryer', x: 0, y: 0 }, { id: 2, key: 'dryshelf', x: 2, y: 0 }, { id: 3, key: 'autobasket', x: 5, y: 5 });
  fl(st, 'rose', 5, 6, { stage: 'bloom', ripeH: 6 }); fl(st, 'rose', 6, 6, { stage: 'bloom', ripeH: 6 });
  E.advance(st, E.calendar(st.virtual).slotEnd + 0.1 * H, ctx);
  check(st.stats.autoHarvest === 6 && st.drying.filter(x => !x.auto).length === 6 && !(st.stats.autoHung > 0), 'P77-C 꽃잎 수: 🐜 개미 꽃잎(2포기 × 3장)도 바로 — 건조 선반보다 먼저 (선반은 티백 길)'); }

console.log('[P72-03 💐 꽃잎 사기 — 찻값의 50% · 품질 50%]');
{ const st = garden(c => c.month === 5 && !c.frozen); st.onboarded = true; E.weeklyOf(st);
  check(E.FLOWER_KEYS.every(k => E.petalPrice(k) === Math.round(E.FLOWERS[k].teaBase * 0.6 / E.PETAL_BASE / 10) * 10) && E.petalPrice('rose') === 120 && E.petalPrice('lotus') === 480 && E.petalPrice('chamomile') === 100, 'P77-C 꽃잎 수: 한 장 값 = 차 기본값 × 60% / 5 (장미 120원 · 연꽃 480원 · 캐모마일 100원 — 예전 P74-01 장미 600원)');
  check(E.PETAL_BUY_Q === 0.1 && E.stars(E.PETAL_BUY_Q) === 1, 'P74-01 품질 10% = ★1');
  check(E.FLOWER_KEYS.every(k => E.teaValue(E.FLOWERS[k], E.PETAL_BUY_Q, false) <= (E.petalPrice(k) + 5) * E.FLOWERS[k].petals + 10), 'P77-C 꽃잎 수: 산 꽃잎 petals장 차 한 잔(철 값 없이)은 산 값보다 남지 않음 (P74-01 · 한 장 값 10원 반올림만큼 너그럽게 — 납매 2,300원 / 2,280원)');
  const m0 = st.money, xp0 = st.grade.xp, wk0 = JSON.stringify(st.weekly.goals.map(g => g.got)), h0 = st.yearNow.harvest, dex0 = !!st.dex.petal.rose;
  const r = E.buyPetal(st, 'rose', 5);
  check(r.ok && st.money === m0 - 600 && st.petals.length === 5 && st.petals.every(p => p.type === 'rose' && p.q === 0.1), 'P77-C 꽃잎 수: 5장 → 600원 · 제다실 생화 5장');
  check(st.grade.xp === xp0 && JSON.stringify(st.weekly.goals.map(g => g.got)) === wk0 && st.yearNow.harvest === h0 && !!st.dex.petal.rose === dex0, '경험치 · 주간 목표 · 올해 거둔 꽃잎 · 도감 꽃잎 등록 없음 (돈으로 사기 — P54)');
  check(!E.buyPetal(st, 'rose', 0).ok && !E.buyPetal(st, 'rose', 100).ok && !E.buyPetal(st, 'none', 1).ok && !E.buyPetal(st, 'toString', 1).ok, '1~99장 · 없는 꽃은 안 됨');
  st.money = 100; check(!E.buyPetal(st, 'rose', 1).ok && st.money === 100 && st.petals.length === 5, 'P77-C 꽃잎 수: 돈이 모자라면 그대로 (장미 한 장 120원)');
  st.money = 1e6; st.decos.push({ id: 1, key: 'autodryer', x: 0, y: 0 });
  const r2 = E.buyPetal(st, 'lotus', 2);
  check(r2.ok && st.petals.length === 0 && st.drying.length === 7 && r2.msg.includes('자동 건조기'), '⚙️ 자동 건조기가 있으면 산 꽃잎도 바로 꽃방에 (제다실 생화도 함께)'); }
{ const src = require('fs').readFileSync(path.join(__dirname, '..', 'app-shop.js'), 'utf8');
  check(src.includes('data-petalbuy') && src.includes('data-key="petal:${k}"') && src.includes('E.buyPetal(st, key, n)') && src.includes('askBuy({ name: `${F.name} 꽃잎'), '화원 🌸 꽃잎 칸 — 씨앗 카드와 같은 개수 스테퍼 → 💰 살까요? 창'); }

console.log('[P72-04 💎 보석 값 ½]');
check(E.JEWEL_BASE === 2500 && E.JEWEL_STEP === 500 && E.jewelWon(1) === 2500 && E.jewelWon(3) === 3500 && E.jewelWon(20) === 12000, '1층 2,500원 + 층마다 500원 (예전 5,000 · 1,000원) · 20층 12,000원');
check(E.DESCEND_WON === 2000 && E.JEWEL_P === 0.05, '계단 돈 · 보석 나오는 비율은 그대로');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
