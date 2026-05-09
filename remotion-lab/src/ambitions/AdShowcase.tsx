/**
 * P4 — AdShowcase: Stripe/Linear-style polished 30s ad recreation.
 * Demonstrates broadcast-quality typography, color-grade shifts, and pacing.
 *
 * Sections (900 frames @ 30fps = 30s):
 *   0..120   intro hook        ("a video framework")
 *   120..360 product chips     (4 features sliding in)
 *   360..570 photo carousel    (Ken-Burnsed b-roll, 7s)
 *   570..720 stat punch        (counter to 1.2M)
 *   720..900 outro CTA          ("BUILD WITH CODE")
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS, FONTS } from '../templates/common';

// 0..120  Intro
const IntroHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ fps, frame: frame - 6, config: { damping: 16 } });
  const titleY = interpolate(sIn, [0, 1], [40, 0]);
  const titleOp = interpolate(sIn, [0, 1], [0, 1]);
  const subSpring = spring({ fps, frame: frame - 28, config: { damping: 20 } });
  const subOp = interpolate(subSpring, [0, 1], [0, 1]);

  // Word-by-word reveal of the second line
  const phrase = 'A FRAMEWORK FOR PROGRAMMATIC VIDEO';
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 30%, #1a1828 0%, #0a0a14 80%)`,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <div style={{ color: '#5e9eff', fontFamily: FONTS.mono, fontSize: 18, letterSpacing: 8, marginBottom: 30, opacity: titleOp, fontWeight: 600 }}>
        ◆ REMOTION LAB
      </div>
      <div
        style={{
          color: COLORS.white,
          fontFamily: FONTS.display,
          fontSize: 96,
          fontWeight: 200,
          letterSpacing: '-0.02em',
          transform: `translateY(${titleY * 0.4}px)`,
          opacity: titleOp,
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        the future of video
      </div>
      <div
        style={{
          color: '#fff',
          fontFamily: FONTS.display,
          fontSize: 42,
          fontWeight: 700,
          letterSpacing: 4,
          opacity: subOp,
          maxWidth: 1500,
          textAlign: 'center',
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {phrase.split(' ').map((w, i) => {
          const wFrame = frame - 30 - i * 3;
          const op = interpolate(wFrame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const y = interpolate(wFrame, [0, 8], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <span key={i} style={{ display: 'inline-block', transform: `translateY(${y}px)`, opacity: op }}>
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 120..360  Product chips
const FEATURES = [
  { line1: 'CODE IS THE TIMELINE', line2: 'every frame is a function', accent: '#5e9eff' },
  { line1: 'PARAMETRIZE EVERYTHING', line2: 'one comp, infinite outputs', accent: '#22d3ee' },
  { line1: 'PARALLEL BY DEFAULT', line2: 'lambda, cloudrun, your laptop', accent: '#a78bfa' },
  { line1: 'DETERMINISTIC RENDERS', line2: 'reproducible to the pixel', accent: '#fbbf24' },
];

const FeatureChips: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#0a0a14', padding: 100, justifyContent: 'center' }}>
      <div style={{ color: '#5a5a8a', fontFamily: FONTS.mono, fontSize: 18, letterSpacing: 8, marginBottom: 50, fontWeight: 600 }}>
        ◆ THE BREAKDOWN
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {FEATURES.map((f, i) => {
          const sIn = spring({ fps, frame: frame - 6 - i * 14, config: { damping: 18 } });
          const x = interpolate(sIn, [0, 1], [-120, 0]);
          const op = interpolate(sIn, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 30, transform: `translateX(${x}px)`, opacity: op }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: f.accent,
                  boxShadow: `0 0 20px ${f.accent}`,
                }}
              />
              <div>
                <div style={{ color: '#fff', fontFamily: FONTS.display, fontSize: 80, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {f.line1}
                </div>
                <div style={{ color: f.accent, fontFamily: FONTS.display, fontSize: 24, fontWeight: 600, letterSpacing: 4, marginTop: 8 }}>
                  {f.line2}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 360..570  Photo carousel
const KenBurnsPhoto: React.FC<{ src: string; index: number; durFrames: number }> = ({ src, index, durFrames }) => {
  const frame = useCurrentFrame();
  const t = frame / durFrames;
  const scale = interpolate(t, [0, 1], [1.0, 1.15]);
  const tx = interpolate(t, [0, 1], [(index % 2 === 0 ? -1 : 1) * 4, (index % 2 === 0 ? 1 : -1) * 4]);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateX(${tx}%)`,
        }}
      />
      <AbsoluteFill style={{ background: 'rgba(0,0,0,0.25)' }} />
    </AbsoluteFill>
  );
};

const Carousel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const photos = ['photos/p06.png', 'photos/p07.png', 'photos/p03.png', 'photos/p04.png'];
  const slideFrames = Math.round(2.0 * fps);
  const fade = 8;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {photos.map((p, i) => (
        <Sequence key={i} from={i * slideFrames - (i > 0 ? fade : 0)} durationInFrames={slideFrames + (i < photos.length - 1 ? fade : 0)}>
          <FadeWrap enter={i > 0 ? fade : 0} exit={i < photos.length - 1 ? fade : 0}>
            <KenBurnsPhoto src={p} index={i} durFrames={slideFrames + fade} />
          </FadeWrap>
        </Sequence>
      ))}
      {/* Caption strap */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 100,
          color: '#fff',
          fontFamily: FONTS.display,
          fontSize: 28,
          letterSpacing: 6,
          fontWeight: 600,
          opacity: interpolate(frame, [12, 26], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        ◆ PROCEDURAL PHOTOGRAPHY · LAB 02
      </div>
    </AbsoluteFill>
  );
};

