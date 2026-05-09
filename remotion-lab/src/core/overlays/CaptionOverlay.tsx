/**
 * CaptionOverlay — bottom-third subtitle showing what's actually being said.
 * Reads from whisper transcripts. Words fade in progressively over the clip,
 * giving a "real-time captions" feel — but predetermined, no live STT.
 */
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const CaptionOverlay: React.FC<{
  text: string;
  liveFrames: number;
  /** When false, all words appear at once with simple fade. When true,
   * words appear sequentially across the clip (typewriter-ish). */
  progressive?: boolean;
}> = ({ text, liveFrames, progressive = true }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (frame < 0 || frame >= liveFrames) return null;

  const t = frame / liveFrames;

  // Fade in over first 4 frames, hold, fade out over last 6 frames
  const opacity = interpolate(t, [0, 0.06, 0.85, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const words = text.split(/\s+/);
  const visibleWords = progressive
    ? words.slice(0, Math.max(1, Math.floor(t * words.length * 1.05)))
    : words;
  const display = visibleWords.join(' ');

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '14%',
          transform: 'translateX(-50%)',
          maxWidth: '88%',
          opacity,
          color: '#ffffff',
          fontFamily: '"SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
          fontSize: Math.round(width * 0.038),
          fontWeight: 700,
          textAlign: 'center',
          textShadow:
            '0 3px 12px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,1), 1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
        }}
      >
        {display}
      </div>
    </AbsoluteFill>
  );
};
