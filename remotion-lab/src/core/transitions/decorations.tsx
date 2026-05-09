/**
 * Transition decorations — overlay components rendered at cut boundaries.
 *
 * Unlike <TransitionSeries> (which displaces clip durations), these are pure
 * decorative overlays placed in their own <Sequence>. They start a few frames
 * BEFORE the cut and end a few frames AFTER, so the clip schedule itself is
 * untouched and every cut still lands ON its beat.
 *
 * Each decoration component receives `frame` (relative to its own Sequence)
 * and a `durationFrames` total. The cut moment is at `durationFrames / 2`.
 */

import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Video as RemotionVideo,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type TransitionKind =
  | 'none'
  | 'whipPan'
  | 'zoomPunch'
  | 'glitchSlice'
  | 'flashCut'
  | 'lightBloom'
  | 'cutoutSlide'
  | 'cutoutReveal';

const TRANS_FRAMES = 6; // 0.25s @ 24fps

// -----------------------------------------------------------------------------
// Decoration components
// -----------------------------------------------------------------------------

/** Direction-of-travel motion-blur smear that peaks at the cut. */
const WhipPan: React.FC<{ direction?: 'left' | 'right' | 'up' | 'down' }> = ({
  direction = 'left',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const intensity = Math.sin(t * Math.PI);

  const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const offset = intensity * 60 * sign;
  const blurPx = intensity * 36;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{
          background:
            axis === 'X'
              ? `linear-gradient(${sign < 0 ? 90 : 270}deg, rgba(0,0,0,${intensity * 0.55}) 0%, transparent 60%)`
              : `linear-gradient(${sign < 0 ? 0 : 180}deg, rgba(0,0,0,${intensity * 0.55}) 0%, transparent 60%)`,
          transform: `translate${axis}(${offset}px)`,
          filter: `blur(${blurPx}px)`,
          mixBlendMode: 'multiply',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            axis === 'X'
              ? `linear-gradient(${sign < 0 ? 270 : 90}deg, rgba(255,255,255,${intensity * 0.30}) 0%, transparent 50%)`
              : `linear-gradient(${sign < 0 ? 180 : 0}deg, rgba(255,255,255,${intensity * 0.30}) 0%, transparent 50%)`,
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
};

/** Quick scale punch at the cut moment. Acts as a short blur frame. */
const ZoomPunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const punch = Math.sin(t * Math.PI);
  const blur = punch * 18;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', backdropFilter: `blur(${blur}px)` }} />
  );
};

/** RGB split + sliced clipPath. */
const GlitchSlice: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const intensity = Math.sin(t * Math.PI);
  const slices = Array.from({ length: 4 }).map((_, i) => {
    const top = 25 * i;
    const bottom = 100 - top - 25;
    const ox = (random(`gs-${i}`) - 0.5) * 60 * intensity;
    return { top, bottom, ox, hue: i * 60 };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {slices.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${s.top}%`,
            bottom: `${s.bottom}%`,
            background: `hsla(${s.hue}, 80%, 50%, ${intensity * 0.18})`,
            transform: `translateX(${s.ox}px)`,
            mixBlendMode: 'screen',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${30 + random('gs-y') * 40}%`,
          height: 3 + intensity * 4,
          background: 'rgba(255,255,255,0.7)',
          opacity: intensity,
        }}
      />
    </AbsoluteFill>
  );
};

