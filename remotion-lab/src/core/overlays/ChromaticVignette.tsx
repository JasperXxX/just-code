import React from 'react';
import { AbsoluteFill } from 'remotion';

/**
 * Beat-pulse driven coloured vignette.
 * Drive `pulse` from useBeatPulse.
 */
export const ChromaticVignette: React.FC<{
  pulse: number;
  color?: string;
  innerStop?: number; // 0..1, where vignette starts
}> = ({ pulse, color = '#ff1133', innerStop = 0.35 }) => {
  if (pulse < 0.01) return null;
  const alpha = Math.round(Math.max(0, Math.min(1, pulse)) * 220)
    .toString(16)
    .padStart(2, '0');
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, transparent ${innerStop * 100}%, ${color}${alpha} 100%)`,
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
      }}
    />
  );
};
