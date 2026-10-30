// 🌱 정원 등급 (P28-05-01, 10-27): 정원에서 한 일로 경험치 → 등급 (처음엔 빨리 · 뒤로 갈수록 천천히 · 끝없음), 사기만 해서는 안 오름, 등급 장식
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const xp = st => st.grade.xp, by = (st, k) => st.grade.by[k] || 0;
const until = (st, test, maxH) => { for (let i = 0; i < (maxH || 2000); i++) { if (test()) return true; E.advance(st, st.virtual + H, ctx); } return false; };

console.log('[등급 표]');
const st0 = E.create(mon + 0.1 * H, () => 0.5);
const g0 = E.gradeOf(st0);
check(g0.grade === 1 && g0.name === '씨앗 정원 1' && g0.xp === 0 && g0.next === 40 && g0.progress === 0, `새 정원은 씨앗 정원 1 · 다음까지 40 (${JSON.stringify(g0)})`);
const cum = g => { let b = 0; for (let i = 1; i < g; i++) b += E.gradeCost(i); return b; };
check(E.gradeAt(39).grade === 1 && E.gradeAt(40).grade === 2 && E.gradeAt(cum(10) - 1).grade === 9 && E.gradeAt(cum(10)).grade === 10, '경계: 40점에 2등급, 모자라면 그대로');
check(['씨앗 정원 5', '새싹 정원 1', '새싹 정원 3', '숲 정원 1', '숲 정원 70'].join() === [5, 6, 8, 31, 100].map(E.gradeName).join(), '이름: 5등급마다 다음 이름, 숲 정원은 숫자가 끝없이');
const gx = { grade: { xp: cum(8) + 10, by: {}, dex: 0 } }, gg = E.gradeOf(gx);
check(gg.grade === 8 && gg.name === '새싹 정원 3' && gg.next === cum(9) && Math.abs(gg.progress - 10 / E.gradeCost(8)) < 1e-9, 'gradeOf: 등급 · 이름 · 경험치 · 다음 · 진행');

console.log('[끝없이 오름]');
let inc = true; for (let g = 1; g < 1000; g++) if (!(E.gradeCost(g + 1) > E.gradeCost(g))) inc = false;
check(inc, '뒤로 갈수록 한 등급에 드는 경험치가 늘어남 (1000등급까지)');
const big = E.gradeOf({ grade: { xp: 1e7 } });
check(big.grade > 200 && big.next > 1e7 && big.progress >= 0 && big.progress < 1, `천만 점에도 다음 등급이 있음 (${big.grade}등급)`);
check(E.gradeCost(20) / E.gradeCost(1) < 7 && E.gradeCost(200) / E.gradeCost(20) < 4, '뒤로 가도 너무 가파르지 않음 (20등급부터 3점씩만 늘어남)');

