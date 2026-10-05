// 씨앗·묘목 도감 (P08-03)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const MON = new Date(2026, 9, 5, 6, 0, 0).getTime();
const st = E.create(MON);
check(Object.keys(st.dex.form).length === 0, '처음엔 씨앗·묘목 도감이 비어 있음');
const n0 = E.dexCount(st);
check(E.buy(st, 'chamomile', 2).ok, '3월에 캐모마일 씨앗 2개 사기');
check(st.dex.form.chamomile === true, '사면 씨앗 도감에 등록');
check(E.dexCount(st) === n0 + 1, '도감 수가 1 늘어남 (2개 사도 한 번)');
check(st.log.filter(l => l.text === '도감에 등록: 캐모마일 씨앗').length === 1, '정원 일지에 "도감에 등록: 캐모마일 씨앗" 한 번');
check(E.buy(st, 'lavender', 1).ok && st.dex.form.lavender, '라벤더 묘목도 등록');
console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
