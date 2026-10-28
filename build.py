#!/usr/bin/env python3
"""
The First Seven Years — static site generator (prototype).

One content model -> every page, so header/footer/schema never drift.
The model mirrors the Shopify build in the proposal: episodes and answers
become blog articles, topics and experts become metaobjects, the book a product.

    python3 build.py        # writes ./site
"""
import json, re, html, os, datetime
from pathlib import Path

ROOT = Path(os.environ.get("OUT") or Path(__file__).parent / "site").resolve()
SITE = "https://thefirstsevenyears.com"   # TODO: confirm production domain
YT = "https://www.youtube.com/@thefirstsevenyears"
TODAY = datetime.date(2026, 9, 30)
STAGING = os.environ.get("STAGING") == "1"   # review builds: noindex everywhere
esc = html.escape

# --------------------------------------------------------------------------
# ICONS (Lucide-style strokes, inline so there is no icon font request)
# --------------------------------------------------------------------------
def icon(name, label=None):
    p = {
        "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        "arrow": '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
        "menu": '<path d="M4 7h16M4 12h16M4 17h10"/>',
        "close": '<path d="M6 6l12 12M18 6 6 18"/>',
        "play": '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
        "youtube": '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor"/>',
        "mail": '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
        "chat": '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/>',
        "check": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
        "shield": '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
        "calendar": '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
        "book": '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
        "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
        "alert": '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>',
        "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
        "sparkle": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    }[name]
    a11y = f'role="img" aria-label="{esc(label)}"' if label else 'aria-hidden="true" focusable="false"'
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" {a11y}>{p}</svg>'

def logo(cls="", size=None):
    style = f' style="--logo:{size}px"' if size else ""
    return (f'<span class="logo {cls}"{style} aria-hidden="true"><span class="l-sm">The First</span>'
            f'<span>Seven</span><span>Years</span><span class="l-sq">{"<i></i>" * 7}</span></span>')

# --------------------------------------------------------------------------
# CONTENT MODEL
# --------------------------------------------------------------------------
TOPICS = [
    # slug, name, short description, swatch, hub intro
    ("gut-health", "Gut health & microbiome", "Tummies, probiotics and the gut–brain link", "#bfe4c6",
     "Much of your child’s immune system lives in the gut, and the microbes that settle there in the first years shape far more than digestion. Start here for the plain-English basics."),
    ("first-foods", "Nutrition & first foods", "Starting solids, balanced plates, real food", "#fbe7ac",
     "From first spoonfuls to lunchbox years — how to build a varied diet without turning mealtimes into a project."),
    ("picky-eating", "Picky eating", "When they won’t eat, or only eat beige", "#fad7c4",
     "Selective eating is one of the most common worries we hear. What is normal, what helps, and when to look closer."),
    ("skin-eczema", "Skin & eczema", "Rashes, dry patches and the gut–skin link", "#f6d2c9",
     "Eczema is about more than skin. Our experts explain barrier care, triggers, and where the gut fits in."),
    ("allergies", "Allergies", "Food allergy, hay fever and early prevention", "#ddd6f5",
     "What research now says about early exposure, and how to tell an allergy from an intolerance."),
    ("immunity", "Immunity & everyday illness", "Colds, fevers, antibiotics and bouncing back", "#cfe6f2",
     "Coughs, colds and the endless nursery bugs — building resilience, and knowing when to call the doctor."),
    ("brain-focus", "Brain, focus & ADHD", "Attention, learning and the gut–brain axis", "#e3dcf7",
     "Why attention differences are being diagnosed more often, and the daily habits that support a developing brain."),
    ("autism-development", "Autism & development", "Milestones, differences and support", "#d6ecdf",
     "Understanding developmental differences early, and the range of support families are exploring."),
    ("sleep", "Sleep", "Bedtimes, night waking and routines", "#d9dff3",
     "Sleep drives mood, growth and immunity. Gentle, realistic approaches for tired families."),
    ("emotions", "Emotions & behaviour", "Big feelings, tantrums and resilience", "#fde2c8",
     "Meltdowns are normal — here is what is happening in the brain, and how to help a child find calm."),
    ("pregnancy", "Pregnancy & preconception", "Setting up the first seven years before day one", "#f7d9e3",
     "A child’s health story starts before birth. What matters in preconception and pregnancy — without the guilt."),
    ("supplements", "Supplements", "What kids actually need, and what they don’t", "#f3ecdf",
     "Food first — then an honest look at where vitamin D, omega-3s, probiotics and others may fit."),
    ("omega-3s", "Omega-3s & healthy fats", "DHA, fish and the fats growing brains rely on", "#f6e3c4",
     "Fats are a building material for a young child’s brain and eyes. What omega-3s are, where to find them in everyday food, and what to ask before adding anything extra."),
]
TOPIC = {t[0]: t for t in TOPICS}
EXPERT_ORDER = ["dr-murray-clarke", "dr-bill-sears", "bryce-wylde"]

EXPERTS = {
    "dr-murray-clarke": dict(
        name="Dr. Murray Clarke", role="Host · The First Seven Years", img="/assets/img/dr-murray-clarke.jpg", c="#a6d6b0",
        short="Host of The First Seven Years and the doctor who answers your questions.",
        bio=["Dr. Murray Clarke has spent decades focused on one question: what gives a child the strongest possible start? His work sits where nutrition, the gut and a child’s developing brain meet — and he has a knack for explaining it in the language parents actually use.",
             "On The First Seven Years he hosts long-form conversations with pediatricians, researchers and practitioners, then distils them into short, practical answers. Through Ask the Doctor, he answers parents’ questions directly — the most common become new answers in this library."],
        creds=["Host of The First Seven Years podcast and video series", "Answers parent questions through Ask the Doctor", "Focus: children’s nutrition, gut health and integrative care"],
        # Relationship disclosure: shown on this profile only (client instruction). Credentials to be confirmed by the client.
        disclosure="Dr. Murray Clarke is the founder of ChildLife Essentials, a children’s nutritional supplement company. The First Seven Years does not recommend or sell products, and his answers on this site are educational, not product advice.",
        same=[YT]),
    "bryce-wylde": dict(
        name="Bryce Wylde", role="Co-host · Functional medicine", img=None, c="#fbe7ac",
        short="Co-host, functional medicine expert, and author of The First Seven Years book.",
        bio=["Bryce Wylde co-hosts The First Seven Years, bringing a functional medicine lens to each conversation — asking the follow-up questions a curious parent would, and pressing guests on the evidence.",
             "He is the author of The First Seven Years book, approved by Dr. Bill Sears and Dr. Murray Clarke."],
        creds=["Co-host of The First Seven Years", "Functional medicine expert", "Author, The First Seven Years book"], same=[]),
    "dr-bill-sears": dict(
        name="Dr. Bill Sears", role="Pediatrician · Author · Featured expert", img="/assets/img/dr-bill-sears.jpg", c="#bfe4c6",
        short="Pediatrician and author of more than 40 books on parenting and children’s health, including The Baby Book.",
        bio=["Dr. William “Bill” Sears is a pediatrician and the author or co-author of more than 40 books on parenting and children’s health, including The Baby Book — the reference many parents keep on the nightstand through the first years.",
             "On The First Seven Years he joins Dr. Murray Clarke and Bryce Wylde to talk about what to feed babies and when, breastfeeding, and the nutrients growing children need most. He is part of the author network behind The First Seven Years book, which he approved alongside Dr. Clarke."],
        creds=["Pediatrician", "Author or co-author of 40+ books, including The Baby Book", "Featured expert on The First Seven Years", "Approved The First Seven Years book"],
        disclosure="Dr. Sears is associated with AskDrSears.com, a sponsor of The First Seven Years. Sponsors have no say over which questions we answer or what the answers say.",
        same=["https://www.askdrsears.com/"]),
    "dr-dan-sullivan": dict(
        name="Dr. Dan Sullivan", role="Guest · Episode 27", img=None, c="#ddd6f5",
        short="Guest on Episode 27 — ADHD, stress and the gut.",
        bio=["Dr. Dan Sullivan joined the show to talk about why ADHD diagnoses are rising, how stress in pregnancy may shape a baby’s brain, and what he does to manage his own ADHD."],
        creds=["Guest, Episode 27"], same=[]),
    "dr-elisa-song": dict(
        name="Dr. Elisa Song", role="Guest · Episode 26 · Integrative pediatrician", img=None, c="#bfe4c6",
        short="Integrative pediatrician; guest on Episode 26 — the gut behind allergies, anxiety and ADHD.",
        bio=["Dr. Elisa Song is an integrative pediatrician. On Episode 26 she explains the microbiome in terms any parent can use — from prebiotics versus probiotics to restoring the gut after antibiotics."],
        creds=["Integrative pediatrician", "Guest, Episode 26"], same=[]),
    "joy-mccarthy": dict(
        name="Joy McCarthy", role="Guest · Holistic nutritionist", img=None, c="#fad7c4",
        short="Holistic nutritionist; guest on eczema and the gut–skin connection.",
        bio=["Joy McCarthy is a holistic nutritionist. Her conversation with the show focuses on children’s eczema — why it is so often a gut story, and gentle ways to care for skin."],
        creds=["Holistic nutritionist", "Guest on eczema and skin health"], same=[]),
}

# Real videos from the channel. Durations and publish dates from YouTube (Oct 2026).
# fmt: "episode" = long-form conversation · "video" = 7–12-minute short video · "social" = vertical short (<2 min)
# Site titles are editorial (plain, claim-free); the YouTube title is kept in `yt` for reference.
# Gate: Erinn Askin photobiomodulation ep + clips, and "supplements that clear eczema", are excluded per the
# client's compliance hard gate (F7Y_CLE_Compliance_Governance, Aug 28 2026).
_V = [
 # id, site title, guest, fmt, topics, series, seconds, published
 ("sJsNza0_zRQ","7 Things One Doctor Does to Manage His Own ADHD","dr-dan-sullivan","video",["brain-focus"],27,593,"2026-09-28"),
 ("eeuP3KRgQg4","What Starts “Leaky Gut”?","dr-dan-sullivan","video",["gut-health"],27,592,"2026-09-25"),
 ("jrIRvStKeqk","Can Stress in Pregnancy Affect a Baby’s Brain?","dr-dan-sullivan","video",["pregnancy","brain-focus"],27,705,"2026-09-23"),
 ("W1VViQ8goFk","ADHD Diagnoses Have Risen. What Changed?","dr-dan-sullivan","video",["brain-focus"],27,647,"2026-09-21"),
 ("NiYwg17ahYo","What the Research Says About Probiotic Strains","dr-elisa-song","video",["gut-health","supplements"],26,426,"2026-09-18"),
 ("wHrPcQPYiaE","ADHD and the Gut–Brain Connection","dr-dan-sullivan","episode",["brain-focus","gut-health","pregnancy"],27,4569,"2026-09-18"),
 ("g4ejtsJj9y8","What Is “Leaky Gut”, Really? A Pediatrician Explains","dr-elisa-song","video",["gut-health"],26,859,"2026-09-14"),
 ("4ddstm2d_Y4","Should You Still Be Kissing Your Kids? A Pediatrician Weighs In","dr-elisa-song","video",["immunity"],26,522,"2026-09-11"),
 ("Yr5B77Yp9HE","Prebiotics, Probiotics and Postbiotics, Explained Simply","dr-elisa-song","video",["gut-health","supplements","first-foods"],26,399,"2026-09-07"),
 ("s5lyhtu2aXc","Pets, Dirt and a Child’s Developing Immune System","dr-elisa-song","video",["immunity","allergies"],26,384,"2026-09-04"),
 ("VBfOpGRcS2M","C-Section Birth, the Microbiome and Eczema: What One Study Found","dr-elisa-song","video",["skin-eczema","pregnancy","gut-health"],26,375,"2026-08-31"),
 ("hqC4jyz4ZvQ","Supporting Your Child’s Gut After Antibiotics","dr-elisa-song","video",["gut-health","immunity"],26,531,"2026-08-28"),
 ("bmkNG6J4YT0","The Microbiome Before Conception","dr-elisa-song","video",["pregnancy","gut-health"],26,561,"2026-08-24"),
 ("maCarlEllC4","Why More Children Live With a Chronic Condition Today","dr-elisa-song","video",["immunity"],26,536,"2026-08-21"),
 ("w_HZCxmnNi4","Allergies, Anxiety, ADHD and the Gut: What’s the Connection?","dr-elisa-song","episode",["gut-health","allergies","emotions","brain-focus"],26,5741,"2026-08-14"),
 ("E1clSMEAwNk","Antibiotics, the Gut and Eczema Flares","joy-mccarthy","video",["skin-eczema","immunity"],"mccarthy",377,"2026-07-03"),
 ("7HRqTlUyXdI","Eczema Questions Worth Asking Your Doctor","joy-mccarthy","video",["skin-eczema"],"mccarthy",301,"2026-06-26"),
 ("wP5-4Pu094s","Caring for a Baby’s Eczema-Prone Skin","joy-mccarthy","video",["skin-eczema"],"mccarthy",552,"2026-06-22"),
 ("I90rSaFzuak","Is Eczema a Gut Issue as Well as a Skin Issue?","joy-mccarthy","video",["skin-eczema","gut-health"],"mccarthy",440,"2026-06-19"),
 # Dr. Bill Sears — full episode, short videos and social clips
 ("SdKxjP7Uf98","What to Feed Your Baby, and When","dr-bill-sears","episode",["first-foods","omega-3s","supplements"],"sears",2989,"2025-01-15"),
 ("pP6Idx8jvpw","Is Rice Cereal the Right First Food?","dr-bill-sears","video",["first-foods"],"sears",511,"2025-05-13"),
 ("mnSVjxdM9T0","What Makes Breast Milk So Valuable?","dr-bill-sears","video",["first-foods","immunity"],"sears",503,"2025-09-20"),
 ("eHqfZvD3Vv0","Why Dr. Sears Offers Salmon to a Seven-Month-Old","dr-bill-sears","video",["first-foods","omega-3s"],"sears",262,"2025-11-22"),
 ("Wyu7FN8SRKo","Why Dr. Sears Calls Junk Food “Sticky Food”","dr-bill-sears","social",["first-foods","picky-eating"],"sears",129,"2026-10-04"),
 ("lmkScH3vNKc","Why Vitamin D Matters in Childhood","dr-bill-sears","social",["supplements"],"sears",63,"2026-09-20"),
 ("JkymvbxE-XM","The Microbiome’s Favorite First Food","dr-bill-sears","social",["gut-health","first-foods"],"sears",83,"2025-01-21"),
 ("vy97m14VI5Y","Why Breastfeeding Matters","dr-bill-sears","social",["first-foods"],"sears",83,"2025-01-20"),
 ("IUhUYDtSA7U","The 5 S’s for Pregnant Moms","dr-bill-sears","social",["pregnancy","omega-3s"],"sears",40,"2025-01-19"),
 ("SMEdVdPSLxI","DHA for Pregnant and Breastfeeding Moms","dr-bill-sears","social",["pregnancy","omega-3s"],"sears",44,"2025-01-18"),
 # social clips from other experts
 ("-QqrASflJnE","Foods That Support a Baby’s Growing Brain","dr-dan-sullivan","social",["first-foods","omega-3s","brain-focus"],27,67,"2026-09-22"),
 ("i6aC1YeUBCM","5 Things Kids Can Do for Their Gut and Mood","dr-elisa-song","social",["gut-health","emotions"],26,124,"2026-08-29"),
 ("5PZXSBl81lo","The Foundation of a Child’s Microbiome","dr-elisa-song","social",["gut-health"],26,128,"2026-08-25"),
 ("SNUQ_DCPNUo","Why a Little Less Sanitizing Can Help","dr-elisa-song","social",["immunity","allergies"],26,65,"2026-08-22"),
 ("97SB5Z82SM8","Sleep Tips for Parents of Little Ones","dr-elisa-song","social",["sleep"],26,155,"2026-08-18"),
]

