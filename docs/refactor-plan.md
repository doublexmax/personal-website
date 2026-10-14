# Simplify the website in three work blocks

Block 1 is merged into master. Block 2 is implemented and locally verified, awaiting review. Block 3 has not started.

Keep the existing website and poker trainer. Change how the code is built, organized, and maintained.
Preserve content, routes, public document links, and saved poker ranges.
The [architecture specification](architecture-spec.md) defines the target and the limits.

## How to read this

Review the specification before approving the plan. Approve the whole scope or name the block to start.
One box is one unit of work and names the evidence needed to finish it.
Check a box only when its evidence exists. Stop at each block boundary for review before starting the next.

Use the focused Refactoring playbook, `playbooks\refactoring.md`, for implementation.
This is a manual, sequential refactor, not an autonomous PR program.
No scheduled agents, parallel owner sessions, production deployment, or merge automation are part of this plan.

## Prepare the baseline after approval

Do this before changing application code. This is preparation, not a separate cleanup release.

- [x] Record the starting commit and restore dependencies under Node.js 24. Save the build output and any existing warnings.
- [x] Capture the homepage, portfolio, trainer, and open chart editor at desktop and mobile widths. Save screenshots with the commit and viewport.
- [x] Exercise direct visits, refreshes, internal navigation, external links, and the existing resume URL. Record the result of each route.
- [x] Exercise the trainer with empty storage and with saved custom ranges. Save representative storage fixtures without clearing the user's browser data.
- [x] Record a complete training round, both RNG directions, slow mode, and the RFI and three-bet filters. Capture the feedback and counters.
- [x] Reproduce the source-level concerns in Appendix A. Separate observed defects from assumptions and intended behavior.
- [x] Add the smallest characterization coverage needed for the next block. Do not encode a known defect as desired behavior.

Appendix A records the preparation evidence, reproduced defects, and verification limits.
No application source, dependency manifest, or lockfile changed during preparation.
The added source-tree files are characterization tests only.

If the baseline fails, record the failure before proposing a correction.
Do not describe a changed result as a behavior-preserving refactor.
Obtain approval for an observable correction before including it in a block.

## Block 1. Replace the build system without redesigning the app

**Depends on.** The baseline.

**Required result.** The same app runs and builds through Vite and remains deployable to Vercel.

**Work.**

- [x] Replace `react-scripts` with Vite and the React plugin. Preserve Node.js 24 and the existing React and router versions.
- [x] Move the HTML entry point to the repository root. Replace CRA placeholders and connect the application entry module.
- [x] Rename files containing JSX to `.jsx` as part of this tooling change. Update every affected import in the same block.
- [x] Preserve `npm start` as a development entry point. Define build, preview, lint, and non-interactive test commands.
- [x] Replace lint and test support that depended on CRA. Use one focused test runner, not a second competing test stack.
- [x] Remove CRA-only configuration and the Babel workaround after Vite replaces them. Remove the unused `reportWebVitals` path while retaining Vercel Analytics and Speed Insights.
- [x] Remove `react-cookies` and unused testing dependencies. Retain test packages only when the characterization coverage uses them.
- [x] Keep Bootstrap CSS during this refactor. Remove jQuery, Popper, and Bootstrap JavaScript after confirming no current interaction depends on them.
- [x] Choose one Bootstrap Icons source and remove the duplicate dependency or CDN reference. Preserve the displayed icons.
- [x] Configure Vercel for the Vite output and SPA deep links. Keep existing static files and document URLs available.
- [x] Replace the CRA README with the actual development and deployment instructions. Update the lockfile through npm.

**Evidence needed to finish.**

- [x] Run the characterization checks, lint, and production build. Record the commands and results.
- [x] Serve the production output locally. Compare the baseline screenshots and exercise all three routes.
- [x] Confirm that the resume, favicon, manifest, images, and any still-used chart endpoint return their expected content.
- [ ] Inspect the Vercel settings with the operator. On an approved preview deployment, refresh `/portfolio` and `/gto-trainer` directly.

