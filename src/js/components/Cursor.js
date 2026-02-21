/**
 * Cursor.js — Manages the SVG inverse clip-path reveal effect.
 *
 * Architecture:
 *  - Corporate layer (#layer-corporate) has clip-path: url(#cursor-clip)
 *  - #cursor-clip contains a <path> with fill-rule="evenodd"
 *  - Path = large outer rect + ellipse holes = shows corp EVERYWHERE except holes
 *  - Moving mouse = update hole position; fast movement = stretch ellipse (liquid)
 *  - Trail = array of recent positions, each rendered as a smaller hole
 */
import gsap from 'gsap';

const OUTER_RECT = 'M -9999 -9999 H 99999 V 99999 H -9999 Z';

export default class Cursor {
    constructor() {
        this.clipShape = document.getElementById('clip-path-shape');
        this.dot = document.getElementById('cursor-dot');

        // Init: corporate fully visible (no holes yet = entire outer rect clipped area shown)
        if (this.clipShape) this.clipShape.setAttribute('d', OUTER_RECT);

        /* Mouse state */
        this.mx = -9999; this.my = -9999;  // current mouse (viewport)
        this.lx = -9999; this.ly = -9999;  // last mouse (viewport)
        this.vel = 0;
        this.angle = 0;
        this.entered = false;

        /* Physics config */
        this.BASE_R = 200;  // flashlight radius in px
        this.MAX_STRETCH = 110;  // max liquid squash/stretch

        /* Trail: last N positions + size ratio */
        this.TRAIL_MAX = 22;
        this.trail = [];   // [{x, y}]

        /* Magnetic */
        this.isMagnetic = false;

        this.update = this.update.bind(this);

        window.addEventListener('mousemove', (e) => {
            this.mx = e.clientX;
            this.my = e.clientY;
            this.entered = true;
            // Move cursor dot immediately (no lag)
            this.dot.style.setProperty('--cx', `${e.clientX}px`);
            this.dot.style.setProperty('--cy', `${e.clientY}px`);
        });

        document.addEventListener('mouseleave', () => {
            this.entered = false;
            this.trail = [];
            // Restore to full cover: corporate shows everywhere (no holes)
            if (this.clipShape) {
                this.clipShape.setAttribute('d', OUTER_RECT);
            }
        });

        gsap.ticker.add(this.update);
        this.initMagnetic();
    }

    /** Convert an ellipse at (cx,cy) with radii (rx,ry) rotated by angle to SVG path arc notation. */
    ellipsePath(cx, cy, rx, ry, angleDeg) {
        if (rx < 1 || ry < 1) return '';
        const rad = (angleDeg * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        // Two points on the ellipse (left and right along major axis)
        const dx = cos * rx, dy = sin * rx;
        const x1 = cx - dx, y1 = cy - dy;
        const x2 = cx + dx, y2 = cy + dy;
        const xar = Math.round(rx * 10) / 10;
        const yar = Math.round(ry * 10) / 10;
        const rot = Math.round(angleDeg * 10) / 10;
        return `M ${x1} ${y1} A ${xar} ${yar} ${rot} 1 0 ${x2} ${y2} A ${xar} ${yar} ${rot} 1 0 ${x1} ${y1} Z`;
    }

    update() {
        if (!this.entered || !this.clipShape) return;

        /* ── Physics ── */
        const dx = this.mx - this.lx;
        const dy = this.my - this.ly;
        const speed = Math.sqrt(dx * dx + dy * dy);
        this.vel = gsap.utils.interpolate(this.vel, speed, 0.12);
        if (speed > 2) this.angle = Math.atan2(dy, dx) * (180 / Math.PI);

        /* ── Liquid distortion ── */
        const stretch = Math.min(this.vel * 3.8, this.MAX_STRETCH);
        const rx = this.BASE_R + stretch;
        const ry = Math.max(this.BASE_R - stretch * 0.45, 60);

        /* ── Trail ── */
        this.trail.unshift({ x: this.mx, y: this.my });
        if (this.trail.length > this.TRAIL_MAX) this.trail.pop();

        /* ── Build inverse clip path ── */
        // Outer rect in viewport coords (very large = covers everything corporate)
        let d = 'M -9999 -9999 H 99999 V 99999 H -9999 Z';

        // Trail holes (older = tinier)
        for (let i = 1; i < this.trail.length; i++) {
            const pt = this.trail[i];
            const ratio = 1 - i / this.TRAIL_MAX;
            const trx = rx * ratio * 0.82;
            const try_ = ry * ratio * 0.82;
            d += ' ' + this.ellipsePath(pt.x, pt.y, trx, try_, this.angle);
        }

        // Main cursor hole
        d += ' ' + this.ellipsePath(this.mx, this.my, rx, ry, this.angle);

        this.clipShape.setAttribute('d', d);

        this.lx = this.mx;
        this.ly = this.my;
    }

    initMagnetic() {
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            const enter = () => {
                this.isMagnetic = true;
                el.addEventListener('mousemove', move);
            };
            const leave = () => {
                this.isMagnetic = false;
                gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                el.removeEventListener('mousemove', move);
            };
            const move = (e) => {
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                gsap.to(el, {
                    x: (e.clientX - cx) * 0.35,
                    y: (e.clientY - cy) * 0.35,
                    duration: 0.2, overwrite: 'auto',
                });
            };
            el.addEventListener('mouseenter', enter);
            el.addEventListener('mouseleave', leave);
        });
    }
}
