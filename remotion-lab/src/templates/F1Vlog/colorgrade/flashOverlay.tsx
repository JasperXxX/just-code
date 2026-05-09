import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

type FlashPattern = 'whiteBlack' | 'whiteOnly';

type FlashOverlayProps = {
  flashFrames: number[];
  pattern?: FlashPattern;
};

export const FlashOverlay: React.FC<FlashOverlayProps> = ({
  flashFrames,
  pattern = 'whiteBlack',
}) => {
  const frame = useCurrentFrame();

  // Pre-bucketed lookup is overkill at <10 flashes per 90s vlog; linear scan is fine.
  let mode: 'white' | 'black' | null = null;
  for (let i = 0; i < flashFrames.length; i++) {
    const f = flashFrames[i];
    if (frame === f) {
      mode = 'white';
      break;
    }
    if (pattern === 'whiteBlack' && frame === f + 1) {
      mode = 'black';
      break;
    }
  }

  if (mode === null) return null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: mode === 'white' ? '#ffffff' : '#000000',
        pointerEvents: 'none',
      }}
    />
  );
};

export default FlashOverlay;
