/**
 * Cursor.js — glow, cursor ring, scramble text, counters, magnetic, hamburger, form.
 */
import gsap from 'gsap';

/* ──────────────────────────────────────
   TEXT SCRAMBLE
   ────────────────────────────────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';

function scramble(el) {
    const final = el.dataset.text || el.textContent;
    let frame = 0;
    const totalFrames = 30;
    const interval = setInterval(() => {
        el.textContent = final.split('').map((ch, i) => {
            if (ch === ' ' || ch === '\n') return ch;
            if (frame / totalFrames > i / final.length) return ch;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('');
        if (frame >= totalFrames) {
            el.textContent = final;
            clearInterval(interval);
        }
        frame++;
    }, 28);
}

/* ──────────────────────────────────────
   COUNT-UP
   ────────────────────────────────────── */
function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    const dur = 1400; // ms
    const start = performance.now();
    const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(ease * target);
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

/* ──────────────────────────────────────
   CURSOR CLASS
   ────────────────────────────────────── */
export default class Cursor {
    constructor() {
        this.ring = document.getElementById('cursor-ring');

        // Smoothed ring position
        this.rx = window.innerWidth / 2;
        this.ry = window.innerHeight / 2;
        this.mx = this.rx;
        this.my = this.ry;

        window.addEventListener('mousemove', (e) => {
            this.mx = e.clientX;
            this.my = e.clientY;
            document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
            document.documentElement.style.setProperty('--my', `${e.clientY}px`);
        });

        this.initRingLoop();
        this.initMagnetic();
        this.initNavScroll();
        this.initScrollAnimations();
        this.initHamburger();
        this.initContactForm();
        this.initScrollProgress();
        this.initTiltCards();
    }

    initRingLoop() {
        const lerp = (a, b, t) => a + (b - a) * t;
        const tick = () => {
            this.rx = lerp(this.rx, this.mx, 0.1);
            this.ry = lerp(this.ry, this.my, 0.1);
            if (this.ring) {
                this.ring.style.left = `${this.rx}px`;
                this.ring.style.top = `${this.ry}px`;
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    initMagnetic() {
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hovering'));
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hovering');
                gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
            });
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                gsap.to(el, {
                    x: (e.clientX - cx) * 0.3,
                    y: (e.clientY - cy) * 0.3,
                    duration: 0.22, overwrite: 'auto',
                });
            });
        });

        // Also add cursor hover class for all interactive elements
        const hoverEls = document.querySelectorAll('a, button, .bento-card, .service-card, .pricing-card, .skill-tag');
        hoverEls.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hovering'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hovering'));
        });
    }

    initScrollProgress() {
        const progressBar = document.getElementById('scroll-progress');
        if (!progressBar) return;

        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = scrollTop / docHeight;
            progressBar.style.transform = `scaleX(${scrollPercent})`;
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress, { passive: true });
        updateProgress();
    }

    initTiltCards() {
        // Disable on touch devices (mobile)
        if (window.matchMedia('(pointer: coarse)').matches) return;

        const tiltCards = document.querySelectorAll('[data-tilt]');
        tiltCards.forEach(card => {
            // Inject glare element
            const glare = document.createElement('div');
            glare.className = 'tilt-glare';
            card.prepend(glare);

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                const multiplier = 6;

                const rotateX = (0.5 - y) * multiplier;
                const rotateY = (x - 0.5) * multiplier;

                card.style.setProperty('--tilt-x', `${rotateX}deg`);
                card.style.setProperty('--tilt-y', `${rotateY}deg`);
                glare.style.setProperty('--glare-x', `${x * 100}%`);
                glare.style.setProperty('--glare-y', `${y * 100}%`);
                glare.style.opacity = '1';
            });

            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--tilt-x', `0deg`);
                card.style.setProperty('--tilt-y', `0deg`);
                glare.style.opacity = '0';
            });
        });
    }

    initNavScroll() {
        const nav = document.getElementById('nav');
        if (!nav) return;
        window.addEventListener('scroll', () => {
            nav.style.background = window.scrollY > 40
                ? 'rgba(8, 12, 24, 0.97)'
                : 'rgba(8, 12, 24, 0.8)';
        }, { passive: true });
    }

    initScrollAnimations() {
        const els = document.querySelectorAll('[data-animate]');
        const scrambleEls = document.querySelectorAll('.scramble');
        const counterEls = document.querySelectorAll('[data-count]');
        const triggered = new Set();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting || triggered.has(entry.target)) return;
                triggered.add(entry.target);

                // Stagger siblings within same section
                const section = entry.target.closest('section');
                const siblings = section ? [...section.querySelectorAll('[data-animate]')] : [entry.target];
                const idx = siblings.indexOf(entry.target);
                const delay = idx * 120; // Increased from 75ms to 120ms for better cascade effect

                setTimeout(() => entry.target.classList.add('visible'), delay);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.1 });

        // Scramble observer (fires once for headline)
        const scrambleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                setTimeout(() => scramble(entry.target), 200);
                scrambleObserver.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        // Counter observer
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                countUp(entry.target);
                counterObserver.unobserve(entry.target);
            });
        }, { threshold: 0.8 });

        els.forEach(el => observer.observe(el));
        scrambleEls.forEach(el => scrambleObserver.observe(el));
        counterEls.forEach(el => counterObserver.observe(el));
    }

    initHamburger() {
        const btn = document.getElementById('hamburger');
        const links = document.querySelector('.nav-links');
        if (!btn || !links) return;
        btn.addEventListener('click', () => links.classList.toggle('open'));
        links.querySelectorAll('a').forEach(a =>
            a.addEventListener('click', () => links.classList.remove('open'))
        );
    }

    initContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;
        const btn = form.querySelector('button[type="submit"]');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Fallback to mailto if Formspree not yet configured
            if (form.action.includes('REPLACE_WITH_YOUR_ID')) {
                const subject = encodeURIComponent(form.querySelector('[name=subject]')?.value || 'Dopyt z webu');
                const body = encodeURIComponent(form.querySelector('[name=message]')?.value || '');
                window.location.href = `mailto:Husivarga1412@gmail.com?subject=${subject}&body=${body}`;
                return;
            }

            btn.textContent = 'Odosielam...';
            btn.disabled = true;

            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    btn.textContent = 'Odoslané ✓';
                    btn.style.background = '#22c55e';
                    form.reset();
                    setTimeout(() => {
                        btn.textContent = 'Odoslať správu';
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 4000);
                } else { throw new Error(); }
            } catch {
                btn.textContent = 'Chyba — skús znova';
                btn.style.background = '#ef4444';
                btn.disabled = false;
                setTimeout(() => {
                    btn.textContent = 'Odoslať správu';
                    btn.style.background = '';
                }, 3000);
            }
        });
    }
}
