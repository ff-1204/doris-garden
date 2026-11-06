// 도리의 정원 — 게임 규칙 엔진 조각 2/10: 상태(create) · 알림(addLog) · 시간 진행(advance · onSlot)
// P66(11-03): 예전 한 파일 engine.js(줄 322 ~ 597)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
'use strict';
// ---------------------------------------------------------------- 상태
function create(now, rng) {
  rng = rng || defaultRng;   // R-D2
  const cal = calendar(now);
  // P04-04 시작 선물은 없앰 (10-06). 예전 저장의 st.starterGift 표시는 app.js 첫걸음 순서에서만 씀
  return _create(now, rng, cal);
}
function _create(now, rng, cal) {
  const tiles = [];
  for (let i = 0; i < W * H; i++) tiles.push({ t: BASE_T + (rng() - 0.5) * 1.5, m: BASE_M + (rng() - 0.5) * 4, life: 0 });
  return {
    // P04-05: 꽃잠에 시작하면 그 꽃잠은 0년차(준비), 1년차는 다음 월요일 3월부터 (10-17)
    v: 3, firstWeek: cal.frozen ? cal.week + 1 : cal.week, startedInSleep: cal.frozen, virtual: now, lastReal: now, lastAbs: cal.abs, speed: 1,
    money: 15000,                                                         // P17-06
    tiles, flowers: [], items: [], petals: [], teas: [], pending: [], reservations: [],
    drying: [], dried: [], blends: [], cups: [], preserving: [], preserved: [], presol: 0,   // P12-07 꽃방, P12-08 블렌딩, P17-10 찻잔 · P53 🌹 꽃방 유리 돔 · 창고 프리저브드 · 🧪 특수 용액
    fert: 0, water: 10, shears: 5, hoe: 10, basket: 10, shovel: 10, jar: 0, mutBoost: null, weedCount: 0, pruneCount: 0,   // jar · mutBoost: P36 🫙 유리 관 · 꽃잠 장식 돌연변이 보정 (mutBoost는 P62부터 안 읽음) // 처음에 물병 10개, 가위 1개(5번), 호미·바구니 1개(10번)
    dex: { form: {}, flower: {}, petal: {}, teabag: {}, bagBlend: {}, tea: {}, land: { barren: true }, blend: {}, deco: {}, honey: {}, mine: {}, memento: {}, letter: {}, mutant: {}, mutjar: {}, pres: {}, presMut: {} }, // P53 🌹 프리저브드 도감 꽃 · 변이 (도감 93칸과 따로) · P36 🧬 돌연변이 도감 · 유리 관에 담은 종 (도감 93칸 · dexCount엔 안 셈) · P08-01-04, P08-02, P08-03
    log: [], records: [], yearLog: [], yearNow: newYearNow(), yearPace: Object.assign(newYearPace(0), { now: Array.from({ length: yearMonth(cal) }, () => [0, 0]) }), yearBest: null, helpYear: null, nextId: 1,   // P28-07-01 해마다 기록 · 올해 쌓는 중 · P28-07-02 달마다 쌓인 값 (시작 전 달은 0)
    settings: { toast: { 3: true, 8: true, 9: true }, sleep: { on: true, from: 23, to: 7 }, marks: { water: true, weed: true, prune: true, fert: true }, slow: false, big: false, pattern: false, notify: false },   // notify: R-C2 🔔 브라우저 알림(화면이 뒤에 있을 때)   // slow: P28-02 느긋하게 보기 · big: P28-01 큰 글씨 · pattern: P28-03 땅 무늬
    onboarded: false, _fertNew: 0, _bloomNew: {}, awayLast: null, farm: null, bonusFree: {}, pollenExtra: 0, bonusOwn: {}, speedSteps: SPEED_V,   // P40-03 더 받은 꽃가루 · P38 새 정원은 덜어 줄 꽃가루 없음 (1포기부터) · P32-02 지난번 자리를 비운 동안 (🐝 곤충농장에서 다시 보기) · 일꾼들이 지난달 한 일
    journal: { done: {} }, titles: {}, titleOn: null, topDeco: null, stats: {}, grade: newGrade(), gardenId: newGardenId(), lastExport: null, mig: MIGRATIONS.length,   // P19 도감일지 · P20 이름표 · 마지막 파일 저장 · mig: 예전 저장 보정을 어디까지 했는지(새 정원은 다 한 것)
    shop: newShop(), decos: [], honey: {}, gift: null, firstFlower: null, mine: newMine(), orders: null, bestScore: 0, gifts: null, letterPending: [], letterBox: [], pantry: newPantry(), restClosed: null, account: null, actAt: null, resetAt: null, weekly: null, firstGuest: null, mailGot: {}, layers: newLayers(), forest: newForest(), yearly: newYearly(), visitors: newVisitors(), bonus: newBonus(), season: Object.assign(newSeason(), { startedAt: now }), mailSeenAt: now,   // P28-08-03 🌸 새 철 · P28-05-02 🌟 고른 등급 보너스 · P29 📮 운영자 편지 받은 기록 · P22-05 🍵 첫 손님 한 번 (꾸러미를 받으면 true) · P28-09 이번 주 목표 · P16-12-03 처음부터 다시 시작한 때 · P20-08 계정 기록 · P20-06 마지막으로 손댄 때 · P24 광산 · P17-15 찻집 가꾸기 · P17-16 장식 · P18 꿀 · P22 이웃의 화분 · 1장 첫 꽃
  };
}
const nid = st => st.nextId++;
const inGarden = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < W && y < H;   // 정원의 한 칸 (10-24)
const plantUnit = F => F.life === 'tree' || F.form === 'sapling' ? '그루' : '포기';   // P16-02-05 세는 말: 나무 · 묘목은 그루
const unitOf = fs => fs.length && fs.every(f => plantUnit(FLOWERS[f.type]) === '그루') ? '그루' : '포기';

