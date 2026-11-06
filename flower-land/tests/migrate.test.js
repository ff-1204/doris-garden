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
for (const k of ['water', 'shears', 'hoe', 'basket', 'drying', 'dried', 'blends', 'cups', 'gardenId', 'mig', 'account', 'actAt', 'letterBox', 'resetAt', 'yearLog', 'yearNow', 'grade', 'yearPace', 'weekly', 'pantry', 'bonusFree', 'season', 'layers', 'yearly', 'visitors', 'mailSeenAt', 'pollenExtra']) delete old[k];
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
check(Array.isArray(m.letterBox) && m.letterBox.filter(b => !b.mail).length === 0, '🎁 받은 편지함 칸 · 예전 편지에는 답례품 소급 없음 (P26-06)');
const steps = (s, from, to) => { for (let i = from; i < to; i++) E.MIGRATIONS[i][1](s); return s; };   // 보정 몇 칸만 (뒤 보정이 같은 칸을 다시 고칠 때 그 칸의 일만 보려고)
const P39N = E.MIGRATIONS.findIndex(x => x[0].includes('P39'));
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
const pk = copy(st); pk.pantry = { h: 1.5, n: 7, items: [], got: 3 }; pk.mig = E.MIGRATIONS.length - 6;
check(JSON.stringify(E.migrateSave(pk).pantry) === JSON.stringify({ h: 1.5, n: 7, items: [], got: 3 }), '🧺 다음 것까지의 시간 · 차례는 보정이 건드리지 않음');
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
  check(ym.firstGuest === true && ym.letterBox.some(b => b.k === 'welcome') && ym.dried.length === E.BLENDS[ym.letterBox.find(b => b.k === 'welcome').pack.recipe].parts.reduce((a, k) => a + E.FLOWERS[k].petals, 0), 'P77-C 아직 화분을 받지 않은 예전 정원은 화분과 함께 받음 (말린 꽃잎은 두 꽃 petals 합)'); }

console.log('[📮 운영자 편지 받은 기록 mailGot (P29)]');
{ const MG = E.MIGRATIONS.findIndex(x => x[0].includes('mailGot'));
  check(MG >= 0 && JSON.stringify(E.create(MON, () => 0.5).mailGot) === '{}' && Object.keys(m.mailGot).join() === 'p39-insects,p41-money', '새 정원은 빈 기록 · 예전 정원은 P39 · P41 안내 편지 기록만');
  const old = copy(st); delete old.mailGot; old.mig = MG; const om = E.migrateSave(old);
  check(Object.keys(om.mailGot).join() === 'p39-insects,p41-money' && om.mig === E.MIGRATIONS.length, 'mailGot이 없는 정원은 빈 기록으로 (+ P39 · P41 안내 편지)');
  const got = copy(st); got.mailGot = { 'a-1': 123 }; got.mig = MG;
  check(E.migrateSave(got).mailGot['a-1'] === 123, '이미 받은 기록은 그대로'); }

console.log('[🌟 등급 보너스 bonus (P28-05-02)]');
{ const BN = E.MIGRATIONS.findIndex(x => x[0].includes('등급 보너스 bonus'));
  const zero = b => b && E.BONUS_KEYS.every(k => b[k] === 0) && Object.keys(b).length === E.BONUS_KEYS.length;
  check(BN >= 0 && zero(E.create(MON, () => 0.5).bonus) && zero(m.bonus), '새 정원 · 예전 정원 모두 0단계 (P39 곤충 칸은 0단계로)');
  const old = copy(st); delete old.bonus; delete old.bonusFree; delete old.mailGot; old.mig = BN; old.grade.xp = 5000; const om0 = old.money, om = E.migrateSave(old);
  check(zero(om.bonus) && om.mig === E.MIGRATIONS.length && om.money === om0 + (E.gradeOf(om).grade - 1) * E.POLLEN_WON, 'bonus가 없는 정원은 0단계로 · 등급으로 받은 꽃가루는 P41에서 돈으로');
  const got = copy(st); got.bonus = { worm: 0, dry: 2 }; delete got.bonusFree; delete got.mailGot; got.mig = BN; const g1 = steps(copy(got), BN, BN + 1);
  check(g1.bonus.dry === 2 && g1.bonus.basket === 0 && Object.keys(g1.bonus).length === E.BONUS_KEYS.length, '이 보정만: 이미 고른 칸(말리는 속도)은 그대로, 빠진 칸만 0 (P41이 뒤에서 모두 0단계로)'); }

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
  check(BN === 40 && FN === BN + 1 && FN === E.MIGRATIONS.length - 18, '41번째 보정 · 바로 뒤 42번째 P32 awayLast · farm (51번째 P48 · 맨 끝 52번째 P52)');
  check(m.settings.big === false && m.settings.pattern === false, '가장 옛 정원: 둘 다 꺼짐');
  const old = copy(st); delete old.settings.big; delete old.settings.pattern; old.mig = BN; const om = E.migrateSave(old);
  check(om.settings.big === false && om.settings.pattern === false && om.mig === E.MIGRATIONS.length, '바로 앞 판 정원도 둘 다 꺼짐');
  const has = copy(st); has.settings.big = true; has.settings.pattern = true; has.mig = BN; const hm = E.migrateSave(has);
  check(hm.settings.big === true && hm.settings.pattern === true, '이미 켠 값은 그대로'); }

