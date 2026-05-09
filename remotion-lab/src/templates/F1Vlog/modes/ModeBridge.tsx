import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { BridgeSceneData, ClipRef } from '../schema';

type Props = {
  scene: BridgeSceneData;
  voiceOverSrc?: string;
  voiceOverStartFrame?: number;
};

const resolveSrc = (src: string): string => {
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith('/')) return staticFile(src.slice(1));
  return staticFile(src);
};

const VideoLayer: React.FC<{ clip: ClipRef; volumeMultiplier?: number; style?: React.CSSProperties }> = ({
  clip,
  volumeMultiplier = 1,
  style,
}) => (
  <AbsoluteFill style={style}>
    <OffthreadVideo
      src={resolveSrc(clip.src)}
      startFrom={clip.inFrame}
      endAt={clip.outFrame}
      volume={(clip.volume ?? 1) * volumeMultiplier}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </AbsoluteFill>
);

const Anticipation: React.FC<{ scene: BridgeSceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  // Logarithmic ramp on volume "duck" so the dip feels acoustic, not linear.
  const volumeFactor = Math.max(0, 1 - Math.pow(t, 0.6));
  const scale = interpolate(t, [0, 1], [1.0, 1.06]);
  const desat = interpolate(t, [0, 1], [1.0, 0.85]);

  return (
    <AbsoluteFill style={{ background: '#0a0805' }}>
      {scene.fromClip ? (
        <AbsoluteFill style={{ transform: `scale(${scale})`, filter: `saturate(${desat})` }}>
          <VideoLayer clip={scene.fromClip} volumeMultiplier={volumeFactor} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 100%)',
          opacity: t,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

const Impact: React.FC<{ scene: BridgeSceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Three-phase impact: from-clip motion blur build → 1f white + 1f black → reveal new clip.
  const flashAt = Math.max(2, Math.floor(durationInFrames * 0.45));
  const revealAt = flashAt + 2;

  if (frame < flashAt) {
    const t = frame / flashAt;
    const scale = interpolate(t, [0, 1], [1.0, 1.12]);
    const blur = interpolate(t, [0, 1], [0, 6]);
    return (
      <AbsoluteFill style={{ background: '#000' }}>
        {scene.fromClip ? (
          <AbsoluteFill style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)` }}>
            <VideoLayer clip={scene.fromClip} volumeMultiplier={1 - t * 0.4} />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
    );
  }

  if (frame === flashAt) return <AbsoluteFill style={{ background: '#ffffff' }} />;
  if (frame === flashAt + 1) return <AbsoluteFill style={{ background: '#000000' }} />;

  const localFrame = frame - revealAt;
  const remaining = Math.max(1, durationInFrames - revealAt);
  const t = localFrame / remaining;
  const scale = interpolate(t, [0, 1], [1.04, 1.0]);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {scene.toClip ? (
        <AbsoluteFill style={{ transform: `scale(${scale})` }}>
          <VideoLayer clip={scene.toClip} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const Decay: React.FC<{ scene: BridgeSceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const sat = interpolate(t, [0, 1], [1.0, 0.4]);
  const fromOp = interpolate(t, [0, 0.7], [1, 0], { extrapolateRight: 'clamp' });
  const toOp = interpolate(t, [0.4, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fromVol = Math.max(0, 1 - t * 1.2);
  const toVol = Math.max(0, t - 0.3) / 0.7;

  return (
    <AbsoluteFill style={{ background: '#0a0805' }}>
      {scene.fromClip ? (
        <AbsoluteFill style={{ opacity: fromOp, filter: `saturate(${sat})` }}>
          <VideoLayer clip={scene.fromClip} volumeMultiplier={fromVol} />
        </AbsoluteFill>
      ) : null}
      {scene.toClip ? (
        <AbsoluteFill style={{ opacity: toOp }}>
          <VideoLayer clip={scene.toClip} volumeMultiplier={toVol} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export const ModeBridge: React.FC<Props> = ({ scene }) => {
  if (scene.variant === 'anticipation') return <Anticipation scene={scene} />;
  if (scene.variant === 'impact') return <Impact scene={scene} />;
  return <Decay scene={scene} />;
};
