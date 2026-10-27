// 🗓️ 주마다 바뀌는 목표 (P28-09, 10-28): 월요일 아침 6시에 쉬움 · 보통 · 어려움 3개, 같은 주엔 같은 목표, 연 기능에서만, 끝내면 등급 경험치 · 셋 다 끝내면 덤, 놓쳐도 벌칙 없음
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const keys = st => st.weekly.goals.map(g => g.k).join();
const garden = (id, at) => { const st = E.create(at || mon + 0.1 * H, () => 0.5); st.gardenId = id; st.onboarded = true; E.advance(st, st.virtual + H, ctx); return st; };
const nextMonday = st => { const c = E.calendar(st.virtual); E.advance(st, c.ws + 7 * 24 * H + 0.2 * H, ctx); };
const set = (st, goals) => { st.weekly.goals = goals.map(([k, n, extra]) => Object.assign({ k, tier: E.WEEKLY[k].tier, n, got: 0, done: false }, extra || {})); st.weekly.bonus = false; };
const LOCKED = ['prop', 'dry', 'cup', 'dig', 'teabag', 'order', 'recipe', 'stairs', 'blends', 'hat', 'honey', 'digs', 'cups', 'orders'];

console.log('[목표 표]');
const kinds = E.WEEKLY_KEYS;
check(kinds.length >= 10 && kinds.length <= 20, `목표 종류 ${kinds.length}가지 (10~20)`);
check([0, 1, 2].every(t => kinds.some(k => E.WEEKLY[k].tier === t && E.WEEKLY[k].open({ dex: {}, stats: {}, flowers: [], decos: [] }))), '쉬움 · 보통 · 어려움마다 처음 정원도 할 수 있는 목표가 있음');
check(E.WEEKLY_XP[0] < E.WEEKLY_XP[1] && E.WEEKLY_XP[1] < E.WEEKLY_XP[2] && E.WEEKLY_BONUS > 0, `어려울수록 경험치가 많음 (${E.WEEKLY_XP.join(' · ')} · 덤 ${E.WEEKLY_BONUS})`);

console.log('[같은 주엔 같은 목표 · 새 주엔 바뀜]');
const st = garden('wk-1');
check(st.weekly && st.weekly.week === E.calendar(st.virtual).week && st.weekly.goals.length === 3, '첫 안내를 마친 정원은 이번 주 목표 3개');
check(st.weekly.goals.map(g => g.tier).join() === '0,1,2', '쉬움 · 보통 · 어려움 하나씩');
check(new Set(st.weekly.goals.map(g => E.WEEKLY[g.k].fam)).size === 3, '같은 일(fam)을 두 줄로 내지 않음');
const before = keys(st);
E.advance(st, st.virtual + 30 * H, ctx);
check(keys(st) === before, '같은 주에 시간이 흘러도 같은 목표');
const re = E.migrateSave(copy(st)); E.advance(re, re.virtual + H, ctx);
check(keys(re) === before && re.weekly.week === st.weekly.week, '저장했다 다시 열어도 같은 목표');
const twin = garden('wk-1');
check(keys(twin) === before, '같은 이름표 · 같은 주 · 같은 정원 모습이면 같은 목표 (Math.random 없음)');
const pre = E.create(mon + 0.1 * H, () => 0.5); pre.gardenId = 'wk-pre'; E.advance(pre, pre.virtual + H, ctx);
check(pre.weekly === null && E.weeklyView(pre) === null, '첫 안내 전 정원은 아직 목표가 없음');
const seen = new Set([before]); let changed = 0;
for (let i = 0; i < 6; i++) { const w0 = st.weekly.week; nextMonday(st); if (st.weekly.week === w0 + 1) changed++; seen.add(keys(st) + (st.weekly.goals.find(g => g.type) || {}).type); }
check(changed === 6, '월요일 아침 6시가 지나면 새 주의 목표로 바뀜 (6주)');
check(seen.size >= 2, `처음 정원도 주마다 다른 목표가 나옴 (7주에 ${seen.size}가지 묶음 · 연 기능이 늘수록 많아짐)`);

