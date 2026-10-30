// P30-02 🌿 앞 층 손일 자동 (L3 묶음 2, 10-30): 4층(🌳 작은 숲)이 열린 정원은 꽃잠이 아닌 달 끝에 잡초 난 꽃을 앞에서 3포기까지 숲 바람이 걷어 감 (사용자 10-30)
// 호미 · 비료 덤(weedCount) · 주간 목표 · 경험치는 손으로 한 일만 (P28-10) · 일지 한 줄 · 자리를 비운 동안 한 줄 · 느긋하게 보기면 숫자 없이 (P30-08)
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: 7000 + st.flowers.length, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const monthEnd = st => E.advance(st, E.calendar(st.virtual).slotEnd + 0.2 * H, ctx);
const layer3 = pred => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'autoweed-test'; st.onboarded = true; st.dex.tea.chamomile = 1; st.stats.dug = 1; E.weeklyOf(st); return st; };
const open4 = st => { st.layers.at[4] = 0; return st; };
const weedy = st => st.flowers.filter(f => !f.withered && f.weedH <= 0);
const plant5 = st => { fl(st, 'chamomile', 2, 2, { weedH: 0 }); fl(st, 'chamomile', 4, 2, { weedH: 0 }); fl(st, 'lavender', 6, 2, { weedH: 0 }); fl(st, 'lavender', 8, 2, { weedH: 0 }); fl(st, 'rose', 10, 2, { weedH: 50 }); fl(st, 'rose', 12, 2, { weedH: 0, withered: true }); };

console.log('[4층 정원: 달 끝에 잡초 난 꽃 3포기까지 (13 노을재 13-5)]');
{
  const st = open4(layer3(c => c.month === 6 && !c.frozen)); plant5(st);
  const twin = layer3(c => c.month === 6 && !c.frozen); plant5(twin);   // 같은 정원 · 3층
  check(E.forestOpen(st) && !E.forestOpen(twin), '4층 연 정원 · 3층 정원');
  const hoe0 = st.hoe, fert0 = st.fert, wc0 = st.weedCount, wk0 = JSON.stringify(st.weekly.goals.map(g => g.got)), before = E.autoStats(st);
  monthEnd(st); monthEnd(twin);
  check(E.FOREST_WEED_N === 3 && weedy(st).length === 1 && st.flowers.slice(0, 4).filter(f => f.weedH > 23).length === 3, '잡초 난 4포기 중 3포기 걷힘 (weedH 24)');
  check(st.flowers[0].weedH > 23 && st.flowers[1].weedH > 23 && st.flowers[2].weedH > 23 && st.flowers[3].weedH <= 0, '꽃 배열 앞에서부터 — 넷째는 다음 달');
  check(st.flowers[4].weedH > 0 && st.flowers[4].weedH < 50 && st.flowers[5].weedH === 0, '잡초 없는 꽃 · 시든 꽃은 그대로');
  check(weedy(twin).length === 4, '3층 정원은 걷히지 않음');
  check(st.hoe === hoe0 && st.hoe === twin.hoe, '호미는 안 씀');
  check(st.weedCount === wc0 && st.fert === fert0 && st.fert === twin.fert, '비료 덤 · weedCount에 안 셈');
  check(JSON.stringify(st.weekly.goals.map(g => g.got)) === wk0 && JSON.stringify(twin.weekly.goals.map(g => g.got)) === wk0, '주간 목표 진행 그대로');
  check(st.grade.xp === twin.grade.xp, '등급 경험치 없음 (3층 정원과 같음)');
  check(st.stats.autoWeed === 3 && E.autoStats(st).autoWeed === 3 && E.autoStats(twin).autoWeed === 0, 'autoStats.autoWeed 3');
  const line = st.log.find(l => l.text === '숲 바람이 잡초 3포기를 걷어 갔어요');
  check(line && line.type === 19 && E.isAutoLine(line.text) && E.autoLineType(line.text) === 19, '일지 한 줄 (type 19 🌿) · 자동 줄로 묶임');
  check(!twin.log.some(l => l.text.startsWith('숲 바람')), '3층 정원 일지엔 없음');
  const away = E.autoAwayLines(st, before);
  check(away.length === 1 && away[0] === '숲 바람이 잡초 3포기를 걷어 갔어요', '자리를 비운 동안 한 줄');
  const w = E.forestWeedOf(st);
  check(w && w.n === 3 && w.text === '🌿 이번 달 숲 바람이 잡초 3포기를 걷어 갔어요', '🌳 숲 탭 머리 한 줄 (이번 달 3포기)');
  check(E.forestWeedOf(twin) === null, '3층 정원은 숲 줄 없음');
  monthEnd(st);
  check(weedy(st).length === 0 && st.stats.autoWeed === 4, '다음 달 끝엔 남은 1포기 (3포기 미만이면 그만큼)');
  const slow = copy(st); slow.settings.slow = true;
  const sw = E.forestWeedOf(slow), sa = E.autoAwayLines(slow, before);
  check(sw.n === null && sw.slow && !/\d/.test(sw.text) && sa[0] === '숲 바람이 잡초를 걷어 갔어요', '🐢 느긋하게 보기: 숲 줄 · 비운 동안 줄에 숫자 없음');
  const st2 = copy(st); for (const f of st2.flowers) f.weedH = 99; monthEnd(st2);
  const later = E.forestWeedOf(st2);
  check(later.n === 0 && later.text === '🌿 숲 바람이 달 끝마다 잡초 세 포기를 걷어 가요', '걷을 잡초가 없던 달엔 숫자 없는 안내 한 줄');
}

