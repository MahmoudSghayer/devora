import type {CSSProperties} from 'react';
import Container from '@/components/ui/Container';
import ArrowButton from '@/components/ui/ArrowButton';

// DEVORA OS CTA band: a dark panel with a gold glow rising from below, a
// gold-gradient headline and a gold pill button — echoing the homepage's
// "Ready to build your empire?" act rather than a solid amber block. Two
// layouts: split (title/sub left, button right) and centered (Work "next" band).
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
    <section className="relative overflow-hidden border-y border-border-amber bg-[#070810]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(75% 140% at 50% 118%, rgba(242,168,75,0.18), transparent 62%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-grid-drift opacity-70"
        style={
          {
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(242,168,75,0.05) 0 1px, transparent 1px 80px)',
            '--drift': '80px',
            '--drift-dur': '13s',
          } as CSSProperties
        }
      />
      <Container className="relative py-[120px]">
        <div
          className={`flex flex-wrap gap-8 ${
            centered
              ? 'flex-col items-center text-center'
              : 'items-center justify-between'
          }`}
        >
          <div className={centered ? '' : 'max-w-[720px]'}>
            <h2
              className="u-track bg-[linear-gradient(180deg,#fff,var(--color-amber))] bg-clip-text font-display font-bold leading-[1.02] tracking-[-0.03em] text-transparent"
              style={{fontSize: 'var(--text-cta)'}}
            >
              {title}
            </h2>
            {sub && (
              <p
                className={`mt-5 max-w-[520px] text-[19px] leading-[1.6] text-muted ${
                  centered ? 'mx-auto' : ''
                }`}
              >
                {sub}
              </p>
            )}
          </div>
          <ArrowButton
            href={buttonHref}
            label={buttonLabel}
            variant="amber"
            className="px-10 py-5 text-[17px]"
          />
        </div>
      </Container>
    </section>
  );
}
