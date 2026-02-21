/**
 * Cursor.js — Glow spotlight + magnetic buttons.
 * Simple. Just CSS variable updates on mousemove.
 */
import gsap from 'gsap';

export default class Cursor {
    constructor() {
        this.dot = document.getElementById('cursor-dot');

        window.addEventListener('mousemove', (e) => {
            // Glow follows mouse via CSS custom properties
            document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
            document.documentElement.style.setProperty('--my', `${e.clientY}px`);
        });

        this.initMagnetic();
        this.initNavScroll();
        this.initScrollAnimations();
        this.initHamburger();
        this.initContactForm();
    }

    initMagnetic() {
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            const move = (e) => {
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                gsap.to(el, {
                    x: (e.clientX - cx) * 0.3,
                    y: (e.clientY - cy) * 0.3,
                    duration: 0.25, overwrite: 'auto',
                });
            };
            const leave = () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                el.removeEventListener('mousemove', move);
            };
            el.addEventListener('mouseenter', () => el.addEventListener('mousemove', move));
            el.addEventListener('mouseleave', leave);
        });
    }

    initNavScroll() {
        const nav = document.getElementById('nav');
        if (!nav) return;
        window.addEventListener('scroll', () => {
            nav.style.background = window.scrollY > 40
                ? 'rgba(8, 12, 24, 0.95)'
                : 'rgba(8, 12, 24, 0.75)';
        }, { passive: true });
    }

    initScrollAnimations() {
        const els = document.querySelectorAll('[data-animate]');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, i) => {
                    if (entry.isIntersecting) {
                        // Stagger siblings
                        const siblings = [...entry.target.closest('section')?.querySelectorAll('[data-animate]') || []];
                        const idx = siblings.indexOf(entry.target);
                        setTimeout(() => entry.target.classList.add('visible'), idx * 80);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        els.forEach(el => observer.observe(el));
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
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.textContent = 'Odoslané ✓';
            btn.style.background = '#22c55e';
            setTimeout(() => {
                btn.textContent = 'Odoslať správu →';
                btn.style.background = '';
                form.reset();
            }, 3000);
        });
    }
}
