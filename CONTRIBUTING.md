# Contributing to Carbon Commons

Useful contributions make a business or policy scenario easier to understand, reproduce, or question. Start with an issue describing the concrete problem and acceptance checks, then submit one coherent pull request.

## Local workflow

1. Fork the repository if you do not have write access, and clone your fork.
2. Create a branch with a descriptive name such as `feature/discounted-cash-flow`.
3. Run `npm start` with Node.js 22 or newer. No packages or credentials are required.
4. Make the change, keeping calculation logic separate from the interface.
5. Run `npm test` and `npm run check`. Add tests for new calculations and meaningful failure cases.
6. Test changed interactions by keyboard and on a narrow screen. Include the example inputs and expected outputs in your PR.

## Good contributions

- A sourced small-business case study with transparent cost and emissions assumptions.
- Discounted cash-flow analysis with asset-life and discount-rate inputs, plus explicit distinctions from simple payback.
- A versioned emissions-factor dataset with geographic coverage, units, update dates, and compatible licensing.
- A sensitivity comparison that explains which assumptions drive a result.
- An accessibility improvement supported by a reproducible user journey.
- A thoughtful answer to an actual question in repository Discussions.

## Research and modeling standards

Label hypothetical values as hypothetical. Distinguish direct accounting effects from behavioral estimates and wider welfare effects. Cite primary data sources and document geographic/time coverage and units. Do not silently substitute a different country's emissions factor or present an uncalibrated response rate as observed data. Preserve reproducibility in exported files.

For new calculations, document the equation and at least one independently worked example. Cover zero values, missing/invalid inputs, numerical limits, and relevant budget or cash-flow identities. Avoid tests that simply repeat the implementation.

## Attribution and review

Credit actual contributors with their consent and preferred account-linked attribution. GitHub supports `Co-authored-by: Name <email>` trailers. Accurately identify AI assistance; never invent a second person or claim someone participated when they did not. Automated checks supplement substantive review.

Do not post sensitive company data, credentials, private customer information, or unlicensed datasets. Report a security vulnerability privately through the repository's security advisory channel if available; otherwise describe it without exploit details in an issue and request a private contact.

## GitHub achievements

The maintainer's achievement work is recorded through actual repository activity. The [achievement roadmap](docs/ACHIEVEMENTS.md) explains current known routes and limits. Useful work comes first: no star exchanges, invented authors, artificial questions, or trivial PR inflation.
