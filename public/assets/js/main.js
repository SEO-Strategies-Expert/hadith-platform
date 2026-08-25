/* ==========================================================================
   الكلّية العليا للحديث النبوي وعلومه وعِلَلِه — سكربت الواجهة
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isEN = (document.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase() === 'en';
  var AR = '٠١٢٣٤٥٦٧٨٩';
  function toAr(n) { return isEN ? String(n) : String(n).replace(/[0-9]/g, function (d) { return AR[+d]; }); }

  /* ---------------------------------------------------------------
     1) الهيرو
     --------------------------------------------------------------- */
  (function heroSlider() {
    var stage = document.getElementById('heroStage');
    if (!stage) return;

    var slides = [].slice.call(stage.querySelectorAll('.slide'));
    var dotsBox = document.getElementById('heroDots');
    var prev = document.getElementById('heroPrev');
    var next = document.getElementById('heroNext');
    if (slides.length < 2) return;

    var index = 0, timer = null, DELAY = 6800;

    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'الشريحة ' + toAr(i + 1));
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { go(i, true); });
      dotsBox.appendChild(b);
    });
    var dots = [].slice.call(dotsBox.children);

    function go(i, manual) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
      dots.forEach(function (d, n) { d.setAttribute('aria-selected', n === index ? 'true' : 'false'); });
      if (manual) restart();
    }
    function start() { if (!reduce && !timer) timer = setInterval(function () { go(index + 1); }, DELAY); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    prev && prev.addEventListener('click', function () { go(index - 1, true); });
    next && next.addEventListener('click', function () { go(index + 1, true); });

    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    stage.addEventListener('focusin', stop);
    stage.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    stage.setAttribute('tabindex', '0');
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') go(index + 1, true);
      else if (e.key === 'ArrowLeft') go(index - 1, true);
    });

    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(index + (dx > 0 ? 1 : -1), true);
      x0 = null; start();
    }, { passive: true });

    start();
  })();

  /* ---------------------------------------------------------------
     2) الشريط المتحرّك
     --------------------------------------------------------------- */
  (function ticker() {
    // العناصر مكرَّرة مسبقًا من الخادم (Next.js) لضمان الحلقة السلسة — لا تكرار هنا.
  })();

  /* ---------------------------------------------------------------
     3) ديوان العلماء والباحثين
     --------------------------------------------------------------- */
  (function diwan() {
    var list = document.getElementById('threads');
    if (!list) return;

    // البيانات تُجلب من قاعدة البيانات عبر /api/diwan — القائمة الأوّلية مُصيَّرة
    // مسبقًا من الخادم (SSR)، والجلب هنا يُفعِّل الفرز والتصفية فقط.
    var DATA = null;
    var cat = 'all', sort = 'new';

    function initial(name) {
      var clean = name.replace(/^(أ\.د\.|د\.|أ\.|Prof\. Dr\.|Prof\.|Dr\.)\s*/, '').trim();
      return clean.charAt(0) || (isEN ? '?' : '؟');
    }

    function render() {
      if (!DATA) return;
      var rows = DATA.filter(function (x) { return cat === 'all' || x.c === cat; });

      if (sort === 'active') rows = rows.slice().sort(function (a, b) { return b.n - a.n; });
      else if (sort === 'scholar') rows = rows.slice().sort(function (a, b) {
        var sa = /^(أ\.د\.|د\.)/.test(a.a) ? 0 : 1, sb = /^(أ\.د\.|د\.)/.test(b.a) ? 0 : 1;
        return sa - sb || b.n - a.n;
      });
      else rows = rows.slice().sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0); });

      if (!rows.length) {
        list.innerHTML = '<li class="thread"><div class="thread-body">' +
          '<p class="thread-title">لا توجد مجالس في هذا القسم بعد.</p>' +
          '<div class="thread-meta">ستُضاف مجالس هذا القسم تباعًا بإذن الله.</div></div></li>';
        return;
      }

      list.innerHTML = rows.map(function (x, i) {
        return '<li class="thread" style="animation-delay:' + Math.min(i * 40, 320) + 'ms">' +
          '<span class="avatar" aria-hidden="true">' + initial(x.a) + '</span>' +
          '<div class="thread-body">' +
            '<p class="thread-title">' + (x.pin ? '<span class="thread-pin">' + (isEN ? 'Pinned' : 'مثبَّت') + '</span> ' : '') + x.t + '</p>' +
            '<div class="thread-meta">' +
              '<span>' + x.a + '</span>' +
              '<span class="rank">' + x.r + '</span>' +
              '<span class="tag">' + x.tag + '</span>' +
              '<span>' + x.d + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="thread-stats"><b>' + toAr(x.n) + '</b><span>' + (isEN ? 'posts' : 'مشاركة') + '</span></div>' +
        '</li>';
      }).join('');
    }

    document.querySelectorAll('.cat-list button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.cat-list button').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        cat = b.dataset.cat; render(); list.scrollTop = 0;
      });
    });

    document.querySelectorAll('.chip[data-sort]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.chip[data-sort]').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        sort = b.dataset.sort; render(); list.scrollTop = 0;
      });
    });

    // القائمة الأوّلية مُصيَّرة من الخادم بالفعل — نجلب البيانات بصمت لتفعيل
    // أزرار التصفية والفرز فقط، دون استبدال المحتوى المعروض قبل أن يتفاعل المستخدم.
    fetch('/api/diwan?lang=' + (isEN ? 'en' : 'ar'))
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (json) { DATA = json; })
      .catch(function () {});
  })();

  /* ---------------------------------------------------------------
     4) حماية محتوى الديوان — الاطّلاع متاح والنسخ غير متاح
     --------------------------------------------------------------- */
  (function protect() {
    var zones = document.querySelectorAll('[data-protected="true"]');
    if (!zones.length) return;

    function inZone(node) {
      if (!node) return false;
      var el = node.nodeType === 1 ? node : node.parentNode;
      for (var i = 0; i < zones.length; i++) if (zones[i].contains(el)) return true;
      return false;
    }

    ['copy', 'cut'].forEach(function (evt) {
      document.addEventListener(evt, function (e) {
        if (!inZone(e.target)) return;
        e.preventDefault();
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain',
            'المحتوى محفوظ لحقوق الكلّية العليا للحديث النبوي وعلومه وعِلَلِه — الاطّلاع متاح والنسخ غير متاح.');
        }
      });
    });

    document.addEventListener('contextmenu', function (e) { if (inZone(e.target)) e.preventDefault(); });
    document.addEventListener('dragstart', function (e) { if (inZone(e.target)) e.preventDefault(); });
    document.addEventListener('keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (['c', 'x', 'a', 's', 'p'].indexOf((e.key || '').toLowerCase()) === -1) return;
      var sel = window.getSelection();
      if (inZone(sel && sel.anchorNode ? sel.anchorNode : document.activeElement)) e.preventDefault();
    });
  })();

  /* ---------------------------------------------------------------
     5) قائمة الموبايل
     --------------------------------------------------------------- */
  (function mobileNav() {
    var btn = document.querySelector('.nav-toggle');
    var nav = document.getElementById('mainnav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      nav.classList.toggle('open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
    });
  })();

  /* ---------------------------------------------------------------
     لوحة البحث المنزلقة
     --------------------------------------------------------------- */
  (function searchPanel() {
    var btn = document.getElementById('searchToggle');
    var panel = document.getElementById('searchPanel');
    var input = document.getElementById('searchInput');
    if (!btn || !panel) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
      if (!open && input) input.focus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) {
        btn.setAttribute('aria-expanded', 'false'); panel.hidden = true; btn.focus();
      }
    });
  })();

  /* ---------------------------------------------------------------
     6) الظهور التدريجي المتدرّج
     --------------------------------------------------------------- */
  (function revealer() {
    // هذا السكربت يُنفَّذ مرّة واحدة لكل تحميل كامل، بينما ينتقل Next بين
    // الصفحات باستبدال محتوى <main> بلا إعادة تنفيذ. لذا نرصد العناصر
    // الجديدة عند كل استبدال، وإلا بقيت شفّافة وظهرت الصفحة فارغة.
    var noIO = !('IntersectionObserver' in window) || reduce;

    var io = noIO ? null : new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px' });

    function scan() {
      // تدرّج زمني داخل كل مجموعة
      document.querySelectorAll('.stagger').forEach(function (group) {
        [].slice.call(group.children).forEach(function (child, i) {
          if (child.classList.contains('reveal') && !child.style.getPropertyValue('--d')) {
            child.style.setProperty('--d', (i % 6) * 90 + 'ms');
          }
        });
      });

      [].slice.call(document.querySelectorAll('.reveal')).forEach(function (el) {
        if (el.__revealed) return;
        el.__revealed = true;
        if (noIO) { el.classList.add('in'); return; }
        io.observe(el);
      });
    }

    scan();

    // إعادة الرصد عند استبدال محتوى الصفحة (تنقّل داخلي بلا تحميل كامل).
    // ملاحظة: لا نستعمل requestAnimationFrame هنا لأنه لا يعمل والمستند
    // مخفيّ (تبويب في الخلفية)، فيبقى الفحص معلّقًا ولا تظهر الصفحة أبدًا.
    var pending = 0;
    function schedule() {
      if (pending) return;
      pending = setTimeout(function () { pending = 0; scan(); }, 60);
    }

    if ('MutationObserver' in window) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].addedNodes.length) { schedule(); break; }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }

    // وعند عودة التبويب للظهور، لأن المراقب لا يُطلق نداءاته وهو مخفيّ
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') schedule();
    });
  })();

  /* ---------------------------------------------------------------
     7) عدّادات الإحصاءات
     --------------------------------------------------------------- */
  (function counters() {
    var nums = [].slice.call(document.querySelectorAll('[data-count]'));
    if (!nums.length) return;

    function run(el) {
      var target = parseInt(el.dataset.count, 10) || 0;
      if (reduce) { el.textContent = toAr(target); return; }
      var dur = 1200, t0 = null;
      function tick(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = toAr(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------------
     8) بارالاكس خفيف للزخارف + زر العودة للأعلى + السنة
     --------------------------------------------------------------- */
  (function misc() {
    var orn = [].slice.call(document.querySelectorAll('.orn-navy,.orn-cream'));
    var top = document.getElementById('toTop');
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        if (!reduce) {
          orn.forEach(function (el) {
            var r = el.getBoundingClientRect();
            if (r.bottom > 0 && r.top < window.innerHeight) {
              el.style.setProperty('--oy', (r.top * -0.05).toFixed(1) + 'px');
              el.style.backgroundPosition = '0 ' + (r.top * -0.05).toFixed(1) + 'px';
            }
          });
        }
        if (top) top.classList.toggle('show', window.scrollY > 700);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    top && top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    var yr = document.getElementById('yr');
    if (yr) yr.textContent = toAr(new Date().getFullYear());
  })();


  /* ---------------------------------------------------------------
     9) الأرفف الأفقية (الهيئة العلميّة)
     --------------------------------------------------------------- */
  (function rails() {
    document.querySelectorAll('[data-rail]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var rail = document.getElementById(btn.dataset.rail);
        if (!rail) return;
        var card = rail.querySelector('li');
        var step = card ? card.getBoundingClientRect().width + 20 : 260;
        var dir = btn.dataset.dir === 'next' ? -1 : 1;   // RTL
        rail.scrollBy({ left: dir * step * 2, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  })();


  /* ---------------------------------------------------------------
     10) الطيّ التلقائي للهيدر — قياس فعلي بدل breakpoints ثابتة
     --------------------------------------------------------------- */
  (function autoFitHeader() {
    var bar   = document.querySelector('.menubar');
    var box   = document.querySelector('.menubar > .container');
    var brand = document.querySelector('.brand');
    var nav   = document.querySelector('.mainnav-list');
    var end   = document.querySelector('.menubar-end');
    if (!bar || !box || !nav || !brand || !end) return;

    var COLLAPSE_AT = 8;    // هامش أمان للطيّ
    var EXPAND_AT   = 24;   // هامش أوسع للفرد — يمنع التذبذب

    // يقيس كل شيء في الوضع المفرود دائمًا، ثم يعيد الحالة كما كانت
    function measure() {
      var was = bar.classList.contains('nav-collapsed');
      if (was) bar.classList.remove('nav-collapsed');

      var navW = 0;
      var kids = nav.children;
      for (var i = 0; i < kids.length; i++) navW += kids[i].getBoundingClientRect().width;
      navW += Math.max(0, kids.length - 1);

      var cs   = getComputedStyle(box);
      var pad  = (parseFloat(cs.paddingInlineStart) || 0) + (parseFloat(cs.paddingInlineEnd) || 0);
      var gap  = (parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0) * 2;
      var avail = box.clientWidth - pad - gap
                - brand.getBoundingClientRect().width
                - end.getBoundingClientRect().width;

      if (was) bar.classList.add('nav-collapsed');
      return { need: Math.ceil(navW), avail: Math.floor(avail) };
    }

    function fit() {
      var m = measure();
      var collapsed = bar.classList.contains('nav-collapsed');
      if (!collapsed && m.need + COLLAPSE_AT > m.avail) bar.classList.add('nav-collapsed');
      else if (collapsed && m.need + EXPAND_AT <= m.avail) bar.classList.remove('nav-collapsed');
    }

    var t = null;
    function schedule() { clearTimeout(t); t = setTimeout(fit, 90); }

    fit();
    window.addEventListener('resize', schedule, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(box);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.addEventListener('load', fit);
  })();

})();
