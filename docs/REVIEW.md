# Verification record

Checked on 22 November 2026 for the 1.1.0 reliability pass. The starting revision had 43 passing tests. This pass added regression coverage for reproduced numerical, persistence, interface and preview-server defects; 77 tests now pass locally.

## Independent Claude cross-check

The actual Claude Code CLI was used with tools disabled and no session persistence. Response metadata identified `claude-opus-5-5`. Exact source snapshots were supplied through standard input and recorded with hashes. Claude performed static review; it did not execute tests, drive a browser, validate external research or inspect font binaries.

The core review covered both numerical models, state validation, the shared version constant, the preview server and their tests. Its first pass identified unrecognized persisted fields being dropped without a recovery warning. That was fixed at every storage level and retested. The final core review found no remaining material reproducible defect in that scope. The reviewer also confirmed the directly calculated small emissions/charge deltas, bounded zero/full-reduction endpoints and versioned CSV rows. The font MIME additions to the server were reviewed in the later application pass.

The application review covered the controller, draft handling, formatting, workspace persistence, styles, HTML entry point, font CSS/source manifest, preview/syntax scripts, related tests, package configuration, README, architecture and methodology. It identified three concrete defects:

- Policy and saved-card text could still label a small nonzero reduction as zero. The results, details, comparison cards and announcement now preserve its meaning; a policy price of `0.000001` is covered by a regression.
- Failed recovery could replace the focused recovery button and leave focus on the document. The new button receives focus after failure; the test exercises the replacement.
- An off-step imported range could move in the wrong direction on its first arrow key. The real browser reproduced `50.1` becoming `50` after Right. The handler now moves to the next grid point in the requested direction, with unit and controller regressions.

The application follow-up review accepted the repaired scope with no material reproducible defects. It also flagged a possible native accessibility-input path around the keyboard repair. The lead reproduced that path through the browser accessibility API: an imported value of `50.1` changed to `52.1` was snapped backward to `50`. A general snapping repair now captures the incoming value before native step sanitization and tracks each slider’s prior draft value. New unit and controller regressions cover this path. A bounded follow-up review accepted this repair with no material reproducible defect. The lead verified the repaired native accessibility-API paths in the browser: `50.1` changed to `52.1` now becomes `55`, and `54.9` changed to `52.9` becomes `50`. This checks the value-change path, not a complete screen-reader workflow.

A further browser reproduction found that the old grid-membership tolerance labeled a price of `1e-8` as on-step. Native range sanitization silently made its control zero; editing an unrelated rebate then erased the imported price. Exact membership in the rounded supported grid now selects `step="any"` for every off-grid import, while ordinary decimal grid values such as household size `2.4` keep their normal step. Unit and rendered-markup regressions cover the distinction. A bounded static review accepted the membership repair with no material reproducible defect. The browser retest confirmed that price `1e-8` remains the native value with `step="any"` after editing the unrelated rebate. The review also noted that the stepping tolerance could skip the nearest grid point for near-grid imports; it was removed, with regressions for `50.000000001`, `49.999999999` and household `2.4000000000000004`. The final bounded static recheck accepted the stepping and narrow-phone field layout changes with no material reproducible defect.

The review also noted deliberate limits: recovery replaces the latest browser data rather than merging a paused session, including another tab’s changes. The notice and architecture document this explicitly. The local preview server is not hardened against a different local process changing symlinks between its containment check and read. Neither static review nor the DOM test port establishes native browser or assistive-technology behavior.

## Executed checks

- `npm test`: 77 tests passed, including independently calculated model examples, tiny numerical deltas, export fidelity/version metadata, strict saved-state validation, preservation of damaged storage, explicit recovery, fresh-read multi-tab writes, controller events and preview-server containment.
- Scratch-copy fault injection: three deliberate regressions (subtracting near-equal charges, trusting modified CSV result data, and bypassing the recovery write guard) each failed relevant assertions. Production source was untouched by this check.
- `npm run check`: all JavaScript modules in `dist/` and `scripts/` pass syntax checking.
- Real-browser success paths: both labs, save/load/remove, duplicate detection, the three-card limit, restored focus, CSV download contents and revision, share-link round-trip, existing saved cards and cross-tab preservation of the other lab’s inputs.
- Real-browser invalid-draft path: clear revenue, move price to 200, then repair revenue. Readout and accessible value follow the draft, results are marked as the last valid scenario and actions are disabled until valid; correction displays the expected annual benefit of $27K.
- Real-browser edge paths: imported price `50.1` followed by Right gives `55`; `46` followed by Left gives `45`; Home and End give 0 and 200. Tiny policy output displays `1.0e-7%`, less than 0.01 tonnes, a nonzero spoken reduction and correctly signed relative bars. Its downloaded CSV preserves the tiny input, percentage and transfers with revision `1.1.0`.
- Responsive checks at 320px and 375px: no page overflow; critical labels and actions are at least 14px; metric cards stack. The policy table scrolls by keyboard, and the narrow-screen chart legend has clear separation. Paired business fields now stack at 420px and below after a 320px browser check exposed clipping of the default revenue amount. The final browser retest at both 320px and 375px confirmed that default and maximum 13-digit amounts are fully readable without page overflow. A short pointer drag from an imported price produced the correct value without a persistent jump.
- Local font requests: all six WOFF2 files and both license files returned the expected bytes and MIME types with no console errors or warnings. Fonts use bundled files rather than remote Google Fonts requests.

The lead separately verifies the final deployment and GitHub Actions run. Those results must be checked at their actual published revision; local checks do not establish remote deployment success.

## Interpretation limits

The examples are synthetic. Simple payback omits discounting and asset life; operating cash surplus is not accounting net income. Household transfers omit wider welfare effects. See [methodology](METHODOLOGY.md).

Browser storage is not transactional or synchronized across devices. Closely simultaneous writes to the same scenario can still use last-writer-wins behavior. Native screen-reader announcements, iOS clipboard selection and a complete Firefox/Safari matrix have not been certified by this pass. The DOM port tests application event logic, not browser layout or native control behavior.

GitHub badges are verified from the account’s actual achievement details, separately from code tests and activity counts. A merged pull request or a local test cannot itself establish that GitHub awarded a badge.