console.log('[경험치가 쌓이는 곳]');
const st = E.create(mon + 0.1 * H, () => 0.5); st.gardenId = 'grade-1';
const ups = []; const gctx = { live: false, rng: () => 0.5, onGrade: e => ups.push(e) };
st.onboarded = true; E.advance(st, st.virtual + H, gctx);
check(by(st, 'quest') === 10 && st.journal.done.c0_visit != null, '퀘스트 하나 끝내면 10 (첫 방문)');
E.giftPot(st, ctx);
const pot = st.flowers[0];
const d0 = by(st, 'dex');
check(until(st, () => E.care(st, 'harvest', [[pot.x, pot.y]], gctx).ok), '화분 꽃이 피어 거둠');
check(by(st, 'harvest') === 2 * 2, '꽃잎 한 장에 2 (화분 첫 수확은 2장 → 4)');
E.advance(st, st.virtual + H, gctx);
check(by(st, 'dex') - d0 >= 5 && (by(st, 'dex') - d0) % 5 === 0, `도감 새 칸 하나에 5 (꽃 · 꽃잎 등록 → +${by(st, 'dex') - d0})`);
check(until(st, () => E.teaShopOpen(E.calendar(st.virtual)), 24 * 7), '찻집이 열림 (12월)');
const s0 = by(st, 'sell');
for (let i = 0; i < 3; i++) st.teas.push({ id: 90000 + i, type: 'chamomile', q: 1, seasonKey: -1, hat: false });
E.brew(st, [90000, 90001, 90002], []);   // 꾸러미 티백(P22-05)은 빼고
st.orders = { abs: E.calendar(st.virtual).abs, list: [{ kind: 'any', done: false }] };
const o0 = by(st, 'order');
check(E.sellCups(st, st.cups.map(c => c.id), gctx).ok && by(st, 'sell') - s0 === 3 * 2, '찻잔 한 잔 팔 때 2 (3잔 → 6)');
check(by(st, 'order') - o0 === 15, '손님 주문 하나 들어주면 15');
st.teas.push({ id: 90010, type: 'chamomile', q: 1, seasonKey: -1, hat: false });
const s1 = by(st, 'sell');
check(E.sellTea(st, [90010], gctx).ok && by(st, 'sell') - s1 === 2, '찻집에서 차를 바로 팔아도 한 잔에 2');
const w0 = xp(st), wr = E.addXp(st, 'weekly', 30, gctx);
check(wr.xp === 30 && xp(st) - w0 === 30 && by(st, 'weekly') === 30, '주간 목표(P28-09) 자리: addXp(st, "weekly", 점수)');
check(E.addXp(st, 'buy', 100).xp === 0 && E.addXp(st, 'harvest', 0).xp === 0 && E.addXp(st, 'harvest', -3).xp === 0 && xp(st) - w0 === 30, '모르는 일 · 0 · 음수는 0');
const sumBy = Object.values(st.grade.by).reduce((a, b) => a + b, 0);
check(sumBy === xp(st), '어디서 왔는지(by)를 더하면 경험치');

console.log('[한 해 평가 · yearLog.grade]');
const recN = st.records.length, y0 = by(st, 'year');
check(until(st, () => st.records.length > recN, 24 * 7), '쉼달 기록');
const rec = st.records[0], row = E.yearLogOf(st).find(r => r.year === rec.year);
const want = rec.score - (rec.scoreParts.decos || 0) - (rec.scoreParts.gifts || 0);
check(by(st, 'year') - y0 === want && want > 0, `한 해 평가 점수만큼 (장식 · 선물 몫 빼고, +${want})`);
check(row && row.grade === E.gradeOf(st).grade, `해마다 기록 줄에 그해 끝 등급 (${row && row.grade})`);

console.log('[오를 때 일지 · 알림 이벤트]');
const ups1 = ups.length;
check(ups1 >= 2 && ups.every((e, i) => e.grade > e.from && e.name === E.gradeName(e.grade) && (i === 0 || e.from === ups[i - 1].grade)), `오를 때마다 onGrade 한 번 (${ups.map(e => e.grade).join('→')})`);
const glines = [...st.log, ...st.records.flatMap(x => x.log)].filter(l => l.text.startsWith('🌱 정원 등급이 올랐어요'));
check(glines.length === ups1 && glines.every(l => l.type === 9), `오를 때마다 일지에 "🌱 정원 등급이 올랐어요" 한 줄 (지난 기록 일지 포함 ${glines.length}줄)`);
const ry = E.create(mon + 0.1 * H, () => 0.5); ry.gardenId = 'grade-ry'; E.giftPot(ry, ctx); E.advance(ry, ry.virtual + H, ctx);   // 화분 한 포기 → 한 해 평가 점수가 0이 아님
until(ry, () => E.calendar(ry.virtual + H).idx === 12, 24 * 7);                                 // 쉼달 바로 앞까지
E.addXp(ry, 'weekly', E.gradeAt(ry.grade.xp).base + E.gradeAt(ry.grade.xp).cost - ry.grade.xp - 1);   // 다음 등급까지 1점
const ryg = E.gradeOf(ry).grade + 1;
E.advance(ry, ry.virtual + H, ctx);
check(ry.records.length === 1 && ry.grade.by.year > 0 && E.gradeOf(ry).grade >= ryg
  && ry.log.some(l => l.text === `🌱 정원 등급이 올랐어요 · ${E.gradeName(E.gradeOf(ry).grade)}`), '쉼달 기록(한 해 평가)으로 오른 줄은 새해 일지에 남음 (기록하며 비우는 일지에 묻히지 않음)');
