import type {CSSProperties} from 'react';
import Container from '@/components/ui/Container';
import ArrowButton from '@/components/ui/ArrowButton';

// Amber CTA band with drifting dark hairlines. Two layouts: split (title/sub
// left, button right — Home & Services) and centered (Work "next" band).
export default function AmberBand({
  title,
  sub,
  buttonLabel,
  buttonHref = '/contact',
  centered = false,
}: {
  title: string;
  sub?: string;
  buttonLabel: string;
  buttonHref?: string;
  centered?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-amber">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-grid-drift"
        style={
          {
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(19,17,8,0.06) 0 1px, transparent 1px 80px)',
            '--drift': '80px',
            '--drift-dur': '13s',
          } as CSSProperties
        }
      />
      <Container className="relative py-[110px]">
        <div
          className={`flex flex-wrap gap-8 ${
            centered
              ? 'flex-col items-center text-center'
              : 'items-center justify-between'
          }`}
        >
          <div className={centered ? '' : 'max-w-[720px]'}>
            <h2
              className="u-track font-display font-bold leading-[1] tracking-[-0.03em] text-on-amber"
              style={{fontSize: 'var(--text-cta)'}}
            >
              {title}
            </h2>
            {sub && (
              <p className="mt-5 max-w-[520px] text-[19px] leading-[1.6] text-[rgba(19,17,8,0.65)]">
                {sub}
              </p>
            )}
          </div>
          <ArrowButton
            href={buttonHref}
            label={buttonLabel}
            variant="dark"
            className="px-10 py-5 text-[17px]"
          />
        </div>
      </Container>
    </section>
  );
}