// ---------------------------------------------------------------- 알림 (P11)
const TOAST_TYPES = [3, 8, 9];                   // P11-02-01-a
// P28-02 🐢 느긋하게 보기 (10-27): 켜면 퀘스트 띠 · 주문 쪽지 · 점수 · 칭호 연출을 숨김. 얻는 규칙은 그대로, 보이는 것만
// 새 숫자 · 목표 화면(정원 등급 · 그래프 · 주간 목표 · 효율 표 …)은 이 함수를 따른다 — 숨길지 여기 하나만 봄
const slowView = st => !!(st && st.settings && st.settings.slow);
const bigView = st => !!(st && st.settings && st.settings.big);           // P28-01 큰 글씨 · 넓은 단추 (보기만 — 규칙 · 돈은 그대로)
const patternView = st => !!(st && st.settings && st.settings.pattern);   // P28-03 땅 무늬 보기 (보기만)
function addLog(st, type, text, ctx) {
  const cal = calendar(st.virtual);
  const line = { y: yearOf(st, cal), m: cal.month, d: cal.day, type, text };
  if (newsKind(line)) line.at = st.virtual;          // P31-01 ✉️ 편지함 소식 줄만 시각을 적음 (안 읽은 것 셈 — 다른 줄은 저장 크기 그대로)
  st.log.push(line);
  if (st.log.length > 600) st.log.shift();
  if (ctx && ctx.live && TOAST_TYPES.includes(type) && st.settings.toast[type] && ctx.toast) ctx.toast(text, type);
}
function flushPending(st, ctx) {
  autoDryTick(st);                                 // P72-02 ⚙️ 자동 건조기 — 거둔 꽃잎을 바로 꽃방에
  if (st._fertNew > 0) { addLog(st, 10, `비료 ${st._fertNew}개가 만들어졌어요`, ctx); st._fertNew = 0; }
  if (st._autoSold && st._autoSold.n) { const pt = st._autoSold.k ? teaPriceText(st, { frozen: st._autoSold.k === 'sleep', month: 12 }) : ''; addLog(st, 13, `손님이 찻잔 ${st._autoSold.n}잔을 사 갔어요 · +${st._autoSold.sum.toLocaleString('ko-KR')}원${pt ? ` · ${pt}` : ''}`, ctx); st._autoSold = { n: 0, sum: 0 }; }   // P34 철 값
  if (st._driedNew > 0) { addLog(st, 12, `꽃방에서 꽃잎 ${st._driedNew}장이 다 말랐어요`, ctx); st._driedNew = 0; }
  if (st._rackBagNew > 0) { addLog(st, 12, `건조 선반에서 말린 꽃잎 ${st._rackBagNew}장이 티백이 됐어요`, ctx); st._rackBagNew = 0; }   // P39-09-01 🧺   // P28-10-02
  const b = st._bloomNew;
  for (const k in b) {
    const F = FLOWERS[k], n = b[k];
    addLog(st, 8, n > 1 ? `${F.name} ${n}${plantUnit(F)}가 피었어요 · 거둘 수 있어요` : `${josa(F.name, '이/가')} 피었어요 · 거둘 수 있어요`, ctx);
  }
  st._bloomNew = {};
}
function addFert(st, n) { st.fert += n; st._fertNew += n; }

