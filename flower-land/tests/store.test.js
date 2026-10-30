// P28-04 🧺 정원 저장고 (10-28, M2-7): 비운 시간만큼 작은 것이 상한까지 쌓이고 "모두 거두기" 한 번으로 받음 — 쌓임 속도 · 상한 · 꽃잠에 멈춤 · 3주 안 · 받기 · 저장
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return c.slotStart + 0.01 * H; t += H / 4; } };
const garden = (pred, on) => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'store-test'; st.onboarded = on !== false; return st; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.6, startQ: 0.6, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const go = (st, h) => E.advance(st, st.virtual + h * H, ctx);
const kinds = st => st.pantry.items.map(i => i.k).join(',');

console.log('[🧺 쌓임 속도 — 흐르는 시간 2시간마다 한 칸]');
{
  const st = garden(c => c.idx === 0);
  check(E.PANTRY_H === 2 && st.pantry.items.length === 0, '새 정원은 빈 저장고 · 2시간마다');
  go(st, 1.9);
  check(st.pantry.items.length === 0 && Math.abs(st.pantry.h - 1.9) < 0.02, '1.9시간: 아직 없음 (다음 칸까지 쌓는 중)');
  go(st, 0.2);
  check(st.pantry.items.length === 1 && st.pantry.items[0].k === E.PANTRY_CYCLE[0], '2시간: 첫 칸 (물병)');
  go(st, 4);
  check(st.pantry.items.length === 3 && kinds(st) === 'water,dirt,dirt', '6시간: 3칸 — 핀 꽃이 없으면 떨어진 꽃잎 자리는 흙');
  const v = E.pantryView(st);
  check(v.n === 3 && v.cap === 4 && !v.full && v.next > 1.8 && v.list.map(x => `${x.k}${x.n}`).join() === 'water1,dirt2', '화면: 3 / 4 · 다음 칸까지 남은 시간 · 종류별 수');
  const off = garden(c => c.idx === 0, false); go(off, 10);
  check(off.pantry.items.length === 0 && E.pantryView(off) === null, '첫 안내 전 정원엔 쌓이지 않고 화면도 없음');
}

console.log('[🧺 상한 — 가득 차면 멈춤 · 놓친 벌칙 없음]');
{
  const st = garden(c => c.idx === 0);
  go(st, 8.05);
  check(st.pantry.items.length === 4 && E.pantryView(st).full && E.pantryView(st).next === null, '8시간이면 4칸이 가득 (1~9등급)');
  const n0 = st.pantry.n; go(st, 30);
  check(st.pantry.items.length === 4 && st.pantry.n === n0 && st.pantry.h === 0, '오래 비워도 더 쌓이지 않음 (차례도 그대로)');
  check(E.PANTRY_CAPS.map(c => c.join(':')).join() === '1:4,5:7,10:10,15:13,20:16,25:19,30:22', '상한 표: 기본 4칸 · 등급 장식이 들어오는 5 · 10 · … · 30등급마다 +3칸 (10-30)');
  for (const [g, cap] of [[4, 4], [5, 7], [9, 7], [10, 10], [20, 16], [30, 22], [45, 22]]) { const s = garden(c => c.idx === 0); s.grade.xp = E.gradeXpAt(g); go(s, 2 * cap + 6); check(E.pantryCap(s) === cap && s.pantry.items.length === cap, `${g}등급: ${cap}칸에서 멈춤`); }
  const r = E.takePantry(st, ctx);
  check(r.ok && st.pantry.items.length === 0, '거두면 비고');
  go(st, 2.05);
  check(st.pantry.items.length === 1, '거둔 뒤 2시간이면 다시 한 칸');
}

