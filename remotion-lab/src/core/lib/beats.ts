// Beat-driven cut schedule generation for the dark-flow / TikTok edit style.
// See REMOTION_CUSTOM_EFFECTS.md §1 for the design and DARK_FLOW_STYLE_BIBLE.md
// for the underlying statistical model.

export type CutDistribution = {
  microBurst: number;   // <0.05s clips, % of cuts
  mainRhythm: number;   // 0.05–0.10s
  breathing: number;    // 0.10–0.20s
  transition: number;   // 0.20–0.40s
  midHold: number;      // 0.40–1.50s
  hero: number;         // >1.50s
};

export const DARK_FLOW_DISTRIBUTION: CutDistribution = {
  microBurst: 0.11,
  mainRhythm: 0.45,
  breathing: 0.31,
  transition: 0.07,
  midHold: 0.05,
  hero: 0.01,
};

export type CutPoint = {
  time: number;             // start in seconds
  durationInFrames: number; // length in frames
  isBurst: boolean;
  isHero: boolean;
};

type BurstScheduleOpts = {
  totalDurationS: number;
  fps: number;
  beats: number[];          // seconds, from beat_detector.py
  strongHits?: number[];    // subset of beats — drops/snares
  targetCutsPerSec?: number;
  distribution?: CutDistribution;
  seed?: string;
};

/**
 * Generates a cut schedule that tries to land on beats while honouring the
 * "stutter-burst" pattern from DARK_FLOW_STYLE_BIBLE.md.
 *
 * Pattern: hero intro → alternating bursts/breathing → hero outro.
 */
export function generateBurstSchedule(opts: BurstScheduleOpts): CutPoint[] {
  const {
    totalDurationS,
    fps,
    beats,
    seed = 'flow',
  } = opts;
  const target = opts.targetCutsPerSec ?? 3.0;

  const out: CutPoint[] = [];
  let t = 0;

  // Hero intro — slow opening hold (~1.5s)
  const introDur = 1.5;
  out.push({
    time: 0,
    durationInFrames: Math.round(introDur * fps),
    isBurst: false,
    isHero: true,
  });
  t = introDur;

  const middleEnd = totalDurationS - 1.8; // reserve for outro hero
  while (t < middleEnd) {
    const burstChance = stableRandom(seed + 'b' + t.toFixed(3));
    const isBurst = burstChance > 0.42;
    if (isBurst) {
      const burstLen = 3 + Math.floor(stableRandom(seed + 'L' + t) * 3); // 3..5
      for (let i = 0; i < burstLen && t < middleEnd; i++) {
        const baseDur = 0.06 + stableRandom(seed + 'd' + t.toFixed(3) + i) * 0.06;
        const snapped = snapToBeat(t + baseDur, beats, 0.06);
        const realDur = Math.max(2 / fps, snapped - t);
        out.push({
          time: t,
          durationInFrames: Math.max(2, Math.round(realDur * fps)),
          isBurst: true,
          isHero: false,
        });
        t = snapped;
      }
    } else {
      const baseDur = 0.4 + stableRandom(seed + 'h' + t.toFixed(3)) * 0.9; // 0.4..1.3s
      const snapped = snapToBeat(t + baseDur, beats, 0.15);
      const realDur = Math.max(8 / fps, snapped - t);
      out.push({
        time: t,
        durationInFrames: Math.round(realDur * fps),
        isBurst: false,
        isHero: false,
      });
      t = snapped;
    }
    if (target && out.length / Math.max(0.001, t) > target * 1.3) {
      // ease pacing if we're going faster than target
      const pause = 0.25;
      t += pause;
    }
  }

  // Hero outro
  const outroDur = totalDurationS - t;
  if (outroDur > 0.3) {
    out.push({
      time: t,
      durationInFrames: Math.max(1, Math.round(outroDur * fps)),
      isBurst: false,
      isHero: true,
    });
  }

  return out;
}

function snapToBeat(time: number, beats: number[], maxDelta: number): number {
  let best = time;
  let bestDelta = maxDelta;
  for (const b of beats) {
    const d = Math.abs(b - time);
    if (d < bestDelta) {
      bestDelta = d;
      best = b;
    }
    if (b > time + maxDelta) break;
  }
  return best;
}

/**
 * Deterministic 32-bit FNV-1a-ish hash → 0..1.
 * Replaces Math.random for render reproducibility.
 */
export function stableRandom(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}
