import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { TelemetryHUD } from '../overlays/TelemetryHUD';
import { EventCaption } from '../overlays/EventCaption';
import { EditLUT } from '../colorgrade/EditLUT';
import type { EditMontageSceneData, EditShot, TelemetrySample } from '../schema';

type Props = {
  scene: EditMontageSceneData;
  team: string;
  teamColor: string;
};

const resolveSrc = (src: string): string => {
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith('/')) return staticFile(src.slice(1));
  return staticFile(src);
};

const distributeShots = (
  shots: EditShot[],
  totalFrames: number,
): { startFrame: number; durationFrames: number; shot: EditShot; index: number }[] => {
  // Even distribution; per-shot slice can fan out into 4–18f micro-cuts via beats.
  const slice = Math.floor(totalFrames / shots.length);
  return shots.map((shot, i) => ({
    shot,
    index: i,
    startFrame: i * slice,
    durationFrames: i === shots.length - 1 ? totalFrames - i * slice : slice,
  }));
};

const interpolateTelemetry = (samples: TelemetrySample[], frame: number): TelemetrySample | null => {
  if (samples.length === 0) return null;
  if (samples.length === 1) return samples[0];
  const sorted = [...samples].sort((a, b) => a.frame - b.frame);
  if (frame <= sorted[0].frame) return sorted[0];
  if (frame >= sorted[sorted.length - 1].frame) return sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (frame >= a.frame && frame < b.frame) {
      const t = (frame - a.frame) / Math.max(1, b.frame - a.frame);
      return {
        frame,
        speedKmh: a.speedKmh + (b.speedKmh - a.speedKmh) * t,
        gear: t < 0.5 ? a.gear : b.gear,
        rpm: a.rpm + (b.rpm - a.rpm) * t,
        lap: a.lap ?? b.lap,
      };
    }
  }
  return sorted[sorted.length - 1];
};

const Shot: React.FC<{
  shot: EditShot;
  shotIndex: number;
  durationFrames: number;
  team: string;
  teamColor: string;
}> = ({ shot, shotIndex, durationFrames, team, teamColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1.0 → 1.08 zoom punch into the shot — pushes energy without shake.
  const zoom = interpolate(frame, [0, durationFrames], [1.0, 1.08], { extrapolateRight: 'clamp' });
  const shakeSeed = `shot-${shotIndex}`;
  const shakeX = (random(`${shakeSeed}-x-${frame}`) - 0.5) * 4;
  const shakeY = (random(`${shakeSeed}-y-${frame}`) - 0.5) * 4;

  const startAt = shot.clip.inFrame;
  const endAt = shot.clip.outFrame;

  const telemetry = interpolateTelemetry(shot.telemetry, frame);

  const hudFadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const hudFadeOut = interpolate(frame, [durationFrames - 12, durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const hudOpacity = hudFadeIn * hudFadeOut * 0.8;

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill
        style={{
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
        }}
      >
        <OffthreadVideo
          src={resolveSrc(shot.clip.src)}
          startFrom={startAt}
          endAt={endAt}
          volume={shot.clip.volume}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>

      <EditLUT />

      {shot.showHUD && telemetry ? (
        <TelemetryHUD
          speed={telemetry.speedKmh}
          gear={telemetry.gear}
          rpm={telemetry.rpm}
          team={team}
          opacity={hudOpacity}
        />
      ) : null}

      {shot.event ? (
        <EventCaption
          text={shot.event.text}
          intensity={shot.event.variant === 'punch' ? 'heavy' : 'standard'}
          team={team}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const ChromaticSplit: React.FC<{ at: number; durationFrames: number }> = ({ at, durationFrames }) => {
  const frame = useCurrentFrame();
  const dt = frame - at;
  if (dt < 0 || dt > durationFrames) return null;
  const intensity = interpolate(dt, [0, durationFrames], [1, 0], { extrapolateRight: 'clamp' });
  const offset = 4 * intensity;
  return (
    <>
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          transform: `translateX(${offset}px)`,
          background: 'transparent',
          boxShadow: `inset ${offset * 4}px 0 0 rgba(255,30,30,0.18)`,
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          transform: `translateX(${-offset}px)`,
          background: 'transparent',
          boxShadow: `inset ${-offset * 4}px 0 0 rgba(30,80,255,0.18)`,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

const BeatFlash: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const dt = frame - at;
  if (dt === 0) return <AbsoluteFill style={{ background: '#ffffff' }} />;
  if (dt === 1) return <AbsoluteFill style={{ background: '#000000' }} />;
  return null;
};

const BeatPunch: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const dt = frame - at;
  if (dt < 0 || dt > 6) return null;
  const s = interpolate(dt, [0, 6], [1.04, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${s})`,
        boxShadow: 'inset 0 0 200px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}
    />
  );
};

export const EditMontage: React.FC<Props> = ({ scene, team, teamColor }) => {
  const layout = distributeShots(scene.shots, scene.durationFrames);

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {layout.map((s) => (
        <Sequence
          key={s.index}
          from={s.startFrame}
          durationInFrames={s.durationFrames}
          layout="none"
        >
          <Shot
            shot={s.shot}
            shotIndex={s.index}
            durationFrames={s.durationFrames}
            team={team}
            teamColor={scene.driverColor || teamColor}
          />
        </Sequence>
      ))}

      {/* Beats sit on top of the layered shots — flashes only on heavy beats. */}
      {scene.beats.map((b, i) => (
        <React.Fragment key={`beat-${i}`}>
          {b.heavy ? <BeatFlash at={b.frame} /> : null}
          <BeatPunch at={b.frame} />
          {b.chromatic ? <ChromaticSplit at={b.frame} durationFrames={6} /> : null}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
