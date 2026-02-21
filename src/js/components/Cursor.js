import gsap from 'gsap';

export default class Cursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.dot = document.querySelector('.cursor-dot');
        this.ring = document.querySelector('.cursor-ring');

        // Fallback cursor
        if (!this.cursor) {
            this.cursor = document.createElement('div');
            this.cursor.className = 'cursor';
            this.dot = document.createElement('div');
            this.dot.className = 'cursor-dot';
            this.ring = document.createElement('div');
            this.ring.className = 'cursor-ring';
            this.cursor.appendChild(this.dot);
            this.cursor.appendChild(this.ring);
            document.body.appendChild(this.cursor);
        }

        // Corporate layer element (the mask target)
        this.corpLayer = document.querySelector('.layer-corporate');

        // State
        this.mouse = { x: -9999, y: -9999 };
        this.lastMouse = { x: -9999, y: -9999 };
        this.velocity = 0;
        this.angle = 0;
        this.isMagnetic = false;
        this.hasEntered = false;

        // Config
        this.baseRadius = 220;  // px — size of the reveal circle
        this.maxStretch = 120;  // max liquid stretch on fast movement

        this.update = this.update.bind(this);

        window.addEventListener('mousemove', (e) => {
            if (!this.hasEntered) {
                this.hasEntered = true;
            }
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Full cover when mouse leaves page
        document.addEventListener('mouseleave', () => {
            if (this.corpLayer) {
                this.corpLayer.style.clipPath = 'ellipse(9999px 9999px at 50% 50%)';
            }
            this.hasEntered = false;
            this.mouse.x = -9999;
            this.mouse.y = -9999;
        });

        gsap.ticker.add(this.update);
        this.initHoverEffects();
    }

    update() {
        if (!this.corpLayer) return;

        // Before mouse enters: keep corporate fully visible
        if (!this.hasEntered) {
            this.corpLayer.style.clipPath = 'ellipse(9999px 9999px at 50% 50%)';
            return;
        }

        // 1. Physics
        const dx = this.mouse.x - this.lastMouse.x;
        const dy = this.mouse.y - this.lastMouse.y;
        const speed = Math.sqrt(dx * dx + dy * dy);
        this.velocity = gsap.utils.interpolate(this.velocity, speed, 0.1);

        if (speed > 2) {
            this.angle = Math.atan2(dy, dx) * 180 / Math.PI;
        }

        // 2. Liquid distortion
        const stretch = Math.min(this.velocity * 4, this.maxStretch);
        const rx = Math.round(this.baseRadius + stretch);
        const ry = Math.round(Math.max(this.baseRadius - stretch * 0.4, 60));

        // 3. Apply inverse clip-path to corporate layer
        // clip-path: ellipse(rx ry at cx cy) — the HOLE in the corporate facade
        // NOTE: clip-path clips what's INSIDE the shape to be VISIBLE.
        // We want the OPPOSITE (outside visible, inside transparent = hole).
        // We achieve this by masking the CREATIVE layer to ONLY show inside the ellipse,
        // and keeping the corporate layer ALWAYS visible but with mask-image instead.
        // 
        // FINAL APPROACH: Use mask-image on corporate layer (CSS, not SVG URL).
        // mask-image: radial-gradient(ellipse at pos, transparent HOLE, black SOLID)
        // Then rotate via a wrapper or use clip-path on the creative layer inverse.
        //
        // Simplest working solution: clip-path on corp layer with a "reveal" region.
        // clip-path shows INSIDE → we need to EXCLUDE the ellipse from corporate.
        // We'll use a path() if needed, but for now let's use the mask-image CSS approach:

        const cx = this.mouse.x;
        const cy = this.mouse.y;

        // CSS mask-image approach (no SVG URL, no cross-origin issues)
        // transparent = hole (shows creative underneath), black = corporate visible
        this.corpLayer.style.maskImage =
            `radial-gradient(${rx}px ${ry}px at ${cx}px ${cy}px, transparent 99%, black 100%)`;
        this.corpLayer.style.webkitMaskImage =
            `radial-gradient(${rx}px ${ry}px at ${cx}px ${cy}px, transparent 99%, black 100%)`;

        // 4. Visual cursor
        if (!this.isMagnetic) {
            gsap.set(this.cursor, {
                '--cursor-x': `${this.mouse.x}px`,
                '--cursor-y': `${this.mouse.y}px`,
            });
        }

        this.lastMouse.x = this.mouse.x;
        this.lastMouse.y = this.mouse.y;
    }

    initHoverEffects() {
        document.querySelectorAll('p, h1, h2, h3, li').forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('text-hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('text-hover'));
        });

        document.querySelectorAll('[data-magnetic]').forEach(el => {
            const onMove = (e) => this.magnetizeElement(e, el);
            el.addEventListener('mouseenter', () => {
                this.isMagnetic = true;
                this.cursor.classList.add('magnetic');
                el.addEventListener('mousemove', onMove);
            });
            el.addEventListener('mouseleave', () => {
                this.isMagnetic = false;
                this.cursor.classList.remove('magnetic');
                gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
                el.removeEventListener('mousemove', onMove);
            });
        });
    }

    magnetizeElement(e, el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        gsap.to(el, {
            x: (e.clientX - centerX) * 0.35,
            y: (e.clientY - centerY) * 0.35,
            duration: 0.2,
            overwrite: 'auto',
        });
    }
}
