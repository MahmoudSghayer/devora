import {useMemo, useState} from 'react';
import {computeRoi} from '@/lib/roi/engine';
import {ROI_CONFIG, ROI_TASKS} from '@/lib/pricing/config';

/** The real catalogue row for WhatsApp replies; id and default % come from config. */
const WHATSAPP = ROI_TASKS.find((t) => t.id === 'whatsappReplies');
if (!WHATSAPP) throw new Error('ROI_TASKS is missing whatsappReplies');

export const WORKDAY_HOURS = 8;
export const DEFAULTS = {
  hours: 3,
  people: 1,
  hourlyCost: ROI_CONFIG.defaultHourlyCost,
  automationPct: WHATSAPP.defaultAutomationPct,
} as const;

export function useSimulator() {
  const [hours, setHours] = useState<number>(DEFAULTS.hours);
  const [people, setPeople] = useState<number>(DEFAULTS.people);
  const [hourlyCost, setHourlyCost] = useState<number>(DEFAULTS.hourlyCost);
  const [automationPct, setAutomationPct] = useState<number>(DEFAULTS.automationPct);

  // One task row: `hours` of chat per person per day (60-minute units).
  const result = useMemo(
    () =>
      computeRoi({
        tasks: [{taskId: WHATSAPP.id, timesPerDay: hours, minutesEach: 60, employees: people, automationPct}],
        labor: {mode: 'hourly', hourlyCost},
      }),
    [hours, people, hourlyCost, automationPct],
  );

  return {
    hours,
    people,
    hourlyCost,
    automationPct,
    setHours,
    setPeople,
    setHourlyCost,
    setAutomationPct,
    result,
    /** per-person hours/day returned to the person */
    reclaimedPerDay: result.savedHoursPerDay / people,
  };
}
