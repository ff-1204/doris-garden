// 엔진 테스트 모두 돌리기: node flower-land/tests/run.js
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort();
let failed = 0;
for (const f of files) {
  let out;
  try { out = execFileSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  const last = out.trim().split('\n').pop();
  const ok = last.includes('모두 통과');
  if (!ok) { failed++; console.log(out); }
  console.log(`${ok ? '✓' : '✗'} ${f} — ${last}`);
}
console.log(failed ? `\n${failed}개 파일 실패` : `\n${files.length}개 파일 모두 통과`);
process.exit(failed ? 1 : 0);
