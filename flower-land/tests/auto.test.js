// P28-10 🧺 자동 장치 (10-28): 자동 수확 바구니 · 자동 건조대 · 찻집 일손 — 손을 덜어 줄 뿐 사람보다 더 벌지 않음 (P17-14)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = 12 * H, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = pred => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'auto-test'; st.money = 1e6; st.grade.xp = E.gradeXpAt(12); return st; };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const put = (st, key, x, y) => { const r = E.buyDeco(st, key, ctx); E.placeDeco(st, r.deco.id, x, y); return r.deco; };
const monthEnd = st => E.advance(st, E.calendar(st.virtual).slotEnd + 0.2 * H, ctx);

console.log('[🧺 자동 수확 바구니 — 사기]');
{
  const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.money = 1e6;
  check(E.AUTO_KEYS.includes('autobasket') && E.DECOS.autobasket.price === 40000 && E.DECOS.autobasket.need === 6, '40,000원 · 정원 등급 6부터');
  const r0 = E.buyDeco(st, 'autobasket', ctx);
  check(!r0.ok && r0.msg.includes('정원 등급 6') && st.money === 1e6, '등급 6 전엔 못 삼');
  st.grade.xp = E.gradeXpAt(6);
  const a = E.buyDeco(st, 'autobasket', ctx), b = E.buyDeco(st, 'autobasket', ctx);
  check(a.ok && b.ok && st.money === 1e6 - 80000, '6등급이면 사고 여러 개 살 수 있음');
  check([3, 6, 12, 13].every(m => E.decoOffer({ month: m }).includes('autobasket')), '늘 팖 (꽃잠에도)');
  check(E.DECO_KEYS.includes('autobasket') && !E.GRADE_DECO_KEYS.includes('autobasket'), '꾸밈 도감 칸에 들어가고 등급 장식 줄과는 따로');
}

console.log('[🧺 바로 옆 핀 꽃만 · 그 달에 손으로 거둔 꽃은 빼고]');
{
  const st = garden(c => c.month === 6 && !c.frozen), cal = E.calendar(st.virtual);
  const d = put(st, 'autobasket', 5, 5), basket0 = st.basket;
  const near = [fl(st, 'chamomile', 4, 4), fl(st, 'chamomile', 6, 5), fl(st, 'lavender', 5, 6, { q: 1 })], far = fl(st, 'chamomile', 7, 5), young = fl(st, 'chamomile', 4, 5, { stage: 'young' });
  E.care(st, 'harvest', [[6, 5]], ctx);   // 손으로 하나 먼저
  const p0 = st.petals.length, xp0 = st.grade.xp, h0 = st.yearNow.harvest;
  const n = E.basketTick(st, cal, ctx);
  check(n === 2 && st.petals.length === p0 + 2, '바로 옆 핀 꽃 3포기 중 손으로 안 거둔 2포기만');
  check(far.harvestKey === -1 && young.harvestKey === -1 && near[0].harvestKey === cal.abs, '둘레 밖 · 안 핀 꽃은 그대로');
  const lav = st.petals.find(p => p.type === 'lavender');
  check(lav && Math.abs(lav.q - 0.9) < 1e-9 && lav.auto, '꽃잎 품질은 손으로 거둔 것의 90%');
  check(st.basket === basket0 - 1, '바구니 용품은 손으로 거둔 1번만 씀');
  check(st.grade.xp === xp0 + 2 * E.XP.harvest && st.yearNow.harvest === h0 + 2 && d.n === 2, '경험치 · 올해 거둔 꽃잎은 사람이 거둔 것과 같은 양 · 장치에 센 수');
  check(E.basketTick(st, cal, ctx) === 0, '같은 달엔 한 번만');
  check(E.canCare(st, near[0], 'harvest', cal) === false, '바구니가 거둔 꽃은 그 달에 손으로도 다시 못 거둠');
}

console.log('[🧺 달이 끝날 때 · 창고에선 쉼 · 꽃잠엔 쉼]');
{
  const st = garden(c => c.month === 6 && !c.frozen);
  put(st, 'autobasket', 3, 3); const f = fl(st, 'lavender', 3, 4);
  const p0 = st.petals.length;
  monthEnd(st);
  check(st.petals.length === p0 + 1 && f.harvestKey === E.calendar(st.virtual).abs - 1, '6월이 끝나면 저절로 꽃잎 한 장');
  check(st.log.some(l => l.type === 18 && l.text === '자동 수확 바구니가 꽃잎 1장을 거뒀어요'), '일지 한 줄');
  const sto = garden(c => c.month === 6 && !c.frozen); const sd = E.buyDeco(sto, 'autobasket', ctx).deco; fl(sto, 'lavender', 0, 0);
  monthEnd(sto);
  check(sto.petals.length === 0 && sd.x == null, '창고의 바구니는 쉼');
  const sl = garden(c => c.month === 13); put(sl, 'autobasket', 2, 2); const g = fl(sl, 'dongbaek', 2, 3);
  monthEnd(sl);
  check(sl.petals.length === 0 && g.harvestKey === -1 && E.canCare(sl, g, 'harvest', E.calendar(sl.virtual)), '쉼달이 끝날 땐 안 거둠 — 꽃잠 수확은 사람 몫으로 남음');
}

console.log('[🧺 따라잡기 3주 · 꽃잠을 건너뜀]');
{
  const st = garden(c => c.idx === 0 && c.yh < 1);   // 월요일 3월
  const d = put(st, 'autobasket', 10, 10); fl(st, 'dongbaek', 10, 11); fl(st, 'dongbaek', 11, 11);
  E.advance(st, st.virtual + 21 * 24 * H, ctx);   // 앱 catchUp의 한도(3주)
  check(d.n === 3 * 3 * 2, '동백 2그루 × (12월 · 1월 · 2월) × 3주 = 18장 — 꽃잠 · 피지 않는 달엔 0');
  check(st.stats.autoHarvest === 18, '모두 센 수 (stats.autoHarvest)');
  const lines = E.autoAwayLines(st, { autoHarvest: 4 });
  check(lines.length === 1 && lines[0] === '자동 수확 바구니가 꽃잎 14장을 거뒀어요' && E.isAutoLine(lines[0]), '자리를 비운 동안: 그사이 거둔 수를 한 줄로');
  st.settings.slow = true;
  check(E.autoAwayLines(st, { autoHarvest: 4 })[0] === '자동 수확 바구니가 꽃잎을 거뒀어요', '🐢 느긋하게 보기면 숫자 없이');
  check(E.autoAwayLines(st, E.autoStats(st)).length === 0, '그사이 한 일이 없으면 줄 없음');
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