def slugify(s):
    s = s.lower().replace("’", "").replace("'", "").replace("“", "").replace("”", "").replace("&", "and").replace("%", "-percent")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:70].rstrip("-")

FORMATS = {
    "episode": dict(label="Full episode", plural="Full episodes", path="full-episodes", blurb="The long-form podcast conversations — 45 minutes to 1.5 hours with a guest expert."),
    "video": dict(label="Short video", plural="Short videos", path="short-videos", blurb="7–12 minutes on a single question — one expert, one idea, straight to the point."),
    "social": dict(label="Social clip", plural="Social clips", path="social-clips", blurb="A minute or two, made for your phone. Vertical clips from YouTube Shorts and social."),
}
EPISODES = []
for vid, title, guest, fmt_, tags, series, secs, pub in _V:
    EPISODES.append(dict(id=vid, title=title, guest=guest, kind=fmt_, tags=tags, ep=series, secs=secs,
                         slug=slugify(title), date=datetime.date.fromisoformat(pub)))
EPISODES.sort(key=lambda e: e["date"], reverse=True)
EP_FULL = {e["ep"]: e for e in EPISODES if e["kind"] == "episode"}
EXPERTS = {k: EXPERTS[k] for k in EXPERT_ORDER + [k for k in EXPERTS if k not in EXPERT_ORDER]}

# Parent answers. Each answer = a real question + the expert clip that answers it.
# Copy is written conservatively and flagged as awaiting clinical review.
ANSWERS = [
 dict(slug="is-my-childs-eczema-a-gut-problem", q="Is my child’s eczema really a gut problem?", topic="skin-eczema", also=["gut-health"],
      video="I90rSaFzuak", expert="joy-mccarthy", ages=[0,1,2,3],
      quick="Partly — and it is worth knowing why. Eczema happens when the skin barrier is leaky and the immune system over-reacts. Research increasingly links both to the gut microbiome, especially in the first years of life. Good skin care still comes first; supporting the gut can sit alongside it.",
      body="""
<h2>What eczema actually is</h2>
<p>Eczema (atopic dermatitis) is a combination of two things: skin that does not hold moisture well, and an immune system that reacts strongly to everyday triggers. The result is the dry, itchy, inflamed patches most parents recognise — often in the creases of elbows and knees, or on the cheeks in babies.</p>
<h2>Where the gut comes in</h2>
<p>Most of the immune system is trained in the gut during the first years of life. Studies have found differences in the gut bacteria of babies who go on to develop eczema, and early-life factors that shape the microbiome — such as birth by C-section or early antibiotics — are associated with a higher chance of eczema. This is what people mean by the <em>gut–skin axis</em>.</p>
<p>That does not mean eczema is <em>only</em> a gut problem, or that changing diet alone will clear it. It means the gut is one lever among several.</p>
<h2>What parents can reasonably do</h2>
<ul>
  <li><strong>Protect the skin barrier every day.</strong> Short lukewarm baths, then a thick fragrance-free moisturiser within a few minutes.</li>
  <li><strong>Notice triggers.</strong> Heat, sweat, scratchy fabrics, soaps and sometimes specific foods can all flare skin.</li>
  <li><strong>Feed the microbiome.</strong> A varied diet with fibre from fruit, vegetables, oats and beans, plus fermented foods such as plain yogurt if your child tolerates them.</li>
  <li><strong>Ask before you add.</strong> Probiotics have mixed evidence for eczema — talk to your pediatrician about whether a specific product makes sense for your child.</li>
</ul>
<h2>When to see your doctor</h2>
<p>Book an appointment if the skin is weeping, crusting or very red (it may be infected), if your child has a fever alongside a flare, if eczema is disturbing sleep, or if it is not improving with good daily care. Never stop a prescribed treatment without speaking to your doctor first.</p>"""),
 dict(slug="what-is-leaky-gut", q="What is “leaky gut”, really?", topic="gut-health", also=["allergies"],
      video="g4ejtsJj9y8", expert="dr-elisa-song", ages=[2,3,4,5],
      quick="“Leaky gut” describes a gut lining that lets more through than it should — researchers call it increased intestinal permeability. It is measurable in studies, but it is not a diagnosis on its own. Think of it as one way gut health may connect to allergies, skin and mood."),
 dict(slug="prebiotics-vs-probiotics-vs-postbiotics", q="Prebiotics, probiotics, postbiotics — what’s the difference?", topic="gut-health", also=["supplements","first-foods"],
      video="Yr5B77Yp9HE", expert="dr-elisa-song", ages=[1,2,3,4,5,6,7],
      quick="Probiotics are live, helpful microbes. Prebiotics are the fibres that feed them. Postbiotics are the useful compounds those microbes make. For most children, foods are the easiest place to start: yogurt or kefir, oats, bananas, beans and a wide variety of plants."),
 dict(slug="restoring-the-gut-after-antibiotics", q="How do I help my child’s gut recover after antibiotics?", topic="gut-health", also=["immunity"],
      video="hqC4jyz4ZvQ", expert="dr-elisa-song", ages=[1,2,3,4,5,6,7],
      quick="First, antibiotics are sometimes essential — always finish the course you were prescribed. Afterwards, a varied, fibre-rich diet, fermented foods if tolerated, plenty of water and time all help the microbiome rebuild. Ask your pediatrician whether a probiotic is worth adding for your child."),
 dict(slug="are-pets-and-dirt-good-for-immunity", q="Are pets and a bit of dirt actually good for my child?", topic="immunity", also=["allergies"],
      video="s5lyhtu2aXc", expert="dr-elisa-song", ages=[0,1,2,3,4],
      quick="Often, yes. Many studies link early, everyday exposure — pets, outdoor play, older siblings — to lower rates of allergy and asthma. It is sometimes called the “old friends” idea. It does not replace handwashing before meals and after the toilet."),
 dict(slug="is-it-okay-to-kiss-my-baby", q="Is it okay to kiss my baby on the face?", topic="immunity", also=[],
      video="4ddstm2d_Y4", expert="dr-elisa-song", ages=[0,1],
      quick="For healthy parents, affectionate contact is part of normal bonding and shares friendly microbes. The exceptions: if you have a cold sore, a cold or flu, or your newborn is very young or unwell, keep kisses away from the face and hands until you are better."),
 dict(slug="can-stress-in-pregnancy-affect-my-baby", q="Can stress in pregnancy affect my baby?", topic="pregnancy", also=["brain-focus"],
      video="jrIRvStKeqk", expert="dr-dan-sullivan", ages=[0],
      quick="Research links ongoing, severe stress in pregnancy with differences in a baby’s development — but everyday worry is normal and nothing to feel guilty about. Sleep, support, gentle movement and asking for help are protective for both of you."),
 dict(slug="does-my-gut-health-before-pregnancy-matter", q="Does my own gut health before pregnancy matter?", topic="pregnancy", also=["gut-health"],
      video="bmkNG6J4YT0", expert="dr-elisa-song", ages=[0],
      quick="It is part of the story. Babies pick up their first microbes from their mother — through birth, feeding and close contact. Eating a varied, fibre-rich diet and looking after your own health before and during pregnancy all count."),
 dict(slug="why-are-adhd-diagnoses-rising", q="Why are ADHD diagnoses rising?", topic="brain-focus", also=[],
      video="W1VViQ8goFk", expert="dr-dan-sullivan", ages=[4,5,6,7],
      quick="Partly because awareness and screening have improved. Researchers are also looking at sleep, screens, diet and the gut–brain axis. In this clip, Dr. Dan Sullivan shares his view on what has changed — and what parents can do day to day."),
 dict(slug="what-should-my-babys-first-food-be", q="What should my baby’s first food be?", topic="first-foods", also=["omega-3s"],
      video="pP6Idx8jvpw", expert="dr-bill-sears", ages=[0, 1],
      quick="There is no single perfect first food. Around six months, many pediatricians suggest offering a variety of iron-rich, soft foods — such as well-cooked meat or fish, beans and lentils, or an iron-fortified cereal — rather than relying on one bland cereal. In this video, Dr. Bill Sears explains why he looks beyond rice cereal. Ask your pediatrician about timing, allergens and safe textures."),
 dict(slug="is-cortisone-cream-safe-for-babies", q="Is cortisone cream okay for my baby’s eczema?", topic="skin-eczema", also=[],
      video="wP5-4Pu094s", expert="joy-mccarthy", ages=[0,1,2],
      quick="Low-strength steroid creams are widely prescribed and can be appropriate for short flares. In this clip, Joy McCarthy explains why she also looks at gentle skin care and gut support. Talk to your pediatrician before stopping or changing anything prescribed."),
]
for i, a in enumerate(ANSWERS):
    a["published"] = TODAY - datetime.timedelta(days=12 + i * 3)
    a["reviewed"] = TODAY - datetime.timedelta(days=5 + i)
ANS = {a["slug"]: a for a in ANSWERS}
EPV = {e["id"]: e for e in EPISODES}

AGES = [
    ("0", "Newborn", "The first year", "Feeding, skin, sleep and settling in — and looking after yourself too.",
     ["is-it-okay-to-kiss-my-baby", "is-cortisone-cream-safe-for-babies", "can-stress-in-pregnancy-affect-my-baby"]),
    ("1", "One", "First foods, first steps", "Starting solids, the first colds from nursery, and a microbiome that is taking shape.",
     ["prebiotics-vs-probiotics-vs-postbiotics", "are-pets-and-dirt-good-for-immunity", "is-my-childs-eczema-a-gut-problem"]),
    ("2", "Two", "Big feelings, small appetites", "The age of “no” — at the table and everywhere else.",
     ["topic:picky-eating", "restoring-the-gut-after-antibiotics", "topic:emotions"]),
    ("3", "Three", "Playground years", "More friends, more germs, more questions than ever.",
     ["are-pets-and-dirt-good-for-immunity", "what-is-leaky-gut", "topic:sleep"]),
    ("4", "Four", "Getting ready to learn", "Attention, language and the habits that support a growing brain.",
     ["why-are-adhd-diagnoses-rising", "what-is-leaky-gut", "topic:autism-development"]),
    ("5", "Five", "Starting school", "New routines, lunchboxes and a whole new set of bugs.",
     ["restoring-the-gut-after-antibiotics", "why-are-adhd-diagnoses-rising", "topic:first-foods"]),
    ("6", "Six", "Growing independence", "Friendships, focus and food choices they make themselves.",
     ["topic:brain-focus", "prebiotics-vs-probiotics-vs-postbiotics", "topic:supplements"]),
    ("7", "Seven", "Foundations set", "What the first seven years have built, and how to keep it going.",
     ["topic:brain-focus", "topic:emotions", "restoring-the-gut-after-antibiotics"]),
]

# --------------------------------------------------------------------------
# HELPERS
# --------------------------------------------------------------------------
def thumb(vid, q="hqdefault"): return f"https://i.ytimg.com/vi/{vid}/{q}.jpg"
def ep_url(e):
    # social clips live on YouTube Shorts / social; they get no thin page of their own
    return f"https://www.youtube.com/shorts/{e['id']}" if e["kind"] == "social" else f"/videos/{e['slug']}/"
def ans_url(a): return f"/answers/{a['slug']}/"
def topic_url(s): return f"/topics/{s}/"
def expert_url(s): return f"/experts/{s}/"
def fmt(d): return f"{d.day} {d.strftime('%b %Y')}"

def eps_for(topic): return [e for e in EPISODES if topic in e["tags"]]
def ans_for(topic): return [a for a in ANSWERS if a["topic"] == topic or topic in a["also"]]

def topic_count(s):
    a, v = len(ans_for(s)), len(eps_for(s))
    if not a and not v: return "New answers soon"
    return " · ".join(x for x in [f"{a} answer{'s' * (a != 1)}" if a else "", f"{v} video{'s' * (v != 1)}" if v else ""] if x)

def ep_label(e): return FORMATS[e["kind"]]["label"]
def ep_name(e): return f"Episode {e['ep']}" if isinstance(e["ep"], int) else "Full episode"
def dur(e):
    m, sec = divmod(e["secs"], 60)
    return f"{round(e['secs'] / 60)} min" if e["kind"] == "episode" else f"{m}:{sec:02d}"
def iso_dur(e):
    m, sec = divmod(e["secs"], 60); h, m = divmod(m, 60)
    return "PT" + (f"{h}H" if h else "") + f"{m}M{sec}S"

def ep_card(e, lazy=True):
    if e["kind"] == "social": return social_card(e, lazy)
    g = EXPERTS[e["guest"]]["name"]
    return f"""<a class="ep-card ep-card--{e['kind']}" href="{ep_url(e)}">
  <div class="ep-card__thumb"><img src="{thumb(e['id'])}" alt="" width="480" height="270" {'loading="lazy"' if lazy else ''} decoding="async">
    <span class="fmt-badge fmt-badge--{e['kind']}">{ep_label(e)}</span><span class="ep-card__dur">{dur(e)}</span><span class="ep-card__play">{icon('play')}</span></div>
  <h3>{esc(e['title'])}</h3>
  <div class="ep-card__meta"><span>{esc(g)}</span><span>{TOPIC[e['tags'][0]][1]}</span></div>
</a>"""

