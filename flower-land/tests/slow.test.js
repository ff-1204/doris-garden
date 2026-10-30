// P28-02 🐢 느긋하게 보기: 판단 함수 slowView · 기본값 꺼짐 · 저장 · 불러오기 · 숨겨도 얻는 규칙은 그대로
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const copy = o => JSON.parse(JSON.stringify(o));

console.log('[판단 함수 · 기본값]');
const st = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5);
check(st.settings.slow === false && E.slowView(st) === false, '새 정원은 꺼짐');
st.settings.slow = true;
check(E.slowView(st) === true, '켜면 true');
check(E.slowView(null) === false && E.slowView({}) === false && E.slowView({ settings: {} }) === false, '정원 · 설정이 없으면 꺼짐');

console.log('[저장 · 불러오기]');
const r = E.parseSave(JSON.stringify(E.makeSave(st, 12345)));
check(r.ok && r.data.game.settings.slow === true && E.slowView(E.migrateSave(r.data.game)), '파일로 저장해 열어도 켜진 그대로');
const old = copy(st); delete old.settings.slow; old.mig = E.MIGRATIONS.findIndex(m => m[0].includes('settings.slow'));
check(E.migrateSave(old).settings.slow === false, '예전 정원은 보정으로 꺼짐 (MIGRATIONS 끝)');
const kept = copy(st); delete kept.mig;
check(E.migrateSave(kept).settings.slow === true, '보정을 처음부터 다시 돌아도 켠 값은 그대로');

console.log('[칭호: 연출 없이 도감에만]');
const title = slow => {
  const g = E.create(at(c => c.month === 6 && !c.frozen), () => 0.5); g.onboarded = true; g.settings.slow = slow;
  const toasts = []; E.checkJournal(g, { live: true, toast: t => toasts.push(t) });
  return { g, toasts };
};
const off = title(false), on = title(true);
check(off.g.titles.t_visit != null && (off.g._newTitles || []).includes('t_visit') && off.toasts.some(t => t.includes('새 칭호')), '꺼짐: 칭호 · 창 대기열 · 알림');
check(on.g.titles.t_visit != null && !(on.g._newTitles || []).length && !on.toasts.length, '켜짐: 칭호는 얻고 창 · 알림(칭호 · 퀘스트 완료)은 없음');
check(Object.keys(on.g.journal.done).length >= 1 && Object.keys(on.g.journal.done).join() === Object.keys(off.g.journal.done).join(), '켜도 퀘스트는 똑같이 끝남');
check(on.g.log.some(l => l.text.includes('새 칭호')) && on.g.dex.deco['t:t_visit'], '켜짐: 일지 · 꾸밈 도감에는 조용히 쌓임');

console.log('[주문 · 점수: 규칙은 그대로, 보이는 것만]');
const shop = slow => {
  const g = E.create(at(c => c.month === 11 && !c.frozen), () => 0.5); g.gardenId = 'test-garden'; g.settings.slow = slow;
  E.advance(g, E.calendar(g.virtual).slotEnd + 0.1 * H, { live: false });
  return g;
};
const so = shop(false), sn = shop(true);
check(JSON.stringify(so.orders) === JSON.stringify(sn.orders) && sn.orders.list.length >= 1,'켜도 주문 쪽지는 똑같이 생김');
check(so.log.some(l => l.text.startsWith('찻집에 새 주문 쪽지')) && !sn.log.some(l => l.text.startsWith('찻집에 새 주문 쪽지')), '켜면 "새 주문 쪽지" 일지 줄만 없음');
const year = slow => {
  const g = E.create(at(c => c.month === 2 && !c.frozen), () => 0.5); g.onboarded = true; g.settings.slow = slow;
  E.advance(g, E.calendar(g.virtual).slotEnd + 0.2 * H, { live: false });
  return g;
};
const yo = year(false), yn = year(true);
check(yn.records.length === 1 && yn.records[0].score === yo.records[0].score && yn.bestScore === yo.bestScore, '켜도 쉼달 기록 점수 · 최고 기록은 똑같이 남음');
check(yo.log.some(l => l.type === 7 && l.text.includes('정원 점수')) && yn.log.some(l => l.type === 7 && !l.text.includes('점수')), '켜면 기록 일지 줄에 점수를 쓰지 않음');