console.log('[🧬 돌연변이 mut · dex.mutant · dex.mutjar · jar · mutBoost (P36)]');
{ const MN = E.MIGRATIONS.findIndex(x => x[0].includes('P36'));
  check(MN === 42 && MN === E.MIGRATIONS.length - 17, '43번째 보정 (바로 뒤 44번째 P37 · 45번째 P38 · 46번째 P39 · 47번째 P40 · 48번째 P41 · 49번째 P42 · 50번째 P43 · 51번째 P48)');
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
  check(PN === 43 && PN === E.MIGRATIONS.length - 16, '44번째 보정 (바로 뒤 45번째 P38 · 46번째 P39 · 47번째 P40 · 48번째 P41 · 49번째 P42 · 50번째 P43 · 51번째 P48)');
  const old = copy(st); old.bonus = { basket: 2, rack: 1, pantry: 3, catchup: 1 }; delete old.bonusFree;
  const om = steps(old, PN, PN + 1);   // 이 보정만
  check(om.bonus.basket === 2 && om.bonus.rack === 1 && om.bonus.pantry === 3 && om.bonus.catchup === 1 && om.bonus.brew === 0 && om.bonus.hive === 0 && om.bonus.weed === 0, '이 보정만: 예전 네 칸 그대로 · 새 세 칸 0'); }

console.log('[🐜 작게 시작하는 일꾼 bonus 단계 옮김 · bonusFree (P38)]');
{ const XN = E.MIGRATIONS.findIndex(x => x[0].includes('P38'));
  check(XN === 44 && XN === E.MIGRATIONS.length - 15, '45번째 보정 (바로 뒤 46번째 P39 · 47번째 P40 · 48번째 P41 · 49번째 P42 · 50번째 P43 · 51번째 P48)');
  const old = copy(st); old.bonus = { basket: 3, rack: 2, brew: 1, hive: 2, weed: 1, pantry: 0, catchup: 2 }; delete old.bonusFree;
  const om = steps(old, XN, XN + 1);   // 이 보정만 (P38 때 비용표 — 지금 BONUS는 P39라 단계 이름표만 봄)
  check(om.bonusFree && typeof om.bonusFree === 'object' && om.bonus.catchup === 2 && om.bonus.pantry === 0, '이 보정만: 덜어 준 셈 bonusFree가 생기고 선반 · 늦잠은 그대로');
  const nw = E.create(MON, () => 0.5); check(JSON.stringify(nw.bonusFree) === '{}', '새 정원은 bonusFree 빈 칸'); }

