// 꽃잠 관리 (P04-01-09, 10-25): 꽃잠에도 옮겨심기 · 번식 · 돌보기 · 수확(꽃잠에 한 번), 심기는 막힘, 시간은 계속 멈춤
// 여정: 일요일 꽃잠에 들어온 정원사가 장미를 옆 칸으로 옮겨심고, 라벤더를 꺾꽂이하고, 목마른 꽃에 물을 준다
//       → 월요일 3월이 되면 시간이 다시 흐르고, 꺾꽂이 묘목은 1달(흐르는 시간) 뒤 창고로 온다
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime();
let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const ctx = { live: false, rng, toast: () => {}, onRecord: () => {} };

// 한 해 동안 키움 (물 · 잡초는 달마다)
const st = E.create(MON + 60e3, rng);
st.water = st.hoe = st.shears = 999;
check(E.buy(st, 'rose', 1).ok && E.buy(st, 'lavender', 1).ok && E.buy(st, 'dongbaek', 1).ok && E.buy(st, 'chamomile', 1).ok, '3월에 장미 · 라벤더 · 동백 · 캐모마일 사기');
const itemOf = t => st.items.find(i => i.type === t).id;
check(E.plant(st, itemOf('rose'), 5, 5, () => 0).ok && E.plant(st, itemOf('lavender'), 8, 5, () => 0).ok && E.plant(st, itemOf('dongbaek'), 2, 5, () => 0).ok, '장미 · 라벤더 · 동백 심기 (캐모마일 씨앗은 창고에 둠)');
const rose = st.flowers.find(f => f.type === 'rose'), lav = st.flowers.find(f => f.type === 'lavender'), dong = st.flowers.find(f => f.type === 'dongbaek');
st.basket = 20;
let febHarvest = false;
const all = () => st.flowers.map(f => [f.x, f.y]);
const SUN = MON + 6 * 24 * H;
for (let t = MON + 12 * H; t < SUN; t += 12 * H) {
  E.advance(st, t, ctx); E.care(st, 'water', all(), ctx); E.care(st, 'weed', all(), ctx);
  if (E.calendar(st.virtual).month === 2) febHarvest = E.care(st, 'harvest', [[dong.x, dong.y]], ctx).ok;   // 2월 수확
}
E.advance(st, SUN + 60e3, ctx);
let cal = E.calendar(st.virtual);
check(cal.frozen && cal.month === 13, '일요일 = 꽃잠 (쉼달)');
const yr = E.yearOf(st, cal);
check(['mature', 'bloom', 'dormant'].includes(lav.stage) && ['mature', 'bloom', 'dormant'].includes(rose.stage), `한 해 지나 다 자람 (장미 ${rose.stage} · 라벤더 ${lav.stage})`);

// 꽃잠: 옮겨심기 (달 조건 없음)
check(!E.FLOWERS.rose.sow.includes(cal.month), '쉼달은 장미 심는 달이 아님');
check(E.canMoveNow(rose, cal), '꽃잠엔 모든 꽃을 옮길 수 있음');
let r = E.move(st, rose.id, 6, 5);
check(r.ok && rose.x === 6 && rose.adaptH === 24, '꽃잠에 장미를 옆 칸으로 옮겨심기: ' + r.msg);
check(r.msg.includes('정원이 깨어나면'), '옮겨심기 문구가 꽃잠에 맞음');
check(!E.move(st, rose.id, 8, 5).ok && !E.move(st, rose.id, -1, 0).ok, '꽃 자리 · 정원 밖은 그대로 막힘');

// 꽃잠: 번식 (달 조건 없음, 새해 몫)
check(!E.FLOWERS.lavender.propMonths.includes(cal.month), '쉼달은 라벤더 꺾꽂이 달이 아님');
const items0 = st.items.length;
r = E.propagate(st, lav.id, rng, ctx);
check(r.ok && st.pending.length === 1 && st.pending[0].dueH === E.MONTH_H, '꽃잠에 라벤더 꺾꽂이: ' + r.msg);
check(r.msg.includes('정원이 깨어나고 1달 뒤'), '꺾꽂이 문구가 꽃잠에 맞음');
check(lav.propYear === yr + 1 && E.propYearOf(st, cal) === yr + 1, '꽃잠 번식은 새해 몫으로 셈');
check(!E.propagate(st, lav.id, rng, ctx).ok, '같은 꽃잠에 또 번식은 막힘');
// 꽃잠 전(3~6월)에 번식했어도 꽃잠엔 할 수 있음
rose.propYear = yr;
r = E.propagate(st, rose.id, rng, ctx);
check(r.ok && rose.propYear === yr + 1, '올해 번식한 장미도 꽃잠엔 새해 몫으로 번식');

// 꽃잠: 돌보기 (물 · 잡초 · 가지치기 · 비료)
lav.waterH = 0; lav.weedH = 0; lav.pruneH = 0; lav.fertH = 0; st.fert = 5;
check(E.canCare(st, lav, 'water', cal), '꽃잠에도 평소처럼 목마른 꽃은 돌볼 꽃으로 셈');
for (const t of ['water', 'weed', 'prune', 'fert']) { r = E.care(st, t, [[lav.x, lav.y]], ctx); check(r.ok, `꽃잠에 ${E.TOOLS[t].name}: ${r.msg}`); }
check(lav.waterH === 24 && lav.weedH === 24 && lav.pruneH === 12 && lav.fertH === 12, '돌본 효과가 들어감');

