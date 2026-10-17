// 배포본 모으기: 화면에 필요한 파일만 _site/에 복사 (테스트 · 도구 · 미리보기 서버는 빼고)
// node flower-land/tools/build-site.js [출력 폴더] — GitHub Actions(.github/workflows/pages.yml)와 로컬 확인이 같은 목록을 씀
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..'), out = path.resolve(process.argv[2] || path.join(src, '..', '_site'));
const FILES = ['index.html', 'engine.js', 'sprites.js', 'titles.js', 'app.js', 'privacy.html', 'terms.html', 'policy.css', 'og.png', 'robots.txt'];   // og.png: 링크 미리보기 이미지 (tools/make-og.js) · robots.txt: AI 수집기 거절 (LICENSE)
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of FILES) fs.copyFileSync(path.join(src, f), path.join(out, f));
// index.html이 부르는 로컬 파일이 목록에 다 있는지 확인 (빠뜨리면 배포에서 깨짐)
const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(u => !/^(https?:|data:|#|mailto:)/.test(u));
const missing = refs.filter(u => !FILES.includes(u.replace(/^\.\//, '')));
if (!html.startsWith('<!doctype html>')) { console.error('index.html에 문서 틀(<!doctype html>)이 없어요'); process.exit(1); }
if (missing.length) { console.error('배포 목록에 없는 파일을 불러요: ' + missing.join(', ')); process.exit(1); }
console.log(`배포본 ${FILES.length}개 파일 → ${out}`);
