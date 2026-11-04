// P67 불러오기 입구 정리 — 손으로 만든 저장(📂 파일 · ☁️ 드라이브 · localStorage)의 글자 칸 < > 지우기 · 숫자 칸 Number()
// 거부하지 않고 고치기만 · 정상 저장은 한 글자도 안 바뀜 (P67 전 스냅숏의 옮긴 결과 해시 그대로)
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const ENGINE = path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine.js'));
const E = require(ENGINE);
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const copy = o => JSON.parse(JSON.stringify(o));
const EVIL = '<img src=x onerror=alert(1)>';
const MON = new Date(2026, 9, 5, 6, 0, 0).getTime();
const noTag = s => !/[<>]/.test(JSON.stringify(s));

// 손으로 만든 위험 저장
const evil = () => {
  const st = E.create(MON, () => 0.5), PARTS = ['chamomile', 'marigold'], REC = E.blendRecipe(PARTS, st);
  st.blends.push({ id: 9001, parts: PARTS, q: 0.8, recipe: REC, name: EVIL, hat: false, bagged: true });
  st.cups = st.cups || []; st.cups.push({ id: 9002, kind: 'blend', parts: PARTS, q: '0.8', recipe: REC, name: `✨ ${EVIL}`, at: st.virtual });
  st.flowers.push({ id: 9003, type: 'chamomile', x: '2', y: 1, q: 0.8, startQ: 0.8, origin: EVIL, parent: `<b>${EVIL}</b>`, stage: 'seed', ageH: 0, vigor: 1 });
  st.items.push({ id: 9004, type: 'chamomile', q: 0.8, ageH: 0, packaged: false, origin: EVIL, parent: null, got: st.virtual });
  st.money = '<b>999999</b>';
  st.fert = '12';
  st.log.push({ d: '<img src=x onerror=alert(1)>', m: 'x', y: '3', at: 1, type: 0, text: `일지 ${EVIL}` });
  st.records = [{ year: 'abc<script>', season: '2', score: '<i>7</i>', dex: '5', dexTotal: 93, counts: { pond: '<b>3</b>' }, snapshot: `x" onerror="alert(1)`, log: [] }];
  st.honey = Object.assign(st.honey || {}, { lavender: '4' });
  st.dex.flower[`<b>${'x'}</b>`] = true;   // 칸 이름에도
  return st;
};

console.log('[📂 파일 · ☁️ 드라이브 길: makeSave → parseSave → migrateSave]');
const r = E.parseSave(JSON.stringify(E.makeSave(evil(), MON)));
check(r.ok, '거부하지 않음 — parseSave 통과');
check(r.ok && noTag(r.data.game), 'parseSave가 돌려준 정원(불러오기 창 요약이 읽음)에 < > 가 없음');
const g = r.ok && E.migrateSave(r.data.game);
check(!!g, 'migrateSave 통과 (쓸 수 있는 정원)');
check(g && noTag(g), '옮긴 정원 전체에 < > 0개');
const b = g && g.blends.find(x => x.id === 9001), c = g && g.cups.find(x => x.id === 9002), f = g && g.flowers.find(x => x.id === 9003), it = g && g.items.find(x => x.id === 9004);
check(b && b.name === 'img src=x onerror=alert(1)', `블렌드 이름은 < > 만 빠지고 남음 → ${b && b.name}`);
check(c && c.name === '✨ img src=x onerror=alert(1)' && c.q === 0.8, '찻잔 이름 · 글자 품질 "0.8" → 0.8');
check(f && f.origin === 'img src=x onerror=alert(1)' && f.parent === 'bimg src=x onerror=alert(1)/b' && f.x === 2, '꽃 출처 · 부모 · 글자 x "2" → 2');
check(it && it.origin === 'img src=x onerror=alert(1)', '창고 출처');
check(g && g.money === 0, `돈 "<b>999999</b>" → 숫자가 아니라 0 (${g && g.money})`);
check(g && g.fert === 12, '비료 "12" → 12');
const l = g && g.log.find(x => x.at === 1);
check(l && l.d === 1 && l.m === 0 && l.y === 3 && l.text === '일지 img src=x onerror=alert(1)', `일지 줄 d · m · y · 글 → ${l && JSON.stringify([l.d, l.m, l.y])}`);
const rec = g && g.records[0];
check(rec && rec.year === 1 && rec.season === 2 && rec.score === 0 && rec.dex === 5 && rec.counts.pond === 0, `한 해 기록 year · season · score · dex · counts → ${rec && JSON.stringify([rec.year, rec.season, rec.score, rec.dex, rec.counts.pond])}`);
check(rec && rec.snapshot === 'x" onerror="alert(1)', '기록 그림 src는 < > 만 지움 (따옴표는 화면 esc가 막음 — P63)');
check(g && g.honey.lavender === 4, '창고 꿀 "4" → 4');
check(g && g.dex.flower.bx_b === undefined && g.dex.flower['bx/b'] === true && !Object.keys(g.dex.flower).some(k => /[<>]/.test(k)), '칸 이름의 < > 도 지움');

