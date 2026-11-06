// 도리의 정원 — 게임 규칙 엔진 조각 5/10: 도감일지 · 🏅 칭호 효과 · ⬆️ 위 칸 · 💌 손님 주문 · 💐 이웃 선물 · 🏅 한 해 평가
// P66(11-03): 예전 한 파일 engine.js(줄 1364 ~ 1830)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
'use strict';
// ---------------------------------------------------------------- 도감일지: 퀘스트 → 칭호 (P19, 10-17)
const bump = (st, k, n) => { st.stats = st.stats || {}; st.stats[k] = (st.stats[k] || 0) + (n || 1); };
// 찻잔이 팔릴 때마다: 전체 · 손님(자동) · 갓 우린 · 햇차 · 블렌드 잔 수 (P19-07-01: 판매 잔 수 · 햇차 수만 새로 셈)
function countCup(st, c, cal, auto, ctx) {
  if (st.firstGuest) st.firstGuest = false;       // P22-05 첫 잔이 팔리면 🍵 첫 손님 표는 끝
  if (fillOrder(st, c, cal) && !auto) { addXp(st, 'order', 1, ctx); weekNote(st, 'order', null, 1, ctx); }   // P23-01 손님 주문 · P28-05-01 등급 경험치 · P28-09 · R-B2 (11-05 검토): 🫖 도우미 · 카운터가 저절로 판 잔이 채운 주문은 ✓만 — 경험치 · 주간 목표 없음
  bump(st, 'cups'); if (auto) bump(st, 'autoCups');
  yearAdd(st, 'sold', 1); addXp(st, 'sell', 1, ctx, c.kind === 'blend' ? titlePerk(st, 'blendXp') : 1);   // P52 🫖 블렌드 연구가   // P28-07-01 올해 판 잔 수 · P28-05-01
  if (!cupCold(c, cal)) bump(st, 'warmCups');
  if (c.hat) bump(st, 'hatCups');
  if (c.kind === 'blend') bump(st, 'blendCups');
  weekNote(st, 'sell', { cup: c }, 1, ctx);   // P28-09
}
const n0 = o => Object.keys(o || {}).length;
const S = (st, k) => (st.stats || {})[k] || 0;
// 퀘스트: 키 · 이름 · 판정 · 할 곳(탭) · 언제 할 수 있는지 힌트 ({ sow: 꽃 } 화원에 들어오는 달 · { bloom: 꽃 } 피는 달 · 'cafe' 찻집 여는 달 — P34부터 늘 지금)
const Q = (key, name, test, go, when) => ({ key, name, test, go, when: when || null });
// P22-01 (10-24): 1장은 "첫 꽃" — 첫 방문에 받은 이웃의 화분(P22-02). 예전 정원 · 화분을 받기 전엔 캐모마일
const firstFlower = st => st && st.firstFlower && FLOWERS[st.firstFlower] ? st.firstFlower : 'chamomile';
// 화분으로 받은 꽃과 같은 6장 나무 퀘스트는 "직접 심은 ○○" (QA 4회차)
const giftedSame = (st, k) => st && st.gift != null && st.gift >= 0 && st.firstFlower === k;
const ownName = (st, k) => `${giftedSame(st, k) ? '직접 심은 ' : ''}${FLOWERS[k].name} 피우기`;
const ownTest = (st, k) => giftedSame(st, k) ? !!(st.ownBloom || {})[k] : !!st.dex.flower[k];
const questName = (q, st) => typeof q.name === 'function' ? q.name(st) : q.name;
const questWhenOf = (q, st) => typeof q.when === 'function' ? q.when(st) : q.when;
const CHAPTERS = [
  { key: 'c0', no: 0, name: '첫 방문', title: 't_visit', quests: [   // 첫 안내 창에서 '시작'을 누르면 바로 (10-17)
    Q('c0_visit', '도리의 정원에 처음 오기', st => !!st.onboarded, 'garden'),
  ] },
  { key: 'c1', no: 1, name: '첫 꽃밭', title: 't_first', quests: [
    Q('c1_bloom', st => `${FLOWERS[firstFlower(st)].name} 피우기`, st => !!st.dex.flower[firstFlower(st)], 'garden', st => ({ bloom: firstFlower(st) })),
    Q('c1_petal', st => `${FLOWERS[firstFlower(st)].name} 꽃잎 거두기`, st => !!(st.dex.petal || {})[firstFlower(st)], 'garden', st => ({ bloom: firstFlower(st) })),
    Q('c1_dry', '꽃방에 꽃잎 널기', st => S(st, 'dried') > 0, 'tearoom', { need: 'dry' }),
    Q('c1_bag', st => `${FLOWERS[firstFlower(st)].name} 티백 만들기`, st => !!(st.dex.teabag || {})[firstFlower(st)], 'tearoom', st => ({ need: 'petal', flower: firstFlower(st) })),
    Q('c1_land', st => st.gift != null && st.gift >= 0 ? '첫 땅 만들기' : '초원 만들기', st => st.gift != null && st.gift >= 0 ? LAND_KEYS.some(k => k !== 'barren' && st.dex.land[k]) : !!st.dex.land.grassland, 'garden', { need: 'land' }),   // 화분을 받은 정원은 어떤 땅이든 (QA 4회차)
    Q('c1_sell', st => `${FLOWERS[firstFlower(st)].tea} 팔기`, st => st.dex.tea[firstFlower(st)] != null, 'cab', st => ({ need: 'sell', flower: firstFlower(st) })),   // 그 꽃 차가 있어야 지금 (QA 16 · 19회차)
  ] },
  { key: 'c2', no: 2, name: '땅 바꾸기', title: 't_land', quests: [
    Q('c2_foothill', '산기슭 만들기', st => !!st.dex.land.foothill, 'shop', { sow: 'gamguk' }),
    Q('c2_med', '지중해 언덕 만들기', st => !!st.dex.land.med, 'shop', { sow: 'lavender' }),
    Q('c2_sub', '아열대 정원 만들기', st => !!st.dex.land.subtropic, 'shop', { sow: 'jasmine' }),
    Q('c2_trop', '열대 만들기', st => !!st.dex.land.tropical, 'shop', { sow: 'hibiscus' }),
    Q('c2_edge', '경계 땅 하나 찾기', st => ['mossy', 'wetland', 'dryfield'].some(k => st.dex.land[k]), 'garden'),
  ] },
  { key: 'c3', no: 3, name: '물가의 여름', title: 't_water', quests: [
    Q('c3_root', '연꽃 연근 들이기', st => !!(st.dex.form || {}).lotus, 'shop', { sow: 'lotus' }),
    Q('c3_bloom', '연꽃 피우기', st => !!st.dex.flower.lotus, 'garden', { bloom: 'lotus' }),
    Q('c3_pond', '연못 만들기', st => !!st.dex.land.pond, 'garden'),
    Q('c3_wet', '습지 만들기', st => !!st.dex.land.wetland, 'garden'),
    Q('c3_sell', '연꽃차 팔기', st => st.dex.tea.lotus != null, 'cab', 'cafe'),
  ] },
  { key: 'c4', no: 4, name: '블렌드 연구', title: 't_blend', quests: [
    Q('c4_spring', '봄 들판 만들기', st => st.dex.blend.springfield != null, 'tearoom'),
    Q('c4_sleep', '잠드는 밤 만들기', st => st.dex.blend.sleepnight != null, 'tearoom'),
    Q('c4_violet', '보랏빛 저녁 만들기', st => st.dex.blend.violetdusk != null, 'tearoom'),
    Q('c4_five', '이름 있는 블렌드 5가지', st => n0(st.dex.blend) >= 5, 'tearoom'),
    Q('c4_bag', '블렌드 티백 만들기', st => n0(st.dex.bagBlend) > 0, 'tearoom'),
  ] },
  { key: 'c5', no: 5, name: '겨울 찻집', title: 't_cafe', quests: [
    Q('c5_guest', '손님이 사 간 첫 찻잔', st => S(st, 'autoCups') > 0, 'cab', 'cafe'),
    Q('c5_warm', '갓 우린 차 팔기', st => S(st, 'warmCups') > 0, 'cab', 'cafe'),
    Q('c5_hat', '햇차 팔기', st => S(st, 'hatCups') > 0, 'cab', 'cafe'),
    Q('c5_blend', '블렌드 차 팔기', st => S(st, 'blendCups') > 0, 'cab', 'cafe'),
    Q('c5_five', '차 도감 5칸', st => n0(st.dex.tea) >= 5, 'cab', 'cafe'),
  ] },
  { key: 'c6', no: 6, name: '나무의 해', title: 't_tree', quests: [
    Q('c6_dongbaek', st => ownName(st, 'dongbaek'), st => ownTest(st, 'dongbaek'), 'garden', { bloom: 'dongbaek' }),
    Q('c6_maehwa', st => ownName(st, 'maehwa'), st => ownTest(st, 'maehwa'), 'garden', { bloom: 'maehwa' }),
    Q('c6_napmae', st => ownName(st, 'napmae'), st => ownTest(st, 'napmae'), 'garden', { bloom: 'napmae' }),
    Q('c6_plum', '겨울 매화향 만들기', st => st.dex.blend.plumwinter != null, 'tearoom'),
  ] },
];
const QUESTS = CHAPTERS.flatMap(c => c.quests.map(q => Object.assign(q, { chapter: c.key })));
// 칭호: 등급 s 새싹 · f 꽃 · g 정원 (P19-05-03). 장 칭호는 그 장을 마치면, 숨은 칭호는 test로
const TITLES = {
  t_visit: { name: '정원 문을 연 사람', tier: 's', chapter: 'c0' },
  t_first: { name: '새싹 정원사', tier: 's', chapter: 'c1' },
  t_land: { name: '땅을 읽는 사람', tier: 'f', chapter: 'c2' },
  t_water: { name: '물가의 정원사', tier: 'f', chapter: 'c3' },
  t_blend: { name: '블렌드 연구가', tier: 'f', chapter: 'c4' },
  t_cafe: { name: '겨울 찻집 주인', tier: 'f', chapter: 'c5' },
  t_tree: { name: '나무를 기다린 사람', tier: 'g', chapter: 'c6' },
  t_sleep: { name: '꽃잠에 온 손님', tier: 's', cond: '꽃잠(일요일)에 처음 시작', hint: '모두 잠든 정원에 처음 온 사람', test: st => !!st.startedInSleep },
  t_record: { name: '한 해의 기록자', tier: 's', cond: '한 해 정원을 기록 (쉼달)', hint: '한 해를 끝까지 지켜본 사람', test: st => st.records.length > 0 },
  t_hat: { name: '햇차 장인', tier: 'f', cond: '햇차 5잔 팔기', hint: '가장 좋은 잎만 골라 우린 사람', test: st => S(st, 'hatCups') >= 5 },
  t_regular: { name: '찻집의 단골', tier: 'f', cond: '찻잔 100잔 팔기', hint: '손님이 이름을 기억하는 가게', test: st => S(st, 'cups') >= 100 },
  t_lands: { name: '열 가지 땅', tier: 'g', cond: '땅 도감 10칸', hint: '정원의 모든 흙을 밟아 본 사람', test: st => LAND_KEYS.every(k => st.dex.land[k]) },
  t_miracle: { name: '한 포기의 기적', tier: 'g', cond: '품질 80% 이하로 심은 꽃을 100%로 피우기', hint: '지친 꽃을 다시 흠 없이', test: st => st.flowers.some(f => !f.withered && !f.mut && f.stage === 'bloom' && pct(f.q) >= 100 && f.startQ != null && f.startQ <= 0.8) },   // 10-24: 화원 꽃은 100%로 와서 너무 쉬웠음 (QA 1회차)
  t_spring4: { name: '네 번째 봄', tier: 'g', cond: '4년차 3월을 맞기', hint: '봄을 네 번 맞은 정원', test: st => yearOf(st, calendar(st.virtual)) >= 4 },
  t_complete: { name: '도감을 채운 정원사', tier: 'g', cond: '도감 모든 칸', hint: '빈칸이 하나도 없는 책', test: st => dexCount(st) >= dexTotal(st) },
  // P23-03 오래 하는 정원사를 위한 어려운 숨은 칭호 (10-24)
  t_guests: { name: '손님의 편지', tier: 'g', cond: '손님 주문 30번 들어주기', hint: '쪽지를 서른 번 읽은 찻집', test: st => S(st, 'orders') >= 30 },
  t_honey: { name: '꿀 열네 병', tier: 'g', cond: '꿀 도감 14칸', hint: '꽃마다 다른 단맛', test: st => honeyCount(st) >= HONEY_KEYS.length },
  t_deep: { name: '깊은 굴의 광부', tier: 'g', cond: '광산 지하 20층까지', hint: '빛이 닿지 않는 곳까지', test: st => !!st.mine && st.mine.deepest >= MINE_DEEPEST },
  t_score: { name: '빛나는 한 해', tier: 'g', cond: '한 해 정원 점수 250점', hint: '스스로를 넘어선 해', test: st => (st.bestScore || 0) >= 250 },
  // P20-16 덤 칭호 (10-27): 구글 로그인 · 드라이브 저장 보상. 로그인할 수 없는 곳(앱 안 브라우저 등)도 있어서 칭호 수 · 꾸밈 도감 칸에는 넣지 않고 따로 셈
  t_cloud: { name: '구름 정원사', tier: 'f', extra: true, cond: '구글 드라이브에 정원을 맡기기', hint: '정원을 구름 위에도 둔 사람' },
  // P28-08-04 철마다 숨은 칭호 (M3-3 10-30): 새 철은 고르는 것이라 덤 칭호로 — 칭호 19개 · 꾸밈 도감 칸에 넣지 않음(안 해도 손해 없음). 새 철을 시작할 때 seasonStart가 줌
  t_season2: { name: '두 번째 봄', tier: 'f', extra: true, season: 2, cond: '새 철을 처음 시작 (2철)', hint: '비운 정원에 다시 씨앗을 뿌린 사람' },
  t_season3: { name: '세 철의 정원사', tier: 'g', extra: true, season: 3, cond: '3철을 시작', hint: '바람개비가 세 번 돈 정원' },
  t_season5: { name: '다섯 철을 건넌 사람', tier: 'g', extra: true, season: 5, cond: '5철을 시작', hint: '징검돌 다섯 개를 건너온 사람' },
  // P30-04-01 길 칭호 (L2-1 10-30): 그 길로 한 철을 마치면(다음 철을 시작할 때) seasonStart가 줌 — 고르는 것이라 덤 칭호
  t_path_flower: { name: '꽃길을 걸은 사람', tier: 'f', extra: true, path: 'flower', cond: '🌸 꽃길로 한 철을 마치기', hint: '꽃잎 깔린 길을 끝까지 걸은 사람' },
  t_path_tea: { name: '찻길을 걸은 사람', tier: 'f', extra: true, path: 'tea', cond: '🍵 찻길로 한 철을 마치기', hint: '찻집 등불 아래 한 철을 보낸 사람' },
  t_path_earth: { name: '흙길을 걸은 사람', tier: 'f', extra: true, path: 'earth', cond: '⛏️ 흙길로 한 철을 마치기', hint: '흙을 갈고 굴을 판 한 철' },
  // P36-05 🧬 돌연변이 칭호 (10-30): 운에 닿는 것이라 덤 칭호로 — 칭호 19개 · 꾸밈 도감 칸에 넣지 않음. checkJournal이 줌
  t_mut5: { name: '달빛에 홀린 정원사', tier: 'f', extra: true, mut: true, cond: '🧬 돌연변이 꽃 5종을 보기', hint: '달빛 아래 낯선 꽃을 다섯 번 본 사람', test: st => mutDexCount(st) >= 5 },
  t_mut39: { name: '기이한 정원', tier: 'g', extra: true, mut: true, cond: '🧬 돌연변이 도감 39칸', hint: '모든 꽃이 한 번씩 낯설어진 정원', test: st => mutDexCells(st) >= MUTANT_KEYS.length * 3 },
  // P53 🌹 프리저브드 덤 칭호 (11-01): 고르는 일이라 덤 칭호 — 칭호 19개 · 꾸밈 도감 칸에 넣지 않음. checkJournal이 줌
  t_pres13: { name: '시간을 멈춘 정원사', tier: 'g', extra: true, pres: true, cond: '🌹 꽃 13종을 프리저브드로 모으기', hint: '열세 송이를 유리 돔에 담은 사람', test: st => presCount(st) >= FLOWER_KEYS.length },
  t_presmut13: { name: '달빛을 가둔 사람', tier: 'g', extra: true, pres: true, cond: '🌹 🧬 변이 꽃 13종을 프리저브드로 모으기', hint: '낯선 꽃 열세 송이를 유리 돔에 가둔 사람', test: st => presMutCount(st) >= MUTANT_KEYS.length },
  t_jar13: { name: '유리 관 수집가', tier: 'g', extra: true, mut: true, cond: '🫙 돌연변이 13종을 유리 관에 담기', hint: '선반 가득 유리 관이 빛나는 집', test: st => n0(st.dex.mutjar) >= MUTANT_KEYS.length },
};
const TITLE_KEYS = Object.keys(TITLES).filter(k => !TITLES[k].extra);       // 모으는 칭호 19개 (덤 칭호는 EXTRA_TITLE_KEYS)
const EXTRA_TITLE_KEYS = Object.keys(TITLES).filter(k => TITLES[k].extra);
const PRES_TITLE_KEYS = Object.keys(TITLES).filter(k => TITLES[k].pres);    // P53 🌹 프리저브드 덤 칭호 둘
const chapterQuests = key => CHAPTERS.find(c => c.key === key).quests;
const chapterDone = (st, key) => chapterQuests(key).every(q => st.journal.done[q.key] != null);
// P19-03 장이 열리는 순서: 0장은 처음부터, 1장은 첫걸음을 마치면(1장 퀘스트를 이미 했거나 2년차여도), 2~5장은 1장을 마치면, 6장은 2년차 3월부터
function chapterOpen(st, key) {
  const yr = yearOf(st, calendar(st.virtual));
  if (key === 'c0') return true;                                       // 0장 첫 방문은 처음부터
  if (key === 'c1') return !!(st.guide && (st.guide.celebrated || st.guide.hidden)) ||   // 첫걸음을 닫아도 1장 (QA 8회차)
    yr >= 2 || seasonN(st) >= 2 || chapterQuests('c1').some(q => q.test(st));   // P28-08-02 새 철은 해 번호가 1부터라 철로도 봄
  if (key === 'c6') return yr >= 2 || seasonN(st) >= 2;
  return chapterDone(st, 'c1');
}
function giveTitle(st, k, cal, ctx, silent) {
  if (st.titles[k] != null) return false;
  st.titles[k] = cal.abs;
  if (!(st.dex.deco && st.dex.deco['t:' + k])) addDeco(st, 't:' + k);   // P17-16-06 칭호 문장 장식
  if (!silent) {
    const quiet = slowView(st), lc = quiet ? null : ctx;                  // 느긋하게 보기 (P28-02): 일지 · 도감에만 조용히 — 알림 · 창 없음
    addLog(st, 9, `🏅 새 칭호: ${TITLES[k].name}`, lc);
    if (!quiet) (st._newTitles = st._newTitles || []).push(k);           // 화면이 얻는 연출을 띄움 (P19-05-06)
    const hb = ALL_BLEND_KEYS.find(b => BLENDS[b].hidden === k);
    if (hb) addLog(st, 9, `📖 숨은 레시피가 열렸어요: ${BLENDS[hb].name}`, lc);
  }
  return true;
}
// 지금 상태로 퀘스트 · 칭호를 판정. 예전 저장(도감일지 전)은 처음 한 번 조용히 소급하고 한 줄만 남김 (P19-07-03)
function checkJournal(st, ctx) {
  const migrate = !st.journal;
  if (migrate) st.journal = { done: {} };
  st.titles = st.titles || {}; st.stats = st.stats || {}; if (st.titleOn === undefined) st.titleOn = null;
  const cal = calendar(st.virtual);
  let nq = 0, nt = 0;
  for (let pass = 0; pass < 2; pass++) {                                // 칭호로 열리는 것이 있어 두 번
    for (const c of CHAPTERS) {
      if (!chapterOpen(st, c.key)) continue;
      for (const q of c.quests) {
        if (st.journal.done[q.key] != null || !q.test(st)) continue;
        st.journal.done[q.key] = cal.abs; nq++; addXp(st, 'quest', 1, migrate ? null : ctx);   // P28-05-01
        if (!migrate) addLog(st, 9, `📜 퀘스트를 마쳤어요 · ${questName(q, st)}`, slowView(st) ? null : ctx);   // 느긋하게 보기면 알림 없이 일지에만 (P28-02)
      }
      if (chapterDone(st, c.key) && giveTitle(st, c.title, cal, ctx, migrate)) nt++;
    }
    for (const k of TITLE_KEYS) if (TITLES[k].test && TITLES[k].test(st) && giveTitle(st, k, cal, ctx, migrate)) nt++;
    for (const k of MUT_TITLE_KEYS) if (TITLES[k].test(st) && giveTitle(st, k, cal, ctx, migrate)) nt++;   // P36-05 (덤 칭호)
    for (const k of PRES_TITLE_KEYS) if (TITLES[k].test(st) && giveTitle(st, k, cal, ctx, migrate)) nt++;  // P53 🌹 (덤 칭호)
  }
  if (migrate && (nq || nt)) addLog(st, 11, `📔 도감일지에 지난 기록 ${nq}개 · 칭호 ${nt}개를 옮겨 적었어요`, ctx);
}
function setTitleOn(st, k) {
  if (k != null && st.titles[k] == null) return no('아직 얻지 못한 칭호예요');
  st.titleOn = k;
  return ok(k ? `「${TITLES[k].name}」 칭호를 대표로 걸었어요` : '대표 칭호를 내렸어요');
}
// ---------------------------------------------------------------- 🏅 칭호 효과 · ⬆️ 위 칸 장식 (P52, 11-01 사용자 확정)
// 대표 칭호(titleOn) 하나만 일함. knob = 엔진 손잡이 이름, mul = 곱하는 값(줄이는 것은 1보다 작게), when = 그때만 (없으면 늘)
// 🔄 P52-04 ②: 🫖 블렌드 연구가는 찻값(×1.02, 위 칸이면 연말 +12%) 대신 블렌드 찻잔 판매 경험치로 · 💎 흙길(보석)은 그대로
// 숨은 효과: ⬆️ 위 칸에 장식이 있으면 칭호 효과 전체가 +10% (P52-05, 11-01 사용자 "칭호로 달면 효과가 기존 + 10%" — 물 2달 → 2.2달 → 2.42달 · 줄이는 것은 ÷1.1) — 화면 · 매뉴얼에 숫자로 쓰지 않음
const TOP_BOOST = 1.1;
const isSpring = st => [3, 4, 5].includes(calendar(st.virtual).month);
const TITLE_PERKS = {
  t_visit: { knob: 'gift', mul: 1.1, text: '🌅 아침 용돈이 조금 더 와요' },
  t_first: { knob: 'grow', mul: 1.1, when: (st, f) => f.stage === 'germ' || f.stage === 'sprout', text: '🌱 싹 · 새싹이 조금 더 빨리 자라요' },
  t_land: { knob: 'landNeg', mul: 0.9, text: '🧭 땅이 안 맞아도 품질이 덜 떨어져요' },
  t_water: { knob: 'water', mul: 1.1, text: '💧 준 물이 조금 더 오래가요' },
  t_blend: { knob: 'blendXp', mul: 1.2, text: '🫖 블렌드 찻잔을 팔면 경험치가 조금 더 와요' },
  t_cafe: { knob: 'winter', mul: 1.1, text: '❄️ 겨울 찻값이 조금 더 올라요' },
  t_tree: { knob: 'grow', mul: 1.05, when: (st, f) => FLOWERS[f.type].life === 'tree', text: '🌳 동백 · 매화 · 납매가 조금 더 빨리 자라요' },
  t_sleep: { knob: 'dry', mul: 1.1, when: st => calendar(st.virtual).frozen, text: '🌙 꽃잠에 꽃방이 조금 더 빨리 말라요' },
  t_record: { knob: 'xp:year', mul: 1.1, text: '🏅 한 해 평가 경험치가 조금 더 와요' },
  t_hat: { knob: 'hat', mul: 1.05, text: '✨ 햇차 값이 조금 더 나와요' },
  t_regular: { knob: 'xp:sell', mul: 1.1, text: '☕ 찻잔을 팔면 경험치가 조금 더 와요' },
  t_lands: { knob: 'adapt', mul: 1.1, text: '🪴 심거나 옮긴 꽃이 조금 더 오래 적응해요' },
  t_miracle: { knob: 'prop', mul: 0.9, text: '🌾 번식한 씨앗 품질이 덜 깎여요' },
  t_spring4: { knob: 'grow', mul: 1.05, when: st => isSpring(st), text: '🌸 봄에 꽃이 조금 더 빨리 자라요' },
  t_complete: { knob: 'xp', mul: 1.05, text: '🌱 정원 등급 경험치가 조금 더 와요' },
  t_guests: { knob: 'xp:order', mul: 1.1, text: '💌 주문을 들어주면 경험치가 조금 더 와요' },
  t_honey: { knob: 'honey', mul: 1.02, text: '🍯 꿀 넣은 찻잔 값이 조금 더 나와요' },
  t_deep: { knob: 'descend', mul: 1.1, text: '🪜 층을 내려가면 돈이 조금 더 와요' },
  t_score: { knob: 'xp:weekly', mul: 1.1, text: '🗓️ 주간 목표 경험치가 조금 더 와요' },
  t_cloud: { knob: 'catchup', mul: 1.1, text: '☁️ 비운 동안 따라잡는 시간이 조금 더 길어요' },
  t_season2: { knob: 'pantrySpeed', mul: 1.1, text: '🧺 정원 저장고가 조금 더 빨리 차요' },
  t_season3: { knob: 'pantryCap', mul: 1.1, text: '🧺 정원 저장고 칸이 조금 더 많아요' },
  t_season5: { knob: 'grow', mul: 1.05, text: '🌱 모든 꽃이 조금 더 빨리 자라요' },
  t_path_flower: { knob: 'qPos', mul: 1.05, text: '🌸 꽃 품질이 조금 더 빨리 올라요' },
  t_path_tea: { knob: 'cupSpeed', mul: 1.1, text: '🍵 손님이 찻잔을 조금 더 빨리 사 가요' },
  t_path_earth: { knob: 'jewel', mul: 1.1, text: '💎 광산 보석이 조금 더 자주 나와요' },
  t_mut5: { knob: 'mutBase', mul: 1.1, text: '🧬 돌연변이 꽃이 조금 더 자주 나와요' },
  t_mut39: { knob: 'mutSleep', mul: 1.1, text: '🏮 달 초롱 · 🏯 정자의 덤이 조금 더 커요' },
  t_jar13: { knob: 'mutJar', mul: 1.1, text: '🫙 유리 관의 덤이 조금 더 커요' },
  t_pres13: { knob: 'presSpeed', mul: 1.1, text: '🌹 프리저브드가 조금 더 빨리 완성돼요' },      // P53
  t_presmut13: { knob: 'presValue', mul: 1.05, text: '🌹 프리저브드 값이 조금 더 나와요' },        // P53
};
// 손잡이 knob에 곱할 값: 대표 칭호가 그 손잡이면 mul(위 칸이면 늘리는 것 ×1.1 · 줄이는 것 ÷1.1), 아니면 1. arg: when에 넘길 꽃 등
function titlePerk(st, knob, arg) {
  const k = st && st.titleOn, P = k && TITLE_PERKS[k];
  if (!P || P.knob !== knob || (P.when && !P.when(st, arg))) return 1;
  if (!topDecoOf(st)) return P.mul;
  return P.mul >= 1 ? P.mul * TOP_BOOST : P.mul / TOP_BOOST;
}
const titlePerkText = k => (TITLE_PERKS[k] && TITLE_PERKS[k].text) || '';   // 칭호 카드 · 새 칭호 창 한 줄 (숫자 없음 — 느긋하게 보기도 같음)
// ⬆️ 위 칸: st.topDeco = 장식 id | null. 단 장식은 st.decos에 x · y null로 남음(창고 칸에 있되 위 칸에 달린 것). 없어진 id면 null로 봄
const topDecoOf = st => { const id = st && st.topDeco; return id == null ? null : (st.decos || []).find(d => d.id === id) || null; };
function setTopDeco(st, id) {
  const d = (st.decos || []).find(z => z.id === id);
  if (!d) return no('달 장식이 없어요');
  if (d.key === 'pres') return no('프리저브드는 대표 장식으로 달 수 없어요');   // P84-01 창고 · 정원 사이만 오감
  if (st.topDeco === id && d.x == null) return no('이미 대표 장식이에요');
  const name = decoInfo(decoKey(d)).name, was = d.x != null, hn = (d.honey || []).length;
  if (was) { if (hn) takeHoney(st, d.id); d.x = null; d.y = null; }   // 정원에서 빠짐 — 정원 효과(둘레 · 이달의 장식 · 공방)는 쉼 · 벌통 꿀은 storeDeco처럼 함께 거둠
  const old = topDecoOf(st);                                          // 있던 장식은 창고로 (x · y가 이미 null이라 위 칸 표시만 뗌)
  st.topDeco = id;
  return ok(`🎀 ${josa(name, '을/를')} 대표 장식으로 달았어요${was ? ' · 정원에서 뺐어요' : ''}${old && old !== d ? ` · ${josa(decoInfo(decoKey(old)).name, '은/는')} 창고로` : ''}${hn ? ` · 꿀 ${hn}병은 창고 꿀 칸으로` : ''}`, { deco: d, old: old && old !== d ? old : null });
}
function clearTopDeco(st) {
  const d = topDecoOf(st);
  st.topDeco = null;
  if (!d) return no('대표 장식이 없어요');
  return ok(`${josa(decoInfo(decoKey(d)).name, '을/를')} 대표 장식에서 내려 창고에 넣었어요`);
}