def social_card(e, lazy=True):
    g = EXPERTS[e["guest"]]["name"]
    return f"""<a class="social-card" href="{ep_url(e)}" target="_blank" rel="noopener" aria-label="{esc(e['title'])} — {esc(g)}, {dur(e)}, opens YouTube Shorts in a new tab">
  <img src="https://i.ytimg.com/vi/{e['id']}/oar2.jpg" onerror="this.onerror=null;this.src='{thumb(e['id'])}'" alt="" width="270" height="480" {'loading="lazy"' if lazy else ''} decoding="async">
  <span class="fmt-badge fmt-badge--social">{dur(e)}</span>
  <span class="social-card__txt"><b>{esc(e['title'])}</b><small>{esc(g)}</small></span></a>"""

def answer_card(a):
    return f"""<a class="answer-card" href="{ans_url(a)}"><span class="q">{esc(a['q'])}</span>
  <span class="who"><i style="background:{TOPIC[a['topic']][3]}"></i>{EXPERTS[a['expert']]['name']} · {TOPIC[a['topic']][1]}</span></a>"""

def yt_facade(vid, title, label="Watch"):
    return f"""<button class="yt" type="button" data-id="{vid}" aria-label="Play video: {esc(title)}">
  <img src="{thumb(vid, 'maxresdefault')}" onerror="this.onerror=null;this.src='{thumb(vid)}'" alt="" width="1280" height="720" loading="lazy" decoding="async">
  <span class="yt__btn">{icon('play')}</span><span class="yt__label">{label}</span></button>"""

def crumbs(items):
    lis = "".join(f'<li><a href="{u}">{esc(n)}</a></li>' if u else f'<li aria-current="page">{esc(n)}</li>' for n, u in items)
    return f'<nav aria-label="Breadcrumb"><ol class="crumbs">{lis}</ol></nav>'

def ld_crumbs(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, **({"item": SITE + u} if u else {})} for i, (n, u) in enumerate(items)]}

ORG = {"@type": "Organization", "@id": SITE + "/#org", "name": "The First Seven Years", "url": SITE + "/",
       "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/logo-900.jpg", "width": 900, "height": 900},
       "sameAs": [YT], "founder": {"@id": SITE + "/experts/dr-murray-clarke/#person"}}
WEBSITE = {"@type": "WebSite", "@id": SITE + "/#website", "name": "The First Seven Years", "url": SITE + "/",
           "publisher": {"@id": SITE + "/#org"}, "inLanguage": "en",
           "potentialAction": {"@type": "SearchAction", "target": SITE + "/search/?q={search_term_string}",
                               "query-input": "required name=search_term_string"}}

def person_ld(slug):
    x = EXPERTS[slug]
    d = {"@type": "Person", "@id": f"{SITE}/experts/{slug}/#person", "name": x["name"], "url": f"{SITE}/experts/{slug}/",
         "description": x["short"], "jobTitle": x["role"].split("·")[-1].strip()}
    if x["img"]: d["image"] = SITE + x["img"]
    if x["same"]: d["sameAs"] = x["same"]
    return d

def video_ld(e):
    return {"@type": "VideoObject", "name": e["title"], "description": ep_desc(e),
            "thumbnailUrl": [thumb(e["id"], "maxresdefault"), thumb(e["id"])],
            "uploadDate": e["date"].isoformat(), "embedUrl": f"https://www.youtube-nocookie.com/embed/{e['id']}",
            "contentUrl": f"https://www.youtube.com/watch?v={e['id']}", "duration": iso_dur(e)}

def ep_desc(e):
    g = EXPERTS[e["guest"]]["name"]
    if e["kind"] == "episode":
        return f"{ep_name(e)} of The First Seven Years ({dur(e)}): Dr. Murray Clarke and Bryce Wylde talk with {g} — {e['title'].rstrip('?')}."
    full = EP_FULL.get(e["ep"])
    src = f" from {ep_name(full).lower() if not isinstance(full['ep'], int) else ep_name(full)}" if full else ""
    return f"A {round(e['secs'] / 60)}-minute video{src} of The First Seven Years with {g}: {e['title']}"

# --------------------------------------------------------------------------
# PAGE SHELL
# --------------------------------------------------------------------------
EMERGENCY = "call 911 or your local emergency number"

def logo_img(cls="", size=52, eager=False):
    # client-supplied logo artwork (160×160 source; keep display ≤ 80px for sharpness)
    lazy = "" if eager else ' loading="lazy"'
    return f'<img class="logo-img {cls}" src="/assets/img/logo.jpg" alt="The First Seven Years" width="{size}" height="{size}"{lazy}>'

def avatar(slug, size=40):
    x = EXPERTS[slug]
    if x["img"]:
        return f'<img class="avatar" src="{x["img"]}" alt="" width="{size}" height="{size}" style="--s:{size}px" loading="lazy">'
    ini = x["name"].replace("Dr. ", "")[0]
    return f'<span class="avatar avatar--ini" style="--s:{size}px;background:{x["c"]}" aria-hidden="true">{ini}</span>'

def mega_panels():
    cols = [TOPICS[i:i + 5] for i in range(0, len(TOPICS), 5)]
    topics = "".join("<ul>" + "".join(
        f'<li><a href="{topic_url(t[0])}"><i style="background:{t[3]}"></i><span>{t[1]}<small>{t[2]}</small></span></a></li>' for t in c) + "</ul>" for c in cols)
    sears_ep = next((e for e in EPISODES if e["kind"] == "episode" and e["guest"] != "dr-bill-sears"), None)
    answers = "".join(f'<li><a href="{ans_url(a)}">{esc(a["q"])}</a></li>' for a in ANSWERS[:6])
    counts = {k: sum(1 for e in EPISODES if e["kind"] == k) for k in FORMATS}
    fmts = "".join(
        f'<li><a class="mega__fmt" href="/videos/{f["path"]}/"><span class="fmt-badge fmt-badge--{k}">{f["label"]}</span>'
        f'<b>{f["plural"]} <small>{counts[k]}</small></b><span>{f["blurb"]}</span></a></li>' for k, f in FORMATS.items())
    people = "".join(
        f'<li><a class="mega__person" href="{expert_url(sl)}">{avatar(sl, 48)}<span><b>{EXPERTS[sl]["name"]}</b><small>{EXPERTS[sl]["role"]}</small></span></a></li>'
        for sl in ("dr-murray-clarke", "dr-bill-sears", "bryce-wylde", "dr-elisa-song"))
    feat = ""
    if sears_ep:
        feat = (f'<a class="mega__feature" href="{ep_url(sears_ep)}"><img src="{thumb(sears_ep["id"])}" alt="" width="480" height="270" loading="lazy">'
                f'<span class="fmt-badge fmt-badge--episode">Latest episode · {dur(sears_ep)}</span><b>{esc(sears_ep["title"])}</b><small>with {EXPERTS[sears_ep["guest"]]["name"]}</small></a>')
    arrow, search = icon("arrow"), icon("search")
    return {
        "topics": (f'<div class="mega__grid mega__grid--topics"><div><p class="mega__kicker">13 topics for ages 0–7</p><div class="mega__cols">{topics}</div></div>'
                   f'<div class="mega__aside"><p class="mega__kicker">Start here</p><a class="mega__cta" href="/topics/">Browse all topics {arrow}</a>'
                   f'<a class="mega__cta" href="/search/">Search by question {search}</a></div></div>'),
        "answers": (f'<div class="mega__grid"><div><p class="mega__kicker">Questions parents ask most</p><ul class="mega__list">{answers}</ul>'
                    f'<a class="mega__more" href="/search/">Search every answer {arrow}</a></div>'
                    f'<div class="mega__aside mega__aside--peach"><p class="mega__kicker">Can’t find it?</p><p>Send Dr. Murray your question. The most-asked become new answers.</p>'
                    f'<a class="btn btn--sm" href="/ask-the-doctor/">Ask the Doctor</a></div></div>'),
        "videos": f'<div class="mega__grid"><div><p class="mega__kicker">Pick a format</p><ul class="mega__fmts">{fmts}</ul></div><div>{feat}</div></div>',
        "experts": (f'<div class="mega__grid"><div><p class="mega__kicker">Who answers here</p><ul class="mega__people">{people}</ul>'
                    f'<a class="mega__more" href="/experts/">All experts {arrow}</a></div>'
                    f'<div class="mega__aside"><p class="mega__kicker">How we check</p><p>Every expert is named, with credentials on their profile. Answers are reviewed before they are published.</p>'
                    f'<a class="mega__more" href="/about/#standards">Editorial standards {arrow}</a></div></div>'),
        "about": ('<div class="mega__grid mega__grid--simple"><ul class="mega__list mega__list--plain"><li><a href="/about/">About The First Seven Years</a></li>'
                  '<li><a href="/about/#standards">Editorial standards &amp; review</a></li><li><a href="/about/#disclosure">Sponsors &amp; relationships</a></li>'
                  '<li><a href="/medical-disclaimer/">Medical disclaimer</a></li></ul></div>'),
    }

MENU = [("Topics", "/topics/", "topics"), ("Parent answers", "/search/", "answers"), ("Watch & listen", "/videos/", "videos"),
        ("Experts", "/experts/", "experts"), ("The book", "/book/", None), ("About", "/about/", "about")]

def notice_strip():
    # short and dismissible; the full disclaimer stays on every answer/video page, in the footer and at /medical-disclaimer/
    return (f'<div class="med-strip" id="med-strip" role="note" aria-label="Medical disclaimer"><div class="wrap med-strip__in">{icon("shield")}'
            f'<p><strong>Education, not medical advice.</strong> In an emergency, call 911. <a href="/medical-disclaimer/">Learn more</a></p>'
            f'<button class="med-strip__close" type="button" data-close-strip aria-label="Dismiss medical disclaimer notice">{icon("close")}</button></div></div>'
            '<script>try{if(localStorage.getItem("f7y-strip"))document.getElementById("med-strip").hidden=true}catch(e){}</script>')

CHEVRON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'

def header(active, home):
    panels = mega_panels()
    items = ""
    for n, u, k in MENU:
        if k:
            cur = " data-current" if active == u else ""
            items += (f'<li class="mega__item"><button class="mega__trigger" type="button" aria-expanded="false" aria-controls="mega-{k}"{cur}>{esc(n)}{CHEVRON}</button>'
                      f'<div class="mega__panel" id="mega-{k}" hidden><div class="wrap">{panels[k]}</div></div></li>')
        else:
            cur = ' aria-current="page"' if active == u else ""
            items += f'<li class="mega__item"><a class="mega__link" href="{u}"{cur}>{esc(n)}</a></li>'
    dlinks = "".join(f'<li><a href="{u}">{esc(n)}</a></li>' for n, u, k in MENU) + '<li><a href="/medical-disclaimer/">Medical disclaimer</a></li>'
    return f"""{notice_strip()}
<header class="bar">
  <div class="wrap bar__in">
    <a class="bar__brand" href="/" aria-label="The First Seven Years — home">{logo_img(size=76, eager=True)}</a>
    <nav class="mega" aria-label="Main"><ul class="mega__menu">{items}</ul></nav>
    <div class="bar__tools">
      <button class="bar__search" type="button" data-focus-search aria-label="Search questions">{icon('search')}</button>
      <a class="btn btn--mint bar__cta" href="/ask-the-doctor/">{icon('chat')}Ask the Doctor</a>
      <button class="menu-btn" type="button" data-open-menu aria-controls="drawer" aria-expanded="false" aria-label="Open menu">{icon('menu')}</button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer" aria-hidden="true" role="dialog" aria-label="Menu">
  <div class="drawer__top">{logo_img(size=52)}<button class="drawer__close" type="button" data-close-menu aria-label="Close menu">{icon('close')}</button></div>
  <nav aria-label="Mobile"><ul>{dlinks}</ul></nav>
  <a class="btn btn--mint" href="/ask-the-doctor/">Ask Dr. Murray a question</a>
</div>"""

def med_notice(kind="answer", extra=""):
    if kind == "answer":
        return f"""<aside class="med-notice" aria-label="Medical disclaimer">
  <div class="med-notice__main">{icon('shield')}<div><h2>Medical disclaimer</h2>
    <p>This answer is general education from a named expert, reviewed before publishing. It is <strong>not medical advice, a diagnosis or a treatment plan for your child</strong>, and reading it does not create a doctor–patient relationship. Always check with your child’s own doctor before changing their care, diet or supplements. <a href="/medical-disclaimer/">Full medical disclaimer</a></p></div></div>
  <div class="med-notice__urgent">{icon('alert')}<div><h3>Get urgent help now — {EMERGENCY} — if your child:</h3>
    <ul><li>is struggling to breathe, or has blue or grey lips</li><li>is very drowsy, floppy or hard to wake</li><li>has a seizure</li><li>has swelling of the face or lips, or hives with breathing trouble</li><li>is under 3 months old with a temperature of 100.4°F (38°C) or higher</li></ul></div></div>
</aside>"""
    return f"""<aside class="med-notice med-notice--compact" aria-label="Medical disclaimer">
  <div class="med-notice__main">{icon('shield')}<div><h2>Before you watch</h2>
    <p>Conversations reflect the views of the host and guests and are for general education — <strong>not medical advice for your child</strong>. Guest views are not necessarily those of The First Seven Years. Episodes may include labelled sponsor messages from <strong>AskDrSears.com</strong> and <strong>OmegaQuant</strong>; sponsors have no say over editorial content.{extra} <a href="/medical-disclaimer/">Medical disclaimer</a> · <a href="/about/#disclosure">Disclosures</a></p></div></div>
</aside>"""

def footer():
    tl = "".join(f'<li><a href="{topic_url(t[0])}">{t[1]}</a></li>' for t in TOPICS[:7])
    fl = "".join(f'<li><a href="/videos/{f["path"]}/">{f["plural"]}</a></li>' for f in FORMATS.values())
    return f"""<footer class="footer">
  <div class="wrap">
    <div class="footer__disclaimer" role="note">{icon('shield')}<p><strong>Medical disclaimer.</strong> The First Seven Years shares general health education from doctors, researchers and health experts. It is not medical advice, diagnosis or treatment, and it does not replace care from your child’s own pediatrician or health professional. Never ignore professional advice or delay seeking it because of something you read or watched here. In an emergency, {EMERGENCY}. <a href="/medical-disclaimer/">Read the full medical disclaimer</a>.</p></div>
    <div class="footer__grid">
      <div class="footer__brand">{logo_img(size=104)}
        <p>Honest, expert answers for parents of children aged 0 to 7 — from the doctors and researchers on The First Seven Years.</p>
        <ul class="socials" aria-label="Follow">
          <li><a href="{YT}" rel="me noopener" target="_blank" aria-label="YouTube (opens in a new tab)">{icon('youtube')}</a></li>
          <li><a href="/#newsletter" aria-label="Newsletter">{icon('mail')}</a></li>
          <li><a href="/ask-the-doctor/" aria-label="Ask the Doctor">{icon('chat')}</a></li>
        </ul>
      </div>
      <div><h2>Topics</h2><ul>{tl}<li><a href="/topics/">All 13 topics →</a></li></ul></div>
      <div><h2>Watch &amp; listen</h2><ul>{fl}<li><a href="/experts/">Experts</a></li><li><a href="/search/">Search answers</a></li><li><a href="/ask-the-doctor/">Ask the Doctor</a></li></ul></div>
      <div><h2>About</h2><ul><li><a href="/about/">Our story</a></li><li><a href="/about/#standards">Editorial standards</a></li><li><a href="/about/#disclosure">Sponsors &amp; relationships</a></li><li><a href="/medical-disclaimer/">Medical disclaimer</a></li><li><a href="/book/">The book</a></li><li><a href="/privacy/">Privacy</a></li></ul></div>
    </div>
    <div class="footer__legal"><p>© {TODAY.year} The First Seven Years. All rights reserved.</p></div>
    <div class="wordmark" aria-hidden="true">First Seven Years</div>
  </div>
</footer>"""

