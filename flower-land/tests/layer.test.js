// 🌳 정원의 층 (P30-01-01, L1-1 10-30): 층 표 · 1→2→3층 조건 · 4층 남은 해(8해) · 꽃 13종 · 비운 동안에도 셈 · 새해 3월 아침에만 · 한꺼번에 안 열림 · 새 철에 이어짐 · LAYER_MAX_OPEN
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, WEEK = 7 * 24 * H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const REST = 12 * 12 * H + H;   // 월요일 06시 + 144시간 = 일요일 06시 쉼달 (+1시간)
const all13 = st => { for (const k of E.FLOWER_KEYS) st.dex.flower[k] = true; };
const rows = (st, n) => { st.yearLog = Array.from({ length: n }, (_, i) => ({ year: i + 1, season: 1, score: 1 })); };

console.log('[층 표]');
check(E.LAYERS[1].name === '꽃밭' && E.LAYERS[2].name === '찻집' && E.LAYERS[3].name === '광산과 벌통' && E.LAYERS[4].name === '작은 숲', '1 🌱 꽃밭 · 2 🍵 찻집 · 3 ⛏️ 광산과 벌통 · 4 🌳 작은 숲');
check(E.LAYERS[4].years === 8 && E.LAYERS[4].dex === true && E.LAYERS[5] && E.LAYERS[5].name === null, '4층은 3층 뒤 8해 + 꽃 도감 · 5층은 자리만 (이름 없음)');
check(E.LAYER_MAX_OPEN === 3, 'LAYER_MAX_OPEN = 3 — 숲 탭(L3) 전까지 4층은 열리지 않음');

console.log('[1 → 2 → 3층: 이미 있는 찻집 · 광산을 층으로]');
const st = E.create(mon + 0.1 * H, () => 0.5); st.gardenId = 'layer-1';
let o = E.layerOf(st);
check(o.layer === 1 && o.name === '꽃밭' && o.icon === '🌱' && o.next.layer === 2 && o.next.how === '찻집에서 첫 찻잔을 팔면', '새 정원은 1층 · 다음은 찻집 (첫 찻잔을 팔면)');
check(o.layers.length === 4 && o.layers[0].open && !o.layers[1].open, '칩 줄은 1~4층 (5층 자리는 안 보임)');
{ const mineFirst = copy(st); mineFirst.stats.dug = 3;
  check(E.layerOf(mineFirst).layer === 1, '광산을 먼저 파도 찻집 전엔 1층 (차례대로)'); }
st.dex.tea.chamomile = 1;
check(E.layerOf(st).layer === 2 && E.layerOf(st).next.how === '광산에서 처음 파면', '첫 찻잔을 팔면 2층 · 다음은 광산');
st.stats.dug = 1;
o = E.layerOf(st);
check(o.layer === 3 && o.name === '광산과 벌통' && o.next.layer === 4 && o.next.needYears === 8 && o.next.yearsLeft === 8 && o.next.needDex === 13 && !o.next.dexOk, '처음 파면 3층 · 4층까지 8해 · 꽃 도감 13종');
check(st.layers.at[3] == null, '연 해는 다음 달이 바뀔 때 적음 (그 전엔 지금 해부터 셈)');
E.advance(st, mon + 13 * H, ctx);
check(st.layers.at[2] === 0 && st.layers.at[3] === 0, '달이 바뀌자 2 · 3층 연 해 = 지금 해 수(0)');

