export const DEFAULT_ALERTS = [
  {
    id: 'alt-1',
    type: 'red_flag',
    title: 'Emergency triage: High fever (104.2°F) & lethargy in 7mo infant',
    meta: 'Inbound submission #sub-102 · Urgent clinical review recommended',
    time: '8 mins ago',
    unread: true,
    actionTab: 'submissions'
  },
  {
    id: 'alt-2',
    type: 'red_flag',
    title: 'Respiratory alert: Severe stridor and barking cough with retractions (2yo)',
    meta: 'Inbound submission #sub-105 · Immediate pediatrician evaluation needed',
    time: '24 mins ago',
    unread: true,
    actionTab: 'submissions'
  },
  {
    id: 'alt-3',
    type: 'submission',
    title: 'New question: "Introducing allergens with severe eczema history"',
    meta: 'From: Elena R. · Category: Food & Nutrition · Age: 4–6 months',
    time: '45 mins ago',
    unread: true,
    actionTab: 'submissions'
  },
  {
    id: 'alt-4',
    type: 'clinical',
    title: 'Medical Review Pending: "Febrile Seizures: When to Call 911"',
    meta: 'Assigned to Dr. Elisa Song · Verification draft pending for 2 days',
    time: '2 hours ago',
    unread: true,
    actionTab: 'answers'
  },
  {
    id: 'alt-5',
    type: 'security',
    title: 'Administrator session authenticated with Two-Factor Auth',
    meta: 'User: dr_murray · IP: 127.0.0.1 (macOS Chrome)',
    time: '4 hours ago',
    unread: false,
    actionTab: 'settings'
  }
];

import { SEED_VIDEOS } from './videosData';

