// ✉️ 편지함 (P31-01, 10-30): 편지 셋 갈래 · 소식 갈래 · 30줄 상한 · 최근 것부터 · 안 읽은 것(점) · 🎁 받기 전 · 느긋하게 보기 숫자 없음 · 저장 · 새 철 · 여정 17 · 16
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, WEEK = 7 * 24 * H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const REST = 12 * 12 * H + H;
const later = (st, h) => { st.virtual += h * H; };   // 시간만 조금 (달은 안 바뀜)
const mail = (id, gifts) => ({ id, from: '도리', title: `편지 ${id}`, text: '안녕하세요. 정원은 잘 지내나요?', start: '2026-10-01', end: '2027-12-31', to: 'all', gifts: gifts || [] });
const kinds = news => [...new Set(news.map(n => n.kind))].sort().join(',');

console.log('[새 정원]');
const st = E.create(at(c => c.month === 4 && !c.frozen), () => 0.5); st.gardenId = 'inbox-1'; st.onboarded = true; st.money = 100000;
check(st.mailSeenAt === st.virtual, '새 정원은 만든 때를 연 것으로 (mailSeenAt)');
let ib = E.inboxOf(st);
check(ib.letters.length === 0 && ib.news.length === 0 && ib.unread === 0 && !E.inboxUnread(st), '빈 편지함 · 점 없음');

console.log('[편지 셋 갈래 (P26-02 · P29 · P22-05)]');
later(st, 0.2); E.giftPot(st, ctx);                                   // 💌 첫 방문 편지
later(st, 0.2); E.sendGift(st, 'bouquet');
E.advance(st, E.calendar(st.virtual).slotEnd + 0.1 * H, ctx);      // ✉️ 다음 달 이웃 답장
later(st, 0.2); E.mailDeliver(st, [mail('m-gift', [{ cat: 'supply', key: 'fert', n: 2 }]), mail('m-plain')], Date.parse('2026-11-05T12:00:00+09:00'), ctx);   // 📮 운영자 편지 2통
ib = E.inboxOf(st);
const lk = ib.letters.map(l => l.kind);
check(lk.includes('welcome') && lk.includes('neighbor') && lk.filter(k => k === 'mail').length === 2, `셋 갈래가 다 모임 (${lk.join(' · ')})`);
check(ib.letters[0].kind === 'mail' && ib.letters[ib.letters.length - 1].kind === 'welcome', '최근 것부터 (📮 → ✉️ → 💌)');
const nb = ib.letters.find(l => l.kind === 'neighbor');
check(nb.key && nb.from === E.LETTERS[nb.key].from && nb.title === '답장', '이웃 답장: 보낸 이 · 편지 키 (도감 편지 창 그대로 열림)');
check(ib.letters.every(l => l.unread) && ib.unread >= 4 && E.inboxUnread(st), '연 뒤 온 편지는 안 읽은 것 → 점');
console.log('  — 🎁 받기 전 (열린 질문 ③)');
const mg = ib.letters.find(l => l.id === 'm-gift'), mp = ib.letters.find(l => l.id === 'm-plain');
check(mg.gift && !mp.gift, '선물이 있는 📮 편지만 🎁 표시');
E.inboxOpen(st);
ib = E.inboxOf(st);
check(!E.inboxUnread(st) && ib.unread === 0 && ib.letters.find(l => l.id === 'm-gift').gift, '연 뒤 점은 사라지고 🎁 받기 전 표시는 남음');
const money0 = st.money; E.mailTake(st, 'm-gift', ctx);
check(!E.inboxOf(st).letters.find(l => l.id === 'm-gift').gift && st.money === money0, '받으면 🎁 표시가 사라짐 · 돈은 그대로');
check(!E.inboxUnread(st), '선물을 받아도 새 소식은 아님 (일지 17은 편지라 소식에 안 듦)');

console.log('[예전 정원 — 시각을 모르는 편지 · 도감에만 있는 답장]');
{ const o = copy(st); for (const b of [...o.letterBox, ...o.log]) delete b.at; o.dex.letter.teacher = true; o.mailSeenAt = 0;
  const x = E.inboxOf(o);
  check(x.unread === 0 && !E.inboxUnread(o), '시각이 없는 편지는 읽은 것');
  check(x.letters.some(l => l.key === 'teacher' && l.read && l.at == null), '편지함 전에 온 답장(도감에만)도 줄로 (맨 아래)'); }

