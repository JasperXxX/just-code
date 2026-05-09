/**
 * Template — PhotoCarousel
 * Array of photos, each Ken-Burnsed (zoom + pan), connected by fade transitions.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';
import { COLORS, FONTS } from './common';

export const photoCarouselSchema = z.object({
  photos: z.array(z.string()),  // staticFile() paths or full URLs
  durationPerSlideS: z.number().default(2.5),
  transitionFrames: z.number().default(12),
  caption: z.string().optional(),
  showCounter: z.boolean().default(true),
});

export type PhotoCarouselProps = z.infer<typeof photoCarouselSchema>;

export const photoCarouselDefaults: PhotoCarouselProps = {
  photos: [
    'photos/p01.png',
    'photos/p02.png',
    'photos/p03.png',
    'photos/p04.png',
    'photos/p05.png',
    'photos/p06.png',
    'photos/p07.png',
    'photos/p08.png',
  ],
  durationPerSlideS: 2.5,
  transitionFrames: 12,
  caption: 'PROCEDURAL PHOTOGRAPHY · LAB 02',
  showCounter: true,
};

const KenBurnsImage: React.FC<{ src: string; index: number; durationFrames: number }> = ({
  src,
  index,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
  const t = ease(Math.min(1, Math.max(0, frame / durationFrames)));

  // Deterministic pseudo-random pan/zoom per slide
  const r1 = random(`zf-${index}`);
  const r2 = random(`zt-${index}`);
  const r3 = random(`px-${index}`) - 0.5;
  const r4 = random(`py-${index}`) - 0.5;

  const zoomFrom = 1.0 + r1 * 0.05;
  const zoomTo = 1.12 + r2 * 0.1;
  const panFromX = r3 * 6;
  const panFromY = r4 * 4;
  const panToX = -r3 * 6;
  const panToY = -r4 * 4;

  const scale = interpolate(t, [0, 1], [zoomFrom, zoomTo]);
  const tx = interpolate(t, [0, 1], [panFromX, panToX]);
  const ty = interpolate(t, [0, 1], [panFromY, panToY]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
          willChange: 'transform',
        }}
      />
    </AbsoluteFill>
  );
};

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  photos,
  durationPerSlideS = 2.5,
  transitionFrames = 12,
  caption,
  showCounter = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, height } = useVideoConfig();
  const slideFrames = Math.round(durationPerSlideS * fps);

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      {photos.map((src, i) => {
        const fromFrame = i * slideFrames - (i > 0 ? transitionFrames / 2 : 0);
        const dur = slideFrames + transitionFrames;
        return (
          <Sequence key={i} from={fromFrame} durationInFrames={dur}>
            <CrossfadeWrapper enterFrames={i > 0 ? transitionFrames : 0} exitFrames={transitionFrames}>
              <KenBurnsImage src={src} index={i} durationFrames={dur} />
            </CrossfadeWrapper>
          </Sequence>
        );
      })}

      {/* Letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.06, background: 'black', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.06, background: 'black', pointerEvents: 'none' }} />

      {/* Caption */}
      {caption && (
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.08,
            left: 80,
            color: COLORS.white,
            fontFamily: FONTS.display,
            fontSize: 22,
            letterSpacing: 6,
            fontWeight: 600,
            opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {caption}
        </div>
      )}

      {/* Slide counter */}
      {showCounter && (
        <div
          style={{
            position: 'absolute',
            top: height * 0.08,
            right: 80,
            color: COLORS.white,
            fontFamily: FONTS.mono,
            fontSize: 22,
            opacity: 0.7,
          }}
        >
          {String(Math.min(photos.length, Math.floor(frame / slideFrames) + 1)).padStart(2, '0')} /{' '}
          {String(photos.length).padStart(2, '0')}
        </div>
      )}
    </AbsoluteFill>
  );
};

const CrossfadeWrapper: React.FC<{ enterFrames: number; exitFrames: number; children: React.ReactNode }> = ({
  enterFrames,
  exitFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enterOp = interpolate(frame, [0, enterFrames || 1], [enterFrames > 0 ? 0 : 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitOp = interpolate(
    frame,
    [durationInFrames - exitFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  return <AbsoluteFill style={{ opacity: enterOp * exitOp }}>{children}</AbsoluteFill>;
};
