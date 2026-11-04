// P28-06 📊 효율 정보 표 (10-28): flowerEconomy의 값이 엔진 값과 같은지 — 표 숫자를 따로 적지 않고, 실제로 한 해를 돌려 거둔 수와 맞춰 봄
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
{ const c0 = E.create; E.create = (...a) => Object.assign(c0(...a), { gardenId: 'test-garden' }); }   // P36 돌연변이는 정원 이름표 시드라 — 테스트 정원은 같은 이름표로 (무작위 이름표면 1%로 꽃이 변이해 거두기가 흔들림)
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return c.slotStart + 0.01 * H; t += H / 4; } };

console.log('[📊 표 값 = 엔진 값]');
{
  const rows = E.flowerEconomy();
  check(rows.length === E.FLOWER_KEYS.length && rows.every((r, i) => r.key === E.FLOWER_KEYS[i]), '꽃 13종 모두 · 정렬 없으면 도감 순서');
  check(rows.every(r => { const F = E.FLOWERS[r.key]; return r.name === F.name && r.price === F.price && r.mature === F.mature && r.bloom === F.bloom.length && r.life === F.life; }), '화원 값 · 다 자라는 달 · 피는 달 수 = FLOWERS');
  check(rows.every(r => r.land === E.classify(E.FLOWERS[r.key].t, E.FLOWERS[r.key].m) && E.LANDS[r.land]), '좋아하는 땅 = 꽃이 만드는 땅 (classify)');
  check(rows.every(r => r.tea === E.teaItemValue(null, { type: r.key, q: 0.5 }) && r.tea === Math.round(E.FLOWERS[r.key].teaBase * E.FLOWERS[r.key].petals / E.PETAL_BASE / 10) * 10 && r.tea === E.FLOWERS[r.key].teaBase * E.bagMul(E.FLOWERS[r.key])), 'P77-C 꽃잎 수: 찻값 대표 = ★3(품질 50%) 티백 한 잔 = 차 기본값 × petals / 5');
  check(rows.every(r => r.star.length === 5 && r.star.every((v, i) => v === E.teaItemValue(null, { type: r.key, q: E.ECON_Q[i], hat: E.isHat(E.ECON_Q[i]) })) && E.stars(E.ECON_Q[4]) === 5 && E.stars(E.ECON_Q[0]) === 1), '★1~★5 값 = teaItemValue (★5는 햇차)');
  check(rows.every(r => r.star[0] < r.tea && r.tea < r.star[4]), '★가 오르면 값도 오름');
  check(E.HARVEST_PETALS === undefined && rows.every(r => r.petals === E.FLOWERS[r.key].petals && r.petals === Math.max(5, r.petals) && r.income === r.harvests * ((r.petals + 1) / 2 / r.petals) * r.tea), 'P77-C 꽃잎 수: 한 해 기대 수입 = 한 해 수확 수 × 한 번 평균 (petals + 1) / 2장 ÷ 티백 하나 petals장 × 대표 찻값');
  const st = E.create(at(c => c.month === 6), () => 0.5); st.basket = 9;
  st.flowers.push({ id: 900, type: 'rose', x: 3, y: 3, q: 0.5, startQ: 0.5, stage: 'bloom', ripeH: 6, bloomed: true, withered: false, ageH: 999, lifeH: 999, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 });
  const p0 = st.petals.length; E.care(st, 'harvest', [[3, 3]], ctx);
  check(st.petals.length - p0 === E.harvestCount(E.FLOWERS.rose, ctx.rng) && st.petals.length - p0 === 3, 'P77-C 꽃잎 수: 손으로 한 번 거두면 꽃잎 1 + floor(rng × petals)장 (장미 rng 0.5 → 3장)');
  check([0, 0.5, 0.999].map(x => E.harvestCount(E.FLOWERS.chamomile, () => x)).join() === '1,7,12' && E.harvestCount(E.FLOWERS.chamomile) === 7, 'P77-C 꽃잎 수: 1 ~ petals장 (캐모마일 1 · 7 · 12 · rng 없으면 가운데)');
}

console.log('[📊 정렬]');
{
  const by = k => E.flowerEconomy(k);
  const inc = by('income'), pr = by('price'), ma = by('mature');
  const sorted = (a, f) => a.every((r, i) => !i || f(a[i - 1], r));
  check(sorted(inc, (a, b) => a.income > b.income || (a.income === b.income && a.i < b.i)), '한 해 수입 많은 순 (같으면 도감 순서)');
  check(sorted(pr, (a, b) => a.price < b.price || (a.price === b.price && a.i < b.i)), '값 싼 순');
  check(sorted(ma, (a, b) => a.mature < b.mature || (a.mature === b.mature && a.i < b.i)), '빨리 자라는 순');
  check(inc.length === 13 && E.flowerEconomy('없는 것').map(r => r.key).join() === E.FLOWER_KEYS.join(), '모르는 정렬은 도감 순서');
  check(JSON.stringify(E.flowerEconomy('income')) === JSON.stringify(inc), '같은 정렬은 늘 같은 결과 (난수 없음)');
}

console.log('[📊 한 해 수확 수 = 실제로 한 해 동안 거둔 수]');
{
  // 여러해살이 · 나무: 다 자란 한 포기(지난해부터 다시 필 때가 된 꽃 — P72-01)를 월요일 3월부터 꽃잠 끝까지 반 시간마다 거둠. 한해살이: 처음 심는 달 첫머리에 심은 씨앗부터
  for (const r of E.flowerEconomy()) {
    const F = E.FLOWERS[r.key], annual = F.life === 'annual';
    const startIdx = annual ? E.MONTHS.indexOf(F.windows[0][0]) : 0;
    const t0 = at(c => c.idx === startIdx), st = E.create(t0, () => 0.5);
    st.basket = 99;
    const age = annual ? 0 : F.mature * E.MONTH_H;
    const f = { id: 900, type: r.key, x: 5, y: 5, q: 0.5, startQ: 0.5, stage: annual ? 'germ' : 'mature', ripeH: annual ? 0 : E.RIPE_H, bloomed: false, withered: false, ageH: age, lifeH: age, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 };
    st.flowers.push(f);
    const week = E.calendar(t0).week;
    let got = 0, n = 0;
    for (let t = t0; ; t += 0.5 * H) {
      E.advance(st, t, ctx);
      const c = E.calendar(st.virtual);
      if (c.week !== week) break;
      const p0 = st.petals.length;
      if (E.care(st, 'harvest', [[5, 5]], ctx).ok) { got += st.petals.length - p0; n++; }
    }
    const k = E.harvestCount(F, ctx.rng);
    check(n === r.harvests && got === r.harvests * k, `P77-C 꽃잎 수: ${r.name}: 한 해 ${got}장 = 표 ${r.harvests}번 × ${k}장(rng 0.5 — 1 ~ ${r.petals}장) (P72-01 ${E.RIPE_H}시간마다)`);
  }
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