console.log('[localStorage 길: JSON.parse → migrateSave (app.js load)]');
const g2 = E.migrateSave(JSON.parse(JSON.stringify(evil())));
check(!!g2 && noTag(g2) && g2.money === 0 && g2.log.find(x => x.at === 1).d === 1, '파일 길과 같게 정리됨');
check(JSON.stringify(E.migrateSave(copy(g2))) === JSON.stringify(E.migrateSave(copy(g2))) && noTag(E.migrateSave(copy(g2))), '다시 열어도 같음');

console.log('[정리 함수 하나만]');
const s3 = E.cleanSave({ money: ' ', water: '', speed: 'fast', shop: { seats: 'two' }, season: { n: '<1>' }, grade: { xp: '1e3' }, mine: { bag: { quartz: '2' } }, stats: { cups: true }, dex: { tea: { chamomile: true } } });
check(s3.money === 0 && s3.water === 0 && s3.speed === 1 && s3.shop.seats === 1 && s3.season.n === 1, '빈 글자 · 숫자 아님 → 기본값 (0, 속도 · 손님 자리 · 철은 1)');
check(s3.grade.xp === 1000 && s3.mine.bag.quartz === 2, '숫자로 읽히는 글자는 숫자로');
check(s3.stats.cups === true && s3.dex.tea.chamomile === true, '글자가 아닌 것(예전 저장의 true 등)은 보정이 맡게 그대로');
check(E.cleanSave(null) === null && E.cleanSave(undefined) === undefined, '정원이 아니면 그대로 돌려줌');
check(E.migrateSave({ v: '3', tiles: [], dex: {} }) === null, '쓸 수 없는 정원(v · 땅 칸)은 예전처럼 null — 정리가 살리지 않음');
check(E.SAVE_NUMS.length > 50 && E.SAVE_NUMS.includes('money') && E.SAVE_NUMS.includes('log[].d=1') && E.SAVE_NUMS.includes('records[].year=1'), `숫자 칸 목록 ${E.SAVE_NUMS.length}개 (money · 일지 d · m · 기록 year …)`);

console.log('[정상 저장은 그대로]');
const fresh = E.create(MON, () => 0.5), year = copy(fresh);
E.advance(year, MON + 7 * 24 * E.HOUR * 2, { live: false, rng: (() => { let q = 5; return () => (q = (q * 16807) % 2147483647) / 2147483647; })() });
for (const [nm, s] of [['새 정원', fresh], ['두 주(정원 두 해) 지난 정원', year]]) check(JSON.stringify(E.cleanSave(copy(s))) === JSON.stringify(s), `${nm}: cleanSave 전후 같음`);
const back = E.parseSave(JSON.stringify(E.makeSave(year, MON)));
check(back.ok && JSON.stringify(back.data.game) === JSON.stringify(E.makeSave(year, MON).game), '저장 파일을 읽어도 정원 글자 그대로');
// P67 전 스냅숏(P66 기록)의 옮긴 결과 · 저장 파일 해시 — 정리를 더해도 한 줄도 같아야 함 · P72-01 (11-04): 보정 55번째 · 다시 피는 꽃으로 해시가 바뀌어 지금 스냅숏 값으로 다시 적음 (cleanSave는 그대로)
// P67 전 해시 → 그 뒤 새 정원 칸이 바뀔 때마다 다시 적음 (P72 ripeH · R-C2 settings.notify · P79 블렌드 넷으로 도감 101칸 — 기록의 dexTotal, 11-05) — 정상 저장이 cleanSave 전후 같다는 뜻은 그대로
const BEFORE = `새 정원 create 2318a575eb29c6e5
새 정원 30시간 뒤 07bfcb7ddd09bc5b
새 정원 두 주(정원 두 해) 뒤 8780d43334852bc8
옛 저장: 가장 옛 정원 (30시간) ff43f0f1ce844d1f
옛 저장: 가장 옛 정원 (두 주) 30038d418cb9d84f
옛 저장: 두 주 정원을 0번째부터 629363dc784c2e00
옛 저장: 두 주 정원을 10번째부터 629363dc784c2e00
옛 저장: 두 주 정원을 20번째부터 8dfe9eae26d80ffa
옛 저장: 두 주 정원을 30번째부터 8dfe9eae26d80ffa
옛 저장: 두 주 정원을 40번째부터 8dfe9eae26d80ffa
옛 저장: 두 주 정원을 48번째부터 8780d43334852bc8
옛 저장: 두 주 정원을 55번째부터 8780d43334852bc8
옛 저장: 쓸 수 없는 정원 null · null
저장 파일 makeSave 85a59f4c11e44427
저장 파일 parseSave 85a59f4c11e44427`.split('\n');
const now = execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'engine-snapshot.js'), ENGINE], { encoding: 'utf8' }).replace(/\r\n/g, '\n').split('\n').filter(x => /^(새 정원|옛 저장|저장 파일)/.test(x));
const diff = BEFORE.filter((x, i) => now[i] !== x);
check(now.length === BEFORE.length && !diff.length, `옮긴 결과 · 저장 파일 해시 ${BEFORE.length}줄이 P67 전과 같음${diff.length ? ` — 다름: ${diff.join(' / ')}` : ''}`);

console.log(fails ? `\n결과: ${fails}개 실패` : '\n결과: 모두 통과');
