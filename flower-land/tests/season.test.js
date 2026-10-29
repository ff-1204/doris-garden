// 🌸 새 철 다시 시작 (P28-08, M3-3 10-30): 조건 · 꽃잠에만 · 이어지는 것 · 비워지는 것 · 손길 점 그대로 · 철 칭호 · 해마다 기록 철 번호 · 재촉 없음
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, WEEK = 7 * 24 * H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o)), same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const REST = 12 * 12 * H + H;   // 월요일 06시 + 144시간 = 일요일 06시 쉼달 (+1시간)

console.log('[새 정원 · 1철]');
const st0 = E.create(mon + 0.1 * H, () => 0.5);
check(st0.season && st0.season.n === 1 && st0.season.startedAt === mon + 0.1 * H && st0.season.path === null && same(st0.season.log, []), '새 정원은 1철 · 시작한 때 · 길 자리(path null) · 끝난 철 없음');
check(E.seasonBadge(st0) === null, '1철이면 위 막대 표시 없음');

console.log('[01 조건: 3해 + 꽃 13종 (14 탁서진 14-1)]');
const toasts = [], live = { live: true, rng: () => 0.5, toast: t => toasts.push(t) };
const st = E.create(mon + 0.1 * H, () => 0.5); st.gardenId = 'season-1'; st.onboarded = true;
E.advance(st, mon + WEEK + REST, ctx);
for (const k of E.FLOWER_KEYS) st.dex.flower[k] = true;
let r = E.seasonReady(st);
check(!r.ready && r.years === 2 && r.flowers === 13 && r.need.years === 3 && r.need.flowers === 13, '2해 · 13종이면 아직 (해는 이번 철 해마다 기록 줄 수)');
check(E.seasonHint(st, E.calendar(st.virtual)) === null, '조건 전엔 꽃잠 기록 끝 한 줄도 없음');
E.advance(st, mon + 2 * WEEK + REST, live);
r = E.seasonReady(st);
check(r.ready && r.years === 3, '3해째 쉼달 기록 뒤 · 13종이면 열림');
check(E.seasonHint(st, E.calendar(st.virtual)) === '🌸 새 철을 시작할 수 있어요', '꽃잠 한 해 기록 끝 한 줄');
check(!toasts.some(t => t.includes('철')) && !st.log.some(l => l.text.includes('새 철')), '알림 · 일지 줄을 쏘지 않음 — 엔진은 문장만 돌려줌 (16 연두리 16-5)');
const twelve = copy(st); delete twelve.dex.flower.napmae;
check(!E.seasonReady(twelve).ready && E.seasonReady(twelve).flowers === 12 && !E.seasonStart(twelve, ctx).ok, '12종이면 안 열림 · 시작도 거부');
check(E.seasonCanStart(st, E.calendar(st.virtual)) && !E.seasonCanStart(st, E.calendar(mon + 2 * WEEK + 100 * H)), '꽃잠에만 시작할 수 있음');
check(E.seasonHint(st, E.calendar(mon + 2 * WEEK + 100 * H)) === null, '꽃잠이 아니면 한 줄도 없음');
{ const wk = copy(st); E.advance(wk, mon + 3 * WEEK + 2 * H, ctx);
  const x = E.seasonStart(wk, ctx);
  check(!x.ok && x.msg.includes('꽃잠') && wk.season.n === 1, '흐르는 달(4년차 3월)엔 시작을 거부 · 정원 그대로'); }

