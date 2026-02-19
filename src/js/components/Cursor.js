import gsap from 'gsap';

export default class Cursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.dot = document.querySelector('.cursor-dot');
        this.ring = document.querySelector('.cursor-ring');

        // Create if missing (fallback)
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

        this.mouse = { x: 0, y: 0 };
        this.lastMouse = { x: 0, y: 0 };
        this.velocity = 0;
        this.currentMaskSize = 250; // Base size
        this.isMagnetic = false;

        // Bind the loop
        this.update = this.update.bind(this);

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        gsap.ticker.add(this.update);
        this.initHoverEffects();
    }

    update() {
        // 1. Calculate Velocity for Liquid Effect
        const dx = this.mouse.x - this.lastMouse.x;
        const dy = this.mouse.y - this.lastMouse.y;
        const speed = Math.sqrt(dx * dx + dy * dy);

        // Smooth the velocity value
        this.velocity = gsap.utils.interpolate(this.velocity, speed, 0.1);

        // Calculate targeted mask size (faster = bigger/wobblier)
        const targetMaskSize = 250 + (this.velocity * 1.5);
        // Smoothly interpolate current size to target
        this.currentMaskSize = gsap.utils.interpolate(this.currentMaskSize, targetMaskSize, 0.1);

        // 2. Update CSS Variables for Mask
        const corporateLayer = document.querySelector('.layer-corporate');
        if (corporateLayer) {
            corporateLayer.style.setProperty('--cursor-x', `${this.mouse.x}px`);
            corporateLayer.style.setProperty('--cursor-y', `${this.mouse.y}px`);
            corporateLayer.style.setProperty('--mask-size', `${this.currentMaskSize}px`);
        }

        // 3. Update Visual Cursor Position
        if (!this.isMagnetic) {
            // Use GSAP for smooth follow on RING, instant on DOT
            gsap.to(this.cursor, {
                duration: 0.1,
                '--cursor-x': `${this.mouse.x}px`,
                '--cursor-y': `${this.mouse.y}px`,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        }

        // Update history
        this.lastMouse.x = this.mouse.x;
        this.lastMouse.y = this.mouse.y;
    }

    initHoverEffects() {
        // Text Hover (Paragraphs, Spans - reading mode)
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
