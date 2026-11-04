// P75 📍 놓아야 효과 · ✨ 사면 바로 (11-04 사용자 확정): 효과가 있는 장식 카드에만 'place' 표시 · 보기만 바뀌는 장식은 없음
const path = require('path');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };

check(['hive', 'barrel', 'autobasket', 'ladybug', 'growlight', 'dryshelf', 'autodryer', 'teastand', 'stonewall', 'mutjar', 'moonlamp', 'fossilcase', 'stepstone'].every(k => E.decoActive(k) === 'place'), '곤충 · 장치 · 공방 물건 · 돌담 · 유리 관 · 달 초롱 = 📍 놓아야 효과');
check(['swing', 'arch', 'flowercart'].every(k => E.decoActive(k) === null), '그네 · 아치 · 꽃수레(보기만) = 표시 없음');
check(E.MONTH_DECO_KEYS.every(k => E.decoActive(k) === 'place'), '이달의 장식(그 달 꽃을 반김) = 📍');
check(E.decoActive('mutjar:rose') === 'place' && E.decoActive('nothing') === null, '키 뒤 :꼬리 · 없는 키');
check(Object.keys(E.DECOS).every(k => (E.decoActive(k) === 'place') === !!(E.DECOS[k].func || E.DECO_BUFF[k] || k === 'stonewall' || k === 'mutjar')), '효과 있는 장식과 📍 표시가 맞음');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
