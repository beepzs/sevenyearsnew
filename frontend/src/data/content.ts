export interface Topic {
  slug: string;
  name: string;
  desc: string;
  color: string;
  intro: string;
  count: string;
}

export interface Expert {
  slug: string;
  name: string;
  role: string;
  img?: string | null;
  color: string;
  short: string;
  bio: string[];
  creds: string[];
  disclosure?: string;
}

export interface Episode {
  id: string;
  title: string;
  guest: string;
  kind: "episode" | "video" | "social";
  tags: string[];
  ep: number | string;
  secs: number;
  durationLabel: string;
  slug: string;
  date: string;
}

export interface Answer {
  slug: string;
  q: string;
  topic: string;
  also?: string[];
  video: string;
  expert: string;
  ages: number[];
  quick: string;
  body?: string;
}

export const TOPICS: Topic[] = [
  {
    slug: "gut-health",
    name: "Gut health & microbiome",
    desc: "Tummies, probiotics and the gut–brain link",
    color: "#bfe4c6",
    intro: "Much of your child’s immune system lives in the gut, and the microbes that settle there in the first years shape far more than digestion. Start here for the plain-English basics.",
    count: "5 answers · 13 videos"
  },
  {
    slug: "first-foods",
    name: "Nutrition & first foods",
    desc: "Starting solids, balanced plates, real food",
    color: "#fbe7ac",
    intro: "From first spoonfuls to lunchbox years — how to build a varied diet without turning mealtimes into a project.",
    count: "2 answers · 9 videos"
  },
  {
    slug: "picky-eating",
    name: "Picky eating",
    desc: "When they won’t eat, or only eat beige",
    color: "#fad7c4",
    intro: "Selective eating is one of the most common worries we hear. What is normal, what helps, and when to look closer.",
    count: "1 video"
  },
  {
    slug: "skin-eczema",
    name: "Skin & eczema",
    desc: "Rashes, dry patches and the gut–skin link",
    color: "#f6d2c9",
    intro: "Eczema is about more than skin. Our experts explain barrier care, triggers, and where the gut fits in.",
    count: "2 answers · 5 videos"
  },
  {
    slug: "allergies",
    name: "Allergies",
    desc: "Food allergy, hay fever and early prevention",
    color: "#ddd6f5",
    intro: "What research now says about early exposure, and how to tell an allergy from an intolerance.",
    count: "2 answers · 3 videos"
  },
  {
    slug: "immunity",
    name: "Immunity & everyday illness",
    desc: "Colds, fevers, antibiotics and bouncing back",
    color: "#cfe6f2",
    intro: "Coughs, colds and the endless nursery bugs — building resilience, and knowing when to call the doctor.",
    count: "3 answers · 7 videos"
  },
  {
    slug: "brain-focus",
    name: "Brain, focus & ADHD",
    desc: "Attention, learning and the gut–brain axis",
    color: "#e3dcf7",
    intro: "Why attention differences are being diagnosed more often, and the daily habits that support a developing brain.",
    count: "2 answers · 6 videos"
  },
  {
    slug: "autism-development",
    name: "Autism & development",
    desc: "Milestones, differences and support",
    color: "#d6ecdf",
    intro: "Understanding developmental differences early, and the range of support families are exploring.",
    count: "New answers soon"
  },
  {
    slug: "sleep",
    name: "Sleep",
    desc: "Bedtimes, night waking and routines",
    color: "#d9dff3",
    intro: "Sleep drives mood, growth and immunity. Gentle, realistic approaches for tired families.",
    count: "1 video"
  },
  {
    slug: "emotions",
    name: "Emotions & behaviour",
    desc: "Big feelings, tantrums and resilience",
    color: "#fde2c8",
    intro: "Meltdowns are normal — here is what is happening in the brain, and how to help a child find calm.",
    count: "2 videos"
  },
  {
    slug: "pregnancy",
    name: "Pregnancy & preconception",
    desc: "Setting up the first seven years before day one",
    color: "#f7d9e3",
    intro: "A child’s health story starts before birth. What matters in preconception and pregnancy — without the guilt.",
    count: "2 answers · 6 videos"
  },
  {
    slug: "supplements",
    name: "Supplements",
    desc: "What kids actually need, and what they don’t",
    color: "#f3ecdf",
    intro: "Food first — then an honest look at where vitamin D, omega-3s, probiotics and others may fit.",
    count: "1 answer · 4 videos"
  },
  {
    slug: "omega-3s",
    name: "Omega-3s & healthy fats",
    desc: "DHA, fish and the fats growing brains rely on",
    color: "#f6e3c4",
    intro: "Fats are a building material for a young child’s brain and eyes. What omega-3s are, where to find them in everyday food, and what to ask before adding anything extra.",
    count: "1 answer · 5 videos"
  }
];

