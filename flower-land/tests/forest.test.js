// 🌳 작은 숲 (P30-03, L3-1 10-30): 나무 6가지 × 4단계 · 해마다 한 단계(새해 3월 아침) · 꽃잠에도 · 큰 나무에서 멈춤 · 비운 동안도 자람 · 죽지 않음 · 수입 0 · 묘목 값만 나감
//   숲 도감(dexTotal · 등급 경험치에 안 들어감) · 새 철에 이어짐 · 큰 나무 손님 (P30-06) · 여정 13-3 · 13-4 · 13-7 · 16-2
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, WEEK = 7 * 24 * H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const REST = 12 * 12 * H + H;   // 월요일 06시 + 144시간 = 일요일 06시 쉼달 (+1시간)
const all13 = st => { for (const k of E.FLOWER_KEYS) st.dex.flower[k] = true; };
// 4층까지 연 정원 (3층 연 해 0 · 4층 연 해 0)
const forestGarden = id => { const g = E.create(mon + 0.1 * H, () => 0.5); g.gardenId = id; g.onboarded = true; g.dex.tea.rose = 1; g.stats.dug = 1; g.layers.at = { 2: 0, 3: 0, 4: 0 }; g.money = 100000; return g; };
const stageOf = (g, i) => g.forest.trees[i] && g.forest.trees[i].stage;

console.log('[나무 표]');
check(E.TREE_KEYS.length === 6 && E.TREE_KEYS.map(k => E.TREES[k].name).join(' ') === '벚나무 은행나무 단풍나무 소나무 감나무 자작나무', '나무 6가지 (벚나무 · 은행나무 · 단풍나무 · 소나무 · 감나무 · 자작나무)');
check(E.TREE_KEYS.every(k => E.TREES[k].price >= 2000 && E.TREES[k].price <= 6000) && new Set(E.TREE_KEYS.map(k => E.TREES[k].price)).size === 6, '묘목 값 2,000~6,000원 · 종마다 다름');
check(E.TREE_KEYS.every(k => !E.FLOWERS[k]) && E.TREE_STAGES.join(' · ') === '묘목 · 어린나무 · 나무 · 큰 나무' && E.FOREST_N === 6, '꽃 키와 겹치지 않음 · 4단계 · 자리 6칸');
{ const s = E.create(mon + 0.1 * H, () => 0.5);
  check(s.forest && s.forest.trees.length === 6 && s.forest.trees.every(t => t === null) && E.SEASON_KEEP.includes('forest'), '새 정원: 빈 숲 6칸 · SEASON_KEEP에 forest'); }

console.log('[4층 전엔 못 심음]');
{ const s = E.create(mon + 0.1 * H, () => 0.5); s.dex.tea.rose = 1; s.stats.dug = 1;
  const r = E.plantTree(s, 'pine', 0);
  check(!r.ok && !E.forestOpen(s) && s.money === 15000 && s.forest.trees[0] === null, '3층 정원: "4층이 열리면" · 돈 그대로'); }

console.log('[심기 — 묘목 값만 나감]');
const g = forestGarden('forest-1');
{ const m0 = g.money, r = E.plantTree(g, 'pine', 0);
  check(r.ok && g.money === m0 - 2500 && g.forest.trees[0].k === 'pine' && g.forest.trees[0].stage === 0 && g.forest.trees[0].at === 0, '🌲 소나무 묘목 2,500원 · 0단계 · 심은 해 0');
  check(g.forest.dex.pine === 0 && E.forestCount(g) === 1, '숲 도감: 묘목 칸 하나');
  check(!E.plantTree(g, 'cherry', 0).ok && g.money === m0 - 2500, '이미 나무가 있는 자리엔 못 심음 · 돈 그대로');
  check(!E.plantTree(g, 'oak', 1).ok && !E.plantTree(g, 'pine', 6).ok && !E.plantTree(g, 'pine', -1).ok && !E.plantTree(g, '__proto__', 1).ok, '없는 나무 · 없는 자리는 안 됨');
  const poor = copy(g); poor.money = 1999;
  check(!E.plantTree(poor, 'birch', 1).ok && poor.money === 1999, '돈이 모자라면 안 됨');
  const r2 = E.plantTree(g, 'cherry');
  check(r2.ok && r2.slot === 1 && g.forest.trees[1].k === 'cherry', '자리를 안 고르면 첫 빈 자리'); }