// ---------------------------------------------------------------- 시간 진행
function advance(st, target, ctx) {
  while (st.virtual < target - 1) {
    const cal = calendar(st.virtual);
    let next = Math.min(target, cal.slotEnd, st.virtual + STEP_H * HOUR);
    if (next <= st.virtual) next = Math.min(target, st.virtual + STEP_H * HOUR);   // R-D3 (11-05 검토): 서머타임이 끝나는 169시간짜리 주의 마지막 시간은 slotEnd(주 시작 + 168h)가 이미 지나 있음 — 뒤로 가지 않고 앞으로
    const dtH = (next - st.virtual) / HOUR;
    if (!cal.frozen && dtH > 0) step(st, dtH, cal, ctx);
    if (dtH > 0) helperTick(st, cal);                                  // P28-10-03 찻집 일손이 카운터를 채움 (팔기 바로 앞)
    if (dtH > 0) autoSell(st, cal, dtH, ctx);                          // P17-11 카운터 찻잔은 꽃잠에도 팔림
    if (dtH > 0) mineRegen(st, dtH);                                   // P24 광산 기력 (꽃잠에도)
    if (dtH > 0) presTick(st, dtH, ctx);                               // P53 🌹 프리저브드 유리 돔 (꽃잠에도 · 현실 하루)
    if (dtH > 0) dryTick(st, dtH, ctx);                                // P47 꽃방은 꽃잠에도 마름 (11-01 사용자 요청)
    if (!cal.frozen && dtH > 0) pantryTick(st, cal, dtH);              // P28-04 정원 저장고 (꽃잠엔 멈춤)
    st.virtual = next;
    const nc = calendar(st.virtual);
    if (nc.abs !== st.lastAbs) { st.lastAbs = nc.abs; onSlot(st, nc, ctx); autoDryTick(st); }   // P72-02 달이 바뀔 때 생긴 꽃잎도 바로 (개미 꽃잎은 insectTick 안에서 건조 선반보다 먼저)
  }
  flushPending(st, ctx);
  { const c = calendar(st.virtual); if (c.idx >= FARM_GIFT_IDX) farmGift(st, c, ctx); }   // P49 🧺 농장 정착금: 다 따라잡은 "지금"이 주말(토요일 아침 6시 ~ 월요일 아침 6시)일 때만 — 주말에 들어와야 받음 (비운 주말은 따라잡아도 안 옴)
  { const c = calendar(st.virtual); if (teaShopOpen(c) && (!st.orders || st.orders.abs !== c.abs)) makeOrders(st, c); }   // P23-01 찻집이 열린 채로 시작 · 열어도 그 달 쪽지 (QA 5회차)
  checkLands(st, ctx);
  checkHelp(st, calendar(st.virtual), ctx);
  checkJournal(st, ctx);
  gradeDexSync(st, ctx);                                               // P28-05-01 늘어난 도감 칸
  weeklyOf(st);                                                        // P28-09 이번 주 목표 (처음 · 3주 넘게 건너뛴 뒤에도)
}