console.log('[🐝 곤충은 모두 꽃을 돕는다 (P39-11)]');
{ check(P39N === 45 && P39N === E.MIGRATIONS.length - 14, '46번째 보정 (바로 뒤 47번째 P40 · 48번째 P41 · 49번째 P42 · 50번째 P43 · 51번째 P48)');
  const p38 = copy(st); p38.mig = P39N; delete p38.mailGot; p38.grade.xp = E.gradeXpAt(30);
  p38.bonus = Object.assign(E.newBonus(), { basket: 8, rack: 7, brew: 1, hive: 3, weed: 3, pantry: 2, catchup: 1 }); p38.bonusFree = { basket: 8, rack: 8, hive: 1, weed: 3 };   // P38 끝단계 일꾼 (P38 비용표로 쓴 꽃가루 — 덜어 준 몫 빼고)
  p38.decos.push({ id: 9101, key: 'dryrack', x: 0, y: 0 }, { id: 9102, key: 'dryrack', x: 1, y: 0 }, { id: 9103, key: 'dryrack', x: null, y: null }, { id: 9104, key: 'teahelper', x: 2, y: 0 }, { id: 9105, key: 'autobasket', x: 5, y: 5, n: 40 });
  p38.layers.at[4] = 0; p38.dex.tea.chamomile = 1; p38.stats.dug = 1;
  const cal = E.calendar(p38.virtual);
  p38.flowers.push({ id: 9201, type: 'rose', x: 7, y: 7, q: 0.7, harvestKey: cal.abs, bloomKey: cal.abs }, { id: 9202, type: 'rose', x: 8, y: 7, q: 0.7, harvestKey: -1, bloomKey: -1 });
  const pm0 = p38.money, om = E.migrateSave(p38);
  check(['barrel', 'basket', 'weed', 'worm', 'rack', 'hive', 'brew'].every(k => om.bonus[k] === 0) && !('pantry' in om.bonus) && !('catchup' in om.bonus), '곤충 칸은 모두 0단계 (P39-11-02) · 🧺 선반 · 🌙 늦잠은 47번째 P40에서 없어짐');
  check(['basket', 'rack', 'hive', 'weed'].every(k => !(k in om.bonusFree)) && om.money === pm0 + 29 * E.POLLEN_WON, `쓴 꽃가루는 모두 돌아오고(P39 · P40) P41에서 받은 꽃가루 29알이 돈으로 (+${(om.money - pm0).toLocaleString()}원)`);
  check(om.decos.filter(d => d.key === 'dryshelf').length === 3 && om.decos.filter(d => d.key === 'teastand').length === 1 && om.decos.filter(d => d.key === 'dryshelf' || d.key === 'teastand').every(d => d.x == null), '누에 3 · 나비 1 → 🧺 건조 선반 3 · 🫖 찻집 도우미 1을 창고에 덤 (P39-09-03)');
  check(om.decos.filter(d => d.key === 'dryrack').length === 3 && om.decos.find(d => d.id === 9105).x === 5 && om.decos.find(d => d.id === 9105).n === 40, '가진 곤충 · 놓은 자리는 그대로 (여럿 가진 누에도 그대로)');
  check(om.decos.filter(d => d.key === 'ladybug').length === 1 && om.dex.deco.dryshelf && om.dex.deco.ladybug, '4층이 열린 정원은 🐞 무당벌레 하나 (P39-11-03) · 꾸밈 도감에도');
  const L = om.letterBox.find(b => b.mail && b.mail.id === 'p39-insects');
  check(L && !L.read && L.took === true && L.mail.gifts.length === 0 && L.mail.text.includes('꽃가루는 모두 돌려드렸어요') && L.mail.text.includes('건조 선반') && L.mail.text.includes('무당벌레도 왔어요') && L.mail.text.length <= 400, '📮 안내 편지 한 통 (P39-11-04 · 선물 없음 · 400자 안)');
  check(E.inboxUnread(om), '편지함에 안 읽은 점');
  check(om.flowers.find(f => f.id === 9201).hy === E.yearOf(om, cal) && om.flowers.find(f => f.id === 9202).hy === undefined, '올해 이미 거둔 꽃은 🦋 덤을 또 받지 않게 hy');
  const again = copy(om); delete again.mig; const a2 = E.migrateSave(again);
  check(a2.decos.length === om.decos.length && a2.letterBox.filter(b => b.mail && b.mail.id === 'p39-insects').length === 1, 'mig 없이 다시 돌아도 덤 · 편지가 또 오지 않음 (mailGot)');
  const plain = copy(st); plain.mig = P39N; delete plain.mailGot; const pm = E.migrateSave(plain);
  const PL = pm.letterBox.find(b => b.mail && b.mail.id === 'p39-insects');
  check(PL && !PL.mail.text.includes('건조 선반') && !PL.mail.text.includes('무당벌레도') && !pm.decos.some(d => ['dryshelf', 'teastand', 'ladybug'].includes(d.key)), '곤충이 없던 정원: 편지만 (덤 · 🐞 없음)');
  const nw = E.create(MON, () => 0.5);
  check(!nw.letterBox.some(b => b.mail && b.mail.id === 'p39-insects'), '새 정원엔 편지가 안 옴'); }

