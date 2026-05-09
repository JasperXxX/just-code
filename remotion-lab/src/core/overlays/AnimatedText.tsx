/**
 * Animated text cards for the EurogangVlogTrip edit.
 *
 *   • Hero — large center reveal, letter-by-letter with spring + blur
 *   • Stamp — corner location label, slide-in then slide-out
 *   • Note — italic side-note, rotated, soft fade
 *   • Glitch — chunky display text with RGB split + scale pop on the drop
 *
 * All drive their entry/exit purely from useCurrentFrame.
 */

import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// -----------------------------------------------------------------------------
// HeroText — big letter-by-letter title
// -----------------------------------------------------------------------------

export const HeroText: React.FC<{
  text: string;
  /** seconds the card stays fully on-screen (excluding in/out animations). */
  hold?: number;
}> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const letters = text.split('');
  const outroStart = durationInFrames - 12;
  const outOp = interpolate(frame, [outroStart, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outScale = interpolate(frame, [outroStart, durationInFrames], [1, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const outBlur = interpolate(frame, [outroStart, durationInFrames], [0, 12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        opacity: outOp,
        transform: `scale(${outScale})`,
        filter: `blur(${outBlur}px)`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          fontFamily: 'SF Pro Display, -apple-system, sans-serif',
          fontWeight: 800,
          fontSize: 168,
          color: '#fff',
          letterSpacing: '-0.04em',
          textShadow: '0 6px 32px rgba(0,0,0,0.7)',
          lineHeight: 1,
        }}
      >
        {letters.map((ch, i) => {
          const sLet = spring({ fps, frame: frame - 6 - i * 2, config: { damping: 12, mass: 0.7 } });
          const y = interpolate(sLet, [0, 1], [70, 0]);
          const op = interpolate(sLet, [0, 1], [0, 1]);
          const blur = interpolate(sLet, [0, 1], [16, 0]);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `translateY(${y}px)`,
                opacity: op,
                filter: `blur(${blur}px)`,
              }}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------------------------
// LocationStamp — bottom-left corner label
// -----------------------------------------------------------------------------

export const LocationStamp: React.FC<{ text: string; accent?: string }> = ({
  text,
  accent = '#ff8a4f',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sIn = spring({ fps, frame, config: { damping: 22, mass: 1.4 } });
  const inX = interpolate(sIn, [0, 1], [-40, 0]);
  const inOp = interpolate(sIn, [0, 1], [0, 1]);
  const outOp = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 110,
        left: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: inOp * outOp,
        transform: `translateX(${inX}px)`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 14px ${accent}`,
        }}
      />
      <div
        style={{
          color: '#f4ede4',
          fontFamily: 'SF Pro Display, -apple-system, sans-serif',
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: 5,
          textShadow: '0 2px 16px rgba(0,0,0,0.8)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// NoteText — italic top-right side note
// -----------------------------------------------------------------------------

export const NoteText: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sIn = spring({ fps, frame, config: { damping: 18 } });
  const op = interpolate(sIn, [0, 1], [0, 1]);
  const y = interpolate(sIn, [0, 1], [12, 0]);
  const outOp = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 130,
        right: 60,
        color: '#f4ede4',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 38,
        fontStyle: 'italic',
        textAlign: 'right',
        maxWidth: 420,
        opacity: op * outOp,
        transform: `translateY(${y}px) rotate(-2deg)`,
        textShadow: '0 2px 14px rgba(0,0,0,0.7)',
        pointerEvents: 'none',
      }}
    >
      &mdash; {text}
    </div>
  );
};

// -----------------------------------------------------------------------------
// GlitchHeadline — chunky display text with RGB split + scale pop
// -----------------------------------------------------------------------------

export const GlitchHeadline: React.FC<{ text: string; accent?: string }> = ({
  text,
  accent = '#ff1133',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sIn = spring({ fps, frame, config: { damping: 9, mass: 0.7 } });
  const scale = interpolate(sIn, [0, 1], [0.7, 1]);
  const op = interpolate(sIn, [0, 1], [0, 1]);
  const splitDecay = interpolate(frame, [4, 10, 18], [16, 6, 0], { extrapolateRight: 'clamp' });
  const outOp = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const final = op * outOp;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div
        style={{
          position: 'relative',
          fontFamily: 'SF Pro Display, -apple-system, sans-serif',
          fontWeight: 900,
          fontSize: 220,
          letterSpacing: '-0.04em',
          opacity: final,
          transform: `scale(${scale})`,
        }}
      >
        {/* R offset */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            color: accent,
            transform: `translate(${-splitDecay}px, 0)`,
            mixBlendMode: 'screen',
          }}
        >
          {text}
        </div>
        {/* B offset */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            color: '#5e9eff',
            transform: `translate(${splitDecay}px, 0)`,
            mixBlendMode: 'screen',
          }}
        >
          {text}
        </div>
        {/* center white */}
        <div
          style={{
            color: '#ffffff',
            position: 'relative',
            textShadow: '0 8px 28px rgba(0,0,0,0.6)',
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