console.log('[10포기여도 3포기 · 꽃잠엔 쉼 · 하나만 남으면 그 하나]');
{
  const st = open4(layer3(c => c.month === 6 && !c.frozen)); for (let i = 0; i < 10; i++) fl(st, 'chamomile', 2 + 2 * i, 4, { weedH: 0 });
  monthEnd(st);
  check(weedy(st).length === 7 && st.stats.autoWeed === 3 && st.log.some(l => l.text === '숲 바람이 잡초 3포기를 걷어 갔어요'), '잡초 난 꽃 10포기여도 한 달에 3포기만');
}
{
  const st = open4(layer3(c => c.idx === 12)); fl(st, 'chamomile', 2, 2, { weedH: 0 });
  monthEnd(st);
  check(st.flowers[0].weedH === 0 && !st.stats.autoWeed, '꽃잠 달이 끝날 땐 걷지 않음');
  const one = open4(layer3(c => c.month === 6 && !c.frozen)); fl(one, 'chamomile', 2, 2, { weedH: 0 });
  monthEnd(one);
  check(one.flowers[0].weedH > 23 && one.stats.autoWeed === 1, '잡초 난 꽃이 하나면 그 하나를 걷음');
}

console.log('[저장 · 예전 정원]');
{
  const old = layer3(c => c.month === 6 && !c.frozen); delete old.stats.autoWeed;
  check(E.autoStats(old).autoWeed === 0 && E.autoAwayLines(old, {}).length === 0, 'stats.autoWeed가 없는 예전 정원도 0으로 읽음 (MIGRATIONS 불필요)');
  const st = open4(layer3(c => c.month === 6 && !c.frozen)); plant5(st); monthEnd(st);
  const re = E.parseSave(JSON.stringify(E.makeSave(st)));
  const r = re.ok && re.data.game;
  check(r && r.stats && r.stats.autoWeed === 3, '저장 · 불러오기 뒤에도 셈이 그대로');
}

console.log('[시뮬 기본은 그대로]');
{
  const out = require('child_process').execFileSync(process.execPath, [require('path').join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7'], { encoding: 'utf8' });
  const y4 = out.split('\n')[4].split('\t');
  check(y4[0] === '4' && y4[15] === '22310', `sim-economy 4 7 연말 22,310원 그대로 (${y4[15]})`);
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
