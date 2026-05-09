/**
 * useRMSEnvelope — sample-accurate energy envelope, with attack/release
 * dynamics like an analog compressor's sidechain.
 *
 * RMS is computed directly from the channel waveform (no FFT needed) over a
 * `windowMs`-wide window centered on each frame. The per-frame RMS is then
 * fed through an asymmetric attack/release follower:
 *   - if new value > env: env moves up by `attack`
 *   - if new value <= env: env moves down by `release`
 * Faster attack than release gives a snappy "punch then sag" response that
 * works nicely as a sidechain for visual params.
 *
 * Deterministic: walks a fixed look-back chain on each call.
 */

import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useWindowedAudioData } from '@remotion/media-utils';
import { rmsSlice } from './_internal';

export type UseRMSEnvelopeOptions = {
  /** RMS window width in milliseconds. Default 80. */
  windowMs?: number;
  /** Envelope rise speed, 0..1. Default 0.4. */
  attack?: number;
  /** Envelope fall speed, 0..1. Default 0.15. */
  release?: number;
};

const LOOKBACK_FRAMES = 12;
// Maps the raw RMS [0..1] (which rarely reaches >0.3 for music) into [0..1].
// 0.35 covers most popular-music masters without saturating.
const NORMALIZATION_REFERENCE = 0.35;

export function useRMSEnvelope(
  audioSrc: string,
  options: UseRMSEnvelopeOptions = {}
): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const windowMs = options.windowMs ?? 80;
  const attack = options.attack ?? 0.4;
  const release = options.release ?? 0.15;

  const win = useWindowedAudioData({
    src: audioSrc,
    frame,
    fps,
    windowInSeconds: 2,
  });
  if (!win.audioData) return 0;

  const { audioData, dataOffsetInSeconds } = win;
  const sampleRate = audioData.sampleRate;
  const channel = audioData.channelWaveforms[0];
  if (!channel || channel.length === 0) return 0;

  const halfWinSamples = Math.floor((windowMs / 1000) * sampleRate * 0.5);

  const rmsAt = (f: number): number => {
    const tSeconds = f / fps;
    // Convert comp-time → channelWaveform sample index. The waveform covers
    // [dataOffsetInSeconds, dataOffsetInSeconds + len/sampleRate].
    const localT = tSeconds - dataOffsetInSeconds;
    const center = Math.round(localT * sampleRate);
    const raw = rmsSlice(channel, center - halfWinSamples, center + halfWinSamples);
    return Math.min(1, raw / NORMALIZATION_REFERENCE);
  };

  const startFrame = Math.max(0, frame - LOOKBACK_FRAMES);
  let env = rmsAt(startFrame);
  for (let f = startFrame + 1; f <= frame; f++) {
    const v = rmsAt(f);
    const a = v > env ? attack : release;
    env = env * (1 - a) + v * a;
  }
  return env;
}