def page(path, title, desc, body, ld=None, active=None, home=False, og_img=None, noindex=False):
    graph = [ORG, WEBSITE] + (ld or [])
    canonical = SITE + path
    og = og_img or SITE + "/assets/img/logo.jpg"
    doc = f"""<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canonical}">
{'<meta name="robots" content="noindex, nofollow">' if (noindex or STAGING) else '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
<meta name="theme-color" content="#2b3c56">
<meta property="og:type" content="{'website' if home else 'article'}">
<meta property="og:site_name" content="The First Seven Years">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/logo.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://i.ytimg.com">
<link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400..800;1,400..600&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,400..700,0..100,0..1;1,9..144,400..600,0..100,0..1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/main.css">
<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM summary">
<script type="application/ld+json">{json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)}</script>
</head>
<body class="{'home' if home else 'inner'}">
<a class="skip-link" href="#main">Skip to content</a>
{header(active, home)}
<main id="main">
{body}
</main>
{footer()}
<script src="/assets/js/search-index.js" defer></script>
<script src="/assets/js/main.js" defer></script>
</body>
</html>"""
    out = ROOT / path.lstrip("/") / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding="utf-8")
    SITEMAP.append((path, noindex))

SITEMAP = []

def qsearch(prompts, placeholder=None, scope=None, prefill=False, uid="qs"):
    ph = placeholder or prompts[0]
    return f"""<div class="qsearch" data-prompts="{esc('|'.join(prompts))}"{f' data-scope="{scope}"' if scope else ''}{' data-prefill' if prefill else ''}>
  <form role="search" action="/search/" method="get">
    <div class="qsearch__field">{icon('search')}
      <label class="sr-only" for="{uid}">Ask a question or search</label>
      <input id="{uid}" name="q" type="search" autocomplete="off" placeholder="{esc(ph)}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="{uid}-list">
      <button class="btn" type="submit">{icon('arrow')}<span>Find answers</span></button>
    </div>
  </form>
  <ul class="qsearch__results" id="{uid}-list" role="listbox" aria-label="Suggestions" hidden></ul>
</div>"""

PROMPTS = ["Why won’t my toddler eat vegetables?", "Is my child’s eczema a gut problem?", "How do I help their gut after antibiotics?",
           "Are pets good for my baby’s immune system?", "Why are ADHD diagnoses rising?", "What’s the difference between probiotics and prebiotics?"]

# --------------------------------------------------------------------------
# HOME
# --------------------------------------------------------------------------
def stack_html():
    blocks = [  # (label, colour, left in u, bottom in u, tilt)
        ("1", "mint", 0.0, 0, -3), ("2", "peach", 1.1, 0, 2), ("3", "butter", 2.2, 0, -1), ("4", "lilac", 3.3, 0, 3),
        ("5", "oat", 0.62, 1.04, 4), ("6", "navy", 1.72, 1.04, -3),
    ]
    b = "".join(f'<span class="block block--{c}" style="--i:{i};--tilt:{t}deg;left:calc(var(--u)*{x});bottom:calc(var(--u)*{y})">{n}</span>'
                for i, (n, c, x, y, t) in enumerate(blocks))
    buddy = """<span class="block block--mint buddy" style="--i:7;--tilt:-2deg;left:calc(var(--u)*1.52);bottom:calc(var(--u)*2.04)">
      <span class="buddy__face"><i class="brow brow--l"></i><i class="brow brow--r"></i>
        <span class="eye eye--l"><span class="pupil"></span></span><span class="eye eye--r"><span class="pupil"></span></span>
        <i class="cheek cheek--l"></i><i class="cheek cheek--r"></i><i class="smile"></i></span></span>
    <span class="block block--butter" style="--i:6;--tilt:5deg;left:calc(var(--u)*2.95);bottom:calc(var(--u)*1.04);width:calc(var(--u)*.8);height:calc(var(--u)*.8)">7</span>"""
    return f'<div class="stack"><span class="shadow-floor"></span>{b}{buddy}</div>'

def book_cover(tag="div"):
    return (f'<{tag} class="book__cover" role="img" aria-label="Cover concept for The First Seven Years book by Bryce Wylde">'
            '<span class="t1">The First</span><span class="t2">Seven<br>Years</span><span class="sq">' + '<i></i>' * 7 + '</span>'
            '<span class="by">Bryce Wylde</span><span class="sub">Approved by Dr. Bill Sears &amp; Dr. Murray Clarke</span>'
            f'</{tag}><p class="muted book__note">Cover concept for the website only — final cover and title come from the publisher.</p>')

def mixed(items, n, skip=("dr-bill-sears",)):
    """Pick up to n items, one per expert first, so no single voice dominates a row."""
    pool = [e for e in items if e["guest"] not in skip]
    out, seen = [], set()
    for e in pool:
        if e["guest"] not in seen: out.append(e); seen.add(e["guest"])
    out += [e for e in pool if e not in out]
    out += [e for e in items if e not in out]
    return out[:n]

# Welcome video (client Site Outline: "Welcome to The First Seven Years", Murray + Bryce, 60–90 sec, filmed at the
# September session). Set the YouTube id here once it is published; until then the card says so and links to About.
WELCOME_VIDEO = None

def welcome_card():
    if WELCOME_VIDEO:
        return f'<div class="welcome">{yt_facade(WELCOME_VIDEO, "Welcome to The First Seven Years", "Welcome · Dr. Murray Clarke & Bryce Wylde")}</div>'
    return ('<a class="welcome welcome--soon" href="/about/">'
            '<img src="/assets/img/dr-murray-clarke.jpg" alt="" width="800" height="875">'
            f'<span class="welcome__play">{icon("play")}</span>'
            '<span class="welcome__txt"><span class="welcome__tag">Welcome video · coming soon</span>'
            '<b>Welcome to The First Seven Years</b><small>Dr. Murray Clarke &amp; Bryce Wylde on what this library is — and how to use it</small></span></a>')

def build_home():
    sears_ep = EP_FULL["sears"]
    sears_videos = [e for e in EPISODES if e["guest"] == "dr-bill-sears" and e["kind"] == "video"]
    sears_social = [e for e in EPISODES if e["guest"] == "dr-bill-sears" and e["kind"] == "social"]
    by = {k: [e for e in EPISODES if e["kind"] == k] for k in FORMATS}
    sx = EXPERTS["dr-bill-sears"]

    rows = "".join(f"""<li><a class="topic-row" href="{topic_url(t[0])}" style="--sw:{t[3]}">
  <span class="n">{i+1:02d}</span><span class="name">{t[1]}</span><span class="desc">{t[2]}</span>
  <span class="count">{topic_count(t[0])}</span><span class="go">{icon('arrow')}</span></a></li>""" for i, t in enumerate(TOPICS))

    fmt_cols = ""
    for k, f in FORMATS.items():
        items = mixed(by[k], 3)
        lst = "".join(f'<li><a href="{ep_url(e)}"{" target=_blank rel=noopener" if k == "social" else ""}><img src="{("https://i.ytimg.com/vi/" + e["id"] + "/oar2.jpg") if k == "social" else thumb(e["id"])}" alt="" width="120" height="68" loading="lazy"><span>{esc(e["title"])}<small>{dur(e)} · {EXPERTS[e["guest"]]["name"]}</small></span></a></li>' for e in items)
        fmt_cols += f"""<div class="fmt-col fmt-col--{k}">
  <span class="fmt-badge fmt-badge--{k} fmt-badge--lg">{f['label']}</span>
  <h3>{f['plural']}</h3><p>{f['blurb']}</p>
  <ul>{lst}</ul>
  <a class="link-arrow" href="/videos/{f['path']}/">All {f['plural'].lower()} ({len(by[k])}) {icon('arrow')}</a></div>"""
    latest_ep = next(e for e in by["episode"] if e["guest"] != "dr-bill-sears")

    recent = "".join(f"<li>{answer_card(a)}</li>" for a in ANSWERS[:6])
    trio = "".join(avatar(s, 44) for s in ("dr-murray-clarke", "dr-bill-sears", "bryce-wylde"))
    pick = [ANS[k] for k in ("restoring-the-gut-after-antibiotics", "is-my-childs-eczema-a-gut-problem", "are-pets-and-dirt-good-for-immunity", "can-stress-in-pregnancy-affect-my-baby")]
    asking = "".join(f'''<li><a href="{ans_url(q)}">{avatar(q["expert"], 40)}<span><b>{esc(q["q"])}</b><small>{EXPERTS[q["expert"]]["name"]} · {ep_label(EPV[q["video"]])} · {dur(EPV[q["video"]])}</small></span>{icon("arrow")}</a></li>''' for q in pick)

    body = f"""
<section class="hero-banner" aria-labelledby="hero-title">
  <div class="wrap hero-banner__in">
    <div class="hero-banner__copy">
      <span class="pill pill--mint">For parents of children 0–7</span>
      <h1 id="hero-title">Every question about the <em class="accent">first seven years</em>, answered by people who know.</h1>
      <p class="lede">Short, reviewed answers from doctors and health experts — with the video behind every one.</p>
      {qsearch(PROMPTS, uid="hero-q")}
      <div class="qsearch__chips" aria-label="Popular questions">
        <a class="chip" href="{ans_url(ANS['what-should-my-babys-first-food-be'])}">First foods</a>
        <a class="chip" href="{ans_url(ANS['is-my-childs-eczema-a-gut-problem'])}">Eczema &amp; the gut</a>
        <a class="chip" href="{ans_url(ANS['restoring-the-gut-after-antibiotics'])}">After antibiotics</a>
        <a class="chip" href="/topics/picky-eating/">Picky eating</a>
      </div>
      <div class="trio"><span class="trio__faces">{trio}</span><p>With <a href="/experts/dr-murray-clarke/">Dr. Murray Clarke</a>, <a href="/experts/dr-bill-sears/">Dr. Bill Sears</a> and <a href="/experts/bryce-wylde/">Bryce Wylde</a></p></div>
    </div>
    <div class="hero-panel">
      {welcome_card()}
      <div class="asking">
        <p class="asking__h"><span>Parents are asking</span><a href="/search/">See all</a></p>
        <ul>{asking}</ul>
      </div>
    </div>
  </div>
</section>

<section class="section--tight sears" aria-labelledby="sears-title">
  <div class="wrap">
    <div class="sears__band">
      <div class="sears__media">{yt_facade(sears_ep['id'], sears_ep['title'], 'Full episode · ' + dur(sears_ep) + ' · Dr. Bill Sears')}</div>
      <div class="sears__copy">
        <span class="eyebrow">Featured expert</span>
        <div class="sears__who">{avatar('dr-bill-sears', 64)}<div><h2 id="sears-title">Dr. Bill Sears</h2><p>{sx['role']}</p></div></div>
        <p class="lede">{sx['short']} On The First Seven Years he talks first foods, breastfeeding and the nutrients growing children need most.</p>
        <ul class="cred-chips"><li>Pediatrician</li><li>40+ books, including The Baby Book</li><li>Approved The First Seven Years book</li></ul>
        <div class="btn-row"><a class="btn" href="{ep_url(sears_ep)}">{icon('play')}Watch the full episode</a><a class="link-arrow" href="/experts/dr-bill-sears/">Dr. Sears’ profile {icon('arrow')}</a></div>
      </div>
    </div>
    <p class="sponsor-note">{icon('link')}<span>{sx['disclosure']}</span></p>
  </div>
</section>

<section class="section" aria-labelledby="topics-title">
  <div class="wrap">
    <div class="section-head reveal">
      <h2 id="topics-title">Thirteen topics. <em class="accent">Zero</em> judgement.</h2>
      <p class="lede">Each topic brings together short answers, videos and the experts behind them — so you can go as deep as you have time for tonight.</p>
    </div>
    <ul class="topic-index reveal">{rows}</ul>
  </div>
</section>

<section class="section--tight watch" aria-labelledby="watch-title">
  <div class="wrap">
    <div class="section-head reveal">
      <h2 id="watch-title">Watch &amp; listen, your way</h2>
      <p class="lede">Got an hour on a walk, ten minutes at nap time, or one minute in the school queue? Each format is labelled, so you always know what you’re starting.</p>
    </div>
    <div class="fmt-cols reveal">{fmt_cols}</div>
  </div>
</section>

<section class="section" aria-labelledby="doc-title">
  <div class="wrap doctor">
    <div class="doctor__photo reveal">
      <span class="blob"></span>
      <img src="/assets/img/dr-murray-clarke.jpg" alt="Dr. Murray Clarke, smiling, in a navy blazer" width="800" height="875" loading="lazy">
      <div class="doctor__tag"><b>Dr. Murray Clarke</b><span>Host · answers Ask the Doctor</span></div>
    </div>
    <div class="reveal" style="--d:120ms">
      <span class="eyebrow">Meet your host</span>
      <h2 id="doc-title" class="h1" style="margin-top:.8rem">The doctor in your corner.</h2>
      <p class="lede" style="margin-top:1.25rem">Dr. Murray Clarke hosts The First Seven Years with Bryce Wylde, sitting down with pediatricians, researchers and practitioners — then turning those conversations into short answers you can use tonight.</p>
      <div class="doctor__facts">
        <div><b>116+</b><span>episodes &amp; clips</span></div>
        <div><b>13</b><span>topic hubs</span></div>
        <div><b>0–7</b><span>every age covered</span></div>
      </div>
      <a class="btn" href="/experts/dr-murray-clarke/">About Dr. Murray {icon('arrow')}</a>
      <a class="link-arrow" style="margin-left:1rem" href="/about/#standards">How answers are reviewed {icon('arrow')}</a>
    </div>
  </div>
</section>

<section class="section--tight" aria-labelledby="ask-title">
  <div class="wrap">
    <div class="ask-band reveal">
      <div>
        <span class="eyebrow">Ask the Doctor</span>
        <h2 id="ask-title" style="margin-top:.8rem">Can’t find it? <em class="accent">Ask Dr. Murray.</em></h2>
        <p class="lede">Send your question — no account, no fuss. The questions parents ask most become new video answers in the library, and we’ll email you when yours is live.</p>
        <p class="muted" style="margin-top:.8rem;font-size:.9rem">General education only — not for emergencies or personal medical advice.</p>
        <p style="margin-top:1.5rem"><a class="btn" href="/ask-the-doctor/">{icon('chat')}Ask a question</a></p>
      </div>
      <div class="ask-band__card" aria-hidden="true">
        <span class="from">Asked by a parent of a 2-year-old</span>
        <span class="q">“Every time she has antibiotics her tummy is upset for weeks. Is there anything we can do to help her bounce back?”</span>
        <div class="ans"><img src="/assets/img/dr-murray-clarke.jpg" alt=""><p><strong>Answered on video</strong> · 9 min<br>Gut health &amp; microbiome</p></div>
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="recent-title">
  <div class="wrap">
    <div class="section-head reveal">
      <h2 id="recent-title">Recently answered</h2>
      <p class="lede">Short, practical answers — each one with the expert video it came from, and the date it was last reviewed.</p>
    </div>
    <ul class="answers reveal">{recent}</ul>
  </div>
</section>

<section class="section--tight" aria-labelledby="book-title">
  <div class="wrap book">
    <div class="book__cover-wrap reveal">{book_cover()}</div>
    <div class="reveal" style="--d:120ms">
      <span class="eyebrow">The book · publication details to come</span>
      <h2 id="book-title" class="h1" style="margin-top:.8rem">The First Seven Years, in print.</h2>
      <p class="lede" style="margin-top:1rem">Written by Bryce Wylde and approved by Dr. Bill Sears and Dr. Murray Clarke. This site will be its living companion — updated answers, expert videos and references for every topic the book covers.</p>
      <form class="inline-form" data-email-form data-success="You’re on the list — we’ll email you when publication details are announced.">
        <label class="sr-only" for="book-email">Email address</label>
        <input id="book-email" type="email" required placeholder="you@example.com" autocomplete="email">
        <button class="btn" type="submit">Tell me when it’s out</button>
      </form>
      <p class="form-msg" role="status"></p>
      <a class="link-arrow" href="/book/">About the book {icon('arrow')}</a>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="trust-title">
  <div class="wrap">
    <h2 id="trust-title" class="sr-only">Why you can trust this library</h2>
    <div class="trust reveal">
      <div>{icon('shield')}<h3>Reviewed, then published</h3><p>Every answer is reviewed before it goes live, and shows the date it was last checked.</p></div>
      <div>{icon('users')}<h3>Named experts</h3><p>You always know who is speaking, what their background is, and where the answer came from.</p></div>
      <div>{icon('link')}<h3>Sponsors disclosed</h3><p>AskDrSears.com and OmegaQuant sponsor the show. Sponsor messages are labelled and never shape the answers.</p></div>
      <div>{icon('alert')}<h3>Education, not diagnosis</h3><p>We explain the why. Your child’s own doctor is always the right person for their care. <a href="/medical-disclaimer/">Medical disclaimer</a></p></div>
    </div>
  </div>
</section>

<section class="section--tight" id="newsletter" aria-labelledby="nl-title">
  <div class="wrap">
    <div class="newsletter reveal">
      <div><h2 id="nl-title">One good answer, every Sunday.</h2><p style="margin-top:.8rem">A single question, answered well — plus the week’s new videos. Unsubscribe any time.</p></div>
      <div>
        <form class="inline-form" data-email-form data-success="Welcome — your first Sunday answer is on its way.">
          <label class="sr-only" for="nl-email">Email address</label>
          <input id="nl-email" type="email" required placeholder="you@example.com" autocomplete="email">
          <button class="btn" type="submit">Subscribe</button>
        </form>
        <p class="form-msg" role="status"></p>
      </div>
    </div>
  </div>
</section>"""
    ld = [{"@type": "WebPage", "@id": SITE + "/#webpage", "url": SITE + "/", "name": "The First Seven Years",
           "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": SITE + "/#org"},
           "audience": {"@type": "PeopleAudience", "audienceType": "Parents of children aged 0–7"}},
          {"@type": "PodcastSeries", "name": "The First Seven Years", "url": SITE + "/videos/full-episodes/", "webFeed": YT,
           "author": {"@id": SITE + "/experts/dr-murray-clarke/#person"}},
          person_ld("dr-murray-clarke"), person_ld("dr-bill-sears"), dict(video_ld(sears_ep), **{"@id": SITE + ep_url(sears_ep) + "#video"})]
    page("/", "The First Seven Years — Expert answers for parents of kids 0–7",
         "Reviewed answers to the questions parents of young children ask most — first foods, gut health, eczema, sleep and more — with Dr. Murray Clarke, Dr. Bill Sears and Bryce Wylde.",
         body, ld, home=True)

