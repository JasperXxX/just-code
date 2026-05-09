import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { TEAM_COLORS, FONTS_F1 } from './TelemetryHUD';

export type F1LowerThirdProps = {
  driver: string;
  team?: string;
  track?: string;
  lap?: number;
  totalLaps?: number;
  revealFrame?: number;
};

const clampOpts = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const LowerThird: React.FC<F1LowerThirdProps> = ({
  driver,
  team,
  track,
  lap,
  totalLaps,
  revealFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const palette = TEAM_COLORS[team ?? 'default'] ?? TEAM_COLORS.default;

  const local = frame - revealFrame;

  // 12f slide-in from -120px → 0; opacity ramps in slightly faster so the bar feels solid before settling
  const slide = interpolate(local, [0, 12], [-120, 0], clampOpts);
  const fade = interpolate(local, [0, 8], [0, 1], clampOpts);

  // Stripe scales up vertically a touch ahead of the text — a small lead-in
  const stripeScale = interpolate(local, [0, 10], [0, 1], clampOpts);

  // Body line stagger — track text trails the driver name by 4f
  const driverFade = interpolate(local, [4, 14], [0, 1], clampOpts);
  const driverY = interpolate(local, [4, 14], [16, 0], clampOpts);
  const trackFade = interpolate(local, [8, 18], [0, 1], clampOpts);
  const trackY = interpolate(local, [8, 18], [12, 0], clampOpts);

  const lapText =
    typeof lap === 'number'
      ? typeof totalLaps === 'number'
        ? `LAP ${lap}/${totalLaps}`
        : `LAP ${lap}`
      : null;

  const subline = [track, lapText].filter(Boolean).join('  ·  ');

  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        bottom: 110,
        display: 'flex',
        alignItems: 'stretch',
        transform: `translateX(${slide}px)`,
        opacity: fade,
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.55))',
      }}
    >
      {/* Vertical team-color bar — 4px wide visual tag */}
      <div
        style={{
          width: 4,
          background: palette.primary,
          transform: `scaleY(${stripeScale})`,
          transformOrigin: 'top center',
          boxShadow: `0 0 18px ${palette.primary}99`,
        }}
      />
      <div
        style={{
          background: 'rgba(5,5,5,0.78)',
          backdropFilter: 'blur(6px)',
          padding: '18px 28px 16px 24px',
          minWidth: 360,
        }}
      >
        <div
          style={{
            fontFamily: FONTS_F1.display,
            fontWeight: 600,
            fontSize: 36,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: '#fff',
            lineHeight: 1.05,
            transform: `translateY(${driverY}px)`,
            opacity: driverFade,
          }}
        >
          {driver}
        </div>
        {subline && (
          <div
            style={{
              fontFamily: FONTS_F1.display,
              fontWeight: 400,
              fontSize: 22,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#d8d8d8',
              marginTop: 6,
              transform: `translateY(${trackY}px)`,
              opacity: trackFade,
            }}
          >
            {subline}
          </div>
        )}
      </div>
    </div>
  );
};
