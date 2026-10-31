// P28-10 🧺 자동 장치 (10-28): 자동 수확 바구니 · 자동 건조대 · 찻집 일손 — 손을 덜어 줄 뿐 사람보다 더 벌지 않음 (P17-14)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = 12 * H, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const old0 = st => { st.bonus = Object.assign(E.newBonus(), st.bonus, { basket: 5, rack: 5, hive: 1, weed: 2 }); st.bonusFree = { basket: 6, rack: 6, hive: 1, weed: 2 }; return st; };   // P38 예전 0단계 값(🐜 8포기 · 🐛 8장 · 🐝 2칸 6병 · 🐞 3포기)으로 옮긴 정원 — 예전 규칙 확인은 그대로
const garden = pred => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'auto-test'; st.money = 1e6; st.grade.xp = E.gradeXpAt(12); return old0(st); };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const put = (st, key, x, y) => { const r = E.buyDeco(st, key, ctx); E.placeDeco(st, r.deco.id, x, y); return r.deco; };
const petal = (st, type, q) => { const p = { id: st.nextId++, type, q: q == null ? 0.7 : q, seasonKey: 11 }; st.petals.push(p); return p; };
const monthEnd = st => E.advance(st, E.calendar(st.virtual).slotEnd + 0.2 * H, ctx);

console.log('[🧺 자동 수확 바구니 — 사기]');
{
  const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.money = 1e6;
  check(E.AUTO_KEYS.includes('autobasket') && E.DECOS.autobasket.price === 12000 && E.DECOS.autobasket.need === 2, '12,000원 · 정원 등급 2부터 (P38)');
  const r0 = E.buyDeco(st, 'autobasket', ctx);
  check(!r0.ok && r0.msg.includes('정원 등급 2') && st.money === 1e6, '등급 2 전엔 못 삼');
  st.grade.xp = E.gradeXpAt(2);
  const a = E.buyDeco(st, 'autobasket', ctx), b = E.buyDeco(st, 'autobasket', ctx);
  check(a.ok && b.ok && st.money === 1e6 - 24000, '2등급이면 사고 여러 개 살 수 있음');
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
  const wk = s => JSON.stringify((E.weeklyOf(s) || { goals: [] }).goals.map(g => g.got));
  st.onboarded = true; const w0 = wk(st); fl(st, 'chamomile', 4, 6); E.basketTick(st, cal, ctx); petal(st, 'rose'); put(st, 'dryrack', 0, 0); E.rackTick(st, ctx);
  check(wk(st) === w0, '장치가 한 일은 주간 목표에 세지 않음 (P28-09 — 목표는 손으로 한 일)');
  check(E.canCare(st, near[0], 'harvest', cal) === false, '바구니가 거둔 꽃은 그 달에 손으로도 다시 못 거둠');
}

console.log('[🧺 달이 끝날 때 · 창고에선 쉼 · 꽃잠엔 쉼]');
{
  const st = garden(c => c.month === 6 && !c.frozen);
  put(st, 'autobasket', 3, 3); const f = fl(st, 'lavender', 3, 4);
  const p0 = st.petals.length;
  monthEnd(st);
  check(st.petals.length === p0 + 1 && f.harvestKey === E.calendar(st.virtual).abs - 1, '6월이 끝나면 저절로 꽃잎 한 장');
  check(st.log.some(l => l.type === 18 && l.text === '개미 일꾼이 꽃잎 1장을 물어 왔어요'), '일지 한 줄');
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
  check(lines.length === 1 && lines[0] === '개미 일꾼이 꽃잎 14장을 물어 왔어요' && E.isAutoLine(lines[0]), '자리를 비운 동안: 그사이 거둔 수를 한 줄로');
  st.settings.slow = true;
  check(E.autoAwayLines(st, { autoHarvest: 4 })[0] === '개미 일꾼이 꽃잎을 물어 왔어요', '🐢 느긋하게 보기면 숫자 없이');
  check(E.autoAwayLines(st, E.autoStats(st)).length === 0, '그사이 한 일이 없으면 줄 없음');
}

