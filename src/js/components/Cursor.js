import gsap from 'gsap';

export default class Cursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.dot = document.querySelector('.cursor-dot');

        // SVG ClipPath elements (creative layer reveal)
        this.clipPath = document.getElementById('reveal-clip');
        this.mainCircle = document.getElementById('cursor-main');

        // State
        this.mouse = { x: -9999, y: -9999 };
        this.lastMouse = { x: -9999, y: -9999 };
        this.velocity = 0;
        this.angle = 0;
        this.isMagnetic = false;
        this.hasEntered = false;

        // Config
        this.baseRadius = 200;  // Flashlight radius
        this.maxStretch = 120;  // Max liquid stretch
        this.maxTrail = 20;   // Trail length (number of ghost circles)
        this.trailPoints = [];   // History of mouse positions

        // Create trail circle elements in SVG clipPath
        this.trailCircles = [];
        if (this.clipPath) {
            for (let i = 0; i < this.maxTrail; i++) {
                const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                c.setAttribute('cx', '-9999');
                c.setAttribute('cy', '-9999');
                c.setAttribute('r', '0');
                this.clipPath.insertBefore(c, this.mainCircle); // trail behind main
                this.trailCircles.push(c);
            }
        }

        // Bind loop
        this.update = this.update.bind(this);

        window.addEventListener('mousemove', (e) => {
            this.hasEntered = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.addEventListener('mouseleave', () => {
            this.hasEntered = false;
            // Snap main circle off-screen
            if (this.mainCircle) {
                this.mainCircle.setAttribute('cx', '-9999');
                this.mainCircle.setAttribute('cy', '-9999');
                this.mainCircle.setAttribute('r', '0');
            }
            this.trailCircles.forEach(c => {
                c.setAttribute('cx', '-9999');
                c.setAttribute('cy', '-9999');
                c.setAttribute('r', '0');
            });
            this.trailPoints = [];
        });

        gsap.ticker.add(this.update);
        this.initHoverEffects();
    }

    update() {
        if (!this.hasEntered) return;

        // --- Physics ---
        const dx = this.mouse.x - this.lastMouse.x;
        const dy = this.mouse.y - this.lastMouse.y;
        const speed = Math.sqrt(dx * dx + dy * dy);

        this.velocity = gsap.utils.interpolate(this.velocity, speed, 0.12);

        if (speed > 2) {
            this.angle = Math.atan2(dy, dx) * 180 / Math.PI;
        }

        // --- Liquid Distortion ---
        const stretch = Math.min(this.velocity * 3.5, this.maxStretch);
        const rx = this.baseRadius + stretch;
        const ry = Math.max(this.baseRadius - stretch * 0.45, 70);

        // --- Trail ---
        // Push current position to front of history array
        this.trailPoints.unshift({ x: this.mouse.x, y: this.mouse.y });
        if (this.trailPoints.length > this.maxTrail) {
            this.trailPoints.pop();
        }

        // Update trail circles (older = smaller = more faded)
        this.trailCircles.forEach((circle, i) => {
            const pt = this.trailPoints[i];
            if (pt) {
                const ratio = 1 - (i + 1) / (this.maxTrail + 1);
                const trailRx = rx * ratio * 0.85;
                const trailRy = ry * ratio * 0.85;
                circle.setAttribute('cx', pt.x);
                circle.setAttribute('cy', pt.y);
                // Use rx as a proxy radius (trail circles are just circles, not ellipses — simpler + faster)
                circle.setAttribute('r', trailRx);
            } else {
                circle.setAttribute('cx', '-9999');
                circle.setAttribute('cy', '-9999');
                circle.setAttribute('r', '0');
            }
        });

        // --- Main cursor circle (ellipse with rotation) ---
        if (this.mainCircle) {
            this.mainCircle.setAttribute('cx', this.mouse.x);
            this.mainCircle.setAttribute('cy', this.mouse.y);
            // Use transform to make it an ellipse via scale trick
            // scale(rx/r, ry/r) around cx,cy — cleaner than switching element type
            this.mainCircle.setAttribute('r', this.baseRadius);
            this.mainCircle.setAttribute('transform',
                `translate(${this.mouse.x}, ${this.mouse.y}) rotate(${this.angle}) scale(${rx / this.baseRadius}, ${ry / this.baseRadius}) translate(${-this.mouse.x}, ${-this.mouse.y})`
            );
        }

        // --- Visual Cursor Dot ---
        if (this.cursor && !this.isMagnetic) {
            gsap.set(this.cursor, {
                '--cursor-x': `${this.mouse.x}px`,
                '--cursor-y': `${this.mouse.y}px`,
            });
        }

        this.lastMouse.x = this.mouse.x;
        this.lastMouse.y = this.mouse.y;
    }

    initHoverEffects() {
        // Magnetic buttons
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            const onMove = (e) => this.magnetizeElement(e, el);
            el.addEventListener('mouseenter', () => {
                this.isMagnetic = true;
                this.cursor?.classList.add('magnetic');
                el.addEventListener('mousemove', onMove);
            });
            el.addEventListener('mouseleave', () => {
                this.isMagnetic = false;
                this.cursor?.classList.remove('magnetic');
                gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
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
