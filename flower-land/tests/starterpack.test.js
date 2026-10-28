// 🎁 첫 방문 꾸러미 · 🍵 첫 손님 (P22-05, 10-28): 첫 방문에 꽃집 할머니의 편지 + 말린 꽃잎 2장 · 티백 1개 · 첫 손님 한 번
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const start = pred => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'starter-1'; st.onboarded = true; E.giftPot(st, ctx); E.checkJournal(st, ctx); return st; };
const copy = o => JSON.parse(JSON.stringify(o));
const TEXT = '정원에 온 걸 환영해요. 화분과 함께 말린 꽃잎과 티백을 넣었어요. 두 꽃잎을 섞어 차를 만들고, 찻집 문을 한 번 열어 첫 손님을 맞아 보세요.';

console.log('[꽃마다 꾸러미 짝]');
for (const [m, type] of Object.entries(E.GIFT_BY_MONTH)) {
  const r = E.STARTER_BLEND[type], B = E.BLENDS[r], has = E.BLEND_KEYS.some(k => E.BLENDS[k].parts.includes(type));
  check(B && !B.hidden && B.parts.length === 2 && (!has || B.parts.includes(type)), `${m}월 ${E.FLOWERS[type].name} → ${B.name} (${B.parts.map(k => E.FLOWERS[k].name).join(' + ')})${has ? '' : ' · 공개 레시피가 없어 대신'}`);
}

for (const [day, pred] of [['월요일 아침 (3월)', c => c.idx === 0], ['금요일 아침 (11월)', c => c.idx === 8], ['일요일 꽃잠 (쉼달)', c => c.idx === 12]]) {
  console.log(`[${day}]`);
  const st = start(pred), cal = E.calendar(st.virtual), type = st.firstFlower;
  const box = st.letterBox.filter(b => b.k === 'welcome');
  check(box.length === 1 && st.letterBox.length === 1 && E.LETTERS.welcome.from === '꽃집 할머니' && E.LETTERS.welcome.text === TEXT && !box[0].read, '편지 1통 (꽃집 할머니 · 받은 편지함에서 아직 안 읽음)');
  check(st.dex.letter.welcome && E.letterCount(st) === 0 && E.LETTER_KEYS.length === 12, '도감 편지에 있지만 답장 12통 수에는 넣지 않음');
  check(st.money === E.create(at(pred), () => 0.5).money, '돈은 주지 않음');
  check(st.dried.length === 2 && st.dried.every(p => p.gift && p.q === 0.8), '말린 꽃잎 2장');
  const teas = st.teas.filter(t => t.type === type && t.gift);
  check(cal.frozen ? teas.length === 2 && st.teas.length === 2 : teas.length === 1 && st.teas.length === 1, cal.frozen ? '꽃잠: 원래 주던 티백 2개가 꾸러미 티백을 겸함 (3개가 아님)' : `${E.FLOWERS[type].name} 티백 1개`);
  check(cal.frozen || !(st.dex.teabag || {})[type], cal.frozen ? '꽃잠: 티백 도감은 예전처럼' : '꾸러미 티백은 도감 티백에 넣지 않음 (1장 "티백 만들기"는 직접)');
  check(E.freshGarden(st) || cal.frozen, '꾸러미를 받아도 거의 새 정원');
  check(E.guideFill(st).harvested !== true, '꾸러미는 첫걸음 수확으로 치지 않음');
  // 꾸러미만으로 이름 있는 블렌드
  const r = E.blend(st, st.dried.map(p => p.id), ctx);
  check(r.ok && r.blend.recipe && !E.BLENDS[r.blend.recipe].hidden && st.dex.blend[r.blend.recipe] != null, `꾸러미만으로 「${r.blend && r.blend.name}」`);
  // 첫 손님
  const open = E.teaShopOpen(cal), m0 = st.money;
  if (!open) {
    check(!E.brew(st, st.teas.map(t => t.id), []).ok, '닫힌 찻집: 그냥 우리기는 막힘');
    check(E.firstGuestReady(st), '닫힌 찻집: 첫 손님이 기다림');
    const f = E.firstGuest(st, st.teas[0].id, ctx);
    check(f.ok && st.money === m0 + f.sum && f.sum > 0 && st.teas.length === 0 && st.cups.length === 0, `첫 손님에게 한 잔 팖 (+${f.sum}원)`);
    check(st.dex.tea[type] != null && st.stats.cups === 1, "도감 차 · 판 잔 수에 셈");
    E.checkJournal(st, ctx); check(st.journal.done.c1_sell != null && st.journal.done.c1_bag == null, '1장 차 팔기 퀘스트는 첫 손님으로 끝남');
    check(!E.firstGuestReady(st) && st.firstGuest === false, '쓰면 사라짐');
    E.bagBlends(st, st.blends.map(b => b.id), ctx);
    check(!E.firstGuest(st, st.blends[0].id, ctx).ok && !E.brew(st, [], st.blends.map(b => b.id)).ok && st.blends.length === 1, '두 번째는 막힘 (블렌드 티백도)');
  } else {
    check(!E.firstGuestReady(st) && !E.firstGuest(st, st.teas[0].id, ctx).ok, '열린 찻집(꽃잠): 첫 손님 단추 없이 그냥 우려 팖');
    const later = copy(st);
    E.advance(later, E.untilMonth(later.virtual, c => !c.frozen).cal.slotStart + H, ctx);
    check(E.firstGuestReady(later), '꽃잠에 팔지 않으면 월요일에 첫 손님이 기다림');
    E.brew(st, [st.teas[0].id], []); const s = E.sellCups(st, st.cups.map(c => c.id), ctx);
    check(s.ok && st.firstGuest === false, '열린 찻집에서 한 잔 팔면 첫 손님 표도 끝');
    E.advance(st, E.untilMonth(st.virtual, c => !c.frozen).cal.slotStart + H, ctx);
    check(!E.firstGuestReady(st), '월요일에 다시 생기지 않음');
  }
}

