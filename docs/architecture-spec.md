# Website refactoring specification

Status is the target specification. Block 1 is merged. Block 2 ownership is implemented and locally verified. Block 3 remains unimplemented.
The [refactoring plan](refactor-plan.md) defines the work order and acceptance evidence.

## Purpose and scope

Visitors retain the same personal website, portfolio, and poker trainer.
Maintainers get explicit file ownership, one chart-data path, and one rendering model.
The change simplifies existing behavior rather than adding product capability.

The target remains a client-side React application with JavaScript, HTML, ordinary CSS, and static Vercel hosting.
Files containing JSX use `.jsx`. Domain and persistence modules use `.js`.
React, React Router, Bootstrap CSS, Vercel Analytics, and Speed Insights remain.
The build system changes from Create React App to Vite. Node.js remains pinned to 24.x.
The current test tooling requires Node.js 24.15.0 or newer.

No backend, TypeScript conversion, authentication, database, new poker scenario, or visual redesign is in scope.
No public JavaScript class API, plugin framework, or generic service architecture is introduced.

## Improvement areas and justification

| Area | Existing problem | Required improvement | Scope limit |
| --- | --- | --- | --- |
| Build and deployment | CRA hides build, lint, and test behavior behind `react-scripts`. | A supported Vite build with explicit commands and deployment configuration. | No simultaneous React or router upgrade. |
| File ownership | Website pages and poker domain code share a flat source directory. Generic names hide responsibility. | Pages, actual shared components, and one poker feature directory. | No folder hierarchy without a concrete owner. |
| Shared website markup | Portfolio cards repeat the same markup. The website layout is embedded in route declarations. | One project-card component, project records, and a shared website layout. | One-off page prose stays in the page. |
| CSS ownership | Page-level body rules and global selectors compete. | Small global defaults and scoped page or component rules. | Retain ordinary CSS and Bootstrap utilities. |
| Range data | Two identical files and multiple readers initialize the same browser data. | One default dataset, one persistence boundary, and one effective range state. | Preserve saved keys and frequencies. |
| Poker rules | Scenario generation depends on storage and positional tuples. | Named inputs and results with rule functions independent of the UI. | Preserve the agreed sampling and evaluation behavior. |
| Trainer rendering | Effects mutate elements that React also owns. | React renders from explicit state and lifecycle phases. | No new controls or gameplay modes. |

## Target file ownership

This is the proposed final layout. It is not an instruction to create empty modules.
Each component or module must remove a repeated responsibility or isolate a real boundary.

```text
index.html
package.json
package-lock.json
vite.config.js
vercel.json
README.md
docs\
  refactor-plan.md
  architecture-spec.md

public\
  MT.ico
  manifest.json
  robots.txt
  Maxx_Tandon_Resume.pdf
  charts.json
  images\
    logo.png
    portrait-maxx.jpg
    dealer-school-banner.png
    fischer-random-banner.png
    gto-trainer-banner.png

src\
  main.jsx
  App.jsx
  components\
    SiteHeader.jsx
    site-header.css
    SiteLayout.jsx
    site-layout.css
    ProjectCard.jsx
    project-card.css
  pages\
    HomePage.jsx
    home.css
    PortfolioPage.jsx
    portfolio.css
  data\
    images.js
    projects.js
  styles\
    global.css
  features\
    poker\
      PokerTrainerPage.jsx
      TrainerControls.jsx
      RangeEditor.jsx
      PokerTable.jsx
      useTrainer.js
      engine.js
      hands.js
      positions.js
      ranges.js
      range-storage.js
      default-ranges.json
      poker.css
```

Test files live beside the modules they cover.
The tree omits generated output and test artifacts.
Component styles may share an existing owner file when a separate stylesheet would add no clarity.
Until Block 3, the trainer uses `RangeChart.jsx`, `scenario-generator.js`, `poker-data.js`, and `poker-utils.js`.
These descriptive feature-local files retain the existing logic while its final state and persistence boundaries remain pending.

### Current-to-target mapping

Current names refer to the pre-refactor tree. An extension-only rename can happen in Block 1 before the final move in Block 2.

