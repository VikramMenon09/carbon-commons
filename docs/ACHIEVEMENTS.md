# GitHub achievement roadmap

Researched **22 November 2026**. Carbon Commons connects economics, the environment, and business through carbon pricing, household distribution, business carbon costs, emissions investment payback, and operating profit. This roadmap covers the known achievement catalog, including badges that a new public project cannot earn. It does not claim that any badge has been awarded to the repository owner.

GitHub deliberately leaves many achievement rules undisclosed. Its [launch announcement](https://github.blog/news-insights/product-news/introducing-achievements-recognizing-the-many-stages-of-a-developers-coding-journey/) says users can infer criteria from achievement histories. The counts below are **community observations, not a guaranteed or complete GitHub specification**. GitHub decides eligibility and awards; creating this project alone does not unlock the collection.

## Seven general routes

The following triggers and tier counts are reported by the long-running [GitHub Profile Achievements catalog](https://github.com/Schweinepriester/github-profile-achievements). Base, bronze, silver, and gold refer to successive levels of one badge, not four separate badges.

| Achievement | Reported trigger | Reported base / bronze / silver / gold | Carbon Commons route |
| --- | --- | --- | --- |
| Pull Shark | Authored pull requests get merged | 2 / 16 / 128 / 1,024 | Ship meaningful improvements through PRs, with clear acceptance checks. |
| Quickdraw | Close an issue or PR within five minutes of opening | Single level | Resolve a real small issue promptly when the circumstances naturally fit. |
| YOLO | Merge your own PR without a code review | Single level | A tested, low-impact change in your own repository may qualify. Respect any review requirements. |
| Pair Extraordinaire | Co-authored work in merged PRs | 1 / 10 / 24 / 48 | Accurately credit actual contributions to a model, dataset, or accessibility improvement. AI attribution is legitimate; its badge eligibility is not promised. |
| Galaxy Brain | Answers accepted in Discussions | 2 / 8 / 16 / 32 | Help users understand model assumptions and resolve actual project questions. |
| Starstruck | A repository you created attracts stars | 16 / 128 / 512 / 4,096 | Build a useful tool and publish reproducible examples people choose to star. |
| Public Sponsor | Sponsor open-source work | Single level | If desired, personally choose a relevant maintainer and pay through GitHub Sponsors. |

The project cannot supply other people's stars or helpful-answer decisions. Co-author credit must reflect actual work. Sponsorship is a separate paid action: there is no automatic payment, predetermined recipient, or promised minimum price in this project. GitHub documents [sponsorship payments](https://docs.github.com/en/sponsors/sponsoring-open-source-contributors) and [sponsorship visibility](https://docs.github.com/en/sponsors/sponsoring-open-source-contributors/managing-your-sponsorship); select public visibility when seeking public recognition.

## Achievements outside this project's reach

| Achievement | Classification | What that means |
| --- | --- | --- |
| Arctic Code Vault Contributor | Historical | Based on the archive snapshot captured on 2 February 2020. A new repository cannot enter that past snapshot. |
| Mars 2020 Contributor | Historical | Recognized contributions to the particular software versions used by Ingenuity. New unrelated work does not qualify. |
| Heart On Your Sleeve | Disabled experimental badge | Do not treat reactions as an available route. |
| Open Sourcerer | Disabled experimental badge | Do not treat contributions to several repositories as an available route. |
| Proxima Pioneer | Reported internal badge | No normal external contribution route is documented. |
| Proxima Staffshipper | Reported internal badge | No normal external contribution route is documented. |
| Proxima Staffuser | Reported internal badge | No normal external contribution route is documented. |
| Finishing Touch | Special eligibility; external access unconfirmed | Associated with improving GitHub's own UI. A Carbon Commons UI change is not evidence of qualification. |

The historical classifications follow the [GitHub Archive Program](https://archiveprogram.github.com/arctic-vault/) and GitHub's [Mars announcement](https://github.blog/news-insights/company-news/open-source-goes-to-mars/). In the [27 March 2026 incident thread](https://github.com/orgs/community/discussions/190842), GitHub staff explicitly explained that Heart On Your Sleeve and Open Sourcerer had been experimental, were re-enabled by mistake, and were removed again. That establishes their disabled status; it does not establish that they can never return.

The community catalog labels the three Proxima badges internal and lists Finishing Touch with reported levels of 1 / 4 / 16 / 32 GitHub UI quality PRs. [A current eligibility discussion](https://github.com/orgs/community/discussions/212486) is unanswered and does not establish an external route. [Dylan Smith's public profile](https://github.com/dylanatsmith) identifies him as GitHub staff; the linked achievement detail could not be independently opened during this review. Treat Finishing Touch's public availability as unresolved, even though the catalog lists it as earnable.

## Build the record through useful work

1. **Ship and explain the model.** Keep emissions units explicit, make baseline assumptions visible, test zero-price and zero-emissions cases, and publish reproducible examples. Include business edge cases such as an investment with no annual savings or negative operating profit. Use a focused PR with an independently checkable result.
2. **Make comparisons reliable.** Add a meaningful sensitivity comparison for carbon prices, emissions factors, investment costs, or household rebates. Document which assumptions drive each result. Keep one coherent problem per PR; do not split trivial changes to inflate a count.
3. **Invite collaboration.** Publish contribution instructions and bounded tasks such as sourcing an emissions factor, checking a small-business case study, reviewing incidence assumptions, or making a visualization keyboard accessible. Complete a real task together before adding co-author credit.
4. **Support users.** Enable repository Discussions with a Q&A category. Answer actual questions about household distribution, business payback, or model limits with formulas, sources, and reproducible scenarios. Let another person judge whether the reply answers their question.
5. **Grow usefulness.** Add a classroom exercise, a transparent small-business worked example, or a reusable dataset that gives people a reason to use and recommend the repository. Clearly identify hypothetical business inputs; do not present a toy case as a measured forecast. Stars remain voluntary.
6. **Consider sponsorship separately.** If you want to support a maintainer, choose a recipient and budget yourself. Sponsoring this project's owner is not a shortcut to the owner's Public Sponsor badge.

For co-authorship, follow GitHub's [multiple-author commit documentation](https://docs.github.com/en/pull-requests/how-tos/commit-changes/creating-a-commit-with-multiple-authors): obtain a human contributor's preferred account-associated email, use a GitHub no-reply email when appropriate, and preserve the `Co-authored-by` trailer in the merged commit. AI assistance can also be accurately attributed: GitHub's [agent documentation](https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents) explicitly describes Copilot-authored commits with a human co-author.

For actual Codex-assisted work, OpenAI's own [Codex source](https://github.com/openai/codex/blob/main/codex-rs/git-utils/src/baseline.rs) uses `Co-authored-by: Codex <noreply@openai.com>`. GitHub's author data for [this OpenAI commit](https://github.com/openai/swarm/commit/6af0b4caf37dca4526dfd98e9fbd8ce36e7eeb22) resolves that email to the `codex` account. This supports truthful attribution, **not a guarantee of Pair Extraordinaire eligibility**. Preserve the owner's author identity, credit only contributors that actually helped, and inspect GitHub's awarded achievement after the merge. Do not invent collaborators, create fake identities, or label an assistant as a human.

GitHub's [6 February 2024 announcement](https://github.com/orgs/community/discussions/106536) disabled achievement earning **inside GitHub's own Community Discussions forum** because of spam. It explicitly leaves other projects and communities unaffected. Do not use that central forum as a Galaxy Brain route or create artificial Q&A exchanges here.

## Verify progress

- Record the actual merged PR, accepted answer, or other qualifying activity URL.
- Check the account's GitHub achievement details for an awarded badge or changed tier. Local checkboxes and activity counts are planning aids, not proof of an award.
- Confirm that achievements are enabled in profile settings if you want them displayed. The GitHub launch announcement documents that displaying them is optional.
- Do not assume an award is immediate. If it is missing, inspect attribution, merge state, and GitHub's current guidance before repeating activity.
- Re-check these sources when GitHub changes achievements; the catalog is an as-of-date research snapshot.

GitHub Pro, Campus Expert, organization verification, contribution graphs, and program highlights are different concepts. They are not extra badges this project can promise to unlock.
