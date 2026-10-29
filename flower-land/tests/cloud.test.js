// ☁️ 구글 드라이브 판단 (P20-05 ~ 08): 여러 기기 비교 · 저장 간격 · 계정 첫 방문 · 앱 안 브라우저
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 }, MIN = 60 * 1000;

console.log('[여러 기기: 무엇을 쓸까 (P20-06)]');
const T = MON + 100 * H;
const D = (local, base, remote) => E.cloudDecide(local, base, remote);
check(D({ gardenId: 'a', actAt: T }, null, null).act === 'local', '드라이브가 비었으면 이 기기 것을 올림');
check(D({ gardenId: 'a', actAt: T }, { gardenId: 'a', savedAt: T }, { gardenId: 'a', savedAt: T }).act === 'local', '이 기기가 맞춘 뒤로 드라이브가 그대로면 이 기기 것');
check(D({ gardenId: 'a', actAt: T + H }, { gardenId: 'a', savedAt: T }, { gardenId: 'a', savedAt: T }).act === 'local', '그 뒤에 이 기기에서 더 했어도 이 기기 것');
check(D({ gardenId: 'a', actAt: T - H }, { gardenId: 'a', savedAt: T }, { gardenId: 'a', savedAt: T + 2 * H }).act === 'remote', '다른 기기가 저장했고 이 기기는 그 뒤로 손대지 않음 → 드라이브 것을 자동으로');
const both = D({ gardenId: 'a', actAt: T + H }, { gardenId: 'a', savedAt: T }, { gardenId: 'a', savedAt: T + 2 * H });
check(both.act === 'ask' && both.why === 'both', '두 기기 모두 맞춘 뒤에 손댔으면 묻기 (저장 직전 확인, P20-06-04)');
const other = D({ gardenId: 'b', actAt: T }, null, { gardenId: 'a', savedAt: T - H });
check(other.act === 'ask' && other.why === 'other', '다른 정원이면 묻기 (P20-06-03)');
check(D({ gardenId: 'b', actAt: T }, { gardenId: 'a', savedAt: T }, { gardenId: 'a', savedAt: T }).act === 'local', '처음부터 다시 시작 · 파일 불러오기로 이 기기 정원이 바뀌어도, 드라이브가 그대로면 이 기기 것');
check(D({ gardenId: 'b', actAt: T }, { gardenId: 'a', savedAt: T }, { gardenId: 'a', savedAt: T + H }).act === 'ask', '그 사이 다른 기기가 옛 정원을 저장했으면 묻기');
check(D({ gardenId: 'a', actAt: T }, null, { gardenId: 'a', savedAt: T + H }).act === 'remote', '이 기기에서 처음 맞춤 · 같은 정원 → 늦은 쪽(드라이브)');
check(D({ gardenId: 'a', actAt: T + H }, null, { gardenId: 'a', savedAt: T }).act === 'local', '이 기기에서 처음 맞춤 · 같은 정원 → 늦은 쪽(이 기기)');
check(D({ gardenId: 'a', actAt: null }, null, { gardenId: 'a', savedAt: T }).act === 'remote', '언제 손댔는지 모르는 예전 정원이면 드라이브 것');
const close = D({ gardenId: 'a', actAt: T + 30 * 1000 }, null, { gardenId: 'a', savedAt: T });
check(close.act === 'ask' && close.why === 'close', '처음 맞추는데 두 저장이 1분 안이면 애매해서 묻기');

console.log('[저장 간격 (P20-05-02)]');
check(E.cloudDue(T, null, 'month'), '처음 저장은 바로');
check(!E.cloudDue(T + 4 * MIN, T, 'month') && !E.cloudDue(T + 4 * MIN, T, 'title'), '달 · 칭호는 5분 안에 다시 저장하지 않음');
check(E.cloudDue(T + 5 * MIN, T, 'month'), '5분이 지나면 저장');
check(['close', 'now', 'login', 'pick'].every(w => E.cloudDue(T + 1000, T, w)), '닫을 때 · 지금 저장 · 로그인 · 고른 뒤는 간격과 상관없이');

