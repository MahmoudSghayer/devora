import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import Reveal from '@/components/motion/Reveal';

const QUOTES = [
  {q: 't1_q', a: 't1_a'},
  {q: 't2_q', a: 't2_a'},
] as const;

// NOTE: testimonial quotes are placeholder copy — TODO(devora): replace with
// real client quotes + attributions.
export default function Testimonials() {
  const h = useTranslations('home');

  return (
    <section className="border-b border-border">
      <Container className="py-24">
        <Reveal>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
            {h('test_label')}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-px bg-border [grid-template-columns:repeat(auto-fit,minmax(380px,1fr))]">
          {QUOTES.map((it, i) => (
            <Reveal key={it.q} index={i} className="h-full">
              <figure className="flex h-full flex-col bg-bg p-10 transition-colors duration-300 hover:bg-surface">
                <blockquote className="text-2xl font-medium leading-[1.45] text-ink-2">
                  {h(it.q)}
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3 font-mono text-xs text-muted-2">
                  <span className="h-0.5 w-5 bg-amber" />
                  {h(it.a)}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
