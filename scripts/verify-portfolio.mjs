import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const suppliedUrl = process.argv[2];
const server = suppliedUrl ? null : await preview({
  preview: { host: '127.0.0.1', port: 0, strictPort: true },
});
const origin = new URL(suppliedUrl ??
  `http://127.0.0.1:${server.httpServer.address().port}`).origin;
const overviewUrl = 'https://doublexmax.github.io/pstack-copilot/';
const sourceUrl = 'https://github.com/doublexmax/pstack-copilot';
const evidenceDirectory = process.env.PORTFOLIO_EVIDENCE_DIR;
const errors = [];
let browser;

function record(message) {
  console.log(`PASS ${message}`);
}

async function assertProject(page) {
  const heading = page.getByRole('heading', { name: 'pstack for GitHub Copilot', exact: true });
  await heading.waitFor();
  assert.deepEqual(await page.locator('.project-card').getByRole('heading').allTextContents(), [
    'A Fischer Random Chess Engine',
    'Game Theory Optimal Poker Trainer',
    'Papplu AI',
    'pstack for GitHub Copilot',
  ]);
  const card = page.getByRole('article').filter({ has: heading });
  assert.equal(await card.count(), 1);
  const text = await card.innerText();
  for (const phrase of [/multiple agents/i, /skills/i, /playbooks/i, /Azure DevOps/,
    /investigate/i, /review/i, /build/i, /verif/i, /independent/i, /poteto/, /Cursor/]) {
    assert.match(text, phrase);
  }
  const links = card.getByRole('link');
  assert.deepEqual(await links.evaluateAll(elements => elements.map(link => link.href)), [
    sourceUrl,
    overviewUrl,
  ]);
  const source = card.locator('.card-text').getByRole('link', { name: 'source on GitHub', exact: true });
  assert.equal(await source.getAttribute('href'), sourceUrl);
  assert.equal(await source.locator('..').innerText(), 'Browse the source on GitHub.');
  const footer = card.locator('.card-body > a.btn');
  assert.equal(await footer.count(), 1, 'The card must have one primary footer action.');
  assert.equal((await footer.innerText()).trim(), 'Explore pstack');
  assert.equal(await footer.getAttribute('href'), overviewUrl);
  for (const link of await links.all()) {
    assert.equal(await link.getAttribute('target'), '_blank');
    assert.ok((await link.getAttribute('rel')).split(/\s+/).includes('noreferrer'));
    assert.ok((await link.innerText()).trim().length > 0);
    assert.equal(await link.isVisible(), true);
  }
  return card;
}

async function assertLayout(page) {
  assert.equal(await page.evaluate(() =>
    globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth), true,
  'The portfolio must not overflow the viewport.');
  const outside = await page.locator('.project-card a').evaluateAll(links => links.filter(link => {
    const rect = link.getBoundingClientRect();
    const card = link.closest('.project-card').getBoundingClientRect();
    return rect.left < card.left || rect.right > card.right ||
      rect.top < card.top || rect.bottom > card.bottom;
  }).length);
  assert.equal(outside, 0, 'Every project action must fit inside its card.');
}

async function assertKeyboard(page, card) {
  const destinations = [];
  const count = await page.getByRole('link').count();
  for (let index = 0; index < count + 2; index += 1) {
    await page.keyboard.press('Tab');
    const focused = await card.getByRole('link').evaluateAll(links =>
      links.find(link => link === globalThis.document.activeElement)?.href ?? null);
    if (focused) {
      destinations.push(focused);
      assert.equal(await page.evaluate(() =>
        globalThis.getComputedStyle(globalThis.document.activeElement).outlineStyle), 'solid');
    }
    if (destinations.length === 2) break;
  }
  assert.deepEqual(destinations, [sourceUrl, overviewUrl],
    'Keyboard focus must follow the description source link and then the footer overview button.');
}

try {
  browser = await chromium.launch({
    channel: process.env.PORTFOLIO_BROWSER_CHANNEL ??
      (process.platform === 'win32' ? 'msedge' : undefined),
    headless: true,
  });

  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  for (const path of ['/portfolio', '/portfolio/']) {
    const response = await staticPage.goto(`${origin}${path}`);
    assert.equal(response.status(), 200);
    const html = await response.text();
    assert.ok(html.includes('pstack for GitHub Copilot'));
    assert.ok(html.includes(`href="${overviewUrl}"`));
    assert.ok(html.includes(`href="${sourceUrl}"`));
    await assertProject(staticPage);
  }
  record('Both portfolio URLs contain the description and project links in initial HTML with JavaScript disabled.');
  await staticContext.close();

  for (const width of [390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /hydration|did not match|server HTML/i.test(message.text())) {
        errors.push(message.text());
      }
    });
    await page.goto(`${origin}/portfolio`);
    const card = await assertProject(page);
    await assertLayout(page);
    await assertKeyboard(page, card);
    if (evidenceDirectory) {
      await mkdir(evidenceDirectory, { recursive: true });
      await page.screenshot({
        path: join(evidenceDirectory, `portfolio-${width}.png`),
        fullPage: true,
      });
      await card.screenshot({ path: join(evidenceDirectory, `pstack-card-${width}.png`) });
    }
    if (width === 1280) {
      for (const [index, destination] of [sourceUrl, overviewUrl].entries()) {
        const popupPromise = page.waitForEvent('popup');
        await card.getByRole('link').nth(index).click();
        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');
        assert.equal(popup.url(), destination);
        assert.equal(await popup.evaluate(() => globalThis.opener === null), true);
        await popup.close();
      }
      record('Overview and source clicks open their destinations in separate tabs without an opener.');
    }
    await page.getByRole('link', { name: 'Maxx Tandon home' }).click();
    await page.getByRole('heading', { name: "I'm Maxx.", exact: true }).waitFor();
    await page.getByRole('link', { name: 'Portfolio', exact: true }).click();
    await assertProject(page);
    await assertLayout(page);
    const columns = await page.locator('.project-grid').evaluate(element =>
      globalThis.getComputedStyle(element).gridTemplateColumns.split(/\s+/).length);
    assert.equal(width === 390 ? columns === 1 : columns > 1, true);
    record(`${width}px layout, keyboard order, hydration, and home-to-portfolio navigation work.`);
    await context.close();
  }

  const routesContext = await browser.newContext();
  const routesPage = await routesContext.newPage();
  routesPage.on('pageerror', error => errors.push(error.message));
  for (const [path, heading] of [
    ['/', "I'm Maxx."],
    ['/gto-trainer', 'Pre-flop poker trainer'],
    ['/papplu', 'A seat at your own table.'],
  ]) {
    await routesPage.goto(`${origin}${path}`);
    await routesPage.getByRole('heading', { name: heading, exact: true }).waitFor();
    assert.equal(await routesPage.getByRole('heading', {
      name: 'pstack for GitHub Copilot', exact: true,
    }).count(), 0);
  }
  record('Direct homepage, trainer, and Papplu visits retain their own content.');
  await routesContext.close();

  const linksContext = await browser.newContext();
  for (const destination of [overviewUrl, sourceUrl]) {
    const response = await linksContext.request.get(destination);
    assert.equal(response.status(), 200, `${destination} must return HTTP 200.`);
    record(`${destination} returns HTTP 200.`);
  }
  await linksContext.close();
  assert.deepEqual(errors, [], 'The browser must not report runtime or hydration errors.');
  record('No browser runtime or hydration errors.');
} finally {
  if (browser) await browser.close();
  if (server) {
    const closed = once(server.httpServer, 'close');
    server.httpServer.close();
    await closed;
  }
}
