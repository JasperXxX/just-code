/**
 * P4 — 2000+ particle galaxy.
 * All deterministic (random(seed) only). Particles arranged in a 3-arm spiral,
 * orbiting a bright nucleus. Camera dollies in slowly.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS, FONTS } from '../templates/common';

const N_PARTICLES = 2400;
const ARMS = 3;
const ARM_TURN = 1.2; // turns per arm

type Particle = {
  baseAngle: number;
  baseRadius: number;
  arm: number;
  size: number;
  brightness: number;
  hueOffset: number;
};

// Pre-compute particles deterministically (module load)
const PARTICLES: Particle[] = Array.from({ length: N_PARTICLES }).map((_, i) => {
  const arm = i % ARMS;
  const r = random(`r-${i}`);
  const baseRadius = Math.pow(r, 0.6) * 700 + 30; // bias toward outside
  const along = (baseRadius / 700) * ARM_TURN * Math.PI * 2;
  const baseAngle = (arm / ARMS) * Math.PI * 2 + along + (random(`a-${i}`) - 0.5) * 0.6;
  const size = 1 + random(`s-${i}`) * 3;
  const brightness = 0.5 + random(`b-${i}`) * 0.5;
  const hueOffset = (random(`h-${i}`) - 0.5) * 60;
  return { baseAngle, baseRadius, arm, size, brightness, hueOffset };
});

export const ParticleGalaxy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const t = frame / fps;
  const cx = width / 2;
  const cy = height / 2;

  // Camera dolly: zoom in slightly + slight rotation
  const dollyT = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(dollyT, [0, 1], [0.95, 1.4]);
  const camRot = interpolate(dollyT, [0, 1], [0, 12]);

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, #0a0817 0%, #000 80%)' }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) rotate(${camRot}deg)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Particles */}
        {PARTICLES.map((p, i) => {
          // Orbital motion (Keplerian-ish: closer = faster)
          const orbitSpeed = 0.18 / (p.baseRadius / 200 + 0.4);
          const angle = p.baseAngle + t * orbitSpeed;
          const x = cx + Math.cos(angle) * p.baseRadius;
          const y = cy + Math.sin(angle) * p.baseRadius * 0.45; // ellipse
          // Brightness pulses subtly with frame
          const pulse = 1 + Math.sin(t * 0.6 + p.baseAngle * 8) * 0.18;
          const radial = p.baseRadius / 700;
          const hue = 220 + radial * 80 + p.hueOffset; // inner=blue, outer=cyan
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: p.size * pulse,
                height: p.size * pulse,
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                borderRadius: '50%',
                background: `hsla(${hue}, 90%, 75%, ${p.brightness})`,
                boxShadow: `0 0 ${p.size * 3}px hsla(${hue}, 90%, 70%, ${p.brightness * 0.7})`,
              }}
            />
          );
        })}

        {/* Bright nucleus */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: 200,
            height: 200,
            marginLeft: -100,
            marginTop: -100,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,250,210,0.95) 0%, rgba(255,200,140,0.5) 30%, transparent 70%)`,
            filter: 'blur(3px)',
            transform: `scale(${1 + Math.sin(t * 1.2) * 0.05})`,
          }}
        />
        {/* Bright core */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: 22,
            height: 22,
            marginLeft: -11,
            marginTop: -11,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 0 60px #fff, 0 0 120px #fff',
          }}
        />
      </AbsoluteFill>

      {/* HUD */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 80,
          color: '#fff',
          fontFamily: FONTS.mono,
          fontSize: 18,
          opacity: 0.85,
          mixBlendMode: 'difference',
          lineHeight: 1.6,
          letterSpacing: 1,
        }}
      >
        <div>{N_PARTICLES.toLocaleString()} PARTICLES</div>
        <div>3 ARMS · ARMTURN {ARM_TURN.toFixed(1)}</div>
        <div>FRAME {String(frame).padStart(4, '0')}</div>
        <div>DETERMINISTIC · NO MATH.RANDOM</div>
      </div>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          color: '#fff',
          fontFamily: FONTS.display,
          mixBlendMode: 'difference',
        }}
      >
        <div style={{ fontSize: 22, color: '#9a9ac0', letterSpacing: 6, marginBottom: 8 }}>P4 · AMBITION 01</div>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>GALAXY</div>
      </div>
    </AbsoluteFill>
  );
};
