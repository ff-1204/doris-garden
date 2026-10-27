// 처음부터 다시 시작 = 완전 초기화 (P16-12-03 변경 10-27, 사용자 요청): 저장 키 전부 · 설정 · 로그인을 지우고, 다시 시작한 정원엔 계정 칭호를 잇지 않음
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 }, T = MON + 100 * H;
const KEY = 'flower-land-v3';

console.log('[지울 키]');
const keys = [KEY, KEY + '-undo', KEY + '-broken', KEY + '-zoomhint', KEY + '-cloud', KEY + '-cloud-token', 'flower-land-v2', 'flower-land-v30', 'other-app', 'bak-flower-land-v3'];
const del = E.resetKeys(keys, KEY);
check([KEY, KEY + '-undo', KEY + '-broken', KEY + '-zoomhint', KEY + '-cloud', KEY + '-cloud-token'].every(k => del.includes(k)), '정원 · 되돌리기 칸 · 보관본 · 안내 표시 · 로그인 기록 · 토큰 모두');
check(del.length === 6 && !del.includes('flower-land-v2') && !del.includes('flower-land-v30') && !del.includes('other-app'), '다른 판 · 다른 사이트 키는 남김');
check(E.resetKeys([], KEY).length === 0, '빈 저장소');

console.log('[새로 만든 정원]');
const fresh = E.create(T, () => 0.5);
check(fresh.resetAt === null && fresh.onboarded !== true, '새 정원은 resetAt 없음 · 첫 안내부터');
check(JSON.stringify(fresh.settings) === JSON.stringify(E.create(MON, () => 0.5).settings), '설정은 처음 값');

console.log('[다시 시작한 정원: 계정 칭호를 잇지 않음]');
const rs = E.create(T, () => 0.5); rs.resetAt = T;
check(E.applyAccount(rs, T - 10 * H, ctx) === false && rs.titles.t_visit == null, '계정의 「정원 문을 연 사람」을 이어 붙이지 않음');
check(rs.account && rs.account.firstVisit === T - 10 * H && !rs.account.gave, '계정 날짜는 기록만 (새 기기에서 쓸 수 있게)');
rs.onboarded = true; rs._newTitles = []; E.checkJournal(rs, ctx);
check(rs.titles.t_visit != null && rs._newTitles.includes('t_visit'), '첫 안내에서 시작하면 다시 얻음 (연출도)');
const r = E.giveCloudReward(rs, T - 5 * H, T, ctx);
check(E.cloudRewardPlan(false, T, true).show && r && r.show === true && rs._newTitles.includes('t_cloud'), '받은 계정이어도 조용히 이어 받지 않음 — 로그인해서 다시 얻음 (연출)');
check(r.at === T - 5 * H, '계정이 처음 받은 때는 그대로');
check(E.giveCloudReward(rs, T - 5 * H, T + H, ctx) === null, '이 정원에서도 한 번만');

console.log('[새 기기는 P20-08 · P20-16 그대로]');
const dev = E.create(T, () => 0.5);
check(E.applyAccount(dev, T - 10 * H, ctx) === true && dev.titles.t_visit != null, '새 기기 정원엔 계정 첫 방문을 이어 붙임');
const r2 = E.giveCloudReward(dev, T - 5 * H, T, ctx);
check(r2 && r2.show === false, '새 기기 정원엔 구름 정원사를 조용히 이어 붙임');

console.log('[다시 로그인: 다시 시작한 정원 ↔ 드라이브의 예전 정원 (cloudDecide)]');
// 지운 뒤라 이 기기가 맞춘 판(base)이 없음 · 이 정원은 새 이름표
const d1 = E.cloudDecide({ gardenId: rs.gardenId, actAt: T + H }, null, { gardenId: 'old-garden', savedAt: T - H });
check(d1.act === 'ask' && d1.why === 'other', '드라이브에 예전 정원이 있으면 "어느 정원을 쓸까요?"');
const d2 = E.cloudDecide({ gardenId: rs.gardenId, actAt: null }, null, { gardenId: 'old-garden', savedAt: T + 2 * H });
check(d2.act === 'ask', '손대지 않았어도 묻기 (덮어쓰지 않음)');
check(E.cloudDecide({ gardenId: rs.gardenId, actAt: T }, null, null).act === 'local', '드라이브가 비었으면 다시 시작한 정원을 올림');

console.log('[저장 · 예전 정원]');
const back = E.parseSave(JSON.stringify(E.makeSave(rs, T)));
check(back.ok && back.data.game.resetAt === T, '저장 파일 · 드라이브에도 표시가 남음 (다른 기기에서 받아도 이 정원은 잇지 않음)');
const old = JSON.parse(JSON.stringify(fresh)); delete old.resetAt; old.mig = E.MIGRATIONS.length - 1;
const m = E.migrateSave(old);
check(m && m.resetAt === null && m.mig === E.MIGRATIONS.length, '예전 정원은 resetAt null (MIGRATIONS 마지막)');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
process.exit(fails ? 1 : 0);
