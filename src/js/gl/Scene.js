import * as THREE from 'three';
import { gsap } from 'gsap';
import vertexShader from './shaders/vertex.glsl?raw';
import fragmentShader from './shaders/fragment.glsl?raw';

export default class Scene {
    constructor() {
        this.container = document.getElementById('canvas-container');

        // Core Setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Uniforms
        this.uniforms = {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) } // Start center
        };

        this.addObjects();
        this.bindEvents();

        gsap.ticker.add(this.update.bind(this));
    }

    addObjects() {
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide
        });

        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    bindEvents() {
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }

    onMouseMove(e) {
        // Smoother mouse lerp could be added here, but shader handles some softness
        gsap.to(this.uniforms.uMouse.value, {
            x: e.clientX / window.innerWidth,
            y: 1.0 - (e.clientY / window.innerHeight),
            duration: 1,
            ease: "power2.out"
        });
    }

    update(time, deltaTime, frame) {
        this.uniforms.uTime.value += deltaTime * 0.001;
        this.renderer.render(this.scene, this.camera);
    }
}