function step(st, dtH, cal, ctx) {
  // 1) 땅 (P01, P15)
  const n = W * H, WS = new Float32Array(n), WT = new Float32Array(n), WM = new Float32Array(n);
  const walls = wallSet(st);                        // P73-01 🧱 돌담 칸 (없으면 null — 검사를 건너뜀)
  for (const f of st.flowers) {
    if (f.withered) continue;
    const r = stageRadius(f);
    if (r < 0) continue;
    const F = FLOWERS[f.type];
    for (let y = Math.max(0, f.y - r); y <= Math.min(H - 1, f.y + r); y++) {
      for (let x = Math.max(0, f.x - r); x <= Math.min(W - 1, f.x + r); x++) {
        const d = Math.hypot(x - f.x, y - f.y);
        if (d > r + 0.01) continue;
        if (walls && wallBlocks(walls, f.x, f.y, x, y)) continue;   // P73-01 담 칸 · 담 너머는 이 꽃의 땅 영향이 안 감
        const w = 1 - d / (r + 1), i = y * W + x;
        WS[i] += w; WT[i] += w * F.t; WM[i] += w * F.m;
      }
    }
  }
  const bt = BASE_T + SEASON_T[cal.season], bm = BASE_M;
  const decay = (1 - LIFE_MIN) / (12 * MONTH_H) * LIFE_DECAY_SEASON[cal.season];  // P15-05: 약 1년
  for (let i = 0; i < n; i++) {
    const tl = st.tiles[i], w = WS[i];
    if (w > 0) {
      const k = 1 - Math.exp(-0.15 * Math.min(w, 1.5) * dtH);
      tl.t += (WT[i] / w - tl.t) * k;
      tl.m += (WM[i] / w - tl.m) * k;
      tl.life = Math.min(1, tl.life + (1 - tl.life) * k * 1.2);
    } else {
      tl.life = Math.max(0, tl.life - decay * dtH);
    }
    const a = 0.004 * dtH * (1 - Math.min(w, 1));                             // 계절 기본 온도 쪽으로 (가장자리와 빈 땅)
    tl.t += (bt - tl.t) * a; tl.m += (bm - tl.m) * a;
  }

  // 2) 꽃 (P07, P13)
  for (const f of st.flowers) {
    if (f.withered) continue;
    const F = FLOWERS[f.type];
    if (f.lifeH == null) f.lifeH = f.ageH;          // 심은 뒤 실제로 흐른 시간 (QA 12회차: 수명 · "심은 지"는 이걸로)
    f.ageH += dtH * growRate(st, f);                // P27 생장 장치 (없으면 1) — 다 자라기까지만 빨라짐
    f.lifeH += dtH;
    if (ripeOn(f, cal.month)) {                     // P72-01 다 자란 뒤 시계 (휴면 달엔 멈춤) · 🌱 자라는 속도는 처음 피기까지만 (P61-02)
      const k = f.bloomKey === -1 ? bonusVal(st, 'grow') : 1;   // 처음 핀 뒤엔 그대로 → 한해살이가 핀 뒤 사는 시간도 그대로
      f.ripeH = (f.ripeH || 0) + dtH * k; f.ripeT = (f.ripeT || 0) + dtH * k;
    }
    const s = computeStage(f, cal.month), was = f.stage;
    if (F.life === 'annual') {
      if (s === 'bloom') f.bloomed = true;
      if ((f.bloomed && (f.ripeT || 0) >= annualSpanH(F)) || (!f.bloomed && f.lifeH / MONTH_H > 12)) { wither(st, f, cal, ctx); continue; }   // P72-01 처음 핀 뒤 예전 피는 달 수만큼 흐르면 · 한 해가 넘도록 못 핀 꽃
    }
    f.stage = s;
    if (s === 'bloom' && (was !== 'bloom' || f.bloomKey === -1)) {   // P72-01 필 때마다 한 번 (거두고 다시 피면 또 — 예전엔 피는 달마다)
      const first = f.bloomKey === -1;
      if (first && f.mut == null) mutRoll(st, f, cal);                           // P36-01 처음 필 때 한 번 굴림
      f.bloomKey = cal.abs;
      if (f.mut) mutBloom(st, f, first, ctx);                                     // P36-02 변이 꽃: 꽃 도감 · 수확 알림 · 올해 본 꽃(점수 · 경험치)에 안 셈 — 품질은 아래처럼 똑같이 변함
      else {
      if (first || !st.dex.petal[f.type]) st._bloomNew[f.type] = (st._bloomNew[f.type] || 0) + 1;   // R-C1 (11-05 검토): 이미 꽃잎을 거둬 본 꽃이 다시 피는 건(6시간마다) 일지 · 알림 없음 — 처음 피거나 아직 안 거둔 꽃만. 곧 필 꽃은 정원 안내 줄(app-garden soonLine)이 알려 줌
      if (!st.dex.flower[f.type]) { st.dex.flower[f.type] = true; addLog(st, 9, `도감에 등록: ${F.name}`, ctx); }
      if (f.origin !== '이웃') (st.ownBloom = st.ownBloom || {})[f.type] = true;
      seeYear(st, 'bloom', f.type);   // 직접 심어 피운 꽃 (QA 4회차: 화분 꽃과 6장 퀘스트가 겹치지 않게)
      }
    }
    const { pos, neg } = monthlyChange(st, f);
    f.q = Math.min(1, f.q + pos / 100 * dtH / MONTH_H);
    if (neg > 0 && f.q > 0.3) f.q = Math.max(0.3, f.q - neg / 100 * dtH / MONTH_H); // P13-05-04-a
    f.waterH = Math.max(0, f.waterH - dtH);
    if (f.waterH <= 0) f.thirstH += dtH;
    f.weedH = Math.max(0, f.weedH - dtH);
    f.pruneH = Math.max(0, f.pruneH - dtH);
    f.fertH = Math.max(0, f.fertH - dtH);
    f.adaptH = Math.max(0, f.adaptH - dtH);
  }

  // 3) 창고 (P06-07, P06-14, P06-15)
  for (let i = st.items.length - 1; i >= 0; i--) {
    const it = st.items[i];
    if (it.packaged) {                                                         // P06-15-07-a 특수 포장
      if (FLOWERS[it.type].sow.includes(cal.month)) it.packaged = false; else continue;
    }
    it.ageH += dtH;
    it.q = Math.max(0, it.q - 0.05 * dtH / MONTH_H);                           // P06-15-10
    if (it.q <= 0 && germOf(it) <= 0) { st.items.splice(i, 1); addFert(st, 1); } // P13-04-01
  }
  autoCompost(st, ctx);                                                        // P06-16-03
  // 4) 찻집 (P12-04)
  for (let i = st.petals.length - 1; i >= 0; i--) {
    const p = st.petals[i];
    p.q = Math.max(0, p.q - 0.2 * dtH / MONTH_H);
    if (p.q <= 0) { st.petals.splice(i, 1); addFert(st, 1); }
  }
  for (let i = st.teas.length - 1; i >= 0; i--) {
    const t = st.teas[i];
    // P12-12 (10-06): 티백이 되는 순간 품질이 그대로 멈춤 (생화 티백 · 티백 · 블렌드 티백 모두). 품질이 줄어드는 건 제다실의 생화뿐
    if (t.q <= 0) { st.teas.splice(i, 1); addFert(st, 1); }
  }
  // 5) 꺾꽂이·접붙이기로 뿌리 내리는 중인 것 (P06-02-05-a-2)
  for (let i = st.pending.length - 1; i >= 0; i--) {
    const p = st.pending[i];
    p.dueH -= dtH;
    if (p.dueH <= 0) {
      p.qs.forEach((q, i) => { const it = newItem(st, p.type, q, '번식', p.parent); if (p.muts && p.muts[i]) it.mut = true; st.items.push(it); });   // P36 변이는 씨앗마다 50%
      st.pending.splice(i, 1);
      const F = FLOWERS[p.type];
      addLog(st, 10, `${F.name} ${FORM[F.form].name} ${p.qs.length}개가 뿌리를 내려 창고에 들어왔어요`, ctx);   // 일지에만 (QA 19회차)
    }
  }
}