// ---------------------------------------------------------------- 💌 손님 주문 · 기념품 (P23-01, 10-24)
// 찻집이 열린 달마다 주문 쪽지 3장(+ 놓은 등급 장식 가짓수, P33-04). 맞는 찻잔이 팔리면(손으로든 저절로든) ✓ · 등급 경험치. 돈 보상 없음, 놓쳐도 벌 없음
// P34 (10-30 사용자 요청): 기념품(12가지를 다 모은 뒤엔 비료 한 줌)은 🌙 꽃잠에 들어준 주문만 — 찻집이 매달 열려 기념품이 너무 빨리 차지 않게
const MEMENTOS = {
  hanky: { name: '꽃수 손수건', ic: '🧣' }, button: { name: '나무 단추', ic: '🔘' }, postcard: { name: '바다 엽서', ic: '🖼️' }, shell: { name: '분홍 조개껍데기', ic: '🐚' },
  feather: { name: '파랑새 깃털', ic: '🪶' }, acorn: { name: '반들 도토리', ic: '🌰' }, ribbon: { name: '노란 리본', ic: '🎀' }, stamp: { name: '옛 우표', ic: '📮' },
  bookmark: { name: '꽃잎 책갈피', ic: '🔖' }, marble: { name: '유리구슬', ic: '🔮' }, bell: { name: '작은 종', ic: '🔔' }, candy: { name: '별사탕', ic: '⭐' },
  // P30-06-03 🐾 특별 손님이 세 번째로 온 날 남기는 기념품 (L1-8 10-30) — visitor: 그 손님 키. 주문 기념품 뽑기에는 넣지 않음
  coaster: { name: '도토리 찻잔 받침', ic: '🪵', visitor: 'hedgehog' }, titstring: { name: '박새 깃털 끈', ic: '🪢', visitor: 'tit' }, honeycomb: { name: '벌집 조각', ic: '🍯', visitor: 'beekid' }, yarn: { name: '털실 방울', ic: '🧶', visitor: 'cat' },
  wingmark: { name: '나비 날개 책갈피', ic: '📑', visitor: 'butterfly' }, lotusbrella: { name: '연잎 우산', ic: '☂️', visitor: 'frog' }, snowbutton: { name: '눈 결정 단추', ic: '❄️', visitor: 'snowkid' }, quill: { name: '부엉이 깃털 펜', ic: '🖋️', visitor: 'owl' },
  // P30-04-01 길 손님 기념품 (L2-1 10-30)
  dewjar: { name: '이슬 유리병', ic: '🫙', visitor: 'snail' }, teaspoon: { name: '나무 찻숟가락', ic: '🥄', visitor: 'squirrel' }, pebble: { name: '반짝 조약돌', ic: '🪨', visitor: 'badger' },
  clover: { name: '네잎 클로버', ic: '🍀', visitor: 'rabbit' },   // P30-03 🌳 숲 손님 기념품
};
const MEMENTO_KEYS = Object.keys(MEMENTOS);
const ORDER_MEMENTO_KEYS = MEMENTO_KEYS.filter(k => !MEMENTOS[k].visitor);   // 손님 주문이 두고 가는 12가지 (특별 손님 것은 빼고 — 주문 뽑기 차례 그대로)
const mementoCount = st => Object.keys((st.dex && st.dex.memento) || {}).filter(k => MEMENTOS[k]).length;
const orderText = o => o.kind === 'tea' ? `★${o.stars} 이상 ${FLOWERS[o.type].tea}` : o.kind === 'recipe' ? '레시피 블렌드 아무거나' : o.kind === 'honey' ? '꿀 넣은 차 아무거나' : o.kind === 'any' ? '차 아무거나 한 잔' : '🍃 햇차 아무거나';
function orderMatch(o, c) {
  if (o.done) return false;
  if (o.kind === 'tea') return c.kind === 'tea' && c.type === o.type && stars(c.q) >= o.stars;
  if (o.kind === 'recipe') return c.kind === 'blend' && !!c.recipe;
  if (o.kind === 'honey') return !!c.honey;
  if (o.kind === 'any') return true;              // 아무 차 한 잔 (QA 6회차: 처음 온 사람도 들어줄 수 있게)
  return !!c.hat;
}
// P33-04 (10-30 사용자 요청): 주문 쪽지는 달마다 3장 + 정원에 놓은 🌱 등급 장식 가짓수(같은 장식 여럿은 한 번) — 최대 3 + 6 = 9장. 주문은 돈이 아니라 경험치 · 기념품이라 P17-14 밖
const ORDER_BASE = 3;
const orderBonus = st => GRADE_DECO_KEYS.filter(k => placedOf(st, k).length).length;
const orderMax = st => ORDER_BASE + orderBonus(st);
function makeOrders(st, cal) {
  const rnd = mineRng(hashStr(`${st.gardenId || 'g'}|order|${cal.abs}`));
  // 차 주문은 만든 적 있는 티백 꽃 중에서 (없으면 이웃의 화분 꽃)
  const known = FLOWER_KEYS.filter(k => (st.dex.teabag || {})[k] || st.teas.some(x => x.type === k));
  const pool = known.length ? known : [firstFlower(st)];
  // 처음엔 들어줄 수 있는 것만 (QA 6회차): 레시피는 블렌드를 만든 적이 있으면, 햇차는 ★5를 본 적이 있으면, 꿀은 거둔 적이 있으면
  const kinds = ['tea', 'any'];
  if (Object.keys(st.dex.blend || {}).length) kinds.push('recipe');
  if (S(st, 'hatCups') > 0 || st.teas.some(x => x.hat) || st.dried.some(p => isHat(p.q)) || st.petals.some(p => isHat(p.q))) kinds.push('hat');
  if (Object.keys(st.dex.honey || {}).length) kinds.push('honey');
  const out = [], key = o => o.kind === 'tea' ? `tea|${o.type}` : o.kind;   // 같은 꽃 차 · 같은 종류는 한 장만 (QA 5회차)
  const max = orderMax(st);
  for (let i = 0, tries = 0; out.length < max && tries < 40 + max * 10; tries++) {
    const kind = i === 0 ? 'tea' : kinds[Math.floor(rnd() * kinds.length)];
    const o = kind === 'tea' ? { kind, type: pool[Math.floor(rnd() * pool.length)], stars: 3 + Math.floor(rnd() * 2), done: false } : { kind, done: false };
    if (out.some(x => key(x) === key(o))) continue;
    out.push(o); i++;
  }
  st.orders = { abs: cal.abs, list: out };
}
function fillOrder(st, c, cal) {
  const os = st.orders && st.orders.list; if (!os) return null;
  const hard = x => x.kind === 'tea' ? 10 + x.stars : x.kind === 'honey' ? 5 : x.kind === 'recipe' ? 4 : x.kind === 'hat' ? 3 : 1;   // 까다로운 쪽지부터 (QA 5회차)
  const o = os.filter(x => orderMatch(x, c)).sort((a, b) => hard(b) - hard(a))[0]; if (!o) return null;
  o.done = true; bump(st, 'orders');
  if (!(cal || calendar(st.virtual)).frozen) { addLog(st, 15, `${orderText(o)} 주문을 들어줬어요`); return { order: o, gift: null }; }   // P34 평달 · 겨울: ✓ · 경험치만
  st.dex.memento = st.dex.memento || {};
  const left = ORDER_MEMENTO_KEYS.filter(k => !st.dex.memento[k]);
  let gift = null;
  if (left.length) { const rnd = mineRng(hashStr(`${st.gardenId || 'g'}|memento|${S(st, 'orders')}`)); gift = left[Math.floor(rnd() * left.length)]; st.dex.memento[gift] = true; }
  else addFert(st, 1);                            // 기념품을 다 모은 뒤엔 손님이 비료 한 줌 (QA 6회차)
  addLog(st, 15, gift ? `${orderText(o)} 주문을 받은 손님이 ${josa(MEMENTOS[gift].name, '을/를')} 두고 갔어요` : `${orderText(o)} 주문을 받은 손님이 고맙다며 비료 한 줌을 두고 갔어요`);
  return { order: o, gift };
}

