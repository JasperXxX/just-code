import { z } from 'zod';

export const TEAM_COLORS = {
  ferrari:    { accent: '#DC0000', secondary: '#FFF200' },
  mercedes:   { accent: '#00D2BE', secondary: '#C8C8C8' },
  redbull:    { accent: '#1E41FF', secondary: '#FFC906' },
  mclaren:    { accent: '#FF8000', secondary: '#47C7FC' },
  astonmartin:{ accent: '#229971', secondary: '#C7E6FF' },
} as const;

export const clipRefSchema = z.object({
  src: z.string(),
  inFrame: z.number().int().nonnegative().default(0),
  outFrame: z.number().int().positive(),
  volume: z.number().min(0).max(1).default(1),
});
export type ClipRef = z.infer<typeof clipRefSchema>;

export const captionSchema = z.object({
  text: z.string(),
  startFrame: z.number().int().nonnegative().default(0),
  endFrame: z.number().int().positive().optional(),
});
export type Caption = z.infer<typeof captionSchema>;

export const lowerThirdSchema = z.object({
  primary: z.string(),
  secondary: z.string().optional(),
  meta: z.string().optional(),
});

export const telemetrySampleSchema = z.object({
  frame: z.number().int().nonnegative(),
  speedKmh: z.number().min(0).max(400),
  gear: z.number().int().min(0).max(8),
  rpm: z.number().min(0).max(15000),
  lap: z.number().int().min(0).optional(),
});
export type TelemetrySample = z.infer<typeof telemetrySampleSchema>;

export const eventCaptionSchema = z.object({
  text: z.string(),
  shotIndex: z.number().int().nonnegative(),
  variant: z.enum(['punch', 'stat', 'flag']).default('punch'),
});
export type EventCaptionData = z.infer<typeof eventCaptionSchema>;

const baseSceneSchema = z.object({
  id: z.string(),
  durationFrames: z.number().int().positive(),
  voSubtitle: captionSchema.optional(),
});

export const vlogSceneSchema = baseSceneSchema.extend({
  mode: z.literal('vlog'),
  clip: clipRefSchema,
  lowerThird: lowerThirdSchema.optional(),
  jitterSeed: z.string().default('vlog-jitter'),
  kenBurns: z.object({
    fromScale: z.number().default(1.0),
    toScale: z.number().default(1.04),
    panX: z.number().default(0),
    panY: z.number().default(0),
  }).default({ fromScale: 1.0, toScale: 1.04, panX: 0, panY: 0 }),
});
export type VlogSceneData = z.infer<typeof vlogSceneSchema>;

export const editShotSchema = z.object({
  clip: clipRefSchema,
  showHUD: z.boolean().default(false),
  event: eventCaptionSchema.optional(),
  telemetry: z.array(telemetrySampleSchema).default([]),
});
export type EditShot = z.infer<typeof editShotSchema>;

export const editMontageSceneSchema = baseSceneSchema.extend({
  mode: z.literal('edit'),
  shots: z.array(editShotSchema).min(1),
  beats: z.array(z.object({
    frame: z.number().int().nonnegative(),
    heavy: z.boolean().default(false),
    chromatic: z.boolean().default(false),
  })).default([]),
  driverColor: z.string().default('#FF1E1E'),
});
export type EditMontageSceneData = z.infer<typeof editMontageSceneSchema>;

export const bridgeSceneSchema = baseSceneSchema.extend({
  mode: z.literal('bridge'),
  variant: z.enum(['anticipation', 'impact', 'decay']),
  fromClip: clipRefSchema.optional(),
  toClip: clipRefSchema.optional(),
});
export type BridgeSceneData = z.infer<typeof bridgeSceneSchema>;

export const sceneSchema = z.discriminatedUnion('mode', [
  vlogSceneSchema,
  editMontageSceneSchema,
  bridgeSceneSchema,
]);
export type SceneData = z.infer<typeof sceneSchema>;

export const f1VlogSchema = z.object({
  trackName: z.string(),
  date: z.string(),
  driver: z.string(),
  driverShort: z.string(),
  team: z.enum(['ferrari', 'mercedes', 'redbull', 'mclaren', 'astonmartin']).default('ferrari'),
  teamColor: z.string().default(TEAM_COLORS.ferrari.accent),
  teamColorSecondary: z.string().default(TEAM_COLORS.ferrari.secondary),
  voiceOverSrc: z.string().optional(),
  musicSrc: z.string().optional(),
  scenes: z.array(sceneSchema).min(1),
});

export type F1VlogProps = z.infer<typeof f1VlogSchema>;

export const computeTotalDuration = (scenes: SceneData[]): number =>
  scenes.reduce((sum, s) => sum + s.durationFrames, 0);

