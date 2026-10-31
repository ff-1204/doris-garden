// 예전 저장 보정 (MIGRATIONS · migrateSave, 10-24): 옛 정원이 지금 형식으로 열리는지
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MON = new Date(2026, 9, 5, 6, 0, 0).getTime(), ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));

const st = E.create(MON, () => 0.5);
E.advance(st, MON + 30 * H, ctx);
check(st.mig === E.MIGRATIONS.length, '새 정원은 보정을 다 한 것으로 시작 (mig)');

console.log('[쓸 수 없는 정원]');
check(E.migrateSave(null) === null && E.migrateSave({ v: 2 }) === null, '없거나 옛 v면 null');
const cut = copy(st); cut.tiles.pop();
check(E.migrateSave(cut) === null, '땅 칸 수가 틀리면 null');

console.log('[가장 옛 정원]');
const old = copy(st);
for (const k of ['water', 'shears', 'hoe', 'basket', 'drying', 'dried', 'blends', 'cups', 'gardenId', 'mig', 'account', 'actAt', 'letterBox', 'resetAt', 'yearLog', 'yearNow', 'grade', 'yearPace', 'weekly', 'pantry', 'bonusFree', 'season', 'layers', 'yearly', 'visitors', 'mailSeenAt']) delete old[k];
delete old.settings.slow;
for (const k of ['petal', 'blend', 'bagBlend', 'teabag', 'form']) delete old.dex[k];
old.dex.tea = { chamomile: true }; old.teas = [{ id: 900, type: 'lavender', q: 3 }];
old.items.push({ id: 901, type: 'rose', q: 3, origin: '가게', form: 'seed' });
old.dex.flower = { sunflower: true };
const m = E.migrateSave(old);
check(m === old && m.mig === E.MIGRATIONS.length, '보정을 끝까지 하고 mig를 적음');
check(m.water === 10 && m.shears === 5 && m.hoe === 10 && m.basket === 10, '용품 기본값');
check(['drying', 'dried', 'blends', 'cups'].every(k => Array.isArray(m[k])), '꽃방 · 블렌딩 · 찻잔 칸');
check(m.items.find(i => i.id === 901).origin === '화원', '가게 → 화원');
check(m.dex.petal.chamomile && m.dex.petal.lavender, '꽃잎 도감: 차 도감 · 가진 차의 꽃 등록');
check(m.dex.teabag.chamomile && m.dex.teabag.lavender, '티백 도감: 만든 적 있는 차 등록');
check(m.dex.form.rose && m.dex.form.sunflower, '씨앗 · 묘목 도감: 창고 · 핀 적 있는 꽃 등록');
check(typeof m.gardenId === 'string' && m.dex.blend && m.dex.bagBlend, '이름표 · 블렌드 도감 칸');
check(m.restClosed === null && m.flowers.every(f => f.propRest === false), '꽃잠 번식 표시 · 꽃잠 안내 닫은 주 칸 (QA 19회차)');
check(m.account === null && m.actAt === null, '☁️ 계정 기록 · 마지막으로 손댄 때 칸 (P20-06 · 08)');
check(Array.isArray(m.letterBox) && m.letterBox.length === 0, '🎁 받은 편지함 칸 · 예전 편지에는 답례품 소급 없음 (P26-06)');
check(m.resetAt === null, '처음부터 다시 시작한 때 칸 (P16-12-03 완전 초기화)');
check(Array.isArray(m.yearLog) && m.yearLog.length === 0 && m.yearNow.income === 0 && m.yearNow.part === true, '📈 해마다 기록 칸 · 올해는 업데이트 뒤부터 셈 (P28-07-01)');
check(m.settings.slow === false && !E.slowView(m), '🐢 느긋하게 보기는 꺼진 채로 (P28-02)');
check(m.grade && m.grade.xp >= 0 && m.grade.dex === E.gradeDexCount(m) && E.gradeOf(m).grade >= 1, '🌱 정원 등급 칸 · 지금 도감 칸 수를 센 것으로 (P28-05-01)');
check(m.yearPace && m.yearPace.xp0 === null && m.yearPace.last === null && E.yearPace(m) === null, '📈 그래프 견줌 칸 · 올해 시작 값은 몰라 견줌 없음 (P28-07-02)');
check(m.weekly === null || (m.weekly && m.weekly.week === E.calendar(m.virtual).week), '🗓️ 주간 목표 칸 — 비어 있다가 다음 확인 때 이번 주 목표를 뽑음 (P28-09)');
const wk = copy(st); delete wk.weekly; wk.mig = E.MIGRATIONS.findIndex(m => m[0].includes("weekly")); const wm = E.migrateSave(wk);
check(wm.weekly === null && wm.mig === E.MIGRATIONS.length, '🗓️ 주간 목표 보정 · 예전 정원은 null로 (P28-09)');
check(m.pantry && m.pantry.items.length === 0 && m.pantry.h === 0 && m.pantry.n === 0, '🧺 정원 저장고 칸 · 예전 정원은 빈 저장고 (P28-04)');
const pn = copy(st); delete pn.pantry; pn.mig = E.MIGRATIONS.findIndex(m => m[0].includes("pantry")); const pm = E.migrateSave(pn);
check(pm.pantry && pm.pantry.items.length === 0 && pm.mig === E.MIGRATIONS.length, '🧺 정원 저장고 보정 (P28-04)');
const pk = copy(st); pk.pantry = { h: 1.5, n: 7, items: [{ k: 'water' }], got: 3 }; pk.mig = E.MIGRATIONS.length - 1;
check(JSON.stringify(E.migrateSave(pk).pantry) === JSON.stringify({ h: 1.5, n: 7, items: [{ k: 'water' }], got: 3 }), '🧺 쌓인 저장고는 보정이 건드리지 않음');
wm.onboarded = true; E.advance(wm, wm.virtual + H, ctx);
check(wm.weekly && wm.weekly.goals.length === 3, '🗓️ 연 뒤 한 시간: 이번 주 목표 3개가 생김');
check(m._fertNew === 0 && JSON.stringify(m._bloomNew) === '{}', '열 때마다: 새 알림 표시 비움');