console.log('[4층 남은 해 · 13종 (13 노을재 13-2)]');
E.advance(st, mon + 6 * WEEK + REST, ctx);
o = E.layerOf(st);
check(E.yearLogOf(st).length === 7 && o.next.yearsLeft === 1, '7해가 흐르면 1해 더');
all13(st); o = E.layerOf(st);
check(o.next.dex === 13 && o.next.dexOk && !o.next.ready, '꽃 도감 13 / 13 ✔ · 해가 남아 아직');
{ const j = copy(st); rows(j, 6); const v = E.layerOf(j);
  check(v.layer === 3 && v.next.yearsLeft === 2 && v.next.dexOk, '13-2 여정: 지금 3층 · "2해 더 · 꽃 도감 13/13 ✔"'); }
{ const twelve = copy(st); delete twelve.dex.flower.napmae; rows(twelve, 20);
  const v = E.layerOf(twelve);
  check(v.next.yearsLeft === 0 && v.next.dex === 12 && !v.next.dexOk && !v.next.ready, '해가 차도 12종이면 아직'); }

console.log('[비운 동안에도 셈 (17 문태경 17-5)]');
{ const away = E.create(mon + 0.1 * H, () => 0.5); away.gardenId = 'layer-2'; away.dex.tea.rose = 1; away.stats.dug = 1;
  E.advance(away, mon + 13 * H, ctx);
  const before = E.layerOf(away).next.yearsLeft;
  E.advance(away, mon + 6 * WEEK + REST, ctx);   // 한 번에 7해를 따라잡음 (열지 않고 비운 동안)
  const v = E.layerOf(away);
  check(before === 8 && v.next.yearsLeft === 1 && E.yearLogOf(away).length === 7, '쉬는 동안 흐른 7해가 쌓여 4층까지 1해만 남음 (켜 둘 필요 없음)'); }

console.log('[LAYER_MAX_OPEN: 조건이 차도 4층은 아직 안 열림]');
E.advance(st, mon + 7 * WEEK + REST, ctx);
o = E.layerOf(st);
check(o.next.ready && o.next.held && o.next.yearsLeft === 0, '8해 + 13종: 조건은 참 · 열 수 없는 층 (held)');
E.advance(st, mon + 8 * WEEK + 2 * H, ctx);
check(E.layerOf(st).layer === 3 && st.layers.at[4] == null && !st.log.some(l => l.text.includes('작은 숲')), '새해 3월 아침이 지나도 3층 그대로 · 일지 줄 없음');

console.log('[새해 3월 아침에만 열림 (ctx.layerMax 4 — L3에서 켤 자리)]');
{ const evs = [], lc = { live: false, rng: () => 0.5, layerMax: 4, onLayer: e => evs.push(e) };
  const g = E.create(mon + 0.1 * H, () => 0.5); g.gardenId = 'layer-3'; g.dex.tea.rose = 1; g.stats.dug = 1;
  E.advance(g, mon + 13 * H, lc);
  E.advance(g, mon + 7 * WEEK + 50 * H, lc);   // 8해째 수요일 — 8해(기록 7줄)는 아직
  check(E.yearLogOf(g).length === 7 && E.layerOf(g, 4).next.yearsLeft === 1, '7줄 · 1해 더');
  all13(g);
  E.advance(g, mon + 7 * WEEK + REST, lc);      // 8해째 쉼달 기록 → 조건이 참
  check(E.yearLogOf(g).length === 8 && E.layerOf(g, 4).next.ready && E.layerOf(g, 4).layer === 3 && !evs.length, '쉼달 기록으로 조건이 차도 꽃잠 가운데엔 안 열림');
  E.advance(g, mon + 7 * WEEK + REST + 12 * H, lc);   // 꽃샘달
  check(E.layerOf(g, 4).layer === 3 && !evs.length, '꽃샘달에도 안 열림');
  E.advance(g, mon + 8 * WEEK + 0.5 * H, lc);   // 새해 3월 아침 (월요일 6시)
  check(E.layerOf(g, 4).layer === 4 && g.layers.at[4] === 8 && evs.length === 1 && evs[0].layer === 4 && evs[0].name === '작은 숲', '새해 3월 아침에 4층 · 연 해 8 · onLayer 이벤트 한 번');
  const line = g.log.find(l => l.text === '🌳 정원 뒤에 작은 숲이 생겼어요');
  check(!!line && line.type === 9 && line.m === 3, '일지 한 줄 "🌳 정원 뒤에 작은 숲이 생겼어요" (3월, 알림은 화면이 onLayer로)');
  check(E.layerOf(g, 4).next === null, '5층은 자리만이라 다음 층 없음');
  E.advance(g, mon + 9 * WEEK + 0.5 * H, lc);
  check(evs.length === 1 && g.log.filter(l => l.text.includes('작은 숲')).length <= 1, '한 번 열린 층은 다시 열리지 않음');
  const mid = E.create(mon + 0.1 * H, () => 0.5); mid.gardenId = 'layer-4'; mid.dex.tea.rose = 1; mid.stats.dug = 1;
  E.advance(mid, mon + 13 * H, lc); rows(mid, 8); all13(mid);   // 흐르는 달 중간에 조건이 참
  E.advance(mid, mon + 100 * H, lc);
  check(E.layerOf(mid, 4).layer === 3, '흐르는 달 중간(목요일)엔 안 열림 — 다음 새해 3월 아침까지 기다림');
  E.advance(mid, mon + WEEK + 0.5 * H, lc);
  check(E.layerOf(mid, 4).layer === 4, '그다음 월요일 3월 아침에 열림'); }

