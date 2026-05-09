/**
 * Vignette — subtle radial darkening at the edges. Always on. Pulls focus
 * to the center of the frame without being noticeable as an effect. Common
 * in pro travel-vlog grades.
 */
import React from 'react';
import { AbsoluteFill } from 'remotion';

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${strength.toFixed(
          3,
        )}) 100%)`,
        pointerEvents: 'none',
        mixBlendMode: 'multiply',
      }}
    />
  );
};