// 꽃잠: 핀 채로 잠든 꽃은 꽃잠에 한 번 수확 (2월 수확과는 따로)
check(febHarvest && dong.stage === 'bloom', '2월에 핀 동백을 거두고, 핀 채로 꽃잠에 듦');
check(!E.canCare(st, lav, 'harvest', cal) && !E.care(st, 'harvest', [[lav.x, lav.y]], ctx).ok, '핀 꽃이 아니면 꽃잠에도 수확 막힘');
const pet0 = st.petals.length, bk0 = st.basket;
r = E.care(st, 'harvest', all(), ctx);
check(r.ok && r.count === 1 && st.petals.length === pet0 + 1 && st.basket === bk0 - 1, '꽃잠에 동백 수확 (2월에 거뒀어도): ' + r.msg);
check(dong.harvestKey === E.harvestSlot(cal) && st.petals[st.petals.length - 1].seasonKey === E.seasonKey(st, cal), '꽃잠 수확 칸 · 꽃잎 계절은 평소처럼');
check(!E.canCare(st, dong, 'harvest', cal) && !E.care(st, 'harvest', all(), ctx).ok, '같은 꽃잠에 두 번째 수확은 막힘');
r = E.plant(st, itemOf('chamomile'), 2, 2, () => 0);
check(!r.ok && r.msg === '꽃잠에는 정원이 쉬어요', '꽃잠엔 심기 막힘');

// 꽃잠 동안 시간은 멈춤
const snap = f => [f.ageH, f.q, f.waterH, f.weedH, f.pruneH, f.fertH, f.adaptH, f.thirstH].join(',');
const s0 = snap(rose), l0 = snap(lav), due0 = st.pending.map(p => p.dueH).join(',');
E.advance(st, MON + 7 * 24 * H - 60e3, ctx);   // 월요일 05:59 (꽃샘달 끝)
cal = E.calendar(st.virtual);
check(cal.frozen && cal.month === 14, '꽃샘달 끝까지 꽃잠');
check(dong.stage === 'bloom' && !E.canCare(st, dong, 'harvest', cal), '쉼달에 거뒀으면 꽃샘달엔 못 거둠 (꽃잠에 한 번)');
check(snap(rose) === s0 && snap(lav) === l0, '꽃잠 동안 자람 · 품질 · 물 · 잡초 · 적응이 그대로');
check(st.pending.map(p => p.dueH).join(',') === due0 && st.items.length === items0, '꽃잠 동안 꺾꽂이는 뿌리 내리지 않고 창고에도 안 옴');

// 월요일 3월: 시간이 다시 흐름, 새해 몫 번식은 이미 했음
const MON2 = MON + 7 * 24 * H;
E.advance(st, MON2 + 60e3, ctx);
cal = E.calendar(st.virtual);
check(!cal.frozen && cal.month === 3 && E.yearOf(st, cal) === yr + 1, '월요일 = 새해 3월');
check(E.FLOWERS.lavender.propMonths.includes(3), '3월은 라벤더 꺾꽂이 달');
r = E.propagate(st, lav.id, rng, ctx);
check(!r.ok && r.msg === '이 꽃은 올해 이미 번식했어요', '꽃잠에 번식한 꽃은 3월에 또 못 함');
check(!E.canMoveNow({ type: 'rose', stage: 'mature' }, { frozen: false, month: 7 }), '평일 옮겨심기는 달 조건 그대로 (7월 장미는 못 옮김)');
E.advance(st, MON2 + 11 * H, ctx);
check(st.pending.length === 2 && !st.items.some(i => i.origin === '번식'), '흐르는 시간 1달이 안 됐으면 아직 안 옴');
E.advance(st, MON2 + 12 * H + 60e3, ctx);
check(st.pending.length === 0 && st.items.filter(i => i.origin === '번식' && i.type === 'lavender').length >= 1, '흐르는 1달 뒤 꺾꽂이 묘목이 창고로 옴');

// 0년차 (꽃잠에 처음 시작): 번식은 1년차 몫
const z = E.create(SUN + 3 * H, rng);
E.giftPot(z, ctx, 'lavender');
const zf = z.flowers[0], zc = E.calendar(z.virtual);
check(E.yearOf(z, zc) === 0 && ['mature', 'bloom', 'dormant'].includes(zf.stage), `0년차 꽃잠 · 이웃 화분 라벤더 (${zf.stage})`);
check(E.propagate(z, zf.id, rng, ctx).ok && zf.propYear === 1, '0년차 꽃잠 번식은 1년차 몫');
E.advance(z, MON2 + 60e3, ctx);
check(E.yearOf(z, E.calendar(z.virtual)) === 1 && !E.propagate(z, zf.id, rng, ctx).ok, '1년차 3월엔 또 못 함');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
