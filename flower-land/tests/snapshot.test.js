// 엔진 스냅숏 (P66-01): 공개 이름 · MIGRATIONS 보정 이름 · 새 정원 · 옛 저장 옮기기 · 저장 파일 해시가 tests/engine-snapshot.txt와 같은지
// 엔진을 나누거나 옮기기만 할 땐 한 줄도 달라지면 안 돼요. 공개 이름을 더하거나 보정 줄을 더하는 등 일부러 바꿨으면
// node flower-land/tools/engine-snapshot.js --write 로 다시 쓰고, 바뀐 줄이 바꾼 것뿐인지 diff로 확인해요
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const ENGINE = path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js'));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const norm = s => s.replace(/\r\n/g, '\n');

console.log('[엔진 스냅숏이 기록과 같음]');
const now = norm(execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'engine-snapshot.js'), ENGINE], { encoding: 'utf8' }));
const want = norm(fs.readFileSync(path.join(__dirname, 'engine-snapshot.txt'), 'utf8'));
const a = now.split('\n'), b = want.split('\n');
const diff = [];
for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) diff.push(`    ${i + 1}줄\n      지금: ${a[i]}\n      기록: ${b[i]}`);
if (diff.length) console.log(diff.slice(0, 8).join('\n') + (diff.length > 8 ? `\n    … ${diff.length}줄 다름` : ''));
check(!diff.length, `스냅숏 ${b.length - 1}줄이 모두 같음${diff.length ? ` — ${diff.length}줄 다름 (일부러 바꿨으면 node flower-land/tools/engine-snapshot.js --write)` : ''}`);
check(/^공개 이름 \d+개/m.test(now) && /^보정 MIGRATIONS \d+줄/m.test(now) && /^옛 저장: 가장 옛 정원/m.test(now), '스냅숏에 공개 이름 · 보정 · 옛 저장 줄이 있음');
const E = require(ENGINE);
check(new RegExp(`^보정 MIGRATIONS ${E.MIGRATIONS.length}줄$`, 'm').test(want) && new RegExp(`^공개 이름 ${Object.keys(E).length}개`, 'm').test(want), `기록의 수가 지금 엔진과 같음 (공개 이름 ${Object.keys(E).length} · 보정 ${E.MIGRATIONS.length}줄)`);

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