console.log('[📈 해마다 기록: 남은 한 해 기록으로 채움 (P28-07-01)]');
const YL = E.MIGRATIONS.findIndex(x => x[0].includes('yearLog'));
const yl = copy(st); delete yl.yearLog; delete yl.yearNow; yl.mig = YL;
yl.records = [   // 최근 것부터 (쉼달 기록 순서)
  { year: 3, score: 150, orders: 7, dex: 30, dexTotal: 93 },
  { year: 2, score: 120, orders: 3, dex: 22, dexTotal: 93 },
  { year: 1, dex: 10, dexTotal: 80 },   // 점수가 생기기 전(P23) 기록
];
const ym = E.migrateSave(yl), ylog = E.yearLogOf(ym);
check(ylog.map(r => r.year).join(',') === '1,2,3', '한 해 기록마다 한 줄, 옛 해부터');
check(ylog[1].score === 120 && ylog[2].score === 150 && ylog[0].score === null, '점수는 기록에 있는 그대로, 없던 해는 null');
check(ylog[0].orders === null && ylog[1].orders === 3 && ylog[2].orders === 4, '주문은 누적 수의 차이로 그해 수 (없던 해는 null)');
check(ylog[2].dex === 30 && ylog[2].dexTotal === 93 && ylog[0].dexTotal === 80, '도감 칸 수');
check(ylog.every(r => r.income === null && r.sold === null && r.harvest === null && r.grade === null), '수입 · 판 잔 · 꽃잎 · 지난 해 등급은 모름(null)');
check(ym.yearNow.part === true && ym.yearNow.income === 0 && ym.yearNow.sold === 0 && ym.yearNow.harvest === 0, '올해는 0부터 · 업데이트한 해 표시(part)');
const cut10 = copy(st); delete cut10.yearLog; delete cut10.yearNow; cut10.mig = YL;
cut10.records = Array.from({ length: 10 }, (_, i) => ({ year: 12 - i, score: 100 + i, orders: 50 - i, dex: 40, dexTotal: 93 }));
const c10 = E.yearLogOf(E.migrateSave(cut10));
check(c10.length === 10 && c10[0].year === 3 && c10[0].orders === null && c10[1].orders === 1, '10개로 잘린 기록: 맨 앞 해 주문은 모름(null)');
const dup = copy(st); delete dup.yearNow; dup.mig = YL; dup.yearLog = [{ year: 1, income: 5, sold: 1, harvest: 1, orders: 0, score: 9, grade: null, dex: 1, dexTotal: 93 }];
check(E.migrateSave(dup).yearLog.length === 1 && dup.yearLog[0].income === 5, '이미 있는 해마다 기록은 덮어쓰지 않음');