export const f1VlogDefaults: F1VlogProps = {
  trackName: 'Spa-Francorchamps',
  date: '2026-07-26',
  driver: 'Valentino ROSSI',
  driverShort: 'V. ROSSI',
  team: 'ferrari',
  teamColor: TEAM_COLORS.ferrari.accent,
  teamColorSecondary: TEAM_COLORS.ferrari.secondary,
  scenes: [
    {
      id: 'cold-open',
      mode: 'vlog',
      durationFrames: 120,
      clip: { src: '/f1/clips/cold_open.mp4', inFrame: 0, outFrame: 240, volume: 0.6 },
      lowerThird: {
        primary: 'V. ROSSI',
        secondary: 'SCUDERIA FERRARI',
        meta: 'SPA-FRANCORCHAMPS · 2026-07-26',
      },
      voSubtitle: { text: '5 a.m. Driving to the track.', startFrame: 24, endFrame: 110 },
      jitterSeed: 'cold-open-jitter',
      kenBurns: { fromScale: 1.0, toScale: 1.04, panX: -1, panY: 0 },
    },
    {
      id: 'paddock',
      mode: 'vlog',
      durationFrames: 105,
      clip: { src: '/f1/clips/paddock.mp4', inFrame: 0, outFrame: 200, volume: 0.7 },
      lowerThird: {
        primary: 'PADDOCK',
        secondary: 'FORMATION LAP -45 MIN',
      },
      voSubtitle: { text: 'You can feel it before you see it.', startFrame: 18, endFrame: 100 },
      jitterSeed: 'paddock-jitter',
      kenBurns: { fromScale: 1.0, toScale: 1.05, panX: 1, panY: 0 },
    },
    {
      id: 'into-the-edit',
      mode: 'bridge',
      variant: 'impact',
      durationFrames: 14,
      fromClip: { src: '/f1/clips/paddock.mp4', inFrame: 200, outFrame: 207, volume: 0.4 },
      toClip:   { src: '/f1/clips/edit/launch.mp4', inFrame: 0, outFrame: 7, volume: 1 },
    },
    {
      id: 'highlight-montage',
      mode: 'edit',
      durationFrames: 360,
      driverColor: TEAM_COLORS.ferrari.accent,
      shots: [
        {
          clip: { src: '/f1/clips/edit/launch.mp4', inFrame: 0, outFrame: 120, volume: 1 },
          showHUD: true,
          event: { text: 'LIGHTS OUT', shotIndex: 0, variant: 'punch' },
          telemetry: [
            { frame: 0,  speedKmh: 0,   gear: 1, rpm: 11500, lap: 1 },
            { frame: 60, speedKmh: 240, gear: 5, rpm: 12200, lap: 1 },
            { frame: 120, speedKmh: 305, gear: 7, rpm: 12800, lap: 1 },
          ],
        },
        {
          clip: { src: '/f1/clips/edit/eau_rouge.mp4', inFrame: 0, outFrame: 120, volume: 1 },
          showHUD: true,
          event: { text: 'EAU ROUGE', shotIndex: 1, variant: 'stat' },
          telemetry: [
            { frame: 0,   speedKmh: 320, gear: 8, rpm: 13100, lap: 12 },
            { frame: 60,  speedKmh: 285, gear: 7, rpm: 12400, lap: 12 },
            { frame: 120, speedKmh: 318, gear: 8, rpm: 13050, lap: 12 },
          ],
        },
        {
          clip: { src: '/f1/clips/edit/overtake.mp4', inFrame: 0, outFrame: 120, volume: 1 },
          showHUD: true,
          event: { text: 'OVERTAKE — P3 → P2', shotIndex: 2, variant: 'punch' },
          telemetry: [
            { frame: 0,   speedKmh: 296, gear: 7, rpm: 12600, lap: 31 },
            { frame: 60,  speedKmh: 311, gear: 8, rpm: 12950, lap: 31 },
            { frame: 120, speedKmh: 305, gear: 7, rpm: 12700, lap: 31 },
          ],
        },
      ],
      // Beat schedule: ~8 cuts in 360f, with 2 heavy beats reserved for event punches.
      beats: [
        { frame: 0,   heavy: true,  chromatic: true  },
        { frame: 36,  heavy: false, chromatic: false },
        { frame: 72,  heavy: false, chromatic: false },
        { frame: 120, heavy: true,  chromatic: true  },
        { frame: 168, heavy: false, chromatic: false },
        { frame: 204, heavy: false, chromatic: false },
        { frame: 240, heavy: true,  chromatic: true  },
        { frame: 300, heavy: false, chromatic: false },
      ],
    },
    {
      id: 'cool-down',
      mode: 'bridge',
      variant: 'decay',
      durationFrames: 24,
      fromClip: { src: '/f1/clips/edit/overtake.mp4', inFrame: 110, outFrame: 134, volume: 0.7 },
      toClip:   { src: '/f1/clips/aftermath.mp4', inFrame: 0, outFrame: 24, volume: 0.6 },
    },
    {
      id: 'aftermath',
      mode: 'vlog',
      durationFrames: 110,
      clip: { src: '/f1/clips/aftermath.mp4', inFrame: 0, outFrame: 220, volume: 0.7 },
      lowerThird: {
        primary: 'P2',
        secondary: 'PODIUM',
        meta: 'GAP +1.842',
      },
      voSubtitle: { text: 'Two seconds. That’s the whole story.', startFrame: 20, endFrame: 105 },
      jitterSeed: 'aftermath-jitter',
      kenBurns: { fromScale: 1.0, toScale: 1.03, panX: 0, panY: -1 },
    },
  ],
};
