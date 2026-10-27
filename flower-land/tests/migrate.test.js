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
for (const k of ['water', 'shears', 'hoe', 'basket', 'drying', 'dried', 'blends', 'cups', 'gardenId', 'mig', 'account', 'actAt', 'letterBox', 'resetAt', 'yearLog', 'yearNow', 'grade', 'yearPace', 'weekly']) delete old[k];
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
const wk = copy(st); delete wk.weekly; wk.mig = E.MIGRATIONS.length - 1; const wm = E.migrateSave(wk);
check(wm.weekly === null && wm.mig === E.MIGRATIONS.length, '🗓️ 주간 목표 보정은 맨 끝 · 예전 정원은 null로 (P28-09)');
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

console.log('[여러 번 열어도 같음]');
const again = copy(m), before = JSON.stringify(again);
E.migrateSave(again); delete again.mig;
const b2 = JSON.parse(before); delete b2.mig;
check(JSON.stringify(again) === JSON.stringify(b2), '두 번째로 열 때 바뀌는 것이 없음');
const redo = copy(m); delete redo.mig; const ref = JSON.stringify(m);
check(JSON.stringify(E.migrateSave(redo)) === ref, 'mig가 없어 처음부터 다시 돌아도 결과가 같음');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