console.log('[🌱 정원 등급: 남은 기록으로 경험치 어림 (P28-05-01)]');
const GR = E.MIGRATIONS.findIndex(x => x[0].includes('정원 등급'));
check(GR > YL, '등급 보정은 해마다 기록 보정 뒤 (해마다 기록으로 어림)');
const gr = copy(st); delete gr.grade; gr.mig = GR;
gr.stats = { dried: 30, cups: 12, orders: 4 };
gr.journal = { done: { c0_visit: 1, c1_bloom: 2, c1_petal: 3 } };
gr.yearLog = [{ year: 1, income: null, sold: null, harvest: null, orders: 4, score: 100, grade: null, dex: 10, dexTotal: 93 }, { year: 2, income: 900, sold: 20, harvest: 40, orders: 0, score: 80, grade: null, dex: 12, dexTotal: 93 }];
gr.yearNow = { income: 0, sold: 3, harvest: 5, part: true };
gr.records = [{ year: 2, score: 80, scoreParts: { lands: 20, flowers: 30, decos: 15, gifts: 10, orders: 5 } }, { year: 1, score: 100 }];
const gm = E.migrateSave(gr), want = { harvest: 45 * 2, sell: 23 * 2, order: 4 * 15, quest: 3 * 10, dex: (E.gradeDexCount(gm) - 1) * 5, year: 55 + 100 };
check(Object.keys(want).every(k => (gm.grade.by[k] || 0) === want[k]), `어림: 꽃잎(말린 수 · 기록 중 큰 쪽) · 판 잔 · 주문 · 퀘스트 · 도감 칸 · 한 해 평가(장식 · 선물 몫 빼고) (${JSON.stringify(gm.grade.by)})`);
check(gm.grade.xp === Object.values(want).reduce((a, b) => a + b, 0) && gm.grade.dex === E.gradeDexCount(gm), '경험치 = 어림 합 · 도감 칸은 지금 수로 맞춤 (다음에 다시 세지 않음)');
check(gm.yearLog.every(r => r.grade === null), '지난 해마다 기록의 등급은 모름(null) 그대로');
const gd0 = gm.grade.xp; E.advance(gm, gm.virtual + H, ctx);
check(gm.grade.xp - gd0 === (gm.grade.by.dex || 0) - want.dex + (gm.grade.by.quest || 0) - want.quest, '연 뒤 한 시간: 새로 생긴 칸 · 퀘스트만 더함 (어림한 것을 다시 세지 않음)');
const has = copy(st); has.mig = GR; has.grade = { xp: 777, dex: 3, by: { weekly: 777 } };
check(E.migrateSave(has).grade.xp === 777, '이미 등급이 있는 정원은 그대로');
const zero = copy(st); delete zero.grade; zero.mig = GR; zero.stats = {}; zero.journal = { done: {} }; zero.yearLog = []; zero.yearNow = { income: 0, sold: 0, harvest: 0 }; zero.records = [];
const zm = E.migrateSave(zero);
check(zm.grade.xp === (E.gradeDexCount(zm) - 1) * 5 && E.gradeOf(zm).grade >= 1, '기록이 없으면 도감 칸만 셈');

