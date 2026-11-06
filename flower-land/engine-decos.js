// 도리의 정원 — 게임 규칙 엔진 조각 7/10: 정원 장식 · 🪴 그 달의 장식 · 🧬 돌연변이 · 🌹 프리저브드 · 🌱 처음 피기까지 · 🔆 생장 장치 · 🍯 꿀
// P66(11-03): 예전 한 파일 engine.js(줄 2277 ~ 2602)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
'use strict';
// ---------------------------------------------------------------- 정원 장식 (P17-16, 10-24)
// 돈 쓸 곳: 달마다 화원에 장식 하나가 들어옴 (그 달에만, 다음 해에 다시 옴). 꽃이 없는 칸에 놓고, 땅 · 꽃 · 값에는 영향이 없음
// 칭호를 얻으면 그 칭호 문장 장식("t:칭호키")을 하나 받음 (사지 못함, P19-08-04)
const DECOS = {
  stepstone: { name: '징검돌', month: 3, price: 1500, desc: '꽃 사이를 걷는 납작한 돌' },
  birdhouse: { name: '새집', month: 4, price: 8000, desc: '봄 새가 쉬어 가는 작은 집' },
  bench: { name: '나무 벤치', month: 5, price: 12000, desc: '꽃을 보며 앉는 자리' },
  basin: { name: '돌 물확', month: 6, price: 9000, desc: '빗물이 고이는 돌그릇' },
  chime: { name: '풍경', month: 7, price: 5000, desc: '바람이 불면 맑게 울려요' },
  pond: { name: '작은 연못', month: 8, price: 40000, desc: '연잎이 떠 있는 물웅덩이' },
  stonelamp: { name: '석등', month: 9, price: 15000, desc: '가을밤을 밝히는 돌 등' },
  pumpkin: { name: '호박 바구니', month: 10, price: 3000, desc: '잘 익은 호박 한 덩이' },
  fence: { name: '꽃 울타리', month: 11, price: 2000, desc: '꽃을 엮어 정원 가장자리를 두르는 울' },   // P77-A 이름만 (나무 울타리는 공방 stonewall)
  snowman: { name: '눈사람', month: 12, price: 4000, desc: '첫눈으로 만든 친구' },
  jars: { name: '장독대', month: 1, price: 20000, desc: '겨울 볕을 쬐는 항아리' },
  bonsai: { name: '매화 분재', month: 2, price: 25000, desc: '작은 화분에 핀 매화' },
  moonlamp: { name: '달 초롱', month: 13, price: 6000, desc: '꽃잠 밤을 지키는 초롱' },
  pavilion: { name: '정자', month: 14, price: 60000, desc: '정원을 내려다보는 쉼터' },
  hive: { name: '벌통', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 15000, need: 6, one: true, func: true, auto: true, insect: true, desc: '둘레 꽃의 번식 품질이 덜 깎이고, 핀 꽃에서 반나절마다 꿀을 모아요' },   // P18 여름의 꿀 채집 (10-24) · P39-06 🐝 꿀벌: 곤충농장에서 언제든 · 등급 6 (예전 6–8월 화원)
  stonewall: { name: '나무 울타리', month: 0, months: [], craft: true, desc: '꽃이 바꾸는 땅이 이 울타리를 못 넘어요 · 한 칸짜리라 이어 놓으면 울이 이어져요' },   // P73-02 🧱 wallSet · wallBlocks — 공방에서 돌 2 · 500원 · P77-A 돌담 → 나무 울타리 (키는 stonewall 그대로 · 11월 fence는 꽃 울타리)
  fossilcase: { name: '화석 진열장', month: 0, months: [], craft: true, desc: '광산에서 찾은 화석 네 가지' },   // 10-24 QA 6회차: 광산 재료 쓸 곳
  amberlamp: { name: '호박 등', month: 0, months: [], craft: true, desc: '호박빛이 은은한 등' },
  oldpot: { name: '옛 씨앗 화분', month: 0, months: [], craft: true, desc: '무엇이 필지 모르는 오래된 씨앗' },
  // P27 생장 장치 (10-24 저녁): 돈이 넉넉한 정원사를 위한 것 — 다 자라기까지 걸리는 시간만 줄임 (피는 달 · 품질 · 땅 · 꽃잠은 그대로). 늘 팖
  heatmat: { name: '온상 매트', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 15000, func: true, gear: true, desc: '바로 옆 꽃이 심은 지 12시간 안이거나 싹 · 새싹일 때 2배 빨리 자라요' },
  growlight: { name: '생장등', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 30000, func: true, gear: true, desc: '바로 옆 꽃 8포기가 1.5배 빨리 자라요' },
  greenhouse: { name: '유리 온실', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 120000, one: true, func: true, gear: true, desc: '둘레 2칸 꽃이 2배 빨리 자라요' },
  barrel: { name: '빗물 통', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 10000, need: 2, one: true, func: true, auto: true, insect: true, desc: '달팽이가 둘레 꽃에 반나절마다 물을 줘요' },   // P25-02 기능 있는 장식 (10-24) · P39-07 🐌 달팽이: 곤충농장에서 언제든 · 등급 2 · 10,000원 (예전 6–7월 · 25,000)
  // P28-10 🧺 자동 장치 (10-28): 손을 덜어 주는 기능 장식 — 늘 팖 · 정원 등급 need부터 (등급 장식 줄과 따로). 장치 표는 체크리스트 P28-10
  // P39 🐝 곤충은 모두 꽃을 돕는다 (10-31): insect = 곤충농장 일꾼 7 — 놓은 자리 둘레 r칸(🌼 기르면 2 → 4 → 6, P61-01)의 꽃을 달 끝마다 돌봄 · 한 종류에 하나(one) · 데려오기는 곤충농장 카드에서 언제든
  autobasket: { name: '개미 일꾼', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 12000, need: 2, one: true, func: true, auto: true, insect: true, desc: '둘레에 핀 꽃의 꽃잎을 반나절마다 물어 와요' },   // P32-01 이름만 바뀜 · P38 등급 2 · 12,000원 · P39-02 둘레 핀 꽃 모두
  dryrack: { name: '누에 일꾼', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 15000, need: 5, one: true, func: true, auto: true, insect: true, desc: '둘레 꽃을 반나절마다 가지치기해 줘요' },   // P39-04 🐛 누에: 가지치기 (예전 말리기는 🧺 건조 선반으로) · 등급 5 · 15,000원
  teahelper: { name: '나비 일꾼', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 30000, need: 8, one: true, func: true, auto: true, insect: true, desc: '둘레 꽃은 달마다 그달 첫 꽃잎이 두 장이에요' },   // P39-03 🦋 나비: 꽃가루받이 (예전 차 우리기는 🫖 찻집 도우미로) · 등급 8 · 30,000원
  earthworm: { name: '지렁이', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 15000, need: 4, one: true, func: true, auto: true, insect: true, desc: '둘레 꽃의 흙을 달마다 기름지게 해요' },   // P39-05 🪱 지렁이 (새로): 비료 효과 · 등급 4 · 15,000원
  ladybug: { name: '무당벌레', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 12000, need: 3, one: true, func: true, auto: true, insect: true, desc: '둘레 꽃의 잡초를 반나절마다 치워요' },   // P39-08 🐞 무당벌레: 놓는 곤충으로 (예전 4층 숲 바람) · 등급 3 · 12,000원
  // P39-09 곤충 아닌 정원 장치 둘 (10-31 사용자 "장치로 남김"): 예전 🐛 누에 말리기 · 🦋 나비 차 우리기 — ⛏️ 광산 공방 · 정원 장치 줄에서 팖 (곤충농장 밖)
  dryshelf: { name: '건조 선반', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 18000, need: 4, func: true, auto: true, desc: '아침 · 저녁 6시마다 제다실 꽃잎 4장을 꽃방에 널고, 다 마르면 티백까지 만들어요' },   // P39-09-01 🧺 예전 rackTick 그대로 · 하나에 달마다 4장 · 여럿
  autodryer: { name: '자동 건조기', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 30000, need: 6, one: true, func: true, auto: true, desc: '제다실에 꽃잎이 들어오면 바로 꽃방에 널어요 · 장수 제한 없이 · 티백은 직접 만들어요' },   // P72-02 ⚙️ autoDryTick · 건조 선반보다 한 단계 위 · 하나면 충분
  teastand: { name: '찻집 도우미', month: 3, months: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14], price: 30000, need: 6, one: true, func: true, auto: true, desc: '찻집이 열리면 카운터에 손님 자리보다 2잔 더 우려 둬요' },   // P39-09-02 🫖 예전 helperKeep 그대로 · +2잔 · 하나
  mutjar: { name: '유리 관', month: 0, months: [], jar: true, desc: '변이 꽃을 담은 유리 관' },   // P36-04 🫙 장식마다 mut: { k, stage } — 이름 · 그림은 decoKey(d) 'mutjar:종:단계'. 팔지 않음 · 꾸밈 도감 칸 밖
  pres: { name: '프리저브드', month: 0, months: [], jar: true, desc: '시들지 않는 유리 돔 속 꽃' },   // P84-01 🌹 정원에 놓인 것만 st.decos에 — 장식마다 pres: { type, mut } · 이름 · 그림은 decoKey(d) 'pres:꽃:0|1'. 창고에 있을 땐 st.preserved
  cloudstone: { name: '구름 돌', month: 0, months: [], extra: true, desc: '구름 정원사에게 온 뭉게구름 모양 돌' },   // P20-16 덤 장식 (10-27): 팔지 않음 · 꾸밈 도감 칸과 따로 셈
  // P28-05-01 🌱 등급 장식 (10-27): 정원 등급이 그만큼 오르면 화원에 늘 나옴 (달과 상관없이). 땅 · 꽃 · 값에는 영향 없음 (보너스는 M3 P28-05-02)
  // 화원은 🌱 등급 장식 줄(이달의 장식 DECO_KEYS와 따로), 꾸밈 도감 칸에는 넣음 (M1-4, 10-28)
  sproutsign: { name: '새싹 팻말', month: 0, months: [], grade: 5, price: 3000, desc: '"새싹이 자라요" 나무 팻말' },
  wateringcan: { name: '양철 물뿌리개', month: 0, months: [], grade: 10, price: 6000, desc: '오래 써서 반질반질한 물뿌리개' },
  arch: { name: '꽃 아치', month: 0, months: [], grade: 15, price: 18000, desc: '덩굴꽃이 감아 오른 아치' },
  sundial: { name: '해시계', month: 0, months: [], grade: 20, price: 25000, desc: '그림자로 시간을 알려 주는 돌' },
  swing: { name: '나무 그네', month: 0, months: [], grade: 25, price: 35000, desc: '바람에 살랑이는 그네' },
  flowercart: { name: '꽃수레', month: 0, months: [], grade: 30, price: 50000, desc: '꽃 화분을 가득 실은 수레' },
};
const DECO_KEYS = Object.keys(DECOS).filter(k => !DECOS[k].extra && !DECOS[k].grade && !DECOS[k].jar);   // 덤 장식은 EXTRA_DECO_KEYS · 등급 장식은 GRADE_DECO_KEYS
const GRADE_DECO_KEYS = Object.keys(DECOS).filter(k => DECOS[k].grade);
const gradeDecoOffer = st => GRADE_DECO_KEYS.filter(k => DECOS[k].grade <= gradeOf(st).grade);   // 지금 등급으로 살 수 있는 등급 장식
const EXTRA_DECO_KEYS = Object.keys(DECOS).filter(k => DECOS[k].extra);
const decoInfo = key => {
  if (DECOS[key] && Object.prototype.hasOwnProperty.call(DECOS, key)) return DECOS[key];
  const jm = typeof key === 'string' && /^mutjar:([a-z]+):([123])$/.exec(key);   // P36-04 🫙 유리 관 속 변이 꽃
  if (jm && MUTANTS[jm[1]]) return { name: `유리 관 속 ${MUTANTS[jm[1]].name} · ${jm[2]}단계`, jar: true, mut: { k: jm[1], stage: +jm[2] }, price: null, desc: MUTANTS[jm[1]].lore };
  const pm = typeof key === 'string' && /^pres:([a-z]+):([01])$/.exec(key);   // P84-01 🌹 놓인 프리저브드
  if (pm && FLOWERS[pm[1]]) return { name: `프리저브드 ${presName(pm[1], pm[2] === '1')}`, pres: { type: pm[1], mut: pm[2] === '1' }, price: null, desc: DECOS.pres.desc };
  const tk = typeof key === 'string' && key.startsWith('t:') ? key.slice(2) : null;
  return tk && TITLES[tk] ? { name: `${TITLES[tk].name} 문장`, title: tk, price: null, extra: !!TITLES[tk].extra, desc: '칭호를 얻은 기념 문장' } : null;
};
const decoTotal = () => DECO_KEYS.length + GRADE_DECO_KEYS.length + TITLE_KEYS.length;   // 꾸밈 도감 칸 (도감 93칸과 따로 셈, P17-16-05) — 덤 장식 · 덤 칭호 문장은 빼고, 등급 장식은 넣음 (M1-4)
const decoCount = st => Object.keys((st.dex && st.dex.deco) || {}).filter(k => decoInfo(k) && !decoInfo(k).extra).length;
const decoExtras = st => [...EXTRA_DECO_KEYS, ...EXTRA_TITLE_KEYS.map(k => 't:' + k)].filter(k => ((st.dex && st.dex.deco) || {})[k]);   // 가진 덤 장식 (꾸밈 도감 끝에 덧붙여 보여 줌)
const decoMonths = k => DECOS[k].months || [DECOS[k].month];
const decoOffer = cal => DECO_KEYS.filter(k => decoMonths(k).includes(cal.month));
const decoAt = (st, x, y) => (st.decos || []).find(d => d.x === x && d.y === y);
// ---------------------------------------------------------------- 🪴 그 달의 장식은 그 달 꽃을 반겨요 (P35, 10-30)
// 이달의 장식 12가지(3월 ~ 2월 — 쉼달 🏮 · 꽃샘달 🏯은 P36 몫)가 정원에 놓여 있으면, 그 달에 심는 달이 든 꽃을 심을 때 씨앗 품질을 최소 90%로(상한 100% 그대로).
// 깎인 씨앗(창고에 오래 둔 · 번식)을 되살리는 정도라 돈 영향은 작음(시뮬 --decos ±5%). 놓아야 효과 · 같은 장식 여럿이어도 한 번 · 창고면 없음
const MONTH_DECO_Q = 0.9;
const MONTH_DECO_KEYS = DECO_KEYS.filter(k => !DECOS[k].months && DECOS[k].month >= 1 && DECOS[k].month <= 12);
const monthDecoOf = m => MONTH_DECO_KEYS.find(k => DECOS[k].month === m) || null;
function monthDecoBoost(st, flowerKey, cal) {     // 지금 달 장식이 놓여 있고 이 꽃의 심는 달에 지금 달이 듦
  cal = cal || calendar(st.virtual);
  const F = FLOWERS[flowerKey], k = monthDecoOf(cal.month);
  return !!(F && k && !cal.frozen && F.sow.includes(cal.month) && placedOf(st, k).length);
}
// 심을 때 올려 줄 장식 | null — 이미 90% 이상이면 없음. 숨은 칭호 「한 포기의 기적」(80% 이하로 심어 100%로)을 아직 못 얻었으면 80% 이하 씨앗엔 효과 없음 (그 칭호를 어렵게 하지 않게)
function monthDecoLift(st, it, cal) {
  if (!it || it.q >= MONTH_DECO_Q || !monthDecoBoost(st, it.type, cal)) return null;
  if (it.q <= 0.8 && !(st.titles && st.titles.t_miracle != null)) return null;
  return DECOS[monthDecoOf(cal.month)];
}
// 장식 카드 한 줄 (화원 · 창고 · 정원 장식 창): text 숫자 있는 줄 · plain 느긋하게 보기 줄 (P33 표를 다시 씀 — P33 효과는 빠져 있어 지금은 P35 · P36 줄만)
const DECO_BUFF = Object.fromEntries(MONTH_DECO_KEYS.map(k => { const m = monthName(DECOS[k].month); return [k, { text: `🌸 ${m} 꽃을 심으면 품질 ${pct(MONTH_DECO_Q)}%부터`, plain: `🌸 ${m} 꽃을 반겨요` }]; }));
DECO_BUFF.moonlamp = DECO_BUFF.pavilion = { text: '🧬 정원에 놓아 두면 처음 피는 꽃의 돌연변이가 더 자주', plain: '🧬 정원에 놓아 두면 처음 피는 꽃의 돌연변이가 더 자주' };   // P62-02 — 꽃이 처음 필 때 정원에 놓여 있으면 (예전 P36-01: 꽃잠 동안 놓였으면 그 해)
DECO_BUFF.mutjar = { text: '🧬 이 꽃의 돌연변이가 더 자주', plain: '🧬 이 꽃의 돌연변이가 더 자주' };
// P44-04 ⛏️ 광산 공방 효과 (놓아야 · 느긋하게 보기면 숫자 없이) — 이달의 장식(P35) 줄이 있는 셋은 두 줄을 이어 씀
const WORKSHOP_BUFF = {
  stepstone: { text: '👣 둘레 1칸 꽃은 땅이 안 맞아도 품질이 떨어지지 않아요', plain: '👣 둘레 꽃은 땅이 안 맞아도 품질이 떨어지지 않아요' },
  basin: { text: '💧 둘레 1칸 꽃은 물이 6시간 더 가요', plain: '💧 둘레 꽃은 물이 조금 더 오래 가요' },
  stonelamp: { text: '🏮 둘레 2칸 꽃은 🌙 꽃잠 12시간마다 품질 +1%', plain: '🏮 둘레 꽃은 🌙 꽃잠에도 조금씩 좋아져요' },
  fossilcase: { text: '⛏️ 광산 기력 최대 +3', plain: '⛏️ 광산 기력이 조금 더 차요' },
  amberlamp: { text: '💎 광산 보석이 +1% 더 자주', plain: '💎 광산 보석이 조금 더 자주' },
  oldpot: { text: '🌰 💐 화원 씨앗 처음 품질 +5%', plain: '🌰 💐 화원 씨앗이 조금 더 좋게 와요' },
};
for (const [k, B] of Object.entries(WORKSHOP_BUFF)) DECO_BUFF[k] = DECO_BUFF[k] ? { text: `${DECO_BUFF[k].text} · ${B.text}`, plain: `${DECO_BUFF[k].plain} · ${B.plain}` } : B;
// ---------------------------------------------------------------- 🧬 돌연변이 꽃 (P36, 10-30)
// P36-01 꽃이 처음 필 때 한 번 굴림: 기본 1% + 🏮 달 초롱 · 🏯 정자가 그때 정원에 놓여 있으면 각 +5% + 그 종의 🫙 유리 관이 정원에 있으면 그 종만 +5%, 최대 16%.
//   P62 (11-03): 초롱 · 정자 +1% → +5% · 최대 8% → 16% · 꽃잠 동안 놓였으면 그 해(st.mutBoost) → 꽃이 처음 필 때 정원에 놓여 있는지 직접 봄 (달마다 · 언제든). st.mutBoost는 안 읽음(예전 저장에 남아도 무해)
//   시드는 정원 이름표 · 꽃 번호 · 해(주) — Math.random 없음. 번식 · 채종 씨앗은 하나마다 50%로 이어짐(같은 꼴 시드)
// P36-02 변이 꽃: 꽃잎을 딸 수 없음(canCare harvest · 개미 일꾼) · 꽃 도감 · 주간 목표 · 퀘스트 · 등급 경험치 · 올해 본 꽃에 안 셈 · 품질은 보통 꽃처럼 변함 —
//   품질이 낮을수록 괴이: 70% 이상 1단계 · 40 ~ 69% 2단계 · 39% 이하 3단계. 정원에서 없애는 길은 🫙 유리 관에 담기뿐(호미 · 뽑기 없음 · 옮겨심기는 됨)
// 돈 · 수확 0 (P17-14 밖). 단계는 품질에서 셈 — 저장은 꽃 mut 하나
const MUT_BASE = 0.01, MUT_SLEEP = 0.05, MUT_JAR = 0.05, MUT_MAX = 0.16, MUT_INHERIT = 0.5;   // P62-01 · P62-03 MUT_SLEEP 0.01 → 0.05 · MUT_MAX 0.08 → 0.16
const MUT_SLEEP_KEYS = ['moonlamp', 'pavilion'];
// P36-06 13종: 꽃에 얽힌 이야기에서 — 이름 · 괴담 한 줄 (그림 팔레트는 decos.js MUTANT_ART)
const MUTANTS = {
  chamomile: { name: '밟힌 캐모마일', lore: '밟힐수록 퍼진다더니, 이 꽃은 밟힌 자국을 잊지 않았어요' },
  rose: { name: '피 한 방울 장미', lore: '흰 장미였대요. 가시에 찔린 여신의 피가 꽃잎 끝에 번지기 전까지는' },
  lavender: { name: '뱀 그늘 라벤더', lore: '옛 로마 사람들은 라벤더 덤불 아래 독사가 산다고 믿었어요' },
  jasmine: { name: '맹세의 재스민', lore: '"맹세해요" — 달빛 아래 한 약속이 꽃잎에 하얗게 남았어요' },
  lotus: { name: '돌아온 연꽃', lore: '바다에서 떠오른 연꽃 속에 누군가 웅크려 돌아왔대요' },
  bpea: { name: '변덕 완두', lore: '레몬 한 방울이면 파랑이 보라로 — 이 꽃은 혼자서도 마음을 바꿔요' },
  hibiscus: { name: '펠레의 히비스커스', lore: '불의 여신이 지나간 자리, 꽃잎 끝에 식지 않은 재가 앉았어요' },
  marigold: { name: '길잡이 메리골드', lore: '떠난 이들이 집으로 오는 밤, 이 꽃가루를 따라 걷는대요' },
  celosia: { name: '충신의 맨드라미', lore: '끝내 뜻을 굽히지 않은 충신의 피가 볏처럼 솟았대요' },
  gamguk: { name: '이슬 감국', lore: '국화 이슬을 마신 아이는 칠백 년을 늙지 않았대요' },
  dongbaek: { name: '밤에 지는 동백', lore: '동백은 시들지 않고 송이째 떨어져요. 그것도 꼭 밤에만' },
  maehwa: { name: '날아온 매화', lore: '주인을 그리던 매화가 하룻밤 새 먼 바다를 건너왔대요' },
  napmae: { name: '촛농 납매', lore: '밀랍으로 빚은 꽃이 한겨울에도 천천히 녹아내려요' },
};
const MUTANT_KEYS = FLOWER_KEYS.filter(k => MUTANTS[k]);
const MUT_TITLE_KEYS = Object.keys(TITLES).filter(k => TITLES[k].mut);
const mutStage = f => { const p = pct(f.q); return p >= 70 ? 1 : p >= 40 ? 2 : 3; };
const mutShown = f => !!f && !!f.mut && !f.withered && f.bloomKey != null && f.bloomKey !== -1;   // 한 번 핀 변이 꽃 (씨앗으로 이어진 변이는 처음 필 때 드러남)
const decoKey = d => d && d.key === 'mutjar' && d.mut && MUTANTS[d.mut.k] ? `mutjar:${d.mut.k}:${d.mut.stage}` : d && d.key === 'pres' && d.pres ? `pres:${d.pres.type}:${d.pres.mut ? 1 : 0}` : d && d.key;   // 장식 이름 · 그림 키 (🫙는 종 · 단계까지 · 🌹는 꽃 · 변이까지)
const mutJarsOf = (st, k) => (st.decos || []).filter(d => d.key === 'mutjar' && d.x != null && d.mut && d.mut.k === k);
function mutChance(st, type, cal) {           // cal은 예전 호출 모양 그대로 받기만 함 (P62-02부터 해 · 주를 안 봄)
  const b = MUT_SLEEP_KEYS.filter(k => placedOf(st, k).length).length;   // P62-02 지금 정원에 놓인 🏮 · 🏯 (종류마다 한 번)
  return Math.min(MUT_MAX, Math.round((MUT_BASE * titlePerk(st, 'mutBase') + MUT_SLEEP * titlePerk(st, 'mutSleep') * b + (mutJarsOf(st, type).length ? MUT_JAR * titlePerk(st, 'mutJar') : 0)) * 10000) / 10000);
}
function mutRoll(st, f, cal) {
  const r = mineRng(hashStr(`${st.gardenId || 'g'}|mut|${f.id}|${cal.week}`)); r();
  f.mut = r() < mutChance(st, f.type, cal);
  return f.mut;
}
function mutSeed(st, f, i, cal) {                 // 변이 꽃에서 나온 씨앗 · 묘목 i번째가 변이를 잇는지 (50%)
  if (!f.mut) return false;
  const r = mineRng(hashStr(`${st.gardenId || 'g'}|mutseed|${f.id}|${(cal || calendar(st.virtual)).week}|${i}`)); r();
  return r() < MUT_INHERIT;
}
function mutSee(st, f, ctx) {                     // 지금 단계를 도감에 (그 단계를 처음 본 때)
  if (!mutShown(f)) return false;
  const d = st.dex.mutant = st.dex.mutant || {}, s = mutStage(f);
  if ((d[f.type] || 0) >= s) return false;
  const first = !d[f.type]; d[f.type] = s;
  if (!first) addLog(st, 10, `📖 도감에 등록: 🧬 ${MUTANTS[f.type].name} · ${s}단계`, ctx);
  return true;
}
function mutBloom(st, f, first, ctx) {            // 변이 꽃이 필 때: 처음이면 알림 한 줄(알림 설정 「📖 도감 등록」) · 도감
  if (first) addLog(st, 9, `🧬 뭔가 다른 꽃이 피었어요 — 「${MUTANTS[f.type].name}」`, ctx);
  mutSee(st, f, ctx);
}
function mutSync(st, ctx) {                       // onSlot · 담기 · DEV: 놓인 변이 꽃의 지금 단계 → 도감 · 칭호
  for (const f of st.flowers || []) mutSee(st, f, ctx);
  const cal = calendar(st.virtual);
  for (const k of MUT_TITLE_KEYS) if (TITLES[k].test(st)) giveTitle(st, k, cal, ctx);
}
const mutDexCount = st => Object.keys((st.dex && st.dex.mutant) || {}).filter(k => MUTANTS[k]).length;   // 본 종 (13)
const mutDexCells = st => MUTANT_KEYS.reduce((a, k) => a + Math.min(3, (((st.dex && st.dex.mutant) || {})[k]) || 0), 0);   // 본 칸 (13 × 3 = 39) — 높은 단계를 봤으면 그 아래 단계도 본 것으로
function mutDex(st) {                             // 📖 🧬 칩: 종마다 본 단계 · 담았는지 (안 본 종은 이름 · 괴담 없이)
  const d = (st.dex && st.dex.mutant) || {}, j = (st.dex && st.dex.mutjar) || {};
  return MUTANT_KEYS.map(k => ({ k, stage: Math.min(3, d[k] || 0), jar: !!j[k], name: d[k] ? MUTANTS[k].name : null, lore: d[k] ? MUTANTS[k].lore : null }));
}
function jarCapture(st, flowerId, ctx) {          // P36-04 🫙 유리 관에 담기: 유리 관 1 · 꽃 자리 빔 · 그때 단계 그대로 장식(창고)
  const f = st.flowers.find(x => x.id === flowerId);
  if (!mutShown(f)) return no('유리 관에 담을 변이 꽃이 없어요');
  if (!(st.jar > 0)) return no('유리 관이 없어요 · ⛏️ 광산 만들기에서 만들어요');
  mutSee(st, f, ctx);
  const k = f.type, stage = mutStage(f);
  st.jar--; st.flowers.splice(st.flowers.indexOf(f), 1);
  const d = { id: nid(st), key: 'mutjar', mut: { k, stage }, x: null, y: null };
  (st.decos = st.decos || []).push(d);
  const jd = st.dex.mutjar = st.dex.mutjar || {}, first = !jd[k]; jd[k] = true;
  addXp(st, 'jar', 1, ctx);   // P54
  mutSync(st, ctx);
  return ok(`🫙 ${josa(decoInfo(decoKey(d)).name, '을/를')} 창고에 넣었어요`, { deco: d, first });
}
function mutDev(st, ctx) {                        // 개발용(DEV) · 테스트: 정원 첫 꽃(핀 꽃 먼저)을 변이로 · 유리 관 3개
  const fs = (st.flowers || []).filter(f => !f.withered), f = fs.find(x => x.stage === 'bloom') || fs[0];
  st.jar = (st.jar || 0) + 3;
  if (!f) return no('정원에 꽃이 없어요 · 유리 관 3개만 넣었어요');
  f.mut = true; if (f.bloomKey == null || f.bloomKey === -1) f.bloomKey = calendar(st.virtual).abs;
  mutSync(st, ctx);
  return ok(`🧬 ${josa(FLOWERS[f.type].name, '을/를')} 변이 꽃으로 · 🫙 유리 관 +3`, { flower: f });
}
// ---------------------------------------------------------------- 🌹 프리저브드 플라워 (P53, 11-01 사용자 요청)
// 품질 · 기운이 100%인 다 핀 꽃을 꺾어(정원에서 사라지고 빈 칸) 🧪 특수 용액 1병과 함께 꽃방 유리 돔에 넣으면 현실 하루 뒤 완성 → 📦 창고 → 💐 화원에서 팖
//   "꽃 값" = 화원에서 파는 그 꽃 한 포기 값 FLOWERS.price (씨앗 · 묘목 값) — 프리저브드 값은 그 10배 · 🧬 변이 꽃은 다시 2배 (꽃잎을 딸 수 없는 꽃이라)
//   유리 돔은 꽃잎 말리기(st.drying)와 따로 — 꽃방 칸 수 제한이 없어 서로 밀어내지 않음 · 🌾 말리는 속도는 닿지 않음(늘 현실 하루) · 꽃잠에도 흐름(dryTick과 같이 advance에서)
//   도감은 기본 93칸과 따로 st.dex.pres(꽃 13) · st.dex.presMut(🧬 변이 13) — 다 모으면 덤 칭호 둘 (P52 효과 하나씩)
const PRES_H = 24, PRES_RATE = 10, PRES_MUT_RATE = 2;
const presValue = (st, type, mut) => Math.round(FLOWERS[type].price * PRES_RATE * (mut ? PRES_MUT_RATE : 1) * titlePerk(st, 'presValue') / 10) * 10;
const presName = (type, mut) => mut && MUTANTS[type] ? `🧬 ${MUTANTS[type].name}` : FLOWERS[type].name;
const presFull = (st, f) => pct(f.q) >= 100 && Math.round(vigorOf(st, f)) >= 100;
function presReason(st, f) {                      // 만들 수 없으면 까닭 한 줄 (꽃 창 단추 아래), 만들 수 있으면 ''
  if (!f || f.withered) return '시든 꽃은 만들 수 없어요';
  if (f.stage !== 'bloom') return '다 핀 꽃으로 만들 수 있어요';
  if (!presFull(st, f)) return '품질 · 기운이 100%일 때 만들 수 있어요';
  if (!(st.presol > 0)) return '⛏️ 광산에서 특수 용액을 만들어요';
  return '';
}
function preserve(st, flowerId, ctx) {             // 꽃을 꺾어 꽃방 유리 돔에 (용액 1병)
  const f = (st.flowers || []).find(x => x.id === flowerId);
  if (!f) return no('꺾을 꽃이 없어요');
  const why = presReason(st, f); if (why) return no(why);
  const mut = mutShown(f);
  if (mut) mutSee(st, f, ctx);                    // 변이 꽃은 지금 단계를 도감에 (유리 관과 같음)
  st.presol--; st.flowers.splice(st.flowers.indexOf(f), 1);
  (st.preserving = st.preserving || []).push({ id: nid(st), type: f.type, mut, leftH: PRES_H });
  bump(st, 'presMade'); addXp(st, 'pres', 1, ctx);   // P54
  return ok(`🌹 ${josa(presName(f.type, mut), '을/를')} 꽃방 유리 돔에 넣었어요 · ${timeText(PRES_H / titlePerk(st, 'presSpeed'))} 뒤에 완성돼요`, { mut });
}
function presTick(st, dtH, ctx) {                 // advance 걸음마다 (꽃잠에도)
  const list = st.preserving; if (!list || !list.length) return 0;
  let n = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.leftH -= dtH * titlePerk(st, 'presSpeed');
    if (p.leftH > 0) continue;
    list.splice(i, 1); n++;
    (st.preserved = st.preserved || []).push({ id: p.id, type: p.type, mut: !!p.mut });
    const d = presDex(st, p.mut), first = !d[p.type]; d[p.type] = true;
    addLog(st, 9, `🌹 ${josa(`프리저브드 ${presName(p.type, p.mut)}`, "이/가")} 완성됐어요 · 📦 창고에 있어요${first ? ' · 📖 도감에 등록' : ''}`, ctx);
  }
  return n;
}
const presDex = (st, mut) => { const k = mut ? 'presMut' : 'pres'; return (st.dex[k] = st.dex[k] || {}); };
const presCount = st => FLOWER_KEYS.filter(k => ((st.dex && st.dex.pres) || {})[k]).length;          // 꽃 13칸
const presMutCount = st => MUTANT_KEYS.filter(k => ((st.dex && st.dex.presMut) || {})[k]).length;  // 🧬 변이 13칸
const presLeftH = (st, p) => Math.max(0, p.leftH) / titlePerk(st, 'presSpeed');   // 완성까지 남은 현실 시간 (화면)
function presDexOf(st) {                          // 📖 🌹 칩: 꽃마다 모았는지 · 변이는 그 종을 본 뒤에만 이름
  const d = (st.dex && st.dex.pres) || {}, m = (st.dex && st.dex.presMut) || {}, seen = (st.dex && st.dex.mutant) || {};
  return { flower: FLOWER_KEYS.map(k => ({ k, got: !!d[k], name: FLOWERS[k].name })), mut: MUTANT_KEYS.map(k => ({ k, got: !!m[k], name: seen[k] || m[k] ? MUTANTS[k].name : null })) };
}
function sellPreserved(st, ids, ctx) {            // 💐 화원에서 팔기
  const list = (st.preserved || []).filter(p => ids.includes(p.id));
  if (!list.length) return no('팔 프리저브드가 없어요 · 꽃방에서 완성되면 창고로 와요');
  let sum = 0;
  for (const p of list) { sum += presValue(st, p.type, p.mut); st.preserved.splice(st.preserved.indexOf(p), 1); }
  st.money += sum; yearAdd(st, 'income', sum); bump(st, 'presSold', list.length); addXp(st, 'presSell', list.length, ctx);   // P54
  addLog(st, 13, `🌹 프리저브드 ${list.length}개를 화원에 ${sum.toLocaleString('ko-KR')}원에 팔았어요`, ctx);
  return ok(`🌹 프리저브드 ${list.length}개를 ${sum.toLocaleString('ko-KR')}원에 팔았어요`, { sum });
}
// P75-01 카드 표시 (11-04 사용자 확정): 정원에 놓여 있어야 효과가 나는 장식 → 'place' (📍 놓아야 효과) · 보기만 바뀌는 장식 → null. 사면 바로 켜지는 것(🌼 넓히기 · 속도)은 화면이 'buy'(✨ 사면 바로)로
// P84 🌹 프리저브드 장식 (11-06 사용자 "프리저브드 장식으로 만들거나 팔거나" · 놓으면 작은 효과): 창고(st.preserved) ↔ 정원(st.decos, key 'pres') 사이를 오감 — 놓인 동안엔 st.preserved에 없어 못 팖
//   효과: 🏮 석등(둘레 2칸 · +1%)보다 작게 둘레 1칸 · 꽃잠 달 끝마다 품질 +0.5%. 여러 개가 겹쳐도 한 꽃에 한 번(상한) · 그 달에 놓거나 옮긴 것은 다음 달 끝부터(d.at) — 놓기 · 거두기를 되풀이해 거저 얻지 못하게
//   놓기 · 거두기엔 경험치가 없고, 한 해 평가의 장식 점수에도 안 듦 · 🎀 대표 장식으로 달지 않음 · 새 철엔 창고로 돌아옴 (startSeason)
const PRES_DECO_Q = 0.005;
const presAsDeco = p => ({ id: p.id, key: 'pres', pres: { type: p.type, mut: !!p.mut }, x: null, y: null });
const presDeco = (st, id) => { const p = (st.preserved || []).find(z => z.id === id); return p ? presAsDeco(p) : null; };   // 창고의 프리저브드를 놓는 동안 화면이 쓰는 모습 (st.decos엔 안 넣음)
function presDecoTick(st, ended) {                // onSlot: 꽃잠 달이 끝날 때 (lampTick과 같은 때)
  const ds = placedOf(st, 'pres').filter(d => d.at == null || d.at < ended.abs); if (!ds.length) return 0;
  let n = 0;
  for (const f of st.flowers) if (!f.withered && f.q < 1 && ds.some(d => Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) <= DECO_REACH.pres)) { f.q = Math.min(1, f.q + PRES_DECO_Q); n++; }
  return n;
}
const decoActive = key => { const k = String(key).split(':')[0], D = DECOS[k]; return D && (D.func || DECO_BUFF[k] || k === 'stonewall' || k === 'mutjar') ? 'place' : null; };
const decoBuffLine = (st, key) => { const B = DECO_BUFF[String(key).split(':')[0]]; return B ? (slowView(st) ? B.plain : B.text) : ''; };
function addDeco(st, key) {
  const d = { id: nid(st), key, x: null, y: null };
  (st.decos = st.decos || []).push(d);
  st.dex.deco = st.dex.deco || {}; st.dex.deco[key] = true;
  return d;
}
function buyDeco(st, key, ctx) {
  const it = DECOS[key], cal = calendar(st.virtual);
  if (!it || !Object.prototype.hasOwnProperty.call(DECOS, key)) return no('없는 장식이에요');
  if (it.grade) { if (gradeOf(st).grade < it.grade) return no(`${josa(it.name, '은/는')} 정원 등급 ${it.grade}부터 살 수 있어요`); }   // P28-05-01 등급 장식: 달과 상관없이
  else if (it.need && gradeOf(st).grade < it.need) return no(`${josa(it.name, '은/는')} 정원 등급 ${it.need}부터 살 수 있어요`);   // P28-10 자동 장치
  else if (!decoMonths(key).includes(cal.month)) return no(`${josa(it.name, '은/는')} ${decoMonths(key).map(monthName).join('·')}에만 들어와요`);
  if (it.one && (st.decos || []).some(d => d.key === key)) return no(`${josa(it.name, '은/는')} 하나면 충분해요`);
  if (st.money < it.price) return no('돈이 모자라요');
  st.money -= it.price;
  const first = !st.dex.deco || !st.dex.deco[key];
  const d = addDeco(st, key);
  if (first) addLog(st, 9, `도감에 등록: 🪴 ${it.name}`, ctx);
  return ok(`${josa(it.name, '을/를')} 샀어요 · 창고에서 정원에 놓을 수 있어요`, { deco: d });
}
function placeDeco(st, id, x, y) {
  const fromStore = !(st.decos || []).some(z => z.id === id) && presDeco(st, id);   // P84-01 🌹 창고의 프리저브드
  const d = fromStore || (st.decos || []).find(z => z.id === id);
  if (!d) return no('놓을 장식이 없어요');
  if (!inGarden(x, y)) return no('정원 밖이에요');
  if (flowerAt(st, x, y)) return no('꽃이 있는 칸이에요 · 빈 칸에 놓아 주세요');
  const o = decoAt(st, x, y);
  if (o && o !== d) return no('이 자리에는 이미 장식이 있어요');
  const moved = d.x != null && (d.x !== x || d.y !== y), down = st.topDeco === id;
  d.x = x; d.y = y;
  if (fromStore) { st.preserved.splice(st.preserved.findIndex(z => z.id === id), 1); (st.decos = st.decos || []).push(d); }
  if (d.key === 'pres' && (fromStore || moved)) d.at = calendar(st.virtual).abs;   // P84-02 이 달 끝엔 아직 효과 없음
  if (down) st.topDeco = null;                     // P52 ⬆️ 위 칸에 단 장식을 정원에 놓으면 위 칸에서 내려옴
  return ok(`${josa(decoInfo(decoKey(d)).name, '을/를')} ${moved ? '옮겼어요' : '놓았어요'}${down ? ' · 대표 장식에서 내렸어요' : ''}`);
}
// ---------------------------------------------------------------- 📦 창고 장식 묶음 · 최대 수 (P78, 11-05)
// 창고 장식 칸을 종류별로 묶음 — 화원 · 공방 · 곤충농장에서 들어오는 길 그대로. 최대 수는 있는 규칙만(one = 한 종류에 하나, 11-05 사용자 "있는 규칙 그대로") · 그 밖엔 null(제한 없음)
const DECO_GROUPS = [
  { key: 'month', name: '🌸 이달의 장식' }, { key: 'grade', name: '🌱 등급 장식' }, { key: 'craft', name: '⛏️ 공방 장식' },
  { key: 'gear', name: '🔆 정원 장치' }, { key: 'insect', name: '🐝 곤충 일꾼' }, { key: 'keep', name: '🏅 기념 장식' },
];
function decoGroupOf(key) {
  const D = decoInfo(key); if (!D) return 'keep';
  if (D.insect) return 'insect';
  if (D.func) return 'gear';
  if (D.grade) return 'grade';
  if (D.craft) return 'craft';
  return D.title || D.extra || D.jar || D.pres ? 'keep' : 'month';
}
const decoMax = key => { const D = decoInfo(key); return D && D.one ? 1 : null; };
// 창고 장식 칸 묶음: [{ key, name, items: [{ key, all, store, out }] }] — store = 창고에 있는 것(🎀 위 칸 빼고) · out = 정원에 놓은 것
function decoGroups(st) {
  const ds = st.decos || [], td = topDecoOf(st), keys = [...new Set(ds.map(decoKey))];
  return DECO_GROUPS.map(g => ({ key: g.key, name: g.name, items: keys.filter(k => decoGroupOf(k) === g.key).map(k => {
    const all = ds.filter(d => decoKey(d) === k);
    return { key: k, all, store: all.filter(d => d.x == null && d !== td), out: all.filter(d => d.x != null).length, max: decoMax(k) };
  }) })).filter(g => g.items.length);
}
// P81-03 (11-05) 창고 장식 카드를 누르거나 올리면 보이는 "지금 효과" 한 줄 — 효과 줄 · 놓은 수. 효과가 없는 꾸밈은 그렇다고
function decoEffect(st, key) {
  const base = String(key).split(':')[0], D = DECOS[base] && has(DECOS, base) ? DECOS[base] : null;
  const placed = (st.decos || []).filter(d => decoKey(d) === key && d.x != null).length;
  let line = '';
  if (D && D.insect && INSECT_LINE[base]) line = insectLine(st, base);
  else if (DECO_BUFF[base]) line = decoBuffLine(st, base);
  else if (D && D.grade) line = `💌 놓아 두면 주문 쪽지 +1장${placed ? ` (지금 ${orderMax(st)}장)` : ''}`;
  else if (D && (D.func || base === 'stonewall')) line = D.desc;
  if (!line) return { line: '🌼 보기만 바뀌는 꾸밈 장식이에요', placed, active: false };
  return { line: `${line} · ${placed ? `정원에 ${placed}개 놓음` : '아직 놓지 않아 효과가 없어요'}`, placed, active: placed > 0 };
}
// 빈 칸을 눌렀을 때 바로 놓을 수 있는 장식 (P78-02): 꽃 · 장식이 없는 정원 칸이면 창고에 있는 장식 종류마다 하나 [{ key, id, n }]
function decoPlaceable(st, x, y) {
  if (!inGarden(x, y) || flowerAt(st, x, y) || decoAt(st, x, y)) return [];
  return decoGroups(st).flatMap(g => g.items.filter(i => i.store.length).map(i => ({ key: i.key, id: i.store[0].id, n: i.store.length, group: g.key })));
}
// ---------------------------------------------------------------- 🌱 처음 피기까지 앞당김 (P61-02, 11-03 사용자 확정)
// 🌱 자라는 속도(BONUS.grow)는 예전엔 다 자라기까지(싹 · 새싹 · 자라는 중 → 다 자람, ageH)만 빨랐음 — 다 자란 뒤 피는 달을 기다리는 동안은 그대로라 ×5여도 늦게 피었음
// 이제 심은 뒤 처음 피기까지(bloomKey === -1) 다 자란 꽃은 기다리는 동안도 같은 배율로: 꽃마다 자기 달력이 달력보다 f.leadH(흐르는 시간)만큼 앞서 감 (걸음마다 dtH × (빠르기 − 1))
//   자기 달력이 피는 달에 닿으면 피고, 앞선 시간은 멈춤 → 피어 있는 기간(피는 달 수)은 그대로 · 한해살이는 다 피고 나면 시들어 시드는 때도 핀 만큼만 당겨짐
//   다 피고 나면 달력이 자기 달력이 있던 달(f.leadEnd)에 닿을 때까지 같은 만큼 앞선 채로 두었다가 지움 — 같은 해 피는 달에 한 번 더 피지 않게. 두 번째 해부터는 피는 달 그대로
//   🔆 생장 장치 · 칭호 덤은 예전처럼 다 자라기까지만 (P27: 피는 달 · 품질 · 땅 · 꽃잠은 그대로) · 꽃잠엔 걸음이 없어 앞서지 않음 · 저장은 꽃의 leadH · leadEnd (없으면 0 — MIGRATIONS 없음)
// P72-01 (11-04): 피는 달이 없어져 앞선 달력(leadH · leadEnd · bloomMonth)은 지움 — 처음 피기까지 기다리는 RIPE_H 시계(f.ripeH)가 같은 배율로 빨라짐 (step). 옛 저장의 leadH · leadEnd는 MIGRATIONS 55번째가 지움
const bloomLeads = (st, f) => !f.withered && f.bloomKey === -1 && f.stage === 'mature' && bonusVal(st, 'grow') > 1;   // 지금 빨리 피는 중인지 (처음 피기까지)
// 핀 때까지 남은 흐르는 시간 (화면 "n시간 뒤 핌" — 현실 시간은 flowLeftH로). 다 자란(mature) 꽃만, 그 밖엔 null
const bloomLeftFlowH = (st, f) => !f || f.withered || f.stage !== 'mature' ? null : Math.max(0, RIPE_H - (f.ripeH || 0)) / (f.bloomKey === -1 ? bonusVal(st, 'grow') : 1);
function bloomLeftH(st, f) {                     // 현실 몇 시간 뒤 피는지 (P46 시간 글자) — 꽃잠 · 그 꽃의 휴면 달엔 시계가 멈추니 그만큼 더
  let rem = bloomLeftFlowH(st, f); if (rem == null) return null;
  const F = FLOWERS[f.type]; let t = st.virtual, guard = 0;
  while (rem > 1e-9 && guard++ < 400) {
    const c = calendar(t), left = (c.slotEnd - t) / HOUR;
    if (c.frozen || F.dormant.includes(c.month)) { t = c.slotEnd; continue; }
    if (rem <= left) { t += rem * HOUR; rem = 0; } else { rem -= left; t = c.slotEnd; }
  }
  return (t - st.virtual) / HOUR;
}
// ---------------------------------------------------------------- 🧱 돌담 (P73, 11-04 사용자 확정)
// 놓인 돌담 칸은 꽃이 만드는 땅(step 1)의 영향을 막음: 꽃 칸 → 대상 칸 격자 직선(Bresenham, 난수 없음)의 사이 칸이나 대상 칸이 돌담이면 그 꽃의 영향이 안 감
//   꽃 칸 자신은 그대로 · 막는 건 꽃이 만드는 땅만 (곤충 둘레 · 💧 물확 · 🔆 장치 둘레 효과는 그대로) · 돌담이 없으면 null이라 예전과 똑같이 셈
function wallSet(st) {
  let s = null;
  for (const d of st.decos || []) if (d.key === 'stonewall' && d.x != null) (s = s || new Set()).add(d.y * W + d.x);
  return s;
}
function wallBlocks(walls, x0, y0, x1, y1) {
  if (x0 === x1 && y0 === y1) return false;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let x = x0, y = y0, e = dx + dy;
  while (x !== x1 || y !== y1) {
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x += sx; }
    if (e2 <= dx) { e += dx; y += sy; }
    if (walls.has(y * W + x)) return true;          // 사이 칸 · 마지막 대상 칸 모두
  }
  return false;
}
// ---------------------------------------------------------------- 🔆 생장 장치 (P27, 10-24 저녁)
// 놓인 장치 둘레의 꽃이 자라는 시간(ageH)을 빨리 셈 — 겹치면 가장 빠른 것 하나만. 다 자란 꽃은 피는 달을 기다릴 뿐이라 영향이 없음
const GEAR = { growlight: { r: 1, rate: 1.5 }, heatmat: { r: 1, rate: 2, young: true }, greenhouse: { r: 2, rate: 2 } };
function growRate(st, f) {
  let best = bonusVal(st, 'grow');                // P40-01 🌱 자라는 속도 — 장치와 겹치면 더 빠른 쪽 하나
  for (const d of st.decos || []) {
    const g = GEAR[d.key]; if (!g || d.x == null) continue;
    if (Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) > g.r) continue;
    if (g.young && !(f.stage === 'germ' || f.stage === 'sprout' || (f.lifeH != null ? f.lifeH : f.ageH) < MONTH_H)) continue;   // 온상 매트는 싹 · 새싹, 또는 심은 첫 달(묘목 · 모종 뿌리내림, QA 12회차 제안)
    if (g.rate > best) best = g.rate;
  }
  return best * titlePerk(st, 'grow', f);         // P52 🌱 새싹 · 🌳 나무 · 🌸 봄 · 다섯 철
}
// ---------------------------------------------------------------- 🍯 꿀 (P18, 10-24)
// 놓인 벌통은 꽃잠이 아닌 달이 끝날 때마다 둘레 hiveR칸(가로 · 세로 · 대각선, P61-01 0단계 2칸 → 기르면 4 · 6칸)에 핀 꽃을 세어 꿀을 모음 (P18-03 · 04 · 09)
// 꿀은 팔지 않음 — 찻잔에 한 숟갈 넣어 "꿀 ○○차"로 내고(값은 그대로), 종류마다 꿀 도감에 남음 (P18-07 · 08)
const HONEY_R = 2, HIVE_MAX = 3;                  // P38 0단계(기르기 전) 둘레 · 상한 — 예전 2칸 · 6병은 이제 1단계 · P61-01 둘레 1 → 2칸 (꿀 병 수는 그대로)
const HONEY_KEYS = [...FLOWER_KEYS, 'wild'];
const honeyName = k => k === 'wild' ? '들꽃꿀' : `${FLOWERS[k].name}꿀`;
const hiveR = st => bonusVal(st, 'hive').r, hiveMax = st => bonusVal(st, 'hive').max;   // P37 🐝 멀리 날기 · P38: 둘레 1 → 2 → 3칸(P61-01부터 2 → 4 → 6칸) · 꿀 3 → 6 → 9 → 12병 (0단계 = HONEY_R · HIVE_MAX)
function hiveBlooms(st, d) {
  return st.flowers.filter(f => !f.withered && f.stage === 'bloom' && Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) <= hiveR(st));
}
// 둘레의 핀 꽃 → 꿀 종류 · 병 수. 가장 많은 꽃을 따르고, 세 가지 넘게 섞여 절반을 넘는 꽃이 없으면 들꽃꿀
function honeyOf(blooms) {
  const n = blooms.length; if (!n) return null;
  const by = {}; for (const f of blooms) by[f.type] = (by[f.type] || 0) + 1;
  const kinds = Object.keys(by), top = FLOWER_KEYS.filter(k => by[k]).sort((a, b) => by[b] - by[a])[0];
  const type = kinds.length >= 3 && by[top] * 2 < n ? 'wild' : top;
  return { type, jars: n >= 6 ? 3 : n >= 3 ? 2 : 1 };
}
