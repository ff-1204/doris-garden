// 🐾 특별 손님 → 기념품 (P30-06, L1-6 · L1-8 10-30): 표 8명 · 조건(놓은 장식 · 핀 꽃 · 올해만 것) · 결정적(이름표 · 해 · 달) · 한꺼번에 둘까지
//   · 빈 칸 없으면 안 옴 · 2~3달 뒤 떠남 · 꽃잠엔 안 옴 · 세 번째로 온 날 기념품(한 번만) · 돈 · 경험치 · 주문 0 · 새 철에 이어짐 · 저장
//   · 여정 15-3 · 15-4 · 16-4
const path = require('path');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MH = E.MONTH_H, copy = o => JSON.parse(JSON.stringify(o));
const quiet = { live: false, rng: () => 0.5 };
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const fresh = id => { const s = E.create(mon + 0.1 * H, () => 0.5); s.gardenId = id; s.onboarded = true; return s; };
let nid = 9000;
const put = (s, key, x, y) => { const d = { id: nid++, key, x, y }; s.decos.push(d); return d; };
const bloom = (s, type, x, y) => { const f = { id: nid++, type, x, y, q: 1, ageH: 9999, lifeH: 9999, waterH: 99, stage: 'bloom', bloomed: true, withered: false }; s.flowers.push(f); return f; };
const calAt = (s, abs) => Object.assign({}, E.calendar(s.virtual), { abs, frozen: false });   // 흐르는 달 (abs만 바꿔 여러 달을 굴림)
const run = (s, from, n) => { const out = []; for (let a = from; a < from + n; a++) { const e = E.visitorTick(s, calAt(s, a), quiet); if (e) out.push([a, e]); } return out; };
const swingGarden = id => { const s = fresh(id); put(s, 'swing', 10, 10); return s; };

console.log('[표 8명 · 기념품 8가지]');
check(E.VISITOR_KEYS.length === 12 && E.VISITOR_KEYS.every(k => { const V = E.VISITORS[k]; return V.name && V.icon && V.where && V.lines.length >= 2 && V.lines.length <= 3 && E.MEMENTOS[V.memento] && E.MEMENTOS[V.memento].visitor === k; }), '12명(길 손님 3 · P30-04-01 · 숲 손님 1 · P30-03) · 이름 · 아이콘 · 말 둘셋 · 기념품이 서로 짝');
check(E.MEMENTO_KEYS.length === 24 && E.ORDER_MEMENTO_KEYS.length === 12 && E.ORDER_MEMENTO_KEYS.every(k => !E.MEMENTOS[k].visitor), '기념품 12 → 24 (길 손님 3 · 숲 손님 1) · 주문 기념품 뽑기는 12가지 그대로');
check(new Set(E.VISITOR_KEYS.map(k => E.VISITORS[k].memento)).size === 12, '손님마다 기념품이 다름');
check(E.VISITORS.hedgehog.name === '고슴도치 할머니' && E.MEMENTOS[E.VISITORS.hedgehog.memento].name === '도토리 찻잔 받침', '🦔 고슴도치 할머니 → 도토리 찻잔 받침');

