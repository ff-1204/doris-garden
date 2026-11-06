// P28-04 · P90 🧺 저절로 들어오는 작은 것 (10-28, 11-06): 흐르는 시간 2시간마다 창고 · 광산 주머니 · 제다실로 바로 — 속도 · 비운 동안 상한 · 꽃잠에 멈춤 · 3주 안 · 받는 일 · 저장
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
{ const c0 = E.create; E.create = (...a) => Object.assign(c0(...a), { gardenId: 'test-garden' }); }   // P36 돌연변이는 정원 이름표 시드라 — 테스트 정원은 같은 이름표로 (무작위 이름표면 1%로 꽃이 변이해 거두기가 흔들림)
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return c.slotStart + 0.01 * H; t += H / 4; } };
const garden = (pred, on) => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'store-test'; st.onboarded = on !== false; return st; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.6, startQ: 0.6, stage: 'bloom', ripeH: 6, bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const go = (st, h) => E.advance(st, st.virtual + h * H, ctx);
const walk = (st, h, step = 1) => { for (let i = 0; i < h / step; i++) go(st, step); };   // 켜 둔 정원: 조금씩 흐름
const got = st => st.pantry.got;

console.log('[🧺 속도 — 흐르는 시간 2시간마다 하나가 바로 들어옴]');
{
  const st = garden(c => c.idx === 0), w0 = st.water;
  check(E.PANTRY_H === 2 && got(st) === 0 && st.pantry.items.length === 0, '새 정원은 받은 것 없음 · 2시간마다');
  go(st, 1.9);
  check(got(st) === 0 && Math.abs(st.pantry.h - 1.9) < 0.02, '1.9시간: 아직 없음');
  go(st, 0.2);
  check(got(st) === 1 && st.water === w0 + 1 && st.pantry.items.length === 0, '2시간: 첫 것(물병)이 바로 창고로 · 쌓이는 칸은 비어 있음');
  go(st, 4);
  check(got(st) === 3 && st.mine.bag.dirt === 2, '6시간: 셋 — 핀 꽃이 없으면 떨어진 꽃잎 자리는 흙');
  const off = garden(c => c.idx === 0, false); go(off, 10);
  check(got(off) === 0, '첫 안내 전 정원엔 들어오지 않음');
}

console.log('[🧺 비운 동안 상한 — 지금 상한을 넘지 않음 · 놓친 벌칙 없음]');
{
  const st = garden(c => c.idx === 0);
  go(st, 8.05);
  check(got(st) === 4, '8시간이면 4개 (1~9등급)');
  const n0 = st.pantry.n; go(st, 30);
  check(got(st) === 8 && st.pantry.n === n0 + 4 && st.pantry.h === 0, '다시 30시간 비워도 한 번에 상한 4개까지만');
  check(E.PANTRY_CAPS.map(c => c.join(':')).join() === '1:4,5:7,10:10,15:13,20:16,25:19,30:22', '상한 표: 기본 4 · 등급 장식이 들어오는 5 · 10 · … · 30등급마다 +3 (10-30)');
  for (const [g, cap] of [[4, 4], [5, 7], [9, 7], [10, 10], [20, 16], [30, 22], [45, 22]]) { const s = garden(c => c.idx === 0); s.grade.xp = E.gradeXpAt(g); go(s, 2 * cap + 6); check(E.pantryCap(s) === cap && got(s) === cap, `${g}등급: 비운 동안 ${cap}개에서 멈춤`); }
  const on = garden(c => c.idx === 0); walk(on, 24.05, 1);
  check(got(on) === 12, '켜 둔 하루는 12개 (예전에 들를 때마다 거둔 것과 같음)');
}

console.log('[🧺 꽃잠엔 멈춤]');
{
  const st = garden(c => c.idx === 12);
  go(st, 23.9);
  check(E.calendar(st.virtual).frozen && got(st) === 0 && st.pantry.h === 0, '쉼달 · 꽃샘달 하루 내내 안 들어옴');
  const s2 = E.create(at(c => c.idx === 11) + 11 * H, () => 0.5); s2.onboarded = true;   // 2월이 1시간 남은 때
  E.advance(s2, s2.virtual + 1 * H + 24 * H + 1.05 * H, ctx);   // 2월 마지막 1시간 + 꽃잠 24시간 + 다음 주 3월 1시간
  check(E.calendar(s2.virtual).idx === 0 && got(s2) === 1 && s2.pantry.h < 0.1, '2월 끝 1시간 + 3월 첫 1시간 = 하나 (꽃잠 24시간은 빼고)');
}

console.log('[🧺 따라잡기 3주 안 — 3주를 비워도 상한까지만]');
{
  const st = garden(c => c.idx === 0); fl(st, 'lavender', 3, 3); st.basket = 99;
  E.advance(st, st.virtual + 21 * 24 * H, ctx);   // app catchUp이 넘기는 가장 긴 시간
  check(got(st) === 4 && st.pantry.n === 4, '3주를 따라잡아도 4개 · 그 뒤로 차례가 넘어가지 않음');
  check(st.basket >= 98, '상한 뒤엔 꽃잎도 더 떨어지지 않음 (바구니가 그대로)');
}

