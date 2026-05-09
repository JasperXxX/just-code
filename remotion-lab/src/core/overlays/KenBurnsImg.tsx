import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

type Props = {
  src: string;
  zoomFrom?: number;
  zoomTo?: number;
  panFromX?: number;   // percent of frame
  panToX?: number;
  panFromY?: number;
  panToY?: number;
  filter?: string;
  /** Override the duration over which the motion plays (defaults to enclosing Sequence). */
  durationInFramesOverride?: number;
  easing?: (n: number) => number;
};

/**
 * Photo with subtle motion (Ken Burns / push-in / pan).
 * Lives inside a <Sequence> — its duration is taken from useVideoConfig().
 */
export const KenBurnsImg: React.FC<Props> = ({
  src,
  zoomFrom = 1.0,
  zoomTo = 1.12,
  panFromX = 0,
  panToX = 0,
  panFromY = 0,
  panToY = 0,
  filter,
  durationInFramesOverride,
  easing,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const len = durationInFramesOverride ?? durationInFrames;
  const ease = easing ?? Easing.bezier(0.16, 1, 0.3, 1);
  const p = ease(Math.min(1, Math.max(0, frame / Math.max(1, len))));

  const scale = interpolate(p, [0, 1], [zoomFrom, zoomTo]);
  const tx = interpolate(p, [0, 1], [panFromX, panToX]);
  const ty = interpolate(p, [0, 1], [panFromY, panToY]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', filter }}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      />
    </AbsoluteFill>
  );
};
