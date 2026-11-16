// Brand constants + placeholders the client will replace before launch.
// Search "TODO(devora)" to find anything that still needs a real value.

export const SITE = {
  name: 'devora',
  domain: 'devora.design',
  email: 'support@devora.design',
  /** Business WhatsApp number (E.164). */
  whatsapp: '+972542182646',
} as const;

/** The number as people read it (always rendered LTR). */
export const WHATSAPP_DISPLAY = '+972 54-218-2646';

const WHATSAPP_PREFILL: Record<'en' | 'ar', string> = {
  en: "Hi devora, I'd like to talk about a project.",
  ar: 'مرحبًا ديفورا، أودّ التحدّث عن مشروع.',
};

/** https://wa.me link with a localized, URL-encoded prefilled message. */
export function whatsappUrl(locale: string, message?: string): string {
  const text = message ?? WHATSAPP_PREFILL[locale === 'ar' ? 'ar' : 'en'];
  return `https://wa.me/${SITE.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

// Only Instagram is live today; other channels are added as they launch.
export const SOCIALS = [
  {label: 'Instagram', href: 'https://instagram.com/devora.designs'},
] as const;

// Case studies. `slug`, `domain`, `href`, `image` are real (live client sites).
// The bilingual narrative (challenge/approach/outcome) is qualitative and honest
// — no invented metrics. The two newest sites (rabea.art, kareem.video) were checked against the live pages in Nov 2026.
/** All known case studies. Set `active: false` to pause one — it disappears from every page,
 *  sitemap, JSON-LD and the chat knowledge base (data + image are kept; flip it back to re-enable). */
const ALL_CASES = [
  {
    slug: 'zawiya',
    active: true,
    domain: 'zawiya.studio',
    href: 'https://zawiya.studio',
    image: '/images/zawiya.png',
    en: {
      industry: 'SaaS · Photography',
      tags: 'Product design · SaaS · Development',
      summary:
        'An AI-assisted client-gallery platform for professional photographers — delivery, bookings, invoices and contracts in one bilingual product.',
      challenge:
        'Photographers were running their studios out of three or four disconnected tools: one to deliver galleries, another for bookings, a third for paperwork. None of them preserved original files properly, and none of them worked in Arabic.',
      approach:
        'We built a product around the whole gallery lifecycle — upload to archive — with AI-assisted tooling, CDN-optimised previews, signed and expiring share links, and per-gallery access control. English and Arabic are first-class, RTL included, rather than a translation layer added at the end.',
      outcome:
        'A working SaaS with a free tier and paid plans that runs a studio end to end, not just the delivery step — originals stored untouched, admin handled in the same place.',
    },
    ar: {
      industry: 'منتج رقمي · تصوير',
      tags: 'تصميم منتج · SaaS · تطوير',
      summary:
        'منصّة معارض للعملاء مدعومة بالذكاء الاصطناعي للمصورين المحترفين — تسليم وحجوزات وفواتير وعقود في منتجٍ واحد ثنائي اللغة.',
      challenge:
        'كان المصورون يديرون استوديوهاتهم بثلاث أو أربع أدواتٍ متفرّقة: واحدة لتسليم المعارض، وأخرى للحجوزات، وثالثة للأوراق. ولم تكن أيٌّ منها تحفظ الملفات الأصلية كما ينبغي، ولا تعمل بالعربية.',
      approach:
        'بنينا منتجًا يغطّي دورة حياة المعرض كاملة — من الرفع إلى الأرشفة — بأدواتٍ يعينها الذكاء الاصطناعي، ومعاينات محسّنة عبر شبكة توصيل، وروابط مشاركة موقّعة تنتهي صلاحيتها، وتحكّمٍ بالوصول لكل معرض. العربية والإنجليزية أصيلتان في المنتج، والاتجاه من اليمين إلى اليسار ضمنه، لا طبقة ترجمةٍ تُضاف في النهاية.',
      outcome:
        'منتج SaaS عامل بخطة مجانية وخططٍ مدفوعة يُدير الاستوديو من طرفه إلى طرفه، لا خطوة التسليم وحدها — الأصول محفوظة كما هي، والأعمال الإدارية في المكان نفسه.',
    },
  },
  {
    slug: 'aldarb',
    active: false,
    domain: 'aldarb.co',
    href: 'https://aldarb.co',
    image: '/images/aldarb.png',
    en: {
      industry: 'Publishing platform',
      tags: 'Strategy · Editorial product · Development',
      summary:
        'An Arabic-first publishing platform where anyone can share articles, opinions and ideas openly — built for reading, not for feeds.',
      challenge:
        'Arabic writing worth reading was scattered across social posts and threads, where it scrolls past and disappears. Aldarb needed a home of its own: proper Arabic typography, genuine RTL, and an editorial structure that helps a reader find the good pieces.',
      approach:
        'We designed around the reader first — clear sections for opinion, dossiers, society and culture, an editorial front page, and a most-read view — then engineered a clean, scalable build that stays fast as the archive grows and keeps publishing open to anyone.',
      outcome:
        'A platform where anyone can publish and actually be read, with a codebase the team can keep extending.',
    },
    ar: {
      industry: 'منصّة نشر',
      tags: 'استراتيجية · منتج تحريري · تطوير',
      summary:
        'منصّة نشرٍ عربيةٌ أولًا، يشارك فيها كل من أراد مقالاته وآراءه وأفكاره بحرّية — مبنيّة للقراءة لا للتمرير.',
      challenge:
        'الكتابة العربية الجديرة بالقراءة كانت مبعثرة بين منشورات التواصل وخيوطه، تمرّ سريعًا ثم تختفي. احتاجت «الدرب» إلى بيتٍ خاص بها: طباعةٌ عربية سليمة، واتجاهٌ من اليمين إلى اليسار أصيل، وبنيةٌ تحريرية تُعين القارئ على بلوغ الجيّد.',
      approach:
        'صمّمنا للقارئ أولًا — أقسامٌ واضحة للآراء والملفات الخاصة وقضايا المجتمع والثقافة والفكر، وصفحةٌ رئيسية تحريرية، وقائمةٌ للأكثر قراءة — ثم هندسنا بناءً نظيفًا قابلًا للتوسّع يبقى سريعًا مع نمو الأرشيف ويُبقي النشر مفتوحًا للجميع.',
      outcome:
        'منصّة يستطيع فيها أيُّ أحدٍ أن ينشر وأن يُقرأ فعلًا، وكودٌ يستطيع الفريق مواصلة توسيعه.',
    },
  },
  {
    slug: 'rabea',
    active: true,
    domain: 'rabea.art',
    href: 'https://rabea.art',
    image: '/images/rabea.png',
    en: {
      industry: 'Art & e-commerce',
      tags: 'E-commerce · Development',
      summary:
        'A custom, Arabic-first storefront for Rabea Hamoud — printed and embroidered shirts, original paintings and art prints, and made-to-order pieces that start from a customer’s own idea.',
      challenge:
        'The catalogue mixes things that behave nothing alike: shirts that come printed or hand-embroidered, one-of-a-kind paintings with art-print copies, and custom orders that begin with a customer’s uploaded idea. Off-the-shelf store templates flatten all of that into one identical product grid, and few handle an Arabic-first shop with real RTL properly.',
      approach:
        'We built the store around the catalogue rather than bending the catalogue to fit a platform: shirts, paintings and a dedicated custom-order flow where the customer uploads their idea and chooses print, embroidery or a painted piece. Orders are reviewed and the price and delivery are confirmed with the customer before work starts — no online payment is forced on a made-to-order business. The storefront is Arabic-first, with a clear, simple order journey.',
      outcome:
        'A live store that presents the work like a gallery and takes orders like a studio — owned outright by Rabea, with no template to fight and nothing locked behind a plugin.',
    },
    ar: {
      industry: 'فن وتجارة إلكترونية',
      tags: 'متجر إلكتروني · تطوير',
      summary:
        'متجر مخصّص بالعربية أولًا لـ«ربيع حمود» — قمصانٌ مطبوعة ومطرّزة، ولوحاتٌ أصلية ونسخٌ فنية، وقطعٌ تُصنع عند الطلب من فكرة الزبون نفسه.',
      challenge:
        'تجمع المعروضات أشياءً لا تتشابه في سلوكها: قمصانٌ تأتي مطبوعةً أو مطرّزةً باليد، ولوحاتٌ فريدة لها نسخٌ فنية، وطلباتٌ خاصة تبدأ من فكرةٍ يرفعها الزبون. القوالب الجاهزة تصهر هذا كله في شبكة منتجاتٍ واحدة، وقلّما يتعامل أيٌّ منها مع متجرٍ عربيٍّ أولًا واتجاهٍ من اليمين إلى اليسار كما ينبغي.',
      approach:
        'بنينا المتجر حول طبيعة المعروضات بدل ليّها لتناسب منصّةً جاهزة: قمصان ولوحات، ومسارٌ مخصّص للطلبات الخاصة يرفع فيه الزبون فكرته ويختار الطباعة أو التطريز أو لوحةً مرسومة. تُراجَع الطلبات ويُتَّفق على السعر والتسليم مع الزبون قبل بدء العمل — دون فرض دفعٍ إلكتروني على نشاطٍ يعمل بالطلب. والواجهة عربيةٌ أولًا برحلة طلبٍ واضحة وبسيطة.',
      outcome:
        'متجر مباشر يعرض الأعمال كأنه صالة عرض ويستقبل الطلبات كأنه مرسم — ملكٌ خالصٌ لـ«ربيع»، بلا قالبٍ يُصارَع ولا ميزةٍ محبوسة خلف إضافة مدفوعة.',
    },
  },
  {
    slug: 'kareem',
    active: true,
    domain: 'kareem.video',
    href: 'https://kareem.video',
    image: '/images/kareem.png',
    en: {
      industry: 'Video editing',
      tags: 'Web design · Development',
      summary:
        'A custom portfolio for a video editor who shares both his work and his craft openly — built so the work plays first and the page never gets in its way.',
      challenge:
        'An editor is hired on the strength of the reel, yet generic portfolio templates bury video behind slow galleries and heavy embedded players that stall before the first frame appears. They also leave nowhere to show the skills behind the cut — only the finished clip.',
      approach:
        'We designed around playback: the work leads and the interface recedes. The build streams video efficiently, stays light on mobile connections, and gives the craft its own space alongside the reel — so a visitor sees not just what was made, but what he can do.',
      outcome:
        'A portfolio where the reel is the interface — quick to open, simple to send to a prospective client, and straightforward to keep current as new work and new skills land.',
    },
    ar: {
      industry: 'مونتاج ڤيديو',
      tags: 'تصميم ويب · تطوير',
      summary:
        'موقع أعمال مخصّص لمونتير ڤيديو يشارك أعماله وحرفته بلا تحفّظ — مبنيٌّ ليتصدّر العملُ المشهد ولا تقف الصفحة في طريقه.',
      challenge:
        'يُختار المونتير بقوة أعماله، لكن قوالب المواقع الجاهزة تدفن الڤيديو خلف معارض بطيئة ومشغّلاتٍ ثقيلة تتلعثم قبل أن يظهر أول إطار. كما لا تترك مكانًا لإظهار المهارة الكامنة خلف المونتاج، بل المقطع النهائي وحده.',
      approach:
        'صمّمنا حول التشغيل: العمل يتقدّم والواجهة تتراجع. يبثّ البناء الڤيديو بكفاءة، ويبقى خفيفًا على شبكات الهاتف، ويمنح الحرفة مساحتها إلى جانب الأعمال — فيرى الزائر لا ما أُنجز فحسب، بل ما يستطيع صاحبه إنجازه.',
      outcome:
        'موقع أعمال يكون فيه العرضُ نفسه هو الواجهة — سريع الفتح، يسهل إرساله إلى عميلٍ محتمل، وسهل التحديث مع كل عملٍ جديد ومهارةٍ جديدة.',
    },
  },
] as const;

/** Active case studies — what the site actually shows. */
export const CASES = ALL_CASES.filter((c) => c.active);

export type CaseStudy = (typeof ALL_CASES)[number];
