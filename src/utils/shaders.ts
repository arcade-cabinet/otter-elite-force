/**
 * Custom Shaders for OTTER: ELITE FORCE
 */

export const WATER_VERT = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  
  void main() {
    vUv = uv;
    vec3 p = position;
    
    // Wave displacement
    float wave = sin(p.x * 0.1 + time * 1.5) * 0.5 + 
                 sin(p.z * 0.1 + time * 1.2) * 0.5;
    p.y += wave;
    
    vPosition = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const WATER_FRAG = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  uniform vec3 waterColor;
  uniform float alpha;
  
  void main() {
    // Simple animated noise-like effect
    float noise = sin(vPosition.x * 0.5 + time) * 0.5 + 
                  sin(vPosition.z * 0.5 + time) * 0.5;
    
    vec3 color = waterColor + noise * 0.1;
    gl_FragColor = vec4(color, alpha);
  }
`;

export const FLAG_VERT = `
  varying vec2 vUv;
  uniform float time;
  
  void main() {
    vUv = uv;
    vec3 p = position;
    
    // Flag waving math
    float wave = sin(uv.x * 5.0 - time * 2.0) * 0.3 + 
                 sin(uv.y * 3.0 + time) * 0.1;
    p.z += wave * uv.x; // Intensity increases further from the flagpole
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const FLAG_FRAG = `
  varying vec2 vUv;
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform vec3 colorC;
  uniform vec3 stripeColor;
  
  void main() {
    vec3 col = colorA;
    float d = distance(vUv, vec2(0.5));
    
    // Procedural flag design parameterized
    if(d < 0.35) col = colorC;
    if(d < 0.30) col = colorB;
    if(vUv.y < 0.2 || vUv.y > 0.8) col = stripeColor;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;
