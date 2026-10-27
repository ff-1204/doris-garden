// 📈 해마다 기록 (P28-07-01, 10-27): 쉼달 기록마다 그해 한 줄 — 수입 · 판 잔 · 거둔 꽃잎 · 주문 · 점수 · 등급 자리 · 도감
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const years = st => E.yearLogOf(st).map(r => r.year).join(',');
const unique = st => new Set(st.yearLog.map(r => r.year)).size === st.yearLog.length;

console.log('[새 정원]');
const st0 = E.create(mon + 0.1 * H, () => 0.5);
check(Array.isArray(st0.yearLog) && st0.yearLog.length === 0, '해마다 기록은 빈 줄로 시작');
check(JSON.stringify(st0.yearNow) === JSON.stringify({ income: 0, sold: 0, harvest: 0 }), '올해 쌓는 중: 수입 · 판 잔 · 꽃잎 0');

console.log('[4년 돌보기 (12-3 여정)]');
const st = E.create(mon + 0.1 * H, () => 0.5); st.gardenId = 'yearlog-1'; st.onboarded = true;
E.giftPot(st, ctx);
const pot = st.flowers[0];
const want = []; let cur = { income: 0, sold: 0, harvest: 0 }, recN = 0, n = 0, soldIn = -1;
const end = st.virtual + 4 * 7 * 24 * H;
while (st.virtual < end) {
  const cal = E.calendar(st.virtual);
  // 핀 화분 꽃은 거둠 (꽃잎 수 = 늘어난 꽃잎)
  if (pot && !pot.withered) { const p0 = st.petals.length; if (E.care(st, 'harvest', [[pot.x, pot.y]], ctx).ok) cur.harvest += st.petals.length - p0; }
  // 찻집이 열리면 달마다 차 두 잔을 우려 바로 팖
  if (E.teaShopOpen(cal) && soldIn !== cal.abs) {
    soldIn = cal.abs;
    for (let i = 0; i < 2; i++) st.teas.push({ id: 90000 + n++, type: 'chamomile', q: 1, seasonKey: -1, hat: false });
    E.brew(st, st.teas.map(t => t.id), []);
    const m0 = st.money, k = st.cups.length;
    if (E.sellCups(st, st.cups.map(c => c.id), ctx).ok) { cur.income += st.money - m0; cur.sold += k; }
  }
  E.advance(st, st.virtual + H, ctx);
  if (st.records.length > recN) { recN = st.records.length; want.push(cur); cur = { income: 0, sold: 0, harvest: 0 }; }
}
const log = E.yearLogOf(st);
check(log.length === 4 && years(st) === '1,2,3,4', `4년이면 줄 4개, 1~4년차 순서 (${years(st)})`);
check(unique(st), '같은 해 두 줄 없음');
check(log.every(r => { const rec = st.records.find(x => x.year === r.year); return rec && r.score === rec.score && r.dex === rec.dex && r.dexTotal === rec.dexTotal; }), '줄마다 점수 · 도감이 그해 쉼달 기록과 같음');
check(log.every((r, i) => r.income === want[i].income && r.sold === want[i].sold), '수입 · 판 잔이 그해(기록과 기록 사이) 판 찻잔 값 · 잔 수와 같음 — 용돈은 넣지 않음');
check(log.some(r => r.income > 0) && log.every(r => r.sold === 0 || r.income > 0), '판 해에는 수입이 있음');
check(log.every((r, i) => r.harvest === want[i].harvest) && log.some(r => r.harvest > 0), `거둔 꽃잎이 그해 거둔 수와 같음 (${log.map(r => r.harvest).join(',')})`);
check(log.every((r, i) => Number.isInteger(r.grade) && r.grade >= 1 && (i === 0 || r.grade >= log[i - 1].grade)), `등급은 그해 끝 정원 등급 (P28-05-01 · ${log.map(r => r.grade).join(',')})`);
check(log.every(r => Number.isInteger(r.orders) && r.orders >= 0), '들어준 주문 수 (그해)');
check(log.every(r => !('part' in r)), '새 정원 줄에는 "일부만" 표시 없음');
check(JSON.stringify(st.yearNow) === JSON.stringify(cur), '기록 뒤 올해 쌓는 칸은 새로 셈');

