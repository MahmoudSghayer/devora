import {formatMoney} from '@/lib/pricing/config';
import {QUESTIONS, toSchemaAnswers, type Answers, type QuestionId, type StepNo} from './model';
import type {Tx} from './i18n';

/** LRI…PDI isolate so a price keeps its digits/symbol order inside Arabic text. */
const iso = (s: string) => `⁦${s}⁩`;

/** Budget band thresholds (ILS) used in the card labels; formatted per locale. */
export function budgetParams(locale: string): Record<string, string> {
  return {
    b15: iso(formatMoney(15000, locale)),
    b30: iso(formatMoney(30000, locale)),
    b60: iso(formatMoney(60000, locale)),
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
