import * as THREE from 'three';
import { gsap } from 'gsap';
import vertexShader from './shaders/vertex.glsl?raw';
import fragmentShader from './shaders/fragment.glsl?raw';

export default class Scene {
    constructor() {
        this.container = document.getElementById('canvas-container');

        // Core Setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); // 2D Fullscreen Quad setup

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Uniforms
        this.uniforms = {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uScroll: { value: 0 }
        };

        // Add Object
        this.addObjects();

        // Events
        this.bindEvents();

        // Ticker
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
        window.addEventListener('scroll', this.onScroll.bind(this));
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }

    onMouseMove(e) {
        // Normalize mouse coords (-1 to 1) for shader if needed, or pixel coords
        // Here we pass pixel coords normalized 0-1
        this.uniforms.uMouse.value.x = e.clientX / window.innerWidth;
        this.uniforms.uMouse.value.y = 1.0 - (e.clientY / window.innerHeight); // GLSL Y is flipped
    }

    onScroll() {
        this.uniforms.uScroll.value = window.scrollY;
    }

    update(time, deltaTime, frame) {
        this.uniforms.uTime.value += deltaTime * 0.001; // Convert ms to seconds
        this.renderer.render(this.scene, this.camera);
    }
}
