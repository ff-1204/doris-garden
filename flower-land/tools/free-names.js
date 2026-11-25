// 화면 파일의 자유 이름 찾기 (P94-05): 화면 파일(index.html이 engine.js 다음에 부르는 것)이 어느 스코프에도 선언 없이 쓰는 이름을 구문 분석으로 찾아요
// 엔진은 브라우저에서 묶음 안에 있어(tools/engine-bundle.js) 엔진 최상위 이름이 전역에 없어요. 화면이 그 이름을 E. 없이 쓰면 그 줄이 돌 때에야 ReferenceError가 나요
//   → 이 도구가 미리 찾아요: 엔진 최상위 이름 가운데 화면이 맨 이름으로 쓰는 것 = app.js의 `const { … } = E;` 줄에 있는 것뿐이어야 해요 (tests/globals.test.js)
// node flower-land/tools/free-names.js          사람이 읽는 줄
// node flower-land/tools/free-names.js --json   { bare: [엔진 이름], other: [그 밖의 자유 이름 — 브라우저 기본 이름이어야 함], engineTop, screenTop }
// 구문 분석기는 Node에 든 acorn을 써요(패키지 없음) — 그래서 --expose-internals로 스스로를 한 번 다시 띄워요
const fs = require('fs'), path = require('path');
if (!process.execArgv.includes('--expose-internals')) {
  const r = require('child_process').spawnSync(process.execPath, ['--expose-internals', '--no-warnings', __filename, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status == null ? 1 : r.status);
}
const acorn = require('internal/deps/acorn/acorn/dist/acorn'), walk = require('internal/deps/acorn/acorn-walk/dist/walk');
const { partNames } = require('./engine-bundle.js');
const args = process.argv.slice(2), json = args.includes('--json');
const dir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(__dirname, '..'));
const read = f => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
const scripts = [...read('index.html').matchAll(/<script src="([^"?#]+)[^"]*"><\/script>/g)].map(m => m[1]);
const SCREEN = scripts.filter(f => !/^engine(-[\w-]+)?\.js$/.test(f));

const isFn = n => /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type);
const isScope = n => isFn(n) || /^(Program|BlockStatement|ForStatement|ForInStatement|ForOfStatement|CatchClause|SwitchStatement|ClassDeclaration|ClassExpression|StaticBlock)$/.test(n.type);
function patNames(p, out) {
  if (!p) return out;
  if (p.type === 'Identifier') out.push(p.name);
  else if (p.type === 'ObjectPattern') for (const q of p.properties) patNames(q.type === 'RestElement' ? q.argument : q.value, out);
  else if (p.type === 'ArrayPattern') for (const q of p.elements) patNames(q, out);
  else if (p.type === 'RestElement') patNames(p.argument, out);
  else if (p.type === 'AssignmentPattern') patNames(p.left, out);
  return out;
}
// 파일 하나 → { top: 최상위에 선언한 이름, free: Map(이름 → [줄]) }
function analyze(src) {
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
  const decl = new Map();   // 스코프 노드 → Set(이름)
  const add = (scope, name) => { if (!decl.has(scope)) decl.set(scope, new Set()); decl.get(scope).add(name); };
  walk.fullAncestor(ast, (node, _s, anc) => {
    const up = anc.slice(0, -1).reverse();   // 가까운 조상부터
    const nearFn = up.find(n => isFn(n) || n.type === 'Program' || n.type === 'StaticBlock'), nearBlock = up.find(isScope);
    if (isFn(node)) {
      for (const p of node.params) for (const n of patNames(p, [])) add(node, n);
      if (node.type === 'FunctionDeclaration' && node.id) add(nearBlock, node.id.name);
      if (node.type === 'FunctionExpression' && node.id) add(node, node.id.name);
    } else if (node.type === 'VariableDeclaration') {
      for (const d of node.declarations) for (const n of patNames(d.id, [])) add(node.kind === 'var' ? nearFn : nearBlock, n);
    } else if (node.type === 'ClassDeclaration' && node.id) add(nearBlock, node.id.name);
    else if (node.type === 'ClassExpression' && node.id) add(node, node.id.name);
    else if (node.type === 'CatchClause' && node.param) for (const n of patNames(node.param, [])) add(node, n);
  });
  const free = new Map();
  walk.fullAncestor(ast, (node, _s, anc) => {
    if (node.type !== 'Identifier') return;
    const parent = anc[anc.length - 2];
    if (parent) {
      if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return;                 // a.이름
      if (/^(Property|MethodDefinition|PropertyDefinition)$/.test(parent.type) && parent.key === node && !parent.computed && parent.value !== node) return;   // { 이름: … } (짧은 꼴 { 이름 }은 value 쪽에서 한 번)
      if (/^(LabeledStatement|BreakStatement|ContinueStatement)$/.test(parent.type)) return;
    }
    if (anc.some(n => decl.has(n) && decl.get(n).has(node.name))) return;
    if (!free.has(node.name)) free.set(node.name, []);
    free.get(node.name).push(node.loc.start.line);
  });
  return { top: decl.get(ast) || new Set(), free };
}

const engineTop = new Set();
for (const f of partNames(dir)) for (const n of analyze(read(f)).top) engineTop.add(n);
const screen = SCREEN.map(f => ({ file: f, ...analyze(read(f)) }));
const screenTop = new Set(screen.flatMap(s => [...s.top]));
// app.js가 E에서 꺼낸 이름은 화면 최상위 이름이기도 해요 — 그래서 "화면 어디에도 선언이 없는데 쓰는 엔진 이름"만 남겨요
const bare = new Map(), other = new Set();
for (const s of screen) for (const [name, lines] of s.free) {
  if (screenTop.has(name)) continue;
  if (!engineTop.has(name)) { other.add(name); continue; }
  if (!bare.has(name)) bare.set(name, []);
  bare.get(name).push(...lines.map(l => `${s.file}:${l}`));
}
if (json) console.log(JSON.stringify({ bare: [...bare.keys()].sort(), where: Object.fromEntries(bare), other: [...other].sort(), engineTop: engineTop.size, screenTop: screenTop.size }));
else {
  console.log(`엔진 최상위 이름 ${engineTop.size}개 · 화면 최상위 이름 ${screenTop.size}개 (화면 파일 ${SCREEN.length}개)`);
  console.log(bare.size ? `화면이 선언 없이 쓰는 엔진 이름 ${bare.size}개 — app.js의 \`const { … } = E;\` 줄에 더하거나 E.이름으로 바꿔요` : '화면이 선언 없이 쓰는 엔진 이름 없음');
  for (const [name, where] of bare) console.log(`  ${name} — ${where.slice(0, 5).join(' ')}${where.length > 5 ? ` 외 ${where.length - 5}곳` : ''}`);
  console.log(`그 밖의 자유 이름(브라우저 기본 이름이어야 해요): ${[...other].sort().join(' ')}`);
}
process.exit(bare.size ? 1 : 0);
