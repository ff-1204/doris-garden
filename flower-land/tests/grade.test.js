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
E.brew(st, st.teas.map(t => t.id), []);
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
check(E.GRADE_DECO_KEYS.every(k => !E.DECO_KEYS.includes(k) && !E.decoOffer({ month: 3 }).includes(k) && !E.DECOS[k].func), '이달의 장식 · 기능 장식이 아님 (화원 줄 · 꾸밈 도감은 M1-4)');
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
check(gd.dex.deco.sproutsign && E.decoCount(gd) === 0 && E.decoTotal() === E.DECO_KEYS.length + E.TITLE_KEYS.length, '꾸밈 도감에 남지만 칸 수 · 모은 수에는 아직 넣지 않음');
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

console.log('[시뮬레이션 목표 (sim-economy 7 7)]');
const out = require('child_process').execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '7', '7'], { encoding: 'utf8' });
const rows = out.split('주마다 정원 등급')[1].split('\n끝:')[0].trim().split('\n').slice(1).filter(l => /^\d+\t/.test(l)).map(l => l.split('\t'));
const gr = rows.map(x => +x[1]);
check(gr.length === 7, `7주 줄 (${gr.join(',')})`);
check(gr[0] >= 5 && gr[0] <= 8, `열심히 하는 정원: 첫 주 5~8등급 (${gr[0]})`);
check(gr[3] >= 15 && gr[3] <= 20, `4주에 15~20등급 (${gr[3]})`);
check(gr.slice(4).every((g, i) => g - gr[3 + i] >= 1 && g - gr[3 + i] <= 3), `그 뒤로 주마다 1~3등급 (${gr.slice(3).map((g, i) => i ? '+' + (g - gr[2 + i]) : g).join(' ')})`);

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
