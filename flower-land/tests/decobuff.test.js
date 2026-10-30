// 🪴 장식의 작은 버프 (P33, 10-30): 🪑 벤치 · 🪨 물확 · 🎐 풍경 · 🕰️ 해시계 · 🌳 그네
//   놓았을 때만 · 창고에 있으면 없음 · 둘 놓아도 한 번 · 새 철 뒤 꺼짐 · 돈 · 꽃잎 · 품질 · 잔 수 불변 · 저장 필드 새로 없음
const path = require('path');
const E = require(path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js')));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, MH = E.MONTH_H, WEEK = 7 * 24 * H, copy = o => JSON.parse(JSON.stringify(o));
const quiet = { live: false, rng: () => 0.5 };
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const fresh = id => { const s = E.create(mon + 0.1 * H, () => 0.5); s.gardenId = id; s.onboarded = true; return s; };
let nid = 9000;
const put = (s, key, x, y) => { const d = { id: nid++, key, x, y }; s.decos.push(d); return d; };
const flower = (s, type, x, y, o) => { const f = Object.assign({ id: nid++, type, x, y, q: 1, ageH: 9999, lifeH: 9999, waterH: 0, thirstH: 0, stage: 'bloom', bloomed: true, withered: false }, o); s.flowers.push(f); return f; };
const calAt = (s, abs) => Object.assign({}, E.calendar(s.virtual), { abs, frozen: false });
const keysOf = s => Object.keys(s).sort().join();
const wealth = s => JSON.stringify([s.money, s.petals.length, s.teas.length, s.water, s.fert, s.flowers.map(f => [f.type, f.q, f.stage]), s.items.length]);

console.log('[표 · decoBuff]');
{ const s = fresh('b-0');
  const b = E.decoBuff(s);
  check(b.bench.length === 0 && b.basin.length === 0 && !b.chime && !b.sundial && b.swing.length === 0, '빈 정원: 효과 없음');
  check(['bench', 'basin', 'chime', 'sundial', 'swing'].every(k => E.DECO_BUFF[k] && E.DECO_BUFF[k].text && E.DECO_BUFF[k].plain && !/\d/.test(E.DECO_BUFF[k].plain)), '다섯 장식 한 줄 · 느긋하게 보기 문구엔 숫자 없음');
  check(E.DECOS.bench.month === 5 && E.DECOS.basin.month === 6 && E.DECOS.chime.month === 7 && E.DECOS.sundial.grade === 20 && E.DECOS.swing.grade === 25, '이달의 장식 셋 (5 · 6 · 7월) · 등급 장식 둘 (20 · 25)');
  s.decos.push({ id: 1, key: 'chime', x: null, y: null }, { id: 2, key: 'sundial', x: null, y: null }, { id: 3, key: 'bench', x: null, y: null });
  const c = E.decoBuff(s);
  check(!c.chime && !c.sundial && !c.bench.length, '창고에 있는 장식은 효과 없음');
  check(E.decoBuffLine(s, 'chime') === '🎐 놓으면 올해만 것이 오기 하루 전에 알려 줘요', `놓지 않았으면 "놓으면 …": ${E.decoBuffLine(s, 'chime')}`);
  put(s, 'chime', 3, 3);
  check(E.decoBuff(s).chime && E.decoBuffLine(s, 'chime') === '🎐 올해만 것이 오기 하루 전에 알려 줘요', '놓으면 한 줄 그대로');
  s.settings.slow = true;
  check(E.decoBuffLine(s, 'sundial') === '🌙 놓으면 자리를 비운 동안 조금 더 따라잡아요' && !/\d/.test(E.decoBuffLine(s, 'sundial')), '느긋하게 보기: 숫자 없이');
  check(E.decoBuffLine(s, 'stepstone') === null, '버프 없는 장식은 null'); }

console.log('[🪨 돌 물확]');
{ const s = fresh('b-basin');
  const a = flower(s, 'rose', 4, 4, { waterH: 0, thirstH: 30 }), b = flower(s, 'rose', 6, 4, { waterH: 0, thirstH: 50 }), c = flower(s, 'rose', 5, 6, { waterH: 0, thirstH: 50 }), far = flower(s, 'rose', 12, 12, { waterH: 0, thirstH: 99 });
  check(E.basinTick(copy(s), quiet) === null, '물확이 없으면 아무것도 안 함');
  const w = copy(s); w.decos.push({ id: 1, key: 'basin', x: null, y: null });
  check(E.basinTick(w, quiet) === null, '창고에 있는 물확은 쉼');
  const p = copy(s); put(p, 'basin', 5, 5);
  const water0 = p.water, before = wealth(p);
  const f = E.basinTick(p, quiet);
  check(f && f.x === 6 && f.y === 4, '둘레 1칸에서 가장 목마른 꽃 (같으면 자리 순 — 위쪽 줄 먼저)');
  const pf = p.flowers.find(x => x.x === 6 && x.y === 4);
  check(pf.waterH === 2 * MH && pf.thirstH === 0, 'waterH = 빗물 통과 같은 값 (2달) · 목마름 0');
  check(p.flowers.filter(x => x.waterH > 0).length === 1 && p.flowers.find(x => x.x === 12).waterH === 0, '한 포기만 · 둘레 밖은 그대로');
  check(p.water === water0 && p.stats.basinWater === 1, '물병 수 그대로 · stats.basinWater 1');
  check(p.log.some(l => l.type === 16 && l.text === '🪨 돌 물확의 빗물이 장미에 닿았어요'), `일지 type 16 "🪨 돌 물확의 빗물이 장미에 닿았어요"`);
  check(JSON.stringify([p.money, p.petals.length, p.teas.length, p.fert, p.flowers.map(x => [x.q, x.stage])]) === JSON.stringify([s.money, s.petals.length, s.teas.length, s.fert, s.flowers.map(x => [x.q, x.stage])]), '돈 · 꽃잎 · 티백 · 비료 · 품질 · 단계 그대로');
  const two = copy(s); put(two, 'basin', 5, 5); put(two, 'basin', 5, 3);
  E.basinTick(two, quiet);
  check(two.flowers.filter(x => x.waterH > 0).length === 1 && two.stats.basinWater === 1, '물확 둘이어도 한 달에 한 포기 (겹치지 않음)');
  const wet = copy(s); put(wet, 'basin', 5, 5); wet.flowers.forEach(x => { x.waterH = MH; });
  check(E.basinTick(wet, quiet) === null, '둘레 꽃이 다 물이 넉넉하면 안 줌 (빗물 통과 같은 기준)');
  check(!E.AUTO_STATS || !E.FARM_STATS || !JSON.stringify(E.FARM_STATS).includes('basin'), '곤충농장 · 자리를 비운 동안 일꾼 줄엔 안 넣음 (장식이지 일꾼이 아님)'); }
{ const s = fresh('b-basin-slot'); const f = flower(s, 'rose', 4, 4, { waterH: 0, thirstH: 10 }); put(s, 'basin', 5, 5);
  const w0 = s.water;
  E.advance(s, s.virtual + 2 * MH * H, quiet);
  check((s.stats.basinWater || 0) >= 1 && s.water === w0 && s.log.some(l => l.text.startsWith('🪨 돌 물확의 빗물이')), '달이 끝날 때(onSlot) 저절로 · 물병 그대로'); }

console.log('[🎐 풍경]');
{ const s = fresh('b-chime'); put(s, 'chime', 3, 3);
  const n0 = s.log.filter(l => l.text === E.CHIME_TEXT).length;
  E.advance(s, s.virtual + 3 * MH * H, quiet);   // 3월 → 6월 (여름 첫 달 앞 5월에 한 번)
  const lines = s.log.filter(l => l.text === E.CHIME_TEXT);
  check(n0 === 0 && lines.length === 1 && lines[0].type === 9 && lines[0].m === 5, `여름 오기 바로 앞 달(5월)에 한 번 · type 9 (${lines.map(l => l.m)})`);
  const at = s.log.indexOf(lines[0]), yl = s.log.findIndex(l => l.type === 9 && /^올해 여름엔/.test(l.text));
  check(yl > at, '올해만 것 줄보다 먼저');
  check(!/여름|봄|가을|겨울|무지개|소나기|반딧불|큰 달|첫눈/.test(E.CHIME_TEXT), '무엇인지는 안 알려 줌');
  const seen = []; let len = s.log.length;   // 쉼달에 일지가 비워지니 달마다 새 줄만 셈
  for (let i = 0; i < 14; i++) { E.advance(s, s.virtual + MH * H, quiet); const add = s.log.slice(s.log.length < len ? 0 : len); len = s.log.length; for (const l of add) if (l.text === E.CHIME_TEXT) seen.push(E.calendar(s.virtual).idx); }
  check(seen.join() === '5,8,13,2', `한 해 동안 계절마다 한 번씩 (5월 · 8월 · 꽃샘달 · 다음 해 5월 idx ${seen.join()}) — 두 번 안 울림`); }
{ const s = fresh('b-chime-none');
  E.advance(s, s.virtual + WEEK, quiet);
  check(!s.log.some(l => l.text === E.CHIME_TEXT), '풍경이 없으면 안 울림');
  const w = fresh('b-chime-store'); w.decos.push({ id: 1, key: 'chime', x: null, y: null });
  E.advance(w, w.virtual + WEEK, quiet);
  check(!w.log.some(l => l.text === E.CHIME_TEXT), '창고에 있으면 안 울림');
  const two = fresh('b-chime-two'); put(two, 'chime', 3, 3); put(two, 'chime', 6, 6);
  E.advance(two, two.virtual + 3 * MH * H, quiet);
  check(two.log.filter(l => l.text === E.CHIME_TEXT).length === 1, '풍경 둘이어도 한 번'); }
{ const s = fresh('b-chime-live'); put(s, 'chime', 3, 3);
  const toasts = []; const live = { live: true, rng: () => 0.5, toast: t => toasts.push(t) };
  s.settings.toast[9] = true;
  E.advance(s, s.virtual + 3 * MH * H, live);
  check(toasts.filter(t => t === E.CHIME_TEXT).length === 1, '열어 둔 채면 알림 한 줄 (📖 도감 등록 9번)');
  const off = fresh('b-chime-off'); put(off, 'chime', 3, 3); off.settings.toast[9] = false; const t2 = [];
  E.advance(off, off.virtual + 3 * MH * H, { live: true, rng: () => 0.5, toast: t => t2.push(t) });
  check(!t2.includes(E.CHIME_TEXT) && off.log.some(l => l.text === E.CHIME_TEXT), '알림 설정을 끄면 일지에만');
  const away = fresh('b-chime-away'); put(away, 'chime', 3, 3); away.settings.toast[9] = true; const t3 = [];
  E.advance(away, away.virtual + 3 * MH * H, { live: false, rng: () => 0.5, toast: t => t3.push(t) });
  check(!t3.length && away.log.filter(l => l.text === E.CHIME_TEXT).length === 1, '따라잡는 동안엔 일지에만 · 한 번'); }

console.log('[🕰️ 해시계]');
{ const s = fresh('b-sun');
  check(E.catchUpWeeks(s) === 3 && E.catchUpH(s) === 3 * 7 * 24, '기본 3주');
  s.decos.push({ id: 1, key: 'sundial', x: null, y: null });
  check(E.catchUpWeeks(s) === 3, '창고에 있으면 그대로');
  put(s, 'sundial', 4, 4);
  check(E.catchUpWeeks(s) === 4 && E.catchUpH(s) === 4 * 7 * 24, '놓으면 +1주 (4주)');
  put(s, 'sundial', 6, 6);
  check(E.catchUpWeeks(s) === 4, '둘 놓아도 +1주');
  s.bonus.catchup = 2;
  check(E.catchUpWeeks(s) === 6 && E.catchUpH(s) === 6 * 7 * 24 && E.CATCHUP_MAX_W === 6, '🌟 따라잡기 길게 끝(5주) + 해시계 = 6주 (최대)');
  check(E.farmOf(s).catchup.weeks === 6, '곤충농장 🌙 칸 "n주까지 따라잡아요"가 이 값을 읽음');
  check(E.bonusView(s).rows.find(r => r.key === 'catchup').desc === '오래 비워도 5주까지 따라잡아요', '손길 점 설명 문구는 그대로'); }

console.log('[🌳 나무 그네 · 🪑 나무 벤치]');
{ const sw = new Set(), arch = new Set();
  for (let i = 0; i < 30; i++) {
    const s = fresh('b-sw-' + i); put(s, 'swing', 10, 10); s.visitors.call = 'hedgehog';
    E.visitorTick(s, calAt(s, 50), quiet); sw.add(s.visitors.now[0].left);
    const a = fresh('b-sw-' + i); put(a, 'arch', 10, 10); a.visitors.call = 'tit';   // 그네가 아닌 아치 옆
    E.visitorTick(a, calAt(a, 50), quiet); arch.add(a.visitors.now[0].left);
  }
  check([...sw].sort().join() === '3,4' && [...arch].sort().join() === '2,3', `그네 옆에 앉은 손님은 3 ~ 4달 (2 ~ 3달 + 1) · 아치 옆은 그대로 2 ~ 3달`); }
{ const s = fresh('b-sw-far'); put(s, 'swing', 2, 2); put(s, 'bench', 15, 15); E.shopOf(s).seats = 2; flower(s, 'rose', 15, 17, { waterH: 99 });
  s.visitors.call = 'cat'; E.visitorTick(s, calAt(s, 70), quiet);
  const v = s.visitors.now[0];
  check(v && Math.max(Math.abs(v.x - 15), Math.abs(v.y - 15)) === 1, '🐈 길고양이(조건 장식 없음)는 벤치 옆을 먼저');
  check(v && (v.left === 2 || v.left === 3), '그네 옆이 아닌 자리엔 그대로 2 ~ 3달');
  check(E.visitorsOf(s)[0].where === '볕 드는 자리', '길고양이는 장식 · 꽃 옆 어디든이라 "볕 드는 자리" 그대로'); }
{ const s = fresh('b-bench-fly'); put(s, 'bench', 15, 15); for (let i = 0; i < 10; i++) flower(s, 'chamomile', 1 + i * 2, 2, { waterH: 99 });
  s.visitors.call = 'butterfly'; E.visitorTick(s, calAt(s, 70), quiet);
  const v = s.visitors.now[0];
  check(v && Math.max(Math.abs(v.x - 15), Math.abs(v.y - 15)) === 1 && s.log.some(l => l.text === '🦋 나비 언니가 나무 벤치 옆에 앉았어요') && E.visitorsOf(s)[0].where === '나무 벤치 옆', '🦋 나비 언니(조건이 꽃): 벤치 옆을 먼저 · "나무 벤치 옆에 앉았어요"'); }
{ const s = fresh('b-bench-cond'); put(s, 'bench', 8, 8);
  check(E.VISITOR_KEYS.every(k => !E.visitorOk(s, k)), '벤치만으론 아무도 안 옴 (손님 조건 그대로)');
  const w = fresh('b-bench-hog'); put(w, 'swing', 2, 2); put(w, 'bench', 15, 15);
  const cells = E.visitorCells(w, 'hedgehog');
  check(cells.some(c => Math.max(Math.abs(c[0] - 2), Math.abs(c[1] - 2)) === 1) && cells.some(c => Math.max(Math.abs(c[0] - 15), Math.abs(c[1] - 15)) === 1) && cells.length === 8 + 8, '🦔 조건 장식 손님: 그네 옆 + 벤치 옆 (둘 다 자리)');
  const n = fresh('b-bench-none'); put(n, 'swing', 2, 2);
  check(E.visitorCells(n, 'hedgehog').length === 8, '벤치가 없으면 그대로');
  const st2 = fresh('b-bench-store'); put(st2, 'swing', 2, 2); st2.decos.push({ id: 1, key: 'bench', x: null, y: null });
  check(E.visitorCells(st2, 'hedgehog').length === 8, '창고에 있는 벤치는 자리가 아님');
  const two = fresh('b-bench-two'); put(two, 'swing', 2, 2); put(two, 'bench', 15, 15); put(two, 'bench', 16, 15);
  const c2 = E.visitorCells(two, 'hedgehog'), ids = c2.map(c => c[1] * E.W + c[0]);
  check(new Set(ids).size === ids.length, '벤치 둘이어도 같은 칸은 한 번'); }
{ const s = fresh('b-money'); put(s, 'swing', 10, 10); put(s, 'bench', 4, 4); s.visitors.call = 'hedgehog';
  const m0 = s.money, xp0 = s.grade.xp; E.visitorTick(s, calAt(s, 90), quiet);
  check(s.money === m0 && s.grade.xp === xp0, '손님이 와도 돈 · 경험치 그대로'); }

console.log('[새 철 뒤 꺼짐 · 저장 필드]');
{ const REST = 12 * 12 * H + H, all13 = st => { for (const k of E.FLOWER_KEYS) st.dex.flower[k] = true; };
  const s = fresh('b-season'); s.money = 200000;
  for (const k of ['bench', 'basin', 'chime', 'sundial', 'swing']) put(s, k, 3 + Object.keys(E.DECO_BUFF).indexOf(k) * 2, 3);
  check(E.catchUpWeeks(s) === 4 && E.decoBuff(s).chime, '놓은 정원: 해시계 · 풍경 켜짐');
  const bare = fresh('b-season'); bare.money = 200000; flower(s, 'rose', 4, 4, { waterH: 0 }); flower(bare, 'rose', 4, 4, { waterH: 0 });
  all13(s); all13(bare); E.advance(s, mon + 2 * WEEK + REST, quiet); E.advance(bare, mon + 2 * WEEK + REST, quiet);
  check(keysOf(s) === keysOf(bare) && Object.keys(s.stats).filter(k => !(k in bare.stats)).join() === 'basinWater', '저장 필드 새로 없음 (st 키가 장식 없는 정원과 같음 · stats.basinWater만 더함)');
  const r = E.seasonStart(s, quiet);
  const b = E.decoBuff(s);
  check(r.ok && !b.bench.length && !b.basin.length && !b.chime && !b.sundial && !b.swing.length && E.catchUpWeeks(s) === 3, '새 철: 장식이 창고로 가서 다섯 효과 모두 꺼짐'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