console.log('[조건 — 놓은 장식 · 핀 꽃 · 올해만 것]');
{ const s = fresh('v-cond');
  check(E.VISITOR_KEYS.every(k => !E.visitorOk(s, k)), '빈 정원엔 아무 조건도 안 맞음');
  check(run(copy(s), 100, 60).length === 0, '장식 · 꽃이 없으면 60달 동안 아무도 안 옴');
  { const p = copy(s); p.season.path = 'tea'; check(E.visitorOk(p, 'squirrel') === false, '🐿️ 찻길 손님도 앉을 장식 · 꽃이 없으면 안 옴 (P30-04-01)');
    p.flowers.push({ id: 99, type: 'rose', x: 5, y: 5, stage: 'bloom', q: 1, ageH: 1, lifeH: 999, waterH: 0, thirstH: 0 });
    check(E.visitorOk(p, 'squirrel') && !E.visitorOk(Object.assign(copy(p), { season: Object.assign(copy(p.season), { path: null }) }), 'squirrel'), '찻길 철에 꽃이 있으면 옴 · 길 없이면 안 옴'); }
  const w = copy(s); w.decos.push({ id: 1, key: 'swing', x: null, y: null });
  check(!E.visitorOk(w, 'hedgehog'), '창고에 있는 그네로는 안 옴 (놓아야 함)');
  put(w, 'swing', 5, 5); check(E.visitorOk(w, 'hedgehog'), '🦔 나무 그네를 놓으면');
  const a = copy(s); put(a, 'arch', 5, 5); check(E.visitorOk(a, 'tit') && !E.visitorOk(a, 'hedgehog'), '🐦 꽃 아치 (그네 손님은 아님)');
  const b = copy(s); put(b, 'hive', 5, 5); check(E.visitorOk(b, 'beekid'), '🐝 벌통');
  const c = copy(s); bloom(c, 'rose', 5, 5); check(!E.visitorOk(c, 'cat'), '🐈 손님 자리 1이면 안 옴');
  E.shopOf(c).seats = 2; check(E.visitorOk(c, 'cat'), '🐈 손님 자리 2 (찻집 가꾸기)');
  const f = copy(s); for (let i = 0; i < 9; i++) bloom(f, 'chamomile', 2 + i * 2, 4);
  check(!E.visitorOk(f, 'butterfly'), '🦋 핀 꽃 9포기면 아직'); bloom(f, 'chamomile', 2, 8); check(E.visitorOk(f, 'butterfly'), '🦋 핀 꽃 10포기');
  f.flowers.forEach(x => { x.stage = 'mature'; }); check(!E.visitorOk(f, 'butterfly'), '🦋 안 핀 꽃은 세지 않음');
  const g = copy(s); bloom(g, 'lotus', 5, 5); check(!E.visitorOk(g, 'frog'), '🐸 연꽃만 피고 소나기를 못 봤으면 안 옴');
  g.yearly.got.shower = 1; check(E.visitorOk(g, 'frog'), '🐸 소나기를 본 정원 + 핀 연꽃');
  const h = copy(s); h.yearly.got.firstsnow = 1; check(!E.visitorOk(h, 'snowkid'), '⛄ 첫눈만 보고 동백이 없으면 안 옴'); bloom(h, 'dongbaek', 5, 5); check(E.visitorOk(h, 'snowkid'), '⛄ 첫눈 본 정원 + 핀 동백');
  const o = copy(s); put(o, 'sundial', 5, 5); check(!E.visitorOk(o, 'owl'), '🦉 해시계만으론 안 옴'); o.yearly.got.bigmoon = 1; check(E.visitorOk(o, 'owl'), '🦉 큰 달 본 정원 + 해시계');
  const rich = copy(s); rich.money = 9e9; rich.grade = { xp: 9e7, dex: null, by: {} };
  check(E.VISITOR_KEYS.every(k => !E.visitorOk(rich, k)), '돈 · 등급이 아무리 많아도 조건엔 안 들어감'); }

console.log('[결정적 · 이름표 · 달]');
{ const A = swingGarden('v-det-1'), B = copy(A), r1 = run(A, 200, 80), r2 = run(B, 200, 80);
  check(r1.length > 0 && JSON.stringify(r1) === JSON.stringify(r2) && JSON.stringify(A.visitors) === JSON.stringify(B.visitors), `같은 정원 같은 달이면 같은 결과 (80달에 ${r1.length}번 옴)`);
  const sig = id => JSON.stringify(run(swingGarden(id), 200, 80).map(x => [x[0], x[1].key]));
  check(sig('v-det-1') !== sig('v-det-2') && sig('v-det-2') !== sig('v-det-3'), '정원 이름표가 다르면 오는 달이 다름');
  const many = Array.from({ length: 60 }, (_, i) => run(swingGarden('v-rate-' + i), 300, 30).length).reduce((a, b) => a + b, 0) / 60;
  check(many > 3 && many < 9, `조건이 맞으면 가끔 옴 (30달에 평균 ${many.toFixed(1)}번 — 앉아 있는 달 · 1/3 확률)`);
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'engine.js'), 'utf8'), sec = src.slice(src.indexOf('---- 🐾 특별 손님 (P30-06-01'), src.indexOf('---- 저장 파일 (P20-02'));
  check(sec.length > 1000 && !sec.includes('Math.random('), '손님 칸에 Math.random 없음'); }