console.log('[계정 첫 방문 (P20-08)]');
check(E.firstVisitOf(null, 0, undefined) === null && E.firstVisitOf(T + H, null, T) === T, '아는 날짜 중 가장 이른 것');
const st = E.create(MON, () => 0.5);
E.advance(st, MON + 30 * H, ctx);
check(st.account === null && st.actAt === null, '새 정원은 계정 기록 · 손댄 때가 비어 있음');
check(!E.applyAccount(st, null, ctx) && st.account === null, '계정 날짜가 없으면 그대로');
check(E.applyAccount(st, T, ctx) === true, '계정 날짜가 있으면 새 정원에 이어 붙임');
check(st.titles.t_visit != null && st.journal.done.c0_visit != null, '「정원 문을 연 사람」과 0장 퀘스트가 생김');
check(!st._newTitles || !st._newTitles.includes('t_visit'), '얻는 연출은 다시 띄우지 않음');
check(st.account.firstVisit === T && st.account.gave === true && st.log.some(l => l.text.includes('계정의 첫 방문')), '정원에 계정 날짜 · 일지 한 줄');
check(E.applyAccount(st, T - H, ctx) === false && st.account.firstVisit === T - H, '더 이른 날짜를 알게 되면 날짜만 바뀌고 칭호는 그대로');
check(E.applyAccount(st, T + H, ctx) === false && st.account.firstVisit === T - H, '늦은 날짜로는 바뀌지 않음');
st.onboarded = true; E.checkJournal(st, ctx);
check(!st._newTitles || !st._newTitles.includes('t_visit'), '첫 안내에서 시작해도 첫 방문 연출이 다시 뜨지 않음');
const own = E.create(MON, () => 0.5); own.onboarded = true; E.checkJournal(own, ctx); const had = own.titles.t_visit;
E.applyAccount(own, T, ctx);
check(own.titles.t_visit === had && own.account.firstVisit === T && !own.account.gave, '이미 얻은 칭호는 그대로 두고 계정 날짜만 적음');

console.log('[앱 안 브라우저 (P20-07)]');
const UA = {
  kakaoA: 'Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 KAKAOTALK/10.8.5',
  instaI: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 345.0.0.0 (iPhone15,2; iOS 17_5; ko_KR)',
  fbA: 'Mozilla/5.0 (Linux; Android 13; Pixel 7; wv) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/470.0.0.0;]',
  lineI: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.5.0',
  gsaI: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/330.0.0 Mobile/15E148 Safari/604.1',
  naverA: 'Mozilla/5.0 (Linux; Android 14; SM-S911N; wv) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36 NAVER(inapp; search; 2000; 12.8.1)',
  chromeA: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  safariI: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  desk: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
};
const ia = k => E.inAppBrowser(UA[k]);
check(ia('kakaoA').app === 'kakao' && ia('kakaoA').os === 'android', '카카오톡 안드로이드');
check(ia('instaI').app === 'instagram' && ia('instaI').os === 'ios', '인스타그램 iPhone');
check(ia('fbA').app === 'facebook' && ia('lineI').app === 'line' && ia('naverA').app === 'naver', '페이스북 · 라인 · 네이버');
check(ia('gsaI').app === 'google' && ia('gsaI').os === 'ios', '구글 앱 (iPhone)');
check(E.inAppBrowser('Mozilla/5.0 (Linux; Android 13; SM-A536N; wv) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36').app === 'webview', '이름 모를 안드로이드 웹뷰');
check(ia('chromeA') === null && ia('safariI') === null && ia('desk') === null && E.inAppBrowser('') === null, 'Chrome · Safari · PC 브라우저는 앱 안 아님');
const URL1 = 'https://ff-1204.github.io/doris-garden/#x';
check(E.outsideUrl(URL1, ia('kakaoA')) === 'kakaotalk://web/openExternal?url=' + encodeURIComponent('https://ff-1204.github.io/doris-garden/'), '카카오톡은 자기 바깥 브라우저 주소');
check(E.outsideUrl(URL1, ia('fbA')) === 'intent://ff-1204.github.io/doris-garden/#Intent;scheme=https;package=com.android.chrome;end', '안드로이드는 Chrome intent 주소 (# 뒤는 뗌)');
check(E.outsideUrl('http://localhost:5173/', ia('naverA')).includes('scheme=http;'), '주소의 http · https를 그대로');
check(E.outsideUrl(URL1, ia('instaI')) === null && E.outsideUrl(URL1, null) === null, 'iPhone 앱 안 · 바깥 브라우저는 주소 없음 (메뉴 안내 · 주소 복사)');

console.log('[첫 누름에 조용히 다시 받기 (P20-04-03)]');
const A = o => E.cloudAutoOk(Object.assign({ on: true, inApp: null, email: 'a@b.c', tokenOk: false, ready: true, waiting: false, failed: false, tried: null, exp: 0 }, o));
check(A({}), '새로 연 페이지 · 로그인해 둔 기기 · 토큰 없음 → 첫 누름에 해 봄');
check(!A({ tried: 0 }), '이 페이지에서 이미 해 봤으면(토큰 없음 그대로) 다시 안 함');
check(!A({ failed: true }) && !A({ failed: true, exp: T, tried: 0 }), '한 번 실패하면 그 페이지에서는 더 안 함 (누를 때마다 창이 뜨지 않게)');
check(A({ exp: T, tried: 0 }), '받은 토큰이 1시간 뒤 끝나면 다음 누름에 한 번 더');
check(!A({ exp: T, tried: T }), '같은 토큰 끝남에는 한 번만');
check(!A({ tokenOk: true }), '토큰이 살아 있으면 안 함');
check(!A({ email: '' }) && !A({ email: undefined }), '로그인한 적 없거나 로그아웃했으면 안 함');
check(!A({ on: false }), '클라이언트 ID가 비면 안 함');
check(!A({ inApp: { app: 'kakao', os: 'android' } }), '앱 안 브라우저에서는 안 함');
check(!A({ ready: false }), '구글 스크립트가 아직이면 이번 누름은 넘김 (다음 누름에)');
check(!A({ waiting: true }), '이미 로그인 창을 기다리는 중이면 안 함 (이중 요청 없음)');

