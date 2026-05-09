/**
 * Pipeline D — Audio file → Music Video.
 * Auto-cuts on every beat, swaps procedural visuals each scene.
 *
 * Beat schedule is hard-coded for the synth_beat.wav (BPM=120, 0.5s grid)
 * but the structure is generic: pass in a `beats: number[]` prop in seconds.
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { noise2D } from '@remotion/noise';
import { COLORS, FONTS } from '../templates/common';

// Synth beat: BPM=120, 0.5s grid. Generate beats explicitly.
const SYNTH_BEAT_TIMES = Array.from({ length: 12 }, (_, i) => i * 0.5);

export const musicVideoSchema = z.object({
  trackSrc: z.string().default('synth_beat.wav'),
  durationS: z.number().default(6),
  beats: z.array(z.number()).default(SYNTH_BEAT_TIMES),
  title: z.string().default('PROCEDURAL'),
});

export type MusicVideoProps = z.infer<typeof musicVideoSchema>;

export const musicVideoDefaults: MusicVideoProps = {
  trackSrc: 'synth_beat.wav',
  durationS: 6,
  beats: SYNTH_BEAT_TIMES,
  title: 'PROCEDURAL',
};

// Per-scene visual generators (one per beat segment)
const sceneTypes = ['noise', 'flow', 'cells', 'starburst', 'gradient', 'rings'] as const;
type SceneType = typeof sceneTypes[number];

const SceneVisual: React.FC<{ kind: SceneType; bass: number; index: number }> = ({ kind, bass, index }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const intensity = 1 + bass * 1.5;
  const hue = 200 + index * 18;

  if (kind === 'noise') {
    return (
      <AbsoluteFill style={{ background: `radial-gradient(ellipse, hsl(${hue}, 60%, ${10 + bass * 25}%), #050510)` }}>
        {Array.from({ length: 60 }).map((_, i) => {
          const n = noise2D('mn', (i % 10) * 0.3, Math.floor(i / 10) * 0.3 + frame * 0.05);
          const lift = (n + 1) * 0.5;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(i % 10) * 11}%`,
                top: `${Math.floor(i / 10) * 17}%`,
                width: 80 * intensity * lift + 20,
                height: 80 * intensity * lift + 20,
                borderRadius: '50%',
                background: `hsl(${hue + lift * 60}, 80%, ${50 + lift * 30}%)`,
                filter: `blur(${(1 - lift) * 3}px)`,
                opacity: 0.7,
              }}
            />
          );
        })}
      </AbsoluteFill>
    );
  }

  if (kind === 'flow') {
    return (
      <AbsoluteFill style={{ background: '#050510' }}>
        <svg width={width} height={height} style={{ position: 'absolute' }}>
          {Array.from({ length: 80 }).map((_, i) => {
            const sx = random(`fmx-${i}-${index}`) * width;
            const sy = random(`fmy-${i}-${index}`) * height;
            let x = sx, y = sy;
            const pts: [number, number][] = [[x, y]];
            for (let s = 0; s < 14; s++) {
              const ang = noise2D('fm', x * 0.003 + frame * 0.01, y * 0.003) * Math.PI * 2;
              x += Math.cos(ang) * 22;
              y += Math.sin(ang) * 22;
              pts.push([x, y]);
            }
            return (
              <polyline
                key={i}
                points={pts.map(([px, py]) => `${px},${py}`).join(' ')}
                fill="none"
                stroke={`hsla(${hue + (i / 80) * 80}, 80%, 70%, ${0.4 + bass * 0.4})`}
                strokeWidth={1 + bass * 2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </AbsoluteFill>
    );
  }

  if (kind === 'cells') {
    return (
      <AbsoluteFill style={{ background: '#050510' }}>
        <svg width={width} height={height} style={{ position: 'absolute' }}>
          {Array.from({ length: 18 }).map((_, i) => {
            const cx = random(`cx-${i}-${index}`) * width;
            const cy = random(`cy-${i}-${index}`) * height;
            return (
              <circle
                key={i}
                cx={cx + Math.sin(frame * 0.05 + i) * 30 * intensity}
                cy={cy + Math.cos(frame * 0.04 + i) * 30 * intensity}
                r={250 + bass * 200}
                fill={`hsl(${hue + i * 10}, 70%, 55%)`}
                opacity={0.4}
                filter="blur(60px)"
              />
            );
          })}
        </svg>
      </AbsoluteFill>
    );
  }

  if (kind === 'starburst') {
    return (
      <AbsoluteFill style={{ background: 'radial-gradient(circle, #1a1a2e, #050510)', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="1080" height="1080" viewBox="-540 -540 1080 1080">
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i / 60) * Math.PI * 2 + frame * 0.02;
            const len = 200 + bass * 250 + Math.sin(frame * 0.1 + i) * 50;
            const h = (i * 6 + frame * 3) % 360;
            return (
              <line
                key={i}
                x1={0}
                y1={0}
                x2={Math.cos(a) * len}
                y2={Math.sin(a) * len}
                stroke={`hsl(${h}, 80%, 70%)`}
                strokeWidth={3 + bass * 4}
                strokeLinecap="round"
              />
            );
          })}
          <circle cx={0} cy={0} r={30 + bass * 80} fill="white" filter="blur(10px)" />
        </svg>
      </AbsoluteFill>
    );
  }

  if (kind === 'gradient') {
    const a = noise2D('ga', index * 0.7 + frame * 0.02, 0) * 360;
    const b = noise2D('gb', 0, index * 0.7 + frame * 0.025) * 360;
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(${(frame * 1.6) % 360}deg, hsl(${a}, 80%, ${30 + bass * 40}%), hsl(${b}, 80%, ${30 + bass * 40}%))`,
        }}
      />
    );
  }

  // rings
  return (
    <AbsoluteFill style={{ background: '#050510', alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const r = 100 + i * 80 + bass * 80;
        const op = 1 - i * 0.15;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              border: `${4 + bass * 6}px solid hsl(${hue + i * 12}, 80%, 60%)`,
              opacity: op,
              boxShadow: `0 0 ${20 + bass * 40}px hsl(${hue + i * 12}, 80%, 60%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const MusicVideoFromBeats: React.FC<MusicVideoProps> = ({ trackSrc, durationS, beats, title }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Audio data for FFT bass extraction
  const audioData = useAudioData(staticFile(trackSrc));
  let bass = 0;
  if (audioData) {
    const bins = visualizeAudio({ fps, frame, audioData, numberOfSamples: 32, optimizeFor: 'speed' });
    bass = bins.slice(0, 4).reduce((s, v) => s + v, 0) / 4;
  }

  // Cut points: every beat is a scene boundary
  const cuts = [...beats, durationS];

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* Per-scene visual */}
      {cuts.slice(0, -1).map((startS, i) => {
        const endS = cuts[i + 1];
        const fromFrame = Math.round(startS * fps);
        const dur = Math.round((endS - startS) * fps);
        const kind = sceneTypes[i % sceneTypes.length];
        return (
          <Sequence key={i} from={fromFrame} durationInFrames={dur}>
            <SceneVisual kind={kind} bass={bass} index={i} />
          </Sequence>
        );
      })}

      {/* Beat-aligned flash on each beat */}
      {beats.map((b, i) => (
        <FlashOnBeat key={i} at={b} />
      ))}

      {/* Persistent title in corner */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          color: '#fff',
          fontFamily: FONTS.display,
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: 6,
          mixBlendMode: 'difference',
        }}
      >
        {title}
      </div>

      {/* Beat counter */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 80,
          color: '#fff',
          fontFamily: FONTS.mono,
          fontSize: 22,
          opacity: 0.85,
          mixBlendMode: 'difference',
        }}
      >
        BEAT {String(Math.min(beats.length, beats.filter((b) => b * fps <= frame).length)).padStart(2, '0')}/{String(beats.length).padStart(2, '0')}
      </div>

      {/* Audio */}
      <Audio src={staticFile(trackSrc)} volume={1} />
    </AbsoluteFill>
  );
};

const FlashOnBeat: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flashFrame = Math.round(at * fps);
  const dt = frame - flashFrame;
  if (dt < 0 || dt > 5) return null;
  const op = interpolate(dt, [0, 5], [0.5, 0], { extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ backgroundColor: 'white', opacity: op }} />;
};
