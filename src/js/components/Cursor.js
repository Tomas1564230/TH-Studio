import gsap from 'gsap';

export default class Cursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.dot = document.querySelector('.cursor-dot');
        this.ring = document.querySelector('.cursor-ring');

        // Create DOM elements if missing (fallback)
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

        // SVG Mask Elements
        this.maskEllipse = document.getElementById('cursor-hole');

        // State
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.lastMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.velocity = 0;
        this.angle = 0;
        this.isMagnetic = false;

        // Config
        this.baseRadius = 250; // Match CSS --mask-size
        this.maxStretch = 100;

        // Bind Loop
        this.update = this.update.bind(this);

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        gsap.ticker.add(this.update);
        this.initHoverEffects();
    }

    update() {
        // 1. Calculate Physics
        const dx = this.mouse.x - this.lastMouse.x;
        const dy = this.mouse.y - this.lastMouse.y;
        const speed = Math.sqrt(dx * dx + dy * dy);

        // Smooth velocity for organic feel
        this.velocity = gsap.utils.interpolate(this.velocity, speed, 0.1);

        // Update Angle if moving fast enough
        if (speed > 2) {
            const angleRad = Math.atan2(dy, dx);
            this.angle = (angleRad * 180 / Math.PI);
        }

        // 2. Liquid Distortion (Stretch based on speed)
        // Stretch X (forward direction), Shrink Y (perpendicular)
        const stretch = Math.min(this.velocity * 4, this.maxStretch);
        const rx = this.baseRadius + stretch;
        const ry = this.baseRadius - (stretch * 0.4);

        // 3. Update SVG Mask (The Flashlight)
        if (this.maskEllipse) {
            // We move the center (cx, cy)
            this.maskEllipse.setAttribute('cx', this.mouse.x);
            this.maskEllipse.setAttribute('cy', this.mouse.y);

            // We stretch the ellipse
            this.maskEllipse.setAttribute('rx', rx);
            this.maskEllipse.setAttribute('ry', ry);

            // We rotate it to face movement direction (around its own center)
            // transform="rotate(angle, cx, cy)"
            this.maskEllipse.setAttribute('transform', `rotate(${this.angle}, ${this.mouse.x}, ${this.mouse.y})`);
        }

        // 4. Update Visual Cursor (Dot/Ring)
        if (!this.isMagnetic) {
            gsap.to(this.cursor, {
                duration: 0.1,
                '--cursor-x': `${this.mouse.x}px`,
                '--cursor-y': `${this.mouse.y}px`,
                overwrite: 'auto',
                ease: 'power2.out'
            });
        }

        this.lastMouse.x = this.mouse.x;
        this.lastMouse.y = this.mouse.y;
    }

    initHoverEffects() {
        // Text Hover
        const textTargets = document.querySelectorAll('p, h1, h2, h3, span, li');
        textTargets.forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('text-hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('text-hover'));
        });

        // Magnetic Targets
        const magneticTargets = document.querySelectorAll('[data-magnetic]');
        magneticTargets.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                this.isMagnetic = true;
                this.cursor.classList.add('magnetic');

                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                gsap.to(this.cursor, {
                    duration: 0.3,
                    '--cursor-x': `${centerX}px`,
                    '--cursor-y': `${centerY}px`,
                    ease: 'back.out(1.7)',
                    overwrite: 'auto'
                });

                el.addEventListener('mousemove', (e) => this.magnetizeElement(e, el));
            });

            el.addEventListener('mouseleave', (e) => {
                this.isMagnetic = false;
                this.cursor.classList.remove('magnetic');

                gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
                el.removeEventListener('mousemove', this.magnetizeElement);
            });
        });
    }

    magnetizeElement(e, el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const moveX = (e.clientX - centerX) * 0.3;
        const moveY = (e.clientY - centerY) * 0.3;

        gsap.to(el, {
            x: moveX,
            y: moveY,
            duration: 0.2,
            overwrite: 'auto'
        });
    }
}