console.log('[🧺 꽃잠엔 멈춤]');
{
  const st = garden(c => c.idx === 12);
  go(st, 23.9);
  check(E.calendar(st.virtual).frozen && st.pantry.items.length === 0 && st.pantry.h === 0, '쉼달 · 꽃샘달 하루 내내 쌓이지 않음');
  const s2 = E.create(at(c => c.idx === 11) + 11 * H, () => 0.5); s2.onboarded = true;   // 2월이 1시간 남은 때
  E.advance(s2, s2.virtual + 1 * H + 24 * H + 1.05 * H, ctx);   // 2월 마지막 1시간 + 꽃잠 24시간 + 다음 주 3월 1시간
  check(E.calendar(s2.virtual).idx === 0 && s2.pantry.items.length === 1 && s2.pantry.h < 0.1, '2월 끝 1시간 + 3월 첫 1시간 = 한 칸 (꽃잠 24시간은 빼고)');
}

console.log('[🧺 따라잡기 3주 안 — 3주를 비워도 상한까지만]');
{
  const st = garden(c => c.idx === 0); const f = fl(st, 'lavender', 3, 3); st.basket = 99;
  E.advance(st, st.virtual + 21 * 24 * H, ctx);   // app catchUp이 넘기는 가장 긴 시간
  check(st.pantry.items.length === 4 && st.pantry.n === 4, '3주를 따라잡아도 4칸 · 그 뒤로 차례가 넘어가지 않음');
  check(st.basket === 99 - st.pantry.items.filter(i => i.k === 'petal').length, '가득 찬 뒤엔 꽃잎도 더 떨어지지 않음 (바구니 · 꽃이 그대로)');
}

console.log('[🍂 떨어진 꽃잎 — 이달 수확을 바구니로 대신 (새 돈 아님)]');
{
  const st = garden(c => c.month === 6); st.basket = 5;
  const a = fl(st, 'lavender', 3, 3), b = fl(st, 'rose', 6, 6);
  E.care(st, 'harvest', [[3, 3]], ctx);           // 라벤더는 손으로 먼저
  go(st, 6.05);
  const p = st.pantry.items.find(i => i.k === 'petal'), cal = E.calendar(st.virtual);
  check(p && p.type === 'rose' && Math.abs(p.q / b.q - E.AUTO_Q) < 0.02, '아직 안 거둔 핀 꽃(장미)에서 · 품질 90%');
  check(b.harvestKey === E.harvestSlot(cal) && !E.canCare(st, b, 'harvest', cal) && st.basket === 3, '그 꽃은 이달 손으로 다시 못 거두고 · 바구니 1번을 씀');
  const nb = garden(c => c.month === 6); nb.basket = 0; const c2 = fl(nb, 'rose', 3, 3); go(nb, 6.05);
  check(!nb.pantry.items.some(i => i.k === 'petal') && c2.harvestKey === -1, '바구니가 없으면 꽃잎 대신 흙 · 꽃은 그대로');
  const pot = garden(c => c.month === 6); pot.basket = 5; const g = fl(pot, 'rose', 3, 3, { origin: '이웃' }); go(pot, 6.05);
  check(!pot.pantry.items.some(i => i.k === 'petal') && g.harvestKey === -1 && pot.basket === 5, '이웃의 화분은 거두지 않음 (첫 수확 2장 · 첫걸음은 손으로)');
}

