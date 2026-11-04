// 📈 해마다 그래프 (P28-07-02, 10-28): 축 범위 · 최근 10해 자르기 · 빈 기록 · 지난해 견줌 · 지난해 같은 때
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const row = (year, income, score, grade, extra) => Object.assign({ year, income, sold: 0, harvest: 0, orders: 0, score, grade, dex: 10, dexTotal: 93 }, extra || {});
const withLog = rows => { const st = E.create(mon + 0.1 * H, () => 0.5); st.yearLog = rows; return st; };

console.log('[축 범위]');
const a0 = E.graphAxis([]), aZero = E.graphAxis([0, 0, null]);
check(a0.top === 0 && aZero.top === 0 && aZero.ticks.length === 1, '값이 없거나 모두 0 · 모름이면 빈 축 (top 0)');
const a1 = E.graphAxis([1234, 5600, 8100]);
check(a1.top === 10000 && a1.step === 2500 && a1.ticks.join(',') === '0,2500,5000,7500,10000', `수입 8,100원 → 0 ~ 10,000 · 2,500 간격 (${a1.ticks.join(',')})`);
const a2 = E.graphAxis([120, 188, null, 95]);
check(a2.top === 200 && a2.ticks.length === 5 && a2.top >= 188, `점수 188 → 0 ~ 200 · 50 간격, 모름(null)은 빼고 (${a2.ticks.join(',')})`);
const a3 = E.graphAxis([3]);
check(a3.step === 1 && a3.top === 3 && a3.ticks.join(',') === '0,1,2,3', `작은 값(등급 3)은 1 간격 · 0.5 같은 눈금 없음 (${a3.ticks.join(',')})`);
const a4 = E.graphAxis([200]);
check(a4.top === 200 && a4.step === 50, `딱 맞는 값은 한 칸 더 늘리지 않음 (200 → ${a4.top})`);
check([7, 41, 999, 12345, 98765].every(v => { const a = E.graphAxis([v]); return a.top >= v && a.top <= v * 2.5 && a.ticks[a.ticks.length - 1] === a.top; }), '어떤 값이든 top은 값 이상 · 2.5배 안 · 마지막 눈금 = top');

console.log('[빈 기록 · 한 해]');
const g0 = E.graphYears(withLog([]));
check(g0.empty && g0.total === 0 && g0.rows.length === 0, '해가 없으면 empty');
const g1 = E.graphYears(withLog([row(1, 3000, 80, 6)]));
check(g1.empty && g1.rows.length === 1, '해가 하나뿐이어도 empty (안내 문구 자리)');
const g4 = E.graphYears(withLog([1, 2, 3, 4].map(y => row(y, y * 1000, y * 50, y * 4))));
check(!g4.empty && g4.rows.length === 4 && !g4.prev && !g4.next && g4.rows.map(r => r.income).join(',') === '1000,2000,3000,4000', '4해면 4칸 모두 · 넘김 없음');

console.log('[최근 10해 자르기]');
const st14 = withLog(Array.from({ length: 14 }, (_, i) => row(i + 1, (i + 1) * 100, i * 10, i + 1)));
const g14 = E.graphYears(st14);
check(g14.rows.length === 10 && g14.rows[0].year === 5 && g14.rows[9].year === 14 && g14.prev && !g14.next, '14해면 처음엔 가장 최근 10해 (5~14년차) · 앞으로 넘김 있음');
const gBack = E.graphYears(st14, 10, g14.from - 1);
check(gBack.rows[0].year === 1 && gBack.rows.length === 10 && !gBack.prev && gBack.next, '앞으로 넘기면 1~10년차 · 뒤로 넘김 있음');
const gFar = E.graphYears(st14, 10, -5), gOver = E.graphYears(st14, 10, 99);
check(gFar.rows[0].year === 1 && gFar.rows.length === 10 && gOver.rows[9].year === 14, '넘김 자리가 범위를 넘어도 10칸을 채움');
const g5 = E.graphYears(st14, 5);
check(g5.rows.length === 5 && g5.rows[0].year === 10, '보일 칸 수를 줄이면 (좁은 화면) 최근 5해');
st14.yearLog[0].income = -1;
check(g14.rows[0].income === 500, 'graphYears는 사본 (나중에 정원이 바뀌어도 그대로)');

