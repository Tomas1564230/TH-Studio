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
        this.isMagnetic = false;

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            this.updateCursor();
        });

        this.initHoverEffects();
    }

    updateCursor() {
        // MASKING: Update CSS vars on Corporate Layer
        const corporateLayer = document.querySelector('.layer-corporate');
        if (corporateLayer) {
            corporateLayer.style.setProperty('--cursor-x', `${this.mouse.x}px`);
            corporateLayer.style.setProperty('--cursor-y', `${this.mouse.y}px`);
        }

        if (this.isMagnetic) return; // Let magnetic logic handle position

        // Smooth follow for ring, instant for dot (via CSS var or GSAP)
        gsap.to(this.cursor, {
            duration: 0.1,
            '--cursor-x': `${this.mouse.x}px`,
            '--cursor-y': `${this.mouse.y}px`,
            ease: 'power2.out'
        });
    }

    initHoverEffects() {
        // Text Hover (Paragraphs, Spans - reading mode)
        const textTargets = document.querySelectorAll('p, h1, h2, h3, span, li');
        textTargets.forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('text-hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('text-hover'));
        });

        // Magnetic Targets (Buttons, Links with data-magnetic)
        const magneticTargets = document.querySelectorAll('[data-magnetic]');
        magneticTargets.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                this.isMagnetic = true;
                this.cursor.classList.add('magnetic');

                // Snapping logic
                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                gsap.to(this.cursor, {
                    duration: 0.3,
                    '--cursor-x': `${centerX}px`,
                    '--cursor-y': `${centerY}px`,
                    ease: 'back.out(1.7)'
                });

                // Move element slightly heavily (magnetic pull)
                el.addEventListener('mousemove', (e) => this.magnetizeElement(e, el));
            });

            el.addEventListener('mouseleave', (e) => {
                this.isMagnetic = false;
                this.cursor.classList.remove('magnetic');

                // Reset element position
                gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });

                // Remove listener
                el.removeEventListener('mousemove', this.magnetizeElement);
            });
        });
    }

    magnetizeElement(e, el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate distance from center
        const moveX = (e.clientX - centerX) * 0.3; // Strength of pull
        const moveY = (e.clientY - centerY) * 0.3;

        gsap.to(el, {
            x: moveX,
            y: moveY,
            duration: 0.2,
            overwrite: 'auto'
        });
    }
}