console.log('[아직 안 연 기능은 빠짐]');
const fresh = garden('wk-fresh');
let bad = 0;
for (let w = 0; w < 40; w++) { E.weeklyRoll(fresh, Object.assign({}, E.calendar(fresh.virtual), { week: E.calendar(fresh.virtual).week + w })); if (fresh.weekly.goals.some(g => LOCKED.includes(g.k))) bad++; }
check(bad === 0, '처음 정원 40주: 광산 · 찻집 · 주문 · 블렌드 · 꿀 · 꽃방 목표가 한 번도 안 나옴');
const pro = garden('wk-pro');
pro.stats = { dug: 30, cups: 25, orders: 6, blendCups: 2, hatCups: 1, dried: 5 };
Object.assign(pro.dex, { petal: { rose: true }, teabag: { rose: true }, blend: { springfield: 0.5 } });
pro.mine.deepest = 4;
pro.flowers = [{ id: 1, type: 'rose', x: 3, y: 3, withered: false }];   // 뽑기만 볼 거라 여러해살이 하나만 (번식 · ★5 목표)
const got = new Set();
for (let w = 0; w < 80; w++) { E.weeklyRoll(pro, Object.assign({}, E.calendar(pro.virtual), { week: 3000 + w })); pro.weekly.goals.forEach(g => got.add(g.k)); }
check(['prop', 'dig', 'stairs', 'digs', 'cup', 'cups', 'order', 'orders', 'recipe', 'blends', 'hat', 'teabag', 'dry'].every(k => got.has(k)), `연 기능이 많은 정원은 광산 · 찻집 · 주문 · 블렌드 목표도 나옴 (${got.size}가지)`);
check(!got.has('honey'), '벌통을 놓지 않은 정원엔 꿀 목표가 없음');

console.log('[끝내면 경험치 · 셋 다 끝내면 덤]');
const a = garden('wk-xp');
E.giftPot(a, ctx);
const pot = a.flowers[0];
set(a, [['water', 2], ['tidy', 2], ['petals', 3]]);
const money0 = a.money, xp0 = a.grade.by.weekly || 0, logs = [];
const lctx = { live: true, rng: () => 0.5, toast: t => logs.push(t) };
pot.waterH = 0; E.care(a, 'water', [[pot.x, pot.y]], lctx);
check(a.weekly.goals[0].got === 1 && !a.weekly.goals[0].done, '물 한 번 → 진행 1 / 2');
pot.waterH = 0; E.care(a, 'water', [[pot.x, pot.y]], lctx);
check(a.weekly.goals[0].done && (a.grade.by.weekly || 0) - xp0 === E.WEEKLY_XP[0], `끝내면 쉬움 경험치 +${E.WEEKLY_XP[0]} (grade.by.weekly)`);
check(logs.some(t => t.startsWith('🗓️ 이번 주 목표를 끝냈어요 · 꽃에 물 2번 주기')) && a.log.some(l => l.type === 9 && E.isWeeklyLine(l.text)), '알림 한 줄 · 정원 일지 한 줄');
pot.weedH = 0; E.care(a, 'weed', [[pot.x, pot.y]], lctx); pot.weedH = 0; E.care(a, 'weed', [[pot.x, pot.y]], lctx);
check(a.weekly.goals[1].done && (a.grade.by.weekly || 0) - xp0 === E.WEEKLY_XP[0] + E.WEEKLY_XP[1], '잡초 2번 → 보통도 끝 (+40)');
check(!a.weekly.bonus, '둘만 끝내면 덤은 아직');
E.weeklyFinish(a, 2, lctx);
const all = E.WEEKLY_XP[0] + E.WEEKLY_XP[1] + E.WEEKLY_XP[2] + E.WEEKLY_BONUS;
check(a.weekly.bonus && a.weekly.full === 1 && (a.grade.by.weekly || 0) - xp0 === all, `셋 다 끝내면 덤까지 모두 +${all}`);
check(logs.some(t => t.startsWith('🗓️ 이번 주 목표를 모두 끝냈어요')), '덤 알림 한 줄');
check(a.money === money0, '돈은 그대로 (돈을 주지 않음, P17-14)');
check(!E.weeklyFinish(a, 2, lctx).ok && (a.grade.by.weekly || 0) - xp0 === all, '끝낸 목표 · 덤은 두 번 받지 않음');
const v = E.weeklyView(a);
check(v && v.done === 3 && v.goals.every(g => g.done && g.text && g.ic) && v.leftH > 0 && v.leftH <= 7 * 24, '화면 값: 3줄 · 끝낸 수 · 바뀔 때까지 남은 시간');