console.log('[블렌드 티백으로 첫 손님]');
{ const st = start(c => c.idx === 0); const r = E.blend(st, st.dried.map(p => p.id), ctx); E.bagBlends(st, [r.blend.id], ctx);
  const m0 = st.money, f = E.firstGuest(st, r.blend.id, ctx);
  check(f.ok && st.money - m0 === E.blendValue(r.blend) && st.teas.length === 1 && st.firstGuest === false, `「${r.blend.name}」 블렌드 티백을 팖 · 꽃 티백은 남음`); }

console.log('[금요일 저녁 (12월, 찻집이 열림)]');
{ const st = start(c => c.idx === 9);
  check(st.firstFlower === 'dongbaek' && st.dried.map(p => p.type).sort().join() === 'maehwa,napmae' && E.teaShopOpen(E.calendar(st.virtual)) && !E.firstGuestReady(st), '동백 화분 · 「겨울 매화향」 재료 · 열린 찻집이라 첫 손님 줄은 숨김'); }

console.log('[한 번만 · 예전 저장 · 다시 시작]');
{ const st = start(c => c.idx === 0);
  check(!E.giftPot(st, ctx).ok && st.letterBox.length === 1 && st.dried.length === 2, '화분과 함께 한 번만');
  const old = copy(E.create(at(c => c.idx === 0), () => 0.5)); old.onboarded = true; old.gift = 5; delete old.firstGuest; old.mig = E.MIGRATIONS.length - 1;
  const m = E.migrateSave(old);
  check(m.firstGuest === false && !E.firstGuestReady(m) && !E.giftPot(m, ctx).ok && !m.letterBox.length && !m.dried.length, '이미 화분을 받은 예전 정원은 꾸러미 없음');
  const re = start(c => c.idx === 0);
  check(re.firstGuest === true && re.letterBox.some(b => b.k === 'welcome'), '처음부터 다시 시작한 정원(새 정원)은 다시 받음'); }

console.log('[답장 뽑기에 끼지 않음]');
{ const st = start(c => c.idx === 0); st.money = 1e6;
  for (let i = 0; i < 12; i++) { st.gifts = null; st.dex.letter = Object.fromEntries(Object.keys(st.dex.letter).map(k => [k, true])); E.sendGift(st, 'bouquet'); E.deliverLetters(st, { abs: 1e9, month: 3 }, ctx); }
  check(st.letterBox.filter(b => b.k === 'welcome').length === 1 && E.letterCount(st) <= 12, '선물 답장으로 꽃집 할머니 첫 편지가 다시 오지 않음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
