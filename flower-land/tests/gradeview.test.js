// 🌱 등급 화면 (P28-05-01, M1-4 10-28): 위 막대 · 도감 등급 쪽 · 오를 때 알림 · 자리를 비운 동안 한 줄 — 화면이 읽는 엔진 함수, 숨길지는 slowView 하나
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const fresh = () => { const s = E.create(mon + 0.1 * H, () => 0.5); s.gardenId = 'gview-1'; return s; };
const slowOn = s => { s.settings.slow = true; return s; };

console.log('[누적 경험치]');
check(E.gradeXpAt(1) === 0 && E.gradeXpAt(2) === 40 && E.gradeXpAt(5) === 220 && E.gradeXpAt(10) === 720, 'gradeXpAt: 1등급 0 · 2등급 40 · 5등급 220 · 10등급 720 (등급 표 그대로)');
check([2, 8, 31, 60].every(g => E.gradeAt(E.gradeXpAt(g)).grade === g && E.gradeAt(E.gradeXpAt(g) - 1).grade === g - 1), 'gradeXpAt 경계가 gradeAt과 맞음');

console.log('[위 막대 gradeBadge]');
const a = fresh();
const b0 = E.gradeBadge(a);
check(b0 && b0.grade === 1 && b0.name === '씨앗 정원 1' && b0.pct === 0, `새 정원: 씨앗 정원 1 · 0% (${JSON.stringify(b0)})`);
E.addXp(a, 'quest', 5);   // 50점 → 2등급, 2등급 안에서 10 / 50
const b1 = E.gradeBadge(a);
check(b1.grade === 2 && b1.name === '씨앗 정원 2' && b1.pct === Math.floor(10 / E.gradeCost(2) * 100), `오르면 등급 · 진행 % 바뀜 (${b1.pct}%)`);
check(E.gradeBadge(slowOn(fresh())) === null, '느긋하게 보기면 없음 (위 막대 등급을 숨김)');

console.log('[도감 등급 쪽 gradeView]');
const v = fresh();
E.addXp(v, 'harvest', 30); E.addXp(v, 'sell', 20); E.addXp(v, 'order', 2); E.addXp(v, 'quest', 3); E.addXp(v, 'dex', 4); E.addXp(v, 'year', 50);
const gv = E.gradeView(v), sum = gv.sources.reduce((s, x) => s + x.xp, 0);
check(gv.xp === 60 + 40 + 30 + 30 + 20 + 50 && sum === gv.xp, `어디서 왔는지 합 = 경험치 (${sum})`);
check(gv.sources.map(x => x.label).join() === '거두기,팔기,주문,퀘스트,도감,한 해 평가', '거두기 · 팔기 · 주문 · 퀘스트 · 도감 · 한 해 평가 (주간 목표는 생기기 전엔 안 보임)');
check(gv.left === gv.next - gv.xp && gv.left > 0, `다음 등급까지 남은 양 (${gv.left})`);
check(gv.grade === 5 && gv.decos.length === 6 && gv.decos[0].open && !gv.decos[1].open, `5등급: 새싹 팻말만 열림 (${gv.grade}등급)`);
check(gv.nextDeco && gv.nextDeco.key === 'wateringcan' && gv.nextDeco.grade === 10 && gv.nextDecoLeft === E.gradeXpAt(10) - gv.xp, `다음에 열리는 등급 장식: 양철 물뿌리개 · 10등급까지 ${gv.nextDecoLeft}`);
E.addXp(v, 'weekly', 3);
check(E.gradeView(v).sources.some(x => x.k === 'weekly' && x.xp === 3), '주간 목표 경험치가 생기면 줄이 보임 (P28-09 자리)');
const all = fresh(); E.addXp(all, 'weekly', E.gradeXpAt(30));
check(E.gradeView(all).nextDeco === null && E.gradeView(all).nextDecoLeft === 0 && E.gradeView(all).decos.every(d => d.open), '30등급이면 등급 장식이 모두 열림 · 다음 장식 없음');
const sv = E.gradeView(slowOn(fresh()));
check(sv.slow === true && sv.grade === 1 && sv.decos.length === 6, '느긋하게 보기여도 도감 등급 쪽은 남음 (slow 표시로 차분한 보기)');

