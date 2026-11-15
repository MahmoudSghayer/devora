// Static class maps per pillar tint (Tailwind needs literal class names).
export const PILLAR_TINT = {
  web: {
    aura: '',
    text: 'text-pillar-web',
    border: 'border-pillar-web/30',
    dot: 'bg-pillar-web',
    tone: 'amber',
  },
  auto: {
    aura: 'aura-signal',
    text: 'text-pillar-auto',
    border: 'border-pillar-auto/30',
    dot: 'bg-pillar-auto',
    tone: 'signal',
  },
  soft: {
    aura: 'aura-soft',
    text: 'text-pillar-soft',
    border: 'border-pillar-soft/30',
    dot: 'bg-pillar-soft',
    tone: 'soft',
  },
} as const;