console.log('[해마다 한 단계 · 큰 나무에서 멈춤]');
{ const seen = [];
  E.advance(g, mon + REST, ctx);                       // 1해째 쉼달 기록 (꽃잠)
  seen.push(stageOf(g, 0));
  check(E.yearLogOf(g).length === 1 && stageOf(g, 0) === 0, '쉼달 기록 · 꽃잠 동안엔 아직 묘목 (새해 3월 아침에 자람)');
  for (let y = 1; y <= 5; y++) { E.advance(g, mon + y * WEEK + 0.5 * H, ctx); seen.push(stageOf(g, 0)); if (y < 5) E.advance(g, mon + y * WEEK + REST, ctx); }
  check(seen.join(',') === '0,1,2,3,3,3', `새해 3월 아침마다 한 단계: ${seen.join(' → ')}`);
  check(g.forest.dex.pine === 3 && g.forest.dex.cherry === 3 && E.forestCount(g) === 8, '숲 도감: 소나무 · 벚나무 4칸씩 (8 / 24)'); }

console.log('[흐르는 달 중간엔 그대로]');
{ const s = forestGarden('forest-2'); E.plantTree(s, 'maple', 2);
  E.advance(s, mon + 100 * H, ctx);
  check(stageOf(s, 2) === 0, '같은 해 목요일: 묘목 그대로');
  E.advance(s, mon + WEEK + 0.5 * H, ctx);
  check(stageOf(s, 2) === 1, '다음 월요일 3월 아침: 어린나무');
  const late = forestGarden('forest-3'); E.advance(late, mon + REST + H, ctx); const lr = E.plantTree(late, 'birch', 0);   // 꽃잠에 심음 (그해는 이미 기록됨)
  check(lr.ok && lr.sleep && lr.msg.includes('꽃잠에 심어 다음 해 아침부터 자라요'), '꽃잠에 심으면 알림에 "다음 해 아침부터" 한 줄 (검토 10-30)');
  E.advance(late, mon + WEEK + 0.5 * H, ctx);
  check(stageOf(late, 0) === 0, '꽃잠에 심으면 바로 다음 아침엔 그대로 (해가 바뀐 뒤 심어서)');
  E.advance(late, mon + 2 * WEEK + 0.5 * H, ctx);
  check(stageOf(late, 0) === 1, '그다음 해 아침에 어린나무'); }

console.log('[비운 동안 따라잡기에도 자람 · 죽지 않음]');
{ const s = forestGarden('forest-4'); E.plantTree(s, 'ginkgo', 3); E.plantTree(s, 'persimmon', 4);
  E.advance(s, mon + 2 * WEEK + 0.5 * H, ctx);           // 열지 않고 두 해를 한 번에
  check(stageOf(s, 3) === 2 && stageOf(s, 4) === 2, '두 해를 한 번에 따라잡아도 두 단계');
  E.advance(s, mon + 30 * WEEK + 0.5 * H, ctx);          // 오래 비움
  check(stageOf(s, 3) === 3 && stageOf(s, 4) === 3 && s.forest.trees.filter(Boolean).length === 2, '오래 비워도 큰 나무로 남음 (물 · 돌봄 없음, 죽지 않음)'); }

console.log('[수입 0]');
{ const a = forestGarden('forest-5'), b = copy(a);
  E.plantTree(a, 'pine', 0); E.plantTree(a, 'cherry', 1); b.money -= 2500 + 5000;
  E.advance(a, mon + 5 * WEEK + 0.5 * H, ctx); E.advance(b, mon + 5 * WEEK + 0.5 * H, ctx);
  check(a.money === b.money && stageOf(a, 0) === 3, '큰 나무가 있어도 돈은 나무 없는 정원과 같음 (열매 · 수입 없음)');
  check(E.dexCount(a) === E.dexCount(b) && E.dexTotal(a) === E.dexTotal(b) && E.gradeDexCount(a) === E.gradeDexCount(b), '기본 도감 · dexTotal · 등급 경험치 도감 칸 그대로 (P17-14)');
  check(a.grade.xp === b.grade.xp, '등급 경험치 그대로'); }

console.log('[숲 도감 칸]');
{ const d = E.forestDex(g);
  check(d.length === 24 && d.filter(x => x.got).length === 8 && d.find(x => x.key === 'pine' && x.stage === 3).got && !d.find(x => x.key === 'maple' && x.stage === 0).got, '6 × 4 = 24칸 · 자란 단계까지 참');
  const f = E.forestOf(g);
  check(f.open && f.slots[0].big && f.slots[0].stageName === '큰 나무' && f.slots[0].yearsLeft === 0 && f.slots[2] === null && f.empty === 4 && f.dex === 8 && f.total === 24, 'forestOf: 자리 · 단계 이름 · 빈 자리 · 도감 8 / 24'); }

console.log('[새 철에 이어짐]');
{ const s = forestGarden('forest-6'); E.plantTree(s, 'birch', 5); all13(s);
  E.advance(s, mon + 2 * WEEK + REST, ctx);
  const before = copy(s.forest);
  check(E.seasonStart(s, ctx).ok && s.season.n === 2, '3해 뒤 새 철 시작');
  check(JSON.stringify(s.forest) === JSON.stringify(before) && E.forestOpen(s), '새 철에도 나무 · 숲 도감 · 4층 그대로');
  E.advance(s, mon + 3 * WEEK + 0.5 * H, ctx);
  check(stageOf(s, 5) === 3, '새 철 1년차 아침에도 이어서 자람 (큰 나무)'); }