console.log('[여러 가지 일로 오름]');
const b = garden('wk-ev');
set(b, [['dig', 2], ['blends', 2], ['star5', 1, { type: 'rose' }]]);
const m = E.mineOf(b);
E.dig(b, m.board.cells.findIndex(c => !c.dug), ctx); E.dig(b, m.board.cells.findIndex(c => !c.dug), ctx);
check(b.weekly.goals[0].done, '광산 칸 파기');
const cupB = (name, recipe) => ({ id: 0, kind: 'blend', parts: ['rose', 'lavender'], recipe, name, q: 0.5, brewAbs: 0 });
const sellCup = c => E.weekNote(b, 'sell', { cup: c }, 1, ctx);   // 찻잔이 팔릴 때(countCup)와 같은 알림 — 실제 판매는 아래 꽃잠 쪽에서
sellCup(cupB('장미 · 라벤더 블렌드', null)); sellCup(cupB('장미 · 라벤더 블렌드', null));
check(b.weekly.goals[1].got === 1, '블렌드 3종: 같은 블렌드를 두 잔 팔면 1종');
sellCup(cupB('봄 들판', 'springfield'));
check(b.weekly.goals[1].done, '다른 블렌드를 팔면 2종 → 끝');
E.weekNote(b, 'harvest', { type: 'rose', q: 0.79 }, 1, ctx);
check(!b.weekly.goals[2].done, '★5 장미: ★4 장미는 안 셈');
E.weekNote(b, 'harvest', { type: 'lavender', q: 1 }, 1, ctx);
check(!b.weekly.goals[2].done, '★5 장미: 다른 꽃은 안 셈');
E.weekNote(b, 'harvest', { type: 'rose', q: 0.95 }, 1, ctx);
check(b.weekly.goals[2].done && b.weekly.bonus, '★5 장미 → 끝 · 셋 다라 덤');

console.log('[몰아서 해도 됨 · 꽃잠에도]');
const c = garden('wk-sun');
set(c, [['dig', 3], ['cup', 1], ['petals', 99]]);
E.advance(c, E.calendar(c.virtual).ws + 6 * 24 * H + 2 * H, ctx);   // 일요일 아침 8시 (쉼달)
const cs = E.calendar(c.virtual);
check(cs.frozen && cs.week === c.weekly.week && c.weekly.goals[0].got === 0, '일요일(꽃잠)에도 아직 같은 주 · 같은 목표');
const mc = E.mineOf(c);
for (let i = 0; i < 3; i++) E.dig(c, mc.board.cells.findIndex(x => !x.dug), ctx);
c.cups = [{ id: 7001, kind: 'tea', type: 'chamomile', q: 0.6, brewAbs: cs.abs }];
E.sellCups(c, [7001], ctx);
check(c.weekly.goals[0].done && c.weekly.goals[1].done, '꽃잠에 광산 · 찻집으로 끝낼 수 있음');