const one = E.create(mon + 0.1 * H, () => 0.5), ev = [], lg0 = one.log.length;
E.addXp(one, 'weekly', E.gradeCost(1) + E.gradeCost(2) + 1, { onGrade: e => ev.push(e) });
check(ev.length === 1 && ev[0].from === 1 && ev[0].grade === 3, '한 번에 두 등급이 올라도 이벤트 · 일지 한 번');
check(one.log.length === lg0 + 1 && one.log[one.log.length - 1].text === '🌱 정원 등급이 올랐어요 · 씨앗 정원 3', '일지 문구');
check(!one.log.some(l => l.type === 3 || l.type === 8), '알림 종류(3 · 8)로 쓰지 않음 — 알림 모양은 화면(M1-4)이 onGrade로');
const live = E.create(mon + 0.1 * H, () => 0.5), toasts = [];
E.addXp(live, 'weekly', 50, { live: true, toast: t => toasts.push(t), onGrade: () => {} });
check(toasts.length === 0, '지금은 등급 알림 토스트를 띄우지 않음 (M1-4)');

console.log('[느긋하게 보기와 상관없이 쌓임]');
const slow = E.create(mon + 0.1 * H, () => 0.5); slow.settings.slow = true; const sev = [];
E.addXp(slow, 'weekly', 100, { onGrade: e => sev.push(e) });
check(slow.grade.xp === 100 && E.gradeOf(slow).grade === 3 && sev.length === 1, '켜도 경험치 · 등급 · 이벤트는 그대로 (숨김은 화면 몫)');
check(!slow.log.some(l => l.text.includes('정원 등급')), '켜면 일지에 등급 숫자를 남기지 않음 (P28-02 점수와 같음)');

console.log('[돈으로 사기만 해서는 안 오름]');
const buy = E.create(mon + 0.1 * H, () => 0.5); buy.gardenId = 'grade-buy'; buy.onboarded = true;
E.advance(buy, buy.virtual + H, ctx);
const b0 = copy(buy.grade); buy.money = 10000000;
const cal = E.calendar(buy.virtual);
for (const k of E.FLOWER_KEYS) if (E.FLOWERS[k].sow.includes(cal.month)) E.buy(buy, k, 3);
for (const k of Object.keys(E.SUPPLIES)) E.buySupply(buy, k, 5);
for (const k of E.decoOffer(cal)) E.buyDeco(buy, k);
for (let i = 0; i < 3; i++) E.addSeat(buy);
for (const [kind, list] of [['cup', E.CUP_SETS], ['sign', E.SIGNS]]) for (const k of Object.keys(list)) E.buyDecor(buy, kind, k);
for (const k of E.GIFT_KEYS) E.sendGift(buy, k);
const bought = buy.items.length + buy.decos.length;
E.advance(buy, buy.virtual + H, ctx);
check(bought > 3 && JSON.stringify(buy.grade) === JSON.stringify(b0), `씨앗 · 용품 · 장식 · 찻집 가꾸기 · 선물을 사도 경험치 그대로 (${b0.xp})`);
check(E.gradeDexCount(buy) === b0.dex, '사서 생기는 씨앗 · 묘목 · 꾸밈 · 편지 도감은 등급 도감 칸에 넣지 않음');

