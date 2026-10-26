# Maxx Tandon's personal website

A client-side React website with a homepage, portfolio, GTO poker trainer, and Papplu AI card table.
Vite builds the existing JavaScript, JSX, and CSS into static files for Vercel.

## Prerequisites

Use a current Node.js 24.x release, at least 24.15.0, and npm.
`package.json` pins the Node major version for Vercel.

## Run locally

Install the locked dependencies and start the development server:

```sh
npm ci
npm start
```

Open the local URL printed by Vite, normally `http://localhost:5173`.
On Windows, use `npm.cmd` if PowerShell blocks the `npm.ps1` entry point.

## Check the app

Run the lint checks, characterization tests, and production build:

```sh
npm run lint
npm test -- --run
npm run build
```

`npm test` starts Vitest in watch mode.
The tests cover the routes, link destinations, initial chart display, hand conversions, and Papplu play flows.
ESLint reports existing application warnings separately from errors.
The build command does not run lint or tests implicitly.
Vite's default modern browser target replaces the CRA Browserslist configuration.
Recorded visual checks cover Edge at desktop and mobile widths, not every browser from the former policy.

To inspect the production artifact:

```sh
npm run preview
```

The preview normally runs at `http://localhost:4173`.
Generated files go to `dist`, which is not committed.

## Deploy to Vercel

`vercel.json` selects Vite, runs `npm run build`, and serves `dist`.
Its SPA rewrite supports direct visits and refreshes at `/portfolio`, `/gto-trainer`, and `/papplu`.
Documents, the favicon, manifest, and `charts.json` keep their public URLs.
Vite generates `/charts.json` from the trainer's single canonical dataset.
The five renamed images have temporary legacy redirects defined in `vercel.json`.
Development and preview use the same redirect list.
Bootstrap CSS and Bootstrap Icons retain their existing CDN versions.
Vercel Analytics and Speed Insights remain mounted in the app.
React retains its pre-migration version. React Router uses 7.18.4 to resolve security advisories.
Speed Insights uses 1.3.1 for compatibility with the new dependency graph.

If the Vercel project has explicit dashboard overrides, align them with the repository configuration:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js version | 24.x |

Verify an authorized preview deployment before publishing production.
Local preview does not verify the live Vercel project's settings.

## Play Papplu

`/papplu` loads a standalone card table outside the portfolio layout.
Hand evaluation and AI moves run in module Workers with an exported neural model.
It needs a current browser with Worker support.
An unavailable Worker produces a retryable error rather than a main-thread fallback.
Vercel serves static files. Papplu has no backend, accounts, serverless functions, or online opponents.

The table supports one to six seats, each Human or AI.
AI tiers are Neural + Search, Tactical, and Casual.
The presets are vs AI, Solo Practice, Pass & Play, and AI Watch.
Neural + Search uses the exported model when the rules match its configuration.
The seat reports its effective tier and any downgrade.

The default deal uses three decks, 21 cards per hand, five required qualifying pure sequences, and stock recycling.
Setup edits apply to the next deal.
Pass & Play covers all human hands between turns.
A solo human keeps their own hand visible during AI turns, without opponent faces.
AI Watch exposes every AI hand.
Opening Hand Builder pauses an active table. Returning to the table requires an explicit Resume.

A hand check does not declare a win.
Declare win commits the selected discard face down before the engine checks the remaining hand.
A false declaration adds 80 penalty points and eliminates the player.
AI declares only verified wins.
The round summary lists minimum deadwood, exempt melds, and counted cards for every seat.
The false-declaration scoreboard remains separate from deadwood.

Hand Builder has its own Worker and an explicit Evaluate hand action.
It supports joker and hand-rule edits, card selection, sorting, movement, removal, and valid and invalid 21-card examples.
Partial hands receive minimum deadwood scores without a complete-hand verdict.
Worker errors and evaluation deadlines are retryable errors, not invalid-hand verdicts.
The built hand and its result survive tab switches. The inactive builder releases its Worker.