console.log('[🎁 첫 방문 꾸러미 firstGuest (P22-05)]');
{ const FG = E.MIGRATIONS.findIndex(x => x[0].includes('firstGuest'));
  const got = copy(st); got.onboarded = true; got.gift = 2; delete got.firstGuest; got.mig = FG;
  const gm = E.migrateSave(got);
  check(gm.firstGuest === false && !E.firstGuestReady(gm) && !E.giftPot(gm, ctx).ok && !gm.letterBox.some(b => b.k === 'welcome'), '화분을 받은 예전 정원은 꾸러미 · 첫 손님 없음');
  const yet = copy(st); yet.gift = null; delete yet.firstGuest; yet.mig = FG;
  const ym = E.migrateSave(yet); ym.onboarded = true; E.giftPot(ym, ctx);
  check(ym.firstGuest === true && ym.letterBox.some(b => b.k === 'welcome') && ym.dried.length === 2, '아직 화분을 받지 않은 예전 정원은 화분과 함께 받음'); }

console.log('[📮 운영자 편지 받은 기록 mailGot (P29)]');
{ const MG = E.MIGRATIONS.findIndex(x => x[0].includes('mailGot'));
  check(MG >= 0 && E.create(MON, () => 0.5).mailGot && JSON.stringify(m.mailGot) === '{}', '새 정원 · 예전 정원 모두 빈 기록으로 시작');
  const old = copy(st); delete old.mailGot; old.mig = MG; const om = E.migrateSave(old);
  check(JSON.stringify(om.mailGot) === '{}' && om.mig === E.MIGRATIONS.length, 'mailGot이 없는 정원은 빈 기록으로');
  const got = copy(st); got.mailGot = { 'a-1': 123 }; got.mig = MG;
  check(E.migrateSave(got).mailGot['a-1'] === 123, '이미 받은 기록은 그대로'); }

console.log('[🌟 등급 보너스 bonus (P28-05-02)]');
{ const BN = E.MIGRATIONS.findIndex(x => x[0].includes('등급 보너스 bonus'));
  const zero = b => b && E.BONUS_KEYS.every(k => b[k] === 0) && Object.keys(b).length === E.BONUS_KEYS.length;
  const old0 = b => b && JSON.stringify(b) === JSON.stringify({ basket: 5, rack: 5, brew: 0, hive: 1, weed: 2, pantry: 0, catchup: 0 });   // P38 예전 0단계 값을 새 단계로 옮김 (🐜 8포기 · 🐛 8장 · 🐝 2칸 · 🐞 3포기)
  check(BN >= 0 && zero(E.create(MON, () => 0.5).bonus) && old0(m.bonus), '새 정원은 모든 칸 0단계 · 예전 정원은 예전 0단계 값의 새 단계 (P38)');
  const old = copy(st); delete old.bonus; delete old.bonusFree; old.mig = BN; old.grade.xp = 5000; const om = E.migrateSave(old);
  check(old0(om.bonus) && om.mig === E.MIGRATIONS.length && E.bonusPoints(om) === E.gradeOf(om).grade - 1 && E.bonusLeft(om) === E.bonusPoints(om), 'bonus가 없는 정원은 0단계로(P38 옮김) · 🌼 꽃가루는 지금 등급으로 바로 셈 — 옮긴 단계는 꽃가루를 안 씀');
  const got = copy(st); got.bonus = { rack: 2 }; delete got.bonusFree; got.mig = BN; const gm = E.migrateSave(got);
  check(gm.bonus.rack === 7 && gm.bonus.basket === 5 && Object.keys(gm.bonus).length === E.BONUS_KEYS.length && E.bonusUsed(gm) === 3, '이미 고른 칸은 그대로(P38: 🐛 12장 → 7단계), 빠진 칸만 0 · 쓴 꽃가루 3알 그대로'); }