# --------------------------------------------------------------------------
# TOPICS
# --------------------------------------------------------------------------
def build_topics():
    rows = "".join(f"""<li><a class="topic-row" href="{topic_url(t[0])}" style="--sw:{t[3]}">
  <span class="n">{i+1:02d}</span><span class="name">{t[1]}</span><span class="desc">{t[2]}</span>
  <span class="count">{topic_count(t[0])}</span><span class="go">{icon('arrow')}</span></a></li>""" for i, t in enumerate(TOPICS))
    cr = [("Home", "/"), ("Topics", None)]
    body = f"""<div class="page-head page-head--tint"><div class="wrap">{crumbs(cr)}
<h1>All topics</h1><p class="lede">Thirteen areas parents ask about most. Each hub collects the short answers, full episodes and experts for that topic.</p>
<div style="margin-top:2rem">{qsearch(PROMPTS, uid="t-q")}</div></div></div>
<section class="section--tight"><div class="wrap"><ul class="topic-index">{rows}</ul></div></section>"""
    ld = [ld_crumbs(cr), {"@type": "CollectionPage", "name": "Topics", "url": SITE + "/topics/",
          "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + topic_url(t[0]), "name": t[1]} for i, t in enumerate(TOPICS)]}}]
    page("/topics/", "Topics — The First Seven Years", "Browse 13 topic hubs for parents of children aged 0–7: gut health, nutrition, picky eating, eczema, allergies, immunity, sleep, ADHD and more.", body, ld, active="/topics/")

    for t in TOPICS:
        slug, name, short, sw, intro = t
        eps, ans = eps_for(slug), ans_for(slug)
        orient = next((e for e in eps if e["kind"] == "episode"), next((e for e in eps if e["kind"] == "video"), None))
        experts = []
        for e in eps + [{"guest": a["expert"]} for a in ans]:
            if e["guest"] not in experts: experts.append(e["guest"])
        cr = [("Home", "/"), ("Topics", "/topics/"), (name, None)]
        ans_html = f'<ul class="answers">{"".join(f"<li>{answer_card(a)}</li>" for a in ans)}</ul>' if ans else \
            f'<div class="card"><p>We’re writing the first answers for this topic now. <a class="link-arrow" href="/ask-the-doctor/">Ask Dr. Murray about {name.lower()} {icon("arrow")}</a></p></div>'
        eps_html = "".join(
            f'<div class="hub-fmt"><h3><span class="fmt-badge fmt-badge--{k}">{FORMATS[k]["label"]}</span> {FORMATS[k]["plural"]} <small>{len(g)}</small></h3>'
            + (f'<div class="social-row">{"".join(social_card(e) for e in g[:8])}</div>' if k == "social" else f'<div class="ep-grid">{"".join(ep_card(e) for e in g[:6])}</div>')
            + '</div>'
            for k in FORMATS for g in [[e for e in eps if e["kind"] == k]] if g) if eps else \
            '<p class="muted">Videos on this topic are in production. Subscribe on YouTube to hear first.</p>'
        exp_html = "".join(expert_tile(s) for s in experts[:4])
        others = [x for x in TOPICS if x[0] != slug][:6]
        body = f"""<div class="page-head page-head--tint" style="--tint:{sw}"><div class="wrap">{crumbs(cr)}
<span class="eyebrow">Topic hub</span>
<h1 style="margin-top:.6rem">{name}</h1><p class="lede">{intro}</p>
<div class="hub-meta"><span class="pill">{len(ans)} answer{'s' * (len(ans) != 1)}</span>{"".join(f'<span class="pill">{n} {FORMATS[k]["plural"].lower() if n != 1 else FORMATS[k]["label"].lower()}</span>' for k in FORMATS for n in [sum(1 for e in eps if e["kind"] == k)] if n)}<span class="pill">Ages 0–7</span></div></div></div>
<section class="section--tight"><div class="wrap layout-2">
<div>
  {f'<h2 class="h3" style="margin-bottom:1rem">Start here</h2>{yt_facade(orient["id"], orient["title"], "Start here · " + ep_label(orient) + " · " + dur(orient))}<p class="muted" style="margin-top:.8rem">{esc(orient["title"])}</p>' if orient else ''}
  <h2 class="h2" style="margin:3rem 0 1.25rem">Parent questions</h2>
  {ans_html}
  <h2 class="h2" style="margin:3.5rem 0 1.25rem">Watch &amp; listen</h2>
  {eps_html}
  <p class="hub-note">{icon('shield')}<span>Answers and videos here are general education, not medical advice for your child. <a href="/medical-disclaimer/">Medical disclaimer</a></span></p>
</div>
<aside class="aside" aria-label="About this topic">
  <div class="card"><h2>Experts on this topic</h2><ul class="related" style="margin-top:.5rem">{"".join(f'<li><a href="{expert_url(s)}">{EXPERTS[s]["name"]}<small>{EXPERTS[s]["role"]}</small></a></li>' for s in experts[:5]) or '<li class="muted">Dr. Murray Clarke</li>'}</ul></div>
  <div class="card" style="background:var(--peach-soft);border-color:transparent"><h2>Still wondering?</h2><p style="margin:.5rem 0 1rem;font-size:.95rem">Send Dr. Murray your {name.lower()} question.</p><a class="btn" href="/ask-the-doctor/">Ask the Doctor</a></div>
  <div class="card"><h2>Other topics</h2><ul class="tags" style="margin-top:.8rem">{"".join(f'<li><a href="{topic_url(x[0])}">{x[1]}</a></li>' for x in others)}</ul></div>
</aside></div></section>"""
        ld = [ld_crumbs(cr), {"@type": "CollectionPage", "name": name, "description": intro, "url": SITE + topic_url(slug),
              "about": {"@type": "Thing", "name": name}, "audience": {"@type": "PeopleAudience", "audienceType": "Parents"},
              "mainEntity": {"@type": "ItemList", "itemListElement":
                  [{"@type": "ListItem", "position": i + 1, "url": SITE + u} for i, u in enumerate([ans_url(a) for a in ans] + [ep_url(e) for e in eps])]}}]
        if orient: ld.append(video_ld(orient))
        page(topic_url(slug), f"{name} for kids 0–7 — The First Seven Years", f"{intro} Expert answers and videos for parents.", body, ld, active="/topics/")

def expert_tile(s):
    x = EXPERTS[s]
    img = f'<img src="{x["img"]}" alt="" loading="lazy" width="800" height="875">' if x["img"] else f'<span class="ini">{"".join(w[0] for w in x["name"].replace("Dr. ","").split()[:2])}</span>'
    return f'<a class="expert-card" href="{expert_url(s)}"><span class="expert-card__img" style="--c:{x["c"]}">{img}</span><span><b>{x["name"]}</b><span>{x["role"]}</span></span></a>'

# --------------------------------------------------------------------------
# ANSWERS
# --------------------------------------------------------------------------
def build_answers():
    for a in ANSWERS:
        t = TOPIC[a["topic"]]; x = EXPERTS[a["expert"]]; v = EPV[a["video"]]
        cr = [("Home", "/"), ("Topics", "/topics/"), (t[1], topic_url(t[0])), (a["q"], None)]
        related = [r for r in ANSWERS if r is not a and (r["topic"] == a["topic"] or a["topic"] in r["also"] or r["topic"] in a["also"])][:4]
        rel_eps = [e for e in EPISODES if a["topic"] in e["tags"] and e["id"] != a["video"]][:3]
        full = EP_FULL.get(v["ep"])
        av = f'<img src="{x["img"]}" alt="" width="44" height="44">' if x["img"] else f'<span style="width:44px;height:44px;border-radius:50%;background:{x["c"]};display:grid;place-items:center;font-family:var(--font-display);font-weight:600">{x["name"].replace("Dr. ","")[0]}</span>'
        body_extra = a.get("body") or f"""
<h2>Watch the full answer</h2>
<p>{EXPERTS[a['expert']]['name']} answers this in the video above, a {round(v['secs'] / 60)}-minute video from The First Seven Years.{f' For the whole discussion, <a href="{ep_url(full)}">watch the full episode</a>.' if full else ''}</p>
<h2>When to talk to your doctor</h2>
<p>If you are worried about your child, if symptoms are getting worse, or if something just doesn’t feel right, speak to your pediatrician. Trust your instincts — you know your child best.</p>"""
        body = f"""<div class="page-head" style="padding-bottom:0"><div class="wrap">{crumbs(cr)}</div></div>
<article class="section--tight" style="padding-top:0"><div class="wrap layout-2">
<div>
  <span class="eyebrow">{t[1]}</span>
  <h1 class="h1" style="margin-top:.7rem;max-width:22ch">{esc(a['q'])}</h1>
  <div class="byline">
    <div class="byline__who">{av}<div><a href="{expert_url(a['expert'])}">{x['name']}</a><small>{x['role']}</small></div></div>
    <div class="byline__dates"><span>Published <b><time datetime="{a['published']}">{fmt(a['published'])}</time></b></span>
      <span class="badge-review">{icon('check')}Reviewed <time datetime="{a['reviewed']}">{fmt(a['reviewed'])}</time></span>
      <span class="badge-draft" title="Prototype copy — replace with client-supplied, compliance-cleared text">Pending clinical review</span></div>
  </div>
  <div class="review-line">{icon('shield')}<span><b>Reviewed by Dr. Murray Clarke</b>, clinical lead · scientific reviewer to be named</span>
    <details><summary>How we review</summary><p>Every answer goes through scientific review — and legal and regulatory review where needed — before it is published. Each page shows when it was published and last reviewed, and high-traffic pages are re-checked every quarter. <a href="/about/#standards">Our editorial standards</a></p></details></div>
  <section class="quick" aria-labelledby="qa"><h2 id="qa">The short answer</h2><p class="speakable">{esc(a['quick'])}</p></section>
  {med_notice("answer")}
  {yt_facade(v['id'], v['title'], 'Watch the answer · ' + ep_label(v) + ' · ' + dur(v) + ' · ' + x['name'])}
  <div class="prose" style="margin-top:2.5rem">{body_extra}</div>
  <section class="refs" aria-labelledby="refs-h"><h2 id="refs-h">References</h2>
    {('<ol>' + "".join(f"<li>{r}</li>" for r in a['refs']) + '</ol>') if a.get('refs') else '<p class="muted">Numbered references are added during scientific review, before this answer is published. <span class="badge-draft">Draft</span></p>'}</section>
  <div class="helpful" data-helpful><p id="hf-{a['slug']}">Was this answer helpful?</p><div role="group" aria-labelledby="hf-{a['slug']}"><button class="chip" type="button" data-v="yes">Yes</button><button class="chip" type="button" data-v="no">Not really</button></div><p class="helpful__thanks" role="status"></p></div>
  <div class="expert-card-lg">{avatar(a['expert'], 72)}<div><span class="eyebrow">About the expert</span><b><a href="{expert_url(a['expert'])}">{x['name']}</a></b><small>{x['role']}</small><p>{x['short']}</p></div></div>
  <div class="disclosure" style="margin-top:2rem"><b>About this answer</b><span>Experts share their own clinical views and experience; appearing here is not an endorsement of any product or service.{(' ' + x['disclosure']) if x.get('disclosure') and a['expert'] != 'dr-murray-clarke' else ''} <a href="/about/#disclosure">Sponsors &amp; relationships</a> · <a href="/medical-disclaimer/">Medical disclaimer</a></span></div>
</div>
<aside class="aside" aria-label="Related">
  <div class="card"><h2>More in {t[1]}</h2><ul class="related">{"".join(f'<li><a href="{ans_url(r)}">{esc(r["q"])}<small>{EXPERTS[r["expert"]]["name"]}</small></a></li>' for r in related) or '<li class="muted">More answers coming soon.</li>'}</ul>
  <p style="margin-top:1rem"><a class="link-arrow" href="{topic_url(t[0])}">Topic hub {icon('arrow')}</a></p></div>
  {f'<div class="card"><h2>Related videos</h2><ul class="related">' + "".join(f'<li><a href="{ep_url(e)}">{esc(e["title"])}<small>{ep_label(e)} · {EXPERTS[e["guest"]]["name"]}</small></a></li>' for e in rel_eps) + '</ul></div>' if rel_eps else ''}
  <div class="card" style="background:var(--mint-soft);border-color:transparent"><h2>Different question?</h2><p style="margin:.5rem 0 1rem;font-size:.95rem">Dr. Murray answers the questions parents ask most.</p><a class="btn" href="/ask-the-doctor/">Ask the Doctor</a></div>
</aside></div></article>"""
        url = SITE + ans_url(a)
        ld = [ld_crumbs(cr),
              {"@type": "MedicalWebPage", "@id": url + "#webpage", "url": url, "name": a["q"], "lastReviewed": a["reviewed"].isoformat(),
               "reviewedBy": {"@id": SITE + "/experts/dr-murray-clarke/#person"}, "audience": {"@type": "PeopleAudience", "audienceType": "Parents"},
               "about": {"@type": "MedicalCondition" if a["topic"] in ("skin-eczema", "allergies") else "Thing", "name": t[1]},
               "speakable": {"@type": "SpeakableSpecification", "cssSelector": [".speakable"]},
               "mainEntity": {"@id": url + "#article"}, "isPartOf": {"@id": SITE + "/#website"}},
              {"@type": "Article", "@id": url + "#article", "headline": a["q"], "description": a["quick"],
               "datePublished": a["published"].isoformat(), "dateModified": a["reviewed"].isoformat(),
               "author": {"@id": f"{SITE}/experts/{a['expert']}/#person"}, "publisher": {"@id": SITE + "/#org"},
               "image": thumb(v["id"], "maxresdefault"), "articleSection": t[1], "video": video_ld(v)},
              person_ld(a["expert"]), person_ld("dr-murray-clarke")]
        page(ans_url(a), f"{a['q']} — The First Seven Years", a["quick"][:155].rsplit(" ", 1)[0] + "…", body, ld, active="/topics/", og_img=thumb(v["id"], "maxresdefault"))

# --------------------------------------------------------------------------
# EPISODES — library (crawlable pagination) + episode pages
# --------------------------------------------------------------------------
PODCAST_LINKS = [  # TODO: replace search links with the show's exact Apple / Spotify URLs
    ("YouTube", YT), ("Apple Podcasts", "https://podcasts.apple.com/us/search?term=The%20First%20Seven%20Years%20Murray%20Clarke"),
    ("Spotify", "https://open.spotify.com/search/The%20First%20Seven%20Years%20podcast"),
]

def format_nav(active):
    counts = {k: sum(1 for e in EPISODES if e["kind"] == k) for k in FORMATS}
    items = [("All formats", "/videos/", len(EPISODES), "all")] + [(FORMATS[k]["plural"], f"/videos/{FORMATS[k]['path']}/", counts[k], k) for k in FORMATS]
    return '<nav class="fmt-tabs" aria-label="Video formats">' + "".join(
        f'<a class="fmt-tab fmt-tab--{k}" href="{u}"{" aria-current=page" if k == active else ""}><b>{n}</b><small>{c}</small></a>' for n, u, c, k in items) + "</nav>"

def format_section(k, items, limit=None, more=True):
    f = FORMATS[k]
    shown = items[:limit] if limit else items
    grid = f'<div class="social-row">{"".join(social_card(e) for e in shown)}</div>' if k == "social" else \
           f'<div class="ep-grid">{"".join(ep_card(e, lazy=i > 3) for i, e in enumerate(shown))}</div>'
    link = f'<a class="link-arrow" href="/videos/{f["path"]}/">All {f["plural"].lower()} ({len(items)}) {icon("arrow")}</a>' if more and limit and len(items) > limit else ""
    return f"""<section class="fmt-section fmt-section--{k}" aria-labelledby="fs-{k}">
  <div class="fmt-section__head"><div><span class="fmt-badge fmt-badge--{k} fmt-badge--lg">{f['label']}</span>
    <h2 id="fs-{k}" class="h2">{f['plural']}</h2><p class="muted">{f['blurb']}</p></div>{link}</div>
  {grid}</section>"""

def build_episodes():
    by = {k: [e for e in EPISODES if e["kind"] == k] for k in FORMATS}
    plat = "".join(f'<a class="chip" href="{u}" target="_blank" rel="noopener">{n}</a>' for n, u in PODCAST_LINKS)
    # overview
    cr = [("Home", "/"), ("Watch & listen", None)]
    body = f"""<div class="page-head page-head--tint" style="--tint:var(--lilac-soft)"><div class="wrap">{crumbs(cr)}
<h1>Watch &amp; listen</h1><p class="lede">Three ways in, depending on how much time you have: the full conversation, a short video on one question, or a quick clip for your phone.</p>
<div class="qsearch__chips" style="justify-content:flex-start" aria-label="Listen on">{plat}</div>
<div style="margin-top:1.75rem">{qsearch(["Search videos — try “eczema” or “first foods”", "Search by expert — try “Bill Sears”", "Search by topic — try “antibiotics”"], scope="episode", uid="ep-q")}</div></div></div>
<section class="section--tight"><div class="wrap">{format_nav("all")}
{format_section("episode", by["episode"], 6)}{format_section("video", by["video"], 9)}{format_section("social", by["social"], 8)}
<p class="muted" style="margin-top:2rem">Showing what is published on this site so far. The full archive of 116+ episodes is moving across as each item clears review.</p>
</div></section>"""
    ld = [ld_crumbs(cr), {"@type": "CollectionPage", "name": "Watch & listen", "url": SITE + "/videos/",
          "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": (SITE + ep_url(e)) if e["kind"] != "social" else ep_url(e), "name": e["title"]} for i, e in enumerate(EPISODES)]}}]
    page("/videos/", "Watch & listen — episodes, short videos and clips | The First Seven Years",
         "Full podcast episodes, 7–12-minute expert videos and short clips on children’s nutrition, gut health, eczema, first foods and more.", body, ld, active="/videos/")
    # one crawlable page per format
    for k, f in FORMATS.items():
        cr = [("Home", "/"), ("Watch & listen", "/videos/"), (f["plural"], None)]
        body = f"""<div class="page-head page-head--tint" style="--tint:var(--lilac-soft)"><div class="wrap">{crumbs(cr)}
<span class="fmt-badge fmt-badge--{k} fmt-badge--lg">{f['label']}</span><h1 style="margin-top:.8rem">{f['plural']}</h1><p class="lede">{f['blurb']}</p></div></div>
<section class="section--tight"><div class="wrap">{format_nav(k)}{format_section(k, by[k], more=False)}</div></section>"""
        ld = [ld_crumbs(cr), {"@type": "CollectionPage", "name": f["plural"], "url": SITE + f"/videos/{f['path']}/"}]
        page(f"/videos/{f['path']}/", f"{f['plural']} — The First Seven Years", f["blurb"], body, ld, active="/videos/")

    for e in EPISODES:
        if e["kind"] == "social": continue
        g = EXPERTS[e["guest"]]; full = EP_FULL.get(e["ep"])
        cr = [("Home", "/"), ("Watch & listen", "/videos/"), (FORMATS[e["kind"]]["plural"], f"/videos/{FORMATS[e['kind']]['path']}/"), (e["title"], None)]
        related_ans = [a for a in ANSWERS if set([a["topic"]] + a["also"]) & set(e["tags"])][:4]
        more = [x for x in EPISODES if x is not e and x["kind"] != "social" and (x["guest"] == e["guest"] or set(x["tags"]) & set(e["tags"]))][:3]
        hosts = '<a href="/experts/dr-murray-clarke/">Dr. Murray Clarke</a> and <a href="/experts/bryce-wylde/">Bryce Wylde</a>'
        gl = '<a href="%s">%s</a>' % (expert_url(e['guest']), g['name'])
        if e["kind"] == "episode":
            summary = f"<p>In this {dur(e)} conversation, {hosts} sit down with {gl}: <em>{esc(e['title'])}</em></p><p>Below you’ll find the short videos taken from it, the parent answers it informs, and the full transcript.</p>"
        else:
            fl = (' from <a href="%s">the full episode</a>' % ep_url(full)) if full else ''
            summary = f"<p>A {round(e['secs'] / 60)}-minute video{fl} with {gl}, focused on one question.</p>"
        clips = [x for x in EPISODES if x["ep"] == e["ep"] and x is not e] if e["kind"] == "episode" else []
        av = f'<img src="{g["img"]}" alt="" width="44" height="44">' if g["img"] else f'<span style="width:44px;height:44px;border-radius:50%;background:{g["c"]};display:grid;place-items:center;font-family:var(--font-display);font-weight:600">{g["name"].replace("Dr. ","")[0]}</span>'
        sponsor = f' {g["disclosure"]}' if g.get("disclosure") and e["guest"] != "dr-murray-clarke" else ""
        body = f"""<div class="page-head" style="padding-bottom:1.5rem"><div class="wrap">{crumbs(cr)}
<div class="hub-meta" style="margin:0 0 1rem"><span class="fmt-badge fmt-badge--{e['kind']} fmt-badge--lg">{ep_label(e)}</span><span class="pill">{dur(e)}</span><span class="pill"><time datetime="{e['date']}">{fmt(e['date'])}</time></span></div>
<h1 class="h1" style="max-width:24ch">{esc(e['title'])}</h1></div></div>
<article class="section--tight" style="padding-top:0"><div class="wrap layout-2">
<div>
  {yt_facade(e['id'], e['title'], ep_label(e) + ' · ' + dur(e) + ' · ' + g['name'])}
  {med_notice("video", sponsor)}
  <div class="byline"><div class="byline__who">{av}<div>{'Guest' if e['kind']=='episode' else 'Expert'}: <a href="{expert_url(e['guest'])}">{g['name']}</a><small>{g['role']}</small></div></div>
    <div class="byline__dates"><span>Hosted by <b>Dr. Murray Clarke</b> &amp; <b>Bryce Wylde</b></span></div></div>
  <div class="prose">{summary}</div>
  {'<div class="qsearch__chips" style="justify-content:flex-start" aria-label="Listen on">' + "".join(f'<a class="chip" href="{u}" target="_blank" rel="noopener">Listen on {n}</a>' for n, u in PODCAST_LINKS) + '</div>' if e['kind']=='episode' else ''}
  <ul class="tags" style="margin-top:1.5rem" aria-label="Topics">{"".join(f'<li><a href="{topic_url(t)}">{TOPIC[t][1]}</a></li>' for t in e['tags'])}</ul>
  {f'<h2 class="h3" style="margin:2.5rem 0 1rem">From this episode</h2><div class="ep-grid">' + "".join(ep_card(c) for c in clips if c["kind"] == "video") + '</div>' + ('<div class="social-row" style="margin-top:1.5rem">' + "".join(social_card(c) for c in clips if c["kind"] == "social") + '</div>' if any(c["kind"] == "social" for c in clips) else '') if clips else ''}
  <div class="ep-tabs" style="margin-top:2.5rem">
    <div class="ep-tabs__list" role="tablist" aria-label="Episode details">
      <button role="tab" id="t-sum" aria-controls="p-sum" aria-selected="true" tabindex="0">Show notes</button>
      <button role="tab" id="t-ch" aria-controls="p-ch" aria-selected="false" tabindex="-1">Chapters</button>
      <button role="tab" id="t-tr" aria-controls="p-tr" aria-selected="false" tabindex="-1">Transcript</button>
    </div>
    <div class="ep-tabs__panel" role="tabpanel" id="p-sum" aria-labelledby="t-sum" tabindex="0"><p>Key takeaways and the questions this {'episode' if e['kind']=='episode' else 'video'} answers are written from the reviewed transcript. Each takeaway links to its parent answer page.</p></div>
    <div class="ep-tabs__panel" role="tabpanel" id="p-ch" aria-labelledby="t-ch" tabindex="0" hidden><p>Chapters with timestamps are imported from the YouTube description, so you can jump straight to the part you need — and Google can show them as key moments.</p></div>
    <div class="ep-tabs__panel" role="tabpanel" id="p-tr" aria-labelledby="t-tr" tabindex="0" hidden><p>The full edited transcript is published here, free and in plain text, so every word spoken can be found by search engines and AI assistants.</p></div>
  </div>
</div>
<aside class="aside" aria-label="Related">
  {'<div class="card"><h2>Parent answers on this</h2><ul class="related">' + "".join(f'<li><a href="{ans_url(a)}">{esc(a["q"])}<small>{TOPIC[a["topic"]][1]}</small></a></li>' for a in related_ans) + '</ul></div>' if related_ans else ''}
  {f'<div class="card"><h2>Full episode</h2><ul class="related"><li><a href="{ep_url(full)}">{esc(full["title"])}<small>{dur(full)} · {g["name"]}</small></a></li></ul></div>' if full and e['kind'] != 'episode' else ''}
  <div class="card"><h2>Watch next</h2><ul class="related">{"".join(f'<li><a href="{ep_url(x)}">{esc(x["title"])}<small>{ep_label(x)} · {dur(x)} · {EXPERTS[x["guest"]]["name"]}</small></a></li>' for x in more)}</ul></div>
</aside></div></article>"""
        url = SITE + ep_url(e)
        ld = [ld_crumbs(cr), dict(video_ld(e), **{"@id": url + "#video"}),
              {"@type": "PodcastEpisode" if e["kind"] == "episode" else "WebPage", "@id": url + "#page", "url": url, "name": e["title"],
               "description": ep_desc(e), "datePublished": e["date"].isoformat(),
               **({"partOfSeries": {"@type": "PodcastSeries", "name": "The First Seven Years", "url": SITE + "/videos/full-episodes/"},
                   "actor": [{"@id": SITE + "/experts/dr-murray-clarke/#person"}, {"@id": f"{SITE}/experts/bryce-wylde/#person"}, {"@id": f"{SITE}/experts/{e['guest']}/#person"}],
                   **({"episodeNumber": e["ep"]} if isinstance(e["ep"], int) else {})}
                  if e["kind"] == "episode" else {"mainEntity": {"@id": url + "#video"}}),
               "associatedMedia": {"@id": url + "#video"}},
              person_ld(e["guest"])]
        page(ep_url(e), f"{e['title']} — The First Seven Years", ep_desc(e)[:158], body, ld, active="/videos/", og_img=thumb(e["id"], "maxresdefault"))

