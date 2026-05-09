/**
 * Eurogang Vlog Trip — FX FLOW-BLUR variant (Ref 4 = leev.vfx aesthetic).
 *
 * Near-identical copy of EurogangVlogTrip.tsx with one new transition kind —
 * `flowBlur` — that makes adjacent clips optically merge through a triangular
 * gaussian-blur ramp on a FLOW_BLUR_FRAMES (= 18) overlap window. At the cut
 * frame both clips reach 25px blur and visually fuse; on either side they
 * sharpen back to 0px. Halation + color-grade layers run only inside the
 * transition window for the "lights leak out" cinematic glow.
 *
 * The mechanic:
 *   - When a cut is `flowBlur`, the OUTGOING slot's render extends by
 *     FLOW_BLUR_FRAMES past its scheduled end (same outgoing-extension
 *     pattern as MaskReveal). For those final 18 frames the outgoing clip
 *     is the *bottom* layer; the incoming clip (which has already started
 *     rendering at the cut frame) sits on top.
 *   - Both clips run blur(N px) where N follows a triangular curve over the
 *     FLOW_BLUR_FRAMES window: 0 → 25 (peak at the cut frame) → 0. Eased
 *     in/out with cubic for smooth optical merge.
 *   - Halation overlay (additive, screen-blend opacity 0.4): the incoming
 *     clip blurred 40px + brightness(2.0) contrast(1.5), faded in/out
 *     symmetrically across the same 18-frame window.
 *   - Color-grade overlay (additive, opacity 0.3): hue-rotate(-5deg)
 *     saturate(1.2) over the incoming clip, same 18-frame envelope.
 *
 * New TransitionKind: 'flowBlur' (local extension — does NOT modify
 * transitions/decorations.tsx; the rendering happens inline in the SCHEDULE
 * map because the blur + halation + grade need to wrap each clip's container
 * rather than being an overlay decoration).
 *
 * Gated behind `enableFlowBlur` prop (default true). When enabled, every
 * 4th cut is upgraded to `flowBlur` — mixed with the existing whipPan /
 * flashCut / hardCut so the look stays varied. When disabled, behavior is
 * identical to EurogangVlogTrip.
 *
 * Original file header:
 * Eurogang Vlog Trip — v2.
 *
 * Changes from v1 per user feedback (2026-05-06):
 *   1. Cuts ALWAYS land on a beat (skipping beats is fine, but every cut
 *      boundary is the timestamp of a beat from the detected beat grid).
 *   2. Clips picked in CHRONOLOGICAL order (sorted by filename, which is
 *      date-prefixed in the iCloud download).
 *   3. STRICT no-duplicates — each source clip plays at most once across the
 *      whole edit.
 *   4. Best sub-window per clip — instead of always starting at 0s, we use
 *      the steadiest / most-interesting window of the right length, computed
 *      offline by `analyze_eurogang_subwindows.py`.
 *   5. Boring/shaky clips filtered out via quality floor.
 *
 *   • 75 seconds, 1080×1920, 24fps, full hochkant (no letterbox bars)
 *   • Music: placeholder track at public/eurogang_track.mp3 (152 BPM, drop
 *     at source 92.89s). Track starts at offset 67.89s so its drop lands at
 *     our 25s mark.
 *
 * v44 (2026-05-07) — landed all four S-Tier FX from the parallel review
 * pass + a global pacing restructure:
 *   • GhostEcho — 4 alpha-staggered subject_webm copies stack at each music
 *     drop (99s, 200s) for ~30 frames. Signature TikTok ghost-self trail.
 *   • J-Cut pre-lap audio — speech ducks now lead the picture cut by
 *     `jCutLeadFrames` (default 10). Anti-double-voice clamp shortens the
 *     lead so two adjacent speech ducks never overlap. Music unchanged.
 *   • Bass Pump — useWindowedAudioData on the ACTIVE track per frame, FFT
 *     over first 6 bins, EMA-smoothed (alpha=0.4), drives a
 *     `1.0 + bassNorm * 0.14` scale on the topmost render container
 *     (composed with the existing dropScale).
 *   • MaskReveal Silhouette — every 5th eligible cut (incoming clip has
 *     subject_webm) becomes a 2-phase silhouette dissolve: phase 1 (12f)
 *     ramps the silhouette opacity 0→1, phase 2 (6f) expands the mask
 *     100%→240%. Outgoing slot rendered for `durFrames + 18` so V1 keeps
 *     playing under the reveal. Always-rendered-div pattern stops React
 *     from unmounting OffthreadVideo when the transition ends.
 *   • Pacing — new `phase: 'story' | 'edit'` on each CutSlot, derived from
 *     `phaseAtTime(t)` (8 phases across the 240s timeline). buildSchedule
 *     uses the phase to pick stride: story = wide (6-9), edit = tight
 *     (1-2). Multiple story↔edit cycles per track section instead of one
 *     calm→drop arc. Edit phases also stack the FX (Echo/BassPump/Flash).
 *   • Crowd SFX removed — `crowd_gasp.mp3` + `crowd_cheer.mp3` Sequences
 *     deleted; bass_drop + riser_build remain.
 *   • Flash density reduced — `i % 4 === 0` (was `% 2 === 0`) AND
 *     peakOpacity 0.55 → 0.32 in the drop FlashFrame loop.
 *
 * v45 (2026-05-08) — DUAL-MODE VLOG↔EDITBURST ARCHITECTURE.
 *   The previous "story↔edit" layer (v44) was a misunderstanding. The user's
 *   actual mental model is that travel-vlog edits alternate between two
 *   *distinct presentation modes*, not just two cut densities sharing one
 *   continuous music bed. v45 implements this properly:
 *
 *   • Mode = 'vlog' | 'editBurst' (was Phase = 'story' | 'edit'). Renamed
 *     in place on CutSlot — `slot.mode` everywhere.
 *   • EDIT_BURSTS constant — 6 explicit windows totalling ~90s (37%) of the
 *     240s timeline. Each window names its dominant track:
 *       1.  15– 25s metro  light setter
 *       2.  50– 65s metro  trip-edit
 *       3.  95–115s boogie DROP 1  (biggest of the early act)
 *       4. 145–160s boogie mid-section
 *       5. 195–220s uzi    DROP 2  (biggest overall)
 *       6. 235–240s uzi    hero-outro punctuation
 *     `modeAtTime(t)` returns 'editBurst' iff t is inside one of these.
 *   • Audio architecture flipped:
 *       – Music tracks default vol 0.07 in vlog mode (was 0.45–0.85). Almost
 *         inaudible — pure ambient bed. Speech-clip audio is the foreground.
 *       – Inside an editBurst window the active track ramps to 0.85 with a
 *         0.5s crossfade at both boundaries. Other tracks stay at 0.07.
 *       – Clip-source audio (duckWindows + jCut + ambientDucks Sequences)
 *         is now mode-aware: 1.15×normFactor in vlog, 0.18×normFactor in
 *         editBurst, with a 0.5s linear ramp across boundaries. Speech ducks
 *         still apply but with shallower targets in editBurst (clip audio
 *         is already low).
 *   • Cut stride mode-aware:
 *       – vlog mode → stride 6–12 (3–6s cuts, follow speech rhythm)
 *       – editBurst → stride 1–2 (0.4–1s, beat-locked)
 *     The act 'calm'|'build'|'drop' distinction is largely subsumed; Mode
 *     drives pacing now. 'build' kept as a 4-frame riser ramp into drop 1.
 *   • Picker tag-prefs mode-aware:
 *       – vlog slot   → talking_clear ▸ talking_noisy ▸ silent
 *       – editBurst   → silent ▸ talking_noisy ▸ talking_clear
 *   • FX gating by mode:
 *       – <FlashFrame> only renders when its onset is inside an editBurst.
 *       – <BeatFlash> peakOpacity is 0.10 inside editBursts, 0 outside
 *         (BeatFlash now wraps multiple per-window Sequences).
 *       – GhostEcho at 99s & 200s — both fall inside editBursts 3 & 5, kept.
 *       – BassPump (×0.14) unchanged; gated naturally by music presence.
 *       – MaskReveal silhouette: existing every-5th-eligible-cut mechanic
 *         kept; additionally, every cut whose slot crosses an editBurst↔
 *         vlog boundary is upgraded to a transition stinger.
 *   • Preserved from v44.1: FlashFrame `i % 8 === 0` + peakOpacity 0.20,
 *     SKIP_FILES set, MASK_REVEAL_FRAMES = 18 + outgoing-extension.
 *   • Composition IDs and prop names unchanged. `phase` field renamed to
 *     `mode` on CutSlot (no other file imports it).
 *
 * v46 (2026-05-08) — DECOUPLE MUSIC FROM MODE + FLEXIBLE PLACEMENTS + MASKREVEAL OFF.
 *   v45's mode-driven music gating made music nearly inaudible during vlog
 *   narration (vol 0.07). User feedback: "Audio nur runter machen, wenn
 *   irgendwie ein geiles Geräusch ist oder wenn wirklich was gesprochen
 *   wird." Music should be ON most of the time, ducking only on real cause.
 *
 *   • Music model swapped: `TRACKS` (3 continuous tracks + bridges) →
 *     `MUSIC_PLACEMENTS: MusicPlacement[]` — flexible per-segment placements.
 *     Each placement: { id, file, compStartS, compEndS, srcOffsetS,
 *     fadeInS, fadeOutS, baseVol }. Multiple placements may overlap
 *     (= intentional crossfade); gaps between placements OK (= silence /
 *     ambient-only). A song can appear once for 13s (metro-setter 15-28s),
 *     return briefly (uzi-early 145-158s), or layer over another track's
 *     tail (metro-outro 220-240s overlapping uzi-drop's 220-225s fadeout).
 *   • Six default placements:
 *       1. metro-setter  15– 28s, src 5,    baseVol 0.55
 *       2. metro-trip    50– 70s, src 18,   baseVol 0.60
 *       3. boogie-drop   95–130s, src 77.39 baseVol 0.85 (drop @ comp 99)
 *       4. uzi-early    145–158s, src 30,   baseVol 0.55
 *       5. uzi-drop     195–225s, src 80.7, baseVol 0.85 (drop @ comp 200)
 *       6. metro-outro  220–240s, src 70,   baseVol 0.50 (overlaps uzi-drop tail)
 *   • `makeTrackVolume` (per-track, mode-gated) replaced by
 *     `makePlacementVolume(p, ducks, ambientDucks)`. Formula:
 *         vol(t) = baseVol × fadeEnvelope(t) × duckMul(t)
 *         duckMul(t) = speechDuck(t) × ambientDuck(t)
 *         speechDuck = 0.28 inside duckWindow (with 0.25s ramp), else 1.0
 *         ambientDuck = 0.55 inside ambientDuck (with 0.20s ramp), else 1.0
 *     Mode is NO LONGER an input. Music plays at its `baseVol` regardless
 *     of vlog/editBurst classification — only speech/cool-sound triggers
 *     ducking. `bridges` removed entirely (overlapping placements with
 *     fade envelopes handle crossfade naturally).
 *   • Clip-source audio: still mode-aware, but less aggressive.
 *       – vlog mode    → 1.15× normFactor (unchanged)
 *       – editBurst    → 0.65× normFactor (was 0.18 — too low when music
 *         carries throughout). 0.5s ramp at boundaries unchanged.
 *   • MaskReveal disabled by default: `enableMaskReveal: false`. The
 *     `maskRevealMap` useMemo returns an empty Map when the flag is off,
 *     so neither every-5th-eligible nor mode-boundary stinger fires. The
 *     `MaskRevealWrapper` still wraps every clip but with the always-
 *     passthrough path. Implementation kept intact — re-enable after the
 *     cutout pool quality issue (small eligible set) is fixed.
 *   • Visual mode UNCHANGED: `Mode`, `EDIT_BURSTS`, `modeAtTime`,
 *     `inEditBurstEnv`, mode-driven cut strides, picker tag prefs, FX
 *     gating (FlashFrame in editBurst only, BeatFlash per-window,
 *     GhostEcho at drops, BassPump). Mode now governs ONLY the visual
 *     cut-density / FX axis; music is a separate, decoupled engine.
 *
 * v47 (2026-05-08) — FOUR FIXES from user review of v46:
 *   1. NO MUSIC GAPS — added 5 low-volume "bed" placements to
 *      MUSIC_PLACEMENTS so 0-240s is *always* covered by at least one
 *      music layer. metro-bed-intro (0-17s, vol 0.18), metro-bed-1
 *      (27-52s, 0.20), metro-bed-2 (68-97s, 0.22), boogie-bed-tail
 *      (128-148s, 0.20), uzi-bed-mid (156-197s, 0.22). These coexist
 *      with the louder feature placements via per-placement <Sequence>
 *      rendering and natural envelope crossfades. Every gap from v46
 *      (0-15, 28-50, 70-95, 130-145, 158-195) is now filled.
 *   2. SPEECH-AWARE CUTS — buildSchedule output post-processed by
 *      `alignVlogCutsToSpeech` which reads each vlog-mode slot's
 *      transcript segments. If a segment straddles the planned slot
 *      boundary, the slot is extended to the segment end + 0.4s and
 *      the next slot's start moves accordingly. Extends only forward,
 *      never trims; cascades through later slots to preserve TOTAL_S.
 *      EditBurst slots stay strict beat-locked.
 *   3. CHRONOLOGICAL POOL — POOL is now explicitly sorted by
 *      (file_date_string, file_idx) extracted from filename. Was sorted
 *      by capture-time previously which could put 06:00 of day N+1
 *      before noon of day N if upload metadata lied. Filename date is
 *      the ground-truth iCloud capture-day. `chronoStart` semantic
 *      preserved (still phase-shifts into the chrono-sorted pool).
 *      Day-stamp overlays now also added to the calm-act schedule by
 *      replacing the hard-coded LocationStamp slots with day-driven
 *      ones derived from the picks chronology.
 *   4. ALL CUTOUTS OFF — `transitionKindForCut` no longer returns
 *      'cutoutSlide'; replaced with whipPan / lightBloom / flashCut.
 *      The `cutoutReveal` upgrade path is gated behind a new prop
 *      `enableCutoutDecorations: false` (default) — when off, no
 *      cutout decorations render at all. The cutoutSlide TransitionKind
 *      enum and rendering code remain intact so the user can re-enable
 *      after the cutout matte pool is improved by reverting the
 *      transitionKindForCut bodies + flipping the prop default.
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  Video as RemotionVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { useWindowedAudioData, visualizeAudio } from '@remotion/media-utils';
import { beatPulse, beatPunch, cameraShake } from '../lib/useBeatPulse';
import { FilmGrain, FlashFrame, LightLeak } from '../overlays/AmbientLayers';
import { RGBSplit, SvgChannelFilters } from '../overlays/RGBSplit';
import { TransitionDecoration, TransitionKind, pickTransitionSfx } from '../transitions/decorations';
import { HeroText, LocationStamp, NoteText, GlitchHeadline } from '../overlays/AnimatedText';
import { FaceTrackedLabel, FaceTrack } from '../overlays/FaceTrackedLabel';
import { FaceSpotlight } from '../overlays/FaceSpotlight';
import { DropPunctuation, DropScalePulse } from '../overlays/DropPunctuation';
import { TripStats } from '../overlays/TripStats';
import { Vignette } from '../overlays/Vignette';
import { BeatFlash } from '../overlays/BeatFlash';
// BoldHeadline import removed in v40 — no longer used.
import { DayCard } from '../overlays/DayCard';
import { CaptionOverlay } from '../overlays/CaptionOverlay';
import { ShutterClose } from '../overlays/ShutterClose';
import { ColdOpenCover } from '../overlays/ColdOpenCover';
import { AudioPulseBars } from '../overlays/AudioPulseBars';
import transcriptsManifest from '../../projects/eurogang/data/eurogang_videos.transcripts.json';
import metroAudio from '../../../public/metro.audio.json';
import boogieAudio from '../../../public/boogie.audio.json';
import uziAudio from '../../../public/uzi.audio.json';
import windowsManifest from '../../projects/eurogang/data/eurogang_videos.windows.json';
import scoredManifest from '../../projects/eurogang/data/eurogang_videos.scored.json';
import tagsManifest from '../../projects/eurogang/data/eurogang_videos.tags.json';
import cutoutsManifest from '../../projects/eurogang/data/eurogang_cutouts.json';
import audioPeaksManifest from '../../projects/eurogang/data/eurogang_videos.audio_peaks.json';
import facesManifest from '../../projects/eurogang/data/eurogang_videos.faces.json';
import captimeManifest from '../../projects/eurogang/data/eurogang_videos.captime.json';
import { MaskRevealWrapper } from '../../projects/eurogang/lib/fx/MaskRevealWrapper';
import { GhostEcho } from '../../projects/eurogang/lib/fx/GhostEcho';

// Face-track lookup: clip file → samples + duration
const FACES: Record<string, FaceTrack> = (facesManifest as { videos: Record<string, FaceTrack> }).videos;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const DATE_RE = /(\d{4})-(\d{2})-(\d{2})/;
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function extractDate(file: string): string | null {
  const m = file.match(DATE_RE);
  return m ? m[0] : null;
}

function formatDateStamp(date: string, dayIndex: number): string {
  const m = date.match(DATE_RE);
  if (!m) return `DAY ${String(dayIndex + 1).padStart(2, '0')}`;
  const month = MONTHS[parseInt(m[2], 10) - 1] ?? m[2];
  return `DAY ${String(dayIndex + 1).padStart(2, '0')} · ${month} ${parseInt(m[3], 10)}`;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

// v39: bumped 90 → 240s per user ("kann alles 5 min gehen") — 4min vlog mode.
// Story-forward calm act 0-95s gives 95s of vlog narrative before the music
// drop hits. Music+comp drop both fire at edit-99s (love_me_again's natural
// drop @ source 99.25s with offset=0). Drop-act runs 99-240s as energetic
// banger-highlight outro.
const TOTAL_S = 240;

/** v46 BEAT-GRID SOURCE — kept private to derive `EDIT_BEATS` / `EDIT_ONSETS`
 *  for the visual cut schedule and FX (BeatFlash, FlashFrame, BassPump, etc).
 *  This is NOT the audio rendering anymore: `MUSIC_PLACEMENTS` (below) is.
 *  The three slots here just describe *which BPM grid governs which comp
 *  time-range* so cuts in 0-92s sit on metro's 107 BPM, 90-162s on boogie's
 *  129 BPM, 160-240s on uzi's 152 BPM. Density escalation purely visual.
 *
 *  Slot 1 boogie sourceStart = 72.39 → boogie's drop @ source 81.39 lands
 *  at comp 99s. Slot 2 uzi sourceStart = 45.7 → uzi's drop @ source 85.7
 *  lands at comp 200s. These two anchor points still drive the DropPunctuation,
 *  GhostEcho and bass_drop SFX timing in the visual layer.
 */
