/**
 * FaceSpotlight — subtle ring around the detected face on the first ~6 frames
 * of a clip. A "we see you" cue that pairs with `FaceTrackedLabel`. Fades out
 * before the label fully settles so it doesn't compete.
 */
import React from 'react';
import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Act, MotionKind, computeMotion } from '../lib/motion';
import { FaceTrack, sampleFaceAt } from './FaceTrackedLabel';

type Props = {
  track: FaceTrack | undefined;
  sourceStartS: number;
  motionKind: MotionKind;
  act: Act;
  clipDurationFrames: number;
  /** When the spotlight is fully out (frames). Default 8. */
  liveFrames?: number;
  accent?: string;
};

export const FaceSpotlight: React.FC<Props> = ({
  track,
  sourceStartS,
  motionKind,
  act,
  clipDurationFrames,
  liveFrames = 8,
  accent = '#ff8a4f',
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  // Only active for the first liveFrames frames
  if (frame >= liveFrames) return null;

  const tInClip = frame / fps;
  const sourceT = sourceStartS + tInClip;
  const face = sampleFaceAt(track, sourceT);
  if (!face) return null;

  // Same Ken Burns transform the clip is using
  const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
  const tNorm = ease(Math.min(1, Math.max(0, frame / Math.max(1, clipDurationFrames))));
  const m = computeMotion(motionKind, tNorm, act);

  const cxSrc = face.x + face.w / 2;
  const cySrc = face.y + face.h / 2;
  const dx = cxSrc - 0.5;
  const dy = cySrc - 0.5;
  const cxScreen = 0.5 + dx * m.scale + m.translateX / 100;
  const cyScreen = 0.5 + dy * m.scale + m.translateY / 100;

  // Ring grows + fades over liveFrames
  const t = frame / liveFrames;
  const radiusFactor = interpolate(t, [0, 1], [1.0, 1.45]);
  const opacity = interpolate(t, [0, 0.25, 1], [0, 0.55, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Size: roughly the face bounding height in screen-space
  const ringHeight = face.h * m.scale * height * radiusFactor;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${cxScreen * 100}%`,
        top: `${cyScreen * 100}%`,
        width: ringHeight * 1.1,
        height: ringHeight,
        marginLeft: -ringHeight * 0.55,
        marginTop: -ringHeight * 0.5,
        borderRadius: '50%',
        border: `2px solid ${accent}`,
        boxShadow: `0 0 18px ${accent}, inset 0 0 12px ${accent}33`,
        opacity,
        pointerEvents: 'none',
        willChange: 'opacity, transform',
      }}
    />
  );
};
