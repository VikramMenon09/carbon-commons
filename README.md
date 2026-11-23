# Carbon Commons

**Business decisions. Environmental outcomes. Transparent economics.**

Carbon Commons is a zero-dependency interactive lab for exploring carbon costs, emissions-reduction investments, and household rebates. It is an educational scenario tool with explicit assumptions, accessible charts, shareable scenarios, and reproducible CSV exports.

[Open the live lab](https://vikrammenon09.github.io/carbon-commons/) · [Contribute](CONTRIBUTING.md) · [Review record](docs/REVIEW.md)

## What you can do

- **Business lab:** enter revenue, operating costs, emissions, a carbon price, investment cost, and annual savings. Compare emissions, carbon charges, operating cash surplus, simple payback, and a five-year cumulative cash-flow illustration.
- **Policy lab:** vary a carbon price, revenue recycling, assumed emissions response, and household size. Compare direct charges and equal rebates across five synthetic income groups.
- **Compare scenarios:** save three business and three policy cases in browser-local storage, reload them, copy reproducible links, or export inputs and outputs to CSV.

All presets are hypothetical, in illustrative USD. The models are **not calibrated forecasts, accounting statements, or investment appraisals**. Read the [methodology](docs/METHODOLOGY.md) for every equation, omission, and primary source.

## Run locally

Requires Node.js 22 or newer. No installation or API key is needed.

```sh
git clone https://github.com/VikramMenon09/carbon-commons.git
cd carbon-commons
npm start
```

Open **http://127.0.0.1:4173**. To use another port, run `PORT=4174 npm start`.

```sh
npm test
npm run check
```

Tests exercise independently calculated examples, conservation of policy revenue, boundary conditions, numerical precision, CSV fidelity, shared links, and storage failures. Continuous integration runs the same checks for pull requests.

## How the project fits together

| Location                                            | Purpose                                                       |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `dist/index.html`, `dist/styles.css`, `dist/app.js` | Responsive interface and charts                               |
| `dist/business.js`                                  | Business operating-cash-flow and emissions accounting         |
| `dist/model.js`                                     | Household carbon-charge and rebate accounting                 |
| `dist/state.js`                                     | Validation of stored records and shareable scenarios          |
| `dist/workspace.js`                                 | Working scenarios, safe recovery, and browser-storage updates |
| `dist/form.js`, `dist/format.js`                    | Draft input validation and consistent numerical presentation  |
| `dist/version.js`                                   | Calculation release identifier included in CSV exports        |
| `test/`                                             | Node's built-in test suite                                    |
| `docs/METHODOLOGY.md`                               | Formulas, units, examples, and limits                         |
| `scripts/serve.mjs`                                 | Local static preview                                          |

Read [the architecture and maintenance guide](docs/ARCHITECTURE.md) for the input, model, rendering and persistence boundaries.

Static hosting serves the `dist/` directory. All asset paths are relative, so the app also works beneath a repository path. The optional `.openai/hosting.json` binds the private Sites preview; forks should remove that file before creating their own Site.

## Data and privacy

The app sends no scenario data to a backend and requires no account. Saved scenarios stay in the current browser. A copied scenario URL includes its input values; share it only when you intend those inputs to be visible. CSVs include the numerical assumptions. Browser storage can be cleared or unavailable, so use exports for durable copies. If stored data is unreadable or partly invalid, the app keeps valid records in memory and pauses automatic saving. It preserves the original stored value until you explicitly choose to replace browser data with the current session. Unrelated changes from another tab are merged before ordinary writes; simultaneous changes to the same scenario can still replace one another.

The existing typefaces are served locally with the app under their upstream SIL Open Font Licenses; source URLs, hashes and licenses are in `dist/fonts/`. System fonts remain available as fallbacks. No external font requests, analytics, or tracking scripts are included.

## Development and attribution

Built with AI assistance from Codex, with an independent Claude review of calculations and implementation. AI-assisted work is credited accurately; model outputs remain subject to the documented assumptions and tests.

The project is maintained through focused pull requests. Contributions that improve economic interpretation, business examples, accessibility, or environmental data quality are welcome.

MIT licensed. Copyright 2026 Vikram Menon.