type BeatSlot = {
  file: string;
  bpm: number;
  durationS: number;
  beatsS: number[];
  onsetsS: number[];
  dropTS: number;
  compStartS: number;
  compEndS: number;
  sourceStartS: number;
};

const BEAT_SLOTS: BeatSlot[] = [
  {
    file: 'metro.wav',
    bpm: metroAudio.bpm,
    durationS: metroAudio.duration_s,
    beatsS: metroAudio.beats_s as number[],
    onsetsS: metroAudio.onsets_s as number[],
    dropTS: metroAudio.drop_t_s,
    compStartS: 0,
    compEndS: 92,
    sourceStartS: 0,
  },
  {
    file: 'boogie.wav',
    bpm: boogieAudio.bpm,
    durationS: boogieAudio.duration_s,
    beatsS: boogieAudio.beats_s as number[],
    onsetsS: boogieAudio.onsets_s as number[],
    dropTS: boogieAudio.drop_t_s,
    compStartS: 90,
    compEndS: 162,
    sourceStartS: 72.39, // drop @ source 81.39 → comp 90 + (81.39 − 72.39) = 99
  },
  {
    file: 'uzi.wav',
    bpm: uziAudio.bpm,
    durationS: uziAudio.duration_s,
    beatsS: uziAudio.beats_s as number[],
    onsetsS: uziAudio.onsets_s as number[],
    dropTS: uziAudio.drop_t_s,
    compStartS: 160,
    compEndS: 240,
    sourceStartS: 45.7, // drop @ source 85.7 → comp 160 + (85.7 − 45.7) = 200
  },
];

/** Combined comp-time beat grid: each slot's beats shifted into its time-range.
 *  Cuts in the metro range are ~107 BPM-paced, boogie ~129, uzi ~152 —
 *  natural density escalation per arc, no extra schedule logic needed. */
const EDIT_BEATS: number[] = BEAT_SLOTS
  .flatMap((tr) =>
    tr.beatsS
      .filter((b) => b >= tr.sourceStartS && b < tr.sourceStartS + (tr.compEndS - tr.compStartS))
      .map((b) => tr.compStartS + (b - tr.sourceStartS))
  )
  .filter((t) => t >= 0 && t < TOTAL_S)
  .sort((a, b) => a - b);

const EDIT_ONSETS: number[] = BEAT_SLOTS
  .flatMap((tr) =>
    tr.onsetsS
      .filter((o) => o >= tr.sourceStartS && o < tr.sourceStartS + (tr.compEndS - tr.compStartS))
      .map((o) => tr.compStartS + (o - tr.sourceStartS))
  )
  .filter((t) => t >= 0 && t < TOTAL_S);

/** v46 MUSIC_PLACEMENTS — flexible per-segment music. Each placement renders
 *  as its own <Sequence><Audio/></Sequence>; multiple placements may overlap
 *  (= intentional crossfade) and gaps are allowed (= silence). Decoupled
 *  entirely from vlog/editBurst Mode — base volume per placement, ducked
 *  only by speech duckWindows + cool-sound ambientDucks.
 *
 *  Default set (creative — 13s setter, two drops, an outro overlap):
 *    metro-setter  15-28s,  src 5      vol 0.55  (13s short snippet)
 *    metro-trip    50-70s,  src 18     vol 0.60  ("we're going" energy)
 *    boogie-drop   95-130s, src 77.39  vol 0.85  (drop @ comp 99)
 *    uzi-early    145-158s, src 30     vol 0.55  (mid uzi reuse)
 *    uzi-drop     195-225s, src 80.7   vol 0.85  (drop @ comp 200)
 *    metro-outro  220-240s, src 70     vol 0.50  (overlaps uzi-drop tail)
 *
 *  Crossfade verification: uzi-drop fadeOut starts at 222s (225 - 3s fadeOut)
 *  while metro-outro fadeIn starts at 220s and finishes at 222s. Both render
 *  simultaneously across 220-225s — listener hears the cross.
 */
type MusicPlacement = {
  id: string;
  file: string;
  compStartS: number;
  compEndS: number;
  srcOffsetS: number;
  fadeInS: number;
  fadeOutS: number;
  baseVol: number;
};

const MUSIC_PLACEMENTS: MusicPlacement[] = [
  // ---------------------------------------------------------------------------
  // v47 BRIDGE BEDS — low-volume ambient layers that fill v46's silent gaps.
  // Each bed coexists with the louder feature placements below via the
  // per-placement <Sequence> rendering; envelope crossfades happen naturally
  // at any overlap. Beds duck like any placement (×0.28 on speech, ×0.55 on
  // peaks). Result: music is ALWAYS audible at some level across 0-240s.
  // ---------------------------------------------------------------------------
  { id: 'metro-bed-intro', file: 'metro.wav',  compStartS:   0, compEndS:  17, srcOffsetS:   0, fadeInS: 1.0, fadeOutS: 1.5, baseVol: 0.18 },
  { id: 'metro-bed-1',     file: 'metro.wav',  compStartS:  27, compEndS:  52, srcOffsetS:  22, fadeInS: 1.0, fadeOutS: 1.0, baseVol: 0.20 },
  { id: 'metro-bed-2',     file: 'metro.wav',  compStartS:  68, compEndS:  97, srcOffsetS:  38, fadeInS: 0.8, fadeOutS: 1.5, baseVol: 0.22 },
  { id: 'boogie-bed-tail', file: 'boogie.wav', compStartS: 128, compEndS: 148, srcOffsetS: 100, fadeInS: 1.5, fadeOutS: 1.0, baseVol: 0.20 },
  { id: 'uzi-bed-mid',     file: 'uzi.wav',    compStartS: 156, compEndS: 197, srcOffsetS:  50, fadeInS: 1.0, fadeOutS: 0.5, baseVol: 0.22 },

  // ---------------------------------------------------------------------------
  // FEATURE PLACEMENTS (v46) — louder, anchor-the-section music
  // ---------------------------------------------------------------------------
  // 13s metro setter — light opener under intro narration
  { id: 'metro-setter', file: 'metro.wav',  compStartS:  15, compEndS:  28, srcOffsetS:  5,           fadeInS: 0.6, fadeOutS: 1.0, baseVol: 0.55 },
  // metro trip-edit — "we're going to Amsterdam" energy
  { id: 'metro-trip',   file: 'metro.wav',  compStartS:  50, compEndS:  70, srcOffsetS: 18,           fadeInS: 0.5, fadeOutS: 0.8, baseVol: 0.60 },
  // Drop 1 — boogie HOT (drop @ source 81.39 lands at comp 99)
  { id: 'boogie-drop',  file: 'boogie.wav', compStartS:  95, compEndS: 130, srcOffsetS: 81.39 - 4,    fadeInS: 1.0, fadeOutS: 2.0, baseVol: 0.85 },
  // Mid uzi early — creative re-use before the main drop
  { id: 'uzi-early',    file: 'uzi.wav',    compStartS: 145, compEndS: 158, srcOffsetS: 30,           fadeInS: 0.5, fadeOutS: 1.0, baseVol: 0.55 },
  // Drop 2 — uzi MAIN (drop @ source 85.7 lands at comp 200)
  { id: 'uzi-drop',     file: 'uzi.wav',    compStartS: 195, compEndS: 225, srcOffsetS: 85.7  - 5,    fadeInS: 1.0, fadeOutS: 3.0, baseVol: 0.85 },
  // Outro overlap: metro returns under uzi tail for nostalgic close
  { id: 'metro-outro',  file: 'metro.wav',  compStartS: 220, compEndS: 240, srcOffsetS: 70,           fadeInS: 2.0, fadeOutS: 1.5, baseVol: 0.50 },
];

// -----------------------------------------------------------------------------
// Schedule: every cut starts ON a beat. Stride varies by act AND mode (v45).
// -----------------------------------------------------------------------------

type Act = 'calm' | 'build' | 'drop';

/**
 * v45 ARCHITECTURE — `Mode` is the *presentation mode* of the slot:
 *
 *   - 'vlog' (default, ~63% of timeline): clip-source audio is the
 *     foreground, music sits at vol 0.07 ambient. Cuts follow speech
 *     rhythm (stride 6-12 ≈ 3-6s). FX-light. Picker prefers talking_clear.
 *   - 'editBurst' (~37%, 6 windows): music ramps to vol 0.85 and clip
 *     audio drops to ~0.18. Cuts beat-locked (stride 1-2 ≈ 0.4-1s).
 *     FX-heavy (FlashFrame, BeatFlash, GhostEcho at drops). Picker
 *     prefers silent / talking_noisy clips.
 *
 * See `feedback_eurogang_vlog_vs_edit_architecture.md` for the full why.
 */
export type Mode = 'vlog' | 'editBurst';
type CutSlot = { startS: number; durationS: number; act: Act; mode: Mode };

/** v45 EDIT_BURSTS — explicit time windows where the comp switches from
 *  vlog mode to editBurst. Six windows, ~90s of the 240s timeline (37%).
 *  Each window names its dominant track so the audio engine knows which
 *  track to ramp to 0.85 (others stay at 0.07 ambient). */
type EditBurst = {
  startS: number;
  endS: number;
  trackKey: 'metro' | 'boogie' | 'uzi';
};

const EDIT_BURSTS: EditBurst[] = [
  { startS:  15, endS:  25, trackKey: 'metro'  }, // 1: light setter, opening montage
  { startS:  50, endS:  65, trackKey: 'metro'  }, // 2: "we're going to Amsterdam" trip-edit
  { startS:  95, endS: 115, trackKey: 'boogie' }, // 3: DROP 1 — biggest of early act (drop @ 99s)
  { startS: 145, endS: 160, trackKey: 'boogie' }, // 4: mid-section vibes
  { startS: 195, endS: 220, trackKey: 'uzi'    }, // 5: DROP 2 — biggest overall (drop @ 200s)
  { startS: 235, endS: 240, trackKey: 'uzi'    }, // 6: hero-outro punctuation
];

/** Crossfade window at each editBurst boundary — 0.5s linear ramp on both
 *  music volume (0.07 ↔ 0.85 on the active track) AND clip-source audio
 *  (1.15 ↔ 0.18 × normFactor). Reads at boundaries from `inEditBurstEnv`. */
const EDIT_BURST_FADE_S = 0.5;

/** Returns the EditBurst window containing t, or null. */
function editBurstAtTime(t: number): EditBurst | null {
  for (const w of EDIT_BURSTS) {
    if (t >= w.startS && t < w.endS) return w;
  }
  return null;
}

function modeAtTime(t: number): Mode {
  return editBurstAtTime(t) ? 'editBurst' : 'vlog';
}

/**
 * Returns a 0..1 envelope describing how "inside" t is of any editBurst
 * window, with a 0.5s linear ramp at boundaries. 0 = pure vlog, 1 = full
 * editBurst, intermediate during the crossfade.
 *
 * Drives both music-volume ramps (0.07 ↔ 0.85 on the editBurst's active
 * track) and clip-source audio ramps (1.15 ↔ 0.18 × normFactor).
 */
function inEditBurstEnv(t: number): number {
  let env = 0;
  for (const w of EDIT_BURSTS) {
    const f = EDIT_BURST_FADE_S;
    // Pre-roll fade-in: [start - f, start] from 0 → 1 (anticipates entry)
    // Inside window:   [start, end]            = 1
    // Post-roll fade-out: [end, end + f]       = 1 → 0
    if (t < w.startS - f || t > w.endS + f) continue;
    let local: number;
    if (t < w.startS) local = (t - (w.startS - f)) / f;       // ramp in
    else if (t < w.endS) local = 1;
    else local = 1 - (t - w.endS) / f;                          // ramp out
    if (local > env) env = local;
  }
  return Math.max(0, Math.min(1, env));
}

// v46: editBurstTrackIdxAtTime removed — was only used by the v45
// makeTrackVolume mode-gated music. v46 music is decoupled from mode
// (see makePlacementVolume + MUSIC_PLACEMENTS). EditBurst.trackKey is
// retained on the type for documentation / future reuse but no longer
// drives any audio decision.

// v39: act boundaries pushed back for 4min vlog-mode story arc.
// calm  0-95s  = vlog narrative pace (slow cuts, captions, talking)
// build 95-99s = 4s build into music drop
// drop  99-240s = banger outro section, energetic highlights
function actAtTime(t: number): Act {
  if (t < 95) return 'calm';
  if (t < 99) return 'build';
  return 'drop';
}