console.log('[소식 갈래 — 갈래마다 한 줄]');
const N = E.create(mon + 0.1 * H, () => 0.5); N.gardenId = 'inbox-2'; N.onboarded = true;
const add = (type, text) => { later(N, 0.05); E.addLog(N, type, text); };
add(9, '올해 봄엔 🌈 무지개가 왔어요');
add(9, '🌫️ 봄 안개는 못 봤어요 · 다음 해 봄에 다시 와요');
add(9, `${E.VISITORS[E.VISITOR_KEYS[0]].icon} ${E.VISITORS[E.VISITOR_KEYS[0]].name}이 나무 그네 옆에 앉았어요`);
add(9, '🌳 정원 뒤에 작은 숲이 생겼어요');
add(9, '🍵 정원의 2층 찻집이 열렸어요');
add(7, '🌸 2철을 시작했어요 · 🍵 찻길로 걸어요 · 다음 월요일 3월이 새 철 1년차예요');
add(15, '캐모마일 차 2잔 주문을 받은 손님이 작은 조개를 두고 갔어요');
add(19, '무당벌레가 잡초 3포기를 치웠어요');
add(9, '🏅 새 칭호: 꽃잎 수집가');
add(9, '도감에 등록: 장미');                      // 소식 아님
add(17, '📮 새 편지가 왔어요 · 도리「안녕」');       // 편지 칸 (소식 아님)
add(15, '찻집에 새 주문 쪽지가 왔어요');           // 쪽지는 소식 아님
add(11, '월요일 아침, 용돈 500원이 들어왔어요');
ib = E.inboxOf(N);
check(kinds(ib.news) === 'layer,memento,season,title,visitor,wind,yearly', `일곱 갈래 (${kinds(ib.news)})`);
check(ib.news.length === 9, `소식 9줄 · 도감 등록 · 편지 · 쪽지 · 용돈은 뺌 (${ib.news.length})`);
check(ib.news[0].kind === 'title' && ib.news[ib.news.length - 1].text.startsWith('올해 봄엔'), '최근 것부터');
check(ib.news.every(n => n.icon && n.text && n.d && n.unread), '줄마다 아이콘 · 문장 · 날짜 · 안 읽음');
check(ib.news[0].text === '새 칭호: 꽃잎 수집가' && ib.news.find(n => n.kind === 'layer' && n.text === '정원 뒤에 작은 숲이 생겼어요'), '줄 아이콘과 같은 문장 머리 아이콘은 한 번만');
{ const V = E.VISITORS[E.VISITOR_KEYS[0]], v = ib.news.find(n => n.kind === 'visitor');
  check(v.icon === V.icon && !v.text.startsWith(V.icon), '🐾 손님 줄은 손님 아이콘이 줄 아이콘 (🐾 🦔 겹침 없음)'); }
check(N.log.filter(l => l.at != null).length === 9, '시각은 소식 줄에만 적음 (다른 일지 줄은 그대로)');

console.log('[연 뒤 → 새 소식]');
E.inboxOpen(N);
check(!E.inboxUnread(N) && E.inboxOf(N).unread === 0, '연 뒤 점 없음');
add(9, '도감에 등록: 백합');
check(!E.inboxUnread(N), '소식이 아닌 일지 줄로는 점이 안 생김');
add(9, '🏅 새 칭호: 정원 산책가');
check(E.inboxUnread(N) && E.inboxOf(N).unread === 1, '새 소식 한 줄 → 점');
E.inboxOpen(N);

console.log('[30줄 상한 (열린 질문 ①)]');
for (let i = 0; i < 40; i++) add(9, `🏅 새 칭호: 시험 ${i}`);
ib = E.inboxOf(N);
check(ib.news.length === E.INBOX_NEWS_MAX && E.INBOX_NEWS_MAX === 30 && ib.more, '최근 30줄 · 넘친 것이 있다고 알림 (more)');
check(ib.news[0].text === '새 칭호: 시험 39' && ib.news[29].text === '새 칭호: 시험 10', '가장 최근 30줄');
check(ib.unread === 30 && E.inboxUnread(N), '안 읽은 것도 30줄 안에서만 셈');

console.log('[🐢 느긋하게 보기 — 숫자 없는 문장만 (P30-08)]');
N.settings.slow = true;
ib = E.inboxOf(N);
check(ib.news.every(n => !/\d/.test(n.text)), '소식 줄에 숫자 0개');
{ const S = copy(N); S.log = S.log.filter(l => !l.text.includes('시험')); const s = E.inboxOf(S).news;
  check(s.some(n => n.text === '무당벌레가 잡초를 치웠어요') && s.some(n => n.text === '새 철을 시작했어요 · 🍵 찻길로 걸어요') && s.some(n => n.text === '🍵 찻집이 열렸어요'), '숫자가 든 줄은 숫자 없는 문장으로 (숲 바람 · 새 철 · 층)');
  check(!s.some(n => n.kind === 'memento') && s.length === 9, '그래도 숫자가 남는 줄(주문 기념품 "2잔")은 뺌');
  check(!E.inboxUnread(S) && (E.inboxOpen(S), S.log.push({ y: 1, m: 3, d: 1, type: 19, text: '무당벌레가 잡초 2포기를 치웠어요', at: S.virtual + 1 }), E.inboxUnread(S)), '숫자 줄이 고쳐져 보이면 점도 생김'); }
