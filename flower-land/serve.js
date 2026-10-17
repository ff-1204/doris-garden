// 미리보기용 정적 서버: node serve.js [폴더] → http://localhost:5173
// 폴더를 주면 그 폴더를 그대로 보여 줌 (배포본 확인: node flower-land/serve.js _site). index.html은 이제 문서 틀을 직접 가짐 (10-17)
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || __dirname);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(5173, () => console.log(`http://localhost:5173 (${root})`));
