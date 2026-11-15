# Automation ROI calculator

Indicative estimate, not a guarantee. Currency: ILS (₪).

- Constants: `ROI_CONFIG` and the task catalog `ROI_TASKS` in `lib/pricing/config.ts`.
- Engine: `computeRoi(answers, config = ROI_CONFIG)` in `lib/roi/engine.ts`. Pure, JSON-in/JSON-out.
- Validation: `roiAnswersSchema` (strict; `automationPct` is a **percent 0–100**; duplicate task ids rejected).

## Formulas

```
hoursPerDay_t   = timesPerDay_t × minutesEach_t × employees_t ÷ 60   (times/day is per employee)
monthlyHours_t  = hoursPerDay_t × workingDays            (default 22)
savedHours_t    = monthlyHours_t × automationPct_t ÷ 100
capacityValue   = Σ savedHours × hourlyCost               (per month)
directReduction = capacityValue × directShare             (default 0.20)
productivity    = capacityValue − directReduction
fteEquivalent   = Σ savedHours ÷ 182
annualValue     = capacityValue × 12;  annualDirect = directReduction × 12
```

Labor cost: hourly fully-loaded (default ₪60) **or** monthly gross salary × employer-cost multiplier (default 1.25) ÷ 182 h/month. "I don't know" uses the defaults.

Worked example: 3 employees × (4 × 30 min = 2 h/day) → 6 h/day, 132 h/month, 70% → 92.4 h saved, ₪5,544/month, ₪66,528/year.

## Cost, payback, ROI

- Implementation = ₪4,000 + ₪2,500 × automated task types (`automationPct > 0`); running = ₪400 + ₪100 × tasks per month. Both are 0 when no task is automated.
- `paybackMonths = implementation ÷ (monthlyValue − running)`, on the direct basis and the capacity basis; `null` when the denominator ≤ 0.
- `roi12 = (12·value − 12·running − implementation) ÷ (implementation + 12·running)`; `null` when the denominator is 0.

## Assumptions to show users

Direct reduction is only the share of freed time that becomes real savings (fewer hours paid, avoided hires); the rest is capacity that can be redirected to growth. `directShare` is adjustable. Automation percentages are typical, not measured.

## Changing numbers

Edit `ROI_CONFIG` / `ROI_TASKS` and bump `PRICING_CONFIG_VERSION`. i18n keys: `roi.task.<id>` and `roi.why.<id>`.