console.log('[등급 장식 (12-6 여정)]');
check(E.GRADE_DECO_KEYS.length === 6 && E.GRADE_DECO_KEYS.map(k => E.DECOS[k].grade).join() === '5,10,15,20,25,30', '등급 5 · 10 · 15 · 20 · 25 · 30에 하나씩');
check(E.GRADE_DECO_KEYS.every(k => !E.DECO_KEYS.includes(k) && !E.decoOffer({ month: 3 }).includes(k) && !E.DECOS[k].func), '이달의 장식 · 기능 장식이 아님 (화원은 🌱 등급 장식 줄, M1-4)');
check(E.GRADE_DECO_KEYS.every(k => E.DECOS[k].price > 0) && E.GRADE_DECO_KEYS.every((k, i) => i === 0 || E.DECOS[k].price > E.DECOS[E.GRADE_DECO_KEYS[i - 1]].price), '값은 등급 따라 오름');
const gd = E.create(mon + 0.1 * H, () => 0.5); gd.money = 100000;
check(E.gradeDecoOffer(gd).length === 0, '1등급엔 살 수 있는 등급 장식 없음');
const no = E.buyDeco(gd, 'sproutsign');
check(!no.ok && no.msg.includes('정원 등급 5부터') && gd.money === 100000, `5등급 전엔 못 삼 ("${no.msg}")`);
E.addXp(gd, 'weekly', cum(5) - 1);
check(E.gradeOf(gd).grade === 4 && !E.buyDeco(gd, 'sproutsign').ok, '4등급(5등급까지 1점 모자람)도 못 삼');
const gev = []; E.addXp(gd, 'weekly', 1, { onGrade: e => gev.push(e) });
check(gev.length === 1 && gev[0].grade === 5 && gev[0].unlock.join() === 'sproutsign', '5등급이 되면 이벤트에 열린 장식 (sproutsign)');
check(E.gradeDecoOffer(gd).join() === 'sproutsign', 'gradeDecoOffer: 지금 살 수 있는 등급 장식');
const months = [];
for (let i = 0; i < 14 && months.length < 3; i++) { const c = E.calendar(gd.virtual); if (!months.includes(c.month)) { months.push(c.month); check(E.buyDeco(gd, 'sproutsign').ok, `${c.month}월에도 삼 (달과 상관없이)`); } E.advance(gd, gd.virtual + 12 * H, ctx); }
check(gd.dex.deco.sproutsign && E.decoCount(gd) === 1 && E.decoTotal() === E.DECO_KEYS.length + E.GRADE_DECO_KEYS.length + E.TITLE_KEYS.length, '꾸밈 도감 칸 · 모은 수에 들어감 (여러 개 사도 한 칸, M1-4)');
const placed = gd.decos.find(d => d.key === 'sproutsign');
check(E.placeDeco(gd, placed.id, 0, 0).ok && E.decoAt(gd, 0, 0) === placed, '정원에 놓을 수 있음');
check(!E.buyDeco(gd, 'wateringcan').ok, '10등급 장식은 아직');

console.log('[저장 · 불러오기]');
const d = E.makeSave(st, 1), r = E.parseSave(JSON.stringify(d));
const back = r.ok && E.migrateSave(r.data.game);
check(back && JSON.stringify(back.grade) === JSON.stringify(st.grade) && E.gradeOf(back).grade === E.gradeOf(st).grade, '파일로 저장 · 다시 열어도 경험치 · 등급 · 어디서 왔는지 그대로');
check(back && JSON.stringify(E.yearLogOf(back)) === JSON.stringify(E.yearLogOf(st)), 'yearLog.grade도 그대로');
const gs = E.parseSave(JSON.stringify(E.makeSave(gd, 1)));
const gb = gs.ok && E.migrateSave(gs.data.game);
check(gb && gb.decos.filter(x => x.key === 'sproutsign').length === months.length && E.decoAt(gb, 0, 0).key === 'sproutsign', '산 등급 장식 · 놓은 자리도 그대로');
const again = E.migrateSave(copy(back));
check(JSON.stringify(again.grade) === JSON.stringify(st.grade), '여러 번 열어도 경험치가 다시 더해지지 않음');

// ---------------------------------------------------------------- 🌟 등급 보너스 (P28-05-02, M3-1 10-29)
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = (pred, g) => { const s = E.create(at(pred), () => 0.5); s.gardenId = 'bonus-test'; s.money = 1e6; s.grade.xp = E.gradeXpAt(g || 12); return s; };
const fl = (s, type, x, y) => { const f = { id: 7000 + s.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }; s.flowers.push(f); return f; };
const put = (s, key, x, y) => { const r = E.buyDeco(s, key, ctx); E.placeDeco(s, r.deco.id, x, y); return r.deco; };
const lv = (s, k, n) => { const need = E.bonusUsed(s) - E.bonusCostTo(E.bonusLevel(s, k)) + E.bonusCostTo(n); if (E.bonusPoints(s) < need) s.grade.xp = E.gradeXpAt(need * E.BONUS_PER + 1); return E.bonusSet(s, k, n); };   // 점이 모자라면 등급을 올려서 고름

