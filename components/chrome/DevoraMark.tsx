// The devora mark: code brackets "< >" framing a glowing "aura" dot — dev + aura.
// Pure inline SVG so it scales crisply and inherits no layout. Amber on transparent
// (sits on the dark header). A soft blur gives the dot its glow.
export default function DevoraMark({
  size = 30,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="devora"
      focusable="false"
    >
      <defs>
        <radialGradient id="dvDot" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#ffe7c4" />
          <stop offset="45%" stopColor="#ffc46b" />
          <stop offset="100%" stopColor="#f2a84b" />
        </radialGradient>
        <filter id="dvGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      <circle cx="256" cy="256" r="58" fill="#f2a84b" opacity="0.4" filter="url(#dvGlow)" />
      <g
        stroke="#f2a84b"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M214 156 L150 256 L214 356" />
        <path d="M298 156 L362 256 L298 356" />
      </g>
      <circle cx="256" cy="256" r="40" fill="url(#dvDot)" />
    </svg>
  );
}
