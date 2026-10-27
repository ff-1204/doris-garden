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

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
