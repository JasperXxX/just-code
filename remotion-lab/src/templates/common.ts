// Shared design tokens for the template library.
export const COLORS = {
  ink: '#0a0a14',
  inkSoft: '#1a1a2e',
  paper: '#f4ede4',
  paperWarm: '#fff8ef',
  white: '#ffffff',
  muted: '#9a9ac0',
  mutedDeep: '#5a5a8a',
  accent: '#5e9eff',
  accentRed: '#ff2d55',
  accentYellow: '#fff200',
  accentGreen: '#22d3ee',
};

export const FONTS = {
  display: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: 'SF Mono, ui-monospace, "Cascadia Code", monospace',
  serif: 'Fraunces, Georgia, serif',
};

export const EASINGS = {
  expoOut: [0.16, 1, 0.3, 1] as const,
  power3Out: [0.22, 1, 0.36, 1] as const,
  power3InOut: [0.65, 0, 0.35, 1] as const,
  springSoft: [0.34, 1.56, 0.64, 1] as const,
};
