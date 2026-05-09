/**
 * HelloWorld — proof-of-life composition.
 * Demonstrates: spring physics, interpolate, layered easing, gradient bg, typography.
 *
 * 4 seconds @ 30fps = 120 frames.
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

type Props = {
  title?: string;
  subtitle?: string;
};

export const HelloWorld: React.FC<Props> = ({
  title = 'OPERATION',
  subtitle = 'TOTAL REMOTION',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // --- Background gradient slow rotation ---
  const bgRotate = interpolate(frame, [0, durationInFrames], [0, 30]);

  // --- Title: spring-in then settle ---
  const titleSpring = spring({
    fps,
    frame: frame - 6,
    config: { damping: 12, mass: 0.8 },
  });
  const titleY = interpolate(titleSpring, [0, 1], [80, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleBlur = interpolate(titleSpring, [0, 1], [12, 0]);

  // --- Subtitle: appears after title, slow scale-down ---
  const subSpring = spring({
    fps,
    frame: frame - 22,
    config: { damping: 18, mass: 1.2 },
  });
  const subScale = interpolate(subSpring, [0, 1], [1.15, 1]);
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);
  const subLetterSpace = interpolate(subSpring, [0, 1], [0.4, 0.08]);

  // --- Outro: subtle drift up at the end ---
  const outroDriftStart = durationInFrames - 24;
  const outroDrift = interpolate(
    frame,
    [outroDriftStart, durationInFrames],
    [0, -18],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1) }
  );
  const outroOpacity = interpolate(
    frame,
    [outroDriftStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${bgRotate}deg, #0a0a14 0%, #161628 50%, #0a0a14 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Content */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          opacity: outroOpacity,
          transform: `translateY(${outroDrift}px)`,
        }}
      >
        <div
          style={{
            color: '#a0a0c0',
            fontFamily: 'SF Pro Display, -apple-system, sans-serif',
            fontSize: 28,
            fontWeight: 400,
            letterSpacing: 8,
            transform: `translateY(${titleY * 0.4}px)`,
            opacity: titleOpacity * 0.85,
            filter: `blur(${titleBlur * 0.4}px)`,
            marginBottom: 16,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: '#ffffff',
            fontFamily: 'SF Pro Display, -apple-system, sans-serif',
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: `${subLetterSpace}em`,
            opacity: subOpacity,
            transform: `scale(${subScale})`,
            transformOrigin: 'center center',
          }}
        >
          {subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
