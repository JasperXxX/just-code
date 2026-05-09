/**
 * Pipeline B — URL → Explainer Video.
 * Reads `pipelines/url-explainer/article.json` (produced by fetch_article.js)
 * and renders a kinetic-typography explainer.
 *
 * Without API keys, voiceover is silent. The motion graphics carry the message.
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
import { z } from 'zod';
import { COLORS, FONTS } from '../templates/common';

export const urlExplainerSchema = z.object({
  title: z.string(),
  description: z.string(),
  sentences: z.array(z.string()),
  url: z.string().optional(),
  accent: z.string().default('#22d3ee'),
});

export type UrlExplainerProps = z.infer<typeof urlExplainerSchema>;

export const urlExplainerDefaults: UrlExplainerProps = {
  title: 'REMOTION',
  description: 'Make videos programmatically using React.',
  url: 'https://www.remotion.dev/',
  accent: '#22d3ee',
  sentences: [
    'Remotion is a framework for creating videos programmatically using React.',
    'Define your video as code, parametrize anything.',
    'Render to MP4 locally or on AWS Lambda.',
    'Animations are deterministic — every frame is a pure function of frame number.',
    'Studio is the new preview, with timelines, props panels, and instant scrubbing.',
  ],
};

const FPS = 30;
const SEC = (n: number) => Math.round(n * FPS);
const TITLE_LEN = SEC(3);
const DESC_LEN = SEC(2.5);
const SENT_LEN = SEC(3);
const OUTRO_LEN = SEC(2);

const TitleSlide: React.FC<{ title: string; accent: string; url?: string }> = ({ title, accent, url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ fps, frame: frame - 4, config: { damping: 14 } });
  const titleY = interpolate(sIn, [0, 1], [40, 0]);
  const titleOp = interpolate(sIn, [0, 1], [0, 1]);
  const titleBlur = interpolate(sIn, [0, 1], [16, 0]);

  // letter-by-letter
  const letters = title.split('');
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${COLORS.inkSoft}, ${COLORS.ink})`,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <div style={{ color: accent, fontFamily: FONTS.mono, fontSize: 18, letterSpacing: 8, marginBottom: 30, opacity: titleOp }}>
        URL → EXPLAINER
      </div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          color: '#fff',
          fontFamily: FONTS.display,
          fontSize: 200,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        {letters.map((ch, i) => {
          const sLet = spring({ fps, frame: frame - 8 - i * 2, config: { damping: 14 } });
          const y = interpolate(sLet, [0, 1], [60, 0]);
          const op = interpolate(sLet, [0, 1], [0, 1]);
          return (
            <span key={i} style={{ transform: `translateY(${y}px)`, opacity: op, filter: `blur(${(1 - op) * 14}px)` }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          );
        })}
      </div>
      {url && (
        <div
          style={{
            marginTop: 36,
            color: COLORS.muted,
            fontFamily: FONTS.mono,
            fontSize: 22,
            opacity: interpolate(frame, [TITLE_LEN - 25, TITLE_LEN - 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {url}
        </div>
      )}
    </AbsoluteFill>
  );
};

const DescSlide: React.FC<{ description: string; accent: string }> = ({ description, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = description.split(' ');
  return (
    <AbsoluteFill
      style={{
        background: COLORS.ink,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 120,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.3em', maxWidth: 1500 }}>
        {words.map((w, i) => {
          const sIn = spring({ fps, frame: frame - i * 2, config: { damping: 14 } });
          const op = interpolate(sIn, [0, 1], [0, 1]);
          const y = interpolate(sIn, [0, 1], [30, 0]);
          return (
            <span
              key={i}
              style={{
                color: i % 7 === 0 ? accent : '#fff',
                fontFamily: FONTS.display,
                fontSize: 84,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                transform: `translateY(${y}px)`,
                opacity: op,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const SentenceSlide: React.FC<{ index: number; sentence: string; accent: string; total: number }> = ({
  index,
  sentence,
  accent,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ fps, frame: frame - 4, config: { damping: 18 } });
  const op = interpolate(sIn, [0, 1], [0, 1]);
  const y = interpolate(sIn, [0, 1], [30, 0]);

  const words = sentence.split(' ');

  return (
    <AbsoluteFill style={{ background: COLORS.ink, padding: 100, justifyContent: 'center' }}>
      <div
        style={{
          color: accent,
          fontFamily: FONTS.mono,
          fontSize: 22,
          letterSpacing: 4,
          marginBottom: 30,
          opacity: op,
        }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
      <div style={{ maxWidth: 1500 }}>
        {words.map((w, i) => {
          const wFrame = frame - 4 - i * 1.6;
          const wOp = interpolate(wFrame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <span
              key={i}
              style={{
                color: '#fff',
                fontFamily: FONTS.display,
                fontSize: 64,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.4,
                marginRight: 12,
                opacity: wOp,
                display: 'inline-block',
                transform: `translateY(${y * (i % 2 === 0 ? 1 : 0.7)}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 80, left: 100, right: 100, height: 4, background: '#1f1f33' }}>
        <div
          style={{
            height: '100%',
            background: accent,
            width: `${((index + interpolate(frame, [0, SENT_LEN], [0, 1], { extrapolateRight: 'clamp' })) / total) * 100}%`,
            transition: 'none',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ accent: string; url?: string }> = ({ accent, url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ fps, frame, config: { damping: 16 } });
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${COLORS.inkSoft}, ${COLORS.ink})`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          color: accent,
          fontFamily: FONTS.display,
          fontSize: 160,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          transform: `scale(${interpolate(sIn, [0, 1], [0.85, 1])})`,
          opacity: interpolate(sIn, [0, 1], [0, 1]),
        }}
      >
        READ MORE
      </div>
      {url && (
        <div
          style={{
            marginTop: 30,
            padding: '14px 30px',
            border: `2px solid ${accent}`,
            borderRadius: 100,
            color: '#fff',
            fontFamily: FONTS.mono,
            fontSize: 22,
            opacity: interpolate(frame, [12, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
          }}
        >
          {url}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const UrlExplainer: React.FC<UrlExplainerProps> = ({ title, description, sentences, url, accent = '#22d3ee' }) => {
  let cursor = 0;
  const slides: React.ReactNode[] = [];

  // Title
  slides.push(
    <Sequence key="t" from={cursor} durationInFrames={TITLE_LEN}>
      <TitleSlide title={title} accent={accent} url={url} />
    </Sequence>
  );
  cursor += TITLE_LEN;

  // Description
  slides.push(
    <Sequence key="d" from={cursor} durationInFrames={DESC_LEN}>
      <DescSlide description={description} accent={accent} />
    </Sequence>
  );
  cursor += DESC_LEN;

  // Sentences
  sentences.forEach((s, i) => {
    slides.push(
      <Sequence key={`s-${i}`} from={cursor} durationInFrames={SENT_LEN}>
        <SentenceSlide index={i} sentence={s} accent={accent} total={sentences.length} />
      </Sequence>
    );
    cursor += SENT_LEN;
  });

  // Outro
  slides.push(
    <Sequence key="o" from={cursor} durationInFrames={OUTRO_LEN}>
      <Outro accent={accent} url={url} />
    </Sequence>
  );

  return <AbsoluteFill style={{ background: '#000' }}>{slides}</AbsoluteFill>;
};

// Total duration helper for Root.tsx
export function urlExplainerDurationFrames(sentences: number) {
  return TITLE_LEN + DESC_LEN + SENT_LEN * sentences + OUTRO_LEN;
}
