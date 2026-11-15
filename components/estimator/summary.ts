// Read-only summary of what the visitor chose, as plain translated strings.
// Shared by step 7, the success view, print and the mailto fallback.

import {visibleQuestions} from '@/lib/estimator/questions';
import type {EstimatorAnswers} from '@/lib/estimator/schema';
import type {ProjectType} from '@/lib/estimator/types';
import {GOAL_OPTIONS, SIZE_OPTIONS} from '@/lib/estimator/questions';
import {optionsFor, type StepNo} from './model';
import {local, type Tx} from './i18n';

export interface SummarySection {
  id: 'goals' | 'size' | 'types' | 'scope' | 'features' | 'design' | 'integrations';
  /** step the section's Edit button returns to */
  step: StepNo;
  items: string[];
}

export function buildSummary(answers: EstimatorAnswers, t: Tx): SummarySection[] {
  const types = answers.types as ProjectType[];
  const label = (qid: string, optId: string) => t(`q.${qid}.opt.${optId}`);
  const out: SummarySection[] = [];
  const goals = GOAL_OPTIONS.filter((g) => answers.goals?.includes(g.id)).map((g) => t(local(g.i18nKey)));
  if (goals.length > 0) out.push({id: 'goals', step: 1, items: goals});
  const size = SIZE_OPTIONS.find((o) => o.id === answers.size);
  if (size) out.push({id: 'size', step: 2, items: [t(local(size.i18nKey))]});
  out.push({id: 'types', step: 3, items: types.map((id) => label('types', id))});

  const scope: string[] = [];
  if (answers.pages) scope.push(label('pages', `n${answers.pages}`));
  if (answers.productBucket) scope.push(label('products', answers.productBucket));
  if (answers.rolesBucket) scope.push(label('roles', answers.rolesBucket));
  if (scope.length > 0) out.push({id: 'scope', step: 4, items: scope});

  const featureIds = new Set(answers.features ?? []);
  const features = visibleQuestions({types})
    .filter((q) => q.answerKey === 'features')
    .flatMap((q) => optionsFor(q, types).filter((o) => featureIds.has(o.id as never)).map((o) => t(local(o.labelKey))));
  if (features.length > 0) out.push({id: 'features', step: 4, items: features});

  const design = (['existing', 'brandIdentity', 'advancedMotion', 'premium'] as const)
    .filter((k) => answers.design?.[k])
    .map((k) => t(`q.design.${k}.label`));
  if (design.length > 0) out.push({id: 'design', step: 5, items: design});

  const integrations = (answers.integrations ?? []).map((id) => label('integrations', id));
  if (integrations.length > 0) out.push({id: 'integrations', step: 6, items: integrations});
  return out;
}