If preview deployment is not authorized or available, report local readiness separately from Vercel verification.
Do not deploy production to complete this block.

### Block 1 local evidence

The current toolchain uses Vite 8.3.4, Vitest 5.0.4, and ESLint 10.12.0.
React 18.3.1, React DOM 18.3.1, React Router 6.23.1, and Analytics 1.3.1 retain their baseline versions.
Speed Insights changed from 1.0.11 to 1.3.1 to resolve its obsolete optional-framework peer constraints with the modern build graph.
Its existing React integration remains mounted once.

The lockfile was regenerated with npm in a clean resolver directory, then installed with `npm ci`.
The clean resolver avoided the installed CRA/Babel peer graph.
No force or legacy-peer flags were used. No Next.js, Svelte, or Vue packages were added.
ESLint 10 handles JSX references natively, so an additional React JSX lint plugin was unnecessary.
The installed test stack requires a current Node.js 24 release, at least 24.15.0.

Application component bodies, poker rules, chart data, and CSS match the baseline after accounting for JSX extensions and import destinations.
The dormant vitals path and obsolete HTML scripts were removed.
The current lint policy reports existing unused-variable and unused-assignment diagnostics as warnings rather than changing trainer code in this block.

Receipts are stored in the adjacent session `files\block-1` directory:

| Receipt | Recorded result |
| --- | --- |
| `migration-manifest.json` | Working-tree hashes, installed versions, production asset hashes, and verification commands. |
| `dependency-resolution.json`, `lockfile-generation.log`, `dependency-install.log` | Clean dependency resolution and installation. The final lockfile contains 314 package entries rather than the baseline's 1555. These counts include platform-specific optional entries and do not measure runtime performance. |
| `production-build.log` | Production build succeeded and produced `dist`. |
| `characterization-tests.log` | The same two suites and 14 behavior assertions passed on Vitest. |
| `lint.log` | No errors. Two existing chart warnings remain, for `three_better` and the initial `chartMade` assignment. |
| `development-check.json` | `npm start` rendered the homepage without runtime errors. |
| `browser-results.json`, `browser-capture.log` | The eight production browser scenarios completed. Local routes, ten public assets, external destinations, chart editing, and saved ranges retained their baseline behavior. |
| `image-comparison.json` | The eight desktop and mobile route/editor images are pixel-identical to the preparation captures. |

The existing cold-storage, RNG-endpoint, filter, and repeated-hand defects were observed again, not fixed.
Live Vercel project settings and an authorized deployed preview remain unverified.
The local Vite preview does not substitute for that hosting check.
Vite's default modern browser target replaces the CRA Browserslist configuration.
The recorded parity checks cover Edge at desktop and mobile widths. Broader browser compatibility is not claimed.

### Vercel preview attempt

