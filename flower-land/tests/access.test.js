// P28-01 🔠 큰 글씨 · P28-03 🧩 땅 무늬 보기 (M4 10-30): 판단 함수 · 기본 꺼짐 · 저장 · 예전 정원 보정 · 새 철 뒤 유지 · 켜도 규칙 그대로 · 무늬 10가지가 모두 다름
const path = require('path');
const E = require(path.resolve((process.argv[2] || path.join(__dirname, '..', 'engine.js'))));
let fails = 0; const check = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const H = E.HOUR, WEEK = 7 * 24 * H, ctx = { live: false, rng: () => 0.5 };
const copy = o => JSON.parse(JSON.stringify(o));
const mon = (() => { let t = Date.UTC(2026, 9, 5, 0, 0); for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const REST = 12 * 12 * H + H;

console.log('[판단 함수 · 기본값]');
const st = E.create(mon + 0.1 * H, () => 0.5);
check(st.settings.big === false && st.settings.pattern === false && !E.bigView(st) && !E.patternView(st), '새 정원은 둘 다 꺼짐');
check(!E.bigView(null) && !E.bigView({}) && !E.patternView({ settings: {} }), '정원 · 설정이 없으면 꺼짐');
st.settings.big = true; st.settings.pattern = true;
check(E.bigView(st) && E.patternView(st) && !E.slowView(st), '켜면 true · 느긋하게 보기와는 따로');

console.log('[저장 · 불러오기 · 예전 정원]');
const r = E.parseSave(JSON.stringify(E.makeSave(st, 12345)));
const back = r.ok && E.migrateSave(r.data.game);
check(back && E.bigView(back) && E.patternView(back), '파일로 저장해 열어도 켜진 그대로');
const BN = E.MIGRATIONS.findIndex(m => m[0].includes('settings.big'));
check(BN === 40 && E.MIGRATIONS[BN + 1][0].includes('awayLast') && E.MIGRATIONS.length === 42, 'MIGRATIONS 41번째 · 42번째(맨 끝)는 P32 awayLast · farm');
const old = copy(st); delete old.settings.big; delete old.settings.pattern; old.mig = BN;
const om = E.migrateSave(old);
check(om.settings.big === false && om.settings.pattern === false, '예전 정원은 보정으로 둘 다 꺼짐');
const kept = copy(st); delete kept.mig;
check(E.bigView(E.migrateSave(kept)) && E.patternView(E.migrateSave(copy(st))), '보정을 다시 돌아도 켠 값은 그대로');

console.log('[켜도 규칙 · 돈 · 수확은 그대로]');
const run = on => {
  const g = E.create(mon + 0.1 * H, () => 0.5); g.gardenId = 'access-1'; g.onboarded = true;
  g.settings.big = on; g.settings.pattern = on;
  E.advance(g, mon + 2 * WEEK + 3 * H, ctx);
  const o = copy(g); delete o.settings.big; delete o.settings.pattern; return o;
};
const a = run(false), b = run(true);
check(JSON.stringify(a) === JSON.stringify(b), '두 해를 흘려도 설정 두 칸 말고는 정원이 똑같음');
check(a.money === b.money && E.landCounts(a).grassland === E.landCounts(b).grassland, `돈 ${a.money}원 · 땅 칸 수도 같음`);

console.log('[새 철 뒤에도 유지 (SEASON_KEEP의 settings)]');
check(E.SEASON_KEEP.includes('settings'), 'SEASON_KEEP에 settings');
{ const s = E.create(mon + 0.1 * H, () => 0.5); s.gardenId = 'access-2'; s.onboarded = true;
  E.advance(s, mon + 2 * WEEK + REST, ctx);
  for (const k of E.FLOWER_KEYS) s.dex.flower[k] = true;
  s.settings.big = true; s.settings.pattern = true;
  const x = E.seasonStart(s, ctx);
  check(x.ok && s.season.n === 2 && E.bigView(s) && E.patternView(s), '2철이 되어도 큰 글씨 · 땅 무늬 그대로'); }

console.log('[🧩 땅 무늬 표 (decos.js LAND_PATTERNS)]');
global.window = {};
require(path.join(__dirname, '..', 'decos.js'));
const P = window.LAND_PATTERNS || {};
check(E.LAND_KEYS.length === 10 && E.LAND_KEYS.every(k => P[k]) && Object.keys(P).length === 10, '땅 10가지 모두 무늬가 있음 (남는 무늬 없음)');
check(E.LAND_KEYS.every(k => P[k].grid.length === 16 && P[k].grid.every(row => row.length === 16 && /^[#.]+$/.test(row))), '모두 16×16 1비트 (# · .)');
const masks = E.LAND_KEYS.map(k => P[k].grid.join(''));
check(new Set(masks).size === 10, '무늬 10가지가 서로 모두 다름');
check(new Set(E.LAND_KEYS.map(k => P[k].name)).size === 10 && E.LAND_KEYS.every(k => P[k].name), '무늬 이름도 10가지 모두 다름');
check(!masks[E.LAND_KEYS.indexOf('barren')].includes('#') && E.LAND_KEYS.filter(k => k !== 'barren').every(k => P[k].grid.join('').includes('#')), '황무지만 민무늬 · 나머지 9가지는 무늬가 있음');
// 칸끼리 이어 붙여도 이음매가 없게: 왼쪽 끝과 오른쪽 끝 · 위아래가 이어지는 되풀이(8칸 또는 16칸)
const tiles = k => { const g = P[k].grid; for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) if (g[y][x] !== g[y][x + 8] && k !== 'pond' && k !== 'foothill') return false; return true; };
check(E.LAND_KEYS.every(tiles), '8칸마다 되풀이 (물결 · 삼각은 16칸)');
const dist = (p, q) => { let n = 0; for (let i = 0; i < 256; i++) if (p[i] !== q[i]) n++; return n; };
let minD = 256; for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) minD = Math.min(minD, dist(masks[i], masks[j]));
check(minD >= 24, `가장 비슷한 두 무늬도 도트 ${minD}칸 이상 다름`);

console.log('[시뮬 기본은 그대로]');
{ const out = require('child_process').execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'sim-economy.js'), '4', '7'], { encoding: 'utf8' });
  const y4 = out.split('\n')[4].split('\t');
  check(y4[0] === '4' && y4[15] === '80720', `sim-economy 4 7 연말 80,720원 그대로 (${y4[15]}) — P34 찻집 매달 · 겨울 · 꽃잠 값 (예전 22,310원)`); }

console.log(fails ? `결과: ${fails}개 실패` : '결과: 모두 통과');
