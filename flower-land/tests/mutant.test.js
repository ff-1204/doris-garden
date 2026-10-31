// P36 🧬 돌연변이 꽃 (10-30): 처음 필 때 1% (+꽃잠 장식 · 유리 관) · 꽃잎 못 땀 · 품질이 낮을수록 괴이 · 🫙 유리 관 채집 · 도감 39칸 · 덤 칭호 3
const E = require(require('path').resolve((process.argv[2] || require('path').join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR;
const at = pred => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 6000; i++) { const c = E.calendar(t); if (pred(c)) return t + 0.1 * H; t += H / 4; } };
const mk = (month, id) => { const st = E.create(at(c => c.month === month && !c.frozen), () => 0.5); st.money = 1e6; st.onboarded = true; st.gardenId = id || 'mut-test'; return st; };
const bloomF = (st, type, x, y, q, extra) => { const f = Object.assign({ id: st.nextId++, type, x, y, q, startQ: q, origin: '화원', parent: null, stage: 'bloom', withered: false, bloomed: true, ageH: 3000, lifeH: 3000, waterH: 99, weedH: 99, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: 1 }, extra || {}); st.flowers.push(f); return f; };
const place = (st, key, x, y, more) => { const d = Object.assign({ id: st.nextId++, key, x, y }, more || {}); st.decos.push(d); return d; };

console.log('[확률 셈]');
let st = mk(7); const cal7 = E.calendar(st.virtual);
check(E.mutChance(st, 'rose', cal7) === 0.01, '기본 1%');
st.mutBoost = { week: cal7.week, n: 2 };
check(E.mutChance(st, 'rose', cal7) === 0.03, '🏮 · 🏯 둘 다 꽃잠에 놓였으면 그 해 3%');
st.mutBoost = { week: cal7.week - 1, n: 2 };
check(E.mutChance(st, 'rose', cal7) === 0.01, '지난해 보정은 이번 해엔 없음');
st.mutBoost = { week: cal7.week, n: 2 }; place(st, 'mutjar', 0, 0, { mut: { k: 'rose', stage: 1 } });
check(E.mutChance(st, 'rose', cal7) === 0.08 && E.mutChance(st, 'lavender', cal7) === 0.03, '장미 🫙가 놓이면 장미만 +5% → 최대 8%');
place(st, 'mutjar', 1, 0, { mut: { k: 'rose', stage: 3 } }); st.mutBoost = null;
check(E.mutChance(st, 'rose', cal7) === 0.06, '같은 종 유리 관 여럿이어도 +5% 한 번');
st.decos.forEach(d => { d.x = null; });
check(E.mutChance(st, 'rose', cal7) === 0.01, '창고에 있는 유리 관은 효과 없음');

console.log('[새해 3월 아침에 꽃잠 장식을 적음]');
st = mk(3); let c3 = E.calendar(st.virtual);
place(st, 'moonlamp', 0, 0); E.mutBoostMark(st, c3);
check(st.mutBoost && st.mutBoost.n === 1 && st.mutBoost.week === c3.week, '달 초롱 하나 → n 1');
place(st, 'pavilion', 1, 0); place(st, 'moonlamp', 2, 0); E.mutBoostMark(st, c3);
check(st.mutBoost.n === 2, '달 초롱 둘 + 정자 → 종류마다 한 번 (n 2)');
st.decos.forEach(d => { d.x = null; }); E.mutBoostMark(st, c3);
check(st.mutBoost === null, '창고에만 있으면 없음');
{ // 실제로 꽃잠을 지나 3월 아침에
  const s2 = mk(2); place(s2, 'moonlamp', 0, 0); let cal = E.calendar(s2.virtual);
  while (!(cal.idx === 0)) { E.advance(s2, cal.slotEnd + 1000, { live: false, rng: () => 0.5 }); cal = E.calendar(s2.virtual); }
  check(s2.mutBoost && s2.mutBoost.n === 1 && s2.mutBoost.week === cal.week, '흘러서 3월 아침이 되면 onSlot이 적음');
}

console.log('[결정적 · 처음 필 때 한 번]');
const roll = (gid, n) => { const s = mk(5, gid); const cal = E.calendar(s.virtual); let k = 0; for (let i = 0; i < n; i++) { const f = { id: i + 1, type: 'rose', q: 1 }; if (E.mutRoll(s, f, cal)) k++; } return k; };
check(roll('a', 2000) === roll('a', 2000), '같은 정원 같은 꽃 번호 · 해 → 같은 결과');
const k2000 = roll('a', 2000);
check(k2000 >= 8 && k2000 <= 40, `2000번에 1% 근처 (${k2000}번)`);
{ // 실제 피는 길: 처음 필 때만 굴림 · 이미 굴린 꽃은 다시 안 굴림
  const s = mk(4, 'bloomroll'); const before = s.flowers.length;
  s.decos.push({ id: s.nextId++, key: 'mutjar', x: 29, y: 19, mut: { k: 'rose', stage: 1 } }); s.mutBoost = { week: E.calendar(s.virtual).week, n: 2 };   // 8%로 올려 변이가 꼭 몇 포기 나오게 (검토 반영 — 일지 · 품질을 실제로 견줌)
  for (let i = 0; i < 400; i++) s.flowers.push({ id: 5000 + i, type: 'rose', x: i % 30, y: Math.floor(i / 30), q: 0.9, startQ: 0.9, origin: '화원', stage: 'mature', withered: false, bloomed: false, ageH: 9999, lifeH: 9999, waterH: 999, weedH: 999, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1 });
  let cal = E.calendar(s.virtual); while (cal.month !== 5) { E.advance(s, cal.slotEnd + 1000, { live: false, rng: () => 0.5 }); cal = E.calendar(s.virtual); }
  E.advance(s, s.virtual + H, { live: false, rng: () => 0.5 });
  const rolled = s.flowers.filter(f => f.mut != null).length, muts = s.flowers.filter(f => f.mut).length;
  check(rolled === 400 && before === 0, `5월에 핀 장미 400포기 모두 한 번 굴림 (변이 ${muts}포기)`);
  const snap = s.flowers.map(f => f.mut).join();
  E.advance(s, E.calendar(s.virtual).slotEnd + 1000, { live: false, rng: () => 0.5 });
  check(s.flowers.map(f => f.mut).join() === snap, '다음 달(6월)에 다시 피어도 다시 굴리지 않음');
  check(muts > 0 && s.log.filter(l => l.text.startsWith('🧬 뭔가 다른 꽃이 피었어요')).length === muts, `변이 꽃마다 처음 필 때 일지 한 줄 (알림 type 9 · ${muts}줄)`);
  const mf = s.flowers.find(f => f.mut), nf2 = s.flowers.find(f => f.mut === false);
  check(mf.q === nf2.q && mf.harvestKey === -1, `같게 돌본 보통 꽃과 품질이 똑같이 변함 (${E.pct(mf.q)}% = ${E.pct(nf2.q)}%) · 거둔 적 없음`);
  { const s3 = mk(4, 'seen'); s3.flowers.push({ id: 9001, type: 'rose', x: 1, y: 1, q: 0.9, startQ: 0.9, origin: '화원', stage: 'mature', withered: false, bloomed: false, ageH: 9999, lifeH: 9999, waterH: 999, weedH: 999, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 0, harvestKey: -1, bloomKey: -1, mut: true });
    let c = E.calendar(s3.virtual); while (c.month !== 5) { E.advance(s3, c.slotEnd + 1000, { live: false, rng: () => 0.5 }); c = E.calendar(s3.virtual); } E.advance(s3, s3.virtual + H, { live: false, rng: () => 0.5 });
    check(!(s3.yearSeen && s3.yearSeen.bloom && s3.yearSeen.bloom.rose) && !s3.dex.flower.rose && s3.dex.mutant.rose && s3.log.some(l => l.text.includes('피 한 방울 장미')), '씨앗으로 이어진 변이 장미가 피면: 올해 본 꽃 · 꽃 도감엔 안 셈 · 🧬 도감 · 알림 줄'); }
}

console.log('[변이 꽃 — 수확 · 개미 · 뽑기 · 옮기기 · 품질]');
st = mk(7); let cal = E.calendar(st.virtual);
const m = bloomF(st, 'jasmine', 5, 5, 0.95, { mut: true }), n = bloomF(st, 'jasmine', 6, 5, 0.95);
check(!E.canCare(st, m, 'harvest', cal) && E.canCare(st, n, 'harvest', cal), '변이 꽃은 수확 불가 (보통 꽃은 됨)');
const p0 = st.petals.length, r1 = E.care(st, 'harvest', [[5, 5]]);
check(!r1.ok && st.petals.length === p0, 'care harvest가 변이 꽃엔 안 됨');
const xp0 = st.grade.xp; E.careAll(st, 'harvest');
check(st.petals.length === p0 + 1 && st.grade.xp - xp0 === E.XP.harvest, '모두 거두기는 보통 꽃만 (경험치도 1포기 몫)');
m.weedH = 0; check(E.canCare(st, m, 'weed', cal) && E.care(st, 'weed', [[5, 5]]).ok, '잡초 뽑기(호미)는 됨 — 꽃은 그대로');
check(st.flowers.includes(m) && typeof E.removeFlower === 'undefined' && typeof E.uproot === 'undefined', '정원에서 꽃을 뽑는 길이 없음 (유리 관에 담기뿐)');
{ const s = mk(4); const f = bloomF(s, 'jasmine', 3, 3, 0.9, { mut: true, stage: 'young' });
  check(E.move(s, f.id, 8, 8).ok && f.x === 8 && f.mut, '옮겨심기는 됨 (심는 달)'); }
{ // 개미 일꾼은 건너뜀 (자리도 차지하지 않음)
  const s = mk(7); place(s, 'autobasket', 10, 10);
  const a = bloomF(s, 'jasmine', 9, 10, 0.9, { mut: true }), b = bloomF(s, 'jasmine', 11, 10, 0.9);
  const d = E.placedOf(s, 'autobasket')[0];
  check(!E.basketFlowers(s, d).includes(a) && E.basketFlowers(s, d).includes(b), '개미 일꾼이 맡는 꽃에서 빠짐');
  const ended = E.calendar(s.virtual), np = E.basketTick(s, ended, null);
  check(np === 1 && a.harvestKey === -1, `달 끝 개미 일꾼은 보통 꽃만 (${np}장)`);
}
{ // 품질은 보통 꽃처럼 떨어짐
  const s = mk(7); const f = bloomF(s, 'jasmine', 3, 3, 0.95, { mut: true, weedH: 0, waterH: 0 });
  E.advance(s, s.virtual + 12 * H, { live: false, rng: () => 0.5 });
  check(f.q < 0.95, `잡초 · 목마름이면 품질이 떨어짐 (${E.pct(f.q)}%)`);
}

console.log('[단계]');
check(E.mutStage({ q: 1 }) === 1 && E.mutStage({ q: 0.7 }) === 1 && E.mutStage({ q: 0.69 }) === 2 && E.mutStage({ q: 0.4 }) === 2 && E.mutStage({ q: 0.39 }) === 3 && E.mutStage({ q: 0.3 }) === 3, '70% 이상 1 · 40 ~ 69% 2 · 39% 이하 3');

console.log('[도감 · 기본 도감 · 등급 · 퀘스트 불변]');
st = mk(7); const dex0 = E.dexCount(st), tot0 = E.dexTotal(st), gdx0 = E.gradeDexCount(st), q0 = JSON.stringify(st.journal.done);
const f1 = bloomF(st, 'dongbaek', 4, 4, 0.9, { mut: true });
E.mutSync(st, null);
check(st.dex.mutant.dongbaek === 1 && E.mutDexCount(st) === 1 && E.mutDexCells(st) === 1, '놓인 변이 꽃 1단계 → 도감 1칸');
f1.q = 0.5; E.mutSync(st, null); check(st.dex.mutant.dongbaek === 2 && E.mutDexCells(st) === 2, '품질이 떨어져 2단계를 보면 2칸');
f1.q = 0.95; E.mutSync(st, null); check(st.dex.mutant.dongbaek === 2, '돌봐서 1단계로 돌아가도 본 칸은 그대로');
check(E.dexCount(st) === dex0 && E.dexTotal(st) === tot0 && E.DEX_TOTAL === 93 && E.gradeDexCount(st) === gdx0, '기본 도감 · 93칸 · 등급 도감 칸 그대로');
check(!st.dex.flower.dongbaek, '변이 꽃은 꽃 도감에 등록하지 않음');
{ const tw = mk(7); bloomF(tw, 'dongbaek', 4, 4, 0.9); E.checkJournal(st, null); E.checkJournal(tw, null);   // 같은 자리에 보통 꽃을 둔 쌍둥이 정원과 견줌
  check(JSON.stringify(Object.keys(st.journal.done).sort()) === JSON.stringify(Object.keys(tw.journal.done).sort()), '퀘스트는 그대로 (변이로 끝나는 퀘스트 없음)'); }
check(E.mutDex(st).length === 13 && E.mutDex(st).find(d => d.k === 'rose').name === null && E.mutDex(st).find(d => d.k === 'dongbaek').lore, '안 본 종은 이름 · 괴담 없음');
check(Object.keys(E.MUTANTS).length === 13 && E.MUTANT_KEYS.every(k => E.MUTANTS[k].name && E.MUTANTS[k].lore), '13종 이름 · 괴담 한 줄');
{ // 씨앗으로 이어진 변이는 처음 필 때 드러남
  const s = mk(7); const f = bloomF(s, 'rose', 2, 2, 0.9, { mut: true, bloomKey: -1, stage: 'young' });
  E.mutSync(s, null); check(!E.mutShown(f) && !s.dex.mutant.rose, '아직 안 핀 변이 씨앗 꽃은 도감 · 담기 대상 아님');
}

console.log('[🫙 유리 관 만들기 · 담기]');
st = mk(7); E.mineOf(st); st.mine.bag.quartz = 15; st.mine.bag.stone = 9;
check(E.CRAFTS.jar && E.CRAFTS.jar.need.quartz === 15 && E.CRAFTS.jar.need.stone === 9, '석영 15 + 돌 9');
const cr = E.craft(st, 'jar');
check(cr.ok && st.jar === 1 && st.mine.bag.quartz === 0 && st.mine.bag.stone === 0, `만들면 유리 관 1 (${cr.msg})`);
check(!E.craft(st, 'jar').ok, '재료가 모자라면 안 됨');
const fm = bloomF(st, 'dongbaek', 6, 6, 0.35, { mut: true }), fn = bloomF(st, 'dongbaek', 7, 6, 0.9);
check(!E.jarCapture(st, fn.id).ok, '보통 꽃은 못 담음');
const nf = st.flowers.length, jr = E.jarCapture(st, fm.id, null);
const jd = jr.deco;
check(jr.ok && st.jar === 0 && st.flowers.length === nf - 1 && !st.flowers.includes(fm), `유리 관 −1 · 꽃이 사라짐 (${jr.msg})`);
check(jd && jd.key === 'mutjar' && jd.mut.k === 'dongbaek' && jd.mut.stage === 3 && jd.x === null, '그때 단계 그대로 장식(창고)');
check(E.decoInfo(E.decoKey(jd)).name === '유리 관 속 밤에 지는 동백 · 3단계', '이름 "유리 관 속 밤에 지는 동백 · 3단계"');
check(st.dex.mutjar.dongbaek && st.dex.mutant.dongbaek === 3, '채집 기록 · 도감 3단계');
const fm2 = bloomF(st, 'dongbaek', 8, 6, 0.9, { mut: true });
check(!E.jarCapture(st, fm2.id).ok && E.jarCapture(st, fm2.id).msg.includes('유리 관이 없어요'), '유리 관이 없으면 안 됨');
check(E.placeDeco(st, jd.id, 12, 12).ok && E.storeDeco(st, jd.id).ok && E.placeDeco(st, jd.id, 13, 12).ok, '창고 ↔ 정원 자유');
check(E.decoCount(st) === Object.keys(st.dex.deco).filter(k => E.decoInfo(k) && !E.decoInfo(k).extra).length && !st.dex.deco.mutjar && !E.DECO_KEYS.includes('mutjar') && E.decoTotal() === 50, '꾸밈 도감 셈 · 칸(50)에 안 섞음');
check(!E.buyDeco(st, 'mutjar').ok, '화원에서 살 수 없음');
check(E.decoBuffLine(st, E.decoKey(jd)) === '🧬 이 꽃의 돌연변이가 더 자주' && E.decoBuffLine(st, 'moonlamp').includes('새해 3월 아침까지 놓아 두면'), '카드 한 줄 (🫙 · 🏮)');
check(E.mutChance(st, 'dongbaek') === 0.06 && E.mutChance(st, 'rose') === 0.01, '놓인 동백 유리 관 → 동백만 +5%');

console.log('[번식 · 채종 50%]');
{ const s = mk(4, 'prop'); let got = 0, tot = 0;
  for (let i = 0; i < 40; i++) { const f = bloomF(s, 'lavender', i % 30, Math.floor(i / 30) + 3, 1, { mut: true, stage: 'mature' }); const r = E.propagate(s, f.id, () => 0.5, null); if (!r.ok) continue; }
  for (const p of s.pending) { tot += p.qs.length; got += (p.muts || []).filter(Boolean).length; }
  check(tot > 0 && got > tot * 0.3 && got < tot * 0.7, `꺾꽂이 묘목 ${tot}개 중 변이 ${got}개 (≈50%)`);
  E.advance(s, s.virtual + 13 * H, { live: false, rng: () => 0.5 });
  const items = s.items.filter(it => it.type === 'lavender');
  check(items.filter(it => it.mut).length === got, '뿌리를 내리면 그 묘목이 변이를 이음');
  const it = items.find(x => x.mut); const s2 = s; let cal2 = E.calendar(s2.virtual); while (!E.FLOWERS.lavender.sow.includes(cal2.month)) { E.advance(s2, cal2.slotEnd + 1000, { live: false, rng: () => 0.5 }); cal2 = E.calendar(s2.virtual); }
  const pr = E.plant(s2, it.id, 20, 15, () => 0);
  check(pr.ok && pr.flower.mut === true && !E.mutShown(pr.flower), '심으면 변이 꽃 (처음 필 때 드러남)');
  const ps = s.flowers.find(f => !f.mut && f.type === 'lavender');
  check(!ps || E.mutSeed(s, ps, 0) === false, '보통 꽃의 씨앗은 변이 아님');
}

console.log('[덤 칭호 3]');
st = mk(7);
check(['t_mut5', 't_mut39', 't_jar13'].every(k => E.TITLES[k] && E.TITLES[k].extra && E.EXTRA_TITLE_KEYS.includes(k) && !E.TITLE_KEYS.includes(k)) && E.TITLE_KEYS.length === 19, '덤 칭호 · 칭호 19개 그대로');
['rose', 'lavender', 'jasmine', 'lotus'].forEach(k => { st.dex.mutant[k] = 1; }); E.checkJournal(st, null);
check(st.titles.t_mut5 == null, '4종이면 아직');
st.dex.mutant.bpea = 1; E.checkJournal(st, null);
check(st.titles.t_mut5 != null && st.dex.deco['t:t_mut5'], '5종 → 「달빛에 홀린 정원사」 · 문장 장식');
E.MUTANT_KEYS.forEach(k => { st.dex.mutant[k] = 3; }); E.checkJournal(st, null);
check(st.titles.t_mut39 != null && E.mutDexCells(st) === 39, '39칸 → 「기이한 정원」');
E.MUTANT_KEYS.forEach(k => { st.dex.mutjar[k] = true; }); E.checkJournal(st, null);
check(st.titles.t_jar13 != null, '13종 채집 → 「유리 관 수집가」');
check(E.decoTotal() === 50 && E.decoCount(st) <= E.decoTotal(), '덤 칭호 문장은 꾸밈 도감 칸 밖');
check(!E.TITLES.t_miracle.test({ flowers: [{ withered: false, mut: true, stage: 'bloom', q: 1, startQ: 0.5 }] }), '변이 꽃은 「한 포기의 기적」에 안 셈');

console.log('[새 철]');
{ const s = mk(7); s.jar = 2; const f = bloomF(s, 'rose', 2, 2, 0.9, { mut: true }); E.mutSync(s, null); const d = place(s, 'mutjar', 3, 3, { mut: { k: 'rose', stage: 1 } });
  check(E.SEASON_KEEP.includes('jar') && E.SEASON_KEEP.includes('dex') && E.SEASON_KEEP.includes('decos'), 'jar · dex · decos는 이어짐');
  let cal = E.calendar(s.virtual); while (!cal.frozen) { E.advance(s, cal.slotEnd + 1000, { live: false, rng: () => 0.5 }); cal = E.calendar(s.virtual); }
  for (const k of E.FLOWER_KEYS) s.dex.flower[k] = true; for (let y = 0; y < 3; y++) s.yearLog.push({ year: y + 1, season: 1, income: 0, sold: 0, harvest: 0, orders: 0, score: 0, grade: 1, dex: 0, dexTotal: 93 });
  const r = E.seasonStart(s, { rng: () => 0.5 });
  check(r.ok, `새 철 시작 (${r.msg})`);
  check(s.jar === 2 && s.dex.mutant.rose === 1 && !s.flowers.some(x => x.mut), '유리 관 · 도감 이어짐 · 변이 꽃은 땅과 함께 사라짐');
  const jd2 = s.decos.find(x => x.key === 'mutjar');
  check(jd2 && jd2.x === null && jd2.mut.k === 'rose', '유리 관 장식은 창고로 (남음)');
}

console.log('[저장 · 예전 정원]');
{ const s = mk(7); bloomF(s, 'rose', 2, 2, 0.9, { mut: true }); s.jar = 1; place(s, 'mutjar', 3, 3, { mut: { k: 'rose', stage: 2 } }); E.mutSync(s, null);
  const back = E.parseSave(JSON.stringify(E.makeSave(s, 1)));
  const got = back.ok ? E.migrateSave(back.data.game) : null;
  check(!!got && got.flowers.some(f => f.mut) && got.jar === 1 && got.dex.mutant.rose === 1 && got.decos.some(d => d.mut && d.mut.stage === 2), '저장 파일로 저장 · 열기');
  const MN = E.MIGRATIONS.findIndex(x => x[0].includes('P36'));
  check(MN === E.MIGRATIONS.length - 3, `MIGRATIONS ${MN + 1}번째 P36 (뒤로 P37 · 맨 끝 P38)`);
  const old = JSON.parse(JSON.stringify(s)); old.mig = MN; delete old.jar; delete old.mutBoost; delete old.dex.mutant; delete old.dex.mutjar;
  old.flowers = [{ id: 1, type: 'rose', x: 1, y: 1, q: 1, bloomKey: 40 }, { id: 2, type: 'rose', x: 2, y: 1, q: 1, bloomKey: -1 }];
  const om = E.migrateSave(old);
  check(om.jar === 0 && om.mutBoost === null && JSON.stringify(om.dex.mutant) === '{}' && JSON.stringify(om.dex.mutjar) === '{}', '예전 정원: 유리 관 0 · 빈 도감');
  check(om.flowers[0].mut === false && om.flowers[1].mut === undefined, '이미 핀 꽃은 굴리지 않음(false) · 안 핀 꽃은 처음 필 때 굴림');
}

console.log('[DEV]');
{ const s = mk(7); bloomF(s, 'rose', 2, 2, 0.9); const r = E.mutDev(s, null);
  check(r.ok && s.flowers[0].mut && s.jar === 3 && s.dex.mutant.rose === 1, '변이 꽃 피우기 · 유리 관 3개'); }

console.log('[시뮬 — 돈 · 수확]');
{ const { execFileSync } = require('child_process'), path = require('path');
  const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7'], { encoding: 'utf8' });
  const money = +(/끝: 돈 (\d+)/.exec(out) || [])[1];
  check(money === 80720, `시뮬 4 7 연말 80,720원 그대로 (${money}원)`); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
