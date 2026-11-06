// 도리의 정원 — 게임 규칙 엔진 조각 10/10: 저장 파일 · 예전 저장 보정(MIGRATIONS · onOpen · migrateSave) · ☁️ 구글 드라이브
// P66(11-03): 예전 한 파일 engine.js(줄 3544 ~ 3904)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
// ⚠️ MIGRATIONS는 이 파일에 한 배열로 · 순서 · 글자 그대로 (st.mig가 몇 번째까지 했는지 셈 — 기능 조각 옆으로 흩지 않음). 보정 함수가 다른 조각의 함수
//   (newBoard · MINE_W · MINE_H · MINE_MAX_E · SPEED_V · seedQ · trimLetterBox · pct · yearOf …)를 부르니, 그 함수를 바꾸면 옛 저장을 옮긴 결과도 바뀌어요 (tests/snapshot.test.js가 봄)
'use strict';
// ---------------------------------------------------------------- 저장 파일 (P20-02 · 03, 10-17)
// 파일과 (나중의) 구글 드라이브가 같은 형식을 씀. check는 깨짐 확인용 해시일 뿐 치트 방지가 아님
const SAVE_APP = 'doris-garden', SAVE_FORMAT = 1;
function hashText(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
// 정원마다 붙는 이름표: 여러 기기에서 같은 정원인지 가릴 때 씀 (P20-06). 시드 rng를 쓰지 않아 땅 생성 · 시뮬레이션에 영향 없음
const newGardenId = () => Date.now().toString(36) + '-' + Math.floor(Math.random() * 36 ** 6).toString(36);
// 정원을 만든 현실 시각: 이름표 앞쪽이 만든 때(ms, 36진수) — 새 저장 칸 없이 (P20-06-06, 10-27). 예전 정원(이름표를 나중에 받음)은 이름표를 받은 때라 추정, 이상하면 null
function gardenBorn(st) {
  const t = parseInt(String((st && st.gardenId) || '').split('-')[0], 36);
  return t > Date.UTC(2026, 0, 1) && t < Date.UTC(2100, 0, 1) ? t : null;
}
// 불러오기 전에 보여 줄 요약 (JSON에서 막 읽은 정원에도 씀). born: 시작한 때 · flowers: 지금 정원에 있는 꽃 (P20-06-06)
// P55 ↗ 인스타 스토리 공유 (11-02): 스토리 그림(1080×1920)에 넣을 글자. 그림은 화면(app-garden.js shareStory)이 기기 안에서만 그리고 아무 데도 보내지 않음.
// 보상 없음 · 저장 형식 그대로. 🐢 느긋하게 보기면 숫자 줄(꽃 포기 수)은 null
const SHARE_URL = 'ff-1204.github.io/doris-garden', SHARE_LINK = `https://${SHARE_URL}/`;   // P87-02 「주소 복사」
function shareCard(st) {
  const cal = calendar(st.virtual), y = Math.max(1, yearOf(st, cal)), T = st.titleOn && TITLES[st.titleOn];
  const n = (st.flowers || []).filter(f => !f.withered).length;
  return { title: '도리의 정원', when: `${y}년째 · ${monthName(cal.month)}`, flowers: slowView(st) ? null : `꽃 ${n}포기`, grade: gradeOf(st).name,
    year: `${y}년째`, month: monthName(cal.month), count: slowView(st) ? null : `${n}포기`,   // P55-05 그림 아래 라벨-값 칸 (해 · 달 / 꽃 / 등급 / 칭호)
    titleName: T ? T.name : null, url: SHARE_URL, link: SHARE_LINK, file: `doris-garden-${y}-${cal.month}.png` };
}
// P87 ↗ 게시물 네 장 (11-06 사용자 시안 2): 둘째 장 꽃 · 셋째 장 기록 글자. 🐢 느긋하게 보기면 숫자를 쓰지 않아 꽃 포기 수가 빠지고 기록 장은 없음(rows null) — 돈 숫자는 어느 쪽에도 없음. 새 정원은 값이 있는 줄만
const SHARE_FLOWERS_MAX = 9;
function shareAlbum(st) {
  const slow = slowView(st), live = (st.flowers || []).filter(f => !f.withered), count = k => live.filter(f => f.type === k).length;
  const seen = Object.keys((st.yearSeen && st.yearSeen.bloom) || {}).filter(k => FLOWERS[k]);
  const keys = seen.length ? seen : FLOWER_KEYS.filter(count), y = st.yearNow || {};
  const all = keys.map(k => ({ k, name: FLOWERS[k].name, n: count(k) })).sort((a, b) => b.n - a.n || FLOWER_KEYS.indexOf(a.k) - FLOWER_KEYS.indexOf(b.k));
  const flowers = all.slice(0, SHARE_FLOWERS_MAX).map(f => ({ k: f.k, name: f.name, count: slow ? null : `${f.n}포기` })), won = n => n.toLocaleString('ko-KR');
  const rows = [[seen.length ? '올해 핀 꽃' : '심은 꽃', `${keys.length}종`], ['정원 등급', gradeOf(st).name], ['올해 판 찻잔', y.sold ? `${won(y.sold)}잔` : null], ['올해 거둔 꽃잎', y.harvest ? `${won(y.harvest)}장` : null], ['들어준 주문', S(st, 'orders') ? `${won(S(st, 'orders'))}장` : null]].filter(r => r[1] && r[1] !== '0종');
  return { flowerTitle: seen.length ? '올해 핀 꽃' : '정원의 꽃', flowers, more: Math.max(0, all.length - SHARE_FLOWERS_MAX), rows: slow ? null : rows, young: rows.length < 3 };
}
function saveSummary(st) {
  const cal = calendar(st.virtual);
  return { year: yearOf(st, cal), season: seasonN(st), month: cal.month, money: st.money, dex: dexCount(st), dexTotal: dexTotal(st), titles: n0(st.titles), titleOn: st.titleOn || null,   // season: P28-08 몇 철 (드라이브 고르기)
    born: gardenBorn(st), flowers: (st.flowers || []).filter(f => !f.withered).length };
}
// P20-06-05 거의 새 정원 (10-27, 사용자 요청): 첫 안내 · 이웃의 화분 뒤로 직접 한 것이 없음. 저절로 일어나는 일(하루 용돈 · 화분이 피어 생기는
// 도감 · 1장 퀘스트 · 땅 · 칭호 문장 장식 · 쉼달의 한 해 기록)은 보지 않고, 직접 해야만 남는 흔적만 봄: 심기 · 사기 · 예약 · 수확 · 차 · 블렌딩 · 판매 · 돌보기 도구 · 장식 · 찻집 가꾸기 · 광산 · 선물
const EMPTY_DEX = ['petal', 'tea', 'teabag', 'bagBlend', 'blend', 'honey', 'mine', 'memento', 'letter'];
function freshGarden(st) {
  if (!st) return false;
  if (!st.onboarded) return true;
  const got = (st.pantry && st.pantry.got) || 0;   // P90 저절로 들어온 작은 것은 받은 것이라 새 정원으로 침
  const none = a => !a || a.every(x => x.gift === true || x.k === 'welcome' || !!x.mail), sh = st.shop || newShop();   // P22-05 꾸러미(gift) · 꽃집 할머니 편지 · 📮 운영자 편지(P29)는 받은 것이라 빼고 봄
  return (st.flowers || []).every(f => f.origin === '이웃')
    && ['items', 'reservations', 'pending', 'petals', 'teas', 'drying', 'dried', 'blends', 'cups', 'letterBox'].every(k => none(st[k]))
    && (st.decos || []).every(d => { const i = decoInfo(d.key); return !!(i && (i.title || i.extra)); })        // 칭호 문장 · 덤 장식만 (산 장식 없음)
    && Object.entries(st.stats || {}).every(([k, v]) => !v || k === 'autoPantry')                                                               // 판매 · 찻잔 · 주문 · 선물 · 광산
    && EMPTY_DEX.every(k => !st.dex || !st.dex[k] || Object.keys(st.dex[k]).every(x => (k === 'letter' && x === 'welcome') || (k === 'mine' && PANTRY_ITEMS[x])))
    && st.water >= 10 && st.water <= 10 + got && st.shears === 5 && st.hoe === 10 && st.basket === 10 && (st.shovel == null || st.shovel === 10) && !(st.fert > got)
    && sh.seats === 1 && (sh.cups || []).length <= 1 && (sh.signs || []).length <= 1;
}
// "어느 정원을 쓸까요?"(다른 정원) 전에: 한쪽이 거의 새 정원이면 묻지 않음. 이 기기가 새 정원이면(둘 다 새것이어도) 드라이브 것, 드라이브만 새것이면 이 기기 것, 아니면 null(묻기)
const freshPick = (localFresh, remoteFresh) => localFresh ? 'remote' : remoteFresh ? 'local' : null;
function makeSave(st, now) {
  const game = JSON.parse(JSON.stringify(st));
  delete game._newTitles;                                                // 얻는 연출 대기열은 이 기기에서만
  return { app: SAVE_APP, format: SAVE_FORMAT, gardenId: st.gardenId || null, savedAt: now, summary: saveSummary(st), check: hashText(JSON.stringify(game)), game };
}
// 검사(P20-03-01): 앱 · 형식 · 깨짐 · 땅 칸 수. 통과하면 { ok, data }
function parseSave(text) {
  let d;
  try { d = JSON.parse(text); } catch (e) { return no('도리의 정원 저장 파일이 아니에요'); }
  if (!d || d.app !== SAVE_APP || !d.game || typeof d.game !== 'object') return no('도리의 정원 저장 파일이 아니에요');
  if (typeof d.format !== 'number') return no('파일이 망가져서 열 수 없어요');
  if (d.format > SAVE_FORMAT) return no('더 새 버전에서 저장한 파일이에요 · 페이지를 새로고침해 보세요');
  if (hashText(JSON.stringify(d.game)) !== d.check) return no('파일이 망가져서 열 수 없어요');
  const g = d.game;
  if (g.v !== 3 || !Array.isArray(g.tiles) || g.tiles.length !== W * H || !g.dex) return no('파일이 망가져서 열 수 없어요');
  cleanSave(g);                                                          // P67 미리보기 요약(saveSummary)도 정리한 정원으로
  return ok('', { data: d });
}

// ---------------------------------------------------------------- 불러오기 입구 정리 (P67, 11-03)
// 남이 손으로 만든 저장(📂 파일 · ☁️ 드라이브 · localStorage)이 화면에 태그를 만들지 않게, 열 때마다 migrateSave 앞(과 parseSave 끝)에서 한 번 훑어요.
// 거부하지 않고 고치기만 — ① 모든 글자(값 · 칸 이름)에서 < > 를 지움 ② 화면에 그대로 찍히는 숫자 칸에 글자가 있으면 Number()로, 숫자가 아니면 기본값.
// 엔진이 만드는 저장엔 < > 글자 · 글자 숫자가 없어서 정상 저장은 한 글자도 안 바뀌어요(tests/snapshot.test.js 옮긴 결과 해시 그대로). 저장 형식 그대로라 MIGRATIONS 줄이 아님
// 숫자 칸: 'a.b' 칸 · 'a[]' 배열 칸마다 · 'a.*' 표의 값마다. 글자일 때만 고치고 null · 없는 칸 · 다른 꼴은 그대로(보정 · 화면이 맡음), 기본값은 0 (=1은 1)
const SAVE_NUMS = [
  'money', 'fert', 'water', 'shears', 'hoe', 'basket', 'shovel', 'jar', 'presol', 'speed=1', 'bestScore', 'pruneCount', 'weedCount', 'pollenExtra', 'nextId', 'virtual', 'lastAbs', 'lastReal', 'mailSeenAt',
  'honey.*', 'mine.bag.*', 'mine.depth', 'mine.deepest', 'mine.energy', 'mine.boards', 'stats.*', 'titles.*', 'journal.done.*', 'dex.blend.*', 'dex.tea.*', 'dex.mutant.*', 'mailGot.*',
  'grade.xp', 'grade.frac', 'grade.dex', 'grade.by.*', 'yearNow.*', 'bonus.*', 'bonusOwn.*', 'shop.seats=1', 'season.n=1', 'gifts.year', 'pantry.n', 'pantry.got', 'weekly.week', 'weekly.full', 'weekly.doneAll', 'yearBest.q', 'orders.abs', 'visitors.times.*', 'layers.at.*', 'farm.mark.*',
  'log[].d=1', 'log[].m', 'log[].y=1', 'log[].at', 'log[].type',
  'records[].year=1', 'records[].season=1', 'records[].score', 'records[].dex', 'records[].dexTotal', 'records[].orders', 'records[].giftsTotal', 'records[].prevBest', 'records[].counts.*', 'records[].scoreParts.*',
  'yearLog[].year=1', 'yearLog[].season=1', 'yearLog[].dex', 'yearLog[].dexTotal', 'yearLog[].grade', 'yearLog[].harvest', 'yearLog[].income', 'yearLog[].orders', 'yearLog[].score', 'yearLog[].sold',
  'flowers[].id', 'flowers[].x', 'flowers[].y', 'flowers[].q', 'flowers[].startQ', 'flowers[].plantedYear', 'flowers[].propYear', 'flowers[].ripeH', 'flowers[].ripeT',
  'flowers[].ageH', 'flowers[].lifeH', 'flowers[].waterH', 'flowers[].weedH', 'flowers[].pruneH', 'flowers[].fertH', 'flowers[].thirstH', 'flowers[].adaptH', 'flowers[].harvestKey', 'flowers[].bloomKey', 'flowers[].antKey', 'flowers[].bfm',   // R-A4 (11-05 검토): 글자면 += 로 글자가 이어져 NaN이 되던 시간 칸
  'pending[].id', 'pending[].dueH', 'mine.regenH', 'mine.autoLog.n', 'mine.autoLog.paid', 'mine.autoLog.jewels', 'mine.autoLog.won', 'mine.autoLog.down', 'mine.autoLog.downWon', 'mine.autoLog.bag.*',
  'items[].id', 'items[].q', 'items[].got', 'petals[].id', 'petals[].q', 'teas[].id', 'teas[].q', 'cups[].id', 'cups[].q', 'blends[].id', 'blends[].q', 'dried[].id', 'dried[].q', 'drying[].id', 'drying[].q', 'drying[].leftH', 'preserved[].id',
  'decos[].id', 'decos[].n', 'decos[].x', 'decos[].y', 'decos[].at', 'letterBox[].y', 'letterBox[].m', 'letterBox[].at',
];
const noTag = s => s.replace(/[<>]/g, '');
function cleanText(v) {
  if (typeof v === 'string') return /[<>]/.test(v) ? noTag(v) : v;
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = cleanText(v[i]); return v; }
  if (v && typeof v === 'object') for (const k of Object.keys(v)) {
    const val = cleanText(v[k]);
    if (/[<>]/.test(k)) { delete v[k]; v[noTag(k)] = val; } else v[k] = val;
  }
  return v;
}
function cleanNum(o, parts, def) {
  if (!o || typeof o !== 'object') return;
  const [p, ...rest] = parts;
  if (p.endsWith('[]')) { const a = o[p.slice(0, -2)]; if (Array.isArray(a)) for (const x of a) cleanNum(x, rest, def); return; }
  const keys = p === '*' ? Object.keys(o) : [p];
  for (const k of keys) {
    if (rest.length) { cleanNum(o[k], rest, def); continue; }
    const v = o[k];
    if (typeof v !== 'string') continue;                                 // 글자만 — 숫자 · null · 예전 저장의 true(도감 찻잎 등, 보정이 바꿈) · 표는 그대로
    const n = Number(v);
    o[k] = v.trim() && isFinite(n) ? n : def;
  }
}
// 막 읽은 정원(game)을 그 자리에서 고침 · 고친 정원을 돌려줌
function cleanSave(s) {
  if (!s || typeof s !== 'object') return s;
  cleanText(s);
  for (const spec of SAVE_NUMS) { const [p, d] = spec.split('='); cleanNum(s, p.replace(/\[\]/g, '[].').split('.').filter(Boolean), d == null ? 0 : Number(d)); }
  return s;
}