export const SEED_DATA: any = {
  "videos": SEED_VIDEOS,
  "settings": {
    "site_title": "The First Seven Years",
    "site_tagline": "Expert answers for parents of kids 0–7",
    "canonical_domain": "https://thefirstsevenyears.com",
    "youtube_channel": "https://www.youtube.com/@thefirstsevenyears",
    "contact_email": "hello@thefirstsevenyears.com",
    "medical_disclaimer": "Educational content only. Not individual medical advice. Consult your pediatrician.",
    "brand_colors": {
      "navy": "#2B3C56",
      "mint": "#A6D6B0",
      "cream": "#FBF9F5",
      "peach": "#FAD7C4",
      "butter": "#FBE7AC",
      "lilac": "#DDD6F5",
      "soft_green": "#BFE4C6",
      "sky": "#CFE6F2"
    },
    "security": {
      "session_timeout": "30m",
      "two_factor_enabled": false,
      "last_password_change": "2026-10-09T12:00:00Z",
      "current_user_password_hash": "sha256:demo_hash"
    },
    "organization": {
      "support_phone": "+1 (800) 555-0177",
      "office_location": "Santa Barbara, CA",
      "copyright_notice": "© 2026 The First Seven Years. All rights reserved.",
      "social_twitter": "https://twitter.com/firstsevenyears",
      "social_instagram": "https://instagram.com/thefirstsevenyears",
      "social_linkedin": "https://linkedin.com/company/thefirstsevenyears"
    },
    "notifications": {
      "recipient_emails": "alerts@thefirstsevenyears.com, dr.murray@thefirstsevenyears.com",
      "emergency_sms": "+1 (800) 555-0177",
      "frequency": "instant",
      "sound_alarm": true,
      "browser_push": false,
      "email_new_submissions": true,
      "email_red_flags": true,
      "email_clinical_reminders": true,
      "video_updates": true,
      "security_logins": true
    }
  },
  "alerts": DEFAULT_ALERTS,
  "topics": [
    {
      "slug": "gut-health",
      "name": "Gut health & microbiome",
      "short": "Tummies, probiotics and the gut–brain link",
      "swatch": "#bfe4c6",
      "intro": "Much of your child’s immune system lives in the gut, and the microbes that settle there in the first years shape far more than digestion. Start here for the plain-English basics.",
      "published": true,
      "order": 1,
      "answers": [
        "is-my-childs-eczema-a-gut-problem",
        "what-is-leaky-gut",
        "prebiotics-vs-probiotics-vs-postbiotics",
        "restoring-the-gut-after-antibiotics",
        "does-my-gut-health-before-pregnancy-matter"
      ],
      "episodes": [
        "eeuP3KRgQg4",
        "NiYwg17ahYo",
        "wHrPcQPYiaE",
        "g4ejtsJj9y8",
        "Yr5B77Yp9HE",
        "VBfOpGRcS2M",
        "hqC4jyz4ZvQ",
        "bmkNG6J4YT0",
        "w_HZCxmnNi4",
        "I90rSaFzuak"
      ],
      "experts": [
        "dr-dan-sullivan",
        "dr-elisa-song",
        "joy-mccarthy"
      ],
      "main_video": "wHrPcQPYiaE",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "first-foods",
      "name": "Nutrition & first foods",
      "short": "Starting solids, balanced plates, real food",
      "swatch": "#fbe7ac",
      "intro": "From first spoonfuls to lunchbox years — how to build a varied diet without turning mealtimes into a project.",
      "published": true,
      "order": 2,
      "answers": [
        "prebiotics-vs-probiotics-vs-postbiotics"
      ],
      "episodes": [
        "Yr5B77Yp9HE"
      ],
      "experts": [
        "dr-elisa-song"
      ],
      "main_video": "Yr5B77Yp9HE",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "picky-eating",
      "name": "Picky eating",
      "short": "When they won’t eat, or only eat beige",
      "swatch": "#fad7c4",
      "intro": "Selective eating is one of the most common worries we hear. What is normal, what helps, and when to look closer.",
      "published": true,
      "order": 3,
      "answers": [],
      "episodes": [],
      "experts": [
        "dr-murray-clarke"
      ],
      "main_video": "",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "skin-eczema",
      "name": "Skin & eczema",
      "short": "Rashes, dry patches and the gut–skin link",
      "swatch": "#f6d2c9",
      "intro": "Eczema is about more than skin. Our experts explain barrier care, triggers, and where the gut fits in.",
      "published": true,
      "order": 4,
      "answers": [
        "is-my-childs-eczema-a-gut-problem",
        "is-cortisone-cream-safe-for-babies"
      ],
      "episodes": [
        "VBfOpGRcS2M",
        "E1clSMEAwNk",
        "HHG5bOnx6IU",
        "7HRqTlUyXdI",
        "wP5-4Pu094s",
        "I90rSaFzuak"
      ],
      "experts": [
        "dr-elisa-song",
        "joy-mccarthy"
      ],
      "main_video": "VBfOpGRcS2M",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "allergies",
      "name": "Allergies",
      "short": "Food allergy, hay fever and early prevention",
      "swatch": "#ddd6f5",
      "intro": "What research now says about early exposure, and how to tell an allergy from an intolerance.",
      "published": true,
      "order": 5,
      "answers": [
        "what-is-leaky-gut",
        "are-pets-and-dirt-good-for-immunity"
      ],
      "episodes": [
        "s5lyhtu2aXc",
        "w_HZCxmnNi4"
      ],
      "experts": [
        "dr-elisa-song"
      ],
      "main_video": "w_HZCxmnNi4",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "immunity",
      "name": "Immunity & everyday illness",
      "short": "Colds, fevers, antibiotics and bouncing back",
      "swatch": "#cfe6f2",
      "intro": "Coughs, colds and the endless nursery bugs — building resilience, and knowing when to call the doctor.",
      "published": true,
      "order": 6,
      "answers": [
        "restoring-the-gut-after-antibiotics",
        "are-pets-and-dirt-good-for-immunity",
        "is-it-okay-to-kiss-my-baby"
      ],
      "episodes": [
        "4ddstm2d_Y4",
        "s5lyhtu2aXc",
        "hqC4jyz4ZvQ",
        "maCarlEllC4",
        "E1clSMEAwNk"
      ],
      "experts": [
        "dr-elisa-song",
        "joy-mccarthy"
      ],
      "main_video": "4ddstm2d_Y4",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "brain-focus",
      "name": "Brain, focus & ADHD",
      "short": "Attention, learning and the gut–brain axis",
      "swatch": "#e3dcf7",
      "intro": "Why attention differences are being diagnosed more often, and the daily habits that support a developing brain.",
      "published": true,
      "order": 7,
      "answers": [
        "can-stress-in-pregnancy-affect-my-baby",
        "why-are-adhd-diagnoses-rising"
      ],
      "episodes": [
        "sJsNza0_zRQ",
        "jrIRvStKeqk",
        "W1VViQ8goFk",
        "wHrPcQPYiaE",
        "w_HZCxmnNi4",
        "_V-l7iVzZII",
        "ICUVBCs9ejk",
        "HvaWCG7fPzk",
        "WtRxQB2KYNk"
      ],
      "experts": [
        "dr-dan-sullivan",
        "dr-elisa-song",
        "erinn-askin"
      ],
      "main_video": "wHrPcQPYiaE",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "autism-development",
      "name": "Autism & development",
      "short": "Milestones, differences and support",
      "swatch": "#d6ecdf",
      "intro": "Understanding developmental differences early, and the range of support families are exploring.",
      "published": true,
      "order": 8,
      "answers": [],
      "episodes": [
        "p6zHpTHi1bY",
        "vfC7sUx5d6M",
        "GHztowhZtAw",
        "esmbFJNha9c",
        "WtRxQB2KYNk"
      ],
      "experts": [
        "erinn-askin"
      ],
      "main_video": "WtRxQB2KYNk",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "sleep",
      "name": "Sleep",
      "short": "Bedtimes, night waking and routines",
      "swatch": "#d9dff3",
      "intro": "Sleep drives mood, growth and immunity. Gentle, realistic approaches for tired families.",
      "published": true,
      "order": 9,
      "answers": [],
      "episodes": [
        "HvaWCG7fPzk"
      ],
      "experts": [
        "erinn-askin"
      ],
      "main_video": "HvaWCG7fPzk",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "emotions",
      "name": "Emotions & behaviour",
      "short": "Big feelings, tantrums and resilience",
      "swatch": "#fde2c8",
      "intro": "Meltdowns are normal — here is what is happening in the brain, and how to help a child find calm.",
      "published": true,
      "order": 10,
      "answers": [],
      "episodes": [
        "w_HZCxmnNi4"
      ],
      "experts": [
        "dr-elisa-song"
      ],
      "main_video": "w_HZCxmnNi4",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "pregnancy",
      "name": "Pregnancy & preconception",
      "short": "Setting up the first seven years before day one",
      "swatch": "#f7d9e3",
      "intro": "A child’s health story starts before birth. What matters in preconception and pregnancy — without the guilt.",
      "published": true,
      "order": 11,
      "answers": [
        "can-stress-in-pregnancy-affect-my-baby",
        "does-my-gut-health-before-pregnancy-matter"
      ],
      "episodes": [
        "jrIRvStKeqk",
        "wHrPcQPYiaE",
        "VBfOpGRcS2M",
        "bmkNG6J4YT0"
      ],
      "experts": [
        "dr-dan-sullivan",
        "dr-elisa-song"
      ],
      "main_video": "wHrPcQPYiaE",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "supplements",
      "name": "Supplements",
      "short": "What kids actually need, and what they don’t",
      "swatch": "#f3ecdf",
      "intro": "Food first — then an honest look at where vitamin D, omega-3s, probiotics and others may fit.",
      "published": true,
      "order": 12,
      "answers": [
        "prebiotics-vs-probiotics-vs-postbiotics"
      ],
      "episodes": [
        "NiYwg17ahYo",
        "Yr5B77Yp9HE",
        "HHG5bOnx6IU"
      ],
      "experts": [
        "dr-elisa-song",
        "joy-mccarthy"
      ],
      "main_video": "NiYwg17ahYo",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "slug": "emerging-therapies",
      "name": "New & emerging therapies",
      "short": "Light therapy, brain mapping and the research",
      "swatch": "#e6ecd0",
      "intro": "Clear-eyed conversations about newer approaches families are asking about — what the evidence says, and what it doesn’t yet.",
      "published": true,
      "order": 13,
      "answers": [],
      "episodes": [
        "p6zHpTHi1bY",
        "_V-l7iVzZII",
        "2GnkeYKhoH0",
        "vfC7sUx5d6M",
        "GHztowhZtAw",
        "K6fQ5S67huk",
        "ICUVBCs9ejk",
        "WtRxQB2KYNk"
      ],
      "experts": [
        "erinn-askin"
      ],
      "main_video": "WtRxQB2KYNk",
      "ages": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    }
  ],
  "answers": [
    {
      "slug": "is-my-childs-eczema-a-gut-problem",
      "q": "Is my child’s eczema really a gut problem?",
      "topic": "skin-eczema",
      "also": [
        "gut-health"
      ],
      "video": "I90rSaFzuak",
      "expert": "joy-mccarthy",
      "ages": [
        0,
        1,
        2,
        3
      ],
      "quick": "Partly — and it is worth knowing why. Eczema happens when the skin barrier is leaky and the immune system over-reacts. Research increasingly links both to the gut microbiome, especially in the first years of life. Good skin care still comes first; supporting the gut can sit alongside it.",
      "body": "\n<h2>What eczema actually is</h2>\n<p>Eczema (atopic dermatitis) is a combination of two things: skin that does not hold moisture well, and an immune system that reacts strongly to everyday triggers. The result is the dry, itchy, inflamed patches most parents recognise — often in the creases of elbows and knees, or on the cheeks in babies.</p>\n<h2>Where the gut comes in</h2>\n<p>Most of the immune system is trained in the gut during the first years of life. Studies have found differences in the gut bacteria of babies who go on to develop eczema, and early-life factors that shape the microbiome — such as birth by C-section or early antibiotics — are associated with a higher chance of eczema. This is what people mean by the <em>gut–skin axis</em>.</p>\n<p>That does not mean eczema is <em>only</em> a gut problem, or that changing diet alone will clear it. It means the gut is one lever among several.</p>\n<h2>What parents can reasonably do</h2>\n<ul>\n  <li><strong>Protect the skin barrier every day.</strong> Short lukewarm baths, then a thick fragrance-free moisturiser within a few minutes.</li>\n  <li><strong>Notice triggers.</strong> Heat, sweat, scratchy fabrics, soaps and sometimes specific foods can all flare skin.</li>\n  <li><strong>Feed the microbiome.</strong> A varied diet with fibre from fruit, vegetables, oats and beans, plus fermented foods such as plain yogurt if your child tolerates them.</li>\n  <li><strong>Ask before you add.</strong> Probiotics have mixed evidence for eczema — talk to your pediatrician about whether a specific product makes sense for your child.</li>\n</ul>\n<h2>When to see your doctor</h2>\n<p>Book an appointment if the skin is weeping, crusting or very red (it may be infected), if your child has a fever alongside a flare, if eczema is disturbing sleep, or if it is not improving with good daily care. Never stop a prescribed treatment without speaking to your doctor first.</p>",
      "published": true,
      "reviewed": "2026-09-25",
      "clinical_status": "Reviewed"
    },
    {
      "slug": "what-is-leaky-gut",
      "q": "What is “leaky gut”, really?",
      "topic": "gut-health",
      "also": [
        "allergies"
      ],
      "video": "g4ejtsJj9y8",
      "expert": "dr-elisa-song",
      "ages": [
        2,
        3,
        4,
        5
      ],
      "quick": "“Leaky gut” describes a gut lining that lets more through than it should — researchers call it increased intestinal permeability. It is measurable in studies, but it is not a diagnosis on its own. Think of it as one way gut health may connect to allergies, skin and mood.",
      "body": "",
      "published": true,
      "reviewed": "2026-09-24",
      "clinical_status": "Reviewed"
    },
    {
      "slug": "prebiotics-vs-probiotics-vs-postbiotics",
      "q": "Prebiotics, probiotics, postbiotics — what’s the difference?",
      "topic": "gut-health",
      "also": [
        "supplements",
        "first-foods"
      ],
      "video": "Yr5B77Yp9HE",
      "expert": "dr-elisa-song",
      "ages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "quick": "Probiotics are live, helpful microbes. Prebiotics are the fibres that feed them. Postbiotics are the useful compounds those microbes make. For most children, foods are the easiest place to start: yogurt or kefir, oats, bananas, beans and a wide variety of plants.",
      "body": "",
      "published": true,
      "reviewed": "2026-09-23",
      "clinical_status": "Reviewed"
    },
    {
      "slug": "restoring-the-gut-after-antibiotics",
      "q": "How do I help my child’s gut recover after antibiotics?",
      "topic": "gut-health",
      "also": [
        "immunity"
      ],
      "video": "hqC4jyz4ZvQ",
      "expert": "dr-elisa-song",
      "ages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "quick": "First, antibiotics are sometimes essential — always finish the course you were prescribed. Afterwards, a varied, fibre-rich diet, fermented foods if tolerated, plenty of water and time all help the microbiome rebuild. Ask your pediatrician whether a probiotic is worth adding for your child.",
      "body": "",
      "published": true,
      "reviewed": "2026-09-22",
      "clinical_status": "Reviewed"
    },
    {
      "slug": "are-pets-and-dirt-good-for-immunity",
      "q": "Are pets and a bit of dirt actually good for my child?",
      "topic": "immunity",
      "also": [
        "allergies"
      ],
      "video": "s5lyhtu2aXc",
      "expert": "dr-elisa-song",
      "ages": [
        0,
        1,
        2,
        3,
        4
      ],
      "quick": "Often, yes. Many studies link early, everyday exposure — pets, outdoor play, older siblings — to lower rates of allergy and asthma. It is sometimes called the “old friends” idea. It does not replace handwashing before meals and after the toilet.",
      "body": "",
      "published": true,
      "reviewed": "2026-09-21",
      "clinical_status": "Reviewed"
    },
    {
      "slug": "is-it-okay-to-kiss-my-baby",
      "q": "Is it okay to kiss my baby on the face?",
      "topic": "immunity",
      "also": [],
      "video": "4ddstm2d_Y4",
      "expert": "dr-elisa-song",
      "ages": [
        0,
        1
      ],
      "quick": "For healthy parents, affectionate contact is part of normal bonding and shares friendly microbes. The exceptions: if you have a cold sore, a cold or flu, or your newborn is very young or unwell, keep kisses away from the face and hands until you are better.",
      "body": "",
      "published": true,
      "reviewed": "2026-09-20",
      "clinical_status": "Reviewed"
    },
    {
      "slug": "can-stress-in-pregnancy-affect-my-baby",
      "q": "Can stress in pregnancy affect my baby?",
      "topic": "pregnancy",
      "also": [
        "brain-focus"
      ],
      "video": "jrIRvStKeqk",
      "expert": "dr-dan-sullivan",
      "ages": [
        0
      ],
      "quick": "Research links ongoing, severe stress in pregnancy with differences in a baby’s development — but everyday worry is normal and nothing to feel guilty about. Sleep, support, gentle movement and asking for help are protective for both of you.",
      "body": "",
      "published": true,
      "reviewed": "2026-09-19",
      "clinical_status": "Reviewed"
    },
    {
      "slug": "does-my-gut-health-before-pregnancy-matter",
      "q": "Does my own gut health before pregnancy matter?",
      "topic": "pregnancy",
      "also": [
        "gut-health"
      ],
      "video": "bmkNG6J4YT0",
      "expert": "dr-elisa-song",
      "ages": [
        0
      ],
      "quick": "It is part of the story. Babies pick up their first microbes from their mother — through birth, feeding and close contact. Eating a varied, fibre-rich diet and looking after your own health before and during pregnancy all count.",
      "body": "",
      "published": true,
      "reviewed": "2026-09-18",
      "clinical_status": "Reviewed"
    },
    {
      "slug": "why-are-adhd-diagnoses-rising",
      "q": "Why are ADHD diagnoses rising?",
      "topic": "brain-focus",
      "also": [],
      "video": "W1VViQ8goFk",
      "expert": "dr-dan-sullivan",
      "ages": [
        4,
        5,
        6,
        7
      ],
      "quick": "Partly because awareness and screening have improved. Researchers are also looking at sleep, screens, diet and the gut–brain axis. In this clip, Dr. Dan Sullivan shares his view on what has changed — and what parents can do day to day.",
      "body": "",
      "published": true,
      "reviewed": "2026-09-17",
      "clinical_status": "Reviewed"
    },
    {
      "slug": "is-cortisone-cream-safe-for-babies",
      "q": "Is cortisone cream okay for my baby’s eczema?",
      "topic": "skin-eczema",
      "also": [],
      "video": "wP5-4Pu094s",
      "expert": "joy-mccarthy",
      "ages": [
        0,
        1,
        2
      ],
      "quick": "Low-strength steroid creams are widely prescribed and can be appropriate for short flares. In this clip, Joy McCarthy explains why she also looks at gentle skin care and gut support. Talk to your pediatrician before stopping or changing anything prescribed.",
      "body": "",
      "published": true,
      "reviewed": "2026-09-16",
      "clinical_status": "Reviewed"
    }
  ],
  "faqs": [
    {
      "id": "faq-1",
      "category": "About The Series",
      "topic": "about",
      "question": "What is The First Seven Years?",
      "answer": "The First Seven Years is a multi-media knowledge library and podcast hosted by Dr. Murray Clarke and Bryce Wylde. It focuses on the crucial developmental years from age 0 to 7, exploring nutrition, gut health, sleep, development, and pediatric wellness.",
      "order": 1,
      "published": true
    },
    {
      "id": "faq-2",
      "category": "Clinical & Medical",
      "topic": "about",
      "question": "Is this content a substitute for pediatric medical care?",
      "answer": "No. All content on The First Seven Years is educational and informative. It does not constitute individual medical advice or diagnosis. Always consult your qualified pediatrician or family doctor for your child’s specific symptoms.",
      "order": 2,
      "published": true
    },
    {
      "id": "faq-3",
      "category": "Ask the Doctor",
      "topic": "ask-the-doctor",
      "question": "How does Dr. Murray choose which questions to answer?",
      "answer": "Dr. Murray and the clinical team review every inbound parent question. Questions addressing common challenges or emerging topics are turned into parent answers and podcast segments for the whole community.",
      "order": 3,
      "published": true
    },
    {
      "id": "faq-4",
      "category": "The Book",
      "topic": "book",
      "question": "When is Dr. Murray Clarke’s upcoming book being released?",
      "answer": "The book is currently in production for release in 2027. You can join the priority waitlist on our book page to receive early sample chapters and launch updates.",
      "order": 4,
      "published": true
    },
    {
      "id": "faq-5",
      "category": "Topics & Content",
      "topic": "gut-health",
      "question": "Why is so much emphasis placed on the gut microbiome?",
      "answer": "Up to 70% of a child’s immune system is trained in the gut. Modern research reveals deep connections between the early microbiome and childhood allergies, eczema, mood, and cognitive development.",
      "order": 5,
      "published": true
    }
  ],
  "episodes": [
    {
      "id": "sJsNza0_zRQ",
      "title": "7 Things One Doctor Does to Manage His Own ADHD",
      "guest": "dr-dan-sullivan",
      "kind": "clip",
      "tags": [
        "brain-focus"
      ],
      "ep": 27,
      "slug": "7-things-one-doctor-does-to-manage-his-own-adhd",
      "date": "2026-09-26",
      "published": true
    },
    {
      "id": "eeuP3KRgQg4",
      "title": "What Actually Starts Leaky Gut?",
      "guest": "dr-dan-sullivan",
      "kind": "clip",
      "tags": [
        "gut-health"
      ],
      "ep": 27,
      "slug": "what-actually-starts-leaky-gut",
      "date": "2026-09-24",
      "published": true
    },
    {
      "id": "jrIRvStKeqk",
      "title": "Can Stress in Pregnancy Affect Baby’s Brain?",
      "guest": "dr-dan-sullivan",
      "kind": "clip",
      "tags": [
        "pregnancy",
        "brain-focus"
      ],
      "ep": 27,
      "slug": "can-stress-in-pregnancy-affect-babys-brain",
      "date": "2026-09-22",
      "published": true
    },
    {
      "id": "W1VViQ8goFk",
      "title": "ADHD Hit 11% of Kids. What Changed?",
      "guest": "dr-dan-sullivan",
      "kind": "clip",
      "tags": [
        "brain-focus"
      ],
      "ep": 27,
      "slug": "adhd-hit-11-percent-of-kids-what-changed",
      "date": "2026-09-20",
      "published": true
    },
    {
      "id": "NiYwg17ahYo",
      "title": "The One Probiotic Strain Backed by Decades of Research",
      "guest": "dr-elisa-song",
      "kind": "clip",
      "tags": [
        "gut-health",
        "supplements"
      ],
      "ep": 26,
      "slug": "the-one-probiotic-strain-backed-by-decades-of-research",
      "date": "2026-09-18",
      "published": true
    },
    {
      "id": "wHrPcQPYiaE",
      "title": "Could Your Child’s ADHD Start in the Gut?",
      "guest": "dr-dan-sullivan",
      "kind": "ep",
      "tags": [
        "brain-focus",
        "gut-health",
        "pregnancy"
      ],
      "ep": 27,
      "slug": "could-your-childs-adhd-start-in-the-gut",
      "date": "2026-09-16",
      "published": true
    },
    {
      "id": "g4ejtsJj9y8",
      "title": "What Is Leaky Gut, Really? A Pediatrician Explains",
      "guest": "dr-elisa-song",
      "kind": "clip",
      "tags": [
        "gut-health"
      ],
      "ep": 26,
      "slug": "what-is-leaky-gut-really-a-pediatrician-explains",
      "date": "2026-09-14",
      "published": true
    },
    {
      "id": "4ddstm2d_Y4",
      "title": "Should You Still Be Kissing Your Kids? A Pediatrician Weighs In",
      "guest": "dr-elisa-song",
      "kind": "clip",
      "tags": [
        "immunity"
      ],
      "ep": 26,
      "slug": "should-you-still-be-kissing-your-kids-a-pediatrician-weighs-in",
      "date": "2026-09-12",
      "published": true
    },
    {
      "id": "Yr5B77Yp9HE",
      "title": "Prebiotics vs. Probiotics vs. Postbiotics, Finally Explained Simply",
      "guest": "dr-elisa-song",
      "kind": "clip",
      "tags": [
        "gut-health",
        "supplements",
        "first-foods"
      ],
      "ep": 26,
      "slug": "prebiotics-vs-probiotics-vs-postbiotics-finally-explained-simply",
      "date": "2026-09-10",
      "published": true
    },
    {
      "id": "s5lyhtu2aXc",
      "title": "Why Pets and Dirt Actually Build Your Child’s Immune System",
      "guest": "dr-elisa-song",
      "kind": "clip",
      "tags": [
        "immunity",
        "allergies"
      ],
      "ep": 26,
      "slug": "why-pets-and-dirt-actually-build-your-childs-immune-system",
      "date": "2026-09-08",
      "published": true
    },
    {
      "id": "VBfOpGRcS2M",
      "title": "This Study Cut Eczema Risk by 83% in C-Section Babies",
      "guest": "dr-elisa-song",
      "kind": "clip",
      "tags": [
        "skin-eczema",
        "pregnancy",
        "gut-health"
      ],
      "ep": 26,
      "slug": "this-study-cut-eczema-risk-by-83-percent-in-c-section-babies",
      "date": "2026-09-06",
      "published": true
    },
    {
      "id": "hqC4jyz4ZvQ",
      "title": "How to Restore Your Child’s Gut Microbiome After Antibiotics",
      "guest": "dr-elisa-song",
      "kind": "clip",
      "tags": [
        "gut-health",
        "immunity"
      ],
      "ep": 26,
      "slug": "how-to-restore-your-childs-gut-microbiome-after-antibiotics",
      "date": "2026-09-04",
      "published": true
    },
    {
      "id": "bmkNG6J4YT0",
      "title": "The Microbiome Before Conception Is Shaping Your Child’s Health",
      "guest": "dr-elisa-song",
      "kind": "clip",
      "tags": [
        "pregnancy",
        "gut-health"
      ],
      "ep": 26,
      "slug": "the-microbiome-before-conception-is-shaping-your-childs-health",
      "date": "2026-09-02",
      "published": true
    },
    {
      "id": "maCarlEllC4",
      "title": "Why Nearly 1 in 2 Kids Now Have a Chronic Illness",
      "guest": "dr-elisa-song",
      "kind": "clip",
      "tags": [
        "immunity"
      ],
      "ep": 26,
      "slug": "why-nearly-1-in-2-kids-now-have-a-chronic-illness",
      "date": "2026-08-31",
      "published": true
    },
    {
      "id": "p6zHpTHi1bY",
      "title": "Is Brain Laser Therapy Safe for a 3-Year-Old With Autism?",
      "guest": "erinn-askin",
      "kind": "clip",
      "tags": [
        "emerging-therapies",
        "autism-development"
      ],
      "ep": 25,
      "slug": "is-brain-laser-therapy-safe-for-a-3-year-old-with-autism",
      "date": "2026-08-29",
      "published": true
    },
    {
      "id": "w_HZCxmnNi4",
      "title": "Why Your Child’s Allergies, Anxiety and ADHD Might Start in the Gut",
      "guest": "dr-elisa-song",
      "kind": "ep",
      "tags": [
        "gut-health",
        "allergies",
        "emotions",
        "brain-focus"
      ],
      "ep": 26,
      "slug": "why-your-childs-allergies-anxiety-and-adhd-might-start-in-the-gut",
      "date": "2026-08-27",
      "published": true
    },
    {
      "id": "_V-l7iVzZII",
      "title": "How Laser Therapy Helped Him Become a Student for the First Time",
      "guest": "erinn-askin",
      "kind": "clip",
      "tags": [
        "emerging-therapies",
        "brain-focus"
      ],
      "ep": 25,
      "slug": "how-laser-therapy-helped-him-become-a-student-for-the-first-time",
      "date": "2026-08-25",
      "published": true
    },
    {
      "id": "2GnkeYKhoH0",
      "title": "This Laser Therapy Compresses 6 Months of Progress Into 2 Weeks",
      "guest": "erinn-askin",
      "kind": "clip",
      "tags": [
        "emerging-therapies"
      ],
      "ep": 25,
      "slug": "this-laser-therapy-compresses-6-months-of-progress-into-2-weeks",
      "date": "2026-08-23",
      "published": true
    },
    {
      "id": "vfC7sUx5d6M",
      "title": "What’s the Youngest Age for Laser Brain Therapy?",
      "guest": "erinn-askin",
      "kind": "clip",
      "tags": [
        "emerging-therapies",
        "autism-development"
      ],
      "ep": 25,
      "slug": "whats-the-youngest-age-for-laser-brain-therapy",
      "date": "2026-08-21",
      "published": true
    },
    {
      "id": "GHztowhZtAw",
      "title": "This 6-Minute Brain Scan Found What No One Else Could",
      "guest": "erinn-askin",
      "kind": "clip",
      "tags": [
        "emerging-therapies",
        "autism-development"
      ],
      "ep": 25,
      "slug": "this-6-minute-brain-scan-found-what-no-one-else-could",
      "date": "2026-08-19",
      "published": true
    },
    {
      "id": "K6fQ5S67huk",
      "title": "The Study That Turned Lasers Into Brain Therapy",
      "guest": "erinn-askin",
      "kind": "clip",
      "tags": [
        "emerging-therapies"
      ],
      "ep": 25,
      "slug": "the-study-that-turned-lasers-into-brain-therapy",
      "date": "2026-08-17",
      "published": true
    },
    {
      "id": "ICUVBCs9ejk",
      "title": "The Science of How Light Therapy Rewires a Child’s Brain",
      "guest": "erinn-askin",
      "kind": "clip",
      "tags": [
        "emerging-therapies",
        "brain-focus"
      ],
      "ep": 25,
      "slug": "the-science-of-how-light-therapy-rewires-a-childs-brain",
      "date": "2026-08-15",
      "published": true
    },
    {
      "id": "HvaWCG7fPzk",
      "title": "The 12-Minute Nightly Routine That Changed Her Daughter’s Severe ADHD",
      "guest": "erinn-askin",
      "kind": "clip",
      "tags": [
        "brain-focus",
        "sleep"
      ],
      "ep": 25,
      "slug": "the-12-minute-nightly-routine-that-changed-her-daughters-severe-adhd",
      "date": "2026-08-13",
      "published": true
    },
    {
      "id": "esmbFJNha9c",
      "title": "Why 1 in 31 Kids Now Have Autism",
      "guest": "erinn-askin",
      "kind": "clip",
      "tags": [
        "autism-development"
      ],
      "ep": 25,
      "slug": "why-1-in-31-kids-now-have-autism",
      "date": "2026-08-11",
      "published": true
    },
    {
      "id": "WtRxQB2KYNk",
      "title": "Why Traditional Therapy Isn’t Reaching the Root Cause of Autism and ADHD",
      "guest": "erinn-askin",
      "kind": "ep",
      "tags": [
        "autism-development",
        "brain-focus",
        "emerging-therapies"
      ],
      "ep": 25,
      "slug": "why-traditional-therapy-isnt-reaching-the-root-cause-of-autism-and-adh",
      "date": "2026-08-09",
      "published": true
    },
    {
      "id": "E1clSMEAwNk",
      "title": "The Real Reason Your Child’s Eczema Gets Worse After Every Antibiotic",
      "guest": "joy-mccarthy",
      "kind": "clip",
      "tags": [
        "skin-eczema",
        "immunity"
      ],
      "ep": null,
      "slug": "the-real-reason-your-childs-eczema-gets-worse-after-every-antibiotic",
      "date": "2026-08-07",
      "published": true
    },
    {
      "id": "HHG5bOnx6IU",
      "title": "The Supplements & Foods That Can Help Clear Eczema in Children",
      "guest": "joy-mccarthy",
      "kind": "clip",
      "tags": [
        "skin-eczema",
        "supplements"
      ],
      "ep": null,
      "slug": "the-supplements-and-foods-that-can-help-clear-eczema-in-children",
      "date": "2026-08-05",
      "published": true
    },
    {
      "id": "7HRqTlUyXdI",
      "title": "The Tests Your Doctor Isn’t Running for Eczema",
      "guest": "joy-mccarthy",
      "kind": "clip",
      "tags": [
        "skin-eczema"
      ],
      "ep": null,
      "slug": "the-tests-your-doctor-isnt-running-for-eczema",
      "date": "2026-08-03",
      "published": true
    },
    {
      "id": "wP5-4Pu094s",
      "title": "Why Cortisone Cream Backfires & What to Use on Your Baby’s Skin",
      "guest": "joy-mccarthy",
      "kind": "clip",
      "tags": [
        "skin-eczema"
      ],
      "ep": null,
      "slug": "why-cortisone-cream-backfires-and-what-to-use-on-your-babys-skin",
      "date": "2026-08-01",
      "published": true
    },
    {
      "id": "I90rSaFzuak",
      "title": "Why Your Child’s Eczema Is a Gut Problem, Not a Skin Problem",
      "guest": "joy-mccarthy",
      "kind": "clip",
      "tags": [
        "skin-eczema",
        "gut-health"
      ],
      "ep": null,
      "slug": "why-your-childs-eczema-is-a-gut-problem-not-a-skin-problem",
      "date": "2026-07-30",
      "published": true
    }
  ],
  "experts": {
    "dr-murray-clarke": {
      "slug": "dr-murray-clarke",
      "name": "Dr. Murray Clarke",
      "role": "Host · The First Seven Years",
      "img": "/assets/img/dr-murray-clarke.jpg",
      "swatch": "#a6d6b0",
      "short": "Host of The First Seven Years and the doctor who answers your questions.",
      "bio": [
        "Dr. Murray Clarke has spent decades focused on one question: what gives a child the strongest possible start? His work sits where nutrition, the gut and a child’s developing brain meet — and he has a knack for explaining it in the language parents actually use.",
        "On The First Seven Years he hosts long-form conversations with pediatricians, researchers and practitioners, then distils them into short, practical answers. Through Ask the Doctor, he answers parents’ questions directly — the most common become new answers in this library."
      ],
      "creds": [
        "Host of The First Seven Years podcast and video series",
        "Answers parent questions through Ask the Doctor",
        "Focus: children’s nutrition, gut health and integrative care"
      ],
      "same": [
        "https://www.youtube.com/@thefirstsevenyears"
      ],
      "published": true
    },
    "bryce-wylde": {
      "slug": "bryce-wylde",
      "name": "Bryce Wylde",
      "role": "Co-host · Functional medicine",
      "img": null,
      "swatch": "#fbe7ac",
      "short": "Co-host, and a functional medicine expert with a researcher’s eye.",
      "bio": [
        "Bryce Wylde co-hosts The First Seven Years, bringing a functional medicine lens to each conversation — asking the follow-up questions a curious parent would, and pressing guests on the evidence."
      ],
      "creds": [
        "Co-host of The First Seven Years",
        "Functional medicine expert"
      ],
      "same": [],
      "published": true
    },
    "dr-dan-sullivan": {
      "slug": "dr-dan-sullivan",
      "name": "Dr. Dan Sullivan",
      "role": "Guest · Episode 27",
      "img": null,
      "swatch": "#ddd6f5",
      "short": "Guest on Episode 27 — ADHD, stress and the gut.",
      "bio": [
        "Dr. Dan Sullivan joined the show to talk about why ADHD diagnoses are rising, how stress in pregnancy may shape a baby’s brain, and what he does to manage his own ADHD."
      ],
      "creds": [
        "Guest, Episode 27"
      ],
      "same": [],
      "published": true
    },
    "dr-elisa-song": {
      "slug": "dr-elisa-song",
      "name": "Dr. Elisa Song",
      "role": "Guest · Episode 26 · Integrative pediatrician",
      "img": null,
      "swatch": "#bfe4c6",
      "short": "Integrative pediatrician; guest on Episode 26 — the gut behind allergies, anxiety and ADHD.",
      "bio": [
        "Dr. Elisa Song is an integrative pediatrician. On Episode 26 she explains the microbiome in terms any parent can use — from prebiotics versus probiotics to restoring the gut after antibiotics."
      ],
      "creds": [
        "Integrative pediatrician",
        "Guest, Episode 26"
      ],
      "same": [],
      "published": true
    },
    "erinn-askin": {
      "slug": "erinn-askin",
      "name": "Erinn Askin",
      "role": "Guest · Episode 25",
      "img": null,
      "swatch": "#e6ecd0",
      "short": "Guest on Episode 25 — brain mapping and light therapy for autism and ADHD.",
      "bio": [
        "Erinn Askin joined the show to talk about brain mapping, light-based therapies and the routines families use alongside them."
      ],
      "creds": [
        "Guest, Episode 25"
      ],
      "same": [],
      "published": true
    },
    "joy-mccarthy": {
      "slug": "joy-mccarthy",
      "name": "Joy McCarthy",
      "role": "Guest · Holistic nutritionist",
      "img": null,
      "swatch": "#fad7c4",
      "short": "Holistic nutritionist; guest on eczema and the gut–skin connection.",
      "bio": [
        "Joy McCarthy is a holistic nutritionist. Her conversation with the show focuses on children’s eczema — why it is so often a gut story, and gentle ways to care for skin."
      ],
      "creds": [
        "Holistic nutritionist",
        "Guest on eczema and skin health"
      ],
      "same": [],
      "published": true
    }
  },
  "users": [
    {
      "id": "usr-1",
      "name": "Dr. Murray Clarke",
      "email": "murray@thefirstsevenyears.com",
      "role": "super_admin",
      "status": "Active",
      "last_active": "Just now",
      "permissions": {
        "dashboard": "edit",
        "topics": "edit",
        "answers": "edit",
        "faqs": "edit",
        "videos": "edit",
        "submissions": "edit",
        "experts": "edit",
        "pages": "edit",
        "menus": "edit",
        "roles": "edit",
        "settings": "edit"
      }
    },
    {
      "id": "usr-2",
      "name": "Bryce Wylde",
      "email": "bryce@thefirstsevenyears.com",
      "role": "editor",
      "status": "Active",
      "last_active": "2 hours ago",
      "permissions": {
        "dashboard": "view",
        "topics": "edit",
        "answers": "edit",
        "faqs": "edit",
        "videos": "edit",
        "submissions": "view",
        "experts": "edit",
        "pages": "edit",
        "menus": "edit",
        "roles": "hide",
        "settings": "hide"
      }
    },
    {
      "id": "usr-3",
      "name": "Dr. Elisa Song",
      "email": "dr.song@thefirstsevenyears.com",
      "role": "clinical_reviewer",
      "status": "Active",
      "last_active": "Yesterday",
      "permissions": {
        "dashboard": "view",
        "topics": "view",
        "answers": "edit",
        "faqs": "view",
        "videos": "view",
        "submissions": "edit",
        "experts": "view",
        "pages": "view",
        "menus": "hide",
        "roles": "hide",
        "settings": "hide"
      }
    },
    {
      "id": "usr-4",
      "name": "Sarah Jenkins",
      "email": "sarah.j@thefirstsevenyears.com",
      "role": "author",
      "status": "Active",
      "last_active": "3 days ago",
      "permissions": {
        "dashboard": "view",
        "topics": "view",
        "answers": "edit",
        "faqs": "edit",
        "videos": "view",
        "submissions": "hide",
        "experts": "view",
        "pages": "hide",
        "menus": "hide",
        "roles": "hide",
        "settings": "hide"
      }
    }
  ],
  "roles": {
    "super_admin": {
      "name": "Super Admin",
      "desc": "Unrestricted control over all content, settings, users, and deployment",
      "permissions": [
        "manage_topics",
        "manage_answers",
        "manage_faqs",
        "manage_videos",
        "manage_experts",
        "manage_pages",
        "manage_menus",
        "publish_content",
        "review_clinical",
        "manage_settings",
        "manage_users",
        "rebuild_site"
      ]
    },
    "editor": {
      "name": "Editor",
      "desc": "Can create, edit, and publish/unpublish all content and videos",
      "permissions": [
        "manage_topics",
        "manage_answers",
        "manage_faqs",
        "manage_videos",
        "manage_experts",
        "manage_pages",
        "manage_menus",
        "publish_content",
        "review_clinical",
        "rebuild_site"
      ]
    },
    "clinical_reviewer": {
      "name": "Medical Reviewer",
      "desc": "Clinical oversight: can verify medical accuracy, set review dates, and edit answers",
      "permissions": [
        "manage_answers",
        "review_clinical"
      ]
    },
    "author": {
      "name": "Author / Contributor",
      "desc": "Can draft questions, answers, and FAQs (saved as unpublished drafts)",
      "permissions": [
        "draft_content"
      ]
    }
  },
  "ask_submissions": [
    {
      "id": "sub-1791536895294",
      "parent_name": "Test Parent",
      "child_age": "2 years",
      "email": "test@parent.com",
      "topic": "immunity",
      "topics": [
        "immunity",
        "gut-health"
      ],
      "question": "My toddler has a high fever of 103 and is lethargic",
      "date": "2026-10-09T14:38:15.294941",
      "status": "Red Flag Triaged",
      "red_flag": true,
      "notes": "Automated triage flag triggered."
    },
    {
      "id": "sub-101",
      "parent_name": "Claire Davies",
      "child_age": "18 months",
      "email": "claire.d88@gmail.com",
      "topic": "picky-eating",
      "topics": [
        "picky-eating",
        "first-foods",
        "gut-health"
      ],
      "question": "My 18-month-old suddenly refuses all green vegetables and will only eat beige foods (toast, pasta, cheese). How can I introduce nutrients without causing mealtimes to turn into a battle?",
      "date": "2026-10-08T09:15:00",
      "status": "New",
      "red_flag": false,
      "notes": "Great candidate for a parent answer video clip with Dr. Murray."
    },
    {
      "id": "sub-102",
      "parent_name": "Marcus Vance",
      "child_age": "3 years",
      "email": "m.vance@outlook.com",
      "topic": "sleep",
      "topics": [
        "sleep",
        "gut-health",
        "emotions"
      ],
      "question": "Our 3yo wakes up 3-4 times every single night screaming and sweating. We tried routine changes. Could gut discomfort or food sensitivities be disturbing his sleep cycles?",
      "date": "2026-10-07T18:40:00",
      "status": "In Review",
      "red_flag": false,
      "notes": "Assigned to Dr. Elisa Song for gut-sleep link insights."
    },
    {
      "id": "sub-103",
      "parent_name": "Hannah Lin",
      "child_age": "7 months",
      "email": "hannah.lin@yahoo.com",
      "topic": "skin-eczema",
      "topics": [
        "skin-eczema",
        "allergies",
        "immunity"
      ],
      "question": "Baby has severe weeping rash over cheeks and torso with mild 100.8 fever after starting egg puree.",
      "date": "2026-10-06T14:20:00",
      "status": "Red Flag Triaged",
      "red_flag": true,
      "notes": "TRIAGE ALERT: Automated flag triggered (fever + weeping rash + new allergen). Parent instructed to see pediatrician immediately."
    }
  ],
  "menus": {
    "header": [
        {
            "id": "nav-1",
            "label": "Topics",
            "url": "/topics/",
            "badge": "13 hubs",
            "target": "_self",
            "order": 1,
            "published": true
        },
        {
            "id": "nav-2",
            "label": "Episodes",
            "url": "/episodes/",
            "badge": "116+",
            "target": "_self",
            "order": 2,
            "published": true
        },
        {
            "id": "nav-3",
            "label": "Experts",
            "url": "/experts/",
            "badge": "Hosts & guests",
            "target": "_self",
            "order": 3,
            "published": true
        },
        {
            "id": "nav-4",
            "label": "The book",
            "url": "/book/",
            "badge": "Coming soon",
            "target": "_self",
            "order": 4,
            "published": true
        },
        {
            "id": "nav-5",
            "label": "FAQ",
            "url": "/faq/",
            "badge": "FAQ",
            "target": "_self",
            "order": 5,
            "published": true
        },
        {
            "id": "nav-6",
            "label": "About",
            "url": "/about/",
            "badge": "Standards",
            "target": "_self",
            "order": 6,
            "published": true
        },
        {
            "id": "nav-7",
            "label": "Ask the Doctor",
            "url": "/ask-the-doctor/",
            "badge": "Free",
            "target": "_self",
            "order": 7,
            "published": true
        }
    ],
    "footer": [
        {
            "id": "fn-1",
            "col": "Topics",
            "label": "Gut health & microbiome",
            "url": "/topics/gut-health/",
            "target": "_self",
            "order": 1,
            "published": true
        },
        {
            "id": "fn-2",
            "col": "Topics",
            "label": "Nutrition & first foods",
            "url": "/topics/first-foods/",
            "target": "_self",
            "order": 2,
            "published": true
        },
        {
            "id": "fn-3",
            "col": "Topics",
            "label": "Picky eating",
            "url": "/topics/picky-eating/",
            "target": "_self",
            "order": 3,
            "published": true
        },
        {
            "id": "fn-4",
            "col": "Topics",
            "label": "Skin & eczema",
            "url": "/topics/skin-eczema/",
            "target": "_self",
            "order": 4,
            "published": true
        },
        {
            "id": "fn-5",
            "col": "Topics",
            "label": "Allergies",
            "url": "/topics/allergies/",
            "target": "_self",
            "order": 5,
            "published": true
        },
        {
            "id": "fn-6",
            "col": "Topics",
            "label": "All 13 topics \u2192",
            "url": "/topics/",
            "target": "_self",
            "order": 6,
            "published": true
        },
        {
            "id": "fn-7",
            "col": "Library",
            "label": "All episodes",
            "url": "/episodes/",
            "target": "_self",
            "order": 1,
            "published": true
        },
        {
            "id": "fn-8",
            "col": "Library",
            "label": "Latest video",
            "url": "/episodes/wHrPcQPYiaE/",
            "target": "_self",
            "order": 2,
            "published": true
        },
        {
            "id": "fn-9",
            "col": "Library",
            "label": "Experts directory",
            "url": "/experts/",
            "target": "_self",
            "order": 3,
            "published": true
        },
        {
            "id": "fn-10",
            "col": "Library",
            "label": "Search answers",
            "url": "/search/",
            "target": "_self",
            "order": 4,
            "published": true
        },
        {
            "id": "fn-11",
            "col": "Library",
            "label": "Ask the Doctor",
            "url": "/ask-the-doctor/",
            "target": "_self",
            "order": 5,
            "published": true
        },
        {
            "id": "fn-12",
            "col": "About & Standards",
            "label": "Our story",
            "url": "/about/",
            "target": "_self",
            "order": 1,
            "published": true
        },
        {
            "id": "fn-13",
            "col": "About & Standards",
            "label": "Editorial standards",
            "url": "/about/#standards",
            "target": "_self",
            "order": 2,
            "published": true
        },
        {
            "id": "fn-14",
            "col": "About & Standards",
            "label": "FAQ",
            "url": "/faq/",
            "target": "_self",
            "order": 3,
            "published": true
        },
        {
            "id": "fn-15",
            "col": "About & Standards",
            "label": "The book",
            "url": "/book/",
            "target": "_self",
            "order": 4,
            "published": true
        },
        {
            "id": "fn-16",
            "col": "About & Standards",
            "label": "Privacy Policy",
            "url": "/privacy/",
            "target": "_self",
            "order": 5,
            "published": true
        },
        {
            "id": "fn-17",
            "col": "About & Standards",
            "label": "Terms of Service",
            "url": "/terms/",
            "target": "_self",
            "order": 6,
            "published": true
        },
        {
            "id": "fn-18",
            "col": "About & Standards",
            "label": "Admin CMS \u2699\ufe0f",
            "url": "/admin/",
            "target": "_blank",
            "order": 7,
            "published": true
        }
    ]
},
  "pages": [
    {
      "id": "pg-1",
      "title": "About Us & Editorial Standards",
      "slug": "about",
      "url": "/about/",
      "template": "Editorial & Standards",
      "seo_title": "About Us & Editorial Standards — The First Seven Years",
      "meta_desc": "Discover why The First Seven Years exists, our medical fact-checking standards, and series mission with Dr. Murray Clarke.",
      "focus_keyword": "pediatric integrative health editorial standards",
      "keywords": "about us, editorial standards, dr murray clarke, pediatric health, medical review standards",
      "canonical_url": "https://thefirstsevenyears.com/about/",
      "robots_index": "noindex",
      "robots_follow": "nofollow",
      "og_title": "About Us & Editorial Standards — The First Seven Years",
      "og_type": "article",
      "og_desc": "Our clinical philosophy, medical fact-checking standards, and series mission with Dr. Murray Clarke and Bryce Wylde.",
      "og_image": "https://thefirstsevenyears.com/assets/img/og-share.jpg",
      "schema_type": "AboutPage",
      "twitter_card": "summary_large_image",
      "excerpt": "Detailed explanation of how our medical answers and video series are produced and verified.",
      "body": "Dr. Murray Clarke has spent decades focused on pediatric integrative care. Every answer in this library is medically verified and referenced.",
      "updated": "2026-10-12",
      "published": true
    },
    {
      "id": "pg-2",
      "title": "The Book: The First Seven Years",
      "slug": "book",
      "url": "/book/",
      "template": "Product / Book Showcase",
      "seo_title": "The First Seven Years — The Book by Dr. Murray Clarke",
      "meta_desc": "The definitive childhood health reference guide for parents by Dr. Murray Clarke (coming soon).",
      "focus_keyword": "the first seven years book",
      "keywords": "dr murray clarke book, childhood health reference, parenting guide 0 to 7",
      "canonical_url": "https://thefirstsevenyears.com/book/",
      "robots_index": "noindex",
      "robots_follow": "nofollow",
      "og_title": "The Book: The First Seven Years by Dr. Murray Clarke",
      "og_type": "article",
      "og_desc": "The definitive companion reference book detailing childhood nutrition, milestones, and gut care.",
      "og_image": "https://thefirstsevenyears.com/assets/img/og-share.jpg",
      "schema_type": "ItemPage",
      "twitter_card": "summary_large_image",
      "excerpt": "Comprehensive companion reference book detailing childhood nutrition, milestones, and gut care.",
      "body": "The First Seven Years book brings together clinical experience and parents’ most pressing questions into an essential home guide.",
      "updated": "2026-10-12",
      "published": true
    },
    {
      "id": "pg-3",
      "title": "Privacy Policy",
      "slug": "privacy",
      "url": "/privacy/",
      "template": "Legal / Policy",
      "seo_title": "Privacy Policy — The First Seven Years",
      "meta_desc": "How The First Seven Years collects, handles, and protects parent inquiries, pediatric questions, and family privacy.",
      "focus_keyword": "family healthcare privacy policy",
      "keywords": "privacy policy, parent inquiries, confidentiality, children privacy, data protection",
      "canonical_url": "https://thefirstsevenyears.com/privacy/",
      "robots_index": "noindex",
      "robots_follow": "nofollow",
      "og_title": "Privacy Policy — The First Seven Years",
      "og_type": "website",
      "og_desc": "We respect family privacy. Submissions made through Ask the Doctor are kept confidential and de-identified before educational publishing.",
      "og_image": "https://thefirstsevenyears.com/assets/img/og-share.jpg",
      "schema_type": "WebPage",
      "twitter_card": "summary",
      "excerpt": "Transparent privacy policy complying with global health and children privacy standards.",
      "body": "We respect family privacy. Submissions made through Ask the Doctor are kept confidential and de-identified before educational publishing.",
      "updated": "2026-10-12",
      "published": true
    },
    {
      "id": "pg-4",
      "title": "Terms and Conditions & Medical Disclaimer",
      "slug": "terms",
      "url": "/terms/",
      "template": "Legal / Policy",
      "seo_title": "Terms and Conditions & Medical Disclaimer — The First Seven Years",
      "meta_desc": "Terms of use, user submission guidelines, and explicit educational medical disclaimer for The First Seven Years.",
      "focus_keyword": "terms and conditions medical disclaimer",
      "keywords": "terms and conditions, terms of service, medical disclaimer, pediatric education disclaimer",
      "canonical_url": "https://thefirstsevenyears.com/terms/",
      "robots_index": "noindex",
      "robots_follow": "nofollow",
      "og_title": "Terms and Conditions — The First Seven Years",
      "og_type": "website",
      "og_desc": "Educational content only. Nothing on this website constitutes direct individual medical diagnosis or treatment.",
      "og_image": "https://thefirstsevenyears.com/assets/img/og-share.jpg",
      "schema_type": "WebPage",
      "twitter_card": "summary",
      "excerpt": "Legal conditions for browsing the site, watching episodes, and reading expert answers.",
      "body": "Educational content only. Nothing on this website constitutes direct medical advice, diagnosis, or treatment.",
      "updated": "2026-10-12",
      "published": true
    }
  ]
};
