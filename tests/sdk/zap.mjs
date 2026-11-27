import { saveReport } from './report.mjs';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';

const jar = resolve(process.env.ZAP_JAR || 'C:/Program Files/ZAP/Zed Attack Proxy/zap-2.17.0.jar');
const home = await mkdtemp(join(tmpdir(), 'decodebox-zap-'));
try {
  const plan = join(home, 'plan.yaml');
  const example = await readFile('examples/zap/plan.yaml', 'utf8');
  const standalone = JSON.stringify(resolve('examples/zap/standalone.js'));
  const matrix = JSON.stringify(resolve('tests/sdk/zap-matrix.js'));
  const reportPath = join(home, 'compatibility.json');
  await writeFile(
    plan,
    example.replace('file: standalone.js', 'file: ' + standalone) +
      '\n  - type: script\n    parameters:\n      action: add\n      type: standalone\n      engine: "ECMAScript : Graal.js"\n      name: sdk-matrix\n      file: ' +
      matrix +
      '\n  - type: script\n    parameters:\n      action: run\n      type: standalone\n      name: sdk-matrix\n',
  );
  const child = spawn(
    process.env.JAVA || 'java',
    ['-Xmx768m', '-jar', jar, '-cmd', '-silent', '-dir', home, '-autorun', plan],
    {
      cwd: dirname(jar),
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        DECODEBOX_TEST_DIR: resolve('tests/sdk'),
        DECODEBOX_TEST_REPORT: reportPath,
        DECODEBOX_SDK: process.env.DECODEBOX_SDK || resolve('dist/api'),
      },
    },
  );
  let log = '';
  for (const stream of [child.stdout, child.stderr])
    stream.on('data', (chunk) => {
      log += chunk;
      process.stdout.write(chunk);
    });
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  if (
    code !== 0 ||
    !log.includes('DecodeBox ZAP check passed (graaljs-java,') ||
    !log.includes('Automation plan succeeded')
  ) {
    throw new Error('ZAP did not confirm SDK execution');
  }
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  report.host = jar.split(/[\\/]/).at(-1);
  await saveReport(report);
} finally {
  await rm(home, { recursive: true, force: true });
}
