# Software discovery flow

Option-card questionnaire (`lib/discuss`) that turns answers into an indicative "typical starting range" for custom software. Not a quotation.

Answers (`discussAnswersSchema`, strict): `purpose[]`, `users`, `today`, `integrations`, `mustHaves[]`, `timeline`, `budget`. Free text is not an answer; it travels in `contact.notes`.

`estimateDiscuss(answers)` maps to `EstimatorAnswers` and runs `estimateProject`:
- Type: any of replace-spreadsheets / run-operations / ai-tool / connect-tools / other gives `webapp`; otherwise customer-portal gives `portal`, internal-dashboard gives `dashboard` (both when both).
- Roles: me one; team-2-10 and customers few; team-10-50 and team-and-customers many.
- Features: purposes add database / admin dashboard / auth / dashboards / AI / API integrations; must-haves add auth, payments, dashboards, AI, multilingual. Notifications use email automation; mobile is unpriced (assumption note).
- Integrations: one-two and unsure add a third-party API; many also adds API integrations.

Result: `{estimate, startingLow, startingHigh (subtotal x 0.9 / 1.2, rounded to 500), budgetFit, weeks, maintenanceMonthly, assumptions, configVersion}`. `budgetFit`: `below` if the budget band's max is under the range, `above` if its min is over it, `within` otherwise, `unknown` when unset or "unsure". Budget bands live in `lib/discuss/config.ts`. i18n: `docs/transformation/discuss-i18n-keys.json` (namespace `discuss`).
