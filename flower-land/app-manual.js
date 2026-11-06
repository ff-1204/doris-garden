// 도리의 정원 — 화면: 📘 매뉴얼 (app.js 다음에 순서대로 불림, 이름은 app.js 첫머리 참고)
'use strict';
// ---------------------------------------------------------------- 📘 매뉴얼 (P21, 10-17 · P45 11-01 다시 씀): 처음 하는 사람 눈높이 — 절마다 한 줄 + 그림 하나, 자세한 건 접어 둠
// P45 기준: "어떻게 하면 되는지(규칙)"는 남기고 "무엇이 있는지(목록)"는 숨김 — 꽃마다 심는 달 · 땅 · 온도 · 습도, 블렌드 레시피, 숨은 칭호, 광물 · 화석,
// 특별 손님 · 올해만 것 · 숲 나무 목록은 📖 도감에서 직접 찾는 재미. 🧬 돌연변이는 떡밥 한두 줄만 (숫자 · 조건 없음) — tests/manual.test.js가 지킴
const MN_SECS = [['start', '🌱 처음 하루'], ['year', '🗓️ 한 해'], ['flower', '🌸 꽃과 땅'], ['care', '🧤 돌보기'], ['shop', '💐 화원'], ['tea', '🍵 찻집'], ['sleep', '🌙 꽃잠'], ['farm', '🐝 곤충'], ['mine', '⛏️ 광산'], ['grow', '🌱 등급'], ['long', '🌳 오래 하기'], ['inbox', '✉️ 편지함'], ['view', '👀 보기'], ['save', '💾 저장']];
function renderManual(force) {
  const cal = E.calendar(st.virtual), slow = E.slowView(st);
  const sig = JSON.stringify([cal.idx, cloudIn(), slow, E.seasonN(st), ui.mnOpen || {}]);
  if (!force && ui.sigs.manual === sig) return;
  ui.sigs.manual = sig;
  const open = ui.mnOpen || (ui.mnOpen = {});
  // 절 = 제목 · 한 줄 요약 · 그림 하나(lead) · 접힌 자세히(more)
  const sec = (k, title, sub, lead, more) => `<section class="mn-sec" id="mn-${k}"><h2 class="mn-h">${title}${sub ? `<small>${sub}</small>` : ''}</h2>${lead}${more ? `<details class="mn-more" data-mnd="${k}" ${open[k] ? 'open' : ''}><summary>자세히</summary><div class="mn-more-in">${more}</div></details>` : ''}</section>`;
  const fig = (inner, cap) => `<figure class="mn-fig">${inner}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
  const item = (art, label, sub, cls) => `<span class="mn-item ${cls || ''}">${art}<small>${label ? `<b>${label}</b>` : ''}${sub || ''}</small></span>`;
  const ico = e => `<span class="mn-ico">${e}</span>`;
  const arrow = (s = '›') => `<span class="mn-arrow" aria-hidden="true">${s}</span>`;
  const bar = (n, c, label) => `<span class="mn-bar" style="--c:${c}">${Array.from({ length: n }, () => '<i class="on"></i>').join('')}<small>${label}</small></span>`;
  const list = rows => `<ul class="mn-list">${rows.filter(Boolean).map(r => `<li>${r}</li>`).join('')}</ul>`;
  const px = (kind, size) => spriteImg('chamomile', kind, size || 40, false, '');
  const body = [
    sec('start', '처음 하루', '이것만 알면 시작할 수 있어요',
      fig(`<div class="mn-flow">${item(px('form'), '① 심기', '💐 화원에서 씨앗')}${arrow()}${item(ico('💧'), '② 돌보기', '물 · 잡초')}${arrow()}${item(px('flower'), '③ 거두기', '꽃이 피면 🧺')}${arrow()}${item(px('dried'), '④ 말리기', '🌾 꽃방에')}${arrow()}${item(px('tea', 44), '⑤ 찻집', '티백을 우려 팔기')}</div>`,
        '꽃을 누르면 할 수 있는 일이 둘레에 떠요 · 서두르지 않아도 괜찮아요, <b>돌보지 않아도 꽃은 죽지 않아요</b>'),
      list(['💐 화원은 그 꽃을 심는 달에만 팔아요 — 산 것은 📦 창고로 와요', '🧺 거둔 꽃잎은 🌿 제다실에서 🌾 꽃방에 널어 말리고, 🏷️ 티백으로 만들어요', '🍵 찻집에서 티백을 우리면 손님이 한 잔씩 사 가요', '막히면 위 막대의 📜 퀘스트 줄을 따라가 보세요'])),
    sec('year', '한 주가 한 해예요', '아침 · 저녁 6시마다 한 달',
      fig(weekPixel(cal), '월요일 아침이 <b>3월</b>, 토요일 밤이 <b>2월</b> · 일요일은 🌙 <b>꽃잠</b>'),
      list(['낮(6–18시)과 밤(18–06시)이 한 달씩이에요', '매일 아침 6시에 🎁 용돈이 조금 들어와요', '주말(토 · 일)에 들어오면 📮 농장 할머니가 정착금 편지를 보내요', '쉬는 동안에도 시간은 흘러요 — 다시 열면 그동안의 정원이 기다려요'])),
    sec('flower', '꽃이 땅을 만들어요', '사람은 꽃만 돌봐요',
      fig(landPixel(), '처음엔 모두 <b>황무지</b> · 심은 꽃 둘레가 그 꽃이 좋아하는 땅으로 천천히 바뀌어요'),
      list(['꽃마다 좋아하는 땅 · 심는 달이 달라요 — 📖 도감에서 하나씩 알아가 보세요',
        '다 자란 꽃은 6시간 뒤에 피고, 꽃잎을 거두면 6시간 뒤에 다시 펴요 · 겨울 휴면과 🌙 꽃잠엔 쉬어요',   // P72-01
        '거둘 때마다 꽃잎이 1장부터 그 꽃의 꽃잎 수(캐모마일 12 · 장미 5 …)까지 나와요 · 🏷️ 티백 하나엔 같은 꽃 꽃잎이 그 수만큼 들어가고, 찻값도 그만큼 올라요',   // P77-C
        '🪵 광산 공방의 나무 울타리를 이어 놓으면 꽃이 바꾸는 땅이 울타리를 못 넘어요',   // P73 · P77-A
        '옆 꽃과 좋아하는 땅이 너무 다르면 기운이 떨어져요 · 옮겨 심은 뒤 잠깐은 적응하는 동안이라 품질이 그대로예요',
        '🪏 살아 있는 꽃은 언제나 옮겨 심을 수 있어요 — 옮길 때마다 삽 1번을 써요(삽 1개로 10번, 꽃잠에도)',   // P83-03
        '★는 품질이에요 — 잘 돌볼수록 올라가고, 좋은 꽃잎이 좋은 차가 돼요',
        '번식(씨앗 받기 · 꺾꽂이 …)하면 꽃이 늘어요 · 한해살이는 몇 달 피고 지고, 여러해살이 · 나무는 오래 살며 계속 피어요',
        '🌙 그리고 소문 하나 — 아주 가끔, 처음 피는 꽃이 낯선 빛을 띤다는 이야기가 있어요. 만나면 오래 지켜봐 주세요'])),
    sec('care', '돌보기', '하루에 한 번이면 충분해요',
      `<div class="mn-fig"><div class="mn-care">
        ${ico('💧')}<span class="nm">물 주기<small>물병</small></span>${bar(2, '#4788b5', '하루 괜찮아요')}
        ${ico('🌿')}<span class="nm">잡초 뽑기<small>호미</small></span>${bar(2, '#3f7f4a', '하루 · 뽑으면 비료')}
        ${ico('✂️')}<span class="nm">가지치기<small>가위 · 나무와 덤불</small></span>${bar(1, '#a8652a', '12시간 품질 ↑')}
        ${ico('🌱')}<span class="nm">비료<small>비료</small></span>${bar(1, '#8a6a44', '12시간 품질 ↑')}
        ${ico('🧺')}<span class="nm">거두기<small>바구니</small></span>${bar(1, '#f2c230', '필 때마다 · 6시간 뒤 다시')}
      </div><figcaption>도구가 없으면 흐린 단추를 눌러 바로 사요</figcaption></div>`,
      list(['두 포기 넘게 돌볼 게 있으면 위 칩 줄의 💧 <b>모두 물 주기</b> · 🧺 <b>모두 거두기</b>로 한 번에', '🧺 정원 저장고(⛏️ 광산 입구 선반)엔 2시간마다 물병 · 비료 · 흙 같은 것이 하나씩 쌓여요 — 놓쳐도 괜찮아요', '돌보지 않은 꽃은 기운 · 품질이 조금씩 떨어질 뿐 시들지 않아요'])),
    sec('shop', '화원과 창고', '심는 달에만 팔아요',
      fig(`<div class="mn-flow">${item(spriteImg('chamomile', 'form', 32, false, ''), '씨앗')}${item(spriteImg('lavender', 'form', 32, false, ''), '묘목')}${item(spriteImg('gamguk', 'form', 32, false, ''), '모종')}${item(spriteImg('lotus', 'form', 32, false, ''), '연근')}${item(spriteImg('dongbaek', 'form', 32, false, ''), '나무')}</div>`,
        '산 것은 📦 <b>창고</b>로 와요 · 창고에서도 품질이 조금씩 떨어지니 너무 오래 두지 마세요'),
      list(['💐 화원 꽃잎으로 만든 차는 산 값만큼만 돌아와요 — 레시피 · 겨울 · 꽃잠 값은 직접 거둔 꽃잎에만 붙어요', `💐 화원 씨앗은 🌱 정원 등급이 오를수록 더 좋은 품질로 와요${slow ? '' : ` (1등급 ${E.pct(E.SEED_Q0)}% · 등급마다 +${E.pct(E.SEED_Q_STEP)}%)`}`, '🗓️ 꽃잠엔 다음 해 씨앗을 싸게 예약할 수 있어요 — 심는 날 아침에 와요', '🌸 꽃잎도 찻값의 60%로 살 수 있어요 — 품질 ★1 · 제다실로 와요 · 경험치 · 도감은 없어요', '싹이 안 튼 씨앗 · 품질이 다 떨어진 것은 🌱 비료가 돼요', '꽃은 심는 달 · 쉬는 달 · 꽃잠에 옮겨 심을 수 있어요', '화원엔 그 달의 장식도 하나씩 들어와요 — 놓아 두면 정원이 반겨요'])),
    sec('tea', '찻집', '매달 열어요',
      fig(`<div class="mn-flow">${item(px('teabag'), '티백')}${arrow()}${item(ico('🫖'), '우리기')}${arrow()}${item(px('tea', 44), '갓 우린 차')}${arrow()}${item(ico('💰'), '손님이 사 가요')}</div>`,
        '🫖 티백은 3분 우려요 · 우린 차는 다음 아침 · 저녁 6시에 식어 값이 내려가요 — <b>팔 만큼만</b> 우려요'),
      list(['말린 꽃잎 2~3가지를 📖 레시피 짝대로 섞으면 🫖 <b>블렌드</b> — 따로 차로 만들 때보다 비싸요. 한 잔에 꽃마다 티백 하나 몫이 들어가고, 블렌딩 창에서 몇 잔 만들지 정해요. 레시피에 없는 짝은 섞이지 않아요(제다실 📖 레시피 · 📖 도감에 쌓여요)',
        `🍃 아주 좋은 꽃잎(★5)으로 만든 차는 햇차라 더 받아요 · ❄️ 겨울과 🌙 꽃잠엔 찻값이 올라요${slow ? '' : ` (×${E.TEA_PRICE_MUL.winter} · ×${E.TEA_PRICE_MUL.sleep})`}`,
        '💌 찻집 위 작은 카페엔 손님이 카운터에 앉아 주문 쪽지를 붙여 둬요 — 맞는 차를 팔면 ✓, 🌙 꽃잠 주문엔 작은 기념품이 따라와요',
        '🍵 <b>꿀차</b>: 📦 창고의 꿀 한 병으로 티백 없이 한 잔을 우려요 — 🐝 꿀벌이 모은 꿀은 손으로 거두지 않아도 창고에 들어와요 · 꽃마다 이름 · 값이 달라요',
        '🪑 빈 자리를 누르면 손님 자리가 늘어 한 시간에 더 많이 팔려요 · ☕ 찻잔은 🫖 우리기 창에서 골라요 · 🪧 간판은 「간판 바꾸기」를 펼쳐요 — 찻잔 · 간판은 보기만 바뀌어요'])),
    sec('sleep', '꽃잠', '일요일, 정원이 쉬어요',
      fig(`<div class="mn-icons">${item(ico('🌱'), '자람', '멈춤', 'off')}${item(ico('🌿'), '잡초 · 목마름', '멈춤', 'off')}${item(ico('🌸'), '심기', '쉬어요', 'off')}${item(ico('↔️'), '옮기기 · 번식', '돼요')}${item(ico('🍵'), '찻집', '열려요')}${item(ico('📖'), '한 해 기록', '돌아봐요')}</div>`,
        '꽃잠엔 아무것도 나빠지지 않아요 — 쉬어 가는 날이에요'),
      list(['꽃잠이 시작되면 한 해를 돌아보는 📖 기록이 남아요', '2월에 핀 채 잠든 꽃은 꽃잠에 한 번 거둘 수 있어요', '일요일에 처음 왔다면 월요일 아침 6시에 첫 해가 시작돼요'])),
    sec('farm', '🐝 곤충농장', '꽃을 돌보는 작은 곤충들',
      fig(`<div class="mn-flow">${['barrel', 'ladybug', 'autobasket', 'hive'].map(k => item(insectImg(k, 2), E.FARM.find(w => w.key === k).name)).join('')}</div>`,
        '곤충을 데려와 정원에 놓으면 <b>둘레의 꽃</b>을 돌봐요 — 아래 곤충 줄의 한 달은 정원 달력으로, 현실 12시간이에요'),
      list([...E.FARM.map(w => { const v = E.BONUS[E.INSECTS[w.key]].vals[0]; return `${w.icon} ${esc(w.name)} — ${esc(E.INSECT_LINE[w.key](typeof v === 'number' ? v : v.r))}`; }),   // P65-04 곤충 일곱 효과 한 줄 (엔진 INSECT_LINE · 기르기 전 둘레)
        '🐞 🪱 🐛는 사람처럼 호미 · 비료 · 가위를 써요 — 떨어지면 ⛏️ 광산 가방 재료로 직접 만들고, 재료가 없으면 기력으로 캐고, 기력도 없으면 그 달은 쉬어요(카드에 까닭이 보여요)',   // P77-B
        '정원 등급이 오르면 데려올 수 있는 곤충이 늘어요 · 한 종류에 하나', '곤충을 누르면 지도에 돌보는 둘레가 노랗게 보여요 · 💰 돈을 내면 둘레를 넓혀요(등급이 닿으면)', '곤충 둘레는 2칸부터 4칸 · 6칸으로 넓어져요', '🌼 정원 손길 줄: 🌱 자라는 속도(꽃이 처음 피기까지) · 🌾 말리는 속도를 단계마다 사요 — 사 둔 단계 아래로는 언제든 낮춰 쓸 수 있어요', '곤충은 손을 덜어 줘요 · 🐝 꿀벌 꿀은 🍵 꿀차로 팔 수 있어요 · 꽃잠엔 쉬어요'])),
    sec('mine', '정원 뒤 광산', '기다리는 동안 조금씩',
      fig(`<div class="mn-flow">${item(ico('⛏️'), '기력', '1분마다 1칸')}${arrow()}${item(mineImg('stone', 2), '파기', '한 칸에 1')}${arrow()}${item(mineImg('stairs', 2), '계단', '아래층으로')}${arrow()}${item(mineImg('jewel', 2), '💎 보석', '바로 돈')}</div>`,
        '기력은 꺼 둔 동안에도 차요 · 깊이 내려갈수록 드문 것이 나와요'),
      list(['💎 보석은 파는 순간 돈이 되고, 깊은 층일수록 비싸요', '🪜 계단으로 한 층 내려갈 때마다 2,000원을 받아요', '흙 · 돌 · 광물은 팔지 않고 ⛏️ 광산 공방 · 🔨 <b>재료 만들기</b>에 써요', '🧺 물병 · 비료 · 호미 · 가위 · 바구니 · 삽은 모두 광산 공방에서 재료로 만들어요 — 재료가 모자라면 그 카드에서 바로 사요', `⛏️ <b>자동 캐기</b>를 켜 두면 꺼 둔 동안에도 기력이 찰 때마다 파요 — 칸마다 돈을 내고${slow ? '' : ' (깊을수록 비싸요)'}, 돈이 모자라면 멈춰요 · 경험치와 주간 목표엔 들지 않아요`, '🌹 <b>프리저브드</b>: 🧪 특수 용액이 있으면 품질 · 기운 100%로 핀 꽃을 눌러 만들어요 — 꽃방에서 하루 뒤 📦 창고로 오고, 💐 화원에 팔아요', `🌹 프리저브드는 팔지 않고 정원에 장식으로 놓아도 돼요 — 둘레 꽃이 🌙 꽃잠에 ${slow ? '아주 조금씩 좋아져요' : `품질 +${E.PRES_DECO_Q * 100}%씩 올라요`} · 거두면 다시 팔 수 있어요`, '⛏️ <b>광산 공방</b>: 장식 · 장치를 재료로 만들거나 💰 돈으로 사요 — 정원에 놓으면 저마다 작은 효과가 있어요(카드에 한 줄)', '무엇이 묻혀 있는지는 직접 파 보세요 — 처음 찾은 것은 📖 광산 도감에 남아요'])),
    sec('grow', '정원 등급과 목표', '숙제가 아니에요',
      fig(`<div class="mn-flow">${item(ico('🧺'), '거두기 · 팔기')}${item(ico('💌'), '주문 · 퀘스트')}${item(ico('📖'), '도감')}${arrow()}${item(ico('🌱'), '정원 등급', '오를수록 열려요')}</div>`,
        '정원에서 한 일만큼 등급이 올라요 · 돈으로 산 것은 세지 않아요'),
      list(['🌱 모든 활동에서 경험치가 쌓여요 — 물 주기 · 말리기 · 광산 파기까지 · 📔 도감일지 등급 칸에서 어디서 얼마나 왔는지 봐요', '📔 도감일지의 장을 하나씩 끝내면 칭호를 얻어요 · 대표 칭호를 골라 달 수 있어요', '🏅 칭호마다 작은 효과가 하나씩 있어요 — 대표로 건 칭호 하나만 일해요 (칭호 카드에 한 줄)', '🎀 장식 카드의 「대표로 달기」로 대표 장식을 위 막대 로고 자리에 달 수 있어요 — 정원에 다시 놓으면 내려와요', '🗓️ 월요일 아침마다 이번 주 목표 3개 — 못 끝내도 그냥 사라져요', '🏅 꽃잠 기록 때 정원 점수 — 남과 겨루지 않고 내 기록과만', '퀘스트 · 점수 · 숫자가 숙제 같으면 ⚙️ 설정 › 🐢 <b>느긋하게 보기</b>'])),
    sec('long', '오래 하는 정원', '해가 쌓이면 정원이 넓어져요',
      fig(`<div class="mn-flow">${item(ico('🌸'), '꽃밭')}${arrow()}${item(ico('🍵'), '찻집')}${arrow()}${item(ico('⛏️'), '광산과 벌통')}${arrow()}${item(ico('❔'), '그다음은', '직접 만나요')}</div>`,
        '해가 쌓이면 새해 3월 아침에 정원이 한 층씩 넓어져요 — 📔 도감일지에서 다음 층까지 남은 것을 봐요'),
      list(['↗ 정원 탭 <b>공유</b>로 정원을 게시물 네 장이나 스토리 한 장으로 만들어요 — 그림은 기기 안에서만 만들고, 게시물엔 링크가 안 들어가니 「주소 복사」를 써요', '🗓️ 해마다 계절마다 그해에만 오는 것이 있어요 — 한 번 열면 봐요', '🐾 어떤 장식 옆엔 특별한 손님이 앉기도 해요 — 누구인지는 만나 보세요', `🌸 <b>새 철</b>: 몇 해를 보내고 꽃을 모두 피우면 꽃잠에 새 철을 시작할 수 있어요 — 등급 · 칭호 · 도감 · 🌹 프리저브드 · 🪑 찻집 가꾸기는 그대로 이어지고 땅 · 꽃 · 돈은 새로${E.seasonN(st) >= 2 ? ` (지금 ${E.seasonN(st)}철)` : ''}`, '🛤️ 새 철엔 걷고 싶은 길(꽃길 · 찻길 · 흙길)을 하나 고를 수 있어요 — 안 골라도 괜찮아요', '⚙️ 처음부터 다시 시작(1년차에만)은 새 철과 달리 모두 지워요'])),
    sec('inbox', '편지함', '편지와 소식을 한곳에',
      fig(`<div class="mn-flow">${item(ico('✉️'), '위 막대 ✉️', '새로 오면 점')}${arrow()}${item(ico('📮'), '편지', '선물이 오기도')}${item(ico('🔔'), '소식', '지나간 알림')}</div>`,
        '🎁가 붙은 편지는 아직 선물을 안 받은 것이에요'),
      list(['📮 운영자 편지 · ✉️ 이웃 답장 · 💌 꽃집 할머니 편지를 다시 읽을 수 있어요', '소식 칸엔 지나간 알림이 최근 것부터 모여요 — 재촉하지 않아요'])),
    sec('view', '보기 설정', '⚙️ 설정 › 👀 보기',
      fig(`<div class="mn-icons">${item(ico('🐢'), '느긋하게 보기', '숫자 · 목표를 숨겨요')}${item(ico('🔠'), '큰 글씨', '글자 · 단추를 크게')}${item(ico('🧩'), '땅 무늬', '색 대신 무늬로')}</div>`,
        '보는 것만 바뀌고 얻는 것은 그대로예요'), ''),
    sec('save', '저장', '정원은 운영자에게 보내지 않아요',
      fig(`<div class="mn-flow">${item(ico('🌐'), '자동 저장', '이 브라우저에')}${arrow()}${cloudIn() ? item(ico('☁️'), '구글 드라이브', '내 드라이브에도') : item(ico('💾'), '파일로 저장', '가끔 받아 두기')}${arrow()}${item(ico('🌙'), '돌아오면', '그동안을 한 창에')}</div>`,
        cloudIn() ? '구글로 로그인해 두어 정원이 내 드라이브에도 저장돼요 · 다른 기기에서 같은 계정으로 이어 해요' : '브라우저 데이터를 지우면 정원이 사라질 수 있어요 — ⚙️ 설정 › 💾 저장에서 가끔 파일로 받아 두세요'),
      list([`오래 비워도 다시 열면 최대 ${E.CATCHUP_WEEKS}주를 따라잡고, 🌙 <b>자리를 비운 동안</b> 창에 그사이 일(곤충이 한 일 · 쌓인 것)을 모아 보여 줘요`, cloud.on && !cloudIn() ? '⚙️ 설정 › 💾 저장에서 ☁️ 구글로 로그인하면 내 드라이브에도 저장돼요' : '', '정원의 어떤 내용도 운영자에게 보내지 않아요 · 총 방문 수만 쿠키 없이 세요 (<a href="privacy.html">개인정보처리방침</a>)'])),
  ].join('');
  $('#p-manual').innerHTML = `<div class="stack"><div class="sectionhead"><span class="sb-title" style="font-family:var(--font-display);font-weight:700;font-size:var(--fs-lg)">📘 매뉴얼</span><span class="muted">처음이라면 🌱 처음 하루부터</span></div>
    <nav class="mn-chips" aria-label="매뉴얼 차례">${MN_SECS.map(([k, l]) => `<a href="#mn-${k}" data-mn="${k}">${l}</a>`).join('')}</nav>${body}</div>`;
}
$('#p-manual').addEventListener('toggle', e => { const d = e.target.closest && e.target.closest('[data-mnd]'); if (d) (ui.mnOpen || (ui.mnOpen = {}))[d.dataset.mnd] = d.open; }, true);   // 다시 그려도 펼친 채로
$('#p-manual').addEventListener('click', e => {
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
// 👣 총 방문 수 (11-01): GoatCounter 공개 숫자를 읽기만 — 열 때 한 번, 못 읽으면 줄만 남김
let visits = null, visitsAsked = false;
const visitText = () => visits == null ? '방문 수를 세고 있어요' : `지금까지 ${visits.toLocaleString('ko-KR')}번 방문했어요`;
function loadVisits() {
  if (visitsAsked) return; visitsAsked = true;
  fetch('https://doris-garden.goatcounter.com/counter/TOTAL.json?start=2026-11-01').then(r => r.ok ? r.json() : null)
    .then(j => { const n = j && parseInt(String(j.count).replace(/\D/g, ''), 10); if (!Number.isFinite(n)) return; visits = n; const el = $('#visitCount'); if (el) el.textContent = visitText(); })
    .catch(() => { /* 읽지 못하면 그대로 */ });
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
      row('🐢', '느긋하게 보기', '퀘스트 · 주문 쪽지 · 점수 · 주간 목표 · 꽃별 셈과 여러 숫자를 숨겨요. 칭호는 알림 없이 도감에 쌓이고, ✉️ 소식은 숫자 없이 와요', tog('id="slowOn"', s.slow))
      + row('🔠', '큰 글씨', '글자를 1.25배로 키우고 단추 · 탭을 넓혀요. 그림 크기는 그대로예요', tog('id="bigOn"', s.big))   // P28-01
      + /* P28-03 */ row('🧩', '땅 무늬 보기', `땅마다 다른 무늬를 지도 · 범례에 겹쳐요. 색이 비슷해 보이는 땅을 무늬로 알아봐요${s.pattern ? `<span class="pat-key">${LAND_KEYS.map(k => `<span>${landSw(k)}${LANDS[k].name}</span>`).join('')}</span>` : ''}`, tog('id="patOn"', s.pattern)))}
    ${group('🔔', '알림', '꺼도 정원 일지에는 그대로 남아요',
      [[3, '📦', '예약 배송', '예약한 꽃이 창고에 왔을 때'], [8, '🌸', '개화와 수확', '꽃이 피어 거둘 수 있을 때'], [9, '📖', '도감 등록', '새 꽃·차·땅을 처음 만났을 때']].map(([t, ic, nm, d]) => row(ic, nm, d, tog(`data-toast="${t}"`, s.toast[t]))).join('')
      + row('🖥️', '브라우저 알림', '정원이 다른 탭 · 창 뒤에 있을 때 꽃이 피거나 소식이 오면 브라우저 알림으로도 · 처음 켤 때 브라우저가 허락을 물어요 · 정원을 닫으면 오지 않아요', tog('id="notifyOn"', s.notify))   // R-C2
      + row('🌙', '수면 시간', '이 시간의 알림은 모아 두었다가 끝날 때 한 번에 · 지금은 시간만 기억해 둬요', tog('id="sleepOn"', s.sleep.on))
      + `<div class="set-sub ${s.sleep.on ? '' : 'off'}" id="sleepSub"><div class="row sleeprow"><select id="sleepFrom" class="plantsel" ${s.sleep.on ? '' : 'disabled'}>${hours.map(h => opt(h, s.sleep.from)).join('')}</select><span class="muted">부터</span><select id="sleepTo" class="plantsel" ${s.sleep.on ? '' : 'disabled'}>${hours.map(h => opt(h, s.sleep.to)).join('')}</select><span class="muted">까지</span></div>${sleepBar()}</div>`)}
    ${!DEV ? '' : group('⏩', '시간', '개발용 · 이 컴퓨터(localhost)에서만 보여요',
      `<div class="speedgrid" role="group" aria-label="배속">${SPEEDS.map(([v, l, d]) => `<button type="button" data-speed="${v}" aria-pressed="${st.speed === v}"><b>${l}</b><small>${d}</small></button>`).join('')}</div>`
      + row('⏭', '다음 달로 건너뛰기', '지금 달을 바로 끝내요', '<button type="button" class="btn small" id="skipMonth">다음 달</button>')
      + row('🐝', '곤충 다 데려오기', '곤충농장 확인용 (P32 · P39) · 정원 등급 12 · 돈을 채우고 곤충 일곱을 창고에 데려와요', '<button type="button" class="btn small" id="devFarm">데려오기</button>')
      + row('🌱', '등급 경험치 더하기', '등급 화면 확인용 · 퀘스트 10개 몫(100)', '<button type="button" class="btn small" id="devXp">+100</button>')
      + row('🗓️', '주간 목표', '목표 확인용 · 안 끝낸 첫 목표를 끝내거나 다음 월요일 아침으로', '<span class="row" style="gap:var(--sp-3)"><button type="button" class="btn small" id="devWeekly">하나 끝</button><button type="button" class="btn small" id="devWeek">다음 주</button></span>')
      + row('🌸', '새 철 조건 채우기', '새 철 확인용 (P28-08) · 이번 철 해마다 기록 3줄 · 꽃 13종 도감 · 꽃잠으로', '<button type="button" class="btn small" id="devSeason">채우기</button>')
      + row('🌳', '해 8개 쌓기', '정원의 층 확인용 (P30-01) · 3층까지 열고 해마다 기록 8줄 · 꽃 13종 도감', '<button type="button" class="btn small" id="devLayer">쌓기</button>')
      + row('🌳', '작은 숲', '작은 숲 확인용 (P30-03 · P30-01-03) · 4층 조건을 채우고 새해 3월 아침으로 넘김(알림 · 숲 탭) · 숲 나무를 한 해씩 키움(해마다 기록은 그대로)', '<span class="row" style="gap:var(--sp-3)"><button type="button" class="btn small" id="devForest">4층 열기</button><button type="button" class="btn small" id="devTreeGrow">한 해 키우기</button></span>')
      + row('🗓️', '올해만 것', '올해만 확인용 (P30-05) · 다음 계절 첫 달로 · 열지 않은 채 한 해(그동안 계절은 놓침)', '<span class="row" style="gap:var(--sp-3)"><button type="button" class="btn small" id="devYSeason">다음 계절</button><button type="button" class="btn small" id="devYAway">비운 채 한 해</button></span>')
      + row('⏪', '비운 채 열기', '그동안 확인용 (P30-07) · 마지막으로 연 때를 13주(13해) 또는 3시간 전으로 돌리고 새로고침 (따라잡기는 상한까지만)', '<span class="row" style="gap:var(--sp-3)"><button type="button" class="btn small" id="devAway13">13해</button><button type="button" class="btn small" id="devAway3h">3시간</button></span>')
      + row('🛤️', '철의 길', '철의 길 확인용 (P30-04) · 새 철 조건을 채우고 길 카드 확인 창을 엶 · 지금 길의 손님을 다음 흐르는 달에 부름', '<span class="row" style="gap:var(--sp-3)"><button type="button" class="btn small" id="devPath">새 철 창</button><button type="button" class="btn small" id="devPathVisitor">길 손님</button></span>')
      + row('🧬', '변이 꽃 피우기', '돌연변이 확인용 (P36) · 정원 첫 꽃(핀 꽃 먼저)을 변이 꽃으로 · 🫙 유리 관 +3 — 품질을 낮추면 2 · 3단계', '<button type="button" class="btn small" id="devMutant">피우기</button>')
      + row('✉️', '소식 채우기', '편지함 확인용 (P31) · 올해만 것 · 손님 · 층 · 무당벌레 · 칭호 소식을 일지에 쓰고 읽은 때를 그 앞으로 → 위 막대 점', '<button type="button" class="btn small" id="devInbox">채우기</button>')
      + row('🐾', '손님 부르기', '특별 손님 확인용 (P30-06) · 나무 그네를 놓고 🦔 고슴도치 할머니를 다음 흐르는 달에 부름 (세 번 부르면 기념품)', '<button type="button" class="btn small" id="devVisitor">부르기</button>')
      + row('👁️', '색약 흉내', '땅 무늬 확인용 (P28-03) · 화면 전체에 색약 필터를 씌워요 · 저장하지 않아요', `<select id="devCvd" class="plantsel">${[['', '꺼짐'], ['protan', '적색약'], ['deutan', '녹색약'], ['tritan', '청색약']].map(([v, l]) => `<option value="${v}" ${v === devCvdOn ? 'selected' : ''}>${l}</option>`).join('')}</select>`)
      + row('📮', '운영자 편지', `편지 확인용 (P29) · mail.json을 다시 읽거나, 받은 기록 ${Object.keys(st.mailGot || {}).length}통과 편지함의 📮 편지를 지워요`, '<span class="row" style="gap:var(--sp-3)"><button type="button" class="btn small" id="devMail">다시 읽기</button><button type="button" class="btn small" id="devMailForget">기록 지우기</button></span>'))}
    ${(() => { const us = undoSummary(), files = !cloudIn();   // 구글 로그인 중엔 💾 저장하기 · 📂 불러오기를 숨김 (P20-02, 10-27 사용자 요청)
      return group('💾', '저장', files ? '진행은 이 브라우저에 자동 저장돼요 · 다른 기기로 옮기거나 지켜 두려면 가끔 파일로 받아 두세요' : '진행은 이 브라우저와 내 구글 드라이브에 저장돼요',
      (cloud.on ? `<div id="cloudRows" class="cloud-rows">${cloudRows(row)}</div>` : '')   // ☁️ 구글 드라이브 (P20-04-02, 클라이언트 ID가 있을 때만)
      + (!files ? '' : row('💾', '저장하기', `파일로 내려받아요 · ${st.lastExport ? `마지막 저장 ${whenText(st.lastExport)}` : '아직 저장한 적이 없어요'}${exportStale() ? ' · <b class="val-down">한동안 저장하지 않았어요</b>' : ''}`, `<span class="row" style="gap:var(--sp-3)"><button type="button" class="btn small" id="exportBtn">저장</button>${canShareFile ? '<button type="button" class="btn small" id="shareBtn">보내기</button>' : ''}</span>`)
      + row('📂', '불러오기', '저장한 파일로 정원을 바꿔요. 바꾸기 전에 요약을 보여 줘요', '<button type="button" class="btn small" id="importBtn">불러오기</button><input type="file" id="importFile" hidden>'))
      + (IOS_EVICT ? row('📱', 'iPhone · iPad Safari', `7일 넘게 열지 않으면 Safari가 정원을 지울 수 있어요. <b>공유 › 홈 화면에 추가</b>로 앱처럼 쓰${files ? '거나 💾 저장해 두세요' : '세요 · ☁️ 드라이브에서 다시 불러올 수 있어요'}`, '') : '')
      + (IN_APP ? row('💬', '앱 안의 브라우저', '카카오톡 · 인스타그램 안에서 연 정원은 그 앱 안에만 저장돼요. Chrome · Safari로 열면 다른 정원이 돼요', '<button type="button" class="btn small" id="copyAddrBtn">주소 복사</button>') : '')
      + (us ? row('↩︎', '불러오기 전으로 되돌리기', `보관한 정원: ${yearWord(us.year)} ${monthName(us.month)} · ${won(us.money)} · 도감 ${us.dex} / ${us.dexTotal} · 칭호 ${us.titles}개`, '<button type="button" class="btn small" id="undoBtn">되돌리기</button>') : '')
      + (brokenRaw() ? row('🧰', '열지 못한 예전 정원', '여는 중에 문제가 생겨 따로 보관한 정원이에요. 파일로 받아 운영자에게 보내 주세요', '<span class="row" style="gap:var(--sp-3)"><button type="button" class="btn small" id="brokenDl">내려받기</button><button type="button" class="btn small" id="brokenDel">지우기</button></span>') : ''));
    })()}
    ${!E.canReset(st, E.calendar(st.virtual)) ? '' : group('🌱', '정원', '되돌릴 수 없어요',
      row('🗑️', '처음부터 다시 시작', `새 철과 달리 모두 지워요 — 이 브라우저의 정원 · 설정 · 보관본을 지우고 첫 안내부터 다시 시작해요${cloud.on && cloud.meta.email ? ' · 구글에서 로그아웃해요 · 드라이브에 저장한 정원은 남아요' : ''}`, '<button type="button" class="btn small danger" id="resetBtn">다시 시작</button>', 'danger'), 'danger-group')}
    ${group('ℹ️', '정보', '',
      row(`${document.querySelector('.logo-px') ? document.querySelector('.logo-px').outerHTML.replace('width="33" height="30"', 'width="22" height="20"') : '🌱'}`, "도리의 정원 · Dori's Garden", `진행은 이 브라우저에 자동 저장돼요 ${cloudIn() ? '(☁️ 구글 드라이브에도)' : '(💾 파일로 옮길 수 있어요)'}`, '')
      + row('👣', '방문', `<span id="visitCount">${visitText()}</span>`, '')   // 총 방문 수 (11-01, GoatCounter — 개인정보처리방침 3번)
      + row('🔤', '글꼴', '주아 · 고운바탕 · IBM Plex (모두 SIL 오픈 폰트 라이선스)', '')
      + row('📜', '정책', '정원이 저장하는 곳과 약속', '<span class="row" style="gap:var(--sp-3)"><a class="btn small" href="privacy.html">개인정보처리방침</a><a class="btn small" href="terms.html">이용약관</a></span>'))}
  </div>`;
  resetArmed = false;
  loadVisits();
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
  $('#notifyOn').addEventListener('change', async e => {   // R-C2 켤 때 허락 묻기 — 거절하면 다시 끔
    if (!e.target.checked) { s.notify = false; save(); return feedback('브라우저 알림을 껐어요'); }
    if (!('Notification' in window)) { e.target.checked = false; return feedback('이 브라우저는 알림을 지원하지 않아요', true); }
    let p = Notification.permission; if (p === 'default') { try { p = await Notification.requestPermission(); } catch (err) { p = 'denied'; } }
    s.notify = p === 'granted'; e.target.checked = s.notify; save();
    feedback(s.notify ? '🖥️ 정원이 뒤에 있을 때 브라우저 알림으로 알려 드릴게요' : '브라우저가 알림을 막았어요 · 주소창 옆 자물쇠에서 허락할 수 있어요', !s.notify);
  });
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
  if (DEV) $('#devMutant').addEventListener('click', () => { const r = E.mutDev(st, ctx); save(); renderAll(true); feedback(r.msg, !r.ok); });   // 개발용 (P36)
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
// 개발용 (P32-04 · P39): 🐝 곤충 다 데려오기 — 등급 12 · 돈을 채워 곤충농장 흐름(buyDeco)으로 일곱 모두 창고에
function devFarmFill() {
  if (E.gradeOf(st).grade < 12) st.grade.xp = Math.max(st.grade.xp, E.gradeXpAt(12));
  st.money += 300000;
  for (const w of E.FARM) {
    if ((st.decos || []).some(d => d.key === w.key)) continue;
    if (!E.buyDeco(st, w.key, ctx).ok) { (st.decos = st.decos || []).push({ id: st.nextId++, key: w.key, x: null, y: null }); st.dex.deco[w.key] = true; }
  }
  save(); setTab('farm'); feedback('🐝 곤충 일곱을 창고에 데려왔어요 · 카드에서 정원에 놓아요');
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
  E.addLog(st, 19, E.slowView(st) ? '무당벌레가 잡초를 치웠어요' : '무당벌레가 잡초 1포기를 치웠어요');
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
// 변경 10-31 (사용자 요청): 첫 안내는 "더 이상 보지 않기"를 누를 때까지 열 때마다 — 이 기기 표시(localStorage, 완전 초기화면 같이 지워짐). ✕ · 바깥 · Esc는 정원만 시작하고 표시는 안 남김
const INTRO_KEY = KEY + '-intro';
function introDone() { try { return !!localStorage.getItem(INTRO_KEY); } catch (e) { return true; } }   // 저장소를 못 쓰면 매번 띄우지 않음
function introOff() { try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) { /* 못 남기면 다음에 한 번 더 */ } startGarden(); }
// 변경 10-31 (사용자 요청 "컨셉과 핵심만" → "픽셀 아트 · 감성 게임처럼"): 그림책처럼 장면 셋 — 땅 · 시간 · 꽃에서 차까지. 그림은 가운데, 글은 세리프 한 줄 + 작은 한 줄.
// 물 주기 · 이웃 화분 · 할머니 꾸러미 · 이달 안내는 해 보면서 알게 (첫걸음 · 매뉴얼에 있음)
function onboarding() {
  const cal = E.calendar(st.virtual), f = 'chamomile';
  if (st.gift == null) ui.giftWant = E.GIFT_BY_MONTH[cal.month];   // 창을 연 채 달이 바뀌어도 화분 꽃은 열 때 것으로
  const scene = (art, line, sub) => `<section class="ob-scene">${art}<p>${line}<small>${sub}</small></p></section>`;
  const dots = '<div class="ob-dots" aria-hidden="true"><i></i><i></i><i></i></div>';
  const box = (k, kind, alt) => `<span class="ob-px">${spriteImg(k, kind, 32, false, alt)}</span>`, ar = '<span class="ob-ar" aria-hidden="true">›</span>';
  const teaFlow = `<div class="ob-flow" role="img" aria-label="핀 꽃 · 말린 꽃잎 · 티백 · 찻잔">${box(f, 'flower', '핀 꽃')}${ar}${box(f, 'dried', '말린 꽃잎')}${ar}${box(f, 'teabag', '티백')}${ar}${box(f, 'tea', '찻잔')}</div>`;
  openModal('도리의 정원', `<div class="ob-story">
    ${scene(landPixel(), '메마른 땅에 꽃 한 포기를 심었어요.', '꽃은 저 좋아하는 땅을 둘레에 조금씩 만들어 가요')}${dots}
    ${scene(weekPixel(cal), '여기선 한 주가 한 해예요.', '아침과 저녁에 한 달씩 흘러요 · 일요일엔 꽃들이 잠들어요')}${dots}
    ${scene(teaFlow, '꽃잎을 거두어, 말리고, 차로 우려요.', '찻집에 손님이 들르면 한 잔 내어 드려요')}
    <p class="ob-end">${cal.frozen ? '지금은 🌙 꽃잠이에요. 월요일 아침 6시, 첫 해가 시작돼요.<br>' : ''}서두르지 않아도 괜찮아요. 꽃은 기다려 줘요.</p></div>`,
    [{ label: '더 이상 보지 않기', act: introOff }, { label: '시작하기', primary: true, act: startGarden }]);   // R-C3 (11-05 검토): 「시작하기」가 기본 — 그림책은 다음에도 뜸 · 「더 이상 보지 않기」는 따로   // 변경 10-31 (사용자 요청) — 누를 때까지 열 때마다 뜸 (introDone)
  ui.onDismiss = startGarden;                     // ✕ · 바깥 · Esc로 닫아도 시작 (QA 15회차)   // 0장 첫 방문: 누르자마자 칭호 (P19, 10-17)
}
