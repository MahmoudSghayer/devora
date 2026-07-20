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
    // TODO(devora): rabea.art still serves the pre-launch splash, so the captured
    // screenshot shows that until the storefront is public — re-run
    // scripts/capture-screenshots.mjs on launch day.
    slug: 'rabea',
    domain: 'rabea.art',
    href: 'https://rabea.art',
    image: '/images/rabea.png',
    en: {
      industry: 'Art & e-commerce',
      tags: 'Brand · E-commerce · Development',
      summary:
        'A custom storefront for Rabea Hamoud — original paintings alongside printed and embroidered t-shirts and hoodies, built from scratch rather than assembled from a template.',
      challenge:
        'The catalogue mixes things that behave nothing alike: one-of-a-kind paintings, t-shirts and hoodies that come either screen-printed or hand-embroidered, and commissions that start from a customer idea. Off-the-shelf store templates flatten all of that into one identical product grid — sizes and finishes bolted on as afterthoughts — and none of them handle an Arabic-first shop with real RTL properly.',
      approach:
        'We built the store around the catalogue rather than bending the catalogue to fit a platform. A unique canvas sells once and needs no size chart; a hoodie needs sizes and a choice between print and embroidery; a commission begins as a conversation, not an add-to-cart. Brand, art direction and storefront were handled by one team, bilingual from the first screen.',
      outcome:
        'A store that presents the work like a gallery and sells like a shop — owned outright by Rabea, with no template to fight and nothing locked behind a plugin.',
    },
    ar: {
      industry: 'فن وتجارة إلكترونية',
      tags: 'هوية · متجر إلكتروني · تطوير',
      summary:
        'متجر مخصّص لـ«ربيع حمود» — لوحاتٌ أصلية إلى جانب قمصانٍ وهوديزٍ مطبوعة أو مطرّزة، مبنيٌّ من الصفر لا قالبًا جاهزًا.',
      challenge:
        'تجمع المعروضات أشياءً لا تتشابه في سلوكها: لوحاتٌ فريدة لا تتكرّر، وقمصانٌ وهوديز تأتي مطبوعةً أو مطرّزةً باليد، وطلباتٌ خاصة تبدأ من فكرة الزبون. القوالب الجاهزة تصهر هذا كله في شبكة منتجاتٍ واحدة — تُلحِق المقاسات والتشطيبات بها إلحاقًا — ولا يتعامل أيٌّ منها مع متجرٍ عربيٍّ أولًا واتجاهٍ من اليمين إلى اليسار كما ينبغي.',
      approach:
        'بنينا المتجر حول طبيعة المعروضات بدل ليّها لتناسب منصّةً جاهزة. اللوحة الفريدة تُباع مرة واحدة ولا تحتاج جدول مقاسات؛ والهودي يحتاج مقاسًا وخيارًا بين الطباعة والتطريز؛ والطلب الخاص يبدأ بحوارٍ لا بزرّ «أضف إلى السلة». أنجزنا الهوية والإخراج الفني والمتجر بفريقٍ واحد، وثنائي اللغة منذ أول شاشة.',
      outcome:
        'متجر يعرض الأعمال كأنه صالة عرض ويبيع كأنه متجر — ملكٌ خالصٌ لـ«ربيع»، بلا قالبٍ يُصارَع ولا ميزةٍ محبوسة خلف إضافة مدفوعة.',
    },
  },
  {
    // TODO(devora): kareem.video was unreachable for review from the network this
    // copy was written on — confirm the details with the client.
    slug: 'kareem',
    domain: 'kareem.video',
    href: 'https://kareem.video',
    image: undefined,
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

export type CaseStudy = (typeof CASES)[number];