// ---------------------------------------------------------------- 💐 이웃에게 선물 · ✉️ 답장 편지 (P26, 10-24)
// 오래 하면 남는 돈을 해마다 되풀이해 쓰는 곳. 종류마다 한 해에 한 번, 다음 달에 답장 편지(12통 도감) + 답례품 하나 (P26-06, 10-27)
const GIFTS = {
  bouquet: { name: '꽃다발', ic: '💐', price: 8000, desc: '이웃집 식탁에 놓을 꽃다발' },
  teabox: { name: '차 한 상자', ic: '🍵', price: 15000, desc: '고운 차 상자를 사서 보내요' },
  party: { name: '정원 잔치', ic: '🎉', price: 40000, desc: '이웃을 불러 차와 과자를 나눠요' },
};
const GIFT_KEYS = Object.keys(GIFTS);
const LETTERS = {
  florist: { from: '꽃집 할머니', likes: 'seed', gift: 'bouquet', text: '꽃다발 고마워요. 식탁에 두니 아침이 환해졌어요. 다음 봄에도 좋은 씨앗을 골라 둘게요.' },
  postman: { from: '우체부 아저씨', likes: 'supply', text: '배달 길에 정원을 지나는 게 하루의 즐거움이에요. 덕분에 저도 화분 하나를 들였어요.' },
  kid: { from: '옆집 꼬마', likes: 'mine', gift: null, text: '선물 고마워요! 저도 커서 정원사가 될래요. 꽃 그림을 그려서 넣었어요.' },
  regular: { from: '찻집 단골 할아버지', likes: 'honey', gift: 'teabox', text: '보내 준 차를 우려 아내와 마셨어요. 오래전 함께 걷던 꽃길 이야기를 나눴어요.' },
  librarian: { from: '도서관 사서', likes: 'seed', text: '책 사이에 꽃잎을 끼워 두었어요. 펼칠 때마다 정원 냄새가 날 거예요.' },
  beekeeper: { from: '양봉가 이웃', likes: 'honey', text: '벌들이 요즘 정원 쪽으로 자주 가요. 좋은 꽃이 많다는 뜻이겠지요.' },
  baker: { from: '빵집 사장님', likes: 'honey', gift: 'teabox', text: '나눠 준 차에 맞춰 꽃잎 쿠키를 구워 봤어요. 다음엔 제가 들고 갈게요.' },
  bori: { from: '강아지 보리네', likes: 'mine', text: '보리가 정원 앞에서 늘 멈춰요. 꽃 냄새 맡는 게 제일 좋은가 봐요.' },
  newcomer: { from: '이사 온 새 이웃', likes: 'deco', gift: 'bouquet', text: '처음 받은 선물이 꽃이라 이 동네가 금방 좋아졌어요. 고마워요.' },
  teacher: { from: '학교 선생님', likes: 'seed', text: '아이들과 정원 이야기를 나눴어요. 꽃이 땅을 바꾼다는 말에 다들 눈이 반짝였어요.' },
  photo: { from: '사진관 주인', likes: 'deco', gift: 'party', text: '잔치 때 찍은 사진을 한 장 넣었어요. 모두 웃고 있네요.' },
  faraway: { from: '바다 건너 친구', likes: 'seed', gift: null, text: '멀리서도 정원 소식이 반가워요. 저도 창가에 작은 화분을 하나 두었어요.' },
  // P22-05 첫 방문 꾸러미와 함께 오는 편지 — 답장이 아니라 답장 뽑기 · 편지 수(12통)에 넣지 않음
  welcome: { from: '꽃집 할머니', welcome: true, text: '정원에 온 걸 환영해요. 화분과 함께 말린 꽃잎과 티백을 넣었어요. 두 꽃잎을 섞어 차를 만들고, 찻집 문을 한 번 열어 첫 손님을 맞아 보세요.' },
};
const LETTER_KEYS = Object.keys(LETTERS).filter(k => !LETTERS[k].welcome);
const letterCount = st => Object.keys((st.dex && st.dex.letter) || {}).filter(k => LETTER_KEYS.includes(k)).length;
const giftsOf = st => { const y = yearOf(st, calendar(st.virtual)); if (!st.gifts || st.gifts.year !== y) st.gifts = { year: y, sent: {} }; return st.gifts; };
function sendGift(st, k, ctx) {
  const G = Object.prototype.hasOwnProperty.call(GIFTS, k) ? GIFTS[k] : null;
  if (!G) return no('없는 선물이에요');
  const g = giftsOf(st);
  if (g.sent[k]) return no(`${josa(G.name, '은/는')} 올해 벌써 보냈어요 · 다음 해에 또 보내요`);
  if (!(st.money >= G.price)) return no('돈이 모자라요');
  st.money -= G.price; g.sent[k] = true;
  bump(st, 'gifts');
  (st.letterPending = st.letterPending || []).push({ gift: k, due: calendar(st.virtual).abs + 1 });
  addLog(st, 17, `이웃에게 ${josa(G.name, '을/를')} 보냈어요 · 다음 6시에 답장이 와요`, ctx);
  return ok(`이웃에게 ${josa(G.name, '을/를')} 보냈어요 · 다음 6시에 답장이 와요`);
}
// 이 선물을 보내면 새 편지가 올지 (보낸 선물에 맞는 편지나 공통 편지가 남았는지) — 화면 안내용 (QA 11회차)
const letterLeftFor = (st, k) => LETTER_KEYS.some(x => !(st.dex.letter || {})[x] && (!LETTERS[x].gift || LETTERS[x].gift === k));
// 🎁 답례품 (P26-06, 10-27 사용자 요청): 답장마다 하나. 선물값이 클수록 좋은 칸에서 뽑고, 기대 가치는 선물값의 25% 아래 (P26-07)
// 돈이 다시 돈을 벌면 안 됨(P17-14): 팔 수 있는 것(차 · 꽃잎)과 수입을 늘리는 장식(벌통 · 빗물 통 · 장치)은 넣지 않음
// cat: seed(창고) · supply(창고 용품) · honey(창고 꿀 — P65-01 예전 찻집 꿀 선반) · mine(광산 주머니) · deco(창고 장식, 한 번 가진 것은 같은 등급의 다른 것으로)
const ANNUALS = ['chamomile', 'bpea', 'hibiscus', 'marigold', 'celosia'];
const RETURNS = {
  bouquet: [   // 💐 작은 것
    { cat: 'seed', keys: ANNUALS, n: 3, w: 20 },
    { cat: 'supply', keys: ['fert'], n: 10, w: 15 },
    { cat: 'supply', keys: ['water'], n: 20, w: 15 },
    { cat: 'honey', n: 2, w: 10 },
    { cat: 'mine', keys: ['stone'], n: 5, w: 10 },
    { cat: 'mine', keys: ['dirt'], n: 10, w: 10 },
    { cat: 'mine', keys: ['shell'], n: 1, w: 5 },
    { cat: 'deco', keys: ['stepstone', 'fence'], n: 1, w: 15 },
  ],
  teabox: [    // 🍵 보통
    { cat: 'seed', keys: ['lavender', 'gamguk', 'dongbaek', 'lotus'], n: 1, w: 18 },
    { cat: 'seed', keys: ANNUALS, n: 6, w: 10 },
    { cat: 'supply', keys: ['fert'], n: 20, w: 12 },
    { cat: 'supply', keys: ['basket', 'hoe', 'shears'], n: 2, w: 10 },
    { cat: 'honey', n: 4, w: 12 },
    { cat: 'mine', keys: ['stone'], n: 10, w: 8 },
    { cat: 'mine', keys: ['quartz'], n: 1, w: 6 },
    { cat: 'mine', keys: ['shell', 'fern', 'leaf', 'bone'], n: 1, w: 6 },
    { cat: 'deco', keys: ['pumpkin', 'snowman', 'chime', 'moonlamp'], n: 1, w: 18 },
  ],
  party: [     // 🎉 좋은 것 · 가끔 귀한 장식
    { cat: 'seed', keys: ['rose', 'jasmine', 'maehwa', 'napmae'], n: 1, w: 16 },
    { cat: 'supply', keys: ['fert'], n: 40, w: 12 },
    { cat: 'honey', n: 3, w: 12 },
    { cat: 'mine', keys: ['amber'], n: 3, w: 8 },
    { cat: 'mine', keys: ['oldseed'], n: 1, w: 8 },
    { cat: 'mine', keys: ['shell', 'fern', 'leaf', 'bone'], n: 2, w: 8 },
    { cat: 'deco', keys: ['birdhouse', 'basin', 'bench', 'stonelamp'], n: 1, w: 30 },
    { cat: 'deco', keys: ['jars', 'bonsai'], n: 1, w: 7 },
  ],
};
// 가치(원): 씨앗 · 용품 · 장식은 화원 값. 꿀 · 광산 재료는 팔지 않아 참고값 — 만들 수 있는 것의 값으로 어림 (돌 20 → 돌 물확 9,000 · 석영 → 꽃무늬 찻잔 등)
const RETURN_V = { honey: 300, stone: 450, dirt: 30, quartz: 1500, amber: 1000, oldseed: 2000, fossil: 1000 };
const returnBias = 2;                             // 답장한 이웃이 좋아하는 쪽(likes) 칸은 2배로 잘 나옴
function returnValue(re) {
  if (!re) return 0;
  const one = re.cat === 'seed' ? FLOWERS[re.key].price : re.cat === 'supply' ? SUPPLIES[re.key].price : re.cat === 'deco' ? DECOS[re.key].price
    : re.cat === 'honey' ? RETURN_V.honey : FOSSILS[re.key] ? RETURN_V.fossil : RETURN_V[re.key];
  return one * re.n;
}
const returnName = re => re.cat === 'seed' ? `${FLOWERS[re.key].name} ${FORM[FLOWERS[re.key].form].name}` : re.cat === 'supply' ? SUPPLIES[re.key].name
  : re.cat === 'honey' ? honeyName(re.key) : re.cat === 'mine' ? mineName(re.key) : decoInfo(re.key).name;
