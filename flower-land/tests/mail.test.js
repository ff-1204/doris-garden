// P29 📮 운영자 편지: 실제 flower-land/mail.json 검사(배포 문 — 틀리면 Actions가 멈춰 배포되지 않음) · 엔진 흐름은 예시 편지로
const path = require('path'), fs = require('fs');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const kst = d => Date.parse(d + 'T12:00:00+09:00');   // 그날 한국 시간 낮 12시

console.log('[실제 mail.json]');
const FILE = path.join(__dirname, '..', 'mail.json');
let list = null;
try { list = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { console.log('    ' + e.message); }
check(Array.isArray(list), 'JSON 목록 [ ] 으로 읽힘');
if (Array.isArray(list)) {
  const ids = list.map(m => m && m.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  check(!dup.length, `id가 겹치지 않음${dup.length ? ` (겹침: ${dup.join(', ')})` : ''}`);
  list.forEach((m, i) => {
    const errs = E.mailCheck(m), v = E.mailValue(m);
    check(!errs.length, `${i + 1}번째 편지 ${m && m.id ? `「${m.id}」` : ''} 형식 · 날짜 · 선물 · 문구 길이 · 상한${errs.length ? ' — ' + errs.join(' / ') : ''}`);
    if (v > E.MAIL_WARN && v <= E.MAIL_MAX) console.log(`  ⚠️ ${m.id}: 선물 가치 ${v.toLocaleString('ko-KR')}원 — ${E.MAIL_WARN.toLocaleString('ko-KR')}원을 넘어요 (막지는 않음)`);
  });
  console.log(`    편지 ${list.length}통`);
}

console.log('[검사가 잡는 것]');
const good = { id: '2026-11-hello', from: '꽃집 할머니', title: '11월 인사', text: '11월에도 정원을 찾아 줘서 고마워요.',
  gifts: [{ cat: 'seed', key: 'rose', n: 2 }, { cat: 'supply', key: 'water', n: 3 }], start: '2026-11-01', end: '2026-11-30', to: 'all' };
const bad = (patch, why) => { const m = Object.assign(copy(good), patch); check(E.mailCheck(m).length > 0, why); };
check(E.mailCheck(good).length === 0, '바른 예시 편지는 통과');
bad({ start: '2026-11-31' }, '없는 날짜(11-31)');
bad({ start: '2026/11/01' }, '날짜 모양이 틀림');
bad({ start: '2026-12-01' }, 'start가 end보다 늦음');
bad({ to: 'some' }, '모르는 받는 사람');
bad({ to: 'before:2026-13-01' }, 'before 날짜가 틀림');
bad({ id: '' }, 'id가 빔');
bad({ id: '11월 인사' }, 'id에 한글 · 빈칸');
bad({ text: '가'.repeat(E.MAIL_LEN.text + 1) }, '문구가 너무 김');
bad({ title: '가'.repeat(E.MAIL_LEN.title + 1) }, '제목이 너무 김');
bad({ gifts: [{ cat: 'money', key: 'won', n: 1000 }] }, '돈은 못 넣음');
bad({ gifts: [{ cat: 'title', key: 't_visit', n: 1 }] }, '칭호는 못 넣음');
bad({ gifts: [{ cat: 'seed', key: 'nope', n: 1 }] }, '모르는 꽃 키');
bad({ gifts: [{ cat: 'tea', key: 'rose', n: 1 }] }, '팔 수 있는 것(차)은 종류에 없음');
bad({ gifts: [{ cat: 'seed', key: 'rose', n: 0 }] }, 'n이 0');
bad({ gifts: [{ cat: 'seed', key: 'rose', n: 1.5 }] }, 'n이 정수가 아님');
bad({ gifts: [{ cat: 'deco', key: 't:t_visit', n: 1 }] }, '칭호 문장 장식은 못 넣음');
bad({ gifts: [{ cat: 'deco', key: 'pavilion', n: 1 }] }, '정자(60,000원) — 상한 30,000원을 넘음');
bad({ gifts: [{ cat: 'deco', key: 'hive', n: 1 }] }, '수입을 늘리는 장식(벌통)은 못 넣음');
bad({ gifts: [{ cat: 'deco', key: 'heatmat', n: 1 }] }, '정원 장치(온상 매트)는 못 넣음');
bad({ gifts: [{ cat: 'deco', key: 'sproutsign', n: 1 }] }, '등급 장식은 못 넣음');
bad({ gifts: null }, 'gifts가 목록이 아님');
{ const m = Object.assign(copy(good), { gifts: [{ cat: 'deco', key: 'bench', n: 1 }] });   // 12,000원
  check(E.mailCheck(m).length === 0 && E.mailValue(m) > E.MAIL_WARN, '10,000원 ~ 30,000원은 통과 (테스트가 경고만)'); }
check(['honey|wild', 'mine|stone', 'mine|shell', 'mine|oldseed', 'supply|fert', 'deco|stepstone'].every(s => { const [cat, key] = s.split('|'); return E.mailGiftOk({ cat, key, n: 1 }); }), '꿀 · 광산 재료 · 화석 · 용품 · 장식 키는 받음');
check(!E.mailGiftOk({ cat: 'mine', key: 'feldspar', n: 1 }) && !E.mailGiftOk({ cat: 'mine', key: 'honey', n: 1 }), '값을 셀 수 없는 광산 키는 안 받음');

console.log('[받는 사람 · 기간]');
const garden = born => { const s = E.create(born - H, () => 0.5); s.gardenId = born.toString(36) + '-test'; s.onboarded = true; return s; };
const oldG = garden(kst('2026-10-10')), newG = garden(kst('2026-11-03'));
const now = kst('2026-11-05');
check(E.gardenBorn(newG) === kst('2026-11-03'), '정원을 시작한 때 = 정원 이름표의 만든 때 (gardenBorn)');
const all = copy(good), nw = Object.assign(copy(good), { id: 'welcome-11', to: 'new' }), bf = Object.assign(copy(good), { id: 'sorry-1', to: 'before:2026-11-01' });
check(E.mailFor(oldG, all, now) && E.mailFor(newG, all, now), 'all: 기간 안이면 모두');
check(!E.mailFor(oldG, nw, now) && E.mailFor(newG, nw, now), 'new: 기간 안에 시작한 정원만');
check(E.mailFor(oldG, bf, now) && !E.mailFor(newG, bf, now), 'before: 그 날 전에 시작한 정원만');
{ const odd = garden(kst('2026-10-10')); odd.gardenId = 'weird';
  check(!E.mailFor(odd, nw, now) && E.mailFor(odd, bf, now), '시작한 때를 모르는 정원은 오래된 정원으로 (new 아님 · before는 받음)'); }
check(!E.mailFor(oldG, all, kst('2026-10-31')) && !E.mailFor(oldG, all, kst('2026-12-01')), '기간 전 · 뒤에는 안 옴');
check(E.mailFor(oldG, all, Date.parse('2026-11-01T00:00:30+09:00')) && E.mailFor(oldG, all, Date.parse('2026-11-30T23:59:30+09:00')), '한국 시간 start 00:00 ~ end 23:59');
check(!E.mailFor(oldG, all, Date.parse('2026-10-31T23:59:00+09:00')) && !E.mailFor(oldG, all, Date.parse('2026-12-01T00:00:30+09:00')), '그 밖 1분은 안 옴 (UTC가 아니라 한국 날짜)');

console.log('[받기 · 두 번 안 받음]');
{ const s = garden(kst('2026-10-10')), items0 = s.items.length, water0 = s.water;
  check(E.mailDeliver(s, [all, nw, bf], now, ctx) === 2, '받을 편지 2통(all · before)만 편지함에');
  const b = E.mailOf(s, all.id);
  check(b && b.mail.from === '꽃집 할머니' && b.took === null && b.read === false && s.mailGot[all.id] === now, '편지함에 📮 편지 · 선물은 아직 · 받은 기록');
  check(s.items.length === items0 && s.water === water0, '편지만 와서는 선물이 들어오지 않음');
  check(s.log.some(l => l.type === 17 && l.text.startsWith('📮 새 편지가 왔어요')), '일지 "📮 새 편지가 왔어요"');
  check(E.mailDeliver(s, [all, nw, bf], now + H, ctx) === 0, '다시 읽어도 두 번 안 옴');
  const r = E.mailTake(s, all.id, ctx);
  check(r.ok && r.msg === '🎁 창고에 넣었어요' && s.items.length === items0 + 2 && s.items.slice(-2).every(x => x.type === 'rose') && s.water === water0 + 3, '🎁 받기 → 장미 씨앗 2 · 물병 3이 창고에');
  check(!E.mailTake(s, all.id, ctx).ok && s.items.length === items0 + 2, '두 번 누르면 "이미 받은 선물이에요"');
  check(!E.mailTake(s, 'nope', ctx).ok, '편지함에 없는 편지는 못 받음');
  s.letterBox = s.letterBox.filter(x => !x.mail);   // 편지함에서 없어져도
  check(E.mailDeliver(s, [all], now + 2 * H, ctx) === 0, '받은 기록이 있으면 편지함이 비어도 다시 안 옴'); }
{ const s = garden(kst('2026-10-10'));
  E.mailDeliver(s, [Object.assign(copy(good), { gifts: [{ cat: 'honey', key: 'wild', n: 2 }, { cat: 'mine', key: 'shell', n: 1 }, { cat: 'deco', key: 'stepstone', n: 1 }] })], now, ctx);
  const r = E.mailTake(s, good.id, ctx), bag = E.mineOf(s).bag;
  check(r.ok && s.honey.wild === 2 && bag.shell === 1 && s.dex.deco.stepstone && r.msg === '🎁 찻집 꿀 선반 · 광산 주머니 · 창고에 넣었어요', '꿀 선반 · 광산 주머니 · 장식도 답례품과 같은 곳에'); }
{ const s = garden(kst('2026-10-10'));
  E.mailDeliver(s, [all], now, ctx);
  check(E.mailTake(s, all.id, ctx).ok, '기간이 지나도(편지함에 있으면) 선물을 받을 수 있음 — mailTake는 날짜를 보지 않음'); }
{ const s = garden(kst('2026-10-10'));
  const m = Object.assign(copy(good), { gifts: [{ cat: 'seed', key: 'rose', n: 1 }, { cat: 'money', key: 'won', n: 99999 }, { cat: 'seed', key: 'nope', n: 3 }] });
  E.mailDeliver(s, [m], now, ctx);
  const b = E.mailOf(s, good.id), money0 = s.money;
  check(b && b.mail.gifts.length === 1 && b.mail.gifts[0].key === 'rose', '손댄 파일: 모르는 선물 · 돈은 건너뛰고 편지는 옴');
  E.mailTake(s, good.id, ctx);
  check(s.money === money0, '돈은 들어오지 않음'); }
{ const s = garden(kst('2026-10-10'));
  const n = E.mailDeliver(s, [{ id: 'x' }, null, Object.assign(copy(good), { id: 'bad-date', start: '2026-11-31' }), 'text'], now, ctx);
  check(n === 0 && !Object.keys(s.mailGot).length, '모양이 틀린 편지는 통째로 건너뜀 (기록도 안 남김)');
  check(E.mailDeliver(s, { not: 'list' }, now, ctx) === 0 && E.mailDeliver(s, null, now, ctx) === 0, '목록이 아니면 아무 일 없음'); }
{ const s = garden(kst('2026-10-10')); const toasts = [];
  E.mailDeliver(s, [Object.assign(copy(good), { gifts: [] })], now, { live: true, toast: t => toasts.push(t) });
  const b = E.mailOf(s, good.id);
  check(b.took === true && toasts[0] === '📮 새 편지가 왔어요', '선물 없는 편지는 받을 것 없음 · 보고 있으면 알림 "📮 새 편지가 왔어요"'); }
{ const s = garden(kst('2026-10-10')); s.settings.slow = true;
  check(E.mailDeliver(s, [all], now, ctx) === 1, '🐢 느긋하게 보기여도 편지는 옴'); }

console.log('[받은 편지함이 가득할 때]');
{ const s = garden(kst('2026-10-10'));
  s.letterBox = Array.from({ length: E.LETTER_BOX_MAX }, (_, i) => ({ k: null, mail: { id: 'm' + i, from: 'a', title: 'b', text: 'c', gifts: [{ cat: 'seed', key: 'rose', n: 1 }] }, took: i === 5 ? true : null, read: true, y: 1, m: 3 }));
  E.mailDeliver(s, [all], now, ctx);
  check(s.letterBox.length === E.LETTER_BOX_MAX && !E.mailOf(s, 'm5') && E.mailOf(s, 'm0') && E.mailOf(s, all.id), '가득하면 선물을 받은 편지부터 밀어냄');
  E.mailDeliver(s, [Object.assign(copy(good), { id: 'next' })], now, ctx);
  check(s.letterBox.length === E.LETTER_BOX_MAX + 1 && E.mailOf(s, 'm0'), '선물을 안 받은 편지만 남았으면 밀지 않음 (넘쳐도 둠)');
  E.mailTake(s, 'm0', ctx); E.mailTake(s, 'm1', ctx); E.mailDeliver(s, [Object.assign(copy(good), { id: 'next2' })], now, ctx);
  check(s.letterBox.length === E.LETTER_BOX_MAX && !E.mailOf(s, 'm0') && !E.mailOf(s, 'm1') && E.mailOf(s, 'next2'), '받고 나면 다음에 밀려남'); }
{ const s = garden(kst('2026-10-10'));
  s.letterBox = [{ k: 'welcome', read: true }, ...Array.from({ length: E.LETTER_BOX_MAX - 2 }, () => ({ k: 'x', read: true })), { k: null, gift: 'bouquet', read: true }];
  E.mailDeliver(s, [all], now, ctx);
  check(s.letterBox.length === E.LETTER_BOX_MAX && !s.letterBox.some(b => b.gift === 'bouquet') && s.letterBox[0].k === 'welcome', '이웃의 고맙다는 답장(다시 볼 것 없음)이 가장 먼저 밀림'); }

console.log('[저장 · 드라이브 · 파일 불러오기]');
{ const s = garden(kst('2026-10-10'));
  E.mailDeliver(s, [all], now, ctx); E.mailTake(s, all.id, ctx);
  const save = E.makeSave(s, now), p = E.parseSave(JSON.stringify(save));
  const g = E.migrateSave(p.data.game);
  check(p.ok && g.mailGot[all.id] === now && E.mailDeliver(g, [all], now + H, ctx) === 0, '파일 저장 → 불러오기 뒤에도 받은 기록 그대로 · 다시 안 옴');
  // 다른 기기: 드라이브 정원(받음)을 고르면 그 정원의 기록을 씀
  const other = garden(kst('2026-10-10')); other.gardenId = s.gardenId; other.actAt = now - 3 * H;
  const d = E.cloudDecide({ gardenId: other.gardenId, actAt: other.actAt }, null, { gardenId: s.gardenId, savedAt: now });
  const used = d.act === 'remote' ? E.migrateSave(copy(save.game)) : other;
  check(d.act === 'remote' && E.mailDeliver(used, [all], now + H, ctx) === 0 && used.items.filter(x => x.type === 'rose').length === s.items.filter(x => x.type === 'rose').length, '다른 기기에서 드라이브 정원을 고르면 두 번 안 받음 (cloudDecide)'); }

console.log('[시뮬레이션에 영향 없음]');
{ const a = E.create(kst('2026-10-10'), () => 0.5), b = E.create(kst('2026-10-10'), () => 0.5); b.gardenId = a.gardenId;
  E.mailDeliver(b, [], now, ctx);
  delete a.mailGot; delete b.mailGot;
  check(JSON.stringify(a) === JSON.stringify(b), '빈 mail.json이면 정원이 그대로'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
