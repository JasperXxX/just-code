import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { LowerThird } from '../overlays/LowerThird';
import { VlogLUT } from '../colorgrade/VlogLUT';
import type { VlogSceneData } from '../schema';
import { COLORS, FONTS } from '../../common';

type Props = {
  scene: VlogSceneData;
  team: string;
  teamColor: string;
  teamColorSecondary: string;
};

const sampleNoise = (seed: string, t: number): number => {
  // Two staggered hashed samples lerped to approximate ~0.5Hz handheld drift.
  // We keep this deterministic via remotion's random(); a seedable noise
  // would be smoother but pulls in extra deps and the ear/eye doesn't catch it.
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a * (1 - u) + b * u;
};

const resolveSrc = (src: string): string => {
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith('/')) return staticFile(src.slice(1));
  return staticFile(src);
};

export const VlogScene: React.FC<Props> = ({ scene, team, teamColor, teamColorSecondary }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const handheldHz = 0.5;
  const tSec = frame / fps;
  const jitterX = sampleNoise(`${scene.jitterSeed}-x`, tSec * handheldHz * 4) * 2;
  const jitterY = sampleNoise(`${scene.jitterSeed}-y`, tSec * handheldHz * 4) * 2;
  const jitterRot = sampleNoise(`${scene.jitterSeed}-r`, tSec * handheldHz * 3) * 0.18;

  const { fromScale, toScale, panX, panY } = scene.kenBurns;
  const burnsT = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(burnsT, [0, 1], [fromScale, toScale]);
  const px = interpolate(burnsT, [0, 1], [0, panX * 12]);
  const py = interpolate(burnsT, [0, 1], [0, panY * 12]);

  // 6f cross-fade head/tail; straight cut is the default but we soften
  // scene boundaries inside Mode A to taste (still no hard flashes).
  const fadeFrames = 6;
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - fadeFrames, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = fadeIn * fadeOut;

  const startAt = scene.clip.inFrame;
  const endAt = scene.clip.outFrame;

  const lowerThirdSpring = spring({
    fps,
    frame: frame - 18,
    config: { damping: 18, stiffness: 90, mass: 0.9 },
  });

  const voSub = scene.voSubtitle;
  const voActive =
    voSub &&
    frame >= voSub.startFrame &&
    (voSub.endFrame == null || frame < voSub.endFrame);
  const voLocal = voSub ? frame - voSub.startFrame : 0;
  const voSpring = spring({ fps, frame: voLocal, config: { damping: 22 } });

  return (
    <AbsoluteFill style={{ background: '#0a0805', opacity }}>
      <AbsoluteFill
        style={{
          transform: `translate(${jitterX + px}px, ${jitterY + py}px) rotate(${jitterRot}deg) scale(${scale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <OffthreadVideo
          src={resolveSrc(scene.clip.src)}
          startFrom={startAt}
          endAt={endAt}
          volume={scene.clip.volume}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>

      <VlogLUT />

      {scene.lowerThird ? (
        <div
          style={{
            position: 'absolute',
            left: 80,
            bottom: 110,
            opacity: interpolate(lowerThirdSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(lowerThirdSpring, [0, 1], [22, 0])}px)`,
          }}
        >
          <LowerThird
            driver={scene.lowerThird.primary}
            track={scene.lowerThird.secondary ?? scene.lowerThird.meta}
            team={team}
          />
        </div>
      ) : null}

      {voActive && voSub ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 60,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: 28,
              fontWeight: 400,
              color: COLORS.white,
              letterSpacing: 0.2,
              textShadow: '0 2px 8px rgba(0,0,0,0.6)',
              opacity: interpolate(voSpring, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(voSpring, [0, 1], [10, 0])}px)`,
              maxWidth: 1100,
              textAlign: 'center',
              padding: '0 40px',
            }}
          >
            {voSub.text}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
