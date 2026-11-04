// 도리의 정원 — 게임 규칙 엔진 조각 3/10: 📈 해마다 기록 · 그래프 · 🌱 정원 등급 · 🗓️ 주간 목표
// P66(11-03): 예전 한 파일 engine.js(줄 598 ~ 886)를 구역 순서 그대로 옮김. 엔진 조각 · 화면 파일은 모두 같은 전역 이름 공간을 써요 — 차례는 engine.js의 ENGINE_PARTS(index.html도 같은 차례)
// 불릴 때 바로 실행되는 최상위 코드(표 만들기 등)는 앞 조각 이름만 쓸 수 있어요. 함수 몸 안에서는 뒤 조각 이름도 돼요(부를 때 찾음). 화면과 분리 — DOM을 쓰지 않아요
'use strict';
// ---------------------------------------------------------------- 📈 해마다 기록 (P28-07-01, 10-27)
// 쉼달 기록 때 그해 한 줄: 판매 수입(원) · 판 잔 수 · 거둔 꽃잎 · 들어준 주문 · 정원 점수 · 등급(M1-3에서 채움) · 도감. 기록과 기록 사이(꽃잠 + 새해)를 한 해로 셈 — 주문 · 선물 점수와 같은 기준
// 용돈 · 막힘 방지 돈은 수입에 넣지 않음 (번 돈만). 그래프(M1-5) · 등급(M1-3)은 yearLogOf만 읽음
const newYearNow = () => ({ income: 0, sold: 0, harvest: 0 });
function yearAdd(st, k, n) { const y = st.yearNow = st.yearNow || newYearNow(); y[k] = (y[k] || 0) + n; }
function yearRow(st, rec, sc) {
  const y = st.yearNow || newYearNow();
  const row = { year: rec.year, season: rec.season || seasonN(st), income: y.income, sold: y.sold, harvest: y.harvest, orders: sc.parts.orders / 5, score: sc.total, grade: gradeOf(st).grade, dex: rec.dex, dexTotal: rec.dexTotal };   // season: P28-08-04 철 구분 (해 번호는 철마다 1부터)
  if (y.part) row.part = true;   // 업데이트한 해: 업데이트 전 판매 · 수확은 못 셈
  return row;
}
const rowSeason = r => r.season || 1;
function addYearLog(st, row) {   // 같은 철 같은 해는 한 줄만 (나중 것으로), 철 · 해 순서대로
  st.yearLog = (st.yearLog || []).filter(r => !(r.year === row.year && rowSeason(r) === rowSeason(row)));
  st.yearLog.push(row);
  st.yearLog.sort((a, b) => rowSeason(a) - rowSeason(b) || a.year - b.year);
}
const yearLogOf = st => (st.yearLog || []).map(r => Object.assign({}, r));

