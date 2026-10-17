// 도리의 정원 (Dori's Garden) — 게임 규칙 엔진 (화면과 분리)
// 기획 체크리스트 P01–P17 기준. 번호는 주석에 함께 적어 둠.
(function (root) {
'use strict';

const HOUR = 3600e3, WEEK = 7 * 24 * HOUR;
const W = 30, H = 20;
const STEP_H = 0.25;            // 시뮬레이션 한 걸음 (현실 시간)
const SLOT_H = 12;              // P03: 한 달 = 현실 12시간
const GAME_DAY_H = 0.8;         // P05: 게임 하루 = 현실 48분 → 한 달 15일
const MONTH_H = SLOT_H;         // "흐르는 달" 한 달의 길이
// P02, P03, P04: 월요일 06시 = 3월, 일요일 = 쉼달(06–18시)·꽃샘달(18–06시)
const MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14];
const SEASONS = ['봄', '여름', '가을', '겨울', '꽃잠'];
const EPOCH = new Date(2000, 0, 3, 6).getTime(); // 2000년 1월 3일 월요일 06시
const monthName = m => m === 13 ? '쉼달' : m === 14 ? '꽃샘달' : m + '월';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// 받침에 맞는 조사: josa('장미', '을/를') → '장미를'
function josa(word, pair) {
  const [a, b] = pair.split('/');
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return word + b;
  const jong = (c - 0xac00) % 28;
  if (pair === '으로/로') return word + (jong === 0 || jong === 8 ? b : a);
  return word + (jong ? a : b);
}

// ---------------------------------------------------------------- 달력
function weekStart(ms) {
  const d = new Date(ms - 6 * HOUR);
  const day = (d.getDay() + 6) % 7;
  d.setHours(6, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}
function calendar(ms) {
  const ws = weekStart(ms), yh = (ms - ws) / HOUR;
  const idx = clamp(Math.floor(yh / SLOT_H), 0, 13);
  const into = yh - idx * SLOT_H;
  const week = Math.round((ws - EPOCH) / WEEK);
  return {
    ms, ws, yh, idx, week,
    month: MONTHS[idx],
    season: Math.min(4, Math.floor(idx / 3)),
    frozen: idx >= 12,                                   // P04-01: 꽃잠에는 정원의 시간이 멈춤
    day: Math.min(15, Math.floor(into / GAME_DAY_H) + 1),
    hour: (into % GAME_DAY_H) / GAME_DAY_H * 24,
    abs: week * 14 + idx,
    slotStart: ws + idx * SLOT_H * HOUR,
    slotEnd: ws + (idx + 1) * SLOT_H * HOUR,
  };
}
const yearOf = (st, cal) => cal.week - st.firstWeek + 1;
// P17-09 찻집은 겨울부터 (12월 · 1월 · 2월 · 쉼달 · 꽃샘달 = idx 9~13, 금요일 저녁 6시 ~ 일요일) — 10-06 변경 (예전 토·일)
const SHOP_OPEN_IDX = 9;
const teaShopOpen = cal => cal.idx >= SHOP_OPEN_IDX;
const hoursToShopOpen = ms => { const c = calendar(ms); return teaShopOpen(c) ? 0 : (c.ws + SHOP_OPEN_IDX * SLOT_H * HOUR - ms) / HOUR; };

// 지금부터 "흐르는 시간" flowH가 지난 뒤의 달력 (꽃잠은 건너뜀)
function calendarAfterFlow(ms, flowH) {
  let t = ms, rem = flowH, guard = 0;
  while (rem > 1e-9 && guard++ < 400) {
    const c = calendar(t);
    if (c.frozen) { t = c.slotEnd; continue; }
    const left = (c.slotEnd - t) / HOUR;
    if (rem <= left) { t += rem * HOUR; rem = 0; } else { rem -= left; t = c.slotEnd; }
  }
  while (calendar(t).frozen && guard++ < 400) t = calendar(t).slotEnd;  // 꽃잠에 걸리면 다음 흐르는 달로
  return calendar(t);
}
// 조건을 처음 만족하는 달이 시작될 때까지 (현실 시간 기준)
function untilMonth(ms, test) {
  let t = ms, guard = 0;
  while (guard++ < 40) {
    const c = calendar(t);
    if (c.slotStart > ms - 1 && test(c)) return { cal: c, hours: (c.slotStart - ms) / HOUR };
    t = c.slotEnd;
  }
  return null;
}

// ---------------------------------------------------------------- 꽃 (P09, P15-08, P17)
const FORM = {
  seed: { name: '씨앗', rate: '발아율', unit: '봉지' },        // 세는 말 (10-06): 화원에서 쓰는 단위
  sapling: { name: '묘목', rate: '뿌리내림', unit: '그루' },
  seedling: { name: '모종', rate: '뿌리내림', unit: '포기' },
  rhizome: { name: '연근', rate: '뿌리내림', unit: '뿌리' },
};
const LIFE = { annual: '한해살이', perennial: '여러해살이', tree: '나무' };
const FLOWERS = {
  chamomile: { name: '캐모마일', tea: '캐모마일차', life: 'annual', form: 'seed', sow: [3, 4, 9], bloom: [5, 6, 7], mature: 2, t: 17, m: 40, price: 500, teaBase: 800, prop: '채종', propMonths: [], prune: false,
    petal: '#fbfbf5', center: '#f2c230', look: 'daisy', n: 12,
    story: '사과 향이 나는 작은 데이지꽃이에요. 꽃송이를 말려 차로 마셔요.' },
  bpea: { name: '버터플라이피', tea: '버터플라이피차', life: 'annual', form: 'seed', sow: [5], bloom: [7, 8, 9], mature: 2, t: 31, m: 68, price: 600, teaBase: 1000, prop: '채종', propMonths: [], prune: false,
    petal: '#2d4fcf', center: '#f4f4f0', look: 'round', n: 4,
    story: '파란 꽃잎을 우리면 푸른 차가 되고, 레몬을 떨어뜨리면 보랏빛으로 바뀌어요.' },
  hibiscus: { name: '히비스커스', tea: '히비스커스차', life: 'annual', form: 'seed', sow: [4, 5], bloom: [9, 10], mature: 4, t: 31, m: 82, price: 500, teaBase: 800, prop: '채종', propMonths: [], prune: false,
    petal: '#c4242f', center: '#f3d25a', look: 'round', n: 5,
    story: '로젤의 붉은 꽃받침을 말려 새콤한 붉은 차를 만들어요.' },
  marigold: { name: '메리골드', tea: '메리골드차', life: 'annual', form: 'seed', sow: [6, 7], bloom: [8, 9, 10], mature: 2, t: 21, m: 32, price: 500, teaBase: 1000, prop: '채종', propMonths: [], prune: false,
    petal: '#f39a1e', center: '#c9561a', look: 'daisy', n: 16,
    story: '주황빛 겹꽃이 한여름부터 가을까지 피어요. 말린 꽃을 우리면 노란 차가 돼요.' },
  celosia: { name: '맨드라미', tea: '맨드라미차', life: 'annual', form: 'seed', sow: [7, 8], bloom: [9, 10, 11], mature: 2, t: 25, m: 40, price: 600, teaBase: 1000, prop: '채종', propMonths: [], prune: false,
    petal: '#e23a5e', center: '#a8183a', look: 'spike', n: 6,
    story: '닭 볏을 닮은 붉은 꽃이에요. 늦여름에 심어 가을에 거두고, 말려서 붉은 차로 우려요.' },
  lavender: { name: '라벤더', tea: '라벤더차', life: 'perennial', form: 'sapling', sow: [3, 4, 6], bloom: [6, 7], mature: 2, t: 28, m: 12, price: 2500, teaBase: 800, prop: '꺾꽂이', propMonths: [3, 4, 5, 6], prune: true,
    petal: '#8a6cc8', center: '#5d4a91', look: 'spike', n: 7,
    story: '햇볕과 마른 땅을 좋아하는 보랏빛 꽃이에요. 향이 오래 남아요.' },
  jasmine: { name: '재스민', tea: '재스민차', life: 'perennial', form: 'sapling', sow: [4, 5, 6], bloom: [7, 8], mature: 2, t: 27, m: 50, price: 5000, teaBase: 1600, prop: '꺾꽂이', propMonths: [3, 4, 5, 6], prune: true,
    petal: '#ffffff', center: '#e9dfa0', look: 'star', n: 5,
    story: '여름 밤에 짙은 향을 내는 하얀 꽃이에요. 차에 향을 입힐 때도 써요.' },
  gamguk: { name: '감국', tea: '국화차', life: 'perennial', form: 'seedling', sow: [3, 4, 6], bloom: [10, 11], mature: 3, t: 7, m: 36, price: 1200, teaBase: 2400, prop: '포기나누기', propMonths: [3, 10, 11], prune: false,
    petal: '#f2c624', center: '#d99a12', look: 'daisy', n: 14,
    story: '늦가을 산기슭에 피는 작은 노란 국화예요. 말려서 국화차를 만들어요.' },
  rose: { name: '장미', tea: '장미차', life: 'perennial', form: 'sapling', sow: [3, 4, 10, 11, 12, 1], bloom: [5, 6], mature: 2, t: 16, m: 52, price: 5000, teaBase: 1000, prop: '꺾꽂이', propMonths: [3, 4, 5, 6], prune: true,
    petal: '#d6455d', center: '#a52a40', look: 'rose', n: 5,
    story: '꽃봉오리를 말려 차로 우려요. 봄과 초여름에 피어요.' },
  lotus: { name: '연꽃', tea: '연꽃차', life: 'perennial', form: 'rhizome', sow: [4, 5, 6], bloom: [7, 8], mature: 2, t: 19, m: 97, price: 4000, teaBase: 4000, prop: '연근 나누기', propMonths: [4], prune: false,
    petal: '#f0a3c0', center: '#f0d050', look: 'lotus', n: 8,
    story: '연꽃 씨앗은 껍질이 아주 단단해요. 경남 함안에서 발굴된 약 700년 전 씨앗이 2010년에 싹을 틔워 꽃을 피웠고, 아라홍련이라는 이름을 얻었어요.' },
  dongbaek: { name: '동백', tea: '동백꽃차', life: 'tree', form: 'sapling', sow: [3, 4, 10, 2], bloom: [12, 1, 2], mature: 3, t: 26, m: 52, price: 3000, teaBase: 1600, prop: '꺾꽂이', propMonths: [3, 4, 5, 6], prune: true,
    petal: '#c81f3a', center: '#f2c94c', look: 'rose', n: 5,
    story: '한겨울에 붉게 피는 꽃이에요. 꽃잎을 덖어 차로 마셔요.' },
  maehwa: { name: '매화', tea: '매화차', life: 'tree', form: 'sapling', sow: [3, 11, 12, 1, 2], bloom: [2, 3], mature: 8, t: 8, m: 50, price: 5000, teaBase: 3000, prop: '접붙이기', propMonths: [2, 3], prune: true,
    petal: '#fbe3ea', center: '#d9a03a', look: 'round', n: 5,
    story: '추위가 채 가시기 전에 피는 꽃이에요. 봉오리를 따서 매화차를 만들어요.' },
  napmae: { name: '납매', tea: '납매차', life: 'tree', form: 'sapling', sow: [3, 11, 12, 1, 2], bloom: [1, 2], mature: 6, t: 8, m: 42, price: 12000, teaBase: 3200, prop: '접붙이기', propMonths: [2, 3], prune: true,
    petal: '#f1d36a', center: '#9a5b2a', look: 'round', n: 6,
    story: '한겨울에 노란 꽃을 피우는 귀한 나무예요. 향이 맑아요.' },
};
const FLOWER_KEYS = Object.keys(FLOWERS);
for (const k of FLOWER_KEYS) {
  const F = FLOWERS[k];
  F.key = k;
  F.baseR = F.life === 'tree' ? 2 : 1;                                  // P15-01-04-a
  F.dormant = F.life === 'annual' ? [] : [12, 1, 2].filter(m => !F.bloom.includes(m));
  F.windows = sowWindows(F.sow);
}
function sowWindows(sow) {
  const idxs = sow.map(m => MONTHS.indexOf(m)).sort((a, b) => a - b), out = [];
  for (const i of idxs) {
    const last = out[out.length - 1];
    if (last && last[last.length - 1] === i - 1) last.push(i); else out.push([i]);
  }
  return out.map(w => w.map(i => MONTHS[i]));
}
const reservationPrice = F => Math.round(F.price * 0.9);                  // P06-06-01
const deliverIdxOf = firstMonth => { const i = MONTHS.indexOf(firstMonth); return i % 2 === 0 ? i : i - 1; }; // P06-05-01

// ---------------------------------------------------------------- 땅 (P15)
const LANDS = {
  barren: { name: '황무지', color: '#a39b8e' },
  foothill: { name: '산기슭', color: '#9fae8f' },
  grassland: { name: '초원', color: '#88bd5c' },
  pond: { name: '연못', color: '#4788b5' },
  med: { name: '지중해 언덕', color: '#d8c08c' },
  subtropic: { name: '아열대 정원', color: '#5aa553' },
  tropical: { name: '열대', color: '#2a8549' },
  mossy: { name: '이끼 숲', color: '#5e8a6c' },
  wetland: { name: '습지', color: '#5b9c80' },
  dryfield: { name: '메마른 들', color: '#c8bc82' },
};
const LAND_KEYS = Object.keys(LANDS);
const LIFE_MIN = 0.35;
const BASE_T = 15, BASE_M = 25;
const SEASON_T = [0, 3, 0, -3, 0];               // P15-04-01
const LIFE_DECAY_SEASON = [1, 1.3, 1, 0.4, 0];   // P15-05-01-b
function classify(t, m) {                        // P15-01-03
  if (t < 12) return m < 60 ? 'foothill' : 'mossy';
  if (t < 23) return m >= 80 ? 'pond' : m >= 60 ? 'wetland' : m >= 30 ? 'grassland' : 'dryfield';
  return m < 30 ? 'med' : m < 60 ? 'subtropic' : 'tropical';
}
const landOf = tile => tile.life < LIFE_MIN ? 'barren' : classify(tile.t, tile.m);

// ---------------------------------------------------------------- 품질 (P06-15, P13-05)
const stars = q => q <= 0 ? 0 : Math.min(5, Math.ceil(Math.round(q * 1000) / 1000 * 100 / 20));
const pct = q => Math.round(q * 100);
function germOf(it) {                            // P06-07-07: 유효기간 12달, 뒤 8달에 S자로 0%
  const m = it.ageH / MONTH_H;
  if (m <= 12) return 1;
  if (m >= 20) return 0;
  const x = (m - 12) / 8;
  return 1 - x * x * (3 - 2 * x);
}
function qualityRadius(f) {                      // P13-04-02-d
  return FLOWERS[f.type].baseR + Math.max(1, stars(f.q)) - 1;
}
function stageRadius(f) {                        // P13-04-02-e
  const r = qualityRadius(f);
  switch (f.stage) {
    case 'germ': return 0;
    case 'sprout': return Math.floor(r / 2);
    case 'young': case 'dormant': return Math.max(0, r - 1);
    case 'mature': case 'bloom': return r;
    default: return -1;
  }
}
const STAGE = { germ: '발아 중', sprout: '새싹', young: '자라는 중', mature: '다 자람', bloom: '개화', dormant: '휴면', withered: '시듦' };
function computeStage(f, month) {                // P07
  const F = FLOWERS[f.type];
  if (f.withered) return 'withered';
  const ageM = f.ageH / MONTH_H;
  if (F.form === 'seed') {
    if (ageM < 0.15) return 'germ';
    if (ageM < F.mature * 0.5) return 'sprout';
  }
  if (ageM < F.mature) return F.dormant.includes(month) ? 'dormant' : 'young';
  if (F.bloom.includes(month)) return 'bloom';
  if (F.dormant.includes(month)) return 'dormant';
  return 'mature';
}
function landMatch(st, f) {
  const tl = st.tiles[f.y * W + f.x], F = FLOWERS[f.type];
  const et = Math.max(0, Math.abs(tl.t - F.t) - 3), em = Math.max(0, Math.abs(tl.m - F.m) - 3); // P15-08: ±3
  return clamp(1 - et / 12 - em / 30, 0, 1);
}
function vigorOf(st, f) {                        // P13-01: 땅이 맞는 정도 − 목마름, 20%에서 멈춤
  return clamp(landMatch(st, f) * 100 - 20 * (f.thirstH / MONTH_H), 20, 100);
}
function monthlyChange(st, f) {                  // P13-05 (한 달 기준 %)
  const v = vigorOf(st, f);
  let pos = 0, neg = 0;
  if (f.weedH <= 0) neg += 5;
  if (v < 50 && f.adaptH <= 0) neg += 3;          // P13-05-01-a 적응 기간
  if (v >= 80) pos += 2;
  if (f.pruneH > 0) pos += 3;
  if (f.fertH > 0) pos += 5;
  return { pos, neg, v };
}
function propCount(q) { const s = Math.max(1, stars(q)); return s <= 2 ? 1 : s <= 4 ? 2 : 3; } // P06-02-05-b
function propQuality(q, rng) {                   // P06-15-06-a, a-1, a-2
  const r = rng(), drop = r < 0.5 ? rng() * 0.05 : r < 0.8 ? 0.05 + rng() * 0.05 : 0.1 + rng() * 0.1;
  return Math.max(0.1, q - drop);
}
const teaValue = (F, q, fresh) => Math.round(F.teaBase * (0.5 + q) * (fresh ? 1.1 : 1) / 10) * 10; // P17-04, P17-05
// P12-09 햇차: ★5(품질 80% 초과) 꽃잎으로 만들면 붙는 표시, 값 +10% / P12-11 생화 티백: 말리지 않고 바로 티백, 값 −10% (10-06)
const HAT_RATE = 1.1, RAW_RATE = 0.9, RAW_DECAY = 0, TEA_DECAY = 0;   // 티백은 품질이 줄지 않음 (10-06)
const isHat = q => stars(q) === 5;
const teaItemValue = (st, t, cal) => Math.round(FLOWERS[t.type].teaBase * (0.5 + t.q) * (t.hat ? HAT_RATE : 1) * (t.raw ? RAW_RATE : 1) / 10) * 10;   // ✨ 제철 보너스는 없앰 (10-06, P17-05)
function seasonKey(st, cal) { const y = yearOf(st, cal); return y * 10 + (cal.season === 4 ? 3 : cal.season); } // P17-05-02: 꽃잠엔 겨울 티백 유지
const isFresh = () => false;   // P17-05 제철 보너스 없앰 (10-06): 찻집이 겨울에만 열려 거의 받을 수 없었음. 예전 저장의 seasonKey는 그대로 둠

// ---------------------------------------------------------------- 꽃방과 블렌딩 (P12-07, P12-08, P08-02)
const DRY_H = MONTH_H;                           // P12-07-02: 꽃방에 널면 흐르는 시간 1달 뒤 다 마름
const BLEND_RATE = 1.2, RECIPE_RATE = 1.5;        // P12-08-04: 따로 만든 차 값의 합 × 1.2 / 레시피에 있는 이름 있는 블렌드는 × 1.5 (10-06)
// P12-08-06: 도감에 모이는 이름 있는 블렌드 9가지 (10-06: 6 → 9) (재료가 정확히 같아야 함)
const BLENDS = {   // P12-08-06 (10-06 검토: 실제로 파는 짝으로 바꿈 · 9가지)
  springfield: { name: '봄 들판', parts: ['chamomile', 'rose'], story: '캐모마일과 장미는 꽃차 가게에서 흔히 함께 파는 짝이에요. 사과 향에 장미 향이 얹혀요.' },
  sleepnight: { name: '잠드는 밤', parts: ['chamomile', 'lavender'], story: '잠들기 전에 많이 마시는 블렌드예요. 여러 차 회사에서 캐모마일 라벤더로 팔아요.' },
  violetdusk: { name: '보랏빛 저녁', parts: ['lavender', 'bpea'], story: '파란 버터플라이피에 라벤더 향을 더한 블렌드예요. 레몬을 넣으면 보랏빛으로 바뀌어요.' },
  redsummer: { name: '붉은 여름', parts: ['hibiscus', 'rose'], story: '새콤한 히비스커스와 장미를 섞은 붉은 차예요. 차갑게 우려도 맛있어요.' },
  pondmorning: { name: '연못의 아침', parts: ['lotus', 'jasmine'], story: '연꽃 향과 재스민 향을 함께 입힌 차는 베트남과 중국에서 오래 만들어 왔어요.' },
  autumngarden: { name: '가을 정원', parts: ['gamguk', 'jasmine'], story: '국화와 재스민은 중국에서 오래 함께 우려 온 짝이에요. 달큰하고 시원한 맛이에요.' },
  sunfield: { name: '햇살 들판', parts: ['marigold', 'chamomile'], story: '금빛 메리골드와 캐모마일을 섞은 노란 차예요. 허브차 가게에서 자주 보는 짝이에요.' },
  sunsetcomb: { name: '노을빛 볏', parts: ['celosia', 'rose'], story: '맨드라미차는 맛이 순해서 장미를 더해 향을 살리는 블렌딩을 권해요.' },
  plumwinter: { name: '겨울 매화향', parts: ['maehwa', 'napmae'], story: '한겨울에 피는 두 매화를 섞은 정원만의 블렌드예요. 실제로 파는 짝은 아니에요.', original: true },
};
const BLEND_KEYS = Object.keys(BLENDS);
const DEX_TOTAL = FLOWER_KEYS.length * 5 + BLEND_KEYS.length + LAND_KEYS.length + BLEND_KEYS.length;   // 씨앗·묘목 13 · 꽃 13 · 꽃잎 13 · 티백(꽃 13 + 블렌드 9) · 차 13 · 땅 10 · 블렌드 9 = 93 (P08-03, P08-04, P12-08-06)
function blendRecipe(parts) {
  const s = parts.slice().sort().join('|');
  return BLEND_KEYS.find(k => BLENDS[k].parts.slice().sort().join('|') === s) || null;
}
const blendRate = parts => blendRecipe(parts) ? RECIPE_RATE : BLEND_RATE;
const blendValue = b => Math.round(b.parts.reduce((a, k) => a + teaValue(FLOWERS[k], b.q, false), 0) * blendRate(b.parts) / 10) * 10;

// ---------------------------------------------------------------- 상태
function create(now, rng) {
  rng = rng || Math.random;
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
    drying: [], dried: [], blends: [], cups: [],                         // P12-07 꽃방, P12-08 블렌딩, P17-10 찻잔
    fert: 0, water: 10, shears: 5, hoe: 10, basket: 10, weedCount: 0, pruneCount: 0, // 처음에 물병 10개, 가위 1개(5번), 호미·바구니 1개(10번)
    dex: { form: {}, flower: {}, petal: {}, teabag: {}, bagBlend: {}, tea: {}, land: { barren: true }, blend: {} }, // P08-01-04, P08-02, P08-03
    log: [], records: [], yearBest: null, helpYear: null, nextId: 1,
    settings: { toast: { 3: true, 8: true, 9: true }, sleep: { on: true, from: 23, to: 7 }, marks: { water: true, weed: true, prune: true, fert: true } },
    onboarded: false, _fertNew: 0, _bloomNew: {},
  };
}
const nid = st => st.nextId++;

// ---------------------------------------------------------------- 알림 (P11)
const TOAST_TYPES = [3, 8, 9];                   // P11-02-01-a
function addLog(st, type, text, ctx) {
  const cal = calendar(st.virtual);
  st.log.push({ y: yearOf(st, cal), m: cal.month, d: cal.day, type, text });
  if (st.log.length > 600) st.log.shift();
  if (ctx && ctx.live && TOAST_TYPES.includes(type) && st.settings.toast[type] && ctx.toast) ctx.toast(text, type);
}
function flushPending(st, ctx) {
  if (st._fertNew > 0) { addLog(st, 10, `비료 ${st._fertNew}개가 만들어졌어요`, ctx); st._fertNew = 0; }
  if (st._autoSold && st._autoSold.n) { addLog(st, 13, `손님이 찻잔 ${st._autoSold.n}잔을 사 갔어요 · +${st._autoSold.sum.toLocaleString('ko-KR')}원`, ctx); st._autoSold = { n: 0, sum: 0 }; }
  if (st._driedNew > 0) { addLog(st, 12, `꽃방에서 꽃잎 ${st._driedNew}장이 다 말랐어요`, ctx); st._driedNew = 0; }
  const b = st._bloomNew;
  for (const k in b) {
    const F = FLOWERS[k], n = b[k];
    addLog(st, 8, n > 1 ? `${F.name} ${n}포기가 피었어요. 수확할 수 있어요` : `${josa(F.name, '이/가')} 피었어요. 수확할 수 있어요`, ctx);
  }
  st._bloomNew = {};
}
function addFert(st, n) { st.fert += n; st._fertNew += n; }

// ---------------------------------------------------------------- 시간 진행
function advance(st, target, ctx) {
  while (st.virtual < target - 1) {
    const cal = calendar(st.virtual);
    const next = Math.min(target, cal.slotEnd, st.virtual + STEP_H * HOUR);
    const dtH = (next - st.virtual) / HOUR;
    if (!cal.frozen && dtH > 0) step(st, dtH, cal, ctx);
    if (dtH > 0) autoSell(st, cal, dtH, ctx);                          // P17-11 카운터 찻잔은 꽃잠에도 팔림
    st.virtual = next;
    const nc = calendar(st.virtual);
    if (nc.abs !== st.lastAbs) { st.lastAbs = nc.abs; onSlot(st, nc, ctx); }
  }
  flushPending(st, ctx);
  checkLands(st, ctx);
  checkHelp(st, calendar(st.virtual), ctx);
}

function step(st, dtH, cal, ctx) {
  // 1) 땅 (P01, P15)
  const n = W * H, WS = new Float32Array(n), WT = new Float32Array(n), WM = new Float32Array(n);
  for (const f of st.flowers) {
    if (f.withered) continue;
    const r = stageRadius(f);
    if (r < 0) continue;
    const F = FLOWERS[f.type];
    for (let y = Math.max(0, f.y - r); y <= Math.min(H - 1, f.y + r); y++) {
      for (let x = Math.max(0, f.x - r); x <= Math.min(W - 1, f.x + r); x++) {
        const d = Math.hypot(x - f.x, y - f.y);
        if (d > r + 0.01) continue;
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
    f.ageH += dtH;
    const s = computeStage(f, cal.month);
    if (F.life === 'annual') {
      if (s === 'bloom') f.bloomed = true;
      else if (f.bloomed || f.ageH / MONTH_H > 12) { wither(st, f, cal, ctx); continue; }
    }
    f.stage = s;
    if (s === 'bloom' && f.bloomKey !== cal.abs) {
      f.bloomKey = cal.abs;
      st._bloomNew[f.type] = (st._bloomNew[f.type] || 0) + 1;
      if (!st.dex.flower[f.type]) { st.dex.flower[f.type] = true; addLog(st, 9, `도감에 등록: ${F.name}`, ctx); }
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
  // 꽃방 (P12-07): 말리는 동안과 말린 뒤에는 품질이 떨어지지 않음
  for (let i = st.drying.length - 1; i >= 0; i--) {
    const d = st.drying[i];
    d.leftH -= dtH;
    if (d.leftH <= 0) {
      st.drying.splice(i, 1);
      st.dried.push({ id: d.id, type: d.type, q: d.q });
      st._driedNew = (st._driedNew || 0) + 1;
    }
  }
  // 5) 꺾꽂이·접붙이기로 뿌리 내리는 중인 것 (P06-02-05-a-2)
  for (let i = st.pending.length - 1; i >= 0; i--) {
    const p = st.pending[i];
    p.dueH -= dtH;
    if (p.dueH <= 0) {
      for (const q of p.qs) st.items.push(newItem(st, p.type, q, '번식', p.parent));
      st.pending.splice(i, 1);
    }
  }
}

function wither(st, f, cal, ctx) {                // P07-02
  f.withered = true; f.stage = 'withered'; f.witherAbs = cal.abs;
  const F = FLOWERS[f.type];
  if (F.prop === '채종' && f.bloomed) {           // P07-02-01 자동 채종
    const n = propCount(f.q);
    for (let i = 0; i < n; i++) st.items.push(newItem(st, f.type, propQuality(f.q, ctx && ctx.rng || Math.random), '번식', F.name));
  }
}

const DAILY_GIFT = 500;                          // P17-13 (10-06)
function onSlot(st, cal, ctx) {
  const yr = yearOf(st, cal);
  flushPending(st, ctx);
  // 시든 한해살이는 다음 달에 사라지며 비료 1개 (P07-02)
  st.flowers = st.flowers.filter(f => { if (f.withered && cal.abs > f.witherAbs) { addFert(st, 1); return false; } return true; });
  if (cal.idx === 12) recordYear(st, cal, ctx);                                 // P04-02
  // P17-13 하루 용돈: 요일이 바뀔 때(매일 아침 6시, 짝수 idx)마다 500원. 꽃잠(일요일)도 받음
  if (cal.idx % 2 === 0) { st.money += DAILY_GIFT; addLog(st, 11, `${'월화수목금토일'[cal.idx / 2]}요일 아침, 용돈 ${DAILY_GIFT}원이 들어왔어요`, ctx); }
  // 예약 배송 (P06-05)
  for (const r of st.reservations) {
    if (r.done || r.year !== yr || r.deliverIdx !== cal.idx) continue;
    for (let i = 0; i < r.qty; i++) { const it = newItem(st, r.type, 1, '예약'); it.packaged = true; st.items.push(it); }
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
    addLog(st, 1, `${josa(F.name, '을/를')} 심을 때예요. 화원에 ${josa(FORM[F.form].name, '이/가')} 들어왔어요${have ? `. 창고에도 ${have}개 있어요` : ''}`, ctx);
  }
  flushPending(st, ctx);
  checkLands(st, ctx);
}

function recordYear(st, cal, ctx) {
  const yr = yearOf(st, cal);
  flushPending(st, ctx);
  const rec = { year: yr, counts: landCounts(st), best: st.yearBest, dex: dexCount(st), dexTotal: DEX_TOTAL, log: st.log.slice(), snapshot: null };
  st.records.unshift(rec);
  st.records = st.records.slice(0, 10);
  if (ctx && ctx.onRecord) ctx.onRecord(rec);
  st.log = [];                                                                // P11-02-04-e: 쉼달에 초기화
  st.yearBest = null;
  addLog(st, 7, `${yr}년차 정원을 기록했어요`, ctx);
  addLog(st, 4, '다음 해 꽃을 예약할 수 있어요', ctx);
}

function landCounts(st) {
  const c = {}; for (const k of LAND_KEYS) c[k] = 0;
  for (const tl of st.tiles) c[landOf(tl)]++;
  return c;
}
function checkLands(st, ctx) {
  const c = landCounts(st);
  for (const k of LAND_KEYS) if (c[k] > 0 && !st.dex.land[k]) { st.dex.land[k] = true; addLog(st, 9, `도감에 등록: ${LANDS[k].name}`, ctx); }
}
function dexCount(st) {
  const d = st.dex;
  return Object.keys(d.form || {}).length + Object.keys(d.flower).length + Object.keys(d.petal || {}).length + Object.keys(d.teabag || {}).length + Object.keys(d.bagBlend || {}).length + Object.keys(d.tea).length + Object.keys(d.land).length + Object.keys(d.blend || {}).length;
}
function checkHelp(st, cal, ctx) {               // P17-06-01
  const yr = yearOf(st, cal);
  if (st.helpYear === yr) return;
  if (st.flowers.some(f => !f.withered)) return;
  if (st.items.some(it => germOf(it) > 0)) return;
  if (st.teas.length || st.petals.length || st.drying.length || st.dried.length || st.blends.length || (st.cups || []).length) return;
  if (st.money >= 500) return;
  st.money += 5000; st.helpYear = yr;
  addLog(st, 11, '정원을 다시 시작할 수 있도록 5,000원이 들어왔어요', ctx);
}

// ---------------------------------------------------------------- 물건
function newItem(st, type, q, origin, parent) {
  // P08-03: 씨앗·묘목·모종·연근은 처음 손에 들어올 때 도감에 (화원에서 사거나, 번식하거나, 예약이 도착하거나)
  if (st.dex.form && !st.dex.form[type]) { st.dex.form[type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[type].name} ${FORM[FLOWERS[type].form].name}`); }
  return { id: nid(st), type, q, ageH: 0, packaged: false, origin: origin || '화원', parent: parent || null, got: st.virtual };
}

// ---------------------------------------------------------------- 행동
const ok = (msg, extra) => Object.assign({ ok: true, msg }, extra || {});
const no = msg => ({ ok: false, msg });
const flowerAt = (st, x, y) => st.flowers.find(f => f.x === x && f.y === y);

function buy(st, type, n) {                      // P06-01-01
  const cal = calendar(st.virtual), F = FLOWERS[type];
  n = n || 1;
  if (cal.frozen) return no('꽃잠에는 일반 판매를 쉬어요. 예약은 할 수 있어요');
  if (!F.sow.includes(cal.month)) return no(`${josa(F.name, '은/는')} 심는 기간에만 팔아요`);
  const cost = F.price * n;
  if (st.money < cost) return no('돈이 모자라요');
  st.money -= cost;
  for (let i = 0; i < n; i++) st.items.push(newItem(st, type, 1, '화원'));
  return ok(`${F.name} ${FORM[F.form].name} ${n}${FORM[F.form].unit}를 샀어요`);
}

// 화원 소모품: 비료 1개 = 1번, 물병 1개 = 물 주기 1번, 호미 1개 = 잡초 뽑기 10번, 가위 1개 = 가지치기 5번, 바구니 1개 = 수확 10번. 꽃잠에도 팔아요
const SUPPLIES = {
  fert: { name: '비료', icon: '🌱', price: 150, per: 1, unit: '개', desc: '한 포기에 주면 1달 동안 품질이 올라요' },
  water: { name: '물병', icon: '💧', price: 50, per: 1, unit: '개', desc: '물병 1개로 한 포기에 물을 줘요. 2달 동안 괜찮아요' },
  hoe: { name: '호미', icon: '⛏️', price: 400, per: 10, unit: '번', desc: '호미 1개로 잡초를 10번 뽑을 수 있어요' },
  basket: { name: '바구니', icon: '🧺', price: 500, per: 10, unit: '번', desc: '바구니 1개로 꽃잎을 10번 거둘 수 있어요' },
  shears: { name: '가위', icon: '✂️', price: 500, per: 5, unit: '번', desc: '가위 1개로 가지치기를 5번 할 수 있어요' },
};
function buySupply(st, kind, n) {
  const S = SUPPLIES[kind]; n = n || 1;
  if (!S) return no('팔지 않는 물건이에요');
  const cost = S.price * n;
  if (st.money < cost) return no('돈이 모자라요');
  st.money -= cost; st[kind] = (st[kind] || 0) + S.per * n;
  return ok(`${S.name} ${n}개를 샀어요`);
}

// P06-16: 곧 시드는(받은 지 10달 넘은) 씨앗·묘목 중 품질 5% 이하는 비료로 (1개 → 비료 1개)
const COMPOST_Q = 0.05;
const compostable = it => !it.packaged && it.ageH >= 10 * MONTH_H && it.q <= COMPOST_Q + 1e-9;
// P06-16-03: "곧 시들어요" 중 품질 0%(반올림)는 저절로 비료가 됨. 정원 일지에 한 줄
function autoCompost(st, ctx) {
  const list = st.items.filter(it => compostable(it) && pct(it.q) === 0);
  if (!list.length) return 0;
  for (const it of list) st.items.splice(st.items.indexOf(it), 1);
  st.fert += list.length;                         // 일지는 아래 한 줄로 ("비료 ○개가 만들어졌어요"와 겹치지 않게)
  const names = [...new Set(list.map(it => `${FLOWERS[it.type].name} ${FORM[FLOWERS[it.type].form].name}`))].join(', ');
  addLog(st, 10, `창고의 ${names} ${list.length}개가 다 시들어 비료가 되었어요`, ctx);
  return list.length;
}
function compostItems(st, ids) {
  const list = st.items.filter(it => ids.includes(it.id) && compostable(it));
  if (!list.length) return no('비료로 만들 수 있는 게 없어요');
  for (const it of list) st.items.splice(st.items.indexOf(it), 1);
  addFert(st, list.length);
  return ok(`${FLOWERS[list[0].type].name} ${FORM[FLOWERS[list[0].type].form].name} ${list.length}${FORM[FLOWERS[list[0].type].form].unit}로 비료 ${list.length}개를 만들었어요`);
}

function reservedCount(st, type, year) {
  return st.reservations.filter(r => r.type === type && r.year === year).reduce((a, r) => a + r.qty, 0);
}
function reserve(st, cart) {                     // P06-01-02, P06-04, P06-05, P06-06
  const cal = calendar(st.virtual);
  if (!cal.frozen) return no('예약은 쉼달과 꽃샘달에만 할 수 있어요');
  const year = yearOf(st, cal) + 1;
  let cost = 0;
  const per = {};
  for (const c of cart) {
    if (c.qty <= 0) continue;
    per[c.type] = (per[c.type] || 0) + c.qty;
    cost += reservationPrice(FLOWERS[c.type]) * c.qty;
  }
  for (const k in per) if (reservedCount(st, k, year) + per[k] > 3) return no(`${josa(FLOWERS[k].name, '은/는')} 한 해에 3개까지 예약할 수 있어요`);
  if (cost <= 0) return no('예약할 꽃을 골라 주세요');
  if (st.money < cost) return no('돈이 모자라요');
  st.money -= cost;
  for (const c of cart) {
    if (c.qty <= 0) continue;
    st.reservations.push({ id: nid(st), type: c.type, window: c.window, qty: c.qty, year, deliverIdx: deliverIdxOf(c.window), done: false });
  }
  return ok(`예약했어요. ${cost.toLocaleString('ko-KR')}원을 냈어요`, { cost });
}
function cartSummary(st, cart) {
  const cal = calendar(st.virtual), year = yearOf(st, cal) + 1;
  return cart.filter(c => c.qty > 0).map(c => {
    const F = FLOWERS[c.type], di = deliverIdxOf(c.window);
    const win = F.windows.find(w => w[0] === c.window);
    return { F, qty: c.qty, year, deliverMonth: MONTHS[di], window: win, unit: reservationPrice(F), total: reservationPrice(F) * c.qty };
  });
}

function plant(st, itemId, x, y, rng) {          // P06-01-05, P06-07-07-f
  rng = rng || Math.random;
  const cal = calendar(st.virtual);
  const it = st.items.find(i => i.id === itemId);
  if (!it) return no('창고에 없어요');
  const F = FLOWERS[it.type];
  if (cal.frozen) return no('꽃잠에는 정원이 쉬어요');
  if (!F.sow.includes(cal.month)) return no(`${josa(F.name, '은/는')} ${F.sow.map(monthName).join('·')}에 심을 수 있어요`);
  if (flowerAt(st, x, y)) return no('이 자리에는 이미 꽃이 있어요');
  const g = germOf(it);
  if (g <= 0) return no(`${josa(FORM[F.form].rate, '이/가')} 0%라 심을 수 없어요`);
  st.items.splice(st.items.indexOf(it), 1);
  if (rng() >= g) {
    addFert(st, 1);
    return ok(F.form === 'seed' ? '이번엔 쉬어 가나 봐요. 싹이 트지 않은 씨앗은 비료가 됐어요' : '이번엔 뿌리를 내리지 못했어요. 비료가 됐어요', { failed: true });
  }
  const f = {
    id: nid(st), type: it.type, x, y, q: it.q, startQ: it.q, origin: it.origin, parent: it.parent,
    ageH: 0, stage: F.form === 'seed' ? 'germ' : 'young', bloomed: false, withered: false,
    waterH: 0, weedH: 24, pruneH: 0, fertH: 0, thirstH: 0, adaptH: 24,   // 심은 직후는 목마름 (물은 직접, 10-06) · 흙은 고른 상태
    harvestKey: -1, bloomKey: -1, propYear: null, plantedYear: yearOf(st, cal),
  };
  st.flowers.push(f);
  return ok(`${josa(F.name, '을/를')} 심었어요`, { flower: f });
}

const TOOLS = {
  water: { name: '물 주기', icon: '💧' },
  weed: { name: '잡초 뽑기', icon: '🌿' },
  prune: { name: '가지치기', icon: '✂️' },
  fert: { name: '비료 주기', icon: '🌱' },
  harvest: { name: '수확', icon: '🧺' },
};
function canCare(st, f, tool, cal) {
  if (!f || f.withered) return false;
  const F = FLOWERS[f.type];
  switch (tool) {
    case 'water': return f.waterH <= 0;
    case 'weed': return f.weedH <= 0;
    case 'prune': return F.prune && f.pruneH <= 0;
    case 'fert': return f.fertH <= 0;
    case 'harvest': return f.stage === 'bloom' && f.harvestKey !== cal.abs;
  }
  return false;
}
function care(st, tool, tiles, ctx) {            // P13
  const cal = calendar(st.virtual);
  if (cal.frozen) return no('꽃잠에는 정원이 쉬어요');
  const targets = tiles.map(([x, y]) => flowerAt(st, x, y)).filter(f => canCare(st, f, tool, cal));
  if (!targets.length) return no('돌볼 꽃이 없어요');
  if (tool === 'fert' && st.fert < targets.length) return no(`비료가 ${targets.length - st.fert}개 모자라요.`); // P13-06-01-c
  if (tool === 'water' && (st.water || 0) < targets.length) return no(st.water ? `물병이 ${targets.length - st.water}개 모자라요` : '물병이 없어요. 창고에서 살 수 있어요');
  if (tool === 'weed' && (st.hoe || 0) < targets.length) return no(st.hoe ? `호미가 ${targets.length - st.hoe}번 모자라요` : '호미가 없어요. 창고에서 살 수 있어요');
  if (tool === 'harvest' && (st.basket || 0) < targets.length) return no(st.basket ? `바구니가 ${targets.length - st.basket}번 모자라요` : '바구니가 없어요. 창고에서 살 수 있어요');
  if (tool === 'prune' && (st.shears || 0) < targets.length) return no(st.shears ? `가위가 ${targets.length - st.shears}번 모자라요` : '가위가 없어요. 창고에서 살 수 있어요');
  for (const f of targets) {
    if (tool === 'water') { f.waterH = 24; f.thirstH = 0; st.water--; }                     // 유지: 2달
    if (tool === 'weed') { f.weedH = 24; st.hoe--; if (++st.weedCount % 5 === 0) addFert(st, 1); }
    if (tool === 'prune') { f.pruneH = 12; st.shears--; if (++st.pruneCount % 3 === 0) addFert(st, 1); } // 향상: 1달
    if (tool === 'fert') { f.fertH = 12; st.fert--; }
    if (tool === 'harvest') {                                                    // P12-05
      f.harvestKey = cal.abs; st.basket--;
      st.petals.push({ id: nid(st), type: f.type, q: f.q, seasonKey: seasonKey(st, cal) });
      if (!st.dex.petal[f.type]) { st.dex.petal[f.type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[f.type].name} 꽃잎`, ctx); } // P08-02-02
    }
  }
  flushPending(st, ctx);
  const word = { water: '물을 줬어요', weed: '잡초를 뽑았어요', prune: '가지를 쳤어요', fert: '비료를 줬어요', harvest: '꽃잎을 거둬 제다실로 보냈어요' }[tool];
  return ok(`${targets.length}포기에 ${word}`, { count: targets.length });
}

function propagate(st, flowerId, rng, ctx) {     // P06-02-05
  rng = rng || Math.random;
  const cal = calendar(st.virtual), f = st.flowers.find(x => x.id === flowerId);
  if (!f || f.withered) return no('번식할 꽃이 없어요');
  const F = FLOWERS[f.type], yr = yearOf(st, cal);
  if (cal.frozen) return no('꽃잠에는 정원이 쉬어요');
  if (F.prop === '채종') return no('한해살이는 시들 때 씨앗을 자동으로 거둬요');
  if (!['mature', 'bloom', 'dormant'].includes(f.stage)) return no('다 자란 꽃만 번식할 수 있어요');
  if (!F.propMonths.includes(cal.month)) return no(`${josa(F.prop, '은/는')} ${F.propMonths.map(monthName).join('·')}에 할 수 있어요`);
  if (f.propYear === yr) return no('이 꽃은 올해 이미 번식했어요');
  f.propYear = yr;
  const n = propCount(f.q), qs = [];
  for (let i = 0; i < n; i++) qs.push(propQuality(f.q, rng));
  const formName = FORM[F.form].name;
  if (F.prop === '꺾꽂이' || F.prop === '접붙이기') {
    st.pending.push({ id: nid(st), type: f.type, qs, dueH: MONTH_H, parent: F.name, method: F.prop });
    return ok(`${josa(F.prop, '을/를')} 했어요. 1달 뒤 ${formName} ${n}개가 창고에 들어와요`);
  }
  for (const q of qs) st.items.push(newItem(st, f.type, q, '번식', F.name));
  return ok(`${josa(F.prop, '으로/로')} ${formName} ${n}개를 얻었어요`);
}

function move(st, flowerId, x, y) {              // P13-03
  const cal = calendar(st.virtual), f = st.flowers.find(z => z.id === flowerId);
  if (!f || f.withered) return no('옮길 꽃이 없어요');
  const F = FLOWERS[f.type];
  if (cal.frozen) return no('꽃잠에는 정원이 쉬어요');
  if (!(F.sow.includes(cal.month) || f.stage === 'dormant')) return no('심는 기간이나 휴면기에 옮길 수 있어요');
  if (flowerAt(st, x, y)) return no('그 자리에는 이미 꽃이 있어요');
  f.x = x; f.y = y; f.adaptH = 24;
  return ok(`${josa(F.name, '을/를')} 옮겨 심었어요. 2달 동안 새 자리에 적응해요`);
}

// P08-04: 제다실에서 만든 것은 티백 (찻집으로 보내는 형태). 티백은 처음 만들 때, 차는 찻집에서 처음 우려 팔 때 도감에
function regTeabag(st, type, ctx) {
  st.dex.teabag = st.dex.teabag || {};
  if (!st.dex.teabag[type]) { st.dex.teabag[type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[type].name} 티백`, ctx); }
}
function makeTea(st, ids, ctx) {                 // P12-03
  const cal = calendar(st.virtual);
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('꽃잎이 없어요');
  for (const p of list) {
    st.petals.splice(st.petals.indexOf(p), 1);
    st.teas.push({ id: nid(st), type: p.type, q: p.q, seasonKey: p.seasonKey, hat: isHat(p.q) });
    regTeabag(st, p.type, ctx);
    if (!st.yearBest || p.q > st.yearBest.q) st.yearBest = { type: p.type, q: p.q };
  }
  return ok(`티백 ${list.length}개를 만들었어요`);
}
// P12-10 생화 티백 (예전 생차): 생화를 말리지 않고 티백으로. 값 −10% (10-06)
function makeRaw(st, ids, ctx) {
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('꽃잎이 없어요');
  for (const p of list) {
    st.petals.splice(st.petals.indexOf(p), 1);
    st.teas.push({ id: nid(st), type: p.type, q: p.q, seasonKey: p.seasonKey, hat: isHat(p.q), raw: true });
    regTeabag(st, p.type, ctx);
    if (!st.yearBest || p.q > st.yearBest.q) st.yearBest = { type: p.type, q: p.q };
  }
  return ok(`생화 티백 ${list.length}개를 만들어 찻집으로 보냈어요`);
}
// P12-07 꽃방: 꽃잎을 널면 1달(흐르는 시간) 뒤 말린 꽃잎이 됨. 언제든 널 수 있음
function dryPetals(st, ids) {
  const list = st.petals.filter(p => ids.includes(p.id));
  if (!list.length) return no('널 꽃잎이 없어요');
  for (const p of list) { st.petals.splice(st.petals.indexOf(p), 1); st.drying.push({ id: p.id, type: p.type, q: p.q, leftH: DRY_H }); }
  return ok(`꽃잎 ${list.length}장을 꽃방에 널었어요. 1달 뒤에 다 말라요`);
}
// P12-07-04: 말린 꽃잎으로도 차를 만들 수 있음 (제철 보너스는 없음)
function makeTeaDried(st, ids, ctx) {
  const list = st.dried.filter(p => ids.includes(p.id));
  if (!list.length) return no('말린 꽃잎이 없어요');
  for (const p of list) {
    st.dried.splice(st.dried.indexOf(p), 1);
    st.teas.push({ id: nid(st), type: p.type, q: p.q, seasonKey: -1, hat: isHat(p.q) });
    regTeabag(st, p.type, ctx);
    if (!st.yearBest || p.q > st.yearBest.q) st.yearBest = { type: p.type, q: p.q };
  }
  return ok(`말린 꽃잎으로 티백 ${list.length}개를 만들었어요`);
}
// P12-08 블렌딩: 언제든 (변경 10-06, 예전엔 꽃잠에만), 서로 다른 말린 꽃잎 2~3장으로 블렌딩 차 1잔
function blend(st, ids, ctx) {
  const cal = calendar(st.virtual);
  const list = st.dried.filter(p => ids.includes(p.id));
  if (list.length < 2 || list.length > 3) return no('말린 꽃잎 2~3장을 골라 주세요');
  const parts = list.map(p => p.type);
  if (new Set(parts).size !== parts.length) return no('서로 다른 꽃의 꽃잎을 골라 주세요');
  for (const p of list) st.dried.splice(st.dried.indexOf(p), 1);
  const q = list.reduce((a, p) => a + p.q, 0) / list.length, recipe = blendRecipe(parts);
  const name = recipe ? BLENDS[recipe].name : `${parts.map(k => FLOWERS[k].name).join(' · ')} 블렌드`;
  const b = { id: nid(st), parts, q, recipe, name };
  st.blends.push(b);
  if (recipe) {
    if (!st.dex.blend[recipe]) addLog(st, 9, `도감에 등록: ${name}`, ctx);
    st.dex.blend[recipe] = Math.max(st.dex.blend[recipe] || 0, q);
  }
  return ok(`${josa(name, '을/를')} 만들었어요`, { blend: b });
}
function sellBlends(st, ids) {
  if (!teaShopOpen(calendar(st.virtual))) return no('찻집은 겨울(12월)부터 열어요');
  const list = st.blends.filter(b => ids.includes(b.id));
  if (!list.length) return no('팔 블렌드 차가 없어요');
  let sum = 0;
  for (const b of list) { sum += blendValue(b); st.blends.splice(st.blends.indexOf(b), 1); }
  st.money += sum;
  return ok(`블렌드 차 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}
// P17-10 우림 → 찻잔 → 판매: 찻집이 열렸을 때(토·일) 티백 · 생차 · 블렌드를 우려 찻잔으로. 판매는 찻잔에서만
// 찻잔은 우린 달이 지나면 식어서 값이 반 (COLD_RATE)
const COLD_RATE = 0.5;
const cupCold = (c, cal) => cal.abs > c.brewAbs;
// P12-11 블렌드 티백: 제다실의 블렌드를 티백으로 만들어 찻집으로 (블렌드 티백 도감)
function bagBlends(st, ids, ctx) {
  const list = st.blends.filter(b => ids.includes(b.id) && !b.bagged);
  if (!list.length) return no('티백으로 만들 블렌드가 없어요');
  st.dex.bagBlend = st.dex.bagBlend || {};
  for (const b of list) {
    b.bagged = true;
    if (b.recipe && !st.dex.bagBlend[b.recipe]) { st.dex.bagBlend[b.recipe] = true; addLog(st, 9, `도감에 등록: ${b.name} 티백`, ctx); }
  }
  return ok(`블렌드 티백 ${list.length}개를 만들어 찻집으로 보냈어요`);
}
function brew(st, teaIds, blendIds) {
  const cal = calendar(st.virtual);
  if (!teaShopOpen(cal)) return no('찻집이 열리는 겨울(12월)부터 우릴 수 있어요');
  st.cups = st.cups || [];
  const teas = st.teas.filter(t => teaIds.includes(t.id)), blends = st.blends.filter(b => (blendIds || []).includes(b.id) && b.bagged);   // 블렌드는 티백이 된 것만
  if (!teas.length && !blends.length) return no('우릴 티백이 없어요');
  for (const t of teas) { st.teas.splice(st.teas.indexOf(t), 1); st.cups.push({ ...t, id: nid(st), kind: 'tea', brewAbs: cal.abs }); }
  for (const b of blends) { st.blends.splice(st.blends.indexOf(b), 1); st.cups.push({ ...b, id: nid(st), kind: 'blend', brewAbs: cal.abs }); }
  return ok(`차 ${teas.length + blends.length}잔을 우렸어요 ☕`);
}
function cupValue(st, c, cal) {
  const v = c.kind === 'blend' ? blendValue(c) : teaItemValue(st, c, cal);
  return cupCold(c, cal) ? Math.round(v * COLD_RATE / 10) * 10 : v;
}
// P17-11 자동 판매: 찻집이 열려 있으면 카운터의 찻잔이 1시간(게임 시간 = 배속 1에서 현실 1시간)마다 한 잔씩, 먼저 우린 것부터 팔림
const CUP_SELL_H = 1;
function autoSell(st, cal, dtH, ctx) {
  st.cups = st.cups || [];
  if (!teaShopOpen(cal) || !st.cups.length) { st.cupTimerH = 0; return; }
  st.cupTimerH = (st.cupTimerH || 0) + dtH;
  while (st.cupTimerH >= CUP_SELL_H && st.cups.length) {
    st.cupTimerH -= CUP_SELL_H;
    const c = st.cups.shift(), v = cupValue(st, c, cal);
    st.money += v;
    if (c.kind === 'tea') {
      if (st.dex.tea[c.type] == null) addLog(st, 9, `도감에 등록: ${FLOWERS[c.type].tea}`, ctx);
      st.dex.tea[c.type] = Math.max(st.dex.tea[c.type] || 0, c.q);
    }
    st._autoSold = st._autoSold || { n: 0, sum: 0 }; st._autoSold.n++; st._autoSold.sum += v;
  }
  if (!st.cups.length) st.cupTimerH = 0;
}
function sellCups(st, ids, ctx) {
  const cal = calendar(st.virtual);
  if (!teaShopOpen(cal)) return no('찻집은 겨울(12월)부터 열어요');
  const list = (st.cups || []).filter(c => ids.includes(c.id));
  if (!list.length) return no('팔 찻잔이 없어요');
  let sum = 0;
  for (const c of list) {
    sum += cupValue(st, c, cal); st.cups.splice(st.cups.indexOf(c), 1);
    if (c.kind === 'tea') {
      if (st.dex.tea[c.type] == null) addLog(st, 9, `도감에 등록: ${FLOWERS[c.type].tea}`, ctx);   // 차는 처음 팔 때 도감에
      st.dex.tea[c.type] = Math.max(st.dex.tea[c.type] || 0, c.q);
    }
  }
  st.money += sum;
  return ok(`찻잔 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}
function sellTea(st, ids, ctx) {                 // P17-01: 찻집에서 티백을 우려 한 잔씩 팔아요
  const cal = calendar(st.virtual);
  if (!teaShopOpen(cal)) return no('찻집은 겨울(12월)부터 열어요');
  const list = st.teas.filter(t => ids.includes(t.id));
  if (!list.length) return no('팔 차가 없어요');
  let sum = 0;
  for (const t of list) {
    sum += teaItemValue(st, t, cal); st.teas.splice(st.teas.indexOf(t), 1);
    if (st.dex.tea[t.type] == null) addLog(st, 9, `도감에 등록: ${FLOWERS[t.type].tea}`, ctx);   // P08-01-05-a (변경 10-06: 처음 팔 때)
    st.dex.tea[t.type] = Math.max(st.dex.tea[t.type] || 0, t.q);                                     // P08-01-06 가장 좋은 품질
  }
  st.money += sum;
  return ok(`차 ${list.length}잔을 ${sum.toLocaleString('ko-KR')}원에 팔았어요`);
}

const api = {
  DAILY_GIFT, HOUR, W, H, MONTHS, josa, SEASONS, MONTH_H, monthName, calendar, calendarAfterFlow, untilMonth, yearOf,
  FLOWERS, FLOWER_KEYS, FORM, LIFE, LANDS, LAND_KEYS, LIFE_MIN, classify, landOf, landCounts,
  stars, pct, germOf, qualityRadius, stageRadius, STAGE, computeStage, landMatch, vigorOf, monthlyChange,
  teaShopOpen, hoursToShopOpen, CUP_SELL_H, autoSell, bagBlends, brew, sellCups, cupValue, cupCold, COLD_RATE, propCount, teaValue, teaItemValue, isHat, makeRaw, HAT_RATE, RAW_RATE, RAW_DECAY, isFresh, seasonKey, reservationPrice, deliverIdxOf, reservedCount, cartSummary,
  create, advance, addLog, compostable, compostItems, autoCompost, COMPOST_Q, TOOLS, canCare, care, buy, buySupply, SUPPLIES, reserve, plant, propagate, move, makeTea, sellTea,
  flowerAt, dexCount, DEX_TOTAL, DRY_H, BLENDS, BLEND_KEYS, BLEND_RATE, RECIPE_RATE, blendRate, blendRecipe, blendValue, dryPetals, makeTeaDried, blend, sellBlends,
};
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