console.log('[큰 나무 손님 (P30-06)]');
{ const s = forestGarden('forest-7'); E.plantTree(s, 'pine', 0);
  check(!E.visitorOk(s, 'rabbit') && !E.visitorOk(s, 'tit'), '큰 나무 전엔 🐇 산토끼 · 🐦 박새(아치 없음) 안 옴');
  E.advance(s, mon + 3 * WEEK + 0.5 * H, ctx);
  check(E.forestBigSlots(s).join() === '0' && E.visitorOk(s, 'rabbit') && E.visitorOk(s, 'tit'), '큰 나무가 자라면 둘 다 올 수 있음');
  s.visitors.now = []; E.visitorCall(s, 'rabbit');
  E.advance(s, mon + 3 * WEEK + 12.5 * H, ctx);
  const v = s.visitors.now.find(x => x.k === 'rabbit');
  check(!!v && v.w === 'forest' && v.x === 0 && v.y === -1, '🐇 산토끼는 숲 큰 나무 자리(w: forest)에 앉음');
  check(!E.visitorsOf(s).some(x => x.key === 'rabbit') && E.forestVisitors(s).some(x => x.key === 'rabbit' && x.slot === 0 && x.where === '큰 나무 아래'), '정원 지도 손님엔 안 나오고 숲 손님으로');
  check(s.log.some(l => l.text === '🐇 산토끼가 🌳 숲 큰 나무 아래에 앉았어요'), '일지 "🐇 산토끼가 🌳 숲 큰 나무 아래에 앉았어요"');
  const cells = E.visitorCells(s, 'tit');
  check(cells.length === 0, '한 그루에 한 손님 (박새는 다른 큰 나무가 있어야)');
  check(E.MEMENTOS.clover && E.MEMENTOS.clover.visitor === 'rabbit' && !E.ORDER_MEMENTO_KEYS.includes('clover'), '기념품 🍀 네잎 클로버 (주문 뽑기엔 안 들어감)'); }

console.log('[저장 · 다시 열기]');
{ const sv = E.makeSave(g, g.virtual), back = E.parseSave(JSON.stringify(sv)), mg = back.ok && E.migrateSave(back.data.game);
  check(mg && JSON.stringify(mg.forest) === JSON.stringify(g.forest), '저장 파일로 다시 열어도 나무 · 도감 그대로'); }

console.log('[DEV 나무 한 해 키우기]');
{ const s = forestGarden('forest-8'); E.plantTree(s, 'cherry', 0);
  E.forestGrowDev(s); check(stageOf(s, 0) === 1, '한 번: 어린나무');
  E.forestGrowDev(s); E.forestGrowDev(s); E.forestGrowDev(s); check(stageOf(s, 0) === 3 && s.forest.dex.cherry === 3 && E.yearLogOf(s).length === 0, '네 번: 큰 나무에서 멈춤 · 해마다 기록은 그대로'); }

console.log('[여정 13-3 · 13-4 · 13-7 · 16-2]');
{ const evs = [], lc = { live: false, rng: () => 0.5, onLayer: e => evs.push(e) };
  const s = E.create(mon + 0.1 * H, () => 0.5); s.gardenId = 'forest-j'; s.onboarded = true; s.dex.tea.rose = 1; s.stats.dug = 1; s.money = 50000;
  E.advance(s, mon + 13 * H, lc); all13(s);
  E.advance(s, mon + 7 * WEEK + REST, lc);
  check(E.layerOf(s).layer === 3 && !evs.length, '8해째 쉼달 기록 · 꽃잠엔 아직 3층');
  E.advance(s, mon + 8 * WEEK + 0.5 * H, lc);
  check(evs.length === 1 && evs[0].layer === 4 && s.log.some(l => l.text === '🌳 정원 뒤에 작은 숲이 생겼어요'), '13-3 새해 3월 아침: "🌳 정원 뒤에 작은 숲이 생겼어요" · onLayer (화면이 숲 탭 · 알림 한 줄)');
  check(!/\d/.test('🌳 정원 뒤에 작은 숲이 생겼어요'), '16-2 열림 한 줄에 숫자 없음');
  const r = E.plantTree(s, 'cherry', 0);
  check(r.ok && E.forestOf(s).slots[0].stageName === '묘목', '13-4 숲 탭에서 첫 묘목을 심음');
  E.advance(s, mon + 8 * WEEK + REST, lc); E.advance(s, mon + 9 * WEEK + 0.5 * H, lc);
  check(E.forestOf(s).slots[0].stageName === '어린나무', '13-7 다음 주에 열자 어린나무'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
