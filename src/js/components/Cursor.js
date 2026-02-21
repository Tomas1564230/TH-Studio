import gsap from 'gsap';

export default class Cursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.dot = document.querySelector('.cursor-dot');
        this.ring = document.querySelector('.cursor-ring');

        // Create fallback cursor elements if missing
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

        // SVG Mask elements
        this.maskSvg = document.getElementById('mask-svg-layer');
        this.maskRect = document.getElementById('mask-bg-rect');
        this.maskEllipse = document.getElementById('cursor-hole');

        // State
        this.mouse = { x: -9999, y: -9999 }; // off-screen until first move
        this.lastMouse = { x: -9999, y: -9999 };
        this.velocity = 0;
        this.angle = 0;
        this.isMagnetic = false;
        this.hasEntered = false; // has mouse entered the page yet?

        // Config
        this.baseRadius = 220;
        this.maxStretch = 120;

        // Fix SVG coordinate system on init and resize
        this.fixSvgSize();
        window.addEventListener('resize', () => this.fixSvgSize());

        // Bind loop
        this.update = this.update.bind(this);

        window.addEventListener('mousemove', (e) => {
            if (!this.hasEntered) {
                this.hasEntered = true;
                // Snap ellipse to cursor immediately on first move (no lag)
                if (this.maskEllipse) {
                    this.maskEllipse.setAttribute('cx', e.clientX);
                    this.maskEllipse.setAttribute('cy', e.clientY);
                }
            }
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Hide corporate layer hint on mouse leave (optional UX)
        document.addEventListener('mouseleave', () => {
            if (this.maskEllipse) {
                this.maskEllipse.setAttribute('cx', -9999);
                this.maskEllipse.setAttribute('cy', -9999);
            }
        });

        gsap.ticker.add(this.update);
        this.initHoverEffects();
    }

    fixSvgSize() {
        // The mask rect MUST use pixel values when maskUnits="userSpaceOnUse"
        if (this.maskRect) {
            this.maskRect.setAttribute('width', window.innerWidth);
            this.maskRect.setAttribute('height', window.innerHeight);
        }
        if (this.maskSvg) {
            this.maskSvg.setAttribute('width', window.innerWidth);
            this.maskSvg.setAttribute('height', window.innerHeight);
        }
    }

    update() {
        if (!this.hasEntered) return;

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
        const rx = this.baseRadius + stretch;
        const ry = Math.max(this.baseRadius - stretch * 0.4, 60);

        // 3. Update SVG mask
        if (this.maskEllipse) {
            this.maskEllipse.setAttribute('cx', this.mouse.x);
            this.maskEllipse.setAttribute('cy', this.mouse.y);
            this.maskEllipse.setAttribute('rx', rx);
            this.maskEllipse.setAttribute('ry', ry);
            this.maskEllipse.setAttribute('transform',
                `rotate(${this.angle}, ${this.mouse.x}, ${this.mouse.y})`);
        }

        // 4. Visual cursor (dot/ring)
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
        // Text cursor transform
        document.querySelectorAll('p, h1, h2, h3, li').forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('text-hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('text-hover'));
        });

        // Magnetic buttons
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
