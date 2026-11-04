// ☁️ 드라이브 통신 층 (drive.js, P20-05): 가짜 fetch로 만든 작은 드라이브에 저장 · 목록 · 읽기 · 직전 저장본 · 실패 종류
const path = require('path');
const Dr = require(path.join(__dirname, '..', 'drive.js'));
const E = require(require('path').resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };

// 가짜 드라이브: appDataFolder 파일만, 요청을 모두 적어 둠
function fakeDrive() {
  const files = new Map(), reqs = []; let n = 0, down = false, status = 0;
  const res = (code, body) => ({ ok: code >= 200 && code < 300, status: code, json: async () => JSON.parse(body), text: async () => body });
  const view = f => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime, appProperties: f.appProperties });
  async function fetch(url, opt) {
    opt = opt || {}; const method = opt.method || 'GET';
    reqs.push({ url, method, headers: opt.headers || {}, body: opt.body, keepalive: !!opt.keepalive });
    if (down) throw new TypeError('Failed to fetch');
    if (status) return res(status, status === 403 ? '{"error":{"errors":[{"reason":"userRateLimitExceeded"}]}}' : '{}');
    if (!/^Bearer tok-/.test((opt.headers || {}).Authorization || '')) return res(401, '{}');
    const u = new URL(url);
    if (u.href.startsWith(Dr.USERINFO)) return res(200, JSON.stringify({ email: 'gardener@gmail.com', sub: '1' }));
    if (u.pathname === '/drive/v3/files' && method === 'GET') {
      if (u.searchParams.get('spaces') !== 'appDataFolder') return res(400, '{}');
      return res(200, JSON.stringify({ files: [...files.values()].map(view) }));
    }
    if (u.pathname === '/upload/drive/v3/files' && method === 'POST') {
      if (u.searchParams.get('uploadType') !== 'multipart') return res(400, '{}');
      const b = opt.headers['Content-Type'].match(/boundary=(.+)$/)[1];
      const parts = opt.body.split(`--${b}`).slice(1, -1).map(p => p.replace(/^\r\n/, '').split('\r\n\r\n'));
      const meta = JSON.parse(parts[0][1].trim()), media = parts[1].slice(1).join('\r\n\r\n').replace(/\r\n$/, '');
      if (!meta.parents || meta.parents[0] !== 'appDataFolder') return res(400, '{}');
      const f = { id: 'f' + (++n), name: meta.name, appProperties: meta.appProperties, media, modifiedTime: new Date(1e12 + n * 1000).toISOString() };
      files.set(f.id, f); return res(200, JSON.stringify(view(f)));
    }
    const m = u.pathname.match(/^\/drive\/v3\/files\/([^/]+)$/);
    if (m) {
      const f = files.get(m[1]); if (!f) return res(404, '{}');
      if (method === 'GET' && u.searchParams.get('alt') === 'media') return res(200, f.media);
      if (method === 'PATCH') { const p = JSON.parse(opt.body); if (p.name) f.name = p.name; return res(200, JSON.stringify(view(f))); }
      if (method === 'DELETE') { files.delete(m[1]); return res(204, ''); }
    }
    return res(400, '{}');
  }
  return { fetch, files, reqs, set down(v) { down = v; }, set status(v) { status = v; } };
}

