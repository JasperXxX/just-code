/**
 * AudioPulseBars — small audio waveform indicator in the corner. Pulses
 * with the beat. Bottom-right placement so it doesn't compete with the clip.
 * Rendered during drop act as a subtle "music is playing" cue.
 */
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from 'remotion';

export const AudioPulseBars: React.FC<{
  /** Beat times in seconds (in edit time). Bars pulse on these. */
  beatsS: number[];
  windowStartS: number;
  windowEndS: number;
  barCount?: number;
  accent?: string;
}> = ({ beatsS, windowStartS, windowEndS, barCount = 14, accent = '#f4ede2' }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  if (t < windowStartS || t > windowEndS) return null;

  // Closeness to the nearest beat (0..1, peaks at exact beat)
  let energyPulse = 0;
  for (const b of beatsS) {
    if (b < windowStartS - 0.3 || b > windowEndS + 0.3) continue;
    const dt = Math.abs(t - b);
    if (dt > 0.30) continue;
    const env = Math.max(0, 1 - dt / 0.30);
    energyPulse = Math.max(energyPulse, env);
  }

  // Bar dimensions
  const barWidth = 4;
  const barGap = 3;
  const containerH = Math.round(width * 0.06); // ~64-90px in 1080p territory

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          display: 'flex',
          alignItems: 'flex-end',
          height: containerH,
          gap: barGap,
        }}
      >
        {Array.from({ length: barCount }, (_, i) => {
          // Per-bar idle height + pulse-driven peak
          const idleSeed = random(`pulse-${i}-${Math.floor(frame / 3)}`);
          const idleH = 0.18 + idleSeed * 0.22;
          const peakH = 0.55 + random(`pulse-peak-${i}-${Math.floor(frame / 4)}`) * 0.40;
          const h = idleH + (peakH - idleH) * energyPulse;
          return (
            <div
              key={i}
              style={{
                width: barWidth,
                height: h * containerH,
                background: accent,
                opacity: 0.55 + energyPulse * 0.30,
                borderRadius: 1,
                boxShadow: energyPulse > 0.5 ? `0 0 6px ${accent}` : 'none',
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