// ---------------------------------------------------------------- 📈 해마다 그래프 (P28-07-02, 10-28)
// 화면(도감 "해마다" 쪽 · 한 해 기록 카드)은 아래 함수만 읽음. 느긋하게 보기면 숫자 · 견줌은 화면이 숨김 (P28-02)
// 한 해 = 쉼달(idx 12)부터 다음 쉼달까지 → 그해 몇째 달인지 0(쉼달) ~ 13(2월)
const yearMonth = cal => (cal.idx + 2) % 14;
// yearPace = { xp0: 올해 시작할 때 경험치(null이면 올해는 모름), now: [달마다 끝날 때 [수입, 경험치]], last: 지난해 것, lastYear }
const newYearPace = xp0 => ({ xp0, now: [], last: null, lastYear: null });
function paceMark(st, cal) {   // 달이 바뀔 때: 끝난 달(그해 몇째 달)까지 쌓인 값. 업데이트한 해의 수입은 모름(null)
  const p = st.yearPace; if (!p || p.xp0 == null) return;
  const y = st.yearNow || newYearNow(), ended = (yearMonth(cal) + 13) % 14;
  p.now = p.now || [];
  while (p.now.length < ended) p.now.push(null);
  p.now[ended] = [y.part ? null : y.income, ((st.grade && st.grade.xp) || 0) - p.xp0];
}
// 축: 0부터, 눈금 ticks칸이 1 · 2 · 2.5 · 5 × 10ⁿ 간격으로 가장 큰 값을 덮게. 값이 없거나 모두 0이면 top 0 (빈 축)
function graphAxis(values, ticks) {
  const n = ticks || 4, vs = (values || []).filter(v => typeof v === 'number' && isFinite(v) && v > 0), max = vs.length ? Math.max(...vs) : 0;
  if (!max) return { top: 0, step: 0, ticks: [0] };
  const raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
  const step = Math.max(1, (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag);   // 정수 값(점수 · 잔 · 원)이라 1보다 작게 자르지 않음
  const top = step * Math.ceil(max / step - 1e-9), out = [];
  for (let v = 0; v <= top + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return { top, step, ticks: out };
}
// 그래프에 보일 해: 해가 많으면 n해(기본 10)씩. end = 보일 마지막 해의 자리(없으면 가장 최근). 0~1해면 empty
function graphYears(st, n, end) {
  const all = yearLogOf(st), size = n || 10, total = all.length;
  const last = end == null ? total - 1 : Math.max(Math.min(size, total) - 1, Math.min(total - 1, end));
  const from = Math.max(0, last - size + 1);
  return { rows: all.slice(from, last + 1), from, end: last, total, prev: from > 0, next: last < total - 1, empty: total < 2 };
}
// 지난해와 견줌: 수입은 %(지난해가 0 · 모름 · 일부만이면 null), 점수 · 등급은 차이
function yearDiff(cur, prev) {
  if (!cur || !prev) return null;
  const ok = v => typeof v === 'number';
  const income = ok(cur.income) && ok(prev.income) && prev.income > 0 && !cur.part && !prev.part ? Math.round((cur.income - prev.income) / prev.income * 100) : null;
  const score = ok(cur.score) && ok(prev.score) ? cur.score - prev.score : null;
  const grade = ok(cur.grade) && ok(prev.grade) ? cur.grade - prev.grade : null;
  return income == null && score == null && grade == null ? null : { year: cur.year, prevYear: prev.year, income, score, grade };
}
// 그해 기록 줄의 바로 앞 해와 견줌 (해가 비면 견주지 않음)
// P28-08-04 철을 넘어서는 견주지 않음 (season을 안 주면 지금 철)
const yearDiffOf = (st, year, season) => { const n = season || seasonN(st), all = yearLogOf(st), i = all.findIndex(r => r.year === year && rowSeason(r) === n); return i > 0 && all[i - 1].year === year - 1 && rowSeason(all[i - 1]) === n ? yearDiff(all[i], all[i - 1]) : null; };
// 올해 지금까지 vs 지난해 같은 때 (05-6 "어제보다 큰 숫자"): 지난해 같은 달 안 같은 자리까지를 달 끝 값 사이로 어림. 모르면 그 칸은 null, 둘 다 없으면 null
function yearPace(st, cal) {
  const p = st.yearPace, c = cal || calendar(st.virtual);
  if (!p || p.xp0 == null || !p.last || p.lastYear !== propYearOf(st, c) - 1) return null;
  const m = yearMonth(c), f = clamp((c.yh - c.idx * SLOT_H) / SLOT_H, 0, 1);
  const a = m === 0 ? [0, 0] : p.last[m - 1], b = p.last[m];
  const at = i => a && b && a[i] != null && b[i] != null ? Math.round(a[i] + (b[i] - a[i]) * f) : null;
  const y = st.yearNow || newYearNow(), nowIncome = y.part ? null : y.income || 0, nowXp = ((st.grade && st.grade.xp) || 0) - p.xp0;
  const pair = (now, then) => now == null || then == null ? null : { now, then, diff: now - then };
  const income = pair(nowIncome, at(0)), xp = pair(nowXp, at(1));
  return income || xp ? { year: propYearOf(st, c), month: m, income, xp } : null;
}

// ---------------------------------------------------------------- 🌱 정원 등급 (P28-05-01, 10-27)
// 정원에서 한 일로 경험치가 쌓이고 등급이 오름 — 처음엔 빨리, 뒤로 갈수록 천천히, 끝이 없음. 돈을 주고 사는 것(씨앗 · 용품 · 장식 · 찻집 가꾸기 · 선물)만으로는 오르지 않음 (P17-14)
// 느긋하게 보기(P28-02)여도 똑같이 쌓임 — 숨김은 화면 몫. 등급 보너스는 M3(P28-05-02)
// P54 (11-01 사용자 "정원 등급 경험치를 모든 활동에서"): 돌보기 · 꽃밭 · 찻집 · 광산 · 곤충 · 수집에서도 쌓임 — 하루 상한 없음, 앞의 일곱 값은 그대로(쌓인 경험치와 어긋나지 않게)
//   끝수(물 한 번 0.2 등)는 g.frac에 모아 다음에. 돈을 내고 사기만 하는 것(씨앗 · 용품 · 장식 · 공방 사기 · 기르기 · 선물 · 찻집 가꾸기)과 같은 일을 끝없이 되풀이할 수 있는 것(장식 놓기 · 우리기)은 세지 않음
//   🌳 숲 나무는 묘목을 사면 바로 심기는 것(돈만 나감)이라 세지 않음 (forest 테스트 P17-14 그대로)
//   곤충 · 장치가 대신 한 돌보기(물 · 잡초 · 가지치기 · 비료)도 세지 않음 — 돈으로 데려온 일꾼이 경험치를 벌면 돈 → 경험치가 되어서. 🐜 거둔 꽃잎은 예전처럼 셈(값 그대로, 묶음만 🐝 곤충으로)
const XP = {
  harvest: 2, sell: 2, order: 15, quest: 10, dex: 5, year: 1, weekly: 1,   // 꽃잎 한 장 · 판 잔 하나 · 주문 · 퀘스트 · 도감 새 칸 · 한 해 평가 점수 1점 · 주간 목표(P28-09) 1점
  water: 0.2, weed: 0.2, prune: 0.2, fert: 0.2,                             // P54 돌보기 한 포기마다
  plant: 1, move: 1, prop: 2,                                                // P54 심기(싹이 튼 것) · 옮겨심기(꽃마다 정원 달에 한 번) · 번식 한 번
  dry: 1, teabag: 1, blend: 3,                                               // P54 꽃방에 넌 꽃잎 한 장 · 티백 하나 · 블렌드 한 잔
  dig: 0.1, descend: 2, craft: 2,                                            // P54 ⛏️ 한 칸 · 한 층 · 재료로 만들기 한 번
  bug: 2, honey: 1, pantry: 1,                                               // P54 🐜 곤충이 거둔 꽃잎 한 장(예전 harvest와 같은 값) · 🍯 꿀 한 병 · 🧺 저장고 거두기 한 번
  bugCare: 0.2,                                                              // P54-02 🐌🐞🪱🐛 곤충이 돌본 꽃 한 포기 (손 돌보기와 같은 값 · 묶음은 🐝 곤충)
  jar: 5, pres: 5, presSell: 2,                                              // P54 🫙 유리 관에 담기 · 🌹 프리저브드 만들기 · 팔기 한 개
};
const GRADE_TIERS = ['씨앗', '새싹', '꽃봉오리', '꽃', '열매', '나무', '숲'];        // 5등급마다 다음 이름, 숲 정원은 끝없이 (숲 정원 1, 2, …)
const gradeCost = g => 40 + 10 * Math.min(g - 1, 19) + 3 * Math.max(0, g - 20);   // g등급 → g+1등급에 드는 경험치 (20등급부터는 조금씩만 늘어 끝없이 오름)
const gradeName = g => { const t = Math.min(GRADE_TIERS.length - 1, Math.floor((g - 1) / 5)); return `${GRADE_TIERS[t]} 정원 ${g - t * 5}`; };
const newGrade = () => ({ xp: 0, dex: null, by: {} });   // dex: 경험치로 센 도감 칸 수 (null이면 다음 확인 때 지금 수로 맞춤)
function gradeAt(xp) {
  let g = 1, base = 0;
  while (xp >= base + gradeCost(g)) { base += gradeCost(g); g++; }
  return { grade: g, base, cost: gradeCost(g) };
}
function gradeOf(st) {
  const xp = (st && st.grade && st.grade.xp) || 0, a = gradeAt(xp);
  return { grade: a.grade, name: gradeName(a.grade), xp, next: a.base + a.cost, progress: (xp - a.base) / a.cost };
}
// 등급 경험치로 세는 도감 칸: 도감 93칸에서 씨앗 · 묘목(사기만 해도 생김)은 빼고 + 꿀 · 광산. 기념품은 주문으로, 편지 · 장식은 돈으로 생겨서 뺌
const gradeDexCount = st => dexCount(st) - n0(st.dex.form) + n0(st.dex.honey) + n0(st.dex.mine);
function addXp(st, kind, n, ctx, extra) {
  if (!XP[kind] || !(n > 0)) return { xp: 0, up: 0 };
  const g = st.grade = st.grade || newGrade(), before = gradeAt(g.xp).grade, mul = (extra || 1) * titlePerk(st, 'xp:' + kind) * titlePerk(st, 'xp');   // P52 칭호 경험치 효과
  let add = Math.round(XP[kind] * n);
  if (mul !== 1 || Math.abs(XP[kind] * n - add) > 1e-9) { const raw = XP[kind] * n * mul + (g.frac || 0); add = Math.floor(raw + 1e-9); g.frac = Math.max(0, raw - add); }   // 덤의 끝수는 g.frac에 모아 다음에 (한 잔 2 × 1.1도 쌓이게)
  g.xp += add; g.by[kind] = (g.by[kind] || 0) + add;
  const after = gradeAt(g.xp).grade;
  if (after > before) {
    const name = gradeName(after), unlock = GRADE_DECO_KEYS.filter(k => DECOS[k].grade > before && DECOS[k].grade <= after);
    if (!slowView(st)) addLog(st, 9, gradeUpText(name));   // 알림은 화면이 onGrade로 (M1-4), 느긋하게 보기면 일지에도 숫자를 남기지 않음 (P28-02)
    for (const k of unlock) addLog(st, 9, gradeUnlockText(k));   // 등급 장식이 화원에 — 숫자가 없어 느긋하게 보기여도 남김 (M1-4)
    if (!slowView(st)) {                          // P41 씨앗 처음 품질 · 새로 살 수 있는 단계 — 알림이 "새 소식 n개"로 묶여도 일지에서 보게 (숫자라 느긋하게 보기면 없음)
      const q = seedQAt(after), open = bonusOpenedAt(st, before, after);
      if (q > seedQAt(before)) addLog(st, 9, seedUpText(q));
      if (open.length) addLog(st, 9, bonusOpenText(open));
    }
    if (ctx && ctx.onGrade) ctx.onGrade({ from: before, grade: after, name, unlock });
  }
  return { xp: add, up: after - before };
}
function gradeDexSync(st, ctx) {   // advance 끝에: 늘어난 도감 칸만큼
  const g = st.grade = st.grade || newGrade(), c = gradeDexCount(st);
  if (g.dex == null || c < g.dex) { g.dex = c; return; }
  if (c > g.dex) { const d = c - g.dex; g.dex = c; addXp(st, 'dex', d, ctx); }
}
const yearXpOf = sc => Math.max(0, sc.total - (sc.parts.decos || 0) - (sc.parts.gifts || 0));   // 한 해 평가 점수에서 장식 · 선물 몫(돈으로 사는 것)은 뺌
// 🌱 등급 화면 (P28-05-01, M1-4 10-28): 화면은 이것만 읽음. 숨길지는 slowView 하나 — 경험치 · 등급 · 장식은 그대로
const gradeUpText = name => `🌱 정원 등급이 올랐어요 · ${name}`;
const gradeUnlockText = ks => { const names = [].concat(ks).map(k => DECOS[k].name); return `🪴 화원에 ${names.slice(0, -1).map(x => x + ' · ').join('')}${josa(names[names.length - 1], '이/가')} 들어왔어요`; };   // 하나 또는 여럿 (한 줄로)
// [종류, 그림, 이름, 묶음] — 앞의 일곱은 예전 줄(P28-05-01 · P28-09), 뒤는 P54. 묶음은 GRADE_GROUPS (도감일지 등급 칸의 활동별 표)
const GRADE_BY = [['harvest', '🧺', '거두기', 'garden'], ['sell', '💰', '팔기', 'tea'], ['order', '💌', '주문', 'tea'], ['quest', '📜', '퀘스트', 'goal'], ['dex', '📖', '도감', 'collect'], ['year', '🏅', '한 해 평가', 'goal'], ['weekly', '🗓️', '주간 목표', 'goal'],
  ['water', '💧', '물 주기', 'care'], ['weed', '🌿', '잡초 뽑기', 'care'], ['prune', '✂️', '가지치기', 'care'], ['fert', '🌱', '비료', 'care'],
  ['plant', '🪴', '심기', 'garden'], ['move', '🔁', '옮겨심기', 'garden'], ['prop', '🌼', '번식', 'garden'],
  ['dry', '🍂', '말리기', 'tea'], ['teabag', '🍵', '티백', 'tea'], ['blend', '🫖', '블렌드', 'tea'],
  ['dig', '⛏️', '파기', 'mine'], ['descend', '🪜', '내려가기', 'mine'], ['craft', '🔨', '만들기', 'mine'],
  ['bug', '🐜', '곤충이 거둔 꽃잎', 'bug'], ['honey', '🍯', '꿀', 'bug'], ['pantry', '📦', '저장고', 'bug'], ['bugCare', '🐞', '곤충 돌보기', 'bug'],
  ['jar', '🫙', '유리 관', 'collect'], ['pres', '🌹', '프리저브드', 'collect'], ['presSell', '💐', '프리저브드 팔기', 'collect']];
const GRADE_GROUPS = [['care', '💧', '돌보기'], ['garden', '🌸', '꽃밭'], ['tea', '🍵', '찻집'], ['mine', '⛏️', '광산'], ['bug', '🐝', '곤충'], ['collect', '📖', '수집'], ['goal', '🏅', '목표']];   // P54
const gradeXpAt = g => { let x = 0; for (let i = 1; i < g; i++) x += gradeCost(i); return x; };   // g등급이 되는 누적 경험치
function gradeView(st) {   // 도감 등급 쪽: 지금 등급 · 남은 양 · 어디서 왔는지 · 등급 장식 (느긋하게 보기면 slow: true → 숫자를 줄여 보여 줌)
  const g = gradeOf(st), by = (st.grade && st.grade.by) || {};
  const sources = GRADE_BY.filter(([k], i) => i < 6 || by[k] > 0).map(([k, ic, label, group]) => ({ k, ic, label, group, xp: by[k] || 0 }));   // 주간 목표 · P54 새 종류는 생기면(P28-09)
  const groups = GRADE_GROUPS.map(([k, ic, label]) => { const items = sources.filter(s => s.group === k && s.xp > 0); return { k, ic, label, xp: items.reduce((a, s) => a + s.xp, 0), items }; });   // P54 묶음 7줄은 늘 (0이어도 — 어디서 쌓이는지 보이게)
  const decos = GRADE_DECO_KEYS.map(k => ({ key: k, name: DECOS[k].name, grade: DECOS[k].grade, open: DECOS[k].grade <= g.grade }));
  const nextDeco = decos.find(d => !d.open) || null;
  return Object.assign(g, { left: g.next - g.xp, slow: slowView(st), sources, groups, decos, nextDeco, nextDecoLeft: nextDeco ? gradeXpAt(nextDeco.grade) - g.xp : 0 });
}
const gradeBadge = st => slowView(st) ? null : (g => ({ grade: g.grade, name: g.name, pct: Math.floor(g.progress * 100) }))(gradeOf(st));   // 위 막대 (느긋하게 보기면 없음)
const seedUpText = q => `🌱 이제 씨앗이 ${pct(q)}%로 와요`;   // P41 R-05 등급이 올라 화원 · 예약 씨앗 처음 품질이 오름
const bonusOpenText = names => `💰 이제 살 수 있어요 · ${names.join(' · ')}`;   // P41-04 등급이 닿아 열린 다음 단계 (🐝 곤충농장)
const gradeAlerts = (st, e) => {   // P41: + 씨앗 품질 한 줄 · 새로 살 수 있는 단계 한 줄
  if (slowView(st) || !e) return [];
  const from = e.from || 1, q = seedQAt(e.grade), open = bonusOpenedAt(st, from, e.grade);
  return [gradeUpText(e.name), ...(e.unlock && e.unlock.length ? [gradeUnlockText(e.unlock)] : []), ...(q > seedQAt(from) ? [seedUpText(q)] : []), ...(open.length ? [bonusOpenText(open)] : [])];
};   // 오를 때 알림 줄 (onGrade 이벤트로) — 등급 한 줄 + 열린 장식 한 줄
function gradeAwayLine(st, from) {   // "자리를 비운 동안" 한 줄 (P25-01): 그동안 오른 등급을 하나로
  const to = gradeOf(st).grade;
  return slowView(st) || from == null || to <= from ? null : `🌱 정원 등급이 올랐어요 · ${gradeName(from)} → ${gradeName(to)}`;
}
const isGradeUpLine = t => typeof t === 'string' && t.startsWith('🌱 정원 등급이 올랐어요');

// ---------------------------------------------------------------- 🗓️ 주마다 바뀌는 목표 (P28-09, 10-28)
// 월요일 아침 6시(정원 3월 = 새해)마다 쉬움 · 보통 · 어려움 하나씩 3개. 뽑기는 정원 이름표 + 주로 정하고 뽑은 것은 저장 → 같은 주엔 다시 열어도 같음
// 그 정원이 연 기능에서만 고름(광산을 판 적 없으면 광산 목표 없음 …). 그 주 안 언제든(꽃잠에도) 끝내면 되고, 못 끝낸 목표는 벌칙 없이 사라짐
// 보상은 등급 경험치만(addXp 'weekly') — 돈 · 용품은 주지 않음 (P17-14). 셋 다 끝낸 덤도 경험치: 용품은 돈과 같아 경제를 흔들고,
// 그 주에만 얻는 장식은 몰아서 하는 사람(10 이현)에게 놓치면 영영 못 얻는 벌칙이 되어서
// 느긋하게 보기(P28-02)여도 진행 · 보상은 그대로, 일지 줄 · 알림만 남기지 않음 (목표 줄을 숨기는 건 화면 몫)
const WEEKLY_TIERS = ['쉬움', '보통', '어려움'];
const WEEKLY_XP = [20, 40, 80], WEEKLY_BONUS = 40;   // 끝내면 등급 경험치 (어려울수록 많이) · 셋 다 끝낸 덤
// 목표 종류: tier 0 쉬움 · 1 보통 · 2 어려움 · ev 어떤 일에 오르는지 · fam 같은 주에 한 번만(같은 일을 두 줄로 내지 않게) · open 그 정원이 연 기능인지
const hasHive = st => (st.decos || []).some(d => d.key === 'hive' && d.x != null);
const aliveTypes = st => { const c = {}; for (const f of st.flowers || []) if (!f.withered) c[f.type] = (c[f.type] || 0) + 1; return c; };
const WEEKLY = {
  water: { tier: 0, ic: '💧', n: 15, ev: 'care', fam: 'water', match: (g, i) => i.tool === 'water', text: g => `꽃에 물 ${g.n}번 주기`, open: () => true },
  petal: { tier: 0, ic: '🧺', n: 15, ev: 'harvest', fam: 'petal', text: g => `꽃잎 ${g.n}장 거두기`, open: () => true },
  dry: { tier: 0, ic: '🌾', n: 10, ev: 'dry', fam: 'dry', text: g => `꽃방에 꽃잎 ${g.n}장 널기`, open: st => n0(st.dex.petal) > 0 },
  cup: { tier: 0, ic: '☕', n: 10, ev: 'sell', fam: 'cup', text: g => `찻잔 ${g.n}잔 팔기`, open: st => n0(st.dex.teabag) > 0 },
  dig: { tier: 0, ic: '⛏️', n: 20, ev: 'dig', fam: 'dig', text: g => `광산 ${g.n}칸 파기`, open: st => S(st, 'dug') > 0 },
  tidy: { tier: 1, ic: '🌿', n: 12, ev: 'care', fam: 'tidy', match: (g, i) => i.tool === 'weed' || i.tool === 'prune', text: g => `잡초 뽑기 · 가지치기 ${g.n}번`, open: () => true },
  star4: { tier: 1, ic: '⭐', n: 10, ev: 'harvest', fam: 'petal', match: (g, i) => stars(i.q) >= 4, text: g => `★4 이상 꽃잎 ${g.n}장 거두기`, open: () => true },
  teabag: { tier: 1, ic: '🍵', n: 15, ev: 'teabag', fam: 'teabag', text: g => `티백 ${g.n}개 만들기`, open: st => n0(st.dex.petal) > 0 },
  order: { tier: 1, ic: '💌', n: 4, ev: 'order', fam: 'order', text: g => `손님 주문 ${g.n}장 들어주기`, open: st => S(st, 'orders') > 0 },
  recipe: { tier: 1, ic: '🫖', n: 3, ev: 'blend', fam: 'blend', match: (g, i) => !!i.recipe, text: g => `이름 있는 블렌드 ${g.n}잔 만들기`, open: st => n0(st.dex.blend) > 0 },
  prop: { tier: 1, ic: '🌱', n: 2, ev: 'prop', fam: 'prop', text: g => `번식 ${g.n}번 하기`, open: st => (st.flowers || []).some(f => !f.withered && FLOWERS[f.type].prop !== '채종') },   // 한해살이는 시들 때 저절로라 뺌
  stairs: { tier: 1, ic: '🪜', n: 3, ev: 'descend', fam: 'dig', text: g => `광산 계단 ${g.n}번 내려가기`, open: st => !!st.mine && st.mine.deepest >= 2 },
  star5: { tier: 2, ic: '🌟', n: 5, ev: 'harvest', fam: 'petal', match: (g, i) => i.type === g.type && stars(i.q) >= 5, text: g => `★5 ${FLOWERS[g.type].name} 꽃잎 ${g.n}장 거두기`, open: st => n0(aliveTypes(st)) > 0,
    pick: (st, rnd) => { const c = aliveTypes(st), ks = Object.keys(c).sort(), type = ks[Math.floor(rnd() * ks.length)]; return { type, n: Math.max(2, Math.min(5, 2 * c[type])) }; } },   // 정원에 있는 꽃에서 · 포기가 적으면 장 수도 적게
  blends: { tier: 2, ic: '🫖', n: 3, ev: 'sell', fam: 'cup', match: (g, i) => i.cup.kind === 'blend', distinct: i => i.cup.recipe || i.cup.parts.slice().sort().join('+'), text: g => `블렌드 차 ${g.n}종 팔기`, open: st => S(st, 'blendCups') > 0 },
  hat: { tier: 2, ic: '🍃', n: 5, ev: 'sell', fam: 'cup', match: (g, i) => !!i.cup.hat, text: g => `햇차 ${g.n}잔 팔기`, open: st => S(st, 'hatCups') > 0 },
  honey: { tier: 2, ic: '🍯', n: 3, ev: 'honey', fam: 'honey', text: g => `벌통 꿀 ${g.n}병 모으기`, open: hasHive },
  digs: { tier: 2, ic: '⛏️', n: 60, ev: 'dig', fam: 'dig', text: g => `광산 ${g.n}칸 파기`, open: st => S(st, 'dug') >= 20 },
  cups: { tier: 2, ic: '☕', n: 40, ev: 'sell', fam: 'cup', text: g => `찻잔 ${g.n}잔 팔기`, open: st => S(st, 'cups') >= 20 },
  orders: { tier: 2, ic: '💌', n: 8, ev: 'order', fam: 'order', text: g => `손님 주문 ${g.n}장 들어주기`, open: st => S(st, 'orders') >= 5 },
  petals: { tier: 2, ic: '🧺', n: 40, ev: 'harvest', fam: 'petal', text: g => `꽃잎 ${g.n}장 거두기`, open: () => true },
};
const WEEKLY_KEYS = Object.keys(WEEKLY);
const weeklyText = g => WEEKLY[g.k].text(g);
function weeklyRoll(st, cal) {   // 이번 주 목표 3개 (어려움부터 뽑아 같은 fam은 한 번 — 고를 게 적은 쪽이 먼저, 보여 줄 땐 쉬움 → 어려움)
  const prev = st.weekly || {}, rnd = mineRng(hashStr(`${st.gardenId || 'g'}|weekly|${cal.week}`)), goals = [], fams = [], pathFams = (PATHS[seasonPath(st)] || {}).fams;
  for (let t = 2; t >= 0; t--) {
    let ks = WEEKLY_KEYS.filter(k => WEEKLY[k].tier === t && !fams.includes(WEEKLY[k].fam) && WEEKLY[k].open(st));
    if (!ks.length) continue;
    const pk = pathFams && ks.filter(k => pathFams.includes(WEEKLY[k].fam)); if (pk && pk.length) ks = pk;   // P30-04-01 철의 길: 그 길 쪽 목표가 있으면 그중에서 (연 기능만 — 없으면 그대로)
    const k = ks[Math.floor(rnd() * ks.length)], K = WEEKLY[k];
    goals.push(Object.assign({ k, tier: t, n: K.n, got: 0, done: false }, K.pick ? K.pick(st, rnd) : {}));
    fams.push(K.fam);
  }
  goals.reverse();
  st.weekly = { week: cal.week, goals, bonus: false, full: prev.full || 0, doneAll: prev.doneAll || 0 };   // full: 셋 다 끝낸 주 · doneAll: 끝낸 목표 (모두)
  return st.weekly;
}
function weeklyOf(st) {   // 이번 주 목표 (주가 바뀌었으면 새로 뽑음). 첫 안내 전 정원은 아직 없음(null)
  if (!st.onboarded) return null;
  const cal = calendar(st.virtual);
  return st.weekly && st.weekly.week === cal.week ? st.weekly : weeklyRoll(st, cal);
}
function weeklyDone(st, g, ctx) {
  const w = st.weekly, quiet = slowView(st), xp = WEEKLY_XP[g.tier];
  g.done = true; g.got = g.n; w.doneAll = (w.doneAll || 0) + 1;
  if (!quiet) addLog(st, 9, `🗓️ 이번 주 목표를 끝냈어요 · ${weeklyText(g)} · 🌱 +${xp}`, ctx);
  addXp(st, 'weekly', xp, ctx);
  if (!w.bonus && w.goals.length && w.goals.every(x => x.done)) {
    w.bonus = true; w.full = (w.full || 0) + 1;
    if (!quiet) addLog(st, 9, `🗓️ 이번 주 목표를 모두 끝냈어요 · 덤 🌱 +${WEEKLY_BONUS}`, ctx);
    addXp(st, 'weekly', WEEKLY_BONUS, ctx);
  }
}
// 정원에서 한 일 → 이번 주 목표 진행 (ev: care · harvest · prop · dry · teabag · blend · sell · order · dig · descend · honey)
function weekNote(st, ev, info, n, ctx) {
  const w = weeklyOf(st); if (!w) return;
  for (const g of w.goals) {
    const K = WEEKLY[g.k];
    if (g.done || K.ev !== ev || (K.match && !K.match(g, info || {}))) continue;
    if (K.distinct) { const id = K.distinct(info); g.seen = g.seen || []; if (g.seen.includes(id)) continue; g.seen.push(id); g.got = g.seen.length; }
    else g.got = Math.min(g.n, g.got + (n == null ? 1 : n));
    if (g.got >= g.n) weeklyDone(st, g, ctx);
  }
}
function weeklyFinish(st, i, ctx) {   // 개발용(DEV) · 테스트: 이번 주 i번째 목표를 바로 끝냄
  const w = weeklyOf(st), g = w && w.goals[i];
  if (!g || g.done) return no('끝낼 목표가 없어요');
  weeklyDone(st, g, ctx);
  return ok(`${weeklyText(g)} 끝`);
}
// 화면은 아래만 읽음. 느긋하게 보기면 null → 목표 줄 · 띠를 통째로 숨김
function weeklyView(st) {
  const w = weeklyOf(st); if (!w || slowView(st)) return null;
  const leftH = (weekStart(st.virtual) + WEEK - st.virtual) / HOUR;
  const goals = w.goals.map(g => ({ k: g.k, ic: WEEKLY[g.k].ic, text: weeklyText(g), tier: g.tier, tierName: WEEKLY_TIERS[g.tier], n: g.n, got: g.got, done: g.done, xp: WEEKLY_XP[g.tier] }));
  return { week: w.week, goals, done: goals.filter(g => g.done).length, bonus: w.bonus, bonusXp: WEEKLY_BONUS, full: w.full || 0, leftH };
}
const weeklySnap = st => ({ all: (st.weekly && st.weekly.doneAll) || 0, full: (st.weekly && st.weekly.full) || 0, xp: (st.grade && st.grade.by && st.grade.by.weekly) || 0 });
function weeklyAwayLine(st, snap) {   // "자리를 비운 동안" 한 줄 (P25-01): 그동안 끝낸 목표를 하나로
  if (slowView(st) || !snap) return null;
  const now = weeklySnap(st), n = now.all - snap.all;
  return n > 0 ? `🗓️ 주간 목표 ${n}개를 끝냈어요${now.full > (snap.full || 0) ? ' · 🎉 셋 다 끝' : ''} · 🌱 +${now.xp - snap.xp}` : null;   // 경험치는 덤까지
}
const isWeeklyLine = t => typeof t === 'string' && t.startsWith('🗓️ 이번 주 목표');

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