The operator authorized a preview deployment through the existing GitHub integration.
Commit `7c70e97e626609baf27bf0f5b2e090434f084c96` was pushed to `doublexmax-website-architecture`.
Vercel reports Preview deployment `7050709446` as successful.
The [preview deployment](https://personal-website-n2j1ax5ja-doublexmaxs-projects.vercel.app) is available to authorized Vercel users.

Unauthenticated requests to the homepage, portfolio, trainer, and public assets redirect to Vercel authentication.
The browser also reaches the Vercel sign-in page rather than the application.
The live route and asset checks remain unchecked. Authentication redirects do not prove those routes work.
The production branch remains at `93a52814c774b0fd91a8beff109fc784f317fab7`.
No production deployment, merge, or protection-setting change was performed.
Deployment and HTTP receipts remain in `<session artifacts>\vercel-deploy`.

### Block 1 merge

The operator authorized merging the build migration before continuing.
An independent verifier posted `PASS+NOTES` for the exact head and patch.
Fresh tests, lint, source comparisons, and both production artifacts passed.
All eight primary images matched the immutable baseline.
The notes retain the disclosed browser coverage and hosted-authentication limits.

The build migration merged into master at `4f75a517292c0a6c86ba23c94e81efadfb94b6bc`.
Vercel reports Production deployment `7051859071` as successful.
No hosted application verification is inferred from the deployment status.
The independent receipts are in `<session artifacts>\shipping-block1`.

**Review boundary.** Stop with the dependency diff, route results, and any intentional differences. Start Block 2 only after review.

## Block 2. Give files, shared markup, and styles clear ownership

**Depends on.** Block 1.

**Required result.** A maintainer can locate website code and trainer code without tracing generic filenames or global style overrides.

**Work.**

- [x] Move route components to `src\pages` and the trainer to `src\features\poker`. Apply the source mapping in the specification.
- [x] Extract the website header and layout as shared components. Keep the trainer's distinct layout.
- [x] Replace repeated portfolio-card markup with one `ProjectCard` and a small `projects.js` record list. Preserve project order, descriptions, destinations, and button labels.
- [x] Leave one-off homepage prose in the page. Do not build a generic content system.
- [x] Import global CSS once from the entry point. Put page and component rules beside their owners.
- [x] Scope trainer styles and rename collision-prone selectors. Update JSX and any remaining DOM selectors together.
- [x] Remove conflicting page-level `body` overrides after scoping the styles. Document any visual difference required to correct route leakage.
- [x] Rename opaque source assets and load them through imports. Preserve existing public asset URLs without duplicate binary copies.
- [x] Keep `Maxx_Tandon_Resume.pdf`, the favicon, and the manifest at their existing public URLs. Internal organization does not justify breaking public links.
- [x] Lazy-load the trainer after its styles are isolated. Keep lazy-loading feedback minimal and ensure navigation still works.
- [x] Update imports and documentation in the same block. Delete obsolete files after all callers move.

**Evidence needed to finish.**

- [x] Run lint, the characterization checks, and the production build.
- [x] Compare the homepage, portfolio, trainer, and editor at the recorded desktop and mobile viewports.
- [x] Navigate between all routes without a reload, then repeat with direct visits and refreshes. Confirm that trainer styles do not change the website layout.
- [x] Check every project link, header link, and public asset URL captured in the baseline.
- [x] Confirm that the initial homepage does not eagerly load trainer code or chart data.
- [x] Inspect the resulting tree and imports. Each new shared component must have actual consumers, not a hypothetical future use.

### Block 2 local evidence

`src\main.jsx` mounts the browser router and imports global CSS once.
`SiteLayout` owns shared website chrome through the router outlet.
`ProjectCard` renders the existing project records, while the portfolio page retains its original two-row layout.
Internal links now use the existing router without reloading the document.
New route pushes reset scroll to the top. History navigation does not force a scroll reset.

Page and trainer styles are scoped to their owners.
The `:where` roots preserve the old selector specificity and Bootstrap precedence.
Shared navigation geometry has both website and trainer consumers.
The existing green background is one invariant global default, not an effect of importing trainer CSS.
Normal body layout replaced the conflicting body overrides without a visual difference.

Images live once under `public\images` with descriptive filenames.
Consumers import the small `src\data\images.js` URL catalog.
This replaces the illustrative `src\assets` proposal because public binary imports worked in the production build but were denied by the SSR test loader.
The chosen shape avoids test-only loader exceptions, custom hashing machinery, and duplicate binaries.
Legacy redirects live in `vercel.json`. Vite reads those same entries for development and preview compatibility.

All 15 tests and the production build pass.
Lint has no errors and retains only the two existing chart warnings.
All eight primary desktop/mobile images are pixel-identical to the original baseline.
The homepage also remains pixel-identical after loading trainer CSS and returning through SPA navigation.
The five legacy image URLs redirect to unchanged binary content, including query preservation.
The initial homepage makes no trainer-module, trainer-CSS, or chart requests.
The trainer resources load when its route is visited.

The poker rule/helper bodies and chart representations remain unchanged.
Existing trainer defects remain deferred to the separately agreed Block 3 contract.
No Block 2 merge or production deployment has been authorized by this implementation step.
Receipts, the CSS migration tool, and the network/alias verification are in `<session artifacts>\block-2`.

**Review boundary.** Stop with the final file map and screenshot comparisons. Start Block 3 only after review.

## Block 3. Unify trainer data, logic, and rendering

**Depends on.** Block 2 and an agreed trainer behavior contract.

**Required result.** The trainer uses one effective range dataset and React-owned UI state. Poker rules do not depend on mounted DOM elements.

Treat this as one cohesive change because chart initialization, generation, editing, and persistence currently depend on each other.
Do not release a half-migrated trainer with separate old and new state owners.

**Work.**

- [ ] Keep one default chart dataset. Verify equivalence before removing the duplicate file or changing its public serving path.
- [ ] Move hand conversions and position conventions into named poker modules. Keep the existing chart keys and stored representation.
- [ ] Centralize chart loading, storage parsing, and writes at one boundary. Load effective ranges before enabling generation.
- [ ] Let the trainer own the effective ranges. Pass the selected range and an edit callback to the editor.
- [ ] Make an edit update both the visible chart and the data used by the next simulation. Preserve the edit after refresh.
- [ ] Separate scenario generation and answer evaluation from React, the DOM, and storage. Supply ranges and random input directly.
- [ ] Replace positional scenario arrays with named records. Replace mutually exclusive mode flags with one mode value.
- [ ] Express the training lifecycle with explicit phases. Derive control visibility and availability from that phase.
- [ ] Render chart cells, card displays, seats, feedback, and counters through React. Remove competing DOM creation and style mutations.
- [ ] Keep chart selection and percentage sliders local to the editor. Render only the selected chart.
- [ ] Preserve the existing controls, supported scenarios, animation intent, and chart color meaning.
- [ ] Cancel pending animation work when leaving the trainer. Prevent stale work from updating a later training round.
- [ ] Surface malformed storage and unavailable persistence explicitly. Do not silently reset saved ranges or report an unsuccessful save as successful.
- [ ] Remove obsolete effects, unused parameters, dead branches, and the old generator wrapper after every caller migrates.
- [ ] Add focused tests for hand mapping, scenario records, evaluation boundaries, persistence, and lifecycle transitions.

**Evidence needed to finish.**

- [ ] Run deterministic fixtures through the old and new rule implementations. Compare results for unchanged behavior.
- [ ] Assert every agreed behavior correction separately. Link the reproduction and approval rather than hiding the difference in updated snapshots.
- [ ] Use a fresh browser context. Confirm that the first simulation works without opening the editor or waiting for hidden charts.
- [ ] Edit a range, run a round, refresh, and run another round. Confirm that the same stored edit affects both rounds.
- [ ] Exercise all existing modes, both RNG directions, chart selection, slow mode, and multiple consecutive answers. Check that counters advance once per answer.
- [ ] Navigate away during the slow animation and return. Confirm that no stale round or duplicate timer affects the new screen.
- [ ] Exercise malformed stored data and failed writes in an isolated browser context. Confirm visible errors and retention of the original stored values.
- [ ] Compare the trainer and editor against the visual baseline. Run lint, the test suite, and the production build.

**Review boundary.** Stop with the final module boundaries, behavior comparisons, and the list of removed legacy paths.

## Close the refactor

- [ ] Confirm that all approved blocks meet the specification and their evidence requirements.
- [ ] Re-run the production route and asset checks against the completed app.
- [ ] Update the README and these documents to match the delivered tree and commands.
- [ ] Record any deferred defect or unavailable deployment check. Do not claim completion for an unverified requirement.
- [ ] Stop before publishing, merging, or deploying unless the operator explicitly requests that action.

## Appendix A. Evidence and unresolved behavior

The baseline is commit `93a52814c774b0fd91a8beff109fc784f317fab7`.
Preparation used Node.js 24.19.0, npm 11.17.0, Edge 155.0.4283.45, and Playwright 1.64.0.
The production artifact came from the unchanged CRA application.
The repository had no tracked tests or Vercel configuration before preparation.
The live Vercel dashboard and deployed application remain unverified.

### Preparation receipts

Evidence stays in the Copilot session's local artifact directory, outside the repository and deployment.
The receipt folder is:

```text
<session artifacts>\baseline
```

| Receipt | Recorded result |
| --- | --- |
| `baseline-manifest.json` | Source revision, runtime, artifact hashes, capture configuration, and reproduction commands. |
| `dependency-restore.log`, `production-build.log` | Exact locked dependency restore and successful production build. Existing Node deprecation and stale Browserslist warnings remain. |
| `characterization-tests.log` | Two test suites and 14 tests passed. Existing Testing Library `act` and homepage `class` warnings remain. |
| `browser-results.json`, `browser-capture.log` | Eight browser scenarios completed. Direct visits, refreshes, internal links, and ten public assets worked locally. |
| `screenshots` | Fourteen screenshots, including homepage, portfolio, trainer, and editor at 1440 by 1000 and 390 by 844 viewports. |
| `default-storage.json`, `custom-storage.json` | Isolated browser fixtures. The edited UTG AA frequency `[25, 75]` survived refresh and affected subsequent rounds. |
| `rule-probes.json` | Source-based hand conversion, cold-storage, opener-selection, and empty-range observations. |
| `serve-baseline.cjs`, `capture-browser.cjs`, `probe-rules.cjs` | Reusable local evidence tools. Browser-only dependencies live in the adjacent `browser-tools` directory. |

Preparation added `src\App.test.js` and `src\poker-hands.test.js`.
The tests cover the existing routes, link destinations, initial trainer controls, chart cells, and valid hand mappings.
They do not assert the reproduced defects as desired behavior.
Vercel telemetry is stubbed only in the component tests because CRA's Jest resolver cannot resolve the packages' exported React subpaths.

Use this command to repeat the current characterization suite on this Windows checkout:

```powershell
$env:CI='true'
npm.cmd test -- --watchAll=false --runInBand '--testMatch=**/*.test.js'
```

The explicit match avoids the current Jest absolute-path matching failure.
`npm.cmd` uses the installed Windows command entry point without changing PowerShell execution policy.
Block 1 replaces this legacy test setup rather than preserving those tooling limitations.

Browser checks used fresh contexts and never touched the user's existing browser storage.
External links were clicked and their requested destinations matched the configured URLs.
Third-party uptime was not tested.
The local static server provided the existing route fallback. These results do not verify Vercel's deployed rewrite settings.

The source inspection established the following ownership problems:

| Evidence | Finding |
| --- | --- |
| `src\Poker.js`, `src\Chart.js`, `src\PokerNavbar.js` | React state and direct DOM mutations both control the trainer. |
| `src\Chart.js`, `src\generator.js` | Both code paths load charts and access local storage. Opponent generation relies on ranges initialized elsewhere. |
| `src\charts.json`, `public\charts.json` | The two files have identical content and contain 81 ranges with two-value frequency entries. |
| `src\index.css`, `src\portfolio.css`, `src\poker.css` | Global body and generic element rules create competing page styles. |
| `src\info.js` | The unused range list uses `btn`, while the active positions and dataset use `button`. |

### Reproduced defects and behavior decisions

| Concern | Observed result | Evidence |
| --- | --- | --- |
| Cold-storage generation | Clicking Simulate with delayed chart loading raised a null-range error before a round appeared. Seventeen chart requests were pending. | Browser case `cold-storage-delayed-charts` and the cold-storage rule probe. |
| Suited-hand conversion | `AKs` encoded as `167` and decoded as `AK`, losing the suited suffix. | Rule probe `suited-hand-round-trip`. |
| RNG endpoints | At RNG zero, a 100 percent raise range was evaluated as fold. With inverted RNG, a 100 percent fold range was evaluated as raise. | Browser case `rng-endpoint-evaluation`. |
| Opener selection | Opponents with `[0, 0]` frequencies were treated as openers. A later candidate overwrote the earlier candidate because object assignment and `Map.get` do not share state. | Rule probe `zero-raise-opponents-and-overwritten-opener`. |
| Empty-range three-bet generation | Empty sparse ranges did not yield a scenario before the probe stopped at 200 random draws. The draw limit belongs to the probe, not the application. | Rule probe `empty-ranges-three-bet-only`. |
| Mutually exclusive filters | Checking RFI Only and then 3B Only left both controls checked on their first activation. | `filterState` in browser case `rounds-options-editor-and-persistence`. |
| Consecutive identical hands | A second AA round had a scenario and action controls but no visible card display. | `cardsVisible` in the recorded rounds and `desktop-complete-round.png`. |
| Range visibility | Selecting UTG1 against UTG displayed one complete chart. Changing the opener to CO reset the second selector and displayed the CO chart. The suspected visibility failure was not reproduced in this transition. | Browser case `chart-selection-visibility`. |

The screenshots also record the shared green body background on the homepage and portfolio.
The mobile editor extends beyond its viewport. Neither appearance was corrected.
Any intended visual correction remains a Block 2 review decision.

Confirmed defects are not approved fixes.
Block 1 can preserve the current behavior while replacing the build tooling.
Before Block 3, approve the intended trainer corrections separately from structural equivalence.

## Appendix B. Changes deliberately excluded

Retain React rather than rewriting the trainer in vanilla JavaScript.
Retain Bootstrap CSS rather than replacing every utility class.
Keep existing chart keys rather than introducing a storage migration.
Do not add TypeScript, Next.js, accounts, a backend, more poker formats, or more simulation modes.
Do not introduce generic services, a global state library, JavaScript class hierarchies, or a design system.
Do not combine this work with a dependency-wide upgrade, visual redesign, content rewrite, SEO project, or performance benchmark.

The specification records why these limits keep the refactor proportional.

## Appendix C. Risks and stop conditions

| Risk | Block | Required response |
| --- | --- | --- |
| CRA supplies tooling that Vite does not supply automatically. | 1 | Preserve explicit lint and test coverage rather than losing checks during migration. |
| Vercel settings override repository defaults. | 1 | Record the required dashboard changes and verify an authorized preview. |
| Existing global CSS has already changed the rendered appearance. | 2 | Compare recorded screenshots and seek approval for intentional visual differences. |
| Public assets have external consumers not visible in the source. | 2 | Keep existing URLs working instead of inferring that an unreferenced asset is safe to remove. |
| Stored data and current generation behavior disagree with the intended contract. | 3 | Reproduce the discrepancy, preserve data, and obtain approval for the correction. |
| A proposed abstraction adds more tracing without removing duplicated ownership. | Any | Remove the abstraction or explain the concrete responsibility it isolates. |

## Appendix D. Specification and reading list

- [Architecture specification](architecture-spec.md).
- [React's Create React App deprecation notice](https://react.dev/blog/2025/02/14/sunsetting-create-react-app).
- [Vite deployment and SPA rewrites on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

Apply Laziness Protocol to scope and dependency removal.
Apply Minimize Reader Load to file ownership.
Apply Model the Domain to trainer records and lifecycle.
Apply Boundary Discipline to persistence.
Apply Sequence Work into Verifiable Units to the three review boundaries.
