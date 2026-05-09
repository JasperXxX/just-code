/**
 * Returns a 0..1 envelope that spikes on each strong hit and decays.
 * Use it to drive vignette punch, scale pop, color flash, RGB-split intensity,
 * camera shake amount.
 */
export function beatPulse(
  strongHits: number[],
  frame: number,
  fps: number,
  decayS = 0.18
): number {
  const t = frame / fps;
  let v = 0;
  for (const hit of strongHits) {
    const dt = t - hit;
    if (dt < 0) {
      // beats are sorted, future beats can't contribute
      if (-dt > 0.5) break;
      continue;
    }
    if (dt < decayS) {
      const env = 1 - dt / decayS;
      if (env > v) v = env;
    }
  }
  return v;
}

/**
 * Same shape but emphasising sub-decay shape (sharper attack).
 * Use for camera shake / RGB split where the spike feel is paramount.
 */
export function beatPunch(
  strongHits: number[],
  frame: number,
  fps: number,
  decayS = 0.12
): number {
  const t = frame / fps;
  let v = 0;
  for (const hit of strongHits) {
    const dt = t - hit;
    if (dt >= 0 && dt < decayS) {
      const env = Math.pow(1 - dt / decayS, 2.2);
      if (env > v) v = env;
    }
    if (dt < -0.5) break;
  }
  return v;
}

/**
 * Camera shake offset in pixels.
 */
export function cameraShake(frame: number, intensity: number) {
  if (intensity < 0.001) return { x: 0, y: 0 };
  const x = (Math.sin(frame * 1.7) + Math.cos(frame * 2.3) * 0.6) * intensity;
  const y = (Math.cos(frame * 1.9) + Math.sin(frame * 2.7) * 0.5) * intensity;
  return { x, y };
}