console.log('[🍂 자동 건조대 — 사기 · 오래된 꽃잎부터 하나에 8장]');
{
  const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); st.money = 1e6; old0(st); st.grade.xp = E.gradeXpAt(3);
  check(!E.buyDeco(st, 'dryrack', ctx).ok, '등급 4 전엔 못 삼');
  st.grade.xp = E.gradeXpAt(4);
  const r = E.buyDeco(st, 'dryrack', ctx);
  check(r.ok && st.money === 1e6 - 18000 && E.DECOS.dryrack.need === 4, '18,000원 · 4등급부터 (P38)');
  const ps = Array.from({ length: 10 }, (_, i) => petal(st, i % 2 ? 'rose' : 'lavender', 0.5 + i * 0.04));
  check(E.rackTick(st, ctx) === 0 && st.petals.length === 10, '창고에 있으면 쉼');
  E.placeDeco(st, r.deco.id, 0, 0);
  const d0 = st.stats.dried || 0;
  check(E.rackTick(st, ctx) === 8 && st.petals.length === 2 && st.petals[0] === ps[8], '하나면 8장 — 먼저 거둔 꽃잎부터');
  check(st.drying.length === 8 && st.drying.every(x => x.auto && x.leftH === E.DRY_H) && (st.stats.dried || 0) === d0 && st.stats.autoHung === 8, '꽃방에 1달 · 퀘스트 · 칭호의 말린 수에는 안 셈 (손으로 넌 것만)');
  check(st.log.some(l => l.type === 12 && l.text === '누에 일꾼이 꽃잎 8장을 꽃방에 널었어요'), '일지 한 줄');
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
  check(st.log.some(l => l.type === 12 && l.text === '누에 일꾼이 말린 꽃잎 2장이 티백이 됐어요'), '일지 한 줄');
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
  check(lines.length === 2 && lines[1] === '누에 일꾼이 꽃잎을 말려 티백 16개를 만들었어요', '자리를 비운 동안: 장치마다 한 줄');
}

const bag = (st, type, q, extra) => { const t = Object.assign({ id: st.nextId++, type, q: q == null ? 0.7 : q, seasonKey: -1, hat: false }, extra); st.teas.push(t); return t; };
console.log('[🫖 찻집 일손 — 사기 · 하나만]');
{
  const st = E.create(at(c => c.month === 12), () => 0.5); st.money = 1e6; old0(st); st.grade.xp = E.gradeXpAt(5);
  check(!E.buyDeco(st, 'teahelper', ctx).ok, '등급 6 전엔 못 삼');
  st.grade.xp = E.gradeXpAt(6);
  const r = E.buyDeco(st, 'teahelper', ctx), r2 = E.buyDeco(st, 'teahelper', ctx);
  check(r.ok && !r2.ok && st.money === 1e6 - 30000, '30,000원 · 하나만 (P38)');
}

console.log('[🫖 열려 있으면 오래된 티백부터 카운터를 (손님 자리 + 1)잔까지]');
{
  const st = garden(c => c.month === 12), cal = E.calendar(st.virtual);
  const bs = [bag(st, 'rose', 0.6), bag(st, 'lavender', 0.9, { hat: true }), bag(st, 'rose', 0.5), bag(st, 'gamguk', 0.7)];
  const blend = { id: st.nextId++, parts: ['rose', 'chamomile'], q: 0.7, recipe: 'springfield', name: '봄 들판', hat: false, bagged: true }; st.blends.push(blend);
  check(E.helperTick(st, cal) === 0 && st.cups.length === 0, '창고에 있으면 쉼');
  const d = put(st, 'teahelper', 0, 0);
  check(E.helperKeep(st) === 2 && E.helperTick(st, cal) === 2 && st.cups.map(c => c.type).join() === 'rose,lavender' && st.cups[1].hat, '손님 자리 1 → 2잔, 가장 오래된 티백부터 (햇차는 그대로)');
  check(st.teas.length === 2 && st.blends.length === 1 && st.cups.every(c => c.kind === 'tea' && c.brewAbs === cal.abs), '블렌드 티백은 남김');
  check(E.helperTick(st, cal) === 0, '카운터가 차 있으면 그대로');
  E.addSeat(st);
  check(E.helperTick(st, cal) === 1 && st.cups.length === 3 && d.n === 3, '손님 자리를 늘리면 하나 더');
  const m0 = st.money;
  E.advance(st, st.virtual + 2.05 * H, ctx);   // 손님 2자리 · 2시간 → 4잔 팔림, 그사이 일손이 다시 채움
  check(st.stats.autoCups === 4 && st.teas.length === 0 && st.money > m0, '카운터가 한 잔씩 팖 (기존 자동 판매)');
}

