// CSS filter recipes mapped to mood packs from DARK_FLOW_STYLE_BIBLE.md.
// Apply these as `filter:` CSS on a wrapping div around photos/clips.

export const FILTERS = {
  // Dark-flow base — bible target brightness 0.13–0.20
  darkFlow: 'brightness(0.85) contrast(1.18) saturate(0.78)',
  // Travis Scott red neon
  redNeon: 'brightness(0.72) contrast(1.32) saturate(1.4) hue-rotate(-15deg)',
  // Yeezy / Kanye desaturated grain look
  yeezy: 'brightness(0.9) contrast(1.05) saturate(0.55) sepia(0.18)',
  // Carti opium / dim purple
  opium: 'brightness(0.62) contrast(1.22) saturate(0.7) hue-rotate(20deg)',
  // BW high contrast (sh1zu1 reference)
  bwCrushed: 'brightness(0.95) contrast(1.45) saturate(0)',
  // Faded film / archival
  archival: 'brightness(0.92) contrast(1.05) saturate(0.5) sepia(0.4)',
} as const;

export type FilterName = keyof typeof FILTERS;

/** Compose a base filter with a per-clip variation factor. */
export function composeFilter(base: FilterName, variant: number): string {
  // small per-clip variations to avoid mechanical look
  const b = 1 + (variant - 0.5) * 0.06; // ±3% brightness
  const c = 1 + (variant - 0.5) * 0.08; // ±4% contrast
  return `${FILTERS[base]} brightness(${b}) contrast(${c})`;
}
