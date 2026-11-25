// 엔진 묶기 (P94-05): 엔진 조각 engine-*.js 10개 + 공개 목록(engine.js의 api)을 감싸는 함수 하나에 넣어 브라우저용 engine.js 글자를 만들어요
// 브라우저는 늘 이 묶음을 받아요 — 로컬은 serve.js가 /engine.js 요청에, 배포는 build-site.js가 _site/engine.js에 같은 함수로 만들어요
// 그래서 브라우저 전역에는 Engine 하나만 생기고, 엔진 최상위 이름 700여 개는 화면 파일(app-*.js)과 겹칠 일이 없어요
// Node(테스트 · 도구)는 이 묶음을 쓰지 않아요 — require('../engine.js')가 예전처럼 vm으로 조각을 펼쳐요
const fs = require('fs'), path = require('path');
const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
function partNames(dir) {
  const m = read(dir, 'engine.js').match(/const ENGINE_PARTS = \[([^\]]*)\]/);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
}
// 이 폴더가 엔진 소스 폴더인가 (조각이 다 있음) — 배포본 폴더(_site)는 조각이 없고 engine.js가 이미 묶음이에요
function isSource(dir) {
  try { const parts = partNames(dir); return parts.length > 0 && parts.every(f => fs.existsSync(path.join(dir, f))); } catch (e) { return false; }
}
function bundle(dir) {
  const src = read(dir, 'engine.js'), parts = partNames(dir);
  const a = src.indexOf('\nconst api = {'), b = src.indexOf('\n};', a);
  if (!parts.length || a < 0 || b < 0) throw new Error('engine.js 모양을 모르겠어요 (ENGINE_PARTS · const api 줄)');
  return [
    '// 도리의 정원 (Dori\'s Garden) — 엔진 묶음: tools/engine-bundle.js가 engine-*.js와 engine.js의 공개 목록으로 만들어요. 이 글자를 고치지 말고 조각을 고쳐요',
    '(function (root) {',
    "'use strict';",
    ...parts.map(f => `// ── ${f}\n${read(dir, f)}`),
    src.slice(a + 1, b + 3),
    'root.Engine = api;',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ].join('\n');
}
module.exports = { bundle, isSource, partNames };
if (require.main === module) process.stdout.write(bundle(path.resolve(process.argv[2] || path.join(__dirname, '..'))));