// ---------------------------------------------------------------- 예전 저장 보정 (10-24, app.js load()에서 옮김)
// 저장 형식(st)에 필드를 더하면 여기 맨 끝에 한 줄 더함. 순서대로 한 번씩 돌고 st.mig에 몇 번째까지 했는지 적음.
// 지금 있는 보정은 모두 여러 번 돌아도 같은 결과라서, mig가 없는 예전 저장은 처음부터 다 돌려도 됨
const MIGRATIONS = [
  ['물병 · 가위 · 호미 · 바구니 (10-05)', s => {
    if (s.water == null) s.water = 10;
    if (s.shears == null) s.shears = 5;
    if (s.hoe == null) s.hoe = 10;
    if (s.basket == null) s.basket = 10;
  }],
  ['꽃방 · 블렌딩 · 찻잔 (P12-07 · 08, P17-10)', s => { s.drying = s.drying || []; s.dried = s.dried || []; s.blends = s.blends || []; s.cups = s.cups || []; }],
  ['가게 → 화원 (10-05)', s => { for (const x of [...(s.items || []), ...(s.flowers || [])]) if (x.origin === '가게') x.origin = '화원'; }],
  ['꽃잎 도감: 이미 거둔 꽃(차 · 꽃잎이 있는 꽃) 등록', s => {
    if (s.dex.petal) return;
    s.dex.petal = {};
    for (const k of [...Object.keys(s.dex.tea), ...s.petals.map(p => p.type), ...s.teas.map(t => t.type)]) s.dex.petal[k] = true;
  }],
  ['블렌드 도감', s => { s.dex.blend = s.dex.blend || {}; }],
  ['정원 이름표 gardenId (P20)', s => { if (!s.gardenId) s.gardenId = newGardenId(); }],
  ['블렌드 티백 도감', s => { s.dex.bagBlend = s.dex.bagBlend || {}; }],
  ['티백 도감: 만든 적 있는 차는 티백으로도 등록', s => {
    if (s.dex.teabag) return;
    s.dex.teabag = {};
    for (const k of [...Object.keys(s.dex.tea), ...s.teas.map(t => t.type)]) s.dex.teabag[k] = true;
  }],
  ['씨앗 · 묘목 도감: 가진 적 있는 것(창고 · 심은 꽃 · 핀 적 있는 꽃) 등록', s => {
    if (s.dex.form) return;
    s.dex.form = {};
    for (const x of [...s.items, ...s.flowers]) s.dex.form[x.type] = true;
    for (const k of Object.keys(s.dex.flower)) s.dex.form[k] = true;
  }],
  ['찻집 가꾸기 (P17-15, 10-24)', s => { if (!s.shop) s.shop = newShop(); }],
  ['정원 장식 · 꾸밈 도감 · 이미 얻은 칭호의 문장 장식 (P17-16, 10-24)', s => {
    s.decos = s.decos || []; s.dex.deco = s.dex.deco || {};
    for (const k of Object.keys(s.titles || {})) if (TITLES[k] && !s.dex.deco['t:' + k]) addDeco(s, 't:' + k);
  }],
  ['꿀 선반 · 꿀 도감 (P18, 10-24)', s => { s.honey = s.honey || {}; s.dex.honey = s.dex.honey || {}; }],
  ['이웃의 화분 · 첫 꽃 (P22, 10-24): 이미 시작한 정원은 화분을 받지 않고 1장은 캐모마일 그대로', s => { if (s.gift === undefined) s.gift = s.onboarded ? -1 : null; if (s.firstFlower === undefined) s.firstFlower = null; }],
  ['⛏️ 광산 · 광산 도감 (P24, 10-24)', s => { if (!s.mine) s.mine = newMine(); s.dex.mine = s.dex.mine || {}; }],
  ['💌 손님 주문 · 기념품 도감 · 🏅 정원 점수 (P23, 10-24)', s => { if (s.orders === undefined) s.orders = null; s.dex.memento = s.dex.memento || {}; if (s.bestScore === undefined) s.bestScore = 0; }],
  ['직접 피운 꽃 (QA 4회차, 10-24): 지금까지 핀 꽃은 화분 꽃만 빼고 직접 피운 것으로', s => { if (!s.ownBloom) { s.ownBloom = {}; for (const k of Object.keys(s.dex.flower || {})) if (!(s.gift != null && s.gift >= 0 && s.firstFlower === k)) s.ownBloom[k] = true; } }],
  ['올해 본 것 (정원 점수, QA 6회차) — 올해 일지의 "피었어요"로 핀 꽃을 채움 (QA 7회차)', s => {
    if (s.yearSeen) return;
    s.yearSeen = { bloom: {}, blend: {}, honey: {} };
    for (const l of s.log || []) if (l.type === 8) { const k = FLOWER_KEYS.find(f => l.text.startsWith(FLOWERS[f].name)); if (k) s.yearSeen.bloom[k] = true; }
  }],
  ['💐 이웃에게 선물 · ✉️ 편지 도감 (P26, 10-24)', s => { if (s.gifts === undefined) s.gifts = null; s.letterPending = s.letterPending || []; s.dex.letter = s.dex.letter || {}; }],
  ['심은 뒤 흐른 시간 lifeH (QA 12회차, 10-24): 지금까지는 자란 시간과 같음', s => { for (const f of s.flowers || []) if (f.lifeH == null) f.lifeH = f.ageH; }],
  ['꽃잠 번식 표시 propRest · 꽃잠 안내를 닫은 주 restClosed (QA 19회차, 10-27)', s => { for (const f of s.flowers || []) if (f.propRest == null) f.propRest = false; if (s.restClosed === undefined) s.restClosed = null; }],
  ['☁️ 계정 기록 account · 마지막으로 손댄 때 actAt (P20-06 · 08, 10-27): 예전 정원은 모름(null)', s => { if (s.account === undefined) s.account = null; if (s.actAt === undefined) s.actAt = null; }],
  ['🎁 답례품 · 받은 편지함 letterBox (P26-06, 10-27): 예전에 받은 편지에는 답례품을 소급하지 않음', s => { s.letterBox = s.letterBox || []; }],
  ['처음부터 다시 시작한 때 resetAt (P16-12-03 완전 초기화, 10-27): 예전 정원은 null — 예전 재시작 정원도 계정 칭호를 이어 받던 그대로', s => { if (s.resetAt === undefined) s.resetAt = null; }],
  ['첫걸음 🌸 정원의 첫 꽃 돌보기 guide.pot (P22-02 변경 10-27): 이미 다른 단계를 했거나 · 마쳤거나 · 닫은 정원은 ✓', s => { const g = s.guide; if (g && !g.pot && Object.values(g).some(v => v === true)) g.pot = true; }],
  ['📈 해마다 기록 yearLog · 올해 쌓는 중 yearNow (P28-07-01, 10-27): 남은 한 해 기록(최근 10개)으로 해 · 점수 · 도감 · 주문을 채우고 수입 · 판 잔 · 꽃잎은 모름(null). 올해는 업데이트 뒤부터만 셈(part)', s => {
    if (!s.yearNow) s.yearNow = Object.assign(newYearNow(), { part: true });
    if (s.yearLog) return;
    s.yearLog = [];
    const recs = (s.records || []).slice().reverse();   // 옛 것부터
    recs.forEach((r, i) => {
      if (r.year == null) return;
      const older = recs[i - 1], cut = !older && (s.records || []).length >= 10;   // 10개를 넘어 잘린 기록 앞은 모름
      const orders = r.orders == null || cut ? null : r.orders - ((older && older.orders) || 0);
      addYearLog(s, { year: r.year, income: null, sold: null, harvest: null, orders, score: r.score == null ? null : r.score, grade: null, dex: r.dex == null ? null : r.dex, dexTotal: r.dexTotal == null ? null : r.dexTotal });
    });
  }],
  ['🐢 느긋하게 보기 settings.slow (P28-02, 10-27): 예전 정원은 꺼짐', s => { if (s.settings && s.settings.slow == null) s.settings.slow = false; }],
  ['🌱 정원 등급 grade (P28-05-01, 10-27): 예전 정원은 남은 기록으로 경험치를 어림 — 꽃잎은 말린 수 · 해마다 기록 중 큰 쪽, 판 잔 · 주문 · 퀘스트 · 도감 칸 · 남은 한 해 평가(최근 10개, 장식 · 선물 몫 빼고). 지난 해마다 기록의 grade는 모름(null) 그대로', s => {
    if (s.grade) return;
    const st = s.stats || {}, sum = k => (s.yearLog || []).reduce((a, r) => a + (r[k] || 0), 0) + ((s.yearNow && s.yearNow[k]) || 0);
    const n = {
      harvest: Math.max(st.dried || 0, sum('harvest')), sell: Math.max(st.cups || 0, sum('sold')), order: st.orders || 0, quest: n0((s.journal || {}).done),
      dex: Math.max(0, gradeDexCount(s) - 1),   // 처음부터 있는 거친 땅 한 칸은 빼고
      year: (s.records || []).reduce((a, r) => a + (r.score == null ? 0 : r.scoreParts ? yearXpOf({ total: r.score, parts: r.scoreParts }) : r.score), 0),
    };
    s.grade = newGrade(); s.grade.dex = gradeDexCount(s);
    for (const k in n) { const v = Math.round(XP[k] * n[k]); if (v) { s.grade.by[k] = v; s.grade.xp += v; } }
  }],
  ['📈 그래프 견줌 yearPace (P28-07-02, 10-28): 달마다 쌓인 수입 · 경험치 — 예전 정원은 올해 시작 값을 몰라(xp0 null) 다음 쉼달 기록부터 셈', s => { if (!s.yearPace) s.yearPace = newYearPace(null); }],
  ['🗓️ 주마다 바뀌는 목표 weekly (P28-09, 10-28): 예전 정원은 null — 다음 확인 때 이번 주 목표를 뽑음', s => { if (s.weekly === undefined) s.weekly = null; }],
  ['🧺 정원 저장고 pantry (P28-04, 10-28): 예전 정원은 빈 저장고 — 연 뒤부터 쌓임 (지난 시간을 거슬러 채우지 않음)', s => { if (!s.pantry) s.pantry = newPantry(); }],
  ['🎁 첫 방문 꾸러미 · 🍵 첫 손님 firstGuest (P22-05, 10-28): 예전 정원은 꾸러미 없음(false) — 아직 화분을 받지 않은 정원은 화분과 함께 받음', s => { if (s.firstGuest === undefined) s.firstGuest = false; }],
  ['📮 운영자 편지 받은 기록 mailGot (P29, 10-28): 예전 정원은 빈 기록 — 지금 기간인 편지는 다음에 열 때 받음', s => { s.mailGot = s.mailGot || {}; }],
  ['🌟 등급 보너스 bonus (P28-05-02, M3-1 10-29): 예전 정원은 모든 칸 0단계 — 🌟 손길 점은 지금 등급으로 바로 셈', s => { s.bonus = Object.assign(newBonus(), s.bonus); }],
  ['🌸 새 철 season (P28-08-03, M3-3 10-30): 예전 정원은 1철 · 시작한 때는 모름(null) · 해마다 기록 줄과 한 해 기록 카드는 1철', s => {
    if (!s.season) s.season = newSeason();
    for (const r of [...(s.yearLog || []), ...(s.records || [])]) if (r.season == null) r.season = 1;
  }],
  ['🌳 정원의 층 layers (P30-01-01, L1-1 10-30): 이미 찻집 · 광산을 연 정원은 2 · 3층 연 해 = 업데이트한 해(지금 해마다 기록 줄 수) — 4층이 한꺼번에 열리지 않게', s => {
    if (!s.layers) { s.layers = newLayers(); layerSync(s); }
  }],
  ['🗓️ 올해만 오는 것 yearly (P30-05-01, L1-3 10-30): 예전 정원은 빈 달력 — 다음에 열 때부터 셈 (지난 계절을 놓친 것으로 치지 않음)', s => { if (!s.yearly) s.yearly = newYearly(); }],
  ['🐾 특별 손님 visitors (P30-06-01, L1-6 10-30): 예전 정원은 아무도 안 온 정원 — 다음 달부터 조건이 맞으면 옴', s => { if (!s.visitors) s.visitors = newVisitors(); }],
  ['🛤️ 철의 길 season.path (P30-04-01, L2-1 10-30): 예전 정원 · 끝난 철은 길 없이(null) — 모르는 길 이름도 길 없이', s => {
    s.season = Object.assign(newSeason(), s.season); if (!PATHS[s.season.path]) s.season.path = null;
    for (const e of s.season.log || []) if (!PATHS[e.path]) e.path = null;
  }],
  ['🌳 작은 숲 forest (P30-03, L3-1 10-30): 예전 정원은 빈 숲(자리 6칸 · 도감 없음) — 4층이 열리면 심을 수 있음', s => { if (!s.forest) s.forest = newForest(); }],
  ['✉️ 편지함 mailSeenAt (P31-01, 10-30): 예전 정원은 지금 연 것으로 — 처음엔 점 없음 (예전 편지 · 일지 줄엔 시각이 없어 모두 읽음)', s => { if (s.mailSeenAt == null) s.mailSeenAt = s.virtual; }],
  ['🔠🧩 큰 글씨 settings.big · 땅 무늬 settings.pattern (P28-01 · P28-03, M4 10-30): 예전 정원은 둘 다 꺼짐', s => { if (s.settings) { if (s.settings.big == null) s.settings.big = false; if (s.settings.pattern == null) s.settings.pattern = false; } }],
  ['🐝 곤충농장 awayLast · farm (P32-02, 10-30): 예전 정원은 다시 볼 요약 없음 · 지난 한 달 셈은 지금부터 (그동안 한 일을 지난달로 세지 않게)', s => { if (s.awayLast === undefined) s.awayLast = null; if (!s.farm) s.farm = { mark: farmCounts(s), last: null }; }],
  ['🧬 돌연변이 꽃 mut · 도감 dex.mutant · dex.mutjar · 🫙 유리 관 jar · 꽃잠 장식 보정 mutBoost (P36, 10-30): 이미 핀 꽃은 굴리지 않음(mut false — 「처음 필 때」가 지났음) · 아직 안 핀 꽃은 처음 필 때 굴림', s => {
    for (const f of s.flowers || []) if (f.mut == null && f.bloomKey != null && f.bloomKey !== -1) f.mut = false;
    s.dex.mutant = s.dex.mutant || {}; s.dex.mutjar = s.dex.mutjar || {}; if (s.jar == null) s.jar = 0; if (s.mutBoost === undefined) s.mutBoost = null;
  }],
  ['🌼 꽃가루 · 일꾼 기르기 bonus.brew · hive · weed (P37, 10-31): 새 세 칸은 0단계 — 예전 네 칸 단계 · 쓴 꽃가루는 그대로', s => { s.bonus = Object.assign(newBonus(), s.bonus); }],
  ['🐜 작게 시작하는 일꾼 bonus 단계 옮김 · bonusFree (P38, 10-31): 예전 단계 값과 같은 새 단계로 (🐜 8포기 → 5단계 · 🐛 8장 → 5단계 · 🐝 2칸 6병 → 1단계 · 🐞 3포기 → 2단계, 🦋 · 선반 · 늦잠은 그대로) · 더 드는 꽃가루는 덜어 줌', s => {
    s.bonus = Object.assign(newBonus(), s.bonus); if (s.bonusFree) return;   // 이미 옮긴 정원(새 정원 포함)은 그대로 — 여러 번 돌아도 같은 결과
    s.bonusFree = {};
    for (const [k, old] of Object.entries(BONUS_OLD)) {
      const lv = clamp(Math.floor(+s.bonus[k] || 0), 0, old.vals.length - 1), v = old.vals[lv], same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      let to = 0; BONUS[k].vals.forEach((n, i) => { if (same(n, v) || (typeof n === 'number' && n <= v)) to = i; });   // 같은 값 (없으면 바로 아래 값)
      s.bonus[k] = to;
      const free = bonusCostTo(to, k) - old.cost.slice(0, lv).reduce((a, b) => a + b, 0);
      if (free > 0) s.bonusFree[k] = free;
    }
  }],
  ['🐝 곤충은 모두 꽃을 돕는다 (P39-11, 10-31): 곤충 기르기 칸은 0단계로 · 쓴 꽃가루는 모두 돌려줌(덜어 준 꽃가루 bonusFree도 그 칸은 지움) · 🐛 누에 · 🦋 나비 수만큼 🧺 건조 선반 · 🫖 찻집 도우미 덤 · 4층이 열렸으면 🐞 · 꽃마다 그해 거둔 해 hy · 📮 안내 편지', s => {
    s.bonus = Object.assign(newBonus(), s.bonus); s.bonusFree = s.bonusFree || {}; s.mailGot = s.mailGot || {};
    if (has(s.mailGot, P39_LETTER)) return;   // 한 번만 (mig 없이 다시 돌아도 덤 · 편지가 또 오지 않게 — 받은 기록은 📮 mailGot에)
    s.mailGot[P39_LETTER] = s.virtual;
    for (const k of new Set(Object.values(INSECTS))) { s.bonus[k] = 0; delete s.bonusFree[k]; }   // 🧺 선반 · 🌙 늦잠은 그대로
    const decos = s.decos = s.decos || [], cnt = k => decos.filter(d => d.key === k).length;
    const shelves = cnt('dryrack'), stand = Math.min(1, cnt('teahelper'));
    for (let i = 0; i < shelves; i++) addDeco(s, 'dryshelf');                      // P39-09-03 하던 일을 잃지 않게 (창고에)
    for (let i = 0; i < stand; i++) addDeco(s, 'teastand');
    const bug = forestOpen(s) && !cnt('ladybug') ? addDeco(s, 'ladybug') : null;   // P39-11-03 (예전 숲 바람 대신)
    const cal = calendar(s.virtual), y = yearOf(s, cal);
    for (const f of s.flowers || []) if (f.hy == null && f.harvestKey != null && f.harvestKey >= cal.week * 14) f.hy = y;   // 올해 이미 거둔 꽃은 🦋 덤을 또 받지 않게
    const text = '이제 🐝 곤충농장의 곤충들은 놓은 자리 둘레의 꽃을 돌봐요. 달팽이는 물, 개미는 꽃잎 거두기, 무당벌레는 잡초, 지렁이는 비료, 누에는 가지치기, 꿀벌은 번식, 나비는 첫 꽃잎을 맡아요. 먹였던 꽃가루는 모두 돌려드렸어요 · 다시 먹이면 둘레가 넓어져요.'
      + (shelves || stand ? ' 누에가 하던 말리기는 🧺 건조 선반이, 나비가 하던 차 우리기는 🫖 찻집 도우미가 맡아요 · 📦 창고에 넣어 두었어요.' : '')
      + (bug ? ' 숲에서 🐞 무당벌레도 왔어요.' : '');
    s.letterBox = s.letterBox || [];
    s.letterBox.push({ k: null, mail: { id: P39_LETTER, from: '도리의 정원', title: '곤충들이 꽃을 돌봐요', text, gifts: [] }, took: true, y, m: cal.month, read: false, at: s.virtual });
    trimLetterBox(s);
  }],
  ['🌼 그 밖에 세 칸 bonus.grow · dry · pollen · pollenExtra (P40-04, 10-31): 🧺 선반 넓히기 · 🌙 늦잠 칸을 없애 쓴 꽃가루는 모두 돌려줌(그 칸 bonusFree도 지움) · 새 세 칸은 0단계 · 더 받은 꽃가루 0', s => {
    s.bonus = Object.assign(newBonus(), s.bonus); s.bonusFree = s.bonusFree || {};
    for (const k of ['pantry', 'catchup']) { delete s.bonus[k]; delete s.bonusFree[k]; }
    if (s.pollenExtra == null) s.pollenExtra = 0;
  }],
  ['💰 꽃가루를 없애고 돈 + 등급으로 bonusOwn (P41-05, 10-31): 기르기 칸은 모두 0단계(🌼 꽃가루 늘리기 칸은 지움) · 받은 꽃가루(등급으로 받은 것 + pollenExtra — 덜어 준 bonusFree는 받은 적이 없어 빼고)를 1알 5,000원으로 돈에 · 📮 안내 편지 (이 기기 한 번)', s => {
    s.bonus = Object.assign(newBonus(), s.bonus); delete s.bonus.pollen; if (!s.bonusOwn) s.bonusOwn = {}; s.mailGot = s.mailGot || {};
    if (has(s.mailGot, P41_LETTER)) return;      // 한 번만 (여러 번 돌아도 돈 · 편지가 또 오지 않게 — 11-01 P42: 이미 옮긴 정원은 쓰는 단계도 그대로)
    s.mailGot[P41_LETTER] = s.virtual; s.bonus = newBonus();
    s.bonusOwn = {};
    const n = pollenGot(s), won = n * POLLEN_WON;
    s.money = (s.money || 0) + won;
    const cal = calendar(s.virtual);
    const text = '이제 🌼 꽃가루는 없어요. 곤충 둘레 · 🌱 자라는 속도 · 🌾 말리는 속도는 정원 등급이 닿으면 🐝 곤충농장에서 돈으로 사요.'
      + (n ? ` 그동안 받은 꽃가루 ${n}알은 1알 ${POLLEN_WON.toLocaleString('ko-KR')}원으로 바꿔 💰 ${won.toLocaleString('ko-KR')}원을 넣어 드렸어요 · 기르던 칸은 모두 처음으로 돌아갔어요.` : '')
      + ` 그리고 이제 💐 화원 씨앗은 정원 등급만큼 좋은 품질로 와요 (지금 ${pct(seedQ(s))}% · 등급마다 2%씩).`;
    s.letterBox = s.letterBox || [];
    s.letterBox.push({ k: null, mail: { id: P41_LETTER, from: '도리의 정원', title: '꽃가루가 돈이 되었어요', text, gifts: [] }, took: true, y: yearOf(s, cal), m: cal.month, read: false, at: s.virtual });
    trimLetterBox(s);
  }],
  ['🌱🌾 두 속도 8단계 speedSteps (P42, 11-01): 예전 ×2 · ×3 단계(1 · 2)를 같은 배수의 새 단계(2 · 4)로 — 쓰는 단계 bonus · 산 단계 bonusOwn 둘 다, 돈은 그대로', s => {
    if (s.speedSteps === SPEED_V) return;          // 이미 옮긴 정원(새 정원 포함) — 여러 번 돌아도 같게
    s.speedSteps = SPEED_V; s.bonus = s.bonus || {};
    const to = v => { const n = Math.floor(+v || 0); return n >= 2 ? 4 : n === 1 ? 2 : 0; };   // 예전 표 [×1, ×2, ×3]
    for (const k of ['grow', 'dry']) { if (s.bonus[k] != null) s.bonus[k] = to(s.bonus[k]); if (s.bonusOwn && s.bonusOwn[k] != null) s.bonusOwn[k] = to(s.bonusOwn[k]); }
  }],
  ['⛏️ 광산 5×5 · 기력 15 (P43-05, 11-01): 예전 48칸 판이면 같은 층의 새 25칸 판으로 (가방 · 층 · 가장 깊이는 그대로), 기력은 15로 자름', s => {
    const m = s.mine; if (!m) return;
    if (m.board && (m.board.cells || []).length !== MINE_W * MINE_H) m.board = newBoard(s, m.depth || 1);
    m.energy = Math.min(MINE_MAX_E, Math.max(0, Math.floor(+m.energy || 0)));
  }],
  ['⛏️ 광산 6×6 (P48, 11-01): 파던 25칸 판이면 같은 층의 새 36칸 판으로 (가방 · 층 · 가장 깊이 · 기력은 그대로)', s => {
    const m = s.mine; if (m && m.board && (m.board.cells || []).length !== MINE_W * MINE_H) m.board = newBoard(s, m.depth || 1);
  }],
  ['⬆️ 위 칸 장식 topDeco (P52, 11-01): 예전 정원은 빈 위 칸(null)으로', s => { if (s.topDeco === undefined) s.topDeco = null; }],
  ['🌹 프리저브드 플라워 (P53, 11-01): 🧪 특수 용액 presol · 꽃방 유리 돔 preserving · 창고 preserved · 도감 dex.pres · dex.presMut', s => { if (s.presol == null) s.presol = 0; s.preserving = s.preserving || []; s.preserved = s.preserved || []; s.dex.pres = s.dex.pres || {}; s.dex.presMut = s.dex.presMut || {}; }],
  ['🍯 꿀은 바로 창고로 (P65-01, 11-03): 예전 벌통에 쌓인 꿀(d.honey)을 창고 꿀 칸(st.honey — 예전 찻집 꿀 선반 그대로)으로 · 꿀 도감도 · 개미 표시 antKey는 없으면 그대로', s => {
    s.honey = s.honey || {}; s.dex.honey = s.dex.honey || {};
    for (const d of s.decos || []) {
      if (!Array.isArray(d.honey)) { if (d.honey != null) delete d.honey; continue; }
      for (const k of d.honey) if (HONEY_KEYS.includes(k)) { s.honey[k] = (s.honey[k] || 0) + 1; s.dex.honey[k] = true; }
      delete d.honey;
    }
  }],
  ['🌸 다시 피는 꽃 ripeH · ripeT (P72-01, 11-04): 핀 꽃은 핀 채로(이번 달에 이미 거둔 꽃은 다 자람으로 · 시계 0), 다 자란 꽃은 시계 0부터 · 앞선 달력 leadH · leadEnd는 지움', s => {
    const cal = calendar(s.virtual);
    for (const f of s.flowers || []) {
      delete f.leadH; delete f.leadEnd;
      if (f.ripeH != null) continue;                 // 이미 옮긴 꽃
      const picked = f.stage === 'bloom' && f.harvestKey === harvestSlot(cal);
      f.ripeH = f.stage === 'bloom' && !picked ? RIPE_H : 0;
      f.ripeT = f.bloomed || f.stage === 'bloom' ? RIPE_H : 0;   // 한해살이: 핀 꽃은 지금부터 예전 피는 달 수만큼 더
      if (picked) f.stage = 'mature';
    }
  }],
  ['R-C2 🔔 브라우저 알림 설정 칸 (11-05): 기본 꺼짐', s => { if (s.settings && s.settings.notify == null) s.settings.notify = false; }],
  ['🪏 삽 · ⛏️ 자동 캐기 (P83, 11-06): 옮겨심기에 삽이 들게 되어 예전 정원도 새 정원처럼 삽 1개(10번)로 · 자동 캐기는 꺼짐', s => {
    if (s.shovel == null) s.shovel = SUPPLIES.shovel.per;
    if (s.mine) { if (s.mine.auto == null) s.mine.auto = false; if (s.mine.autoStop === undefined) s.mine.autoStop = null; if (s.mine.autoLog === undefined) s.mine.autoLog = null; }
  }],
  ['🌹 프리저브드 장식 (P84, 11-06): 창고 칸 st.preserved를 늘 배열로 · 꽃을 모르는 pres 장식은 지움 (그림을 그릴 수 없어서)', s => {
    s.preserved = s.preserved || [];
    if (s.decos) s.decos = s.decos.filter(d => d.key !== 'pres' || (d.pres && FLOWERS[d.pres.type]));
  }],
  ['🧺 저장고 자동 (P90, 11-06): 쌓여 있던 것은 잃지 않게 한 번에 넣어 줌 (거두기가 없어짐)', s => {
    const p = s.pantry; if (!p || !Array.isArray(p.items)) return;
    for (const it of p.items) pantryGive(s, it);
    p.items = [];
  }],
];
const P41_LETTER = 'p41-money', POLLEN_WON = 5000;   // P41-05 📮 안내 편지 이름표 · 꽃가루 1알 = 5,000원
const P39_LETTER = 'p39-insects';                 // P39-11-04 📮 안내 편지 이름표 (mail.json 편지와 겹치지 않게)
// P38 옮기기 전(P37) 단계 값 · 꽃가루 — MIGRATIONS 45번째가 읽음 (🦋 · 선반 · 늦잠은 값이 같아 그대로)
const BONUS_OLD = { basket: { vals: [8, 12, 16, 20], cost: [1, 2, 3] }, rack: { vals: [8, 10, 12, 14], cost: [1, 2, 3] }, hive: { vals: [{ r: 2, max: 6 }, { r: 3, max: 9 }, { r: 3, max: 12 }], cost: [2, 3] }, weed: { vals: [3, 4], cost: [1] } };
// 열 때마다 하는 일 (한 번으로 끝나지 않는 것)
function onOpen(s) {
  s._fertNew = 0; s._bloomNew = {};
  s.blends = s.blends || []; s.cups = s.cups || []; s.items = s.items || []; s.flowers = s.flowers || [];
  for (const b of [...s.blends, ...s.cups.filter(c => c.kind === 'blend')]) {   // 10-06 레시피가 바뀌어도 이름이 맞게
    const r = blendRecipe(b.parts, s);
    if (r !== (b.recipe || null)) { b.recipe = r; b.name = r ? BLENDS[r].name : `${b.parts.map(k => FLOWERS[k].name).join(' · ')} 블렌드`; }
  }
  if (s.topDeco != null && !topDecoOf(s)) s.topDeco = null;   // P52 없어진 장식 id면 위 칸을 비움
  autoCompost(s);                                  // 0%로 시든 씨앗 · 묘목은 열 때도 바로 비료로 (꽃잠엔 시간이 안 흘러서)
}
// 저장소 · 파일에서 막 읽은 정원을 지금 형식으로. 쓸 수 없는 정원이면 null
function migrateSave(s) {
  if (!s || s.v !== 3 || !Array.isArray(s.tiles) || s.tiles.length !== W * H || !s.dex) return null;
  cleanSave(s);                                    // P67 불러오기 입구 정리 — 글자 칸 < > · 숫자 칸 (보정보다 먼저, 열 때마다)
  for (let i = s.mig || 0; i < MIGRATIONS.length; i++) MIGRATIONS[i][1](s);
  s.mig = MIGRATIONS.length;
  onOpen(s);
  return s;
}

