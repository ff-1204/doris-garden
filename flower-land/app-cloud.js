// 도리의 정원 — ☁️ 구글 로그인 · 드라이브 저장 (P20-04 ~ 08, 10-27)
// 통신은 drive.js, 판단(여러 기기 · 간격 · 계정 첫 방문)은 engine.js. 여기는 토큰 · 창 · 표시 · 언제 저장할지만
'use strict';

// P20-09-06 클라이언트 ID: Google Cloud 콘솔 › 클라이언트(웹 애플리케이션)의 "…apps.googleusercontent.com". 공개돼도 되는 값
// 클라이언트 보안 비밀(secret)은 쓰지 않고 어디에도 적지 않음. 비어 있으면 ☁️ 화면이 모두 숨고 지금 게임과 똑같음
const GOOGLE_CLIENT_ID = '15931935276-vdbrlr9rn4koe7nfpk7v0edf2dd9sn1v.apps.googleusercontent.com';
const CLOUD_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';   // P20-04-01 드라이브는 앱 전용 숨김 폴더만
const CLOUD_SCOPES = `${CLOUD_SCOPE} openid email profile`;              // + 계정 이름 표시
const CLOUD_KEY = KEY + '-cloud';   // 이 기기 기록 { email, base: { gardenId, savedAt }, lastAt, firstVisit } — 토큰은 넣지 않음 (메모리에만, P20-04-03)
const cloud = {
  on: !!GOOGLE_CLIENT_ID, inApp: IN_APP_INFO,
  meta: (() => { try { return JSON.parse(localStorage.getItem(CLOUD_KEY)) || {}; } catch (e) { return {}; } })(),
  lib: null, client: null, token: null, exp: 0, waiters: [],
  state: 'idle',            // idle · saving · saved · offline · error · relogin · ask
  remote: null,             // 마지막으로 본 드라이브 목록 { garden, prev }
  busy: false, pending: null, timer: null, checkedAt: 0, recheck: false, askData: null, seen: null,
  autoTried: null, autoFailed: false,   // 첫 누름에 조용히 다시 받기 (P20-04-03): 마지막으로 해 본 토큰의 exp · 이 페이지에서 실패함
};
const cloudIn = () => cloud.on && !cloud.inApp && !!cloud.meta.email;
function cloudSaveMeta() { try { if (cloud.meta.email) localStorage.setItem(CLOUD_KEY, JSON.stringify(cloud.meta)); else localStorage.removeItem(CLOUD_KEY); } catch (e) { /* 무시 */ } }