console.log('[🌟 손길 점 — 등급이 오를 때마다 1점 (P28-05-02-01 · 10-30 5등급마다 → 등급마다)]');
{ const pts = g => E.bonusPoints({ grade: { xp: E.gradeXpAt(g) } });
  check([1, 2, 3, 5, 10, 100].map(pts).join() === '0,1,2,4,9,99' && E.BONUS_PER === 1, '1등급 0점 · 2등급 1점 · 3등급 2점 … 끝없음 (100등급 99점)');
  const n = E.create(mon + 0.1 * H, () => 0.5), v = E.bonusView(n);
  check(v.points === 0 && v.used === 0 && v.left === 0 && v.nextAt === 2 && E.bonusPoints(n) === 0, '새 정원은 0점 · 다음 점은 2등급');
  const r = garden(c => c.month === 6, 4); E.bonusSet(r, 'basket', 1); E.bonusSet(r, 'catchup', 1);
  check(E.bonusPoints(r) === 3 && E.bonusUsed(r) === 2 && E.bonusLeft(r) === 1 && E.bonusView(r).left === 1, '남은 점 = 총점 − 쓴 점 (4등급 3점 − 2점 = 1점)'); }

console.log('[🌟 돈 · 아이템으로는 못 얻음]');
{ const s = garden(c => c.month === 6, 1), p0 = E.bonusPoints(s);
  for (const k of ['water', 'fert', 'basket', 'hoe']) E.buySupply(s, k, 5);
  E.buyDeco(s, 'autobasket', ctx); E.addSeat(s); for (const k of E.GIFT_KEYS) E.sendGift(s, k);
  check(s.money < 1e6 && E.gradeOf(s).grade === 1 && E.bonusPoints(s) === p0 && p0 === 0, `씨앗 · 용품 · 장식 · 찻집 · 선물을 사도 점이 그대로 (${(1e6 - s.money).toLocaleString()}원 씀)`);
  const m0 = s.money; s.grade.xp = E.gradeXpAt(2); E.bonusSet(s, 'catchup', 1);
  check(s.money === m0 && s.bonus.catchup === 1, '보너스를 골라도 돈은 그대로 (값이 없음)'); }

console.log('[🌟 보너스 4칸 표 (P28-05-02-02)]');
check(E.BONUS_KEYS.join() === 'basket,rack,pantry,catchup', '4칸: 바구니 · 건조대 · 저장고 · 따라잡기 — 값 · 품질 · 꽃 수 · 생산 배율 칸은 없음 (P17-14), 💧 물 오래는 시뮬에서 수입이 늘어 뺌');
check(E.BONUS_KEYS.map(k => E.BONUS[k].vals.join('/')).join(' ') === '8/12/16/20 8/10/12/14 0/1/2/3 3/4/5', '단계 값: 바구니 8→20포기 · 건조대 8→14장 · 저장고 +3칸 · 따라잡기 3→5주');
check(E.BONUS_COST.join() === '1,2,3' && E.BONUS_KEYS.map(k => E.bonusCostTo(E.bonusMax(k))).join() === '6,6,6,3', '단계 값 1 · 2 · 3점 — 바구니 · 건조대 · 저장고 끝까지 6점, 따라잡기 3점 (모두 21점 = 22등급)');
{ const s = garden(c => c.month === 6, 50), f = fl(s, 'chamomile', 3, 3); f.waterH = 0; E.bonusSet(s, 'water', 1); E.care(s, 'water', [[3, 3]], ctx);
  check(f.waterH === 24 && !('water' in s.bonus), '물 한 번은 늘 2달 (물 오래 칸 없음)'); }

