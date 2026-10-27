// P28-06 📊 효율 정보 표 (10-28): flowerEconomy의 값이 엔진 값과 같은지 — 표 숫자를 따로 적지 않고, 실제로 한 해를 돌려 거둔 수와 맞춰 봄
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return c.slotStart + 0.01 * H; t += H / 4; } };

console.log('[📊 표 값 = 엔진 값]');
{
  const rows = E.flowerEconomy();
  check(rows.length === E.FLOWER_KEYS.length && rows.every((r, i) => r.key === E.FLOWER_KEYS[i]), '꽃 13종 모두 · 정렬 없으면 도감 순서');
  check(rows.every(r => { const F = E.FLOWERS[r.key]; return r.name === F.name && r.price === F.price && r.mature === F.mature && r.bloom === F.bloom.length && r.life === F.life; }), '화원 값 · 다 자라는 달 · 피는 달 수 = FLOWERS');
  check(rows.every(r => r.land === E.classify(E.FLOWERS[r.key].t, E.FLOWERS[r.key].m) && E.LANDS[r.land]), '좋아하는 땅 = 꽃이 만드는 땅 (classify)');
  check(rows.every(r => r.tea === E.teaItemValue(null, { type: r.key, q: 0.5 }) && r.tea === E.FLOWERS[r.key].teaBase), '찻값 대표 = ★3(품질 50%) 티백 한 잔 = 차 기본값');
  check(rows.every(r => r.star.length === 5 && r.star.every((v, i) => v === E.teaItemValue(null, { type: r.key, q: E.ECON_Q[i], hat: E.isHat(E.ECON_Q[i]) })) && E.stars(E.ECON_Q[4]) === 5 && E.stars(E.ECON_Q[0]) === 1), '★1~★5 값 = teaItemValue (★5는 햇차)');
  check(rows.every(r => r.star[0] < r.tea && r.tea < r.star[4]), '★가 오르면 값도 오름');
  check(rows.every(r => r.petals === E.HARVEST_PETALS && r.income === r.harvests * r.petals * r.tea), '한 해 기대 수입 = 한 해 수확 수 × 꽃잎 수 × 대표 찻값');
  const st = E.create(at(c => c.month === 6), () => 0.5); st.basket = 9;
  st.flowers.push({ id: 900, type: 'rose', x: 3, y: 3, q: 0.5, startQ: 0.5, stage: 'bloom', bloomed: true, withered: false, ageH: 999, lifeH: 999, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 });
  const p0 = st.petals.length; E.care(st, 'harvest', [[3, 3]], ctx);
  check(st.petals.length - p0 === E.HARVEST_PETALS, '손으로 한 번 거두면 꽃잎이 표의 수만큼 생김');
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
  // 여러해살이 · 나무: 다 자란 한 포기를 월요일 3월부터 꽃잠 끝까지. 한해살이: 처음 심는 달 첫머리에 심은 씨앗부터
  for (const r of E.flowerEconomy()) {
    const F = E.FLOWERS[r.key], annual = F.life === 'annual';
    const startIdx = annual ? E.MONTHS.indexOf(F.windows[0][0]) : 0;
    const t0 = at(c => c.idx === startIdx), st = E.create(t0, () => 0.5);
    st.basket = 99;
    const age = annual ? 0 : F.mature * E.MONTH_H;
    const f = { id: 900, type: r.key, x: 5, y: 5, q: 0.5, startQ: 0.5, stage: annual ? 'germ' : 'mature', bloomed: false, withered: false, ageH: age, lifeH: age, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 };
    st.flowers.push(f);
    const week = E.calendar(t0).week;
    let got = 0;
    for (let t = t0; ; t += 0.5 * H) {
      E.advance(st, t, ctx);
      const c = E.calendar(st.virtual);
      if (c.week !== week) break;
      const p0 = st.petals.length;
      if (E.care(st, 'harvest', [[5, 5]], ctx).ok) got += st.petals.length - p0;
    }
    check(got === r.harvests * r.petals, `${r.name}: 한 해 ${got}장 = 표 ${r.harvests}번 × ${r.petals}장${r.harvests > r.bloom ? ' (꽃잠에 한 번 더)' : ''}`);
  }
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
