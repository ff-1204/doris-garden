// P23 오래 하는 정원사: 손님 주문 · 기념품 · 한 해 정원 평가 · 어려운 숨은 칭호
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };

console.log('[주문 쪽지]');
const st = E.create(at(c => c.month === 11 && !c.frozen), () => 0.5); st.gardenId = 'test-garden';
st.dex.teabag = { lavender: true };
check(!st.orders, '만든 그 자리(시간이 흐르기 전)엔 쪽지 없음');
E.advance(st, E.calendar(st.virtual).slotEnd + 0.1 * H, { live: false });
const os = st.orders && st.orders.list;
check(E.calendar(st.virtual).month === 12 && os && os.length === 2 && os[0].kind === 'tea' && os[0].type === 'lavender' && os[1].kind === 'any', '다음 달(12월)이 되면 쪽지 · 처음엔 들어줄 수 있는 것만 (만든 적 있는 꽃의 차 · 차 아무거나)');
const abs0 = st.orders.abs, again = JSON.stringify(os);
const st2 = E.create(at(c => c.month === 11 && !c.frozen), () => 0.5); st2.gardenId = 'test-garden'; st2.dex.teabag = { lavender: true };
E.advance(st2, E.calendar(st2.virtual).slotEnd + 0.1 * H, { live: false });
check(JSON.stringify(st2.orders.list) === again, '같은 정원 · 같은 달이면 같은 쪽지 (Math.random 안 씀)');

console.log('[등급 장식마다 쪽지 +1 (P33-04)]');
{
  const mk = () => { const s = E.create(at(c => c.month === 11 && !c.frozen), () => 0.5); s.gardenId = 'test-garden'; s.dex.teabag = { lavender: true, rose: true, jasmine: true, lotus: true }; s.dex.blend = { a: true }; s.dex.honey = { a: true }; return s; };
  const go = s => { E.advance(s, E.calendar(s.virtual).slotEnd + 0.1 * H, { live: false }); return s.orders.list.length; };
  const s0 = mk(); check(E.orderMax(s0) === 3 && go(s0) === 3, '등급 장식이 없으면 3장');
  const s1 = mk(); s1.decos.push({ id: 1, key: 'sproutsign', x: 1, y: 1 }, { id: 2, key: 'arch', x: 3, y: 3 });
  check(E.orderMax(s1) === 5 && go(s1) === 5, '등급 장식 2가지를 놓으면 5장');
  const s2 = mk(); s2.decos.push({ id: 1, key: 'sproutsign', x: 1, y: 1 }, { id: 2, key: 'sproutsign', x: 3, y: 3 }, { id: 3, key: 'arch', x: null, y: null }, { id: 4, key: 'bench', x: 5, y: 5 });
  check(E.orderMax(s2) === 4 && go(s2) === 4, '같은 장식 둘은 한 번 · 창고 것 · 이달의 장식은 안 셈');
  const s3 = mk(); for (const [i, k] of E.GRADE_DECO_KEYS.entries()) s3.decos.push({ id: 10 + i, key: k, x: i, y: 0 });
  check(E.orderMax(s3) === 9, '여섯 가지 다 놓으면 9장');
}

