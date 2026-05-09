/**
 * Template — QuoteCard
 * Long quote auto-fits via dynamic font sizing. Author + role below.
 * Photo (URL or staticFile) optional, displays as colored circle behind text.
 */
import React from 'react';
import { AbsoluteFill, Img, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';

export const quoteCardSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string().optional(),
  photoUrl: z.string().optional(),
  bg: z.string().default(COLORS.ink),
  accent: z.string().default('#fbbf24'),
});

export type QuoteCardProps = z.infer<typeof quoteCardSchema>;

export const quoteCardDefaults: QuoteCardProps = {
  quote:
    'Programmatic video means you can describe an animation once and render it a thousand times — with different data, different language, different brand — without ever opening an editor again.',
  author: 'JONNY BURGER',
  role: 'CREATOR · REMOTION',
  bg: COLORS.ink,
  accent: '#fbbf24',
};

// Auto-fit: pick a font size that keeps the quote within bounds.
function autoFit(text: string): number {
  const len = text.length;
  if (len < 60) return 110;
  if (len < 120) return 84;
  if (len < 200) return 64;
  if (len < 300) return 48;
  return 38;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  author,
  role,
  photoUrl,
  bg = COLORS.ink,
  accent = '#fbbf24',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fontSize = autoFit(quote);

  const sIn = spring({ fps, frame: frame - 4, config: { damping: 18 } });
  const quoteOp = interpolate(sIn, [0, 1], [0, 1]);
  const quoteY = interpolate(sIn, [0, 1], [30, 0]);

  const authorIn = spring({ fps, frame: frame - 22, config: { damping: 20 } });
  const authorOp = interpolate(authorIn, [0, 1], [0, 1]);

  // Word-by-word reveal of the quote
  const words = quote.split(' ');

  return (
    <AbsoluteFill style={{ background: bg, padding: 140, alignItems: 'center', justifyContent: 'center' }}>
      {/* Decorative quote mark */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 100,
          fontSize: 320,
          color: accent,
          fontFamily: FONTS.serif,
          opacity: 0.18,
          lineHeight: 1,
        }}
      >
        &ldquo;
      </div>

      {/* Photo blob behind text */}
      {photoUrl && (
        <div
          style={{
            position: 'absolute',
            right: 120,
            top: 120,
            width: 320,
            height: 320,
            borderRadius: '50%',
            overflow: 'hidden',
            opacity: interpolate(sIn, [0, 1], [0, 0.55]),
          }}
        >
          <Img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.4) contrast(1.1)' }} />
        </div>
      )}

      <div
        style={{
          maxWidth: 1500,
          color: COLORS.white,
          fontFamily: FONTS.serif,
          fontSize,
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          opacity: quoteOp,
          transform: `translateY(${quoteY}px)`,
          textAlign: 'left',
          fontStyle: 'italic',
        }}
      >
        {words.map((w, i) => {
          const wordFrame = frame - 4 - i * 1.4;
          const wordOp = interpolate(wordFrame, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <span key={i} style={{ opacity: wordOp, marginRight: 12 }}>
              {w}
            </span>
          );
        })}
      </div>

      <div
        style={{
          alignSelf: 'flex-start',
          marginTop: 60,
          marginLeft: 'auto',
          marginRight: 0,
          opacity: authorOp,
          transform: `translateY(${interpolate(authorIn, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ color: accent, fontFamily: FONTS.display, fontSize: 28, fontWeight: 700, letterSpacing: 4 }}>
          — {author}
        </div>
        {role && (
          <div style={{ color: COLORS.muted, fontFamily: FONTS.display, fontSize: 20, marginTop: 6, letterSpacing: 4 }}>
            {role}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