| Current source | Target responsibility |
| --- | --- |
| `src\index.js` | `src\main.jsx` mounts React and imports global CSS once. |
| `src\App.js` | `src\App.jsx` declares routes, lazy-loads the trainer, and mounts Vercel integrations once. |
| `src\Navbar.js` | `SiteHeader.jsx` owns the website header and existing links. |
| The `Layout` function in `src\App.js` | `SiteLayout.jsx` owns shared website structure. |
| `src\Home.js` | `HomePage.jsx` owns homepage content. |
| `src\Portfolio.js` | `PortfolioPage.jsx`, `ProjectCard.jsx`, and `projects.js` own the existing project collection. |
| `src\Poker.js` | `PokerTrainerPage.jsx`, `useTrainer.js`, and `PokerTable.jsx` own trainer composition, lifecycle, and display. |
| `src\PokerNavbar.js` | `TrainerControls.jsx` owns the existing mode controls and editor entry point. |
| `src\Chart.js` | `RangeEditor.jsx` owns selection, sliders, and the selected chart grid. |
| `src\generator.js` | `engine.js` owns generation and answer evaluation without browser I/O. |
| `src\info.js`, `src\utils.js` | `hands.js` and `positions.js` own poker conventions. Any remaining delay helper stays local to its lifecycle caller. |
| Both copies of `charts.json` | `default-ranges.json` is the canonical source. A required public endpoint is generated from it rather than maintained separately. |
| `src\reportWebVitals.js` | Removed. The current call has no reporting callback, and Vercel integrations remain. |

No generic `utils.js`, `info.js`, barrel-export tree, or one-caller service wrapper replaces these responsibilities.

## JavaScript and state contracts

### Website components

The website layout wraps the homepage and portfolio. The trainer retains its separate layout.
`ProjectCard` receives a project record with a title, description, image, link, and link label.
The project records preserve the current ordering and external destinations.
Layout-specific grouping stays in the portfolio page rather than becoming a universal card API.

### Poker domain records

The canonical position identifiers remain `utg`, `utg1`, `utg2`, `lj`, `hj`, `co`, `button`, `sb`, and `bb`.
Range keys remain compatible with the current JSON and local-storage keys.
Supported hand notation distinguishes pairs, suited hands, and offsuit hands.
The existing signed numeric keys remain valid at the dataset and persistence boundary.

Internally, a frequency record has named `callPercent` and `raisePercent` fields.
The fold percentage is derived rather than stored as a third mutable value.
Individual percentages are between zero and 100. Their sum does not exceed 100.
A missing hand in a valid sparse range means fold. A malformed range is an error, not an all-fold substitute.

A generated scenario has named `hand`, `heroPosition`, `history`, and `frequencies` fields.
The training round also owns its RNG value and display suits.
Sampling occurs once for the relevant round, not during repeated React renders.
The exact RNG thresholds and history semantics come from the approved behavior contract.

Training mode has one value, `all`, `rfi`, or `three-bet`.
Slow mode and inverted RNG remain independent boolean options.
Training phase has one value, `idle`, `dealing`, `awaiting-answer`, or `answered`.
Controls derive their visibility and availability from that phase.
An answer is accepted once for an awaiting round and updates the counters once.

### Module boundaries

| Owner | Responsibility | Forbidden dependency |
| --- | --- | --- |
| `hands.js` | Hand notation and grid or numeric conversion. | React, DOM elements, and storage. |
| `positions.js` | Position order and range-key construction. | Component state and storage. |
| `ranges.js` | Default data, sparse-range interpretation, and conversion to internal frequency records. | Mounted chart elements. |
| `range-storage.js` | Parsing stored data, loading overrides, and persisting edits. | DOM selectors and generation rules. |
| `engine.js` | Generating supported scenarios and evaluating actions from supplied data and random input. | React, DOM elements, fetch, and storage. |
| `useTrainer.js` | Effective ranges, options, round state, counters, and animation lifecycle. | Chart-cell DOM mutation. |
| `RangeEditor.jsx` | Editor-local selection and sliders, with range values and edit callbacks supplied by the trainer. | Direct storage writes and independent chart fetching. |
| `PokerTable.jsx` | Displaying seats, cards, current actions, and feedback. | Sampling new scenarios and mutating counters. |

Use functions and feature-local hooks. A reducer is acceptable if it reduces transition logic.
No generic state-machine library or class hierarchy is required.
There is one effective range state, not a mutable module cache synchronized with a second React copy.

The render path runs from the trainer hook to components.
Rule calls run from that hook to the engine.
Persistence runs through the storage boundary and returns data or explicit errors to the hook.

DOM refs are allowed for focus and browser APIs.
Direct DOM creation, text replacement, and style mutation do not control trainer content.
Timers and pending animation work are cleaned up on unmount or round replacement.

## Persistence and compatibility

Existing saved ranges retain their current keys and two-value `[call, raise]` representation.
The refactor does not namespace or version those keys without a demonstrated compatibility need.
Named internal records do not require rewriting the stored schema.