console.log('[🌸 새 철 season (P28-08-03)]');
{ const SN = E.MIGRATIONS.findIndex(x => x[0].includes('새 철 season'));
  const nw = E.create(MON, () => 0.5);
  check(SN >= 0 && nw.season.n === 1 && nw.season.startedAt === MON && nw.season.path === null && nw.season.log.length === 0, '새 정원은 1철 · 시작한 때를 앎');
  check(m.season && m.season.n === 1 && m.season.startedAt === null && m.season.path === null && JSON.stringify(m.season.log) === '[]', '가장 옛 정원도 1철 · 시작한 때는 모름(null)');
  const old = copy(st); delete old.season; old.mig = SN;
  old.yearLog = [{ year: 1, income: 5, sold: 1, harvest: 1, orders: 0, score: 9, grade: 2, dex: 1, dexTotal: 93 }, { year: 2, income: 6, sold: 2, harvest: 1, orders: 0, score: 10, grade: 3, dex: 2, dexTotal: 93 }];
  old.records = [{ year: 2, score: 10 }, { year: 1, score: 9 }];
  const om = E.migrateSave(old);
  check(om.season.n === 1 && om.season.startedAt === null && om.mig === E.MIGRATIONS.length, 'season이 없는 정원은 1철로');
  check(om.yearLog.every(r => r.season === 1) && om.records.every(r => r.season === 1) && E.seasonRows(om).length === 2, '해마다 기록 줄 · 한 해 기록 카드는 1철 — 새 철 조건의 해 수로 셈');
  const s2 = copy(st); s2.season = { n: 3, startedAt: 7, path: null, log: [{ n: 1 }, { n: 2 }] }; s2.yearLog = [{ year: 1, season: 3, score: 1 }]; s2.mig = SN;
  const sm = E.migrateSave(s2);
  check(sm.season.n === 3 && sm.season.log.length === 2 && sm.yearLog[0].season === 3, '이미 있는 철 · 줄의 철 번호는 그대로'); }

console.log('[🌳 정원의 층 layers (P30-01-01)]');
{ const LN = E.MIGRATIONS.findIndex(x => x[0].includes('정원의 층 layers'));
  const nw = E.create(MON, () => 0.5);
  check(LN >= 0 && JSON.stringify(nw.layers) === '{"at":{}}', '새 정원은 연 층 기록이 비어 있음');
  check(m.layers && m.layers.at[2] === m.yearLog.length && m.layers.at[3] == null, '가장 옛 정원: 차를 판 적이 있으면 2층 연 해 = 업데이트한 해 · 광산을 판 적 없으면 3층은 아직');
  const old = copy(st); delete old.layers; old.mig = LN; old.dex.tea = { rose: 1 }; old.stats = { dug: 5 };
  old.yearLog = Array.from({ length: 20 }, (_, i) => ({ year: i + 1, season: 1, score: 1 }));
  for (const k of E.FLOWER_KEYS) old.dex.flower[k] = true;
  const om = E.migrateSave(old), o = E.layerOf(om);
  check(om.layers.at[2] === 20 && om.layers.at[3] === 20 && o.layer === 3 && o.next.yearsLeft === 8 && !o.next.ready, '찻집 · 광산을 연 정원(20해): 2 · 3층 연 해 = 20 → 4층까지 8해 더 (한꺼번에 안 열림)');
  const none = copy(st); delete none.layers; none.mig = LN; none.dex.tea = {}; none.stats = {};
  const nm = E.migrateSave(none);
  check(JSON.stringify(nm.layers) === '{"at":{}}' && E.layerOf(nm).layer === 1, '아무것도 연 적 없는 정원은 1층 · 기록 없음');
  const has = copy(st); has.layers = { at: { 2: 3 } }; has.mig = LN; has.dex.tea = { rose: 1 };
  check(E.migrateSave(has).layers.at[2] === 3, '이미 있는 층 기록은 그대로'); }

console.log('[🗓️ 올해만 오는 것 yearly (P30-05-01)]');
{ const YN = E.MIGRATIONS.findIndex(x => x[0].includes('올해만 오는 것 yearly'));
  const nw = E.create(MON, () => 0.5);
  check(YN === 35 && JSON.stringify(nw.yearly) === '{"at":null,"years":[],"missed":[],"got":{}}', '새 정원은 빈 달력 (36번째 보정)');
  check(m.yearly && m.yearly.at === null && m.yearly.missed.length === 0, '가장 옛 정원: 빈 달력 — 지난 계절을 놓친 것으로 치지 않음');
  const old = copy(st); delete old.yearly; old.mig = YN; old.yearLog = Array.from({ length: 6 }, (_, i) => ({ year: i + 1, season: 1, score: 1 }));
  const om = E.migrateSave(old), cal = E.calendar(om.virtual);
  E.yearlyMark(om, cal, {});
  check(om.yearly.missed.length === 0 && (cal.season === 4 || om.yearly.years[0].y === 7), '6해 된 정원이 업데이트 뒤 처음 열면 7해째부터 셈 · 놓친 것 없음');
  const has = copy(st); has.yearly = { at: 5, years: [], missed: [{ k: 'firefly', f: null, y: 1 }], got: { rainbow: 1 } }; has.mig = YN;
  const hm = E.migrateSave(has);
  check(hm.yearly.missed[0].k === 'firefly' && hm.yearly.got.rainbow === 1, '이미 있는 달력은 그대로'); }

