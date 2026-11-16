import {DISCUSS_BUDGET_BOUNDS} from '@/lib/discuss/config';
import {formatMoney} from '@/lib/pricing/config';
import {QUESTIONS, toSchemaAnswers, type Answers, type QuestionId, type StepNo} from './model';
import type {Tx} from './i18n';

/** LRI…PDI isolate so a price keeps its digits/symbol order inside Arabic text. */
const iso = (s: string) => `⁦${s}⁩`;

/** Budget band thresholds (ILS) used in the card labels; formatted per locale. */
export function budgetParams(locale: string): Record<string, string> {
  return {
    b1: iso(formatMoney(DISCUSS_BUDGET_BOUNDS[0], locale)),
    b2: iso(formatMoney(DISCUSS_BUDGET_BOUNDS[1], locale)),
    b3: iso(formatMoney(DISCUSS_BUDGET_BOUNDS[2], locale)),
  };
}

export function optionLabel(t: Tx, locale: string, q: QuestionId, id: string): string {
  return q === 'budget' ? t(`budget.${id}`, budgetParams(locale)) : t(`${q}.${id}`);
}

export interface SummarySection {
  id: QuestionId;
  step: StepNo;
  items: string[];
}

/** Read-only recap of the choices; unanswered optional questions are shown as skipped. */
export function buildSummary(answers: Answers, t: Tx, locale: string): SummarySection[] {
  const schema = toSchemaAnswers(answers) as unknown as Record<string, string | string[] | undefined>;
  return QUESTIONS.map((q, i) => {
    const v = schema[q.id];
    const ids = Array.isArray(v) ? v : v ? [v] : [];
    return {
      id: q.id,
      step: (i + 1) as StepNo,
      items: ids.length > 0 ? ids.map((id) => optionLabel(t, locale, q.id, id)) : [t('sum.skipped')],
    };
  });
}
