// Schema-driven question flow for the estimator UI. Irrelevant questions never
// appear: use visibleQuestions(answers). All prices are referenced (priceRef),
// never repeated — they live in ESTIMATOR_CONFIG.

import {ESTIMATOR_CONFIG, GOAL_OPTIONS, GOAL_TYPE_SUGGESTIONS, SIZE_OPTIONS} from '@/lib/pricing/config';
import {
  FEATURE_IDS,
  GOAL_IDS,
  INTEGRATION_IDS,
  PRODUCT_BUCKETS,
  PROJECT_TYPES,
  ROLE_BUCKETS,
  SIZE_IDS,
  type FeatureDef,
  type ProjectType,
} from './types';

export {GOAL_OPTIONS, GOAL_TYPE_SUGGESTIONS, SIZE_OPTIONS};

/** Every question is option-based (cards); there is no free-text question. */
export type QuestionKind = 'single' | 'multi' | 'toggle' | 'bucket';
/** 1 goals · 2 size · 3 project type · 4 scope · 5 features · 6 design · 7 integrations */
export type QuestionStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface QuestionOption {
  id: string;
  /** i18n key `estimator.q.<questionId>.opt.<optionId>` */
  labelKey: string;
  /** numeric value for numeric buckets (e.g. pages) */
  value?: number;
  /** path into ESTIMATOR_CONFIG, e.g. `features.cart` */
  priceRef?: string;
}

export interface Question {
  id: string;
  step: QuestionStep;
  kind: QuestionKind;
  /** project types it is relevant to; 'all' = always */
  appliesTo: readonly ProjectType[] | 'all';
  /** dotted path into EstimatorAnswers, e.g. `productBucket`, `design.premium` */
  answerKey: string;
  labelKey: string;
  hintKey?: string;
  options?: QuestionOption[];
  /** path into ESTIMATOR_CONFIG for single-price questions (toggles) */
  priceRef?: string;
}

const q = (id: string) => ({labelKey: `estimator.q.${id}.label`, hintKey: `estimator.q.${id}.hint`});
const opt = (qid: string, id: string, extra: Partial<QuestionOption> = {}): QuestionOption => ({
  id,
  labelKey: `estimator.q.${qid}.opt.${id}`,
  ...extra,
});

const featureQuestion = (home: FeatureDef['home']): Question => {
  const defs = FEATURE_IDS.map((id) => ESTIMATOR_CONFIG.features[id]).filter((f) => f.home === home);
  const appliesTo = PROJECT_TYPES.filter((t) => defs.some((f) => f.appliesTo.includes(t)));
  const id = `features.${home}`;
  return {
    id,
    step: 5,
    kind: 'multi',
    appliesTo,
    answerKey: 'features',
    ...q(id),
    options: defs.map((f) => opt(id, f.id, {priceRef: `features.${f.id}`})),
  };
};

const designToggle = (key: 'existing' | 'brandIdentity' | 'advancedMotion' | 'premium'): Question => ({
  id: `design.${key}`,
  step: 6,
  kind: 'toggle',
  appliesTo: 'all',
  answerKey: `design.${key}`,
  ...q(`design.${key}`),
  priceRef: key === 'existing' ? 'design.existingFactor' : key === 'premium' ? 'design.premiumFactor' : `design.${key}`,
});

export const QUESTIONS: readonly Question[] = [
  {
    id: 'goals',
    step: 1,
    kind: 'multi',
    appliesTo: 'all',
    answerKey: 'goals',
    ...q('goals'),
    options: GOAL_OPTIONS.map((g) => ({id: g.id, labelKey: g.i18nKey})),
  },
  {
    id: 'size',
    step: 2,
    kind: 'single',
    appliesTo: 'all',
    answerKey: 'size',
    ...q('size'),
    options: SIZE_OPTIONS.map((o) => ({id: o.id, labelKey: o.i18nKey, value: o.pages})),
  },
  {
    id: 'types',
    step: 3,
    kind: 'multi',
    appliesTo: 'all',
    answerKey: 'types',
    ...q('types'),
    options: PROJECT_TYPES.map((t) => opt('types', t, {priceRef: `projectBase.${t}`})),
  },
  {
    id: 'pages',
    step: 4,
    kind: 'bucket',
    appliesTo: ['business'],
    answerKey: 'pages',
    ...q('pages'),
    priceRef: 'pages',
    options: [5, 8, 12, 20, 30].map((n) => opt('pages', `n${n}`, {value: n})),
  },
  {
    id: 'products',
    step: 4,
    kind: 'bucket',
    appliesTo: ['ecommerce'],
    answerKey: 'productBucket',
    ...q('products'),
    options: PRODUCT_BUCKETS.map((b) => opt('products', b, {priceRef: `products.${b}`})),
  },
  {
    id: 'roles',
    step: 4,
    kind: 'bucket',
    appliesTo: ['webapp', 'portal'],
    answerKey: 'rolesBucket',
    ...q('roles'),
    options: ROLE_BUCKETS.map((b) => opt('roles', b, {priceRef: `roles.${b}`})),
  },
  featureQuestion('business'),
  featureQuestion('shared'),
  featureQuestion('ecommerce'),
  featureQuestion('webapp'),
  designToggle('existing'),
  designToggle('brandIdentity'),
  designToggle('advancedMotion'),
  designToggle('premium'),
  {
    id: 'integrations',
    step: 7,
    kind: 'multi',
    appliesTo: 'all',
    answerKey: 'integrations',
    ...q('integrations'),
    options: INTEGRATION_IDS.map((id) => opt('integrations', id, {priceRef: `integrations.${id}`})),
  },
];