// ---- 토큰 (Google Identity Services 토큰 방식)
// 구글 스크립트는 ☁️ 줄이 보일 때(설정)나 로그인해 둔 기기에서만 불러옴 — 그 밖엔 구글에 접속하지 않음
function cloudLib() {
  if (!cloud.on || cloud.inApp) return Promise.reject(new Error('off'));
  if (cloud.lib) return cloud.lib;
  cloud.lib = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => {
      try { cloud.client = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: CLOUD_SCOPES, callback: cloudOnToken, error_callback: cloudOnTokenError }); res(); }
      catch (e) { rej(e); }
    };
    s.onerror = () => { cloud.lib = null; s.remove(); rej(new Error('load')); };
    document.head.appendChild(s);
  });
  return cloud.lib;
}
// 토큰 받기: 팝업이라 누를 때(사용자 동작 안)만 부름. 이미 허락한 계정은 창이 잠깐 열렸다 바로 닫힘
function cloudRequest(first) {
  if (!cloud.client) { cloudLib().catch(() => null); return Promise.reject(Object.assign(new Error('notready'), { kind: 'notready' })); }
  return new Promise((res, rej) => {
    const w = { res, rej, t: setTimeout(() => { cloud.waiters = cloud.waiters.filter(x => x !== w); rej(Object.assign(new Error('timeout'), { kind: 'popup' })); }, 120000) };
    const asking = cloud.waiters.length > 0;                   // 이미 창이 떠 있으면 그 답을 같이 기다림 (이중 요청 없음)
    cloud.waiters.push(w);
    if (!asking) cloud.client.requestAccessToken(first || !cloud.meta.email ? { prompt: 'select_account' } : { prompt: '', login_hint: cloud.meta.email });
  });
}
function cloudOnToken(r) {
  const ws = cloud.waiters.splice(0); ws.forEach(w => clearTimeout(w.t));
  if (r.error) return ws.forEach(w => w.rej(Object.assign(new Error(r.error), { kind: 'denied' })));
  if (!google.accounts.oauth2.hasGrantedAllScopes(r, CLOUD_SCOPE)) return ws.forEach(w => w.rej(Object.assign(new Error('scope'), { kind: 'scope' })));
  cloud.token = r.access_token; cloud.exp = Date.now() + (+r.expires_in || 3600) * 1000; cloud.autoFailed = false;   // 받았으면 다음 끝남에 다시 한 번
  ws.forEach(w => w.res(cloud.token));
}
function cloudOnTokenError(e) { const ws = cloud.waiters.splice(0); ws.forEach(w => { clearTimeout(w.t); w.rej(Object.assign(new Error(e && e.type), { kind: 'popup' })); }); }
const cloudTokenOk = () => !!cloud.token && Date.now() < cloud.exp - 60 * 1000;
// 드라이브 통신 층에 주는 토큰: 1분 넘게 남은 것만. 없으면 auth 실패 → "다시 로그인해 주세요" (하던 일은 막지 않음)
const cloudDrive = Drive.makeDrive((u, o) => fetch(u, o), async () => { if (cloudTokenOk()) return cloud.token; throw Drive.driveError('auth', 0); });