function buildSchedule(): CutSlot[] {
  // v45: Mode drives stride. The act 'calm'|'build'|'drop' is kept for
  // grade transitions and the 4-frame riser, but the cut density is now
  // entirely a function of `mode`:
  //   - vlog mode      → stride 6-12 (3-6s cuts, follow speech rhythm)
  //   - editBurst mode → stride 1-2  (0.4-1s, beat-locked)
  // Pick which beats become cut boundaries.
  const cutBeatTimes: { t: number; act: Act; mode: Mode }[] = [];
  let lastCutBeatIdx = -10;

  for (let i = 0; i < EDIT_BEATS.length; i++) {
    const t = EDIT_BEATS[i];
    const act = actAtTime(t);
    const mode = modeAtTime(t);

    let stride: number;
    // Hero-outro: hold a single slot to TOTAL_S (preserved from v44).
    if (t >= 235) {
      stride = 999;
    } else if (act === 'build') {
      // 4-frame riser into drop 1 — keep the v44 ramp behaviour so the
      // drop punctuation lands cleanly at 99s.
      const buildPos = (t - 95) / 4;
      stride = buildPos < 0.5 ? 2 : 1;
    } else if (mode === 'editBurst') {
      // Beat-locked: alternate stride 1 / 2 to give a tight 0.4-1s rhythm
      // without dropping below source clip min-duration (~0.18s). The
      // drop-bursts (95-115, 195-220) sit on stride-1 most of the time
      // because their beat-grid is denser at 129/152 BPM.
      const inBurst = editBurstAtTime(t);
      if (inBurst && (inBurst.trackKey === 'boogie' || inBurst.trackKey === 'uzi')) {
        // Drop-grade bursts: tighter — 1, 1, 2, 1, 1, 2, ...
        stride = i % 3 === 2 ? 2 : 1;
      } else {
        // Setter-grade bursts (metro): 1, 2, 1, 2 alternation
        stride = i % 2 === 0 ? 1 : 2;
      }
    } else {
      // Vlog mode: longer cuts that follow speech rhythm rather than
      // beat-grid. Stride 8 ≈ 3-4s @ 107 BPM (metro section). We let
      // the cuts skip 7-of-8 beats so the eye can settle and any
      // speech audio underneath has room to read.
      stride = 8;
    }

    if (i - lastCutBeatIdx >= stride) {
      cutBeatTimes.push({ t, act, mode });
      lastCutBeatIdx = i;
    }
  }

  // Convert to slots; duration of slot k = next-cut.startS - this.startS
  const slots: CutSlot[] = [];
  for (let k = 0; k < cutBeatTimes.length; k++) {
    const startS = cutBeatTimes[k].t;
    const endS = k + 1 < cutBeatTimes.length ? cutBeatTimes[k + 1].t : TOTAL_S;
    const dur = endS - startS;
    if (dur < 0.18) continue; // skip degenerate
    slots.push({
      startS,
      durationS: dur,
      act: cutBeatTimes[k].act,
      mode: cutBeatTimes[k].mode,
    });
  }

  // If first beat is > 0.3s in, prepend an opening slot from 0 to first beat
  if (slots.length === 0 || slots[0].startS > 0.3) {
    slots.unshift({
      startS: 0,
      durationS: slots[0]?.startS ?? TOTAL_S,
      act: 'calm',
      mode: 'vlog',
    });
  }
  return slots;
}

// v47: SCHEDULE is now built in TWO PASSES — raw-from-beat-grid first, then
// post-processed by `alignVlogScheduleToSpeech` after a preliminary pick run
// so vlog-mode slot boundaries don't chop a speaker mid-sentence. The second
// pass replaces the ref below; everything that consumes SCHEDULE downstream
// (transitions, maskRevealMap, deriveVariant, debug HUD) reads the aligned
// version. EditBurst slots are NOT touched — music dominates there and beat-
// locked cuts are intentional.
let SCHEDULE: CutSlot[] = buildSchedule();

// ---------------------------------------------------------------------------
// v47 Transcript segments — pulled out to module scope so the schedule
// aligner can read speech-end timings without duplicating the import. The
// existing TRANSCRIPTS const further down (caption gating) keeps its
// narrower type for backwards compat.
// ---------------------------------------------------------------------------
type TranscriptSegment = { start: number; end: number; text?: string };
const TRANSCRIPT_SEGMENTS: Record<string, TranscriptSegment[]> = (() => {
  const all = (transcriptsManifest as {
    transcripts: Record<string, { segments?: TranscriptSegment[] }>;
  }).transcripts;
  const out: Record<string, TranscriptSegment[]> = {};
  for (const [file, t] of Object.entries(all)) {
    if (Array.isArray(t.segments) && t.segments.length > 0) out[file] = t.segments;
  }
  return out;
})();

/**
 * v47 — speech-aware vlog cut alignment.
 *
 * For each vlog-mode slot whose picked clip has whisper-derived speech
 * segments, find any segment that STRADDLES the slot's source-time end
 * (i.e. seg.start < endSrc < seg.end). If found, push slot.endS forward to
 * the segment's end + 0.4s padding, capped at:
 *   - the picked clip's available source duration
 *   - max +2.0s extension (don't blow past beat grid by absurd amounts)
 *   - the next non-vlog (editBurst) slot start (never overrun a music burst)
 *
 * Cascades: extension on slot k pushes slot k+1's startS forward, which
 * may shorten or eliminate slot k+1 if it's also vlog. EditBurst slots are
 * preserved — if cascading would push into one, we trim the cascading
 * slot's duration instead. Total schedule length stays at TOTAL_S; if we
 * lose room at the tail we drop trailing slots that would shrink below
 * the 0.18s degenerate floor.
 */
function alignVlogScheduleToSpeech(
  rawSchedule: CutSlot[],
  picks: { meta: ScoredVideo; sourceStartS: number }[]
): CutSlot[] {
  const MAX_EXTENSION_S = 2.0;
  const SPEECH_PAD_S = 0.4;
  const next = rawSchedule.map((s) => ({ ...s }));

  for (let i = 0; i < next.length; i++) {
    const slot = next[i];
    if (slot.mode !== 'vlog') continue;
    const pick = picks[i];
    if (!pick) continue;
    const segs = TRANSCRIPT_SEGMENTS[pick.meta.file];
    if (!segs || segs.length === 0) continue;

    const slotEndS = slot.startS + slot.durationS;
    const endSrc = pick.sourceStartS + slot.durationS;

    // Find a segment whose source-time interval straddles endSrc.
    // (segment is mid-sentence at the cut)
    let straddler: TranscriptSegment | null = null;
    for (const seg of segs) {
      if (seg.start < endSrc - 0.05 && seg.end > endSrc + 0.05) {
        straddler = seg;
        break;
      }
    }
    if (!straddler) continue;

    // Compute desired source-time end (segment-end + 0.4s pad).
    const desiredEndSrc = straddler.end + SPEECH_PAD_S;
    let extraS = desiredEndSrc - endSrc;
    if (extraS <= 0) continue;

    // Cap extension by clip availability
    const availableSrc = pick.meta.duration - pick.sourceStartS - 0.05;
    const allowedByClip = Math.max(0, availableSrc - slot.durationS);
    if (allowedByClip <= 0) continue;
    extraS = Math.min(extraS, allowedByClip, MAX_EXTENSION_S);

    // Don't overrun the next editBurst slot if any sits ahead within reach.
    let editBurstAhead: number | null = null;
    for (let j = i + 1; j < next.length; j++) {
      if (next[j].mode === 'editBurst') {
        editBurstAhead = next[j].startS;
        break;
      }
    }
    if (editBurstAhead != null) {
      const headroom = editBurstAhead - slotEndS;
      if (headroom <= 0.05) continue;
      extraS = Math.min(extraS, headroom - 0.05);
    } else {
      const headroom = TOTAL_S - slotEndS;
      if (headroom <= 0.05) continue;
      extraS = Math.min(extraS, headroom - 0.05);
    }
    if (extraS <= 0.05) continue;

    // Apply: extend this slot, cascade-shift later vlog slots' startS.
    slot.durationS += extraS;
    for (let j = i + 1; j < next.length; j++) {
      const ahead = next[j];
      if (ahead.mode === 'editBurst') break;
      const newStart = ahead.startS + extraS;
      const oldEnd = ahead.startS + ahead.durationS;
      const newDur = oldEnd - newStart;
      if (newDur < 0.18) {
        ahead.startS = newStart;
        ahead.durationS = 0; // mark for filter-out
      } else {
        ahead.startS = newStart;
        ahead.durationS = newDur;
      }
    }
  }

  return next.filter((s) => s.durationS >= 0.18);
}

// (the actual prelim-pick + alignment IIFE runs further down — see below
//  AFTER POOL / TAGS / CUTOUT_* / SKIP_FILES are all initialized so
//  pickClipsChronological doesn't hit TDZ on its closure deps.)

// v44: MaskReveal transition runs 18 frames total (12 phase-1 silhouette
// fade-in + 6 phase-2 expansion). MaskRevealWrapper reads these constants
// to drive its two-phase animation; the SCHEDULE.map outgoing-extension
// adds MASK_REVEAL_FRAMES to the previous slot's durationInFrames so V1
// keeps playing under the reveal.
const MASK_REVEAL_FRAMES = 18;

// -----------------------------------------------------------------------------
// FX FLOW-BLUR — Ref 4 (leev.vfx) — heavy-blur cut that fuses adjacent clips.
// -----------------------------------------------------------------------------

/** Frames the flowBlur transition runs for. Triangular blur curve: 0 → 25 → 0
 *  with the peak at the cut frame. Outgoing clip extends by this many frames
 *  past its scheduled cut so both clips overlap during the blur window. Same
 *  number drives the halation + color-grade overlay envelopes. */
const FLOW_BLUR_FRAMES = 18;

/** Local extension of TransitionKind for the FlowBlur transition. Intentionally
 *  not added to core/transitions/decorations.tsx — the blur happens by wrapping
 *  each clip's container, not by emitting a TransitionDecoration overlay. */
type FxTransitionKind = TransitionKind | 'flowBlur';

/**
 * Cubic ease-in-out — smooth ramp at both ends of the triangular curve.
 * Used for the blur peak shaping so the optical-merge moment doesn't feel
 * linear/mechanical.
 */
function easeInOutCubic(t: number): number {
  if (t < 0.5) return 4 * t * t * t;
  const f = -2 * t + 2;
  return 1 - (f * f * f) / 2;
}

/**
 * Triangular blur amount sampled at `framesFromBoundary` (signed: negative on
 * the OUTGOING side of the cut, positive on the INCOMING side, 0 at the cut).
 * Returns blur in pixels; peak FLOW_BLUR_PEAK_PX at boundary, 0 at the edges
 * of the FLOW_BLUR_FRAMES window. Eased with cubic in/out.
 */
const FLOW_BLUR_PEAK_PX = 25;
function flowBlurAmount(framesFromBoundary: number): number {
  const dist = Math.abs(framesFromBoundary);
  if (dist >= FLOW_BLUR_FRAMES) return 0;
  // dist 0 → t=1 (peak), dist FLOW_BLUR_FRAMES → t=0 (edge)
  const t = 1 - dist / FLOW_BLUR_FRAMES;
  return easeInOutCubic(t) * FLOW_BLUR_PEAK_PX;
}

/**
 * FlowBlurOutgoingWrapper — wraps the OUTGOING clip's render during the cut
 * boundary window. Applies a triangular blur whose peak coincides with the
 * cut frame. The clip is alive for `durFrames + FLOW_BLUR_FRAMES` total
 * frames; for the first `durFrames` it renders sharp, for the trailing
 * FLOW_BLUR_FRAMES it ramps blur 0 → peak (peak at frame durFrames−1, the
 * cut frame). Wrapper opacity also fades from 1 → 0 across the trailing
 * window so the incoming clip can dominate after the peak.
 *
 * Always renders the same div structure (no conditional unmounting) so the
 * inner OffthreadVideo is not torn down mid-animation.
 */
const FlowBlurOutgoingWrapper: React.FC<{
  /** True iff this slot's NEXT cut is a flowBlur; otherwise pure passthrough. */
  active: boolean;
  /** Original (un-extended) slot duration in frames. The cut frame = durFrames. */
  durFrames: number;
  children: React.ReactNode;
}> = ({ active, durFrames, children }) => {
  const frame = useCurrentFrame();
  if (!active) return <>{children}</>;
  // Frame relative to the scheduled cut (frame durFrames). Negative before, 0 at cut.
  const framesFromBoundary = frame - durFrames;
  const inWindow = framesFromBoundary > -FLOW_BLUR_FRAMES && framesFromBoundary < FLOW_BLUR_FRAMES;
  const blurPx = inWindow ? flowBlurAmount(framesFromBoundary) : 0;
  // Opacity fade-out across the post-cut tail so V2 dominates after peak.
  // Pre-cut frames (framesFromBoundary <= 0): full opacity.
  // Post-cut frames (0..FLOW_BLUR_FRAMES): linear 1 → 0.
  let opacity = 1;
  if (framesFromBoundary > 0) {
    opacity = Math.max(0, 1 - framesFromBoundary / FLOW_BLUR_FRAMES);
  }
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        filter: blurPx > 0 ? `blur(${blurPx.toFixed(2)}px)` : undefined,
        opacity,
        willChange: 'filter, opacity',
      }}
    >
      {children}
    </div>
  );
};

/**
 * FlowBlurIncomingWrapper — wraps the INCOMING clip during the first
 * FLOW_BLUR_FRAMES of its render. Applies the symmetric triangular blur
 * (peak at frame 0 = cut frame, fading to 0 at frame FLOW_BLUR_FRAMES).
 * Halation + color-grade overlays render here too, scoped to the same
 * 18-frame envelope so they only appear during the optical-merge window.
 */
