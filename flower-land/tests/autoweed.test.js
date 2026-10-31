// P39-08 🐞 무당벌레 (10-31): 예전 P30-02 🌿 숲 바람(4층이 열리면 저절로 잡초 3포기)을 없애고 놓는 곤충으로 — 둘레 r칸 꽃의 잡초를 달 끝마다 치움
// 4층이 열리면 무당벌레 한 마리를 선물로 창고에 (P39-08-02) · 호미 · 비료 덤(weedCount) · 주간 목표 · 경험치는 손으로 한 일만 (P28-10) · 느긋하게 보기면 일지에 숫자 없이 (P30-08)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const monthEnd = st => E.advance(st, E.calendar(st.virtual).slotEnd + 0.2 * H, ctx);
const garden = pred => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'autoweed-test'; st.onboarded = true; st.money = 1e6; E.weeklyOf(st); return st; };

console.log('[4층이 열려도 저절로 치우지 않음 — 숲 바람은 없앰]');
{
  const st = garden(c => c.month === 6 && !c.frozen); st.layers.at[4] = 0; st.dex.tea.chamomile = 1; st.stats.dug = 1;
  const f = fl(st, 'chamomile', 2, 2, { weedH: 0 });
  check(E.forestOpen(st) && typeof E.forestWeedOf === 'undefined' && typeof E.forestWeedTick === 'undefined', '4층 정원 · forestWeedTick · forestWeedOf 없음');
  monthEnd(st);
  check(f.weedH === 0 && !(st.stats.autoWeed > 0), '무당벌레를 놓지 않으면 잡초 그대로');
}

console.log('[🐞 데려오기 · 둘레 1칸 꽃의 잡초 (P39-08-01)]');
{
  const st = garden(c => c.month === 6 && !c.frozen);
  check(E.DECOS.ladybug.insect && E.DECOS.ladybug.need === 3 && E.DECOS.ladybug.price === 12000 && E.DECOS.ladybug.one, '등급 3 · 12,000원 · 하나만');
  check(!E.buyDeco(st, 'ladybug', ctx).ok, '등급 3 전엔 못 데려옴');
  st.grade.xp = E.gradeXpAt(3);
  const d = E.buyDeco(st, 'ladybug', ctx).deco; E.placeDeco(st, d.id, 5, 5);
  const near = [fl(st, 'chamomile', 4, 4, { weedH: 0 }), fl(st, 'rose', 6, 6, { weedH: 5 })], far = fl(st, 'lavender', 7, 5, { weedH: 0 }), fresh = fl(st, 'lavender', 5, 6, { weedH: 30 });
  const hoe0 = st.hoe, fert0 = st.fert, wc0 = st.weedCount, xp0 = st.grade.xp, wk0 = JSON.stringify(st.weekly.goals.map(g => g.got)), before = E.autoStats(st);
  const twin = garden(c => c.month === 6 && !c.frozen); twin.grade.xp = xp0; fl(twin, 'chamomile', 4, 4, { weedH: 0 });
  monthEnd(st); monthEnd(twin);
  check(near.every(f => f.weedH > 23) && far.weedH === 0, '둘레 1칸 꽃만 · 2칸 떨어진 꽃은 그대로');
  check(fresh.weedH > 17 && fresh.weedH <= 30, '아직 한 달 넘게 남은 꽃은 건너뜀');
  check(st.hoe === hoe0 && st.weedCount === wc0 && st.fert === fert0, '호미 안 씀 · 비료 덤 없음');
  check(JSON.stringify(st.weekly.goals.map(g => g.got)) === wk0 && st.grade.xp === twin.grade.xp, '주간 목표 · 경험치 그대로 (무당벌레 없는 정원과 같음)');
  check(st.stats.autoWeed === 2, '한 일 2포기 (stats.autoWeed)');
  const line = st.log.find(l => l.text === '무당벌레가 꽃 2포기의 잡초를 치웠어요');
  check(line && line.type === 20 && E.isAutoLine(line.text), '일지 한 줄 (type 20 🐝) · 자동 줄로 묶임');
  check(E.autoAwayLines(st, before).join() === '무당벌레가 꽃 2포기의 잡초를 치웠어요', '자리를 비운 동안 한 줄');
  st.bonus.weed = 1; far.weedH = 0;
  monthEnd(st);
  check(far.weedH > 23 && E.insectR(st, 'ladybug') === 2, '🌼 기르면 둘레 2칸');
}

console.log('[꽃잠 · 창고 · 느긋하게 보기]');
{
  const sl = garden(c => c.month === 13); sl.decos.push({ id: 1, key: 'ladybug', x: 2, y: 2 }); const g = fl(sl, 'chamomile', 2, 3, { weedH: 0 });
  monthEnd(sl);
  check(g.weedH === 0, '꽃잠 달이 끝날 땐 쉼');
  const sto = garden(c => c.month === 6 && !c.frozen); sto.decos.push({ id: 1, key: 'ladybug', x: null, y: null }); const h = fl(sto, 'chamomile', 0, 0, { weedH: 0 });
  monthEnd(sto);
  check(h.weedH === 0, '창고의 무당벌레는 쉼');
  const sv = garden(c => c.month === 6 && !c.frozen); sv.settings.slow = true; sv.decos.push({ id: 1, key: 'ladybug', x: 2, y: 2 }); fl(sv, 'chamomile', 2, 3, { weedH: 0 });
  monthEnd(sv);
  check(sv.log.some(l => l.text === '무당벌레가 잡초를 치웠어요') && !sv.log.some(l => l.text.startsWith('무당벌레') && /\d/.test(l.text)), '🐢 느긋하게 보기면 일지에 숫자 없이');
}

console.log('[4층이 열리면 선물 한 마리 (P39-08-02)]');
{
  const st = garden(c => c.month === 6 && !c.frozen);
  const d = E.ladybugGift(st, ctx);
  check(d && d.x == null && st.decos.filter(x => x.key === 'ladybug').length === 1 && st.dex.deco.ladybug, '창고에 한 마리 · 꾸밈 도감에도');
  check(st.log.some(l => l.type === 19 && l.text === '🐞 숲에서 무당벌레가 왔어요 · 📦 창고에 있어요'), '일지 한 줄 (📮 편지함 소식 🐞)');
  check(E.ladybugGift(st, ctx) === null && st.decos.filter(x => x.key === 'ladybug').length === 1, '이미 있으면 더 주지 않음');
  const K = E.newsKind({ type: 19, text: '🐞 숲에서 무당벌레가 왔어요 · 📦 창고에 있어요' });
  check(K && K[0] === 'wind', '소식으로 보임');
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
