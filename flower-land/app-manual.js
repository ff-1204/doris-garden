// 도리의 정원 — 화면: 📘 매뉴얼 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 📘 매뉴얼 (P21, 10-17): 글보다 도트 그림. 카드마다 그림 하나 + 한 줄
const MN_SECS = [['year', '🗓️ 한 해'], ['land', '🟫 땅'], ['flower', '🌸 꽃'], ['care', '🧤 돌보기'], ['shop', '💐 화원'], ['tea', '🍵 찻집'], ['blend', '🫖 블렌드'], ['sleep', '🌙 꽃잠'], ['farm', '🐝 곤충농장'], ['mine', '⛏️ 광산'], ['guest', '💌 주문'], ['journal', '📜 도감일지'], ['season', '🌸 새 철'], ['path', '🛤️ 철의 길'], ['inbox', '✉️ 편지함'], ['save', '💾 저장']];
function renderManual(force) {
  const cal = E.calendar(st.virtual), mf = FLOWERS[ui.mnFlower] ? ui.mnFlower : 'chamomile', F = FLOWERS[mf];
  const sig = JSON.stringify([mf, cal.idx, Object.keys(st.titles), E.blendKeys(st).length, cloudIn(), E.slowView(st), E.seasonReady(st), E.seasonN(st), E.seasonPath(st), E.patternView(st)]);   // 🌸 새 철 카드 (P28-08-05)
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
      + `<div class="mn-lands">${LAND_KEYS.map(k => { const L = LANDS[k], mk = makers(k), pv = E.patternView(st); return `<span class="mn-land"><span class="sw${pv ? ' pat' : ''}" style="background:${L.color}${pv ? `;background-image:url(${patURL(k)})` : ''}">${mk[0] ? spriteImg(mk[0], 'flower', 24, false, '') : ''}</span>${L.name}${pv ? `<small>${window.LAND_PATTERNS[k].name}</small>` : ''}</span>`; }).join('')}</div>
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
      </div><figcaption>꽃을 누르면 둘레에 단추가 떠요 · 도구가 없으면 흐린 단추를 눌러 바로 사요 · 돌보지 않아도 꽃은 죽지 않아요</figcaption></div>`
      + fig(`<div class="mn-flow">${item(ico('💧'), '모두 물 주기', '목마른 꽃만')}${item(ico('🧺'), '모두 거두기', '핀 꽃만')}${arrow()}${item(ico('🧴'), '용품은 송이마다', '모자라면 되는 만큼')}</div>`, '돌볼 꽃이 두 포기 이상이면 위 숫자 칩 옆과 🌙 자리를 비운 동안 창에 떠요 · 한 송이씩 한 것과 똑같이 셈해요')
      + fig(`<div class="mn-flow">${item(ico('⏳'), '2시간마다 한 칸', '꽃잠엔 멈춰요')}${arrow()}${item(ico('🧺'), '정원 저장고', `기본 ${E.PANTRY_BASE}칸 · 등급 장식마다 +${E.PANTRY_PER_DECO}`)}${arrow()}${item(ico('💧'), '물병 · 비료', '창고로')}${item(ico('🟫'), '흙 · 석영', '광산 주머니로')}${item(ico('🍂'), '떨어진 꽃잎', '제다실로')}</div>`, '위 숫자 칩 줄의 🧺를 누르면 모두 거둬요 · 가득 차면 더 쌓이지 않지만 놓쳐도 괜찮아요 · 떨어진 꽃잎은 아직 안 거둔 핀 꽃에서 바구니로 거둔 거예요 · 칸 수는 정원 등급 10 · 20에 하나씩 늘어요')),
    sec('shop', '화원과 창고', '심는 달에만 팔아요',
      fig(`<div class="mn-flow">${item(spriteImg('chamomile', 'form', 44, false, ''), '씨앗', '봉지 · 발아율')}${item(spriteImg('lavender', 'form', 44, false, ''), '묘목', '그루 · 뿌리내림')}${item(spriteImg('gamguk', 'form', 44, false, ''), '모종', '포기 · 뿌리내림')}${item(spriteImg('lotus', 'form', 44, false, ''), '연근', '뿌리 · 뿌리내림')}${item(spriteImg('dongbaek', 'form', 44, false, ''), '나무', '그루 · 뿌리내림')}</div>`,
        '산 것은 📦 <b>창고</b>로 와요 · 창고에서도 품질이 한 달에 5%씩 떨어져요')
      + fig(`<div class="mn-flow"><span class="mn-item"><span class="mn-stars">★★★★☆</span><small><b>72%</b>★ 하나 = 20%</small></span>${bar(12, 'var(--good)', '유효기간 12달')}${bar(8, 'var(--good)', '발아율 ↓', 0)}${arrow('›')}${item(ico('🌱'), '비료 1개', '0%가 되면')}</div>`,
        '품질 0%여도 발아율이 남으면 심을 수 있어요 · 싹이 안 튼 씨앗도 🌱 비료가 돼요')
      + `<div class="mn-icons">${item(ico('🗓️'), '예약', '꽃잠에 · 10% 할인')}${item(ico('📦'), '배송', '심는 날 아침 6시')}${item(ico('3'), '한 종류 3개', '예약 한도')}${item(ico('↔️'), '옮겨심기', '심는 달 · 휴면기 · 꽃잠')}${E.slowView(st) ? '' : item(ico('📊'), '꽃별 셈', '📖 도감 · 한 해 수입')}</div>`),
    sec('tea', '찻집', '겨울부터 꽃잠까지 열어요',
      fig(monthStrip([['🍵', '찻집', [12, 1, 2, 13, 14], 'var(--accent)'], ['🗓️', '예약', [13, 14], 'var(--rest)']], cal.idx), '금요일 저녁 6시(12월)에 문을 열고 일요일 꽃잠까지 · 그 전엔 🌿 제다실에서 티백을 만들어 두세요 · 처음 온 정원은 닫혀 있어도 🍵 <b>첫 손님</b>을 한 번 맞아요')
      + fig(`<div class="mn-flow">${item(spriteImg(mf, 'teabag', 44, false, ''), '티백', '품질 그대로')}${arrow()}${item(ico('🫖'), '우림', '찻집에서')}${arrow()}${item(spriteImg(mf, 'tea', 52, false, ''), '☕ 갓 우림', '100%')}${arrow()}${item(ico('🧊'), '식은 차', '다음 달 −50%')}${arrow()}${item(ico('💰'), '판매', '1시간마다 손님')}</div>`,
        '🍃 <b>햇차</b>(★5) +10% · 🌸 생화로 바로 만든 티백 −10% · 찻잔은 꽃잠에도 팔려요 · 손님은 먼저 우린 잔부터 사 가요(식은 잔도) — 팔 만큼만 우려요')),
    sec('blend', '블렌드', '말린 꽃잎 2~3장을 섞어요',
      fig(`<div class="mn-blends">${blendKeys.map(k => { const B = E.BLENDS[k]; return `<span class="mn-blend"><span class="eq">${B.parts.map(p => spriteImg(p, 'dried', 24, false, '말린 ' + FLOWERS[p].name)).join('<b>+</b>')}<b>=</b>${spriteImg(B.parts[0], 'tea', 28, false, B.name)}</span><span class="nm">${B.name}</span></span>`; }).join('')}${hiddenBlends.map(() => `<span class="mn-blend locked"><span class="eq">${spriteImg('chamomile', 'dried', 24, true, '')}<b>+</b>${spriteImg('chamomile', 'dried', 24, true, '')}<b>=</b>${spriteImg('chamomile', 'tea', 28, true, '')}</span><span class="nm">숨은 레시피</span></span>`).join('')}</div>`,
        '레시피대로면 두 차 값을 더한 것의 <b>×1.5</b> · 다른 짝은 ×1.2 · 숨은 레시피는 칭호를 얻으면 열려요 · 제다실 레시피를 누르면 재료가 바로 담겨요')),
    sec('sleep', '꽃잠', '일요일, 정원이 쉬어요',
      fig(`<div class="mn-icons">${item(ico('🌱'), '자람', '멈춤', 'off')}${item(ico('🌿'), '잡초 · 목마름', '멈춤', 'off')}${item(ico('📉'), '품질 하락', '멈춤', 'off')}${item(ico('↔️'), '옮겨심기 · 번식', '할 수 있어요')}${item(ico('💧'), '돌보기', '할 수 있어요')}${item(ico('🧺'), '수확', '핀 꽃만 · 한 번')}${item(ico('🗓️'), '예약', '할 수 있어요')}${item(ico('🫖'), '블렌딩', '할 수 있어요')}${item(ico('🍵'), '찻집', '열려 있어요')}${item(ico('📖'), '기록', '한 해를 돌아봐요')}</div>`,
        '심기는 쉬어요 · 꽃잠엔 새로 피지 않고, 2월에 핀 채로 잠든 꽃은 꽃잠에 한 번 거둬요 · 달 상관없이 옮기고 번식해요(새해 몫 한 번) · 꽃방에 넌 꽃잎은 꽃잠 동안 마르지 않아요 · 일요일에 처음 왔다면 그 꽃잠은 <b>0년차</b>, 1년차는 월요일 아침 6시부터')),
    // 🪴 꾸미기와 꿀 절은 뺌 (P32, 10-30 사용자 요청 — 장식 · 장치 · 🐾 손님은 도감 · 말풍선에서 스스로 찾는 재미, 일꾼은 아래 🐝 곤충농장 칸)
    // 🐝 곤충농장 (P32-04): 자동 장치 카드들을 하나로 — 일꾼 6줄(이름 · 하는 일 · 값 · 조건) + 저장고 · 손길 점 · 따라잡기 한 줄씩
    sec('farm', '🐝 곤충농장', '정원 일을 도와주는 작은 일꾼들',
      `<div class="mn-farm">${E.FARM.map(w => { const D = w.wild ? null : E.DECOS[w.key];
        const when = w.wild ? '데려오지 않아요 · 저절로 와요' : `${won(D.price)} · ${D.need ? `정원 등급 ${D.need}부터` : `${E.decoMonths(w.key).map(monthName).join('·')}에`}${D.one ? ' · 하나만' : ''}`;
        return `<div class="mn-frow">${insectImg(w.key, 2)}<span><b>${w.icon} ${w.name}${D && D.name !== w.name ? ` <small class="muted">· ${D.name}</small>` : ''}</b><small>${esc(w.desc || D.desc)}</small><small class="muted">${when}</small></span></div>`; }).join('')}</div>`
      + fig(`<div class="mn-icons">${item(ico('🧺'), '정원 저장고', '2시간마다 한 칸')}${item(ico('🌟'), '손길 점', '등급이 오를 때마다 1점')}${item(ico('🌙'), '따라잡기', `최대 ${E.bonusVal(st, 'catchup')}주`)}</div>`,
        '탭 줄 🐝 곤충농장에서 일꾼을 데려오고(💐 화원과 같은 값) · 창고에서 쉬는 일꾼을 정원에 놓고 · 지난달 한 일과 말 한 줄을 봐요 · 🧺 저장고 모두 거두기 · 🌟 손길 점 고르기 · 🌙 지난번 자리를 비운 동안 다시 보기도 여기서 해요 · 일꾼은 사람이 하던 손을 덜 뿐 더 벌지는 않아요(꽃잎 품질 90%) · 켜 두지 않아도 일해요 · 정원 지도엔 바구니 · 건조대 같은 장식 그림으로 보여요')),
    sec('mine', '정원 뒤 광산', '기다리는 동안 조금씩',
      fig(`<div class="mn-flow">${item(ico('⛏️'), '기력 12', '30분마다 1칸')}${arrow()}${item(mineImg('stone', 2), '파기', '한 칸에 1')}${arrow()}${item(mineImg('stairs', 2), '계단', '아래층으로')}${arrow()}${item(mineImg('amber', 2), '깊을수록', '드문 광물')}</div>`,
        '탭 줄 ⛏️ 광산에서 들어가요 · 꺼 둔 동안에도 기력이 차고 꽃잠에도 팔 수 있어요')
      + fig(`<div class="mn-flow">${item(mineImg('dirt', 2), '흙 5', '🌱 비료')}${item(mineImg('stone', 2), '돌', '징검돌 · 물확 · 석등')}${item(mineImg('jade', 2), '비취 2', '청자 찻잔')}${item(mineImg('fossil', 2), '화석', '광산 도감')}</div>`,
        '광산에서 나온 것은 팔지 않아요 · 🔨 만들기로 장식과 찻잔을 돈 없이 만들어요')),
    sec('guest', '손님 주문과 한 해 평가', '오래 하는 정원사에게',
      fig(`<div class="mn-flow">${item(ico('💌'), '주문 쪽지 3장', '찻집이 열린 달마다')}${arrow()}${item(spriteImg('lavender', 'tea', 32, false, ''), '★4 라벤더차', '맞는 찻잔을 팔면')}${arrow()}${item(ico('🎀'), '기념품', '12가지 · 도감')}</div>`,
        '손으로 팔든 손님이 사 가든 맞으면 돼요 · 돈은 더 주지 않아요 · 놓쳐도 다음 달에 새 쪽지')
      + fig(`<div class="mn-icons">${item(ico('🟫'), '땅 가짓수', '×10')}${item(ico('🌸'), '정원의 꽃', '80포기까지')}${item(ico('🌼'), '올해 핀 꽃', '가짓수 ×4')}${item(ico('🫖'), '올해 블렌드', '가짓수 ×3')}${item(ico('🍯'), '올해 꿀', '가짓수 ×2')}${item(ico('🪴'), '놓은 장식', '×3')}${item(ico('💌'), '들어준 주문', '×5')}${item(ico('💐'), '보낸 선물', '×10')}</div>`,
        '쉼달 기록 때 🏅 정원 점수 · 남과 겨루지 않고 내 최고 기록과만 · 250점이 되면 숨은 칭호')),
    sec('journal', '도감일지와 칭호', '한 장을 끝내면 다음 장이 열려요',
      fig(`<div class="mn-chain">${E.CHAPTERS.map((c, i) => `${i ? arrow('›') : ''}${item(titleImg(c.title, 40, !st.titles[c.title]), `${c.no}장`, c.name)}`).join('')}</div>`,
        `칭호 ${E.TITLE_KEYS.length}개 · ${E.TITLE_KEYS.filter(k => st.titles[k] != null).length}개 얻음${cloud.on ? ' · ☁️ 구글 로그인 덤 칭호 「구름 정원사」 · 🌸 새 철 덤 칭호는 따로' : ' · 🌸 새 철 덤 칭호는 따로'} · 📖 도감 › 📔 도감일지에서 대표 칭호를 골라 달아요 · 퀘스트 · 주문 · 점수가 숙제 같으면 ⚙️ 설정 › 🐢 느긋하게 보기`)
      + fig(`<div class="mn-flow">${item(ico('🧺'), '거두기 · 팔기', '꽃잎 · 한 잔 2')}${item(ico('💌'), '주문 · 퀘스트', '15 · 10')}${item(ico('📖'), '도감 · 한 해 평가', '새 칸 5 · 1점에 1')}${arrow()}${item(ico('🌱'), '정원 등급', '씨앗 정원 1 → … 숲 정원')}${arrow()}${item(decoImg('sproutsign', 2), '등급 장식', '5등급마다 화원에')}</div>`,   // P28-05-01 🌱 정원 등급 (M1-4)
        '정원에서 한 일만큼 등급이 올라요 · 돈으로 산 것은 세지 않아요 · 끝이 없어요 · 위 막대 🌱를 누르면 📔 도감일지 맨 위에서 봐요 · 🐢 느긋하게 보기면 위 막대 · 알림 · 숫자가 숨어요')
      + fig(`<div class="mn-flow">${E.LAYERS.filter(L => L && L.name).map((L, i) => `${i ? arrow() : ''}${item(ico(L.icon), `${L.layer}층 ${L.name}`, L.layer === 1 ? '처음부터' : L.how ? L.how : `${L.years}해 + 꽃 13종`)}`).join('')}</div>`,   // P30-01 🌳 정원의 층
        '📔 도감일지 등급 아래에서 지금 층과 다음 층까지 남은 것을 봐요 · 흐른 해는 쉬어도 쌓여요 · 새 층은 새해 3월 아침에 열려요 · 새 철에도 층은 그대로예요 · 4층이 열리면 알림 한 줄과 함께 탭 줄에 🌳 숲 탭이 생겨요 · 🐢 느긋하게 보기면 숫자 대신 새싹 그림만')
      + fig(`<div class="mn-flow" style="align-items:flex-end">${E.TREE_STAGES.map((n, s) => `${s ? arrow() : ''}${item(treeImg('maple', s, TREE_SMALL[s], 2), n, s ? `${s}해 뒤` : '심은 해')}`).join('')}</div><div class="mn-icons">${E.TREE_KEYS.map(k => item(treeImg(k, 3, 1, 1), `${E.TREES[k].icon} ${E.TREES[k].name}`, won(E.TREES[k].price))).join('')}</div>`,   // P30-03 🌳 작은 숲
        '🌳 작은 숲 — 4층이 열리면 나무 자리 6칸 · 💐 화원 🌳 숲 줄이나 숲 탭 빈 자리에서 묘목을 돈으로 심어요 · 해가 바뀔 때마다(새해 3월 아침) 묘목 → 어린나무 → 나무 → 큰 나무(꽃잠에 심으면 다음 해 아침부터) · 물 · 돌봄 없이 자라고 시들지 않아요(쉬는 동안도 자라요) · 열매 · 돈은 나오지 않아요 · 심은 나무는 옮기거나 베지 않아요 · 큰 나무엔 🐦 박새 · 🐇 산토끼가 와 앉기도 해요 · 📖 도감 🌳 숲 24칸 · 새 철에도 숲은 그대로예요 · 🌿 4층이 열린 뒤엔 🐞 무당벌레가 달 끝마다 잡초 ' + E.forestWeedWord() + '를 치워요(호미 · 비료 덤 · 목표엔 안 셈, 꽃잠엔 쉼)')   // P30-02
      + fig(`<div class="mn-flow">${[0, 1, 2, 3].map(s => { const ks = E.YEARLY_KEYS.filter(k => E.YEARLY[k].season === s); return item(ico(E.YEARLY[ks[0]].icon), `${E.SEASONS[s]} 하나`, ks.map(k => E.YEARLY[k].word).join(' · ')); }).join('')}</div>`,   // P30-05-03 🗓️ 올해만 오는 것
        '🗓️ 올해만 오는 것 — 해마다 계절마다 하나씩, 한 해 4개가 정원 위에 와요 · 그 계절에 한 번 열면 봐요(켜 둘 필요 없어요) · 놓친 것은 다음 해 같은 계절에 먼저 다시 와요 · 그림뿐이라 꽃 값 · 자람은 그대로예요 · 📔 도감일지 층 아래 올해 달력 · 📖 도감 🗓️ 올해만')
      + fig(`<div class="mn-flow">${item(ico('🌱'), '정원 등급', '오를 때마다')}${arrow()}${item(ico('🌟'), '손길 점', '1점')}${arrow()}${E.BONUS_KEYS.map(k => item(ico(E.BONUS[k].icon), E.BONUS[k].name, `${E.BONUS_COST.join(' · ')}점`)).join('')}</div>`,   // P28-05-02 🌟 손길 점 (M3-2)
        '📔 도감일지 등급 아래에서 골라요(🐝 곤충농장에서도) · 개미 · 누에 일꾼 · 저장고 · 따라잡기가 손을 덜어 줄 뿐 더 벌지는 않아요 · 언제든 내리면 점이 돌아와요 · 끝까지 올린 장치는 그림이 바뀌어요')
      + fig(`<div class="mn-flow">${item(ico('🗓️'), '월요일 아침', '목표 3개')}${arrow()}${item(ico('🌿'), '쉬움 · 보통 · 어려움', `🌱 +${E.WEEKLY_XP.join(' · +')}`)}${arrow()}${item(ico('🎉'), '셋 다', `덤 🌱 +${E.WEEKLY_BONUS}`)}</div>`,   // P28-09 🗓️ 주간 목표
        '이번 주 목표는 📔 도감일지 등급 아래에 있어요 · 주 안에 언제 해도 되고 꽃잠에도 돼요 · 못 끝낸 목표는 그냥 사라져요 · 돈은 주지 않아요')
      + `<div class="mn-icons">${item(ico('🌱'), '새싹', '처음 장')}${item(ico('🌸'), '꽃', '가운데 장')}${item(ico('👑'), '정원', '마지막 장')}${item(ico('📚'), `도감 ${E.dexTotal(st)}칸`, '꽃 · 꽃잎 · 티백 · 차 · 땅 · 블렌드')}</div>`),
    // 🌸 새 철 (P28-08-05, M3-4): 조건 · 이어지는 것 · 비워지는 것 · 완전 초기화와 다른 점. 이번 철 진행 숫자는 느긋하게 보기면 숨김
    (() => { const sr = E.seasonReady(st), n = E.seasonN(st), tk = E.SEASON_TITLES.find(k => E.TITLES[k].season > n) || E.SEASON_TITLES[E.SEASON_TITLES.length - 1];   // 다음에 받을 철 칭호 그림
      return sec('season', '새 철', '고르는 것 · 안 해도 괜찮아요',
        fig(`<div class="mn-flow">${item(ico('📖'), `${sr.need.years}해 기록`, '이번 철 쉼달마다')}${item(spriteImg('napmae', 'flower', 32, false, ''), `꽃 ${sr.need.flowers}종`, '도감에 모두')}${arrow()}${item(ico('🌙'), '꽃잠', '📖 기록 끝 한 줄')}${arrow()}${item(titleImg(tk, 40, st.titles[tk] == null), `${n + 1}철`, '다음 월요일 1년차')}</div>`,
          `이번 철에 쉼달 기록을 ${sr.need.years}번 남기고 꽃 ${sr.need.flowers}종을 모두 피우면, 꽃잠에 📖 도감 › 기록 맨 위 카드 끝에 "🌸 새 철을 시작할 수 있어요"가 보여요 · 창이 뜨거나 재촉하지 않아요${E.slowView(st) ? '' : ` · 지금 이번 철 ${Math.min(sr.years, sr.need.years)} / ${sr.need.years}해 · 꽃 ${sr.flowers} / ${sr.need.flowers}종`}${n >= 2 ? ` · 지금 ${n}철` : ''}`)
        + fig(`<div class="mn-icons">${item(ico('🌱'), '정원 등급', '그대로')}${item(ico('🌟'), '손길 점', '고른 보너스도')}${item(ico('🏅'), '칭호 · 도감', '그대로')}${item(insectImg('autobasket', 2), '곤충 일꾼', '놓인 자리 그대로')}${item(ico('🪑'), '찻집 가꾸기', '그대로')}${item(ico('📈'), '기록', '철 구분선')}</div>`,
          '이어져요 · 다음 철엔 일꾼 · 가꾸기를 다시 데려오지 않아 첫해가 더 빨리 굴러가요 · 손길 점은 정원 등급으로만 얻어요(새 철로 더 주지 않아요)')
        + fig(`<div class="mn-icons">${item(ico('🟫'), '땅 · 꽃', '모두 황무지로', 'off')}${item(ico('💰'), '돈', '15,000원부터', 'off')}${item(ico('🌰'), '씨앗 · 꽃잎', '티백 · 찻잔', 'off')}${item(ico('🧤'), '용품', '처음 것으로', 'off')}${item(ico('📦'), '놓은 장식', '창고로', 'off')}</div>`,
          '비워져요 · 2 · 3 · 5철을 시작하면 덤 칭호가 하나씩 · 위 막대에 🌸 2철')
        + `<p class="note" style="text-align:center">⚙️ 설정의 🗑️ 처음부터 다시 시작(1년차에만)과 달라요 — 그건 등급 · 칭호 · 도감까지 <b>모두 지워요</b>. 새 철은 쌓은 것을 이어 가요</p>`); })(),
    // 🛤️ 철의 길 (P30-04-02, L2-2 10-30): 길 셋 + 길 없이 · 바꾸는 것 넷 · 돈은 같음. 숫자가 없어 느긋하게 보기여도 그대로
    (() => { const now = E.pathBadge(st), PV = k => E.VISITOR_KEYS.find(v => E.VISITORS[v].path === k);
      return sec('path', '철의 길', '새 철을 시작할 때 하나 · 안 골라도 괜찮아요',
        fig(`<div class="mn-icons">${E.PATH_KEYS.map(k => item(visitorImg(PV(k), 2), `${E.PATHS[k].icon} ${E.PATHS[k].name}`, { flower: '꽃잎 · ★ · 번식', tea: '찻잔 · 블렌드 · 주문', earth: '광산 · 계단' }[k])).join('')}${item(ico(E.PATH_NONE.icon), E.PATH_NONE.name, '지금처럼')}</div>`,
          `🌸 새 철 확인 창 아래에서 길 하나를 골라요 · 그 철 동안은 바뀌지 않고, 다음 철에 다른 길을 걸어요${now ? ` · 지금 ${now.text}` : ''}`)
        + fig(`<div class="mn-icons">${item(ico('🗓️'), '주간 목표', '그 길 쪽이 자주')}${item(ico('🐾'), '길 손님', '그 길에만 와요')}${item(titleImg('t_path_tea', 40, st.titles.t_path_tea == null), '길 칭호', '한 철을 마치면')}${item(ico('📖'), '기록 카드', '길 색 한 줄')}</div>`,
          '길이 바꾸는 건 이 넷뿐이에요 · 돈 · 수확 · 꽃 값 · 경험치는 어느 길이든 같아요 · 📖 도감 › 📈 해마다 아래 "철마다" 표에서 지난 철과 견줘요')); })(),
    // P31-03 ✉️ 편지함: 편지 셋 · 소식 · 점 (숫자가 없어 느긋하게 보기여도 그대로)
    sec('inbox', '편지함', '편지와 소식을 한곳에',
      fig(`<div class="mn-flow">${item(ico('✉️'), '위 막대 ✉️', '새로 오면 점 하나')}${arrow()}${item(ico('📮'), '✉️ 편지', '운영자 · 이웃 · 첫 방문')}${item(ico('🔔'), '🔔 소식', '알림으로 지나간 일')}</div>`,
        '편지 칸엔 📮 운영자 편지 · ✉️ 이웃 답장 · 💌 꽃집 할머니의 첫 편지가 최근 것부터 있어요 · 누르면 그 편지를 다시 읽어요 · 🎁가 붙은 편지는 아직 선물을 안 받은 것이에요')
      + fig(`<div class="mn-icons">${[['🗓️', '올해만 것'], ['🐾', '특별 손님'], ['🌳', '층 열림'], ['🌸', '새 철'], ['💌', '기념품'], ['🐞', '무당벌레'], ['🏅', '칭호']].map(([i, n]) => item(ico(i), n, '')).join('')}</div>`,
        '소식 칸엔 알림 한 줄로 지나간 일이 최근 것부터 모여요 · 창을 열면 점이 사라져요 · 재촉하지 않고 수도 세지 않아요 · 더 지난 일은 📜 정원 일지 · 📖 기록에 · 🐢 느긋하게 보기면 숫자 없는 문장만')),
    // P28-01 · P28-02 · P28-03 보기 설정: 보는 것만 바뀌고 얻는 것 · 돈은 그대로
    sec('view', '보기 설정', '⚙️ 설정 › 👀 보기',
      fig(`<div class="mn-icons">${item(ico('🐢'), '느긋하게 보기', '숫자 · 목표를 숨겨요')}${item(ico('🔠'), '큰 글씨', '글자 · 단추가 커져요')}${item(ico('🧩'), '땅 무늬 보기', '땅마다 다른 무늬')}</div>`,
        '🔠 큰 글씨는 글자를 1.25배로 키우고 단추를 손가락으로 누르기 쉽게 넓혀요 · 🧩 땅 무늬 보기는 색이 비슷해 보이는 땅도 무늬로 알아보게 지도 · 범례에 무늬를 겹쳐요 · 셋 다 보는 것만 바뀌어요')),
    sec('save', '저장', '운영자 서버에 보내지 않아요',
      (cloudIn()   // 구글 로그인 중엔 파일 저장 대신 드라이브 기준 (P20-02, 10-27)
        ? fig(`<div class="mn-icons">${item(ico('🌐'), '자동 저장', '이 브라우저에')}${arrow('›')}${item(ico('☁️'), '구글 드라이브', '내 드라이브에도')}${item(ico('↩️'), '되돌리기', '바꾸기 직전으로')}</div>`,
          `구글로 로그인해 두어 정원이 내 드라이브에도 저장돼요 · 다른 기기에서 같은 계정으로 로그인하면 이어 해요 · 오래 비워도 다시 열면 최대 ${E.bonusVal(st, 'catchup')}주를 따라잡아요`)
        : fig(`<div class="mn-icons">${item(ico('🌐'), '자동 저장', '이 브라우저에')}${item(ico('💾'), '저장하기', '.json 파일로')}${arrow('›')}${item(ico('📂'), '불러오기', '다른 기기에서')}${item(ico('↩️'), '되돌리기', '불러오기 직전으로')}${cloud.on ? item(ico('☁️'), '구글 드라이브', '로그인하면 내 드라이브에') : ''}</div>`,
          `브라우저 데이터를 지우면 정원이 사라질 수 있어요 · ⚙️ 설정 › 💾 저장에서 가끔 파일로 받아 두세요 · 오래 비워도 다시 열면 최대 ${E.bonusVal(st, 'catchup')}주를 따라잡아요`))
      // P30-07 오래 쉬었다 와도: 🌙 자리를 비운 동안 창 아래 🍃 그동안 세 줄
      + fig(`<div class="mn-flow">${item(ico('🌙'), '자리를 비운 동안', '3시간 넘게 비우면')}${arrow()}${item(ico('🍃'), '그동안', '1주(1해) 넘게 비우면')}</div>`,
        '오래 쉬었다 와도 꽃은 그대로 기다려요 · 지나간 해 · 못 본 올해만 것(다음 해 그 계절에 다시 와요) · 다음 층까지 남은 것을 세 줄로 알려 줘요')),
  ].join('');
  $('#p-manual').innerHTML = `<div class="stack"><div class="sectionhead"><span class="sb-title" style="font-family:var(--font-display);font-weight:700;font-size:calc(16 * var(--u))">📘 매뉴얼</span><span class="muted">그림으로 보는 정원 규칙</span></div>
    <nav class="mn-chips" aria-label="매뉴얼 차례">${MN_SECS.map(([k, l]) => `<a href="#mn-${k}" data-mn="${k}">${l}</a>`).join('')}</nav>${body}</div>`;
}
$('#p-manual').addEventListener('click', e => {
  const f = e.target.closest('[data-mf]'); if (f) { ui.mnFlower = f.dataset.mf; return renderManual(true); }
  const g = e.target.closest('[data-mn]'); if (g) { e.preventDefault(); const el = $('#mn-' + g.dataset.mn); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});
function openSettings() { setTab('settings'); }
// 👁️ 색약 흉내 (P28-03 확인용 · DEV만): 화면 전체에 SVG feColorMatrix — Machado 2009 심한 정도 1.0 행렬. 저장 안 함 (새로고침하면 꺼짐)
let devCvdOn = '';
const CVD = {
  protan: '0.152286 1.052583 -0.204868 0 0 0.114503 0.786281 0.099216 0 0 -0.003882 -0.048116 1.051998 0 0 0 0 0 1 0',
  deutan: '0.367322 0.860646 -0.227968 0 0 0.280085 0.672501 0.047413 0 0 -0.011820 0.042940 0.968881 0 0 0 0 0 1 0',
  tritan: '1.255528 -0.076749 -0.178779 0 0 -0.078411 0.930809 0.147602 0 0 0.004733 0.691367 0.303900 0 0 0 0 0 1 0',
};
function devCvd(k) {
  if (!DEV) return;
  if (!$('#cvdDefs')) document.body.insertAdjacentHTML('beforeend', `<svg id="cvdDefs" width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(CVD).map(([id, m]) => `<filter id="cvd-${id}"><feColorMatrix type="matrix" values="${m}"/></filter>`).join('')}</svg>`);
  devCvdOn = CVD[k] ? k : ''; document.body.style.filter = ''; requestAnimationFrame(() => { document.body.style.filter = devCvdOn ? `url(#cvd-${devCvdOn})` : ''; });   // 한 번 비운 뒤 걸어야 필터를 바꿀 때 다시 그려짐   // <html>에 걸면 화면에 안 먹는 브라우저가 있어 body에 (휴대폰 폭에선 아래 탭 줄이 페이지 끝으로 감 — 개발용이라 그대로)
}
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
  $('#settingsBody').innerHTML = `<div class="stack setwrap"><div class="sectionhead"><span class="muted">바꾸면 바로 저장돼요</span></div>
    ${group('👀', '보기', '숨겨도 얻는 건 그대로예요',   // P28-02 느긋하게 보기 (판단은 E.slowView 하나)
      row('🐢', '느긋하게 보기', '퀘스트 안내 · 주문 쪽지 · 점수 · 등급 숫자 · 손길 점 숫자 · 층 조건 숫자 · 달력 숫자 · 숲 숫자 · 곤충농장 숫자 · 주간 목표 · 꽃별 셈을 숨겨요. 칭호는 알림 없이 도감에 쌓여요. ✉️ 편지함 소식은 숫자 없는 문장만', tog('id="slowOn"', s.slow))
      + row('🔠', '큰 글씨', '글자를 1.25배로 키우고 단추 · 탭을 넓혀요. 그림 크기는 그대로예요', tog('id="bigOn"', s.big))   // P28-01
      + /* P28-03 */ row('🧩', '땅 무늬 보기', `땅마다 다른 무늬를 지도 · 범례에 겹쳐요. 색이 비슷해 보이는 땅을 무늬로 알아봐요${s.pattern ? `<span class="pat-key">${LAND_KEYS.map(k => `<span>${landSw(k)}${LANDS[k].name}</span>`).join('')}</span>` : ''}`, tog('id="patOn"', s.pattern)))}
    ${group('🔔', '알림', '꺼도 정원 일지에는 그대로 남아요',
      [[3, '📦', '예약 배송', '예약한 꽃이 창고에 왔을 때'], [8, '🌸', '개화와 수확', '꽃이 피어 거둘 수 있을 때'], [9, '📖', '도감 등록', '새 꽃·차·땅을 처음 만났을 때']].map(([t, ic, nm, d]) => row(ic, nm, d, tog(`data-toast="${t}"`, s.toast[t]))).join('')
      + row('🌙', '수면 시간', '이 시간의 알림은 모았다가 끝날 때 한 번에 (휴대폰 푸시용, 웹은 저장만)', tog('id="sleepOn"', s.sleep.on))
      + `<div class="set-sub ${s.sleep.on ? '' : 'off'}" id="sleepSub"><div class="row sleeprow"><select id="sleepFrom" class="plantsel" ${s.sleep.on ? '' : 'disabled'}>${hours.map(h => opt(h, s.sleep.from)).join('')}</select><span class="muted">부터</span><select id="sleepTo" class="plantsel" ${s.sleep.on ? '' : 'disabled'}>${hours.map(h => opt(h, s.sleep.to)).join('')}</select><span class="muted">까지</span></div>${sleepBar()}</div>`)}
    ${!DEV ? '' : group('⏩', '시간', '개발용 · 이 컴퓨터(localhost)에서만 보여요',
      `<div class="speedgrid" role="group" aria-label="배속">${SPEEDS.map(([v, l, d]) => `<button type="button" data-speed="${v}" aria-pressed="${st.speed === v}"><b>${l}</b><small>${d}</small></button>`).join('')}</div>`
      + row('⏭', '다음 달로 건너뛰기', '지금 달을 바로 끝내요', '<button type="button" class="btn small" id="skipMonth">다음 달</button>')
      + row('🐝', '일꾼 다 데려오기', '곤충농장 확인용 (P32) · 정원 등급 12 · 돈을 채우고 지금 화원에 있는 일꾼은 사고, 철 지난 꿀벌 · 달팽이는 창고에 바로 넣어요', '<button type="button" class="btn small" id="devFarm">데려오기</button>')
      + row('🌱', '등급 경험치 더하기', '등급 화면 확인용 · 퀘스트 10개 몫(100)', '<button type="button" class="btn small" id="devXp">+100</button>')
      + row('🗓️', '주간 목표', '목표 확인용 · 안 끝낸 첫 목표를 끝내거나 다음 월요일 아침으로', '<span class="row" style="gap:6px"><button type="button" class="btn small" id="devWeekly">하나 끝</button><button type="button" class="btn small" id="devWeek">다음 주</button></span>')
      + row('🌸', '새 철 조건 채우기', '새 철 확인용 (P28-08) · 이번 철 해마다 기록 3줄 · 꽃 13종 도감 · 꽃잠으로', '<button type="button" class="btn small" id="devSeason">채우기</button>')
      + row('🌳', '해 8개 쌓기', '정원의 층 확인용 (P30-01) · 3층까지 열고 해마다 기록 8줄 · 꽃 13종 도감', '<button type="button" class="btn small" id="devLayer">쌓기</button>')
      + row('🌳', '작은 숲', '작은 숲 확인용 (P30-03 · P30-01-03) · 4층 조건을 채우고 새해 3월 아침으로 넘김(알림 · 숲 탭) · 숲 나무를 한 해씩 키움(해마다 기록은 그대로)', '<span class="row" style="gap:6px"><button type="button" class="btn small" id="devForest">4층 열기</button><button type="button" class="btn small" id="devTreeGrow">한 해 키우기</button></span>')
      + row('🗓️', '올해만 것', '올해만 확인용 (P30-05) · 다음 계절 첫 달로 · 열지 않은 채 한 해(그동안 계절은 놓침)', '<span class="row" style="gap:6px"><button type="button" class="btn small" id="devYSeason">다음 계절</button><button type="button" class="btn small" id="devYAway">비운 채 한 해</button></span>')
      + row('⏪', '비운 채 열기', '그동안 확인용 (P30-07) · 마지막으로 연 때를 13주(13해) 또는 3시간 전으로 돌리고 새로고침 (따라잡기는 상한까지만)', '<span class="row" style="gap:6px"><button type="button" class="btn small" id="devAway13">13해</button><button type="button" class="btn small" id="devAway3h">3시간</button></span>')
      + row('🛤️', '철의 길', '철의 길 확인용 (P30-04) · 새 철 조건을 채우고 길 카드 확인 창을 엶 · 지금 길의 손님을 다음 흐르는 달에 부름', '<span class="row" style="gap:6px"><button type="button" class="btn small" id="devPath">새 철 창</button><button type="button" class="btn small" id="devPathVisitor">길 손님</button></span>')
      + row('✉️', '소식 채우기', '편지함 확인용 (P31) · 올해만 것 · 손님 · 층 · 무당벌레 · 칭호 소식을 일지에 쓰고 읽은 때를 그 앞으로 → 위 막대 점', '<button type="button" class="btn small" id="devInbox">채우기</button>')
      + row('🐾', '손님 부르기', '특별 손님 확인용 (P30-06) · 나무 그네를 놓고 🦔 고슴도치 할머니를 다음 흐르는 달에 부름 (세 번 부르면 기념품)', '<button type="button" class="btn small" id="devVisitor">부르기</button>')
      + row('👁️', '색약 흉내', '땅 무늬 확인용 (P28-03) · 화면 전체에 색약 필터를 씌워요 · 저장하지 않아요', `<select id="devCvd" class="plantsel">${[['', '꺼짐'], ['protan', '적색약'], ['deutan', '녹색약'], ['tritan', '청색약']].map(([v, l]) => `<option value="${v}" ${v === devCvdOn ? 'selected' : ''}>${l}</option>`).join('')}</select>`)
      + row('📮', '운영자 편지', `편지 확인용 (P29) · mail.json을 다시 읽거나, 받은 기록 ${Object.keys(st.mailGot || {}).length}통과 편지함의 📮 편지를 지워요`, '<span class="row" style="gap:6px"><button type="button" class="btn small" id="devMail">다시 읽기</button><button type="button" class="btn small" id="devMailForget">기록 지우기</button></span>'))}
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
      row('🗑️', '처음부터 다시 시작', `새 철과 달라요 — 모두 지워요 · 이 브라우저의 정원 · 설정 · 보관본이 모두 지워지고 첫 안내부터 다시 시작해요${cloud.on && cloud.meta.email ? ' · 구글에서 로그아웃해요 · 드라이브에 저장한 정원은 남아요' : ''}`, '<button type="button" class="btn small danger" id="resetBtn">재시작</button>', 'danger'), 'danger-group')}
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
  $('#slowOn').addEventListener('change', e => { s.slow = e.target.checked; save(); renderAll(true); feedback(s.slow ? '🐢 느긋하게 볼게요' : '다시 다 보여요'); });
  $('#bigOn').addEventListener('change', e => { s.big = e.target.checked; save(); renderAll(true); feedback(s.big ? '🔠 크게 볼게요' : '글씨를 되돌렸어요'); });   // P28-01
  $('#patOn').addEventListener('change', e => { s.pattern = e.target.checked; save(); renderAll(true); feedback(s.pattern ? '🧩 땅 무늬를 겹쳐요' : '땅 무늬를 껐어요'); });   // P28-03
  root.querySelectorAll('[data-toast]').forEach(i => i.addEventListener('change', () => { s.toast[i.dataset.toast] = i.checked; save(); }));
  // 수면 시간은 바꾸면 막대와 선택 칸을 다시 그림
  $('#sleepOn').addEventListener('change', e => { s.sleep.on = e.target.checked; save(); renderSettings(); });
  $('#sleepFrom').addEventListener('change', e => { s.sleep.from = +e.target.value; save(); renderSettings(); });
  $('#sleepTo').addEventListener('change', e => { s.sleep.to = +e.target.value; save(); renderSettings(); });
  if (DEV) root.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => { st.speed = +b.dataset.speed; save(); renderTop(); root.querySelectorAll('[data-speed]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  if (DEV) $('#devCvd').addEventListener('change', e => devCvd(e.target.value));
  if (DEV) $('#skipMonth').addEventListener('click', () => { const c = E.calendar(st.virtual); E.advance(st, c.slotEnd + 1000, ctx); save(); renderAll(true); feedback(`${monthName(E.calendar(st.virtual).month)}이 되었어요`); });
  if (DEV) $('#devWeekly').addEventListener('click', () => { const w = E.weeklyOf(st), i = w ? w.goals.findIndex(g => !g.done) : -1; const r = E.weeklyFinish(st, i, ctx); if (!r.ok) feedback(r.msg, true); save(); renderAll(true); });   // 개발용 (P28-09)
  if (DEV) $('#devWeek').addEventListener('click', () => { const c = E.calendar(st.virtual); E.advance(st, c.ws + 7 * 24 * E.HOUR + 1000, ctx); save(); renderAll(true); feedback('다음 주 월요일 아침이 되었어요'); });
  if (DEV) $('#devSeason').addEventListener('click', devSeasonFill);   // 개발용 (P28-08-05)
  if (DEV) $('#devLayer').addEventListener('click', devLayerFill);   // 개발용 (P30-01-02)
  if (DEV) $('#devFarm').addEventListener('click', devFarmFill);   // 개발용 (P32-04)
  if (DEV) $('#devForest').addEventListener('click', devForestOpen);   // 개발용 (P30-01-03)
  if (DEV) $('#devTreeGrow').addEventListener('click', () => { const n = E.forestGrowDev(st); save(); renderAll(true); feedback(n ? `🌳 나무 ${n}그루가 한 단계 자랐어요` : '🌳 더 자랄 나무가 없어요', !n); });   // 개발용 (P30-03)
  if (DEV) $('#devYSeason').addEventListener('click', () => devYearly(false));   // 개발용 (P30-05)
  if (DEV) $('#devYAway').addEventListener('click', () => devYearly(true));
  if (DEV) $('#devAway13').addEventListener('click', () => devAwayOpen(13 * 7 * 24 * HOUR));   // 개발용 (P30-07)
  if (DEV) $('#devAway3h').addEventListener('click', () => devAwayOpen(3 * HOUR + 60e3));
  if (DEV) $('#devVisitor').addEventListener('click', devVisitor);   // 개발용 (P30-06)
  if (DEV) $('#devInbox').addEventListener('click', devInboxFill);   // 개발용 (P31)
  if (DEV) $('#devPath').addEventListener('click', () => { devSeasonFill(); if (E.seasonCanStart(st, E.calendar(st.virtual))) openSeasonStart(); });   // 개발용 (P30-04-02)
  if (DEV) $('#devPathVisitor').addEventListener('click', devPathVisitor);
  if (DEV) $('#devXp').addEventListener('click', () => { E.addXp(st, 'quest', 10, ctx); save(); renderAll(true); });   // 개발용: 등급이 오르는 알림 · 위 막대 확인 (P28-05-01)
  if (DEV) $('#devMail').addEventListener('click', async () => { const n = await mailFetch(); renderSettings(); feedback(n < 0 ? '📮 편지 파일을 못 읽었어요' : n ? `📮 새 편지 ${n}통` : '📮 새로 받을 편지가 없어요', n < 0); });   // 개발용 (P29-08)
  if (DEV) $('#devMailForget').addEventListener('click', () => { st.mailGot = {}; st.letterBox = (st.letterBox || []).filter(b => !b.mail); save(); renderSettings(); feedback('📮 받은 기록을 지웠어요'); });
  if ($('#resetBtn')) $('#resetBtn').addEventListener('click', e => {
    if (!E.canReset(st, E.calendar(st.virtual))) { resetArmed = false; return renderSettings(); }   // 1년차 동안만 (10-27): 그새 2년차가 됐으면 지우지 않고 줄을 걷음
    if (!resetArmed) { resetArmed = true; e.target.textContent = '한 번 더 누르면 모두 지워요'; return; }
    fullReset();
  });
}
// 개발용 (P28-08-05): 꽃잠까지 시간을 보내고, 이번 철 해마다 기록이 3줄이 되게 빈 줄(숫자 모름)을 채우고, 꽃 도감 13종 → 📖 기록 끝에 새 철 한 줄
function devSeasonFill() {
  if (!E.calendar(st.virtual).frozen) E.advance(st, st.virtual + E.untilMonth(st.virtual, c => c.frozen).hours * HOUR + 1000, ctx);
  const n = E.seasonN(st), have = new Set(E.seasonRows(st).map(r => r.year));
  for (let y = 1; E.seasonRows(st).length < E.SEASON_YEARS; y++) if (!have.has(y)) st.yearLog.push({ year: y, season: n, income: null, sold: null, harvest: null, orders: 0, score: null, grade: null, dex: E.dexCount(st), dexTotal: E.dexTotal(st) });
  st.yearLog.sort((a, b) => (a.season || 1) - (b.season || 1) || a.year - b.year);
  for (const k of FLOWER_KEYS) st.dex.flower[k] = true;
  save(); renderAll(true); feedback(E.seasonReady(st).ready ? '🌸 새 철 조건을 채웠어요 · 📖 기록 맨 위 카드 끝을 보세요' : '조건을 다 못 채웠어요', !E.seasonReady(st).ready);
}
// 개발용 (P30-01-02): 3층(찻집 · 광산)까지 열어 연 해를 적고, 해마다 기록 8줄(숫자 모름)을 쌓고, 꽃 도감 13종 → 📔 도감일지 층 쪽 "8해가 지났어요 · 13 / 13 ✔"
// 개발용 (P32-04): 🐝 일꾼 다 데려오기 — 등급 12 · 돈을 채워 화원 흐름(buyDeco)으로 사고, 이달에 안 파는 꿀벌 · 달팽이는 창고에 바로 (무당벌레는 4층 — 🌳 작은 숲 단추로)
function devFarmFill() {
  if (E.gradeOf(st).grade < 12) st.grade.xp = Math.max(st.grade.xp, E.gradeXpAt(12));
  st.money += 300000;
  for (const w of E.FARM.filter(x => !x.wild)) {
    if ((st.decos || []).some(d => d.key === w.key)) continue;
    if (!E.buyDeco(st, w.key, ctx).ok) { (st.decos = st.decos || []).push({ id: st.nextId++, key: w.key, x: null, y: null }); st.dex.deco[w.key] = true; }
  }
  save(); setTab('farm'); feedback('🐝 일꾼 다섯을 창고에 데려왔어요 · 카드에서 정원에 놓아요');
}
function devLayerFill() {
  if (!Object.keys(st.dex.tea).length) st.dex.tea[E.firstFlower(st) || 'chamomile'] = st.virtual;
  st.stats.dug = Math.max(1, st.stats.dug || 0);
  E.layerSync(st);
  const n = E.seasonN(st);
  for (let i = 0, y = Math.max(0, ...E.seasonRows(st).map(r => r.year)) + 1; i < 8; i++, y++) st.yearLog.push({ year: y, season: n, income: null, sold: null, harvest: null, orders: 0, score: null, grade: null, dex: E.dexCount(st), dexTotal: E.dexTotal(st) });
  for (const k of FLOWER_KEYS) st.dex.flower[k] = true;
  save(); renderAll(true); feedback('🌳 해 8개를 쌓았어요 · 📔 도감일지 층 쪽을 보세요');
}
// 개발용 (P30-01-03): 해 8개 쌓기와 이어서 — 3층 연 해를 지금 해보다 8해 앞으로 돌리고 꽃 13종 → 다음 새해 3월 아침(월요일 6시)까지 열어 둔 채 보냄 → 🌳 알림 한 줄 · 숲 탭
function devForestOpen() {
  if (E.forestOpen(st)) return feedback('🌳 이미 4층이 열렸어요');
  if (!Object.keys(st.dex.tea).length) st.dex.tea[E.firstFlower(st) || 'chamomile'] = st.virtual;
  st.stats.dug = Math.max(1, st.stats.dug || 0);
  E.layerSync(st);
  const n = E.seasonN(st);
  for (let y = Math.max(0, ...E.seasonRows(st).map(r => r.year)) + 1; E.layerYears(st) < 8; y++) st.yearLog.push({ year: y, season: n, income: null, sold: null, harvest: null, orders: 0, score: null, grade: null, dex: E.dexCount(st), dexTotal: E.dexTotal(st) });
  st.layers.at[2] = Math.min(st.layers.at[2], E.layerYears(st) - 8); st.layers.at[3] = E.layerYears(st) - 8;
  for (const k of FLOWER_KEYS) st.dex.flower[k] = true;
  let t = E.calendar(st.virtual).slotEnd; while (E.calendar(t).idx !== 0) t = E.calendar(t).slotEnd;   // 다음 새해 3월 아침
  E.advance(st, t + 1000, ctx); save(); renderAll(true);
  feedback(E.forestOpen(st) ? '🌳 4층이 열렸어요 · 탭 줄 🌳 숲' : '4층이 안 열렸어요', !E.forestOpen(st));
}
// 개발용 (P30-05): 다음 계절 첫 달까지 열어 둔 채(봄) · 또는 열지 않은 채 한 주(= 한 해)를 보내고 다시 연 것처럼 (그동안 계절은 놓침 → 다음 해 맨 앞)
function devYearly(away) {
  if (away) { ctx.live = false; E.advance(st, st.virtual + 7 * 24 * HOUR, ctx); ctx.live = true; E.yearlyMark(st, E.calendar(st.virtual), ctx); }
  else { const s0 = E.calendar(st.virtual).season; let t = E.calendar(st.virtual).slotEnd; while (E.calendar(t).season === s0) t = E.calendar(t).slotEnd; E.advance(st, t + 1000, ctx); }
  const it = E.yearlyNow(st); save(); renderAll(true); feedback(it ? `${E.SEASONS[it.season]} · ${it.icon} ${it.name}` : '꽃잠이에요');
}
// 개발용 (P30-07): 마지막으로 연 때를 ms만큼 앞으로 돌려 저장하고 새로고침 → 열 때 따라잡기 · 🌙 자리를 비운 동안 창 (save()는 lastReal을 지금으로 쓰니 직접 씀)
function devAwayOpen(ms) {
  st.lastReal = Date.now() - ms;
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { return feedback('저장을 못 했어요', true); }
  saveOff = true;                                 // 새로고침 직전 pagehide 저장이 lastReal을 되돌리지 않게
  location.reload();
}
// 개발용 (P31): ✉️ 소식 채우기 — 엔진이 쓰는 문장 꼴로 소식 줄을 일지에 쓰고(시각 at이 붙음) 읽은 때를 그 바로 앞으로 → 위 막대 점 · 창 두 칸
function devInboxFill() {
  const k = E.YEARLY_KEYS[0], Y = E.YEARLY[k], V = E.VISITORS[E.VISITOR_KEYS[0]];
  st.mailSeenAt = st.virtual - 1;
  E.addLog(st, 9, `올해 ${E.SEASONS[Y.season]}엔 ${Y.icon} ${josa(Y.word, '이/가')} 왔어요`);
  E.addLog(st, 9, `${V.icon} ${josa(V.name, '이/가')} ${V.where}에 앉았어요`);
  E.addLog(st, 9, '🌳 정원 뒤에 작은 숲이 생겼어요');
  E.addLog(st, 19, E.slowView(st) ? '무당벌레가 잡초를 치웠어요' : '무당벌레가 잡초 3포기를 치웠어요');
  E.addLog(st, 9, '🏅 새 칭호: 편지함 시험');
  save(); renderAll(true); feedback('✉️ 소식 5줄을 썼어요 · 위 막대 ✉️에 점');
}
// 개발용 (P30-06): 🦔 고슴도치 할머니 부르기 — 나무 그네가 정원에 없으면 둘레가 빈 칸에 놓고(창고 것 · 없으면 새로), 앉아 있으면 떠난 것으로 치고, 부른 뒤 다음 흐르는 달로
function devVisitor() {
  let d = (st.decos || []).find(z => z.key === 'swing' && z.x != null);
  if (!d) {
    const free = (x, y) => x >= 0 && x < W && y >= 0 && y < H && !E.flowerAt(st, x, y) && !E.decoAt(st, x, y);
    let at = null;
    for (let r = 0; r < Math.max(W, H) && !at; r++) for (let y = 10 - r; y <= 10 + r && !at; y++) for (let x = 15 - r; x <= 15 + r && !at; x++) if (free(x, y) && free(x + 1, y) && free(x - 1, y)) at = [x, y];
    if (!at) return feedback('그네를 놓을 빈 칸이 없어요', true);
    d = (st.decos || []).find(z => z.key === 'swing') || (st.decos.push({ id: st.nextId++, key: 'swing', x: null, y: null }), st.decos[st.decos.length - 1]);
    d.x = at[0]; d.y = at[1]; st.dex.deco.swing = true;
  }
  const V = st.visitors; V.now = V.now.filter(v => v.k !== 'hedgehog');
  E.visitorCall(st, 'hedgehog');
  let t = E.calendar(st.virtual).slotEnd; while (E.calendar(t).frozen) t = E.calendar(t).slotEnd;   // 꽃잠엔 손님이 안 와서 다음 흐르는 달까지
  E.advance(st, t + 1000, ctx); save(); renderAll(true);
  const n = E.visitorTimes(st, 'hedgehog'); feedback(st.visitors.now.some(v => v.k === 'hedgehog') ? `🦔 ${n}번째로 왔어요 · 그네 옆을 눌러 보세요` : '🦔 이번엔 못 왔어요 (그네 둘레에 빈 칸이 없어요)');
}
// 개발용 (P30-04-01): 지금 길의 손님을 부르고 다음 흐르는 달까지 — 🐌 달팽이는 핀 꽃 옆, 🐿️ · 🦡는 놓은 장식 · 꽃 옆 (새 철 첫 달엔 🧺 자동 장치 옆)
function devPathVisitor() {
  const p = E.seasonPath(st), k = p && E.VISITOR_KEYS.find(v => E.VISITORS[v].path === p);
  if (!k) return feedback('길을 고른 철에만 길 손님이 와요', true);
  if (!E.visitorOk(st, k)) return feedback(`${E.VISITORS[k].icon} ${E.VISITORS[k].need} 와요 — 앉을 자리가 없어요`, true);
  st.visitors.now = st.visitors.now.filter(v => v.k !== k);
  E.visitorCall(st, k);
  let t = E.calendar(st.virtual).slotEnd; while (E.calendar(t).frozen) t = E.calendar(t).slotEnd;
  E.advance(st, t + 1000, ctx); save(); renderAll(true);
  feedback(st.visitors.now.some(v => v.k === k) ? `${E.VISITORS[k].icon} ${E.visitorTimes(st, k)}번째로 왔어요` : `${E.VISITORS[k].icon} 이번엔 못 왔어요`);
}
// P16-12-03 처음부터 다시 시작 = 완전 초기화 (변경 10-27, 사용자 요청): 이 게임의 저장 키 전부(정원 · 설정 · 되돌리기 칸 · 보관본 · 안내 표시)를 지우고
// 구글 로그인도 끊은 뒤(권한도 돌려줌, 드라이브 파일은 남김) 새로고침 → 처음 온 사람처럼 첫 안내 · 이웃의 화분부터. 계정 칭호는 이어 붙이지 않음 (st.resetAt)
function fullReset() {
  saveOff = true;                                 // 새로고침 직전 pagehide 저장이 정원을 되살리지 않게
  if (cloud.on && cloud.meta.email) cloudLogout(true);
  try { E.resetKeys(Object.keys(localStorage), KEY).forEach(k => localStorage.removeItem(k)); } catch (e) { /* 저장소를 못 쓰면 지울 것도 없음 */ }
  try { sessionStorage.setItem(KEY + '-reset', String(Date.now())); } catch (e) { /* 표시를 못 남기면 새 기기처럼 */ }
  location.reload();
}

// P22-02 이웃의 화분: 첫 방문 · 처음부터 다시 시작할 때 한 번
// 변경 10-27: 화분을 자동으로 골라 상태창을 열지 않음 — 첫걸음 첫 단계가 "정원의 첫 꽃 돌보기"라 직접 눌러 보게 (지도에서 화분이 반짝임)
function giveGift() {
  const r = E.giftPot(st, ctx, ui.giftWant); ui.giftWant = null; ui.titleHold = performance.now() + 2600;
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
    ${st.gift == null ? `<p class="ob-care">${spriteImg((ui.giftWant = E.GIFT_BY_MONTH[cal.month]), 'flower', 32, false, '')} 시작하면 이웃이 <b>${FLOWERS[E.GIFT_BY_MONTH[cal.month]].name}</b> 화분을 하나 나눠 줘요 · 정원 가운데에서 먼저 눌러 보세요</p>
    <p class="ob-care"><span>✉️</span> 꽃집 할머니도 <b>편지와 꾸러미</b>를 보내요 · 말린 꽃잎 두 가지로 블렌딩하고, 찻집이 닫혀 있어도 🍵 <b>첫 손님</b>을 한 번 맞을 수 있어요</p>` : ''}
    <p class="note">${cal.frozen ? `지금은 꽃잠이라 정원이 쉬고 있어요. 첫 해는 <b>월요일 아침 6시</b>(${realH(E.untilMonth(st.virtual, c => !c.frozen).hours)} 뒤)에 3월로 시작해요. 그 전에 💐 화원에서 새해 꽃을 <b>10% 싸게 예약</b>해 두면, 심을 때가 되면 창고로 와요.` : `지금은 ${monthName(cal.month)}이에요. 💐 화원에서 제철 꽃을 사서 심어 보세요.`}</p>
    <p class="note">돌보지 않아도 꽃은 죽지 않고, 놓친 것은 다음 해에 다시 할 수 있어요. 천천히 즐겨 주세요.</p></div>`,
    [{ label: '시작', primary: true, act: startGarden }]);
  ui.onDismiss = startGarden;                     // ✕ · 바깥 · Esc로 닫아도 시작 (QA 15회차)   // 0장 첫 방문: 누르자마자 칭호 (P19, 10-17)
}