console.log('[🌟 고르기 · 거부 · 되돌리기 (P28-05-02-03)]');
{ const s = garden(c => c.month === 6, 2);
  const a = E.bonusSet(s, 'basket', 1);
  check(a.ok && s.bonus.basket === 1 && E.bonusLeft(s) === 0 && a.msg === '🧺 바구니 넓게를 1단계로 올렸어요', `2등급 1점으로 바구니 1단계 ("${a.msg}")`);
  const b = E.bonusSet(s, 'rack', 1);
  check(!b.ok && b.msg === '🌟 손길 점이 1점 모자라요' && s.bonus.rack === 0, `점이 모자라면 거부 ("${b.msg}")`);
  const c = E.bonusSet(s, 'basket', 2);
  check(!c.ok && c.msg === '🌟 손길 점이 2점 모자라요' && s.bonus.basket === 1, '다음 단계는 2점 — 모자라면 그대로');
  const d = E.bonusSet(s, 'basket', 0);
  check(d.ok && s.bonus.basket === 0 && E.bonusLeft(s) === 1 && d.msg.includes('🌟 1점이 돌아왔어요'), `내리면 점이 그대로 돌아옴 ("${d.msg}")`);
  check(E.bonusSet(s, 'rack', 1).ok && E.bonusSet(s, 'rack', 0).ok && E.bonusSet(s, 'pantry', 1).ok && E.bonusLeft(s) === 0, '언제든 다시 — 다른 칸으로 옮겨도 벌칙 없음');
  check(!E.bonusSet(s, 'pantry', 4).ok && !E.bonusSet(s, 'pantry', -1).ok && !E.bonusSet(s, 'pantry', 0.5).ok && !E.bonusSet(s, 'gold', 1).ok && !E.bonusSet(s, 'water', 1).ok && s.bonus.pantry === 1, '없는 단계 · 없는 칸은 거부');
  check(E.bonusSet(s, 'pantry', 1).ok && E.bonusLeft(s) === 0, '같은 단계를 다시 골라도 점이 그대로');
  s.grade.xp = E.gradeXpAt(5);
  check(E.bonusSet(s, 'catchup', 2).ok && E.bonusUsed(s) === 4 && E.bonusLeft(s) === 0, '0 → 2단계로 바로 (1 + 2점)');
  const fr = garden(c => c.month === 13, 5);
  check(E.calendar(fr.virtual).frozen && E.bonusSet(fr, 'pantry', 1).ok, '꽃잠에도 고름'); }

console.log('[🌟 bonusView · bonusMaxed — 화면(M3-2)이 읽는 것]');
{ const s = garden(c => c.month === 6, 10); E.bonusSet(s, 'basket', 3); E.bonusSet(s, 'catchup', 2);
  const v = E.bonusView(s), row = k => v.rows.find(r => r.key === k);
  check(v.points === 9 && v.used === 9 && v.left === 0 && v.rows.length === 4 && !('slow' in v), `points · used · left · 4줄 — 느긋하게 보기 판단은 없음 (${v.points}/${v.used}/${v.left})`);
  const b = row('basket'), r = row('rack');
  check(b.name === '바구니 넓게' && b.icon === '🧺' && b.level === 3 && b.max === 3 && b.maxed && b.costNext === null && b.desc === '개미 일꾼이 꽃 20포기까지 거둬요', '끝까지 올린 칸: costNext 없음 · 지금 값 설명');
  check(r.level === 0 && r.costNext === 1 && r.desc === '누에 일꾼이 달마다 꽃잎 8장을 널어요' && r.nextDesc === '누에 일꾼이 달마다 꽃잎 10장을 널어요', '0단계 칸: 다음 단계 값 1점 · 지금 / 다음 설명');
  check(row('catchup').desc === '오래 비워도 5주까지 따라잡아요' && row('pantry').desc === '정원 저장고 칸 그대로예요', '따라잡기 끝 · 저장고 0단계 설명');
  check(E.bonusMaxed(s, 'basket') && E.bonusMaxed(s, 'catchup') && !E.bonusMaxed(s, 'rack') && !E.bonusMaxed(s, 'gold'), 'bonusMaxed: 끝까지 올린 칸만 (P28-05-02-04 이정표, 그림은 M3-2)');
  s.grade.xp = E.gradeXpAt(2);   // 저장 파일을 손으로 고쳐 쓴 점이 총점보다 많은 경우
  check(E.bonusLeft(s) < 0 && E.bonusView(s).left === 0 && E.bonusSet(s, 'basket', 2).ok, '쓴 점이 총점보다 많아도 화면 left는 0 · 내리기는 됨'); }

