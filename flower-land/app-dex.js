// 도리의 정원 — 화면: 📖 도감·기록 · 창 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 📖 도감·기록 (P08, P04-02)
function renderDex(force) {
  const sig = JSON.stringify([ui.dexTab, ui.dexCat, ui.fold, st.dex, st.journal, st.titles, st.titleOn, E.calendar(st.virtual).idx, st.records.length, st.records[0] && !!st.records[0].snapshot]);
  if (!force && ui.sigs.dex === sig) return;
  ui.sigs.dex = sig;
  const n = E.dexCount(st);
  const tab = (k, label) => `<button type="button" data-dt="${k}" aria-pressed="${ui.dexTab === k}">${label}</button>`;
  const tabs = `<span class="seg" id="dexTabs">${tab('journal', '📔 도감일지')}${tab('rec', '기록')}${tab('dex', '도감')}</span>`;   // 순서: 도감일지 > 기록 > 도감 (10-17)
  let body;
  if (ui.dexTab === 'dex') {
    // 모은 카드는 작은 설명, 못 모은 카드는 "어떻게 모으는지" 힌트
    const card = (kind, k, on, art, name, sub, pc, cls) => `<button type="button" class="dexcard ${cls || ''} ${on ? '' : 'locked'}" style="--pc:${pc}" ${on ? `data-dex="${kind}" data-key="${k}"` : 'tabindex="-1" aria-disabled="true"'}><span class="dc-art">${art}</span><span class="dc-name">${on ? name : '???'}</span><span class="dc-sub">${sub}</span></button>`;
    const nf = Object.keys(st.dex.flower).length, nt = Object.keys(st.dex.tea).length, nl = Object.keys(st.dex.land).length;
    const nfo = Object.keys(st.dex.form || {}).length, ntb = Object.keys(st.dex.teabag || {}).length, np = Object.keys(st.dex.petal || {}).length, nb = Object.keys(st.dex.blend || {}).length;
    // 단순하게: 줄 제목에 모은 수만, 카드는 그림 · 이름 (차는 ★), 못 모은 카드만 힌트
    const head = (ic, title, got, total) => `<div class="cab-head dex-head"><span class="sb-title">${ic} ${title}</span><span class="dh-count data">${got} / ${total}</span></div>`;
    const makers = k => FLOWER_KEYS.filter(f => homeLand(FLOWERS[f]) === k);
    // 종류 칩: 전체 또는 한 종류만 보기 (긴 화면을 짧게)
    const cats = [
      { key: 'form', ic: '🌰', title: '씨앗·묘목', got: nfo, total: FLOWER_KEYS.length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!st.dex.form[k], nm = `${F.name} ${FORM[F.form].name}`; return card('form', k, on, spriteImg(k, 'form', 56, !on, on ? nm : '아직 모르는 씨앗·묘목'), nm, on ? '' : `화원 ${sowText(F)}`, F.petal); }).join('')}</div>` },
      { key: 'flower', ic: '🌸', title: '꽃', got: nf, total: FLOWER_KEYS.length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!st.dex.flower[k]; return card('flower', k, on, spriteImg(k, 'flower', 56, !on, on ? F.name : '아직 모르는 꽃'), F.name, on ? '' : `화원 ${sowText(F)}`, F.petal); }).join('')}</div>` },
      { key: 'petal', ic: '🍂', title: '꽃잎', got: np, total: FLOWER_KEYS.length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!st.dex.petal[k]; return card('petal', k, on, spriteImg(k, 'petal', 52, !on, on ? `${F.name} 꽃잎` : '아직 모르는 꽃잎'), `${F.name} 꽃잎`, on ? '' : (st.dex.flower[k] ? '피면 거둬요' : '처음 거둘 때'), F.petal); }).join('')}</div>` },
      { key: 'teabag', ic: '🏷️', title: '티백', got: ntb + Object.keys(st.dex.bagBlend || {}).length, total: FLOWER_KEYS.length + E.blendKeys(st).length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], on = !!(st.dex.teabag || {})[k], nm = `${F.name} 티백`; return card('teabag', k, on, spriteImg(k, 'teabag', 52, !on, on ? nm : '아직 모르는 티백'), nm, on ? '' : ((st.dex.petal || {})[k] ? '제다실에서 꽃잎으로' : '꽃잎을 티백으로'), F.petal); }).join('')}</div><div class="dexgrid big dex-blends">${E.blendKeys(st).map(k => { const B = E.BLENDS[k], on = !!(st.dex.bagBlend || {})[k], nm = `${B.name} 티백`; return card('blend', k, on, spriteImg(B.parts[0], 'teabag', 52, !on, on ? nm : '아직 모르는 블렌드 티백'), nm, on ? '' : (st.dex.blend[k] != null ? '블렌드를 티백으로' : '블렌딩 → 티백'), SPR.tea[B.parts[0]] || FLOWERS[B.parts[0]].petal, 'blend'); }).join('')}</div>` },
      { key: 'tea', ic: '🍵', title: '차', got: nt + nb, total: FLOWER_KEYS.length + E.blendKeys(st).length, grid: `<div class="dexgrid big">${FLOWER_KEYS.map(k => { const F = FLOWERS[k], q = st.dex.tea[k], on = q != null; return card('tea', k, on, spriteImg(k, 'tea', 56, !on, on ? F.tea : '아직 모르는 차'), F.tea, on ? `<span class="stars">${starStr(q)}</span>` : ((st.dex.teabag || {})[k] ? '찻집에서 우려 팔면' : '티백을 찻집에서'), SPR.tea[k] || F.petal); }).join('')}</div><div class="dexgrid big dex-blends">${E.blendKeys(st).map(k => { const B = E.BLENDS[k], q = st.dex.blend[k], on = q != null, known = B.parts.every(p => st.dex.petal[p]); return card('blend', k, on, spriteImg(B.parts[0], 'tea', 52, !on, on ? B.name : '아직 모르는 블렌드'), B.name, on ? `<span class="stars">${starStr(q)}</span>` : (known ? B.parts.map(p => FLOWERS[p].name).join(' + ') : '제다실에서 섞어 봐요'), SPR.tea[B.parts[0]] || FLOWERS[B.parts[0]].petal, 'blend'); }).join('')}</div>` },
      { key: 'deco', ic: '🪴', title: '꾸밈', got: E.decoCount(st), total: E.decoTotal(), grid: `<div class="dexgrid big">${[...E.DECO_KEYS, ...E.TITLE_KEYS.map(k => 't:' + k)].map(k => { const on = !!(st.dex.deco || {})[k], info = E.decoInfo(k);
        return `<div class="dexcard ${on ? '' : 'locked'}" style="--pc:#9a8f7a"><span class="dc-art">${on ? decoImg(k, info.title ? 2 : 3) : '<span class="dc-q">?</span>'}</span><span class="dc-name">${on ? esc(info.name) : '???'}</span><span class="dc-sub">${on ? '' : info.title ? '칭호를 얻으면' : info.craft ? '⛏️ 광산에서 만들기' : `화원 ${E.decoMonths(k).map(monthName).join('·')}`}</span></div>`; }).join('')}</div>` },
      { key: 'honey', ic: '🍯', title: '꿀', got: E.honeyCount(st), total: E.HONEY_KEYS.length, grid: `<div class="dexgrid big">${E.HONEY_KEYS.map(k => { const on = !!(st.dex.honey || {})[k];
        return `<div class="dexcard ${on ? '' : 'locked'}" style="--pc:#d99a2b"><span class="dc-art">${on ? honeyImg(k, 3) : '<span class="dc-q">?</span>'}</span><span class="dc-name">${on ? E.honeyName(k) : '???'}</span><span class="dc-sub">${on ? '' : k === 'wild' ? '여러 꽃이 고루 피면' : st.dex.flower[k] ? `벌통 둘레에 ${FLOWERS[k].name}` : '벌통 둘레에 핀 꽃'}</span></div>`; }).join('')}</div>` },
      { key: 'memento', ic: '💌', title: '기념품', got: E.mementoCount(st), total: E.MEMENTO_KEYS.length, grid: `<div class="dexgrid big">${E.MEMENTO_KEYS.map(k => { const on = !!(st.dex.memento || {})[k], M = E.MEMENTOS[k];
        return `<div class="dexcard ${on ? '' : 'locked'}" style="--pc:#c8a2b0"><span class="dc-art"><span class="dc-memo">${on ? M.ic : '?'}</span></span><span class="dc-name">${on ? M.name : '???'}</span><span class="dc-sub">${on ? '' : '손님 주문을 들어주면'}</span></div>`; }).join('')}</div>` },
      { key: 'mine', ic: '⛏️', title: '광산', got: E.mineCount(st), total: E.MINE_DEX_KEYS.length, grid: `<div class="dexgrid big">${E.MINE_DEX_KEYS.map(k => { const on = !!(st.dex.mine || {})[k], from = E.ORES[k] ? E.ORES[k].from : E.FOSSILS[k] ? E.FOSSILS[k].from : 8;
        return `<div class="dexcard ${on ? '' : 'locked'}" style="--pc:#8d8a80"><span class="dc-art">${on ? mineImg(k, 3) : '<span class="dc-q">?</span>'}</span><span class="dc-name">${on ? E.mineName(k) : '???'}</span><span class="dc-sub">${on ? '' : `광산 ${from}층부터`}</span></div>`; }).join('')}</div>` },
      { key: 'land', ic: '🟫', title: '땅', got: nl, total: 10, grid: `<div class="dexgrid big">${LAND_KEYS.map(k => { const L = LANDS[k], on = !!st.dex.land[k], mk = makers(k); return card('land', k, on, `<span class="dc-land" style="background-color:${on ? L.color : 'var(--line)'}"></span>`, L.name, on ? '' : (mk.some(f => st.dex.flower[f]) ? `${FLOWERS[mk.find(f => st.dex.flower[f])].name}의 땅` : mk.length ? '어떤 꽃의 땅일까요' : '꽃과 꽃 사이에서'), L.color); }).join('')}</div>` },
    ];
    const cat = cats.some(c => c.key === ui.dexCat) ? ui.dexCat : 'all';
    const chip = (key, label, got, total) => `<button type="button" class="dexchip ${got >= total ? 'done' : ''}" data-dc="${key}" aria-pressed="${cat === key}"><span>${label}</span><span class="data">${got} / ${total}</span><i style="--p:${Math.round(got / total * 100)}%"></i></button>`;
    body = `<div class="dexchips" role="group" aria-label="도감 종류">${chip('all', '전체', n, E.dexTotal(st))}${cats.map(c => chip(c.key, `${c.ic} ${c.title}`, c.got, c.total)).join('')}</div>
      ${cats.filter(c => cat === 'all' || c.key === cat).map(c => `${cat === 'all' ? head(c.ic, c.title, c.got, c.total) : ''}${foldGrid('dex-' + c.key, c.grid)}`).join('')}`;   // 못 모은 칸은 접어 둠 (10-17)
  } else if (ui.dexTab === 'journal') {
    body = journalHTML();
  } else {
    body = st.records.length ? st.records.map(r => {
      const total = W * H, order = LAND_KEYS.filter(k => r.counts[k]).sort((a, b) => (a === 'barren') - (b === 'barren') || r.counts[b] - r.counts[a]);
      // 한 해 카드: 왼쪽 그해 정원 그림 (없으면 점선 자리) · 오른쪽 제목과 두 칩(가장 좋은 차 · 도감) · 땅 막대 · 일지
      const land = order.filter(k => k !== 'barren').length;
      return `<div class="card record">
        <div class="rec-art">${r.snapshot ? `<img src="${r.snapshot}" alt="${r.year}년차 쉼달 아침의 정원">` : '<div class="rec-noimg"><span>🖼️</span>이 해는 정원 그림이 없어요</div>'}</div>
        <div class="stack" style="gap:10px">
          <div class="rec-head"><h3>${r.year}년차 정원</h3><span class="muted">땅 ${land}가지</span></div>
          ${r.score != null ? `<div class="rec-score"><b>🏅 정원 점수 ${r.score}점</b><small>${r.prevBest ? (r.score > r.prevBest ? `최고 기록 · 전 최고보다 +${r.score - r.prevBest}` : `최고 ${r.prevBest}점`) : '첫 기록'}</small><small class="rec-parts">${[['땅', 'lands'], ['꽃', 'flowers'], ['핀 꽃', 'bloom'], ['블렌드', 'blend'], ['꿀', 'honey'], ['도감', 'dex'], ['장식', 'decos'], ['주문', 'orders']].filter(([, k]) => r.scoreParts[k]).map(([n, k]) => `${n} ${r.scoreParts[k]}`).join(' · ')}</small></div>` : ''}
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
  const t = e.target.closest('[data-dt]'); if (t) { ui.dexTab = t.dataset.dt; return renderDex(true); }
  const fd = e.target.closest('details.fold > summary'); if (fd) { const d = fd.parentElement; ui.fold[d.dataset.fold] = !d.open; return; }   // 펼침 상태 기억
  const dc = e.target.closest('[data-dc]'); if (dc) { ui.dexCat = dc.dataset.dc; return renderDex(true); }
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
function openModal(title, html, buttons) {
  $('#modalRoot').innerHTML = `<div class="overlay" data-close="1"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header><h2>${esc(title)}</h2><button type="button" class="iconbtn" data-close="1" aria-label="닫기">✕</button></header>
    <div class="content">${html}</div>
    <footer>${(buttons || []).map((b, i) => `<button type="button" class="btn ${b.primary ? 'primary' : ''}" data-mb="${i}">${esc(b.label)}</button>`).join('')}</footer></div></div>`;
  const root = $('#modalRoot');
  root.onclick = e => {
    if (e.target.dataset.close) return closeModal();
    const b = e.target.closest('[data-mb]'); if (b) buttons[+b.dataset.mb].act();
  };
  const first = root.querySelector('[data-mb]:last-child') || root.querySelector('[data-close]');
  if (first) first.focus();
}
function closeModal() { $('#modalRoot').innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modalRoot').innerHTML) closeModal(); });

// 📜 이벤트 로그 (P11-02-04)
// 일지 한 줄마다 알림 종류 아이콘 (P11-01 번호)
const LOG_IC = { 1: '🌰', 3: '📦', 4: '💐', 7: '📖', 8: '🌸', 9: '📖', 10: '🌱', 11: '🎁', 12: '🍂', 13: '☕', 14: '🍯', 15: '💌', 16: '🪣' };
// 일지 묶음 (거르기 단추와 아이콘 바탕색): 꽃 · 배송 · 도감 · 그 밖
const LOG_KIND = { 8: 'bloom', 3: 'ship', 4: 'ship', 7: 'book', 9: 'book', 1: 'etc', 10: 'etc', 11: 'etc', 12: 'bloom', 13: 'etc', 14: 'bloom', 15: 'etc', 16: 'etc' };
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
// 정원 일지: 정원 상태창 아래, 새 일이 생기면 맨 아래(최근)가 보이게. 접혀 있어도 가장 최근 일 한 줄은 보임
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
  if (ui.tab !== 'garden') setTab('garden');
  const d = $('#gardenLog'); d.open = true; renderGardenLog(true);
  d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ⚙️ 설정 (P11-03, P11-02-03)
let resetArmed = false;
