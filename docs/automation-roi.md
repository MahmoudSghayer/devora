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

- Implementation = ₪1,100 + ₪650 × automated task types (`automationPct > 0`); running = ₪90 + ₪30 × tasks per month. Both are 0 when no task is automated.
- `paybackMonths = implementation ÷ (monthlyValue − running)`, on the direct basis and the capacity basis; `null` when the denominator ≤ 0.
- `roi12 = (12·value − 12·running − implementation) ÷ (implementation + 12·running)`; `null` when the denominator is not positive.

## Assumptions to show users

Direct reduction is only the share of freed time that becomes real savings (fewer hours paid, avoided hires); the rest is capacity that can be redirected to growth. `directShare` is adjustable. Automation percentages are typical, not measured.

## Changing numbers

Edit `ROI_CONFIG` / `ROI_TASKS` and bump `PRICING_CONFIG_VERSION`. i18n keys: `roi.task.<id>` and `roi.why.<id>`.

## Option buckets (guided flow)

`lib/roi/buckets.ts` maps option cards to representative numbers. The UI converts bucket to number and sends numbers; the schema and the math are unchanged. An "Enter exact numbers" toggle keeps the transparent math. i18n key per bucket: `roi.bucket.<group>.<id>`.

| Group | id: value |
| --- | --- |
| timesPerDay | 1-5: 3, 6-15: 10, 16-40: 25, 40+: 50 |
| minutes | lt2: 1.5, 2-5: 3.5, 5-15: 10, 15-30: 22, 30+: 40 |
| people | 1: 1, 2-3: 3, 4-6: 5, 7+: 8 |
| hourly (ILS/h) | lt40: 30, 40-60: 50, 60-90: 75, 90-150: 120, 150+: 180 |
| salary (gross ILS/month) | lt8k: 7000, 8-12k: 10000, 12-18k: 15000, 18-25k: 21000, 25k+: 30000 |

"I don't know" sends `labor: {mode: 'unknown'}` (config defaults apply).

Standardisation sets the default automation % per task via `defaultAutomationPct(taskId, level)`: `very` = catalog default + 10 (max 95), `mostly` = catalog default, `varies` = catalog default - 20 (min 10). Always user-adjustable.
