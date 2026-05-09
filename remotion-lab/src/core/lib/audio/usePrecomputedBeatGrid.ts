/**
 * usePrecomputedBeatGrid — load a beat-detector JSON (the format produced by
 * davinci-flow's beat_detector.py and shipped in `public/<track>_beats.json`)
 * and report frame-relative beat info at the current comp frame.
 *
 * The JSON stores beats and onsets in *frames at the detector's own fps*
 * (often 24). We translate everything into *comp frames* using the current
 * `useVideoConfig().fps`, so callers get back values they can compare
 * directly against `useCurrentFrame()`.
 *
 * Returns:
 *   - current:   the beat that is "at" the current frame, if within
 *                ±windowFrames of any beat. Undefined otherwise.
 *   - nearest:   the closest beat regardless of distance.
 *   - nextIn:    frames until the next beat (Infinity if none).
 *   - lastWas:   frames since the previous beat (Infinity if none).
 *
 * Why precomputed > live FFT for beat use-cases: the detector ran a proper
 * onset analysis offline, so its beats are stable across the whole track
 * including quiet sections where live FFT would miss them.
 */

import { useEffect, useMemo, useState } from 'react';
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';

export type BeatGridEntry = {
  /** Comp-frame index of the beat. */
  frame: number;
  /** 0..1 weight. Strong beats (drops/snares) → 1, regular beats → 0.5. */
  intensity: number;
  /** True if this is a "strong hit" — first of bar, drop, or onset. */
  isStrong: boolean;
  /** True if this came from the `onsets` array (transient, not just beat). */
  isOnset: boolean;
};

export type UsePrecomputedBeatGridOptions = {
  /** Distance (in comp frames) within which a beat is considered "current".
   *  Default 3 (0.1s @ 30fps). */
  windowFrames?: number;
};

export type BeatGridResult = {
  current?: BeatGridEntry;
  nearest: BeatGridEntry;
  nextIn: number;
  lastWas: number;
  /** All beats in comp-frame space — handy for visualizers. */
  beats: readonly BeatGridEntry[];
};

type RawBeatJson = {
  fps: number;
  duration_seconds: number;
  tempo_bpm: number;
  beat_drop_frame: number;
  beat_drop_time: number;
  beats: number[];   // detector-frame indices
  onsets: number[];  // detector-frame indices
};

const EMPTY_BEAT: BeatGridEntry = { frame: 0, intensity: 0, isStrong: false, isOnset: false };

// In-memory cache so re-mounts (typical in studio dev) don't re-fetch.
const cache = new Map<string, RawBeatJson>();

function entriesFromRaw(raw: RawBeatJson, compFps: number, dropTimeS: number): BeatGridEntry[] {
  const detectorFps = raw.fps;
  const onsetSet = new Set(raw.onsets);
  // Drop frame in detector-frames → strong-hit anchor. Beats within ±2
  // detector-frames of the drop count as "strong" too.
  const dropDetectorFrame = raw.beat_drop_frame;

  return raw.beats.map((detectorFrame, idx): BeatGridEntry => {
    const tSeconds = detectorFrame / detectorFps;
    const compFrame = Math.round(tSeconds * compFps);
    const isOnset = onsetSet.has(detectorFrame);
    // Strong if: every 4th beat (downbeats), near the drop, or it's an onset.
    const isDownbeat = idx % 4 === 0;
    const nearDrop = Math.abs(detectorFrame - dropDetectorFrame) <= 2;
    const isStrong = isOnset || nearDrop || (isDownbeat && tSeconds >= dropTimeS);
    const intensity = isStrong ? 1 : isDownbeat ? 0.7 : 0.5;
    return { frame: compFrame, intensity, isStrong, isOnset };
  });
}

const EMPTY_RESULT: BeatGridResult = {
  nearest: EMPTY_BEAT,
  nextIn: Infinity,
  lastWas: Infinity,
  beats: [],
};

export function usePrecomputedBeatGrid(
  jsonSrc: string,
  options: UsePrecomputedBeatGridOptions = {}
): BeatGridResult {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const windowFrames = options.windowFrames ?? 3;

  const cached = cache.get(jsonSrc);
  const [raw, setRaw] = useState<RawBeatJson | null>(cached ?? null);

  useEffect(() => {
    if (cached) return;
    const handle = delayRender(`beat-grid:${jsonSrc}`);
    let cancelled = false;
    fetch(jsonSrc)
      .then((r) => r.json())
      .then((data: RawBeatJson) => {
        cache.set(jsonSrc, data);
        if (!cancelled) setRaw(data);
        continueRender(handle);
      })
      .catch((err) => {
        // Surface the error via continueRender's failure channel.
        continueRender(handle);
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error(`[usePrecomputedBeatGrid] failed to load ${jsonSrc}:`, err);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [jsonSrc, cached]);

  const beats: BeatGridEntry[] = useMemo(() => {
    if (!raw) return [];
    return entriesFromRaw(raw, fps, raw.beat_drop_time);
  }, [raw, fps]);

  if (!raw || beats.length === 0) return EMPTY_RESULT;

  // Linear scan is fine for typical track lengths (a few hundred beats).
  let nearest = beats[0];
  let nearestDist = Math.abs(beats[0].frame - frame);
  let lastWas = Infinity;
  let nextIn = Infinity;
  for (const b of beats) {
    const d = Math.abs(b.frame - frame);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = b;
    }
    const delta = b.frame - frame;
    if (delta < 0 && -delta < lastWas) lastWas = -delta;
    if (delta >= 0 && delta < nextIn) nextIn = delta;
  }
  const current = nearestDist <= windowFrames ? nearest : undefined;

  return { current, nearest, nextIn, lastWas, beats };
}