# --------------------------------------------------------------------------
# EXPERTS
# --------------------------------------------------------------------------
def build_experts():
    cr = [("Home", "/"), ("Experts", None)]
    body = f"""<div class="page-head page-head--tint" style="--tint:var(--peach-soft)"><div class="wrap">{crumbs(cr)}
<h1>The experts</h1><p class="lede">You always know who is speaking. Our hosts, and the pediatricians, researchers and practitioners who join them.</p></div></div>
<section class="section--tight"><div class="wrap"><ul class="experts">{"".join(f"<li>{expert_tile(s)}</li>" for s in EXPERTS)}</ul></div></section>
<section class="section--tight" id="review-team"><div class="wrap">
  <div class="section-head"><h2>Who checks the answers</h2><p class="lede">Every answer is reviewed before it is published. These are the roles behind that review.</p></div>
  <ul class="principles">
    <li><h3>Clinical lead</h3><p><b>Dr. Murray Clarke</b> — final clinical sign-off on flagged content.</p></li>
    <li><h3>Scientific reviewer</h3><p><b>To be announced</b> — checks the evidence, sources and accuracy of every health answer.</p></li>
    <li><h3>Legal &amp; regulatory review</h3><p><b>To be announced</b> — checks disclosures and wording near nutrition and supplements.</p></li>
    <li><h3>Editorial</h3><p>Turns reviewed language into clear, plain-English pages and keeps tone and attribution consistent.</p></li>
  </ul>
  <p class="muted" style="margin-top:1.25rem">How we verify experts: credentials are supplied by each expert and checked before their profile is published. Guests share their own views. <a href="/about/#standards">Editorial standards</a></p>
</div></section>"""
    page("/experts/", "Experts — The First Seven Years", "Meet Dr. Murray Clarke, co-host Bryce Wylde and the pediatricians and practitioners who join The First Seven Years.",
         body, [ld_crumbs(cr)] + [person_ld(s) for s in EXPERTS], active="/experts/")
    for s, x in EXPERTS.items():
        cr = [("Home", "/"), ("Experts", "/experts/"), (x["name"], None)]
        eps = [e for e in EPISODES if e["guest"] == s] if s not in ("dr-murray-clarke", "bryce-wylde") else [e for e in EPISODES if e["kind"] != "social"][:6]
        ans = [a for a in ANSWERS if a["expert"] == s] if s != "dr-murray-clarke" else ANSWERS[:6]
        img = f'<img src="{x["img"]}" alt="Portrait of {x["name"]}" width="800" height="875">' if x["img"] else f'<div style="height:100%;display:grid;place-items:center;background:{x["c"]};font-family:var(--font-display);font-size:6rem;color:var(--navy)">{"".join(w[0] for w in x["name"].replace("Dr. ","").split()[:2])}</div>'
        body = f"""<div class="page-head" style="padding-bottom:1rem"><div class="wrap">{crumbs(cr)}</div></div>
<section class="section--tight" style="padding-top:0"><div class="wrap profile">
  <div class="profile__img" style="background:{x['c']}">{img}</div>
  <div>
    <span class="eyebrow">{x['role']}</span>
    <h1 class="display" style="margin-top:.6rem">{x['name']}</h1>
    <div class="prose" style="margin-top:1.5rem">{"".join(f"<p{' class=lede' if i==0 else ''}>{p}</p>" for i, p in enumerate(x['bio']))}</div>
    <ul class="creds">{"".join(f"<li>{icon('check')}<span>{c}</span></li>" for c in x['creds'])}</ul>
    {f'<div class="profile-disclosure" role="note">{icon("link")}<div><b>Relationship disclosure</b><p>{x["disclosure"]}</p></div></div>' if x.get('disclosure') else ''}
    {'<p style="margin-top:2rem"><a class="btn" href="/ask-the-doctor/">' + icon('chat') + 'Ask Dr. Murray a question</a></p>' if s == 'dr-murray-clarke' else ''}
    {f'<h2 class="h3" style="margin:3rem 0 1rem">Answers</h2><ul class="answers">' + "".join(f"<li>{answer_card(a)}</li>" for a in ans) + '</ul>' if ans else ''}
    {f'<h2 class="h3" style="margin:3rem 0 1rem">{"Latest videos" if s in ("dr-murray-clarke","bryce-wylde") else "Episodes & videos"}</h2><div class="ep-grid">' + "".join(ep_card(e) for e in eps if e["kind"] != "social") + '</div>' if eps else ''}
    {f'<div class="social-row" style="margin-top:1.5rem">' + "".join(social_card(e) for e in eps if e["kind"] == "social") + '</div>' if any(e["kind"] == "social" for e in eps) else ''}
    <p class="muted" style="margin-top:2rem;font-size:.85rem">Profile last reviewed <time datetime="{TODAY}">{fmt(TODAY)}</time>. Credentials are supplied and confirmed by the expert.</p>
  </div>
</div></section>"""
        ld = [ld_crumbs(cr), {"@type": "ProfilePage", "url": SITE + expert_url(s), "mainEntity": {"@id": f"{SITE}/experts/{s}/#person"}}, person_ld(s)]
        page(expert_url(s), f"{x['name']} — {x['role'].split('·')[0].strip()} | The First Seven Years", x["short"], body, ld, active="/experts/",
             og_img=SITE + x["img"] if x["img"] else None)

