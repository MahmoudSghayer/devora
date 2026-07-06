import type {ReactNode} from 'react';

// Page gutter: max-width 1360px, 24px side padding (40px ≥ nav breakpoint).
export default function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1360px] px-6 nav:px-10 ${className}`}>
      {children}
    </div>
  );
}