const FlowBlurIncomingWrapper: React.FC<{
  /** True iff THIS slot is the incoming side of a flowBlur cut. */
  active: boolean;
  children: React.ReactNode;
}> = ({ active, children }) => {
  const frame = useCurrentFrame();
  if (!active) return <>{children}</>;
  const inWindow = frame < FLOW_BLUR_FRAMES;
  // Symmetric: at frame 0 (cut) blur is peak, at frame FLOW_BLUR_FRAMES it's 0.
  const blurPx = inWindow ? flowBlurAmount(frame) : 0;
  // Halation + grade envelope: triangular 0 → 1 → 0 across the window, peak at cut.
  // Reuses the same eased ramp via flowBlurAmount() / FLOW_BLUR_PEAK_PX normalization.
  const envelope = inWindow ? flowBlurAmount(frame) / FLOW_BLUR_PEAK_PX : 0;
  const halationOpacity = envelope * 0.4;
  const gradeOpacity = envelope * 0.3;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        filter: blurPx > 0 ? `blur(${blurPx.toFixed(2)}px)` : undefined,
        willChange: 'filter',
      }}
    >
      {children}
      {inWindow && halationOpacity > 0 && (
        // Halation layer — re-renders the children blurred + over-bright,
        // composited via screen blend for the "lights leak out" glow.
        <div
          style={{
            position: 'absolute',
            inset: 0,
            mixBlendMode: 'screen',
            opacity: halationOpacity,
            filter: 'blur(40px) brightness(2.0) contrast(1.5)',
            pointerEvents: 'none',
            willChange: 'opacity',
          }}
        >
          {children}
        </div>
      )}
      {inWindow && gradeOpacity > 0 && (
        // Color-grade layer — subtle teal/amber shift snaps the look to the
        // leev.vfx aesthetic. hue-rotate(-5deg) cools shadows, saturate(1.2)
        // pumps the highlights.
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: gradeOpacity,
            filter: 'hue-rotate(-5deg) saturate(1.2)',
            pointerEvents: 'none',
            willChange: 'opacity',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Transition kind picker — deterministic per cut, shaped by act
// -----------------------------------------------------------------------------

/**
 * v35: when this cut spans a day-boundary in the chronological story
 * (clip[idx-1] captured on day X, clip[idx] captured on day X+1), force a
 * whipPan transition. Reinforces story progression — viewer feels "next day"
 * via the visual sweep. Only applied in calm/build acts; drop has its own
 * rotation that benefits from variety.
 */
function transitionKindForCut(slot: CutSlot, idx: number, isDayBoundary = false): TransitionKind {
  // ---------------------------------------------------------------------------
  // v47: cutout transitions disabled per user request — the existing cutout
  // matte pool produces visible artifacts at the silhouette edges. The
  // 'cutoutSlide' TransitionKind enum value and its rendering branch in
  // TransitionDecoration / pickClipsChronological / cutoutReveal upgrade path
  // remain intact so this is a one-line revert: replace the three calm/build/
  // drop fallthroughs below with the original `return 'cutoutSlide'` lines
  // (and flip enableCutoutDecorations default to true) once the cutout pool
  // is improved via extract_cutouts.py.
  // ---------------------------------------------------------------------------
  if (isDayBoundary && (slot.act === 'calm' || slot.act === 'build')) {
    return 'whipPan';
  }
  if (slot.act === 'calm') {
    // v40: vlog-mode calm act gets more visible transitions. v47: cutoutSlide
    // every-4th replaced with whipPan; lightBloom + whipPan for the rest.
    if (idx % 4 === 3) return 'whipPan';        // v47: was 'cutoutSlide'
    if (idx % 3 === 2) return 'lightBloom';
    if (idx % 5 === 4) return 'whipPan';
    return 'none';
  }
  if (slot.act === 'build') {
    if (slot.startS > 27) return 'glitchSlice';
    if (idx % 5 === 0) return 'flashCut';        // v47: was 'cutoutSlide'
    return idx % 2 === 0 ? 'whipPan' : 'flashCut';
  }
  // Drop act: rotate through a 7-element groove. v47: rot===2 cutoutSlide
  // swapped for lightBloom to keep variety without the cutout figure.
  const rot = idx % 7;
  if (slot.durationS < 0.5) return rot < 3 ? 'flashCut' : 'whipPan';
  if (rot === 0) return 'whipPan';
  if (rot === 1) return 'zoomPunch';
  if (rot === 2) return 'lightBloom';            // v47: was 'cutoutSlide'
  if (rot === 3) return 'whipPan';
  if (rot === 4) return 'glitchSlice';
  if (rot === 5) return 'flashCut';
  return 'lightBloom';
}

function transitionDirection(idx: number): 'left' | 'right' | 'up' | 'down' {
  const dirs: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'right', 'left', 'down'];
  return dirs[idx % dirs.length];
}

// -----------------------------------------------------------------------------
// Clip pool: chronological, quality-filtered, with best-window lookup
// -----------------------------------------------------------------------------

type WindowEntry = { start_s: number; score: number };
type ScoredVideo = {
  file: string;
  duration: number;
  width: number;
  height: number;
  aspect: number;
  brightness: number;
  motion_mean: number;
  motion_std: number;
  quality: number;
  windows: Record<string, WindowEntry>;
};

// Prefer the v2 windows manifest if non-empty; otherwise fall back to v1 scored data
const RAW_VIDEOS: ScoredVideo[] = (windowsManifest.videos as ScoredVideo[]).length > 0
  ? (windowsManifest.videos as ScoredVideo[])
  // Synthesize a minimal record from the v1 scored manifest for the fallback path
  : (scoredManifest.videos as Array<{
      file: string; duration: number; width: number; height: number; aspect: number;
      brightness: number; motion: number; energy: number;
    }>).map((v) => ({
      file: v.file,
      duration: v.duration,
      width: v.width,
      height: v.height,
      aspect: v.aspect,
      brightness: v.brightness,
      motion_mean: v.motion,
      motion_std: 0,
      quality: v.energy,
      windows: {} as Record<string, WindowEntry>,
    }));

// v33: floor lowered 0.65 → 0.40 per user ("fast alle clips") — keeps ~90%
// of pool. Trade some heuristic-quality for breadth: more variety per day,
// less risk of picker skipping a chronological position because all candidates
// got cut. Bad picks still surface via debug HUD blacklist if needed.
const QUALITY_FLOOR = 0.40;

// User-flagged clips to exclude from picking (extreme close-ups, weird angles,
// quality issues the heuristic score didn't catch). Add filenames here as the
// user reviews via the debug HUD.
const BLACKLIST: Set<string> = new Set([
  'eurogang_videos/039_2026-05-03_018f083a55.mp4', // v29: extreme face close-up (mouth/teeth fill frame)
]);

// v33: capture-time map from Apple Photos SQLite — actual recording timestamp,
// not iCloud upload time. v47: kept available for the DebugClipHud capture-time
// readout and the day-boundary detection in the transition loop, but no longer
// used as the primary POOL sort key (see filenameChronoKey below).
const CAPTIME: Record<string, string> = captimeManifest as Record<string, string>;

const FILE_IDX_RE = /\/(\d+)_(\d{4}-\d{2}-\d{2})_/;

/**
 * v47: filename-derived chronological sort key.
 *
 *   "eurogang_videos/039_2026-05-03_018f083a55.mp4"
 *      → date "2026-05-03", idx 39
 *      → key "2026-05-03|0000000039"
 *
 * The iCloud download names are date-prefixed by the source export, so the
 * filename date is the ground-truth capture-day. Within a day we sort by the
 * leading numeric index — which corresponds to upload order, generally
 * monotonic with capture-time-of-day on a single device per day. Falls back
 * to the bare filename for the rare clip that doesn't match the pattern.
 *
 * Why not CAPTIME? CAPTIME is best-effort from Apple Photos SQLite and was
 * found to occasionally place day N+1 06:00 clips ahead of day N noon clips
 * when iCloud sync re-stamped them. Filename date is locked at export time.
 */
function filenameChronoKey(v: ScoredVideo): string {
  const m = v.file.match(FILE_IDX_RE);
  if (!m) return v.file;
  const date = m[2];
  const idx = parseInt(m[1], 10);
  return `${date}|${String(idx).padStart(10, '0')}`;
}

const POOL: ScoredVideo[] = RAW_VIDEOS
  .filter((v) => v.aspect < 1.05)            // portrait only (target 9:16)
  .filter((v) => v.quality >= QUALITY_FLOOR) // drop boring/shaky
  .filter((v) => !BLACKLIST.has(v.file))     // user-flagged exclusions
  // v47: chronological by (filename-date, file-idx). Was capture-time-based;
  // filename date proven more reliable for day-boundary correctness.
  .sort((a, b) => filenameChronoKey(a).localeCompare(filenameChronoKey(b)));

function closestWindow(windows: Record<string, WindowEntry>, target: number): WindowEntry | null {
  const keys = Object.keys(windows);
  if (keys.length === 0) return null;
  let bestKey = keys[0];
  let bestDiff = Infinity;
  for (const k of keys) {
    const d = parseFloat(k);
    const diff = Math.abs(d - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestKey = k;
    }
  }
  return windows[bestKey];
}

// Per-clip content tag from Whisper-derived classifier
type ContentTag = 'talking_clear' | 'talking_noisy' | 'silent';
const TAGS = (tagsManifest as { tags: Record<string, ContentTag> }).tags;
const CUE_FILES = new Set(
  (tagsManifest as { cue_clips: { file: string; hits: string[] }[] }).cue_clips.map((c) => c.file)
);

function tagFor(file: string): ContentTag {
  return TAGS[file] ?? 'silent';
}

/** v45: Per-mode preference order for picking content tag. First match wins.
 *  - vlog slot     → talking_clear ▸ talking_noisy ▸ silent (speech is the foreground)
 *  - editBurst     → silent ▸ talking_noisy ▸ talking_clear (visually-rich, music-amenable;
 *    speech is irrelevant since clip audio is ducked to ~0.18 here)
 *  Build act is treated as editBurst-flavour because it's a riser slot.
 */
function preferredTagsForMode(mode: Mode, act: Act): ContentTag[] {
  if (mode === 'editBurst' || act === 'build') {
    return ['silent', 'talking_noisy', 'talking_clear'];
  }
  return ['talking_clear', 'talking_noisy', 'silent'];
}

/** Backwards-compat alias kept for the DebugClipHud "why" reasoning. */
function preferredTagsForAct(_act: Act): ContentTag[] {
  // Legacy callers fall back to vlog-style prefs; HUD only uses this for
  // human-readable "1st-choice" labelling and is non-critical.
  return ['talking_clear', 'talking_noisy', 'silent'];
}

/** Cutouts available for cutoutSlide transitions.
 *  Hoisted above pickClipsChronological / deriveVariant — DEFAULT_VARIANT runs
 *  at module load and reads CUTOUT_SUBJECT_BY_SOURCE, so these consts must
 *  initialize first (TDZ otherwise). */
const CUTOUT_FILES: string[] = (cutoutsManifest as { cutouts: { file: string }[] }).cutouts.map((c) => c.file);

/** v36: map source clip → matching cutout PNG. The cutoutSlide transition
 *  uses the cutout from the NEXT clip — viewer sees that clip's person enter
 *  during clip 1, settle, then clip 2 cuts in behind them. */
const CUTOUT_BY_SOURCE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  const cuts = (cutoutsManifest as { cutouts: { file: string; source_clip: string }[] }).cutouts;
  for (const c of cuts) m[c.source_clip] = c.file;
  return m;
})();

/** v40: prefer matching cutout, fall back to deterministic-random when none.
 *  Random fallback ensures the cutoutSlide transition always has a figure. */
function pickCutoutForNextClip(nextFile: string | undefined, idx: number): string | undefined {
  if (nextFile && CUTOUT_BY_SOURCE[nextFile]) return CUTOUT_BY_SOURCE[nextFile];
  if (CUTOUT_FILES.length === 0) return undefined;
  let h = 2166136261 >>> 0;
  const s = 'cutout-fb:' + idx;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return CUTOUT_FILES[(h >>> 0) % CUTOUT_FILES.length];
}

/** v44: alpha-channel webm map for clips with eligible (high-matte-quality)
 *  cutouts. When a cutoutSlide transition would fire AND the next clip has
 *  a subject_webm available, we upgrade to cutoutReveal — a position-locked
 *  live-video subject overlay (subject moves on top of clip A, then clip B
 *  reveals around it). */
const CUTOUT_SUBJECT_BY_SOURCE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  const cuts = (cutoutsManifest as { cutouts: { source_clip: string; subject_webm?: string; eligible?: boolean }[] }).cutouts;
  for (const c of cuts) {
    if (c.eligible && c.subject_webm) m[c.source_clip] = c.subject_webm;
  }
  return m;
})();

function pickSubjectWebmForNextClip(nextFile: string | undefined): string | undefined {
  return nextFile ? CUTOUT_SUBJECT_BY_SOURCE[nextFile] : undefined;
}

/**
 * v44.1: skip-list for clips the user explicitly demoted (e.g. yellow food
 * shot that read as too prominent foreground). Identified via dom_hue 60-75 +
 * high saturation in the scored.json metadata. Picker treats these as `used`
 * before iteration starts so they never make it into the schedule.
 */
const SKIP_FILES = new Set<string>([
  'eurogang_videos/031_2026-05-02_01acb98966.mp4',
  'eurogang_videos/228_2026-05-01_0158084349.mp4',
]);

/**
 * Pick clips chronologically. `chronoStart` shifts the anchor index into POOL —
 * 0 = start at the very first day, POOL.length/2 = start in the middle and wrap.
 * This is the only knob that gives a *different* edit from the same source pool
 * while keeping the chronological + no-dup invariants.
 */
function pickClipsChronological(chronoStart = 0): { meta: ScoredVideo; sourceStartS: number }[] {
  const out: { meta: ScoredVideo; sourceStartS: number }[] = [];
  const used = new Set<string>(SKIP_FILES);
  let cursor = ((chronoStart % POOL.length) + POOL.length) % POOL.length;

  // v44: pre-compute which slot indices will get a cutoutSlide transition
  // (the cut BEFORE this slot is cutoutSlide). Picker prefers eligible-for-
  // reveal clips at those slots so the cutoutReveal mechanic actually fires.
  const cutoutSlideSlots = new Set<number>();
  for (let i = 1; i < SCHEDULE.length; i++) {
    if (transitionKindForCut(SCHEDULE[i], i, false) === 'cutoutSlide') {
      cutoutSlideSlots.add(i);
    }
  }

  for (let slotIdx = 0; slotIdx < SCHEDULE.length; slotIdx++) {
    const slot = SCHEDULE[slotIdx];
    // v45: tag prefs driven by mode, not act.
    const tagPrefs = preferredTagsForMode(slot.mode, slot.act);
    const prioritiseCues = slot.mode === 'vlog' && slot.act === 'calm' && slotIdx < 2;
    const prioritiseRevealEligible = cutoutSlideSlots.has(slotIdx);

    let chosen: ScoredVideo | null = null;

    // v44: first try to find an eligible-for-reveal clip if this slot is at
    // a cutoutSlide cut position. Falls through to normal tag-pref scan if
    // no eligible clip available within scan range.
    if (prioritiseRevealEligible) {
      let advanced = 0;
      while (advanced < POOL.length && !chosen) {
        const cand = POOL[(cursor + advanced) % POOL.length];
        advanced++;
        if (used.has(cand.file)) continue;
        if (cand.duration < slot.durationS + 0.05) continue;
        if (!CUTOUT_SUBJECT_BY_SOURCE[cand.file]) continue;
        chosen = cand;
      }
    }

    // Try each preferred tag in order; for each, do a chronological scan
    for (const wantTag of tagPrefs) {
      let advanced = 0;
      while (advanced < POOL.length && !chosen) {
        const cand = POOL[(cursor + advanced) % POOL.length];
        advanced++;
        if (used.has(cand.file)) continue;
        if (cand.duration < slot.durationS + 0.05) continue;
        if (tagFor(cand.file) !== wantTag) continue;
        if (prioritiseCues && wantTag === 'talking_clear' && !CUE_FILES.has(cand.file)) continue;
        chosen = cand;
      }
      if (chosen) break;
    }

    if (!chosen) {
      chosen = POOL.find((c) => !used.has(c.file)) ?? POOL[0];
    }
    used.add(chosen.file);
    cursor = POOL.indexOf(chosen) + 1;

    // Sub-window: best window for this duration, or fallback to a deterministic
    // offset that's NOT 0 (avoid always starting at clip head)
    const win = closestWindow(chosen.windows, slot.durationS);
    let sourceStartS = win ? win.start_s : 0;
    if (!win && chosen.duration > slot.durationS + 0.5) {
      // fallback: start ~25% in to skip the typical "lift the camera" intro
      sourceStartS = Math.max(0, chosen.duration * 0.25);
      if (sourceStartS + slot.durationS > chosen.duration - 0.1) {
        sourceStartS = Math.max(0, chosen.duration - slot.durationS - 0.1);
      }
    }
    out.push({ meta: chosen, sourceStartS });
  }
  return out;
}

// -----------------------------------------------------------------------------
// Audio peaks + duck window types (must be defined BEFORE deriveVariant which
// reads AUDIO_PEAKS at module-load time).
// -----------------------------------------------------------------------------

type ClipPeak = { t: number; duration: number; intensity: number; peak_rms: number };
type ClipAudio = { file: string; has_audio?: boolean; global_rms?: number; peaks: ClipPeak[] };
const AUDIO_PEAKS: Record<string, ClipAudio> = Object.fromEntries(
  (audioPeaksManifest as { videos: ClipAudio[] }).videos.map((v) => [v.file, v])
);

type DuckWindow = {
  startS: number;
  endS: number;
  kind: 'speech' | 'ambient';
  pickIdx: number;
  sourceStartS: number;
};

// v46: `Bridge` removed — overlapping MUSIC_PLACEMENTS with their own fade
// envelopes handle crossfade naturally; no need for speech-aligned bridge
// computation between adjacent tracks.

// -----------------------------------------------------------------------------
// Variant derivation — given a chronoStart, derive all the per-variant data
// (picks, duck windows, ambient ducks, day stamps).
// -----------------------------------------------------------------------------

type VariantData = {
  picks: { meta: ScoredVideo; sourceStartS: number }[];
  duckWindows: DuckWindow[];
  ambientDucks: DuckWindow[];
  dayStamps: { startS: number; durationS: number; text: string; date: string; dayNumber: number }[];
};

