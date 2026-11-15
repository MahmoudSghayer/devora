// The ONE services taxonomy: three pillars. Copy lives in the `pillars`
// message namespace (pillars.<id>.*). Shared by the homepage, /services,
// header/footer, structured data and the chat knowledge base.

export const PILLARS = [
  {
    id: 'web',
    anchor: 'websites',
    /** nav / footer message key in `common` */
    navKey: 'nav_pillar_web',
    tint: 'web',
    calculator: '/estimate',
    itemCount: 8,
  },
  {
    id: 'auto',
    anchor: 'automation',
    navKey: 'nav_pillar_auto',
    tint: 'auto',
    calculator: '/automation-roi',
    itemCount: 8,
  },
  {
    id: 'soft',
    anchor: 'software',
    navKey: 'nav_pillar_soft',
    tint: 'soft',
    calculator: '/discuss',
    itemCount: 8,
  },
] as const;

export type PillarId = (typeof PILLARS)[number]['id'];

/** keys i1..iN for a pillar */
export const pillarItemKeys = (n: number) =>
  Array.from({length: n}, (_, i) => `i${i + 1}` as const);