/** Questions relevant to the selected project types, in flow order. */
export function visibleQuestions(answers: {types?: readonly ProjectType[]}): Question[] {
  const types = answers.types ?? [];
  return QUESTIONS.filter(
    (qn) => qn.appliesTo === 'all' || qn.appliesTo.some((t) => types.includes(t)),
  );
}

export const STEPS: readonly QuestionStep[] = [1, 2, 3, 4, 5, 6, 7];

/** Every i18n key the flow uses, with an English suggestion (for translators). */
export function estimatorI18nKeys(): Record<string, string> {
  const cfg = ESTIMATOR_CONFIG;
  const out: Record<string, string> = {};
  const stepTitles = ['Goals', 'Size', 'Project type', 'Scope', 'Features', 'Design', 'Integrations'];
  STEPS.forEach((s) => (out[`estimator.step.${s}.title`] = stepTitles[s - 1]));

  const text: Record<string, [string, string]> = {
    goals: ['What do you want your website to do?', 'Pick everything that applies.'],
    size: ['How big should it be?', 'A rough size is fine.'],
    types: ['What do you want to build?', 'Pick everything that applies.'],
    pages: ['How many pages?', 'The first five are included.'],
    products: ['How many products?', 'Approximate catalog size.'],
    roles: ['How many user roles?', 'For example admin, staff, customer.'],
    'features.business': ['Website features', 'Select what you need.'],
    'features.shared': ['Common features', 'Select what you need.'],
    'features.ecommerce': ['Store features', 'Select what you need.'],
    'features.webapp': ['App features', 'Select what you need.'],
    'design.existing': ['I already have a design', 'We build from your design.'],
    'design.brandIdentity': ['I need a brand identity', 'Logo, colors and typography.'],
    'design.advancedMotion': ['Advanced 3D / animation', 'Rich motion and interactive visuals.'],
    'design.premium': ['Premium visual design', 'Extra polish and custom visuals.'],
    integrations: ['Integrations & services', 'Connect the tools you already use.'],
  };
  for (const [id, [label, hint]] of Object.entries(text)) {
    out[`estimator.q.${id}.label`] = label;
    out[`estimator.q.${id}.hint`] = hint;
  }

  const optionText = (qid: string, id: string, label: string) => (out[`estimator.q.${qid}.opt.${id}`] = label);
  const goalText: Record<string, string> = {
    leads: 'Get more leads',
    sell: 'Sell products online',
    bookings: 'Take bookings',
    brand: 'Build my brand',
    content: 'Publish content',
    portal: 'Give customers a portal',
    other: 'Something else',
  };
  for (const g of GOAL_IDS) out[`estimator.goal.${g}`] = goalText[g];
  const sizeText: Record<string, string> = {
    small: 'Small (1–5 pages)',
    medium: 'Medium (6–15 pages)',
    large: 'Large (16–40 pages)',
    xlarge: 'Very large (40+ pages)',
    unsure: 'Not sure',
  };
  for (const z of SIZE_IDS) out[`estimator.size.${z}`] = sizeText[z];
  for (const t of PROJECT_TYPES) optionText('types', t, cfg.projectBase[t].label);
  [5, 8, 12, 20, 30].forEach((n) => optionText('pages', `n${n}`, `${n} pages`));
  for (const b of PRODUCT_BUCKETS) optionText('products', b, cfg.products[b].label);
  for (const b of ROLE_BUCKETS) optionText('roles', b, cfg.roles[b].label);
  for (const id of FEATURE_IDS) {
    const f = cfg.features[id];
    optionText(`features.${f.home}`, id, f.label);
    out[`estimator.item.feature.${id}`] = f.label;
  }
  for (const id of INTEGRATION_IDS) {
    const label = id in cfg.integrations ? cfg.integrations[id as keyof typeof cfg.integrations].label : cfg.features[id as 'crm'].label;
    optionText('integrations', id, label);
    if (id in cfg.integrations) out[`estimator.item.integration.${id}`] = label;
  }
  for (const t of PROJECT_TYPES) {
    out[`estimator.item.base.${t}`] = cfg.projectBase[t].label;
    out[`estimator.item.type.${t}`] = `Additional: ${cfg.projectBase[t].label}`;
  }
  out['estimator.item.pages'] = 'Extra pages';
  out['estimator.item.products'] = 'Product catalog size';
  out['estimator.item.roles'] = 'User roles';
  out['estimator.item.design.existing'] = 'Existing design provided';
  out['estimator.item.design.premium'] = 'Premium visual design';
  out['estimator.item.design.brandIdentity'] = 'Brand identity';
  out['estimator.item.design.advancedMotion'] = 'Advanced 3D / animation';
  return out;
}