const returnText = re => re.cat === 'money' ? `💰 ${re.n.toLocaleString('ko-KR')}원` : `${returnName(re)} ×${re.n}`;
const RETURN_WHERE = { seed: '창고', supply: '창고', honey: '창고', mine: '광산 주머니', deco: '창고', money: '지갑' };
const returnKeys = (st, e) => e.cat === 'honey' ? HONEY_KEYS.filter(k => k === 'wild' || (st.dex.flower || {})[k])   // 꿀은 들꽃꿀이나 본 적 있는 꽃의 꿀
  : e.cat === 'deco' ? e.keys.filter(k => !(st.dex.deco || {})[k]) : e.keys;                                         // 장식은 아직 없는 것만
const pickW = (list, rng) => { const tot = list.reduce((a, x) => a + x.w, 0); let r = rng() * tot; for (const x of list) { r -= x.w; if (r < 0) return x; } return list[list.length - 1]; };
// 답례품 하나 뽑기 (주지는 않음). likes: 이웃이 좋아하는 칸. 고른 장식이 다 있으면 같은 등급의 더 싸거나 같은 장식 → 그것도 없으면 장식 아닌 칸에서 다시
function pickReturn(st, giftKey, likes, rng) {
  const table = RETURNS[giftKey]; if (!table) return null;
  const w = e => ({ e, w: e.w * (likes && e.cat === likes ? returnBias : 1) });
  let e = pickW(table.map(w), rng).e, keys = returnKeys(st, e);
  if (!keys.length && e.cat === 'deco') {
    const cap = Math.max(...e.keys.map(k => DECOS[k].price));
    keys = table.filter(x => x.cat === 'deco' && x !== e).flatMap(x => returnKeys(st, x)).filter(k => DECOS[k].price <= cap);
  }
  if (!keys.length) { e = pickW(table.filter(x => x.cat !== 'deco').map(w), rng).e; keys = returnKeys(st, e); }
  return { cat: e.cat, key: keys[Math.floor(rng() * keys.length)], n: e.n };
}
function giveReturn(st, re, ctx) {                // 알맞은 곳에 넣기
  if (re.cat === 'money') { st.money += re.n; return; }   // 📮 운영자 편지 돈 선물 (10-31)
  if (re.cat === 'seed') for (let i = 0; i < re.n; i++) st.items.push(newItem(st, re.key, 1, '답례품'));
  else if (re.cat === 'supply') st[re.key] = (st[re.key] || 0) + SUPPLIES[re.key].per * re.n;
  else if (re.cat === 'honey') { st.honey = st.honey || {}; st.honey[re.key] = (st.honey[re.key] || 0) + re.n; }   // 꿀 도감 · 올해 꿀은 직접 거둔 것만
  else if (re.cat === 'mine') { const m = st.mine = st.mine || newMine(); m.bag[re.key] = (m.bag[re.key] || 0) + re.n; }               // 광산 도감은 직접 판 것만
  else if (re.cat === 'deco') { const first = !(st.dex.deco || {})[re.key]; addDeco(st, re.key); if (first) addLog(st, 9, `도감에 등록: 🪴 ${DECOS[re.key].name}`, ctx); }
}
const LETTER_BOX_MAX = 60;
function deliverLetters(st, cal, ctx) {           // onSlot: 때가 된 답장
  const due = (st.letterPending || []).filter(p => cal.abs >= p.due); if (!due.length) return;
  st.letterPending = st.letterPending.filter(p => cal.abs < p.due);
  st.dex.letter = st.dex.letter || {};
  st.letterBox = st.letterBox || [];
  for (const p of due) {
    if (!GIFTS[p.gift]) continue;                 // 모르는 선물(손댄 파일)은 건너뜀 (QA 9회차)
    const left0 = LETTER_KEYS.filter(k => !st.dex.letter[k]);
    // 보낸 선물에 맞는 편지 → 어느 선물에나 맞는 편지 → 남은 아무 편지 (QA 9회차: 꽃다발에 차 이야기가 오던 것)
    const left = [left0.filter(k => LETTERS[k].gift === p.gift), left0.filter(k => !LETTERS[k].gift)].find(a => a.length) || [];   // 다른 선물 전용 편지는 주지 않음 (QA 10회차)
    let k = null;
    if (left.length) {
      k = left[Math.floor(mineRng(hashStr(`${st.gardenId || 'g'}|letter|${S(st, 'gifts')}|${p.gift}`))() * left.length)];
      st.dex.letter[k] = true;
      addLog(st, 17, `${LETTERS[k].from}에게서 답장이 왔어요 · 📖 도감 ✉️ 편지`, ctx);
    } else addLog(st, 17, `${josa(GIFTS[p.gift].name, '을/를')} 받은 이웃이 고맙다는 답장을 보냈어요`, ctx);
    // P26-06 답례품: ctx.rng(화면은 Math.random, 시뮬 · 테스트는 시드 rng). 없으면 정원 이름표로 정해지는 난수
    const rng = (ctx && ctx.rng) || mineRng(hashStr(`${st.gardenId || 'g'}|return|${S(st, 'gifts')}|${p.gift}|${cal.abs}`));
    const re = pickReturn(st, p.gift, k && LETTERS[k].likes, rng);
    if (re) {
      giveReturn(st, re, ctx);
      addLog(st, 17, `🎁 답례품 ${returnText(re)} · ${RETURN_WHERE[re.cat]}에 있어요`, ctx);
      if (ctx && ctx.live && ctx.toast) ctx.toast(`✉️ ${k ? LETTERS[k].from : '이웃'}의 답장 · 🎁 ${returnText(re)}`);
    }
    // 받은 편지함: 도감에서 다시 읽을 때 그때 받은 답례품을 보여 줌 · read는 화면이 편지를 띄우면 true
    st.letterBox.push({ k, gift: p.gift, re, y: yearOf(st, cal), m: cal.month, read: false, at: st.virtual });   // at: P31-01 ✉️ 편지함 안 읽은 것
    trimLetterBox(st);                            // 가득하면 밀어냄 (P29-03: 선물을 안 받은 📮 편지는 남김)
  }
}
const letterOf = (st, k) => (st.letterBox || []).find(b => b.k === k) || null;
function returnEV(giftKey, likes, owned) {    // 기대 가치(원) — 체크리스트 표 · 테스트용. owned: 장식을 다 가진 정원으로 셈
  const table = RETURNS[giftKey], w = e => e.w * (likes && e.cat === likes ? returnBias : 1);
  const avg = e => { const ks = e.cat === 'honey' ? ['wild'] : e.keys; return ks.reduce((a, key) => a + returnValue({ cat: e.cat, key, n: e.n }), 0) / ks.length; };
  const list = owned ? table.filter(e => e.cat !== 'deco') : table;
  const tot = list.reduce((a, e) => a + w(e), 0);
  return list.reduce((a, e) => a + w(e) * avg(e), 0) / tot;
}

