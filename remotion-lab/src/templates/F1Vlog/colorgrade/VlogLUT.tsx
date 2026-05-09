import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

type VlogLUTProps = {
  intensity?: number;
  children?: React.ReactNode;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Deterministic per-pixel-block hash; cheap; frame-derived only.
const hash = (x: number, y: number, f: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233 + f * 0.13) * 43758.5453;
  return s - Math.floor(s);
};

// Static grain tile baked once as a data URL — re-rendering 1920x1080 noise
// per frame is too expensive; we shift a small tile instead.
const GRAIN_TILE_SIZE = 96;
const buildGrainDataUrl = (): string => {
  const size = GRAIN_TILE_SIZE;
  const cells: string[] = [];
  for (let y = 0; y < size; y += 4) {
    for (let x = 0; x < size; x += 4) {
      const v = hash(x, y, 1);
      const a = (v * 0.5 + 0.25).toFixed(3);
      cells.push(
        `<rect x="${x}" y="${y}" width="4" height="4" fill="rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})" fill-opacity="${a}"/>`,
      );
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${cells.join('')}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

const GRAIN_URL = buildGrainDataUrl();

export const VlogLUT: React.FC<VlogLUTProps> = ({ intensity = 1, children }) => {
  const frame = useCurrentFrame();
  const k = clamp01(intensity);

  // Tile-shift drives apparent randomness without recomputing the noise SVG.
  const grainShiftX = (frame * 7) % GRAIN_TILE_SIZE;
  const grainShiftY = (frame * 11) % GRAIN_TILE_SIZE;

  return (
    <AbsoluteFill>
      {/* saturate(0.92) is the cheapest desaturation path; CSS filter beats a saturation blend overlay here. */}
      <AbsoluteFill style={{ filter: `saturate(${1 - 0.08 * k})` }}>{children}</AbsoluteFill>

      <AbsoluteFill
        style={{
          backgroundColor: '#2a1f15',
          mixBlendMode: 'screen',
          opacity: 0.08 * k,
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundColor: '#f4e4d2',
          mixBlendMode: 'multiply',
          opacity: 0.06 * k,
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundColor: '#c47b3a',
          mixBlendMode: 'overlay',
          opacity: 0.04 * k,
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: GRAIN_URL,
          backgroundRepeat: 'repeat',
          backgroundSize: `${GRAIN_TILE_SIZE}px ${GRAIN_TILE_SIZE}px`,
          backgroundPosition: `${grainShiftX}px ${grainShiftY}px`,
          mixBlendMode: 'overlay',
          opacity: 0.03 * k,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export default VlogLUT;