console.log('[🌼 그 밖에 세 칸 bonus.grow · dry · pollen · pollenExtra (P40-04) — 자세한 건 p40.test.js]');
{ const P40N = E.MIGRATIONS.findIndex(x => x[0].includes('P40-04'));
  check(P40N === 46 && P40N === E.MIGRATIONS.length - 13, '47번째 보정 (바로 뒤 48번째 P41 · 49번째 P42 · 50번째 P43 · 51번째 P48)');
  const old = copy(st); old.mig = P40N; delete old.pollenExtra; old.grade.xp = E.gradeXpAt(20);
  old.bonus = Object.assign({}, old.bonus, { pantry: 2, catchup: 1 }); delete old.bonus.grow; delete old.bonus.dry; delete old.bonus.pollen;
  const m0 = old.money, om = E.migrateSave(old);
  check(!('pantry' in om.bonus) && !('catchup' in om.bonus) && Object.keys(om.bonus).length === E.BONUS_KEYS.length && om.bonus.grow === 0 && om.bonus.dry === 0 && !('pollen' in om.bonus), '🧺 선반 · 🌙 늦잠 칸은 지우고 두 속도는 0단계 (🌼 꽃가루 늘리기는 P41에서 지움)');
  check(om.pollenExtra === 0 && om.mig === E.MIGRATIONS.length && om.money === m0 + 19 * E.POLLEN_WON, '더 받은 꽃가루 0 · 등급 20의 꽃가루 19알은 P41에서 돈으로');
  check(E.create(MON, () => 0.5).pollenExtra === 0, '새 정원은 pollenExtra 0'); }

console.log('[💰 꽃가루를 없애고 돈 + 등급으로 bonusOwn (P41-05) — 자세한 건 p41.test.js]');
{ const P41N = E.MIGRATIONS.findIndex(x => x[0].includes('P41-05'));
  check(P41N === 47 && P41N === E.MIGRATIONS.length - 12, '48번째 보정 (바로 뒤 49번째 P42 · 50번째 P43 · 51번째 P48)');
  const old = copy(st); old.mig = P41N; delete old.bonusOwn; delete old.mailGot; old.grade.xp = E.gradeXpAt(41); old.pollenExtra = 0;
  old.bonus = Object.assign(E.newBonus(), { grow: 9, dry: 9, pollen: 0, barrel: 2, basket: 2, weed: 2 });
  const m0 = old.money, om = E.migrateSave(old);
  check(E.BONUS_KEYS.every(k => om.bonus[k] === 0) && !('pollen' in om.bonus) && JSON.stringify(om.bonusOwn) === '{}', '기르기 칸 모두 0단계 · 산 단계 없음 (×10 · 곤충 3칸이었어도)');
  check(om.money === m0 + 200000, `받은 꽃가루 40알 × 5,000원 = 200,000원 (+${(om.money - m0).toLocaleString()}원)`);
  const L = om.letterBox.filter(b => b.mail && b.mail.id === E.P41_LETTER);
  check(L.length === 1 && !L[0].read && L[0].took === true && L[0].mail.gifts.length === 0 && L[0].mail.text.includes('200,000원') && L[0].mail.text.length <= 400, `📮 안내 편지 한 통 (선물 없음 · ${L[0] && L[0].mail.text.length}자)`);
  const again = copy(om); delete again.mig; const a2 = E.migrateSave(again);
  check(a2.money === om.money && a2.letterBox.filter(b => b.mail && b.mail.id === E.P41_LETTER).length === 1, 'mig 없이 다시 돌아도 돈 · 편지가 또 오지 않음 (mailGot)');
  const nw = E.create(MON, () => 0.5);
  check(JSON.stringify(nw.bonusOwn) === '{}' && !nw.letterBox.some(b => b.mail && b.mail.id === E.P41_LETTER), '새 정원: bonusOwn 빈 칸 · 편지 없음'); }

console.log('[🌱🌾 두 속도 8단계 speedSteps (P42) — 자세한 건 p42.test.js]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P42'));
  check(N === 48 && N === E.MIGRATIONS.length - 11, '49번째 보정 (뒤에 50번째 P43 · 51번째 P48)');
  const old = copy(st); old.mig = N; delete old.speedSteps; old.bonus = Object.assign(E.newBonus(), { grow: 1, dry: 2 }); old.bonusOwn = { dry: 2 }; const m0 = old.money; const om = E.migrateSave(old);
  check(om.bonus.grow === 2 && om.bonus.dry === 4 && om.bonusOwn.dry === 4 && om.money === m0 && om.speedSteps === E.SPEED_V && om.mig === E.MIGRATIONS.length, '×2 → 2단계 · ×3 → 4단계 (쓰는 · 산 단계 모두) · 돈 그대로');
  check(E.create(MON, () => 0.5).speedSteps === E.SPEED_V, '새 정원은 옮긴 것으로 시작'); }

