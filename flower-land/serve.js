// 미리보기용 정적 서버: node serve.js → http://localhost:5173
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    let body = data;
    // 아티팩트는 게시할 때 문서 틀이 씌워지므로, 미리보기에서도 같은 틀을 씌움
    if (p === '/index.html') body = Buffer.from('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + data.toString() + '</body></html>');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  });
}).listen(5173, () => console.log('http://localhost:5173'));
