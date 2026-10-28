const F7U=u=>{if(!u||u[0]!=='/'||u[1]==='/')return u;const m=u.slice(1).match(/^([^?#]*)(.*)$/);let p=m[1];if(p===''||p.endsWith('/'))p+='index.html';return (window.F7_ROOT||'/')+p+m[2];};
/* The First Seven Years — site behaviour. No framework, no dependencies. */
(() => {
  document.documentElement.classList.remove('no-js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- sticky bar ---------- */
  const bar = $('.bar');
  const hero = $('.hero');
  if (bar) {
    const onScroll = () => {
      const y = window.scrollY;
      bar.classList.toggle('is-scrolled', y > 8);
      if (hero) bar.classList.toggle('is-visible', y > hero.offsetHeight * 0.55);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    // enable the slide only after first paint, so font swaps on load don't animate it
    window.addEventListener('load', () => requestAnimationFrame(() => bar.classList.add('is-ready')));
  }

  /* ---------- mega menu (disclosure pattern: click / Enter / Space, Esc closes) ---------- */
  const triggers = $$('.mega__trigger');
  const closeAll = except => triggers.forEach(t => {
    if (t === except) return;
    t.setAttribute('aria-expanded', 'false');
    document.getElementById(t.getAttribute('aria-controls')).hidden = true;
  });
  triggers.forEach(t => {
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    const open = () => { closeAll(t); t.setAttribute('aria-expanded', 'true'); panel.hidden = false; };
    t.addEventListener('click', () => (t.getAttribute('aria-expanded') === 'true' ? closeAll() : open()));
    // hover intent on mouse only; touch and keyboard use click
    let hoverTimer;
    const item = t.closest('.mega__item');
    item.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { clearTimeout(hoverTimer); hoverTimer = setTimeout(open, 120); } });
    item.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => { t.setAttribute('aria-expanded', 'false'); panel.hidden = true; }, 180); } });
    panel.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) { t.setAttribute('aria-expanded', 'false'); panel.hidden = true; } });
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const openT = triggers.find(t => t.getAttribute('aria-expanded') === 'true');
    if (openT) { closeAll(); openT.focus(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.mega')) closeAll(); });

  /* ---------- dismissible medical notice strip (remembered per browser) ---------- */
  $('[data-close-strip]')?.addEventListener('click', () => {
    $('#med-strip').hidden = true;
    try { localStorage.setItem('f7y-strip', '1'); } catch (e) {}
  });

  /* ---------- "Was this helpful?" ---------- */
  $$('[data-helpful]').forEach(w => $$('button', w).forEach(b => b.addEventListener('click', () => {
    $$('button', w).forEach(x => x.setAttribute('aria-pressed', x === b));
    $('.helpful__thanks', w).textContent = b.dataset.v === 'yes' ? 'Thanks — glad it helped.' : 'Thanks — we use this to improve our answers.';
    if (window.gtag) gtag('event', 'answer_feedback', { value: b.dataset.v, page: location.pathname });
  })));

  /* ---------- mobile drawer ---------- */
  const drawer = $('#drawer');
  const openBtns = $$('[data-open-menu]');
  if (drawer) {
    const close = () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      openBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
      document.body.style.overflow = '';
    };
    openBtns.forEach(b => b.addEventListener('click', () => {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      b.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      $('a, button', drawer)?.focus();
    }));
    $('[data-close-menu]', drawer)?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) close(); });
  }

  /* ---------- search shortcut buttons focus the nearest search ---------- */
  $$('[data-focus-search]').forEach(b => b.addEventListener('click', () => {
    const input = $('.qsearch input');
    if (input) { input.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); setTimeout(() => input.focus(), 350); }
    else location.href = F7U('/search/');
  }));

  /* ---------- question search: rotating placeholder + typeahead ---------- */
  $$('.qsearch').forEach(box => {
    const input = $('input', box);
    const list = $('.qsearch__results', box);
    const scope = box.dataset.scope; // optional: "episode"
    const prompts = (box.dataset.prompts || '').split('|').filter(Boolean);
    let pi = 0, timer;

    if (prompts.length && !reduce) {
      timer = setInterval(() => {
        if (document.activeElement === input || input.value) return;
        input.classList.add('is-swapping');
        setTimeout(() => {
          pi = (pi + 1) % prompts.length;
          input.placeholder = prompts[pi];
          input.classList.remove('is-swapping');
        }, 240);
      }, 3200);
    }

    const index = (window.F7_INDEX || []).filter(d => !scope || d.k === scope);
    const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');
    // plain-English synonyms, mirroring Shopify Search & Discovery
    const SYN = { "won't eat": 'picky eating', 'wont eat': 'picky eating', fussy: 'picky eating', poop: 'constipation gut', tummy: 'gut', rash: 'eczema skin', itchy: 'eczema skin', focus: 'adhd attention', hyper: 'adhd', vitamins: 'supplements', bugs: 'probiotics', germs: 'immune', cold: 'immune illness', sleep: 'sleep bedtime', tantrum: 'emotions behaviour', meltdown: 'emotions behaviour' };
    const expand = q => { let out = q; for (const k in SYN) if (q.includes(k)) out += ' ' + SYN[k]; return out; };
    const kindOrder = { answer: 0, topic: 1, episode: 2, expert: 3 };
    const labels = { answer: 'Answer', episode: 'Video', topic: 'Topic', expert: 'Expert' };
    let active = -1;

    const render = q => {
      const terms = norm(expand(q.toLowerCase())).split(/\s+/).filter(t => t.length > 1);
      if (!terms.length) { list.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
      const scored = index.map(d => {
        const hay = norm(d.t + ' ' + (d.s || '') + ' ' + (d.x || ''));
        const title = norm(d.t);
        let score = 0;
        terms.forEach(t => { if (title.includes(t)) score += 3; else if (hay.includes(t)) score += 1; });
        return { d, score };
      }).filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score || kindOrder[a.d.k] - kindOrder[b.d.k])
        .slice(0, 8)
        .sort((a, b) => kindOrder[a.d.k] - kindOrder[b.d.k] || b.score - a.score);

      active = -1;
      list.innerHTML = scored.length
        ? scored.map((r, i) => `<li role="presentation"><a role="option" id="${list.id}-o${i}" href="${F7U(r.d.u)}"><span class="kind kind--${r.d.k}">${labels[r.d.k]}</span><span class="t">${r.d.t}</span><span class="s">${r.d.s || ''}</span></a></li>`).join('')
        : `<li class="qsearch__empty">No answer yet for “${q.replace(/[<>&"]/g, '')}”. <a class="link-arrow" href="${F7U('/ask-the-doctor/?q='+encodeURIComponent(q))}">Ask Dr. Murray instead</a></li>`;
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    };

    input.addEventListener('input', () => render(input.value.trim()));
    input.addEventListener('focus', () => input.value.trim() && render(input.value.trim()));
    input.addEventListener('keydown', e => {
      const opts = $$('[role="option"]', list);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!opts.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
        opts.forEach((o, i) => o.setAttribute('aria-selected', i === active));
        input.setAttribute('aria-activedescendant', opts[active].id);
      } else if (e.key === 'Enter' && active > -1 && opts[active]) {
        e.preventDefault(); location.href = opts[active].getAttribute('href');
      } else if (e.key === 'Escape') { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('click', e => { if (!box.contains(e.target)) list.hidden = true; });
    box.querySelector('form')?.addEventListener('submit', e => {
      const first = $('[role="option"]', list);
      if (!input.value.trim()) { e.preventDefault(); input.focus(); return; }
      if (first) { e.preventDefault(); location.href = first.getAttribute('href'); }
    });
    // prefill from ?q=
    const q = new URLSearchParams(location.search).get('q');
    if (q && box.dataset.prefill !== undefined) { input.value = q; render(q); }
  });

  /* ---------- buddy: pupils follow the pointer ---------- */
  const pupils = $$('.pupil');
  if (pupils.length && !reduce && window.matchMedia('(pointer: fine)').matches) {
    let raf;
    window.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        pupils.forEach(p => {
          const r = p.parentElement.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const a = Math.atan2(e.clientY - cy, e.clientX - cx);
          const d = Math.min(r.width * 0.2, Math.hypot(e.clientX - cx, e.clientY - cy) / 20);
          p.style.setProperty('--px', `${Math.cos(a) * d}px`);
          p.style.setProperty('--py', `${Math.sin(a) * d}px`);
        });
      });
    }, { passive: true });
  }

  /* ---------- age tabs (WAI-ARIA tabs pattern) ---------- */
  $$('[role="tablist"]').forEach(tl => {
    const tabs = $$('[role="tab"]', tl);
    const select = t => {
      tabs.forEach(x => {
        const on = x === t;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const n = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!n) return;
        e.preventDefault();
        const next = tabs[(i + n + tabs.length) % tabs.length];
        next.focus(); select(next);
      });
    });
  });

  /* ---------- YouTube facade (privacy-enhanced, loads on click) ---------- */
  $$('.yt[data-id]').forEach(b => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.id}?autoplay=1&rel=0&modestbranding=1`;
    f.title = b.getAttribute('aria-label') || 'Video';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    b.replaceChildren(f);
    b.removeAttribute('aria-label');
    if (window.gtag) gtag('event', 'video_play', { video_id: b.dataset.id });
  }, { once: true }));

  /* ---------- scroll reveals ---------- */
  const rv = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('is-in'));

  /* ---------- simple email forms (newsletter / book waitlist) ---------- */
  $$('[data-email-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('input[type="email"]', f);
    const msg = f.parentElement.querySelector('.form-msg');
    if (!input.checkValidity()) { msg.textContent = 'Please enter a valid email address.'; input.focus(); return; }
    msg.textContent = f.dataset.success || 'Thank you — you’re on the list.';
    f.reset();
  }));

  /* ---------- Ask the Doctor form ---------- */
  const ask = $('#ask-form');
  if (ask) {
    const qField = $('#q', ask), count = $('#q-count');
    const pre = new URLSearchParams(location.search).get('q');
    if (pre) qField.value = pre;
    const upd = () => count.textContent = `${qField.value.length} / 1200`;
    qField.addEventListener('input', upd); upd();

    const RED = /(not breathing|can'?t breathe|unconscious|seizure|blue lips|choking|swallowed|poison|overdose|stiff neck|102|103|104|high fever|newborn fever)/i;
    const urgent = $('#urgent');
    qField.addEventListener('input', () => { urgent.hidden = !RED.test(qField.value); });

    const setErr = (el, text) => {
      const err = document.getElementById(el.getAttribute('aria-describedby').split(' ').find(id => id.endsWith('-err')));
      el.setAttribute('aria-invalid', text ? 'true' : 'false');
      err.textContent = text;
    };
    ask.addEventListener('submit', e => {
      e.preventDefault();
      let first = null;
      const topic = $('#topic', ask), email = $('#email', ask), consent = $('#consent', ask);
      const checks = [
        [qField, qField.value.trim().length < 20 ? 'Tell us a little more — at least 20 characters helps the doctor answer well.' : ''],
        [topic, !topic.value ? 'Choose the closest topic.' : ''],
        [email, !email.checkValidity() || !email.value ? 'Enter an email so we can tell you when it’s answered.' : ''],
        [consent, !consent.checked ? 'Please confirm you’ve read this before sending.' : ''],
      ];
      if (!$('input[name="age"]:checked', ask)) { $('#age-err').textContent = 'Select your child’s age.'; first = $('input[name="age"]', ask); }
      else $('#age-err').textContent = '';
      checks.forEach(([el, t]) => { setErr(el, t); if (t && !first) first = el; });
      if (first) { first.focus(); return; }
      ask.hidden = true;
      const ok = $('#ask-success'); ok.hidden = false; ok.focus();
      if (window.gtag) gtag('event', 'ask_doctor_submit', { topic: topic.value });
    });
  }
})();

/* episode row: previous / next arrows */
(function () {
  document.querySelectorAll('[data-ep-scroll]').forEach(function (btn) {
    var row = document.getElementById(btn.getAttribute('aria-controls'));
    if (!row) return;
    var dir = Number(btn.getAttribute('data-ep-scroll'));
    var update = function () {
      var max = row.scrollWidth - row.clientWidth - 2;
      btn.disabled = dir < 0 ? row.scrollLeft <= 2 : row.scrollLeft >= max;
    };
    btn.addEventListener('click', function () {
      row.scrollBy({ left: dir * row.clientWidth * 0.85, behavior: 'smooth' });
    });
    row.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();

/* motion: staggered lists + stat count-up (skipped for reduced-motion users) */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var lists = document.querySelectorAll('.topic-index, .answers, .ep-row, .trust, .doctor__facts, .ages__tabs, .experts, .ep-grid, .principles, .journey, .disclose, .a11y-list, .book__facts, .steps, .related, .filters, .fmt-cols, .asking ul, .fmt-tabs, .creds, .cred-chips');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('stg-in'); io.unobserve(e.target);
      if (e.target.classList.contains('doctor__facts')) countUp(e.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  lists.forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (child, i) { child.style.setProperty('--i', Math.min(i, 10)); });
    list.classList.add('stg'); io.observe(list);
  });
  function countUp(box) {
    box.querySelectorAll('b').forEach(function (b) {
      var m = b.textContent.match(/^(\d+)(\D*)$/); if (!m) return;   /* "116+" or "13"; leaves "0–7" alone */
      var end = +m[1], suffix = m[2], t0 = null, dur = 1100;
      function step(t) {
        if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        b.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      b.textContent = '0' + suffix; requestAnimationFrame(step);
    });
  }
})();


/* video thumbnails: if a thumbnail can't load, show the plain card colour instead of a broken-image icon */
(function () {
  function hide(img) { img.style.visibility = 'hidden'; }
  document.addEventListener('error', function (e) {
    var t = e.target; if (t && t.tagName === 'IMG' && t.closest('.ep-card__thumb, .yt')) hide(t);
  }, true);
  document.querySelectorAll('.ep-card__thumb img, .yt img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) hide(img);
  });
})();

/* motion: soft fade-up for section headings and panels on every page, and gentle parallax on the homepage doctor photo */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var els = document.querySelectorAll('.section-head, .a11y-band, .about-intro__cols, .layout-2 > *, .profile__img');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (el) { if (!el.classList.contains('reveal')) { el.classList.add('reveal'); io.observe(el); } });

  var doc = document.querySelector('.doctor__photo');
  if (!doc) return;
  var ticking = false;
  function move() {
    ticking = false;
    var r = doc.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    var p = (r.top + r.height / 2 - vh / 2) / vh;          /* -0.5 … 0.5 while on screen */
    doc.style.setProperty('--py', (p * -36).toFixed(1) + 'px');
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
  move();
})();

/* age picker: move the little pointer on the answers panel under the chosen age */
(function () {
  var tabs = document.querySelector('.ages__tabs');
  if (!tabs) return;
  function place() {
    var t = tabs.querySelector('[aria-selected="true"]'), pn = document.querySelector('.ages__panel:not([hidden])');
    if (!t || !pn) return;
    var x = t.getBoundingClientRect().left + t.offsetWidth / 2 - pn.getBoundingClientRect().left - 12;
    document.querySelectorAll('.ages__panel').forEach(function (p) { p.style.setProperty('--nx', x + 'px'); });
  }
  tabs.addEventListener('click', function () { requestAnimationFrame(place); });
  tabs.addEventListener('keyup', function () { requestAnimationFrame(place); });
  window.addEventListener('resize', place);
  place();
})();
