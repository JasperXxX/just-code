/**
 * Shared Ken-Burns motion model.
 *
 * Both the underlying VlogClip (renders the OffthreadVideo with this transform)
 * and the FaceTrackedLabel (compensates for the same transform so it stays
 * glued to the face) use the same `motionForClip` + `computeMotion` so they
 * agree per-frame.
 */

export type Act = 'calm' | 'build' | 'drop';

export type MotionKind =
  | 'zoomIn'
  | 'zoomOut'
  | 'panLeftIn'
  | 'panRightIn'
  | 'panUpIn'
  | 'panDownIn'
  | 'orbit';

export type Motion = {
  scale: number;
  translateX: number;
  translateY: number;
  rotate: number;
};

/** Hash a string to a [0..1) bucket; used for deterministic per-cut variation. */
export function hashUnit(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Pick a Ken-Burns motion deterministically from src + act. */
export function motionForClip(src: string, act: Act): MotionKind {
  const u = hashUnit(src + ':' + act);
  if (act === 'drop') {
    return u < 0.55 ? 'zoomIn' : u < 0.90 ? 'zoomOut' : 'orbit';
  }
  if (u < 0.20) return 'zoomIn';
  if (u < 0.40) return 'zoomOut';
  if (u < 0.55) return 'panLeftIn';
  if (u < 0.70) return 'panRightIn';
  if (u < 0.82) return 'panUpIn';
  if (u < 0.94) return 'panDownIn';
  return 'orbit';
}

/** Compute the transform at normalized progress `t` (0..1) within a clip. */
export function computeMotion(kind: MotionKind, t: number, act: Act): Motion {
  const range = act === 'drop' ? 0.6 : act === 'build' ? 0.8 : 1.0;

  switch (kind) {
    case 'zoomIn':
      return { scale: 1.00 + 0.06 * range * t, translateX: 0, translateY: 0, rotate: 0 };
    case 'zoomOut':
      return { scale: 1.06 + -0.06 * range * t, translateX: 0, translateY: 0, rotate: 0 };
    case 'panLeftIn':
      return {
        scale: 1.05,
        translateX: 2.5 * range * (1 - t),
        translateY: 0,
        rotate: 0,
      };
    case 'panRightIn':
      return {
        scale: 1.05,
        translateX: -2.5 * range * (1 - t),
        translateY: 0,
        rotate: 0,
      };
    case 'panUpIn':
      return {
        scale: 1.05,
        translateX: 0,
        translateY: 2.0 * range * (1 - t),
        rotate: 0,
      };
    case 'panDownIn':
      return {
        scale: 1.05,
        translateX: 0,
        translateY: -2.0 * range * (1 - t),
        rotate: 0,
      };
    case 'orbit':
      return {
        scale: 1.02 + 0.04 * range * t,
        translateX: 1.0 * range * Math.sin(t * Math.PI),
        translateY: 0.5 * range * Math.cos(t * Math.PI),
        rotate: 0.3 * range * (t - 0.5),
      };
  }
}