console.log('[지난해 견줌]');
const d1 = E.yearDiff(row(4, 11200, 188, 17), row(3, 10000, 180, 14));
check(d1 && d1.income === 12 && d1.score === 8 && d1.grade === 3, `수입 +12% · 점수 +8 · 등급 +3 (${JSON.stringify(d1)})`);
const d2 = E.yearDiff(row(2, 900, 70, 8), row(1, 1000, 90, 7));
check(d2.income === -10 && d2.score === -20, '줄어든 해는 음수');
check(E.yearDiff(row(2, 900, 70, 8), row(1, 0, 90, 7)).income === null, '지난해 수입 0이면 %는 없음 (점수는 견줌)');
check(E.yearDiff(row(2, 900, 70, 8), row(1, null, 90, null)).income === null && E.yearDiff(row(2, 900, 70, 8), row(1, null, 90, null)).grade === null, '예전 정원(모름 null)은 그 칸만 빼고');
check(E.yearDiff(row(2, 900, 70, 8, { part: true }), row(1, 500, 60, 7)).income === null, '업데이트한 해(일부만 셈)는 수입 % 없음');
check(E.yearDiff(row(2, null, null, null), row(1, null, null, null)) === null && E.yearDiff(null, row(1, 1, 1, 1)) === null, '견줄 것이 하나도 없으면 null');
const gap = withLog([row(1, 1000, 50, 5), row(3, 2000, 60, 6), row(4, 2200, 70, 7)]);
check(E.yearDiffOf(gap, 3) === null && E.yearDiffOf(gap, 4).income === 10 && E.yearDiffOf(gap, 1) === null, '바로 앞 해가 없으면 (건너뛴 해 · 첫 해) 견주지 않음');

console.log('[지난해 같은 때 — 손으로 만든 값]');
const sp = E.create(mon + 0.1 * H, () => 0.5);
const wed = mon + 7 * 24 * H + 4 * 12 * H + 6 * H;             // 둘째 주 수요일 오후 = 그해 6째 달(5월) 한가운데
const cw = E.calendar(wed);
check(E.yearMonth(cw) === 4 + 2 && Math.abs((cw.yh - cw.idx * 12) / 12 - 0.5) < 1e-9, `둘째 주 5월 한가운데 = 그해 ${E.yearMonth(cw)}째 달 · 반`);
const lastP = Array.from({ length: 14 }, (_, i) => [(i + 1) * 1000, (i + 1) * 40]);
sp.firstWeek = cw.week - 1;                                     // 지금이 2년차 → 지난해는 1년차
sp.yearPace = { xp0: 500, now: [], last: lastP, lastYear: 1 };
sp.grade.xp = 500 + 300; sp.yearNow.income = 8000;
const pc = E.yearPace(sp, cw);
check(pc && pc.income.then === 6500 && pc.xp.then === 260, `지난해 같은 때 = 5째 · 6째 달 끝 값 사이 반 (수입 ${pc && pc.income.then} · 경험치 ${pc && pc.xp.then})`);
check(pc.income.now === 8000 && pc.income.diff === 1500 && pc.xp.now === 300 && pc.xp.diff === 40, '올해 지금까지 수입 8,000 (+1,500) · 경험치 300 (+40)');
const cSun = E.calendar(cw.ws + 12 * 12 * H + 3 * H);           // 쉼달 (그해 0째 달) — 새해 첫 달은 0부터
sp.firstWeek = cSun.week - 1; sp.yearPace.lastYear = E.propYearOf(sp, cSun) - 1;   // 쉼달은 다음 해 몫
const p0 = E.yearPace(sp, cSun);
check(p0 && p0.month === 0 && p0.income.then === 250, `새해 첫 달(쉼달)은 0에서 첫 달 끝 값으로 (${p0 && p0.income.then})`);
sp.yearPace.lastYear = 0;
check(E.yearPace(sp, cw) === null, '지난해 값이 바로 앞 해 것이 아니면 (건너뛴 해) 없음');
sp.firstWeek = cw.week - 1; sp.yearPace.lastYear = 1; sp.yearPace.last = lastP.map((x, i) => i === 5 ? null : x);
check(E.yearPace(sp, cw) === null, '지난해 그 달 값이 비었으면 없음');
sp.yearPace.last = lastP; sp.yearNow.part = true;
const pPart = E.yearPace(sp, cw);
check(pPart && pPart.income === null && pPart.xp.diff === 40, '올해 수입을 다 못 센 해(업데이트)는 수입만 빼고 경험치는 견줌');
sp.yearPace.xp0 = null;
check(E.yearPace(sp, cw) === null, '올해 시작 값을 모르면 (예전 정원) 없음');

