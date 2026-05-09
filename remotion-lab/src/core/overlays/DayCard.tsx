/**
 * DayCard — chapter marker that slides in at day-boundary cuts.
 * "DAY 03 · TUE 28 APR" style. Subtle slide-in from left, hold, slide-off.
 * Vlog-mode replacement for the BoldHeadline approach (which user found
 * "seltsam"). Small, clean, sans-serif. Doesn't compete with the clip.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS_3 = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const DayCard: React.FC<{
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** 1-indexed day number */
  dayNumber: number;
  liveFrames: number;
  accent?: string;
}> = ({ date, dayNumber, liveFrames, accent = '#ff8a4f' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < 0 || frame >= liveFrames) return null;

  const d = new Date(date + 'T12:00:00Z');
  const weekday = WEEKDAYS[d.getUTCDay()];
  const day = d.getUTCDate();
  const month = MONTHS_3[d.getUTCMonth()];

  const t = frame / liveFrames;
  // Slide in from left (0-15% of life), hold (15-75%), slide off left (75-100%)
  const slideIn = interpolate(t, [0, 0.15], [-100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0, 0.2, 1),
  });
  const slideOut = interpolate(t, [0.78, 1], [0, -120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.6, 0, 0.8, 0.4),
  });
  const x = t < 0.78 ? slideIn : slideOut;

  const opacity = interpolate(t, [0, 0.1, 0.78, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 30,
          top: '12%',
          transform: `translateX(${x}%)`,
          opacity,
          color: '#f4ede2',
          fontFamily: '"SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
          padding: '10px 18px',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          borderLeft: `3px solid ${accent}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
          borderRadius: 2,
        }}
      >
        <div
          style={{
            fontSize: 14,
            letterSpacing: '0.18em',
            fontWeight: 700,
            color: accent,
            marginBottom: 4,
          }}
        >
          DAY {String(dayNumber).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1 }}>
          {weekday} · {day} {month}
        </div>
      </div>
    </AbsoluteFill>
  );
};