console.log('[자리 · 한꺼번에 둘까지 · 빈 칸]');
{ const s = swingGarden('v-seat');
  const r = run(s, 400, 40), first = r[0] && r[0][1];
  const v = E.visitorsOf(s, calAt(s, r[0][0]));
  check(first && first.key === 'hedgehog' && first.text === '🦔 고슴도치 할머니가 나무 그네 옆에 앉았어요', `알림 문구 "${first && first.text}"`);
  const seat = s.visitors.now[0] || null;
  check(!seat || (Math.max(Math.abs(seat.x - 10), Math.abs(seat.y - 10)) === 1 && !E.flowerAt(s, seat.x, seat.y) && !E.decoAt(s, seat.x, seat.y)), '그네 바로 옆 빈 칸에 앉음');
  const full = fresh('v-full'); put(full, 'swing', 0, 0); bloom(full, 'rose', 1, 0); bloom(full, 'rose', 0, 1); bloom(full, 'rose', 1, 1);
  check(run(full, 400, 60).length === 0 && E.visitorCells(full, 'hedgehog').length === 0, '그네 둘레에 빈 칸이 없으면 안 옴 (지도 모서리 · 꽃으로 막힘)');
  const busy = fresh('v-busy'); put(busy, 'swing', 5, 5); put(busy, 'arch', 15, 5); put(busy, 'hive', 25, 5); put(busy, 'sundial', 5, 15); busy.yearly.got.bigmoon = 1; E.shopOf(busy).seats = 3; bloom(busy, 'rose', 20, 15);
  let most = 0; for (let a = 500; a < 700; a++) { E.visitorTick(busy, calAt(busy, a), quiet); most = Math.max(most, busy.visitors.now.length); if (new Set(busy.visitors.now.map(x => x.x + ',' + x.y)).size !== busy.visitors.now.length) most = 99; }
  check(most === 2, `조건이 많이 맞아도 한꺼번에 둘까지 · 같은 칸엔 하나 (가장 많이 ${most})`);
  check(Object.keys(busy.visitors.times).length >= 4, `여러 손님이 번갈아 옴 (${Object.keys(busy.visitors.times).map(k => E.VISITORS[k].icon).join('')})`); }

console.log('[2~3달 뒤 떠남 · 온 횟수]');
{ const s = swingGarden('v-stay'); s.visitors.call = 'hedgehog';
  const e = E.visitorTick(s, calAt(s, 1000), quiet), stay = s.visitors.now[0].left;
  check(e && e.times === 1 && E.visitorTimes(s, 'hedgehog') === 1 && (stay === 3 || stay === 4), `부르면 다음 달에 꼭 옴 (DEV) · 온 횟수 1 · 머물 달 ${stay} (P33-02 그네 옆이라 +1)`);
  let leftAt = null; for (let a = 1001; a < 1010 && leftAt == null; a++) { E.visitorTick(s, calAt(s, a), quiet); if (!s.visitors.now.some(v => v.k === 'hedgehog')) leftAt = a - 1000; }
  check(leftAt === stay, `${stay}달 뒤 떠남`);
  check(s.log.some(l => l.text === '🦔 고슴도치 할머니가 다녀갔어요'), '일지 "🦔 고슴도치 할머니가 다녀갔어요"');
  const lens = new Set(); for (let i = 0; i < 40; i++) { const g = swingGarden('v-len-' + i); g.visitors.call = 'hedgehog'; E.visitorTick(g, calAt(g, 50), quiet); lens.add(g.visitors.now[0].left); }
  check([...lens].sort().join() === '3,4', '머무는 달은 2 또는 3 · 그네 옆이라 +1 → 3 또는 4 (P33-02)');
  const m = swingGarden('v-move'); m.visitors.call = 'hedgehog'; E.visitorTick(m, calAt(m, 60), quiet); const v = m.visitors.now[0];
  bloom(m, 'rose', v.x, v.y);
  check(E.visitorsOf(m, calAt(m, 60)).length === 0, '앉은 칸에 꽃을 심으면 보이지 않고');
  E.visitorTick(m, calAt(m, 61), quiet); check(m.visitors.now.length === 0 && E.visitorTimes(m, 'hedgehog') === 1, '다음 달에 떠남 (온 횟수는 그대로)'); }

console.log('[꽃잠엔 안 옴 · 앉은 손님은 그대로]');
{ const s = swingGarden('v-sleep'); s.visitors.call = 'hedgehog';
  const sl = Object.assign({}, E.calendar(s.virtual), { abs: 70, frozen: true });
  check(E.visitorTick(s, sl, quiet) === null && s.visitors.now.length === 0, '꽃잠엔 불러도 안 옴');
  s.visitors.call = 'hedgehog'; E.visitorTick(s, calAt(s, 71), quiet); const left = s.visitors.now[0].left;
  for (let i = 0; i < 5; i++) E.visitorTick(s, Object.assign({}, sl, { abs: 72 + i }), quiet);
  check(s.visitors.now.length === 1 && s.visitors.now[0].left === left, '꽃잠 동안 앉은 손님은 그대로 (떠날 달을 세지 않음)'); }

