// P45 📘 매뉴얼: 도감에서 직접 찾는 것(목록)은 매뉴얼에 다시 나오지 않게 · 🧬 돌연변이는 떡밥만 (화면 코드라 renderManual 소스를 읽어 봄)
const path = require('path'), fs = require('fs');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const src = fs.readFileSync(path.join(__dirname, '..', 'app-manual.js'), 'utf8');
const a = src.indexOf('📘 매뉴얼'), b = src.indexOf('function openSettings');
const man = src.slice(a, b);
const text = man.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');   // 머리 주석은 빼고 (기준을 적은 곳)

console.log('[매뉴얼이 읽지 않는 표 — 목록은 📖 도감에서]');
const banned = ['E.BLENDS', 'blendKeys', 'E.MUT', 'MUTANT', 'mutChance', 'E.TREES', 'TREE_KEYS', 'E.YEARLY', 'E.VISITORS', 'VISITOR_KEYS', 'E.ORES', 'E.FOSSILS', 'ORE_KEYS', 'FOSSIL_KEYS', 'flowerStrip', 'E.CHAPTERS', 'TITLE_KEYS', 'F.t}', 'F.m}', 'E.WORKSHOP_BUFF', 'MINE_DEX_KEYS'];
check(a > 0 && b > a && man.includes('function renderManual'), 'renderManual 소스를 찾음');
for (const k of banned) check(!text.includes(k), `${k} 안 씀`);

console.log('[이름이 나오지 않음]');
const names = [
  ['블렌드 레시피', Object.values(E.BLENDS).map(x => x.name)],
  ['숲 나무', Object.values(E.TREES).map(x => x.name)],
  ['특별 손님', Object.values(E.VISITORS).map(x => x.name)],
  ['올해만 것', Object.values(E.YEARLY).map(x => x.name)],
  ['광물 · 화석', [...Object.values(E.ORES), ...Object.values(E.FOSSILS)].map(x => x.name)],
  ['돌연변이 꽃빛', Object.values(E.MUTANTS || {}).map(x => x && x.name).filter(Boolean)],
  ['칭호 (숨은 칭호 포함)', Object.values(E.TITLES).map(x => x.name)],
];
for (const [what, ns] of names) { const hit = ns.filter(n => n && n.length >= 2 && text.includes(n)); check(!hit.length, `${what} ${ns.length}개 이름 없음${hit.length ? ` (나옴: ${hit.join(', ')})` : ''}`); }

console.log('[🧬 돌연변이는 떡밥만]');
const mutLines = text.split('\n').filter(l => /낯선 빛|돌연변이|변이/.test(l));
check(mutLines.length >= 1, '떡밥 한 줄은 있음');
const rumor = (text.match(/[^'`]*낯선 빛[^'`]*/) || [''])[0];
check(rumor && !/\d/.test(rumor) && !/유리 관|확률|단계|꽃잠에 놓/.test(rumor), `숫자 · 조건 없이: "${rumor.trim().slice(0, 60)}…"`);
check(!/돌연변이|변이 꽃|유리 관/.test(text), '돌연변이 · 유리 관 설명 없음');

console.log('[처음 하는 사람]');
check(/sec\('start', '처음 하루'/.test(text) && text.indexOf("sec('start'") < text.indexOf("sec('year'"), '맨 위 절은 🌱 처음 하루');
check(/정원은 운영자에게 보내지 않아요/.test(text) && /총 방문 수만 쿠키 없이 세요/.test(text), '저장 절: 운영자에게 보내지 않음 · 방문 수 한 줄');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
