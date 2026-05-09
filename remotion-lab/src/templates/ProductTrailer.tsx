/**
 * Template — ProductTrailer
 * Composes TitleCard → photo carousel beats with feature reveal → StatReveal → EndCard.
 * Driven by a single JSON brief.
 */
import React from 'react';
import { AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';
import { TitleCard } from './TitleCard';
import { EndCard } from './EndCard';
import { StatReveal } from './StatReveal';
import { PhotoCarousel } from './PhotoCarousel';

export const productTrailerSchema = z.object({
  product: z.string(),
  tagline: z.string(),
  features: z.array(z.string()).max(5),
  stat: z.object({ value: z.number(), label: z.string(), suffix: z.string().optional() }),
  bRoll: z.array(z.string()),
  cta: z.string(),
  accent: z.string().default(COLORS.accent),
});

export type ProductTrailerProps = z.infer<typeof productTrailerSchema>;

export const productTrailerDefaults: ProductTrailerProps = {
  product: 'REMOTION LAB',
  tagline: 'Programmatic video at every scale',
  features: [
    'DETERMINISTIC',
    'PARAMETRIZED',
    'PARALLEL',
    'BROADCAST READY',
  ],
  stat: { value: 1247800, label: 'FRAMES RENDERED · LAST 24H', suffix: '' },
  bRoll: ['photos/p01.png', 'photos/p02.png', 'photos/p03.png', 'photos/p04.png'],
  cta: 'BUILD WITH CODE',
  accent: '#5e9eff',
};

const FeatureChips: React.FC<{ features: string[]; accent: string }> = ({ features, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: COLORS.ink, padding: 100, justifyContent: 'center' }}>
      <div style={{ color: accent, fontFamily: FONTS.display, fontSize: 22, letterSpacing: 8, marginBottom: 40, fontWeight: 600 }}>
        · WHY
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {features.map((f, i) => {
          const sIn = spring({ fps, frame: frame - i * 8, config: { damping: 16 } });
          const x = interpolate(sIn, [0, 1], [-80, 0]);
          const op = interpolate(sIn, [0, 1], [0, 1]);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 30, transform: `translateX(${x}px)`, opacity: op }}>
              <div style={{ width: 60, height: 4, background: accent, borderRadius: 2 }} />
              <div style={{ color: COLORS.white, fontFamily: FONTS.display, fontSize: 88, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {f}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const FPS = 30;
const SEC = (n: number) => Math.round(n * FPS);

// Slot timings (in frames @ 30fps):
//   0   .. 90   intro title
//   90  .. 270  feature chips (6s)
//   270 .. 510  photo carousel (8s)
//   510 .. 660  stat reveal (5s)
//   660 .. 780  end card (4s)

export const ProductTrailer: React.FC<ProductTrailerProps> = ({
  product,
  tagline,
  features,
  stat,
  bRoll,
  cta,
  accent = COLORS.accent,
}) => {
  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Sequence from={0} durationInFrames={90}>
        <TitleCard title={product} subtitle={tagline} variant="bold" accent={accent} />
      </Sequence>
      <Sequence from={90} durationInFrames={180}>
        <FeatureChips features={features} accent={accent} />
      </Sequence>
      <Sequence from={270} durationInFrames={240}>
        <PhotoCarousel
          photos={bRoll}
          durationPerSlideS={2.0}
          transitionFrames={10}
          caption={product.toUpperCase()}
          showCounter={false}
        />
      </Sequence>
      <Sequence from={510} durationInFrames={150}>
        <StatReveal
          value={stat.value}
          prefix=""
          suffix={stat.suffix ?? ''}
          label={stat.label}
          accent={accent}
          formatThousands
          decimals={0}
        />
      </Sequence>
      <Sequence from={660} durationInFrames={120}>
        <EndCard logo={product} cta={cta} handles={['remotion.dev', '@remotion']} accent={accent} />
      </Sequence>
    </AbsoluteFill>
  );
};