// ---- 표시
const CLOUD_LABEL = { saving: '저장 중', saved: '저장됨', offline: '연결되면 저장해요', error: '저장 못 했어요', relogin: '다시 로그인해 주세요', ask: '어느 정원을 쓸까요?' };
function cloudSet(state, pending) {
  cloud.state = state;
  if (pending) cloud.pending = pending;
  cloudTop(); cloudPaint();
}
// 위 막대의 작은 ☁️ (P20-04-02): 로그인했을 때만
function cloudTop() {
  const b = $('#topCloud'); if (!b) return;
  const on = cloudIn(), s = cloud.state, label = CLOUD_LABEL[s] || '';
  const key = on ? `${s}|${cloud.meta.lastAt || ''}` : '';
  if (b.dataset.k === key) return;
  b.dataset.k = key; b.hidden = !on;
  if (!on) return;
  b.classList.toggle('warn', ['offline', 'error', 'relogin', 'ask'].includes(s));
  b.innerHTML = `<span aria-hidden="true">☁️</span>${label ? `<small>${label}</small>` : ''}`;
  b.title = `구글 드라이브 · ${s === 'saved' && cloud.meta.lastAt ? `${whenText(cloud.meta.lastAt)} 저장` : label || '로그인됨'}`;
  b.setAttribute('aria-label', b.title);
}
// ⚙️ 설정 › 💾 저장 맨 위 ☁️ 줄 (renderSettings가 row 도우미를 넘겨 줌)
let cloudRowFn = null;
function cloudRows(row) {
  if (row) cloudRowFn = row; else row = cloudRowFn;
  if (!cloud.on || !row) return '';
  if (cloud.inApp) {
    const url = E.outsideUrl(location.href, cloud.inApp);
    return row('☁️', '구글 드라이브에 저장', '앱 안의 브라우저에서는 구글 로그인이 안 돼요. Chrome이나 Safari로 열어 주세요 · 여기 정원은 💾 저장하기로 옮길 수 있어요',
      `<span class="row cloud-btns" style="gap:6px"><button type="button" class="btn small" data-cloud="copy">주소 복사</button><button type="button" class="btn small" data-cloud="${url ? 'outside' : 'guide'}">${url ? (cloud.inApp.app === 'kakao' ? '바깥 브라우저로' : 'Chrome으로 열기') : '여는 법'}</button></span>`);
  }
  if (!cloudIn()) return row('☁️', '구글 드라이브에 저장', '로그인하면 내 구글 드라이브의 앱 전용 숨김 폴더에 정원을 저장해요 · 다른 기기에서 이어 할 수 있어요', '<button type="button" class="btn small" data-cloud="login">구글로 로그인</button>');
  const m = cloud.meta, s = cloud.state, warn = ['offline', 'error', 'relogin', 'ask'].includes(s);
  const prev = cloud.remote && cloud.remote.garden && cloud.remote.prev;
  return row('☁️', '구글 드라이브', `<span class="cloud-mail">${esc(m.email)}</span> · ${m.lastAt ? `마지막 저장 ${whenText(m.lastAt)}` : '아직 드라이브에 저장하지 않았어요'}${s === 'saving' ? ' · 저장 중' : ''}${warn ? ` · <b class="val-down">${CLOUD_LABEL[s]}</b>` : ''}`,
    `<span class="row cloud-btns" style="gap:6px"><button type="button" class="btn small" data-cloud="${s === 'relogin' ? 'relogin' : s === 'ask' ? 'ask' : 'now'}" ${cloud.busy ? 'disabled' : ''}>${s === 'relogin' ? '다시 로그인' : s === 'ask' ? '고르기' : '지금 저장'}</button><button type="button" class="btn small" data-cloud="logout">로그아웃</button></span>`)
    + (prev ? row('↩︎', '드라이브 직전 저장본', `${whenText(prev.savedAt)}에 저장한 정원 · 한 번 되돌릴 수 있어요`, '<button type="button" class="btn small" data-cloud="prev">보기</button>') : '');
}
function cloudPaint() {
  const el = $('#cloudRows'); if (!el) return;
  el.innerHTML = cloudRows();
  el.hidden = !el.innerHTML;
}
// 설정에 ☁️ 줄이 그려진 뒤: 로그인 단추가 바로 팝업을 열 수 있게 구글 스크립트를 미리 불러 둠
function cloudPrep() { if (cloud.on && !cloud.inApp) cloudLib().catch(() => null); }