export const EXPERTS: Record<string, Expert> = {
  "dr-murray-clarke": {
    slug: "dr-murray-clarke",
    name: "Dr. Murray Clarke",
    role: "Host · The First Seven Years",
    img: "/assets/img/dr-murray-clarke.jpg",
    color: "#a6d6b0",
    short: "Host of The First Seven Years and the doctor who answers your questions.",
    bio: [
      "Dr. Murray Clarke has spent decades focused on one question: what gives a child the strongest possible start? His work sits where nutrition, the gut and a child’s developing brain meet — and he has a knack for explaining it in the language parents actually use.",
      "On The First Seven Years he hosts long-form conversations with pediatricians, researchers and practitioners, then distils them into short, practical answers. Through Ask the Doctor, he answers parents’ questions directly — the most common become new answers in this library."
    ],
    creds: [
      "Host of The First Seven Years podcast and video series",
      "Answers parent questions through Ask the Doctor",
      "Focus: children’s nutrition, gut health and integrative care"
    ],
    disclosure: "Dr. Murray Clarke is the founder of ChildLife Essentials, a children’s nutritional supplement company. The First Seven Years does not recommend or sell products, and his answers on this site are educational, not product advice."
  },
  "bryce-wylde": {
    slug: "bryce-wylde",
    name: "Bryce Wylde",
    role: "Co-host · Functional medicine",
    img: null,
    color: "#fbe7ac",
    short: "Co-host, functional medicine expert, and author of The First Seven Years book.",
    bio: [
      "Bryce Wylde co-hosts The First Seven Years, bringing a functional medicine lens to each conversation — asking the follow-up questions a curious parent would, and pressing guests on the evidence.",
      "He is the author of The First Seven Years book, approved by Dr. Bill Sears and Dr. Murray Clarke."
    ],
    creds: [
      "Co-host of The First Seven Years",
      "Functional medicine expert",
      "Author, The First Seven Years book"
    ]
  },
  "dr-bill-sears": {
    slug: "dr-bill-sears",
    name: "Dr. Bill Sears",
    role: "Pediatrician · Author · Featured expert",
    img: "/assets/img/dr-bill-sears.jpg",
    color: "#bfe4c6",
    short: "Pediatrician and author of more than 40 books on parenting and children’s health, including The Baby Book.",
    bio: [
      "Dr. William “Bill” Sears is a pediatrician and the author or co-author of more than 40 books on parenting and children’s health, including The Baby Book — the reference many parents keep on the nightstand through the first years.",
      "On The First Seven Years he joins Dr. Murray Clarke and Bryce Wylde to talk about what to feed babies and when, breastfeeding, and the nutrients growing children need most. He is part of the author network behind The First Seven Years book, which he approved alongside Dr. Clarke."
    ],
    creds: [
      "Pediatrician",
      "Author or co-author of 40+ books, including The Baby Book",
      "Featured expert on The First Seven Years",
      "Approved The First Seven Years book"
    ],
    disclosure: "Dr. Sears is associated with AskDrSears.com, a sponsor of The First Seven Years. Sponsors have no say over which questions we answer or what the answers say."
  },
  "dr-dan-sullivan": {
    slug: "dr-dan-sullivan",
    name: "Dr. Dan Sullivan",
    role: "Guest · Episode 27",
    img: null,
    color: "#ddd6f5",
    short: "Guest on Episode 27 — ADHD, stress and the gut.",
    bio: [
      "Dr. Dan Sullivan joined the show to talk about why ADHD diagnoses are rising, how stress in pregnancy may shape a baby’s brain, and what he does to manage his own ADHD."
    ],
    creds: ["Guest, Episode 27"]
  },
  "dr-elisa-song": {
    slug: "dr-elisa-song",
    name: "Dr. Elisa Song",
    role: "Guest · Episode 26 · Integrative pediatrician",
    img: null,
    color: "#bfe4c6",
    short: "Integrative pediatrician; guest on Episode 26 — the gut behind allergies, anxiety and ADHD.",
    bio: [
      "Dr. Elisa Song is an integrative pediatrician. On Episode 26 she explains the microbiome in terms any parent can use — from prebiotics versus probiotics to restoring the gut after antibiotics."
    ],
    creds: ["Integrative pediatrician", "Guest, Episode 26"]
  },
  "joy-mccarthy": {
    slug: "joy-mccarthy",
    name: "Joy McCarthy",
    role: "Guest · Holistic nutritionist",
    img: null,
    color: "#fad7c4",
    short: "Holistic nutritionist; guest on eczema and the gut–skin connection.",
    bio: [
      "Joy McCarthy is a holistic nutritionist. Her conversation with the show focuses on children’s eczema — why it is so often a gut story, and gentle ways to care for skin."
    ],
    creds: ["Holistic nutritionist", "Guest on eczema and skin health"]
  }
};