console.log('[⛏️ 광산 기력 15 · 새 판 (P43 — 판 크기는 지금 MINE_W × MINE_H)]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P43'));
  check(N === 49 && N === E.MIGRATIONS.length - 10, '50번째 보정 (바로 뒤 51번째 P48)');
  const old = copy(st); old.mig = N; old.gardenId = 'mig-p43';
  old.mine = { energy: 12, regenH: 0.2, depth: 6, deepest: 9, boards: 30, bag: { stone: 40, amethyst: 2 }, board: { depth: 6, cells: Array.from({ length: 48 }, (_, i) => ({ k: i % 2 ? 'stone' : 'dirt', dug: i < 10, stairs: i === 47 })) } };
  const om = E.migrateSave(old), m = om.mine;
  check(m.board.cells.length === 36 && m.board.depth === 6 && m.board.cells.every(c => !c.dug) && m.board.cells.filter(c => c.stairs).length === 1, '48칸 판 → 같은 층(6층)의 새 36칸 판');
  check(m.depth === 6 && m.deepest === 9 && m.bag.stone === 40 && m.bag.amethyst === 2 && m.energy === 12 && om.mig === E.MIGRATIONS.length, '가방 · 층 · 가장 깊이 · 기력(15 아래면) 그대로');
  const o2 = copy(st); o2.mig = N; o2.mine = Object.assign(copy(m), { energy: 40 }); const b0 = JSON.stringify(o2.mine.board);
  const m2 = E.migrateSave(o2).mine;
  check(m2.energy === 15 && JSON.stringify(m2.board) === b0, '기력은 15로 자름 · 이미 36칸 판은 그대로');
  const o3 = copy(st); o3.mig = N; delete o3.mine;
  check(!E.migrateSave(o3).mine, '광산을 안 연 정원은 그대로'); }

console.log('[⛏️ 광산 6×6 (P48)]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P48'));
  check(N === 50 && N === E.MIGRATIONS.length - 9, '51번째 보정 (바로 뒤 52번째 P52)');
  const old = copy(st); old.mig = N; old.gardenId = 'mig-p48';
  old.mine = { energy: 9, regenH: 0.01, depth: 4, deepest: 7, boards: 12, bag: { stone: 5 }, board: { depth: 4, cells: Array.from({ length: 25 }, (_, i) => ({ k: 'dirt', dug: i < 8, stairs: i === 24 })) } };
  const om = E.migrateSave(old), m = om.mine;
  check(m.board.cells.length === 36 && m.board.depth === 4 && m.board.cells.every(c => !c.dug) && m.board.cells.filter(c => c.stairs).length === 1, '25칸 판 → 같은 층(4층)의 새 36칸 판');
  check(m.depth === 4 && m.deepest === 7 && m.bag.stone === 5 && m.energy === 9 && om.mig === E.MIGRATIONS.length, '가방 · 층 · 가장 깊이 · 기력 그대로');
  const o2 = copy(st); o2.mig = N; o2.mine = copy(m); const b0 = JSON.stringify(o2.mine.board);
  check(JSON.stringify(E.migrateSave(o2).mine.board) === b0, '이미 36칸 판은 그대로');
  const o3 = copy(st); o3.mig = N; delete o3.mine;
  check(!E.migrateSave(o3).mine, '광산을 안 연 정원은 그대로'); }

console.log('[⬆️ 위 칸 장식 topDeco (P52)]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P52'));
  check(N === 51 && N === E.MIGRATIONS.length - 8, '52번째 보정 (바로 뒤 53번째 P53)');
  const old = copy(st); old.mig = N; delete old.topDeco;
  const om = E.migrateSave(old);
  check(om.topDeco === null && om.mig === E.MIGRATIONS.length, '예전 정원은 빈 위 칸(null)');
  const o2 = copy(st); o2.mig = N; o2.decos = [{ id: 900, key: 'bench', x: null, y: null }]; o2.topDeco = 900;
  check(E.migrateSave(o2).topDeco === 900, '이미 단 장식은 그대로');
  const o3 = copy(st); o3.topDeco = 12345;
  check(E.migrateSave(o3).topDeco === null, '없어진 장식 id면 열 때 비움 (onOpen)');
  check(E.create(MON, () => 0.5).topDeco === null && E.SEASON_KEEP.includes('topDeco'), '새 정원은 null · 새 철에도 이어짐'); }

