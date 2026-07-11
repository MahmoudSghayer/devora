// Brand constants + placeholders the client will replace before launch.
// Search "TODO(devora)" to find everything that needs real values.

export const SITE = {
  name: 'devora',
  domain: 'devora.design',
  email: 'support@devora.design',
} as const;

// Only Instagram is live today; other channels are added as they launch.
export const SOCIALS = [
  {label: 'Instagram', href: 'https://instagram.com/devora.designs'},
] as const;

// Case studies. `slug`, `domain`, `href`, `image` are real (live client sites).
// The bilingual narrative (challenge/approach/outcome) is qualitative and honest
// — no invented metrics. TODO(devora): confirm wording with each client.
export const CASES = [
  {
    slug: 'zawiya',
    domain: 'zawiya.studio',
    href: 'https://zawiya.studio',
    image: '/images/zawiya.png',
    en: {
      industry: 'Creative studio',
      tags: 'Brand · Web design · Development',
      summary:
        'A complete brand and website for a creative studio — identity, art direction and a fast, custom build.',
      challenge:
        'Zawiya needed a home that matched the quality of its work: a brand and site that felt crafted, loaded instantly, and stayed easy to update as the studio grew.',
      approach:
        'We ran the whole thing on one brief — positioning and naming, a flexible visual identity, then a hand-built, performance-first site with a CMS the team could own.',
      outcome:
        'A cohesive brand and a fast, editorial site the studio runs itself — shipped end to end by one team.',
    },
    ar: {
      industry: 'استوديو إبداعي',
      tags: 'هوية · تصميم ويب · تطوير',
      summary:
        'هوية وموقع متكاملان لاستوديو إبداعي — هوية بصرية وإخراج فني وتطوير مخصص وسريع.',
      challenge:
        'احتاجت «زاوية» إلى واجهةٍ تليق بجودة أعمالها: هوية وموقع يشعرك بالإتقان، يفتح فورًا، ويسهل تحديثه مع نمو الاستوديو.',
      approach:
        'أنجزنا كل شيء على ملفٍ واحد — تموضع وتسمية وهوية بصرية مرنة، ثم موقع مبني يدويًا يضع الأداء أولًا مع نظام إدارة محتوى يملكه الفريق.',
      outcome:
        'هوية متماسكة وموقع سريع وأنيق يديره الاستوديو بنفسه — سُلّم بالكامل بفريق واحد.',
    },
  },
  {
    slug: 'aldarb',
    domain: 'aldarb.co',
    href: 'https://aldarb.co',
    image: '/images/aldarb.png',
    en: {
      industry: 'Digital platform',
      tags: 'Strategy · Web design · Development',
      summary:
        'Strategy, design and a ground-up build for Aldarb — shipped end to end by one team.',
      challenge:
        'Aldarb came to us with an ambition and a blank page. It needed a clear strategy, a trustworthy interface, and a solid technical foundation to build on.',
      approach:
        'We started with strategy and structure, designed a calm, confident interface, then engineered a clean, scalable build — one team carrying it from idea to launch.',
      outcome:
        'A launched product with a clear story and a codebase the team can keep extending.',
    },
    ar: {
      industry: 'منصة رقمية',
      tags: 'استراتيجية · تصميم ويب · تطوير',
      summary:
        'استراتيجية وتصميم وتطوير من الصفر لمنصة «الدرب» — أُنجز بالكامل بفريق واحد.',
      challenge:
        'جاءتنا «الدرب» بطموحٍ وصفحةٍ بيضاء. احتاجت إلى استراتيجية واضحة، وواجهة تبعث الثقة، وأساسٍ تقنيٍ متينٍ للبناء عليه.',
      approach:
        'بدأنا بالاستراتيجية والبنية، صمّمنا واجهة هادئة واثقة، ثم هندسنا بناءً نظيفًا قابلًا للتوسّع — فريق واحد يحملها من الفكرة إلى الإطلاق.',
      outcome:
        'منتج مُطلَق بقصةٍ واضحة، وكود يستطيع الفريق مواصلة توسيعه.',
    },
  },
] as const;

export type CaseStudy = (typeof CASES)[number];