console.log('[기억한 토큰 (P20-04-03, 10-27 변경)]');
const tok = { token: 'x', exp: T + H, email: 'a@b.c' };
check(E.cloudTokenUse(tok, 'a@b.c', T), '같은 계정 · 1시간 남음 → 새로고침해도 그 토큰을 씀 (창 없음)');
check(!E.cloudTokenUse(tok, 'a@b.c', T + H - 30 * 1000), '1분 안에 끝나면 안 씀');
check(!E.cloudTokenUse(tok, 'a@b.c', T + 2 * H), '끝났으면 안 씀');
check(!E.cloudTokenUse(tok, 'other@b.c', T), '다른 계정 기록이면 안 씀');
check(!E.cloudTokenUse(tok, '', T) && !E.cloudTokenUse(tok, undefined, T), '로그아웃했으면(이메일 없음) 안 씀');
check(!E.cloudTokenUse(null, 'a@b.c', T) && !E.cloudTokenUse({ exp: T + H, email: 'a@b.c' }, 'a@b.c', T) && !E.cloudTokenUse({ token: 'x', email: 'a@b.c' }, 'a@b.c', T), '없거나 깨진 기록은 안 씀');
check(E.cloudAutoOk({ on: true, email: 'a@b.c', tokenOk: E.cloudTokenUse(tok, 'a@b.c', T), ready: true, tried: null, exp: tok.exp }) === false, '기억한 토큰을 쓰면 첫 누름 창도 안 뜸');

console.log('[🌸 철 수가 다른 두 정원 (P28-08 열린 질문 ③)]');
{ const g = E.create(MON, () => 0.5);
  check(E.saveSummary(g).season === 1 && E.makeSave(g, T).summary.season === 1, '저장 요약에 몇 철 (season)');
  const other = D({ gardenId: 'b', actAt: T, season: 1 }, null, { gardenId: 'a', savedAt: T - H, season: 3 });
  check(other.act === 'ask' && other.why === 'other' && other.first === 'remote' && other.seasons.local === 1 && other.seasons.remote === 3, '다른 정원 · 철이 다름 → 묻고, 철이 큰 쪽(드라이브)을 먼저');
  const flip = D({ gardenId: 'b', actAt: T, season: 2 }, null, { gardenId: 'a', savedAt: T - H, season: 1 });
  check(flip.first === 'local', '이 기기 정원이 철이 크면 이 기기 것을 먼저');
  const firstSync = D({ gardenId: 'a', actAt: T + H, season: 1 }, null, { gardenId: 'a', savedAt: T, season: 2 });
  check(firstSync.act === 'ask' && firstSync.why === 'season' && firstSync.first === 'remote', '같은 정원(새 철은 이름표 그대로)을 처음 맞추는데 철이 다르면 늦은 쪽을 자동으로 고르지 않고 묻기');
  const sameS = D({ gardenId: 'a', actAt: T + H, season: 2 }, null, { gardenId: 'a', savedAt: T, season: 2 });
  check(sameS.act === 'local' && sameS.why === 'older' && !sameS.first && sameS.seasons.local === 2, '철이 같으면 전처럼 늦은 쪽 (먼저 보일 쪽 없음)');
  check(D({ gardenId: 'a', actAt: T - H, season: 1 }, { gardenId: 'a', savedAt: T }, { gardenId: 'a', savedAt: T + 2 * H, season: 2 }).act === 'remote', '다른 기기가 새 철을 시작해 저장했고 이 기기는 그 뒤로 손대지 않음 → 드라이브 것을 자동으로');
  const both = D({ gardenId: 'a', actAt: T + H, season: 1 }, { gardenId: 'a', savedAt: T }, { gardenId: 'a', savedAt: T + 2 * H, season: 2 });
  check(both.act === 'ask' && both.why === 'both' && both.first === 'remote', '두 기기 모두 손댔으면 묻고 새 철 쪽을 먼저');
  const noS = D({ gardenId: 'a', actAt: T + H }, null, { gardenId: 'a', savedAt: T });
  check(noS.act === 'local' && !('seasons' in noS), '철을 모르는 예전 요약이면 전과 같음');
  // 완전 초기화(resetAt)와 다름: 새 철 정원은 계정 칭호를 이어 붙이는 규칙 그대로 (resetAt을 건드리지 않음)
  const sz = E.create(MON, () => 0.5); sz.season.n = 2;
  check(sz.resetAt === null && E.applyAccount(sz, MON - H, ctx) === true && sz.titles.t_visit != null, '새 철 정원엔 계정 첫 방문을 그대로 이어 붙임 (완전 초기화만 막힘)'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
process.exit(fails ? 1 : 0);