console.log('[🐾 특별 손님 visitors (P30-06-01)]');
{ const VN = E.MIGRATIONS.findIndex(x => x[0].includes('특별 손님 visitors'));
  const nw = E.create(MON, () => 0.5);
  check(VN === 36 && JSON.stringify(nw.visitors) === '{"now":[],"times":{},"gift":{},"call":null}', '새 정원은 아무도 안 온 정원 (37번째 보정)');
  check(m.visitors && m.visitors.now.length === 0 && JSON.stringify(m.visitors.times) === '{}', '가장 옛 정원: 손님 칸이 생김');
  const old = copy(st); delete old.visitors; old.mig = VN; const om = E.migrateSave(old);
  check(om.visitors && om.mig === E.MIGRATIONS.length && om.visitors.call === null, '바로 앞 판 정원도 손님 칸이 생김');
  const has = copy(st); has.visitors = { now: [{ k: 'hedgehog', x: 3, y: 3, at: 1, left: 2 }], times: { hedgehog: 2 }, gift: {}, call: null }; has.mig = VN;
  const hm = E.migrateSave(has);
  check(hm.visitors.times.hedgehog === 2 && hm.visitors.now[0].k === 'hedgehog', '이미 있는 손님 기록은 그대로'); }

console.log('[🛤️ 철의 길 season.path (P30-04-01)]');
{ const PN = E.MIGRATIONS.findIndex(x => x[0].includes('철의 길 season.path'));
  check(PN === 37, '38번째 보정');
  check(m.season && m.season.path === null && m.season.n === 1, '가장 옛 정원: 1철 · 길 없이');
  const old = copy(st); old.mig = PN; old.season = { n: 3, startedAt: 5, path: 'tea', log: [{ n: 1, years: 3, grade: 9, sold: 10 }, { n: 2, years: 4, grade: 12, sold: null, path: 'flower' }] };
  const om = E.migrateSave(old);
  check(om.season.path === 'tea' && om.season.log[0].path === null && om.season.log[1].path === 'flower' && om.mig === E.MIGRATIONS.length, '고른 길은 그대로 · 길이 없던 끝난 철 줄은 길 없이');
  const bad = copy(st); bad.mig = PN; bad.season = { n: 2, startedAt: 5, path: 'gold', log: [{ n: 1, years: 3, path: 'x' }] };
  const bm = E.migrateSave(bad);
  check(bm.season.path === null && bm.season.log[0].path === null, '모르는 길 이름은 길 없이'); }

console.log('[🌳 작은 숲 forest (P30-03)]');
{ const FN = E.MIGRATIONS.findIndex(x => x[0].includes('작은 숲 forest'));
  check(FN === 38, '39번째 보정');
  check(m.forest && m.forest.trees.length === 6 && m.forest.trees.every(t => t === null) && JSON.stringify(m.forest.dex) === '{}', '가장 옛 정원: 빈 숲 6칸 · 도감 없음');
  const old = copy(st); delete old.forest; old.mig = FN; const om = E.migrateSave(old);
  check(om.forest && om.mig === E.MIGRATIONS.length && om.forest.trees.length === 6, '바로 앞 판 정원도 숲 칸이 생김');
  const has = copy(st); has.forest = { trees: [{ k: 'pine', at: 3, stage: 2 }, null, null, null, null, null], dex: { pine: 2 } }; has.mig = FN;
  const hm = E.migrateSave(has);
  check(hm.forest.trees[0].k === 'pine' && hm.forest.trees[0].stage === 2 && hm.forest.dex.pine === 2, '이미 있는 숲은 그대로'); }

