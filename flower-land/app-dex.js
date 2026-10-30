// 도리의 정원 — 화면: 📖 도감·기록 · 창 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 📖 도감·기록 (P08, P04-02)
// 📈 해마다 (P28-07-02, 10-28): 막대 = 그해 수입(또는 판 잔 · 꽃잎), 선 = 정원 점수, 아래 줄 = 등급. 값 · 축은 엔진 graphYears · graphAxis
// 🐢 느긋하게 보기면 축 · 숫자 · 등급 · 견줌을 빼고 모양만 (한 해 기록 그림처럼 넘겨 보는 것 — 숫자 목표가 되지 않게, P28-02)
const YEAR_BARS = [['income', '💰 수입', v => won(v)], ['sold', '🍵 판 잔', v => `${v}잔`], ['harvest', '🍂 꽃잎', v => `${v}장`]];
const shortNum = v => v >= 10000 ? `${+(v / 10000).toFixed(1)}만` : v >= 1000 ? `${+(v / 1000).toFixed(1)}천` : String(v);
const signed = (v, unit) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toLocaleString('ko-KR')}${unit || ''}`;
function yearGraphHTML() {
  const slow = E.slowView(st), g = E.graphYears(st, 10, ui.yearEnd);
  const pace = slow ? null : E.yearPace(st);     // 05-6 올해 지금까지 vs 지난해 같은 때 (모르면 줄째 뺌)
  const paceLine = pace ? `<div class="yg-pace"><span class="yg-pace-t">올해 지금까지</span>${pace.income ? `<span>💰 <b class="data">${won(pace.income.now)}</b> <small class="${pace.income.diff >= 0 ? 'val-up' : 'muted'}">지난해 이맘때보다 ${signed(pace.income.diff, '원')}</small></span>` : ''}${pace.xp ? `<span>🌱 경험치 <b class="data">${pace.xp.now.toLocaleString('ko-KR')}</b> <small class="${pace.xp.diff >= 0 ? 'val-up' : 'muted'}">${signed(pace.xp.diff)}</small></span>` : ''}</div>` : '';
  if (g.empty) return `${paceLine}<div class="cab-empty"><span>📈</span><div><b>한 해가 지나면 여기 그래프가 생겨요</b><br><span class="muted">일요일 쉼달마다 그해 ${slow ? '정원' : '수입 · 정원 점수 · 등급'}이 한 칸씩 쌓여요</span></div></div>`;
  const [bk, blabel, bfmt] = YEAR_BARS.find(b => b[0] === ui.yearBar) || YEAR_BARS[0], bname = blabel.slice(3);
  const rows = g.rows, n = rows.length, ax = E.graphAxis(rows.map(r => r[bk])), sx = E.graphAxis(rows.map(r => r.score));
  const pct = (v, a) => a.top ? Math.max(0, Math.min(100, v / a.top * 100)) : 0;
  const many = rows.some(r => (r.season || 1) >= 2), yname = r => `${many ? `${r.season || 1}철 ` : ''}${r.year}년차`;   // 🌸 철이 둘 이상 보이면 이름에 철 (P28-08-05)
  const tip = r => `${yname(r)}${slow ? '' : ` · ${bname} ${r[bk] == null ? '모름' : bfmt(r[bk])} · 정원 점수 ${r.score == null ? '모름' : r.score + '점'}${r.grade ? ` · ${r.grade}등급` : ''}`}`;
  const cols = rows.map(r => `<div class="yg-col" title="${tip(r)}">${r[bk] == null ? '<i class="yg-bar none"></i>' : `<i class="yg-bar" style="height:${pct(r[bk], ax)}%"></i>`}</div>`).join('');
  const pts = rows.map((r, i) => r.score == null ? null : [(i + 0.5) / n * 100, 100 - pct(r.score, sx)]);
  const segs = []; let cur = [];                 // 모르는 해(예전 정원)에서는 선을 끊음
  pts.forEach(p => { if (p) cur.push(p); else { if (cur.length) segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
  const line = `<svg class="yg-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${segs.map(sg => `<polyline points="${sg.map(p => p.map(v => +v.toFixed(2)).join(',')).join(' ')}"/>`).join('')}</svg>${pts.map(p => p ? `<i class="yg-dot" style="left:${p[0]}%;top:${p[1]}%"></i>` : '').join('')}`;
  // 🌸 철 경계선 (P28-08-05): 새 철 첫해 왼쪽에 세로 점선 + "2철" 꼬리표, 느긋하게 보기면 선만
  const brk = E.seasonBreaks(rows).map(b => `<i class="yg-season" style="left:${b.i / n * 100}%">${slow ? '' : `<span>${b.n}철</span>`}</i>`).join('');
  const grid = (slow ? [0] : ax.ticks).map(t => `<i class="yg-grid" style="bottom:${pct(t, ax)}%"></i>`).join('');
  const axL = slow ? '' : `<div class="yg-axis l" aria-hidden="true">${ax.ticks.map(t => `<span class="data" style="bottom:${pct(t, ax)}%">${bk === 'income' ? shortNum(t) : t}</span>`).join('')}</div>`;
  const axR = slow ? '' : `<div class="yg-axis r" aria-hidden="true">${sx.ticks.map(t => `<span class="data" style="bottom:${pct(t, sx)}%">${t}</span>`).join('')}</div>`;
  const xrow = (label, f, cls) => `<div class="yg-xrow ${cls || ''}">${slow ? '' : `<span class="yg-xl">${label}</span>`}<div class="yg-xs" style="--n:${n}">${rows.map(f).join('')}</div>${slow ? '' : '<span class="yg-xr"></span>'}</div>`;
  const nav = g.prev || g.next ? `<div class="yg-nav"><button type="button" class="btn small" ${g.prev ? `data-ynav="${g.from - 1}"` : 'disabled'} aria-label="앞의 해">‹ 앞</button><span class="muted">${rows[0].year}~${rows[n - 1].year}년차 · 모두 ${g.total}해</span><button type="button" class="btn small" ${g.next ? `data-ynav="${g.end + 10}"` : 'disabled'} aria-label="뒤의 해">뒤 ›</button></div>` : '';
  const seg = slow ? '' : `<span class="seg yg-seg" role="group" aria-label="막대로 볼 것">${YEAR_BARS.map(([k, l]) => `<button type="button" data-yb="${k}" aria-pressed="${k === bk}">${l}</button>`).join('')}</span>`;
  const legend = slow ? '<p class="muted yg-note">해마다 정원이 자란 모양이에요</p>' : `<div class="yg-legend"><span><i class="lg-bar"></i>${bname} (막대)</span><span><i class="lg-line"></i>정원 점수 (선 · 오른쪽)</span>${rows.some(r => r.grade) ? '<span>🌱 등급 (아래)</span>' : ''}</div>`;
  const last = rows[n - 1], vs = slow ? null : E.yearDiffOf(st, last.year, last.season);
  const vsLine = vs ? `<p class="yg-vs">📈 ${yname(last)}는 지난해보다 <b>${vsText(vs)}</b></p>` : '';
  const cell = (r, k) => r[k] == null ? '—' : `${YEAR_BARS.find(b => b[0] === k)[2](r[k])}${r.part ? '*' : ''}`;
  const table = slow ? '' : `<details class="yg-table"><summary>숫자로 보기</summary><table><thead><tr><th>해</th><th>수입</th><th>판 잔</th><th>꽃잎</th><th>점수</th><th>등급</th></tr></thead><tbody>${rows.map(r => `<tr><th>${yname(r)}</th>${['income', 'sold', 'harvest'].map(k => `<td class="data">${cell(r, k)}</td>`).join('')}<td class="data">${r.score == null ? '—' : r.score}</td><td class="data">${r.grade == null ? '—' : r.grade}</td></tr>`).join('')}</tbody></table>${rows.some(r => r.part) ? '<p class="muted">* 업데이트한 해라 그 뒤부터만 셌어요</p>' : ''}${rows.some(r => r.income == null) ? '<p class="muted">— 는 기록하기 전이라 몰라요</p>' : ''}</details>`;
  return `${paceLine}<div class="card ygraph ${slow ? 'slow' : ''}">
    <div class="yg-head"><b>📈 해마다 정원</b>${seg}</div>${legend}
    <div class="yg-plot ${slow ? 'bare' : ''}">${axL}<div class="yg-area" role="img" aria-label="${rows.map(tip).join(', ')}">${grid}<div class="yg-cols" style="--n:${n}">${cols}</div>${line}${brk}</div>${axR}</div>
    ${xrow('년차', r => `<span class="data">${r.year}</span>`)}${slow || !rows.some(r => r.grade) ? '' : xrow('🌱', r => `<span class="data">${r.grade == null ? '·' : r.grade}</span>`, 'grade')}
    ${nav}${vsLine}${table}</div>`;
}
// 🛤️ 철마다 표 (P30-04-03, L2-3 10-30): 📈 해마다 아래 — 철 · 길 · 걸린 해 · 그 철 끝 등급 · 판 잔, 지금 철은 "진행 중". 2철부터 · 🐢 느긋하게 보기면 숨김 (엔진 seasonTable이 null)
function seasonTableHTML() {
  const rows = E.seasonTable(st); if (!rows) return '';
  const tr = r => `<tr class="${r.now ? 'now' : ''}"><th scope="row">🌸 ${r.n}철</th><td><span class="st-path" style="--pc:${(E.PATHS[r.path] || {}).color || 'var(--line)'}">${r.pathIcon} ${r.pathName}</span></td><td class="data">${r.years}해${r.now ? ' <small class="muted st-now">진행 중</small>' : ''}</td><td class="data">${r.grade == null ? '—' : r.grade}</td><td class="data">${r.sold == null ? '—' : `${r.sold.toLocaleString('ko-KR')}잔`}</td></tr>`;
  return `<div class="card stable"><div class="yg-head"><b>🛤️ 철마다</b></div>
    <div class="st-wrap"><table><thead><tr><th>철</th><th>길</th><th>걸린 해</th><th>🌱 등급</th><th>🍵 판 잔</th></tr></thead><tbody>${rows.map(tr).join('')}</tbody></table></div>
    <p class="muted yg-note">걸린 해는 새 철을 시작하기까지 지난 해, 등급은 그 철을 마칠 때(지금 철은 지금)예요${rows.some(r => r.sold == null && !r.now) ? ' · — 는 기록하기 전이라 몰라요' : ''}</p></div>`;
}
// 지난해 견줌 한 줄: "수입 +12% · 점수 +8" (없는 칸은 뺌)
const vsText = d => [d.income != null ? `수입 ${signed(d.income, '%')}` : '', d.score != null ? `점수 ${signed(d.score)}` : ''].filter(Boolean).join(' · ') || '기록이 비슷해요';
// 한 해 기록 카드 (꽃잠): 지난해보다 얼마나 · 그래프 보기. 느긋하게 보기면 숫자 없이 그래프 링크만
// 🌙 꽃잠 한 해 평가 뒤 (P23-02 · P28-05-02-03, M3-2): 가장 최근 기록 카드 끝에 쓸 수 있는 손길 점 한 줄 → 도감일지 손길 점 칸 (느긋하게 보기면 없음)
function bonusRecHTML() {
  const left = E.bonusView(st).left;
  return left >= 1 && !E.slowView(st) ? `<div class="rec-bonus"><span>🌟 손길 점 ${left}점을 쓸 수 있어요</span><button type="button" class="btn small" data-bgo="1">고르러 가기</button></div>` : '';
}
// 🌸 새 철 (P28-08-05, M3-4): 꽃잠 기록 끝 한 줄 + 작은 단추 — 창 · 알림 · 재촉 없음, 안 눌러도 손해 없음
// 느긋하게 보기여도 보임(숫자가 아니라 고르는 것) · 조건이 안 됐으면 아무것도 없음 (조건 숫자는 📘 매뉴얼에만)
function seasonHintHTML() {
  const t = E.seasonHint(st, E.calendar(st.virtual));
  return t ? `<div class="rec-season"><span>${t}</span><button type="button" class="btn small" data-newseason="1">새 철 시작</button></div>` : '';
}
// 05 확인 창: 완전 초기화(⚙️ 설정 · 빨간 경고 · 모두 지움)와 다른 색(따뜻한 꽃 색) · 다른 자리(📖 기록 끝)
// 🛤️ 철의 길 고르기 (P30-04-02, L2-2 10-30): 확인 창 아래 길 넷 — 기본 "길 없이", 고른 길은 그 철 동안 안 바뀜. 돈 · 수확은 길마다 같음 (엔진 PATHS)
function seasonPathPickHTML() {
  const cur = ui.seasonPath || '';
  const card = (k, P) => `<button type="button" role="radio" class="sp-path" data-spath="${k}" aria-checked="${cur === k}" style="--pc:${P.color || 'var(--line)'}"><span class="spp-ic" aria-hidden="true">${P.icon}</span><span class="spp-t"><b>${P.name}</b><small>${P.desc}</small></span></button>`;
  return `<div class="sp-paths" role="radiogroup" aria-label="이번 철에 걸을 길"><b class="spp-head">🛤️ 이번 철에 걸을 길</b>${E.PATH_KEYS.map(k => card(k, E.PATHS[k])).join('')}${card('', E.PATH_NONE)}
    <p class="muted spp-note">길은 주간 목표 · 오는 손님 · 칭호만 바꿔요. 돈 · 수확은 같아요. 철 가운데엔 못 바꾸고 다음 철에 다른 길을 걸어요</p></div>`;
}
function openSeasonStart() {
  if (!E.seasonCanStart(st, E.calendar(st.virtual))) return renderDex(true);   // 그새 꽃잠이 끝났으면 줄만 걷음
  ui.seasonPath = null;                          // 창을 열 때마다 기본 "길 없이"
  const n = E.seasonN(st) + 1, files = !cloudIn();
  openModal(`🌸 ${n}철 시작`, `<div class="season-pop stack" style="gap:10px">
    <p class="sp-lead"><b>정원을 비우고 새 철을 시작할까요?</b><br><span class="muted">다음 월요일 3월이 새 철 1년차예요</span></p>
    <div class="sp-row keep"><b>🌿 이어져요</b><span>정원 등급 · 🌟 손길 점 · 칭호 · 도감 · 🐝 곤충 일꾼 · 🪑 찻집 가꾸기 · 기록</span></div>
    <div class="sp-row clear"><b>🍂 비워져요</b><span>땅 · 꽃 · 돈(15,000원부터) · 씨앗 · 꽃잎 · 티백 · 찻잔 · 용품 · 놓은 장식은 📦 창고로</span></div>
    ${files ? '<div class="sp-save"><span>시작 전에 💾 저장 파일을 받아 두면 좋아요</span><button type="button" class="btn small" id="seasonSave">저장</button></div>' : '<p class="note">☁️ 구글 드라이브에 저장된 직전 정원은 ⚙️ 설정에서 볼 수 있어요</p>'}
    ${seasonPathPickHTML()}
    <p class="note">안 해도 괜찮아요. 지금 정원을 그대로 이어 가도 잃는 건 없어요.</p></div>`,
    [{ label: '그만두기', act: () => closeModal() }, { label: '새 철 시작', primary: true, act: seasonGo }]);
  const pathBtns = [...document.querySelectorAll('.sp-paths [data-spath]')];   // P30-04-02 라디오처럼 하나만 — 고른 카드만 Tab으로 닿고 ←→ · ↑↓로 옮김
  const pickPath = (b, focus) => {
    ui.seasonPath = b.dataset.spath || null;
    pathBtns.forEach(x => { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
    if (focus) b.focus();
  };
  pathBtns.forEach((b, i) => {
    b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
    b.addEventListener('click', () => pickPath(b));
    b.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
      e.preventDefault(); pickPath(pathBtns[(i + d + pathBtns.length) % pathBtns.length], true);
    });
  });
  const sb = $('#seasonSave'); if (sb) sb.addEventListener('click', () => { saveClick(); if (!IN_APP) { sb.textContent = '받았어요'; sb.disabled = true; } });
}
function seasonGo() {
  const r = E.seasonStart(st, Object.assign({}, ctx, { path: ui.seasonPath || null }));   // ctx.rng를 꼭 넘김 — 안 넘기면 땅 600칸 뽑기가 Math.random (CLAUDE.md) · P30-04-02 고른 길
  if (!r.ok) { closeModal(); return feedback(r.msg, true); }
  ui.selected = null; ui.cart = {}; ui.sigs = {};
  closeModal(); save(); setTab('garden');          // 빈 정원 · 위 막대 🌸 · 철 칭호 창(showNewTitles)은 renderAll이
  const P = r.path && E.PATHS[r.path];
  queueToast(`🌸 ${r.season}철이 시작됐어요${P ? ` · ${P.icon} ${P.name}로 걸어요` : ''} · 다음 월요일 3월부터 1년차예요`);
  cloudSync('now');   // ☁️ 로그인했으면 새 철 정원을 바로 올림 (옛 철이 다른 기기에서 덮지 않게)
}
function recVsHTML(r) {
  if ((st.yearLog || []).length < 2) return '';
  const d = E.slowView(st) ? null : E.yearDiffOf(st, r.year, r.season);   // 지난 철 카드는 그 철 안에서만 견줌 (P28-08-04)
  return `<div class="rec-vs">${d ? `<span>📈 지난해보다 <b>${vsText(d)}</b></span>` : ''}<button type="button" class="btn small" data-dt="year">${d ? '그래프 보기' : '📈 해마다 보기'}</button></div>`;
}
// 📊 꽃별 셈 (P28-06, 10-28): 값은 엔진 flowerEconomy만 읽음. 도감에 없는 꽃은 "?"로 가리고 정렬에서도 맨 뒤 (모르는 꽃의 순위가 드러나지 않게)
// 🐢 느긋하게 보기면 칩째 숨김 (P28-02). 좁은 화면은 줄마다 카드 (CSS .econ)
const ECON_SORTS = [['income', '💰 한 해 수입'], ['price', '🏷️ 값 싼 순'], ['mature', '🌱 빨리 자람']];
const econKnown = k => !!st.dex.flower[k];
function econHTML() {
  const by = ECON_SORTS.some(x => x[0] === ui.econSort) ? ui.econSort : 'income', rows = E.flowerEconomy(by);
  const list = [...rows.filter(r => econKnown(r.key)), ...rows.filter(r => !econKnown(r.key))];
  const cols = [['값', '화원 값'], ['자람', '다 자람'], ['핌', '피는 달'], ['수확', '한 해 수확'], ['찻값', '한 잔 ★3'], ['수입', '한 해 수입'], ['땅', '좋아하는 땅']];
  const tr = r => {
    if (!econKnown(r.key)) return `<tr class="locked"><th scope="row"><span class="ec-name">${spriteImg(r.key, 'flower', 22, true, '아직 모르는 꽃')}<span>???</span></span></th>${cols.map(c => `<td data-l="${c[1]}">?</td>`).join('')}</tr>`;
    const L = LANDS[r.land], extra = r.harvests > r.bloom;
    const v = [won(r.price), `${r.mature}달`, `${r.bloom}달 <small>${monthsText(r.bloomMonths)}</small>`, `${r.harvests}번 × ${r.petals}장${extra ? ' <small>꽃잠 +1</small>' : ''}`,
      `${won(r.tea)} <small>★1 ${r.star[0].toLocaleString('ko-KR')} ~ ★5 ${r.star[4].toLocaleString('ko-KR')}</small>`, `<b>${won(r.income)}</b>`, `<span><span class="sw" style="background:${L.color}"></span>${L.name}</span>`];
    return `<tr><th scope="row"><span class="ec-name">${spriteImg(r.key, 'flower', 22, false, r.name)}<span>${r.name}</span><small class="muted">${LIFE[r.life]}</small></span></th>${v.map((x, i) => `<td data-l="${cols[i][1]}" class="${i === 5 ? 'ec-inc' : ''}">${x}</td>`).join('')}</tr>`;
  };
  const seg = `<span class="seg ec-seg" role="group" aria-label="정렬">${ECON_SORTS.map(([k, l]) => `<button type="button" data-es="${k}" aria-pressed="${k === by}">${l}</button>`).join('')}</span>`;
  return `<div class="card econ"><div class="yg-head"><b>📊 꽃별 셈</b>${seg}</div>
    <p class="muted ec-note">다 자란 한 포기가 한 해(한 주)에 버는 돈이에요. 찻값은 ★3 티백 한 잔 값이고, 땅이 맞고 잘 돌보면 ★이 올라요.</p>
    <div class="ec-wrap"><table><thead><tr><th>꽃</th>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${list.map(tr).join('')}</tbody></table></div>
    <p class="muted ec-note">레시피 블렌드로 팔면 더 받아요. 아직 못 본 꽃은 피우면 보여요.</p></div>`;
}
function renderDex(force) {
  const sig = JSON.stringify([st.forest && st.forest.dex, E.forestOpen(st), ui.dexTab, ui.dexCat, ui.fold, st.dex, st.journal, st.titles, st.titleOn, E.calendar(st.virtual).idx, st.records.length, st.records[0] && !!st.records[0].snapshot, st.grade && st.grade.xp, st.bonus, E.slowView(st), E.seasonN(st), st.season && st.season.path, (st.yearLog || []).length, ui.yearBar, ui.yearEnd, ui.econSort, ui.dexTab === 'year' && st.yearNow && st.yearNow.income, ui.dexTab === 'journal' && st.weekly && [st.weekly.week, st.weekly.goals.map(g => g.got)], st.yearly && [st.yearly.at, st.yearly.missed.length, Object.keys(st.yearly.got).length, (st.yearly.years || []).map(r => r.s.join('') + r.m.join(''))]]);   // 🗓️ 이번 주 목표 (P28-09)   // 🌱 등급 쪽 (M1-4) · 📈 해마다 (M1-5)
  if (!force && ui.sigs.dex === sig) return;
  ui.sigs.dex = sig;
  const n = E.dexCount(st);
  const tab = (k, label) => `<button type="button" data-dt="${k}" aria-pressed="${ui.dexTab === k}">${label}</button>`;
  const tabs = `<span class="seg" id="dexTabs">${tab('journal', '📔 도감일지')}${tab('rec', '기록')}${tab('year', '📈 해마다')}${tab('dex', '도감')}</span>`;   // 순서: 도감일지 > 기록 > 해마다 > 도감 (10-17 · 해마다 P28-07-02 10-28)
  let body;
  if (ui.dexTab === 'dex') {
    // 모은 카드는 작은 설명, 못 모은 카드는 "어떻게 모으는지" 힌트
    const card = (kind, k, on, art, name, sub, pc, cls) => `<button type="button" class="dexcard ${cls || ''} ${on ? '' : 'locked'}" style="--pc:${pc}" ${on ? `data-dex="${kind}" data-key="${k}"` : 'tabindex="-1" aria-disabled="true"'}><span class="dc-art">${art}</span><span class="dc-name">${on ? name : '???'}</span><span class="dc-sub">${sub}</span></button>`;
    const nf = Object.keys(st.dex.flower).length, nt = Object.keys(st.dex.tea).length, nl = Object.keys(st.dex.land).length;
    const nfo = Object.keys(st.dex.form || {}).length, ntb = Object.keys(st.dex.teabag || {}).length, np = Object.keys(st.dex.petal || {}).length, nb = Object.keys(st.dex.blend || {}).length;
    // 단순하게: 줄 제목에 모은 수만, 카드는 그림 · 이름 (차는 ★), 못 모은 카드만 힌트
    const head = (ic, title, got, total, q) => `<div class="cab-head dex-head"><span class="sb-title">${ic} ${title}</span>${q ? '' : `<span class="dh-count data">${got} / ${total}</span>`}</div>`;
    const makers = k => FLOWER_KEYS.filter(f => homeLand(FLOWERS[f]) === k);
    // 종류 칩: 전체 또는 한 종류만 보기 (긴 화면을 짧게)
    const cats = [
      { key: 'form', ic: '🌰', title: '씨앗·묘목', got: nfo, total: FLOWER_KEYS.length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!st.dex.form[k], nm = `${F.name} ${FORM[F.form].name}`; return card('form', k, on, spriteImg(k, 'form', 56, !on, on ? nm : '아직 모르는 씨앗·묘목'), nm, on ? '' : `화원 ${sowText(F)}`, F.petal); }).join('')}</div>` },
      { key: 'flower', ic: '🌸', title: '꽃', got: nf, total: FLOWER_KEYS.length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!st.dex.flower[k]; return card('flower', k, on, spriteImg(k, 'flower', 56, !on, on ? F.name : '아직 모르는 꽃'), F.name, on ? '' : `화원 ${sowText(F)}`, F.petal); }).join('')}</div>` },
      { key: 'petal', ic: '🍂', title: '꽃잎', got: np, total: FLOWER_KEYS.length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!st.dex.petal[k]; return card('petal', k, on, spriteImg(k, 'petal', 52, !on, on ? `${F.name} 꽃잎` : '아직 모르는 꽃잎'), `${F.name} 꽃잎`, on ? '' : (st.dex.flower[k] ? '피면 거둬요' : '처음 거둘 때'), F.petal); }).join('')}</div>` },
      { key: 'teabag', ic: '🏷️', title: '티백', got: ntb + Object.keys(st.dex.bagBlend || {}).length, total: FLOWER_KEYS.length + E.blendKeys(st).length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!(st.dex.teabag || {})[k], nm = `${F.name} 티백`; return card('teabag', k, on, spriteImg(k, 'teabag', 52, !on, on ? nm : '아직 모르는 티백'), nm, on ? '' : ((st.dex.petal || {})[k] ? '제다실에서 꽃잎으로' : '꽃잎을 티백으로'), F.petal); }).join('')}</div><div class="dexgrid big dex-blends">${E.blendKeys(st).map(k => { const B = E.BLENDS[k], on = !!(st.dex.bagBlend || {})[k], nm = `${B.name} 티백`; return card('blend', k, on, spriteImg(B.parts[0], 'teabag', 52, !on, on ? nm : '아직 모르는 블렌드 티백'), nm, on ? '' : (st.dex.blend[k] != null ? '블렌드를 티백으로' : '블렌딩 → 티백'), SPR.tea[B.parts[0]] || FLOWERS[B.parts[0]].petal, 'blend'); }).join('')}</div>` },
      { key: 'tea', ic: '🍵', title: '차', got: nt + nb, total: FLOWER_KEYS.length + E.blendKeys(st).length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], q = st.dex.tea[k], on = q != null; return card('tea', k, on, spriteImg(k, 'tea', 56, !on, on ? F.tea : '아직 모르는 차'), F.tea, on ? `<span class="stars">${starStr(q)}</span>` : ((st.dex.teabag || {})[k] ? '찻집에서 우려 팔면' : '티백을 찻집에서'), SPR.tea[k] || F.petal); }).join('')}</div><div class="dexgrid big dex-blends">${E.blendKeys(st).map(k => { const B = E.BLENDS[k], q = st.dex.blend[k], on = q != null, known = B.parts.every(p => st.dex.petal[p]); return card('blend', k, on, spriteImg(B.parts[0], 'tea', 52, !on, on ? B.name : '아직 모르는 블렌드'), B.name, on ? `<span class="stars">${starStr(q)}</span>` : (known ? B.parts.map(p => FLOWERS[p].name).join(' + ') : '제다실에서 섞어 봐요'), SPR.tea[B.parts[0]] || FLOWERS[B.parts[0]].petal, 'blend'); }).join('')}</div>` },
      { key: 'deco', ic: '🪴', title: '꾸밈', got: E.decoCount(st), total: E.decoTotal(), grid: `<div class="dexgrid big">${[...E.DECO_KEYS, ...E.GRADE_DECO_KEYS, ...E.TITLE_KEYS.map(k => 't:' + k), ...E.decoExtras(st)].map(k => { const on = !!(st.dex.deco || {})[k], info = E.decoInfo(k);
        return `<div class="dexcard ${on ? '' : 'locked'}" style="--pc:#9a8f7a"><span class="dc-art">${on ? decoImg(k, info.title ? 2 : 3) : '<span class="dc-q">?</span>'}</span><span class="dc-name">${on ? esc(info.name) : '???'}</span><span class="dc-sub">${on ? '' : info.title ? '칭호를 얻으면' : info.craft ? '⛏️ 광산에서 만들기' : info.gear ? '🔆 화원 정원 장치' : info.auto ? `🧺 화원 자동 장치 · 정원 등급 ${info.need}` : info.grade ? `🌱 정원 등급 ${info.grade}` : `화원 ${E.decoMonths(k).map(monthName).join('·')}`}</span></div>`; }).join('')}</div>` },
      { key: 'honey', ic: '🍯', title: '꿀', got: E.honeyCount(st), total: E.HONEY_KEYS.length, grid: `<div class="dexgrid big">${E.HONEY_KEYS.map(k => { const on = !!(st.dex.honey || {})[k];
        return `<div class="dexcard ${on ? '' : 'locked'}" style="--pc:#d99a2b"><span class="dc-art">${on ? honeyImg(k, 3) : '<span class="dc-q">?</span>'}</span><span class="dc-name">${on ? E.honeyName(k) : '???'}</span><span class="dc-sub">${on ? '' : k === 'wild' ? '여러 꽃이 고루 피면' : st.dex.flower[k] ? `벌통 둘레에 ${FLOWERS[k].name}` : '벌통 둘레에 핀 꽃'}</span></div>`; }).join('')}</div>` },
      { key: 'letter', ic: '✉️', title: '편지', got: E.letterCount(st), total: E.LETTER_KEYS.length, grid: `<div class="dexgrid big">${(st.letterBox || []).filter(b => b.mail).reverse().map(b => `<button type="button" class="dexcard" style="--pc:#c96f5b" data-mail="${esc(b.mail.id)}"><span class="dc-art"><span class="dc-memo">📮</span></span><span class="dc-name">${esc(b.mail.from)}</span><span class="dc-sub">${b.took ? esc(b.mail.title) : '🎁 받기 전'}</span></button>`).join('')}${(st.dex.letter || {}).welcome ? `<button type="button" class="dexcard" style="--pc:#e3a3b3" data-letter="welcome"><span class="dc-art"><span class="dc-memo">💌</span></span><span class="dc-name">${E.LETTERS.welcome.from}</span><span class="dc-sub">첫 방문 편지</span></button>` : ''}${E.LETTER_KEYS.map(k => { const on = !!(st.dex.letter || {})[k], L = E.LETTERS[k];
        return `<button type="button" class="dexcard ${on ? '' : 'locked'}" style="--pc:#d9c6a4" ${on ? `data-letter="${k}"` : 'tabindex="-1" aria-disabled="true"'}><span class="dc-art"><span class="dc-memo">${on ? '✉️' : '?'}</span></span><span class="dc-name">${on ? L.from : '???'}</span><span class="dc-sub">${on ? '눌러서 읽기' : '💐 이웃에게 선물하면'}</span></button>`; }).join('')}</div>` },
      { key: 'memento', quiet: true, ic: '💌', title: '기념품', got: E.mementoCount(st), total: E.MEMENTO_KEYS.length, grid: `<div class="dexgrid big">${E.MEMENTO_KEYS.map(k => { const on = !!(st.dex.memento || {})[k], M = E.MEMENTOS[k];
        return `<div class="dexcard ${on ? '' : 'locked'}" style="--pc:#c8a2b0"><span class="dc-art"><span class="dc-memo">${on ? M.ic : '?'}</span></span><span class="dc-name">${on ? M.name : '???'}</span><span class="dc-sub">${on ? (M.visitor ? `${E.VISITORS[M.visitor].icon} ${esc(E.VISITORS[M.visitor].name)}` : '') : M.visitor ? `${E.VISITORS[M.visitor].icon} 손님이 세 번 오면` : '손님 주문을 들어주면'}</span></div>`; }).join('')}</div>` },   // P30-06-03 🐾 특별 손님 기념품 8칸 (12 → 20)
      // 🗓️ 올해만 (P30-05-02, L1-4 10-30): 해마다 계절마다 오는 날씨 · 꽃빛 12칸 — 기본 도감 칸 수(dexTotal)에 넣지 않음 (등급 경험치 · 퀘스트에 안 들어가게, 보는 즐거움만)
      { key: 'yearly', quiet: true, ic: '🗓️', title: '올해만', got: E.yearlyCount(st), total: E.YEARLY_KEYS.length, grid: `<div class="dexgrid big">${E.yearlyDex(st).map(d => { const on = d.got, A = d.flower && window.YEARLY_ART.bloom[d.flower];
        return `<div class="dexcard ${on ? '' : 'locked'}" style="--pc:#a9a2c4" title="${esc(on ? d.desc : d.hint)}"><span class="dc-art">${on ? (A ? spriteImg(d.flower, 'alt', 48, false, `${A.name} ${FLOWERS[d.flower].name}`) : `<span class="dc-memo">${d.icon}</span>`) : '<span class="dc-q">?</span>'}</span><span class="dc-name">${on ? esc(d.name) : '???'}</span><span class="dc-sub">${on ? (A ? `${A.name} ${FLOWERS[d.flower].name}` : '') : d.hint}</span></div>`; }).join('')}</div>` },
      // 🌳 숲 (P30-03, L3-2 10-30): 나무 6 × 4단계 — 그 단계까지 자라면 참 · 4층이 열린 정원에만 · 기본 도감 칸 수(dexTotal)에 넣지 않음 (올해만과 같음)
      ...(E.forestOpen(st) ? [{ key: 'forest', quiet: true, ic: '🌳', title: '숲', got: E.forestCount(st), total: E.TREE_KEYS.length * E.TREE_STAGES.length, grid: `<div class="dexgrid big">${E.forestDex(st).map(d => `<div class="dexcard ${d.got ? '' : 'locked'}" style="--pc:#7f9a6a"><span class="dc-art">${d.got ? treeImg(d.key, d.stage, TREE_SMALL[d.stage], 1) : '<span class="dc-q">?</span>'}</span><span class="dc-name">${d.got ? `${d.icon} ${esc(d.name)}` : '???'}</span><span class="dc-sub">${d.got ? d.stageName : d.stage ? `${d.stageName}까지 자라면` : '🌳 숲에 심으면'}</span></div>`).join('')}</div>` }] : []),
      { key: 'mine', ic: '⛏️', title: '광산', got: E.mineCount(st), total: E.MINE_DEX_KEYS.length, grid: `<div class="dexgrid big">${E.MINE_DEX_KEYS.map(k => { const on = !!(st.dex.mine || {})[k], from = E.ORES[k] ? E.ORES[k].from : E.FOSSILS[k] ? E.FOSSILS[k].from : 8;
        return `<div class="dexcard ${on ? '' : 'locked'}" style="--pc:#8d8a80"><span class="dc-art">${on ? mineImg(k, 3) : '<span class="dc-q">?</span>'}</span><span class="dc-name">${on ? E.mineName(k) : '???'}</span><span class="dc-sub">${on ? '' : `광산 ${from}층부터`}</span></div>`; }).join('')}</div>` },
      { key: 'land', ic: '🟫', title: '땅', got: nl, total: 10, grid: `<div class="dexgrid big">${LAND_KEYS.map(k => { const L = LANDS[k], on = !!st.dex.land[k], mk = makers(k); return card('land', k, on, `<span class="dc-land" style="background-color:${on ? L.color : 'var(--line)'}"></span>`, L.name, on ? '' : (mk.some(f => st.dex.flower[f]) ? `${FLOWERS[mk.find(f => st.dex.flower[f])].name}의 땅` : mk.length ? '어떤 꽃의 땅일까요' : '꽃과 꽃 사이에서'), L.color); }).join('')}</div>` },
    ];
    const econ = !E.slowView(st), nKnown = FLOWER_KEYS.filter(econKnown).length;   // 📊 꽃별 셈 칩 (P28-06) — 모음이 아니라 'all'엔 넣지 않음
    const cat = cats.some(c => c.key === ui.dexCat) || (econ && ui.dexCat === 'calc') ? ui.dexCat : 'all';
    const quiet = !econ;   // P30-08 🐢 느긋하게 보기: P30 새 칩(💌 기념품 · 🗓️ 올해만 · 🌳 숲)은 n / N · 채움 막대 없이 이름만 (기존 칩은 P28-02 그대로)
    const chip = (key, label, got, total, q) => q ? `<button type="button" class="dexchip" data-dc="${key}" aria-pressed="${cat === key}"><span>${label}</span></button>` : `<button type="button" class="dexchip ${got >= total ? 'done' : ''}" data-dc="${key}" aria-pressed="${cat === key}"><span>${label}</span><span class="data">${got} / ${total}</span><i style="--p:${Math.round(got / total * 100)}%"></i></button>`;
    body = `<div class="dexchips" role="group" aria-label="도감 종류">${chip('all', '기본 도감', n, E.dexTotal(st))}${cats.map(c => chip(c.key, `${c.ic} ${c.title}`, c.got, c.total, quiet && c.quiet)).join('')}${econ ? chip('calc', '📊 꽃별 셈', nKnown, FLOWER_KEYS.length) : ''}</div>
      ${cat === 'calc' ? econHTML() : ''}${cats.filter(c => cat === 'all' || c.key === cat).map(c => `${cat === 'all' ? head(c.ic, c.title, c.got, c.total, quiet && c.quiet) : ''}${foldGrid('dex-' + c.key, c.grid, quiet && c.quiet)}`).join('')}`;   // 못 모은 칸은 접어 둠 (10-17)
  } else if (ui.dexTab === 'year') {
    body = yearGraphHTML() + seasonTableHTML();
  } else if (ui.dexTab === 'journal') {
    body = journalHTML();
  } else {
    const sNow = E.seasonN(st), seasonOn = sNow >= 2;   // 2철부터 카드 제목에 철 (P28-08-05)
    body = st.records.length ? st.records.map((r, ri) => {
      const total = W * H, order = LAND_KEYS.filter(k => r.counts[k]).sort((a, b) => (a === 'barren') - (b === 'barren') || r.counts[b] - r.counts[a]);
      // 한 해 카드: 왼쪽 그해 정원 그림 (없으면 점선 자리) · 오른쪽 제목과 두 칩(가장 좋은 차 · 도감) · 땅 막대 · 일지
      const land = order.filter(k => k !== 'barren').length;
      const rp = E.PATHS[r.path];                    // P30-04-01 ④ 그 철 길 색 한 줄 (길 없이면 없음)
      return `<div class="card record${rp ? ' rec-path' : ''}"${rp ? ` style="--pc:${rp.color}"` : ''}>
        <div class="rec-art">${r.snapshot ? `<img src="${r.snapshot}" alt="${r.year}년차 쉼달 아침의 정원">` : '<div class="rec-noimg"><span>🖼️</span>이 해는 정원 그림이 없어요</div>'}</div>
        <div class="stack" style="gap:10px">
          <div class="rec-head"><h3>${seasonOn ? `🌸 ${r.season || 1}철 · ` : ''}${r.year}년차 정원</h3>${rp ? `<span class="rec-pathname">${rp.icon} ${rp.name}</span>` : ''}${seasonOn && (r.season || 1) < sNow ? '<span class="rec-past">지난 철</span>' : ''}<span class="muted">땅 ${land}가지</span></div>
          ${r.score != null && !E.slowView(st) ? `<div class="rec-score"><b>🏅 정원 점수 ${r.score}점</b><small>${r.prevBest ? (r.score > r.prevBest ? `최고 기록 · 전 최고보다 +${r.score - r.prevBest}` : `최고 ${r.prevBest}점`) : '첫 기록'}</small><small class="rec-parts">${[['땅', 'lands'], ['꽃', 'flowers'], ['핀 꽃', 'bloom'], ['블렌드', 'blend'], ['꿀', 'honey'], ['도감', 'dex'], ['장식', 'decos'], ['주문', 'orders'], ['선물', 'gifts']].filter(([, k]) => r.scoreParts[k]).map(([n, k]) => `${n} ${r.scoreParts[k]}`).join(' · ')}</small></div>` : ''}
          ${recVsHTML(r)}${ri === 0 ? bonusRecHTML() + seasonHintHTML() : ''}
          <div class="rec-chips">
            <span class="rec-chip">${r.best ? `${spriteImg(r.best.type, 'tea', 22, false, FLOWERS[r.best.type].tea)}<span><small>가장 좋은 차</small><b>${FLOWERS[r.best.type].tea} <span class="stars">${starStr(r.best.q)}</span></b></span>` : '<span class="rec-ic">🍵</span><span><small>가장 좋은 차</small><b class="muted">없어요</b></span>'}</span>
            ${r.titleOn && E.TITLES[r.titleOn] ? `<span class="rec-chip">${titleImg(r.titleOn, 22, false)}<span><small>대표 칭호</small><b>${E.TITLES[r.titleOn].name}</b></span></span>` : ''}<span class="rec-chip"><span class="rec-ic">📖</span><span><small>도감</small><b class="data">${r.dex} / ${r.dexTotal || 32}</b></span></span>
          </div>
          <div class="tally">${order.map(k => `<i style="width:${r.counts[k] / total * 100}%;background:${LANDS[k].color}" title="${LANDS[k].name} ${r.counts[k]}칸"></i>`).join('')}</div>
          <div class="rec-lands">${order.map(k => `<span><span class="sw" style="background:${LANDS[k].color}"></span>${LANDS[k].name} <span class="data">${r.counts[k]}</span></span>`).join('')}</div>
          <details class="rec-log"><summary>📜 그해 정원 일지 <span class="muted">${r.log.length}줄</span></summary><div class="logview" style="margin-top:8px;max-height:280px;overflow-y:auto">${logHTML(r.log)}</div></details></div></div>`;
    }).join('') : '<div class="cab-empty"><span>📖</span><div><b>아직 기록이 없어요</b><br><span class="muted">일요일 오전 6시, 쉼달이 시작되면 그해 정원 그림과 땅, 가장 좋은 차가 여기에 남아요</span></div></div>';
  }
  $('#p-dex').innerHTML = `<div class="stack"><div class="sectionhead">${tabs}</div>${body}</div>`;
}
$('#p-dex').addEventListener('click', e => {
  const sg = e.target.closest('button[data-newseason]'); if (sg) return openSeasonStart();   // 🌸 새 철 (P28-08-05) — data-season은 <html>의 계절 배경색이라 다른 이름
  const t = e.target.closest('[data-dt]'); if (t) { ui.dexTab = t.dataset.dt; return renderDex(true); }
  const yb = e.target.closest('[data-yb]'); if (yb) { ui.yearBar = yb.dataset.yb; return renderDex(true); }
  const yn = e.target.closest('[data-ynav]'); if (yn) { ui.yearEnd = +yn.dataset.ynav >= (st.yearLog || []).length - 1 ? null : +yn.dataset.ynav; return renderDex(true); }   // 가장 최근까지 오면 다시 '최근' (새해가 생기면 따라감)
  const fd = e.target.closest('details.fold > summary'); if (fd) { const d = fd.parentElement; ui.fold[d.dataset.fold] = !d.open; return; }   // 펼침 상태 기억
  const es = e.target.closest('[data-es]'); if (es) { ui.econSort = es.dataset.es; return renderDex(true); }
  const dc = e.target.closest('[data-dc]'); if (dc) { ui.dexCat = dc.dataset.dc; return renderDex(true); }
  const ml = e.target.closest('[data-mail]'); if (ml) { const b = E.mailOf(st, ml.dataset.mail); return b && openMail(b); }
  const lt = e.target.closest('[data-letter]'); if (lt) return openLetter(E.letterOf(st, lt.dataset.letter) || { k: lt.dataset.letter }, false);
  const gf = e.target.closest('[data-gofarm]'); if (gf) return setTab('farm');   // 🌟 손길 점은 🐝 곤충농장에서 (10-30)
  const bn = e.target.closest('[data-bonus]'); if (bn) { return after(E.bonusSet(st, bn.dataset.bonus, +bn.dataset.lv)); }   // 🌟 손길 점 고르기 (P28-05-02-03) — 다른 단추와 같은 알림 줄 (모자라면 경고)
  const bg = e.target.closest('[data-bgo]'); if (bg) { ui.dexTab = 'journal'; renderDex(true); const el = $('#jBonus'); return el && el.scrollIntoView({ block: 'start' }); }   // 기록 카드 → 도감일지 손길 점 칸
  const qg = e.target.closest('[data-qgo]'); if (qg) return setTab(qg.dataset.qgo);
  const to = e.target.closest('[data-ttlon]'); if (to) return after(E.setTitleOn(st, to.dataset.ttlon || null));
  const c = e.target.closest('[data-dex]'); if (c) openDexDetail(c.dataset.dex, c.dataset.key);
});
function openDexDetail(kind, k) {
  if (kind === 'blend') {                              // 🫖 블렌드: 재료와 가장 좋았던 품질
    const B = E.BLENDS[k], q = st.dex.blend[k];
    return openModal(B.name, `<div class="stack">
      <div class="dexart"><div class="beq" role="img" aria-label="${B.parts.map(p => `말린 ${FLOWERS[p].name} 꽃잎`).join(' 더하기 ')}은 ${B.name}">
        ${B.parts.map(p => `<span class="beq-i">${spriteImg(p, 'dried', 48, false, '')}<small>말린 ${FLOWERS[p].name}</small></span>`).join('<span class="beq-op">+</span>')}
        <span class="beq-op">=</span><span class="beq-i out">${spriteImg(B.parts[0], 'tea', 64, false, '')}<small>${B.name}</small><em class="beq-x">×1.5</em></span>
      </div></div>
      <div class="row"><b>${B.name}</b><span class="chip">블렌드</span>${q != null ? `<span class="stars">${starStr(q)}</span>` : ''}</div>
      ${B.story ? `<p class="note">${B.original ? '🌱' : '🍵'} ${B.story}</p>` : ''}
      <p class="note">🌿 제다실 🫖 블렌딩에서 언제든 만들어요. 값은 재료 차 값을 더한 것의 <b class="val-up">×1.5</b> (레시피에 없는 블렌드는 ×1.2)</p></div>`, [{ label: '닫기', act: closeModal }]);
  }
  if (kind === 'land') {
    const L = LANDS[k], makers = FLOWER_KEYS.filter(f => homeLand(FLOWERS[f]) === k).map(f => FLOWERS[f].name);
    const desc = { barren: '꽃의 영향이 닿지 않은 땅이에요. 모든 정원은 여기서 시작해요.', mossy: '서늘하고 습한 경계에서 생겨요. 추운 땅의 꽃과 물가의 꽃을 가까이 심어 보세요.', wetland: '연못의 물기가 약하게 퍼지는 가장자리에서 생겨요.', dryfield: '꽃의 영향이 막 닿기 시작한 마른 땅이나, 서로 다른 땅 사이에서 생겨요.' }[k];
    return openModal(L.name, `<div class="stack"><div class="row"><span class="sw" style="background:${L.color};width:20px;height:20px"></span><b>${L.name}</b></div>
      <p class="note">${desc || `${makers.join(', ')}이(가) 만드는 땅이에요.`}</p>${makers.length ? `<p class="note">만드는 꽃: ${makers.join(', ')}</p>` : ''}</div>`, [{ label: '닫기', act: closeModal }]);
  }
  // 씨앗·묘목 · 꽃 · 꽃잎 · 차: 한 꽃의 흐름을 한 창에 (누른 것을 크게, 아래 네 단계는 눌러서 바꿔 보기)
  const F = FLOWERS[k], best = st.dex.tea[k];
  const steps = [['form', `${F.name} ${FORM[F.form].name}`, !!st.dex.form[k]], ['flower', F.name, !!st.dex.flower[k]], ['petal', `${F.name} 꽃잎`, !!(st.dex.petal || {})[k]], ['teabag', `${F.name} 티백`, !!(st.dex.teabag || {})[k]], ['tea', F.tea, best != null]];
  const cur = steps.find(x => x[0] === kind) || steps[1];
  openModal(cur[1], `<div class="stack">
    <div class="dexart">${spriteImg(k, cur[0], 112, false, cur[1])}</div>
    <div class="dex-chain">${steps.map(([kd, nm, on], i) => `${i ? '<span class="dc-arrow">›</span>' : ''}<button type="button" class="dc-step ${kd === cur[0] ? 'on' : ''} ${on ? '' : 'locked'}" ${on ? `data-dk="${kd}"` : 'disabled'} title="${on ? nm : '아직 몰라요'}">${spriteImg(k, kd, 36, !on, on ? nm : '')}<small>${on ? ['씨앗·묘목', '꽃', '꽃잎', '티백', '차'][i] : '???'}</small></button>`).join('')}</div>
    <div class="row"><b>${F.name}</b><span class="chip">${LIFE[F.life]}</span><span class="chip">${FORM[F.form].name}</span></div>
    <p style="margin:0">${F.story}</p>
    ${flowerStrip(F, E.calendar(st.virtual).idx)}
    <div class="gauges">${envGauges(F, null)}</div>
    <dl class="kv">
      <dt>다 자라기까지</dt><dd>${F.mature}달</dd>
      <dt>만드는 땅</dt><dd>${LANDS[homeLand(F)].name}</dd><dt>번식</dt><dd>${F.prop}</dd>
      ${best != null ? `<dt>가장 좋은 ${F.tea}</dt><dd>${qLabel(best)}</dd>` : ''}
    </dl></div>`, [{ label: '닫기', act: closeModal }]);
  $('#modalRoot').querySelectorAll('[data-dk]').forEach(b => b.onclick = () => openDexDetail(b.dataset.dk, k));
}

// ---------------------------------------------------------------- 창
// ✉️ 답장 편지 창 (P26-06): 막 온 편지(fresh)는 답례품이 어디 있는지, 도감에서 다시 읽을 땐 그때 받은 답례품을 함께
function openLetter(b, fresh) {
  const L = b.k ? E.LETTERS[b.k] : null, G = E.GIFTS[b.gift];
  const text = L ? L.text : `${josa(G ? G.name : '선물', '을/를')} 잘 받았어요. 정말 고마워요.`, from = L ? L.from : '이웃';
  const gift = b.re ? `<p class="letter-gift">🎁 ${fresh ? '답례품' : '그때 받은 답례품'}: <b>${esc(E.returnText(b.re))}</b>${fresh ? ` · ${E.RETURN_WHERE[b.re.cat]}에 넣었어요` : ''}</p>` : '';
  // P22-05 꽃집 할머니의 첫 편지: 꾸러미 내용 · 막 왔으면 제다실로 바로
  const pack = b.pack ? `<p class="letter-gift">🎁 ${fresh ? '꾸러미' : '그때 받은 꾸러미'}: <b>${esc(E.starterText(b.pack))}</b>${fresh ? ' · 말린 꽃잎은 🌿 제다실, 티백은 🍵 찻집에 있어요' : ''}</p>` : '';
  const btns = fresh && b.pack ? [{ label: '닫기', act: () => closeModal() }, { label: '🌿 제다실로', primary: true, act: () => { closeModal(); setTab('tearoom'); } }] : [{ label: '닫기', act: () => closeModal() }];
  openModal(`✉️ ${from}${fresh ? (L && L.welcome ? '의 편지' : '의 답장') : ''}`, `<div class="letter-pop"><p>${esc(text)}</p><p class="letter-from">— ${esc(from)}</p></div>${gift}${pack}`, btns);
}
// 📮 운영자 편지 창 (P29-06): 선물 줄 + 🎁 받기. 받으면 그 자리에 "창고에 넣었어요" 한 줄 (done)
function openMail(b, done) {
  const M = b.mail, gifts = M.gifts || [];
  const line = !gifts.length ? '' : `<p class="letter-gift">🎁 ${b.took ? '받은 선물' : '선물'}: <b>${esc(E.mailGiftText(gifts))}</b>${done ? ` · <b>${esc(done.replace(/^🎁 /, ''))}</b>` : ''}</p>`;
  const btns = [{ label: '닫기', act: () => closeModal() }];
  if (!b.took) btns.push({ label: '🎁 받기', primary: true, act: () => {
    const r = E.mailTake(st, M.id, ctx);
    if (r.ok) st.actAt = Date.now();
    save(); renderAll(true);
    if (!r.ok) { closeModal(); return feedback(r.msg, true); }
    openMail(b, r.msg);
  } });
  openModal(`📮 ${M.from}`, `<div class="letter-pop"><p><b>${esc(M.title)}</b></p><p>${esc(M.text)}</p><p class="letter-from">— ${esc(M.from)}</p></div>${line}`, btns);
}
function showLetters() {                           // 받은 편지함에서 아직 안 띄운 편지를 하나씩 (다른 창이 닫히면 그다음에)
  if ($('#modalRoot').innerHTML || !st.onboarded) return;
  const b = (st.letterBox || []).find(x => !x.read); if (!b) return;
  b.read = true; if (b.mail) openMail(b); else openLetter(b, true); save();
}
function openModal(title, html, buttons) {
  ui.onDismiss = null;                            // 닫기(✕ · 바깥 · Esc)에 할 일은 창마다 새로 (QA 15회차)
  $('#modalRoot').innerHTML = `<div class="overlay" data-close="1"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header><h2>${esc(title)}</h2><button type="button" class="iconbtn" data-close="1" aria-label="닫기">✕</button></header>
    <div class="content">${html}</div>
    <footer>${(buttons || []).map((b, i) => `<button type="button" class="btn ${b.primary ? 'primary' : ''}" data-mb="${i}">${esc(b.label)}</button>`).join('')}</footer></div></div>`;
  const root = $('#modalRoot');
  root.onclick = e => {
    if (e.target.dataset.close) return dismissModal();
    const b = e.target.closest('[data-mb]'); if (b) buttons[+b.dataset.mb].act();
  };
  const first = root.querySelector('[data-mb]:last-child') || root.querySelector('[data-close]');
  if (first) first.focus();
}
function dismissModal() { const f = ui.onDismiss; ui.onDismiss = null; closeModal(); if (f) f(); }
function closeModal() {
  if (ui.gearShow) ui.gearShow.until = performance.now() + 3000;   // P27 장치 범위는 창을 닫은 뒤 3초
  $('#modalRoot').innerHTML = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modalRoot').innerHTML) dismissModal(); });

// 📜 이벤트 로그 (P11-02-04)
// 일지 한 줄마다 알림 종류 아이콘 (P11-01 번호)
const LOG_IC = { 17: '✉️', 1: '🌰', 3: '📦', 4: '💐', 7: '📖', 8: '🌸', 9: '📖', 10: '🌱', 11: '🎁', 12: '🍂', 13: '☕', 14: '🍯', 15: '💌', 16: '🪣', 18: '🧺', 19: '🌿' };   // 19: P30-02 숲 바람
// 일지 묶음 (거르기 단추와 아이콘 바탕색): 꽃 · 배송 · 도감 · 그 밖
const LOG_KIND = { 8: 'bloom', 3: 'ship', 4: 'ship', 7: 'book', 9: 'book', 1: 'etc', 10: 'etc', 11: 'etc', 12: 'bloom', 13: 'etc', 14: 'bloom', 15: 'etc', 16: 'etc', 17: 'etc', 18: 'bloom', 19: 'etc' };
const LOG_KINDS = [['all', '전체'], ['bloom', '🌸 개화·수확'], ['ship', '📦 배송·예약'], ['book', '📖 도감·기록'], ['etc', '🌱 그 밖']];
function logHTML(log, kind) {
  const list = kind && kind !== 'all' ? log.filter(l => (LOG_KIND[l.type] || 'etc') === kind) : log;
  if (!list.length) return `<div class="log-empty">${log.length ? '이 묶음에는 아직 생긴 일이 없어요.' : '아직 정원에 생긴 일이 없어요.'}</div>`;
  let out = '', last = '';
  for (const l of list) {
    const k = l.y + '|' + l.m;
    if (k !== last) { out += `<div class="sep"><span>${l.y < 1 ? '첫 해 전' : `${l.y}년차`} ${monthName(l.m)}</span></div>`; last = k; }   // 0년차 = 꽃잠에 시작한 준비 기간 (P04-05)   // 달이 바뀌는 구분선
    out += `<div class="line k-${LOG_KIND[l.type] || 'etc'}"><span class="li">${LOG_IC[l.type] || '·'}</span><span class="lt">${esc(l.text)}</span><span class="d">${l.d}일</span></div>`;
  }
  return out;
}
// 정원 일지: ⚙️ 설정 맨 위(10-30 — 전엔 정원 상태창 아래), 새 일이 생기면 맨 아래(최근)가 보이게. 접혀 있어도 가장 최근 일 한 줄은 보임
function renderGardenLog(force) {
  const kind = ui.logKind || 'all', sig = st.log.length + '|' + (st.log.length && st.log[st.log.length - 1].text) + '|' + kind;
  if (!force && ui.sigs.glog === sig) return;
  ui.sigs.glog = sig;
  const lastL = st.log[st.log.length - 1];
  $('#logCount').textContent = st.log.length ? `${st.log.length}줄` : '비어 있어요';
  $('#logLatest').innerHTML = lastL ? `최근 · ${LOG_IC[lastL.type] || ''} ${esc(lastL.text)} <span class="data">(${monthName(lastL.m)} ${lastL.d}일)</span>` : '올해 정원에서 생긴 일 · 쉼달에 한 해 기록으로 옮겨져요';
  const have = new Set(st.log.map(l => LOG_KIND[l.type] || 'etc'));
  $('#logFilter').innerHTML = st.log.length ? LOG_KINDS.filter(([k]) => k === 'all' || have.has(k)).map(([k, nm]) => `<button type="button" data-logk="${k}" aria-pressed="${kind === k}">${nm}</button>`).join('') : '';
  const lv = $('#logView'); lv.innerHTML = logHTML(st.log, kind); lv.scrollTop = lv.scrollHeight;
}
$('#logFilter').addEventListener('click', e => { const b = e.target.closest('[data-logk]'); if (!b) return; ui.logKind = b.dataset.logk; renderGardenLog(true); });
function openLog() {                                  // 알림을 누르면 정원의 일지를 펼쳐서 보여 줌
  if (ui.tab !== 'settings') setTab('settings');   // 10-30: 일지는 ⚙️ 설정 안
  const d = $('#gardenLog'); d.open = true; renderGardenLog(true);
  d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ⚙️ 설정 (P11-03, P11-02-03)
let resetArmed = false;
