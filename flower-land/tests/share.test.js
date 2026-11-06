// P55 ↗ 인스타 스토리 공유 (11-02): 스토리 그림에 넣을 글자 shareCard — 보상 없음 · 저장 형식 그대로 · 외부로 보내지 않음
const path = require('path'), fs = require('fs');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const MON = new Date(2026, 9, 5, 6, 0, 0).getTime();
const fresh = () => { const s = E.create(MON, () => 0.5); s.onboarded = true; s.gardenId = 'p55'; return s; };

console.log('[글자]');
{ const s = fresh(), c = E.shareCard(s), cal = E.calendar(s.virtual);
  check(c.title === '도리의 정원', '제목 「도리의 정원」');
  check(c.when === `1년째 · ${E.monthName(cal.month)}`, `해 · 달 줄: ${c.when}`);
  check(c.flowers === `꽃 ${s.flowers.filter(f => !f.withered).length}포기`, `꽃 포기 수: ${c.flowers}`);
  check(c.grade === E.gradeOf(s).name, `정원 등급 이름: ${c.grade}`);
  check(c.year === '1년째' && c.month === E.monthName(cal.month) && c.count === `${s.flowers.filter(f => !f.withered).length}포기`, `라벨-값 칸 (P55-05): ${c.year} · ${c.month} · ${c.count}`);
  check(c.titleName === null, '대표 칭호가 없으면 null');
  check(c.url === 'ff-1204.github.io/doris-garden', '맨 아래 주소');
  check(/^doris-garden-1-\d+\.png$/.test(c.file), `파일 이름: ${c.file}`); }

console.log('[시든 꽃 · 대표 칭호 · 느긋하게 보기]');
{ const s = fresh(), live = s.flowers.filter(f => !f.withered).length;
  if (s.flowers[0]) { s.flowers[0].withered = true; check(E.shareCard(s).flowers === `꽃 ${live - 1}포기`, '시든 꽃은 세지 않음'); }
  const k = E.TITLE_KEYS[0]; s.titles[k] = true; s.titleOn = k;
  check(E.shareCard(s).titleName === E.TITLES[k].name, `대표 칭호 이름: ${E.TITLES[k].name}`);
  s.settings.slow = true; check(E.shareCard(s).flowers === null && !!E.shareCard(s).grade, '느긋하게 보기면 포기 수 줄만 빠짐');
  check(E.shareCard(s).count === null, '느긋하게 보기면 꽃 칸(count)도 빠짐'); }
{ const s = fresh(); s.flowers = []; const c = E.shareCard(s);
  check(c.count === '0포기' && c.flowers === '꽃 0포기', '꽃 0포기도 그대로 적음'); }
check(E.monthName(13) === '쉼달' && E.monthName(14) === '꽃샘달', '쉼달 · 꽃샘달 — 그림의 달 칸에 이름 그대로');

console.log('[저장 · 경제 그대로]');
{ const s = fresh(), before = JSON.stringify(s); E.shareCard(s);
  check(JSON.stringify(s) === before, 'shareCard는 정원을 바꾸지 않음 (보상 없음 · st 필드 그대로)'); }

console.log('[P87 게시물 네 장]');
{ const s = fresh(), a = E.shareAlbum(s);
  check(E.shareCard(s).link === 'https://ff-1204.github.io/doris-garden/', '「주소 복사」 주소');
  check(a.flowerTitle === '정원의 꽃' && a.flowers.length === 0 && a.more === 0, '새 정원: 꽃이 없으면 빈 목록 (화면이 기다리는 글을 씀)');
  check(a.rows.length >= 1 && a.rows.some(r => r[0] === '정원 등급') && a.rows.every(r => r[1]) && a.young === true, `새 정원 기록은 값이 있는 줄만: ${a.rows.map(r => r[0]).join(' · ')}`); }
{ const s = fresh(), put = (type, n) => { for (let i = 0; i < n; i++) s.flowers.push({ id: 9000 + s.flowers.length, type, x: s.flowers.length % 30, y: 1, withered: false }); };
  E.FLOWER_KEYS.forEach((k, i) => { put(k, i + 1); }); s.flowers[0].withered = true;
  s.yearSeen = { bloom: Object.fromEntries(E.FLOWER_KEYS.map(k => [k, true])), blend: {}, honey: {} }; s.yearNow.sold = 1234; s.yearNow.harvest = 56; s.stats.orders = 7;
  const a = E.shareAlbum(s), rec = Object.fromEntries(a.rows);
  check(a.flowerTitle === '올해 핀 꽃' && a.flowers.length === 9 && a.more === E.FLOWER_KEYS.length - 9, `꽃은 9가지까지 · 그 밖에 ${a.more}종`);
  check(a.flowers[0].count === `${E.FLOWER_KEYS.length}포기` && a.flowers[0].k === E.FLOWER_KEYS[E.FLOWER_KEYS.length - 1], '많은 꽃부터 · 시든 꽃은 세지 않음');
  check(rec['올해 판 찻잔'] === '1,234잔' && rec['올해 거둔 꽃잎'] === '56장' && rec['들어준 주문'] === '7장' && a.young === false, '기록 줄');
  check(!a.rows.some(r => /원$/.test(r[1]) && !r[1].includes('정원')), '돈 숫자는 없음');
  const before = JSON.stringify(s); E.shareAlbum(s); check(JSON.stringify(s) === before, 'shareAlbum은 정원을 바꾸지 않음');
  s.settings.slow = true; const b = E.shareAlbum(s);
  check(b.rows === null && b.flowers.every(f => f.count === null) && b.flowers.length === 9, '🐢 느긋하게 보기: 기록 장 없음 · 포기 수 없음'); }

console.log('[외부로 보내지 않음]');
{ const src = fs.readFileSync(path.join(__dirname, '..', 'app-garden.js'), 'utf8'), a = src.indexOf('P55 ↗'), b = src.indexOf('P55 끝');
  const part = a > 0 && b > a ? src.slice(a, b) : '';
  check(!!part, '화면 코드에 P55 부분이 있음');
  check(!/fetch\(|XMLHttpRequest|sendBeacon|https?:\/\//.test(part), '공유 그림 코드는 서버로 보내지 않음 (fetch · 주소 없음)');
  check(!/Math\.random/.test(part), 'Math.random 없음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
