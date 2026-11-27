import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from './chromium.mjs';
import { distribution } from './serve.mjs';

const site = await distribution();
let browser;
try {
  browser = await launchBrowser();
  for (const url of [site.base + '/', pathToFileURL(resolve('dist/decodebox.html')).href]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url);
    await page.locator('#decodebox-input').fill('QnJvd3NlciBhcHAgY2hlY2s=');
    await page.getByRole('searchbox', { name: 'Search operations' }).fill('From Base64');
    await page.getByText('From Base64', { exact: true }).first().click();
    await page.locator('pre').filter({ hasText: 'Browser app check' }).first().waitFor();
    if (errors.length) throw Error(errors.join('\n'));
    console.log('Browser recipe passed', url);
    await page.close();
  }
} finally {
  await browser?.close();
  site.close();
}