console.log('[🍂 떨어진 꽃잎 — 이달 수확을 바구니로 대신 (새 돈 아님)]');
{
  const st = garden(c => c.month === 6); st.basket = 5;
  const a = fl(st, 'lavender', 3, 3), b = fl(st, 'rose', 6, 6);
  go(st, 0.5); E.care(st, 'harvest', [[3, 3]], ctx);   // 라벤더는 손으로 먼저 (P72-01 거둔 꽃은 6시간 뒤 다시 피니 조금 늦게 거둠)
  const n0 = st.petals.length; go(st, 5.55);
  const p = st.petals.slice(n0).find(x => x.auto), cal = E.calendar(st.virtual);
  check(p && p.type === 'rose' && Math.abs(p.q / b.q - E.AUTO_Q) < 0.02 && st.dex.petal.rose, '아직 안 거둔 핀 꽃(장미)에서 제다실로 · 품질 90% · 도감에도');
  check(b.harvestKey === E.harvestSlot(cal) && b.stage === 'mature' && !E.canCare(st, b, 'harvest', cal) && st.basket === 3, '그 꽃은 다 자람으로 돌아가 손으로 바로 못 거두고 · 바구니 1번을 씀 (P72-01 6시간 뒤 다시 핌)');
  const nb = garden(c => c.month === 6); nb.basket = 0; const c2 = fl(nb, 'rose', 3, 3); go(nb, 6.05);
  check(!nb.petals.some(x => x.auto) && c2.harvestKey === -1, '바구니가 없으면 꽃잎 대신 흙 · 꽃은 그대로');
  const pot = garden(c => c.month === 6); pot.basket = 5; const g = fl(pot, 'rose', 3, 3, { origin: '이웃' }); go(pot, 6.05);
  check(!pot.petals.some(x => x.auto) && g.harvestKey === -1 && pot.basket === 5, '이웃의 화분은 거두지 않음 (첫 수확 2장 · 첫걸음은 손으로)');
}

console.log('[🧺 받는 일 — 도감 · 경험치 · 올해 꽃잎 · 주간 목표 · 일지]');
{
  const st = garden(c => c.month === 6); st.basket = 9; fl(st, 'rose', 3, 3, { q: 0.8 });
  E.weeklyOf(st); const w0 = JSON.stringify(st.weekly.goals.map(g => g.got)), xp = st.grade.xp, hv = st.yearNow.harvest, logs = st.log.length;
  st.pantry.n = 4;   // 차례: 석영 조각부터
  go(st, 2.05);
  check(st.mine.bag.quartz === 1 && st.dex.mine.quartz, '💎 석영 조각은 광산 주머니로 (처음이면 도감)');
  check(st.grade.by.pantry === E.XP.pantry, 'P54 받은 진행 한 번에 경험치 +1');
  go(st, 2.05);
  check(st.fert >= 0 && got(st) === 2, '🌱 비료도 들어옴');
  st.pantry.n = 2; go(st, 2.05);
  check(st.yearNow.harvest === hv + 1 && st.grade.xp > xp, '꽃잎은 올해 거둔 꽃잎 · 경험치에 셈');
  check(JSON.stringify(st.weekly.goals.map(g => g.got)) === w0, '주간 목표에는 세지 않음 (장치처럼, P28-09)');
  check(!st.log.slice(logs).some(l => /물병|흙|석영 조각 \d/.test(l.text)), '2시간마다 일지 줄을 남기지 않음');
  check((st.stats.autoPantry || 0) === got(st), '돌아왔을 때 창 줄이 읽는 셈');
  const before = E.autoStats(st); go(st, 8);
  check(E.autoAwayLines(st, before).some(t => t.startsWith('그동안 받은 것 4개가')), `돌아왔을 때 한 줄: "${E.autoAwayLines(st, before).find(t => t.startsWith('그동안'))}"`);
  st.settings.slow = true;
  check(E.autoAwayLines(st, before).some(t => t === '그동안 받은 것이 창고 · 광산 주머니 · 제다실로 들어왔어요'), '🐢 느긋하게 보기면 숫자 없이');
}

console.log('[💰 돈 고리 막기 (P17-14)]');
{
  const day = 24 / E.PANTRY_H, cnt = {};
  for (let i = 0; i < day; i++) { const k = E.PANTRY_CYCLE[i % E.PANTRY_CYCLE.length]; cnt[k] = (cnt[k] || 0) + 1; }
  check(day === 12 && E.PANTRY_CYCLE.length === 12 && cnt.water === 3 && cnt.dirt === 4 && cnt.petal === 2 && cnt.quartz === 2 && cnt.fert === 1, '하루 12개: 물병 3 · 흙 4 · 떨어진 꽃잎 2 · 석영 2 · 비료 1');
  check(E.PANTRY_ITEMS.water.won === E.SUPPLIES.water.price && E.PANTRY_ITEMS.fert.won === E.SUPPLIES.fert.price && E.PANTRY_ITEMS.dirt.won === E.SUPPLIES.fert.price / 5, '값은 화원 용품 값에서 (흙은 비료의 1/5)');
  check(E.pantryDayValue() === 480 && E.pantryDayValue() <= E.DAILY_GIFT, `하루 가치 ${E.pantryDayValue()}원 ≤ 하루 용돈 ${E.DAILY_GIFT}원 (꽃잎 자리를 흙으로 셈)`);
}

console.log('[💾 저장 · 불러오기]');
{
  const st = garden(c => c.idx === 0); go(st, 5);
  const r = E.parseSave(JSON.stringify(E.makeSave(st, 12345))), g = r.ok && E.migrateSave(r.data.game);
  check(g && JSON.stringify(g.pantry) === JSON.stringify(st.pantry), '파일로 저장했다 불러와도 받은 수 · 다음 것까지 쌓인 시간이 그대로');
  go(g, 1.05);
  check(got(g) === 3, '불러온 뒤 이어서 들어옴 (5시간 + 1시간 = 셋)');
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