console.log('[놓치면 벌칙 없음]');
const xpBefore = c.grade.xp, byBefore = c.grade.by.weekly, moneyBefore = c.money, full0 = c.weekly.full, w0 = c.weekly.week;
const done0 = c.weekly.doneAll;
nextMonday(c);
check(c.weekly.week === w0 + 1 && c.weekly.goals.every(g => !g.done && g.got === 0), '다음 월요일: 못 끝낸 목표는 사라지고 새 목표');
check(c.grade.by.weekly === byBefore && c.grade.xp >= xpBefore && c.weekly.full === full0 && c.weekly.doneAll === done0, '경험치 · 끝낸 수가 줄지 않음 (벌칙 없음)');
check(c.money >= moneyBefore, '돈도 빼지 않음 (용돈만 더해짐)');
const skip = garden('wk-skip');
const sw = skip.weekly.week;
E.advance(skip, skip.virtual + 9 * 24 * H, ctx);   // 아흐레 비움
check(skip.weekly.week === E.calendar(skip.virtual).week && skip.weekly.week >= sw + 1, '일주일 넘게 비워도 이번 주 목표가 새로 있음');

console.log('[느긋하게 보기]');
const d = garden('wk-slow');
d.settings.slow = true;
set(d, [['water', 1], ['tidy', 1], ['petals', 1]]);
const dl = [], dctx = { live: true, rng: () => 0.5, toast: t => dl.push(t) }, dlog = d.log.length, dsnap = E.weeklySnap(d);
for (let i = 0; i < 3; i++) E.weeklyFinish(d, i, dctx);
check((d.grade.by.weekly || 0) === E.WEEKLY_XP[0] + E.WEEKLY_XP[1] + E.WEEKLY_XP[2] + E.WEEKLY_BONUS && d.weekly.bonus, '진행 · 경험치 · 덤은 그대로 쌓임');
check(!dl.some(E.isWeeklyLine) && !d.log.slice(dlog).some(l => E.isWeeklyLine(l.text)), '알림 · 일지 줄 없음');
check(E.weeklyView(d) === null && E.weeklyAwayLine(d, dsnap) === null, '목표 줄 · 자리를 비운 동안 줄 없음');
d.settings.slow = false;
check(E.weeklyView(d) && E.weeklyView(d).done === 3, '끄면 다시 보이고 끝낸 것도 그대로');

console.log('[자리를 비운 동안]');
const e = garden('wk-away');
set(e, [['water', 1], ['tidy', 1], ['petals', 99]]);
const snap = E.weeklySnap(e);
E.weeklyFinish(e, 0, ctx); E.weeklyFinish(e, 1, ctx);
check(E.weeklyAwayLine(e, snap) === `🗓️ 주간 목표 2개를 끝냈어요 · 🌱 +${E.WEEKLY_XP[0] + E.WEEKLY_XP[1]}`, `한 줄로 (${E.weeklyAwayLine(e, snap)})`);
check(E.weeklyAwayLine(e, E.weeklySnap(e)) === null, '그 뒤 끝낸 게 없으면 없음');
const s2 = E.weeklySnap(e); E.weeklyFinish(e, 2, ctx);
check(E.weeklyAwayLine(e, s2) === `🗓️ 주간 목표 1개를 끝냈어요 · 🎉 셋 다 끝 · 🌱 +${E.WEEKLY_XP[2] + E.WEEKLY_BONUS}`, `셋 다 끝내면 덤까지 (${E.weeklyAwayLine(e, s2)})`);

console.log('[저장 · 불러오기]');
const f = garden('wk-save');
set(f, [['water', 5], ['tidy', 2], ['petals', 40]]);
f.weekly.goals[0].got = 3; E.weeklyFinish(f, 1, ctx);
const r = E.parseSave(JSON.stringify(E.makeSave(f, 12345)));
const g = r.ok && E.migrateSave(r.data.game);
check(g && JSON.stringify(g.weekly) === JSON.stringify(f.weekly), '파일로 저장했다 불러와도 목표 · 진행 · 끝낸 것 그대로');
E.advance(g, g.virtual + H, ctx);
check(g.weekly.goals[0].got === 3 && g.weekly.goals[1].done && keys(g) === keys(f), '불러온 뒤에도 같은 주엔 같은 목표');

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
