import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

export function launchBrowser() {
  const executablePath =
    process.env.CHROME_PATH ||
    [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
    ].find(existsSync);
  return chromium.launch({ executablePath, headless: true });
}