console.log('[02 · 03 새 철 시작 (07 정진우 07-4)]');
// 비워질 것 · 이어질 것을 심어 둠
st.money = 123456; st.fert = 7; st.water = 3; st.shears = 1; st.hoe = 2; st.basket = 0;
st.flowers.push({ id: 8001, type: 'rose', x: 3, y: 3, stage: 'bloom', q: 1, ageH: 999, lifeH: 999, waterH: 0, thirstH: 0 });
st.items.push({ id: 8002, type: 'rose', q: 1 }); st.petals.push({ id: 8003, type: 'rose', q: 1 }); st.teas.push({ id: 8004, type: 'rose', q: 1 });
st.drying.push({ id: 8005, type: 'rose', q: 1, leftH: 3 }); st.dried.push({ id: 8006, type: 'rose', q: 1 }); st.blends.push({ id: 8007, parts: ['rose', 'lavender'], q: 1 });
st.cups.push({ id: 8008, kind: 'tea', type: 'rose', q: 1, brewAbs: 0 }); st.reservations.push({ type: 'rose', qty: 1, year: 4, deliverIdx: 0 });
st.orders = [{ kind: 'any' }]; st.pantry.items.push({ k: 'water' }); st.honey = { rose: 2 }; st.mine.bag = { stone: 3 }; st.mine.deepest = 12; st.mine.depth = 5;
st.tiles[0] = { t: 22, m: 70, life: 9 }; st.tiles[1] = { t: 5, m: 10, life: 9 };
st.decos.push({ id: 9001, key: 'bench', x: 5, y: 5 }, { id: 9002, key: 'autobasket', x: 6, y: 6 }, { id: 9003, key: 'hive', x: 9, y: 9, honey: ['rose', 'rose'] }, { id: 9004, key: 'teahelper', x: 0, y: 0 }, { id: 9005, key: 'growlight', x: 12, y: 12 });
for (const k of ['bench', 'autobasket', 'hive', 'teahelper', 'growlight']) st.dex.deco[k] = true;
st.shop.seats = 3; st.shop.cups.push('celadon'); st.shop.cup = 'celadon';
st.grade.xp = 20000; E.bonusSet(st, 'basket', 2); E.bonusSet(st, 'rack', 1);
E.setTitleOn(st, 't_record'); st.letterBox.push({ k: 'test', at: 1 }); st.mailGot = { 'a-1': 5 }; st.settings.sleep.on = false; st.settings.slow = true;
st.account = { firstVisit: 5, gave: false }; st.stats.cups = 77; st.stats.orders = 9; st.weekly = st.weekly || null; st.nextId = 10000;
const before = copy(st), pts = E.bonusPoints(st), left = E.bonusLeft(st), cal0 = E.calendar(st.virtual);
check(left > 0, `(준비) 손길 점 ${pts}점 · 남은 ${left}점`);
r = E.seasonStart(st, ctx);
check(r.ok && r.season === 2 && r.title === 't_season2', '시작: 2철 · 칭호 「두 번째 봄」');
check(st.season.n === 2 && st.season.startedAt === before.virtual && st.season.path === null, '저장 season: n 2 · 시작한 때 · 길 자리 null (P30-04)');
const ended = st.season.log[0];
check(st.season.log.length === 1 && ended.n === 1 && ended.startedAt === mon + 0.1 * H && ended.endedAt === before.virtual && ended.years === 3 && ended.grade === E.gradeOf(st).grade && ended.sold === before.yearLog.reduce((a, x) => a + (x.sold || 0), 0), '끝난 철 한 줄: 철 · 시작 · 끝 · 걸린 해 · 끝 등급 · 판 잔 (P30-04-03 철마다 표 자리)');
console.log('  — 이어지는 것');
check(st.grade.xp === 20000 && same(st.grade, before.grade), '정원 등급 · 경험치');
check(same(st.bonus, before.bonus) && E.bonusVal(st, 'basket') === 16, '🌟 고른 보너스 (바구니 2단계 → 16포기)');
check(E.bonusPoints(st) === pts && E.bonusLeft(st) === left, '🌟 손길 점 그대로 — 새 철 보상으로 더 생기지 않음 (열린 질문 ②)');
check(Object.keys(before.titles).every(k => st.titles[k] === before.titles[k]) && st.titleOn === 't_record', '칭호 · 대표 칭호');
check(same(Object.assign({}, st.dex, { deco: null }), Object.assign({}, before.dex, { deco: null })) && Object.keys(before.dex.deco).every(k => st.dex.deco[k]), '도감 전부 (꽃 · 꽃잎 · 차 · 땅 · 블렌드 · 꾸밈 · 꿀 · 광산 · 기념품 · 편지)');
check(same(st.journal, before.journal) && same(st.stats, before.stats), '도감일지(끝낸 퀘스트 ✅) · 쌓인 기록(판 잔 · 주문 …)');
check(same(st.yearLog, before.yearLog) && st.yearLog.every(x => x.season === 1) && same(st.records, before.records) && st.bestScore === before.bestScore, '해마다 기록(철 번호 1) · 한 해 기록 카드 · 최고 점수');
check(same(st.letterBox, before.letterBox) && same(st.mailGot, before.mailGot) && same(st.letterPending, before.letterPending), '받은 편지함 · 📮 받은 기록 · 오는 중인 답장');
check(same(st.settings, before.settings) && same(st.account, before.account) && st.resetAt === before.resetAt && st.gardenId === 'season-1', '설정 · ☁️ 계정 · 정원 이름표(드라이브는 같은 정원)');
check(same(st.shop, before.shop), '🪑 찻집 가꾸기 (산 자리 · 찻잔 세트 · 간판, 열린 질문 ①)');
const dk = id => st.decos.find(d => d.id === id);
check(dk(9002).x === 6 && dk(9002).y === 6 && dk(9004).x === 0 && E.placedOf(st, 'autobasket').length === 1, '🧺 자동 장치는 놓인 자리 그대로 (열린 질문 ①)');
check(dk(9001).x === null && dk(9003).x === null && dk(9005).x === null && before.decos.every(d => dk(d.id)), '나머지 장식은 창고 🪴로 (산 장식 · 생장등은 보유 목록에 남음)');
check(st.onboarded && st.gift === before.gift && st.startedInSleep === before.startedInSleep && st.titles.t_sleep == null, '첫 안내 · 이웃의 화분 표시 — 「꽃잠에 온 손님」을 새로 주지 않음');
check(st.nextId >= 10000 && same(st.weekly, before.weekly), '이름표 번호 · 이번 주 목표(월요일에 저절로 바뀜)');
console.log('  — 비워지는 것');
check(st.money === 15000, '돈 15,000원');
check(['flowers', 'items', 'petals', 'teas', 'drying', 'dried', 'blends', 'cups', 'reservations'].every(k => Array.isArray(st[k]) && st[k].length === 0), '심은 꽃 · 씨앗 · 꽃잎 · 티백 · 꽃방 · 블렌드 · 찻잔 · 예약');
check(st.fert === 0 && st.water === 10 && st.shears === 5 && st.hoe === 10 && st.basket === 10, '용품은 시작 용품으로 (물병 10 · 가위 5번 · 호미 · 바구니 10번)');
check(E.landCounts(st).barren === E.W * E.H, '땅 600칸 모두 황무지');
check(st.orders === null && st.pantry.items.length === 0 && same(st.honey, {}) && dk(9003).honey.length === 0, '주문 쪽지 · 정원 저장고 · 꿀 선반 · 벌통 꿀');
check(same(st.mine.bag, {}) && st.mine.depth === 1 && st.mine.deepest === 12, '⛏️ 광산 주머니 · 지금 층은 비우고 가장 깊은 층은 이어짐');
check(same(st.yearNow, { income: 0, sold: 0, harvest: 0 }) && st.yearPace.xp0 === 20000 && st.gifts === null && st.helpYear == null, '올해 쌓는 중 · 그래프 견줌 · 올해 선물 · 막힘 방지는 새로');
console.log('  — 시각: 꽃잠 = 새 철 0년차 (P04-05)');
check(st.virtual === before.virtual && st.firstWeek === cal0.week + 1 && E.yearOf(st, cal0) === 0, '시간은 그대로 · 이 꽃잠은 0년차 · 다음 월요일 3월이 1년차');
check(st.log.some(l => l.text.startsWith('🌸 2철을 시작했어요')) && st.log.some(l => l.text.includes('두 번째 봄')), '정원 일지 한 줄 · 🏅 칭호 줄');
check(st.dex.deco['t:t_season2'] && E.decoCount(st) === E.decoCount(before) && E.TITLE_KEYS.length === 19, '칭호 문장 장식 · 칭호 19개 · 꾸밈 도감 칸 수는 그대로 (덤 칭호)');
check(E.seasonBadge(st).text === '🌸 2철', '위 막대 "🌸 2철"');
check(!E.seasonStart(st, ctx).ok && st.season.n === 2, '곧바로 다시 시작은 안 됨 (이번 철 0해)');
check(!E.canReset(st, cal0), '새 철엔 완전 초기화(P16-12-03, 1년차만)가 다시 보이지 않음');
check(E.applyAccount(st, 5, ctx) === false && !E.freshGarden(st), '계정 이어 붙이기 · "거의 새 정원" 판단과 부딪히지 않음 (드라이브 고르기에서 새 정원으로 보지 않음)');

