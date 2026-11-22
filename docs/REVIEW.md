# Verification record

Checked on 22 November 2026.

## Independent Claude cross-check

The project was reviewed using the actual Claude Code CLI, version 2.1.325. Response metadata identified the model as `claude-opus-5-5`. Claude received the source files in read-only prompts; it did not execute tests or independently browse source links. The lead separately ran the tests, checked live browser behavior, and verified research sources.

The numerical review found and reproduced three issues: overflow/underflow in derived business ratios, CSV rounding that erased small positive values, and floating-point tie classification in the household model. All three were fixed with focused regression tests. Claude reviewed the revised models and found no remaining correctness defects in that scope.

The application review covered the interface, persistence, local server, continuous integration, and repository documentation. Repairs addressed shared-link reload behavior, skip navigation, accessible labels and live announcements, small-value displays, rounded-number explanations, slider handling, comparison-card synchronization, and supported Node versions.

The final targeted application recheck confirmed all reported findings were repaired. A subsequent small-emissions table correction adds three rendering regressions so positive quantities below 0.1 tonnes remain distinct from zero.

Review is evidence of a bounded inspection, not a guarantee that the software is defect-free.

## Executed checks

- 43 numerical, display, export, validation, and persistence tests pass locally.
- JavaScript syntax checks cover the interface, both calculation modules, saved-state module, and local server.
- GitHub Actions tests the application with Node.js 22 and 24.
- The actual browser was used to check the business and policy workflows, preset selection, saved comparisons, reload persistence, copied scenario links, CSV download contents, invalid-input feedback, zero-benefit payback, keyboard slider controls, skip navigation, and narrow-screen layout.
- An imported scenario was edited and reloaded to confirm the original link no longer overwrites the edits.
- A business with one tonne of baseline emissions and a 30% reduction displays 0.3 tonnes avoided.

## Interpretation limits

The examples are synthetic. Simple payback omits discounting and asset life; operating cash surplus is not accounting net income. Household transfers omit wider welfare effects. See [methodology](METHODOLOGY.md).

GitHub badges are verified from the account's actual achievement details, separately from code tests and activity counts. A merged PR or a local test cannot itself establish that GitHub awarded a badge.
