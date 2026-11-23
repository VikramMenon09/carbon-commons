# Carbon Commons methodology

Carbon Commons is a transparent teaching model of carbon charges and equal household rebates. Every household, income and emissions number below is **synthetic**. Results illustrate accounting relationships under user-chosen assumptions; they are not observations, forecasts, a calibrated national model or estimates of the total economic effects of a policy.

## What the model represents

Five representative households stand for five equally weighted income groups. Each represents 20% of households in this toy population. Within-group variation is omitted. The labels describe only the synthetic ordering, not measured quintile boundaries in any country.

| Group          | Annual income, illustrative USD | Baseline annual emissions, tonnes CO2e |
| -------------- | ------------------------------: | -------------------------------------: |
| Lowest income  |                          25,000 |                                      6 |
| Lower middle   |                          50,000 |                                     10 |
| Middle income  |                          80,000 |                                     14 |
| Upper middle   |                         130,000 |                                     20 |
| Highest income |                         240,000 |                                     30 |

The baseline average is 16 tonnes CO2e per household per year at 2.5 people per household. A shared household-size setting scales **every group's emissions** by `householdSize / 2.5`; incomes stay fixed. This is an illustrative scaling assumption, not a household equivalence scale. A fractional household size represents an average. The equal rebate is per household, not per person; all households use the same size setting.

Dollar values are illustrative USD with no calendar-year calibration, inflation adjustment or exchange-rate conversion. Quantities are annual. `CO2e` means carbon dioxide equivalent; the model assumes all included emissions are covered by the charge.

## Inputs and equations

| Input           | Accepted range | Default | Meaning                                                           |
| --------------- | -------------- | ------: | ----------------------------------------------------------------- |
| `carbonPrice`   | 0–200          |      50 | USD charged per tonne CO2e                                        |
| `rebateShare`   | 0–100          |      75 | Percent of collected revenue returned equally to households       |
| `response`      | 0–40           |      10 | Assumed percentage reduction in emissions at a price of USD 100/t |
| `householdSize` | 1–6            |     2.5 | Common average number of people in every representative household |

Let `p` be the carbon price, `s` the rebate share divided by 100, and `b_i` the size-adjusted baseline emissions of group `i`.

```text
reductionRate = min(0.80, (response / 100) × (p / 100))
avoidedEmissions_i = b_i × reductionRate
afterEmissions_i = b_i × (1 − reductionRate)
charge_i = p × afterEmissions_i
averageCharge = sum(charge_i) / 5
dividend = s × averageCharge
netTransfer_i = dividend − charge_i
publicFundsPerHousehold = averageCharge − dividend
netShareIncome_i = 100 × netTransfer_i / annualIncome_i
```

`response` is a chosen sensitivity parameter, **not an empirically estimated price elasticity**. Emissions fall linearly with the carbon price under this assumption, up to 80%. At zero price, the assumed reduction is zero. Every group has the same percentage response. Raising the rebate share does not affect emissions in this model. Increasing the assumed response lowers both emissions and the tax base.

Charges are applied to the **remaining** emissions after the assumed response. Revenue is redistributed from that same tax base, so total charges equal dividends plus retained public funds, up to floating-point precision. Public funds are a budget residual; the model assigns them no additional emissions effect or household welfare benefit.

At the defaults, the model gives 15.2 tonnes remaining emissions, USD 760 collected, USD 570 rebated and USD 190 retained per household per year. The lowest-income representative pays USD 285 and receives USD 570, a net annual transfer of USD 285. These are arithmetic examples, not real-world predictions.

The `winners` count is the number of representative groups with a non-negative direct net transfer at a positive carbon price. At zero price it is zero, since there is no policy-induced transfer. A positive transfer does not establish a household's total welfare gain: changed consumption, abatement costs, wages, prices, employment and environmental benefits are not modeled.

Arithmetic noise at a neutral transfer is normalized to zero only when its magnitude is at most `8 × Number.EPSILON × max(abs(dividend), abs(charge))`. This is a tolerance relative to the cash flows, with no fixed dollar threshold; real small transfers remain visible. A 100% rebate leaves exactly zero retained funds.

## Why these concepts are included