function deriveVariant(chronoStart: number): VariantData {
  const picks = pickClipsChronological(chronoStart);

  const duckWindows: DuckWindow[] = [];
  for (let i = 0; i < SCHEDULE.length; i++) {
    const slot = SCHEDULE[i];
    const pick = picks[i];
    if (!pick) continue;
    // v45: speech ducks now register on every vlog-mode slot whose pick has
    // a clear talking + cue file. (Was: act === 'calm' only.)
    if (slot.mode === 'vlog' && tagFor(pick.meta.file) === 'talking_clear' && CUE_FILES.has(pick.meta.file)) {
      duckWindows.push({
        startS: slot.startS,
        endS: slot.startS + slot.durationS,
        kind: 'speech',
        pickIdx: i,
        sourceStartS: pick.sourceStartS,
      });
    }
  }

  const ambientDucks: DuckWindow[] = [];
  for (let i = 0; i < SCHEDULE.length; i++) {
    const slot = SCHEDULE[i];
    const pick = picks[i];
    if (!pick) continue;
    // v46: ambient ducks fire on ANY mode — music now plays at its base
    // volume across the timeline (decoupled from mode), so a cool-sound
    // peak should duck music regardless of vlog/editBurst classification.
    // (v45 skipped editBurst because music dominated there; no longer the
    // case — see MUSIC_PLACEMENTS / makePlacementVolume.)
    if (duckWindows.some((w) => w.startS === slot.startS)) continue;
    const audio = AUDIO_PEAKS[pick.meta.file];
    if (!audio || !audio.peaks?.length) continue;
    const winStart = pick.sourceStartS;
    const winEnd = pick.sourceStartS + slot.durationS;
    const inWindow = audio.peaks.filter(
      (p) => p.t >= winStart - 0.1 && p.t < winEnd && p.intensity > 0.6
    );
    if (inWindow.length === 0) continue;
    const peak = inWindow.reduce((a, b) => (a.intensity > b.intensity ? a : b));
    const editPeakStart = slot.startS + Math.max(0, peak.t - winStart);
    const editPeakEnd = Math.min(slot.startS + slot.durationS, editPeakStart + peak.duration + 0.25);
    if (editPeakEnd - editPeakStart < 0.15) continue;
    ambientDucks.push({
      startS: editPeakStart,
      endS: editPeakEnd,
      kind: 'ambient',
      pickIdx: i,
      sourceStartS: peak.t,
    });
  }

  const dayStamps: { startS: number; durationS: number; text: string; date: string; dayNumber: number }[] = [];
  {
    const seen: string[] = [];
    let prevDate: string | null = null;
    for (let i = 0; i < SCHEDULE.length; i++) {
      const pick = picks[i];
      if (!pick) continue;
      const date = extractDate(pick.meta.file);
      if (!date) continue;
      if (date !== prevDate) {
        if (!seen.includes(date)) seen.push(date);
        const dayIdx = seen.indexOf(date);
        if (i > 0 || SCHEDULE[i].startS > 1.5) {
          dayStamps.push({
            startS: SCHEDULE[i].startS,
            durationS: Math.min(3.0, SCHEDULE[i].durationS),
            text: formatDateStamp(date, dayIdx),
            date,
            dayNumber: dayIdx + 1,
          });
        }
        prevDate = date;
      }
    }
  }

  return { picks, duckWindows, ambientDucks, dayStamps };
}

// v47: prelim-pick + speech-align pass. Runs HERE (not next to SCHEDULE
// declaration) because pickClipsChronological closes over POOL, TAGS,
// CUTOUT_SUBJECT_BY_SOURCE, SKIP_FILES — all of which are module-level
// consts initialized in source order above this point. After this block,
// SCHEDULE reflects the speech-end-snapped boundaries for vlog-mode slots.
// All downstream consumers (deriveVariant, transitions loop, JSX
// SCHEDULE.map, debug HUD) read the aligned version.
{
  const prelimPicks = pickClipsChronological(0);
  SCHEDULE = alignVlogScheduleToSpeech(SCHEDULE, prelimPicks);
}

// Default variant precomputed at module load (used when comp gets default props)
const DEFAULT_VARIANT = deriveVariant(0);

// Aliases for backwards-compatibility / readability inside the JSX below.
const PICKS = DEFAULT_VARIANT.picks;

/**
 * Per-clip volume normalization factor for ducked passes.
 *
 * The trip clips have wildly varying recording levels — quiet conversations
 * sit around RMS 0.01 while clips with crowd ambience can hit 0.28. Without
 * normalization the quiet ones are inaudible after the duck curve, the loud
 * ones blow past the music.
 *
 * Target = 0.10 (just above the pool median p50=0.092) so most clips stay near
 * unity, only outliers get adjusted. Clamp 0.6..1.8 → tame enough that
 * nothing gets silenced or doubled.
 */
const NORMALIZATION_TARGET_RMS = 0.10;
function normalizationFactor(file: string): number {
  const audio = AUDIO_PEAKS[file];
  if (!audio || !audio.has_audio || !audio.global_rms || audio.global_rms < 1e-5) return 1.0;
  return Math.max(0.6, Math.min(1.8, NORMALIZATION_TARGET_RMS / audio.global_rms));
}

/** v46: mode-aware clip-audio gain — less aggressive than v45.
 *  - Vlog mode    → 1.15× normFactor (speech is foreground; unchanged)
 *  - EditBurst    → 0.65× normFactor (was 0.18 in v45 — too low when music
 *    plays throughout. Music carries the burst now via MUSIC_PLACEMENTS,
 *    so clip audio just needs to step back a bit, not vanish.)
 *  Linear 0.5s crossfade across editBurst boundaries via inEditBurstEnv(t).
 *  Used by all 3 clip-audio Sequences (duckWindows, jCut, ambientDucks).
 */
const CLIP_GAIN_VLOG = 1.15;
const CLIP_GAIN_EDITBURST = 0.65;
function clipGainAtTime(t: number, normFactor: number): number {
  const env = inEditBurstEnv(t);
  const gain = CLIP_GAIN_VLOG + (CLIP_GAIN_EDITBURST - CLIP_GAIN_VLOG) * env;
  return gain * normFactor;
}

/** v41: pull whisper-transcribed text for a clip, return null if unsuitable
 *  for caption display. Filters: 3-14 words (too short = noise, too long
 *  = wall of text), English or German only (most reliable transcripts),
 *  no profanity-only or single-token outputs. */
const TRANSCRIPTS = (transcriptsManifest as {
  transcripts: Record<string, { text?: string; language?: string }>;
}).transcripts;
function captionFromTranscript(file: string): string | null {
  const t = TRANSCRIPTS[file];
  if (!t) return null;
  const text = (t.text || '').trim();
  if (!text) return null;
  const words = text.split(/\s+/);
  if (words.length < 3 || words.length > 14) return null;
  const lang = t.language;
  if (lang !== 'en' && lang !== 'de') return null;
  return text;
}

/* Speech / ambient duck windows are now derived per-variant in deriveVariant().
   Aliases below preserve the call-site code that references the default set. */
const DUCK_WINDOWS = DEFAULT_VARIANT.duckWindows;
const AMBIENT_DUCKS = DEFAULT_VARIANT.ambientDucks;

/* Day stamps now per-variant; alias to default. */
const DAY_STAMPS = DEFAULT_VARIANT.dayStamps;

/* Trip stats derived from manifests (v24) — replaces v23's hardcoded
   `08 / 06 / 289`. Distinct date count from filenames, total clip count
   from the windows manifest, total source-hours rounded to nearest 0.1.
   Derived once at module load. */
const _allFiles = (windowsManifest.videos as { file: string; duration: number }[]);
const _distinctDates = new Set<string>();
let _totalDurS = 0;
for (const v of _allFiles) {
  const d = extractDate(v.file);
  if (d) _distinctDates.add(d);
  _totalDurS += v.duration ?? 0;
}
const TRIP_DAYS = _distinctDates.size;
const TRIP_CLIPS = _allFiles.length;
const TRIP_HOURS = Math.round((_totalDurS / 3600) * 10) / 10;
const _faceClipsCount = Object.values(FACES).filter((v) => (v?.n_samples ?? 0) > 0).length;

/** Per-act color grade params — pushed harder than v11 so the act boundaries read. */
type GradeParams = {
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  hue: number;
};

const GRADE_CALM: GradeParams = { brightness: 0.92, contrast: 1.05, saturate: 0.62, sepia: 0.22, hue: 8 };
const GRADE_BUILD: GradeParams = { brightness: 0.94, contrast: 1.10, saturate: 0.85, sepia: 0.06, hue: 0 };
const GRADE_DROP: GradeParams = { brightness: 0.96, contrast: 1.26, saturate: 1.20, sepia: 0.0, hue: -7 };

function lerpGrade(a: GradeParams, b: GradeParams, t: number): GradeParams {
  return {
    brightness: a.brightness + (b.brightness - a.brightness) * t,
    contrast: a.contrast + (b.contrast - a.contrast) * t,
    saturate: a.saturate + (b.saturate - a.saturate) * t,
    sepia: a.sepia + (b.sepia - a.sepia) * t,
    hue: a.hue + (b.hue - a.hue) * t,
  };
}

function gradeAtTime(t: number): string {
  // calm fully through 21s; cross-fade to build over 21..23s; build fully 23..27s;
  // cross-fade to drop over 27..29s; drop fully through 75s.
  let p: GradeParams;
  if (t <= 21) p = GRADE_CALM;
  else if (t <= 23) p = lerpGrade(GRADE_CALM, GRADE_BUILD, (t - 21) / 2);
  else if (t <= 27) p = GRADE_BUILD;
  else if (t <= 29) p = lerpGrade(GRADE_BUILD, GRADE_DROP, (t - 27) / 2);
  else p = GRADE_DROP;
  return `brightness(${p.brightness.toFixed(3)}) contrast(${p.contrast.toFixed(3)}) saturate(${p.saturate.toFixed(3)}) sepia(${p.sepia.toFixed(3)}) hue-rotate(${p.hue.toFixed(2)}deg)`;
}

/**
 * v46: per-placement volume envelope, decoupled from vlog/editBurst Mode.
 *
 *   vol(t) = baseVol × fadeEnvelope(t) × duckMultiplier(t)
 *
 * fadeEnvelope: 0 outside [compStartS, compEndS], linear ramp up over fadeInS
 *               from compStartS, linear ramp down over fadeOutS into compEndS.
 *               Multiple overlapping placements with their own envelopes
 *               produce automatic crossfades.
 * duckMultiplier: speech-duck × ambient-duck (multiplicative, both ≤1.0).
 *   - speech-duck: when t lies inside any speech duckWindow, multiply by
 *     SPEECH_DUCK_MUL (0.28). 0.25s cosine-style ramp on each side.
 *   - peak-duck:   when t lies inside any cool-sound ambientDuck, multiply
 *     by PEAK_DUCK_MUL (0.55). 0.20s ramp on each side.
 *   - Otherwise unity (music plays at baseVol).
 *
 * Mode is NOT consulted. Music plays through vlog narration at its baseVol;
 * only real causes (speech / cool sounds) cause it to dip.
 */
const SPEECH_DUCK_MUL = 0.28;
const SPEECH_DUCK_RAMP_S = 0.25;
const PEAK_DUCK_MUL = 0.55;
const PEAK_DUCK_RAMP_S = 0.20;

function placementFadeEnv(p: MusicPlacement, t: number): number {
  if (t < p.compStartS || t > p.compEndS) return 0;
  const fadeIn = p.fadeInS > 0 ? Math.min(1, (t - p.compStartS) / p.fadeInS) : 1;
  const fadeOut = p.fadeOutS > 0 ? Math.min(1, (p.compEndS - t) / p.fadeOutS) : 1;
  return Math.max(0, Math.min(fadeIn, fadeOut, 1));
}

function duckMultiplier(t: number, ducks: DuckWindow[], ambientDucks: DuckWindow[]): number {
  let mul = 1;
  // Speech duck — deeper (0.28) with 0.25s ramps
  for (const w of ducks) {
    const r = SPEECH_DUCK_RAMP_S;
    if (t < w.startS - r || t > w.endS + r) continue;
    const ramp = Math.min(
      Math.max(0, t - (w.startS - r)) / r,
      Math.max(0, (w.endS + r) - t) / r,
      1
    );
    const m = 1 - ramp * (1 - SPEECH_DUCK_MUL);
    if (m < mul) mul = m;
  }
  // Peak / ambient duck — shallower (0.55) with 0.20s ramps
  for (const w of ambientDucks) {
    const r = PEAK_DUCK_RAMP_S;
    if (t < w.startS - r || t > w.endS + r) continue;
    const ramp = Math.min(
      Math.max(0, t - (w.startS - r)) / r,
      Math.max(0, (w.endS + r) - t) / r,
      1
    );
    const m = 1 - ramp * (1 - PEAK_DUCK_MUL);
    if (m < mul) mul = m;
  }
  return Math.max(0, mul);
}

function makePlacementVolume(
  p: MusicPlacement,
  ducks: DuckWindow[],
  ambientDucks: DuckWindow[]
) {
  return (t: number): number => {
    const env = placementFadeEnv(p, t);
    if (env <= 0) return 0;
    const duck = duckMultiplier(t, ducks, ambientDucks);
    return p.baseVol * env * duck;
  };
}

// -----------------------------------------------------------------------------
// Composition
// -----------------------------------------------------------------------------

export type EurogangVlogTripFX_FlowBlurProps = {
  seed: string;
  effectIntensity: number;
  grainIntensity: number;
  showStamps: boolean;
  /**
   * Anchor index into the chronological pool — 0 = first day, ~40% of pool = mid-trip,
   * ~70% = late trip. Different values give a *different* edit from the same source pool
   * while preserving chronological + no-dup. Used to render alternates side-by-side.
   */
  chronoStart: number;
  /** v28: bottom-left HUD with active clip filename + effects so the user can
   * pinpoint which slot or transition kind to revise. */
  showDebug?: boolean;
  /** v44: GhostEcho — at each music drop (99s, 200s) layer 4 alpha-faded
   *  time-shifted copies of the active subject_webm cutout for ~30 frames. */
  enableGhostEcho?: boolean;
  /** v44: J-Cut pre-lap audio — speech-duck audio leads the picture cut by
   *  `jCutLeadFrames` frames so the next clip's voice arrives before the
   *  visual. Music tracks (TRACKS) are not touched. */
  enableJCut?: boolean;
  /** v44: Lead amount in frames for the J-Cut. 10 frames @ 30fps = 0.33s
   *  pre-lap. Auto-clipped to avoid overlapping the previous speech duck. */
  jCutLeadFrames?: number;
  /** v44: Bass-pump — per-frame FFT (useWindowedAudioData + visualizeAudio)
   *  on the active music track drives a `1.0..1.14` scale on the topmost
   *  render container, composed with the existing dropScale. */
  enableBassPump?: boolean;
  /** v44: MaskReveal silhouette transition — every 5th eligible cut becomes
   *  a 2-phase silhouette dissolve (12f opacity ramp + 6f mask expansion). */
  enableMaskReveal?: boolean;
  /** v47: gate ALL cutout decorations (cutoutSlide PNG punch-in AND the
   *  cutoutReveal upgrade path that swaps the next clip's subject_webm in
   *  ahead of the cut). Defaults to false — current cutout pool quality is
   *  poor and the matte edges read as artefacts. Re-enable after expanding
   *  the cutout pool via extract_cutouts.py. Note that v47 also replaced
   *  every `return 'cutoutSlide'` in `transitionKindForCut` with a non-
   *  cutout TransitionKind, so flipping this flag alone won't bring cutouts
   *  back — both edits need reverting. */
  enableCutoutDecorations?: boolean;
  /** FX_FlowBlur (Ref 4 = leev.vfx): every 4th cut is upgraded to a heavy-blur
   *  cross-dissolve. Outgoing slot extends by FLOW_BLUR_FRAMES; both clips
   *  ramp blur 0 → 25px → 0 in a triangular curve so frames optically merge
   *  at the cut boundary. Halation + color-grade overlays render only inside
   *  the 18-frame window. When false, the file behaves identical to the
   *  source EurogangVlogTrip.tsx. */
  enableFlowBlur?: boolean;
};

