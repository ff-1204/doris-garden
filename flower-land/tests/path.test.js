// 🛤️ 철의 길 (P30-04-01, L2-1 10-30): 길 넷 · 새 철에 고름 · 주간 목표 쪽 · 길 손님 · 길 칭호 · 철마다 표 — 돈 · 수확 · 값 · 경험치는 길마다 같음 (P17-14)
const path = require('path');
const ENGINE = path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js'));
const E = require(ENGINE);
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, WEEK = 7 * 24 * H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o)), same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const REST = 12 * 12 * H + H;   // 일요일 06시 쉼달 (+1시간)

console.log('[길 표]');
check(same(E.PATH_KEYS, ['flower', 'tea', 'earth']) && E.PATH_KEYS.every(k => E.PATHS[k].name && E.PATHS[k].icon && E.PATHS[k].desc && /^#[0-9a-f]{6}$/.test(E.PATHS[k].color) && E.PATHS[k].fams.length), '길 셋(🌸 꽃길 · 🍵 찻길 · ⛏️ 흙길) · 이름 · 아이콘 · 설명 · 테두리 색 · 목표 쪽');
check(E.PATHS.flower.name === '꽃길' && E.PATHS.tea.name === '찻길' && E.PATHS.earth.name === '흙길' && E.PATH_NONE.name === '길 없이', '이름 · 길 없이');
check(E.PATH_KEYS.every(k => E.PATHS[k].fams.every(f => E.WEEKLY_KEYS.some(w => E.WEEKLY[w].fam === f))), '길의 목표 쪽은 모두 있는 주간 목표 fam');
check(new Set(E.PATH_KEYS.map(k => E.PATHS[k].color)).size === 3, '테두리 색이 서로 다름');

// 3해 + 꽃 13종을 채운 꽃잠 정원 (새 철을 시작할 수 있음)
const ready = (() => { const s = E.create(mon + 0.1 * H, () => 0.5); s.gardenId = 'path-1'; s.onboarded = true;
  E.advance(s, mon + 2 * WEEK + REST, ctx); for (const k of E.FLOWER_KEYS) s.dex.flower[k] = true; return s; })();
check(E.seasonCanStart(ready) && E.seasonPath(ready) === null, '(준비) 3해째 꽃잠 · 1철은 길 없이');

console.log('[새 철에 고름 · 저장 (14 탁서진 14-3 · 14-4)]');
const by = {};
for (const p of [null, ...E.PATH_KEYS]) { const s = copy(ready); const r = E.seasonStart(s, Object.assign({}, ctx, { path: p })); by[p || 'none'] = { s, r }; }
check(E.PATH_KEYS.every(k => by[k].r.ok && by[k].s.season.path === k && by[k].r.path === k && E.seasonPath(by[k].s) === k), '고른 길이 새 철 season.path에');
check(by.none.r.ok && by.none.s.season.path === null && E.pathBadge(by.none.s) === null, '안 고르면 길 없이 (null) · 길 표시 없음');
check(by.tea.s.log.some(l => l.text.startsWith('🌸 2철을 시작했어요 · 🍵 찻길로 걸어요')) && !by.none.s.log.some(l => l.text.includes('길로 걸어요')), '일지 "🌸 2철을 시작했어요 · 🍵 찻길로 걸어요" (길 없이는 그 말 없음)');
check(same(E.pathBadge(by.tea.s), { key: 'tea', icon: '🍵', name: '찻길', color: E.PATHS.tea.color, text: '🍵 찻길' }), '지금 길 표시 "🍵 찻길"');
{ const bad = copy(ready); const r = E.seasonStart(bad, Object.assign({}, ctx, { path: 'money' }));
  check(!r.ok && bad.season.n === 1, '없는 길은 거부 · 정원 그대로'); }
check(by.tea.s.season.log[0].path === null, '1철 끝난 줄은 길 없이');
{ const back = E.migrateSave(JSON.parse(JSON.stringify(E.makeSave(by.tea.s, 0).game)));
  check(back && back.season.path === 'tea' && E.seasonPath(back) === 'tea', '저장 · 불러오기 뒤 season.path 그대로'); }
{ const s = copy(by.flower.s); E.advance(s, s.virtual + 3 * WEEK, ctx);
  check(s.season.path === 'flower' && s.season.n === 2, '철 가운데(3주 흘러도) 길은 그대로');
  const mid = copy(by.flower.s); E.advance(mid, mid.virtual + WEEK + 50 * H, ctx);   // 새 철 1년차 한가운데 (흐르는 달)
  const again = E.seasonStart(mid, Object.assign({}, ctx, { path: 'tea' }));
  check(!again.ok && mid.season.path === 'flower' && mid.season.n === 2, '철 가운데 다시 시작해 길을 바꿀 수 없음 (꽃잠 · 조건)'); }

console.log('[돈 · 수확 · 값은 길마다 같음 (P17-14)]');
const base = by.none.s;
check(E.PATH_KEYS.every(k => by[k].s.money === base.money && same(by[k].s.bonus, base.bonus) && by[k].s.grade.xp === base.grade.xp), '시작 돈 · 보너스 · 경험치 같음');
check(E.PATH_KEYS.every(k => E.bonusVal(by[k].s, 'basket') === E.bonusVal(base, 'basket') && E.catchUpH(by[k].s) === E.catchUpH(base)), '보너스 값 같음');
{ const t = { type: 'rose', q: 0.8 }, cal = E.calendar(base.virtual);
  check(E.PATH_KEYS.every(k => E.teaItemValue(by[k].s, t, cal) === E.teaItemValue(base, t, cal)), '차 값 같음'); }
// 같은 손을 2주 놀림: 심고 · 돌보고 · 거둠 — 돈 · 꽃잎 · 판 기록이 같아야
const play = s => { const r = (() => { let x = 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; })(), c = { live: false, rng: r };
  s.money = 200000; E.advance(s, s.virtual + WEEK + 2 * H, c);
  for (let i = 0; i < 6 * 12; i++) { E.careAll(s, 'water', c); E.careAll(s, 'harvest', c); E.advance(s, s.virtual + 2 * H, c); }
  return { money: s.money, petals: s.petals.length, harvest: (s.stats && s.stats.harvest) || 0, income: (s.yearNow && s.yearNow.income) || 0, flowers: s.flowers.length }; };
const pb = play(copy(base));
check(E.PATH_KEYS.every(k => same(play(copy(by[k].s)), pb)), `같이 놀린 2주: 돈 · 꽃잎 · 수확 같음 (${pb.money}원 · 꽃잎 ${pb.petals})`);
check(E.WEEKLY_XP.join() === '20,40,80' && E.WEEKLY_BONUS === 40, '주간 목표 경험치는 길과 상관없이 단계마다 같음');
// 시뮬 4해 · 새 철 (--season --path): 연말 돈 · 해마다 기록이 길 없이와 같음
{ const { execFileSync } = require('child_process'), sim = path.join(__dirname, '..', 'tools', 'sim-economy.js');
  const out = p => execFileSync(process.execPath, [sim, '4', '7', '--season', ...(p ? ['--path', p] : [])], { encoding: 'utf8' });
  // 돈 표 · 끝 돈 · 해마다 기록(등급 칸 빼고) · 새 철 표만 견줌 — 주간 목표 · 등급은 길마다 끝낸 목표가 달라 경험치 합이 조금 다를 수 있음 (배율은 없음)
  const strip = t => t.split('\n\n').filter(p => !p.startsWith('주마다')).join('\n\n').split('\n').filter(l => !l.startsWith('길:'))
    .map(l => l.replace(/ · 끝 등급 \d+/, '').replace(/^((?:[^\t]*\t){6})[^\t]*(\t\d+\/\d+)$/, '$1-$2')).join('\n');
  const o0 = strip(out(null));
  for (const p of ['꽃길', '찻길', '흙길']) check(strip(out(p)) === o0, `시뮬 4해 + 2철 4해 --path ${p}: 돈 · 수입 · 잔 · 꽃잎 · 주문 · 점수 모두 길 없이와 같음`);
  check(o0.includes('1철 4해 · 판 잔'), '(시뮬이 2철까지 돎)'); }

console.log('[① 주간 목표 뽑는 쪽]');
{ // 기능을 다 연 정원: 길마다 몇 주 뽑아 그 길 fam이 얼마나 나오는지
  const s = copy(by.none.s); s.stats = Object.assign({}, s.stats, { dug: 50, cups: 50, orders: 9, blendCups: 3, hatCups: 3 }); s.mine.deepest = 3;
  s.dex.petal = { rose: true }; s.dex.teabag = { rose: true }; s.dex.blend = { a: true };
  s.flowers.push({ id: 7001, type: 'rose', x: 2, y: 2, stage: 'bloom', q: 1, ageH: 1, lifeH: 999, waterH: 0, thirstH: 0 });
  const share = p => { const x = copy(s); x.season.path = p; let hit = 0, all = 0;
    for (let w = 0; w < 40; w++) { const g = E.weeklyRoll(x, { week: 1000 + w }).goals; all += g.length; hit += g.filter(q => p && E.PATHS[p].fams.includes(E.WEEKLY[q.k].fam)).length; }
    return { hit, all }; };
  const famShare = (p, fams) => { const x = copy(s); x.season.path = p; let hit = 0;
    for (let w = 0; w < 40; w++) hit += E.weeklyRoll(x, { week: 1000 + w }).goals.filter(q => fams.includes(E.WEEKLY[q.k].fam)).length; return hit; };
  for (const k of E.PATH_KEYS) { const a = famShare(k, E.PATHS[k].fams), b = famShare(null, E.PATHS[k].fams);
    check(a > b, `${E.PATHS[k].icon} ${E.PATHS[k].name}: 그 길 쪽 목표가 길 없이보다 자주 (${a} > ${b} / 40주)`); }
  check(share('tea').all === 120 && share('flower').all === 120, '목표는 늘 3개 (쉬움 · 보통 · 어려움)');
  { const x = copy(s); x.season.path = 'tea'; const w = E.weeklyRoll(x, { week: 2000 }).goals;
    check(same(w.map(g => g.tier), [0, 1, 2]) && new Set(w.map(g => E.WEEKLY[g.k].fam)).size === 3, '단계 · fam 한 번은 그대로'); }
  const y = copy(s); y.season.path = 'tea'; const w1 = copy(E.weeklyRoll(y, { week: 3000 })), w2 = E.weeklyRoll(y, { week: 3000 });
  check(same(w1.goals, w2.goals), '같은 주는 같은 목표 (시드)');
  // 연 기능만: 광산을 판 적 없으면 흙길이어도 광산 목표 없음 → 기존대로
  const z = copy(by.earth.s), zw = E.weeklyRoll(z, { week: 4000 }).goals, zn = copy(by.none.s), znw = E.weeklyRoll(zn, { week: 4000 }).goals;
  check(!zw.some(g => E.WEEKLY[g.k].fam === 'dig') && same(zw, znw), '흙길이어도 광산을 안 열었으면 광산 목표 없음 · 길 없이와 같은 목표'); }

console.log('[② 그 길에만 오는 손님 · 기념품]');
const PV = { flower: 'snail', tea: 'squirrel', earth: 'badger' };
check(E.PATH_KEYS.every(k => E.VISITORS[PV[k]].path === k && E.MEMENTOS[E.VISITORS[PV[k]].memento].visitor === PV[k]) && E.VISITOR_KEYS.filter(k => E.VISITORS[k].path).length === 3, '길마다 손님 하나 (🐌 달팽이 할아버지 · 🐿️ 다람쥐 단골 · 🦡 오소리 광부) · 기념품 짝');
check(E.MEMENTO_KEYS.length === 23 && E.ORDER_MEMENTO_KEYS.length === 12, '기념품 20 → 23 · 주문 기념품 12 그대로');
{ const s = copy(by.none.s); s.flowers.push({ id: 7002, type: 'rose', x: 10, y: 10, stage: 'bloom', q: 1, ageH: 1, lifeH: 999, waterH: 0, thirstH: 0 });
  for (const k of E.PATH_KEYS) { const x = copy(s); x.season.path = k;
    check(E.visitorOk(x, PV[k]) && E.PATH_KEYS.filter(o => o !== k).every(o => !E.visitorOk(x, PV[o])), `${E.PATHS[k].name}: ${E.VISITORS[PV[k]].name}만 조건이 맞음`); }
  check(E.PATH_KEYS.every(k => !E.visitorOk(s, PV[k])), '길 없이면 길 손님은 안 옴');
  const x = copy(s); x.season.path = 'tea'; E.visitorCall(x, 'squirrel');
  E.advance(x, x.virtual + WEEK + 2 * H, ctx);   // 새 철 1년차로 — 달이 바뀌면 옴
  check(E.visitorTimes(x, 'squirrel') >= 1 && x.money === (() => { const y = copy(s); y.season.path = null; E.advance(y, y.virtual + WEEK + 2 * H, ctx); return y.money; })(), '찻길 손님이 와도 돈은 길 없이와 같음'); }

console.log('[③ 길 칭호 — 그 길로 한 철을 마치면]');
check(E.PATH_KEYS.every(k => { const t = E.pathTitle(k); return t && E.TITLES[t].extra && E.TITLES[t].path === k && E.EXTRA_TITLE_KEYS.includes(t) && !E.TITLE_KEYS.includes(t); }) && E.TITLE_KEYS.length === 19, '길마다 덤 칭호 하나 (모으는 칭호 19개 그대로)');
check(E.PATH_KEYS.every(k => by[k].r.pathTitle === null && by[k].s.titles[E.pathTitle(k)] == null), '길을 고른 것만으로는 칭호 없음');
{ // 찻길 2철을 3해 걸어 3철을 시작하면 「찻길을 걸은 사람」
  const s = copy(by.tea.s); E.advance(s, s.virtual + 3 * WEEK, ctx);
  for (const k of E.FLOWER_KEYS) s.dex.flower[k] = true;
  const r = E.seasonStart(s, Object.assign({}, ctx, { path: 'earth' }));
  check(r.ok && r.season === 3 && r.pathTitle === 't_path_tea' && s.titles.t_path_tea != null && s.titles.t_path_earth == null, '찻길로 2철을 마치고 3철 시작 → 「찻길을 걸은 사람」 (다음 길 칭호는 아직)');
  check(s.season.path === 'earth' && s.season.log[1].path === 'tea' && s.season.log[0].path === null, '끝난 철 줄에 걸은 길 (1철 길 없이 · 2철 찻길) · 3철은 흙길');
  check(s.dex.deco['t:t_path_tea'] === true || !!s.dex.deco['t:t_path_tea'], '칭호 문장 장식도 생김 (덤 장식)');
  console.log('[철마다 표 (P30-04-03, 14 탁서진 14-6)]');
  const tb = E.seasonTable(s);
  check(tb.length === 3 && same(tb.map(x => x.n), [1, 2, 3]) && same(tb.map(x => x.path), [null, 'tea', 'earth']) && same(tb.map(x => x.now), [false, false, true]), '3줄: 1철 · 2철 · 지금 3철(진행 중)');
  check(tb[0].years === 3 && tb[1].years === s.season.log[1].years && tb[1].years >= 3 && tb[2].years === 0, '걸린 해: 1철 3해 · 2철 · 지금 0해');
  check(tb[0].grade === s.season.log[0].grade && tb[2].grade === E.gradeOf(s).grade && tb[0].pathName === '길 없이' && tb[1].pathIcon === '🍵', '등급 · 길 이름 · 아이콘');
  check(tb[0].sold === s.season.log[0].sold && (tb[2].sold === null), '판 잔 (지금 철은 아직 해 기록이 없어 "—")');
  const slow = copy(s); slow.settings.slow = true;
  check(E.seasonTable(slow) === null && E.pathBadge(slow) && E.pathBadge(slow).name === '흙길', '🐢 느긋하게 보기면 표는 숨김(null) · 길 이름은 보임 (P30-08)'); }
check(E.seasonTable(ready) === null, '1철이면 표 없음');
{ const old = copy(by.tea.s); old.season.log[0].sold = undefined; delete old.season.log[0].path; old.season.path = 'nope'; old.mig = E.MIGRATIONS.length - 1;
  const m = E.migrateSave(old);
  check(m.season.path === null && m.season.log[0].path === null && E.seasonTable(m)[0].sold === null, '맨 끝 보정: 모르는 길 · 빈 길은 길 없이 · 판 잔 모르면 null ("—")'); }

console.log('[④ 한 해 기록 카드 테두리]');
{ const s = copy(by.flower.s); E.advance(s, s.virtual + WEEK + REST, ctx);
  check(s.records[0].season === 2 && s.records[0].path === 'flower', '그 철 한 해 기록에 길 (카드 테두리 색 — 화면)');
  check(by.none.s.records.every(r => !r.path), '1철 기록은 길 없음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
