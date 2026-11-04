// P63 innerHTML 위험 고치기 — 저장 · 바깥에서 온 글자가 화면 HTML에 태그로 들어가지 않는지
// 화면 함수는 DOM이 있어야 돌아서 Node에서 부르지 못함 → ① esc 함수 자체 ② 손으로 만든 저장이 엔진을 지나도 글자가 그대로 남음(그래서 화면이 막아야 함) ③ 화면 파일 글자에서 그 자리가 esc를 쓰는지
const path = require('path'), fs = require('fs');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const app = read('app.js'), tea = read('app-teashop.js'), garden = read('app-garden.js'), shop = read('app-shop.js'), dex = read('app-dex.js');
const EVIL = '<img src=x onerror="alert(1)">\'&';

console.log('[esc 함수 (app.js)]');
const line = app.split('\n').find(l => /^const esc = /.test(l));
check(!!line, 'app.js에 esc가 한 줄로 있음');
const esc = new Function(`${line.replace(/;\s*(\/\/.*)?$/, ';')} return esc;`)();
const out = esc(EVIL);
check(out === '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&#39;&amp;', `& < > " ' 다섯 글자를 바꿈 → ${out}`);
check(!/[<>"']/.test(out), '바꾼 글자에 태그 · 따옴표가 남지 않음');
check(esc('✨ 꿀벌의 정원 블렌드') === '✨ 꿀벌의 정원 블렌드' && esc(3) === '3' && esc('화원') === '화원', '보통 이름 · 숫자는 그대로 (화면 글자 변화 없음)');
check(/const spriteImg = [^\n]*alt="\$\{esc\(alt \|\| ''\)\}"/.test(app), 'spriteImg는 alt를 esc로 (블렌드 이름을 alt로 넘겨도 됨)');

console.log('[손으로 만든 저장 — 엔진 입구(P67)는 < > 만 지움, 따옴표 · & 는 남아 화면 esc가 막아야 함]');
const MON = new Date(2026, 9, 5, 6, 0, 0).getTime();
const st = E.create(MON, () => 0.5), PARTS = ['chamomile', 'marigold'], REC = E.blendRecipe(PARTS, st);   // 레시피를 맞춰 두어야 onOpen이 이름을 다시 짓지 않음
st.blends.push({ id: 9001, parts: PARTS, q: 0.8, recipe: REC, name: EVIL, hat: false, bagged: true });
st.cups = st.cups || []; st.cups.push({ id: 9002, kind: 'blend', parts: PARTS, q: 0.8, recipe: REC, name: EVIL, at: st.virtual });
st.flowers.push({ id: 9003, type: 'chamomile', x: 1, y: 1, q: 0.8, startQ: 0.8, origin: EVIL, parent: EVIL, stage: 'seed', ageH: 0, vigor: 1 });
st.items.push({ id: 9004, type: 'chamomile', q: 0.8, ageH: 0, packaged: false, origin: EVIL, parent: null, got: st.virtual });
const r = E.parseSave(JSON.stringify(E.makeSave(st, MON)));
const g = r.ok && E.migrateSave(r.data.game);
check(!!g, '저장 파일로 만들고 다시 읽어 옮기기까지 통과');
const LEFT = EVIL.replace(/[<>]/g, '');   // P67 cleanSave: < > 만 지움 (거부하지 않음)
check(g && g.blends.find(b => b.id === 9001).name === LEFT && g.cups.find(c => c.id === 9002).name === LEFT, '블렌드 · 찻잔 이름은 < > 만 빠지고 남음');
check(g && g.flowers.find(f => f.id === 9003).origin === LEFT && g.flowers.find(f => f.id === 9003).parent === LEFT && g.items.find(i => i.id === 9004).origin === LEFT && /["'&]/.test(LEFT), '꽃 출처 · 부모 · 창고 출처도 < > 만 빠짐 — 따옴표 · & 가 남으니 화면에서 esc로 막아야 함');

console.log('[화면 자리마다 esc]');
check(/<dd>\$\{esc\(f\.origin\)\}\$\{f\.parent \? ` \(\$\{esc\(f\.parent\)\}에서\)` : ''\}<\/dd>/.test(garden), '꽃 상태창 "어디서" — f.origin · f.parent (app-garden.js)');
check(/<span class="st-from">\$\{esc\(gr\.origin\)\}<\/span>/.test(shop), '창고 카드 출처 — gr.origin (app-shop.js)');
// app-teashop.js: 블렌드 · 찻잔 이름(b · c · g . name)은 spriteImg의 alt(그 안에서 esc) 말고는 모두 esc(…)로
const teaRest = tea.replace(/spriteImg\([^()]*\)/g, '').replace("nm = isB ? `${g.recipe ? '✨ ' : ''}${g.name}` :", '');   // nm은 찻잔 카드에서 esc(nm) · spriteImg alt로만 씀
const raw = teaRest.match(/\$\{(b|c|g)\.name\}/g) || [];
check(!raw.length, `찻집 · 제다실 · 팔기 창 · 우리기 창 · 티백 창 · 첫 손님 창: esc 없는 \${b|c|g.name} 0곳 (있음: ${raw.length})`);
check((tea.match(/esc\((b|c|g)\.name\)/g) || []).length >= 6 && /esc\(nm\)/.test(tea), '블렌드 이름 자리 esc — 카드 · 찻잔 카드 · 팔기 · 티백 · 우리기 · 첫 손님');
check(/data-sq2="\$\{esc\(g\.k\)\}\|-"/.test(tea) && /data-sq2="\$\{esc\(g\.k\)\}\|\+"/.test(tea), '팔기 창 −/+ 단추 data-sq2 (이름이 섞인 줄 키)');
check(/data-gq="\$\{esc\(key\(g\)\)\}\|-"/.test(tea) && /data-bq="\$\{esc\(g\.k\)\}\|-"/.test(tea), '티백 창 data-gq · 우리기 창 data-bq');
check(/\.split\('\|'\), d = parts\.pop\(\), k = parts\.join\('\|'\)/.test(tea), 'data-* 키는 dataset으로 읽어 원래 글자로 돌아옴 (esc는 속성 안에서만)');
console.log('[📖 기록 카드 · 일지 (app-dex.js — 확인 필요였던 곳)]');
check(/<img src="\$\{esc\(r\.snapshot\)\}"/.test(dex), '한 해 기록 그림 src — r.snapshot (저장 글자)');
check(/\$\{esc\(r\.year\)\}년차 정원/.test(dex) && /\$\{esc\(r\.dex\)\} \/ \$\{esc\(r\.dexTotal \|\| 32\)\}/.test(dex) && /\$\{esc\(r\.counts\[k\]\)\}/.test(dex), '한 해 기록 카드 숫자 칸(년차 · 도감 · 땅 칸 수)도 esc');
check(/<span class="d">\$\{esc\(l\.d\)\}일<\/span>/.test(dex) && /\$\{esc\(l\.y\)\}년차/.test(dex) && /esc\(l\.text\)/.test(dex), '일지 줄 날짜 · 년차 · 글');

console.log(fails ? `\n결과: ${fails}개 실패` : '\n결과: 모두 통과');
