// 🌱 정원 등급 (P28-05-01, 10-27): 정원에서 한 일로 경험치 → 등급 (처음엔 빨리 · 뒤로 갈수록 천천히 · 끝없음), 사기만 해서는 안 오름, 등급 장식
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const xp = st => st.grade.xp, by = (st, k) => st.grade.by[k] || 0;
let uctx = ctx;   // P72-01: 꽃이 6시간마다 다시 피어 오르는 때가 당겨짐 — 기다리는 동안 오른 등급도 onGrade로 세게 (아래에서 gctx)
const until = (st, test, maxH) => { for (let i = 0; i < (maxH || 2000); i++) { if (test()) return true; E.advance(st, st.virtual + H, uctx); } return false; };

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
const ups = []; const gctx = { live: false, rng: () => 0.5, onGrade: e => ups.push(e) }; uctx = gctx;
st.onboarded = true; E.advance(st, st.virtual + H, gctx);
check(by(st, 'quest') === 10 && st.journal.done.c0_visit != null, '퀘스트 하나 끝내면 10 (첫 방문)');
E.giftPot(st, ctx);
const pot = st.flowers[0];
const d0 = by(st, 'dex');
check(until(st, () => E.care(st, 'harvest', [[pot.x, pot.y]], gctx).ok), '화분 꽃이 피어 거둠');
check(by(st, 'harvest') === 2 * (E.harvestCount(E.FLOWERS[pot.type], gctx.rng) + 1), `P77-C 꽃잎 수: 꽃잎 한 장에 2 (화분 첫 수확은 ${E.FLOWERS[pot.type].name} 1 ~ ${E.FLOWERS[pot.type].petals}장 + 덤 1장 → ${by(st, 'harvest')})`);
E.advance(st, st.virtual + H, gctx);
check(by(st, 'dex') - d0 >= 5 && (by(st, 'dex') - d0) % 5 === 0, `도감 새 칸 하나에 5 (꽃 · 꽃잎 등록 → +${by(st, 'dex') - d0})`);
check(until(st, () => E.teaShopOpen(E.calendar(st.virtual)), 24 * 7), '찻집이 열림 (P34 매달 — 예전 12월)');
const s0 = by(st, 'sell');
for (let i = 0; i < 3; i++) st.teas.push({ id: 90000 + i, type: 'chamomile', q: 1, seasonKey: -1, hat: false });
E.brew(st, [90000, 90001, 90002], []); st.cups.forEach(c => delete c.steepUntil);   // P56 3분 우림 끝   // 꾸러미 티백(P22-05)은 빼고
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
uctx = ctx; const ry = E.create(mon + 0.1 * H, () => 0.5); ry.gardenId = 'grade-ry'; E.giftPot(ry, ctx); E.advance(ry, ry.virtual + H, ctx);   // 화분 한 포기 → 한 해 평가 점수가 0이 아님
until(ry, () => E.calendar(ry.virtual + H).idx === 12, 24 * 7);                                 // 쉼달 바로 앞까지
E.addXp(ry, 'weekly', E.gradeAt(ry.grade.xp).base + E.gradeAt(ry.grade.xp).cost - ry.grade.xp - 1);   // 다음 등급까지 1점
const ryg = E.gradeOf(ry).grade + 1;
E.advance(ry, ry.virtual + H, ctx);
check(ry.records.length === 1 && ry.grade.by.year > 0 && E.gradeOf(ry).grade >= ryg
  && ry.log.some(l => l.text === `🌱 정원 등급이 올랐어요 · ${E.gradeName(E.gradeOf(ry).grade)}`), '쉼달 기록(한 해 평가)으로 오른 줄은 새해 일지에 남음 (기록하며 비우는 일지에 묻히지 않음)');