console.log('[맞는 찻잔을 팔면]');
const o = os[0], cal = E.calendar(st.virtual);
st.cups = [{ id: 501, kind: 'tea', type: 'lavender', q: (o.stars - 1) * 0.2 - 0.05, brewAbs: cal.abs }];
E.sellCups(st, [501]);
check(!o.done, '★이 모자라면 안 맞음');
st.cups = [{ id: 502, kind: 'tea', type: 'lavender', q: 0.99, brewAbs: cal.abs, hat: true }];
const money = st.money; E.sellCups(st, [502]);
const memo = Object.keys(st.dex.memento || {});
check(o.done && memo.length === 0 && st.stats.orders >= 1, `P34 12월(꽃잠 아님): 맞으면 ✓ · 기념품은 없음 (${memo.length} · ${st.stats.orders})`);
check(st.log.some(l => l.type === 15 && l.text === `${E.orderText(o)} 주문을 들어줬어요`) && !st.log.some(l => l.text.includes('두고 갔어요')), 'P34 일지엔 "주문을 들어줬어요"');
{ const x0 = st.grade.xp; const s4 = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); s4.gardenId = 'test-garden'; s4.orders = { abs: E.calendar(s4.virtual).abs, list: [{ kind: 'any', done: false }] };
  const g0 = s4.grade.xp, cal4 = E.calendar(s4.virtual); s4.cups = [{ id: 601, kind: 'tea', type: 'rose', q: 0.5, brewAbs: cal4.abs }]; E.sellCups(s4, [601]);
  check(s4.orders.list[0].done && !Object.keys(s4.dex.memento || {}).length && s4.grade.xp > g0 && E.teaPriceMul(cal4) === 1, 'P34 6월(평달): ✓ · 등급 경험치 · 기념품 없음 · 값 배율 ×1');
  const s5 = E.create(at(c => c.month === 13), () => 0.5); s5.gardenId = 'test-garden'; const cal5 = E.calendar(s5.virtual); s5.orders = { abs: cal5.abs, list: [{ kind: 'any', done: false }] };
  s5.cups = [{ id: 602, kind: 'tea', type: 'rose', q: 0.5, brewAbs: cal5.abs }]; const m5 = s5.money; E.sellCups(s5, [602]);
  const memo5 = Object.keys(s5.dex.memento || {});
  check(cal5.frozen && s5.orders.list[0].done && memo5.length === 1 && E.ORDER_MEMENTO_KEYS.includes(memo5[0]) && s5.log.some(l => l.type === 15 && l.text.includes('두고 갔어요')), 'P34 🌙 꽃잠(쉼달): 주문을 들어주면 기념품 · 일지');
  check(s5.money - m5 === Math.round(E.teaItemValue(s5, { type: 'rose', q: 0.5 }, cal5) * 1.3 / 10) * 10 && E.teaPriceKind(cal5) === 'sleep', 'P34 🌙 꽃잠 값 ×1.3');
  const s6 = E.create(at(c => c.month === 1 && !c.frozen), () => 0.5); const cal6 = E.calendar(s6.virtual);
  check(E.teaPriceKind(cal6) === 'winter' && E.teaPriceMul(cal6) === 1.2 && E.cupValue(s6, { kind: 'tea', type: 'rose', q: 0.5, brewAbs: cal6.abs - 1 }, cal6) === Math.round(E.teaItemValue(s6, { type: 'rose', q: 0.5 }, cal6) * 0.5 * 1.2 / 10) * 10, 'P34 ❄️ 겨울(1월) 값 ×1.2 · 식은 잔은 반값에 배율');
  check(E.teaPriceText(s6, cal6) === '❄️ 겨울 값 · ×1.2' && E.teaPriceText(s5, cal5) === '🌙 꽃잠 값 · ×1.3' && E.teaPriceText(s4, cal4) === '', 'P34 찻잔 카드 · 알림 한 마디 (평달은 없음)');
  s6.settings.slow = true; check(E.teaPriceText(s6, cal6) === '❄️ 겨울 값 · 조금 비싸요', 'P34 🐢 느긋하게 보기면 숫자 없이 "조금 비싸요"'); s6.settings.slow = false;
  s6.cups = [{ id: 603, kind: 'tea', type: 'rose', q: 0.5, brewAbs: cal6.abs }]; const r6 = E.sellCups(s6, [603]);
  check(r6.ok && r6.msg.endsWith('· ❄️ 겨울 값 · ×1.2'), `P34 판매 알림에 겨울 값 (${r6.msg})`);
  const s7 = E.create(at(c => c.month === 13), () => 0.5); s7.cups = [{ id: 604, kind: 'tea', type: 'rose', q: 0.5, brewAbs: E.calendar(s7.virtual).abs }]; s7.cupTimerH = 0; E.advance(s7, s7.virtual + 1.05 * H, { live: false });
  check(s7.log.some(l => l.type === 13 && l.text.startsWith('손님이 찻잔 1잔을 사 갔어요') && l.text.endsWith('🌙 꽃잠 값 · ×1.3')), 'P34 손님(자동 판매) 일지에도 꽃잠 값'); }
check(E.cupValue({}, { kind: 'tea', type: 'lavender', q: 0.99, brewAbs: cal.abs, hat: true }, cal) === st.money - money, '돈은 찻잔 값만 (주문 보상 없음)');
st.cups = [{ id: 503, kind: 'blend', parts: ['chamomile', 'rose'], recipe: 'spring', name: '봄 들판', q: 0.8, brewAbs: cal.abs }];
const before = os.filter(x => x.done).length; st.cupTimerH = 0; E.advance(st, st.virtual + 1.05 * H, { live: false });
check(!os.some(x => x.kind === 'recipe' && !x.done) || os.filter(x => x.done).length === before + 1, '저절로 팔린 찻잔도 주문을 채움');

console.log('[P34 찻집은 매달 열림: 3월에도 그 달 쪽지]');
const st3 = E.create(at(c => c.month === 14), () => 0.5);
st3.orders = { abs: 0, list: [{ kind: 'hat', done: false }] };
E.advance(st3, E.calendar(st3.virtual).slotEnd + 0.1 * H);
check(E.calendar(st3.virtual).month === 3 && st3.orders && st3.orders.abs === E.calendar(st3.virtual).abs && st3.orders.list.length >= 1 && !st3.orders.list.some(x => x.kind === 'hat' && x.done === false && st3.orders.list.length === 1), 'P34 꽃샘달 → 3월: 지난 쪽지는 치우고 3월 쪽지가 옴');
{ const s = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); E.advance(s, s.virtual + 0.1 * H); check(s.orders && s.orders.list.length >= 1, 'P34 6월(예전엔 닫힌 달)에 시작해도 바로 쪽지'); }