# --------------------------------------------------------------------------
# ASK THE DOCTOR, ABOUT, BOOK, SEARCH, PRIVACY
# --------------------------------------------------------------------------
def build_ask():
    cr = [("Home", "/"), ("Ask the Doctor", None)]
    ages = "".join(f'<input type="radio" name="age" id="age{i}" value="{i}"{" aria-describedby=age-err" if i==0 else ""}><label for="age{i}">{i if i else "<1"}</label>' for i in range(8))
    opts = "".join(f'<option value="{t[0]}">{t[1]}</option>' for t in TOPICS)
    body = f"""<div class="page-head page-head--tint" style="--tint:var(--peach-soft)"><div class="wrap">{crumbs(cr)}
<span class="eyebrow">Free · no account needed</span>
<h1 style="margin-top:.6rem">Ask the Doctor</h1>
<p class="lede">Send Dr. Murray your question about your child’s health, nutrition or development. The questions parents ask most become new video answers in the library.</p></div></div>
<section class="section--tight" style="padding-top:0"><div class="wrap layout-2">
<div class="card" style="padding:clamp(1.25rem,4vw,2.5rem)">
  <div class="notice notice--urgent" style="margin-bottom:1.5rem">{icon('alert')}<span><strong>Not for emergencies.</strong> If your child is struggling to breathe, is unusually drowsy, has a seizure, or you are worried right now — call your local emergency number or go to the nearest emergency department.</span></div>
  <form id="ask-form" class="form" novalidate>
    <fieldset class="field"><legend>How old is your child?</legend><div class="age-pick">{ages}</div><span class="err" id="age-err" aria-live="polite"></span></fieldset>
    <div class="field"><label for="topic">Closest topic</label>
      <select id="topic" name="topic" aria-describedby="topic-err"><option value="">Choose a topic…</option>{opts}<option value="other">Something else</option></select>
      <span class="err" id="topic-err" aria-live="polite"></span></div>
    <div class="field"><label for="q">Your question</label>
      <span class="hint" id="q-hint">Share what you’ve noticed and what you’ve tried. Please don’t include your child’s full name.</span>
      <textarea id="q" name="question" maxlength="1200" aria-describedby="q-hint q-err"></textarea>
      <span class="counter" id="q-count" aria-live="off">0 / 1200</span>
      <div class="notice notice--urgent" id="urgent" hidden role="alert">{icon('alert')}<span>Some of what you’ve described can need urgent care. Please contact your doctor or emergency services now rather than waiting for an answer here.</span></div>
      <span class="err" id="q-err" aria-live="polite"></span></div>
    <div class="field-row">
      <div class="field"><label for="fname">First name <span class="muted">(optional)</span></label><input id="fname" name="first_name" autocomplete="given-name"></div>
      <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" aria-describedby="email-hint email-err"><span class="hint" id="email-hint">Only used to tell you when it’s answered.</span><span class="err" id="email-err" aria-live="polite"></span></div>
    </div>
    <label class="check"><input type="checkbox" id="consent" aria-describedby="consent-err"><span>I understand answers are general education — not a diagnosis or personal medical advice — and my question may be answered publicly without my name. Sending a question does not create a doctor–patient relationship.</span></label>
    <span class="err" id="consent-err" aria-live="polite"></span>
    <label class="check"><input type="checkbox" name="newsletter"><span>Also send me one good answer every Sunday.</span></label>
    <div><button class="btn" type="submit">{icon('chat')}Send my question</button></div>
  </form>
  <div id="ask-success" class="success" hidden tabindex="-1">
    <span class="tick">{icon('check')}</span>
    <h2 class="h2">Thank you — it’s with Dr. Murray.</h2>
    <p class="lede" style="margin:0 auto">We read every question. If yours is chosen for an answer, we’ll email you a link. In the meantime, search the library — someone may have asked already.</p>
    <a class="btn btn--ghost" href="/search/">Search answers</a>
  </div>
</div>
<aside class="aside">
  <div class="card"><h2>How it works</h2><ol class="steps" style="margin-top:1rem">
    <li><div><b>You ask</b><p>Takes two minutes. No account.</p></div></li>
    <li><div><b>We group questions</b><p>Similar questions are answered together, so more parents benefit.</p></div></li>
    <li><div><b>Dr. Murray answers</b><p>On video, reviewed before it’s published.</p></div></li>
    <li><div><b>You get the link</b><p>We email you when your answer is live.</p></div></li></ol></div>
  <div class="card"><h2>Asked recently</h2><ul class="related">{"".join(f'<li><a href="{ans_url(a)}">{esc(a["q"])}</a></li>' for a in ANSWERS[:4])}</ul></div>
</aside></div></section>"""
    ld = [ld_crumbs(cr), {"@type": "ContactPage", "name": "Ask the Doctor", "url": SITE + "/ask-the-doctor/",
          "description": "Send Dr. Murray Clarke a question about your child’s health, nutrition or development."}]
    page("/ask-the-doctor/", "Ask the Doctor — send Dr. Murray your question | The First Seven Years",
         "Free: ask Dr. Murray Clarke a question about your child aged 0–7. The most common questions become new video answers.", body, ld)

def build_about():
    cr = [("Home", "/"), ("About", None)]
    body = f"""<div class="page-head page-head--tint"><div class="wrap">{crumbs(cr)}
<h1>Why the <em class="accent">first seven</em> years?</h1>
<p class="lede">Because so much is set in motion before a child turns seven — the microbiome, the immune system, sleep, appetite and the brain’s wiring for focus and feelings. Parents deserve clear, honest explanations of all of it.</p></div></div>
<section class="section--tight"><div class="wrap-narrow prose">
<p class="lede">The First Seven Years began as a podcast and video series, hosted by Dr. Murray Clarke and co-host Bryce Wylde. Over more than a hundred conversations with pediatricians, researchers and practitioners, one thing kept coming up: parents didn’t want another hour-long episode at 11pm. They wanted the answer to <em>their</em> question.</p>
<p>So we built this library. Every conversation is broken into short, searchable answers, organised by topic and by your child’s age — with the full episode always one click away when you want the depth.</p>
</div></section>
<section class="section--tight" id="standards"><div class="wrap">
<div class="section-head"><h2>Editorial standards</h2><p class="lede">How an answer gets from a conversation to this site.</p></div>
<ul class="principles">
  <li><h3>Named, qualified voices</h3><p>Every answer names the expert speaking and links to their profile and credentials.</p></li>
  <li><h3>Reviewed before publishing</h3><p>Answers are reviewed before they go live. Nothing publishes as a draft.</p></li>
  <li><h3>Dated and re-checked</h3><p>Each page shows when it was published and when it was last reviewed. We revisit answers as evidence changes.</p></li>
  <li><h3>Education, not diagnosis</h3><p>We explain the why and share expert views. We never diagnose, and we always point you back to your own doctor.</p></li>
  <li><h3>Clear on uncertainty</h3><p>Where evidence is early or mixed — especially for newer therapies — we say so plainly.</p></li>
  <li><h3>Corrections welcome</h3><p>Spotted something out of date? Tell us and we’ll review it, and note the change on the page.</p></li>
</ul></div></section>
<section class="section--tight" id="disclosure"><div class="wrap-narrow prose">
<h2>Relationships &amp; disclosure</h2>
<p>Trust is the whole point of this library, so here is how we handle money and relationships:</p>
<ul>
  <li><strong>Our hosts and experts.</strong> Relationships that could matter to you — such as a business interest or a sponsor connection — are disclosed on each expert’s profile. See <a href="/experts/dr-murray-clarke/">Dr. Murray Clarke</a> and <a href="/experts/dr-bill-sears/">Dr. Bill Sears</a>.</li>
  <li><strong>Sponsors.</strong> The show is sponsored by AskDrSears.com and OmegaQuant. Sponsor messages are always labelled, and sponsors have no input into which questions we answer or what the answers say.</li>
  <li><strong>Guests.</strong> Guests share their own clinical views and experience. Appearing on the show is not an endorsement of any product or service they offer.</li>
  <li><strong>No product recommendations in answers.</strong> Answers explain nutrients, foods and approaches — not brands.</li>
</ul>
<h2>Accessibility</h2>
<p>This site is built to WCAG 2.1 AA: readable contrast, full keyboard navigation, captions on video, and transcripts on every episode. If anything gets in your way, please tell us.</p>
</div></section>"""
    ld = [ld_crumbs(cr), {"@type": "AboutPage", "name": "About The First Seven Years", "url": SITE + "/about/", "about": {"@id": SITE + "/#org"}}]
    page("/about/", "About & editorial standards — The First Seven Years",
         "Why The First Seven Years exists, how answers are reviewed, and how we disclose sponsors and relationships.", body, ld, active="/about/")