console.log('[세 번째로 온 날 기념품 — 15-4]');
{ const s = swingGarden('v-gift'), gifts = [];
  const lv = { live: true, rng: () => 0.5, onVisitor: e => gifts.push(e) };
  let a = 2000, money = s.money, xp = s.grade.xp, orders = JSON.stringify(s.orders), stats = JSON.stringify(s.stats);
  const come = () => { s.visitors.call = 'hedgehog'; for (let i = 0; i < 6 && !s.visitors.now.length; i++) { E.visitorTick(s, calAt(s, a++), lv); if (!s.visitors.now.length) s.visitors.call = 'hedgehog'; } const ev = gifts[gifts.length - 1]; for (let i = 0; i < 4 && s.visitors.now.length; i++) E.visitorTick(s, calAt(s, a++), lv); return ev; };
  const e1 = come(), e2 = come();
  check(e1.times === 1 && !e1.gift && e2.times === 2 && !e2.gift && !s.dex.memento.coaster, '첫 번째 · 두 번째엔 기념품 없음');
  const e3 = come();
  check(e3.times === 3 && e3.gift && e3.gift.name === '도토리 찻잔 받침' && s.dex.memento.coaster === true && s.visitors.gift.hedgehog === true, '세 번째로 온 날 도토리 찻잔 받침 → 💌 기념품 도감 칸');
  check(e3.gift.text === '🦔 고슴도치 할머니가 도토리 찻잔 받침을 남겼어요' && s.log.some(l => l.text.startsWith('🦔 고슴도치 할머니가 도토리 찻잔 받침을 남겼어요')), `알림 · 일지 "${e3.gift.text}"`);
  check(E.mementoCount(s) === 1, '기념품 도감 1 / 20');
  const e4 = come();
  check(e4.times === 4 && !e4.gift, '네 번째부터는 기념품 없음 (손님마다 한 번)');
  check(s.money === money && s.grade.xp === xp && JSON.stringify(s.orders) === orders && JSON.stringify(s.stats) === stats, '돈 · 경험치 · 주문 · 통계 그대로 (보는 즐거움 · 수집만, P17-14)');
  check(E.gradeDexCount(s) === E.gradeDexCount(swingGarden('v-gift')) && E.dexCount(s) === E.dexCount(swingGarden('v-gift')), '기념품은 기본 도감 칸 · 등급 경험치 도감 칸에 안 들어감'); }

console.log('[알림은 열어 둔 채일 때만 · 따라잡기는 일지만]');
{ const s = swingGarden('v-live'), got = [];
  s.visitors.call = 'hedgehog'; E.visitorTick(s, calAt(s, 3000), { live: false, onVisitor: e => got.push(e) });
  check(got.length === 0 && s.log.some(l => l.text.includes('나무 그네 옆에 앉았어요')), '따라잡는 동안엔 알림 없이 일지만');
  const t = swingGarden('v-live2'); t.onboarded = false; t.visitors.call = 'hedgehog'; E.visitorTick(t, calAt(t, 3000), { live: true, onVisitor: e => got.push(e) });
  check(got.length === 0, '첫 안내 중엔 알림 없음'); }

console.log('[실제 시간 흐름 (advance → onSlot)]');
{ const s = swingGarden('v-adv'); bloom(s, 'rose', 20, 10);
  E.advance(s, s.virtual + 6 * 14 * MH * H, quiet);
  const t = E.visitorTimes(s, 'hedgehog');
  check(t >= 1 && s.money >= 0, `6해를 비운 채 따라잡아도 손님이 다녀감 (온 횟수 ${t}, 켜 둘 필요 없음)`); }

console.log('[주문 기념품은 그대로 12가지에서]');
{ const s = fresh('v-order'); s.orders = { abs: 1, list: [{ kind: 'any', done: false }] };
  const r = E.fillOrder(s, { kind: 'tea', type: 'rose', q: 3 });
  check(r && r.gift && !E.MEMENTOS[r.gift].visitor, `주문 손님은 특별 손님 기념품을 두고 가지 않음 (${E.MEMENTOS[r.gift].name})`);
  for (const k of E.ORDER_MEMENTO_KEYS) s.dex.memento[k] = true;
  s.orders = { abs: 2, list: [{ kind: 'any', done: false }] }; const f0 = s.fert;
  const r2 = E.fillOrder(s, { kind: 'tea', type: 'rose', q: 3 });
  check(r2 && r2.gift === null && s.fert === f0 + 1, '주문 기념품 12가지를 다 모으면 비료 한 줌 (특별 손님 칸이 비어 있어도)'); }