- The World Bank explains carbon pricing as assigning a price to greenhouse-gas emissions, creating an incentive to reduce them. This supports the teaching mechanism, not the selected response rate. [World Bank, Carbon Pricing Dashboard](https://carbonpricingdashboard.worldbank.org/).
- The OECD discusses the distribution of household burdens and equal lump-sum revenue recycling as a hypothetical illustration. This motivates examining charges and rebates together; it does not validate this project's synthetic households or imply a recommendation. [OECD Employment Outlook 2024, chapter 5: Who pays for higher carbon prices?](https://www.oecd.org/en/publications/oecd-employment-outlook-2024_ac8b3538-en/full-report/component-9.html).

Sources checked on 22 November 2026. Neither source supplies this simulator's numerical inputs. The project makes no claims about current national carbon-tax rates or policies.

## Deliberate omissions

There is no input-output model, demand curve, marginal abatement-cost curve, differential response by income, cross-border adjustment, tax interaction, capital or labor response, administrative cost, within-group heterogeneity, uncertainty distribution, or dynamic investment. The same toy households are used for every scenario. There are no regional presets or implied country estimates. Results are direct charge/rebate accounting, not cost-benefit analysis.

## JavaScript contract and reproducibility

`dist/model.js` is a zero-dependency browser-compatible ES module.

- `DEFAULTS` and `HOUSEHOLDS` are frozen exports. Household records have `id`, `label`, `income`, `baselineTonnes` and `color`.
- `calculateScenario(input = {})` uses defaults for missing fields, requires finite numeric inputs within the documented bounds, and throws `TypeError` or `RangeError` for invalid values. Numeric strings are not coerced. Unknown fields are ignored. It does not mutate inputs or baseline records.
- The result includes `input`, `reductionRate` (a fraction, not a percentage), average `baselineTonnes`, `afterTonnes`, `avoidedTonnes`, `averageTax`, `dividend`, `publicFundsPerHousehold`, `winners`, and `households`.
- Each result household includes baseline fields plus `afterTonnes`, `avoidedTonnes`, `tax`, `dividend`, `net`, and `netShareIncome` (a percentage). Its `baselineTonnes` includes the household-size adjustment.
- `totals` sums exactly five representative households: `householdCount`, `baselineTonnes`, `afterTonnes`, `avoidedTonnes`, `tax`, `dividends`, `publicFunds`, `netHouseholds` and `budgetBalance`. These are not national totals. `budgetBalance` is taxes minus dividends minus public funds and should be zero within floating-point precision.
- `scenarioToCSV(result)` returns CRLF-delimited CSV with assumptions, units and five household rows. It recomputes from validated inputs so modified output labels cannot introduce spreadsheet formulas. Numeric values use JavaScript's round-trip decimal representation, including scientific notation for very small or large values; exports do not round tiny positive values to zero. On-screen rounding does not affect calculation.

Run `node --test test/model.test.mjs` from the project directory. Tests cover an independently calculated default, budget balance over 180 parameter combinations, zero price, all/no rebates, response sensitivity, household-size scaling, invalid bounds, immutable baselines, neutral-transfer precision, small transfers, and faithful CSV export.

## Business transition calculator

The separate business calculator compares illustrative annual operating cash flows before and after a user-specified emissions-reduction investment. It does not apply the household response formula or distribute rebates. Every business number is a user input or an explicitly hypothetical default, not a verified company estimate.

| Input              | Accepted range |   Default | Meaning                                                                           |
| ------------------ | -------------- | --------: | --------------------------------------------------------------------------------- |
| `revenue`          | 0–1 trillion   | 1,000,000 | Annual revenue in illustrative USD                                                |
| `operatingCost`    | 0–1 trillion   |   800,000 | Annual operating costs before the carbon charge                                   |
| `annualTonnes`     | 0–1 billion    |       250 | Annual emissions in tonnes CO2e                                                   |
| `carbonPrice`      | 0–200          |        50 | Assumed USD charge per tonne CO2e                                                 |
| `reductionPercent` | 0–100          |        30 | Assumed emissions reduction from the investment                                   |
| `investment`       | 0–1 trillion   |    50,000 | Upfront investment in USD                                                         |
| `annualSavings`    | 0–1 trillion   |    12,000 | Recurring operating savings in USD per year, **excluding** avoided carbon charges |

```text
avoidedTonnes = annualTonnes × reductionPercent / 100
remainingTonnes = annualTonnes × ((100 − reductionPercent) / 100)
baselineCarbonCost = annualTonnes × carbonPrice
futureCarbonCost = remainingTonnes × carbonPrice
avoidedCarbonCost = avoidedTonnes × carbonPrice
baselineProfit = revenue − operatingCost − baselineCarbonCost
futureProfit = revenue − operatingCost + annualSavings − futureCarbonCost
annualBenefit = annualSavings + avoidedCarbonCost
paybackYears = investment / annualBenefit, when annualBenefit > 0
yearOneNetBenefit = annualBenefit − investment
baselineMargin = 100 × baselineProfit / revenue, when revenue > 0
futureMargin = 100 × futureProfit / revenue, when revenue > 0
```

The API names `baselineProfit` and `futureProfit` refer only to the simplified **operating cash surplus before income tax** shown by these equations; the modeled carbon charge has already been subtracted. They are not accounting net income. The annual figures exclude upfront investment; `yearOneNetBenefit` subtracts it once to show incremental first-year cash flow. Revenues and other operating costs are assumed unchanged. Negative cash surpluses and negative margins are retained rather than clamped.

At the defaults, baseline carbon cost is USD 12,500/year, avoided emissions are 75 tonnes/year, and the future carbon cost is USD 8,750/year. The assumed USD 12,000 operating savings plus USD 3,750 avoided carbon charge produce USD 15,750/year in benefit. Simple payback is approximately 3.17 years; the first-year incremental cash flow after the USD 50,000 investment is minus USD 34,250. This follows from the chosen numbers and is not an expected return.

Simple payback assumes constant annual savings and carbon charges, ignores time value of money, and does not test whether benefits persist for the asset's lifetime. It is not NPV, IRR or a recommendation to invest. No depreciation, financing, taxation, grants, revenue changes, maintenance changes beyond the supplied savings, policy exemptions, coverage rules, or implementation risk are modeled. The calculator does not verify the reduction or savings inputs. Savings can exceed costs because the inputs are independent; users must check the consistency of their own scenario.

When annual benefit is zero, payback is `null` (no finite payback), even if the investment is also zero. A zero investment with positive benefit gives a zero-year payback. Both margins are `null` when revenue is zero. Derived ratios also return `null` if they overflow JavaScript's finite number range, or if a nonzero ratio is too small to represent. These states export as `Not defined`; a representable small positive payback is preserved in scientific notation rather than rounded to zero. Thus `null` means no finite representable ratio, not exclusively a zero-denominator case.

`dist/business.js` exports frozen `BUSINESS_DEFAULTS`, `calculateBusiness(input = {})`, and `businessToCSV(result)`. Validation follows the household module's strict numeric convention. Results include normalized `input` and all formula names above. Margins are percentages. The CSV includes inputs, units, limitations and calculated results, and recomputes from validated inputs before export.

Run `node --test test/business.test.mjs` for the business tests. These check the default arithmetic, cash-flow identities, no-benefit payback, zero investment and revenue, full/no abatement, negative margins, validation boundaries, input immutability, finite ratio handling, and CSV precision/undefined states. Run `node --test test/*.test.mjs` for both model suites.

## Numerical implementation and revision

Small avoided quantities are calculated directly from the reduction rate, rather than subtracting two nearly equal totals. This prevents a genuine small reduction or avoided charge from vanishing through cancellation. The zero- and full-reduction endpoints remain exact. IEEE-754 arithmetic still has finite precision: at very large baselines, the displayed or stored before/after totals can round to the same number even when the separately calculated delta is positive. Accounting identities should therefore be checked with a scale-aware tolerance, not exact equality. Values below the representable number range cannot be retained.

Both CSV exports include an **App version** metadata row from the shared version constant. This identifies the calculation implementation that produced the export; it does not imply a calibrated model or a new empirical dataset. Small nonzero cash flows and percentages are displayed with extra precision or scientific notation instead of being labeled zero. Ordinary on-screen figures remain rounded; the CSV preserves JavaScript's round-trip numeric representation.
