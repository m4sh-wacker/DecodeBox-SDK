import { launchBrowser } from './chromium.mjs';
import { readFile } from 'node:fs/promises';
import { distribution } from './serve.mjs';
import { saveReport } from './report.mjs';
import { pathsFor } from '../../scripts/sdk-paths.mjs';

const modulePaths = pathsFor('decodebox.mjs');
const fixtures = JSON.parse(await readFile('tests/sdk/fixtures.json', 'utf8'));
const location = await distribution();
const testSite = await distribution('tests/sdk');
let browser;
try {
  browser = await launchBrowser();
  console.log('Chromium', browser.version());
  let failed = false;
  for (const path of [...pathsFor('decodebox.js'), ...modulePaths]) {
    const page = await browser.newPage();
    try {
      const url = location.base + path,
        esm = modulePaths.includes(path);
      // The stock loopback server has no CORS headers. On Pages exercise imports
      // from the consumer origin, just as an external application would.
      if (esm && !process.env.SDK_BASE_URL) {
        const consumer = location.base + '/__sdk_consumer__';
        await page.route(consumer, (route) =>
          route.fulfill({
            contentType: 'text/html',
            body: '<!doctype html><title>SDK integration</title>',
          }),
        );
        await page.goto(consumer);
      } else await page.goto(testSite.base + '/consumer.html');
      page.on('requestfailed', (r) => console.error(r.url(), r.failure()));
      const resPromise = page.waitForResponse((r) => r.url() === url, { timeout: 15000 });
      const load = esm
        ? page.evaluate(async (url) => {
            globalThis.sdkModule = await import(url);
          }, url)
        : page.addScriptTag({ url });
      const [response, loaded] = await Promise.allSettled([resPromise, load]);
      if (response.status === 'rejected') throw response.reason;
      const r = response.value;
      console.log(
        path,
        r.status(),
        r.headers()['content-type'],
        'location=' + (r.headers().location ?? 'none'),
      );
      if (r.status() !== 200 || loaded.status === 'rejected')
        throw new Error('Script load failed: ' + (loaded.reason ?? r.status()));
      if (esm && !/(java|ecma)script/i.test(r.headers()['content-type']))
        throw new Error('Incorrect module MIME type');
      if (
        (await page.evaluate(async (esm) => {
          const sdk = esm ? globalThis.sdkModule.default : globalThis.DecodeBox;
          await sdk.ready;
          return sdk.executeOperation('to-base64', 'ABC');
        }, esm)) !== 'QUJD'
      )
        throw new Error('Public entry point failed');
      if (path === '/api') {
        await page.addScriptTag({ path: 'tests/sdk/check.js' });
        const requests = [];
        page.on('request', (r) => requests.push(r.url()));
        const report = await page.evaluate((f) => runSdkTests(DecodeBox, f), fixtures);
        report.host = 'Chromium ' + browser.version();
        report.checks['no processing network'] = requests.length
          ? 'FAIL: ' + requests.join(', ')
          : 'pass';
        await saveReport(report);
      }
    } catch (error) {
      failed = true;
      console.error(path, String(error));
    } finally {
      await page.close();
    }
  }
  if (failed) process.exitCode = 1;
} finally {
  await browser?.close();
  location.close();
  testSite.close();
}