function wither(st, f, cal, ctx) {                // P07-02
  f.withered = true; f.stage = 'withered'; f.witherAbs = cal.abs;
  const F = FLOWERS[f.type];
  if (F.prop === '채종' && f.bloomed) {           // P07-02-01 자동 채종
    const n = propCount(f.q), half = insectNear(st, 'hive', f);
    for (let i = 0; i < n; i++) { const it = newItem(st, f.type, propQuality(f.q, ctx && ctx.rng || defaultRng, half, titlePerk(st, 'prop')), '번식', F.name); if (mutSeed(st, f, i, cal)) it.mut = true; st.items.push(it); }   // P36 변이 꽃의 씨앗은 50%
  }
}

const DAILY_GIFT = 500;                          // P17-13 (10-06)
// P49 🧺 농장 정착금 (11-01 사용자 요청): 주말에 한 번 — 토요일 아침 6시(idx 10) ~ 일요일 끝(idx 13) 사이에 들어오면 농장 할머니 편지에 10,000원 ("토요일에서 일요일 동안 들어오면 받는 걸로" — 비운 주말은 쌓이지 않음). 편지를 열어 🎁 받기를 눌러야 돈이 들어옴(안 열면 편지함에 남음). 한 주에 한 통(id에 주 번호)
const FARM_GIFT = 10000, FARM_GIFT_IDX = 10, FARM_GIFT_FROM = '농장 할머니';
const farmGiftId = week => `farm-gift-${week}`;
function farmGift(st, cal, ctx) {
  st.mailGot = st.mailGot || {}; st.letterBox = st.letterBox || [];
  const id = farmGiftId(cal.week); if (has(st.mailGot, id)) return false;
  st.mailGot[id] = st.virtual;
  const text = '이번 주도 정원 일구느라 애썼어요. 농장 정착금을 조금 넣었어요. 씨앗 값에 보태서 쓰세요.';
  st.letterBox.push({ k: null, mail: { id, from: FARM_GIFT_FROM, title: '농장 정착금', text, gifts: [{ cat: 'money', key: 'won', n: FARM_GIFT }] }, took: null, y: yearOf(st, cal), m: cal.month, read: false, at: st.virtual });
  trimLetterBox(st);
  addLog(st, 17, `📮 새 편지가 왔어요 · ${FARM_GIFT_FROM}「농장 정착금」 · 🎁 선물이 있어요`, ctx);
  if (ctx && ctx.live && ctx.toast) ctx.toast('📮 농장 할머니 편지가 왔어요');
  return true;
}
function onSlot(st, cal, ctx) {
  const yr = yearOf(st, cal);
  flushPending(st, ctx);
  deliverLetters(st, cal, ctx);                                                // P26 답장 편지
  if (st._helperBrew) { addLog(st, 13, `찻집 도우미가 찻잔 ${st._helperBrew}잔을 우렸어요`, ctx); st._helperBrew = 0; }   // P39-09-02 🫖 (예전 P28-10-03 나비) 달마다 한 줄 (잔마다 남기면 일지가 넘침)
  if (cal.idx === 0) weeklyOf(st);                                             // P28-09 월요일 아침 6시: 이번 주 목표 (지난 주 것은 벌칙 없이 사라짐)
  const ended = calendar(st.virtual - 1000);
  if (!ended.frozen) { hiveTick(st, ctx); insectTick(st, ended, ctx); } else lampTick(st);   // P44-04 🏮 석등: 꽃잠 달 끝에 둘레 꽃 품질 +1%   // P39 🐝 곤충 일곱이 둘레 꽃을 돌봄 (물 · 잡초 · 비료 · 가지치기 → 개미 거두기) · 🧺 건조 선반 (개미가 거둔 꽃잎을 선반이 바로 넒)
  farmMark(st, ended);                                                         // P32-02 🐝 곤충농장: 지난 한 달 일꾼들이 한 일 (꽃잠 달도 — 찻집 · 티백은 흐르는 시간에 일함)
  if (teaShopOpen(cal)) { makeOrders(st, cal); if (!slowView(st)) addLog(st, 15, '찻집에 새 주문 쪽지가 왔어요', ctx); }   // P23-01 · 느긋하게 보기면 쪽지 소식은 남기지 않음 (P28-02) · P34 달마다
  else if (st.orders) st.orders = null;   // 닫힌 달엔 쪽지를 치움 (P34부터는 닫힌 달이 없음)
  // 시든 한해살이는 다음 달에 사라지며 비료 1개 (P07-02)
  st.flowers = st.flowers.filter(f => { if (f.withered && cal.abs > f.witherAbs) { addFert(st, 1); return false; } return true; });
  paceMark(st, cal);                                                            // P28-07-02 끝난 달까지 쌓인 수입 · 경험치 (기록 앞에)
  if (cal.idx === 12) recordYear(st, cal, ctx);                                 // P04-02
  // P17-13 하루 용돈: 요일이 바뀔 때(매일 아침 6시, 짝수 idx)마다 500원. 꽃잠(일요일)도 받음
  if (cal.idx % 2 === 0) { const gw = Math.round(DAILY_GIFT * titlePerk(st, 'gift')); st.money += gw; addLog(st, 11, `${'월화수목금토일'[cal.idx / 2]}요일 아침, 용돈 ${gw}원이 들어왔어요`, ctx); }   // P52 🌅
  // 예약 배송 (P06-05)
  for (const r of st.reservations) {
    if (r.done || r.year !== yr || r.deliverIdx !== cal.idx) continue;
    for (let i = 0; i < r.qty; i++) { const it = newItem(st, r.type, seedQ(st), '예약'); it.packaged = true; st.items.push(it); }
    r.done = true;
    const F = FLOWERS[r.type];
    addLog(st, 3, `예약한 ${F.name} ${FORM[F.form].name} ${r.qty}${FORM[F.form].unit}가 도착했어요`, ctx);
  }
  st.reservations = st.reservations.filter(r => !r.done || r.year >= yr);
  // 심을 때 (P11-01-01)
  for (const k of FLOWER_KEYS) {
    const F = FLOWERS[k];
    if (!F.windows.some(w => w[0] === cal.month)) continue;
    const have = st.items.filter(it => it.type === k && germOf(it) > 0).length;
    addLog(st, 1, `${josa(F.name, '을/를')} 심을 때예요 · 화원에 ${josa(FORM[F.form].name, '이/가')} 들어왔어요${have ? ` · 창고에도 ${have}개 있어요` : ''}`, ctx);
  }
  flushPending(st, ctx);
  checkLands(st, ctx);
  if (cal.idx === 0) { layerCheck(st, ctx); forestTick(st); } else layerSync(st);   // P30-01-01 새 층은 새해 3월 아침에만 · 1~3층 연 해는 달마다 적음 · P30-03 숲 나무는 해가 바뀐 뒤 아침에 한 단계 · (P36-01 꽃잠 장식 돌연변이 보정은 P62-02부터 꽃이 처음 필 때 mutChance가 직접 봄)
  mutSync(st, ctx);                                                            // P36-05 놓인 변이 꽃의 지금 단계를 도감에
  yearlyTick(st, cal, ctx, !!(ctx && ctx.live));                              // P30-05-01 올해만 오는 것: 새 계절 일지 한 줄 · 끝난 계절 놓침 · 열어 둔 채면 봤음 (쉼달 기록 뒤 — 꽃잠은 다음 해 번호)
  visitorTick(st, cal, ctx);                                                   // P30-06-01 특별 손님: 떠남 · 새로 옴 (올해만 것 본 뒤라 그 조건을 바로 읽음)
}

