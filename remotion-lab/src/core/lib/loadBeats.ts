/**
 * Load beat-detection JSON produced by `~/davinci-flow/edit_tools/beat_detector.py`.
 * The JSON stores beats/onsets in *video frames at the chosen fps*.
 * Convert to seconds for our schedule generators.
 */
import beatsRaw from '../../../public/aye_20s_section_beats.json';

type RawBeats = {
  audio_file: string;
  duration_seconds: number;
  fps: number;
  tempo_bpm: number;
  beat_drop_frame: number;
  beat_drop_time: number;
  total_beats: number;
  total_onsets: number;
  beats: number[];
  onsets: number[];
  sections: { type: 'quiet' | 'loud'; start_time: number; end_time: number; start_frame: number; end_frame: number }[];
};

const raw = beatsRaw as RawBeats;

const framesToSeconds = (frames: number[], fps: number): number[] =>
  frames.map((f) => f / fps);

export const PLACEHOLDER_BEATS = {
  durationS: raw.duration_seconds,
  tempoBpm: raw.tempo_bpm,
  dropS: raw.beat_drop_time,
  beats: framesToSeconds(raw.beats, raw.fps),
  onsets: framesToSeconds(raw.onsets, raw.fps),
  loudSections: raw.sections.filter((s) => s.type === 'loud').map((s) => ({ start: s.start_time, end: s.end_time })),
};

export type BeatData = typeof PLACEHOLDER_BEATS;

/**
 * If a per-track beat JSON sits next to the wav (e.g. `eurogang_track_beats.json`),
 * importing it dynamically isn't possible at runtime in Remotion. Instead, use
 * `calculateMetadata` and pass the beats as props. This loader is for the static
 * placeholder track that ships in the repo.
 */