N.settings.slow = false;

console.log('[쉼달 기록으로 옮겨진 일지 · 저장 · 새 철]');
{ const R = E.create(mon + 0.1 * H, () => 0.5); R.gardenId = 'inbox-3'; R.onboarded = true;
  R.virtual += 0.1 * H; E.addLog(R, 9, '🏅 새 칭호: 꽃잠 정원사');
  E.advance(R, mon + REST, ctx);                                     // 쉼달 — 일지가 records[0].log로
  check(!R.log.some(l => l.text.includes('꽃잠 정원사')) && R.records[0].log.some(l => l.text.includes('꽃잠 정원사')), '(준비) 지난해 일지는 한 해 기록으로 옮겨짐');
  check(E.inboxOf(R).news.some(n => n.text.includes('꽃잠 정원사')) && E.inboxUnread(R), '옮겨진 줄도 소식 · 안 읽음');
  E.inboxOpen(R);
  const L = E.migrateSave(E.parseSave(JSON.stringify(E.makeSave(R, 1))).data.game);
  check(L && L.mailSeenAt === R.mailSeenAt && !E.inboxUnread(L) && JSON.stringify(E.inboxOf(L)) === JSON.stringify(E.inboxOf(R)), '저장 · 불러오기 뒤 같은 편지함 · 읽은 때 그대로'); }
check(E.SEASON_KEEP.includes('mailSeenAt'), '새 철에 이어지는 칸 (SEASON_KEEP)');
{ const S = E.create(mon + 0.1 * H, () => 0.5); S.gardenId = 'inbox-4'; S.onboarded = true;
  E.advance(S, mon + 2 * WEEK + REST, ctx);
  for (const k of E.FLOWER_KEYS) S.dex.flower[k] = true;
  E.inboxOpen(S); const seen = S.mailSeenAt; later(S, 0.01);
  const r = E.seasonStart(S, ctx);
  check(r.ok && S.mailSeenAt === seen, '🌸 새 철 뒤 mailSeenAt 그대로');
  check(E.inboxOf(S).news.some(n => n.kind === 'season') && E.inboxUnread(S), '새 철 시작 줄은 새 소식 → 점'); }

console.log('[17 문태경 — 오래 비웠다 열면 점 → 편지 · 소식 한 번에]');
{ const T = E.create(mon + 0.1 * H, () => 0.5); T.gardenId = 'inbox-taek'; T.onboarded = true; T.money = 100000;
  E.yearlyMark(T, E.calendar(T.virtual), ctx); E.inboxOpen(T);
  E.sendGift(T, 'teabox');
  E.advance(T, mon + 3 * WEEK, ctx);                                 // 3해 비움 (돈 · 보상 없이 흘러감)
  const x = E.inboxOf(T);
  check(E.inboxUnread(T), '돌아오면 위 막대 점 하나');
  check(x.letters.some(l => l.unread && l.kind === 'neighbor') && x.news.some(n => n.unread && n.kind === 'yearly'), `편지(이웃 답장) · 소식(올해만 것)이 한 창에 (소식 ${x.news.length}줄)`);
  E.inboxOpen(T);
  check(!E.inboxUnread(T), '열면 점이 사라짐'); }

console.log('[16 연두리 — 숫자 없이 "뭔가 왔구나"]');
{ const Y = copy(N); Y.settings.slow = true; Y.mailSeenAt = 0;
  const x = E.inboxOf(Y);
  check(E.inboxUnread(Y) && x.news.every(n => !/\d/.test(n.text)), '점만 · 소식 문장에 숫자 0개'); }

console.log('[돈 0 — 읽기만]');
{ const z = copy(st), m0 = z.money; E.inboxOf(z); E.inboxOpen(z); E.inboxUnread(z);
  check(z.money === m0 && JSON.stringify(Object.assign({}, z, { mailSeenAt: 0 })) === JSON.stringify(Object.assign(copy(st), { mailSeenAt: 0 })), '편지함은 mailSeenAt 말고 아무것도 바꾸지 않음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
