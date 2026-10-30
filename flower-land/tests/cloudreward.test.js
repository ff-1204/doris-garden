// ☁️ 구름 정원사 (P20-16, 10-27): 처음 로그인해 드라이브와 맞춘 정원에 덤 칭호 + 구름 돌. 연출은 계정마다 한 번, 돈 · 씨앗은 없음
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
const Drive = require(require('path').join(__dirname, '..', 'drive.js'));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 }, T = MON + 100 * H;
const fresh = () => { const s = E.create(MON, () => 0.5); s.onboarded = true; E.checkJournal(s, ctx); s._newTitles = []; return s; };

console.log('[줄지 · 연출할지]');
const P = E.cloudRewardPlan;
check(P(false, null).give && P(false, null).show, '처음 받는 계정 · 받지 않은 정원 → 주고 연출');
check(P(false, T).give && !P(false, T).show, '이미 받은 계정 · 새 정원 → 주되 연출 없이');
check(!P(true, null).give && !P(true, T).give && !P(true, T).show, '이미 받은 정원 → 다시 주지 않음');

console.log('[처음 로그인]');
const st = fresh(), money = st.money, items = st.items.length, logs = st.log.length;
const r = E.giveCloudReward(st, null, T, ctx);
check(r && r.at === T && r.show === true, '계정이 받은 때 = 지금 · 연출함');
check(st.titles.t_cloud != null && st._newTitles.includes('t_cloud'), '칭호 「구름 정원사」 · 얻는 연출 대기열에');
check(st.decos.some(d => d.key === 'cloudstone' && d.x == null) && st.dex.deco.cloudstone, '구름 돌이 창고에 (놓지 않은 채) · 꾸밈 도감에');
check(st.decos.some(d => d.key === 't:t_cloud'), '칭호 문장 장식도 함께 (P17-16-06)');
check(st.money === money && st.items.length === items, '돈 · 씨앗은 주지 않음');
check(st.account && st.account.reward === T, '정원에 계정이 받은 때를 적음');
check(st.log.length > logs && st.log.some(l => l.text.includes('구름 정원사')), '정원 일지에 🏅 한 줄');
check(E.giveCloudReward(st, T, T + H, ctx) === null && st.decos.filter(d => d.key === 'cloudstone').length === 1, '같은 정원에 두 번 주지 않음 (두 번째 로그인)');
check(E.giveCloudReward(st, null, T + H, ctx) === null, '계정 기록을 잃어도 이 정원은 다시 받지 않음');

console.log('[이미 받은 계정 · 새 기기 · 다시 시작한 정원]');
const nw = fresh(), r2 = E.giveCloudReward(nw, T - H, T, ctx);
check(r2 && r2.at === T - H && r2.show === false, '계정 날짜 그대로 · 연출 없음');
check(nw.titles.t_cloud != null && !nw._newTitles.includes('t_cloud'), '칭호는 주고 연출 대기열엔 넣지 않음');
check(nw.decos.filter(d => d.key === 'cloudstone').length === 1, '구름 돌도 하나');
check(nw.log.some(l => l.text.includes('이어 붙였어요')), '일지에 "이어 붙였어요" 한 줄');
E.applyAccount(nw, T - 2 * H, ctx);
check(nw.account.reward === T - H && nw.account.firstVisit === T - 2 * H, '첫 방문 이어 붙이기(P20-08)가 받은 때를 지우지 않음');

console.log('[총수: 덤 칭호 · 덤 장식은 따로 셈]');
check(E.TITLE_KEYS.length === 19 && !E.TITLE_KEYS.includes('t_cloud') && E.EXTRA_TITLE_KEYS[0] === 't_cloud' && E.EXTRA_TITLE_KEYS.slice(1).every(k => E.TITLES[k].season || E.TITLES[k].path || E.TITLES[k].mut), '칭호 19개는 그대로 · 구름 정원사 · 철 칭호(P28-08-04) · 길 칭호(P30-04-01) · 🧬 돌연변이 칭호(P36)는 덤');
check(!E.DECO_KEYS.includes('cloudstone') && E.EXTRA_DECO_KEYS.join() === 'cloudstone', '구름 돌은 덤 장식');
const before = fresh(), after = fresh(); E.giveCloudReward(after, null, T, ctx);
check(E.decoTotal() === E.DECO_KEYS.length + E.GRADE_DECO_KEYS.length + E.TITLE_KEYS.length && E.decoCount(after) === E.decoCount(before), '꾸밈 도감 칸 · 모은 수에 넣지 않음');
check(E.decoExtras(after).join() === 'cloudstone,t:t_cloud' && E.decoExtras(before).length === 0, '가진 덤 장식만 따로 보여 줌');
check(E.dexCount(after) === E.dexCount(before) && E.dexTotal(after) === E.dexTotal(before), '기본 도감 93칸과 상관없음');
check(!E.decoOffer({ month: 3 }).includes('cloudstone') && !E.buyDeco(after, 'cloudstone', ctx).ok, '화원에서 팔지 않음');
const pl = after.decos.find(d => d.key === 'cloudstone');
check(E.placeDeco(after, pl.id, 0, 0).ok && E.decoAt(after, 0, 0) === pl, '정원에 놓을 수 있음');
E.checkJournal(after, ctx);
check(after.titles.t_cloud != null, '도감일지 판정이 덤 칭호를 건드리지 않음');

console.log('[저장 · 드라이브 요약]');
const back = E.parseSave(JSON.stringify(E.makeSave(after, T)));
check(back.ok && back.data.game.titles.t_cloud != null && back.data.game.account.reward === T, '저장 파일에 칭호 · 받은 때가 남음');
const m = E.migrateSave(JSON.parse(JSON.stringify(after)));
check(m && m.titles.t_cloud != null && m.decos.some(d => d.key === 'cloudstone'), '다시 열어도 그대로 (새 칸 없음 · account 안에 reward)');
check(Drive.metaOf({ id: 'x', name: 'garden.json', appProperties: { gardenId: 'a', savedAt: String(T), reward: String(T - H) } }).reward === T - H, '드라이브 appProperties의 reward를 읽음');
check(Drive.metaOf({ id: 'x', name: 'garden.json', appProperties: { gardenId: 'a', savedAt: String(T) } }).reward === null, '예전 파일엔 reward 없음(null)');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
process.exit(fails ? 1 : 0);
