/**
 * P4 — Three.js scene driven by useCurrentFrame (NO useFrame from R3F).
 * - Animated torus-knot with shader material (wave + iridescence)
 * - Procedural starfield background
 * - Camera orbit
 *
 * Render with --gl=angle (set in remotion.config.ts when needed) or default headless.
 */
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, random } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';

const VERTEX = /* glsl */`
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vWave;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec3 displaced = position + normal * (sin(position.x * 4.0 + uTime * 2.0) * 0.06 + cos(position.y * 3.0 + uTime * 1.5) * 0.04);
    vWave = sin(position.x * 4.0 + uTime * 2.0) * 0.5 + 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const FRAGMENT = /* glsl */`
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vWave;

  vec3 hueShift(vec3 col, float h) {
    const mat3 toYIQ = mat3(0.299, 0.587, 0.114, 0.595716, -0.274453, -0.321263, 0.211456, -0.522591, 0.311135);
    const mat3 toRGB = mat3(1.0, 0.9563, 0.6210, 1.0, -0.2721, -0.6474, 1.0, -1.1070, 1.7046);
    vec3 yiq = toYIQ * col;
    float angle = h * 6.28318;
    float c = cos(angle); float s = sin(angle);
    yiq = vec3(yiq.x, yiq.y * c - yiq.z * s, yiq.y * s + yiq.z * c);
    return clamp(toRGB * yiq, 0.0, 1.0);
  }

  void main() {
    vec3 base = vec3(0.36, 0.62, 1.0);
    vec3 col = hueShift(base, vWave + uTime * 0.05);
    float light = max(0.0, dot(normalize(vNormal), normalize(vec3(0.6, 0.8, 0.4))));
    float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.5);
    col = col * (0.4 + 0.6 * light) + vec3(1.0) * fresnel * 0.4;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const StarField: React.FC<{ count?: number }> = ({ count = 600 }) => {
  // Build buffer geometry once (memoized via useMemo in real render this is fine)
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 30 + random(`star-r-${i}`) * 70;
      const theta = random(`star-t-${i}`) * Math.PI * 2;
      const phi = Math.acos(2 * random(`star-p-${i}`) - 1);
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.4} color="#ffffff" sizeAttenuation transparent opacity={0.85} />
    </points>
  );
};

const TorusKnot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );
  uniforms.uTime.value = t;

  return (
    <mesh rotation={[t * 0.3, t * 0.45, t * 0.18]}>
      <torusKnotGeometry args={[2.2, 0.7, 220, 32, 2, 5]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
      />
    </mesh>
  );
};

export const ThreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Camera orbit: rotate around scene + slow zoom in
  const t = frame / 30;
  const camRadius = interpolate(frame, [0, durationInFrames], [10, 6], { extrapolateRight: 'clamp' });
  const camAngle = t * 0.25;
  const camX = Math.cos(camAngle) * camRadius;
  const camZ = Math.sin(camAngle) * camRadius;
  const camY = Math.sin(t * 0.15) * 1.5;

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse, #1a0b2e 0%, #000 70%)' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 45, position: [camX, camY, camZ], near: 0.1, far: 200 }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffd9a8" />
        <pointLight position={[-8, -4, 6]} intensity={0.4} color="#7faaff" />

        <StarField />
        <TorusKnot />
      </ThreeCanvas>

      {/* HUD overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          color: '#fff',
          fontFamily: 'SF Pro Display, sans-serif',
          mixBlendMode: 'screen',
        }}
      >
        <div style={{ fontSize: 22, color: '#9a9ac0', letterSpacing: 6, marginBottom: 8 }}>P4 · AMBITION 02</div>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.04em' }}>WEBGL</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 80,
          color: '#fff',
          fontFamily: 'SF Mono, monospace',
          fontSize: 16,
          opacity: 0.7,
          textAlign: 'right',
          lineHeight: 1.6,
        }}
      >
        <div>three.js {THREE.REVISION ?? '—'}</div>
        <div>shader material</div>
        <div>vertex displacement</div>
        <div>fresnel rim</div>
        <div>HUE-SHIFT FRAGMENT</div>
      </div>
    </AbsoluteFill>
  );
};
