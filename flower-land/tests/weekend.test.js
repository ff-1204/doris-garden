// 블렌딩은 언제든, 찻집은 매달 열림 (P12-08 변경, P17-09 → P34 10-30: 겨울 · 꽃잠 한정을 풂)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };
const st = E.create(MON);
st.dried.push({ id: 900, type: 'chamomile', q: 0.8 }, { id: 901, type: 'rose', q: 0.8 }, { id: 902, type: 'chamomile', q: 0.8 }, { id: 903, type: 'rose', q: 0.8 });
check(!E.calendar(st.virtual).frozen && E.blend(st, [900, 901], ctx).ok, '월요일에도 블렌딩 됨');
check(E.calendar(st.virtual).month === 3 && E.teaShopOpen(E.calendar(st.virtual)) && E.hoursToShopOpen(st.virtual) === 0, 'P34 월요일 6시(3월): 찻집이 열려 있음 · 기다릴 시간 0');
check(E.sellBlends(st, [st.blends[0].id]).ok, 'P34 평일(3월)에도 블렌드를 팖');
// 한 주 내내 달마다 열려 있음 (3월 ~ 2월 · 꽃잠)
let all = true;
for (let i = 0; i < 14; i++) { E.advance(st, MON + i * 12 * E.HOUR + 60e3, ctx); if (!E.teaShopOpen(E.calendar(st.virtual)) || E.hoursToShopOpen(st.virtual) !== 0) all = false; }
check(all && E.calendar(st.virtual).frozen, 'P34 3월부터 꽃잠까지 14칸 모두 열림');
check(E.blend(st, [902, 903], ctx).ok && E.sellBlends(st, [st.blends[0].id]).ok, '일요일(꽃잠)에도 블렌드 판매');
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
