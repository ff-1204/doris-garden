// 미리보기용 정적 서버: node serve.js [폴더] [포트] → http://localhost:5173 (포트를 주면 그 포트, 두 미리보기를 함께 띄울 때)
// 엔진 소스 폴더(조각 engine-*.js가 있는 곳)를 보여 줄 땐 /engine.js 요청에 조각을 묶은 글자를 줘요 (P94-05 — 배포본과 같은 묶음 · tools/engine-bundle.js)
// 폴더를 주면 그 폴더를 그대로 보여 줌 (배포본 확인: node flower-land/serve.js _site). index.html은 이제 문서 틀을 직접 가짐 (10-17)
const http = require('http'), fs = require('fs'), path = require('path');
const { bundle, isSource } = require('./tools/engine-bundle.js');
const root = path.resolve(process.argv[2] || __dirname), port = +process.argv[3] || 5173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (path.basename(file).toLowerCase() === 'engine.js' && path.dirname(file) === root && isSource(root)) {
    let js; try { js = bundle(root); } catch (e) { res.writeHead(500); return res.end(String(e && e.message)); }
    res.writeHead(200, { 'Content-Type': types['.js'], 'Cache-Control': 'no-store' }); return res.end(js);
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, () => console.log(`http://localhost:${port} (${root})`));