console.log('[🧺 모두 거두기 — 창고 · 광산 주머니 · 제다실로]');
{
  const st = garden(c => c.month === 6); st.basket = 9; fl(st, 'rose', 3, 3, { q: 0.8 });
  go(st, 6.05);   // 물병 · 흙 · 떨어진 꽃잎(장미)
  check(kinds(st) === 'water,dirt,petal', '6시간: 물병 · 흙 · 장미에서 떨어진 꽃잎');
  st.pantry.items.push({ k: 'water' }, { k: 'fert' }, { k: 'dirt' }, { k: 'quartz' });
  st.onboarded = true; E.weeklyOf(st);
  const w0 = JSON.stringify(st.weekly.goals.map(g => g.got));
  const water = st.water, fert = st.fert, bag = Object.assign({}, st.mine.bag), petals = st.petals.length, xp = st.grade.xp, hv = st.yearNow.harvest;
  const r = E.takePantry(st, ctx);
  check(r.ok && r.msg.startsWith('🧺 저장고에서 거뒀어요') && r.msg.includes('💧 물병 2') && r.msg.includes('🍂 떨어진 꽃잎 1'), `알림 한 줄: "${r.msg}"`);
  check(st.water === water + 2 && st.fert === fert + 1, '💧 물병 · 🌱 비료는 창고 용품으로');
  check(st.mine.bag.dirt === (bag.dirt || 0) + 2 && st.mine.bag.quartz === (bag.quartz || 0) + 1 && st.dex.mine.quartz, '🟫 흙 · 💎 석영 조각은 광산 주머니로 (처음이면 도감)');
  const pt = st.petals[st.petals.length - 1];
  check(st.petals.length === petals + 1 && pt.type === 'rose' && pt.auto && st.dex.petal.rose, '🍂 떨어진 꽃잎은 제다실 꽃잎으로 (도감에도)');
  check(st.grade.xp === xp + E.XP.harvest && st.yearNow.harvest === hv + 1, '꽃잎은 등급 경험치 · 올해 거둔 꽃잎에 셈 (사람이 거둔 것과 같은 양)');
  check(JSON.stringify(st.weekly.goals.map(g => g.got)) === w0, '주간 목표에는 세지 않음 (장치처럼, P28-09)');
  check(st.pantry.items.length === 0 && st.pantry.got === 7, '저장고는 비고 · 모두 거둔 수를 셈');
  const e = E.takePantry(st, ctx);
  check(!e.ok && e.msg === '저장고가 비었어요', '빈 저장고는 거둘 게 없어요');
}

console.log('[🐢 느긋하게 보기 — 숫자만 숨김]');
{
  const st = garden(c => c.idx === 0); go(st, 4.05); st.settings.slow = true;
  const v = E.pantryView(st);
  check(v.slow && v.n === null && v.cap === null && v.next === null && v.has && v.list.length === 2, '쌓인 양 · 상한 · 남은 시간은 null, 무엇이 있는지와 거두기는 그대로');
  check(E.takePantry(st, ctx).ok, '거두기는 똑같이 됨');
}

console.log('[💰 돈 고리 막기 (P17-14)]');
{
  const day = 24 / E.PANTRY_H, cnt = {};
  for (let i = 0; i < day; i++) { const k = E.PANTRY_CYCLE[i % E.PANTRY_CYCLE.length]; cnt[k] = (cnt[k] || 0) + 1; }
  check(day === 12 && E.PANTRY_CYCLE.length === 12 && cnt.water === 3 && cnt.dirt === 4 && cnt.petal === 2 && cnt.quartz === 2 && cnt.fert === 1, '하루 12칸: 물병 3 · 흙 4 · 떨어진 꽃잎 2 · 석영 2 · 비료 1');
  check(E.PANTRY_ITEMS.water.won === E.SUPPLIES.water.price && E.PANTRY_ITEMS.fert.won === E.SUPPLIES.fert.price && E.PANTRY_ITEMS.dirt.won === E.SUPPLIES.fert.price / 5, '값은 화원 용품 값에서 (흙은 비료의 1/5)');
  check(E.pantryDayValue() === 480 && E.pantryDayValue() <= E.DAILY_GIFT, `하루 가치 ${E.pantryDayValue()}원 ≤ 하루 용돈 ${E.DAILY_GIFT}원 (꽃잎 자리를 흙으로 셈)`);
}

console.log('[💾 저장 · 불러오기]');
{
  const st = garden(c => c.idx === 0); go(st, 5);
  const r = E.parseSave(JSON.stringify(E.makeSave(st, 12345))), g = r.ok && E.migrateSave(r.data.game);
  check(g && JSON.stringify(g.pantry) === JSON.stringify(st.pantry), '파일로 저장했다 불러와도 쌓인 칸 · 다음 칸까지 쌓인 시간이 그대로');
  go(g, 1.05);
  check(g.pantry.items.length === 3, '불러온 뒤 이어서 쌓임 (5시간 + 1시간 = 3칸)');
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
