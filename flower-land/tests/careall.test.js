// P28-11 한꺼번에 돌보기 · 모두 거두기 (M2-5, 10-28): 돌볼 꽃만 골라 한 번에 — 용품은 송이마다, 모자라면 되는 만큼만,
// 꽃잠 규칙 그대로, 한 송이씩 한 것과 결과(꽃잎 품질 · 경험치 · 주간 목표 · 도감)가 같음
// 여정: 09 박지우 09-2 "목마른 꽃 모두 물 주기를 한 번 누르자 물병 6개를 쓰고 끝난다" · 09-3 "핀 꽃도 모두 거두기로 한 번에"
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const garden = pred => { const st = E.create(at(pred), () => 0.5); st.gardenId = 'careall-test'; st.onboarded = true; E.advance(st, st.virtual + 0.2 * H, ctx); return st; };
let fid = 9000;
const fl = (st, type, x, y, extra) => { const f = Object.assign({ id: fid++, type, x, y, q: 0.7, startQ: 0.7, stage: 'bloom', bloomed: true, withered: false, ageH: 1000, lifeH: 1000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 }, extra); st.flowers.push(f); return f; };
const set = (st, goals) => { st.weekly.goals = goals.map(([k, n]) => ({ k, tier: E.WEEKLY[k].tier, n, got: 0, done: false })); st.weekly.bonus = false; };
const june = c => c.month === 6 && !c.frozen;

console.log('[09-2 목마른 꽃만 모두 물 주기]');
{
  const st = garden(june); st.water = 10;
  const dry = [1, 2, 3, 4, 5, 6].map(i => fl(st, 'chamomile', i, 2, { waterH: 0, thirstH: i * H }));
  const wet = fl(st, 'chamomile', 1, 4), gone = fl(st, 'chamomile', 2, 4, { waterH: 0, withered: true });
  check(E.careAllTargets(st, 'water').length === 6, '목마른 꽃 6포기만 고름 (물을 마신 꽃 · 시든 꽃은 빼고)');
  const r = E.careAll(st, 'water', ctx);
  check(r.ok && r.count === 6 && st.water === 4, '한 번 누르면 물병 6개를 쓰고 6포기에 물: ' + r.msg);
  check(r.msg.includes('물병 4개 남았어요') && r.left === 4, '남은 물병을 알려 줌');
  check(dry.every(f => f.waterH === 24 && f.thirstH === 0) && wet.waterH === 99 && gone.waterH === 0, '돌봐야 하는 꽃만 돌봐짐');
  const r2 = E.careAll(st, 'water', ctx);
  check(!r2.ok && r2.msg === '돌볼 꽃이 없어요' && st.water === 4, '다시 누르면 돌볼 꽃이 없고 물병도 그대로');
  check(!E.careAll(st, 'dig', ctx).ok, '모르는 돌보기는 막힘');
}

console.log('[용품이 모자라면 되는 만큼만]');
{
  const st = garden(june); st.water = 4;
  const dry = [1, 2, 3, 4, 5, 6].map(i => fl(st, 'chamomile', i, 2, { waterH: 0, thirstH: i * H }));
  const r = E.careAll(st, 'water', ctx);
  check(r.ok && r.count === 4 && r.short === 2 && st.water === 0, '물병 4개면 4포기만: ' + r.msg);
  check(r.msg === '물병이 모자라 4포기만 물을 줬어요', '"물병이 모자라 4포기만 물을 줬어요"');
  check(dry.slice(2).every(f => f.waterH === 24) && dry.slice(0, 2).every(f => f.waterH === 0), '오래 목마른 꽃부터');
  const r0 = E.careAll(st, 'water', ctx);
  check(!r0.ok && r0.msg.includes('물병이 없어요') && dry[0].waterH === 0, '물병이 없으면 아무것도 안 하고 창고 안내');
  // 거두기: 바구니 2번 · 핀 꽃 3포기 → 품질 높은 2포기
  const b = garden(june); b.basket = 2;
  const lo = fl(b, 'rose', 1, 1, { q: 0.3 }), hi = fl(b, 'rose', 2, 1, { q: 0.9 }), mid = fl(b, 'rose', 3, 1, { q: 0.6 });
  const rb = E.careAll(b, 'harvest', ctx);
  check(rb.ok && rb.count === 2 && b.basket === 0 && rb.msg === '바구니가 모자라 2그루만 꽃잎 2장을 거뒀어요', '바구니 2번이면 2그루만 (장미는 그루): ' + rb.msg);
  check(hi.harvestKey !== -1 && mid.harvestKey !== -1 && lo.harvestKey === -1, '품질 높은 꽃부터 거둠');
  // 잡초 · 가지치기 · 비료도 같은 규칙
  const w = garden(june); w.hoe = 3; w.shears = 9;
  [1, 2, 3, 4].forEach(i => fl(w, 'rose', i, 3, { weedH: 0 }));
  const rw = E.careAll(w, 'weed', ctx);
  check(rw.ok && rw.count === 3 && w.hoe === 0 && rw.msg.startsWith('호미가 모자라 3'), '호미 3번이면 3포기만 잡초: ' + rw.msg);
  const rp = E.careAll(w, 'prune', ctx);
  check(rp.ok && rp.count === 4 && w.shears === 5, '가지치기는 가지 칠 수 있는 꽃(장미)만 4포기: ' + rp.msg);
  w.fert = 1;   // 잡초 · 가지치기로 생긴 비료는 치우고
  const rf = E.careAll(w, 'fert', ctx);
  check(rf.ok && rf.count === 1 && rf.short === 3 && w.fert === 0, '비료 1개면 1포기만: ' + rf.msg);
  w.fert = 0.4;
  check(!E.careAll(w, 'fert', ctx).ok && w.fert === 0.4, '비료가 1개도 안 되면 못 함');
}

