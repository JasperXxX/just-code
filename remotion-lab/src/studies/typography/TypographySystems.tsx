/**
 * studies/typography — three design systems compared.
 *
 *   1. Editorial — large serif headlines, asymmetric, generous leading
 *   2. Broadcast — bold sans, high-contrast, condensed weights
 *   3. Social — chunky display, color blocks, kinetic
 *
 * Each chapter 90 frames @ 30fps = 3s.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadBarlow } from '@remotion/google-fonts/BarlowCondensed';
import { loadFont as loadArchivo } from '@remotion/google-fonts/ArchivoBlack';

const fraunces = loadFraunces();
const barlow = loadBarlow();
const archivo = loadArchivo();

const CH_LEN = 90;

// EDITORIAL
const Editorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSpring = spring({ fps, frame: frame - 4, config: { damping: 18, mass: 1.2 } });
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOp = interpolate(titleSpring, [0, 1], [0, 1]);
  return (
    <AbsoluteFill style={{ background: '#f4ede4', padding: 100, justifyContent: 'flex-end' }}>
      <div style={{ color: '#80604a', fontFamily: fraunces.fontFamily, fontSize: 22, fontStyle: 'italic', letterSpacing: 2, marginBottom: 30, opacity: titleOp }}>
        Issue 04 · Spring 2026
      </div>
      <div
        style={{
          color: '#1a1410',
          fontFamily: fraunces.fontFamily,
          fontSize: 220,
          fontWeight: 400,
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          fontVariationSettings: '"opsz" 144, "wght" 400, "SOFT" 50',
          transform: `translateY(${titleY}px)`,
          opacity: titleOp,
          marginLeft: -8,
        }}
      >
        the
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 300 }}>quiet</span>
        <br />
        revolution.
      </div>
      <div
        style={{
          color: '#80604a',
          fontFamily: fraunces.fontFamily,
          fontSize: 24,
          marginTop: 60,
          maxWidth: 700,
          lineHeight: 1.5,
          opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        Programmatic video, deterministic by design, opens a new front
        between motion design and engineering.
      </div>
    </AbsoluteFill>
  );
};

// BROADCAST
const Broadcast: React.FC = () => {
  const frame = useCurrentFrame();
  const accent = interpolate(frame, [4, 16], [-100, 0], { extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const accentOp = interpolate(frame, [4, 12], [0, 1], { extrapolateRight: 'clamp' });
  // Letter-by-letter
  const text = 'BREAKING';
  return (
    <AbsoluteFill style={{ background: '#0a0a14', padding: 80 }}>
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 80,
          color: '#fff',
          fontFamily: barlow.fontFamily,
          fontSize: 18,
          letterSpacing: 8,
          fontWeight: 600,
        }}
      >
        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff2d55', marginRight: 10, transform: 'translateY(-1px)' }} />
        LIVE · 22:14 UTC
      </div>
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: 80,
        }}
      >
        <div
          style={{
            background: '#ff2d55',
            display: 'inline-block',
            padding: '12px 24px',
            color: '#fff',
            fontFamily: barlow.fontFamily,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            transform: `translateX(${accent}%)`,
            opacity: accentOp,
            marginBottom: 20,
          }}
        >
          BROADCAST · 16:9
        </div>
        <div style={{ display: 'flex' }}>
          {text.split('').map((ch, i) => {
            const charFrame = frame - 16 - i * 3;
            const op = interpolate(charFrame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const y = interpolate(charFrame, [0, 8], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.9, 0.3, 1) });
            return (
              <span
                key={i}
                style={{
                  color: '#fff',
                  fontFamily: barlow.fontFamily,
                  fontSize: 240,
                  fontWeight: 800,
                  fontStretch: 'condensed',
                  letterSpacing: '-0.04em',
                  display: 'inline-block',
                  transform: `translateY(${y}px)`,
                  opacity: op,
                  lineHeight: 0.9,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            color: '#a0a0c0',
            fontFamily: barlow.fontFamily,
            fontSize: 28,
            marginTop: 16,
            fontWeight: 500,
            opacity: interpolate(frame, [42, 60], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          Lower-third demonstrates condensed sans + accent strip.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// SOCIAL
const Social: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ fps, frame: frame - 4, config: { damping: 9, mass: 0.8 } });
  const wordRot = interpolate(sIn, [0, 1], [-5, 0]);
  const wordScale = interpolate(sIn, [0, 1], [0.7, 1]);
  const word2 = spring({ fps, frame: frame - 22, config: { damping: 11 } });
  const word3 = spring({ fps, frame: frame - 40, config: { damping: 11 } });
  return (
    <AbsoluteFill style={{ background: '#fff200', padding: 80, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, #ff5e9e33 0%, transparent 50%)' }} />
      <div
        style={{
          color: '#0a0a14',
          fontFamily: archivo.fontFamily,
          fontSize: 240,
          fontWeight: 900,
          lineHeight: 0.85,
          textAlign: 'center',
          letterSpacing: '-0.03em',
        }}
      >
        <div style={{ transform: `rotate(${wordRot}deg) scale(${wordScale})`, opacity: interpolate(sIn, [0, 1], [0, 1]) }}>
          BUILD
        </div>
        <div
          style={{
            background: '#0a0a14',
            color: '#fff200',
            display: 'inline-block',
            padding: '12px 36px',
            transform: `translateY(${interpolate(word2, [0, 1], [40, 0])}px) skewX(-6deg)`,
            opacity: interpolate(word2, [0, 1], [0, 1]),
            margin: '12px 0',
          }}
        >
          IT
        </div>
        <div
          style={{
            transform: `scale(${interpolate(word3, [0, 1], [0.6, 1])})`,
            opacity: interpolate(word3, [0, 1], [0, 1]),
            color: '#ff2d55',
          }}
        >
          LOUD
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          color: '#0a0a14',
          fontFamily: archivo.fontFamily,
          fontSize: 22,
          letterSpacing: 4,
          opacity: interpolate(frame, [60, 76], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        // SOCIAL · 9:16-FRIENDLY · KINETIC
      </div>
    </AbsoluteFill>
  );
};

const CHAPTERS = [Editorial, Broadcast, Social];

export const TypographySystems: React.FC = () => {
  return (
    <AbsoluteFill>
      {CHAPTERS.map((C, i) => (
        <Sequence key={i} from={i * CH_LEN} durationInFrames={CH_LEN}>
          <C />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
