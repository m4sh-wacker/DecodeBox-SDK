import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { distribution } from './serve.mjs';
import { aliases, pathsFor } from '../../scripts/sdk-paths.mjs';

const { base, close } = await distribution();
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
// MIME Sniffing Standard, JavaScript MIME type essence match.
const jsType = /^(?:(?:application|text)\/(?:x-)?(?:java|ecma)script|text\/(?:javascript1\.[0-5]|jscript|livescript))$/i;
const results = [];
try {
  for (const path of Object.keys(aliases).flatMap(pathsFor)) {
    const url = base + path;
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      const type = response.headers.get('content-type') ?? '';
      const bytes = Buffer.from(await response.arrayBuffer());
      const matches = sha256(bytes) === sha256(await readFile('dist' + path));
      const essence = type.split(';')[0].trim().toLowerCase();
      const javascriptMime = jsType.test(essence);
      const nosniff = response.headers.get('x-content-type-options');
      // The local test also exercises classic script loading with a generic MIME type.
      // The published SDK must pass the JavaScript MIME check independently.
      const localClassic =
        !process.env.SDK_BASE_URL && path === '/api' && essence === 'application/octet-stream' && !nosniff;
      const ok =
        response.status === 200 && matches &&
        (path.endsWith('.d.mts') || javascriptMime || localClassic);
      results.push({
        url,
        status: response.status,
        type,
        javascriptMime: path.endsWith('.d.mts') ? null : javascriptMime,
        nosniff,
        location: response.headers.get('location'),
        matchesLocalBuild: matches,
        ok,
      });
    } catch (error) {
      results.push({ url, error: String(error), ok: false });
    }
  }
  console.table(results);
  await mkdir('test-results', { recursive: true });
  await writeFile(
    'test-results/' + (process.env.SDK_BASE_URL ? 'public' : 'local') + '-endpoints.json',
    JSON.stringify(results, null, 2) + '\n',
  );
  // The Pages workflow retries missing/stale bytes, but can safely test loading
  // matching bytes and still fail the deployment on an incorrect MIME header.
  if (results.some((r) => r.status !== 200 || !r.matchesLocalBuild)) process.exitCode = 1;
  else if (results.some((r) => !r.ok)) {
    for (const r of results.filter((row) => !row.ok)) {
      console.error('Expected a JavaScript Content-Type for ' + r.url + ', received ' + JSON.stringify(r.type));
    }
    process.exitCode = 2;
  }
} finally {
  close();
}