Default ranges load once when the trainer initializes.
Each valid saved range replaces its corresponding default range as a whole, without depending on a mounted chart.
Default hands are not merged into a saved sparse range. Missing hands in that saved range remain folds.
Edits update the effective ranges used by the chart and engine.
Persistence failure is visible. Unsaved changes are not presented as successfully saved.

Malformed data is reported with the affected range identified.
Original stored content remains intact. The refactor never calls `localStorage.clear()`.
Unrelated application data is outside this boundary.
A storage failure does not silently replace saved custom ranges with defaults.

The app retains `/`, `/portfolio`, and `/gto-trainer`.
Direct route visits and refreshes work on Vercel.
The existing resume URL, external links, and required public asset URLs remain valid.

Images have descriptive names in `public\images`, with URLs imported from `src\data\images.js`.
The source and build each contain one copy per image. Existing public cache behavior remains.
This avoids SSR-only image-loader exceptions and custom build-time alias machinery.
Existing asset URLs use retained paths or explicit redirects when a rename would break a consumer.
An unreferenced public file is not automatically safe to delete.
The current `/charts.json` endpoint remains during the migration while callers still use it.
Its final public compatibility requirement is resolved before removal.
The five renamed legacy image paths use temporary redirects defined in `vercel.json`.
Development and preview read that same redirect list rather than maintaining a second mapping.

## CSS and visual contract

`global.css` owns font defaults, reset rules, base colors, and shared tokens that have actual consumers.
Page and feature styles do not change `body` to switch layout or background.
The existing shared green page background is one global default and does not change between routes.
Feature-specific table and panel backgrounds remain inside their owners.
Page and trainer roots own their layout. No feature stylesheet changes the body.

Trainer selectors are scoped beneath `.poker-trainer` or use explicit poker class names.
Scope roots use `:where` when added specificity would change the existing Bootstrap cascade.
Generic table-element selectors do not affect unrelated pages.
The editor retains the current meaning of the raise, call, and fold colors.
Renamed CSS classes and DOM selectors change together while imperative code still exists.

Preserve content, responsive intent, controls, and the recorded visual baseline.
Do not replace Bootstrap utilities, introduce a design system, or redesign animations.
If CSS isolation changes an existing appearance, record and approve that difference rather than claiming exact parity.

## Build and deployment contract

The HTML entry point lives at the repository root and no longer contains CRA placeholders.
Vite builds static production files to `dist`.
The root Vercel configuration covers the Vite build and SPA deep links while preserving static asset responses.
No server runtime or Vercel function is added.

The target commands have the following responsibilities:

| Command | Responsibility |
| --- | --- |
| `npm start` | Start the development server. |
| `npm run build` | Produce the static Vercel artifact. |
| `npm run preview` | Serve the production artifact locally. |
| `npm run lint` | Check application code and React hook usage explicitly. |
| `npm test -- --run` | Run the focused characterization and domain tests without watch mode. |

Tooling dependencies live in `devDependencies`.
Testing packages with no tests or imports are removed.
Only the packages needed for the build and agreed verification are added.
Vercel integrations remain mounted once at the application level.
Lazy loading keeps trainer code and chart data out of the initial homepage load.
It does not serve as CSS isolation or change supported navigation.

Vercel project settings may override repository settings.
A production build alone does not establish that the live deployment configuration is correct.

## Behavior changes require a separate decision

This specification does not approve changes to poker probabilities, scenario support, or hand-sampling weights.
The existing dataset remains numerically unchanged.
Source-level concerns become verified defects only after reproduction.

A required correction records the observed behavior, intended behavior, smallest correction, and regression case.
The operator approves observable differences before implementation.
A larger bug fix or new capability is separate work, not justification for expanding this refactor.

## Completion contract

Each work block has a before-and-after behavior comparison and its own acceptance evidence.
Automated tests cover the rules and data boundaries being changed.
Browser checks cover route navigation, chart editing, persistence, and complete training rounds.
Screenshot comparisons cover desktop and mobile layouts.
Verification includes the production artifact, not only the development server.

Completion means the agreed behavior remains intact and the obsolete ownership paths are removed.
No duplicate chart source, independent UI storage writer, or competing DOM-rendering path remains.
Unavailable deployment checks and unresolved defects stay explicit.

## Design rationale

Laziness Protocol keeps React, Bootstrap CSS, and the stored schema instead of creating three unrelated migrations.
Minimize Reader Load places poker ownership in one feature directory and rejects speculative wrapper layers.
Model the Domain replaces ambiguous tuples and mutually exclusive flags with named records and explicit phases.
Boundary Discipline keeps persistence validation at one boundary and removes browser I/O from poker rules.
Sequence Work into Verifiable Units gives each cohesive block a checkable result before the next block begins.
