/**
 * Barrel export for `src/core/`.
 *
 * Lets consumers do:
 *   import { Vignette, RGBSplit, KineticText, beats, filters } from '../../core';
 *
 * instead of deep-pathing into individual files. See CATALOGUE.md for the
 * tagged index of what's available.
 *
 * Convention: re-export everything from each module (no curated list — keeps
 * the barrel a thin pass-through; if there's a name collision, TypeScript
 * will surface it at compile time).
 */

// Overlays (31)
export * from './overlays/AmbientLayers';
export * from './overlays/AnimatedText';
export * from './overlays/AudioPulseBars';
export * from './overlays/BeatFlash';
export * from './overlays/BoldHeadline';
export * from './overlays/CaptionOverlay';
export * from './overlays/ChromaticVignette';
export * from './overlays/ColdOpenCover';
export * from './overlays/CountdownOverlay';
export * from './overlays/CrosshairOverlay';
export * from './overlays/DayCard';
export * from './overlays/DropPunctuation';
export * from './overlays/FaceSpotlight';
export * from './overlays/FaceTrackedLabel';
export * from './overlays/GlitchOverlay';
export * from './overlays/KenBurnsImg';
export * from './overlays/KineticText';
export * from './overlays/LetterSplit';
export * from './overlays/NegativeFlash';
export * from './overlays/ParticleField';
export * from './overlays/RGBSplit';
export * from './overlays/ScanLine';
export * from './overlays/ShutterClose';
export * from './overlays/SlowReveal';
export * from './overlays/StyledSubtitle';
export * from './overlays/TextFlash';
export * from './overlays/TripStats';
export * from './overlays/TypeWriter';
export * from './overlays/Vignette';
export * from './overlays/WaveformBar';
export * from './overlays/WhiteFlicker';

// Transitions (4)
export * from './transitions/decorations';
export * from './transitions/flashCut';
export * from './transitions/glitchCut';
export * from './transitions/whipPan';

// Library helpers
export * from './lib/beats';
export * from './lib/filters';
export * from './lib/loadBeats';
export * from './lib/motion';
export * from './lib/photoScore';
export * from './lib/sfx';
export * from './lib/useBeatPulse';
