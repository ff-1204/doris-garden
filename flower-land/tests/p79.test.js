// P79 (11-05): 🫖 새 블렌드 넷 · 👅 차 · 블렌드 맛 한 줄
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };

console.log('[새 블렌드]');
const NEW = { bluejasmine: ['bpea', 'jasmine'], rosejasmine: ['rose', 'jasmine'], duskhill: ['hibiscus', 'lavender'], goldautumn: ['marigold', 'gamguk'] };
check(Object.entries(NEW).every(([k, p]) => E.BLENDS[k] && E.BLENDS[k].parts.join() === p.join() && !E.BLENDS[k].hidden), '넷 모두 레시피에 (숨은 레시피 아님)');
check(E.BLEND_KEYS.length === 13 && E.DEX_TOTAL === 101, '레시피 13가지 · 기본 도감 101칸');
const sig = k => E.BLENDS[k].parts.slice().sort().join('|'), sigs = Object.keys(E.BLENDS).map(sig);
check(new Set(sigs).size === sigs.length, '재료가 같은 블렌드가 둘 없음');
check(Object.keys(E.BLENDS).every(k => E.BLENDS[k].parts.every(p => E.FLOWERS[p])), '재료는 모두 있는 꽃');
check(E.blendRecipe(['jasmine', 'bpea']) === 'bluejasmine' && E.blendRecipe(['gamguk', 'marigold']) === 'goldautumn', '재료 차례와 상관없이 레시피를 찾음');
const q = 0.5, sum = p => p.reduce((a, k) => a + E.teaValue(E.FLOWERS[k], q, false), 0);
check(E.blendValue({ parts: NEW.duskhill, q }) === Math.round(sum(NEW.duskhill) * E.RECIPE_RATE / 10) * 10, '새 레시피 값은 다른 레시피와 같은 × 1.5');
// 같은 철: 두 꽃이 피는 달이 겹치거나 이웃 (여름 · 가을 짝)
const near = ([a, b]) => E.FLOWERS[a].bloom.some(m => E.FLOWERS[b].bloom.some(n => Math.abs(m - n) <= 3));
check(Object.values(NEW).every(near), '두 꽃이 피는 철이 가까움');

console.log('[맛 한 줄]');
check(E.FLOWER_KEYS.every(k => E.teaTaste('tea', k).length >= 4 && E.teaTaste('tea', k).length <= 20), '꽃 차 13가지 모두 한 줄 (4 ~ 20자)');
check(Object.keys(E.BLENDS).every(k => E.BLENDS[k].taste && E.teaTaste('blend', k).length <= 20), '이름 있는 블렌드 15가지(숨은 둘 포함) 모두 한 줄 (20자 이하)');
check(E.teaTaste('blend', null, ['rose', 'lotus']) === '장미 향 · 맑은 연꽃 향', '이름 없는 블렌드는 꽃마다 첫 낱말을 이음');
check(E.teaTaste('blend', 'springfield', ['chamomile', 'rose']) === E.BLENDS.springfield.taste, '레시피 블렌드는 그 레시피 줄');
check(E.teaTaste('tea', 'nope') === '' && E.teaTaste('blend', 'nope', []) === '', '모르는 키는 빈 줄');
check(E.FLOWER_KEYS.every(k => !/[<>]/.test(E.teaTaste('tea', k))), '화면에 그대로 찍어도 되는 글자');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