console.log('[새 철 1년차 (07-5 · 14 탁서진 14-5)]');
E.advance(st, mon + 3 * WEEK + 2 * H, ctx);
check(E.yearOf(st, E.calendar(st.virtual)) === 1 && E.chapterOpen(st, 'c6') && !E.canReset(st, E.calendar(st.virtual)), '다음 월요일 3월이 1년차 · 6장은 그대로 열림 · 완전 초기화 없음');
E.advance(st, mon + 3 * WEEK + 9 * 12 * H + H, ctx);   // 목요일 저녁 찻집이 열림
const brew0 = st.stats.autoBrew || 0;
for (let i = 0; i < 3; i++) st.teas.push({ id: 7000 + i, type: 'chamomile', q: 1, seasonKey: -1, hat: false });
E.advance(st, st.virtual + H, ctx);
check((st.stats.autoBrew || 0) > brew0, '이어진 찻집 일손이 첫해부터 우림 — 장치를 다시 사지 않음');
check(st.money < 123456, '수입 배율 없음: 돈은 15,000원에서 다시 (보너스는 손 · 시간만)');
E.advance(st, mon + 3 * WEEK + REST, ctx);
const rows = E.yearLogOf(st), last = rows[rows.length - 1];
check(rows.length === 4 && last.season === 2 && last.year === 1 && E.seasonRows(st).length === 1 && E.seasonReady(st).years === 1, '해마다 기록 줄에 철 번호 (2철 1년차) · 이번 철 해 수는 1');
check(rows.slice(0, 3).every(x => x.season === 1) && E.graphYears(st).rows.length === 4, '그래프는 철을 이어 보여 줌 — 경계는 season으로 (화면 M3-4)');
check(E.yearDiffOf(st, 1) === null && E.yearDiffOf(st, 2, 1) !== null && E.yearDiffOf(st, 2, 1).prevYear === 1, '지난해 견줌은 철을 넘지 않음 (1철 안에서는 그대로)');
check(st.records[0].season === 2 && st.records[0].year === 1, '한 해 기록 카드에도 철 번호');

