// P46 ⏱️ 걸리는 시간은 현실 시간으로 (11-01 사용자 요청 "요일을 월로 나누는 거 말고, 시간 표시는 실제 시간으로" · 범위 "걸리는 시간 모두")
// 게임 한 달 = 현실 12시간 · 게임 하루 = 48분. 달 이름 · 계절 · 날짜 · "심는 달" 같은 달력은 그대로
const path = require('path'), fs = require('fs');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H;

console.log('[시간 글자 timeText]');
const tt = [[0.5 * M, '6시간'], [2 * M, '하루'], [15 * 0.8, '12시간'], [M, '12시간'], [0.01, '1분'], [0.5, '30분'], [1, '1시간'], [4.5, '4시간 반'], [23.9, '하루'], [3 * M, '하루 반'], [4 * M, '2일'], [5 * M, '2일 반'], [12 * M, '6일'], [2.5 * M, '하루 반']];
for (const [h, want] of tt) check(E.timeText(h) === want, `${+(h / M).toFixed(3)}달(${h}시간) → "${want}" (${E.timeText(h)})`);
check(E.dryText(1) === '12시간' && E.dryText(3) === '4시간' && E.dryText(5) === '2시간 반', '꽃방 12시간 ÷ 말리는 빠르기');
check(E.BONUS.dry.desc(3) === '꽃잎이 12시간 → 4시간 만에 말라요' && E.BONUS.dry.desc(1) === '꽃잎이 12시간 만에 말라요', '🌾 말리는 속도 줄');

console.log('[꽃잠엔 멈춰요 — flowLeftH]');
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t; t += H / 4; } };
const mon = at(c => c.idx === 0 && c.ms === c.slotStart);
check(Math.abs(E.flowLeftH(mon + H, 2 * M) - 24) < 1e-9, '월요일: 흐르는 2달 = 현실 하루');
const feb = E.calendar(at(c => c.idx === 11)).slotStart + 6 * H;   // 2월(토요일 저녁) 반쯤
check(Math.abs(E.flowLeftH(feb, M) - (6 + 24 + 6)) < 1e-9, '2월 반쯤에 흐르는 1달 → 남은 6시간 + 꽃잠 24시간 + 6시간');
const sun = E.calendar(at(c => c.idx === 12)).slotStart + 3 * H;
check(Math.abs(E.flowLeftH(sun, M) - (21 + 12)) < 1e-9, '꽃잠 한가운데: 깨어날 때까지 21시간 + 12시간');

console.log('[엔진 문구]');
check(E.SUPPLIES.water.desc.includes('하루 동안') && E.SUPPLIES.fert.desc.includes('12시간 동안'), `용품 설명: 물 하루 · 비료 12시간`);
{ const st = E.create(at(c => c.month === 4 && !c.frozen) + 0.1 * H, () => 0.5); st.gardenId = 'p46'; st.money = 100000;
  const r = E.sendGift(st, 'bouquet'); check(r.ok && r.msg.includes('다음 6시에 답장') && !/달에/.test(r.msg), `선물: "${r.msg}"`); }
check(E.DECO_BUFF.basin.text.includes('6시간 더') && !/[0-9]달|반 달/.test(Object.values(E.DECO_BUFF).map(b => b.text).join()), '장식 줄에 게임 달 없음 (돌 물확 6시간 더)');
check(['dryshelf'].every(k => !/달마다|석 달|달이 끝/.test(E.DECOS[k].desc)), '선반 설명에 "달마다" 없음');
check(E.INSECT_KEYS.every(k => E.DECOS[k].desc === E.INSECT_LINE[k](2)), 'P65-04 곤충 일곱은 "둘레 n칸 꽃에서 · 달마다 · 무엇을" 한 줄 (11-03 사용자 확정 — 곤충 줄만 달력 말)');

console.log('[화면 코드에 게임 시간 글자가 남지 않음]');
// 남기는 달력 말: "이달의 장식 · 달마다 바뀌어요" · "쉼달마다 그해 기록" · 달 이름 · 꽃 나이(심은 지 1년 3달) · DEV 빠르기
const BAD = /([0-9}]달 ?(동안|뒤|괜찮|품질|만에|더|·)|반 달|석 달에|(?<!쉼)달마다(?! 바뀌어요)|이 달이 끝나면|달이 끝날 때|한 달에 (품질|한 번|\d)|다음 달에 (식|답장)|깨어나고 1달)/;
for (const file of ['app.js', 'app-garden.js', 'app-shop.js', 'app-teashop.js', 'app-farm.js', 'app-journal.js', 'app-dex.js', 'app-manual.js', 'app-main.js', 'app-inbox.js']) {
  const lines = fs.readFileSync(path.join(__dirname, '..', file), 'utf8').split('\n').map(l => l.replace(/\/\/ .*$/, '')).filter(l => !/DEV|devSpeed|SPEEDS/.test(l));
  const hit = lines.filter(l => BAD.test(l));
  check(!hit.length, `${file}${hit.length ? ` — ${hit.map(l => l.trim().slice(0, 60)).join(' / ')}` : ''}`);
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