console.log('[P30-08 새 화면: 느긋하게 보기면 숫자 없이 · 얻는 규칙은 그대로 (16 연두리)]');
{
  const WEEK = 7 * 24 * H, ctx = { live: false, rng: () => 0.5 };
  const mon = at(c => c.idx === 0);
  const grow = slow => {   // 3층 · 13종 · 4층까지 9해를 비운 채 따라잡는 정원 — 느긋하게 보기만 다름
    const g = E.create(mon, () => 0.5); g.gardenId = 'slow-p30'; g.onboarded = true; g.settings.slow = slow;
    g.dex.tea.chamomile = 1; g.stats.dug = 1; for (const k of E.FLOWER_KEYS) g.dex.flower[k] = true;
    E.advance(g, mon + 13 * H, ctx);
    E.advance(g, mon + 9 * WEEK + 2 * H, ctx);
    if (E.forestOpen(g)) E.plantTree(Object.assign(g, { money: g.money + 1e5 }), E.TREE_KEYS[0], 0, ctx);
    E.advance(g, mon + 10 * WEEK + 2 * H, ctx);
    return g;
  };
  const off = grow(false), on = grow(true), same = k => JSON.stringify(off[k]) === JSON.stringify(on[k]);
  check(E.forestOpen(on) && E.layerNow(on) === E.layerNow(off) && same('layers'), '켜도 4층이 똑같이 열림 (층 · 연 해)');
  check(same('forest') && E.forestCount(on) === E.forestCount(off) && E.forestCount(on) >= 2, '숲 나무 · 숲 도감이 똑같이 자람');
  check(same('yearly') && E.yearlyCount(on) === E.yearlyCount(off), '올해만 것 · 도감이 똑같음');
  check(same('visitors') && same('dex'), '특별 손님 · 도감 칸이 똑같음');
  check((on.stats.autoWeed || 0) === (off.stats.autoWeed || 0), '숲 바람이 걷은 잡초 수가 똑같음');
  check(off.money === on.money && off.grade.xp === on.grade.xp, '돈 · 등급 경험치가 똑같음');
  const lo = E.layerOf(on);
  check(lo.layer === 4 && lo.name === '작은 숲', 'layerOf는 값을 그대로 돌려줌 (숨김은 화면이 E.slowView로)');
  const fo = E.forestOf(on);
  check(fo.slow === true && E.forestOf(off).slow === false, 'forestOf(...).slow');
  const wo = E.forestWeedOf(on);
  check(wo && wo.slow && wo.n === null && !/\d/.test(wo.text), 'forestWeedOf: 숫자 없음');
  check(!on.log.some(l => l.text.startsWith('숲 바람') && /\d/.test(l.text)), '일지 숲 바람 줄에 숫자 없음');
  const two = copy(off); two.season = Object.assign(two.season || {}, { n: 2 });
  const twoSlow = copy(two); twoSlow.settings.slow = true;
  check(Array.isArray(E.seasonTable(two)) && E.seasonTable(twoSlow) === null, 'seasonTable: 2철이어도 느긋하게 보기면 null');
  const snap = E.awayLongSnap(off), back = copy(off);
  back.yearLog = back.yearLog.concat(Array.from({ length: 3 }, (_, i) => ({ year: 90 + i, season: 1, score: 1 })));
  const aOff = E.awayLines(back, 0, snap, 3 * WEEK), backSlow = copy(back); backSlow.settings.slow = true;
  const aOn = E.awayLines(backSlow, 0, snap, 3 * WEEK), tOn = aOn && E.awayLinesText(aOn);
  check(aOff && aOff.slow === false && aOn && aOn.slow === true, 'awayLines(...).slow');
  check(tOn && !/\d/.test([tOn.title, tOn.years, tOn.skipped || '', tOn.layer || ''].join(' ')), '🍃 그동안 문구에 숫자 없음');
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