Table settings use the `papplu:settings:v1` local storage key.
Storage failures appear in the UI without removing the previous saved value.
Hands and active rounds do not persist across refreshes.

### Update the browser engine

The browser engine comes from [PappluAI](https://github.com/doublexmax/PappluAI).
The generated files live in `src/features/papplu/engine`.
Do not edit those files in this repository.
To copy the allowlisted files from a local source worktree, run:

```sh
npm run sync:papplu -- --source "C:\path\to\PappluAI\web"
npm run check:papplu
```

The sync command records source provenance and file hashes.
`check:papplu` checks the vendored files offline.
`npm run build` runs that check through `prebuild` before Vite bundles the app.
The model loads as a separate Vite URL asset rather than inline weight data in the route JavaScript.
Git preserves the vendored bytes without line-ending conversion so the same hash check works on Windows and Vercel.

### Verify browser play

Run the production browser checks:

```sh
npm run verify:papplu
```

The command builds the app, starts a temporary local preview, and opens a headless browser.
It uses Edge on Windows and Playwright Chromium elsewhere.
If Chromium is missing, install it with `npx playwright install chromium`.
Set `PAPPLU_BROWSER_CHANNEL` to use another installed Playwright browser channel.
Set `PAPPLU_EVIDENCE_DIR` to save screenshots and the browser request log.
The checks cover real Worker and model loading, table play, declarations, private handoffs, Hand Builder, mobile layout, and route isolation.
The local preview does not serve Vercel's telemetry scripts.
The runner records those two expected 404s separately and does not verify hosted analytics.

## Source and refactoring scope

`index.html` loads `src\main.jsx`, which mounts the browser router and `src\App.jsx`.
Components containing JSX use `.jsx`. Other JavaScript modules use `.js`.
Website pages live in `src\pages`.
Shared website chrome and cards live in `src\components`.
Project and image records live in `src\data`.
Trainer components, rules, fixtures, and styles live in `src\features\poker`.
The trainer's JavaScript and CSS load only when its route is visited.
Papplu components, UI tests, and scoped styles live in `src/features/papplu`.
Its route also loads lazily.
`usePappluTable.js` binds React to the frozen snapshot from `createTable`.
The controller owns game rules, AI scheduling, privacy, declarations, and round summaries.
React dispatches stamped intents and keeps no second copy of the game.
`HandBuilder.jsx` owns only its local card-selection reducer and evaluation lifecycle.
Global CSS is imported once. Page and feature rules stay scoped to their owners.
Public documents remain in `public`. Images have descriptive names in `public\images`.
Poker ranges are still stored locally in the browser under the existing keys.
The trainer loads valid saved overrides before enabling simulation.
Unedited defaults stay in the bundle rather than being copied into storage.
Edits affect the selected chart and the next simulation after a successful save.
Malformed data and unavailable storage produce visible errors without clearing the saved values.

Trainer rules live in `hands.js`, `positions.js`, and `engine.js`.
Range parsing and persistence live in `ranges.js` and `range-storage.js`.
The trainer hook owns rounds and counters; React renders the controls, table, and selected chart.
Slow-mode and RNG settings apply when a round starts.

The [refactoring plan](docs/refactor-plan.md) records the baseline and work blocks.
The [architecture specification](docs/architecture-spec.md) defines the eventual file and state ownership.
The Block 3 changes include the operator-approved corrections recorded in the plan.
No accounts, backend, additional poker formats, or storage migration are introduced.

## Layout

The site uses a shared content width and responsive gutters.
Page styles own the homepage sections and portfolio grid.
The trainer stylesheet owns its toolbar, table, round controls, and chart editor.
On narrow screens, chart scrolling stays inside the editor rather than widening the page.
Layout changes do not change poker rules, saved ranges, or route destinations.