console.log('[🌹 프리저브드 플라워 (P53)]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P53'));
  check(N === 52 && N === E.MIGRATIONS.length - 7, '53번째 보정 (바로 뒤 54번째 P65)');
  const old = copy(st); old.mig = N; delete old.presol; delete old.preserving; delete old.preserved; delete old.dex.pres; delete old.dex.presMut;
  const om = E.migrateSave(old);
  check(om.presol === 0 && Array.isArray(om.preserving) && !om.preserving.length && Array.isArray(om.preserved) && !om.preserved.length && om.mig === E.MIGRATIONS.length, '예전 정원은 용액 0 · 빈 유리 돔 · 빈 창고');
  check(JSON.stringify(om.dex.pres) === '{}' && JSON.stringify(om.dex.presMut) === '{}', '도감 두 쪽은 빈 칸으로');
  const o2 = copy(st); o2.mig = N; o2.presol = 3; o2.preserving = [{ id: 901, type: 'rose', mut: false, leftH: 5 }]; o2.preserved = [{ id: 902, type: 'lotus', mut: true }]; o2.dex.pres = { rose: true };
  const m2 = E.migrateSave(o2);
  check(m2.presol === 3 && m2.preserving[0].leftH === 5 && m2.preserved[0].type === 'lotus' && m2.dex.pres.rose, '이미 있는 용액 · 돔 · 창고 · 도감은 그대로');
  const n = E.create(MON, () => 0.5);
  check(n.presol === 0 && n.preserving.length === 0 && n.preserved.length === 0 && n.dex.pres && n.dex.presMut && E.SEASON_KEEP.includes('presol') && E.SEASON_KEEP.includes('preserved'), '새 정원 기본값 · 새 철엔 용액만 이어짐 (도감은 dex로)'); }

console.log('[🍯 벌통 꿀 → 창고 (P65-01)]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P65-01'));
  check(N === 53 && N === E.MIGRATIONS.length - 6, '54번째 보정 (맨 끝)');
  const old = copy(st); old.mig = N; old.honey = { rose: 2 }; old.dex.honey = { rose: true };
  old.decos = [{ id: 950, key: 'hive', x: 3, y: 3, honey: ['lavender', 'lavender', 'wild'] }, { id: 951, key: 'bench', x: null, y: null }];
  const om = E.migrateSave(old);
  check(om.honey.lavender === 2 && om.honey.wild === 1 && om.honey.rose === 2 && om.mig === E.MIGRATIONS.length, '벌통에 쌓인 꿀 3병 → 창고 꿀 칸 (예전 선반 꿀 2병은 그대로)');
  check(om.dex.honey.lavender && om.dex.honey.wild && om.decos[0].honey === undefined && om.decos[0].x === 3, '꿀 도감에도 · 벌통은 비고 제자리');
  const o2 = copy(st); o2.mig = N; delete o2.honey;
  check(JSON.stringify(E.migrateSave(o2).honey) === '{}', '꿀이 없던 정원은 빈 칸'); }

console.log('[🪏 삽 · ⛏️ 자동 캐기 (P83)]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P83'));
  check(N === 56 && N === E.MIGRATIONS.length - 3, '57번째 보정 (바로 뒤 58번째 P84)');
  const old = copy(st); old.mig = N; delete old.shovel; if (old.mine) { delete old.mine.auto; delete old.mine.autoStop; delete old.mine.autoLog; }
  const om = E.migrateSave(old);
  check(om.shovel === 10 && om.mig === E.MIGRATIONS.length, '예전 정원은 삽 1개(10번)');
  check(!om.mine || (om.mine.auto === false && om.mine.autoStop === null && om.mine.autoLog === null), '자동 캐기는 꺼짐');
  const o2 = copy(st); o2.mig = N; o2.shovel = 3; o2.mine = Object.assign({ energy: 5, regenH: 0, depth: 2, deepest: 2, boards: 1, board: null, bag: {} }, { auto: true, autoStop: null, autoLog: { n: 2, paid: 640, jewels: 0, won: 0, down: 0, downWon: 0, bag: { dirt: 2 } } });
  const m2 = E.migrateSave(o2);
  check(m2.shovel === 3 && m2.mine.auto === true && m2.mine.autoLog.n === 2, '이미 있는 삽 · 자동 캐기는 그대로');
  const cl = E.cleanSave(Object.assign(copy(st), { shovel: '7', mine: { autoLog: { n: '4', bag: { stone: '2' } } } }));
  check(cl.shovel === 7 && cl.mine.autoLog.n === 4 && cl.mine.autoLog.bag.stone === 2, '삽 · 자동 캐기 일지 숫자 칸도 cleanSave가 정리'); }

