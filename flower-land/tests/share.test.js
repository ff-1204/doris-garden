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

console.log('[외부로 보내지 않음]');
{ const src = fs.readFileSync(path.join(__dirname, '..', 'app-garden.js'), 'utf8'), a = src.indexOf('P55 ↗'), b = src.indexOf('P55 끝');
  const part = a > 0 && b > a ? src.slice(a, b) : '';
  check(!!part, '화면 코드에 P55 부분이 있음');
  check(!/fetch\(|XMLHttpRequest|sendBeacon|https?:\/\//.test(part), '공유 그림 코드는 서버로 보내지 않음 (fetch · 주소 없음)');
  check(!/Math\.random/.test(part), 'Math.random 없음'); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