/** Hard 1-2 frame white flash centred on the cut. */
const FlashCut: React.FC<{ color?: string }> = ({ color = '#ffffff' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mid = durationInFrames / 2;
  const dist = Math.abs(frame - mid);
  const op = Math.max(0, 1 - dist / 2);
  return <AbsoluteFill style={{ backgroundColor: color, opacity: op, pointerEvents: 'none' }} />;
};

/** Overexpose bloom — a glow that ramps and dies. */
const LightBloom: React.FC<{ color?: string }> = ({ color = '#ffd9a8' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const intensity = Math.sin(t * Math.PI);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen', opacity: intensity * 0.55 }}>
      <div
        style={{
          position: 'absolute',
          left: '20%',
          top: '15%',
          width: '60%',
          height: '50%',
          background: `radial-gradient(ellipse, ${color}, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
    </AbsoluteFill>
  );
};

/** v44: NO sliding. Cutout (subject from clip 2) appears IN PLACE at its
 *  original position from clip 2's frame, fades in over clip 1, holds
 *  spanning the cut, then fades out as clip 2 reveals around it. Matches
 *  user's actual mental model: "the car appears alone, then the rest of
 *  the clip plays around it" — no horizontal motion, just a position-
 *  locked reveal/dissolve.
 *
 *  Sequence phases (20 frames total, cut at frame 14 = t=0.70):
 *    0.00 - 0.20: fade in over clip 1 (subject "arrives" in place)
 *    0.20 - 0.70: HELD at full opacity on clip 1 — subject stands there,
 *                 clip 1 plays behind
 *    0.70 (CUT):  clip 1 → clip 2, subject at same position
 *    0.70 - 0.85: brief held tail on clip 2 (subject already in clip 2)
 *    0.85 - 1.00: fade out as clip 2 fully reveals
 *
 *  No translateX. No tilt. Position is fixed at the cutout's source-frame
 *  centroid (estimated from PNG aspect for now; bbox metadata to follow).
 */
const CutoutSlide: React.FC<{ cutoutFile: string; direction?: 'left' | 'right' }> = ({
  cutoutFile,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, height, width } = useVideoConfig();
  const t = frame / durationInFrames;
  // Position-locked. No sliding. Just opacity envelope.
  const op = interpolate(t, [0, 0.20, 0.70, 0.85, 1.0], [0, 1, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          height: height * 0.85,
          opacity: op,
          filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.6))',
        }}
      >
        <Img src={staticFile(cutoutFile)} style={{ height: '100%', width: 'auto', display: 'block' }} />
      </div>
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------------------------
// Public API: pick a decoration by kind
// -----------------------------------------------------------------------------

/** v44: CutoutReveal — alpha-channel webm of subject from clip B plays
 *  ON TOP of clip A for ~1s, subject visible/moving while clip A still
 *  plays behind. Then clip B reveals at the cut, subject overlay fades
 *  out as clip B fully takes over. Uses <Video> (preserves alpha)
 *  not OffthreadVideo. */
const CutoutReveal: React.FC<{ subjectWebm: string }> = ({ subjectWebm }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Sequence is 42 frames total: 30 pre-cut, 12 post-cut.
  // Phase t in [0..1] of sequence:
  //   0.00 - 0.10: fade in over clip A
  //   0.10 - 0.71: subject moving on top of clip A (clip A still visible)
  //   0.71 (CUT)   clip B reveals — subject still on top briefly
  //   0.71 - 1.00: fade out as clip B fully takes over
  const t = frame / durationInFrames;
  const op = interpolate(t, [0, 0.10, 0.71, 1.0], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ opacity: op, pointerEvents: 'none' }}>
      <RemotionVideo
        src={staticFile(subjectWebm)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
};

export const TransitionDecoration: React.FC<{
  kind: TransitionKind;
  direction?: 'left' | 'right' | 'up' | 'down';
  cutoutFile?: string;
  subjectWebm?: string;
}> = ({ kind, direction, cutoutFile, subjectWebm }) => {
  switch (kind) {
    case 'whipPan':
      return <WhipPan direction={direction} />;
    case 'zoomPunch':
      return <ZoomPunch />;
    case 'glitchSlice':
      return <GlitchSlice />;
    case 'flashCut':
      return <FlashCut />;
    case 'lightBloom':
      return <LightBloom />;
    case 'cutoutSlide':
      return cutoutFile ? (
        <CutoutSlide cutoutFile={cutoutFile} direction={direction === 'left' ? 'left' : 'right'} />
      ) : null;
    case 'cutoutReveal':
      return subjectWebm ? <CutoutReveal subjectWebm={subjectWebm} /> : null;
    case 'none':
    default:
      return null;
  }
};

// -----------------------------------------------------------------------------
// SFX pools — multiple options per kind so we can rotate (avoid repetition)
// -----------------------------------------------------------------------------

export const TRANSITION_SFX_POOL: Record<TransitionKind, string[]> = {
  whipPan: [
    'sfx/whoosh_fast.wav',
    'sfx/whoosh_heavy_01.mp3',
    'sfx/whoosh_heavy_02.mp3',
    'sfx/whoosh_dark_02.mp3',
    'sfx/whoosh_trans_01.mp3',
    'sfx/whoosh_trans_02.mp3',
    'sfx/whoosh_dark.wav',
  ],
  zoomPunch: [
    'sfx/impact.mp3',
    'sfx/impact_07.mp3',
    'sfx/impact_12.mp3',
    'sfx/impact_15.mp3',
  ],
  glitchSlice: [
    'sfx/glitch.mp3',
    'sfx/glitch_digital.mp3',
    'sfx/glitch_distorted.mp3',
    'sfx/glitch_short.mp3',
  ],
  flashCut: [
    'sfx/camera_flash.mp3',
    'sfx/shutter_camera.mp3',
  ],
  lightBloom: [
    'sfx/whoosh_cinematic.wav',
    'sfx/whoosh_cinematic_02.mp3',
    'sfx/transition_03.mp3',
    'sfx/transition_07.mp3',
    'sfx/transition_11.mp3',
  ],
  cutoutSlide: [
    'sfx/whoosh_dark_02.mp3',
    'sfx/whoosh_heavy_01.mp3',
    'sfx/transition_07.mp3',
  ],
  cutoutReveal: [
    // Subtle whoosh as the subject "appears" — soft, not punchy
    'sfx/whoosh_cinematic.wav',
    'sfx/whoosh_cinematic_02.mp3',
  ],
  none: [],
};

/** Backwards-compat single-pick. */
export const TRANSITION_SFX: Record<TransitionKind, string | null> = Object.fromEntries(
  Object.entries(TRANSITION_SFX_POOL).map(([k, v]) => [k, v[0] ?? null])
) as Record<TransitionKind, string | null>;

export function pickTransitionSfx(kind: TransitionKind, idx: number, seed = ''): string | null {
  const pool = TRANSITION_SFX_POOL[kind];
  if (!pool || pool.length === 0) return null;
  let h = 2166136261 >>> 0;
  const s = seed + ':' + idx + ':' + kind;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return pool[(h >>> 0) % pool.length];
}

export const TRANSITION_DECORATION_FRAMES = TRANS_FRAMES;
