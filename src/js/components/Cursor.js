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
        this.initScrollAnimations();
        this.initHamburger();
        this.initContactForm();
        this.initTiltCards();
    }

    initRingLoop() {
        const lerp = (a, b, t) => a + (b - a) * t;
        const nav = document.getElementById('nav');
        const progressBar = document.getElementById('scroll-progress');
        
        // Use GSAP ticker to unify with the WebGL scene and other animations
        gsap.ticker.add(() => {
            this.rx = lerp(this.rx, this.mx, 0.1);
            this.ry = lerp(this.ry, this.my, 0.1);
            
            if (this.ring) {
                // translate3d forces GPU acceleration and avoids layout reflows
                this.ring.style.transform = `translate3d(${this.rx}px, ${this.ry}px, 0) translate(-50%, -50%)`;
            }

            // Unify scroll-based logic to avoid multiple scroll listeners and layout thrashing
            const sy = window.scrollY;
            if (nav) {
                nav.style.background = sy > 40 ? 'rgba(8, 12, 24, 0.97)' : 'rgba(8, 12, 24, 0.8)';
            }
            if (progressBar) {
                const docHeight = document.body.scrollHeight - window.innerHeight;
                const scrollPercent = docHeight > 0 ? sy / docHeight : 0;
                progressBar.style.transform = `scaleX(${scrollPercent})`;
            }
        });
    }

    initMagnetic() {
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            let rect = null;

            el.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hovering');
                rect = el.getBoundingClientRect(); // Cache once on enter
            });

            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hovering');
                gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                rect = null;
            });

            el.addEventListener('mousemove', (e) => {
                if (!rect) rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
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



    initTiltCards() {
        // Disable on touch devices (mobile)
        if (window.matchMedia('(pointer: coarse)').matches) return;

        const tiltCards = document.querySelectorAll('[data-tilt]');
        tiltCards.forEach(card => {
            // Inject glare element
            const glare = document.createElement('div');
            glare.className = 'tilt-glare';
            card.prepend(glare);

            let rect = null;

            card.addEventListener('mouseenter', () => {
                rect = card.getBoundingClientRect(); // Cache once
            });

            card.addEventListener('mousemove', (e) => {
                if (!rect) rect = card.getBoundingClientRect();
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
                rect = null;
            });
        });
    }



    initScrollAnimations() {
        const els = document.querySelectorAll('[data-animate]');
        const scrambleEls = document.querySelectorAll('.scramble');
        const counterEls = document.querySelectorAll('[data-count]');
        const triggered = new Set();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                // Handle fade-in animations
                if (entry.target.hasAttribute('data-animate') && !triggered.has(entry.target)) {
                    triggered.add(entry.target);
                    const section = entry.target.closest('section');
                    const siblings = section ? [...section.querySelectorAll('[data-animate]')] : [entry.target];
                    const idx = siblings.indexOf(entry.target);
                    const delay = idx * 120;
                    setTimeout(() => entry.target.classList.add('visible'), delay);
                }

                // Handle text scramble
                if (entry.target.classList.contains('scramble')) {
                    setTimeout(() => scramble(entry.target), 200);
                    observer.unobserve(entry.target);
                }

                // Handle counters
                if (entry.target.hasAttribute('data-count')) {
                    countUp(entry.target);
                    observer.unobserve(entry.target);
                }

                if (triggered.has(entry.target) && !entry.target.classList.contains('scramble') && !entry.target.hasAttribute('data-count')) {
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        els.forEach(el => observer.observe(el));
        scrambleEls.forEach(el => observer.observe(el));
        counterEls.forEach(el => observer.observe(el));
    }

    initHamburger() {
        const btn = document.getElementById('hamburger');
        const links = document.querySelector('.nav-links');
        if (!btn || !links) return;
        btn.addEventListener('click', () => {
            const isOpen = links.classList.toggle('open');
            btn.setAttribute('aria-expanded', isOpen);
        });
        links.querySelectorAll('a').forEach(a =>
            a.addEventListener('click', () => {
                links.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            })
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