export const ANSWERS: Answer[] = [
  {
    slug: "is-my-childs-eczema-a-gut-problem",
    q: "Is my child’s eczema really a gut problem?",
    topic: "skin-eczema",
    video: "I90rSaFzuak",
    expert: "joy-mccarthy",
    ages: [0, 1, 2, 3],
    quick: "Partly — and it is worth knowing why. Eczema happens when the skin barrier is leaky and the immune system over-reacts. Research increasingly links both to the gut microbiome, especially in the first years of life. Good skin care still comes first; supporting the gut can sit alongside it."
  },
  {
    slug: "what-is-leaky-gut",
    q: "What is “leaky gut”, really?",
    topic: "gut-health",
    video: "g4ejtsJj9y8",
    expert: "dr-elisa-song",
    ages: [2, 3, 4, 5],
    quick: "“Leaky gut” describes a gut lining that lets more through than it should — researchers call it increased intestinal permeability. It is measurable in studies, but it is not a diagnosis on its own. Think of it as one way gut health may connect to allergies, skin and mood."
  },
  {
    slug: "prebiotics-vs-probiotics-vs-postbiotics",
    q: "Prebiotics, probiotics, postbiotics — what’s the difference?",
    topic: "gut-health",
    video: "Yr5B77Yp9HE",
    expert: "dr-elisa-song",
    ages: [1, 2, 3, 4, 5, 6, 7],
    quick: "Probiotics are live, helpful microbes. Prebiotics are the fibres that feed them. Postbiotics are the useful compounds those microbes make. For most children, foods are the easiest place to start: yogurt or kefir, oats, bananas, beans and a wide variety of plants."
  },
  {
    slug: "restoring-the-gut-after-antibiotics",
    q: "How do I help my child’s gut recover after antibiotics?",
    topic: "gut-health",
    video: "hqC4jyz4ZvQ",
    expert: "dr-elisa-song",
    ages: [1, 2, 3, 4, 5, 6, 7],
    quick: "First, antibiotics are sometimes essential — always finish the course you were prescribed. Afterwards, a varied, fibre-rich diet, fermented foods if tolerated, plenty of water and time all help the microbiome rebuild. Ask your pediatrician whether a probiotic is worth adding for your child."
  },
  {
    slug: "are-pets-and-dirt-good-for-immunity",
    q: "Are pets and a bit of dirt actually good for my child?",
    topic: "immunity",
    video: "s5lyhtu2aXc",
    expert: "dr-elisa-song",
    ages: [0, 1, 2, 3, 4],
    quick: "Often, yes. Many studies link early, everyday exposure — pets, outdoor play, older siblings — to lower rates of allergy and asthma. It is sometimes called the “old friends” idea. It does not replace handwashing before meals and after the toilet."
  },
  {
    slug: "is-it-okay-to-kiss-my-baby",
    q: "Is it okay to kiss my baby on the face?",
    topic: "immunity",
    video: "4ddstm2d_Y4",
    expert: "dr-elisa-song",
    ages: [0, 1],
    quick: "For healthy parents, affectionate contact is part of normal bonding and shares friendly microbes. The exceptions: if you have a cold sore, a cold or flu, or your newborn is very young or unwell, keep kisses away from the face and hands until you are better."
  },
  {
    slug: "can-stress-in-pregnancy-affect-my-baby",
    q: "Can stress in pregnancy affect my baby?",
    topic: "pregnancy",
    video: "jrIRvStKeqk",
    expert: "dr-dan-sullivan",
    ages: [0],
    quick: "Research links ongoing, severe stress in pregnancy with differences in a baby’s development — but everyday worry is normal and nothing to feel guilty about. Sleep, support, gentle movement and asking for help are protective for both of you."
  },
  {
    slug: "what-should-my-babys-first-food-be",
    q: "What should my baby’s first food be?",
    topic: "first-foods",
    video: "pP6Idx8jvpw",
    expert: "dr-bill-sears",
    ages: [0, 1],
    quick: "There is no single perfect first food. Around six months, many pediatricians suggest offering a variety of iron-rich, soft foods — such as well-cooked meat or fish, beans and lentils, or an iron-fortified cereal — rather than relying on one bland cereal. In this video, Dr. Bill Sears explains why he looks beyond rice cereal. Ask your pediatrician about timing, allergens and safe textures."
  }
];