console.log('[꽃잠 — 핀 채 잠든 꽃을 한 번만 · 물은 줄 수 있음]');
{
  const st = garden(c => c.frozen); st.basket = 10; st.water = 10;
  check(E.calendar(st.virtual).frozen, '꽃잠');
  const a = fl(st, 'rose', 1, 1), b = fl(st, 'rose', 2, 1), young = fl(st, 'rose', 3, 1, { stage: 'young' }), dry = fl(st, 'rose', 4, 1, { stage: 'young', waterH: 0 });
  const r = E.careAll(st, 'harvest', ctx);
  check(r.ok && r.count === 2 && st.basket === 8 && young.harvestKey === -1, '꽃잠에 핀 채 잠든 2포기만 거둠: ' + r.msg);
  const r2 = E.careAll(st, 'harvest', ctx);
  check(!r2.ok && st.basket === 8 && a.harvestKey === b.harvestKey, '같은 꽃잠에 다시 모두 거두기는 없음 (꽃잠에 한 번)');
  const rw = E.careAll(st, 'water', ctx);
  check(rw.ok && rw.count === 1 && dry.waterH === 24, '꽃잠에도 목마른 꽃에 모두 물 주기');
}

console.log('[한 송이씩 한 것과 결과가 같음]');
{
  const base = garden(june);
  set(base, [['water', 15], ['star4', 10], ['petal', 15]]);
  base.water = 20; base.basket = 20;
  ['rose', 'lavender', 'chamomile', 'rose', 'gamguk'].forEach((t, i) => fl(base, t, i + 1, 5, { q: 0.4 + i * 0.12, waterH: 0, thirstH: (5 - i) * H }));
  fl(base, 'rose', 7, 5, { q: 0.85, origin: '이웃' });   // 화분 첫 수확은 2장
  base.dex.petal = {};
  const A = copy(base), B = copy(base);
  const orderA = E.careAllTargets(A, 'harvest').map(f => [f.x, f.y]), waterA = E.careAllTargets(A, 'water').map(f => [f.x, f.y]);
  const ra = E.careAll(A, 'harvest', ctx), rw = E.careAll(A, 'water', ctx);
  for (const t of orderA) E.care(B, 'harvest', [t], ctx);
  for (const t of waterA) E.care(B, 'water', [t], ctx);
  check(ra.ok && ra.count === 6 && ra.petals === 7 && rw.ok && rw.count === 5, `모두 거두기 6포기 · 꽃잎 7장 · 물 5포기 (${ra.msg} / ${rw.msg})`);
  const pet = s => JSON.stringify(s.petals.map(p => [p.type, p.q, p.seasonKey]));
  check(pet(A) === pet(B), '거둔 꽃잎 품질 · 장수 · 철이 같음');
  check(A.grade.xp === B.grade.xp && JSON.stringify(A.grade.by) === JSON.stringify(B.grade.by) && A.grade.xp > base.grade.xp, `등급 경험치가 같음 (+${A.grade.xp - base.grade.xp})`);
  check(JSON.stringify(A.weekly.goals.map(g => g.got)) === JSON.stringify(B.weekly.goals.map(g => g.got)) && A.weekly.goals[0].got === 5 && A.weekly.goals[2].got === 7, `주간 목표 진행이 같음 (${A.weekly.goals.map(g => g.got).join(' · ')})`);
  check(JSON.stringify(A.yearNow) === JSON.stringify(B.yearNow) && JSON.stringify(A.dex) === JSON.stringify(B.dex), '올해 기록 · 도감이 같음');
  check(A.basket === B.basket && A.water === B.water && A.basket === 14 && A.water === 15, '용품은 송이마다 (바구니 6번 · 물병 5개)');
  E.checkJournal(A, ctx); E.checkJournal(B, ctx);
  check(JSON.stringify(A.journal.done && Object.keys(A.journal.done)) === JSON.stringify(B.journal.done && Object.keys(B.journal.done)) && A.grade.xp === B.grade.xp, '퀘스트도 같이 끝남');
  check(JSON.stringify(A.flowers) === JSON.stringify(B.flowers), '꽃 상태가 같음');
}

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