// ---------------------------------------------------------------- ☁️ 구글 드라이브 · 여러 기기 (P20-05 ~ 08, 10-27)
// 통신 · 창은 화면(drive.js · app-cloud.js)이 하고, 무엇을 할지는 여기서 정함. 시각은 모두 현실 ms
const CLOUD_GAP = 5 * 60 * 1000;                                       // P20-05-02 자동 저장 최소 간격
const CLOUD_CLOSE = 60 * 1000;                                          // 처음 맞추는 기기에서 두 저장이 1분 안이면 애매함
// 지금 드라이브에 저장해도 되나: 닫을 때 · 지금 저장 · 로그인 · 고른 뒤는 바로, 나머지(달 · 칭호)는 5분 간격
const cloudDue = (now, lastAt, why) => ['close', 'now', 'login', 'pick'].includes(why) || !lastAt || now - lastAt >= CLOUD_GAP;
// P20-04-03 첫 누름에 조용히 다시 받기를 해도 되나 (팝업이라 사용자 동작 안에서만, 이미 허락한 계정은 창이 잠깐 열렸다 닫힘)
//  c { on(클라이언트 ID), inApp(앱 안 브라우저), email(이 기기에서 로그인함), tokenOk, ready(구글 스크립트), waiting(받는 중),
//      failed(이 페이지에서 자동으로 해 보다 실패함), tried(마지막으로 자동으로 해 본 토큰의 exp, 없으면 null), exp(지금 토큰의 exp, 없으면 0) }
// 토큰이 끝날 때마다 한 번만 · 한 번 실패하면 그 페이지에서는 더 안 함 (누를 때마다 창이 뜨지 않게)
const cloudAutoOk = c => !!(c.on && !c.inApp && c.email && !c.tokenOk && c.ready && !c.waiting && !c.failed) && c.tried !== c.exp;
// 이 브라우저에 기억한 토큰을 써도 되나 (P20-04-03, 10-27 변경): 같은 계정 · 1분 넘게 남음. saved { token, exp, email }
const cloudTokenUse = (saved, email, now) => !!(saved && saved.token && email && saved.email === email && +saved.exp - now > 60 * 1000);
// P20-06 드라이브 정원과 이 기기 정원 중 무엇을 쓸까
//  local  { gardenId, actAt }    — actAt: 이 정원에 마지막으로 손댄 때 (st.actAt, 모르면 0)
//  base   { gardenId, savedAt }  — 이 기기가 마지막으로 드라이브와 맞춘 판 (올렸거나 받았거나 고른 것), 없으면 null
//  remote { gardenId, savedAt }  — 지금 드라이브의 garden.json, 없으면 null
// → { act: 'local'(이 기기 것을 올려도 됨) | 'remote'(드라이브 것을 자동으로) | 'ask'(어느 정원을 쓸까요?), why }
// P28-08 열린 질문 ③: local · remote에 season(몇 철, saveSummary)이 있으면 결과에 seasons { local, remote }와, 철이 다를 때 먼저 보여 줄 쪽 first(철이 큰 쪽)를 붙임
//   새 철은 같은 정원 이름표 그대로라(완전 초기화 resetAt과 다름) 같은 정원으로 보고 시각으로 고르되, 이 기기에서 처음 맞추는데 철이 다르면 늦은 쪽을 자동으로 고르지 않고 묻기 (season)
function cloudDecide(local, base, remote) {
  const d = cloudDecide0(local, base, remote), ls = local && local.season, rs = remote && remote.season;
  if (!ls || !rs) return d;
  const out = Object.assign({}, d, { seasons: { local: ls, remote: rs } });
  if (ls !== rs) out.first = rs > ls ? 'remote' : 'local';
  return out;
}
function cloudDecide0(local, base, remote) {
  if (!remote || !remote.gardenId) return { act: 'local', why: 'empty' };
  // 이 기기가 본 뒤로 드라이브가 그대로면 이 기기 것이 맞음 (처음부터 다시 시작 · 파일 불러오기로 정원이 바뀐 경우도)
  if (base && remote.gardenId === base.gardenId && remote.savedAt <= base.savedAt) return { act: 'local', why: 'mine' };
  if (remote.gardenId !== local.gardenId) return { act: 'ask', why: 'other' };           // 다른 정원 (P20-06-03)
  const act = local.actAt || 0;
  if (base && base.gardenId === local.gardenId)                                          // 다른 기기에서 저장함 (P20-06-04)
    return act <= base.savedAt ? { act: 'remote', why: 'newer' } : { act: 'ask', why: 'both' };   // 이 기기도 그 뒤에 손댔으면 둘 다 바뀐 것
  // 이 기기에서 처음 맞춤: 늦은 쪽 (P20-06-02), 1분 안이면 묻기 · 철이 다르면 묻기 (P28-08 ③ — 옛 철 정원이 새 철을 덮지 않게)
  if (local.season && remote.season && local.season !== remote.season) return { act: 'ask', why: 'season' };
  if (Math.abs(remote.savedAt - act) < CLOUD_CLOSE) return { act: 'ask', why: 'close' };
  return remote.savedAt > act ? { act: 'remote', why: 'newer' } : { act: 'local', why: 'older' };
}
// P20-08 계정의 첫 방문: 아는 날짜 중 가장 이른 것 (없으면 null)
const firstVisitOf = (...xs) => { const v = xs.map(Number).filter(x => x > 0); return v.length ? Math.min(...v) : null; };
// 계정 날짜를 정원에 이어 붙임: 「정원 문을 연 사람」이 없으면 조용히(연출 없이) 주고, 정원에 계정 날짜를 적음. 새로 줬으면 true
function applyAccount(st, firstVisit, ctx) {
  if (!firstVisit) return false;
  const a = st.account || {};
  st.account = Object.assign({}, a, { firstVisit: firstVisitOf(firstVisit, a.firstVisit), gave: !!a.gave });   // gave: 칭호를 계정 날짜로 받음 (도감일지에 그 날짜를 보여 줌) · reward(P20-16)는 그대로
  st.journal = st.journal || { done: {} }; st.titles = st.titles || {};
  if (st.titles.t_visit != null || st.resetAt) return false;            // 처음부터 다시 시작한 정원엔 이어 붙이지 않음 (P16-12-03 변경 10-27) — 첫 안내에서 다시 얻음
  const cal = calendar(st.virtual);
  if (st.journal.done.c0_visit == null) st.journal.done.c0_visit = cal.abs;
  giveTitle(st, 't_visit', cal, ctx, true); st.account.gave = true;
  addLog(st, 11, '☁️ 계정의 첫 방문 날짜로 「정원 문을 연 사람」을 이어 붙였어요', ctx);
  return true;
}
// P20-16 구름 정원사 (10-27): 처음 로그인해 드라이브와 맞춘 정원에 덤 칭호 + 구름 돌. 얻는 연출은 계정마다 한 번
//  has: 이 정원이 이미 받음 · rewardedAt: 계정이 처음 받은 때(드라이브 · 이 기기 기록, 모르면 null)
//  reset: 처음부터 다시 시작한 정원 (P16-12-03 변경 10-27) — 계정에서 이어 받지 않고 로그인해서 다시 얻음 (연출도 다시)
//  → { give: 이 정원에 줄지, show: 얻는 연출을 띄울지 } — 이미 받은 계정이면 새 기기 정원에 조용히 이어 붙임
const cloudRewardPlan = (has, rewardedAt, reset) => ({ give: !has, show: !has && (!rewardedAt || !!reset) });
// 정원에 줌 (돈 · 씨앗은 주지 않음). 줬으면 { at: 계정이 받은 때(처음이면 now), show }, 이 정원이 이미 받았으면 null
function giveCloudReward(st, rewardedAt, now, ctx) {
  st.titles = st.titles || {};
  const p = cloudRewardPlan(st.titles.t_cloud != null, rewardedAt, st.resetAt);
  if (!p.give) return null;
  giveTitle(st, 't_cloud', calendar(st.virtual), ctx, !p.show);         // 연출 · 일지 🏅는 처음 받는 계정에서만
  if (!(st.decos || []).some(d => d.key === 'cloudstone')) addDeco(st, 'cloudstone');
  addLog(st, p.show ? 9 : 11, p.show ? '도감에 등록: 🪴 구름 돌' : '☁️ 계정에서 받은 「구름 정원사」와 구름 돌을 이 정원에도 이어 붙였어요', ctx);
  const at = rewardedAt || now;
  st.account = Object.assign({}, st.account || {}, { reward: at });
  return { at, show: p.show };
}
// P20-07 앱 안 브라우저 (사용자 에이전트 → 종류). 구글 로그인은 앱 안 웹뷰에서 막힘(disallowed_useragent)
const IN_APPS = [['kakao', /KAKAOTALK/i], ['instagram', /Instagram/i], ['facebook', /FBAN|FBAV|FB_IAB/i], ['line', /\bLine\//i], ['naver', /NAVER\(inapp/i],
  ['daum', /DaumApps/i], ['everytime', /everytimeApp/i], ['google', /\bGSA\//], ['webview', /; wv\)/]];
function inAppBrowser(ua) {
  ua = ua || '';
  const hit = IN_APPS.find(([, re]) => re.test(ua));
  if (!hit) return null;
  return { app: hit[0], os: /Android/i.test(ua) ? 'android' : /iP(hone|ad|od)/.test(ua) ? 'ios' : 'other' };
}
// 바깥 브라우저로 같은 주소 열기: 카카오톡은 자기 주소, 안드로이드는 Chrome intent, 그 밖은 null(메뉴 안내 · 주소 복사)
function outsideUrl(href, info) {
  if (!info) return null;
  const url = String(href).split('#')[0];
  if (info.app === 'kakao') return 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
  const m = url.match(/^(https?):\/\/(.*)$/);
  if (info.os === 'android' && m) return `intent://${m[2]}#Intent;scheme=${m[1]};package=com.android.chrome;end`;
  return null;
}