const FadeWrap: React.FC<{ enter: number; exit: number; children: React.ReactNode }> = ({ enter, exit, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enterOp = enter > 0
    ? interpolate(frame, [0, enter], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;
  const exitOp = exit > 0
    ? interpolate(frame, [durationInFrames - exit, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;
  return <AbsoluteFill style={{ opacity: enterOp * exitOp }}>{children}</AbsoluteFill>;
};

// 570..720  Stat
const StatPunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const labelIn = spring({ fps, frame: frame - 4, config: { damping: 18 } });
  const counter = spring({ fps, frame: frame - 14, config: { damping: 22, mass: 2.4, stiffness: 80 } });
  const value = interpolate(counter, [0, 1], [0, 1247800]);
  const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${COLORS.inkSoft} 0%, ${COLORS.ink} 80%)`,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <div style={{ color: '#5e9eff', fontFamily: FONTS.display, fontSize: 22, letterSpacing: 8, marginBottom: 30, opacity: interpolate(labelIn, [0, 1], [0, 1]), fontWeight: 600 }}>
        ◆ PIPELINE GENERATED
      </div>
      <div
        style={{
          color: COLORS.white,
          fontFamily: FONTS.mono,
          fontSize: 280,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          fontVariantNumeric: 'tabular-nums',
          opacity: interpolate(counter, [0, 0.1], [0, 1], { extrapolateRight: 'clamp' }),
          lineHeight: 1,
        }}
      >
        {fmt(value)}
      </div>
      <div style={{ color: COLORS.muted, fontFamily: FONTS.display, fontSize: 26, letterSpacing: 5, marginTop: 36, opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' }) }}>
        FRAMES RENDERED · LAST 24H
      </div>
    </AbsoluteFill>
  );
};

// 720..900  Outro
const OutroCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ fps, frame: frame - 4, config: { damping: 14 } });

  // Slow ring rotation
  const rot = interpolate(frame, [0, 180], [0, 90]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse, #1a0e2a 0%, #0a0a14 80%)`,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      {/* Decorative rings */}
      <div style={{ position: 'absolute', width: 1000, height: 1000, border: '1px solid #5e9eff44', borderRadius: '50%', transform: `rotate(${rot}deg)` }} />
      <div style={{ position: 'absolute', width: 1400, height: 1400, border: '1px solid #5e9eff22', borderRadius: '50%', transform: `rotate(${-rot * 0.5}deg)` }} />
      <div style={{ position: 'absolute', width: 1800, height: 1800, border: '1px solid #5e9eff15', borderRadius: '50%', transform: `rotate(${rot * 0.3}deg)` }} />

      <div
        style={{
          color: COLORS.white,
          fontFamily: FONTS.display,
          fontSize: 180,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          transform: `scale(${interpolate(sIn, [0, 1], [0.9, 1])})`,
          opacity: interpolate(sIn, [0, 1], [0, 1]),
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        BUILD WITH<br />CODE
      </div>

      <div
        style={{
          marginTop: 50,
          padding: '18px 50px',
          border: '2px solid #5e9eff',
          borderRadius: 100,
          color: '#5e9eff',
          fontFamily: FONTS.display,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 6,
          opacity: interpolate(frame, [22, 38], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        REMOTION.DEV
      </div>

      <div
        style={{
          marginTop: 36,
          color: COLORS.mutedDeep,
          fontFamily: FONTS.mono,
          fontSize: 18,
          letterSpacing: 4,
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        OPERATION TOTAL REMOTION · 2026
      </div>
    </AbsoluteFill>
  );
};

export const AdShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence from={0} durationInFrames={120}>
        <IntroHook />
      </Sequence>
      <Sequence from={120} durationInFrames={240}>
        <FeatureChips />
      </Sequence>
      <Sequence from={360} durationInFrames={210}>
        <Carousel />
      </Sequence>
      <Sequence from={570} durationInFrames={150}>
        <StatPunch />
      </Sequence>
      <Sequence from={720} durationInFrames={180}>
        <OutroCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
