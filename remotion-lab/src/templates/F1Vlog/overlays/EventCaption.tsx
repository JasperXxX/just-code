import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { fontFamily as archivoBlack, loadFont as loadArchivo } from '@remotion/google-fonts/ArchivoBlack';
import { TEAM_COLORS, FONTS_F1 } from './TelemetryHUD';

loadArchivo('normal', { weights: ['400'] });

export type EventCaptionProps = {
  text: string;
  subtitle?: string;
  team?: string;
  intensity?: 'standard' | 'heavy';
  align?: 'center' | 'left' | 'right';
};

const clampOpts = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const EventCaption: React.FC<EventCaptionProps> = ({
  text,
  subtitle,
  team,
  intensity = 'standard',
  align = 'center',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = team ? TEAM_COLORS[team] ?? TEAM_COLORS.default : TEAM_COLORS.default;
  const color = team && TEAM_COLORS[team] ? palette.primary : '#FF1E1E';

  const fontSize = intensity === 'heavy' ? 130 : 110;

  // Entry: 6f scale 0.6 → 1.0 with overshoot from spring; rotation deterministic from text length so repeated punches don't all twist the same way
  const entry = spring({
    fps,
    frame,
    config: { damping: 11, mass: 0.6, stiffness: 180 },
    durationInFrames: 12,
  });
  const entryScale = interpolate(entry, [0, 1], [0.6, 1.0], clampOpts);
  const rotateDir = text.length % 2 === 0 ? 1 : -1;
  const entryRot = interpolate(frame, [0, 6], [3 * rotateDir, 0], clampOpts);

  // Hold begins at frame 6, exit starts at frame 24 (6 entry + 18 hold)
  const exitStart = 24;
  const exitDur = 8;
  const exitT = interpolate(frame, [exitStart, exitStart + exitDur], [0, 1], clampOpts);
  const exitScale = interpolate(exitT, [0, 1], [1, 1.05]);
  const exitOp = interpolate(exitT, [0, 1], [1, 0]);

  const scale = entryScale * exitScale;

  const subFade = interpolate(frame, [4, 14], [0, 1], clampOpts);
  const subY = interpolate(frame, [4, 14], [10, 0], clampOpts);

  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const textAlign: 'left' | 'right' | 'center' = align;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: justify,
        padding: align === 'center' ? 0 : '0 120px',
        opacity: exitOp,
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) rotate(${entryRot}deg)`,
          transformOrigin: align === 'left' ? 'left center' : align === 'right' ? 'right center' : 'center',
          textAlign,
        }}
      >
        <div
          style={{
            fontFamily: archivoBlack,
            fontWeight: 900,
            fontSize,
            color,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 0.95,
            // Outline + shadow keeps copy legible over wildly varying footage
            WebkitTextStroke: '1px #000',
            textShadow: '0 6px 24px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.9)',
          }}
        >
          {text}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: FONTS_F1.mono,
              fontWeight: 700,
              fontSize: 24,
              color: '#fff',
              marginTop: 14,
              letterSpacing: '0.04em',
              fontVariantNumeric: 'tabular-nums',
              opacity: subFade,
              transform: `translateY(${subY}px)`,
              textShadow: '0 2px 10px rgba(0,0,0,0.85)',
              WebkitTextStroke: '0.5px rgba(0,0,0,0.7)',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
