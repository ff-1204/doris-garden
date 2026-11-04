// P44 ⛏️ 광산 공방: 정원에 놓는 12가지(P58부터 9가지 — 🌸 이달의 장식 셋은 화원으로만)를 재료 또는 💰 돈으로 · 새 효과 여섯(👣 징검돌 · 💧 돌 물확 · 🏮 석등 · ⛏️ 화석 진열장 · 💎 호박 등 · 🌰 옛 씨앗 화분)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, M = E.MONTH_H;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const fl = (st, type, x, y) => { const f = { id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'young', withered: false, ageH: 1, waterH: 0, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }; st.flowers.push(f); return f; };
const garden = () => { const s = E.create(at(c => c.month === 3 && !c.frozen), () => 0.5); s.gardenId = 'p44'; s.money = 1e6; return s; };
const put = (s, key, x, y) => { const d = E.addDeco(s, key); E.placeDeco(s, d.id, x, y); return d; };

console.log('[공방 표 · 재료 또는 돈]');
check(E.WORKSHOP_KEYS.length === 11 && E.MONTH_DECO_KEYS.every(k => !E.WORKSHOP[k] && !E.CRAFTS[k]) && E.WORKSHOP_KEYS.every(k => E.CRAFTS[k] && (E.CRAFTS[k].deco ? E.DECOS[E.CRAFTS[k].deco] : E.CRAFTS[k].item === 'jar')), '11가지(P72-02 ⚙️ 자동 건조기 · P73-02 🧱 돌담 더함) 모두 재료(CRAFTS)와 값이 있음 · 🌸 이달의 장식(징검돌 · 돌 물확 · 석등)은 공방에 없음 (P58)');
check(['fert', 'hoe', 'shears', 'cheongja', 'buncheong', 'kkot'].every(k => E.CRAFTS[k] && !E.WORKSHOP[k]), '비료 · 호미 · 가위 · 찻잔 3은 공방 밖 (재료 만들기)');
{ const s = garden(), m0 = s.money, r = E.workshopBuy(s, 'fossilcase');
  check(r.ok && s.money === m0 - 25000 && s.decos.some(d => d.key === 'fossilcase' && d.x == null) && s.dex.deco.fossilcase, '💰 화석 진열장 25,000원 → 창고 · 꾸밈 도감');
  const j0 = s.jar || 0, rj = E.workshopBuy(s, 'jar');
  check(rj.ok && s.jar === j0 + 1 && s.money === m0 - 33000, '💰 유리 관 8,000원 → 용품 하나');
  s.money = 100; check(!E.workshopBuy(s, 'oldpot').ok && s.money === 100, '돈이 모자라면 못 삼');
  check(!E.workshopBuy(s, 'fert').ok && !E.workshopBuy(s, 'nope').ok && !E.workshopBuy(s, 'stepstone').ok, '공방 밖 · 없는 것은 거절'); }
{ const s = garden(); E.mineOf(s).bag = { dirt: 20, stone: 5 };
  const r = E.craft(s, 'heatmat');
  check(r.ok && s.decos.some(d => d.key === 'heatmat') && s.mine.bag.dirt === 0 && s.mine.bag.stone === 0, '재료로 온상 매트 (흙 20 · 돌 5)'); }
{ const s = garden(); s.grade.xp = 0; E.mineOf(s).bag = { stone: 50, dirt: 50 };
  check(E.gradeOf(s).grade < 4 && !E.craft(s, 'dryshelf').ok && !E.workshopBuy(s, 'dryshelf').ok && s.mine.bag.stone === 50, '건조 선반은 정원 등급 4부터 (재료 · 돈 둘 다, 재료는 그대로)');
  s.grade.xp = E.gradeXpAt(6); E.mineOf(s).bag = { quartz: 20, feldspar: 10, stone: 60 };
  check(E.workshopBuy(s, 'greenhouse').ok && !E.craft(s, 'greenhouse').ok && s.mine.bag.stone === 60 && !E.workshopBuy(s, 'greenhouse').ok, '유리 온실은 하나만 (재료로도)'); }

console.log('[👣 징검돌 — 둘레 1칸 꽃은 땅이 안 맞아도 품질이 떨어지지 않음]');
{ const s = garden(); const a = fl(s, 'rose', 5, 5), b = fl(s, 'rose', 9, 5);
  for (const t of s.tiles) { t.t = -20; t.m = -20; }   // 땅이 전혀 안 맞음 (기운 20%)
  const d = put(s, 'stepstone', 6, 5);
  check(E.monthlyChange(s, a).neg === 0 && E.monthlyChange(s, b).neg === 3, '둘레는 −3% 없음 · 2칸 밖은 그대로');
  E.storeDeco(s, d.id); check(E.monthlyChange(s, a).neg === 3, '창고에 두면 쉼'); }