def build_book():
    # Per client brief (Strategy v2 §9, Site Outline §7): written by Bryce Wylde, approved by Dr. Bill Sears and
    # Dr. Murray Clarke; agent is shopping the manuscript. Light landing page until the publishing path is set:
    # authors + authority network, companion resources linked to topic hubs, never reproduce the manuscript.
    cr = [("Home", "/"), ("The book", None)]
    companions = [t for t in TOPICS if t[0] in ("first-foods", "gut-health", "picky-eating", "skin-eczema", "supplements", "omega-3s")]
    authors = [("bryce-wylde", "Author"), ("dr-bill-sears", "Approved the book"), ("dr-murray-clarke", "Approved the book")]
    body = f"""<div class="page-head" style="padding-bottom:0"><div class="wrap">{crumbs(cr)}</div></div>
<section class="section--tight" style="padding-top:0"><div class="wrap book">
  <div class="book__cover-wrap">{book_cover()}</div>
  <div>
    <span class="eyebrow">The book · publication details to come</span>
    <h1 class="display" style="margin-top:.6rem">The First Seven Years</h1>
    <p class="lede" style="margin-top:1rem">The book is written by Bryce Wylde and approved by Dr. Bill Sears and Dr. Murray Clarke. Publisher, format and date will be announced here first.</p>
    <p style="margin-top:1rem;color:var(--ink-2)">When it arrives, this site becomes its living companion: up-to-date answers, expert videos and references for the topics the book covers — so the conversation keeps going after the last page.</p>
    <form class="inline-form" data-email-form data-success="You’re on the list — we’ll email you when publication details are announced.">
      <label class="sr-only" for="bk-email">Email address</label>
      <input id="bk-email" type="email" required placeholder="you@example.com" autocomplete="email">
      <button class="btn" type="submit">Tell me when it’s out</button>
    </form>
    <p class="form-msg" role="status"></p>
  </div>
</div></section>
<section class="section--tight"><div class="wrap">
  <div class="section-head"><h2>The people behind the book</h2><p class="lede">One author, two doctors who approved it, and the show that keeps the conversation going.</p></div>
  <ul class="experts">{"".join(f'<li>{expert_tile(s)}<p class="book-role">{r}</p></li>' for s, r in authors)}</ul>
</div></section>
<section class="section--tight"><div class="wrap">
  <div class="section-head"><h2>Companion resources</h2><p class="lede">Start with the topics parents ask about most. Each hub collects reviewed answers and videos from the show.</p></div>
  <ul class="answers">{"".join(f'<li><a class="answer-card" href="{topic_url(t[0])}"><span class="q">{t[1]}</span><span class="who"><i style="background:{t[3]}"></i>{topic_count(t[0])}</span></a></li>' for t in companions)}</ul>
  <p class="muted" style="margin-top:1.5rem;font-size:.9rem">Companion pages add to the book; they never reproduce it. Book content appears on this site only within the publishing rights agreed.</p>
</div></section>"""
    ld = [ld_crumbs(cr), {"@type": "Book", "name": "The First Seven Years", "url": SITE + "/book/", "inLanguage": "en",
          "author": {"@id": SITE + "/experts/bryce-wylde/#person"},
          "contributor": [{"@id": SITE + "/experts/dr-bill-sears/#person"}, {"@id": SITE + "/experts/dr-murray-clarke/#person"}],
          "description": "The First Seven Years, written by Bryce Wylde and approved by Dr. Bill Sears and Dr. Murray Clarke."},
          person_ld("bryce-wylde"), person_ld("dr-bill-sears")]
    page("/book/", "The First Seven Years — the book by Bryce Wylde",
         "The First Seven Years, written by Bryce Wylde and approved by Dr. Bill Sears and Dr. Murray Clarke. Join the list to hear when it’s published.", body, ld, active="/book/")

def build_disclaimer():
    cr = [("Home", "/"), ("Medical disclaimer", None)]
    body = f"""<div class="page-head page-head--tint" style="--tint:var(--mint-soft)"><div class="wrap">{crumbs(cr)}
<span class="eyebrow">Please read</span><h1 style="margin-top:.6rem">Medical disclaimer</h1>
<p class="lede">The First Seven Years shares answers from doctors and health experts. Here is exactly what that information is — and what it isn’t.</p></div></div>
<section class="section--tight" style="padding-top:0"><div class="wrap-narrow prose">
<div class="notice notice--urgent">{icon('alert')}<span><strong>In an emergency, {EMERGENCY}</strong> or go to the nearest emergency department. Do not use this website, Ask the Doctor or email to get help in an emergency.</span></div>
<div style="margin:1.5rem 0 2rem">{yt_facade("eiTPZD2GPkE", "The Official First Seven Years Disclaimer", "The official First Seven Years disclaimer · 0:24")}</div>
<h2>Education, not medical advice</h2>
<p>All content on this website — including written answers, videos, podcast episodes, clips, transcripts, newsletters and responses to questions — is general health education for parents and caregivers. It is not medical advice, and it is not a diagnosis or treatment for any individual child.</p>
<p>Every child is different. Always talk to your child’s own pediatrician, family doctor or other qualified health professional about their health, and before you start, stop or change any treatment, diet, medicine or supplement. Never ignore professional medical advice, or delay seeking it, because of something you read, watched or heard here.</p>
<h2>No doctor–patient relationship</h2>
<p>Using this website, watching our videos or sending a question through Ask the Doctor does not create a doctor–patient or other professional relationship with Dr. Murray Clarke, Dr. Bill Sears, Bryce Wylde, any guest expert, or The First Seven Years. Answers to submitted questions are general and may be published for all parents, without your name.</p>
<h2>Expert and guest views</h2>
<p>Hosts and guests share their own clinical experience and opinions. Guest views are their own and are not necessarily the views of The First Seven Years. Where evidence is early, mixed or still developing, we aim to say so plainly. Appearing on the show is not an endorsement of any product, service or practitioner.</p>
<h2>How content is reviewed</h2>
<p>Answers are reviewed before they are published, and each page shows when it was published and when it was last reviewed. Health knowledge changes, so information may become out of date between reviews. If you believe something is inaccurate, please tell us and we will review it.</p>
<h2>Nutrition and supplements</h2>
<p>Discussions of nutrients, foods and supplements are educational. The First Seven Years does not sell products, and nothing here is a recommendation to buy a particular product. Supplements are not intended to diagnose, treat, cure or prevent any disease. Check with your child’s doctor before giving any supplement, especially to babies and young children, or during pregnancy and breastfeeding.</p>
<h2>Sponsors and relationships</h2>
<p>The show is sponsored by AskDrSears.com and OmegaQuant. Sponsor messages are always labelled, and sponsors have no say over which questions we answer or what the answers say. Personal relationships of our hosts and experts are disclosed on their profiles. <a href="/about/#disclosure">Read our disclosure policy</a>.</p>
<h2>Links to other websites</h2>
<p>We may link to other websites and platforms, such as YouTube and podcast apps. We are not responsible for their content or privacy practices.</p>
<p class="muted">Last reviewed <time datetime="{TODAY}">{fmt(TODAY)}</time>. Final wording to be approved by the client’s legal and regulatory reviewer.</p>
</div></section>"""
    ld = [ld_crumbs(cr), {"@type": "WebPage", "name": "Medical disclaimer", "url": SITE + "/medical-disclaimer/", "lastReviewed": TODAY.isoformat()}]
    page("/medical-disclaimer/", "Medical disclaimer — The First Seven Years",
         "The First Seven Years shares general health education from doctors and health experts. It is not medical advice. Read what that means for you and your child.", body, ld, active="/about/")

def build_search_privacy():
    cr = [("Home", "/"), ("Search", None)]
    body = f"""<div class="page-head page-head--tint" style="min-height:60vh"><div class="wrap">{crumbs(cr)}
<h1>What would you like to know?</h1><p class="lede">Ask in your own words — we’ll find the answers, episodes and experts that match.</p>
<div style="margin-top:2rem">{qsearch(PROMPTS, prefill=True, uid="s-q")}</div>
<div class="qsearch__chips" style="justify-content:flex-start">{"".join(f'<a class="chip" href="{topic_url(t[0])}">{t[1]}</a>' for t in TOPICS[:8])}</div></div></div>"""
    page("/search/", "Search — The First Seven Years", "Search expert answers and episodes for parents of children aged 0–7.", body, [ld_crumbs(cr)], noindex=True)
    cr = [("Home", "/"), ("Privacy", None)]
    body = f"""<div class="page-head"><div class="wrap">{crumbs(cr)}<h1>Privacy</h1></div></div>
<section class="section--tight" style="padding-top:0"><div class="wrap-narrow prose">
<p class="lede">Short version: we collect as little as possible, we never collect data about children, and videos don’t set cookies until you press play.</p>
<h2>What we collect</h2><ul><li>Your email, if you subscribe or ask a question.</li><li>The question you send, stored without your child’s name.</li><li>Anonymous analytics about which pages are useful.</li></ul>
<h2>Video</h2><p>Videos load from YouTube’s privacy-enhanced domain and only after you choose to play them.</p>
<p class="muted">Full policy to be supplied by the client’s legal team.</p></div></section>"""
    page("/privacy/", "Privacy — The First Seven Years", "How The First Seven Years handles your data.", body, [ld_crumbs(cr)])

# --------------------------------------------------------------------------
# SEARCH INDEX, SITEMAP, ROBOTS, LLMS.TXT, FAVICON
# --------------------------------------------------------------------------
def build_meta():
    idx = [{"k": "answer", "t": a["q"], "s": f"{EXPERTS[a['expert']]['name']} · {TOPIC[a['topic']][1]}", "u": ans_url(a), "x": a["quick"] + " " + " ".join(TOPIC[t][1] for t in [a["topic"]] + a["also"])} for a in ANSWERS]
    idx += [{"k": "topic", "t": t[1], "s": t[2], "u": topic_url(t[0]), "x": t[4]} for t in TOPICS]
    idx += [{"k": "episode", "t": e["title"], "s": f"{ep_label(e)} · {dur(e)} · {EXPERTS[e['guest']]['name']}", "u": ep_url(e), "x": EXPERTS[e["guest"]]["name"] + " " + " ".join(TOPIC[t][1] for t in e["tags"])} for e in EPISODES]
    idx += [{"k": "expert", "t": x["name"], "s": x["role"], "u": expert_url(s), "x": x["short"]} for s, x in EXPERTS.items()]
    (ROOT / "assets/js/search-index.js").write_text("window.F7_INDEX=" + json.dumps(idx, ensure_ascii=False) + ";", encoding="utf-8")

    urls = "".join(f"<url><loc>{SITE}{p}</loc><lastmod>{TODAY}</lastmod></url>" for p, ni in SITEMAP if not ni)
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>', encoding="utf-8")

    bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "Bingbot"]
    if STAGING:
        (ROOT / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    else:
      (ROOT / "robots.txt").write_text("User-agent: *\nAllow: /\nDisallow: /search/\n\n" + "".join(f"User-agent: {b}\nAllow: /\n\n" for b in bots) + f"Sitemap: {SITE}/sitemap.xml\n", encoding="utf-8")

    llms = [f"# The First Seven Years", "",
            "> Expert answers for parents of children aged 0–7, from the podcast and video series hosted by Dr. Murray Clarke with co-host Bryce Wylde. Educational content, not medical advice. Each answer names the expert, shows publish and review dates, and links to the source video.", "",
            "## Parent answers"] + [f"- [{a['q']}]({SITE}{ans_url(a)}): {a['quick']}" for a in ANSWERS] + ["", "## Topics"] + \
           [f"- [{t[1]}]({SITE}{topic_url(t[0])}): {t[4]}" for t in TOPICS] + ["", "## Experts"] + \
           [f"- [{x['name']}]({SITE}{expert_url(s)}): {x['short']}" for s, x in EXPERTS.items()] + ["", "## Full episodes"] + \
           [f"- [{e['title']}]({SITE}{ep_url(e)}): {ep_desc(e)}" for e in EP_FULL.values()] + ["", "## About", f"- [Editorial standards & disclosure]({SITE}/about/)", f"- [Ask the Doctor]({SITE}/ask-the-doctor/)"]
    (ROOT / "llms.txt").write_text("\n".join(llms) + "\n", encoding="utf-8")

    fav = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2b3c56"/>' + \
          "".join(f'<rect x="{9 + i*6.6:.1f}" y="44" width="4.6" height="4.6" rx="1" fill="#a6d6b0"/>' for i in range(7)) + \
          '<text x="32" y="37" font-family="Georgia,serif" font-weight="700" font-size="30" fill="#eaf8ef" text-anchor="middle">7</text></svg>'
    (ROOT / "assets/img/favicon.svg").write_text(fav, encoding="utf-8")

def clean():
    # generated page folders only — hand-written assets/ are never touched
    import shutil
    for d in ("episodes", "videos", "topics", "answers", "experts", "ask-the-doctor", "about", "book", "search", "privacy", "medical-disclaimer"):
        if (ROOT / d).is_dir(): shutil.rmtree(ROOT / d)

if __name__ == "__main__":
    clean()
    build_home(); build_topics(); build_answers(); build_episodes(); build_experts()
    build_ask(); build_about(); build_book(); build_disclaimer(); build_search_privacy(); build_meta()
    print(f"Built {len(SITEMAP)} pages -> {ROOT}")
