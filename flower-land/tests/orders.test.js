// P23 오래 하는 정원사: 손님 주문 · 기념품 · 한 해 정원 평가 · 어려운 숨은 칭호
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };

console.log('[주문 쪽지]');
const st = E.create(at(c => c.month === 11 && !c.frozen), () => 0.5); st.gardenId = 'test-garden';
st.dex.teabag = { lavender: true };
check(!st.orders, '찻집이 닫힌 달엔 쪽지 없음');
E.advance(st, E.calendar(st.virtual).slotEnd + 0.1 * H, { live: false });
const os = st.orders && st.orders.list;
check(E.calendar(st.virtual).month === 12 && os && os.length === 3 && os[0].kind === 'tea' && os[0].type === 'lavender', '12월(찻집 열림)이 되면 3장 · 첫 장은 만든 적 있는 꽃의 차');
const abs0 = st.orders.abs, again = JSON.stringify(os);
const st2 = E.create(at(c => c.month === 11 && !c.frozen), () => 0.5); st2.gardenId = 'test-garden'; st2.dex.teabag = { lavender: true };
E.advance(st2, E.calendar(st2.virtual).slotEnd + 0.1 * H, { live: false });
check(JSON.stringify(st2.orders.list) === again, '같은 정원 · 같은 달이면 같은 쪽지 (Math.random 안 씀)');

console.log('[맞는 찻잔을 팔면]');
const o = os[0], cal = E.calendar(st.virtual);
st.cups = [{ id: 501, kind: 'tea', type: 'lavender', q: (o.stars - 1) * 0.2 - 0.05, brewAbs: cal.abs }];
E.sellCups(st, [501]);
check(!o.done, '★이 모자라면 안 맞음');
st.cups = [{ id: 502, kind: 'tea', type: 'lavender', q: 0.99, brewAbs: cal.abs, hat: true }];
const money = st.money; E.sellCups(st, [502]);
const memo = Object.keys(st.dex.memento || {});
check(o.done && memo.length === 1 && (st.stats.orders || 0) === 1, '맞으면 ✓ · 기념품 하나 · 주문 수');
check(st.log.some(l => l.type === 15 && l.text.includes('두고 갔어요')), '일지에 기념품');
check(E.cupValue({}, { kind: 'tea', type: 'lavender', q: 0.99, brewAbs: cal.abs, hat: true }, cal) === st.money - money, '돈은 찻잔 값만 (주문 보상 없음)');
st.cups = [{ id: 503, kind: 'blend', parts: ['chamomile', 'rose'], recipe: 'spring', name: '봄 들판', q: 0.8, brewAbs: cal.abs }];
const before = os.filter(x => x.done).length; st.cupTimerH = 0; E.advance(st, st.virtual + 1.05 * H, { live: false });
check(!os.some(x => x.kind === 'recipe' && !x.done) || os.filter(x => x.done).length === before + 1, '저절로 팔린 찻잔도 주문을 채움');

console.log('[찻집이 닫히면 쪽지 치움]');
const st3 = E.create(at(c => c.month === 14), () => 0.5);
st3.orders = { abs: 0, list: [{ kind: 'hat', done: false }] };
E.advance(st3, E.calendar(st3.virtual).slotEnd + 0.1 * H);
check(E.calendar(st3.virtual).month === 3 && st3.orders === null, '꽃샘달 → 3월이 되면 쪽지 없음');

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

console.log('[QA 5회차]');
{ let dup = 0; for (let i = 0; i < 300; i++) { const s = E.create(at(c => c.month === 12), () => 0.5); s.gardenId = 'd' + i; s.dex.teabag = { lavender: true }; E.makeOrders(s, E.calendar(s.virtual)); const ks = s.orders.list.map(o => o.kind === 'tea' ? 'tea' + o.type : o.kind); if (new Set(ks).size < ks.length) dup++; } check(dup === 0, '쪽지 3장은 서로 다름 (300판)'); }
{ const s = E.create(at(c => c.month === 12 && !c.frozen), () => 0.5); E.advance(s, s.virtual + 0.1 * H); check(s.orders && s.orders.list.length === 3, '찻집이 열린 달에 시작해도 바로 쪽지'); }
{ const s = E.create(at(c => c.month === 12), () => 0.5); s.orders = { abs: E.calendar(s.virtual).abs, list: [{ kind: 'hat', done: false }, { kind: 'tea', type: 'rose', stars: 3, done: false }] };
  const cal2 = E.calendar(s.virtual); s.cups = [{ id: 1, kind: 'tea', type: 'rose', q: 1, hat: true, brewAbs: cal2.abs }]; E.sellCups(s, [1]);
  check(s.orders.list[1].done && !s.orders.list[0].done, '한 잔이 여러 쪽지에 맞으면 까다로운 쪽지(장미차)부터'); }
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
