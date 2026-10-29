// 도리의 정원 — 구글 드라이브 앱 전용 숨김 폴더(appDataFolder) 통신 (P20-05, 10-27)
// DOM을 쓰지 않음: fetch와 토큰 주는 함수를 받아서 씀 → node에서 가짜 fetch로 테스트 (tests/drive.test.js)
// 파일 두 개: garden.json(지금 정원) · garden.prev.json(직전 저장본). 요약은 appProperties에 적어 목록만으로 비교함
(function (root) {
'use strict';
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo';
const NAME = 'garden.json', PREV = 'garden.prev.json';
const FIELDS = 'id,name,modifiedTime,appProperties';

// 실패 종류: offline(연결 안 됨) · auth(토큰이 안 맞음, 다시 받아야 함) · quota(너무 잦음) · fail(그 밖)
function driveError(kind, status, detail) { const e = new Error(`drive ${kind} ${status || ''}`.trim()); e.kind = kind; e.status = status || 0; e.detail = detail || ''; return e; }
// 드라이브 파일 → { id, savedAt, gardenId, firstVisit, reward, season } (appProperties 값은 글자라 숫자로)
function metaOf(f) {
  if (!f) return null;
  const p = f.appProperties || {};
  return { id: f.id, name: f.name, gardenId: p.gardenId || null, savedAt: +p.savedAt || Date.parse(f.modifiedTime) || 0, firstVisit: +p.firstVisit || null, reward: +p.reward || null, season: +p.season || null };   // reward: 계정이 구름 정원사를 받은 때 (P20-16) · season: 몇 철 (P28-08-05, 예전 파일은 null — 철 비교를 하지 않음)
}
const newest = list => list.slice().sort((a, b) => b.savedAt - a.savedAt);

function makeDrive(fetchFn, tokenFn) {
  async function call(url, opt) {
    opt = opt || {};
    const token = await tokenFn();
    let r;
    try { r = await fetchFn(url, Object.assign({}, opt, { headers: Object.assign({ Authorization: 'Bearer ' + token }, opt.headers || {}) })); }
    catch (e) { throw driveError('offline', 0, String(e && e.message || e)); }
    if (r.ok) return r;
    const detail = await r.text().catch(() => '');
    if (r.status === 401) throw driveError('auth', 401, detail);
    if (r.status === 429 || (r.status === 403 && /rateLimit|userRateLimit|quota/i.test(detail))) throw driveError('quota', r.status, detail);
    throw driveError('fail', r.status, detail);
  }
  // 목록: 숨김 폴더의 정원 파일들. 같은 이름이 여럿이면(두 기기가 동시에 처음 저장) 가장 새것을 쓰고 나머지는 extra
  async function list() {
    const q = encodeURIComponent(`name='${NAME}' or name='${PREV}'`);
    const r = await call(`${API}?spaces=appDataFolder&q=${q}&fields=${encodeURIComponent(`files(${FIELDS})`)}&pageSize=20`);
    const files = ((await r.json()).files || []).map(metaOf);
    const g = newest(files.filter(f => f.name === NAME)), p = newest(files.filter(f => f.name === PREV));
    return { garden: g[0] || null, prev: p[0] || null, extra: [...g.slice(1), ...p.slice(1)] };
  }
  async function read(id) { return (await call(`${API}/${encodeURIComponent(id)}?alt=media`)).text(); }
  // 저장: 지금 garden.json은 이름을 garden.prev.json으로 바꿔 직전 저장본이 되고(예전 직전본은 지움), 새 garden.json을 만듦.
  // garden.json이 없고 직전본만 있으면(지난번 저장이 중간에 끊김) 직전본은 그대로 두고 새로 만들기만 함
  // props: { gardenId, savedAt, firstVisit, reward, season } → appProperties. opt.keepalive: 닫을 때 (브라우저가 64KB까지만 받아 줌)
  async function write(text, props, cur, opt) {
    cur = cur || await list();
    const ka = !!(opt && opt.keepalive) && text.length < 60000;
    if (cur.garden) {
      if (cur.prev) await call(`${API}/${encodeURIComponent(cur.prev.id)}`, { method: 'DELETE', keepalive: ka });
      await call(`${API}/${encodeURIComponent(cur.garden.id)}`, { method: 'PATCH', keepalive: ka, headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify({ name: PREV }) });
    }
    const appProperties = {};
    for (const k of Object.keys(props || {})) if (props[k] != null) appProperties[k] = String(props[k]);
    const boundary = 'doris-garden-' + Date.now().toString(36);
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: NAME, parents: ['appDataFolder'], mimeType: 'application/json', appProperties })}\r\n`
      + `--${boundary}\r\nContent-Type: application/json\r\n\r\n${text}\r\n--${boundary}--`;
    const r = await call(`${UPLOAD}?uploadType=multipart&fields=${encodeURIComponent(FIELDS)}`, { method: 'POST', keepalive: ka, headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
    const made = metaOf(await r.json());
    for (const x of cur.extra || []) await call(`${API}/${encodeURIComponent(x.id)}`, { method: 'DELETE' }).catch(() => null);   // 겹친 파일 정리 (실패해도 그만)
    return { garden: made, prev: cur.garden || cur.prev, extra: [] };
  }
  // 로그인한 계정 이름 (openid · email · profile 범위) — 설정 줄에 "○○@gmail.com"
  async function userinfo() { return (await call(USERINFO)).json(); }
  return { list, read, write, userinfo };
}

const api = { makeDrive, driveError, metaOf, NAME, PREV, API, UPLOAD, USERINFO };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Drive = api;
})(typeof window !== 'undefined' ? window : globalThis);
