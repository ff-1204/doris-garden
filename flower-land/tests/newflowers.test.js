const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fail = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
const selling = m => E.FLOWER_KEYS.filter(k => E.FLOWERS[k].sow.includes(m));
for (const m of [6, 7, 8, 12, 1, 2]) check(selling(m).length > 0, `${m}월에도 파는 꽃: ${selling(m).map(k => E.FLOWERS[k].name).join(', ')}`);
check(E.FLOWERS.marigold && E.FLOWERS.celosia, '메리골드 · 맨드라미가 있음');
check(E.FLOWER_KEYS.length === 13, '꽃 13종');
const st = E.create(Date.now());
// 6월로 옮겨 메리골드 사기
const sprites = require('fs').readFileSync(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js')), '../sprites.js'), 'utf8');
check(sprites.includes('"marigold":[') && sprites.includes('"celosia":['), '새 꽃 도트 그림');
for (const k of ['marigold', 'celosia']) { const F = E.FLOWERS[k]; check(F.bloom.some(b => E.MONTHS.indexOf(b) >= E.MONTHS.indexOf(F.sow[0]) + F.mature), `${F.name}: 심은 해에 꽃이 핌`); }
console.log(fail ? `결과: ${fail}개 실패` : '결과: 모두 통과');
