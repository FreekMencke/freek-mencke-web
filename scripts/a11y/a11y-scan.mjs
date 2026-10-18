// Ported from osrs-tracker-web's scripts/a11y/a11y-scan.mjs (same author and licence), scanning both themes instead of
// one, as this page follows the system's.
// Scans pages of a running server with axe-core on the WCAG 2.2 AA tags, in the light and the dark theme, and prints
// one line per violation (rule, impact, node count, selectors) and each page's incomplete count. Exits 1 on violations,
// 2 when a page can't be scanned.
//   npm run a11y -- [--click=<selector>]... <url>...
// Each --click clicks that element after the page loads, in order, to scan an open state. Needs Playwright's headless
// Chromium once: `npx playwright install --only-shell chromium`.
// A clean scan doesn't make a page accessible: axe finds only part of the issues.
import AxeBuilder from '@axe-core/playwright';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']; // without wcag22aa, target-size never runs
const THEMES = ['light', 'dark'];
const MAX_SELECTORS = 5;

const USAGE = 'Usage: npm run a11y -- [--click=<selector>]... <url>...';
let clicks, urls;
try {
  // strict: a mistyped flag fails instead of being scanned as if it weren't there
  const { values, positionals } = parseArgs({
    options: { click: { type: 'string', multiple: true, default: [] } },
    allowPositionals: true,
    strict: true,
  });
  clicks = values.click;
  urls = positionals;
} catch (error) {
  console.error(`${error.message}\n${USAGE}`);
  process.exit(2);
}
if (!urls.length) {
  console.error(USAGE);
  process.exit(2);
}

let exitCode = 0;
const browser = await chromium.launch();
try {
  for (const theme of THEMES) {
    const context = await browser.newContext({ colorScheme: theme, viewport: { width: 1280, height: 800 } });
    for (const url of urls) {
      const page = await context.newPage();
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        if (!response?.ok()) throw new Error(`HTTP ${response?.status()}`);
        for (const selector of clicks) {
          await page.locator(selector).click();
          await page.waitForLoadState('networkidle');
        }
        const { violations, incomplete } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        for (const { id, impact, nodes } of violations) {
          const targets = nodes.map(node => node.target.join(' >> '));
          const more = targets.length > MAX_SELECTORS ? ` (+${targets.length - MAX_SELECTORS} more)` : '';
          console.log(
            `${url} ${theme} ${id} ${impact} ${nodes.length}: ${targets.slice(0, MAX_SELECTORS).join(', ')}${more}`,
          );
        }
        console.log(`${url} ${theme} incomplete ${incomplete.length}`);
        if (violations.length) exitCode ||= 1;
      } catch (error) {
        console.log(`${url} ${theme} ERROR ${error.message.split('\n')[0]}`);
        exitCode = 2;
      } finally {
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
process.exit(exitCode);
