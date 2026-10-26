import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const suppliedUrl = process.argv[2];
const server = suppliedUrl ? null : await preview({
  preview: { host: '127.0.0.1', port: 0, strictPort: true },
});
const origin = new URL(suppliedUrl ?? `http://127.0.0.1:${server.httpServer.address().port}`).origin;
const evidenceDirectory = process.env.PAPPLU_EVIDENCE_DIR;
const channel = process.env.PAPPLU_BROWSER_CHANNEL ??
  (process.platform === 'win32' ? 'msedge' : undefined);
const errors = [];
const requests = [];
const responses = [];
const workerUrls = [];
const checks = [];
let browser;

function record(message) {
  checks.push(message);
  console.log(`PASS ${message}`);
}

async function screenshot(page, name) {
  if (!evidenceDirectory) return;
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({ path: join(evidenceDirectory, name), fullPage: true });
}

async function newPage({ mobile = false, workers = true } = {}) {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  await context.addInitScript((enableWorkers) => {
    Math.random = () => 0.9999;
    if (!enableWorkers) Object.defineProperty(globalThis, 'Worker', { value: undefined });
  }, workers);
  context.on('request', (request) => {
    if (request.url().startsWith(origin)) requests.push(request.url());
  });
  context.on('response', (response) => {
    if (response.url().startsWith(origin)) {
      responses.push({ url: response.url(), status: response.status() });
    }
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('worker', (worker) => workerUrls.push(worker.url()));
  return { context, page };
}

async function openSetup(table) {
  const details = table.locator('.papplu-setup details');
  if (!await details.evaluate(element => element.open)) await details.locator('summary').click();
}

async function deal(page, preset, { rules = {}, pace } = {}) {
  const table = page.getByRole('tabpanel', { name: 'Play table' });
  await openSetup(table);
  await table.getByRole('button', { name: preset, exact: true }).click();
  await openSetup(table);
  for (const [label, value] of Object.entries(rules)) {
    await table.getByLabel(label, { exact: true }).fill(String(value));
  }
  if (pace) await table.getByLabel('AI pace').selectOption(pace);
  await table.getByRole('button', { name: /^Deal (new )?round$/ }).click();
  return table;
}

async function assertFits(page) {
  assert.equal(await page.evaluate(() =>
    globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth), true);
}

async function portfolioStyle(page) {
  return page.locator('h1').evaluate((element) => {
    const style = globalThis.getComputedStyle(element);
    return {
      color: style.color,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      margin: style.margin,
      lineHeight: style.lineHeight,
    };
  });
}

try {
  browser = await chromium.launch({ channel, headless: true });
  const { context, page } = await newPage();
  await page.goto(`${origin}/portfolio`);
  const before = await portfolioStyle(page);
  await page.locator('a[href="/papplu"]').click();
  await page.getByRole('heading', { name: 'A seat at your own table.' }).waitFor();
  let table = page.getByRole('tabpanel', { name: 'Play table' });
  assert.equal(await table.getByLabel('Seat 2 AI tier').inputValue(), 'neural');
  assert.equal(await table.getByLabel(/Recycle the discard/).isChecked(), true);
  await table.getByRole('button', { name: 'Add seat', exact: true }).click();
  await table.getByLabel('Seat 3 name').fill('Friend');
  await table.getByLabel('Seat 3 type').selectOption('ai');
  await table.getByLabel('Seat 3 AI tier').selectOption('casual');
  assert.equal(await table.getByLabel('Seat 3 AI tier').inputValue(), 'casual');
  await table.getByRole('button', { name: 'Remove seat 3' }).click();

  table = await deal(page, 'Solo Practice');
  const yourHand = table.getByRole('group', { name: 'Hand for You' });
  assert.equal(await yourHand.getByRole('button').count(), 21);
  await table.getByRole('button', { name: 'Draw from stock' }).click();
  assert.equal(await yourHand.getByRole('button').count(), 22);
  assert.equal(await table.getByRole('button', { name: 'Declare win' }).isEnabled(), true);
  await table.getByRole('button', { name: 'Discard drawn' }).click();
  assert.equal(await yourHand.getByRole('button').count(), 21);
  await table.getByText('Turn 2 · Draw a card', { exact: true }).waitFor();
  await table.getByRole('button', { name: 'Take discard' }).click();
  assert.equal(await yourHand.getByRole('button').count(), 22);
  await table.getByRole('button', { name: 'Discard selected' }).click();
  await table.getByText('Turn 3 · Draw a card', { exact: true }).waitFor();
  record('Seat editing, solo stock and discard draws, selection, and turn changes use the real table.');

  const smallRules = { Decks: 1, 'Cards per hand': 3, 'Required pure sequences': 1 };
  table = await deal(page, 'Solo Practice', { rules: smallRules });
  await table.getByRole('checkbox', { name: 'Check hand' }).check();
  await table.getByRole('region', { name: 'Hand check' }).getByText('Valid hand', { exact: true }).waitFor();
  assert.equal(await table.getByRole('button', { name: 'Declare win' }).isDisabled(), true);
  assert.equal(await table.getByRole('region', { name: 'Round summary' }).count(), 0);
  await table.getByRole('button', { name: 'Draw from stock' }).click();
  await table.getByRole('button', { name: 'Declare win' }).click();
  const soloSummary = table.getByRole('article', { name: 'You round summary' });
  await soloSummary.getByRole('heading', { name: 'Minimum deadwood 0 points' }).waitFor();
  await table.getByRole('heading', { name: 'You win with a valid declaration.' }).waitFor();
  assert.equal(await table.getByText('Round 0 · Total 0', { exact: true }).count(), 1);
  record('A real Worker checks the hand without winning, then resolves an explicit declaration and deadwood summary.');

  table = await deal(page, 'Pass & Play', {
    rules: { ...smallRules, 'Required pure sequences': 2 },
  });
  assert.equal(await table.getByRole('group', { name: /^Hand for / }).count(), 0);
  await table.getByRole('button', { name: 'Reveal hand' }).click();
  assert.equal(await table.getByRole('group', { name: 'Hand for Player 1' }).getByRole('button').count(), 3);
  assert.equal(await table.getByRole('group', { name: 'Hand for Player 2' }).count(), 0);
  await table.getByRole('button', { name: 'Draw from stock' }).click();
  await table.getByRole('button', { name: 'Discard drawn' }).click();
  await table.getByRole('button', { name: 'Reveal hand' }).waitFor();
  assert.equal(await table.getByRole('group', { name: /^Hand for / }).count(), 0);
  await table.getByRole('button', { name: 'Reveal hand' }).click();
  await table.getByRole('button', { name: 'Draw from stock' }).click();
  await table.getByRole('button', { name: 'Declare win' }).click();
  const firstSummary = table.getByRole('article', { name: 'Player 1 round summary' });
  const secondSummary = table.getByRole('article', { name: 'Player 2 round summary' });
  await firstSummary.getByRole('heading', { name: 'Minimum deadwood 29 points' }).waitFor();
  await secondSummary.getByRole('heading', { name: 'Minimum deadwood 28 points' }).waitFor();
  assert.equal(await table.getByText('Round 80 · Total 80', { exact: true }).count(), 1);
  assert.equal(await firstSummary.getByRole('heading', { name: 'Exempt melds' }).count(), 1);
  assert.equal(await secondSummary.getByRole('group', { name: 'Counted deadwood cards' }).getByRole('img').count(), 3);
  await table.getByRole('heading', { name: 'Player 1 is the last active player.' }).waitFor();
  record('Private handoffs hide all hands, and a false declaration adds 80 points with separate every-seat deadwood.');

  await page.reload();
  table = page.getByRole('tabpanel', { name: 'Play table' });
  await table.getByLabel('Seat 1 name').waitFor();
  assert.equal(await table.getByLabel('Cards per hand').inputValue(), '3');
  assert.equal(await table.getByLabel('Seat 2 type').inputValue(), 'human');
  assert.equal(await table.getByRole('group', { name: /^Hand for / }).count(), 0);
  record('Settings survive a direct-route refresh without restoring a private round.');

  table = await deal(page, 'vs AI', { pace: 'instant' });
  await table.getByRole('button', { name: 'Draw from stock' }).click();
  await table.getByRole('button', { name: 'Discard drawn' }).click();
  await table.getByText('Turn 3 · Draw a card', { exact: true }).waitFor({ timeout: 30_000 });
  assert.equal(await table.getByRole('group', { name: 'Hand for You' }).getByRole('button').count(), 21);
  assert.equal(await table.getByRole('group', { name: 'Hand for Neural AI' }).count(), 0);
  await table.getByRole('region', { name: 'False-declaration scoreboard' })
    .getByText('Neural + Search', { exact: true }).waitFor();
  assert.equal(await table.locator('.papplu-downgrade').count(), 0);
  record('The shipped neural model completes a Worker-backed AI turn without exposing the opponent hand.');

  table = await deal(page, 'AI Watch');
  await table.getByRole('button', { name: 'Pause', exact: true }).click();
  const watchHands = table.getByRole('group', { name: /^Hand for / });
  assert.equal(await watchHands.count(), 3);
  const pausedTurn = Number((await table.locator('.papplu-round-header .papplu-eyebrow').textContent()).match(/Turn (\d+)/)[1]);
  await table.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.waitForFunction((previous) => {
    const text = globalThis.document.querySelector('.papplu-round-header .papplu-eyebrow')?.textContent ?? '';
    return Number(text.match(/Turn (\d+)/)?.[1]) >= previous + 3;
  }, pausedTurn, { timeout: 30_000 });
  await table.getByRole('button', { name: 'Pause', exact: true }).click();
  await assertFits(page);
  await screenshot(page, 'papplu-desktop.png');
  record('AI Watch renders all three tiers and resumes real AI turns after pausing.');

  await page.getByRole('tab', { name: 'Hand Builder' }).click();
  const builder = page.getByRole('tabpanel', { name: 'Hand Builder' });
  await builder.getByRole('button', { name: 'Add Ace of Spades', exact: true }).click();
  await builder.getByRole('button', { name: 'Evaluate hand', exact: true }).click();
  await builder.getByText(/Partial hand · 1 of 21 cards/).waitFor();
  await builder.getByRole('heading', { name: 'Minimum deadwood 10 points' }).waitFor();
  assert.equal(await builder.getByText('Not a valid hand', { exact: true }).count(), 0);
  await builder.getByRole('button', { name: 'Load valid 21-card example' }).click();
  await builder.getByRole('button', { name: 'Evaluate hand', exact: true }).click();
  await builder.getByText('Valid hand', { exact: true }).waitFor();
  await builder.getByRole('heading', { name: 'Minimum deadwood 0 points' }).waitFor();
  assert.equal(await builder.getByRole('group', { name: 'Builder hand' }).getByRole('button').count(), 21);
  await builder.getByRole('button', { name: 'Load invalid 21-card example' }).click();
  await builder.getByRole('button', { name: 'Evaluate hand', exact: true }).click();
  await builder.getByText('Not a valid hand', { exact: true }).waitFor();
  await builder.getByRole('heading', { name: 'Minimum deadwood 60 points' }).waitFor();
  record('The independent builder Worker returns partial scores and literal valid and invalid 21-card results.');
  assert.equal(page.workers().length, 2);
  const closed = once(page.workers().at(-1), 'close', { signal: AbortSignal.timeout(10_000) });
  await page.getByRole('tab', { name: 'Play table' }).click();
  await closed;
  assert.equal(page.workers().length, 1);
  await page.getByRole('tab', { name: 'Hand Builder' }).click();
  assert.equal(await builder.getByRole('group', { name: 'Builder hand' }).getByRole('button').count(), 21);
  await builder.getByRole('heading', { name: 'Minimum deadwood 60 points' }).waitFor();
  record('Switching tabs preserves the built hand and its result while disposing the inactive builder Worker.');

  await page.locator('a[href="/portfolio"]').first().click();
  await page.getByRole('heading', { name: 'A Collection of My Projects' }).waitFor();
  assert.deepEqual(await portfolioStyle(page), before);
  await page.locator('a[href="/"]').first().click();
  await page.getByRole('heading', { name: "I'm Maxx." }).waitFor();
  await page.locator('a[href="/portfolio"]').first().click();
  await page.locator('a[href="/gto-trainer"]').click();
  await page.getByRole('button', { name: 'Simulate', exact: true }).waitFor();
  await page.getByRole('button', { name: /Manage Charts/ }).click();
  assert.equal(await page.locator('#utg td').count(), 169);
  record('The portfolio, home, and trainer work after client-side navigation through Papplu.');
  await context.close();

  const mobile = await newPage({ mobile: true });
  await mobile.page.goto(`${origin}/papplu`);
  await mobile.page.getByRole('heading', { name: 'A seat at your own table.' }).waitFor();
  assert.match(await mobile.page.locator('.papplu-local-note').innerText(), /browser\. No account\./);
  const mobileTable = await deal(mobile.page, 'Solo Practice');
  await mobileTable.getByRole('button', { name: 'Draw from stock' }).click();
  await mobileTable.getByRole('button', { name: 'Discard drawn' }).click();
  await assertFits(mobile.page);
  await screenshot(mobile.page, 'papplu-mobile.png');
  await mobile.page.getByRole('tab', { name: 'Hand Builder' }).click();
  const mobileBuilder = mobile.page.getByRole('tabpanel', { name: 'Hand Builder' });
  await mobileBuilder.getByRole('button', { name: 'Load valid 21-card example' }).click();
  await mobileBuilder.getByRole('button', { name: 'Evaluate hand', exact: true }).click();
  await mobileBuilder.getByText('Valid hand', { exact: true }).waitFor();
  await assertFits(mobile.page);
  await screenshot(mobile.page, 'papplu-builder-mobile.png');
  await mobile.context.close();
  record('The actual table and builder work at 390px without page overflow.');

  const unsupported = await newPage({ workers: false });
  await unsupported.page.goto(`${origin}/papplu`);
  await unsupported.page.getByRole('alert').filter({ hasText: 'does not support module Workers' }).waitFor();
  assert.equal(await unsupported.page.getByRole('button', { name: 'Deal round', exact: true }).isDisabled(), true);
  await unsupported.page.getByRole('tab', { name: 'Hand Builder' }).click();
  await unsupported.page.getByRole('tabpanel', { name: 'Hand Builder' }).getByRole('alert')
    .filter({ hasText: 'does not support module Workers' }).waitFor();
  await unsupported.context.close();
  record('Unsupported Workers produce visible errors instead of a silent main-thread fallback.');

  assert.equal(workerUrls.some(url => /\/assets\/engine-worker-[^/]+\.js$/.test(url)), true);
  assert.equal(responses.some(({ url, status }) => /\/assets\/papplu-model-[^/]+\.json$/.test(url) && status === 200), true);
  assert.equal(requests.some((url) => new URL(url).pathname.startsWith('/api/')), false);
  const telemetryPaths = new Set(['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js']);
  const platformOnly = responses.filter(({ url, status }) =>
    server && status === 404 && telemetryPaths.has(new URL(url).pathname));
  assert.deepEqual(responses.filter(response => response.status >= 400 && !platformOnly.includes(response)), []);
  assert.deepEqual(errors, []);
  record('The production Worker and model assets load with no evaluator API calls or uncaught browser errors.');
  if (platformOnly.length) console.log('NOTE Vercel telemetry scripts return 404 in local Vite preview. Hosting analytics are not verified.');
  if (evidenceDirectory) {
    await writeFile(join(evidenceDirectory, 'browser-verification.json'), `${JSON.stringify({
      createdAt: new Date().toISOString(), origin, browser: browser.version(),
      checks, workers: workerUrls, requests, responses, platformOnly, errors,
    }, null, 2)}\n`);
  }
} finally {
  await browser?.close();
  if (server) await new Promise((resolve, reject) => {
    server.httpServer.close((error) => error ? reject(error) : resolve());
  });
}
