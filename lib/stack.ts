import {
  siAnthropic,
  siGreensock,
  siNextdotjs,
  siPostgresql,
  siReact,
  siSupabase,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siUpstash,
  siVercel,
  siVitest,
  siZod,
  siGithubactions,
} from 'simple-icons';

// The evidenced technology list shown on the homepage "stack constellation".
// Every entry is something the repo really uses (package.json, .github/
// workflows, supabase/migrations). Names + use-lines live in the `stack`
// message namespace (n_<id> / u_<id>). Icons are per-icon imports from
// simple-icons (CC0); where the package has no mark for a tool we render a
// monogram tile instead of inventing a logo.

export type StackGroupId = 'frontend' | 'backend' | 'ai' | 'infra' | 'quality';

export interface StackItemDef {
  id: string;
  /** simple-icons SVG path (24x24 viewBox), or a monogram when the tool has no mark */
  path?: string;
  mono?: string;
}

export interface StackGroupDef {
  id: StackGroupId;
  /** text colour token class for the group's accent */
  tone: string;
  /** line colour token class (SVG stroke) */
  stroke: string;
  /** constellation centre in a 1000x520 stage */
  cx: number;
  cy: number;
  /** ring radius for the nodes around the centre */
  r: number;
  /** parallax depth in px (translateZ) */
  depth: number;
  items: StackItemDef[];
}

export const STAGE = {w: 1000, h: 520, hub: {x: 485, y: 260}} as const;

export const STACK_GROUPS: StackGroupDef[] = [
  {
    id: 'frontend',
    tone: 'text-amber',
    stroke: 'stroke-amber',
    cx: 200,
    cy: 262,
    r: 152,
    depth: 30,
    items: [
      {id: 'nextjs', path: siNextdotjs.path},
      {id: 'react', path: siReact.path},
      {id: 'typescript', path: siTypescript.path},
      {id: 'tailwind', path: siTailwindcss.path},
      {id: 'three', path: siThreedotjs.path},
      {id: 'gsap', path: siGreensock.path},
      {id: 'motion', mono: 'M'},
      {id: 'lenis', mono: 'L'},
      {id: 'nextintl', mono: 'i18n'},
    ],
  },
  {
    id: 'backend',
    tone: 'text-signal',
    stroke: 'stroke-signal',
    cx: 775,
    cy: 122,
    r: 96,
    depth: 60,
    items: [
      {id: 'supabase', path: siSupabase.path},
      {id: 'postgres', path: siPostgresql.path},
      {id: 'zod', path: siZod.path},
      {id: 'nodemailer', mono: 'Nm'},
      {id: 'upstash', path: siUpstash.path},
    ],
  },
  {
    id: 'ai',
    tone: 'text-signal',
    stroke: 'stroke-signal',
    cx: 925,
    cy: 292,
    r: 0,
    depth: 90,
    items: [{id: 'claude', path: siAnthropic.path}],
  },
  {
    id: 'infra',
    tone: 'text-pillar-soft',
    stroke: 'stroke-pillar-soft',
    cx: 640,
    cy: 430,
    r: 62,
    depth: 45,
    items: [
      {id: 'vercel', path: siVercel.path},
      {id: 'actions', path: siGithubactions.path},
    ],
  },
  {
    id: 'quality',
    tone: 'text-positive',
    stroke: 'stroke-positive',
    cx: 880,
    cy: 440,
    r: 56,
    depth: 75,
    items: [
      {id: 'playwright', mono: 'Pw'},
      {id: 'vitest', path: siVitest.path},
    ],
  },
];

export interface PlacedNode {
  id: string;
  groupId: StackGroupId;
  path?: string;
  mono?: string;
  /** stage position in % of the 1000x520 box */
  x: number;
  y: number;
}

const pct = (v: number, of: number) => Math.round((v / of) * 10000) / 100;

/** Deterministic ring layout (computed once, same on server + client). */
export function placeNodes(group: StackGroupDef): PlacedNode[] {
  const n = group.items.length;
  return group.items.map((it, i) => {
    let x = group.cx;
    let y = group.cy;
    if (n === 1) {
      y -= 30;
    } else if (n === 2) {
      x += i === 0 ? -group.r : group.r;
      y -= 14;
    } else {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      x += Math.cos(a) * group.r;
      y += Math.sin(a) * group.r;
    }
    return {
      id: it.id,
      groupId: group.id,
      path: it.path,
      mono: it.mono,
      x: pct(x, STAGE.w),
      y: pct(y, STAGE.h),
    };
  });
}
