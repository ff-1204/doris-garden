// 엔진 스냅숏 (P66-01): 엔진을 나누거나 옮길 때 "옮기기만 했다"를 대조하는 글 — 공개 이름 · 보정 이름 · 값 해시를 한 줄씩
// node flower-land/tools/engine-snapshot.js [engine.js 경로]           → 화면에 찍음
// node flower-land/tools/engine-snapshot.js --write                     → tests/engine-snapshot.txt를 새로 씀 (엔진을 일부러 바꿨을 때만)
// tests/snapshot.test.js가 이 글을 tests/engine-snapshot.txt와 견줘요. 공개 이름을 더하거나 MIGRATIONS 줄을 더하는 등 엔진을 일부러 바꾸면
// 값이 달라지는 게 맞으니 --write로 다시 쓰고 바뀐 줄을 커밋에서 확인해요. 나누기 · 옮기기만 하는 PR에서는 한 줄도 달라지면 안 돼요
process.env.TZ = 'Asia/Seoul';   // 달력이 현지 시각을 따름 (sim-economy.js와 같은 까닭)
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const args = process.argv.slice(2), WRITE = args.includes('--write');
const ENGINE = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, '..', 'engine.js'));
const OUT = path.join(__dirname, '..', 'tests', 'engine-snapshot.txt');

// 흔들리는 것 고정: 이름표(newGardenId)가 Date.now · Math.random을 씀
const T0 = Date.UTC(2026, 9, 5, 0, 0);
let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
Date.now = () => T0; Math.random = rng;
const E = require(ENGINE);

const hash = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
// 함수도 글자로(toString) 넣어 값 · 몸을 함께 봄 — 같은 객체를 두 번 만나면 '[seen]'
const ser = v => { const seen = new WeakSet(); return JSON.stringify(v, (k, x) => {
  if (typeof x === 'function') return 'ƒ ' + x.toString();
  if (x && typeof x === 'object') { if (seen.has(x)) return '[seen]'; seen.add(x); }
  if (typeof x === 'number' && !isFinite(x)) return String(x);
  return x;
}); };
const copy = o => JSON.parse(JSON.stringify(o));
const H = E.HOUR;
const mon = (() => { let t = T0; for (let i = 0; i < 1000; i++) { const c = E.calendar(t); if (c.idx === 0 && c.yh < 0.5) return t; t += H / 4; } })();
const ctx = () => { let s = 11; return { live: false, rng: () => (s = (s * 16807) % 2147483647) / 2147483647 }; };

const lines = [];
const keys = Object.keys(E);
lines.push(`# 엔진 스냅숏 (tools/engine-snapshot.js) — 나누기 · 옮기기 전후 같아야 해요`);
lines.push(`공개 이름 ${keys.length}개 (Object.keys 차례)`);
for (const k of keys) lines.push(`  ${k} ${typeof E[k]} ${hash(ser(E[k]))}`);
lines.push(`공개 값 모두 ${hash(ser(E))}`);
lines.push(`보정 MIGRATIONS ${E.MIGRATIONS.length}줄`);
E.MIGRATIONS.forEach((m, i) => lines.push(`  ${String(i + 1).padStart(2)}. ${m[0]} · ${hash(m[1].toString())}`));

// 새 정원 · 시간 진행
const fresh = () => { const s = E.create(mon + 0.1 * H, () => 0.5); s.gardenId = 'snap-1'; s.onboarded = true; return s; };
const st = fresh();
lines.push(`새 정원 create ${hash(JSON.stringify(st))}`);
E.advance(st, mon + 30 * H, ctx());
lines.push(`새 정원 30시간 뒤 ${hash(JSON.stringify(st))}`);
const year = fresh(); E.advance(year, mon + 7 * 24 * H * 2, ctx());
lines.push(`새 정원 두 주(정원 두 해) 뒤 ${hash(JSON.stringify(year))}`);

// 예전 저장 옮기기 (migrate.test.js의 "가장 옛 정원"과 같은 칸을 지움 + 몇 번째부터 옮기기)
const OLD_KEYS = ['water', 'shears', 'hoe', 'basket', 'drying', 'dried', 'blends', 'cups', 'gardenId', 'mig', 'account', 'actAt', 'letterBox', 'resetAt', 'yearLog', 'yearNow', 'grade', 'yearPace', 'weekly', 'pantry', 'bonusFree', 'season', 'layers', 'yearly', 'visitors', 'mailSeenAt', 'pollenExtra'];
const oldest = base => { const o = copy(base); for (const k of OLD_KEYS) delete o[k]; delete o.settings.slow; for (const k of ['petal', 'blend', 'bagBlend', 'teabag', 'form']) delete o.dex[k];
  o.dex.tea = { chamomile: true }; o.teas = [{ id: 900, type: 'lavender', q: 3 }]; o.items.push({ id: 901, type: 'rose', q: 3, origin: '가게', form: 'seed' }); o.dex.flower = { sunflower: true }; return o; };
const migrated = s => { Math.random = (() => { let q = 3; return () => (q = (q * 16807) % 2147483647) / 2147483647; })(); const m = E.migrateSave(s); return m ? hash(JSON.stringify(m)) : 'null'; };
lines.push(`옛 저장: 가장 옛 정원 (30시간) ${migrated(oldest(st))}`);
lines.push(`옛 저장: 가장 옛 정원 (두 주) ${migrated(oldest(year))}`);
for (const from of [0, 10, 20, 30, 40, 48, E.MIGRATIONS.length - 1]) { const s = copy(year); s.mig = from; lines.push(`옛 저장: 두 주 정원을 ${from}번째부터 ${migrated(s)}`); }
lines.push(`옛 저장: 쓸 수 없는 정원 ${migrated({ v: 2 })} · ${migrated(Object.assign(copy(st), { tiles: [] }))}`);

// 저장 파일 만들기 · 읽기
const save = E.makeSave(year, T0);
lines.push(`저장 파일 makeSave ${hash(JSON.stringify(save))}`);
const back = E.parseSave(JSON.stringify(save));
lines.push(`저장 파일 parseSave ${back && back.ok ? hash(JSON.stringify(back.data)) : 'X'}`);

const text = lines.join('\n') + '\n';
if (WRITE) { fs.writeFileSync(OUT, text); console.log(`썼어요: ${OUT} (${lines.length}줄)`); }
else process.stdout.write(text);