console.log('[🫖 P34 매달 일함 (6월 · 꽃잠) · 자리를 비운 동안 한 줄]');
{
  const cl = garden(c => c.month === 6 && !c.frozen); put(cl, 'teahelper', 0, 0); bag(cl, 'rose');
  E.advance(cl, cl.virtual + 3 * H, ctx);
  check(cl.teas.length === 0 && cl.stats.autoBrew === 1, 'P34 6월(예전엔 닫힘)에도 우림');
  const st = garden(c => c.month === 13); put(st, 'teahelper', 0, 0);
  for (let i = 0; i < 6; i++) bag(st, 'rose');
  const b0 = E.autoStats(st);
  E.advance(st, st.virtual + 8 * H, ctx);
  check(st.teas.length === 0 && st.stats.autoBrew === 6 && st.stats.autoCups === 6, '쉼달에도 우려 팖 (시간은 멈춰도 찻집은 열림)');
  E.advance(st, E.calendar(st.virtual).slotEnd + 0.1 * H, ctx);
  check(st.log.some(l => l.type === 13 && l.text === '나비 일꾼이 찻잔 6잔을 우렸어요'), '일지는 달이 바뀔 때 한 줄');
  check(E.autoAwayLines(st, b0).join() === '나비 일꾼이 찻잔 6잔을 우렸어요' && E.autoLineType('나비 일꾼이 찻잔 6잔을 우렸어요') === 13, '자리를 비운 동안 한 줄 (☕)');
}

// 같은 꽃 · 같은 때를 사람이 손으로(달 중간에 거둬 바로 널고, 마르면 티백, 찻집이 열리면 모두 우려 바로 팖) 한 정원과 장치 셋만 둔 정원
function twin(auto) {
  const st = garden(c => c.idx === 0 && c.yh < 1);
  if (auto) { put(st, 'autobasket', 10, 10); put(st, 'dryrack', 0, 0); put(st, 'teahelper', 1, 0); }
  else st.money -= 12000 + 18000 + 30000;   // 같은 돈에서 시작
  for (const [x, y] of [[9, 9], [10, 9], [11, 9], [9, 11], [11, 11]]) fl(st, 'dongbaek', x, y);
  const end = st.virtual + 14 * 24 * H;
  while (st.virtual < end) {
    if (!auto) {
      const cal = E.calendar(st.virtual);
      while (st.basket < 5) E.buySupply(st, 'basket', 1);   // 바구니 용품은 사서 씀
      for (const f of st.flowers) E.care(st, 'harvest', [[f.x, f.y]], ctx);
      if (st.petals.length) E.dryPetals(st, st.petals.map(p => p.id));
      if (st.dried.length) E.makeTeaDried(st, st.dried.map(p => p.id), ctx);
      if (E.teaShopOpen(cal) && st.teas.length) { E.brew(st, st.teas.map(t => t.id), []); E.sellCups(st, st.cups.map(c => c.id), ctx); }
    }
    E.advance(st, st.virtual + 2 * H, ctx);
  }
  return st;
}
console.log('[사람이 손으로 하는 것보다 더 벌지 않음 (P17-14)]');
{
  const hand = twin(false), auto = twin(true);
  console.log(`    손: 돈 ${hand.money} · 판 잔 ${hand.stats.cups || 0} / 장치: 돈 ${auto.money} · 판 잔 ${auto.stats.cups || 0} · 거둠 ${auto.stats.autoHarvest} · 티백 ${auto.stats.autoBags} · 우림 ${auto.stats.autoBrew}`);
  check(auto.stats.autoHarvest > 0 && auto.stats.autoBags > 0 && auto.stats.autoBrew > 0 && auto.stats.cups > 0, '장치 셋이 이어서 일함 (거둠 → 티백 → 우림 → 판매)');
  check(auto.money <= hand.money, '같은 꽃이면 손으로 한 정원이 같거나 더 벎 (장치 값을 빼고 셈)');
  check(auto.stats.cups <= hand.stats.cups, '판 잔 수도 손이 같거나 많음 (꽃잠 수확 · 블렌드는 사람 몫)');
}

console.log('[저장 · 불러오기]');
{
  const st = garden(c => c.month === 6 && !c.frozen);
  const a = put(st, 'autobasket', 3, 3), r = put(st, 'dryrack', 0, 0); put(st, 'teahelper', 1, 0); fl(st, 'lavender', 3, 4);
  monthEnd(st);
  const re = E.parseSave(JSON.stringify(E.makeSave(st, 12345)));
  const g = re.ok && E.migrateSave(JSON.parse(JSON.stringify(re.data.game)));   // 앱 불러오기와 같은 길 (파일 → 열 때 보정)
  check(re.ok && !!g, '파일로 저장해서 다시 열기');
  check(['autobasket', 'dryrack', 'teahelper'].every(k => g.decos.some(d => d.key === k && d.x != null)) && g.decos.find(d => d.key === 'autobasket').n === 1, '놓인 자리 · 장치가 센 수 그대로');
  check(g.drying.length === 1 && g.drying[0].auto && g.stats.autoHarvest === 1, '건조대가 넌 꽃잎(말리는 중)도 그대로');
  monthEnd(g);
  check(g.teas.some(t => t.auto) || (g.cups || []).some(c => c.auto) || (g.stats.autoCups || 0) > 0, '불러온 뒤에도 다 마르면 티백 (P34 찻집이 열려 있어 나비 일꾼이 바로 우리기도 함)');
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
