// P26-06 🎁 답례품: 등급별 칸 · 같은 rng면 같은 결과 · 기대 가치 상한 · 장식 중복 · 알맞은 곳 · 저장 뒤에도 그대로
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const seeded = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const fresh = () => { const s = E.create(at(c => c.month === 4 && !c.frozen), () => 0.5); s.gardenId = 'return-test'; s.money = 1e6; return s; };
const LIKES = [null, 'seed', 'supply', 'honey', 'mine', 'deco'];
const inTable = (g, re) => E.RETURNS[g].some(e => e.cat === re.cat && e.n === re.n && (e.cat === 'honey' ? E.HONEY_KEYS.includes(re.key) : e.keys.includes(re.key)));

console.log('[등급별로 그 칸에서만]');
for (const g of E.GIFT_KEYS) {
  const st = fresh(), rng = seeded(11); let all = true;
  for (let i = 0; i < 3000; i++) { const re = E.pickReturn(st, g, LIKES[i % LIKES.length], rng); if (!inTable(g, re)) { all = false; console.log('    밖:', g, JSON.stringify(re)); break; } }
  check(all, `${E.GIFTS[g].ic} ${E.GIFTS[g].name}: 3,000번 모두 그 등급 칸에서`);
}
{ const st = fresh(), rng = seeded(5), got = new Set();
  for (let i = 0; i < 3000; i++) got.add(E.pickReturn(st, 'bouquet', null, rng).key);
  check(!['napmae', 'maehwa', 'bonsai', 'jars', 'oldseed', 'amber', 'birdhouse'].some(k => got.has(k)), '💐에는 🎉의 귀한 것(납매 · 분재 · 옛 씨앗 등)이 안 나옴'); }
{ const st = fresh(), rng = seeded(9), got = new Set();
  for (let i = 0; i < 5000; i++) got.add(E.pickReturn(st, 'party', null, rng).key);
  check(got.has('bonsai') || got.has('jars'), '🎉에서는 가끔 귀한 장식(장독대 · 매화 분재)'); }
check(Object.values(E.RETURNS).flat().every(e => ['seed', 'supply', 'honey', 'mine', 'deco'].includes(e.cat)), '차 · 꽃잎처럼 바로 팔 수 있는 것은 칸에 없음');
check(Object.values(E.RETURNS).flat().filter(e => e.cat === 'deco').every(e => e.keys.every(k => !E.DECOS[k].func && !E.DECOS[k].gear && E.DECOS[k].price)), '수입을 늘리는 장식(벌통 · 빗물 통 · 장치)은 칸에 없음');

console.log('[같은 rng면 같은 결과]');
{ const a = fresh(), b = fresh(), ra = seeded(42), rb = seeded(42);
  const sa = [], sb = []; for (let i = 0; i < 200; i++) { sa.push(E.pickReturn(a, 'teabox', 'honey', ra)); sb.push(E.pickReturn(b, 'teabox', 'honey', rb)); }
  check(JSON.stringify(sa) === JSON.stringify(sb), '같은 씨앗 rng → 같은 답례품 200개');
  const rc = seeded(43), sc = []; for (let i = 0; i < 200; i++) sc.push(E.pickReturn(a, 'teabox', 'honey', rc));
  check(JSON.stringify(sa) !== JSON.stringify(sc), '다른 씨앗이면 달라짐'); }
const run = seed => { const s = fresh(); const ctx = { live: false, rng: seeded(seed) };
  for (const g of E.GIFT_KEYS) E.sendGift(s, g); E.advance(s, E.calendar(s.virtual).slotEnd + 0.1 * H, ctx); return s; };
{ const a = run(7), b = run(7);
  check(a.letterBox.length === 3 && JSON.stringify(a.letterBox) === JSON.stringify(b.letterBox) && JSON.stringify(a.items) === JSON.stringify(b.items), '선물 3가지 → 다음 달 편지 3통 · 답례품 3개, 같은 ctx.rng면 똑같음'); }
{ const s = fresh(); E.sendGift(s, 'bouquet'); E.advance(s, E.calendar(s.virtual).slotEnd + 0.1 * H, { live: false });
  const t = fresh(); E.sendGift(t, 'bouquet'); E.advance(t, E.calendar(t.virtual).slotEnd + 0.1 * H, { live: false });
  check(s.letterBox[0].re && JSON.stringify(s.letterBox) === JSON.stringify(t.letterBox), 'ctx.rng가 없으면 정원 이름표로 정해짐 (Math.random 안 씀)'); }

