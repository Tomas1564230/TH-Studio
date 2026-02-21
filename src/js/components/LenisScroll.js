import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default class LenisScroll {
    constructor() {
        this.creative = document.querySelector('.layer-creative');
        this.corpo = document.querySelector('.layer-corporate');
        this.proxy = document.getElementById('scroll-proxy');

        // Both layers are position:fixed — we fake scroll via translateY
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            smoothTouch: false,
        });

        // Set proxy height to match tallest layer content
        this.syncProxyHeight();
        window.addEventListener('resize', () => this.syncProxyHeight());

        // On each scroll tick: translate both layers together
        this.lenis.on('scroll', ({ scroll }) => {
            if (this.creative) this.creative.style.transform = `translateY(-${scroll}px)`;
            if (this.corpo) this.corpo.style.transform = `translateY(-${scroll}px)`;
            ScrollTrigger.update();
        });

        // Drive Lenis from GSAP ticker (prevents double RAF)
        gsap.ticker.add((time) => {
            this.lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    syncProxyHeight() {
        // Page height = max of both layers' scroll content heights
        const h = Math.max(
            this.corpo?.scrollHeight || 0,
            this.creative?.scrollHeight || 0
        );
        if (this.proxy) this.proxy.style.height = `${h}px`;
    }
}
