import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sdk from '../dist/sdk/decodebox.mjs';

const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const fixtures = await json('tests/sdk/fixtures.json');
const bundle = createHash('sha256')
  .update(await readFile('dist/api'))
  .digest('hex');
const operations = sdk.listOperations();
const runs = await Promise.all(
  ['web', 'graaljs-java', 'zap-graaljs'].map(async (name) => {
    const report = await json('test-results/' + name + '.json');
    if (report.bundleSha256 !== bundle)
      throw Error('Different bundle in ' + name + ' report. Rerun its integration test.');
    return report;
  }),
);
const headers = ['Chromium', 'GraalJS', 'ZAP'];
const cells = (row) =>
  '| ' + row.map((x) => String(x).replaceAll('|', '\\|').replaceAll('\n', ' ')).join(' | ') + ' |';
const table = (head, rows) =>
  [cells(head), cells(head.map(() => '---')), ...rows.map(cells), ''].join('\n');
const lines = [
  '# SDK compatibility report',
  '',
  'API ' +
    sdk.apiVersion +
    ' and engine ' +
    sdk.engineVersion +
    '. The tested classic bundle has SHA-256\n\u0060' +
    bundle +
    '\u0060.',
  '',
  table(
    ['Host', 'Runtime', 'Run completed (UTC)', 'Operation fixtures', 'Contract checks'],
    runs.map((r, i) => [
      headers[i],
      r.host + (r.java ? ' / Java ' + r.java : ''),
      r.testedAt,
      Object.values(r.operations).filter((v) => v === 'pass').length + '/' + operations.length,
      Object.values(r.checks).filter((v) => v === 'pass').length +
        '/' +
        Object.keys(r.checks).length,
    ]),
  ),
  'Chromium loaded the extensionless classic script from a second HTTP origin. The Java harness',
  'used GraalJS `load()` over loopback HTTP. ZAP executed the standalone example and fixture',
  'suite from the local classic bundle in its GraalJS script engine.',
  '',
  '## Public contract checks',
  '',
];
const checkNames = [...new Set(runs.flatMap((r) => Object.keys(r.checks)))];
const checkResult = (run, name) =>
  run.checks[name] ??
  (name === 'no processing network' && run.runtime !== 'web' ? 'Browser instrumentation only' : 'UNTESTED');
lines.push(
  table(
    ['Assertion', ...headers],
    checkNames.map((k) => [k, ...runs.map((r) => checkResult(r, k))]),
  ),
  '[London clock changes and regression checks](sdk.md#london-clock-changes-and-regression-checks)',
  '',
  '## Operation coverage',
  '',
);
const cats = [...new Set(operations.map((o) => o.category))].sort();
lines.push(
  table(
    ['Category', 'Registered', ...headers],
    cats.map((cat) => {
      const ops = operations.filter((o) => o.category === cat);
      return [
        cat,
        ops.length,
        ...runs.map((r) => ops.filter((o) => r.operations[o.id] === 'pass').length),
      ];
    }),
  ),
  'Each row records a fixture for a registered operation. Tests reuse concrete inputs from named',
  'engine cases where available. Deterministic transformations use fixed regression outputs or',
  'known answers. Randomized operations use verification, inverse operations, or bounded output',
  'properties. PNG checks cover dimensions and a SHA-256 digest of inflated scanlines. Recipe',
  'checks cover control flow and the resulting text.',
  '',
  table(
    ['Operation ID', 'Assertion', ...headers],
    operations.map((o) => {
      const d = fixtures[o.id];
      const assertion =
        Object.entries({
          steps: 'Recipe execution',
          property: 'Output property',
          inverse: 'Inverse operation',
          png: 'PNG dimensions and scanline digest',
          json: 'JWK fields',
          utcReport: 'Date fields',
          rotorReport: 'Rotor count and positions',
          contains: 'Expected report field',
        }).find(([key]) => Object.hasOwn(d, key))?.[1] ?? 'Exact output';
      return [
        '\u0060' + o.id + '\u0060',
        assertion,
        ...runs.map((r) => r.operations[o.id] ?? 'UNTESTED'),
      ];
    }),
  ),
  '## Distribution checks',
  '',
);
for (const scope of ['local', 'public']) {
  let endpoints;
  try {
    endpoints = await json('test-results/' + scope + '-endpoints.json');
  } catch (e) {
    if (e.code === 'ENOENT') {
      lines.push(scope + ' endpoints have no recorded HTTP run.', '');
      continue;
    }
    throw e;
  }
  lines.push(
    '### ' + (scope === 'public' ? 'GitHub Pages' : 'Local static files'),
    '',
    table(
      ['URL', 'HTTP', 'Content-Type', 'Location', 'Matches build'],
      endpoints.map((r) => [
        '\u0060' + r.url + '\u0060',
        r.status ?? 'Request failed',
        r.type ?? r.error,
        r.location ?? 'None',
        r.matchesLocalBuild ? 'Yes' : 'No',
      ]),
    ),
  );
}
await mkdir('docs', { recursive: true });
await writeFile('docs/sdk-compatibility.md', lines.join('\n').trimEnd() + '\n');
if (
  runs.some(
    (r) =>
      operations.some((o) => r.operations[o.id] !== 'pass') ||
      checkNames.some((name) => checkResult(r, name) === 'UNTESTED') ||
      Object.values(r.checks).some((v) => v !== 'pass'),
  )
)
  process.exitCode = 1;
