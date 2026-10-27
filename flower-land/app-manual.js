// 도리의 정원 — 화면: 📘 매뉴얼 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 📘 매뉴얼 (P21, 10-17): 글보다 도트 그림. 카드마다 그림 하나 + 한 줄
const MN_SECS = [['year', '🗓️ 한 해'], ['land', '🟫 땅'], ['flower', '🌸 꽃'], ['care', '🧤 돌보기'], ['shop', '💐 화원'], ['tea', '🍵 찻집'], ['blend', '🫖 블렌드'], ['sleep', '🌙 꽃잠'], ['deco', '🪴 꾸미기'], ['mine', '⛏️ 광산'], ['guest', '💌 주문'], ['journal', '📜 도감일지'], ['save', '💾 저장']];
function renderManual(force) {
  const cal = E.calendar(st.virtual), mf = FLOWERS[ui.mnFlower] ? ui.mnFlower : 'chamomile', F = FLOWERS[mf];
  const sig = JSON.stringify([mf, cal.idx, Object.keys(st.titles), E.blendKeys(st).length, cloudIn()]);
  if (!force && ui.sigs.manual === sig) return;
  ui.sigs.manual = sig;
  const sec = (k, title, sub, inner) => `<section class="mn-sec" id="mn-${k}"><h2 class="mn-h">${title}${sub ? `<small>${sub}</small>` : ''}</h2>${inner}</section>`;
  const fig = (inner, cap) => `<figure class="mn-fig">${inner}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
  const item = (art, label, sub, cls) => `<span class="mn-item ${cls || ''}">${art}<small>${label ? `<b>${label}</b>` : ''}${sub || ''}</small></span>`;
  const ico = e => `<span class="mn-ico">${e}</span>`;
  const arrow = (s = '›') => `<span class="mn-arrow" aria-hidden="true">${s}</span>`;
  const bar = (n, c, label, fadeFrom) => `<span class="mn-bar" style="--c:${c}">${Array.from({ length: n }, (_, i) => `<i class="${fadeFrom != null && i >= fadeFrom ? 'fade' : 'on'}"></i>`).join('')}<small>${label}</small></span>`;
  const home = LANDS[homeLand(F)];
  const makers = k => FLOWER_KEYS.filter(f => homeLand(FLOWERS[f]) === k);
  const blendKeys = E.blendKeys(st), hiddenBlends = Object.keys(E.BLENDS).filter(k => !blendKeys.includes(k));
  const body = [
    sec('year', '한 주가 한 해예요', '오전 · 오후 6시마다 한 달',
      fig(weekPixel(cal), '월요일 아침 6시가 <b>3월</b> · 토요일 밤이 <b>2월</b> · 일요일은 🌙 <b>꽃잠</b>')
      + `<div class="mn-icons">${item(ico('☀️'), '낮', '06–18시')}${item(ico('🌙'), '밤', '18–06시')}${item(ico('📅'), '한 달', '15일 · 48분')}${item(ico('🎁'), '용돈', '매일 6시 500원')}</div>`),
    sec('land', '꽃이 땅을 만들어요', '사람은 꽃만 돌봐요',
      fig(landPixel(), '처음엔 모두 <b>황무지</b>. 심은 꽃 둘레 2칸이 그 꽃이 좋아하는 땅으로 천천히 바뀌어요')
      + `<div class="mn-lands">${LAND_KEYS.map(k => { const L = LANDS[k], mk = makers(k); return `<span class="mn-land"><span class="sw" style="background:${L.color}">${mk[0] ? spriteImg(mk[0], 'flower', 24, false, '') : ''}</span>${L.name}</span>`; }).join('')}</div>
      <p class="note" style="text-align:center">비료로 품질이 오르면 땅이 더 넓게 바뀌어요 · 옆 꽃과 좋아하는 땅이 너무 다르면 기운이 떨어져요</p>`),
    sec('flower', '꽃 한 포기의 흐름', '꽃을 눌러 바꿔 보세요',
      `<div class="mn-pick" role="group" aria-label="꽃 고르기">${FLOWER_KEYS.map(k => `<button type="button" data-mf="${k}" aria-pressed="${k === mf}" title="${FLOWERS[k].name}">${spriteImg(k, 'flower', 28, false, FLOWERS[k].name)}</button>`).join('')}</div>`
      + fig(`<div class="mn-flow">${item(spriteImg(mf, 'form', 44, false, ''), FORM[F.form].name, `1${FORM[F.form].unit}`)}${arrow()}${item(spriteImg(mf, 'flower', 44, false, ''), F.name, LIFE[F.life])}${arrow()}${item(spriteImg(mf, 'petal', 44, false, ''), '꽃잎', '🧺 수확')}${arrow()}${item(spriteImg(mf, 'dried', 44, false, ''), '말린 꽃잎', '🌾 1달')}${arrow()}${item(spriteImg(mf, 'teabag', 44, false, ''), '티백', '🏷️ 제다실')}${arrow()}${item(spriteImg(mf, 'tea', 52, false, ''), F.tea, `${won(F.teaBase)}~`)}</div>`,
        `<b>${F.name}</b> · ${F.story}`)
      + flowerStrip(F, cal.idx)
      + `<div class="mn-icons">${item(`<span class="mn-ico" style="background:${home.color}"></span>`, home.name, '좋아하는 땅')}${item(ico('🌡️'), `${F.t}°C`, '온도')}${item(ico('💧'), `${F.m}%`, '습도')}${item(ico('🌱'), F.prop, F.propMonths.length ? monthsText(F.propMonths) : '씨앗이 생겨요')}${F.prune ? item(ico('✂️'), '가지치기', '품질 ↑') : ''}</div>`),
    sec('care', '돌보기', '하루에 한 번이면 충분해요',
      `<div class="mn-fig"><div class="mn-care">
        ${ico('💧')}<span class="nm">물 주기<small>물병 1개 · 50원</small></span>${bar(2, '#4788b5', '2달 괜찮아요')}
        ${ico('🌿')}<span class="nm">잡초 뽑기<small>호미 10번 · 400원</small></span>${bar(2, '#3f7f4a', '2달 · 뽑으면 비료')}
        ${ico('✂️')}<span class="nm">가지치기<small>가위 5번 · 500원 · 나무와 덤불만</small></span>${bar(1, '#a8652a', '1달 품질 ↑')}
        ${ico('🌱')}<span class="nm">비료 주기<small>비료 1개 · 150원</small></span>${bar(1, '#8a6a44', '1달 품질 ↑ · 땅 넓어짐')}
        ${ico('🧺')}<span class="nm">수확<small>바구니 10번 · 500원</small></span>${bar(1, '#f2c230', '개화 중 달마다 · 꽃잠 한 번')}
      </div><figcaption>꽃을 누르면 둘레에 단추가 떠요 · 도구가 없으면 흐린 단추를 눌러 바로 사요 · 돌보지 않아도 꽃은 죽지 않아요</figcaption></div>`),
    sec('shop', '화원과 창고', '심는 달에만 팔아요',
      fig(`<div class="mn-flow">${item(spriteImg('chamomile', 'form', 44, false, ''), '씨앗', '봉지 · 발아율')}${item(spriteImg('lavender', 'form', 44, false, ''), '묘목', '그루 · 뿌리내림')}${item(spriteImg('gamguk', 'form', 44, false, ''), '모종', '포기 · 뿌리내림')}${item(spriteImg('lotus', 'form', 44, false, ''), '연근', '뿌리 · 뿌리내림')}${item(spriteImg('dongbaek', 'form', 44, false, ''), '나무', '그루 · 뿌리내림')}</div>`,
        '산 것은 📦 <b>창고</b>로 와요 · 창고에서도 품질이 한 달에 5%씩 떨어져요')
      + fig(`<div class="mn-flow"><span class="mn-item"><span class="mn-stars">★★★★☆</span><small><b>72%</b>★ 하나 = 20%</small></span>${bar(12, 'var(--good)', '유효기간 12달')}${bar(8, 'var(--good)', '발아율 ↓', 0)}${arrow('›')}${item(ico('🌱'), '비료 1개', '0%가 되면')}</div>`,
        '품질 0%여도 발아율이 남으면 심을 수 있어요 · 싹이 안 튼 씨앗도 🌱 비료가 돼요')
      + `<div class="mn-icons">${item(ico('🗓️'), '예약', '꽃잠에 · 10% 할인')}${item(ico('📦'), '배송', '심는 날 아침 6시')}${item(ico('3'), '한 종류 3개', '예약 한도')}${item(ico('↔️'), '옮겨심기', '심는 달 · 휴면기 · 꽃잠')}</div>`),
    sec('tea', '찻집', '겨울부터 꽃잠까지 열어요',
      fig(monthStrip([['🍵', '찻집', [12, 1, 2, 13, 14], 'var(--accent)'], ['🗓️', '예약', [13, 14], 'var(--rest)']], cal.idx), '금요일 저녁 6시(12월)에 문을 열고 일요일 꽃잠까지 · 그 전엔 🌿 제다실에서 티백을 만들어 두세요')
      + fig(`<div class="mn-flow">${item(spriteImg(mf, 'teabag', 44, false, ''), '티백', '품질 그대로')}${arrow()}${item(ico('🫖'), '우림', '찻집에서')}${arrow()}${item(spriteImg(mf, 'tea', 52, false, ''), '☕ 갓 우림', '100%')}${arrow()}${item(ico('🧊'), '식은 차', '다음 달 −50%')}${arrow()}${item(ico('💰'), '판매', '1시간마다 손님')}</div>`,
        '🍃 <b>햇차</b>(★5) +10% · 🌸 생화로 바로 만든 티백 −10% · 찻잔은 꽃잠에도 팔려요 · 손님은 먼저 우린 잔부터 사 가요(식은 잔도) — 팔 만큼만 우려요')),
    sec('blend', '블렌드', '말린 꽃잎 2~3장을 섞어요',
      fig(`<div class="mn-blends">${blendKeys.map(k => { const B = E.BLENDS[k]; return `<span class="mn-blend"><span class="eq">${B.parts.map(p => spriteImg(p, 'dried', 24, false, '말린 ' + FLOWERS[p].name)).join('<b>+</b>')}<b>=</b>${spriteImg(B.parts[0], 'tea', 28, false, B.name)}</span><span class="nm">${B.name}</span></span>`; }).join('')}${hiddenBlends.map(() => `<span class="mn-blend locked"><span class="eq">${spriteImg('chamomile', 'dried', 24, true, '')}<b>+</b>${spriteImg('chamomile', 'dried', 24, true, '')}<b>=</b>${spriteImg('chamomile', 'tea', 28, true, '')}</span><span class="nm">숨은 레시피</span></span>`).join('')}</div>`,
        '레시피대로면 두 차 값을 더한 것의 <b>×1.5</b> · 다른 짝은 ×1.2 · 숨은 레시피는 칭호를 얻으면 열려요 · 제다실 레시피를 누르면 재료가 바로 담겨요')),
    sec('sleep', '꽃잠', '일요일, 정원이 쉬어요',
      fig(`<div class="mn-icons">${item(ico('🌱'), '자람', '멈춤', 'off')}${item(ico('🌿'), '잡초 · 목마름', '멈춤', 'off')}${item(ico('📉'), '품질 하락', '멈춤', 'off')}${item(ico('↔️'), '옮겨심기 · 번식', '할 수 있어요')}${item(ico('💧'), '돌보기', '할 수 있어요')}${item(ico('🧺'), '수확', '핀 꽃만 · 한 번')}${item(ico('🗓️'), '예약', '할 수 있어요')}${item(ico('🫖'), '블렌딩', '할 수 있어요')}${item(ico('🍵'), '찻집', '열려 있어요')}${item(ico('📖'), '기록', '한 해를 돌아봐요')}</div>`,
        '심기는 쉬어요 · 꽃잠엔 새로 피지 않고, 2월에 핀 채로 잠든 꽃은 꽃잠에 한 번 거둬요 · 달 상관없이 옮기고 번식해요(새해 몫 한 번) · 꽃방에 넌 꽃잎은 꽃잠 동안 마르지 않아요 · 일요일에 처음 왔다면 그 꽃잠은 <b>0년차</b>, 1년차는 월요일 아침 6시부터')),
    sec('deco', '꾸미기와 꿀', '돈은 보는 즐거움으로',
      fig(`<div class="mn-flow">${item(decoImg('bench', 2), '이달의 장식', '화원 · 달마다 하나')}${arrow()}${item(ico('📦'), '창고', '🪴 놓기')}${arrow()}${item(decoImg('stonelamp', 2), '정원에', '꽃 없는 칸')}</div>`,
        '화원 장식은 그 달에만 들어오고 내년에 다시 와요 · 돌 장식은 ⛏️ 광산에서 언제든 만들어요 · 보통 장식은 땅 · 꽃 · 값에 영향이 없어요 · 칭호를 얻으면 그 <b>문장 장식</b>을 받아요')
      + fig(`<div class="mn-flow">${item(decoImg('hive', 2), '벌통', '6–8월 · 하나만')}${arrow()}${item(spriteImg('lavender', 'flower', 32, false, ''), '둘레 2칸', '핀 꽃')}${arrow()}${item(honeyImg('lavender', 2), '라벤더꿀', '달이 끝날 때')}${arrow()}${item(spriteImg('chamomile', 'tea', 32, false, ''), '🍯 꿀차', '찻잔에 한 숟갈')}</div>`,
        '꽃이 피는 달마다 모여요 · 가장 많이 핀 꽃을 따라 꿀 종류가 정해지고, 여러 꽃이 섞여 절반을 넘는 꽃이 없으면 <b>들꽃꿀</b> · 꽃잠엔 벌도 쉬어요 · 꿀은 팔지 않아요')
      + fig(`<div class="mn-flow">${item(decoImg('barrel', 2), '빗물 통', '6–7월 · 25,000원')}${arrow()}${item(ico('💧'), '바로 옆 8칸', '달마다 저절로 물')}</div>`, '하루쯤 비워도 둘레 꽃이 목마르지 않아요 · 잡초 · 수확은 그대로 직접 해요')
      + fig(`<div class="mn-flow">${item(decoImg('heatmat', 2), '온상 매트', '씨앗 · 새싹 2배')}${item(decoImg('growlight', 2), '생장등', '옆 8칸 1.5배')}${item(decoImg('greenhouse', 2), '유리 온실', '둘레 2칸 2배')}</div>`, '💐 화원 🔆 정원 장치 · 다 자라기까지만 빨라지고, 피는 달 · 품질 · 땅 · 꽃잠은 그대로예요 · 겹치면 가장 빠른 것 하나만')
      + `<div class="mn-icons">${item(ico('🪑'), '손님 자리', '1시간에 더 많이')}${item(ico('☕'), '찻잔 세트', '보기만')}${item(ico('🪧'), '간판', '보기만')}</div><p class="note" style="text-align:center">🍵 찻집 › 🪑 찻집 가꾸기에서 바꿔요</p>`),
    sec('mine', '정원 뒤 광산', '기다리는 동안 조금씩',
      fig(`<div class="mn-flow">${item(ico('⛏️'), '기력 12', '30분마다 1칸')}${arrow()}${item(mineImg('stone', 2), '파기', '한 칸에 1')}${arrow()}${item(mineImg('stairs', 2), '계단', '아래층으로')}${arrow()}${item(mineImg('amber', 2), '깊을수록', '드문 광물')}</div>`,
        '정원 위 ⛏️ 숫자를 눌러 들어가요 · 꺼 둔 동안에도 기력이 차고 꽃잠에도 팔 수 있어요')
      + fig(`<div class="mn-flow">${item(mineImg('dirt', 2), '흙 5', '🌱 비료')}${item(mineImg('stone', 2), '돌', '징검돌 · 물확 · 석등')}${item(mineImg('jade', 2), '비취 2', '청자 찻잔')}${item(mineImg('fossil', 2), '화석', '광산 도감')}</div>`,
        '광산에서 나온 것은 팔지 않아요 · 🔨 만들기로 장식과 찻잔을 돈 없이 만들어요')),
    sec('guest', '손님 주문과 한 해 평가', '오래 하는 정원사에게',
      fig(`<div class="mn-flow">${item(ico('💌'), '주문 쪽지 3장', '찻집이 열린 달마다')}${arrow()}${item(spriteImg('lavender', 'tea', 32, false, ''), '★4 라벤더차', '맞는 찻잔을 팔면')}${arrow()}${item(ico('🎀'), '기념품', '12가지 · 도감')}</div>`,
        '손으로 팔든 손님이 사 가든 맞으면 돼요 · 돈은 더 주지 않아요 · 놓쳐도 다음 달에 새 쪽지')
      + fig(`<div class="mn-icons">${item(ico('🟫'), '땅 가짓수', '×10')}${item(ico('🌸'), '정원의 꽃', '80포기까지')}${item(ico('🌼'), '올해 핀 꽃', '가짓수 ×4')}${item(ico('🫖'), '올해 블렌드', '가짓수 ×3')}${item(ico('🍯'), '올해 꿀', '가짓수 ×2')}${item(ico('🪴'), '놓은 장식', '×3')}${item(ico('💌'), '들어준 주문', '×5')}${item(ico('💐'), '보낸 선물', '×10')}</div>`,
        '쉼달 기록 때 🏅 정원 점수 · 남과 겨루지 않고 내 최고 기록과만 · 250점이 되면 숨은 칭호')
      + fig(`<div class="mn-flow">${item(ico('💐'), '이웃에게 선물', '해마다 종류마다 한 번')}${arrow()}${item(ico('✉️'), '답장 편지', '다음 달 · 12통')}${arrow()}${item(ico('🏅'), '정원 점수', '선물마다 +10')}</div>`,
        '💐 화원 맨 아래에서 꽃다발 · 차 한 상자 · 정원 잔치를 보내요 · 오래 해서 남는 돈을 쓰는 곳이에요')),
    sec('journal', '도감일지와 칭호', '한 장을 끝내면 다음 장이 열려요',
      fig(`<div class="mn-chain">${E.CHAPTERS.map((c, i) => `${i ? arrow('›') : ''}${item(titleImg(c.title, 40, !st.titles[c.title]), `${c.no}장`, c.name)}`).join('')}</div>`,
        `칭호 ${E.TITLE_KEYS.length}개 · ${Object.keys(st.titles).length}개 얻음 · 📖 도감 › 📔 도감일지에서 대표 칭호를 골라 달아요`)
      + `<div class="mn-icons">${item(ico('🌱'), '새싹', '처음 장')}${item(ico('🌸'), '꽃', '가운데 장')}${item(ico('👑'), '정원', '마지막 장')}${item(ico('📚'), `도감 ${E.dexTotal(st)}칸`, '꽃 · 꽃잎 · 티백 · 차 · 땅 · 블렌드')}</div>`),
    sec('save', '저장', '운영자 서버에 보내지 않아요',
      cloudIn()   // 구글 로그인 중엔 파일 저장 대신 드라이브 기준 (P20-02, 10-27)
        ? fig(`<div class="mn-icons">${item(ico('🌐'), '자동 저장', '이 브라우저에')}${arrow('›')}${item(ico('☁️'), '구글 드라이브', '내 드라이브에도')}${item(ico('↩️'), '되돌리기', '바꾸기 직전으로')}</div>`,
          '구글로 로그인해 두어 정원이 내 드라이브에도 저장돼요 · 다른 기기에서 같은 계정으로 로그인하면 이어 해요 · 오래 비워도 다시 열면 최대 3주를 따라잡아요')
        : fig(`<div class="mn-icons">${item(ico('🌐'), '자동 저장', '이 브라우저에')}${item(ico('💾'), '저장하기', '.json 파일로')}${arrow('›')}${item(ico('📂'), '불러오기', '다른 기기에서')}${item(ico('↩️'), '되돌리기', '불러오기 직전으로')}${cloud.on ? item(ico('☁️'), '구글 드라이브', '로그인하면 내 드라이브에') : ''}</div>`,
          '브라우저 데이터를 지우면 정원이 사라질 수 있어요 · ⚙️ 설정 › 💾 저장에서 가끔 파일로 받아 두세요 · 오래 비워도 다시 열면 최대 3주를 따라잡아요')),
  ].join('');
  $('#p-manual').innerHTML = `<div class="stack"><div class="sectionhead"><span class="sb-title" style="font-family:var(--font-display);font-weight:700;font-size:16px">📘 매뉴얼</span><span class="muted">그림으로 보는 정원 규칙</span></div>
    <nav class="mn-chips" aria-label="매뉴얼 차례">${MN_SECS.map(([k, l]) => `<a href="#mn-${k}" data-mn="${k}">${l}</a>`).join('')}</nav>${body}</div>`;
}
$('#p-manual').addEventListener('click', e => {
  const f = e.target.closest('[data-mf]'); if (f) { ui.mnFlower = f.dataset.mf; return renderManual(true); }
  const g = e.target.closest('[data-mn]'); if (g) { e.preventDefault(); const el = $('#mn-' + g.dataset.mn); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});
function openSettings() { setTab('settings'); }
function renderSettings() {
  const s = st.settings, hours = Array.from({ length: 24 }, (_, h) => h);
  const opt = (v, cur) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${String(v).padStart(2, '0')}:00</option>`;
  const tog = (attr, on) => `<input type="checkbox" class="tog" ${attr} ${on ? 'checked' : ''}>`;
  // 한 줄 = 아이콘 · 이름과 설명 · 오른쪽 조작. 줄들을 주제별 카드로 묶음
  const row = (ic, name, desc, ctrl, cls) => `<div class="set-row ${cls || ''}"><span class="sr-ic">${ic}</span><span class="sr-t"><b>${name}</b>${desc ? `<small>${desc}</small>` : ''}</span><span class="sr-c">${ctrl}</span></div>`;
  const group = (ic, title, note, rows, cls) => `<section class="setgroup ${cls || ''}"><div class="cab-head"><span class="sb-title">${ic} ${title}</span><span class="muted">${note}</span></div><div class="setcard2">${rows}</div></section>`;
  const sleepBar = () => {                            // 하루 24시간 막대, 자는 시간만 보라색 (칸 사이 선 없이 한 줄)
    const on = h => s.sleep.from <= s.sleep.to ? h >= s.sleep.from && h < s.sleep.to : h >= s.sleep.from || h < s.sleep.to;
    const c = s.sleep.on ? '#8e7cc3' : 'var(--line)', stops = hours.map(h => `${on(h) ? c : 'transparent'} ${(h / 24 * 100).toFixed(3)}% ${((h + 1) / 24 * 100).toFixed(3)}%`).join(', ');
    return `<div class="sleepbar" id="sleepBar" data-hours="${hours.filter(on).length}" style="background-image:linear-gradient(90deg, ${stops})"></div><div class="sleepticks"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>24시</span></div>`; };
  const SPEEDS = [[1, '현실', '현실 1주 = 1년'], [60, '1분=1시간', '하루가 금방'], [720, '1분=1달', '한 해가 약 14분'], [10080, '1분=1년', '한 해가 1분']];
  $('#p-settings').innerHTML = `<div class="stack setwrap"><div class="sectionhead"><span class="muted">바꾸면 바로 저장돼요</span></div>
    ${group('🔔', '알림', '꺼도 정원 일지에는 그대로 남아요',
      [[3, '📦', '예약 배송', '예약한 꽃이 창고에 왔을 때'], [8, '🌸', '개화와 수확', '꽃이 피어 거둘 수 있을 때'], [9, '📖', '도감 등록', '새 꽃·차·땅을 처음 만났을 때']].map(([t, ic, nm, d]) => row(ic, nm, d, tog(`data-toast="${t}"`, s.toast[t]))).join('')
      + row('🌙', '수면 시간', '이 시간의 알림은 모았다가 끝날 때 한 번에 (휴대폰 푸시용, 웹은 저장만)', tog('id="sleepOn"', s.sleep.on))
      + `<div class="set-sub ${s.sleep.on ? '' : 'off'}" id="sleepSub"><div class="row sleeprow"><select id="sleepFrom" class="plantsel" ${s.sleep.on ? '' : 'disabled'}>${hours.map(h => opt(h, s.sleep.from)).join('')}</select><span class="muted">부터</span><select id="sleepTo" class="plantsel" ${s.sleep.on ? '' : 'disabled'}>${hours.map(h => opt(h, s.sleep.to)).join('')}</select><span class="muted">까지</span></div>${sleepBar()}</div>`)}
    ${!DEV ? '' : group('⏩', '시간', '개발용 · 이 컴퓨터(localhost)에서만 보여요',
      `<div class="speedgrid" role="group" aria-label="배속">${SPEEDS.map(([v, l, d]) => `<button type="button" data-speed="${v}" aria-pressed="${st.speed === v}"><b>${l}</b><small>${d}</small></button>`).join('')}</div>`
      + row('⏭', '다음 달로 건너뛰기', '지금 달을 바로 끝내요', '<button type="button" class="btn small" id="skipMonth">다음 달</button>'))}
    ${(() => { const us = undoSummary(), files = !cloudIn();   // 구글 로그인 중엔 💾 저장하기 · 📂 불러오기를 숨김 (P20-02, 10-27 사용자 요청)
      return group('💾', '저장', files ? '진행은 이 브라우저에 자동 저장돼요. 다른 기기로 옮기거나 지켜 두려면 파일로 저장하세요' : '진행은 이 브라우저와 내 구글 드라이브에 저장돼요',
      (cloud.on ? `<div id="cloudRows" class="cloud-rows">${cloudRows(row)}</div>` : '')   // ☁️ 구글 드라이브 (P20-04-02, 클라이언트 ID가 있을 때만)
      + (!files ? '' : row('💾', '저장하기', `파일로 내려받아요 · ${st.lastExport ? `마지막 저장 ${whenText(st.lastExport)}` : '아직 저장한 적이 없어요'}${exportStale() ? ' · <b class="val-down">한동안 저장하지 않았어요</b>' : ''}`, `<span class="row" style="gap:6px"><button type="button" class="btn small" id="exportBtn">저장</button>${canShareFile ? '<button type="button" class="btn small" id="shareBtn">보내기</button>' : ''}</span>`)
      + row('📂', '불러오기', '저장한 파일로 정원을 바꿔요. 바꾸기 전에 요약을 보여 줘요', '<button type="button" class="btn small" id="importBtn">불러오기</button><input type="file" id="importFile" hidden>'))
      + (IOS_EVICT ? row('📱', 'iPhone · iPad Safari', `7일 넘게 열지 않으면 Safari가 정원을 지울 수 있어요. <b>공유 › 홈 화면에 추가</b>로 앱처럼 쓰${files ? '거나 💾 저장해 두세요' : '세요 · ☁️ 드라이브에서 다시 불러올 수 있어요'}`, '') : '')
      + (IN_APP ? row('💬', '앱 안의 브라우저', '카카오톡 · 인스타그램 안에서 연 정원은 그 앱 안에만 저장돼요. Chrome · Safari로 열면 다른 정원이 돼요', '<button type="button" class="btn small" id="copyAddrBtn">주소 복사</button>') : '')
      + (us ? row('↩︎', '불러오기 전으로 되돌리기', `보관한 정원: ${yearWord(us.year)} ${monthName(us.month)} · ${won(us.money)} · 도감 ${us.dex} / ${us.dexTotal} · 칭호 ${us.titles}개`, '<button type="button" class="btn small" id="undoBtn">되돌리기</button>') : '')
      + (brokenRaw() ? row('🧰', '열지 못한 예전 정원', '여는 중에 문제가 생겨 따로 보관한 정원이에요. 파일로 받아 운영자에게 보내 주세요', '<span class="row" style="gap:6px"><button type="button" class="btn small" id="brokenDl">내려받기</button><button type="button" class="btn small" id="brokenDel">지우기</button></span>') : ''));
    })()}
    ${!E.canReset(st, E.calendar(st.virtual)) ? '' : group('🌱', '정원', '되돌릴 수 없어요',
      row('🗑️', '처음부터 다시 시작', '꽃, 창고, 찻집, 돈, 도감, 기록이 모두 지워져요. 설정은 남아요', '<button type="button" class="btn small danger" id="resetBtn">재시작</button>', 'danger'), 'danger-group')}
    ${group('ℹ️', '정보', '',
      row(`${document.querySelector('.logo-px') ? document.querySelector('.logo-px').outerHTML.replace('width="33" height="30"', 'width="22" height="20"') : '🌱'}`, "도리의 정원 · Dori's Garden", `진행은 이 브라우저에 자동 저장돼요 ${cloudIn() ? '(☁️ 구글 드라이브에도)' : '(💾 파일로 옮길 수 있어요)'}`, '')
      + row('🔤', '글꼴', '주아 · 고운바탕 · IBM Plex (모두 SIL 오픈 폰트 라이선스)', '')
      + row('📜', '정책', '정원이 저장하는 곳과 약속', '<span class="row" style="gap:6px"><a class="btn small" href="privacy.html">개인정보처리방침</a><a class="btn small" href="terms.html">이용약관</a></span>'))}
  </div>`;
  resetArmed = false;
  const root = $('#p-settings');
  if ($('#exportBtn')) $('#exportBtn').addEventListener('click', saveClick);
  if ($('#shareBtn')) $('#shareBtn').addEventListener('click', shareSave);
  if ($('#importBtn')) $('#importBtn').addEventListener('click', () => $('#importFile').click());
  if ($('#importFile')) $('#importFile').addEventListener('change', e => { readImport(e.target.files[0]); e.target.value = ''; });
  if ($('#undoBtn')) $('#undoBtn').addEventListener('click', () => undoImport());
  if ($('#brokenDl')) $('#brokenDl').addEventListener('click', downloadBroken);
  if ($('#brokenDel')) $('#brokenDel').addEventListener('click', () => openModal('🧰 보관본 지우기', '<p>열지 못한 예전 정원을 지울까요? 되돌릴 수 없어요</p>', [{ label: '취소', act: () => closeModal() }, { label: '지우기', primary: true, act: () => { try { localStorage.removeItem(BROKEN_KEY); } catch (e) { /* 무시 */ } closeModal(); renderAll(true); } }]));
  if ($('#copyAddrBtn')) $('#copyAddrBtn').addEventListener('click', copyAddress);
  cloudPrep();
  root.querySelectorAll('[data-toast]').forEach(i => i.addEventListener('change', () => { s.toast[i.dataset.toast] = i.checked; save(); }));
  // 수면 시간은 바꾸면 막대와 선택 칸을 다시 그림
  $('#sleepOn').addEventListener('change', e => { s.sleep.on = e.target.checked; save(); renderSettings(); });
  $('#sleepFrom').addEventListener('change', e => { s.sleep.from = +e.target.value; save(); renderSettings(); });
  $('#sleepTo').addEventListener('change', e => { s.sleep.to = +e.target.value; save(); renderSettings(); });
  if (DEV) root.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => { st.speed = +b.dataset.speed; save(); renderTop(); root.querySelectorAll('[data-speed]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  if (DEV) $('#skipMonth').addEventListener('click', () => { const c = E.calendar(st.virtual); E.advance(st, c.slotEnd + 1000, ctx); save(); renderAll(true); feedback(`${monthName(E.calendar(st.virtual).month)}이 되었어요`); });
  if ($('#resetBtn')) $('#resetBtn').addEventListener('click', e => {
    if (!E.canReset(st, E.calendar(st.virtual))) { resetArmed = false; return renderSettings(); }   // 1년차 동안만 (10-27): 그새 2년차가 됐으면 지우지 않고 줄을 걷음
    if (!resetArmed) { resetArmed = true; e.target.textContent = '한 번 더 누르면 모두 지워져요'; return; }
    const keep = st.settings; st = E.create(Date.now()); st.settings = keep; st.onboarded = true;
    cloudNewGarden();                             // 로그인했으면 계정의 첫 방문을 이어 붙임 (P20-08-02)
    ui.selected = null; ui.cart = {}; ui.sigs = {}; giveGift(); save(); setTab('garden'); feedback('빈 황무지에서 새 정원을 시작했어요 · 이웃의 화분이 정원 가운데에 있어요');
  });
}

// P22-02 이웃의 화분: 첫 방문 · 처음부터 다시 시작할 때 한 번
function giveGift() {
  const r = E.giftPot(st, ctx, ui.giftWant); ui.giftWant = null; ui.titleHold = performance.now() + 2600;
  if (r.ok && r.flower) { ui.selected = r.flower.id; ui.sheetOpen = true; }
  return r;
}
function startGarden() { ui.onDismiss = null; if (st.onboarded) return closeModal(); st.onboarded = true; closeModal(); giveGift(); E.checkJournal(st, ctx); save(); renderAll(true); }
function onboarding() {
  const cal = E.calendar(st.virtual);
  openModal('도리의 정원', `<div class="stack" style="gap:10px">
    <div class="ob-vis">
      <figure>${landPixel()}<figcaption><b>꽃이 땅을 바꿔요</b>처음엔 모두 황무지. 심은 꽃 둘레가 그 꽃이 좋아하는 땅이 돼요</figcaption></figure>
      <figure>${weekPixel(cal)}<figcaption><b>현실 1주 = 정원 1년</b>오전·오후 6시마다 한 달씩. 일요일은 🌙 꽃잠 (시간이 멈추고 예약해요) · 쉼 · 샘 = 쉼달 · 꽃샘달</figcaption></figure>
    </div>
    <p class="ob-care"><span>💧</span><span>🌿</span> 물과 잡초는 <b>하루에 한 번</b>이면 충분해요</p>
    ${st.gift == null ? `<p class="ob-care">${spriteImg((ui.giftWant = E.GIFT_BY_MONTH[cal.month]), 'flower', 32, false, '')} 시작하면 이웃이 <b>${FLOWERS[E.GIFT_BY_MONTH[cal.month]].name}</b> 화분을 하나 나눠 줘요</p>` : ''}
    <p class="note">${cal.frozen ? `지금은 꽃잠이라 정원이 쉬고 있어요. 첫 해는 <b>월요일 아침 6시</b>(${realH(E.untilMonth(st.virtual, c => !c.frozen).hours)} 뒤)에 3월로 시작해요. 그 전에 💐 화원에서 새해 꽃을 <b>10% 싸게 예약</b>해 두면, 심을 때가 되면 창고로 와요.` : `지금은 ${monthName(cal.month)}이에요. 💐 화원에서 제철 꽃을 사서 심어 보세요.`}</p>
    <p class="note">돌보지 않아도 꽃은 죽지 않고, 놓친 것은 다음 해에 다시 할 수 있어요. 천천히 즐겨 주세요.</p></div>`,
    [{ label: '시작', primary: true, act: startGarden }]);
  ui.onDismiss = startGarden;                     // ✕ · 바깥 · Esc로 닫아도 시작 (QA 15회차)   // 0장 첫 방문: 누르자마자 칭호 (P19, 10-17)
}