// ---- 로그인 · 로그아웃 (P20-04)
async function cloudLogin() {
  if (cloud.inApp) return cloudInAppGuide();
  try { await cloudRequest(true); } catch (e) { return cloudFail(e, true); }
  let email = null;
  try { email = (await cloudDrive.userinfo()).email; } catch (e) { /* 이름을 못 받아도 저장은 됨 */ }
  cloud.meta = { email: email || '구글 계정' }; cloudSaveMeta();
  if (ui.tab === 'settings') renderSettings();               // 💾 저장하기 · 📂 불러오기 숨김 (P20-02)
  feedback(`☁️ ${cloud.meta.email}로 로그인했어요`);
  cloudSync('login');
}
function cloudLogout() {
  if (cloud.token && window.google) try { google.accounts.oauth2.revoke(cloud.token, () => null); } catch (e) { /* 무시 */ }   // 권한도 구글에 돌려줌
  cloud.token = null; cloud.exp = 0; cloud.meta = {}; cloud.remote = null; cloud.pending = null; cloud.askData = null;
  cloudSaveMeta(); cloudSet('idle');
  if (ui.tab === 'settings') renderSettings();               // 💾 저장하기 · 📂 불러오기 다시 보임
  feedback('로그아웃했어요 · 이 브라우저의 정원은 그대로예요 (드라이브 저장만 멈춰요)');   // P20-04-04
}
// 다시 로그인 (토큰이 끝났거나 새로 연 페이지): 누를 때 받고, 밀린 확인 · 저장을 함
async function cloudReconnect(then, quiet) {
  try { await cloudRequest(false); } catch (e) { return quiet ? cloudAutoFail() : cloudFail(e, true); }
  cloud.pending = null;
  cloudSync(then === 'now' ? 'now' : 'open');                 // 드라이브 확인 → 이 기기에서 손댄 것이 있으면 올림
}
// 첫 누름에 조용히 다시 받기 (P20-04-03, 10-27): 새로 연 페이지 · 토큰이 끝난 뒤 페이지 어디든 처음 누를 때 한 번.
// 누른 것(꽃 · 탭 …)은 그대로 하고, ☁️ 단추는 그 단추가 받음. 실패 · 창 닫힘 · 계정 고르기가 필요하면 조용히 "다시 로그인해 주세요"
function cloudAuto(e) {
  if (e.type === 'keydown' && (e.repeat || ['Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key))) return;
  if (e.target && e.target.closest && e.target.closest('#topCloud, [data-cloud]')) return;
  if (!E.cloudAutoOk({ on: cloud.on, inApp: cloud.inApp, email: cloud.meta.email, tokenOk: cloudTokenOk(), ready: !!cloud.client,
    waiting: cloud.waiters.length > 0, failed: cloud.autoFailed, tried: cloud.autoTried, exp: cloud.exp })) return;
  cloud.autoTried = cloud.exp;
  cloudReconnect(null, true);
}
function cloudAutoFail() {
  cloud.autoFailed = true;
  if (cloud.meta.email && !cloudTokenOk() && cloud.state !== 'ask') cloudSet('relogin');
}
// 앱 안 브라우저 (P20-07-02): 로그인 대신 바깥 브라우저 안내 — 💾 저장 안내 창과 같은 함수
function cloudInAppGuide() {
  outsideGuide('☁️ 구글 로그인', '앱 안의 브라우저에서는 <b>구글 로그인이 안 돼요</b> (구글이 막아 둠). Chrome이나 Safari로 열어 주세요.',
    '로그인하지 않아도 여기서 그대로 할 수 있어요. 여기 정원을 가져가려면 💾 저장하기로 파일을 만들어 두세요.', null, cloud.inApp);
}

// ---- 드라이브와 맞추기 (P20-05 · 06)
// why: login · open(앱을 열거나 돌아옴) · month · title · close(닫거나 다른 탭) · now(지금 저장) · pick(고른 뒤)
async function cloudSync(why) {
  if (!cloudIn()) return;
  if (cloud.busy) { if (why !== 'month' && why !== 'title' || !cloud.pending) cloud.pending = why; return; }
  if (cloud.state === 'ask' && why !== 'pick' && why !== 'open') return;                      // 고를 때까지 드라이브에 쓰지 않음
  const now = Date.now(), check = why === 'login' || why === 'open';
  if (!check && !E.cloudDue(now, cloud.meta.lastAt, why)) return cloudLater(why);
  if (!cloudTokenOk()) return cloudSet('relogin', why);                                       // 조용히 받을 수 없음 → 누를 때 (P20-04-03)
  if (navigator.onLine === false) return cloudSet('offline', why);                            // P20-05-03
  cloud.busy = true; cloud.pending = null; cloudSet('saving');
  try {
    const cur = await cloudDrive.list();
    cloud.remote = cur; cloud.checkedAt = Date.now();
    const remote = cur.garden || cur.prev;                                                     // garden.json이 없으면 끊긴 저장의 직전본
    // P20-08 계정 첫 방문: 드라이브 · 이 기기 · 정원이 아는 가장 이른 날, 처음 로그인이면 오늘
    const fv = E.firstVisitOf(remote && remote.firstVisit, cur.prev && cur.prev.firstVisit, cloud.meta.firstVisit, st.account && st.account.firstVisit) || now;
    if (fv !== cloud.meta.firstVisit) { cloud.meta.firstVisit = fv; cloudSaveMeta(); }
    E.applyAccount(st, fv, ctx); save();
    const d = E.cloudDecide({ gardenId: st.gardenId, actAt: st.actAt }, cloud.meta.base || null, remote);
    if (d.act !== 'local' && document.hidden) { cloud.recheck = true; return cloudSet('idle'); }   // 화면이 숨어 있으면 돌아왔을 때 (덮어쓰지 않음)
    if (d.act === 'remote') return await cloudTake(remote);
    if (d.act === 'ask') return await cloudAsk(remote, d.why);
    if (why === 'open' && d.why === 'mine' && (st.actAt || 0) <= (cloud.meta.lastAt || 0)) return cloudSet(cloud.meta.lastAt ? 'saved' : 'idle');   // 양쪽 다 새것이 없음
    await cloudPut(cur, why);
  } catch (e) { cloudFail(e); }
  finally {
    cloud.busy = false; cloudPaint();
    const p = cloud.pending;
    if (p && cloud.state !== 'relogin' && cloud.state !== 'offline' && cloud.state !== 'ask') { cloud.pending = null; setTimeout(() => cloudSync(p), 0); }
  }
}
// 5분이 안 됐으면 그때 한 번 (P20-05-02)
function cloudLater(why) {
  cloud.pending = cloud.pending || why;
  if (cloud.timer) return;
  const wait = Math.max(1000, E.CLOUD_GAP - (Date.now() - (cloud.meta.lastAt || 0)) + 500);
  cloud.timer = setTimeout(() => { cloud.timer = null; const p = cloud.pending; cloud.pending = null; if (p) cloudSync(p); }, wait);
}
// 올리기: 지금 정원 → garden.json (앞 저장은 garden.prev.json)
async function cloudPut(cur, why) {
  const now = Date.now();
  save();
  const d = E.makeSave(st, now);
  d.account = { firstVisit: cloud.meta.firstVisit || null };                                   // P20-08-01
  cloud.remote = await cloudDrive.write(JSON.stringify(d), { gardenId: st.gardenId, savedAt: now, firstVisit: cloud.meta.firstVisit }, cur, { keepalive: why === 'close' });
  cloud.meta.base = { gardenId: st.gardenId, savedAt: now }; cloud.meta.lastAt = now; cloudSaveMeta();
  cloudSet('saved');
  if (why === 'now') feedback('☁️ 드라이브에 저장했어요');
}
// 드라이브 정원 읽기 (저장 파일과 같은 검사)
async function cloudRead(meta) {
  const r = E.parseSave(await cloudDrive.read(meta.id));
  if (!r.ok) throw Object.assign(new Error('parse'), { kind: 'parse', msg: r.msg });
  return r.data;
}
// 드라이브 정원으로 바꾸기: 지금 정원은 되돌리기 칸에, 설정(알림 · 수면 시간)은 이 기기 것 그대로
function cloudUse(meta, data, msg) {
  try { localStorage.setItem(UNDO_KEY, JSON.stringify(st)); } catch (e) { /* 보관 못 해도 바꿈 */ }
  const game = data.game; game.settings = st.settings;
  cloud.meta.base = { gardenId: meta.gardenId, savedAt: meta.savedAt }; cloudSaveMeta();
  swapGarden(game, msg);
  if (cloud.meta.firstVisit) { E.applyAccount(st, cloud.meta.firstVisit, ctx); save(); }
  cloudSeen();
}
// 같은 정원 · 드라이브가 새로움 → 자동으로 + 알림 (P20-06-02)
async function cloudTake(meta) {
  const data = await cloudRead(meta);
  cloudUse(meta, data, '☁️ 다른 기기에서 한 진행을 불러왔어요');
  cloudSet('saved');
}
// 어느 정원을 쓸까요? (P20-06-03 · 04): 고르지 않은 쪽은 ↩︎ 되돌리기 칸에
async function cloudAsk(meta, why) {
  const data = await cloudRead(meta);
  cloud.askData = { meta, data, why };
  cloudSet('ask');
  cloudAskOpen();
}
function cloudAskOpen() {
  const a = cloud.askData; if (!a) return;
  const lead = a.why === 'other' ? '드라이브에 <b>다른 정원</b>이 있어요.' : a.why === 'both' ? '두 기기에서 <b>따로 이어 했어요</b>.' : '두 정원을 <b>거의 같은 때</b> 저장했어요.';
  openModal('☁️ 어느 정원을 쓸까요?', `<div class="stack" style="gap:10px"><p style="margin:0">${lead} 하나를 골라 주세요.</p>
    <div class="imp-cmp">${summaryCol('이 기기 정원', E.saveSummary(st), '이 브라우저')}<span class="imp-arrow" aria-hidden="true">·</span>${summaryCol('드라이브 정원', E.saveSummary(a.data.game), whenText(a.meta.savedAt))}</div>
    <p class="note">고르지 않은 정원은 ⚙️ 설정 › 💾 저장의 ↩︎ 되돌리기 칸에 한 번 보관돼요. 고를 때까지 드라이브에는 저장하지 않아요.</p></div>`,
    [{ label: '이 기기 정원', act: () => cloudPick('local') }, { label: '드라이브 정원', primary: true, act: () => cloudPick('remote') }]);
}
function cloudPick(side) {
  const a = cloud.askData; if (!a) return closeModal();
  cloud.askData = null; cloud.state = 'idle';
  if (side === 'remote') { cloudUse(a.meta, a.data, '☁️ 드라이브 정원으로 바꿨어요'); cloudSet('saved'); return; }
  try { localStorage.setItem(UNDO_KEY, JSON.stringify(a.data.game)); } catch (e) { /* 무시 */ }   // 드라이브 정원은 되돌리기 칸에
  cloud.meta.base = { gardenId: a.meta.gardenId, savedAt: a.meta.savedAt }; cloudSaveMeta();   // 이 기기가 본 드라이브 판 → 덮어써도 됨
  closeModal(); feedback('이 기기 정원을 써요 · 드라이브 정원은 되돌리기 칸에 보관했어요');
  if (ui.tab === 'settings') renderSettings();
  cloudSync('pick');
}
// 드라이브 직전 저장본 (P20-05-01) 보기 → 불러오기
async function cloudPrev() {
  const prev = cloud.remote && cloud.remote.prev; if (!prev) return;
  if (!cloudTokenOk()) { try { await cloudRequest(false); } catch (e) { return cloudFail(e, true); } }
  let data; try { data = await cloudRead(prev); } catch (e) { return cloudFail(e, true); }
  openModal('↩︎ 드라이브 직전 저장본', `<div class="stack" style="gap:10px"><div class="imp-cmp">${summaryCol('지금 정원', E.saveSummary(st), '이 브라우저')}<span class="imp-arrow" aria-hidden="true">›</span>${summaryCol('직전 저장본', E.saveSummary(data.game), whenText(prev.savedAt))}</div>
    <p class="note">지금 정원은 ↩︎ 되돌리기 칸에 한 번 보관돼요.</p></div>`,
    [{ label: '취소', act: closeModal }, { label: '불러오기', primary: true, act: () => { cloudUse(cloud.remote.garden, data, '↩︎ 드라이브 직전 저장본을 불러왔어요'); st.actAt = Date.now(); save(); } }]);
}
// 실패: 하던 일은 막지 않고 표시만, 다음 기회에 다시 (P20-05-03)
function cloudFail(e, loud) {
  const k = e && e.kind;
  if (k === 'offline') return cloudSet('offline');
  if (k === 'auth') { cloud.token = null; return cloudSet('relogin'); }
  if (k === 'notready') return feedback('구글 로그인을 불러오는 중이에요 · 잠시 뒤 다시 눌러 주세요', true);
  if (k === 'popup' || k === 'denied') { if (loud) feedback('로그인 창이 닫혔어요 · 다시 눌러 주세요', true); if (cloud.meta.email && !cloudTokenOk()) cloudSet('relogin'); return; }
  if (k === 'scope') { feedback('"드라이브의 앱 데이터" 권한을 허락해야 저장할 수 있어요', true); if (cloud.meta.email) cloudSet('relogin'); return; }
  if (k === 'parse') { feedback(`드라이브 정원을 열지 못했어요 · ${e.msg}`, true); return cloudSet('error'); }
  if (loud) feedback('드라이브에 저장하지 못했어요 · 다음에 다시 해요', true);
  cloudSet('error');
}

// ---- 언제 저장할까 (P20-05-02): 달이 바뀔 때 · 칭호를 얻을 때 · 닫거나 다른 탭으로 · 지금 저장
function cloudSeen() { cloud.seen = { abs: E.calendar(st.virtual).abs, titles: Object.keys(st.titles || {}).length }; }
function cloudTick() {
  if (!cloudIn()) return;
  const abs = E.calendar(st.virtual).abs, n = Object.keys(st.titles || {}).length, s = cloud.seen;
  if (!s) return cloudSeen();
  if (n > s.titles) { cloudSeen(); return cloudSync('title'); }
  if (abs !== s.abs) { cloudSeen(); return cloudSync('month'); }
}
// 처음부터 다시 시작한 정원 (P20-08-02): 계정에 첫 방문이 있으면 칭호를 이어 붙이고 연출은 띄우지 않음
function cloudNewGarden() {
  if (!cloudIn() || !cloud.meta.firstVisit) return;
  E.applyAccount(st, cloud.meta.firstVisit, ctx);
  st.actAt = Date.now();
}
// 화면이 다 불린 뒤(app-main) 한 번
function cloudStart() {
  if (!cloud.on) return;
  cloudSeen();
  if (cloudIn()) { cloudLib().catch(() => null); cloudSet('relogin', 'open'); }   // 새로 연 페이지엔 토큰이 없음 → 처음 누를 때 조용히 맞춤 (안 되면 ☁️를 눌러서)
  ['click', 'keydown'].forEach(t => document.addEventListener(t, cloudAuto, true));   // 막지 않고 보기만 (capture · preventDefault 없음)
  setInterval(cloudTick, 2000);
  document.addEventListener('visibilitychange', () => {
    if (!cloudIn()) return;
    if (document.hidden) return cloudSync('close');
    if (cloud.recheck || Date.now() - cloud.checkedAt > 60 * 1000) { cloud.recheck = false; cloudSync('open'); }   // 다른 기기에서 했을 수 있음 (P20-06-01)
  });
  window.addEventListener('online', () => { if (cloudIn() && cloud.state === 'offline') cloudSync(cloud.pending || 'now'); });
}

// ---- 단추
$('#p-settings').addEventListener('click', e => {
  const b = e.target.closest('[data-cloud]'); if (!b) return;
  const k = b.dataset.cloud;
  if (k === 'login') return cloudLogin();
  if (k === 'logout') return cloudLogout();
  if (k === 'relogin') return cloudReconnect();
  if (k === 'ask') return cloudAskOpen();
  if (k === 'prev') return cloudPrev();
  if (k === 'copy') return copyAddress();
  if (k === 'outside') { const u = E.outsideUrl(location.href, cloud.inApp); if (u) location.href = u; return; }
  if (k === 'guide') return cloudInAppGuide();
  if (k === 'now') return cloudTokenOk() ? cloudSync('now') : cloudReconnect('now');
});
$('#topCloud').addEventListener('click', () => {
  if (cloud.state === 'relogin') return cloudReconnect();
  if (cloud.state === 'ask') return cloudAskOpen();
  setTab('settings');
});
