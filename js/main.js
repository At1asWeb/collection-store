/* =========================================================
   HUB · Collection Store — main.js
   ========================================================= */
(function () {
    'use strict';

    document.documentElement.classList.add('js');
    document.body.classList.add('is-loading', 'has-cursor');

    /* ---------- helpers ---------- */
    const $  = (s, ctx = document) => ctx.querySelector(s);
    const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* =====================================================
       PRELOADER
       ===================================================== */
    const preloader  = $('#preloader');
    const progressEl = $('#preloaderBar');

    function runPreloader() {
        if (!preloader) { document.body.classList.remove('is-loading'); return; }

        const minDuration = prefersReducedMotion ? 600 : 3200;
        const start = performance.now();
        let progress = 0;

        function tick(now) {
            const elapsed = now - start;
            // ease-out so the bar fills smoothly
            const target = Math.min(100, (elapsed / minDuration) * 100);
            progress += (target - progress) * 0.18;
            if (progressEl) progressEl.style.width = progress.toFixed(2) + '%';

            if (elapsed < minDuration || progress < 99.5) {
                requestAnimationFrame(tick);
            } else {
                if (progressEl) progressEl.style.width = '100%';
                hidePreloader();
            }
        }
        requestAnimationFrame(tick);
    }

    function hidePreloader() {
        preloader.classList.add('is-finishing');
        setTimeout(() => {
            preloader.classList.add('is-hidden');
            document.body.classList.remove('is-loading');
            startCounters();
            triggerInitialReveals();
        }, 1100);
    }

    if (document.readyState === 'complete') {
        runPreloader();
    } else {
        window.addEventListener('load', runPreloader, { once: true });
        // safety net — never get stuck on broken assets
        setTimeout(runPreloader, 3500);
    }

    /* =====================================================
       NAVBAR — scroll state, mobile burger, active link
       ===================================================== */
    const nav = $('#nav');
    const burger = $('#burger');
    const menu = $('.nav__menu');

    function onScroll() {
        if (window.scrollY > 30) nav.classList.add('is-scrolled');
        else nav.classList.remove('is-scrolled');
        updateActiveLink();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger) {
        burger.addEventListener('click', () => {
            const open = menu.classList.toggle('is-open');
            burger.classList.toggle('is-open', open);
            burger.setAttribute('aria-expanded', String(open));
        });
        $$('.nav__link').forEach(link => link.addEventListener('click', () => {
            menu.classList.remove('is-open');
            burger.classList.remove('is-open');
            burger.setAttribute('aria-expanded', 'false');
        }));
    }

    function updateActiveLink() {
        const scrollY = window.scrollY + 140;
        const sections = $$('section[id]');
        let currentId = null;
        for (const s of sections) {
            const top = s.offsetTop;
            const bot = top + s.offsetHeight;
            if (scrollY >= top && scrollY < bot) { currentId = s.id; break; }
        }
        $$('.nav__link').forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + currentId);
        });
    }

    /* =====================================================
       SCROLL REVEALS
       ===================================================== */
    const reveals = $$('[data-reveal]');
    function triggerInitialReveals() {
        reveals.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.95) {
                const delay = parseInt(el.dataset.delay || '0', 10);
                setTimeout(() => el.classList.add('is-visible'), delay);
            }
        });
    }
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.dataset.delay || '0', 10);
                    setTimeout(() => el.classList.add('is-visible'), delay);
                    obs.unobserve(el);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        reveals.forEach(el => io.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('is-visible'));
    }

    /* =====================================================
       NUMBER COUNTERS
       ===================================================== */
    let countersStarted = false;
    function startCounters() {
        if (countersStarted) return;
        countersStarted = true;

        const items = $$('[data-count]');
        items.forEach(el => {
            const target = parseInt(el.dataset.count, 10) || 0;
            const duration = 1800;
            const start = performance.now();

            function step(now) {
                const t = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                const current = Math.round(target * eased);
                el.textContent = current.toLocaleString('ru-RU');
                if (t < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        });
    }

    /* =====================================================
       3D TILT
       ===================================================== */
    if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
        const tiltEls = $$('[data-tilt]');
        tiltEls.forEach(el => {
            const max = 8;
            let raf = null;
            function onMove(e) {
                const rect = el.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width  - 0.5;
                const y = (e.clientY - rect.top)  / rect.height - 0.5;
                const rx = (-y * max).toFixed(2);
                const ry = ( x * max).toFixed(2);
                cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
                });
            }
            function onLeave() {
                cancelAnimationFrame(raf);
                el.style.transform = '';
            }
            el.addEventListener('mousemove', onMove);
            el.addEventListener('mouseleave', onLeave);
        });
    }

    /* =====================================================
       PRODUCT FILTER
       ===================================================== */
    const chips = $$('.chip');
    const products = $$('.product');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('is-active'));
            chip.classList.add('is-active');
            const filter = chip.dataset.filter;
            products.forEach(p => {
                const cat = p.dataset.cat;
                p.classList.toggle('is-hidden', filter !== 'all' && cat !== filter);
            });
        });
    });

    /* =====================================================
       CUSTOM CURSOR
       ===================================================== */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const cursor = $('#cursor');
        if (cursor) {
            const dot = cursor.querySelector('.cursor__dot');
            const ring = cursor.querySelector('.cursor__ring');
            let mx = window.innerWidth / 2;
            let my = window.innerHeight / 2;
            let rx = mx, ry = my;

            window.addEventListener('mousemove', e => {
                mx = e.clientX; my = e.clientY;
                if (dot) {
                    dot.style.left = mx + 'px';
                    dot.style.top  = my + 'px';
                }
            });

            function loop() {
                rx += (mx - rx) * 0.18;
                ry += (my - ry) * 0.18;
                if (ring) {
                    ring.style.left = rx + 'px';
                    ring.style.top  = ry + 'px';
                }
                requestAnimationFrame(loop);
            }
            loop();

            const hoverables = 'a, button, .product, .cat-card, .fighter-card, .chip, [data-tilt]';
            document.addEventListener('mouseover', e => {
                if (e.target.closest(hoverables)) cursor.classList.add('is-hover');
            });
            document.addEventListener('mouseout', e => {
                if (e.target.closest(hoverables)) cursor.classList.remove('is-hover');
            });
        }
    } else {
        document.body.classList.remove('has-cursor');
    }

    /* =====================================================
       PARALLAX HERO ON MOUSE
       ===================================================== */
    if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
        const hero = $('.hero');
        const glow1 = $('.hero__glow--gold');
        const glow2 = $('.hero__glow--red');
        const card  = $('.hero__card');
        if (hero) {
            hero.addEventListener('mousemove', e => {
                const rect = hero.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width  - 0.5;
                const y = (e.clientY - rect.top)  / rect.height - 0.5;
                if (glow1) glow1.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
                if (glow2) glow2.style.transform = `translate(${x * -40}px, ${y * -40}px)`;
            });
        }
    }

    /* =====================================================
       SMOOTH ANCHOR (offset for fixed nav)
       ===================================================== */
    document.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
    });
})();
