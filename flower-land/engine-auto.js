// 도리의 정원 — 게임 규칙 엔진 조각 8/10: 🐝 곤충 · 🧺 정원 저장고 · 🌟 등급 보너스 · 🌱 씨앗 처음 품질 · 🐝 곤충농장
// P66(11-03): 예전 한 파일 engine.js(줄 2603 ~ 3062)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
'use strict';
// ---------------------------------------------------------------- 🐝 곤충은 모두 꽃을 돕는다 (P39, 10-31)
// 곤충 일곱(DECOS insect)은 놓은 자리 둘레 r칸(가로 · 세로 · 대각선)의 꽃에만 일함 — 🌼 기르면 r = 2 → 4 → 6 (P39-01 1 → 2 → 3 → P61-01 2배). 창고에 두면 쉼
// 일하는 때는 꽃잠이 아닌 달이 끝날 때 한 번 (onSlot). 여러 마리가 겹쳐도 한 꽃에 한 번 — 돌봄은 "돌본 상태"라 겹쳐도 같음 (P39-01-05)
// 손을 덜 뿐 사람이 다 돌볼 때보다 더 벌지 않음 (P17-14): 돌본 효과 시간은 손으로 준 것과 같고, 손 돌봄의 비료 덤(weedCount · pruneCount)은 안 줌
const INSECTS = { barrel: 'barrel', autobasket: 'basket', ladybug: 'weed', earthworm: 'worm', dryrack: 'rack', hive: 'hive', teahelper: 'brew' };   // 곤충 장식 키 → 🌼 기르기 칸 (BONUS)
const INSECT_KEYS = Object.keys(INSECTS);
// P65-04 곤충 효과 한 줄 (11-03 사용자 확정): "둘레 n칸 꽃에서 · 얼마마다 · 무엇을 해요" — 곤충농장 카드 · 정원 곤충 창 · 장식 카드(DECOS desc) · 넓히기 "다음:"이 모두 이것 하나 (n = insectR, 엔진 값)
const INSECT_LINE = {
  barrel: r => `둘레 ${r}칸 꽃에 달마다 물을 줘요`,
  autobasket: r => `둘레 ${r}칸 핀 꽃에서 달마다 꽃잎을 1~5장 물어 와요 · 꽃은 핀 그대로예요`,   // P77-C
  ladybug: r => `둘레 ${r}칸 꽃에서 달마다 잡초를 치워요 · 호미를 써요`,   // P77-B 용품
  earthworm: r => `둘레 ${r}칸 꽃에서 달마다 흙을 기름지게 해요 · 비료를 써요`,   // P76-01 석 달마다 → 달마다 · P77-B 용품
  dryrack: r => `둘레 ${r}칸 꽃에서 달마다 가지를 쳐요 · 가위를 써요`,   // P77-B 용품
  hive: r => `둘레 ${r}칸 꽃에서 달마다 꿀을 모아 창고에 넣어요 · 씨앗도 튼튼해요`,
  teahelper: r => `둘레 ${r}칸 꽃에서 달마다 그달 첫 꽃잎을 한 장 더 맺게 해요`,   // P76-01 두 해에 한 번 그해 첫 → 달마다 그달 첫
};
const insectLine = (st, key) => INSECT_LINE[key](insectR(st, key));
const AUTO_KEYS = Object.keys(DECOS).filter(k => DECOS[k].auto);
const AUTO_Q = 0.9;                              // 개미가 거둔 꽃잎은 손으로 거둔 것의 90% 품질
const placedOf = (st, key) => (st.decos || []).filter(d => d.key === key && d.x != null);
const inReach = (f, d, r) => Math.max(Math.abs(f.x - d.x), Math.abs(f.y - d.y)) <= r;
const insectR = (st, key) => { const v = bonusVal(st, INSECTS[key]); return typeof v === 'number' ? v : v.r; };   // 둘레 칸 수 (🐝은 { r, max })
const insectFlowers = (st, d) => st.flowers.filter(f => !f.withered && inReach(f, d, insectR(st, d.key)));         // 이 곤충의 둘레 꽃 (시든 꽃 빼고)
const insectNear = (st, key, f) => placedOf(st, key).some(d => inReach(f, d, insectR(st, key)));                  // 이 꽃이 그 곤충 둘레에 있는지
const insectsOn = (st, f) => INSECT_KEYS.filter(k => insectNear(st, k, f) && (k !== 'autobasket' || !f.mut) && (k !== 'dryrack' || FLOWERS[f.type].prune));   // 꽃 상태창 아이콘 줄 (P39-12-04)
// 둘레 꽃 돌봄 한 가지: 남은 효과가 한 달보다 짧으면 손으로 준 것과 같은 시간으로 (물 · 잡초 2달, 비료 · 가지치기 1달) — 달 끝마다라 끊기지 않음
// P76-01 (11-04 사용자 확정 "모든 곤충을 통일성 있게 매달로"): 🪱 지렁이도 다른 곤충처럼 달마다 — 예전 WORM_EVERY 석 달에 한 번(P39-13 시뮬 조정)은 없앰 · every 칸은 남겨 둠(1 = 매달)
const WORM_EVERY = 1;
const INSECT_CARE = {
  barrel: { h: 'waterH', set: (st, f) => waterSet(st, f), stat: 'autoWater', ok: () => true, done: f => { f.thirstH = 0; } },   // P39-07 🐌 물 (예전 빗물 통 그대로 · 둘레만 기름)
  ladybug: { h: 'weedH', set: 2 * MONTH_H, stat: 'autoWeed', ok: () => true },                                 // P39-08 🐞 잡초 (호미 · 비료 덤 없음)
  earthworm: { h: 'fertH', set: MONTH_H, stat: 'autoFert', ok: () => true, every: WORM_EVERY },                                  // P39-05 🪱 비료 효과 (비료를 안 씀) · P76-01 달마다
  dryrack: { h: 'pruneH', set: MONTH_H, stat: 'autoPrune', ok: f => FLOWERS[f.type].prune },                  // P39-04 🐛 가지치기 (가위를 안 씀)
};
// P77-B (11-04 사용자 확정 "곤충은 꽃을 관리하는 데 필요한 자원을 소모 · 없으면 광산에서 만들고 · 재료도 없으면 기력으로 캐고 · 기력도 없으면 쉼"):
//   🐞 호미 1번 · 🪱 비료 1개 · 🐛 가위 1번 — 손으로 돌볼 때와 같은 용품(🐌 물은 빗물이라 공짜 · 🐜 바구니도 안 씀). 떨어지면 가방 재료로 만들고(CRAFTS fert · hoe · shears, 곤충 몫이라 craft 경험치 없음),
//   재료가 모자라면 광산 기력 1씩 캐고(dig — 💎 · 계단 칸은 사람 몫으로 남김 · 파기 경험치 · 주간 목표는 그대로), 그래도 없으면 그 포기부터 쉼(insectShort가 농장 카드에 까닭) · 한 일 수(stats)엔 돌본 꽃만
const INSECT_SUPPLY = { ladybug: 'hoe', earthworm: 'fert', dryrack: 'shears' };   // 곤충 → 용품 키 (= CRAFTS 키)
const INSECT_TOOL = { barrel: 'water', ladybug: 'weed', earthworm: 'fert', dryrack: 'prune' };   // 곤충 → 손 돌봄 도구 (주간 목표 셈 — 11-04 사용자 "곤충이 해준 횟수는 목표에 포함")
function insectCraft(st, kind) {                 // 가방 재료로 용품 하나 → 만들었으면 true
  const C = CRAFTS[kind]; if (!canCraft(st, kind)) return false;
  const bag = st.mine.bag; for (const [n, q] of Object.entries(C.need)) bag[n] -= q;
  if (kind === 'fert') addFert(st, 1); else st[kind] = (st[kind] || 0) + SUPPLIES[kind].per;
  bump(st, 'bugCraft'); return true;
}
function insectDig(st, ctx) {                    // 기력 1로 한 칸 (💎 · 계단 칸은 두고) → 캤으면 true
  const m = mineOf(st); if (m.energy < 1) return false;
  const i = m.board.cells.findIndex(c => !c.dug && c.k !== 'jewel' && !c.stairs); if (i < 0) return false;
  const r = dig(st, i, ctx); if (r.ok) bump(st, 'bugDig'); return r.ok;
}
function insectTake(st, key, ctx) {              // 꽃 한 포기 몫 용품을 쓰기 → 썼으면 true (없으면 만들고 · 캐고 · 그래도 없으면 false)
  const kind = INSECT_SUPPLY[key]; if (!kind) return true;
  while ((st[kind] || 0) < 1 && !insectCraft(st, kind)) if (!insectDig(st, ctx)) break;
  if ((st[kind] || 0) < 1) return false;
  st[kind]--; return true;
}
function insectShort(st, key) {                  // 지금 상태로 다음 달에 쉬게 될 까닭 한 줄 (없으면 null) — 농장 카드
  const kind = INSECT_SUPPLY[key]; if (!kind || (st[kind] || 0) >= 1 || canCraft(st, kind)) return null;
  const need = Object.entries(CRAFTS[kind].need).map(([n, q]) => `${mineName(n)} ${q}`).join(' · '), m = mineOf(st);
  const can = m.energy >= 1 && m.board.cells.some(c => !c.dug && c.k !== 'jewel' && !c.stairs);
  return `${josa(SUPPLIES[kind].name, '이/가')} 없어요 · ${need}로 만들어요${can ? ` · 기력 ${m.energy}으로 캐 볼게요` : ' · 기력이 없어 쉬어요'}`;
}
function insectCareTick(st, key, ended, ctx) {
  const C = INSECT_CARE[key], seen = new Set(); let n = 0;
  if (C.every > 1 && ended && ended.abs % C.every) return 0;   // 🪱 n달에 한 번 (끝난 달 번호로 — 난수 없음)
  out: for (const d of placedOf(st, key)) for (const f of insectFlowers(st, d)) {
    if (seen.has(f) || !C.ok(f)) continue;
    seen.add(f);
    if (f[C.h] < MONTH_H) {
      if (!insectTake(st, key, ctx)) break out;   // P77-B 용품을 못 구하면 남은 꽃은 쉼
      f[C.h] = typeof C.set === 'function' ? C.set(st, f) : C.set; if (C.done) C.done(f); n++;
    }
  }
  if (n) { bump(st, C.stat, n); weekNote(st, 'care', { tool: INSECT_TOOL[key] }, n, ctx); }   // 한 일 = 이번에 돌본 꽃 수 (아직 효과가 남은 꽃은 빼고 — 농장 카드 · 자리를 비운 동안) · P77-B 주간 목표에도
  return n;
}
const barrelTick = st => insectCareTick(st, 'barrel');   // 예전 이름 (테스트 · 화면이 부름)
const INSECT_LOG = { barrel: n => `달팽이가 꽃 ${n}포기에 물을 줬어요`, ladybug: n => `무당벌레가 꽃 ${n}포기의 잡초를 치웠어요`, earthworm: n => `지렁이가 꽃 ${n}포기의 흙을 기름지게 했어요`, dryrack: n => `누에 일꾼이 꽃 ${n}포기의 가지를 쳤어요` };
const INSECT_LOG_SLOW = { barrel: '달팽이가 꽃에 물을 줬어요', ladybug: '무당벌레가 잡초를 치웠어요', earthworm: '지렁이가 흙을 기름지게 했어요', dryrack: '누에 일꾼이 가지를 쳤어요' };
function insectTick(st, ended, ctx) {            // onSlot: 꽃잠이 아닌 달이 끝날 때 — 물 · 잡초 · 비료 · 가지치기 → 개미 거두기(나비 꽃잎) → 🧺 선반
  for (const k of Object.keys(INSECT_CARE)) {
    const s = st.stats || {}, c0 = s.bugCraft || 0, d0 = s.bugDig || 0;
    const n = insectCareTick(st, k, ended, ctx); if (n) addXp(st, 'bugCare', n, ctx); if (n) addLog(st, 20, slowView(st) ? INSECT_LOG_SLOW[k] : INSECT_LOG[k](n), ctx);
    const c = (st.stats.bugCraft || 0) - c0, d = (st.stats.bugDig || 0) - d0;   // P77-B 만들고 · 캔 것 한 줄
    if (c || d) { const w = FARM.find(x => x.key === k), S = SUPPLIES[INSECT_SUPPLY[k]]; addLog(st, 20, slowView(st) ? `${w.name}가 광산에서 ${S.name}을 마련했어요` : `${w.name}가 ${d ? `광산 ${d}칸을 캐고 ` : ''}${S.name} ${c}개를 만들었어요`, ctx); }
  }
  basketTick(st, ended, ctx); autoDryTick(st); rackTick(st, ctx);   // P72-02 ⚙️ 개미 꽃잎은 건조 선반보다 먼저 자동 건조기로
}
// P39-02 🐜 개미: 둘레 r칸의 핀 꽃 모두 (포기 수 제한 없음 — 예전 basketFlowers의 포기 수 대신 둘레만). 🧬 변이 꽃은 꽃잎을 못 따서 건너뜀 (P39-01-06)
const basketFlowers = (st, d) => insectFlowers(st, d).filter(f => !f.mut);
// 개미 둘레에서 이 달에 거둘 꽃: 그 달에 핀 꽃 — 손으로 이미 거둔 꽃(harvestKey)과 개미가 이미 거둔 꽃(antKey)은 빼고 · 개미가 여럿 겹쳐도 한 번만
// P65-03 (11-03 사용자 확정): 개미는 꽃을 핀 채로 두고 꽃잎만 — 손 수확 표시(harvestKey · 지도에서 오므린 꽃 · "이번 달은 수확했어요")를 쓰지 않고 개미 표시 f.antKey(거둔 달 번호)만 적음
//   예전엔 개미도 harvestKey를 끝난 달로 적어 손 수확과 같은 표시를 나눠 썼음. 손 수확 규칙(canCare · care)은 그대로
// P72-01 (11-04): 거두는 모든 길은 꽃을 다시 다 자람으로 돌림 — 개미도 손 수확처럼 pickFlower(꽃이 오므라들고 RIPE_H 뒤 다시 핌). 핀 꽃이면 모두 (한 달 한 번 표시 harvestKey · antKey로 거르지 않음)
const basketBlooms = (st, d, cal) => basketFlowers(st, d).filter(f => f.stage === 'bloom' && f.antKey !== harvestSlot(cal));   // P77-C 한 달 한 번(antKey) · 꽃은 핀 그대로
// P39-03 🦋 나비: 둘레 꽃의 첫 수확에 꽃잎 +1장 (손 · 🐜 · 모두 거두기) — 난수 없음
// P76-01 (11-04 사용자 확정): 그해 첫 수확 · 두 해에 한 번(BUTTERFLY_EVERY 2, P39-13 시뮬 조정) → 달마다 그달 첫 수확. 꽃마다 f.bfm = 마지막으로 덤을 받은 달(harvestSlot) — 한 달에 여러 번 거둬도(P72-01 다시 핌) 덤은 한 번
//   예전 칸 f.hy · f.bfy(해)는 더 쓰지 않음 (옛 저장에 남아 있어도 그대로 둠)
function harvestYear(st, f, cal) {               // 거둘 때 부름 → 나비 덤 꽃잎 수 (0 | 1) — 이름은 예전 그대로 (화면 · 테스트가 부름)
  const m = harvestSlot(cal);
  if (f.bfm === m || !insectNear(st, 'teahelper', f)) return 0;
  f.bfm = m; bump(st, 'autoPetal');
  return 1;
}
// P28-10-01 꽃잠이 아닌 달이 끝날 때(ended = 끝난 달). 바구니 용품은 쓰지 않음 (빗물 통이 물병을 안 쓰는 것과 같음) · 화분 첫 수확 덤 없음
function basketTick(st, ended, ctx) {
  let n = 0;
  for (const d of placedOf(st, 'autobasket')) {
    const fs = basketBlooms(st, d, ended); let got = 0;
    for (const f of fs) {
      f.antKey = harvestSlot(ended);                        // P77-C (11-04 사용자 확정): 개미는 달마다 꽃마다 1 ~ 5장(antCount)을 물어 오고 꽃은 핀 그대로(pickFlower 없음 — 손으로 거둘 꽃잎은 그대로) · P65-03 개미 표시만
      const k = antCount(ctx && ctx.rng) + harvestYear(st, f, ended);
      for (let i = 0; i < k; i++) st.petals.push({ id: nid(st), type: f.type, q: f.q * AUTO_Q, seasonKey: seasonKey(st, ended), auto: true });
      if (!st.dex.petal[f.type]) { st.dex.petal[f.type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[f.type].name} 꽃잎`, ctx); }
      got += k;
    }
    d.n = (d.n || 0) + got; n += got;
  }
  if (n) {
    yearAdd(st, 'harvest', n); addXp(st, 'bug', n, ctx); bump(st, 'autoHarvest', n);   // 거둔 꽃잎은 사람이 거둔 것과 같은 양으로 셈 (P54 경험치 값은 같고 묶음만 🐝 곤충)
    addLog(st, 18, `개미 일꾼이 꽃잎 ${n}장을 물어 왔어요`, ctx);
  }
  return n;
}
// P39-09-01 🧺 건조 선반 (예전 P28-10-02 누에 말리기 그대로): 꽃잠이 아닌 달이 끝날 때 제다실 생화를 오래된 것부터(먼저 거둔 것 = 품질이 먼저 줄어든 것) 선반 하나에 SHELF_N장씩 꽃방에 넒
// 다 마르면(1달, 흐르는 시간) 말린 꽃잎 칸을 거치지 않고 바로 티백 — 블렌드 · 레시피는 사람 몫으로 남김. 손으로 넌 꽃잎은 그대로 · 기르기 없음 · 여럿 놓을 수 있음
const SHELF_N = 4;
const rackN = () => SHELF_N;                     // 선반 하나가 달마다 너는 꽃잎 (예전 이름 — 화면 · 시뮬이 부름)
function rackTick(st, ctx) {
  let n = 0;
  for (const d of placedOf(st, 'dryshelf')) {
    const list = st.petals.slice(0, SHELF_N);
    for (const p of list) { st.petals.splice(st.petals.indexOf(p), 1); st.drying.push({ id: p.id, type: p.type, q: p.q, leftH: DRY_H, auto: true }); }
    d.n = (d.n || 0) + list.length; n += list.length;
  }
  if (n) { bump(st, 'autoHung', n); addLog(st, 12, `건조 선반에 꽃잎 ${n}장을 널었어요`, ctx); }   // 말린 수(stats.dried)는 손으로 넌 것만 — 퀘스트 · 칭호를 장치가 끝내지 않게
  return n;
}
// P72-02 ⚙️ 자동 건조기 (11-04 사용자 확정): 정원에 하나라도 놓여 있으면 제다실에 꽃잎이 생기는 즉시(손 · 개미 · 저장고 · 화원에서 산 꽃잎) 장수 제한 없이 꽃방에 넒
//   손으로 넌 것처럼 꽃방 시간(🌾 말리는 속도 반영) 뒤 말린 꽃잎 칸으로 — 티백은 만들지 않음(건조 선반과 다름) · 말린 수(stats.dried)는 손으로 넌 것만 · 꽃잠에도 (꽃방이 꽃잠에도 마르니)
//   부르는 곳: flushPending(손 · 모두 거두기 · advance 끝) · insectTick(🐜 개미 다음 · 🧺 건조 선반 앞) · advance의 달이 바뀐 뒤 · pantryDone · buyPetal
function autoDryTick(st) {
  if (!st.petals.length || !placedOf(st, 'autodryer').length) return 0;
  const list = st.petals.splice(0);
  for (const p of list) st.drying.push({ id: p.id, type: p.type, q: p.q, leftH: DRY_H, ...boughtOf(p) });
  bump(st, 'autoDry', list.length); placedOf(st, 'autodryer')[0].n = (placedOf(st, 'autodryer')[0].n || 0) + list.length;
  return list.length;
}
// 꽃방 (P12-07): 말리는 동안과 말린 뒤에는 품질이 떨어지지 않음 · P47 꽃잠에도 마름 (advance에서 늘 부름)
function dryTick(st, dtH, ctx) {
  for (let i = st.drying.length - 1; i >= 0; i--) {
    const d = st.drying[i];
    d.leftH -= dtH * dryRate(st) * titlePerk(st, 'dry');   // P52 🌙 꽃잠에 온 손님 (꽃잠에만)                // P40-02 🌾 말리는 속도 (손으로 넌 것 · 건조 선반이 넌 것 모두)
    if (d.leftH <= 0) {
      st.drying.splice(i, 1);
      if (d.auto) { rackBag(st, d, ctx); continue; }                            // P28-10-02 자동 건조대가 넌 꽃잎은 다 마르면 바로 티백
      st.dried.push({ id: d.id, type: d.type, q: d.q, ...boughtOf(d) });
      st._driedNew = (st._driedNew || 0) + 1;
    }
  }
}
function rackBag(st, d, ctx) {                     // 손으로 말린 꽃잎을 티백으로 만든 것(makeTeaDried)과 같은 티백 · P77-C 선반 꽃잎은 말린 꽃잎 칸(auto 표시)에 모였다가 petals장이 되면 티백 하나
  st.dried.push({ id: d.id, type: d.type, q: d.q, auto: true, ...boughtOf(d) });
  const N = FLOWERS[d.type].petals, mine = st.dried.filter(p => p.auto && p.type === d.type);
  if (mine.length < N) return;
  const take = mine.sort((a, b) => b.q - a.q).slice(0, N), q = take.reduce((a, p) => a + p.q, 0) / N;
  for (const p of take) st.dried.splice(st.dried.indexOf(p), 1);
  st.teas.push({ id: nid(st), type: d.type, q, seasonKey: -1, hat: isHat(q), auto: true, ...boughtOf({ bought: take.some(p => p.bought) }) });
  regTeabag(st, d.type, ctx);
  if (!st.yearBest || q > st.yearBest.q) st.yearBest = { type: d.type, q };
  st._rackBagNew = (st._rackBagNew || 0) + 1; bump(st, 'autoBags');
}
// P39-09-02 🫖 찻집 도우미 (예전 P28-10-03 나비 차 우리기 그대로): 찻집이 열린 동안 카운터의 갓 우린 잔이 (손님 자리 + 2)잔보다 적으면 가장 오래된 티백부터 우려 채움 → 카운터가 한 잔씩 팖(autoSell)
// 블렌드 티백 · 🍯 꿀 · 주문 맞추기는 사람 몫. 달이 바뀌면 남은 잔은 식어 반값 (그만큼 사람이 한꺼번에 우려 파는 것보다 조금 덜 벎) · 기르기 없음 · 하나만
const TEASTAND_KEEP = 2;
const helperKeep = st => shopOf(st).seats + TEASTAND_KEEP;
function helperTick(st, cal) {
  if (!teaShopOpen(cal) || !st.teas.length) return 0;
  const d = placedOf(st, 'teastand')[0]; if (!d) return 0;
  st.cups = st.cups || [];
  let warm = st.cups.filter(c => !cupCold(c, cal)).length, n = 0;
  while (warm < helperKeep(st) && st.teas.length) {
    const t = st.teas.shift();
    st.cups.push({ ...t, id: nid(st), kind: 'tea', brewAbs: cal.abs, auto: true });
    warm++; n++;
  }
  if (n) { d.n = (d.n || 0) + n; bump(st, 'autoBrew', n); st._helperBrew = (st._helperBrew || 0) + n; }
  return n;
}
// P39-08-02 4층(🌳 작은 숲)이 열리면 🐞 무당벌레 한 마리를 선물로 창고에 (예전 P30-02 숲 바람 · forestWeedTick은 없앰) — 이미 있으면 주지 않음
function ladybugGift(st, ctx) {
  if ((st.decos || []).some(d => d.key === 'ladybug')) return null;
  const d = addDeco(st, 'ladybug');
  addLog(st, 19, '🐞 숲에서 무당벌레가 왔어요 · 📦 창고에 있어요', ctx);
  return d;
}
// "자리를 비운 동안"(P25-01): 장치마다 한 줄로 합침 — 달마다 남긴 일지 줄은 빼고(isAutoLine) 이 줄만. 느긋하게 보기면 숫자 없이 (P28-02)
// P32-01 곤충 일꾼 이름 (10-30): 머리말이 바뀜 — 예전 저장의 일지 줄("자동 수확 바구니가 …")도 알아보게 [5] 옛 머리말 · P39 곤충 일 넷 · 나비 꽃잎 · 장치 둘 (옛 누에 · 나비 줄은 [5]로)
const AUTO_STATS = [['autoHarvest', '개미 일꾼', n => `이 꽃잎 ${n}장을 물어 왔어요`, '이 꽃잎을 물어 왔어요', 18, ['자동 수확 바구니']],
  ['autoPetal', '나비 일꾼', n => `이 다녀간 꽃에서 꽃잎 ${n}장을 더 거뒀어요`, '이 다녀간 꽃에서 꽃잎을 더 거뒀어요', 20, []],
  ['autoWater', '달팽이', n => `가 꽃 ${n}포기에 물을 줬어요`, '가 꽃에 물을 줬어요', 20, ['빗물 통']],
  ['autoWeed', '무당벌레', n => `가 꽃 ${n}포기의 잡초를 치웠어요`, '가 잡초를 치웠어요', 20, ['숲 바람']],
  ['autoFert', '지렁이', n => `가 꽃 ${n}포기의 흙을 기름지게 했어요`, '가 흙을 기름지게 했어요', 20, []],
  ['autoPrune', '누에 일꾼', n => `이 꽃 ${n}포기의 가지를 쳤어요`, '이 가지를 쳤어요', 20, []],
  ['autoBags', '건조 선반', n => `에서 꽃잎이 말라 티백 ${n}개가 됐어요`, '에서 꽃잎이 말라 티백이 됐어요', 12, ['자동 건조대']],
  ['autoBrew', '찻집 도우미', n => `가 찻잔 ${n}잔을 우렸어요`, '가 차를 우렸어요', 13, ['찻집 일손']],
  ['autoDry', '자동 건조기', n => `가 꽃잎 ${n}장을 꽃방에 널었어요`, '가 꽃잎을 꽃방에 널었어요', 12, []],   // P72-02
  ['autoPantry', '그동안 받은 것', n => ` ${n}개가 창고 · 광산 주머니 · 제다실로 들어왔어요`, '이 창고 · 광산 주머니 · 제다실로 들어왔어요', 12, []]];   // P90
// 옛 일지 줄 (P38까지 — 누에 말리기 · 나비 차 우리기): 머리말이 지금 곤충과 겹쳐 아이콘만 따로 (isAutoLine은 위 머리말로 알아봄)
const AUTO_OLD_LINES = [[/^누에 일꾼이 (꽃잎|말린)/, 12], [/^나비 일꾼이 찻잔/, 13]];
const autoStats = st => Object.fromEntries(AUTO_STATS.map(([k]) => [k, ((st.stats || {})[k]) || 0]));
const autoWho = text => AUTO_STATS.find(([, who, , , , old]) => text.startsWith(who) || old.some(o => text.startsWith(o)));
const isAutoLine = text => !!autoWho(text);
const autoLineType = text => { const o = AUTO_OLD_LINES.find(([re]) => re.test(text)); return o ? o[1] : (autoWho(text) || [])[4] || 18; };   // 일지 아이콘: 🧺 · 🍂 · ☕ · 🐝
function autoAwayLines(st, before) {
  const now = autoStats(st), b = before || {};
  return AUTO_STATS.filter(([k]) => now[k] > (b[k] || 0)).map(([k, who, many, plain]) => who + (slowView(st) ? plain : many(now[k] - (b[k] || 0))));
}
// P41 R-04 돌아왔을 때 한 창: 곤충이 한 일(autoAwayLines 줄 — 화면이 isAutoLine으로 골라 모음) 옆에 지금 꽃방에서 다 마른 꽃잎 (느긋하게 보기면 숫자 없이)
function awayHome(st) {
  const slow = slowView(st), dried = (st.dried || []).length, drying = (st.drying || []).length;
  return {
    dried: dried ? (slow ? '🍂 꽃방에 다 마른 꽃잎이 기다려요' : `🍂 꽃방에 다 마른 꽃잎 ${dried}장이 기다려요`) : null,
    drying: !dried && drying ? (slow ? '🌾 꽃방에서 꽃잎이 마르고 있어요' : `🌾 꽃방에서 꽃잎 ${drying}장이 마르고 있어요`) : null,
  };
}
// P65-01 🍯 꿀은 바로 📦 창고로 (11-03 사용자 확정): 달이 끝날 때 모인 꿀이 손으로 거두지 않아도 창고(st.honey — 예전 찻집 꿀 선반과 같은 칸)에 들어감
// 들어올 때 꿀 도감 · 올해 꿀 · 주간 목표(ev honey) · 등급 경험치(honey)를 셈 (예전 takeHoney가 하던 일). 상한: 창고 꿀이 hiveMax병(🐝 기르기 3 → 6 → 9병)이면 벌이 쉼 — 예전 "벌통엔 n병까지"를 창고 칸으로
const honeyLeft = st => Object.values(st.honey || {}).reduce((a, n) => a + (n > 0 ? n : 0), 0);
function honeyIn(st, list, ctx) {                 // 꿀 병(꿀 키 목록) → 창고 · 꿀 도감 · 올해 꿀 (주간 목표 · 경험치는 부르는 쪽)
  st.honey = st.honey || {}; st.dex.honey = st.dex.honey || {};
  for (const k of list) {
    st.honey[k] = (st.honey[k] || 0) + 1; seeYear(st, 'honey', k);
    if (!st.dex.honey[k]) { st.dex.honey[k] = true; addLog(st, 9, `도감에 등록: 🍯 ${honeyName(k)}`, ctx); }
  }
}
function hiveTick(st, ctx) {
  for (const d of st.decos || []) {
    if (d.key !== 'hive' || d.x == null) continue;
    const h = honeyOf(hiveBlooms(st, d)); if (!h) continue;
    const add = Math.min(h.jars, hiveMax(st) - honeyLeft(st)); if (add <= 0) continue;
    honeyIn(st, Array(add).fill(h.type), ctx);
    bump(st, 'autoHoney', add);   // P32-02 🐝 꿀벌이 한 일 (농장 카드)
    weekNote(st, 'honey', null, add, ctx); addXp(st, 'honey', add, ctx);   // P28-09 · P54 — 창고에 들어올 때 셈
    addLog(st, 14, `꿀벌이 ${honeyName(h.type)} ${add}병을 📦 창고에 넣었어요`, ctx);
  }
}
function takeHoney(st, id, ctx) {                 // 예전 벌통에 쌓인 꿀(d.honey)을 창고로 — P65-01부터 꿀은 바로 창고라 옮기기 전 저장만 (치우기 · 대표로 달기가 부름)
  const d = (st.decos || []).find(z => z.id === id && z.key === 'hive');
  if (!d || !(d.honey || []).length) return no('벌통에 꿀이 없어요 · 꿀은 바로 📦 창고에 들어가요');
  const n = d.honey.length;
  honeyIn(st, d.honey, ctx);
  d.honey = []; weekNote(st, 'honey', null, n, ctx); addXp(st, 'honey', n, ctx);   // P28-09 · P54
  return ok(`꿀 ${n}병을 📦 창고에 넣었어요`);
}
// P65-02 🍵 꿀차 (11-03 사용자 확정): 꿀 한 병 = 꿀차 한 잔 — 티백 없이 🫖 우리기 창에서 (brew의 honey). 찻잔 { kind: 'honey', type: 꿀 키, honey: 꿀 키 }
// 값 = 그 꽃 차 값(teaBase)의 HONEY_TEA_RATE 30% → 10원 단위 · 들꽃꿀은 찻값 500으로 셈 (라벤더 240 · 장미 300 · 연꽃 1,200 · 들꽃 150) · 품질 없음 — 11-03 사용자 확정 "그 꽃 차 값의 30% 정도" (근거 · 시뮬은 체크리스트 P65-02)
// 철 값(겨울 · 꽃잠) · 식으면 반 · 🍯 칭호 덤은 다른 찻잔과 같음. 손님 주문 "꿀 넣은 차 아무거나"도 들어줌(c.honey) · 도감 칸은 없음(93칸 그대로)
const HONEY_TEA_RATE = 0.3, HONEY_TEA_WILD = 500;
const honeyTeaName = k => k === 'wild' ? '들꽃 꿀차' : `${FLOWERS[k].name} 꿀차`;
const honeyTeaValue = k => Math.round((k === 'wild' ? HONEY_TEA_WILD : FLOWERS[k].teaBase) * HONEY_TEA_RATE / 10) * 10;
function honeyCup(st, cupId, k) {                  // 찻잔에 꿀 한 숟갈 (P18-07)
  const c = (st.cups || []).find(z => z.id === cupId);
  if (!c) return no('찻잔이 없어요');
  if (c.honey) return no('이미 꿀을 넣었어요');
  if (!HONEY_KEYS.includes(k) || !(st.honey && st.honey[k] > 0)) return no('그 꿀이 없어요');
  st.honey[k]--; c.honey = k;
  return ok(`${josa(honeyName(k), '을/를')} 한 숟갈 넣었어요 🍯`);
}
const honeyCount = st => Object.keys((st.dex && st.dex.honey) || {}).filter(k => HONEY_KEYS.includes(k)).length;
// ---------------------------------------------------------------- 🧺 정원 저장고 (P28-04, M2-7 10-28)
// P90 (11-06 사용자 "칸을 없애고 쌓일 것이 자동으로 들어오게"): 흐르는 시간 2시간마다 작은 것 하나가 창고 · 광산 주머니 · 제다실로 바로 들어옴. 꽃잠엔 멈춤(advance가 흐르는 달에만 부름)
// 한 번의 advance(자리를 비운 뒤 따라잡기 한 번)에서 받는 양은 상한(pantryCap)까지 — 예전에 칸이 차면 멈추던 것과 같은 양이라 경제가 늘지 않음
// 돈 고리 막기 (P17-14): 하루(12칸) 가치가 하루 용돈보다 작게(pantryDayValue). 🍂 떨어진 꽃잎은 아직 안 거둔 핀 꽃의 이달 수확을 바구니 1번으로 대신 거둠(품질 90%, 자동 수확 바구니와 같음)이라 새 돈이 아님
//   — 핀 꽃이나 바구니가 없으면 흙 (바구니 없이 거두면 돈이 모자란 정원에 공짜 수확이 됨: 시뮬에서 찾음)
// 상한은 정원 등급 표 하나로만 늘어남 (등급 보너스 체계 P28-05-02는 따로)
const PANTRY_H = 2;
const PANTRY_CYCLE = ['water', 'dirt', 'petal', 'dirt', 'quartz', 'fert', 'water', 'dirt', 'petal', 'water', 'dirt', 'quartz'];
// [정원 등급, 상한 칸] — 기본 4칸, 🌱 등급 장식이 들어오는 등급(5 · 10 · … · 30)마다 +3칸 (10-30 사용자 요청, 예전 1등급 4 · 10등급 5 · 20등급 6). 하루 12칸은 그대로라 하루 가치는 늘지 않음 — 덜 넘칠 뿐
const PANTRY_BASE = 4, PANTRY_PER_DECO = 3;
const PANTRY_CAPS = [[1, PANTRY_BASE], ...GRADE_DECO_KEYS.map((k, i) => [DECOS[k].grade, PANTRY_BASE + PANTRY_PER_DECO * (i + 1)])];
const PANTRY_ITEMS = {
  water: { ic: '💧', name: '물병', unit: '개', won: SUPPLIES.water.price, to: '창고' },
  fert: { ic: '🌱', name: '비료', unit: '개', won: SUPPLIES.fert.price, to: '창고' },
  dirt: { ic: '🟫', name: '흙', unit: '줌', won: Math.round(SUPPLIES.fert.price / CRAFTS.fert.need.dirt), to: '광산 주머니' },   // 흙 5 → 비료 1이라 비료 값의 1/5
  quartz: { ic: '💎', name: '석영 조각', unit: '개', won: 0, to: '광산 주머니' },   // 팔지 않고 꾸밈 · 찻잔 만들기에만 (돈이 늘지 않음)
  petal: { ic: '🍂', name: '떨어진 꽃잎', unit: '장', won: 0, to: '제다실' },        // 그 꽃의 이달 수확을 대신함 — 새 돈 아님
};
const PANTRY_KEYS = Object.keys(PANTRY_ITEMS);
const newPantry = () => ({ h: 0, n: 0, items: [], got: 0 });
const pantryOn = st => !!st.onboarded;            // 첫 안내를 마친 정원부터
const pantryOf = st => (st.pantry = st.pantry || newPantry());
const pantryCap = st => { const g = gradeOf(st).grade; let c = PANTRY_CAPS[0][1]; for (const [need, cap] of PANTRY_CAPS) if (g >= need) c = cap; return Math.floor(c * titlePerk(st, 'pantryCap') + 1e-9); };   // P52 🧺 세 철의 정원사 (내림)
const pantryH = st => PANTRY_H / titlePerk(st, 'pantrySpeed');   // P52 🧺 두 번째 봄   // P40-04 🧺 선반 넓히기는 없앰 — 등급으로 늘어나는 기본 상한만
// 하루(흐르는 24시간 = 12칸) 동안 쌓일 수 있는 것의 값 — 떨어진 꽃잎은 핀 꽃이 없을 때의 흙으로 셈 (가장 많은 쪽)
const pantryDayValue = () => { let v = 0; for (let i = 0; i < 24 / PANTRY_H; i++) { const k = PANTRY_CYCLE[i % PANTRY_CYCLE.length]; v += PANTRY_ITEMS[k === 'petal' ? 'dirt' : k].won; } return v; };
function pantryDrop(st, k, cal) {
  if (k !== 'petal') return { k };
  const f = st.flowers.find(z => !z.withered && z.origin !== '이웃' && canCare(st, z, 'harvest', cal));   // 이웃의 화분은 빼고 (첫 수확 2장 · 첫걸음은 손으로)
  if (!f || !(st.basket > 0)) return { k: 'dirt' };
  pickFlower(f, cal); st.basket--;   // 그 꽃의 수확을 저장고가 바구니로 대신함 · P72-01 다시 다 자람 → RIPE_H 뒤 다시 핌
  return { k, type: f.type, q: f.q * AUTO_Q, seasonKey: seasonKey(st, cal) };
}
// 하나를 받음 (P90 — 예전 takePantry가 하던 일): 창고 · 광산 주머니 · 제다실 · 도감 · 올해 꽃잎 · 경험치. 주간 목표에는 세지 않음 (장치처럼). 일지엔 남기지 않음 — 돌아왔을 때 창에 한 줄 (AUTO_STATS autoPantry)
function pantryGive(st, it, ctx) {
  const m = st.mine || (st.mine = newMine());
  if (it.k === 'water') st.water = (st.water || 0) + 1;
  else if (it.k === 'fert') st.fert += 1;
  else if (it.k === 'dirt' || it.k === 'quartz') {
    m.bag[it.k] = (m.bag[it.k] || 0) + 1;
    st.dex.mine = st.dex.mine || {};
    if (MINE_DEX_KEYS.includes(it.k) && !st.dex.mine[it.k]) { st.dex.mine[it.k] = true; addLog(st, 9, `도감에 등록: ⛏️ ${mineName(it.k)}`, ctx); }
  } else if (it.k === 'petal' && FLOWERS[it.type]) {
    st.petals.push({ id: nid(st), type: it.type, q: it.q, seasonKey: it.seasonKey, auto: true });
    if (!st.dex.petal[it.type]) { st.dex.petal[it.type] = true; addLog(st, 9, `도감에 등록: ${FLOWERS[it.type].name} 꽃잎`, ctx); }
    yearAdd(st, 'harvest', 1); addXp(st, 'harvest', 1, ctx);   // 거둔 꽃잎은 사람이 거둔 것과 같은 양
  } else return;
  pantryOf(st).got++; bump(st, 'autoPantry', 1);
}
function pantryTick(st, cal, dtH, room, ctx) {    // advance에서 흐르는 달에만 · room = 이번 advance에서 더 받을 수 있는 양 { n, got }
  if (!pantryOn(st)) return;
  const p = pantryOf(st);
  if (room.n <= 0) { p.h = 0; return; }           // 상한까지 받으면 그 뒤로 멈춤 (놓친 벌칙도 없음)
  p.h += dtH;
  const ph = pantryH(st);
  while (p.h >= ph - 1e-9 && room.n > 0) { p.h -= ph; pantryGive(st, pantryDrop(st, PANTRY_CYCLE[p.n % PANTRY_CYCLE.length], cal), ctx); p.n++; room.n--; room.got = true; }
  if (room.n <= 0) p.h = 0;
}
function pantryDone(st, room, ctx) {              // advance 끝: 받은 게 있으면 경험치 한 번 (P54 — 예전 거두기 한 번) · 떨어진 꽃잎도 바로 꽃방에 (P72-02)
  if (!room.got) return;
  addXp(st, 'pantry', 1, ctx);
  autoDryTick(st);
}
function storeDeco(st, id) {
  const d = (st.decos || []).find(z => z.id === id);
  if (!d) return no('거둘 장식이 없어요');
  if (d.key === 'pres') {                         // P84-01 🌹 창고 프리저브드로 돌아감 — 그대로 팔 수 있어요
    const name = decoInfo(decoKey(d)).name; st.decos.splice(st.decos.indexOf(d), 1);
    (st.preserved = st.preserved || []).push({ id: d.id, type: d.pres.type, mut: !!d.pres.mut });
    return ok(`${josa(name, '을/를')} 창고에 넣었어요 · 다시 놓거나 팔 수 있어요`);
  }
  const hn = (d.honey || []).length;
  if (hn) takeHoney(st, d.id);                   // 벌통에 모인 꿀은 함께 거둠 (QA 2회차)
  d.x = null; d.y = null;
  if (st.topDeco === id) st.topDeco = null;        // P52 창고에 넣으면 위 칸도 비움
  return ok(`${josa(decoInfo(decoKey(d)).name, '을/를')} 창고에 넣었어요${hn ? ` · 꿀 ${hn}병은 찻집 꿀 선반으로` : ''}`);
}

// ---------------------------------------------------------------- 🌟 등급 보너스 (P28-05-02, M3-1 10-29)
// P28-05-02-01 🌟 손길 점: 정원 등급이 오를 때마다 1점 (2등급 1점 · 3등급 2점 …, 끝없음 — 10-30 사용자 요청, 예전 5등급마다 1점). 등급 = 평생 경험치라 돈 · 아이템으로는 못 얻고 되풀이 꼼수도 없음
// P28-05-02-02 고르는 보너스 4칸: 시간 · 손만 덜어 줌 — 값 · 품질 · 꽃 수 · 생산 배율은 넣지 않음 (P17-14). 단계 값 1 · 2 · 3점 (한 칸을 끝까지 = 6점)
//   💧 물 오래(2달 → 3달)는 뺌 (10-29 시뮬): 물병을 덜 써서 목마른 꽃이 줄어 품질 · 수입이 올랐음 — 3달 +5~9%, 2.25달도 +3~7% (5씨앗 4년 찻집 수입)
// P28-05-02-03 언제든 올리고 내림 — 내리면 점이 그대로 돌아옴 (벌칙 없음, P07). 느긋하게 보기(P28-02) 숨김은 화면 몫 (E.slowView)
const BONUS_PER = 1;                              // 예전: 등급 1마다 꽃가루 1알 — P41부터 꽃가루는 없고 예전 저장 옮기기(pollenGot)만 셈
const BONUS_COST = [1, 2, 3];                    // 예전 4칸의 꽃가루 단계 값 (P38 옮기기만 읽음)
// P37 🌼 꽃가루 · 일꾼 기르기 (10-31): 엔진 키 · 저장은 그대로, 이름 · 말만 곤충농장 꼴로 + 🦋 나비 · 🐝 꿀벌 · 🐞 무당벌레 셋을 더함
//   worker = 곤충농장 카드(FARM key) — null이면 카드 아래 "🌼 그 밖에" 줄 · who = 알림에 쓰는 이름 · open = 기를 수 있는지(없으면 늘)
// P38 작게 시작 · P39-01 곤충 일곱 칸 모두 둘레 r = 1 → 2 → 3칸 (포기 · 장 수 제한은 없앰 — "개수보다 범위") · P40 🌼 그 밖에 🌱 자라는 · 🌾 말리는 속도 (가중치 표는 체크리스트 P37 ~ P40)
// P41 💰 꽃가루를 없애고 돈 + 등급으로 (10-31 사용자 확정): 단계마다 price(원) + 정원 등급 조건(곤충은 데려오는 등급 + up · 그 밖에는 need)
//   한 단계씩 사서 올림(사기 전 💰 살까요? 창은 화면) · 산 단계 아래로는 언제든 낮춰 쓰고 다시 올리면 공짜 — 돈은 안 돌려줌(사고팔기로 버는 길이 없게) · 저장 st.bonusOwn = { 칸: 산 단계 }
//   돈을 내고 사는 것이라 등급 경험치 · 주간 목표는 없음 (P17-14) · pollenCost = 예전 꽃가루 값 (곤충 칸만 — P38 옮기기 bonusCostTo만 읽음, 🌱 · 🌾 칸 것은 P64에서 뺌)
const INSECT_STEPS = { vals: [2, 4, 6], pollenCost: [2, 3], price: [10000, 25000], up: [2, 5] };   // P41-03 1단계: 데려오는 등급 + 2 · 10,000원 · 2단계: + 5 · 25,000원 · P61-01 둘레 2배 (11-03 사용자 확정): 1 → 2 → 3칸 → 2 → 4 → 6칸 (저장은 단계 번호라 예전 정원도 바로 새 칸 수)
// 🔄 P42에서 ×5 · 8단계로 넓힘 — 아래는 P41 때: P41 R-01 ×3까지 (×4 ~ ×10은 뺌 — 들른 김에 끝나 다시 올 이유가 줄어서): ×2 등급 10 · 25,000원 · ×3 등급 12 · 40,000원 (10-31 사용자 "값 낮추기" — 기획안 150,000 · 60,000원은 씨앗 품질 뒤 새 경제에서 4년 안에 못 모아서. 시뮬 --buy가 🌾 ×2를 2년차 · 🌱 ×2를 2 ~ 3년차에 사고 4년 순수익 −8% 안팎, 체크리스트 P41-08)
// 🔄 P42 (11-01 사용자 확정): ×1.5 → ×5, 0.5배씩 8단계 · 등급 3부터 2씩 · 10,000원부터 5,000원씩 (한 칸 모두 220,000원) — 예전 ×2 · ×3 단계는 같은 배수로 옮김(MIGRATIONS 49번째)
const SPEED_STEPS = { vals: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5], price: [10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000], need: [3, 5, 7, 9, 11, 13, 15, 17] };
const SPEED_V = 8;                                  // P42 st.speedSteps — 두 속도 칸 단계가 8단계 표로 옮겨졌는지 (옮기기를 여러 번 돌아도 한 번만)
const dryText = n => timeText(DRY_H / n);   // P46 꽃방이 다 마르는 현실 시간: 12시간 ÷ 말리는 빠르기 (예전 P40: 게임 15일 ÷ n)
const BONUS = {                                  // vals[단계] = 그 단계에서 규칙이 읽는 값 (0단계 = 사기 전) · price[i] · 등급 조건 = i+1단계를 살 때
  barrel: { worker: 'barrel', who: '🐌 달팽이', name: '둘레 넓히기', icon: '🐌', ...INSECT_STEPS, desc: v => INSECT_LINE.barrel(v) },          // P39-07 insectR
  basket: { worker: 'autobasket', who: '🐜 개미 일꾼', name: '둘레 넓히기', icon: '🐜', ...INSECT_STEPS, desc: v => INSECT_LINE.autobasket(v) },   // P39-02 insectR(autobasket)
  weed: { worker: 'ladybug', who: '🐞 무당벌레', name: '둘레 넓히기', icon: '🐞', ...INSECT_STEPS, desc: v => INSECT_LINE.ladybug(v) },          // P39-08
  worm: { worker: 'earthworm', who: '🪱 지렁이', name: '둘레 넓히기', icon: '🪱', ...INSECT_STEPS, desc: v => INSECT_LINE.earthworm(v) },          // P39-05
  rack: { worker: 'dryrack', who: '🐛 누에 일꾼', name: '둘레 넓히기', icon: '🐛', ...INSECT_STEPS, desc: v => INSECT_LINE.dryrack(v) },        // P39-04
  hive: { worker: 'hive', who: '🐝 꿀벌', name: '둘레 넓히기', icon: '🐝', ...INSECT_STEPS, vals: [{ r: 2, max: 3 }, { r: 4, max: 6 }, { r: 6, max: 9 }], desc: v => `${INSECT_LINE.hive(v.r)} · 창고 꿀 ${v.max}병까지` },   // P39-06 hiveR · hiveMax
  brew: { worker: 'teahelper', who: '🦋 나비 일꾼', name: '둘레 넓히기', icon: '🦋', ...INSECT_STEPS, desc: v => INSECT_LINE.teahelper(v) },   // P39-03
  grow: { worker: null, who: '🌱 자라는 속도', name: '자라는 속도', icon: '🌱', ...SPEED_STEPS, desc: v => v > 1 ? `꽃이 처음 피기까지 ×${v} 빨라요` : '꽃이 자라는 빠르기 그대로예요', short: v => `×${v}` },   // P40-01 growRate · P61-02 처음 피기까지 (bloomMonth)
  dry: { worker: null, who: '🌾 말리는 속도', name: '말리는 속도', icon: '🌾', ...SPEED_STEPS, desc: v => v > 1 ? `꽃잎이 ${dryText(1)} → ${dryText(v)} 만에 말라요` : `꽃잎이 ${dryText(1)} 만에 말라요`, short: v => `×${v}` },   // P40-02 dryRate
};
const BONUS_KEYS = Object.keys(BONUS);
for (const k of INSECT_KEYS) { const v = BONUS[INSECTS[k]].vals[0]; DECOS[k].desc = INSECT_LINE[k](typeof v === 'number' ? v : v.r); }   // P65-04 장식 카드 한 줄 = 기르기 전 둘레 (예전 "반나절마다 …")
const newBonus = () => Object.fromEntries(BONUS_KEYS.map(k => [k, 0]));
const bonusMax = k => BONUS[k].vals.length - 1;
const bonusLevel = (st, k) => clamp(Math.floor(+(((st && st.bonus) || {})[k]) || 0), 0, bonusMax(k));
const bonusVal = (st, k) => BONUS[k].vals[bonusLevel(st, k)];
const bonusCostTo = (lv, k) => ((k && BONUS[k]) ? BONUS[k].pollenCost : BONUS_COST).slice(0, lv).reduce((a, b) => a + b, 0);   // 예전 꽃가루 (P38 옮기기만)
const bonusOpen = (st, k) => !BONUS[k].open || BONUS[k].open(st);
const bonusPointsAt = g => Math.max(0, Math.floor((g - 1) / BONUS_PER));   // 예전: 그 등급까지 받은 꽃가루
const pollenExtra = st => Math.max(0, Math.floor(+((st && st.pollenExtra)) || 0));   // 예전 P40-03 🌼 꽃가루 늘리기로 더 받은 꽃가루 (저장 필드는 남김 — 옮기기만 읽음)
const pollenGot = st => bonusPointsAt(gradeOf(st).grade) + pollenExtra(st);   // P41-05 예전 정원이 받은 꽃가루 모두 (P38 · P39 덜어 준 bonusFree는 받은 적이 없어 셈에 없음)
const dryRate = st => bonusVal(st, 'dry');        // P40-02 꽃방이 마르는 빠르기 — leftH는 기본(1달) 시간으로 두고 걸음마다 dtH × 빠르기만큼 줄임 → 올린 순간부터 남은 시간이 빨라짐
const dryLeftH = (st, d) => Math.max(0, d.leftH) / dryRate(st);   // 꽃방 한 장이 다 마르기까지 남은 흐르는 시간 (화면)
const bonusOwned = (st, k) => Math.max(bonusLevel(st, k), clamp(Math.floor(+(((st && st.bonusOwn) || {})[k]) || 0), 0, bonusMax(k)));   // 산 단계 (단계만 있는 정원 — 시뮬 --bonus · 테스트 — 은 그 단계까지 산 것으로)
const bonusPrice = (k, lv) => BONUS[k].price[lv - 1];
const bonusNeed = (k, lv) => BONUS[k].worker ? (DECOS[BONUS[k].worker].need || 0) + BONUS[k].up[lv - 1] : BONUS[k].need[lv - 1];   // lv단계를 사는 정원 등급
const bonusHas = (st, k) => !BONUS[k].worker || (st.decos || []).some(d => d.key === BONUS[k].worker);   // 곤충은 데려와야 넓힘 (돈을 미리 쓰는 헷갈림 막기)
const bonusReach = v => typeof v === 'number' ? v : v.r;   // 곤충 칸 값 → 둘레 칸 수 (🐝은 { r, max }) — 화면 "둘레 n칸" (P61-01)
const bonusStepName = (k, lv) => { const B = BONUS[k], v = B.vals[lv]; return B.worker ? `${B.who} 둘레 ${bonusReach(v)}칸` : `${B.who} ×${v}`; };   // "🐌 달팽이 둘레 2칸" · "🌱 자라는 속도 ×2"
const xRo = v => `×${v}${v === 3 ? '으로' : '로'}`;   // ×1로 · ×1.5로(오) · ×2로 · ×3으로 · ×4로 · ×5로 — 받침은 3(삼)만
const bonusMaxed = (st, k) => !!BONUS[k] && bonusLevel(st, k) === bonusMax(k);   // P28-05-02-04 이정표: 끝까지 올린 칸은 장치 그림이 한 단계 바뀜 (그림은 M3-2)
const CATCHUP_WEEKS = 3;                          // P40-04 🌙 늦잠을 없앰 — 따라잡기는 예전 0단계 값(3주) 그대로
const catchUpH = st => CATCHUP_WEEKS * 7 * 24 * titlePerk(st, 'catchup');   // P52 ☁️ 구름 정원사 · 자리를 비운 동안 따라잡는 가장 긴 시간 (현실 시간)
function bonusSet(st, key, level) {
  if (!BONUS[key]) return no('없는 칸이에요');
  if (!Number.isInteger(level) || level < 0 || level > bonusMax(key)) return no('그 단계는 없어요');
  const B = BONUS[key], from = bonusLevel(st, key), own = bonusOwned(st, key), v = B.vals[level], n = typeof v === 'number' ? v : v.r;
  st.bonus = Object.assign(newBonus(), st.bonus);
  if (level === from) return ok(`${bonusStepName(key, level)} 그대로예요`, { level });
  if (level > own) {                              // P41-01-02 사서 올림 — 한 단계씩
    if (level > own + 1) return no('한 단계씩 살 수 있어요');
    if (!bonusHas(st, key)) return no(`${josa(B.who, '을/를')} 먼저 데려와요`);
    const need = bonusNeed(key, level), price = bonusPrice(key, level);
    if (gradeOf(st).grade < need) return no(`정원 등급 ${need}부터 살 수 있어요`);
    if (st.money < price) return no('돈이 모자라요');
    st.money -= price;
    st.bonusOwn = Object.assign({}, st.bonusOwn, { [key]: level });
    st.bonus[key] = level;
    return ok(B.worker ? `${B.who} 둘레가 ${n}칸으로 넓어졌어요` : `${B.who}가 ${xRo(v)} 빨라졌어요`, { level, paid: price });
  }
  st.bonusOwn = Object.assign({}, st.bonusOwn, { [key]: own });   // P41-01-03 산 단계 안: 공짜로 낮추고 다시 올림
  st.bonus[key] = level;
  if (level < from) return ok(B.worker ? `${B.who} 둘레를 ${n}칸으로 줄였어요` : `${B.who}를 ${xRo(v)} 낮췄어요`, { level });
  return ok(B.worker ? `${B.who} 둘레를 다시 ${n}칸으로 넓혔어요` : `${B.who}를 다시 ${xRo(v)} 올렸어요`, { level });
}
function bonusView(st) {                          // 🐝 곤충농장 곤충 카드 · 🌼 그 밖에 줄이 읽음 (P37 · P41) — 느긋하게 보기 판단은 넣지 않음 (사는 값은 늘 보임 · 숨김은 화면 몫)
  const grade = gradeOf(st).grade, money = st.money || 0;
  const rows = BONUS_KEYS.map(key => {
    const B = BONUS[key], level = bonusLevel(st, key), max = bonusMax(key), own = bonusOwned(st, key), buyLv = own < max ? own + 1 : null;
    const need = buyLv ? bonusNeed(key, buyLv) : null, price = buyLv ? bonusPrice(key, buyLv) : null, has = bonusHas(st, key);
    return { key, worker: B.worker, who: B.who, name: B.name, icon: B.icon, level, max, own, reach: B.worker ? bonusReach(B.vals[level]) : null, ownReach: B.worker ? bonusReach(B.vals[own]) : null, val: B.short ? B.short(B.vals[level]) : null, ownVal: B.short ? B.short(B.vals[own]) : null,
      maxed: level === max, open: bonusOpen(st, key), lock: B.lock || null, desc: B.desc(B.vals[level]),
      buyLv, buyVal: buyLv && B.short ? B.short(B.vals[buyLv]) : null, buyDesc: buyLv ? B.desc(B.vals[buyLv]) : null, buyName: buyLv ? bonusStepName(key, buyLv) : null,
      price, need, has, gradeOk: !!buyLv && grade >= need, moneyOk: !!buyLv && money >= price, canBuy: !!buyLv && has && grade >= need && money >= price };
  });
  return { rows, grade };
}
// P41 등급이 오르며 새로 살 수 있게 된 다음 단계 (등급 오름 알림 · 곤충은 데려온 것만): ["🐌 달팽이 둘레 2칸", "🌱 자라는 속도 ×2"]
function bonusOpenedAt(st, from, to) {
  return BONUS_KEYS.filter(k => { const lv = bonusOwned(st, k) + 1; return lv <= bonusMax(k) && bonusHas(st, k) && bonusNeed(k, lv) > from && bonusNeed(k, lv) <= to; }).map(k => bonusStepName(k, bonusOwned(st, k) + 1));
}
// ---------------------------------------------------------------- 🌱 씨앗 처음 품질 (P41 R-05, 10-31 사용자 확정 — 꽃가루 대신 등급마다 받는 것)
// 💐 화원에서 산 것 · 🗓️ 예약이 도착한 것의 처음 품질 = 50% + 정원 등급마다 2% (1등급 50% · 10등급 68% · 26등급부터 100%). 이미 창고에 있는 것은 그대로 ·
// 번식 · 채종은 부모 품질에서 · 🪴 그 달의 장식(P35 최소 90%) · 「한 포기의 기적」 조건은 그대로 · 답례품 · 편지 선물은 그대로 100%
const SEED_Q0 = 0.5, SEED_Q_STEP = 0.02;
const seedQAt = g => Math.min(1, Math.round((SEED_Q0 + SEED_Q_STEP * (Math.max(1, g) - 1)) * 100) / 100);
const seedQ = st => Math.min(1, Math.round((seedQAt(gradeOf(st).grade) + (placedOf(st, 'oldpot').length ? OLDPOT_Q : 0)) * 100) / 100);   // P44-04 🌰 옛 씨앗 화분을 놓으면 +5% (여러 개여도 한 번)

// ---------------------------------------------------------------- 🐝 곤충농장 (P32-02, 10-30)
// 자동 장치를 곤충 일꾼으로 한곳에 — 화면(app-farm)은 farmOf만 읽음. 장식 키 · 값 · 규칙 · 저장은 그대로, 이름 · 말만 (P32-01)
// 일꾼은 사람이 하던 손을 덜 뿐 수입 배율 없음 (P17-14) · 켜 두지 않아도 일함 · 🐢 느긋하게 보기면 숫자 없이 (P28-02)
// P39 곤충 일곱 (10-31): 데려오는 차례(P39-10) — 물 · 잡초(매일 손이 가는 것)부터, 품질(비료 · 가지치기) · 꽃잎(나비)은 뒤로. key = 장식 키 · stat = 한 일 셈 · work = 맡은 일 (둘레 꽃 n포기) · slow = 🐢 느긋하게 보기 말
const FARM = [
  { key: 'barrel', icon: '🐌', name: '달팽이', stat: 'autoWater', did: n => `꽃 ${n}포기에 물`, work: n => `꽃 ${n}포기에 물`, slow: '둘레 꽃의 흙이 촉촉해요', lines: ['빗물을 아껴 두었다가 나눠 줘요', '천천히 가도 다 닿아요', '촉촉한 흙이 좋아요'] },
  { key: 'autobasket', icon: '🐜', name: '개미 일꾼', stat: 'autoHarvest', did: n => `꽃잎 ${n}장`, work: n => `핀 꽃 ${n}포기 거두기`, slow: '둘레에 핀 꽃의 꽃잎을 물어 와요', lines: ['꽃잎은 영차영차 줄 맞춰 날라요', '오늘도 꽃 냄새가 좋아요', '무거운 꽃잎은 둘이서 들어요'] },
  { key: 'ladybug', icon: '🐞', name: '무당벌레', stat: 'autoWeed', did: n => `꽃 ${n}포기 잡초`, work: n => `꽃 ${n}포기의 잡초`, slow: '둘레 꽃에 잡초가 없어요', lines: ['잡초는 제가 맡을게요', '풀잎 사이를 살살 다녀요', '점 일곱 개, 오늘도 반짝'] },
  { key: 'earthworm', icon: '🪱', name: '지렁이', stat: 'autoFert', did: n => `꽃 ${n}포기에 비료`, work: n => `꽃 ${n}포기에 비료`, slow: '둘레 꽃의 흙이 기름져요', lines: ['흙 속은 따뜻하고 포근해요', '꼬물꼬물, 흙을 부드럽게 해요', '비 온 뒤가 제일 좋아요'] },
  { key: 'dryrack', icon: '🐛', name: '누에 일꾼', stat: 'autoPrune', did: n => `꽃 ${n}포기 가지치기`, work: n => `꽃 ${n}포기 가지치기`, slow: '둘레 꽃의 가지가 가뿐해요', lines: ['웃자란 잎은 제가 조금 먹을게요', '사각사각, 가지가 가벼워졌어요', '천천히 해도 늦지 않아요'] },
  { key: 'hive', icon: '🐝', name: '꿀벌', stat: 'autoHoney', did: n => `꿀 ${n}병`, work: n => `꽃 ${n}포기 번식 돕기 · 핀 꽃에서 꿀`, slow: '둘레 꽃의 씨앗이 튼튼해요', lines: ['붕붕, 꽃가루 한 바구니 담았어요', '꽃이 많을수록 꿀이 달아요', '씨앗도 튼튼하게 여물어요'] },
  { key: 'teahelper', icon: '🦋', name: '나비 일꾼', stat: 'autoPetal', did: n => `꽃잎 ${n}장 더`, work: n => `꽃 ${n}포기의 첫 꽃잎 +1`, slow: '둘레 꽃에 가끔 꽃잎이 한 장 더 맺혀요', lines: ['꽃가루를 살짝 옮겨 줬어요', '팔랑팔랑, 꽃마다 인사해요', '첫 꽃잎은 두 장이 될 거예요'] },
];
const FARM_KEYS = FARM.map(w => w.key), FARM_STATS = FARM.map(w => w.stat);
const farmCounts = st => Object.fromEntries(FARM_STATS.map(k => [k, ((st.stats || {})[k]) || 0]));
// 저장 st.farm = { mark: 지난 달 끝의 셈, last: { abs: 끝난 달, d: 일꾼마다 한 일 } } (없으면 null — 새 철에도 이어짐, SEASON_KEEP)
// 달이 바뀔 때마다(advance 달 끝): 지난 한 달 일꾼마다 한 일 = 지금 셈 − 지난 표시. 새 정원은 표시가 없으면 0부터 (예전 정원은 MIGRATIONS 42번째가 표시를 둠)
function farmMark(st, ended) {
  const now = farmCounts(st), was = (st.farm && st.farm.mark) || {};
  st.farm = { mark: now, last: { abs: ended.abs, d: Object.fromEntries(FARM_STATS.map(k => [k, Math.max(0, now[k] - (was[k] || 0))])) } };
}
// 바로 앞 달에 한 일 (그 뒤 달이 또 바뀌었으면 없음) — forestWeedOf와 같은 꼴
const farmLastOf = st => { const L = st.farm && st.farm.last; return L && L.abs === calendar(st.virtual).abs - 1 ? L.d : null; };
// 말 한 줄: 일꾼마다 3개 중 정원 이름표 · 달로 고름 (Math.random 없음 — 같은 달엔 같은 말)
const farmLine = (st, w, cal) => w.lines[hashStr(`${st.gardenId || 'g'}|farm|${w.key}|${cal.abs}`) % w.lines.length];
// P39-12-01 맡은 일 한 줄: "둘레 1칸 · 꽃 6포기에 비료" (숫자 있음 — 느긋하게 보기면 w.slow). 여럿 놓였으면 둘레 꽃을 겹치지 않게 셈
function farmWork(st, w, placed) {
  const set = new Set(); for (const d of placed) for (const f of insectFlowers(st, d)) set.add(f);
  const n = [...set].filter(f => (w.key !== 'autobasket' || !f.mut) && (w.key !== 'dryrack' || FLOWERS[f.type].prune)).length;
  return `둘레 ${insectR(st, w.key)}칸 · ${w.work(n)}`;
}
function farmWorker(st, w, cal, grade, last) {
  const slow = slowView(st), line = farmLine(st, w, cal), n = last ? last[w.stat] || 0 : 0;
  const D = DECOS[w.key], mine = (st.decos || []).filter(d => d.key === w.key), placed = mine.filter(d => d.x != null), stored = mine.filter(d => d.x == null);
  const gradeOk = !D.need || grade >= D.need, canBuy = gradeOk && !(D.one && mine.length);   // P39-10 언제든 · 한 종류에 하나 (이미 여럿 가진 정원은 그대로)
  return {
    key: w.key, icon: w.icon, name: w.name, line, did: slow ? null : n, didText: n && !slow ? w.did(n) : null, worked: n > 0,
    deco: D.name, desc: insectLine(st, w.key), need: D.need || 0, price: D.price, one: !!D.one, canBuy, r: insectR(st, w.key),
    when: slow ? '정원이 더 자라면 와요' : `정원 등급 ${D.need}부터 와요`,
    state: placed.length ? 'placed' : stored.length ? 'stored' : canBuy ? 'shop' : 'locked',
    placed: placed.map(d => ({ id: d.id, x: d.x, y: d.y })), storedId: stored.length ? stored[0].id : null, stored: stored.length,
    work: placed.length ? (slow ? w.slow : farmWork(st, w, placed)) : null,
    short: placed.length ? insectShort(st, w.key) : null,   // P77-B 용품이 없어 쉴 까닭
    supply: INSECT_SUPPLY[w.key] ? { kind: INSECT_SUPPLY[w.key], name: SUPPLIES[INSECT_SUPPLY[w.key]].name, left: st[INSECT_SUPPLY[w.key]] || 0, unit: SUPPLIES[INSECT_SUPPLY[w.key]].unit } : null,   // P77-B 쓰는 용품 · 남은 수
  };
}
// 🐝 곤충농장 한 화면: 곤충 7 (P39) · 🧺 저장고 · 🌼 꽃가루 기르기(P37 — bonus.rows의 worker로 카드에 붙임) · 🌙 따라잡기 — 저장고 · 손길 점은 원래 것을 그대로 (화원 · 창고 · 도감일지에서도 됨)
function farmOf(st) {
  const cal = calendar(st.virtual), grade = gradeOf(st).grade, slow = slowView(st), last = farmLastOf(st);
  const workers = FARM.map(w => farmWorker(st, w, cal, grade, last));
  const busy = workers.filter(w => w.worked), home = workers.filter(w => w.state === 'placed').length;
  const month = !home ? '아직 일하는 곤충이 없어요 · 아래 카드에서 데려와요'
    : !busy.length ? (cal.frozen ? '🌙 꽃잠엔 곤충도 쉬어요' : `곤충들이 ${timeText((cal.slotEnd - st.virtual) / HOUR / (st.speed || 1))} 뒤에 일해요`)
    : slow ? '지난달에도 곤충들이 부지런히 일했어요' : `지난달 곤충들이 ${busy.map(w => `${w.icon} ${w.didText}`).join(' · ')}`;
  const a = st.awayLast;
  return { workers, home, month, bonus: bonusView(st), catchup: { weeks: slow ? null : CATCHUP_WEEKS, last: a ? { h: slow ? null : a.h, n: a.lines.length } : null }, slow };
}
// 지난번 "자리를 비운 동안" 한 장을 저장 (P32-02): 화면 awayDiff 결과 중 줄 · 돈 · 시간 · 🍃 그동안 글만, 줄은 최근 50줄 — 다시 보기는 농장 탭
const AWAY_LAST_MAX = 50;
function awayKeep(st, a, real) {
  if (!a) return null;
  st.awayLast = { at: real, h: a.h, money: a.money || 0, lines: (a.lines || []).slice(-AWAY_LAST_MAX).map(l => ({ type: l.type, text: l.text })), long: a.long || null };
  return st.awayLast;
}