// ---------------------------------------------------------------- 🏅 한 해 정원 평가 (P23-02, 10-24)
// 쉼달 기록 때 점수 — 땅 가짓수 ×10 · 살아 있는 꽃(80까지) · 올해 핀 꽃 가짓수 ×4 · 만든 블렌드 가짓수 ×3 · 거둔 꿀 가짓수 ×2 · 정원에 놓은 장식(20까지) ×3 · 올해 손님 주문 ×5. 남과 겨루지 않고 내 기록과만
// 해마다 다시 채우는 것 (QA 6회차: 도감 늘어난 칸은 오래 할수록 0이라 점수가 해마다 떨어졌음) — 올해 핀 꽃 · 만든 블렌드 · 거둔 꿀 가짓수
function seeYear(st, k, v) { const y = st.yearSeen = st.yearSeen || { bloom: {}, blend: {}, honey: {} }; (y[k] = y[k] || {})[v] = true; }
function yearScore(st) {
  const counts = landCounts(st), lands = LAND_KEYS.filter(k => k !== 'barren' && counts[k] > 0).length;
  const alive = Math.min(80, st.flowers.filter(f => !f.withered).length);
  const prev = st.records[0], ys = st.yearSeen || {};
  const decos = Math.min(20, (st.decos || []).filter(d => d.x != null && d.key !== 'pres').length);   // P84-02 🌹 프리저브드는 놓았다 팔 수 있어 점수에 안 듦
  const orders = S(st, 'orders') - ((prev && prev.orders) || 0);
  const gifts = Math.min(6, S(st, 'gifts') - ((prev && prev.giftsTotal) || 0));   // 기록 사이(꽃잠 + 새해)에 최대 6번 (QA 10회차)   // 꽃잠에 보낸 것도 다음 기록에 (QA 9회차)
  const parts = { lands: lands * 10, flowers: alive, bloom: n0(ys.bloom) * 4, blend: n0(ys.blend) * 3, honey: n0(ys.honey) * 2, decos: decos * 3, orders: orders * 5, gifts: gifts * 10 };   // gifts: P26-03
  return { total: Object.values(parts).reduce((a, b) => a + b, 0), parts, orders: S(st, 'orders'), giftsTotal: S(st, 'gifts') };
}