export const EPISODES_DATA: Episode[] = [
  {
    id: "wHrPcQPYiaE",
    title: "ADHD and the Gut–Brain Connection",
    guest: "dr-dan-sullivan",
    kind: "episode",
    tags: ["brain-focus", "gut-health"],
    ep: 27,
    secs: 4569,
    durationLabel: "76 min",
    slug: "adhd-and-the-gut-brain-connection",
    date: "2026-09-18"
  },
  {
    id: "w_HZCxmnNi4",
    title: "Allergies, Anxiety, ADHD and the Gut: What’s the Connection?",
    guest: "dr-elisa-song",
    kind: "episode",
    tags: ["gut-health", "allergies", "emotions", "brain-focus"],
    ep: 26,
    secs: 5741,
    durationLabel: "96 min",
    slug: "allergies-anxiety-adhd-and-the-gut-whats-the-connection",
    date: "2026-08-14"
  },
  {
    id: "SdKxjP7Uf98",
    title: "What to Feed Your Baby, and When",
    guest: "dr-bill-sears",
    kind: "episode",
    tags: ["first-foods", "omega-3s", "supplements"],
    ep: "sears",
    secs: 2989,
    durationLabel: "50 min",
    slug: "what-to-feed-your-baby-and-when",
    date: "2025-01-15"
  },
  {
    id: "sJsNza0_zRQ",
    title: "7 Things One Doctor Does to Manage His Own ADHD",
    guest: "dr-dan-sullivan",
    kind: "video",
    tags: ["brain-focus"],
    ep: 27,
    secs: 593,
    durationLabel: "9:53",
    slug: "7-things-one-doctor-does-to-manage-his-own-adhd",
    date: "2026-09-28"
  },
  {
    id: "NiYwg17ahYo",
    title: "What the Research Says About Probiotic Strains",
    guest: "dr-elisa-song",
    kind: "video",
    tags: ["gut-health", "supplements"],
    ep: 26,
    secs: 426,
    durationLabel: "7:06",
    slug: "what-the-research-says-about-probiotic-strains",
    date: "2026-09-18"
  },
  {
    id: "E1clSMEAwNk",
    title: "Antibiotics, the Gut and Eczema Flares",
    guest: "joy-mccarthy",
    kind: "video",
    tags: ["skin-eczema", "immunity"],
    ep: "mccarthy",
    secs: 377,
    durationLabel: "6:17",
    slug: "antibiotics-the-gut-and-eczema-flares",
    date: "2026-07-03"
  },
  {
    id: "-QqrASflJnE",
    title: "Foods That Support a Baby’s Growing Brain",
    guest: "dr-dan-sullivan",
    kind: "social",
    tags: ["first-foods", "omega-3s"],
    ep: 27,
    secs: 67,
    durationLabel: "1:07",
    slug: "foods-that-support-a-babys-growing-brain",
    date: "2026-09-22"
  },
  {
    id: "i6aC1YeUBCM",
    title: "5 Things Kids Can Do for Their Gut and Mood",
    guest: "dr-elisa-song",
    kind: "social",
    tags: ["gut-health", "emotions"],
    ep: 26,
    secs: 124,
    durationLabel: "2:04",
    slug: "5-things-kids-can-do-for-their-gut-and-mood",
    date: "2026-08-29"
  },
  {
    id: "5PZXSBl81lo",
    title: "The Foundation of a Child’s Microbiome",
    guest: "dr-elisa-song",
    kind: "social",
    tags: ["gut-health"],
    ep: 26,
    secs: 128,
    durationLabel: "2:08",
    slug: "the-foundation-of-a-childs-microbiome",
    date: "2026-08-25"
  }
];