console.log('[말 한 줄 — 같은 손님 같은 달이면 같은 말]');
{ const s = swingGarden('v-line'); s.visitors.call = 'hedgehog'; E.visitorTick(s, calAt(s, 4000), quiet);
  const v1 = E.visitorsOf(s, calAt(s, 4000))[0], v2 = E.visitorsOf(copy(s), calAt(s, 4000))[0];
  check(v1 && v1.line === v2.line && E.VISITORS.hedgehog.lines.includes(v1.line) && v1.times === 1 && v1.icon === '🦔', `말 "${v1 && v1.line}" · 같은 달 같은 말`);
  const lines = new Set(Array.from({ length: 30 }, (_, i) => E.visitorsOf(s, calAt(s, 4000 + i))[0].line));
  check(lines.size >= 2, '달이 바뀌면 다른 말도 함');
  check(E.visitorAt(s, v1.x, v1.y, calAt(s, 4000)).key === 'hedgehog' && E.visitorAt(s, 0, 0, calAt(s, 4000)) === null, 'visitorAt: 그 칸의 손님 | null'); }

console.log('[새 철 — 온 횟수 · 기념품은 이어지고 앉은 손님은 비움]');
{ const s = swingGarden('v-season'); s.visitors.call = 'hedgehog'; E.visitorTick(s, calAt(s, 5000), quiet);
  s.visitors.times.hedgehog = 3; s.visitors.gift.hedgehog = true; s.dex.memento.coaster = true;
  check(E.SEASON_KEEP.includes('visitors'), 'SEASON_KEEP에 visitors');
  // seasonStart 조건을 채움: 꽃잠 · 3해 · 꽃 13종
  let t = s.virtual; while (!E.calendar(t).frozen) t += H; s.virtual = t; s.lastAbs = E.calendar(t).abs;
  s.yearLog = [1, 2, 3].map(y => ({ year: y, season: 1, score: 1 })); for (const k of E.FLOWER_KEYS) s.dex.flower[k] = true;
  const r = E.seasonStart(s, quiet);
  check(r.ok && s.visitors.now.length === 0 && s.visitors.times.hedgehog === 3 && s.visitors.gift.hedgehog && s.dex.memento.coaster, '새 철: 앉은 손님은 떠나고 온 횟수 3 · 기념품은 그대로'); }

console.log('[저장 · 다시 열기]');
{ const s = swingGarden('v-save'); s.visitors.call = 'hedgehog'; E.visitorTick(s, calAt(s, 6000), quiet);
  const sv = E.makeSave(s, s.virtual), back = E.parseSave(JSON.stringify(sv)), mg = back.ok && E.migrateSave(back.data.game);
  check(mg && JSON.stringify(mg.visitors) === JSON.stringify(s.visitors), '저장 파일로 다시 열어도 손님 · 온 횟수 그대로'); }

console.log('[여정 15-3 · 15-4 · 16-4]');
{ const s = swingGarden('v-sol'); s.visitors.times.hedgehog = 2;   // 지난주 놓아 둔 나무 그네 · 이미 두 번 다녀감
  s.visitors.call = 'hedgehog'; const got = [];
  const e = E.visitorTick(s, calAt(s, 7000), { live: true, onVisitor: x => got.push(x) }), v = E.visitorsOf(s, calAt(s, 7000))[0];
  check(v && v.key === 'hedgehog' && Math.max(Math.abs(v.x - 10), Math.abs(v.y - 10)) === 1, '15-3 나무 그네 옆에 🦔 고슴도치 할머니가 앉아 있음');
  check(v.line && e.gift && e.gift.name === '도토리 찻잔 받침' && s.dex.memento.coaster && got.length === 1, `15-4 누르면 말 한 줄 "${v.line}" · 세 번째로 온 날이라 도토리 찻잔 받침 → 기념품 도감`);
  s.settings.slow = true;
  check(E.slowView(s) && v.line && !/[0-9]/.test(v.line) && !/[0-9]/.test(e.text), '16-4 느긋하게 보기여도 앉은 손님 · 말 한 줄은 그대로 (숫자 없음 — 방문 횟수는 화면이 숨김)'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