console.log('[🌹 프리저브드 장식 (P84)]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P84'));
  check(N === 57 && N === E.MIGRATIONS.length - 2, '58번째 보정 (바로 뒤 59번째 P90)');
  const old = copy(st); old.mig = N; delete old.preserved; old.decos = [{ id: 960, key: 'pres', pres: { type: 'rose', mut: false }, x: 3, y: 3, at: 5 }, { id: 961, key: 'pres', x: 4, y: 3 }, { id: 962, key: 'pres', pres: { type: 'nope' }, x: 5, y: 3 }, { id: 963, key: 'bench', x: 6, y: 3 }];
  const om = E.migrateSave(old);
  check(Array.isArray(om.preserved) && om.mig === E.MIGRATIONS.length, '창고 칸은 늘 배열');
  check(om.decos.map(d => d.id).join() === '960,963', '꽃을 모르는 프리저브드 장식만 지움');
  const cl = E.cleanSave(Object.assign(copy(st), { decos: [{ id: 960, key: 'pres', pres: { type: 'rose' }, x: 3, y: 3, at: '12' }] }));
  check(cl.decos[0].at === 12, 'd.at 숫자 칸도 cleanSave가 정리'); }

console.log('[🧺 저장고 자동 (P90)]');
{ const N = E.MIGRATIONS.findIndex(x => x[0].includes('P90'));
  check(N === 58 && N === E.MIGRATIONS.length - 1, '59번째 보정 (맨 끝)');
  const old = copy(st); old.mig = N; old.water = 2; old.fert = 3; old.mine.bag = { dirt: 1 }; old.petals = []; delete old.dex.petal.rose;
  old.pantry = { h: 1.5, n: 7, got: 3, items: [{ k: 'water' }, { k: 'fert' }, { k: 'dirt' }, { k: 'quartz' }, { k: 'petal', type: 'rose', q: 0.7, seasonKey: 's' }, { k: 'petal', type: 'nope', q: 0.7 }, { k: 'what' }] };
  const om = E.migrateSave(old);
  check(om.water === 3 && om.fert === 4 && om.mine.bag.dirt === 2 && om.mine.bag.quartz === 1, '쌓여 있던 물병 · 비료 · 흙 · 석영이 들어옴');
  check(om.petals.length === 1 && om.petals[0].type === 'rose' && om.petals[0].auto && om.dex.petal.rose, '떨어진 꽃잎은 제다실로 (도감에도) · 모르는 꽃은 건너뜀');
  check(om.pantry.items.length === 0 && om.pantry.got === 8 && om.pantry.h === 1.5 && om.pantry.n === 7 && om.mig === E.MIGRATIONS.length, '칸은 비고 · 받은 수만 늘고 · 시간 · 차례는 그대로');
  const again = E.migrateSave(om); check(again.water === 3, '한 번만 넣어 줌');
  const none = copy(st); none.mig = N; delete none.pantry; check(E.migrateSave(none).mig === E.MIGRATIONS.length, '저장고 칸이 없어도 멈추지 않음'); }

console.log('[여러 번 열어도 같음]');
const again = copy(m), before = JSON.stringify(again);
E.migrateSave(again); delete again.mig;
check(m.settings.notify === false, 'R-C2 🔔 브라우저 알림 칸은 기본 꺼짐');
const b2 = JSON.parse(before); delete b2.mig;
check(JSON.stringify(again) === JSON.stringify(b2), '두 번째로 열 때 바뀌는 것이 없음');
const redo = copy(m); delete redo.mig; const ref = JSON.stringify(m);
check(JSON.stringify(E.migrateSave(redo)) === ref, 'mig가 없어 처음부터 다시 돌아도 결과가 같음');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