console.log('[💧 돌 물확 — 둘레 1칸 꽃은 물이 반 달 더]');
{ const s = garden(); s.water = 10; const a = fl(s, 'rose', 5, 5), b = fl(s, 'rose', 9, 5); put(s, 'basin', 5, 6);
  E.care(s, 'water', [[5, 5], [9, 5]]);
  check(a.waterH === 2.5 * M && b.waterH === 2 * M, `손으로 준 물: 둘레 2달 반 · 밖 2달`);
  put(s, 'barrel', 4, 5); a.waterH = 0; b.waterH = 0; E.insectCareTick(s, 'barrel');
  check(a.waterH === 2.5 * M, '🐌 달팽이가 준 물도 2달 반'); }

console.log('[🏮 석등 — 꽃잠 달 끝에 둘레 2칸 꽃 품질 +1%]');
{ const s = garden(); const a = fl(s, 'rose', 5, 5), b = fl(s, 'rose', 10, 5), w = fl(s, 'rose', 6, 6); w.withered = true; put(s, 'stonelamp', 7, 5);
  check(E.lampTick(s) === 1 && Math.abs(a.q - 0.71) < 1e-9 && b.q === 0.7 && w.q === 0.7, '2칸 안 꽃만 +1% (3칸 밖 · 시든 꽃은 그대로)');
  a.q = 0.995; E.lampTick(s); check(a.q === 1, '100%까지');
  const s2 = E.create(at(c => c.month === 13), () => 0.5); s2.gardenId = 'p44';
  const f2 = fl(s2, 'rose', 5, 5); f2.waterH = 99; put(s2, 'stonelamp', 5, 7);
  let t = s2.virtual; for (let i = 0; i < 200 && E.calendar(t).frozen; i++) t += H / 4;
  const qIn = f2.q; E.advance(s2, t);
  check(!E.calendar(t).frozen && f2.q - qIn > 0.019 && f2.q - qIn < 0.021, `꽃잠 두 달 동안 +2% (${E.pct(qIn)}% → ${E.pct(f2.q)}%)`); }

console.log('[⛏️ 화석 진열장 — 광산 기력 최대 +3]');
{ const s = garden(); const m = E.mineOf(s);
  check(E.mineMaxE(s) === 15, '없으면 15'); const d = put(s, 'fossilcase', 0, 0); put(s, 'fossilcase', 1, 0);
  check(E.mineMaxE(s) === 18, '놓으면 18 (둘이어도 한 번)');
  m.energy = 15; E.advance(s, s.virtual + 3.5 * H / 60);
  check(m.energy === 18, '기력이 18까지 참');
  s.decos.forEach(x => E.storeDeco(s, x.id)); E.advance(s, s.virtual + H);
  check(E.mineMaxE(s) === 15 && m.energy === 18, '창고에 넣으면 최대 15 · 이미 찬 기력은 그대로'); }

console.log('[💎 호박 등 — 보석 확률 +1%]');
{ const count = lamp => { const s = garden(); if (lamp) { put(s, 'amberlamp', 0, 0); put(s, 'amberlamp', 1, 0); } const m = E.mineOf(s); let n = 0, all = 0;
    for (let b = 0; b < 1200; b++) { m.board.cells.forEach(c => { c.dug = true; }); E.freshBoard(s); all += m.board.cells.length; n += m.board.cells.filter(c => c.k === 'jewel').length; } return n / all; };
  const p0 = count(false), p1 = count(true);
  check(E.jewelP(garden()) === 0.05 && p1 - p0 > 0.006 && p1 - p0 < 0.014, `5% → 6% (둘이어도 한 번 · 30,000칸에서 ${(p0 * 100).toFixed(2)}% → ${(p1 * 100).toFixed(2)}%)`); }

console.log('[🌰 옛 씨앗 화분 — 💐 화원 씨앗 처음 품질 +5%]');
{ const s = garden(), q0 = E.seedQ(s); put(s, 'oldpot', 0, 0); put(s, 'oldpot', 1, 0);
  check(E.seedQ(s) === Math.round((q0 + 0.05) * 100) / 100, `${E.pct(q0)}% → ${E.pct(E.seedQ(s))}% (둘이어도 한 번)`);
  const n0 = s.items.length; E.buy(s, 'chamomile', 1); check(s.items[s.items.length - 1].q === E.seedQ(s) && s.items.length === n0 + 1, '화원에서 산 씨앗이 그 품질로');
  s.grade.xp = E.gradeXpAt(30); check(E.seedQ(s) === 1, '100%까지'); }

console.log('[장식 카드 한 줄]');
{ const s = garden();
  check(E.decoBuffLine(s, 'fossilcase') === '⛏️ 광산 기력 최대 +3' && E.decoBuffLine(s, 'stepstone').startsWith('🌸 3월 꽃을') && E.decoBuffLine(s, 'stepstone').includes('👣'), '효과 한 줄 · 이달의 장식 줄이 있으면 이어서');
  s.settings.slow = true;
  check(Object.keys(E.WORKSHOP_BUFF).every(k => !/\d/.test(E.WORKSHOP_BUFF[k].plain)) && E.decoBuffLine(s, 'oldpot') === E.WORKSHOP_BUFF.oldpot.plain, '🐢 느긋하게 보기면 숫자 없이'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