export const eurogangVlogTripFX_FlowBlurDefaults: EurogangVlogTripFX_FlowBlurProps = {
  seed: 'eurogang-trip-v2',
  effectIntensity: 0.7,
  grainIntensity: 0.06,
  showStamps: true,
  chronoStart: 0,
  showDebug: false,
  enableGhostEcho: true,
  enableJCut: true,
  jCutLeadFrames: 10,
  enableBassPump: true,
  // v46: MaskReveal off by default — current cutout pool quality is poor
  // (small eligible set, rough mattes). Keep implementation intact; user
  // will re-enable after expanding cutout pool via extract_cutouts.py.
  enableMaskReveal: false,
  // v47: cutout decorations OFF by default (cutoutSlide + cutoutReveal).
  // See enableCutoutDecorations doc above and `transitionKindForCut`
  // comment block for the full re-enable steps.
  enableCutoutDecorations: false,
  // FX_FlowBlur — default ON in this preview file. Every 4th cut becomes
  // a flowBlur dissolve; the rest keep the original whipPan/flashCut/etc.
  enableFlowBlur: true,
};

export const EurogangVlogTripFX_FlowBlur: React.FC<EurogangVlogTripFX_FlowBlurProps> = ({
  effectIntensity,
  grainIntensity,
  showStamps,
  chronoStart,
  showDebug,
  enableGhostEcho = true,
  enableJCut = true,
  jCutLeadFrames = 10,
  enableBassPump = true,
  enableMaskReveal = false,
  enableCutoutDecorations = false,
  enableFlowBlur = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const act = actAtTime(t);

  // Per-variant: clip picks + duck windows + day stamps recompute when chronoStart changes
  const variant = React.useMemo(() => deriveVariant(chronoStart), [chronoStart]);
  const picks = variant.picks;
  const duckWindows = variant.duckWindows;
  const ambientDucks = variant.ambientDucks;
  const dayStamps = variant.dayStamps;
  // v46: per-placement volume callbacks. One per MUSIC_PLACEMENTS entry —
  // each placement renders its own <Sequence><Audio/></Sequence>. Overlaps
  // between placements (e.g. uzi-drop tail 222-225s vs metro-outro fade-in
  // 220-222s) produce automatic crossfades because both render at once.
  const placementVolumes = React.useMemo(
    () => MUSIC_PLACEMENTS.map((p) => makePlacementVolume(p, duckWindows, ambientDucks)),
    [duckWindows, ambientDucks]
  );

  const pulse = beatPulse(EDIT_ONSETS, frame, fps, 0.18);
  const punchRaw = beatPunch(EDIT_ONSETS, frame, fps, 0.10);
  const actScale = act === 'calm' ? 0 : act === 'build' ? 0.4 : 0.85;
  const punch = punchRaw * actScale * effectIntensity;
  const shake = cameraShake(frame, punch * 5);

  // Smooth-lerped color grade across acts (harder push than v11):
  //   calm  → warm + low sat + sepia
  //   build → neutral
  //   drop  → cool + saturated + cooler hue
  const filter = gradeAtTime(t);

  // Drop scale pulse — video frame itself zooms briefly at exactly 25 s,
  // composing with the existing shake offset so the bars + flash + scale all
  // hit together for the cinema "punch" beat.
  const DROP_FRAME = Math.round(99.0 * fps);  // v39: drop @ 99s (was 25s)
  const dropDt = frame - DROP_FRAME;
  const dropEnvelope = Math.max(0, 1 - Math.abs(dropDt) / 5);
  const dropScale = 1.0 + dropEnvelope * 0.12;

  // ---------------------------------------------------------------------------
  // v46: Bass-pump scale via per-frame FFT — driven by active MUSIC_PLACEMENT.
  //
  // useWindowedAudioData is called once per *source file* (metro/boogie/uzi
  // — 3 hooks fixed at module load). For each frame we pick the most active
  // placement (highest fadeEnv × baseVol), find which source file it uses,
  // compute the source-time inside that file (t - compStartS + srcOffsetS),
  // run visualizeAudio on the matching audioData. EMA-smoothed (alpha=0.4)
  // and mapped to a 1.0..1.14 scale factor. Multiplies into dropScale on
  // the topmost <AbsoluteFill>.
  // ---------------------------------------------------------------------------
  const BASS_FILES = ['metro.wav', 'boogie.wav', 'uzi.wav'] as const;
  const bassUrls = React.useMemo(() => BASS_FILES.map((f) => staticFile(f)), []);
  const windowedM = useWindowedAudioData({ src: bassUrls[0], frame, fps, windowInSeconds: 4 });
  const windowedB = useWindowedAudioData({ src: bassUrls[1], frame, fps, windowInSeconds: 4 });
  const windowedU = useWindowedAudioData({ src: bassUrls[2], frame, fps, windowInSeconds: 4 });
  const windowedByFile: Record<string, typeof windowedM> = {
    'metro.wav': windowedM,
    'boogie.wav': windowedB,
    'uzi.wav': windowedU,
  };

  // Pick the most-active placement at comp-time t (highest envelope × baseVol).
  let activePlacement: MusicPlacement | null = null;
  let activeWeight = 0;
  for (const p of MUSIC_PLACEMENTS) {
    if (t < p.compStartS || t > p.compEndS) continue;
    const w = placementFadeEnv(p, t) * p.baseVol;
    if (w > activeWeight) {
      activeWeight = w;
      activePlacement = p;
    }
  }

  // Per-frame bass energy — mean of first 6 bins of a 32-sample FFT.
  let bassEnergy = 0;
  if (enableBassPump && activePlacement) {
    const p = activePlacement;
    const wd = windowedByFile[p.file];
    if (wd && wd.audioData) {
      const sourceT = (t - p.compStartS) + p.srcOffsetS;
      const sourceFrame = Math.round(sourceT * fps);
      try {
        const bins = visualizeAudio({
          audioData: wd.audioData,
          frame: sourceFrame,
          fps,
          numberOfSamples: 32,
          optimizeFor: 'speed',
          dataOffsetInSeconds: wd.dataOffsetInSeconds,
        });
        let sum = 0;
        const N = Math.min(6, bins.length);
        for (let k = 0; k < N; k++) sum += bins[k];
        bassEnergy = sum / Math.max(1, N);
      } catch {
        bassEnergy = 0;
      }
    }
  }

  // EMA smoothing — alpha=0.4 hits the sweet spot between snap-pump (alpha→1)
  // and sluggish (alpha→0). Stored in a ref so it persists across frames.
  const bassEmaRef = React.useRef(0);
  const bassAlpha = 0.4;
  bassEmaRef.current = bassEmaRef.current * (1 - bassAlpha) + bassEnergy * bassAlpha;
  const BASS_NORM_REF = 0.6;
  const bassNorm = Math.min(1, Math.max(0, bassEmaRef.current / BASS_NORM_REF));
  // v44: 0.14 ceiling per user feedback ("v2 mit erhöhtem Zoom" — 0.06 was too
  // subtle to read on top of the existing dropScale).
  const bassScale = enableBassPump ? 1.0 + bassNorm * 0.14 : 1.0;
  const combinedScale = dropScale * bassScale;

  // ---------------------------------------------------------------------------
  // v44: MaskReveal map — pre-compute which slot indices are *incoming* clips
  // of a maskReveal-promoted cut. A slot i qualifies when picks[i-1] has an
  // eligible subject_webm (so the alpha mask is available); every 5th eligible
  // cut is upgraded. The map value is the OUTGOING subject_webm path (used as
  // mask-image inside MaskRevealWrapper). Slots whose duration is shorter than
  // the reveal window + 2 are skipped to prevent the mask animation from
  // outliving the underlying clip.
  // ---------------------------------------------------------------------------
  const maskRevealMap = React.useMemo<Map<number, string>>(() => {
    const m = new Map<number, string>();
    if (!enableMaskReveal) return m;
    let eligibleCount = 0;
    for (let i = 1; i < SCHEDULE.length; i++) {
      const prev = picks[i - 1];
      if (!prev) continue;
      const subjectWebm = CUTOUT_SUBJECT_BY_SOURCE[prev.meta.file];
      if (!subjectWebm) continue;
      eligibleCount++;
      const incomingDurFrames = Math.round(SCHEDULE[i].durationS * fps);
      if (incomingDurFrames < MASK_REVEAL_FRAMES + 2) continue;

      // v45: fire on every-5th-eligible OR at any editBurst↔vlog mode
      // boundary cut (transition stinger). Both checks share the same
      // duration/eligibility constraints so the mask animation never
      // outruns the underlying clip.
      const isEvery5th = eligibleCount % 5 === 0;
      const isModeBoundary = SCHEDULE[i - 1].mode !== SCHEDULE[i].mode;
      if (!isEvery5th && !isModeBoundary) continue;
      m.set(i, subjectWebm);
    }
    return m;
  }, [picks, enableMaskReveal, fps]);

  // ---------------------------------------------------------------------------
  // FX_FlowBlur map — pre-compute which slot indices are *incoming* clips
  // of a flowBlur-promoted cut. When `enableFlowBlur` is on, every 4th cut
  // (i % 4 === 0, skipping i=0 since slot 0 has no preceding cut) is upgraded.
  // We also require both the outgoing and incoming slot durations to be at
  // least FLOW_BLUR_FRAMES + 2 frames so the blur ramp never outruns the
  // underlying clip.
  //
  // Set membership: i ∈ flowBlurSet  ⇔  the cut at the START of slot i is a
  // flowBlur cut, i.e. slot i is the INCOMING side and slot i-1 is the
  // OUTGOING side (which extends by FLOW_BLUR_FRAMES).
  // ---------------------------------------------------------------------------
  const flowBlurSet = React.useMemo<Set<number>>(() => {
    const s = new Set<number>();
    if (!enableFlowBlur) return s;
    for (let i = 1; i < SCHEDULE.length; i++) {
      // Every 4th cut (mod-4) — mixes flowBlur with the existing rotation
      // so the look stays varied. Skip if either neighbour is too short.
      if (i % 4 !== 0) continue;
      const incomingDurFrames = Math.round(SCHEDULE[i].durationS * fps);
      const outgoingDurFrames = Math.round(SCHEDULE[i - 1].durationS * fps);
      if (incomingDurFrames < FLOW_BLUR_FRAMES + 2) continue;
      if (outgoingDurFrames < FLOW_BLUR_FRAMES + 2) continue;
      s.add(i);
    }
    return s;
  }, [enableFlowBlur, fps]);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <SvgChannelFilters />

      <AbsoluteFill
        style={{
          transform: `translate(${shake.x}px, ${shake.y}px) scale(${combinedScale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <RGBSplit amount={punch * 6}>
          {SCHEDULE.map((slot, i) => {
            const startFrame = Math.round(slot.startS * fps);
            const durFrames = Math.round(slot.durationS * fps);
            // v44 MaskReveal outgoing-extension: if the NEXT slot is the
            // incoming side of a maskReveal cut, extend THIS slot's render
            // by MASK_REVEAL_FRAMES so V1 keeps playing under the reveal.
            // This is the key piece that makes maskReveal a parallel
            // dissolve rather than a hard cut + mask animation.
            const nextIsMaskRevealIncoming = maskRevealMap.has(i + 1);
            // FX_FlowBlur outgoing-extension: if the NEXT slot is the
            // incoming side of a flowBlur cut, extend THIS slot's render
            // by FLOW_BLUR_FRAMES so it overlaps the next clip during
            // the blur peak. Same outgoing-extension pattern MaskReveal uses.
            const nextIsFlowBlurIncoming = flowBlurSet.has(i + 1);
            const extensionFrames = Math.max(
              nextIsMaskRevealIncoming ? MASK_REVEAL_FRAMES : 0,
              nextIsFlowBlurIncoming ? FLOW_BLUR_FRAMES : 0,
            );
            const renderedDurFrames = durFrames + extensionFrames;
            const pick = picks[i];
            if (!pick) return null;
            // Per-clip exposure compensation. Pool brightness p10=0.11, p50=0.41,
            // p90=0.50 — wide spread. Target the median; clamp ±15% so we don't
            // over-correct or flatten the per-act grade.
            const b = pick.meta.brightness ?? 0.40;
            const exposureFactor = Math.max(0.85, Math.min(1.15, 0.40 / Math.max(0.05, b)));

            // Hero outro detection: drop-act slot >=3.5 s extending past 70 s.
            // After v18's stride-999 rule, exactly one such slot exists at the
            // end of the schedule. Apply slow-mo so the final clip breathes.
            const isHero =
              slot.act === 'drop' &&
              slot.durationS >= 3.5 &&
              slot.startS + slot.durationS >= TOTAL_S - 0.5;

            // Pre-drop tension: build-act slot whose START is in [24, 25) is
            // the last beat before the drop hits. Slow it to 0.7 — anticipation
            // ramps the tension, then 25 s snaps back to full speed with the
            // drop punctuation (bars + flash + bass + scale-pulse).
            const isPreDropTension =
              slot.act === 'build' && slot.startS >= 98 && slot.startS < 99;

            const playbackRate = isHero ? 0.78 : isPreDropTension ? 0.7 : 1;

            // v44 MaskReveal incoming wrap: if THIS slot is the incoming
            // side of a maskReveal cut, the wrapper masks the clip with
            // the OUTGOING subject_webm silhouette for the first 18 frames.
            // The wrapper always renders the same div structure (whether
            // or not maskRevealSubjectWebm is defined) so React doesn't
            // unmount OffthreadVideo when the transition window ends —
            // unmounting would reset startFrom and snap the video back
            // to its head. Pure passthrough when undefined.
            const maskRevealSubjectWebm = maskRevealMap.get(i);

            // FX_FlowBlur — this slot is the INCOMING side of a flowBlur cut
            // when its index is in flowBlurSet (the cut at slot.startS is the
            // flowBlur boundary). The outgoing side is slot i-1 whose render
            // we already extended by FLOW_BLUR_FRAMES via nextIsFlowBlurIncoming.
            const isFlowBlurIncoming = flowBlurSet.has(i);
            // The OUTGOING wrapper activates whenever THIS slot's render is
            // extended for a flowBlur (i.e. slot i+1 is a flowBlur incoming).
            const isFlowBlurOutgoing = nextIsFlowBlurIncoming;

            return (
              <Sequence
                key={i}
                from={startFrame}
                durationInFrames={renderedDurFrames}
              >
                <FlowBlurOutgoingWrapper
                  active={isFlowBlurOutgoing}
                  durFrames={durFrames}
                >
                  <FlowBlurIncomingWrapper active={isFlowBlurIncoming}>
                    <MaskRevealWrapper
                      subjectWebm={maskRevealSubjectWebm}
                      durationFrames={MASK_REVEAL_FRAMES}
                    >
                      <VlogClip
                        src={pick.meta.file}
                        sourceStartS={pick.sourceStartS}
                        durationFrames={durFrames}
                        act={slot.act}
                        filter={filter}
                        fps={fps}
                        exposureFactor={exposureFactor}
                        playbackRate={playbackRate}
                      />
                    </MaskRevealWrapper>
                  </FlowBlurIncomingWrapper>
                </FlowBlurOutgoingWrapper>
              </Sequence>
            );
          })}
        </RGBSplit>
      </AbsoluteFill>

      {/* Transition decorations + SFX at cut boundaries (overlay only — clip
         schedule untouched, every cut still lands on its beat). SFX rotated
         per-cut via deterministic hash so we never repeat the same whoosh
         twice in a row. Cutout transitions punch a person-silhouette PNG
         across the screen. */}
      {SCHEDULE.slice(1).map((slot, idx) => {
        const i = idx + 1;
        const cutFrame = Math.round(slot.startS * fps);
        // Day-boundary detection — compare captured-day for picks[i-1] vs picks[i]
        const prevPick = picks[i - 1];
        const currPick = picks[i];
        const prevDay = prevPick ? (CAPTIME[prevPick.meta.file] ?? prevPick.meta.file).slice(0, 10) : '';
        const currDay = currPick ? (CAPTIME[currPick.meta.file] ?? currPick.meta.file).slice(0, 10) : '';
        const isDayBoundary = !!prevDay && !!currDay && prevDay !== currDay;
        let kind = transitionKindForCut(slot, i, isDayBoundary);
        // v44: upgrade cutoutSlide → cutoutReveal when next clip has a
        // subject_webm available. v47: ENTIRELY GATED behind
        // `enableCutoutDecorations`. With that flag off (default) the
        // upgrade never fires AND the cutoutFile / subjectWebm props are
        // never computed, so even if some future edit re-introduces a
        // 'cutoutSlide' return in transitionKindForCut, no cutout figures
        // render until the prop default is flipped.
        const subjectWebm = enableCutoutDecorations && kind === 'cutoutSlide'
          ? pickSubjectWebmForNextClip(currPick?.meta.file)
          : undefined;
        if (subjectWebm) kind = 'cutoutReveal';
        const cutoutFile = enableCutoutDecorations && kind === 'cutoutSlide'
          ? pickCutoutForNextClip(currPick?.meta.file, i)
          : undefined;
        // v47: if cutout decorations are off and the kind landed on
        // 'cutoutSlide' for any reason (legacy pinned values, future
        // re-enable in transitionKindForCut), suppress this cut entirely.
        if (!enableCutoutDecorations && (kind === 'cutoutSlide' || kind === 'cutoutReveal')) {
          return null;
        }

        // v44: if this cut was promoted to maskReveal, suppress the
        // cutoutSlide / cutoutReveal decoration (the mask wrapper on the
        // incoming clip *is* the visible transition). Still emit a soft
        // cinematic whoosh as the SFX so the cut has audio body.
        const isMaskReveal = maskRevealMap.has(i);
        if (isMaskReveal) {
          const sfxFile = 'sfx/whoosh_cinematic.wav';
          const fromFrameMR = Math.max(0, cutFrame - 6);
          const decoFramesMR = Math.min(
            MASK_REVEAL_FRAMES + 6,
            Math.round(TOTAL_S * fps) - fromFrameMR
          );
          return (
            <Sequence
              key={`trans-${i}`}
              from={fromFrameMR}
              durationInFrames={decoFramesMR + 8}
            >
              <Audio src={staticFile(sfxFile)} volume={0.28} />
            </Sequence>
          );
        }

        // FX_FlowBlur: when this cut was promoted to flowBlur, suppress the
        // standard transition decoration (whipPan/flashCut/etc) — the blur
        // wrappers on both clips ARE the visible transition. Emit a soft
        // cinematic whoosh so the cut has audio body, matched in length to
        // the FLOW_BLUR_FRAMES window.
        const isFlowBlur = flowBlurSet.has(i);
        if (isFlowBlur) {
          const sfxFile = 'sfx/whoosh_cinematic.wav';
          const fromFrameFB = Math.max(0, cutFrame - FLOW_BLUR_FRAMES);
          const decoFramesFB = Math.min(
            FLOW_BLUR_FRAMES * 2 + 6,
            Math.round(TOTAL_S * fps) - fromFrameFB
          );
          return (
            <Sequence
              key={`trans-${i}`}
              from={fromFrameFB}
              durationInFrames={decoFramesFB}
            >
              <Audio src={staticFile(sfxFile)} volume={0.22} />
            </Sequence>
          );
        }

        if (kind === 'none') return null;
        // v44: cutoutReveal needs ~1s pre-cut (subject overlay plays its
        // alpha-webm full duration over clip A) plus ~0.4s post-cut tail.
        // Total 42 frames (1.4s @ 30fps). Cut at frame 30/42 = 71%.
        const decoTotalFrames =
          kind === 'cutoutReveal' ? 42 :
          kind === 'cutoutSlide' ? 20 :
          6;
        const preFrames =
          kind === 'cutoutReveal' ? 30 :
          kind === 'cutoutSlide' ? 14 :
          decoTotalFrames / 2;
        const fromFrame = Math.max(0, cutFrame - preFrames);
        const decoFrames = Math.min(decoTotalFrames, Math.round(TOTAL_S * fps) - fromFrame);
        const dir = transitionDirection(i);
        const sfx = pickTransitionSfx(kind, i, 'eurogang-trip-v6');
        // Volume per kind — generally lower than v5
        const sfxVol =
          kind === 'flashCut' ? 0.22 :
          kind === 'glitchSlice' ? 0.28 :
          kind === 'zoomPunch' ? 0.32 :
          kind === 'cutoutSlide' ? 0.32 :
          0.30; // whipPan, lightBloom
        return (
          <React.Fragment key={`trans-${i}`}>
            <Sequence from={fromFrame} durationInFrames={decoFrames}>
              <TransitionDecoration kind={kind} direction={dir} cutoutFile={cutoutFile} subjectWebm={subjectWebm} />
            </Sequence>
            {sfx && (
              <Sequence from={fromFrame} durationInFrames={decoFrames + 8}>
                <Audio src={staticFile(sfx)} volume={sfxVol} />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}

      {/* v44 GhostEcho: at each music drop (comp 99s + 200s), find the active
         pick's subject_webm (if eligible) and stack 4 alpha-faded time-offset
         copies on top for ~30 frames. The base subject_webm rendering is the
         main one already present in the comp (cutoutReveal transition or just
         the normal clip layer underneath); the echoes layer above as the
         signature ghost-self trail. Gated behind `enableGhostEcho`. */}
      {enableGhostEcho && [99, 200].map((dropS) => {
        const dropFrame = Math.round(dropS * fps);
        // Find pick whose slot contains the drop time
        let activeIdx = -1;
        for (let i = 0; i < SCHEDULE.length; i++) {
          if (SCHEDULE[i].startS <= dropS) activeIdx = i;
          else break;
        }
        if (activeIdx < 0) return null;
        const activePick = picks[activeIdx];
        if (!activePick) return null;
        // Try the active pick first; fall back to the next pick (drops often
        // fall right at a cut so either side may have the eligible webm).
        const subjectWebm =
          pickSubjectWebmForNextClip(activePick.meta.file) ??
          pickSubjectWebmForNextClip(picks[activeIdx + 1]?.meta.file);
        if (!subjectWebm) return null;
        return (
          <Sequence
            key={`ghost-echo-${dropS}`}
            from={dropFrame}
            durationInFrames={30}
            layout="none"
          >
            <GhostEcho subjectWebm={subjectWebm} />
          </Sequence>
        );
      })}

      {/* Speech ducking — let the source clip's voice through during cue moments
         in the calm act ("hey guys, we just arrived" type lines). Volume now
         normalized per clip — quiet clips boosted, loud ones tamed.
         v41: also surface the whisper transcript as bottom-third subtitle. */}
      {duckWindows.map((w, i) => {
        const pick = PICKS[w.pickIdx];
        if (!pick) return null;
        const fromFrame = Math.round(w.startS * fps);
        const dur = Math.round((w.endS - w.startS) * fps);
        const normFactor = normalizationFactor(pick.meta.file);
        const caption = captionFromTranscript(pick.meta.file);
        return (
          <React.Fragment key={`duck-${i}`}>
            <Sequence from={fromFrame} durationInFrames={dur}>
              <Audio
                src={staticFile(pick.meta.file)}
                startFrom={Math.round(pick.sourceStartS * fps)}
                endAt={Math.round((pick.sourceStartS + (w.endS - w.startS)) * fps)}
                volume={(f) => {
                  const localT = f / fps;
                  const absT = w.startS + localT;
                  const localDur = w.endS - w.startS;
                  const fadeIn = Math.min(1, localT / 0.18);
                  const fadeOut = Math.min(1, (localDur - localT) / 0.18);
                  // v45: mode-aware gain (1.15 vlog ↔ 0.18 editBurst, 0.5s ramp)
                  return Math.max(0, Math.min(fadeIn, fadeOut)) * clipGainAtTime(absT, normFactor);
                }}
              />
            </Sequence>
            {/* v41 surprise #4: actual whisper-transcribed caption shown
               while the speech audio plays. Words appear progressively. */}
            {caption && w.startS < 95 && (
              <Sequence from={fromFrame} durationInFrames={dur}>
                <CaptionOverlay text={caption} liveFrames={dur} progressive />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}

      {/* v44 J-Cut / pre-lap audio.
         For each speech-duck window we render a short EXTRA Audio Sequence
         that starts `jCutLeadFrames` frames before the picture cut and
         ends exactly at the cut. This produces the classic J-cut: viewer
         hears the next clip's voice while still seeing the outgoing clip.

         Constraints:
         (1) Lead never extends past frame 0 (clamped).
         (2) Lead never overlaps the previous speech duck — if the previous
             slot also had its own speech audio playing, we shorten the
             lead so it starts AFTER that previous duck ends. Otherwise
             two voices would talk over each other.
         (3) Music tracks (TRACKS) are entirely untouched: this only adds
             an extra clip-audio Sequence; the metro/boogie/uzi <Audio>
             below is rendered exactly as in the base comp, and the duck
             curve is driven by the (unchanged) duckWindows list.

         Note: we do NOT pre-lap the existing duckWindow Sequence itself —
         we leave it picture-locked so its fade-in/fade-out timing logic
         stays intact. The lead is an additive sibling Sequence with its
         own short fade-in. */}
      {enableJCut && duckWindows.map((w, i) => {
        const pick = PICKS[w.pickIdx];
        if (!pick) return null;
        const cutFrame = Math.round(w.startS * fps);
        if (cutFrame <= 0) return null;
        // (a) clamp to frame 0
        let leadStart = Math.max(0, cutFrame - Math.max(0, jCutLeadFrames));
        // (b) don't overlap previous speech duck
        for (const other of duckWindows) {
          if (other === w) continue;
          if (other.endS <= w.startS) {
            const otherEndFrame = Math.round(other.endS * fps);
            if (otherEndFrame > leadStart) leadStart = Math.min(otherEndFrame, cutFrame);
          }
        }
        const leadDur = cutFrame - leadStart;
        if (leadDur <= 0) return null;
        const normFactor = normalizationFactor(pick.meta.file);
        // The lead reads from the source clip starting `leadDur/fps` seconds
        // BEFORE the slot's own sourceStartS (so it's the natural pre-roll
        // of the speech, not a separate take). Clamp source >= 0.
        const leadDurS = leadDur / fps;
        const sourceLeadStartS = Math.max(0, pick.sourceStartS - leadDurS);
        const sourceLeadStartFrame = Math.round(sourceLeadStartS * fps);
        const sourceLeadEndFrame = Math.round(pick.sourceStartS * fps);
        if (sourceLeadEndFrame <= sourceLeadStartFrame) return null;
        return (
          <Sequence
            key={`jcut-${i}`}
            from={leadStart}
            durationInFrames={leadDur}
          >
            <Audio
              src={staticFile(pick.meta.file)}
              startFrom={sourceLeadStartFrame}
              endAt={sourceLeadEndFrame}
              volume={(f) => {
                const localT = f / fps;
                const absT = (leadStart + f) / fps;
                const fadeIn = Math.min(1, localT / 0.10);
                // v45: mode-aware gain so the lead matches the main duck
                // amplitude under both vlog (1.15) and editBurst (0.18) modes.
                return Math.max(0, fadeIn) * clipGainAtTime(absT, normFactor);
              }}
            />
          </Sequence>
        );
      })}

      {/* Ambient peak ducking — let strong ambient sounds (car, crowd, slam)
         from the source clip bleed through briefly while the music dips. */}
      {ambientDucks.map((w, i) => {
        const pick = PICKS[w.pickIdx];
        if (!pick) return null;
        const fromFrame = Math.round(w.startS * fps);
        const dur = Math.round((w.endS - w.startS) * fps);
        const normFactor = normalizationFactor(pick.meta.file);
        return (
          <Sequence key={`amb-${i}`} from={fromFrame} durationInFrames={dur}>
            <Audio
              src={staticFile(pick.meta.file)}
              startFrom={Math.round(w.sourceStartS * fps)}
              endAt={Math.round((w.sourceStartS + (w.endS - w.startS)) * fps)}
              volume={(f) => {
                const localT = f / fps;
                const absT = w.startS + localT;
                const localDur = w.endS - w.startS;
                const fadeIn = Math.min(1, localT / 0.12);
                const fadeOut = Math.min(1, (localDur - localT) / 0.18);
                // v45/v46: mode-aware base; ambient stays at ~0.48× of clipGain
                // (preserves v44's 0.55/1.15 ratio in vlog mode). In an
                // editBurst the gain naturally drops with the mode envelope
                // (which now bottoms at 0.65× in v46, not 0.18×).
                const modeGain = clipGainAtTime(absT, normFactor);
                return Math.max(0, Math.min(fadeIn, fadeOut)) * modeGain * (0.55 / 1.15);
              }}
            />
          </Sequence>
        );
      })}

      {/* v41/v47: DayCard chapter markers — slide in at each day-boundary
         across the FULL timeline (was: calm-act only). v47 drops the
         `startS < 95` gate so the chronological story-arc is visually
         marked all the way to the outro. dayStamps are derived in
         deriveVariant from picks[i].file's date prefix; one card fires the
         first time each new YYYY-MM-DD is seen as the picks march
         chronologically through the SCHEDULE. Replaces the previous
         hardcoded LocationStamp-style stamps. */}
      {dayStamps.map((d, i) => {
        const liveFrames = Math.round(d.durationS * fps);
        return (
          <Sequence
            key={`day-${i}`}
            from={Math.round(d.startS * fps)}
            durationInFrames={liveFrames}
          >
            <DayCard date={d.date} dayNumber={d.dayNumber} liveFrames={liveFrames} accent="#ff8a4f" />
          </Sequence>
        );
      })}

      {/* Face-tracked labels — animated text that follows the speaker's face
         through camera motion. Only on the first 2 calm-act cuts whose picked
         clip has rich face tracking (≥3 samples in the source-window).
         Editorial text is short + generic — meant as a vibe accent, not a name tag. */}
      {(() => {
        // v14: pass motionKind directly so the label can per-frame compute
        // the same Ken-Burns transform the underlying clip uses.
        const faceLabelTexts = ['THE TRIP', 'THE GANG', 'EUROPE’S CALLING'];
        const allowedActs: Array<'calm' | 'build'> = ['calm', 'build'];
        const labels: React.ReactNode[] = [];
        let placed = 0;
        for (let slotIdx = 0; slotIdx < SCHEDULE.length && placed < faceLabelTexts.length; slotIdx++) {
          const slot = SCHEDULE[slotIdx];
          if (!allowedActs.includes(slot.act as 'calm' | 'build')) continue;
          const pick = picks[slotIdx];
          if (!pick) continue;
          const track = FACES[pick.meta.file];
          if (!track) continue;
          const winStart = pick.sourceStartS;
          const winEnd = pick.sourceStartS + slot.durationS;
          const inWindow = track.samples.filter((s) => s.t >= winStart - 0.2 && s.t <= winEnd + 0.2);
          if (inWindow.length < 3) continue;

          const motionKind = motionForClip(pick.meta.file, slot.act);
          const durFrames = Math.round(slot.durationS * fps);

          labels.push(
            <Sequence
              key={`face-${slotIdx}`}
              from={Math.round(slot.startS * fps)}
              durationInFrames={durFrames}
            >
              <FaceSpotlight
                track={track}
                sourceStartS={pick.sourceStartS}
                motionKind={motionKind}
                act={slot.act}
                clipDurationFrames={durFrames}
                liveFrames={8}
                accent="#ff8a4f"
              />
              <FaceTrackedLabel
                track={track}
                text={faceLabelTexts[placed]}
                sourceStartS={pick.sourceStartS}
                motionKind={motionKind}
                act={slot.act}
                clipDurationFrames={durFrames}
                accent="#ff8a4f"
              />
            </Sequence>
          );
          placed++;
        }
        return labels;
      })()}

      {/* v45: FlashFrame gated by mode — only renders when its onset falls
         INSIDE an editBurst window. Vlog mode is FX-light (no flash). The
         every-8th-onset density and 0.20 peak from v44.1 are preserved. */}
      {EDIT_ONSETS
        .filter((s) => s >= 28)
        .filter((s) => modeAtTime(s) === 'editBurst')
        .filter((_, i) => i % 8 === 0)
        .map((s, i) => (
          <FlashFrame key={`flash-${i}`} at={s} duration={3} peakOpacity={0.20} />
        ))}

      {/* v45: editBurst entry stingers — single 6-frame Drop-Punctuation-style
         flash exactly at each editBurst startS to mark the mode change. The
         entry punch reinforces the audio jump from 0.07 → 0.85 music vol so
         the viewer feels the shift instead of just hearing it. Skipped at
         t=0 (cold-open already covers the opening). */}
      {EDIT_BURSTS.filter((w) => w.startS > 0.5).map((w, i) => (
        <FlashFrame
          key={`burst-entry-${i}`}
          at={w.startS}
          duration={6}
          peakOpacity={0.28}
        />
      ))}

      {/* Light leak in build + drop */}
      <Sequence
        from={Math.round(95 * fps)}
        durationInFrames={Math.round((TOTAL_S - 95) * fps)}
      >
        <LightLeak seed={1} color="#ff8a4f" peakOpacity={0.20} />
      </Sequence>

      {/* v39/v47: vlog-mode text schedule — the hardcoded LocationStamps
         were wrong (text didn't track actual capture-day). v47 keeps only
         the HeroText brand intro + the two NoteText vibe accents; the day
         progression is now carried entirely by the dynamic dayStamps /
         DayCard rendering above (one marker per distinct YYYY-MM-DD as
         picks march chronologically). */}
      <Sequence from={0} durationInFrames={Math.round(3.5 * fps)}>
        <HeroText text="EUROGANG" />
      </Sequence>
      <Sequence from={Math.round(35 * fps)} durationInFrames={Math.round(3.0 * fps)}>
        <NoteText text="no plan" />
      </Sequence>
      <Sequence from={Math.round(67 * fps)} durationInFrames={Math.round(3.0 * fps)}>
        <NoteText text="just vibes" />
      </Sequence>

      {/* Pre-outro trip stats — slide up at 230s, hold ~3s, slide off before
         hero outro at 235s. */}
      <Sequence
        from={Math.round(230 * fps)}
        durationInFrames={Math.round(3.5 * fps)}
      >
        <TripStats
          stats={[
            { label: 'DAYS', value: String(TRIP_DAYS).padStart(2, '0') },
            { label: 'CLIPS', value: String(TRIP_CLIPS) },
            { label: 'HOURS', value: TRIP_HOURS.toFixed(1) },
          ]}
          accent="#ff8a4f"
        />
      </Sequence>

      <Sequence from={Math.round(235 * fps)} durationInFrames={Math.round(5.0 * fps)}>
        <HeroText text="EUROGANG / 2026" />
      </Sequence>

      {/* Bass-drop SFX at the 99s drop mark */}
      <Sequence from={Math.round(99.0 * fps)} durationInFrames={Math.round(2.0 * fps)}>
        <Audio src={staticFile('sfx/bass_drop.mp3')} volume={0.6} />
      </Sequence>

      {/* Ambient SFX layer — build-act riser (95-99s) swells into the drop.
         v44: crowd_gasp.mp3 + crowd_cheer.mp3 removed per user — stadium
         crowd reactions felt foreign on a private trip vlog drop. The
         music + visuals carry the drop punch on their own. */}
      <Sequence from={Math.round(95 * fps)} durationInFrames={Math.round(4.0 * fps)}>
        <Audio src={staticFile('sfx/riser_build.mp3')} volume={0.32} />
      </Sequence>

      {/* Drop Punctuation — letterbox bars snap in 4 frames before the drop and
         release outward 4 frames after, with a 3-frame white flash centred on
         the drop. Centred at frame round(25 * fps) by starting the sequence 5
         frames earlier and using centerFrame=5. */}
      <Sequence
        from={Math.round(99.0 * fps) - 5}
        durationInFrames={14}
      >
        <DropPunctuation centerFrame={5} liveFrames={14} flashColor="#ffffff" />
      </Sequence>

      {/* v41 surprise #1: cold-open cover — black with typed title for first
         1.5s before any video plays. Sets vlog/intentional tone vs raw cut-in. */}
      <Sequence from={0} durationInFrames={Math.round(1.5 * fps)}>
        <ColdOpenCover
          text="EUROGANG"
          subtitle="APR 25 — MAY 03 · 2026"
          liveFrames={Math.round(1.5 * fps)}
        />
      </Sequence>

      {/* v41 surprise #2: ShutterClose at the pre-drop moment. Cinema bars
         snap shut, hold ~3 frames, snap open with the drop punctuation. */}
      <Sequence from={Math.round(98.5 * fps)} durationInFrames={Math.round(0.6 * fps)}>
        <ShutterClose liveFrames={Math.round(0.6 * fps)} closeFrame={Math.round(0.4 * fps)} />
      </Sequence>

      {/* v41 surprise #3: small audio waveform pulse indicator bottom-right
         during drop act. Locked to detected beats. "Music is playing" cue. */}
      <AudioPulseBars
        beatsS={EDIT_BEATS}
        windowStartS={99}
        windowEndS={235}
        barCount={14}
        accent="#ff8a4f"
      />

      <FilmGrain intensity={grainIntensity} count={120} />

      {/* v33: subtle vignette pulls focus to center — always on, ~5% edge
         darkening. Common pro-grade move, looks cinematic without standing out. */}
      <Vignette strength={0.45} />

      {/* v45: BeatFlash gated to each editBurst window. peakOpacity 0.10
         INSIDE editBursts, 0 outside. Each window gets its own BeatFlash
         instance scoped to its [startS, endS]. Vlog mode reads cleanly
         (no amber pulse competing with speech). */}
      {EDIT_BURSTS.map((w, i) => (
        <BeatFlash
          key={`beatflash-${i}`}
          onsetsS={EDIT_ONSETS}
          windowStartS={w.startS}
          windowEndS={w.endS}
          durationFrames={3}
          peakOpacity={0.10}
        />
      ))}

      {showStamps && <CornerStamp totalS={TOTAL_S} />}

      {showDebug && (
        <DebugClipHud
          picks={picks}
          schedule={SCHEDULE}
          totalS={TOTAL_S}
        />
      )}

      {/* v46: MUSIC_PLACEMENTS — each placement is its own Sequence/Audio with
         its baseVol × fadeEnvelope × duckMul callback. Overlapping placements
         render simultaneously (intentional crossfades, e.g. uzi-drop tail
         222-225s vs metro-outro fade-in 220-222s). Music is decoupled from
         vlog/editBurst Mode — plays at base volume except when speech or
         cool-sound peaks duck it. */}
      {MUSIC_PLACEMENTS.map((p, i) => {
        const seqFrom = Math.round(p.compStartS * fps);
        const seqDur = Math.round((p.compEndS - p.compStartS) * fps);
        const srcStartFrame = Math.round(p.srcOffsetS * fps);
        const srcEndFrame = srcStartFrame + seqDur;
        return (
          <Sequence key={`placement-${p.id}-${i}`} from={seqFrom} durationInFrames={seqDur}>
            <Audio
              src={staticFile(p.file)}
              startFrom={srcStartFrame}
              endAt={srcEndFrame}
              volume={(f) => placementVolumes[i](f / fps + p.compStartS)}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------------------------
// DebugClipHud — bottom-left text overlay surfacing the active clip + effects.
// Rendered only when showDebug=true. Lets the user point to a specific slot or
// transition kind when reviewing.
// -----------------------------------------------------------------------------

const DebugClipHud: React.FC<{
  picks: { meta: ScoredVideo; sourceStartS: number }[];
  schedule: CutSlot[];
  totalS: number;
}> = ({ picks, schedule, totalS }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Find active slot
  let activeIdx = 0;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].startS <= t) activeIdx = i;
    else break;
  }
  const slot = schedule[activeIdx];
  const pick = picks[activeIdx];
  if (!slot || !pick) return null;

  const motionKind = motionForClip(pick.meta.file, slot.act);
  // Same day-boundary check as the transition loop
  const prevPick = picks[activeIdx - 1];
  const prevDay = prevPick ? (CAPTIME[prevPick.meta.file] ?? prevPick.meta.file).slice(0, 10) : '';
  const currDay = (CAPTIME[pick.meta.file] ?? pick.meta.file).slice(0, 10);
  const isDayBoundary = !!prevDay && prevDay !== currDay;
  const transitionKind = transitionKindForCut(slot, activeIdx, isDayBoundary);
  const b = pick.meta.brightness ?? 0.40;
  const exposureFactor = Math.max(0.85, Math.min(1.15, 0.40 / Math.max(0.05, b)));

  const isHero = slot.act === 'drop' && slot.startS >= totalS - 5.0;
  const isPreDropTension =
    slot.act === 'build' && slot.startS >= 24 && slot.startS < 25;
  const playbackRate = isHero ? 0.78 : isPreDropTension ? 0.7 : 1;

  // Distance to nearest cut (for transition decoration awareness)
  const cutFrame = Math.round(slot.startS * fps);
  const halfFrames = transitionKind === 'cutoutSlide' ? 6 : 3;
  const inTransition = transitionKind !== 'none' && Math.abs(frame - cutFrame) <= halfFrames;

  // Strip prefix / extension for readable filename
  const filename = pick.meta.file.split('/').pop() ?? pick.meta.file;
  const shortName = filename.replace(/\.(mp4|mov|MOV|MP4)$/i, '').slice(-46);
  const score = pick.meta.quality?.toFixed?.(3) ?? '?';
  const tag = (TAGS as Record<string, ContentTag | undefined>)[pick.meta.file] ?? '?';

  // Source window
  const srcStart = pick.sourceStartS.toFixed(2);
  const srcEnd = (pick.sourceStartS + slot.durationS).toFixed(2);

  // v37: pick reasoning — why did the picker land on THIS clip?
  // Re-derives the picker's logic for the active slot.
  const tagPrefs = preferredTagsForAct(slot.act);
  const tagPrefIdx = tagPrefs.indexOf(tag as ContentTag);
  const tagPrefLabel = tagPrefIdx === 0 ? '1st-choice' : tagPrefIdx === 1 ? '2nd-choice' : tagPrefIdx === 2 ? '3rd-choice' : 'fallback';
  const isCue = (CUE_FILES as Set<string>).has(pick.meta.file);
  const captureTime = (CAPTIME[pick.meta.file] ?? '').slice(11, 19);  // HH:MM:SS
  const dayLabel = currDay || 'unknown';
  const qualityBucket = pick.meta.quality >= 0.7 ? 'HIGH' : pick.meta.quality >= 0.5 ? 'mid' : 'low';
  const durationFit = (slot.durationS / pick.meta.duration * 100).toFixed(0);

  const reasonParts: string[] = [];
  reasonParts.push(`${tagPrefLabel}(${tag})`);
  if (isCue) reasonParts.push('CUE-FILE');
  if (isDayBoundary) reasonParts.push(`day-boundary(${prevDay}→${currDay})`);
  reasonParts.push(`q:${qualityBucket}`);
  reasonParts.push(`fit:${durationFit}%`);

  const lines: { label: string; value: string; warn?: boolean }[] = [
    { label: 't', value: `${t.toFixed(2)}s   slot ${activeIdx + 1}/${schedule.length}   act:${slot.act}` },
    { label: 'clip', value: shortName },
    { label: 'cap', value: `${dayLabel} ${captureTime}` },
    { label: 'src', value: `[${srcStart}→${srcEnd}]s   dur:${slot.durationS.toFixed(2)}s` },
    { label: 'fx', value: `motion:${motionKind}   exp:${exposureFactor.toFixed(2)}   tag:${tag}   q:${score}` },
    {
      label: 'trans',
      value: `${transitionKind}${inTransition ? '  ◀ ACTIVE' : ''}${isDayBoundary ? '  (day-boundary)' : ''}`,
      warn: inTransition,
    },
    { label: 'why', value: reasonParts.join(' · '), warn: isDayBoundary || isCue },
  ];
  if (playbackRate !== 1) {
    lines.push({ label: 'rate', value: `${playbackRate}× ${isHero ? '(hero outro)' : '(pre-drop tension)'}`, warn: true });
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 18,
        bottom: 18,
        maxWidth: '78%',
        padding: '10px 14px',
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,140,80,0.55)',
        borderRadius: 6,
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        fontSize: 18,
        lineHeight: 1.35,
        color: '#f4ede2',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {lines.map((l) => (
        <div key={l.label} style={{ whiteSpace: 'nowrap', color: l.warn ? '#ffb066' : '#f4ede2' }}>
          <span style={{ color: '#ff8a4f', fontWeight: 600, marginRight: 8 }}>{l.label}</span>
          {l.value}
        </div>
      ))}
    </div>
  );
};

/* Motion model lives in lib/motion.ts (shared with FaceTrackedLabel for
   per-frame Ken-Burns compensation so labels stay glued to faces). */
import { motionForClip, computeMotion, MotionKind, hashUnit } from '../lib/motion';

// -----------------------------------------------------------------------------
const VlogClip: React.FC<{
  src: string;
  sourceStartS: number;
  durationFrames: number;
  act: Act;
  filter: string;
  fps: number;
  exposureFactor?: number;
  /** Source playback rate. 1.0 = real-time. Lower for slow-mo (the hero outro
   *  shot uses 0.78 — subtle slowdown that lets the final clip "breathe"
   *  through the 5-second hero hold without slipping past the source end). */
  playbackRate?: number;
}> = ({
  src,
  sourceStartS,
  durationFrames,
  act,
  filter,
  fps,
  exposureFactor = 1,
  playbackRate = 1,
}) => {
  const frame = useCurrentFrame();
  const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
  const tNorm = ease(Math.min(1, Math.max(0, frame / Math.max(1, durationFrames))));

  const motionKind = motionForClip(src, act);
  const m = computeMotion(motionKind, tNorm, act);

  // v26: removed calm-act fadeIn/fadeOut. The previous fade-to-opacity-0 went
  // through the black background — read as "fade to dark, fade up new clip"
  // which the user flagged as weak. Hard cuts everywhere now; the
  // `lightBloom` / `whipPan` decorations on selected calm cuts cover the
  // visual interest the soft fade was trying to provide.
  const opacity = 1;

  // Append per-clip exposure + coordinated hue / saturation / contrast jitter
  // onto the per-act grade. Each axis derived from the filename hash with a
  // different key so they're independent — but all small enough to stay within
  // the act's overall grade (so calm still reads warm, drop still reads cool).
  // Net effect: adjacent cuts in the same act look like they were captured on
  // different cameras / different moments, not run through one filter pass.
  const hueShift = (hashUnit(src + ':hue') - 0.5) * 8;        // -4..+4 deg
  const satShift = (hashUnit(src + ':sat') - 0.5) * 0.10;     // -0.05..+0.05
  const contrastShift = (hashUnit(src + ':con') - 0.5) * 0.08; // -0.04..+0.04
  const exposureChunk = exposureFactor !== 1 ? ` brightness(${exposureFactor.toFixed(3)})` : '';
  const hueChunk = ` hue-rotate(${hueShift.toFixed(2)}deg)`;
  const satChunk = ` saturate(${(1 + satShift).toFixed(3)})`;
  const contrastChunk = ` contrast(${(1 + contrastShift).toFixed(3)})`;
  const finalFilter = `${filter}${exposureChunk}${hueChunk}${satChunk}${contrastChunk}`;

  return (
    <AbsoluteFill style={{ filter: finalFilter, opacity, overflow: 'hidden' }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={Math.round(sourceStartS * fps)}
        muted
        playbackRate={playbackRate}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${m.scale}) translate(${m.translateX}%, ${m.translateY}%) rotate(${m.rotate}deg)`,
          willChange: 'transform',
        }}
      />
    </AbsoluteFill>
  );
};

const CornerStamp: React.FC<{ totalS: number }> = ({ totalS }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const op = interpolate(t, [0, 1.0, totalS - 1.0, totalS], [0, 0.65, 0.65, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  const ff = Math.floor((t * fps) % fps).toString().padStart(2, '0');
  const act = actAtTime(t).toUpperCase();
  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 60,
        color: '#f4ede4',
        fontFamily: 'SF Mono, ui-monospace, monospace',
        fontSize: 22,
        letterSpacing: 2,
        opacity: op,
        textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        lineHeight: 1.5,
      }}
    >
      <div>EUROGANG · 2026</div>
      <div style={{ opacity: 0.55 }}>
        {m}:{s}:{ff}
      </div>
      <div style={{ opacity: 0.4, fontSize: 16, marginTop: 4 }}>{act}</div>
    </div>
  );
};
