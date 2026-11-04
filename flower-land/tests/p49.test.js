// P49 🧺 농장 정착금 (11-01 사용자 요청 "토~일마다 10000원" — 주말에 한 번 · 할머니 편지 + 돈): 토요일 아침 6시 농장 할머니 편지에 10,000원
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); while (!pred(E.calendar(t))) t += H; return t; };
const farm = st => (st.letterBox || []).filter(b => b.mail && b.mail.id.startsWith('farm-gift-'));

console.log('[토요일 아침 편지]');
{ const st = E.create(at(c => c.idx === 9), () => 0.5); st.onboarded = true; const m0 = st.money;
  E.advance(st, E.calendar(st.virtual).slotEnd + H, ctx);   // 금요일 저녁 → 토요일 아침
  const L = farm(st);
  check(E.calendar(st.virtual).idx === 10 && L.length === 1, '토요일 아침 6시에 한 통');
  check(L[0].mail.from === '농장 할머니' && L[0].mail.title === '농장 정착금' && L[0].took === null && !L[0].read, '농장 할머니 「농장 정착금」 · 안 읽음 · 🎁 받기 전');
  check(st.money - m0 === E.DAILY_GIFT, '편지만 오고 돈은 아직 (하루 용돈만)');
  const r = E.mailTake(st, L[0].mail.id, ctx);
  check(r.ok && st.money - m0 === E.DAILY_GIFT + 10000 && L[0].took === true, '🎁 받기 → 10,000원');
  check(!E.mailTake(st, L[0].mail.id, ctx).ok && st.money - m0 === E.DAILY_GIFT + 10000, '두 번 받지 못함');
  E.advance(st, E.calendar(st.virtual).slotEnd + 2 * 12 * H, ctx);   // 토요일 저녁 · 일요일(꽃잠)까지
  check(farm(st).length === 1, '주말에 한 번 (일요일엔 안 옴)'); }

console.log('[주말에 들어와야 받음 · 비운 주말은 안 쌓임]');
{ const st = E.create(at(c => c.idx === 0), () => 0.5); st.onboarded = true;
  E.advance(st, st.virtual + 3 * 7 * 24 * H, ctx);   // 월요일 → 3주 뒤 월요일 (주말 셋을 비움)
  check(E.calendar(st.virtual).idx === 0 && farm(st).length === 0, '주말 셋을 비우고 월요일에 들어오면 편지 없음');
  E.advance(st, st.virtual + 5 * 24 * H + H, ctx);    // 토요일 아침 7시에 들어옴
  check(farm(st).length === 1, '토요일에 들어오면 한 통');
  const s2 = E.create(at(c => c.idx === 0), () => 0.5); s2.onboarded = true;
  E.advance(s2, s2.virtual + 6 * 24 * H + 3 * H, ctx); // 월요일 → 일요일 아침 9시 (토요일엔 안 들어옴)
  check(E.calendar(s2.virtual).idx === 12 && farm(s2).length === 1, '토요일을 건너뛰고 일요일에 들어와도 한 통');
  const m0 = s2.money; E.mailTake(s2, farm(s2)[0].mail.id, ctx);
  check(s2.money - m0 === 10000, '받으면 10,000원');
  E.advance(s2, s2.virtual + 10 * H, ctx);
  check(farm(s2).length === 1, '같은 주말엔 한 통만'); }

console.log('[저장 · 다시 열기]');
{ const st = E.create(at(c => c.idx === 9), () => 0.5); st.onboarded = true;
  E.advance(st, E.calendar(st.virtual).slotEnd + H, ctx);
  const r = E.parseSave(JSON.stringify(E.makeSave(st, 1)));
  const s2 = r.ok && E.migrateSave(r.data.game);
  const L = s2 && s2.letterBox ? farm(s2) : [];
  check(L.length === 1 && L[0].took === null, '파일로 저장해 열어도 받기 전 그대로');
  check(!E.farmGift(st, E.calendar(st.virtual), ctx), '같은 주엔 다시 오지 않음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