console.log('[✉️ 편지함 mailSeenAt (P31-01)]');
{ const MN = E.MIGRATIONS.findIndex(x => x[0].includes('편지함 mailSeenAt'));
  check(MN === 39, '40번째 보정');
  check(m.mailSeenAt === m.virtual && !E.inboxUnread(m), '가장 옛 정원: 지금 연 것으로 — 처음엔 점 없음');
  const old = copy(st); delete old.mailSeenAt; old.mig = MN; old.letterBox = [{ k: 'teacher', y: 1, m: 3, read: true }]; old.log.push({ y: 1, m: 3, d: 1, type: 9, text: '🏅 새 칭호: 시험' });
  const om = E.migrateSave(old);
  check(om.mailSeenAt === om.virtual && om.mig === E.MIGRATIONS.length && !E.inboxUnread(om) && E.inboxOf(om).unread === 0, '바로 앞 판 정원: 시각 없는 편지 · 일지 줄은 읽은 것');
  const has = copy(st); has.mailSeenAt = 123; has.mig = MN;
  check(E.migrateSave(has).mailSeenAt === 123, '이미 있는 읽은 때는 그대로'); }

console.log('[🔠🧩 큰 글씨 · 땅 무늬 settings.big · pattern (P28-01 · P28-03)]');
{ const BN = E.MIGRATIONS.findIndex(x => x[0].includes('settings.big'));
  const FN = E.MIGRATIONS.findIndex(x => x[0].includes('awayLast'));
  check(BN === 40 && FN === BN + 1 && FN === E.MIGRATIONS.length - 4, '41번째 보정 · 바로 뒤 42번째 P32 awayLast · farm');
  check(m.settings.big === false && m.settings.pattern === false, '가장 옛 정원: 둘 다 꺼짐');
  const old = copy(st); delete old.settings.big; delete old.settings.pattern; old.mig = BN; const om = E.migrateSave(old);
  check(om.settings.big === false && om.settings.pattern === false && om.mig === E.MIGRATIONS.length, '바로 앞 판 정원도 둘 다 꺼짐');
  const has = copy(st); has.settings.big = true; has.settings.pattern = true; has.mig = BN; const hm = E.migrateSave(has);
  check(hm.settings.big === true && hm.settings.pattern === true, '이미 켠 값은 그대로'); }

console.log('[🧬 돌연변이 mut · dex.mutant · dex.mutjar · jar · mutBoost (P36)]');
{ const MN = E.MIGRATIONS.findIndex(x => x[0].includes('P36'));
  check(MN === 42 && MN === E.MIGRATIONS.length - 3, '43번째 보정 (바로 뒤 44번째 P37 · 45번째 P38)');
  check(m.jar === 0 && m.mutBoost === null && JSON.stringify(m.dex.mutant) === '{}' && JSON.stringify(m.dex.mutjar) === '{}', '가장 옛 정원: 유리 관 0 · 빈 돌연변이 도감');
  const old = copy(st); old.mig = MN; delete old.jar; delete old.mutBoost; delete old.dex.mutant; delete old.dex.mutjar;
  old.flowers = [{ id: 1, type: 'rose', x: 1, y: 1, q: 1, bloomKey: 12 }, { id: 2, type: 'rose', x: 2, y: 1, q: 1, bloomKey: -1 }];
  const om = E.migrateSave(old);
  check(om.mig === E.MIGRATIONS.length && om.flowers[0].mut === false && om.flowers[1].mut === undefined, '바로 앞 판 정원: 이미 핀 꽃은 굴리지 않음 · 안 핀 꽃은 처음 필 때');
  const has = copy(st); has.mig = MN; has.jar = 4; has.dex.mutant = { rose: 2 }; has.dex.mutjar = { rose: true }; has.mutBoost = { week: 9, n: 1 };
  const hm = E.migrateSave(has);
  check(hm.jar === 4 && hm.dex.mutant.rose === 2 && hm.dex.mutjar.rose && hm.mutBoost.n === 1, '이미 있는 값은 그대로'); }

