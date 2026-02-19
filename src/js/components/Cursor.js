import gsap from 'gsap';

export default class Cursor {
    constructor() {
        this.cursor = document.querySelector('.custom-cursor');
        // If not found in HTML, create dynamically
        if (!this.cursor) {
            this.cursor = document.createElement('div');
            this.cursor.className = 'custom-cursor';
            document.body.appendChild(this.cursor);
        }

        this.pos = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };

        // Performance optimization: quickTo for lag effect without jank
        this.xSet = gsap.quickTo(this.cursor, "x", { duration: 0.2, ease: "power3" });
        this.ySet = gsap.quickTo(this.cursor, "y", { duration: 0.2, ease: "power3" });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            this.xSet(this.mouse.x);
            this.ySet(this.mouse.y);
        });

        this.initHoverEffects();
    }

    initHoverEffects() {
        // Basic hover effect for interactive elements
        const targets = document.querySelectorAll('a, button, [data-magnetic]');

        targets.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('active');
                gsap.to(this.cursor, { scale: 3, mixBlendMode: 'difference', overwrite: 'auto' });
            });
            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('active');
                gsap.to(this.cursor, { scale: 1, mixBlendMode: 'normal', overwrite: 'auto' });
            });
        });
    }
}