console.log('[오를 때 알림 gradeAlerts · 일지 (05-4 · 12-6)]');
const n = fresh(), evs = [];
E.addXp(n, 'weekly', E.gradeXpAt(5) - 1);
const logBefore = n.log.length;
E.addXp(n, 'weekly', 1, { onGrade: e => evs.push(e) });
const al = E.gradeAlerts(n, evs[0]);
check(al.length === 2 && al[0] === '🌱 정원 등급이 올랐어요 · 씨앗 정원 5' && al[1] === '🪴 화원에 새싹 팻말이 들어왔어요', `등급 한 줄 + 열린 장식 한 줄 (${al.join(' / ')})`);
const newLines = n.log.slice(logBefore).map(l => l.text);
check(newLines.join('|') === al.join('|'), '정원 일지에도 같은 두 줄');
const m = fresh(), mev = [];
E.addXp(m, 'quest', 5, { onGrade: e => mev.push(e) });
check(E.gradeAlerts(m, mev[0]).length === 1 && mev[0].unlock.length === 0, '장식이 안 열리면 등급 한 줄만');
const s = slowOn(fresh()), sev = []; E.addXp(s, 'weekly', E.gradeXpAt(5) - 1);
const sb = s.log.length; E.addXp(s, 'weekly', 1, { onGrade: e => sev.push(e) });
check(sev.length === 1 && E.gradeAlerts(s, sev[0]).length === 0, '느긋하게 보기면 알림 없음 (이벤트 · 등급은 그대로)');
check(s.log.slice(sb).map(l => l.text).join() === '🪴 화원에 새싹 팻말이 들어왔어요', '느긋하게 보기여도 장식이 들어온 줄은 일지에 (숫자가 없음) · 등급 줄은 없음');
check(E.gradeAlerts(n, null).length === 0, '이벤트가 없으면 빈 목록');
const big = fresh(), bev = []; E.addXp(big, 'weekly', E.gradeXpAt(16), { onGrade: e => bev.push(e) });
check(bev.length === 1 && bev[0].unlock.join() === 'sproutsign,wateringcan,arch' && E.gradeAlerts(big, bev[0]).length === 2 && E.gradeAlerts(big, bev[0])[1] === '🪴 화원에 새싹 팻말 · 양철 물뿌리개 · 꽃 아치가 들어왔어요' && big.log.filter(l => l.text.startsWith('🪴 화원에')).length === 3, '한 번에 여러 등급이 올라도 알림은 두 줄 (열린 장식은 한 줄로) · 일지엔 장식마다 한 줄');

console.log('[자리를 비운 동안 gradeAwayLine]');
const w = fresh(); E.addXp(w, 'weekly', E.gradeXpAt(7) + 3);
check(E.gradeAwayLine(w, 3) === '🌱 정원 등급이 올랐어요 · 씨앗 정원 3 → 새싹 정원 2', `그동안 오른 등급 한 줄 (${E.gradeAwayLine(w, 3)})`);
check(E.gradeAwayLine(w, 7) === null && E.gradeAwayLine(w, null) === null, '안 올랐으면 없음');
check(E.gradeAwayLine(slowOn(w), 3) === null, '느긋하게 보기면 없음');
check(E.isGradeUpLine('🌱 정원 등급이 올랐어요 · 새싹 정원 1') && !E.isGradeUpLine('🪴 화원에 새싹 팻말이 들어왔어요') && !E.isGradeUpLine(null), 'isGradeUpLine: 등급 줄만 (요약에서 한 줄로 합칠 때)');

console.log('[화원 · 꾸밈 도감]');
const d = fresh(); d.money = 100000;
check(E.decoTotal() === E.DECO_KEYS.length + 6 + E.TITLE_KEYS.length, '꾸밈 도감 칸에 등급 장식 6칸');
E.addXp(d, 'weekly', E.gradeXpAt(5));
check(E.buyDeco(d, 'sproutsign').ok && E.decoCount(d) === 1, '등급 장식을 사면 꾸밈 도감 모은 수 +1');
check(!E.decoOffer(E.calendar(d.virtual)).some(k => E.DECOS[k].grade), '이달의 장식 줄에는 섞이지 않음');

console.log('[저장 · 다시 열기]');
const back = E.migrateSave(JSON.parse(JSON.stringify(v)));
check(JSON.stringify(E.gradeView(back)) === JSON.stringify(E.gradeView(v)) && JSON.stringify(E.gradeBadge(back)) === JSON.stringify(E.gradeBadge(v)), '다시 열어도 위 막대 · 도감 등급 쪽이 그대로');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
process.exit(fails ? 1 : 0);