console.log('[기대 가치는 선물값의 25% 아래 · 돈 고리 없음]');
for (const g of E.GIFT_KEYS) {
  const P = E.GIFTS[g].price, evs = LIKES.map(l => E.returnEV(g, l)), max = Math.max(...evs);
  check(max <= P * 0.25, `${E.GIFTS[g].name} ${P.toLocaleString()}원: 기대 가치 ${Math.round(E.returnEV(g, null)).toLocaleString()}원 · 이웃 가중치 최대 ${Math.round(max).toLocaleString()}원 (${(max / P * 100).toFixed(1)}%)`);
  const st = fresh(), rng = seeded(3); let sum = 0, top = 0; const N = 20000;
  for (let i = 0; i < N; i++) { const v = E.returnValue(E.pickReturn(st, g, LIKES[i % LIKES.length], rng)); sum += v; top = Math.max(top, v); }
  check(sum / N <= P * 0.25 && top < P, `  ${N.toLocaleString()}번 뽑은 평균 ${Math.round(sum / N).toLocaleString()}원 · 가장 비싼 것 ${top.toLocaleString()}원 < 선물값`);
}

console.log('[장식 중복은 같은 등급의 다른 것으로]');
{ const st = fresh(); st.dex.deco = { stepstone: true }; const rng = seeded(21), decos = new Set();
  for (let i = 0; i < 2000; i++) { const re = E.pickReturn(st, 'bouquet', 'deco', rng); if (re.cat === 'deco') decos.add(re.key); }
  check(decos.size === 1 && decos.has('fence'), '💐 징검돌이 있으면 나무 울타리만'); }
{ const st = fresh(); st.dex.deco = { stepstone: true, fence: true }; const rng = seeded(22); let deco = 0;
  for (let i = 0; i < 2000; i++) if (E.pickReturn(st, 'bouquet', 'deco', rng).cat === 'deco') deco++;
  check(deco === 0, '💐 장식을 다 가졌으면 장식 아닌 것으로'); }
{ const st = fresh(); st.dex.deco = { jars: true, bonsai: true }; const rng = seeded(23), decos = new Set();
  for (let i = 0; i < 4000; i++) { const re = E.pickReturn(st, 'party', null, rng); if (re.cat === 'deco') decos.add(re.key); }
  check(!decos.has('jars') && !decos.has('bonsai') && decos.size === 4, '🎉 귀한 장식이 다 있으면 좋은 장식 4가지로'); }
{ const st = fresh(); st.dex.deco = { birdhouse: true, basin: true, bench: true, stonelamp: true }; const rng = seeded(24), decos = new Set();
  for (let i = 0; i < 4000; i++) { const re = E.pickReturn(st, 'party', null, rng); if (re.cat === 'deco') decos.add(re.key); }
  check([...decos].every(k => k === 'jars' || k === 'bonsai'), '🎉 좋은 장식이 다 있어도 더 비싼 귀한 칸이 늘지 않음 (귀한 칸은 그대로)'); }