console.log('[한 해 정원 평가]');
const sc = E.yearScore(st);
check(typeof sc.total === 'number' && sc.total === Object.values(sc.parts).reduce((a, b) => a + b, 0) && sc.parts.orders >= 5, `점수 = 항목 합 (${sc.total})`);
const rs = E.create(at(c => c.month === 2 && !c.frozen), () => 0.5); rs.onboarded = true;
E.advance(rs, E.calendar(rs.virtual).slotEnd + 0.2 * H, { live: false });
check(rs.records.length === 1 && rs.records[0].score != null && rs.bestScore === rs.records[0].score, '쉼달 기록에 점수 · 최고 기록');

console.log('[어려운 숨은 칭호]');
check(['t_guests', 't_honey', 't_deep', 't_score'].every(k => E.TITLES[k] && E.TITLES[k].tier === 'g' && !E.TITLES[k].chapter), '정원 등급 숨은 칭호 4개');
const h = E.create(at(c => c.month === 3), () => 0.5);
check(!E.TITLES.t_deep.test(h), '처음엔 아님'); h.mine.deepest = 20; check(E.TITLES.t_deep.test(h), '광산 20층이면 깊은 굴의 광부');
h.stats.orders = 30; check(E.TITLES.t_guests.test(h), '주문 30번이면 손님의 편지');
h.bestScore = 250; check(E.TITLES.t_score.test(h), '250점이면 빛나는 한 해');
h.dex.honey = Object.fromEntries(E.HONEY_KEYS.map(k => [k, true])); check(E.TITLES.t_honey.test(h), '꿀 14가지면 꿀 열네 병');

console.log('[예전 저장]');
const old = JSON.parse(JSON.stringify(E.create(at(c => c.month === 3), () => 0.5))); delete old.orders; delete old.bestScore; delete old.dex.memento; old.mig = 14;
const m = E.migrateSave(old);
check(m.orders === null && m.bestScore === 0 && m.dex.memento && m.mig === E.MIGRATIONS.length, '주문 · 점수 · 기념품 칸이 생김');

console.log('[QA 6회차]');
{ const s = E.create(at(c => c.month === 1 && !c.frozen), () => 0.5); s.onboarded = true; E.advance(s, s.virtual + 0.05 * H); E.giftPot(s); const l = s.orders.list; check(l[0].kind === 'tea' && l[0].type === s.firstFlower && l.every(o => ['tea', 'any'].includes(o.kind)), '화분을 받으면 그 꽃 차 쪽지 · 처음엔 못 들어주는 쪽지(햇차 · 레시피) 없음'); }
{ const s = E.create(at(c => c.month === 12), () => 0.5); s.dex.blend = { springfield: 0.8 }; s.stats = { hatCups: 1 }; s.dex.teabag = { rose: true, lavender: true, chamomile: true }; let kinds = new Set(); for (let i = 0; i < 60; i++) { s.gardenId = 'k' + i; E.makeOrders(s, E.calendar(s.virtual)); s.orders.list.forEach(o => kinds.add(o.kind)); } check(['recipe', 'hat'].every(k => kinds.has(k)), '블렌드 · 햇차를 해 봤으면 그 쪽지도 나옴'); }
console.log('[QA 5회차]');
{ let dup = 0; for (let i = 0; i < 300; i++) { const s = E.create(at(c => c.month === 12), () => 0.5); s.gardenId = 'd' + i; s.dex.teabag = { lavender: true }; E.makeOrders(s, E.calendar(s.virtual)); const ks = s.orders.list.map(o => o.kind === 'tea' ? 'tea' + o.type : o.kind); if (new Set(ks).size < ks.length) dup++; } check(dup === 0, '쪽지 3장은 서로 다름 (300판)'); }
{ const s = E.create(at(c => c.month === 12 && !c.frozen), () => 0.5); E.advance(s, s.virtual + 0.1 * H); check(s.orders && s.orders.list.length >= 1, '찻집이 열린 달에 시작해도 바로 쪽지'); }
{ const s = E.create(at(c => c.month === 12), () => 0.5); s.orders = { abs: E.calendar(s.virtual).abs, list: [{ kind: 'hat', done: false }, { kind: 'tea', type: 'rose', stars: 3, done: false }] };
  const cal2 = E.calendar(s.virtual); s.cups = [{ id: 1, kind: 'tea', type: 'rose', q: 1, hat: true, brewAbs: cal2.abs }]; E.sellCups(s, [1]);
  check(s.orders.list[1].done && !s.orders.list[0].done, '한 잔이 여러 쪽지에 맞으면 까다로운 쪽지(장미차)부터'); }
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