(async () => {
  const fd = fakeDrive(); let tok = 'tok-1';
  const drive = Dr.makeDrive(fd.fetch, async () => tok);
  const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime();
  const st = E.create(MON, () => 0.5);

  console.log('[처음]');
  let cur = await drive.list();
  check(cur.garden === null && cur.prev === null, '빈 숨김 폴더');
  check(fd.reqs[0].url.includes('spaces=appDataFolder') && fd.reqs[0].headers.Authorization === 'Bearer tok-1', '목록은 spaces=appDataFolder · 토큰은 Authorization 머리말에');
  const who = await drive.userinfo();
  check(who.email === 'gardener@gmail.com', '계정 이메일 (userinfo)');

  console.log('[저장 · 읽기]');
  const d1 = E.makeSave(st, MON + H);
  cur = await drive.write(JSON.stringify(d1), { gardenId: st.gardenId, savedAt: d1.savedAt, firstVisit: MON, season: 2, none: null }, cur);
  const up = fd.reqs[fd.reqs.length - 1];
  check(up.method === 'POST' && up.url.startsWith(Dr.UPLOAD + '?uploadType=multipart') && /^multipart\/related; boundary=/.test(up.headers['Content-Type']), '멀티파트 업로드 (upload/drive/v3/files?uploadType=multipart)');
  check(fd.files.size === 1 && [...fd.files.values()][0].name === 'garden.json', 'garden.json 하나');
  check(cur.garden.gardenId === st.gardenId && cur.garden.savedAt === MON + H && cur.garden.firstVisit === MON && cur.garden.season === 2, '요약(정원 이름표 · 저장 시각 · 첫 방문 · 몇 철)은 appProperties로 돌아옴');
  check(Dr.metaOf({ id: 'x', name: 'garden.json', appProperties: { gardenId: 'a', savedAt: '5' } }).season === null, '철을 적기 전 파일은 season null (P28-08-05 — 철 비교를 하지 않음)');
  check(!('none' in [...fd.files.values()][0].appProperties), '빈 값은 appProperties에 넣지 않음');
  const back = E.parseSave(await drive.read(cur.garden.id));
  check(back.ok && back.data.gardenId === st.gardenId && back.data.check === d1.check, '읽은 파일이 저장 파일 검사를 통과 (같은 형식)');

  console.log('[직전 저장본 (P20-05-01)]');
  const d2 = E.makeSave(st, MON + 2 * H);
  cur = await drive.write(JSON.stringify(d2), { gardenId: st.gardenId, savedAt: d2.savedAt });
  let names = [...fd.files.values()].map(f => f.name).sort();
  check(names.join() === 'garden.json,garden.prev.json', '두 번째 저장: 앞 저장은 garden.prev.json으로');
  const l2 = await drive.list();
  check(l2.garden.savedAt === MON + 2 * H && l2.prev.savedAt === MON + H, '목록: 지금 것과 직전 것');
  const d3 = E.makeSave(st, MON + 3 * H);
  await drive.write(JSON.stringify(d3), { gardenId: st.gardenId, savedAt: d3.savedAt });
  const l3 = await drive.list();
  check(fd.files.size === 2 && l3.garden.savedAt === MON + 3 * H && l3.prev.savedAt === MON + 2 * H, '세 번째 저장: 파일은 늘 두 개 (예전 직전본은 지움)');

  console.log('[끊긴 저장 · 겹친 파일]');
  [...fd.files.values()].find(f => f.name === 'garden.json').name = 'garden.prev.json';   // 이름만 바뀌고 끊김 → 직전본 둘, garden.json 없음
  const l4 = await drive.list();
  check(l4.garden === null && l4.prev.savedAt === MON + 3 * H && l4.extra.length === 1, 'garden.json이 없으면 가장 새 직전본을 알려 줌');
  await drive.write(JSON.stringify(d3), { gardenId: st.gardenId, savedAt: MON + 4 * H }, l4);
  const l5 = await drive.list();
  check(l5.garden.savedAt === MON + 4 * H && l5.prev.savedAt === MON + 3 * H && fd.files.size === 2, '다음 저장에서 직전본은 지키고 겹친 것만 지움');

  console.log('[닫을 때]');
  const before = fd.reqs.length;
  await drive.write(JSON.stringify(d3), { gardenId: st.gardenId, savedAt: MON + 5 * H }, null, { keepalive: true });
  check(fd.reqs.slice(before).filter(r => r.method !== 'GET').every(r => r.keepalive), '작은 정원은 keepalive로 (페이지를 닫아도 보내지게)');
  const big = JSON.stringify(d3) + ' '.repeat(70000), b2 = fd.reqs.length;
  await drive.write(big, { gardenId: st.gardenId, savedAt: MON + 6 * H }, null, { keepalive: true });
  check(fd.reqs.slice(b2).every(r => !r.keepalive), '60KB가 넘으면 keepalive 없이 (브라우저 한도 64KB)');

  console.log('[실패 종류 (P20-05-03)]');
  const kind = async f => { try { await f(); return 'ok'; } catch (e) { return e.kind; } };
  fd.down = true; check(await kind(() => drive.list()) === 'offline', '연결이 안 되면 offline'); fd.down = false;
  tok = 'expired'; check(await kind(() => drive.list()) === 'auth', '토큰이 안 맞으면 auth (다시 받기)'); tok = 'tok-2';
  fd.status = 403; check(await kind(() => drive.list()) === 'quota', '너무 잦으면 quota'); fd.status = 500;
  check(await kind(() => drive.list()) === 'fail', '그 밖은 fail'); fd.status = 0;
  check(await kind(() => drive.list()) === 'ok', '다시 되면 그대로');

  console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log(e); console.log('결과: 1개 실패'); process.exit(1); });
