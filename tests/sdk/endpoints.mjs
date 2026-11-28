import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { distribution } from './serve.mjs';
import { launchBrowser } from './chromium.mjs';
import { aliases, pathsFor } from '../../scripts/sdk-paths.mjs';

const { base, close } = await distribution();
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
// MIME Sniffing Standard, JavaScript MIME type essence match.
const jsType = /^(?:(?:application|text)\/(?:x-)?(?:java|ecma)script|text\/(?:javascript1\.[0-5]|jscript|livescript))$/i;
const results = [];
async function verifyGenericClassic(url, expectedBytes) {
  const consumer = await distribution('tests/sdk');
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(consumer.base + '/consumer.html');
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url() === url, { timeout: 15000 }),
      page.addScriptTag({ url }),
    ]);
    if (response.status() !== 200 || response.request().redirectedFrom() ||
        response.headers()['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/octet-stream' ||
        !(await response.body()).equals(expectedBytes)) {
      throw Error('Chromium received a different response for the extensionless script');
    }
    const value = await page.evaluate(async () => {
      await globalThis.DecodeBox.ready;
      return globalThis.DecodeBox.executeOperation('to-base64', 'ABC');
    });
    if (value !== 'QUJD') throw Error('Classic script operation returned an unexpected value');
  } finally {
    await browser?.close();
    consumer.close();
  }
}
try {
  for (const path of Object.keys(aliases).flatMap(pathsFor)) {
    const url = base + path;
    try {
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      const type = response.headers.get('content-type') ?? '';
      const bytes = Buffer.from(await response.arrayBuffer());
      const matches = bytes.length > 0 && sha256(bytes) === sha256(await readFile('dist' + path));
      const essence = type.split(';')[0].trim().toLowerCase();
      const javascriptMime = jsType.test(essence);
      const nosniff = response.headers.get('x-content-type-options');
      let classicExecuted = null, executionError;
      if (path === '/api' && response.status === 200 && matches &&
          essence === 'application/octet-stream' && !nosniff) {
        try {
          await verifyGenericClassic(url, bytes);
          classicExecuted = true;
        } catch (error) {
          classicExecuted = false;
          executionError = String(error);
        }
      }
      const ok =
        response.status === 200 && matches &&
        (path.endsWith('.d.mts') || javascriptMime || classicExecuted === true);
      results.push({
        url,
        status: response.status,
        bytes: bytes.length,
        type,
        javascriptMime: path.endsWith('.d.mts') ? null : javascriptMime,
        nosniff,
        classicExecuted,
        ...(executionError && { executionError }),
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
      console.error(r.url, r.type, r.executionError ?? 'Unsupported script Content-Type');
    }
    process.exitCode = 2;
  }
} finally {
  close();
}