function recordYear(st, cal, ctx) {
  const yr = yearOf(st, cal);
  flushPending(st, ctx); gradeDexSync(st, ctx);                              // P28-05-01 늘어난 도감 칸은 기록 앞에
  const sc = yearScore(st), prevBest = st.bestScore || 0;   // P23-02 한 해 정원 평가
  const rec = { year: yr, season: seasonN(st), path: seasonPath(st), counts: landCounts(st), best: st.yearBest, dex: dexCount(st), dexTotal: dexTotal(st), titleOn: st.titleOn || null, log: st.log.slice(), snapshot: null, score: sc.total, scoreParts: sc.parts, orders: sc.orders, giftsTotal: sc.giftsTotal, prevBest };
  const row = yearRow(st, rec, sc); addYearLog(st, row);                      // P28-07-01
  st.yearNow = newYearNow();
  st.bestScore = Math.max(prevBest, sc.total);
  st.yearSeen = { bloom: {}, blend: {}, honey: {} };   // 새해에 다시
  st.records.unshift(rec);
  st.records = st.records.slice(0, 10);
  if (ctx && ctx.onRecord) ctx.onRecord(rec);
  st.log = [];                                                                // P11-02-04-e: 쉼달에 초기화
  st.yearBest = null;
  addLog(st, 7, `${yr}년차 정원을 기록했어요${slowView(st) ? '' : ` · 🏅 정원 점수 ${sc.total}점${sc.total > prevBest && prevBest ? ' · 최고 기록!' : ''}`}`, ctx);   // 점수는 기록(rec)에는 남기고 일지 줄에서만 뺌 (P28-02)
  addLog(st, 4, '다음 해 꽃을 예약할 수 있어요', ctx);
  addXp(st, 'year', yearXpOf(sc), ctx); row.grade = gradeOf(st).grade;        // P28-05-01 한 해 평가도 등급 경험치로 — 오른 줄은 새해 일지에, 해마다 기록의 grade는 그 뒤 등급
  const p = st.yearPace || {};                                                // P28-07-02 올해 달마다 쌓인 값 → 지난해로 (한 해 평가 경험치는 어느 해에도 넣지 않음)
  st.yearPace = Object.assign(newYearPace((st.grade && st.grade.xp) || 0), p.xp0 != null ?{ last: p.now || [], lastYear: yr } : {});
}

