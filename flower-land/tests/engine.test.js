// 엔진 검증: 화면 없이 규칙을 시뮬레이션
const path = require('path');
const E = require(path.resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
{ const c0 = E.create; E.create = (...a) => Object.assign(c0(...a), { gardenId: 'test-garden' }); }   // P36 돌연변이는 정원 이름표 시드라 — 테스트 정원은 같은 이름표로 (무작위 이름표면 1%로 꽃이 변이해 거두기가 흔들림)
const HOUR = E.HOUR;
let fails = 0;
const check = (cond, label) => { if (!cond) { fails++; console.log('  ✗ ' + label); } else console.log('  ✓ ' + label); };
let seed = 42; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ── 달력
console.log('[달력]');
const mon = new Date(2026, 9, 5, 6, 0).getTime(); // 2026-10-05 월 06:00
const cal0 = E.calendar(mon);
check(cal0.month === 3 && cal0.day === 1, '월요일 06:00 = 3월 1일');
check(E.calendar(mon - 1).month === 14, '월요일 05:59 = 꽃샘달');
check(E.calendar(mon + 12 * HOUR).month === 4, '월요일 18:00 = 4월');
check(E.calendar(mon + 6 * 24 * HOUR).month === 13 && E.calendar(mon + 6 * 24 * HOUR).frozen, '일요일 06:00 = 쉼달, 시간 멈춤');
check(E.calendar(mon + 0.8 * HOUR * 14 + 1).day === 15, '한 달 15일');
const after = E.calendarAfterFlow(mon + 5.5 * 24 * HOUR, 12); // 토 18시 이후 12시간 흐름 → 쉼표 건너뜀
check(after.month === 3, '흐르는 시간은 쉼표를 건너뜀');

// ── 시작 상태
console.log('[시작]');
const st = E.create(mon, rng);
const ctx = { live: false, rng, toast: () => {}, onRecord: () => {} };
check(st.money === 15000, '시작 돈 15,000원');
check(st.dex.land.barren === true, '황무지는 시작하자마자 도감 등록');
check(E.landCounts(st).barren === 600, '처음엔 모두 황무지');

// ── 가게
console.log('[가게]');
check(!E.buy(st, 'jasmine', 1).ok, '재스민은 3월에 못 삼 (4·5월)');
check(E.buy(st, 'chamomile', 3).ok && st.money === 13500, '캐모마일 3봉지 1,500원');
check(E.buy(st, 'lavender', 1).ok && st.money === 11000, '라벤더 묘목 2,500원');
check(E.buy(st, 'maehwa', 1).ok, '매화 묘목 3월에 삼');
check(st.items.length === 5, '창고에 5개');

// ── 심기
console.log('[심기]');
const cham = st.items.filter(i => i.type === 'chamomile');
let r = E.plant(st, cham[0].id, 5, 5, rng); check(r.ok && !r.failed, '캐모마일 심음 (발아율 100%)');
E.plant(st, cham[1].id, 6, 5, rng); E.plant(st, cham[2].id, 5, 6, rng);
const lav = st.items.find(i => i.type === 'lavender');
check(E.plant(st, lav.id, 15, 10, rng).ok, '라벤더 심음');
const mae = st.items.find(i => i.type === 'maehwa');
check(E.plant(st, mae.id, 25, 4, rng).ok, '매화 심음');
check(!E.plant(st, 9999, 1, 1, rng).ok, '없는 물건은 못 심음');

// ── 한 달 진행
console.log('[성장]');
E.advance(st, mon + 6 * HOUR, ctx);
const chF6 = st.flowers.find(f => f.type === 'chamomile');
check(chF6.stage === 'sprout', '캐모마일은 6시간째 새싹: ' + chF6.stage);
E.advance(st, mon + 12 * HOUR, ctx);
const lavF = st.flowers.find(f => f.type === 'lavender');
check(lavF.stage === 'young', '라벤더 묘목은 자라는 중부터');

const tl = st.tiles[10 * 30 + 15];
console.log('    라벤더 자리 땅:', tl.t.toFixed(1) + '°C', tl.m.toFixed(1) + '%', 'life', tl.life.toFixed(2), E.landOf(tl));

// 돌보며 1주(1년) 진행: 매달 물·잡초, 꽃 피면 수확
let harvested = 0, made = 0;
const all = () => st.flowers.map(f => [f.x, f.y]);
function careAll() {
  st.water = Math.max(st.water, 20); st.hoe = Math.max(st.hoe, 20); st.basket = Math.max(st.basket, 20);   // 물병·호미·바구니는 넉넉히
  E.care(st, 'water', all(), ctx); E.care(st, 'weed', all(), ctx);
  const h = E.care(st, 'harvest', all(), ctx); if (h.ok) { harvested += h.count; const mk = E.makeTea(st, st.petals.map(p => p.id), ctx); if (mk.ok) made += h.count; }
}
for (let i = 1; i < 12; i++) {
  careAll();
  E.advance(st, mon + (i + 1) * 12 * HOUR, ctx);
}
careAll();
console.log('    수확한 꽃잎:', harvested, '찻장 꽃잎:', st.petals.length);
check(harvested > 0, '꽃이 피어 수확함');
check(st.dex.flower.chamomile && st.dex.flower.lavender, '캐모마일·라벤더 도감 등록');
const lavLand = E.landOf(st.tiles[10 * 30 + 15]);
check(lavLand === 'med', '라벤더 주변이 지중해 언덕: ' + lavLand);
const chLand = E.landOf(st.tiles[5 * 30 + 5]);
console.log('    캐모마일 자리:', chLand, '(시든 뒤일 수 있음)');
check(st.items.some(i => i.type === 'chamomile' && i.origin === '번식'), '캐모마일이 시들며 자동 채종');
check(!st.flowers.some(f => f.type === 'chamomile' && !f.withered), '한해살이 캐모마일은 시듦');
const maeF = st.flowers.find(f => f.type === 'maehwa');
check(maeF && maeF.stage === 'bloom', '매화는 3월에 심으면 11월에 다 자라 같은 해 2월에 핌: ' + (maeF && maeF.stage));
check(lavF.q >= 0.99, '물과 잡초를 챙기면 품질 유지 이상: ' + E.pct(lavF.q) + '%');

// ── 차
console.log('[차]');
const before = st.money;
check(made > 0 && st.teas.length > 0, '꽃잎으로 차 만들기: ' + st.teas.length + '개');
check(Object.keys(st.dex.teabag).length > 0 && Object.keys(st.dex.tea).length === 0, '만들면 티백 도감에 등록 (차는 아직)');
const s1 = E.sellTea(st, st.teas.map(t => t.id));
check(s1.ok && st.money > before, '차 팔기: ' + s1.msg);
check(Object.keys(st.dex.tea).length > 0, '찻집에서 처음 팔 때 차 도감에 등록');

// ── 쉼표: 시간 멈춤, 예약
console.log('[쉼표]');
const sun = mon + 6 * 24 * HOUR;
E.advance(st, sun + 1000, ctx);
const c2 = E.calendar(st.virtual);
check(c2.month === 13, '쉼달 도착');
check(st.records.length === 1, '쉼달에 한 해 기록');
check(st.log.length >= 2 && st.log[0].type === 7, '로그 초기화 후 첫 줄이 한 해 기록');
const qBefore = lavF.q, ageBefore = lavF.ageH, it0 = st.items[0] && st.items[0].q;
E.advance(st, sun + 20 * HOUR, ctx);
check(lavF.q === qBefore && lavF.ageH === ageBefore, '쉼표에는 꽃이 멈춤');
check(!st.items[0] || st.items[0].q === it0, '쉼표에는 창고 품질도 멈춤');
check(!E.buy(st, 'chamomile', 1).ok, '쉼표에는 일반 판매 없음');
check(!st.flowers.some(f => f.stage !== 'bloom' && E.canCare(st, f, 'harvest', c2)), '쉼표엔 핀 채로 잠든 꽃만 수확 대상 (새로 피지 않음, P04-01-09)');
const money0 = st.money;
let rv = E.reserve(st, [{ type: 'hibiscus', window: 4, qty: 2 }, { type: 'chamomile', window: 3, qty: 2 }, { type: 'chamomile', window: 9, qty: 1 }]);
check(rv.ok && st.money === money0 - (450 * 2 + 450 * 3), '예약 10% 할인, 나눠서 고르기: ' + rv.msg);
check(!E.reserve(st, [{ type: 'chamomile', window: 3, qty: 1 }]).ok, '한 종류당 3개까지');

// ── 새해 3월: 예약 배송
console.log('[새해]');
const nextMon = mon + 7 * 24 * HOUR;
E.advance(st, nextMon + 1000, ctx);
const c3 = E.calendar(st.virtual);
check(c3.month === 3 && E.yearOf(st, c3) === 2, '2년차 3월');
const pk = st.items.filter(i => i.packaged);
const rsv = st.items.filter(i => i.origin === '예약');
check(pk.some(i => i.type === 'hibiscus'), '히비스커스(4월 심기)는 3월 06시에 미리 배송, 특수 포장');
check(rsv.length === 4, '봄 예약 4개 도착 (가을 1개는 나중에): ' + rsv.length);
check(rsv.filter(i => i.type === 'chamomile').every(i => !i.packaged), '캐모마일은 3월이 심는 기간이라 바로 포장이 풀림');
E.advance(st, nextMon + 11 * HOUR, ctx);
check(st.items.find(i => i.type === 'hibiscus').q === 1, '특수 포장: 심는 기간 전까지 100%');
E.advance(st, nextMon + 30 * HOUR, ctx);
const hb = st.items.find(i => i.type === 'hibiscus');
check(hb && !hb.packaged && hb.q < 1, '심는 기간(4월)이 되면 포장이 풀리고 하락 시작: ' + (hb && E.pct(hb.q)));

// ── 방치: 30%에서 멈춤, 죽지 않음
console.log('[방치]');
const lavq = lavF.q;
E.advance(st, nextMon + 6 * 24 * HOUR - 1000, ctx); // 거의 1년 방치
check(lavF.q >= 0.3 - 1e-9 && !lavF.withered, '방치해도 30%에서 멈추고 죽지 않음: ' + E.pct(lavF.q) + '%');
check(E.vigorOf(st, lavF) >= 20, '기운은 20%에서 멈춤: ' + Math.round(E.vigorOf(st, lavF)));

// ── 비료
console.log('[비료]');
st.fert = 1;
const careOk = E.care(st, 'water', all(), ctx);
const fr = E.care(st, 'fert', all(), ctx);
check(!fr.ok && /모자라요/.test(fr.msg), '비료가 모자라면 취소: ' + fr.msg);
st.fert = 10;
check(E.care(st, 'fert', all(), ctx).ok, '비료 주기');
check(!E.care(st, 'fert', all(), ctx).ok, '효과가 남은 꽃에는 다시 못 줌');

// ── 씨앗 수명
console.log('[씨앗 수명]');
const it = { ageH: 0, q: 1 };
check(E.germOf({ ageH: 12 * 12 }) === 1 && E.germOf({ ageH: 16 * 12 }) === 0.5 && E.germOf({ ageH: 20 * 12 }) === 0, '발아율: 12달 100%, 16달 50%, 20달 0%');

// ── 막힘 방지
console.log('[막힘 방지]');
const st2 = E.create(mon, rng);
st2.money = 100;
E.advance(st2, mon + 1000, ctx);
check(st2.money === 5100 && st2.log.some(l => l.type === 11), '돈과 꽃이 모두 없으면 5,000원');
st2.money = 100;
E.advance(st2, mon + 2000, ctx);
check(st2.money === 100, '한 해에 한 번만');

// ── 품질과 별
console.log('[별]');
check(E.stars(1) === 5 && E.stars(0.81) === 5 && E.stars(0.8) === 4 && E.stars(0.21) === 2 && E.stars(0.2) === 1 && E.stars(0.01) === 1 && E.stars(0) === 0, '20%씩 별');
check(E.teaValue(E.FLOWERS.lavender, 0.7, true) === 1060 && E.teaValue(E.FLOWERS.lavender, 0.5, false) === 800, '차 값 계산 (햇차 +10%)');

// ── 땅 분류
console.log('[땅]');
check(E.classify(28, 12) === 'med' && E.classify(19, 97) === 'pond' && E.classify(8, 50) === 'foothill' && E.classify(26, 52) === 'subtropic' && E.classify(31, 82) === 'tropical' && E.classify(17, 40) === 'grassland', '꽃별 원하는 환경 → 땅');
console.log('\n결과:', fails ? fails + '개 실패' : '모두 통과');
process.exit(fails ? 1 : 0);
