/**
 * FaceTrackedLabel — animated label that follows a detected face through camera
 * motion in the source clip.
 *
 * v14: per-frame Ken-Burns compensation. Label receives the underlying clip's
 * motionKind + act + clipDurationFrames and recomputes the same transform the
 * clip uses, so the label stays *exactly* on the face throughout the cut, not
 * just at the midpoint.
 */
import React from 'react';
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Act, MotionKind, computeMotion } from '../lib/motion';

export type FaceSample = { t: number; x: number; y: number; w: number; h: number };
export type FaceTrack = { duration: number; n_samples: number; samples: FaceSample[] };

/** Linearly interpolate a face sample at the given source-clip time. */
export function sampleFaceAt(track: FaceTrack | undefined, sourceTime: number): FaceSample | null {
  if (!track || !track.samples || track.samples.length === 0) return null;
  const samples = track.samples;
  if (sourceTime <= samples[0].t) return samples[0];
  if (sourceTime >= samples[samples.length - 1].t) return samples[samples.length - 1];
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    if (sourceTime >= a.t && sourceTime <= b.t) {
      const t = (sourceTime - a.t) / Math.max(0.0001, b.t - a.t);
      return {
        t: sourceTime,
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        w: a.w + (b.w - a.w) * t,
        h: a.h + (b.h - a.h) * t,
      };
    }
  }
  return samples[samples.length - 1];
}

type Props = {
  track: FaceTrack | undefined;
  text: string;
  sourceStartS: number;
  /** Match the underlying clip's Ken-Burns motion (so label tracks face). */
  motionKind: MotionKind;
  act: Act;
  /** Total length of the underlying clip in frames; used to compute Ken-Burns t. */
  clipDurationFrames: number;
  accent?: string;
  /** Offset above the face as fraction of face height. Default 25%. */
  aboveBy?: number;
};

export const FaceTrackedLabel: React.FC<Props> = ({
  track,
  text,
  sourceStartS,
  motionKind,
  act,
  clipDurationFrames,
  accent = '#ff8a4f',
  aboveBy = 0.25,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const tInClip = frame / fps;
  const sourceT = sourceStartS + tInClip;

  const face = sampleFaceAt(track, sourceT);
  if (!face) return null;

  // Per-frame Ken-Burns compensation: same easing the clip uses
  const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
  const tNorm = ease(Math.min(1, Math.max(0, frame / Math.max(1, clipDurationFrames))));
  const m = computeMotion(motionKind, tNorm, act);

  // Face center (above the head) in source-frame coords
  const cxSrc = face.x + face.w / 2;
  const cySrc = face.y - aboveBy * face.h;

  // Apply the same transform the clip uses (transform-origin: center)
  const dx = cxSrc - 0.5;
  const dy = cySrc - 0.5;
  const cxScreen = 0.5 + dx * m.scale + m.translateX / 100;
  const cyScreen = 0.5 + dy * m.scale + m.translateY / 100;

  // Spring in, fade out at clip end
  const sIn = spring({ fps, frame, config: { damping: 18, mass: 1.0 } });
  const inOp = interpolate(sIn, [0, 1], [0, 1]);
  const inY = interpolate(sIn, [0, 1], [16, 0]);
  const outOp = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = inOp * outOp;

  // Clamp so labels never slip past the active area
  const left = Math.max(0.05, Math.min(0.95, cxScreen));
  const top = Math.max(0.06, Math.min(0.85, cyScreen));

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left * 100}%`,
        top: `${top * 100}%`,
        transform: `translate(-50%, calc(-100% - ${inY}px))`,
        color: '#fff',
        fontFamily: 'SF Pro Display, -apple-system, sans-serif',
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 5,
        opacity,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        textShadow: '0 2px 16px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.6)',
        textAlign: 'center',
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: accent,
          margin: '0 auto 8px',
          boxShadow: `0 0 10px ${accent}`,
        }}
      />
      {text}
    </div>
  );
};
