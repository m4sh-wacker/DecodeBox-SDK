import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
export async function saveReport(report) {
  report.bundleSha256 = createHash('sha256')
    .update(await readFile('dist/api'))
    .digest('hex');
  report.testedAt = new Date().toISOString();
  await mkdir('test-results', { recursive: true });
  await writeFile(
    'test-results/' + report.runtime + '.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  const results = Object.entries({ ...report.operations, ...report.checks });
  const failures = results.filter(([, v]) => v !== 'pass');
  for (const [id, error] of failures) console.error(id, error);
  console.log(
    report.runtime,
    Object.values(report.operations).filter((v) => v === 'pass').length +
      '/' +
      Object.keys(report.operations).length +
      ' operations passed;',
    Object.keys(report.checks).length + ' contract checks',
  );
  if (failures.length) throw new Error(failures.length + ' failed checks');
}
