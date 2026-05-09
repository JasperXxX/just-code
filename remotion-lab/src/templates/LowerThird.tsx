/**
 * Template — LowerThird
 * Animated reveal with brand stripe. 4-second loop.
 */
import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';

export const lowerThirdSchema = z.object({
  name: z.string(),
  role: z.string(),
  accentColor: z.string().default(COLORS.accentRed),
  align: z.enum(['left', 'right']).default('left'),
});

export type LowerThirdProps = z.infer<typeof lowerThirdSchema>;

export const lowerThirdDefaults: LowerThirdProps = {
  name: 'JESSE PINKMAN',
  role: 'CO-FOUNDER · YOLO LABS',
  accentColor: COLORS.accentRed,
  align: 'left',
};

export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  role,
  accentColor = COLORS.accentRed,
  align = 'left',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  // Reveal stripe in from align side
  const stripe = spring({ fps, frame, config: { damping: 22, mass: 1.1 } });
  const stripeWidth = interpolate(stripe, [0, 1], [0, 1]);

  // Text follows stripe
  const textIn = spring({ fps, frame: frame - 8, config: { damping: 18 } });
  const textY = interpolate(textIn, [0, 1], [40, 0]);
  const textOp = interpolate(textIn, [0, 1], [0, 1]);

  // Outro
  const outroStart = durationInFrames - 18;
  const outOp = interpolate(frame, [outroStart, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const left = align === 'left';

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <div
        style={{
          position: 'absolute',
          [left ? 'left' : 'right']: 80,
          bottom: 100,
          display: 'flex',
          alignItems: 'stretch',
          opacity: outOp,
          flexDirection: left ? 'row' : 'row-reverse',
        }}
      >
        {/* Accent stripe */}
        <div
          style={{
            width: 12,
            background: accentColor,
            transform: `scaleY(${stripeWidth})`,
            transformOrigin: 'bottom center',
            boxShadow: `0 0 30px ${accentColor}80`,
          }}
        />
        {/* Text block */}
        <div
          style={{
            background: 'rgba(10,10,20,0.92)',
            backdropFilter: 'blur(8px)',
            padding: '28px 44px',
            transform: `translateY(${textY}px)`,
            opacity: textOp,
          }}
        >
          <div
            style={{
              color: COLORS.white,
              fontFamily: FONTS.display,
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {name}
          </div>
          <div
            style={{
              color: accentColor,
              fontFamily: FONTS.display,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 4,
              marginTop: 12,
            }}
          >
            {role}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