console.log('[저장 · 불러오기]');
const d = E.makeSave(st, 1);
const r = E.parseSave(JSON.stringify(d));
const back = r.ok && E.migrateSave(r.data.game);
check(back && JSON.stringify(E.yearLogOf(back)) === JSON.stringify(log), '파일로 저장 · 다시 열어도 4줄 그대로');
check(back && JSON.stringify(back.yearNow) === JSON.stringify(st.yearNow), '올해 쌓는 중도 그대로');
const again = E.migrateSave(copy(back));
check(JSON.stringify(E.yearLogOf(again)) === JSON.stringify(log), '여러 번 열어도 같음');

console.log('[읽기 함수]');
const got = E.yearLogOf(st); got[0].income = -1; got.pop();
check(st.yearLog.length === 4 && st.yearLog[0].income !== -1, 'yearLogOf는 사본을 줌 (고쳐도 정원은 그대로)');
check(E.yearLogOf({}).length === 0, '기록이 없는 정원은 빈 줄');

console.log('[꽃잠을 건너 한꺼번에 (05-6 여정)]');
const jump = E.create(mon + 0.1 * H, () => 0.5); jump.gardenId = 'yearlog-2';
E.advance(jump, mon + (3 * 7 + 1) * 24 * H, ctx);   // 3주 + 하루를 한 번에
check(years(jump) === '1,2,3' && unique(jump), `쉼달마다 한 줄씩만 (${years(jump)})`);
check(jump.yearLog.every(r => r.score === jump.records.find(x => x.year === r.year).score), '한꺼번에 넘어도 점수가 기록과 같음');
// 쉼달 안에서 다시 열기 · 같은 쉼달 칸이 또 돌아도 줄은 하나
const zz = E.create(mon + 0.1 * H, () => 0.5); zz.gardenId = 'yearlog-3';
let t = zz.virtual; while (E.calendar(t).idx !== 12) t += H; E.advance(zz, t + 2 * H, ctx);
check(E.calendar(zz.virtual).frozen && years(zz) === '1', '쉼달에 들어가면 1년차 한 줄');
const zz2 = E.migrateSave(copy(zz)); E.advance(zz2, zz2.virtual + 3 * H, ctx);
check(years(zz2) === '1', '꽃잠에 다시 열어 시간이 흘러도 그대로 한 줄');
zz2.lastAbs = -1; E.advance(zz2, zz2.virtual + H, ctx);   // 같은 쉼달 칸이 한 번 더 돌면
check(years(zz2) === '1' && unique(zz2), '같은 해 기록이 또 생겨도 한 줄 (나중 것으로)');
E.advance(zz2, zz2.virtual + 24 * H, ctx);
check(years(zz2) === '1', '꽃샘달 · 다음 월요일로 넘어가도 새 줄은 다음 쉼달에');

console.log('[업데이트한 해 (예전 정원)]');
const old = copy(st); delete old.yearLog; delete old.yearNow; old.mig = E.MIGRATIONS.findIndex(x => x[0].includes('yearLog'));
const m = E.migrateSave(old);
check(m.yearLog.length === 4 && m.yearLog.every(r => r.income === null && r.sold === null && r.harvest === null), '예전 정원: 4줄, 수입 · 판 잔 · 꽃잎은 모름(null)');
check(m.yearLog.every((r, i) => r.score === log[i].score && r.orders === log[i].orders && r.dex === log[i].dex), '점수 · 주문 · 도감은 남은 기록으로 채움');
check(m.yearNow.part === true && m.yearNow.income === 0, '올해는 업데이트 뒤부터 셈 (part)');
let u = m.virtual; const r0 = m.records.length; while (m.records.length === r0) { E.advance(m, u + H, ctx); u = m.virtual; }
check(m.yearLog.length === 5 && m.yearLog[4].part === true && m.yearLog[4].year === 5, '업데이트한 해의 줄에는 "일부만" 표시');
check(!m.yearNow.part, '그다음 해부터는 처음부터 셈');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