console.log('[지난해 같은 때 — 3년 돌린 정원 (05-6 여정)]');
const st = E.create(mon + 0.1 * H, () => 0.5); st.gardenId = 'graph-1'; st.onboarded = true;
let n = 0, soldIn = -1;
const run = until => {
  while (st.virtual < until) {
    const cal = E.calendar(st.virtual);
    if (E.teaShopOpen(cal) && soldIn !== cal.abs) {           // 찻집이 열리면 달마다 두 잔
      soldIn = cal.abs;
      for (let i = 0; i < 2; i++) st.teas.push({ id: 90000 + n++, type: 'chamomile', q: 1, seasonKey: -1, hat: false });
      E.brew(st, st.teas.map(t => t.id), []);
      E.sellCups(st, st.cups.map(c => c.id), ctx);
    }
    E.advance(st, Math.min(until, st.virtual + H), ctx);
  }
};
run(mon + 7 * 24 * H + 0.5 * H);                                 // 1년차 쉼달 기록 뒤 (0년차 정원이 아님 → 1년차는 월요일부터)
check(st.records.length === 1 && st.yearPace.lastYear === 1 && st.yearPace.last.length === 14, `1년차 기록 뒤: 지난해 달마다 값 14칸 (${st.yearPace.last.length})`);
check(st.yearPace.last.every((x, i) => x && (i === 0 || (x[0] >= st.yearPace.last[i - 1][0] && x[1] >= st.yearPace.last[i - 1][1]))), '달마다 쌓인 값은 줄지 않음');
check(st.yearPace.last[13][0] === E.yearLogOf(st)[0].income, '마지막 달 끝 수입 = 그해 해마다 기록 수입');
check(E.yearPace(st) === null || E.yearPace(st).year === 2, '1년차는 그 앞 해가 없어 2년차부터 견줌');
run(mon + 7 * 24 * H + 12 * 12 * H + 0.5 * H);                  // 2년차 쉼달 기록 뒤 (둘째 주 일요일)
run(mon + 2 * 7 * 24 * H + 9 * 12 * H + 6 * H);                 // 3년차: 셋째 주 12월 한가운데 (찻집이 열린 뒤)
const pr = E.yearPace(st);
check(pr && pr.year === 3 && pr.income && pr.xp, `3년차 지금 견줌이 있음 (${pr && JSON.stringify(pr)})`);
check(pr.income.now === st.yearNow.income && pr.xp.now === st.grade.xp - st.yearPace.xp0, '올해 지금까지 = 올해 쌓는 칸 · 올해 오른 경험치');
check(pr.income.then <= st.yearPace.last[13][0] && pr.income.then >= 0, '지난해 같은 때 수입은 지난해 전체를 넘지 않음');
const back = E.migrateSave(E.parseSave(JSON.stringify(E.makeSave(st, 1))).data.game);
check(JSON.stringify(E.yearPace(back)) === JSON.stringify(pr), '파일로 저장 · 다시 열어도 같은 견줌');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
