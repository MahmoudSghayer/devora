# Pricing engine (project estimator)

All numbers are **indicative, not a quotation**. Currency: ILS (₪).

- Prices: `ESTIMATOR_CONFIG` in `lib/pricing/config.ts` (care-plan prices come from `TIERS`, never repeated).
- Engine: `estimateProject(answers, config = ESTIMATOR_CONFIG)` in `lib/estimator/engine.ts`. Pure, JSON-in/JSON-out.
- Input validation: `estimatorAnswersSchema` (strict zod; unknown keys, oversize strings/arrays and out-of-range numbers are rejected).
- Question flow: `lib/estimator/questions.ts` (`visibleQuestions(answers)`); i18n keys with English suggestions in `docs/transformation/estimator-i18n-keys.json` (a test keeps it in sync).

## Changing prices

Edit the amounts in `ESTIMATOR_CONFIG` (project bases, `features`, `integrations`, buckets, `design`, `range`, `timeline`), then bump `PRICING_CONFIG_VERSION`. No UI change is needed. Run `npm test`: the calibration tests will tell you if a typical site/store/app drifts out of its expected tier band.

## Order of operations

1. **Build**: the highest-priced selected type at 100%; every other type at `additionalTypeRate` (70%, shared foundation). `unsure` is ignored when real types are selected. Plus extra pages beyond the included 5 (business), product-count bucket (e-commerce), user-role bucket (web app / portal).
2. **Features** (step 3): fixed prices; features not relevant to a selected type are ignored. Multilingual = max(₪1,500, 15% of build + other features).
3. **Design**: existing design takes 15% off the *build* only; premium visual adds 15% of (build + features + existing discount); brand identity and advanced 3D/animation are flat add-ons.
4. **Integrations** (step 5): fixed price + days, some with a monthly cost.

`subtotal` = sum of all line items (negative lines are discounts).

## Dedupe

`crm`, `multilingual`, `advancedSeo`, `payments` can be chosen in step 3 and in step 5. They are priced once, with the line id `feature.<id>` (group `features` if chosen in step 3, otherwise `integrations`).

## Range, timeline, maintenance

- `low` = subtotal × 0.9 rounded **down** to ₪500; `high` = subtotal × 1.2 rounded **up** to ₪500, so `low ≤ subtotal ≤ high`.
- Timeline: Σdays ÷ 5 → `weeksLow = ceil(× 0.6)`, `weeksHigh = ceil(× 0.9 + 1 buffer week)`; integers ≥ 1.
- Maintenance is shown separately from the one-time total: plan = Launch below `TIERS.studio.from`, Studio below `TIERS.growth.from`, else Growth. `maintenanceMonthly` = plan price + recurring integration costs (hosting, AI).
- `needsDiscovery` is true when the visitor chose "unsure".

## Calibration (asserted in tests)

- 5-page business site + WhatsApp + hosting: low between ₪5,000 and Studio.from.
- ~50-product store with cart, payments, shipping, admin: low between Studio.from and Growth.from.
- Complex web app (roles, auth, subscriptions, payments, dashboards, API, real-time): low ≥ Growth.from.