const one = E.create(mon + 0.1 * H, () => 0.5), ev = [], lg0 = one.log.length;
E.addXp(one, 'weekly', E.gradeCost(1) + E.gradeCost(2) + 1, { onGrade: e => ev.push(e) });
check(ev.length === 1 && ev[0].from === 1 && ev[0].grade === 3, '한 번에 두 등급이 올라도 이벤트 · 일지 한 번');
check(one.log.length === lg0 + 3 && one.log[lg0].text === '🌱 정원 등급이 올랐어요 · 씨앗 정원 3' && one.log[lg0 + 1].text === '🌱 이제 씨앗이 54%로 와요' && one.log[lg0 + 2].text === '💰 이제 살 수 있어요 · 🌱 자라는 속도 ×1.5 · 🌾 말리는 속도 ×1.5', '일지 문구 (등급 한 줄 + P41 씨앗 품질 한 줄 + P42 등급 3에 ×1.5)');
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
const fl = (s, type, x, y) => { const f = { id: 7000 + s.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', ripeH: 6, bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }; s.flowers.push(f); return f; };
const put = (s, key, x, y) => { const r = E.buyDeco(s, key, ctx); E.placeDeco(s, r.deco.id, x, y); return r.deco; };
const lv = (s, k, n) => { s.bonusOwn = Object.assign({}, s.bonusOwn, { [k]: E.bonusMax(k) }); return E.bonusSet(s, k, n); };   // 끝까지 산 정원에서 n단계로 (P41)

console.log('[💰 기르기는 돈 + 등급으로 (P41-01 — 🌼 꽃가루는 없음)]');
{ const n = E.create(mon + 0.1 * H, () => 0.5), v = E.bonusView(n);
  check(!('points' in v) && !('left' in v) && v.rows.every(r => r.level === 0 && r.own === 0), '새 정원: 꽃가루 숫자 없음 · 모두 0단계');
  check(!E.bonusPoints && !E.bonusLeft && !E.bonusUsed, '꽃가루 셈 함수는 없음 (예전 옮기기는 pollenGot)'); }

console.log('[🌼 기르기 9칸 표 (P28-05-02-02 · P37 · P39 · P40 · P41) — 곤충 둘레 규칙은 insects.test.js]');
check(E.BONUS_KEYS.join() === 'barrel,basket,weed,worm,rack,hive,brew,grow,dry', 'P41 9칸: 곤충 7 · 자라는 속도 · 말리는 속도 — 🌼 꽃가루 늘리기 · 🧺 선반 넓히기 · 🌙 늦잠 · 💧 물 오래는 없음');
check(['barrel', 'basket', 'weed', 'worm', 'rack', 'brew', 'hive'].every(k => E.BONUS[k].price.join() === '10000,25000' && E.BONUS[k].up.join() === '2,5') && ['grow', 'dry'].every(k => E.BONUS[k].vals.join('/') === '1/1.5/2/2.5/3/3.5/4/4.5/5' && E.BONUS[k].price.join() === '10000,15000,20000,25000,30000,35000,40000,45000' && E.BONUS[k].need.join() === '3,5,7,9,11,13,15,17'),
  '값: 곤충 둘레 10,000 · 25,000원(데려오는 등급 + 2 · + 5) · 두 속도 ×1.5 → ×5 8단계 · 등급 3부터 2씩 · 10,000원부터 5,000원씩 (P41 · P42)');
check(E.bonusNeed('barrel', 1) === 4 && E.bonusNeed('barrel', 2) === 7 && E.bonusNeed('brew', 1) === 10 && E.bonusNeed('brew', 2) === 13 && E.bonusNeed('grow', 1) === 3 && E.bonusNeed('dry', 8) === 17, '등급 조건: 🐌 달팽이(등급 2) → 4 · 7 · 🦋 나비(등급 8) → 10 · 13 (기획안 예)');
{ const s = garden(c => c.month === 6, 50), f = fl(s, 'chamomile', 3, 3); f.waterH = 0; E.bonusSet(s, 'water', 1); E.care(s, 'water', [[3, 3]], ctx);
  check(f.waterH === 24 && !('water' in s.bonus), '물 한 번은 늘 2달 (물 오래 칸 없음)'); }

console.log('[💰 사기 · 거부 · 낮춰 쓰기 (P41-01-02 · 03)]');
{ const s = garden(c => c.month === 6, 2); s.money = 15000;
  const a = E.bonusSet(s, 'grow', 1);
  check(!a.ok && a.msg === '정원 등급 3부터 살 수 있어요' && s.money === 15000 && s.bonus.grow === 0, `등급이 모자라면 거부 ("${a.msg}")`);
  s.grade.xp = E.gradeXpAt(3);
  const b = E.bonusSet(s, 'grow', 2);
  check(!b.ok && b.msg === '한 단계씩 살 수 있어요', '한 단계씩');
  const c = E.bonusSet(s, 'grow', 1);
  check(c.ok && c.paid === 10000 && s.money === 5000 && s.bonus.grow === 1 && E.bonusOwned(s, 'grow') === 1 && c.msg === '🌱 자라는 속도가 ×1.5로 빨라졌어요', `등급 3 · 10,000원으로 ×1.5 ("${c.msg}")`);
  const xp0 = s.grade.xp;
  check(xp0 === E.gradeXpAt(3) && !s.grade.by.buy, '돈으로 산 것엔 등급 경험치 없음 (P17-14)');
  const d = E.bonusSet(s, 'dry', 1);
  check(!d.ok && d.msg === '돈이 모자라요' && s.money === 5000, '돈이 모자라면 거부');
  const e = E.bonusSet(s, 'grow', 0);
  check(e.ok && s.bonus.grow === 0 && E.bonusOwned(s, 'grow') === 1 && s.money === 5000 && e.msg === '🌱 자라는 속도를 ×1로 낮췄어요', `낮춰 쓰기 — 돈은 안 돌려줌 ("${e.msg}")`);
  const f = E.bonusSet(s, 'grow', 1);
  check(f.ok && s.bonus.grow === 1 && s.money === 5000 && f.msg === '🌱 자라는 속도를 다시 ×1.5로 올렸어요', '산 단계까지 다시 올리면 공짜');
  check(!E.bonusSet(s, 'dry', 9).ok && !E.bonusSet(s, 'dry', -1).ok && !E.bonusSet(s, 'dry', 0.5).ok && !E.bonusSet(s, 'gold', 1).ok && !E.bonusSet(s, 'pollen', 1).ok && !E.bonusSet(s, 'pantry', 1).ok, '없는 단계 · 없는 칸(꽃가루 늘리기 · 선반 포함)은 거부');
  const g = E.bonusSet(s, 'worm', 1);
  check(!g.ok && g.msg === '🪱 지렁이를 먼저 데려와요', '곤충은 데려와야 넓힘');
  s.grade.xp = E.gradeXpAt(5); s.money = 15000;
  const h = E.bonusSet(s, 'grow', 2);
  check(h.ok && s.money === 0 && h.msg === '🌱 자라는 속도가 ×2로 빨라졌어요', `×2 15,000원 · 등급 5 ("${h.msg}")`);
  const fr = garden(c => c.month === 13, 6); put(fr, 'earthworm', 1, 1); const m0 = fr.money;
  check(E.calendar(fr.virtual).frozen && E.bonusSet(fr, 'worm', 1).ok && fr.money === m0 - 10000, '꽃잠에도 삼 (지렁이 등급 4 + 2 = 6 · 10,000원)'); }

console.log('[🌟 bonusView · bonusMaxed — 화면이 읽는 것]');
{ const s = garden(c => c.month === 6, 2); put(s, 'autobasket', 1, 1); lv(s, 'basket', 2); s.money = 5000;
  const v = E.bonusView(s), row = k => v.rows.find(r => r.key === k);
  check(v.rows.length === 9 && v.grade === 2 && !('slow' in v), '9줄 · 등급 — 느긋하게 보기 판단은 없음');
  const b = row('basket'), w = row('worm'), g = row('grow');
  check(b.name === '둘레 넓히기' && b.icon === '🐜' && b.worker === 'autobasket' && b.level === 2 && b.max === 2 && b.maxed && b.buyLv === null && b.price === null && b.desc === E.INSECT_LINE.autobasket(6), '끝까지 산 칸: 살 것 없음 · 지금 값 설명');
  check(w.worker === 'earthworm' && w.level === 0 && w.buyLv === 1 && w.price === 10000 && w.need === 6 && !w.has && !w.canBuy && w.buyDesc === E.INSECT_LINE.earthworm(4) && w.buyName === '🪱 지렁이 둘레 4칸', '데려오지 않은 곤충: 값 · 조건은 보이고 못 삼');
  check(g.buyLv === 1 && g.price === 10000 && g.need === 3 && !g.gradeOk && !g.moneyOk && !g.canBuy && g.buyVal === '×1.5' && g.val === '×1' && row('dry').desc === '꽃잎이 12시간 만에 말라요' && row('hive').desc === `${E.INSECT_LINE.hive(2)} · 창고 꿀 3병까지` && b.val === null, '자라는 속도: 다음 ×1.5 · 10,000원 · 등급 3 (모자람 표시) · 값 줄(val)은 정원 손길 칸만');
  check(E.bonusMaxed(s, 'basket') && !E.bonusMaxed(s, 'rack') && !E.bonusMaxed(s, 'gold'), 'bonusMaxed: 끝까지 올린 칸만'); }

console.log('[🌟 규칙이 실제로 바뀜]');
{ const ring = s => { put(s, 'autobasket', 10, 10); for (let y = 4; y <= 16; y++) for (let x = 4; x <= 16; x++) if (x !== 10 || y !== 10) fl(s, 'chamomile', x, y); };   // 둘레 6칸에 168포기 (P61-01)
  const tick = n => { const s = garden(c => c.month === 6); ring(s); if (n) lv(s, 'basket', n); return E.basketTick(s, E.calendar(s.virtual), ctx); };
  check([0, 1, 2].map(tick).join() === [24, 80, 168].map(n => n * E.antCount(ctx.rng)).join(), 'P77-C 꽃잎 수: 🐜 개미: 둘레 2 · 4 · 6칸의 핀 꽃 모두 (24 · 80 · 168포기 × 3장 — 포기 수 제한 없음, P39-02)');
  const s = garden(c => c.month === 6); ring(s); E.basketTick(s, E.calendar(s.virtual), ctx);
  check(s.petals.every(p => Math.abs(p.q - 0.7 * E.AUTO_Q) < 1e-9) && s.petals.length === 24 * 3, 'P77-C 꽃잎 수: 거둔 꽃잎 품질 · 한 포기 1 ~ 5장(rng 0.5 → 3장)은 둘레 보너스와 상관없음 (꽃 수 · 품질 보너스 아님)');
  const w = garden(c => c.month === 6); const dead = fl(w, 'chamomile', 9, 9); dead.withered = true; ring(w);
  check(E.basketFlowers(w, w.decos[0]).every(f => !f.withered), '시든 꽃은 맡지 않음'); }
{ const tick = () => { const s = garden(c => c.month === 6); put(s, 'dryshelf', 0, 0); for (let i = 0; i < 20; i++) s.petals.push({ id: s.nextId++, type: 'rose', q: 0.7, seasonKey: 11 }); return E.rackTick(s, ctx); };
  check(tick() === 4 && E.rackN() === E.SHELF_N && !('dryshelf' in E.BONUS), '🧺 건조 선반: 달마다 4장 · 기르기 없음 (P39-09-01)'); }
{ const s = garden(c => c.month === 6, 4), c0 = E.pantryCap(s); s.bonus.pantry = 3; const c3 = E.pantryCap(s); s.grade.xp = E.gradeXpAt(25);
  check(c0 === 4 && c3 === 4 && E.pantryCap(s) === 19, `🧺 저장고: 등급 상한만 — 선반 넓히기는 없앰 (P40-04, 예전 저장 값이 남아도 ${c3}칸 · 25등급 ${E.pantryCap(s)}칸)`);
  check(E.pantryDayValue() === 480, '하루 12칸 · 480원은 그대로'); }
{ const s = garden(c => c.month === 6, 4); s.bonus.catchup = 2;
  check(E.catchUpH(s) === 504 && E.catchUpH({}) === 21 * 24 && E.CATCHUP_WEEKS === 3, '🌙 따라잡기: 늘 3주 (늦잠 칸은 없앰 — 예전 저장 값이 남아도, P40-04)'); }
{ const s = garden(c => c.month === 6, 10); s.settings.slow = true;
  check(E.bonusSet(s, 'grow', 1).ok && E.bonusVal(s, 'grow') === 1.5 && E.bonusView(s).rows.find(r => r.key === 'grow').level === 1, '느긋하게 보기여도 똑같이 사고 쓰임 (숨김은 화면 몫)'); }
{ const s = { bonus: { basket: 7.6, worm: -2, dry: '1', grow: null } };
  check(E.bonusVal(s, 'basket') === 6 && E.bonusVal(s, 'worm') === 2 && E.bonusVal(s, 'dry') === 1.5 && E.bonusVal({ bonus: { grow: 30 } }, 'grow') === 5 && E.bonusVal(s, 'grow') === 1 && E.bonusVal({}, 'dry') === 1, '이상한 저장 값은 0 ~ 끝 단계 안으로'); }

console.log('[✅ 여정 05 강도윤 05-4 · 05-5 · 07 정진우 07-5 (엔진) — 🔄 P41 돈으로]');
{ // 05-4 "모은 것으로 정원 등급을 올리자 영구 보너스가 붙는다" → P41: 등급이 닿으면 돈으로 삼
  const s = garden(c => c.month === 6); put(s, 'autobasket', 10, 10); put(s, 'earthworm', 0, 0); s.grade.xp = E.gradeXpAt(1); for (let y = 8; y <= 12; y++) for (let x = 8; x <= 12; x++) if (x !== 10 || y !== 10) fl(s, 'chamomile', x, y);
  check(!E.bonusSet(s, 'basket', 1).ok, '05-4: 1등급엔 개미 둘레를 못 삼 (개미 등급 2 + 2 = 4부터)');
  E.addXp(s, 'sell', (E.gradeXpAt(4) - s.grade.xp) / E.XP.sell, ctx);   // 찻잔을 팔아 4등급
  check(E.gradeOf(s).grade === 4 && E.bonusSet(s, 'basket', 1).ok, '05-4: 판 것으로 4등급이 되면 💰 10,000원 → 개미 둘레 4칸');
  check(E.basketTick(s, E.calendar(s.virtual), ctx) === 24 * 3, 'P77-C 꽃잎 수: 05-4: 그달 끝 개미 일꾼이 둘레 4칸 24포기에서 3장씩 거둠 (P39)');
  // 05-5 "꽃잠에 한 해 평가를 받고 다음 해로 이어지는 보너스를 고른다"
  E.advance(s, at(c => c.month === 13 && c.week > E.calendar(s.virtual).week) + 2 * H, ctx);
  const rec = s.records.length;
  check(E.calendar(s.virtual).frozen && rec > 0, '05-5: 꽃잠 — 한 해 기록이 남음');
  s.grade.xp = Math.max(s.grade.xp, E.gradeXpAt(6));
  check(E.bonusSet(s, 'basket', 0).ok && E.bonusSet(s, 'worm', 1).ok && s.bonus.worm === 1 && E.bonusOwned(s, 'basket') === 1, '05-5: 꽃잠에 개미 둘레를 낮추고(산 단계는 남음) 지렁이 둘레를 삼');
  E.advance(s, at(c => c.month === 3 && c.week > E.calendar(s.virtual).week) + 2 * H, ctx);
  check(E.calendar(s.virtual).month === 3 && s.bonus.worm === 1 && E.insectR(s, 'earthworm') === 4, '05-5: 다음 해 3월에도 이어짐 — 지렁이 둘레 4칸');
  // 07-5 (저장에 이어지는 부분): 파일로 저장해 다시 열어도 산 단계 · 쓰는 단계가 그대로
  const back = E.migrateSave(E.parseSave(JSON.stringify(E.makeSave(s, 1))).data.game);
  check(JSON.stringify(back.bonus) === JSON.stringify(s.bonus) && JSON.stringify(back.bonusOwn) === JSON.stringify(s.bonusOwn) && E.insectR(back, 'earthworm') === 4, '07-5: 저장 · 다시 열어도 산 단계 · 쓰는 단계 · 규칙이 그대로'); }

console.log('[시뮬레이션 목표 (sim-economy 7 7)]');
const out = require('child_process').execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '7', '7'], { encoding: 'utf8' });
const rows = out.split('주마다 정원 등급')[1].split('\n\n')[0].split('\n끝:')[0].trim().split('\n').slice(1).filter(l => /^\d+\t/.test(l)).map(l => l.split('\t'));
const gr = rows.map(x => +x[1]);
check(gr.length === 7, `7주 줄 (${gr.join(',')})`);
// P34 (10-30) 찻집이 매달 열려 판 잔 · 주문 · 도감이 늘어 등급이 빨라짐 — 값 · 속도 조정은 사용자 결정이라 범위만 새 결과에 맞춤 (예전: 첫 주 5~9 · 4주 15~20 · 주마다 1~3, 시뮬 9 · 19 · +3)
// P72-01 (11-04): 꽃이 6시간마다 다시 피어 거두기 · 팔기 경험치가 몇 배 — 첫 주 18 · 4주 65 · 주마다 +11 ~ 13 (예전 P54 11 · 34 · +7)
// P77-C (11-04): 손 수확이 한 번에 1 ~ petals장 · 개미 1 ~ 5장 — 시뮬 첫 주 23 · 4주 100 · 주마다 +16 ~ 19
check(gr[0] >= 20 && gr[0] <= 26, `P77-C 꽃잎 수: 열심히 하는 정원: 첫 주 20~26등급 (${gr[0]}) (P72-01 15~21) — 🗓️ 주간 목표(P28-09)를 셋 다 끝내면 첫 주 +1등급`);
check(gr[3] >= 90 && gr[3] <= 110, `P77-C 꽃잎 수: 4주에 90~110등급 (${gr[3]}) (P72-01 58~72 · P54 30~38 · 예전 24~30)`);
check(gr.slice(4).every((g, i) => g - gr[3 + i] >= 12 && g - gr[3 + i] <= 22), `P77-C 꽃잎 수: 그 뒤로 주마다 12~22등급 (P72-01 8~16 · P54 3~8 · 예전 2~5) (${gr.slice(3).map((g, i) => i ? '+' + (g - gr[2 + i]) : g).join(' ')})`);

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