console.log('[04 철마다 숨은 칭호]');
const at = n => { const c = copy(before); c.season.n = n; c.yearLog.forEach(x => { x.season = n; }); return c; };
const s3 = at(2), r3 = E.seasonStart(s3, ctx), s4 = at(3), r4 = E.seasonStart(s4, ctx), s5 = at(4), r5 = E.seasonStart(s5, ctx);
check(r3.ok && r3.title === 't_season3' && s3.titles.t_season3 != null && s3.season.n === 3, '3철에 「세 철의 정원사」');
check(r4.ok && r4.title === null && s4.season.n === 4, '4철엔 칭호 없음');
check(r5.ok && r5.title === 't_season5' && s5.titles.t_season5 != null, '5철에 「다섯 철을 건넌 사람」');
check(E.SEASON_TITLES.join() === 't_season2,t_season3,t_season5' && E.SEASON_TITLES.every(k => E.TITLES[k].extra && E.TITLES[k].name), '칭호 셋은 덤 칭호 (모으는 칭호 수에 넣지 않음)');
check(new Set(E.SEASON_TITLES.map(k => E.TITLES[k].name)).size === 3, '이름이 겹치지 않음');

console.log('[저장 · 다시 열기]');
const sv = E.makeSave(st, st.virtual), back = E.parseSave(JSON.stringify(sv)), mg = back.ok && E.migrateSave(back.data.game);
check(back.ok && sv.summary.season === 2 && mg && mg.season.n === 2 && same(mg.season, st.season) && E.yearLogOf(mg).length === 4, '저장 파일 · 요약에 철 · 다시 열어도 그대로');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
