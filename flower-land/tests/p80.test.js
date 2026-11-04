// P80 (11-05): 🎁 정식 출시 기념 50,000원 — 📮 운영자 편지(mail.json) 한 통 · 2026-12-01 한국 시간까지 · 정원마다 한 번
const path = require('path'), fs = require('fs');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const LIST = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'mail.json'), 'utf8'));
const ID = '2026-11-launch-gift-50000', M = LIST.find(m => m.id === ID);
const kst = (s) => Date.parse(s + '+09:00');   // 한국 시간 → ms (TZ와 상관없이)

console.log('[편지]');
check(!!M && E.mailCheck(M).length === 0, 'mail.json에 출시 선물 편지 · 검사 통과');
check(M.to === 'all' && M.start === '2026-11-05' && M.end === '2026-12-01', '모두에게 · 11-05 ~ 12-01');
check(M.gifts.length === 1 && M.gifts[0].cat === 'money' && M.gifts[0].n === 50000 && E.mailMoney(M) <= E.MAIL_MONEY_MAX, '돈 50,000원 (한 통 상한 안)');

console.log('[기간 — 한국 시간]');
const fresh = () => { const s = E.create(kst('2026-11-05T12:00:00'), () => 0.5); s.onboarded = true; return s; };
for (const [when, want] of [['2026-11-04T23:59:00', false], ['2026-11-05T00:00:00', true], ['2026-12-01T23:59:00', true], ['2026-12-02T00:00:00', false], ['2027-01-10T09:00:00', false]]) {
  const s = fresh(), n = E.mailDeliver(s, [M], kst(when));
  check((n === 1) === want, `${when} KST → ${want ? '옴' : '안 옴'}`);
}
check(E.mailFor(fresh(), M, Date.UTC(2026, 11, 1, 14, 59)) && !E.mailFor(fresh(), M, Date.UTC(2026, 11, 1, 15, 0)), 'UTC 12-01 14:59는 받음 · 15:00(= 한국 12-02 0시)은 안 받음');

console.log('[정원마다 한 번]');
const st = fresh(), m0 = st.money;
check(E.mailDeliver(st, LIST, kst('2026-11-20T10:00:00')) >= 1 && E.mailOf(st, ID), '편지함에 옴');
check(E.mailTake(st, ID).ok && st.money === m0 + 50000, '받으면 돈 +50,000원');
check(!E.mailTake(st, ID).ok && st.money === m0 + 50000, '두 번 받을 수 없음');
check(E.mailDeliver(st, LIST, kst('2026-11-25T10:00:00')) === 0, '다시 열어도 편지가 또 오지 않음 (st.mailGot)');
const re = E.migrateSave(JSON.parse(JSON.stringify(st)));
check(E.mailDeliver(re, LIST, kst('2026-11-26T10:00:00')) === 0 && re.mailGot[ID], '저장을 다시 열어도(드라이브 · 파일) 한 번');
const old = fresh(); old.created = kst('2026-10-01T00:00:00');
check(E.mailDeliver(old, [M], kst('2026-11-30T10:00:00')) === 1, '예전부터 하던 정원도 받음 (to: all)');
const late = fresh(); E.mailDeliver(late, [M], kst('2026-11-30T10:00:00'));
check(E.mailDeliver(late, [M], kst('2026-12-05T10:00:00')) === 0 && E.mailOf(late, ID) && !E.mailOf(late, ID).took, '기간이 지나도 이미 온 편지는 그대로 (선물도 받을 수 있게 남음)');
check(E.mailTake(late, ID).ok, '기간 뒤에도 받은 편지의 선물은 받음');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
