// Pure automation-ROI engine. No I/O, no framework, JSON-in / JSON-out.
// Indicative estimates, not a guarantee. See docs/automation-roi.md.

import {ROI_CONFIG, ROI_TASKS} from '@/lib/pricing/config';
import type {RoiAnswers} from './schema';
import type {RoiAssumptions, RoiConfig, RoiResult, RoiTaskRow} from './types';

/** Working hours per month of one full-time employee (used for FTE + salary → hourly). */
export const HOURS_PER_MONTH_FTE = ROI_CONFIG.hoursPerMonthFte;

const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
const labelOf = new Map(ROI_TASKS.map((t) => [t.id, t.label]));

/** months to recover `cost` from `net` monthly benefit; null when it never pays back. */
function payback(cost: number, net: number): number | null {
  return net > 0 ? cost / net : null;
}

/** 12-month ROI = (12·value − 12·running − cost) ÷ (cost + 12·running); null if denominator ≤ 0. */
function roi12(cost: number, running: number, monthlyValue: number): number | null {
  const denom = cost + 12 * running;
  return denom > 0 ? (12 * monthlyValue - 12 * running - cost) / denom : null;
}

/**
 * Compute the ROI of automating repetitive work.
 *
 *   hoursPerDay_t   = timesPerDay_t × minutesEach_t × employees_t ÷ 60   (times/day is per employee)
 *   monthlyHours_t  = hoursPerDay_t × workingDays
 *   savedHours_t    = monthlyHours_t × automationPct_t ÷ 100
 *   capacityValue   = Σ savedHours × hourlyCost
 *   direct          = capacityValue × directShare;  productivity = capacityValue − direct
 *   fteEquivalent   = Σ savedHours ÷ 182
 *   hourlyCost      = hourly mode: as given; salary mode: gross × employerMultiplier ÷ 182
 */
export function computeRoi(answers: RoiAnswers, config: RoiConfig = ROI_CONFIG): RoiResult {
  const c = config;
  const labor = answers.labor ?? {mode: 'unknown' as const};
  const workingDays = answers.workingDays ?? c.defaultWorkingDays;
  const directShare = answers.directShare ?? c.defaultDirectShare;

  let hourlyCost = c.defaultHourlyCost;
  let employerCostMultiplier: number | null = null;
  if (labor.mode === 'hourly') {
    hourlyCost = labor.hourlyCost;
  } else if (labor.mode === 'salary') {
    employerCostMultiplier = labor.employerCostMultiplier ?? c.defaultEmployerCostMultiplier;
    hourlyCost = (labor.monthlyGross * employerCostMultiplier) / c.hoursPerMonthFte;
  }

  const rows: RoiTaskRow[] = answers.tasks.map((t) => {
    const hoursPerDay = (t.timesPerDay * t.minutesEach * t.employees) / 60;
    const monthlyHours = hoursPerDay * workingDays;
    const savedHours = (monthlyHours * t.automationPct) / 100;
    return {
      taskId: t.taskId,
      label: labelOf.get(t.taskId) ?? t.taskId,
      hoursPerDay,
      monthlyHours,
      savedHours,
      monthlyValue: savedHours * hourlyCost,
    };
  });

  // A task only counts as 'automated' (and only adds cost) if it actually frees hours.
  const automatedTasks = rows.filter((r) => r.savedHours > 0).length;
  const savedHoursMonthly = sum(rows.map((r) => r.savedHours));
  const capacityValueMonthly = savedHoursMonthly * hourlyCost;
  const directReductionMonthly = capacityValueMonthly * directShare;

  const implementationCost =
    automatedTasks > 0 ? c.implementation.base + c.implementation.perTask * automatedTasks : 0;
  const runningMonthly = automatedTasks > 0 ? c.running.base + c.running.perTask * automatedTasks : 0;

  const assumptions: RoiAssumptions = {
    laborMode: labor.mode,
    hourlyCost,
    workingDays,
    directShare,
    employerCostMultiplier,
    hoursPerMonthFte: c.hoursPerMonthFte,
    implementationBase: c.implementation.base,
    implementationPerTask: c.implementation.perTask,
    runningBase: c.running.base,
    runningPerTask: c.running.perTask,
  };

  return {
    rows,
    automatedTasks,
    hoursPerDay: sum(rows.map((r) => r.hoursPerDay)),
    monthlyHours: sum(rows.map((r) => r.monthlyHours)),
    savedHoursMonthly,
    savedHoursAnnual: savedHoursMonthly * 12,
    savedHoursPerDay: workingDays > 0 ? savedHoursMonthly / workingDays : 0,
    capacityValueMonthly,
    directReductionMonthly,
    productivityValueMonthly: capacityValueMonthly - directReductionMonthly,
    fteEquivalent: savedHoursMonthly / c.hoursPerMonthFte,
    annualValue: capacityValueMonthly * 12,
    annualDirect: directReductionMonthly * 12,
    implementationCost,
    runningMonthly,
    paybackMonthsDirect: payback(implementationCost, directReductionMonthly - runningMonthly),
    paybackMonthsCapacity: payback(implementationCost, capacityValueMonthly - runningMonthly),
    roi12Direct: roi12(implementationCost, runningMonthly, directReductionMonthly),
    roi12Capacity: roi12(implementationCost, runningMonthly, capacityValueMonthly),
    assumptions,
    currency: c.currency,
    configVersion: c.configVersion,
  };
}
