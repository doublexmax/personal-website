# Maxx Tandon's personal website

A client-side React website with a homepage, portfolio, and GTO poker trainer.
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
The tests cover the existing routes, link destinations, initial chart display, and hand conversions.
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
Its SPA rewrite supports direct visits and refreshes at `/portfolio` and `/gto-trainer`.
Documents, the favicon, manifest, and `charts.json` keep their public URLs.
Vite generates `/charts.json` from the trainer's single canonical dataset.
The five renamed images have temporary legacy redirects defined in `vercel.json`.
Development and preview use the same redirect list.
Bootstrap CSS and Bootstrap Icons retain their existing CDN versions.
Vercel Analytics and Speed Insights remain mounted in the app.
React and React Router retain their pre-migration versions.
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

## Source and refactoring scope

`index.html` loads `src\main.jsx`, which mounts the browser router and `src\App.jsx`.
Components containing JSX use `.jsx`. Other JavaScript modules use `.js`.
Website pages live in `src\pages`.
Shared website chrome and cards live in `src\components`.
Project and image records live in `src\data`.
Trainer components, rules, fixtures, and styles live in `src\features\poker`.
The trainer's JavaScript and CSS load only when its route is visited.
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
