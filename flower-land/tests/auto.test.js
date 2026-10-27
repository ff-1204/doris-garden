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

const petal = (st, type, q) => { const p = { id: st.nextId++, type, q: q == null ? 0.7 : q, seasonKey: 11 }; st.petals.push(p); return p; };
console.log('[🍂 자동 건조대 — 사기 · 오래된 꽃잎부터 하나에 8장]');
{
  const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.money = 1e6; st.grade.xp = E.gradeXpAt(8);
  check(!E.buyDeco(st, 'dryrack', ctx).ok, '등급 9 전엔 못 삼');
  st.grade.xp = E.gradeXpAt(9);
  const r = E.buyDeco(st, 'dryrack', ctx);
  check(r.ok && st.money === 1e6 - 50000 && E.DECOS.dryrack.need === 9, '50,000원 · 9등급부터');
  const ps = Array.from({ length: 10 }, (_, i) => petal(st, i % 2 ? 'rose' : 'lavender', 0.5 + i * 0.04));
  check(E.rackTick(st, ctx) === 0 && st.petals.length === 10, '창고에 있으면 쉼');
  E.placeDeco(st, r.deco.id, 0, 0);
  const d0 = st.stats.dried || 0;
  check(E.rackTick(st, ctx) === 8 && st.petals.length === 2 && st.petals[0] === ps[8], '하나면 8장 — 먼저 거둔 꽃잎부터');
  check(st.drying.length === 8 && st.drying.every(x => x.auto && x.leftH === E.DRY_H) && st.stats.dried === d0 + 8, '꽃방에 1달 · 말린 수에 셈');
  check(st.log.some(l => l.type === 12 && l.text === '자동 건조대가 꽃잎 8장을 꽃방에 널었어요'), '일지 한 줄');
  E.placeDeco(st, E.buyDeco(st, 'dryrack', ctx).deco.id, 1, 0);
  petal(st, 'rose'); petal(st, 'rose');
  check(E.rackTick(st, ctx) === 4 && st.petals.length === 0, '둘이면 16장까지 (있는 만큼)');
}

console.log('[🍂 다 마르면 티백까지 · 손으로 넌 꽃잎은 그대로]');
{
  const st = garden(c => c.month === 6 && !c.frozen);
  put(st, 'dryrack', 0, 0);
  E.advance(st, E.calendar(st.virtual).slotEnd - 0.05 * H, ctx);   // 6월 끝 무렵에 거둔 꽃잎 (제다실에서 거의 안 줆)
  const hand = petal(st, 'rose', 0.6); E.dryPetals(st, [hand.id]);
  petal(st, 'lavender', 0.85); petal(st, 'lavender', 0.5);
  monthEnd(st);   // 6월 끝: 건조대가 생화 2장을 넒
  check(st.petals.length === 0 && st.drying.filter(x => x.auto).length === 2, '6월이 끝나면 생화를 꽃방에');
  const teas0 = st.teas.length;
  monthEnd(st);   // 7월 끝: 다 마름
  const bags = st.teas.filter(t => t.auto);
  check(bags.length === 2 && st.teas.length === teas0 + 2 && bags.some(t => t.hat && t.type === 'lavender') && bags.every(t => t.seasonKey === -1), '1달 뒤 티백 2개 (★5는 햇차) — 손으로 말려 티백을 만든 것과 같음');
  check(st.dried.length === 1 && st.dried[0].id === hand.id, '손으로 넌 꽃잎은 말린 꽃잎 칸으로 (블렌드는 사람 몫)');
  check(st.stats.autoBags === 2 && st.dex.teabag.lavender, '티백 도감 · 센 수');
  check(st.log.some(l => l.type === 12 && l.text === '자동 건조대에서 꽃잎 2장이 말라 티백이 됐어요'), '일지 한 줄');
}

console.log('[🍂 꽃잠엔 쉼 · 바구니와 이어서 · 따라잡기 3주]');
{
  const sl = garden(c => c.month === 13); put(sl, 'dryrack', 0, 0); petal(sl, 'rose');
  sl.drying.push({ id: 999, type: 'rose', q: 0.7, leftH: 1, auto: true });
  E.advance(sl, E.calendar(sl.virtual).slotEnd + E.calendar(sl.virtual).slotEnd - E.calendar(sl.virtual).slotStart, ctx);   // 쉼달 · 꽃샘달
  check(sl.petals.length === 1 && sl.drying[0].leftH === 1 && sl.teas.length === 0, '꽃잠 동안 널지도 마르지도 않음');
  const st = garden(c => c.idx === 0 && c.yh < 1);
  put(st, 'autobasket', 10, 10); put(st, 'dryrack', 0, 0); fl(st, 'dongbaek', 10, 11); fl(st, 'dongbaek', 11, 11);
  E.advance(st, st.virtual + 21 * 24 * H, ctx);
  check(st.stats.autoHarvest === 18 && st.petals.length === 0, '바구니가 거둔 꽃잎은 그 자리에서 건조대로 (제다실에 안 남음)');
  check(st.stats.autoBags === 16 && st.drying.length === 2, '티백 16개 — 마지막 2월 꽃잎은 꽃잠이 지나야 마름');
  const lines = E.autoAwayLines(st, {});
  check(lines.length === 2 && lines[1] === '자동 건조대가 꽃잎을 말려 티백 16개를 만들었어요', '자리를 비운 동안: 장치마다 한 줄');
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
