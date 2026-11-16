# Pricing engine (project estimator)

All numbers are **indicative, not a quotation**. Currency: ILS (₪). Config version `2026-11-v2` (affordable small-business pricing).

- Prices: `ESTIMATOR_CONFIG` in `lib/pricing/config.ts` (care-plan prices come from `TIERS`, never repeated).
- Engine: `estimateProject(answers, config = ESTIMATOR_CONFIG)` in `lib/estimator/engine.ts`. Pure, JSON-in/JSON-out.
- Input validation: `estimatorAnswersSchema` (strict zod; unknown keys, oversize strings/arrays and out-of-range numbers are rejected).
- Question flow: `lib/estimator/questions.ts` (`visibleQuestions(answers)`); i18n keys with English suggestions in `docs/transformation/estimator-i18n-keys.json` (a test keeps it in sync).

## Changing prices

Edit the amounts in `ESTIMATOR_CONFIG` (project bases, `features`, `integrations`, buckets, `design`, `range`, `timeline`), then bump `PRICING_CONFIG_VERSION`. No UI change is needed. Run `npm test`: the calibration tests will tell you if a typical site/store/app drifts out of its expected band.

## Price table (₪, one-time)

| Group | Items |
|---|---|
| Project base | landing 1,500 · business site (≤5 pages) 2,900 · e-commerce 5,500 · booking 4,500 · dashboard 7,000 · portal 8,000 · web app 12,000 · not sure 2,900 (discovery) |
| Extra types | 60% of the type's base (the priciest type is 100%) |
| Pages | +150 per page beyond 5 |
| Business features | blog 500 · lead capture 300 · online booking 1,200 · CRM 900 · admin dashboard 1,200 · advanced SEO 700 · multilingual 10% of core (min 600) · notifications 400 · payments 800 |
| E-commerce | products 1–20: 0, 21–100: 600, 101–500: 1,500, 501–1,000: 2,500, 1,000+: 3,500 · categories 250 · filtering 700 · accounts 700 · cart 400 · shipping 800 · inventory 1,000 · coupons 350 · order tracking 500 (payment gateway = payments 800, admin = admin dashboard 1,200) |
| Web app | roles 2–3: 1,200, 4+: 2,500 · auth 900 · subscriptions 1,800 · dashboards 1,500 · database screens 1,200 · API integrations 1,000 · real-time 1,800 · AI features 2,500 |
| Design | existing design ×0.85 of build · brand identity 1,200 · advanced 3D/animation 2,000 · premium ×1.10 |
| Integrations | WhatsApp 300 · email automation 600 · CRM 900 · AI chatbot 1,800 (+₪100/mo) · AI agents 3,500 (+₪150/mo) · payments 800 · third-party APIs 1,000 · analytics/reporting 400 · advanced SEO 700 · hosting 0 (+₪60/mo) |
| Care plans | ₪150 / ₪250 / ₪400 per month (`TIERS`, internal) |

## Order of operations

1. **Build**: the highest-priced selected type at 100%; every other type at `additionalTypeRate` (60%, shared foundation). `unsure` is ignored when real types are selected. Plus extra pages beyond the included 5 (business), product-count bucket (e-commerce), user-role bucket (web app / portal).
2. **Features** (step 3): fixed prices; features not relevant to a selected type are ignored, and so are features a selected type already includes (see Overlaps). Multilingual = max(₪600, 10% of build + other features).
3. **Design**: existing design takes 15% off the *build* only; premium visual adds 10% of (build + features + existing discount); brand identity and advanced 3D/animation are flat add-ons.
4. **Integrations** (step 5): fixed price + days, some with a monthly cost.

`subtotal` = sum of all line items (negative lines are discounts).

## Dedupe

`crm`, `multilingual`, `advancedSeo`, `payments` can be chosen in step 3 and in step 5. They are priced once, with the line id `feature.<id>` (group `features` if chosen in step 3, otherwise `integrations`).

## Overlaps (never double-charged)

Config: `typeIncludes` and `integrationCovers`. The engine drops a redundant feature from pricing (even if the answers contain it), and `visibleQuestions` hides the redundant option and any question left with no options, so the UI never offers a double charge. Pass `integrations` to `visibleQuestions` to hide options an integration covers (the engine dedupes either way).

| Selected | Already includes | Dropped feature |
|---|---|---|
| `booking` type | the booking system itself | `booking` (Online booking) |
| `dashboard` type | the dashboard's admin area | `adminDashboard` |
| `emailAutomation` integration | customer notification emails | `notifications` |

Reviewed and intentionally priced separately: `apiIntegrations` (the app's own integration layer) vs `thirdPartyApi` (one specific external connection); `cart`/`payments` on a store (payments is the shared 800 item, priced once); `auth` on a portal (login is an add-on to the portal base).

## Range, timeline, maintenance

- `low` = subtotal × 0.9 rounded **down** to ₪100; `high` = subtotal × 1.15 rounded **up** to ₪100, so `low ≤ subtotal ≤ high`.
- Timeline: Σdays ÷ 5 → `weeksLow = ceil(× 0.6)`, `weeksHigh = ceil(× 0.9 + 1 buffer week)`; integers ≥ 1.
- Maintenance is shown separately from the one-time total: plan = Launch below `TIERS.studio.from` (₪4,500), Studio below `TIERS.growth.from` (₪12,000), else Growth, so sites map to ₪150, stores/booking to ₪250, apps to ₪400. `maintenanceMonthly` = plan price + recurring integration costs (hosting, AI). The care-plan range quoted in copy is `MONTHLY_MIN`–`MONTHLY_MAX` (₪150–₪400) via `pricingParams`.
- `needsDiscovery` is true when the visitor chose "unsure".

## Calibration (asserted in tests)

- Landing alone: ₪1,400–1,800 (₪1,500).
- 5-page business site + WhatsApp + hosting: ₪2,600–3,400 (₪3,200).
- Small store (≤100 products, payments, shipping): ₪6,500–8,500 (₪7,700).
- Web app with auth + dashboards: ≥ ₪12,000 (₪14,400); complex app low ≥ Growth.from.

## Guided flow: goals and size (added)

The estimator is a sequence of option cards (no free typing). Steps: 1 goals, 2 size, 3 project type, 4 scope, 5 features, 6 design, 7 integrations. The old free-text `problem` question was removed from the flow (free text travels in contact notes); the schema field remains optional for compatibility.

- `goals?: Goal[]` (ids `leads, sell, bookings, brand, content, portal, other`, multi-select). Not priced; `GOAL_TYPE_SUGGESTIONS` tells the UI which types to pre-select (leads: business/landing, sell: ecommerce, bookings: booking, brand: business, content: business, portal: portal, other: unsure).
- `size?: 'small'|'medium'|'large'|'xlarge'|'unsure'`. When `pages` is absent, `ESTIMATOR_CONFIG.sizePages` gives the representative page count: small 5, medium 10, large 28, xlarge 50, unsure 8. Pages beyond the included 5 are priced as before; an explicit `pages` wins.
- Cards come from config: `GOAL_OPTIONS`, `SIZE_OPTIONS` (i18n `estimator.goal.<id>`, `estimator.size.<id>`), exported from `lib/pricing/config` and re-exported by `lib/estimator/questions`.
- Care plans: `TIERS` remains the source of maintenance-plan amounts; it is no longer presented as packages.
