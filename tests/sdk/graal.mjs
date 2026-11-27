import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { distribution } from './serve.mjs';
import { pathsFor } from '../../scripts/sdk-paths.mjs';
import { saveReport } from './report.mjs';

const cp = process.env.GRAALJS_CLASSPATH || 'tests/sdk/target/dependency/*';
if (!process.env.GRAALJS_CLASSPATH && !existsSync('tests/sdk/target/dependency'))
  throw Error('Run mvn -f tests/sdk/pom.xml dependency:copy-dependencies or set GRAALJS_CLASSPATH');
const location = await distribution();
try {
  for (const path of pathsFor('decodebox.js')) {
    const url = location.base + path;
    const args = [
      '-Dpolyglot.engine.WarnInterpreterOnly=false',
      '-cp',
      cp,
      'tests/sdk/GraalRunner.java',
      url,
      ...(path === '/api' ? ['tests/sdk/check.js'] : []),
    ];
    const child = spawn(process.env.JAVA || 'java', args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    let stdout = '';
    child.stdout.setEncoding('utf8').on('data', (s) => {
      stdout += s;
    });
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', resolve);
    });
    if (code !== 0) {
      console.error('GraalJS load or execution failed for ' + url);
      process.exitCode = 1;
      continue;
    }
    const report = JSON.parse(stdout.trim().split('\n').at(-1));
    console.log('GraalJS loaded', path);
    if (path === '/api') {
      report.host = stdout.trim().split('\n')[0].trim();
      await saveReport(report);
    }
  }
} finally {
  location.close();
}
