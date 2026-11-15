// Read-only summary of what the visitor chose, as plain translated strings.
// Shared by step 7, the success view, print and the mailto fallback.

import {visibleQuestions} from '@/lib/estimator/questions';
import type {EstimatorAnswers} from '@/lib/estimator/schema';
import type {ProjectType} from '@/lib/estimator/types';
import {optionsFor, type BusinessContext} from './model';
import {local, type Tx} from './i18n';
import {cleanContext} from './notes';

export interface SummarySection {
  id: 'types' | 'business' | 'scope' | 'features' | 'design' | 'integrations';
  items: string[];
}

export function buildSummary(answers: EstimatorAnswers, context: BusinessContext, t: Tx): SummarySection[] {
  const types = answers.types as ProjectType[];
  const label = (qid: string, optId: string) => t(`q.${qid}.opt.${optId}`);
  const out: SummarySection[] = [{id: 'types', items: types.map((id) => label('types', id))}];

  const c = cleanContext(context);
  const business = [
    c.industry && `${t('biz.industry.label')}: ${t(`biz.industry.opt.${c.industry}`)}`,
    c.size && `${t('biz.size.label')}: ${t(`biz.size.opt.${c.size}`)}`,
    c.goal && `${t('biz.goal.label')}: ${t(`biz.goal.opt.${c.goal}`)}`,
  ].filter((x): x is string => Boolean(x));
  if (business.length > 0) out.push({id: 'business', items: business});

  const scope: string[] = [];
  if (answers.pages) scope.push(label('pages', `n${answers.pages}`));
  if (answers.productBucket) scope.push(label('products', answers.productBucket));
  if (answers.rolesBucket) scope.push(label('roles', answers.rolesBucket));
  if (answers.problem) scope.push(answers.problem);
  if (scope.length > 0) out.push({id: 'scope', items: scope});

  const featureIds = new Set(answers.features ?? []);
  const features = visibleQuestions({types})
    .filter((q) => q.answerKey === 'features')
    .flatMap((q) => optionsFor(q, types).filter((o) => featureIds.has(o.id as never)).map((o) => t(local(o.labelKey))));
  if (features.length > 0) out.push({id: 'features', items: features});

  const design = (['existing', 'brandIdentity', 'advancedMotion', 'premium'] as const)
    .filter((k) => answers.design?.[k])
    .map((k) => t(`q.design.${k}.label`));
  if (design.length > 0) out.push({id: 'design', items: design});

  const integrations = (answers.integrations ?? []).map((id) => label('integrations', id));
  if (integrations.length > 0) out.push({id: 'integrations', items: integrations});
  return out;
}