console.log('[🌟 규칙이 실제로 바뀜]');
{ const ring = s => { put(s, 'autobasket', 10, 10); for (let y = 8; y <= 12; y++) for (let x = 8; x <= 12; x++) if (x !== 10 || y !== 10) fl(s, 'chamomile', x, y); };   // 둘레 2칸에 24포기
  const tick = n => { const s = garden(c => c.month === 6); ring(s); if (n) lv(s, 'basket', n); return E.basketTick(s, E.calendar(s.virtual), ctx); };
  check([0, 1, 2, 3].map(tick).join() === '8,12,16,20', '🧺 바구니: 바로 옆 8포기 → 둘레 2칸에서 12 · 16 · 20포기');
  const s = garden(c => c.month === 6); ring(s); lv(s, 'basket', 1); const d = s.decos[0], pick = E.basketFlowers(s, d);
  check(pick.filter(f => Math.max(Math.abs(f.x - 10), Math.abs(f.y - 10)) === 1).length === 8, '가까운 꽃부터 (바로 옆 8포기는 늘 들어감)');
  E.basketTick(s, E.calendar(s.virtual), ctx);
  check(s.petals.every(p => Math.abs(p.q - 0.7 * E.AUTO_Q) < 1e-9) && s.petals.length === 12, '거둔 꽃잎 품질 · 한 포기 한 장은 그대로 (꽃 수 · 품질 보너스 아님)');
  const w = garden(c => c.month === 6); w.flowers.length = 0; const dead = fl(w, 'chamomile', 9, 9); dead.withered = true; ring(w); w.flowers.splice(1, 1);
  check(E.basketFlowers(w, w.decos[0]).every(f => !f.withered), '시든 꽃은 바구니 자리를 차지하지 않음'); }
{ const tick = n => { const s = garden(c => c.month === 6); put(s, 'dryrack', 0, 0); for (let i = 0; i < 20; i++) s.petals.push({ id: s.nextId++, type: 'rose', q: 0.7, seasonKey: 11 }); if (n) lv(s, 'rack', n); return E.rackTick(s, ctx); };
  check([0, 1, 2, 3].map(tick).join() === '8,10,12,14' && E.rackN({}) === E.RACK_N, '🍂 건조대: 한 달 8 → 10 · 12 · 14장'); }
{ const s = garden(c => c.month === 6, 4), c0 = E.pantryCap(s);
  lv(s, 'pantry', 1); const c1 = E.pantryCap(s); s.bonus.pantry = 3; const c3 = E.pantryCap(s); s.grade.xp = E.gradeXpAt(25);
  check(c0 === 4 && c1 === 5 && c3 === 7 && E.pantryCap(s) === 22, `🧺 저장고: 등급 상한에 +1 · +3칸 (${c0} → ${c1} → ${c3}, 25등급이면 19 + 3 = ${E.pantryCap(s)})`);
  check(E.pantryDayValue() === 480, '하루 12칸 · 480원은 그대로 (밤에 덜 넘칠 뿐)'); }
{ const s = garden(c => c.month === 6, 4);
  const h = [0, 1, 2].map(n => (lv(s, 'catchup', n), E.catchUpH(s)));
  check(h.join() === '504,672,840' && E.catchUpH({}) === 21 * 24, '🌙 따라잡기: 3주 → 4 · 5주 (catchUpH, 시간) — 앱 catchUp에 붙이는 것은 M3-2'); }
{ const s = garden(c => c.month === 6, 2); s.settings.slow = true;
  check(E.bonusSet(s, 'catchup', 1).ok && E.catchUpH(s) === 672 && E.bonusView(s).points === 1, '느긋하게 보기여도 똑같이 고르고 쓰임 (숨김은 화면 몫)'); }
{ const s = { bonus: { basket: 9, rack: -2, pantry: '1', catchup: null } };
  check(E.bonusVal(s, 'basket') === 20 && E.bonusVal(s, 'rack') === 8 && E.bonusVal(s, 'pantry') === 1 && E.bonusVal(s, 'catchup') === 3 && E.bonusVal({}, 'pantry') === 0, '이상한 저장 값은 0 ~ 끝 단계 안으로'); }