console.log('[한꺼번에 안 열림 (예전 정원)]');
{ const old = copy(st); delete old.layers; old.mig = E.MIGRATIONS.length - 1; rows(old, 40);
  const om = E.migrateSave(old), lc = { live: false, rng: () => 0.5, layerMax: 4 };
  check(om.layers.at[2] === 40 && om.layers.at[3] === 40 && E.layerOf(om, 4).next.yearsLeft === 8, '40해 된 정원: 업데이트한 해가 3층 연 해 → 8해 더');
  E.advance(om, om.virtual + WEEK, lc);
  check(E.layerOf(om, 4).layer === 3, '업데이트한 다음 새해에도 4층이 바로 열리지 않음'); }

console.log('[새 철에 이어짐]');
{ const s = E.create(mon + 0.1 * H, () => 0.5); s.gardenId = 'layer-5'; s.onboarded = true; s.dex.tea.rose = 1; s.stats.dug = 1;
  E.advance(s, mon + 13 * H, ctx);
  E.advance(s, mon + 2 * WEEK + REST, ctx); all13(s);
  check(E.seasonStart(s, ctx).ok && s.season.n === 2, '3해 뒤 새 철 시작');
  const v = E.layerOf(s);
  check(E.SEASON_KEEP.includes('layers') && s.layers.at[3] === 0 && v.layer === 3 && v.next.yearsLeft === 5, '새 철에도 3층 · 연 해 그대로 · 남은 해는 누적 해로 (5해 더)');
  E.advance(s, mon + 3 * WEEK + REST, ctx);
  check(E.seasonRows(s).length === 1 && E.yearLogOf(s).length === 4 && E.layerOf(s).next.yearsLeft === 4, '2철 1해: 철 줄은 1이지만 누적 4해 → 4해 더'); }

console.log('[돈 · 수입 없음]');
{ const a = E.create(mon + 0.1 * H, () => 0.5), b = copy(a); a.gardenId = b.gardenId = 'layer-6';
  delete b.layers;
  E.advance(a, mon + 2 * WEEK, ctx); E.advance(b, mon + 2 * WEEK, ctx);
  check(a.money === b.money, '층 기록이 있든 없든 같은 돈'); }

console.log('[저장 · 다시 열기]');
{ const sv = E.makeSave(st, st.virtual), back = E.parseSave(JSON.stringify(sv)), mg = back.ok && E.migrateSave(back.data.game);
  check(mg && JSON.stringify(mg.layers) === JSON.stringify(st.layers) && E.layerOf(mg).layer === 3, '저장 파일로 다시 열어도 그대로'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
