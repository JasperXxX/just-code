/**
 * Template — SubtitleBurner
 * Renders styled subtitles synchronised to a transcript.
 *
 * Input format (works without an SRT file):
 *   lines: [{ text, startS, endS }]
 *
 * Auto-loads no audio — drop on top of any composition or use over a black backdrop.
 */
import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';

export const subtitleBurnerSchema = z.object({
  lines: z.array(z.object({ text: z.string(), startS: z.number(), endS: z.number() })),
  position: z.enum(['bottom', 'center', 'top']).default('bottom'),
  style: z.enum(['classic', 'kinetic', 'tiktok-bold']).default('tiktok-bold'),
  accent: z.string().default('#fff200'),
});

export type SubtitleBurnerProps = z.infer<typeof subtitleBurnerSchema>;

export const subtitleBurnerDefaults: SubtitleBurnerProps = {
  position: 'bottom',
  style: 'tiktok-bold',
  accent: '#fff200',
  lines: [
    { text: 'Programmatic video', startS: 0.0, endS: 1.6 },
    { text: 'is deterministic', startS: 1.6, endS: 3.2 },
    { text: 'by design', startS: 3.2, endS: 4.5 },
    { text: 'You describe it once', startS: 4.5, endS: 6.0 },
    { text: 'render it a thousand times', startS: 6.0, endS: 7.8 },
    { text: 'with different data', startS: 7.8, endS: 9.5 },
    { text: 'no editor required', startS: 9.5, endS: 11.0 },
  ],
};

export const SubtitleBurner: React.FC<SubtitleBurnerProps> = ({
  lines,
  position = 'bottom',
  style = 'tiktok-bold',
  accent = '#fff200',
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;

  // Find current line
  const active = lines.find((l) => t >= l.startS && t < l.endS);
  if (!active) return <AbsoluteFill style={{ background: '#000' }} />;

  // Local timeline within the active line
  const localT = (t - active.startS) / Math.max(0.001, active.endS - active.startS);
  const localFrames = Math.round((t - active.startS) * fps);
  const sIn = spring({ fps, frame: localFrames, config: { damping: 14, mass: 0.7 } });

  const positionStyle: React.CSSProperties =
    position === 'top'
      ? { top: 80 }
      : position === 'center'
      ? { top: '50%', transform: 'translateY(-50%)' }
      : { bottom: 100 };

  let content;

  if (style === 'classic') {
    // White text on translucent black bar
    content = (
      <div
        style={{
          background: 'rgba(0,0,0,0.7)',
          padding: '14px 36px',
          color: '#fff',
          fontFamily: FONTS.display,
          fontSize: 48,
          fontWeight: 600,
          textAlign: 'center',
          letterSpacing: '-0.01em',
          maxWidth: 1400,
          opacity: interpolate(sIn, [0, 1], [0, 1]),
        }}
      >
        {active.text}
      </div>
    );
  } else if (style === 'kinetic') {
    // Each word springs in
    const words = active.text.split(' ');
    content = (
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 1500 }}>
        {words.map((w, i) => {
          const wSpring = spring({ fps, frame: localFrames - i * 2, config: { damping: 11 } });
          const y = interpolate(wSpring, [0, 1], [40, 0]);
          const op = interpolate(wSpring, [0, 1], [0, 1]);
          return (
            <span
              key={i}
              style={{
                color: '#fff',
                fontFamily: FONTS.display,
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                transform: `translateY(${y}px)`,
                opacity: op,
                textShadow: '0 4px 20px rgba(0,0,0,0.7)',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    );
  } else {
    // tiktok-bold: chunky stroked + colored
    content = (
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 86,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          textAlign: 'center',
          color: '#fff',
          background: COLORS.ink,
          padding: '12px 36px',
          borderRadius: 12,
          border: `4px solid ${accent}`,
          boxShadow: `0 8px 40px rgba(0,0,0,0.6)`,
          textShadow: `0 0 18px ${accent}66`,
          transform: `scale(${interpolate(sIn, [0, 1], [0.85, 1])})`,
          opacity: interpolate(sIn, [0, 1], [0, 1]),
          maxWidth: 1400,
        }}
      >
        {active.text}
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ background: '#000', alignItems: 'center', ...positionStyle, justifyContent: 'flex-start' }}>
      <div style={{ position: 'absolute', ...positionStyle, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        {content}
      </div>
    </AbsoluteFill>
  );
};
