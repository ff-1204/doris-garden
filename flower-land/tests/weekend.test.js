// 블렌딩은 언제든, 찻집은 토·일요일에만 (P12-08 변경, P17-09)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };
const st = E.create(MON);
st.dried.push({ id: 900, type: 'chamomile', q: 0.8 }, { id: 901, type: 'rose', q: 0.8 });
check(!E.calendar(st.virtual).frozen && E.blend(st, [900, 901], ctx).ok, '월요일에도 블렌딩 됨');
check(!E.teaShopOpen(E.calendar(st.virtual)) && Math.abs(E.hoursToShopOpen(st.virtual) - 108) < 0.01, '월요일 6시: 찻집 닫힘, 108시간 뒤(금 저녁 6시, 12월) 열림');
check(!E.sellBlends(st, [st.blends[0].id]).ok, '평일엔 블렌드도 못 팜');
E.advance(st, MON + 4 * 24 * E.HOUR + 12 * E.HOUR + 60e3, ctx);
check(E.calendar(st.virtual).month === 12 && E.teaShopOpen(E.calendar(st.virtual)), '금요일 저녁(12월, 겨울)부터 열림');
E.advance(st, MON + 5 * 24 * E.HOUR + 60e3, ctx);
check(E.calendar(st.virtual).month === 1 && E.teaShopOpen(E.calendar(st.virtual)), '토요일(1월)엔 열림');
check(E.sellBlends(st, [st.blends[0].id]).ok, '토요일에 블렌드 판매');
E.advance(st, MON + 6 * 24 * E.HOUR + 60e3, ctx);
check(E.calendar(st.virtual).frozen && E.teaShopOpen(E.calendar(st.virtual)), '일요일(꽃잠)도 열림');
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
