import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

// Stock static file server for local integration tests, including its ordinary
// application/octet-stream response for extensionless files.
export async function distribution(directory = 'dist') {
  if (directory === 'dist' && process.env.SDK_BASE_URL)
    return { base: process.env.SDK_BASE_URL.replace(/\/$/, ''), close() {} };
  const child = spawn(
    process.env.PYTHON || 'python',
    ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', directory],
    { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true },
  );
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error('Static test fixture exited ' + code)));
    const lines = createInterface({ input: child.stdout });
    lines.on('line', (line) => {
      const port = line.match(/port (\d+)/i)?.[1];
      if (port)
        resolve({
          base: 'http://127.0.0.1:' + port,
          close() {
            lines.close();
            child.kill();
          },
        });
    });
  });
}