console.log('[알맞은 곳에 들어감]');
{ const st = fresh(); st.dex.flower = { lavender: true };
  const n0 = st.items.length, f0 = st.fert, b0 = st.basket;
  E.giveReturn(st, { cat: 'seed', key: 'chamomile', n: 3 });
  check(st.items.length === n0 + 3 && st.items.slice(-3).every(i => i.type === 'chamomile' && i.origin === '답례품' && i.q === 1), '씨앗 → 창고 (어디서: 답례품)');
  E.giveReturn(st, { cat: 'supply', key: 'fert', n: 10 }); E.giveReturn(st, { cat: 'supply', key: 'basket', n: 2 });
  check(st.fert === f0 + 10 && st.basket === b0 + 20, '비료 10개 · 바구니 2개(20번) → 창고 용품');
  E.giveReturn(st, { cat: 'honey', key: 'lavender', n: 2 });
  check(st.honey.lavender === 2 && !(st.dex.honey || {}).lavender, '꿀 → 찻집 꿀 선반 (꿀 도감은 직접 거둔 것만)');
  E.giveReturn(st, { cat: 'mine', key: 'shell', n: 1 });
  check(st.mine.bag.shell === 1 && !(st.dex.mine || {}).shell, '화석 → 광산 주머니 (광산 도감은 직접 판 것만)');
  E.giveReturn(st, { cat: 'deco', key: 'bench', n: 1 });
  check(st.decos.some(d => d.key === 'bench' && d.x == null) && st.dex.deco.bench, '장식 → 창고 · 꾸밈 도감');
  const rng = seeded(31); let honeyOk = true;
  for (let i = 0; i < 2000; i++) { const re = E.pickReturn(st, 'teabox', 'honey', rng); if (re.cat === 'honey' && !(re.key === 'wild' || re.key === 'lavender')) honeyOk = false; }
  check(honeyOk, '꿀은 들꽃꿀이나 본 적 있는 꽃의 꿀만'); }

console.log('[편지 · 일지 · 알림]');
{ const s = fresh(), toasts = []; E.sendGift(s, 'party');
  E.advance(s, E.calendar(s.virtual).slotEnd + 0.1 * H, { live: true, rng: seeded(8), toast: t => toasts.push(t) });
  const b = s.letterBox[0];
  check(b && b.k && E.LETTERS[b.k].gift === 'party' && b.re && b.gift === 'party' && b.read === false, '받은 편지함에 편지 · 답례품 · 아직 안 읽음');
  check(s.log.some(l => l.type === 17 && l.text.startsWith('🎁 답례품 ') && l.text.includes(E.returnText(b.re))), '일지: 🎁 답례품 ○○ ×n · 어디에 있는지');
  check(toasts.some(t => t.includes(E.LETTERS[b.k].from) && t.includes(E.returnText(b.re))), '알림: 누구의 답장 · 무엇');
  check(E.letterOf(s, b.k) === b, '도감에서 다시 읽을 때 그 편지의 답례품을 찾음'); }
{ const s = fresh(); s.dex.letter = Object.fromEntries(E.LETTER_KEYS.map(k => [k, true])); E.sendGift(s, 'teabox');
  E.advance(s, E.calendar(s.virtual).slotEnd + 0.1 * H, { live: false, rng: seeded(4) });
  check(s.letterBox.length === 1 && s.letterBox[0].k === null && s.letterBox[0].re, '편지를 다 모은 뒤 고맙다는 답장에도 답례품'); }
{ const s = fresh(); s.letterBox = Array.from({ length: 60 }, (_, i) => ({ k: i < 12 ? E.LETTER_KEYS[i] : null, gift: 'bouquet', re: null, read: true }));
  s.dex.letter = Object.fromEntries(E.LETTER_KEYS.map(k => [k, true])); E.sendGift(s, 'bouquet');
  E.advance(s, E.calendar(s.virtual).slotEnd + 0.1 * H, { live: false, rng: seeded(4) });
  check(s.letterBox.length === 60 && E.LETTER_KEYS.every(k => E.letterOf(s, k)), '받은 편지함은 60통까지 · 도감 편지는 지우지 않음'); }

console.log('[저장 · 불러오기 뒤에도 그대로]');
{ const s = run(12), keep = JSON.stringify({ box: s.letterBox, items: s.items.length, fert: s.fert, honey: s.honey, bag: s.mine.bag, decos: s.decos.length });
  const p = E.parseSave(JSON.stringify(E.makeSave(s, 0))), back = E.migrateSave(p.ok && p.data.game);
  check(JSON.stringify({ box: back.letterBox, items: back.items.length, fert: back.fert, honey: back.honey, bag: back.mine.bag, decos: back.decos.length }) === keep, '받은 편지 · 답례품 · 들어간 물건이 그대로');
  const k = back.letterBox.find(b => b.k).k; check(E.returnText(E.letterOf(back, k).re).includes('×'), '불러온 뒤에도 편지마다 답례품 글'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