console.log('[🌼 꽃가루 · 일꾼 기르기 bonus.brew · hive · weed (P37)]');
{ const PN = E.MIGRATIONS.findIndex(x => x[0].includes('P37'));
  check(PN === 43 && PN === E.MIGRATIONS.length - 2, '44번째 보정 (바로 뒤 45번째 P38)');
  check(m.bonus.brew === 0 && m.bonus.hive === 1 && m.bonus.weed === 2, '가장 옛 정원: 새 세 칸 0단계 (P38로 🐝 · 🐞는 예전 0단계 값의 새 단계)');
  const old = copy(st); old.bonus = { basket: 2, rack: 1, pantry: 3, catchup: 1 }; old.grade.xp = E.gradeXpAt(20); old.mig = PN; delete old.bonusFree;
  const used = 3 + 1 + 6 + 1, om = E.migrateSave(old);   // P37 비용표로 쓴 꽃가루
  check(om.mig === E.MIGRATIONS.length && om.bonus.basket === 7 && om.bonus.rack === 6 && om.bonus.pantry === 3 && om.bonus.catchup === 1 && om.bonus.brew === 0 && om.bonus.hive === 1 && om.bonus.weed === 2, '바로 앞 판 정원: 예전 네 칸 단계 값 그대로(P38 새 단계로) · 새 세 칸 0');
  check(used === 3 + 1 + 6 + 1 && E.bonusUsed(om) === used && E.bonusLeft(om) === 19 - used, `쓴 꽃가루 · 남은 꽃가루 셈이 그대로 (쓴 ${used}알 · 남은 ${E.bonusLeft(om)}알)`); }

console.log('[🐜 작게 시작하는 일꾼 bonus 단계 옮김 · bonusFree (P38)]');
{ const XN = E.MIGRATIONS.findIndex(x => x[0].includes('P38'));
  check(XN === 44 && XN === E.MIGRATIONS.length - 1, '45번째 보정 (맨 끝)');
  const old = copy(st); old.bonus = { basket: 3, rack: 2, brew: 1, hive: 2, weed: 1, pantry: 0, catchup: 2 }; old.grade.xp = E.gradeXpAt(30); old.mig = XN; delete old.bonusFree;
  const om = E.migrateSave(old), was = 6 + 3 + 2 + 5 + 1 + 3;   // P37 비용표: 🐜 1+2+3 · 🐛 1+2 · 🦋 2 · 🐝 2+3 · 🐞 1 · 🌙 1+2
  check(JSON.stringify(om.bonus) === JSON.stringify({ basket: 8, rack: 7, brew: 1, hive: 3, weed: 3, pantry: 0, catchup: 2 }), '값이 같은 새 단계로 (🐜 20 → 8 · 🐛 12 → 7 · 🐝 3칸12병 → 3 · 🐞 4 → 3)');
  check(E.bonusUsed(om) === was && E.bonusLeft(om) === 29 - was && JSON.stringify(om.bonusFree) === '{"basket":8,"rack":8,"hive":1,"weed":3}', `쓴 꽃가루 ${was}알 · 남은 ${E.bonusLeft(om)}알 그대로 (덜어 준 셈 bonusFree)`);
  check(E.migrateSave(copy(om)).bonus.basket === 8 && E.migrateSave(copy(om)).bonusFree.basket === 8, '다시 열어도 또 옮기지 않음 (mig)');
  const nw = E.create(MON, () => 0.5); check(JSON.stringify(nw.bonusFree) === '{}' && E.bonusUsed(nw) === 0 && E.migrateSave(Object.assign(copy(nw), { mig: XN })).bonus.basket === 0, '새 정원은 bonusFree 빈 칸 — 1포기부터 · 옮기기를 다시 돌아도 그대로'); }

console.log('[여러 번 열어도 같음]');
const again = copy(m), before = JSON.stringify(again);
E.migrateSave(again); delete again.mig;
const b2 = JSON.parse(before); delete b2.mig;
check(JSON.stringify(again) === JSON.stringify(b2), '두 번째로 열 때 바뀌는 것이 없음');
const redo = copy(m); delete redo.mig; const ref = JSON.stringify(m);
check(JSON.stringify(E.migrateSave(redo)) === ref, 'mig가 없어 처음부터 다시 돌아도 결과가 같음');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
