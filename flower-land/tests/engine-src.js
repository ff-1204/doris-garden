// 테스트 도우미 (P66-01, .test.js가 아니라 run.js가 돌리지 않음): 엔진 소스를 글자로 읽는 테스트가 엔진 파일 모양과 상관없이 쓰게
//   source(engine) — 엔진 글자 전부 (조각 engine-*.js가 있으면 ENGINE_PARTS 차례로 이은 뒤 engine.js) — 구역을 잘라 읽는 테스트용
//   parts(engine)  — 브라우저가 전역 이름 공간에 펼치는 엔진 스크립트들 [{ file, src }]
//                    조각이 없으면(한 파일) engine.js에서 감싸는 함수(IIFE)를 벗긴 몸 — 나누면 이렇게 펼쳐진다는 모습
//   partNames(engine) — engine.js의 ENGINE_PARTS (없으면 [])
const fs = require('fs'), path = require('path');
const enginePath = p => path.resolve(p || path.join(__dirname, '..', 'engine.js'));
const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
function partNames(engine) {
  const m = read(enginePath(engine)).match(/const ENGINE_PARTS = \[([^\]]*)\]/);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
}
function parts(engine) {
  const file = enginePath(engine), dir = path.dirname(file), names = partNames(file);
  if (names.length) return names.map(f => ({ file: f, src: read(path.join(dir, f)) }));
  const lines = read(file).split('\n'), a = lines.findIndex(l => l.startsWith('(function (root) {')), b = lines.findIndex(l => l.startsWith('const api = {'));
  if (a < 0 || b < a) throw new Error('engine.js 모양을 모르겠어요 (IIFE · const api 줄)');
  return [{ file: 'engine.js (IIFE 벗김)', src: lines.slice(a + 1, b).join('\n') + '\n' }];
}
function source(engine) {
  const file = enginePath(engine), dir = path.dirname(file);
  return partNames(file).map(f => read(path.join(dir, f))).join('') + read(file);
}
module.exports = { source, parts, partNames, enginePath };
