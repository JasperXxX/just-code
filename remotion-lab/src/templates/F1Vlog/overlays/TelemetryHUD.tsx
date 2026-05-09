import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { fontFamily as jetBrainsMono, loadFont as loadJetBrains } from '@remotion/google-fonts/JetBrainsMono';
import { fontFamily as barlowCondensed, loadFont as loadBarlow } from '@remotion/google-fonts/BarlowCondensed';

loadJetBrains('normal', { weights: ['400', '700'] });
loadBarlow('normal', { weights: ['400', '600'] });

export const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  ferrari: { primary: '#DC0000', secondary: '#FFF200' },
  mercedes: { primary: '#00D2BE', secondary: '#C8C8C8' },
  redbull: { primary: '#1E41FF', secondary: '#FFC906' },
  mclaren: { primary: '#FF8000', secondary: '#47C7FC' },
  astonmartin: { primary: '#229971', secondary: '#C7E6FF' },
  default: { primary: '#FF1E1E', secondary: '#FFFFFF' },
};

export const FONTS_F1 = {
  mono: jetBrainsMono,
  display: barlowCondensed,
} as const;

export type TelemetryHUDProps = {
  speed: number;
  gear: number;
  rpm: number;
  redline?: number;
  team?: string;
  opacity?: number;
};

const clampOpts = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  speed,
  gear,
  rpm,
  redline = 11000,
  team,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const palette = TEAM_COLORS[team ?? 'default'] ?? TEAM_COLORS.default;

  // 8f fade-in, 12f fade-out at end of cue gated through `opacity` prop
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clampOpts);
  const master = fadeIn * opacity * 0.8;

  // Counter-up over ~10f from 0 to target — feels mechanical, not laggy
  const counterT = interpolate(frame, [0, 10], [0, 1], clampOpts);
  const animSpeed = Math.round(speed * counterT);
  const animRpm = rpm * counterT;

  const rpmPct = Math.min(1, Math.max(0, animRpm / 15000));
  const redlinePct = Math.min(1, Math.max(0, redline / 15000));

  const speedStr = String(Math.max(0, Math.min(999, animSpeed))).padStart(3, '0');
  const gearStr = gear < 0 ? 'R' : gear === 0 ? 'N' : String(gear);

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: master, pointerEvents: 'none' }}>
      {/* Top-left team color stripe — driver/team identification */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 60,
          width: 220,
          height: 3,
          background: palette.primary,
          boxShadow: `0 0 12px ${palette.primary}80`,
        }}
      />

      {/* Bottom-left SPEED block */}
      <div style={{ position: 'absolute', left: 60, bottom: 60, color: '#fff' }}>
        <div
          style={{
            fontFamily: FONTS_F1.mono,
            fontWeight: 700,
            fontSize: 96,
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 2px 12px rgba(0,0,0,0.85)',
            WebkitTextStroke: '1px rgba(0,0,0,0.6)',
          }}
        >
          {speedStr}
        </div>
        <div
          style={{
            fontFamily: FONTS_F1.display,
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: 6,
            opacity: 0.85,
            marginTop: 4,
          }}
        >
          KM/H
        </div>
      </div>

      {/* Bottom-mid GEAR with 8-dot ring */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 60,
          transform: 'translateX(-50%)',
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Partial ring of 8 dots — 270° arc starting from -135° */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angleDeg = -135 + (i / 7) * 270;
          const rad = (angleDeg * Math.PI) / 180;
          const r = 80;
          const x = Math.cos(rad) * r;
          const y = Math.sin(rad) * r;
          const lit = gear >= i + 1;
          // Top gears glow more intensely so the eye reads acceleration
          const dotColor = lit ? (i >= 6 ? palette.secondary : palette.primary) : 'rgba(255,255,255,0.18)';
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                width: 10,
                height: 10,
                marginLeft: -5,
                marginTop: -5,
                borderRadius: 5,
                background: dotColor,
                boxShadow: lit ? `0 0 10px ${dotColor}` : 'none',
              }}
            />
          );
        })}
        <div
          style={{
            fontFamily: FONTS_F1.mono,
            fontWeight: 700,
            fontSize: 110,
            color: '#fff',
            lineHeight: 1,
            textShadow: '0 2px 12px rgba(0,0,0,0.85)',
            WebkitTextStroke: '1px rgba(0,0,0,0.6)',
          }}
        >
          {gearStr}
        </div>
      </div>

      {/* Bottom-right RPM bar 0-15000 with redline shading */}
      <div style={{ position: 'absolute', right: 60, bottom: 60, width: 380, color: '#fff' }}>
        <div
          style={{
            fontFamily: FONTS_F1.display,
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: 6,
            opacity: 0.85,
            marginBottom: 8,
            textAlign: 'right',
          }}
        >
          RPM
        </div>
        <div
          style={{
            position: 'relative',
            height: 18,
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Redline zone shading — visual warning region */}
          <div
            style={{
              position: 'absolute',
              left: `${redlinePct * 100}%`,
              top: 0,
              bottom: 0,
              right: 0,
              background: 'rgba(220,0,0,0.35)',
            }}
          />
          {/* Animated fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${rpmPct * 100}%`,
              background:
                rpmPct > redlinePct
                  ? `linear-gradient(90deg, ${palette.primary}, #ff3030)`
                  : `linear-gradient(90deg, ${palette.primary}, ${palette.secondary})`,
              boxShadow: rpmPct > redlinePct ? '0 0 14px #ff3030' : 'none',
            }}
          />
        </div>
        <div
          style={{
            fontFamily: FONTS_F1.mono,
            fontWeight: 700,
            fontSize: 22,
            marginTop: 6,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 2px 8px rgba(0,0,0,0.85)',
          }}
        >
          {Math.round(animRpm).toLocaleString('en-US')}
        </div>
      </div>
    </div>
  );
};
