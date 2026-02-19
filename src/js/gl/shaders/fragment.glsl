uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

void main() {
    vec2 st = vUv;
    
    // Gradient Mesh / Aurora Effect
    // Soft, slow moving blobs of color
    
    float t = uTime * 0.1;
    
    // 1. Base Deep Navy
    vec3 color = vec3(0.04, 0.06, 0.11); // #0A0F1C
    
    // 2. Blob 1 - Sky Blue (Top Left moving)
    vec2 pos1 = vec2(0.5 + 0.3 * sin(t), 0.5 + 0.2 * cos(t * 1.2));
    float dist1 = distance(st, pos1);
    float glow1 = exp(-dist1 * 3.0);
    color += vec3(0.22, 0.74, 0.97) * glow1 * 0.4; // #38BDF8
    
    // 3. Blob 2 - Indigo (Bottom Right moving)
    vec2 pos2 = vec2(0.2 + 0.4 * cos(t * 0.8), 0.2 + 0.3 * sin(t * 1.5));
    float dist2 = distance(st, pos2);
    float glow2 = exp(-dist2 * 2.5);
    color += vec3(0.51, 0.55, 0.97) * glow2 * 0.3; // #818CF8
    
    // 4. Blob 3 - Mouse Interaction (Subtle Spotlight)
    // Convert uMouse to UV space (it's already 0-1 from Scene.js)
    float distMouse = distance(st, vec2(uMouse.x, uMouse.y));
    float glowMouse = exp(-distMouse * 4.0);
    color += vec3(0.22, 0.74, 0.97) * glowMouse * 0.15; // Subtle follow
    
    // Add subtle noise for texture (dithering) to prevent banding
    float noise = fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
    color += noise * 0.02;

    gl_FragColor = vec4(color, 1.0);
}