console.log('[✅ 여정 05 강도윤 05-4 · 05-5 · 07 정진우 07-5 (엔진)]');
{ // 05-4 "모은 것으로 정원 등급을 올리자 영구 보너스가 붙는다"
  const s = garden(c => c.month === 6); put(s, 'autobasket', 10, 10); put(s, 'dryrack', 0, 0); s.grade.xp = E.gradeXpAt(1); for (let y = 8; y <= 12; y++) for (let x = 8; x <= 12; x++) if (x !== 10 || y !== 10) fl(s, 'chamomile', x, y);
  check(E.bonusPoints(s) === 0 && !E.bonusSet(s, 'basket', 1).ok, '05-4: 1등급엔 손길 점이 없어 고를 수 없음');
  E.addXp(s, 'sell', (E.gradeXpAt(2) - s.grade.xp) / E.XP.sell, ctx);   // 찻잔을 팔아 2등급
  check(E.gradeOf(s).grade === 2 && E.bonusPoints(s) === 1 && E.bonusSet(s, 'basket', 1).ok, '05-4: 판 것으로 2등급이 되면 🌟 1점 → 바구니 넓게 1단계');
  check(E.basketTick(s, E.calendar(s.virtual), ctx) === 12, '05-4: 그달 끝 자동 수확 바구니가 8포기가 아니라 12포기를 거둠');
  // 05-5 "꽃잠에 한 해 평가를 받고 다음 해로 이어지는 보너스를 고른다"
  E.advance(s, at(c => c.month === 13 && c.week > E.calendar(s.virtual).week) + 2 * H, ctx);
  const rec = s.records.length;
  check(E.calendar(s.virtual).frozen && rec > 0, '05-5: 꽃잠 — 한 해 기록이 남음');
  check(E.bonusSet(s, 'basket', 0).ok && E.bonusSet(s, 'rack', 1).ok && s.bonus.rack === 1, '05-5: 꽃잠에 바구니를 내려 점을 돌려받고 건조대 넉넉히를 고름');
  E.advance(s, at(c => c.month === 3 && c.week > E.calendar(s.virtual).week) + 2 * H, ctx);
  s.petals.length = 0; for (let i = 0; i < 12; i++) s.petals.push({ id: s.nextId++, type: 'rose', q: 0.7, seasonKey: 11 });
  check(E.calendar(s.virtual).month === 3 && s.bonus.rack === 1 && E.rackTick(s, ctx) === 10, '05-5: 다음 해 3월에도 이어짐 — 자동 건조대가 한 달 10장');
  // 07-5 (저장에 이어지는 부분): 파일로 저장해 다시 열어도 고른 보너스 · 점이 그대로 (새 철 자체는 M3-3)
  const back = E.migrateSave(E.parseSave(JSON.stringify(E.makeSave(s, 1))).data.game);
  check(JSON.stringify(back.bonus) === JSON.stringify(s.bonus) && E.bonusLeft(back) === E.bonusLeft(s) && E.rackN(back) === 10, '07-5: 저장 · 다시 열어도 고른 보너스 · 남은 점 · 규칙이 그대로'); }

console.log('[시뮬레이션 목표 (sim-economy 7 7)]');
const out = require('child_process').execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '7', '7'], { encoding: 'utf8' });
const rows = out.split('주마다 정원 등급')[1].split('\n\n')[0].split('\n끝:')[0].trim().split('\n').slice(1).filter(l => /^\d+\t/.test(l)).map(l => l.split('\t'));
const gr = rows.map(x => +x[1]);
check(gr.length === 7, `7주 줄 (${gr.join(',')})`);
check(gr[0] >= 5 && gr[0] <= 9, `열심히 하는 정원: 첫 주 5~9등급 (${gr[0]}) — 🗓️ 주간 목표(P28-09)를 셋 다 끝내면 첫 주 +1등급이라 9까지`);
check(gr[3] >= 15 && gr[3] <= 20, `4주에 15~20등급 (${gr[3]})`);
check(gr.slice(4).every((g, i) => g - gr[3 + i] >= 1 && g - gr[3 + i] <= 3), `그 뒤로 주마다 1~3등급 (${gr.slice(3).map((g, i) => i ? '+' + (g - gr[2 + i]) : g).join(' ')})`);

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
