import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';
import FAQAccordion from '@/components/ui/FAQAccordion';

// A few top questions on the home page; full set lives on /faq.
export default function FaqTeaser() {
  const h = useTranslations('home');
  const f = useTranslations('faq');

  const items = [
    {q: f('q1'), a: f('a1')},
    {q: f('q2'), a: f('a2')},
    {q: f('q5'), a: f('a5')},
    {q: f('q9'), a: f('a9')},
  ];

  return (
    <section className="border-b border-border">
      <Container className="py-24">
        <Reveal>
          <SectionHeader
            label={h('faq_label')}
            title={h('faq_title')}
            link={<ArrowLink href="/faq" label={h('faq_link')} />}
          />
        </Reveal>
        <Reveal className="mt-10">
          <FAQAccordion items={items} />
        </Reveal>
      </Container>
    </section>
  );
}
