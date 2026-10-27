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

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
process.exit(fails ? 1 : 0);
