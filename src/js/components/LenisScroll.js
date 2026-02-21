/**
 * LenisScroll.js — Smooth scroll only.
 * No layer transformations, no fake-scroll.
 * Both layers scroll naturally as normal DOM elements.
 */
import Lenis from '@studio-freight/lenis';

export default class LenisScroll {
    constructor() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            smoothTouch: false,
        });

        // Drive Lenis via RAF
        const animate = (time) => {
            this.lenis.raf(time);
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}
