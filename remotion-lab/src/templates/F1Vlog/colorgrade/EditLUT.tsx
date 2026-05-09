import React from 'react';
import { AbsoluteFill } from 'remotion';

type EditLUTProps = {
  intensity?: number;
  chromaticAberration?: number;
  vignette?: boolean;
  children?: React.ReactNode;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Static SVG filter defs — registered once, referenced by id.
// Animating the filter graph itself triggers GPU recompiles each frame; keep static.
const CA_FILTER_ID = 'f1vlog-ca-filter';

const ChromaSVGDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
    <defs>
      <filter id={`${CA_FILTER_ID}-r`} x="-10%" y="-10%" width="120%" height="120%">
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <filter id={`${CA_FILTER_ID}-g`} x="-10%" y="-10%" width="120%" height="120%">
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
      <filter id={`${CA_FILTER_ID}-b`} x="-10%" y="-10%" width="120%" height="120%">
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
      </filter>
    </defs>
  </svg>
);

const ChromaticSplit: React.FC<{ amount: number; children?: React.ReactNode }> = ({ amount, children }) => {
  const px = amount * 4;
  return (
    <AbsoluteFill>
      {/* Three-clone trick: red shifted +x, blue shifted -x, green centered.
          Channel filters isolate each via feColorMatrix; 'screen' blend recombines them additively. */}
      <AbsoluteFill
        style={{
          filter: `url(#${CA_FILTER_ID}-r)`,
          transform: `translateX(${px}px)`,
          mixBlendMode: 'screen',
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          filter: `url(#${CA_FILTER_ID}-g)`,
          mixBlendMode: 'screen',
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          filter: `url(#${CA_FILTER_ID}-b)`,
          transform: `translateX(${-px}px)`,
          mixBlendMode: 'screen',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const EditLUT: React.FC<EditLUTProps> = ({
  intensity = 1,
  chromaticAberration = 0,
  vignette = true,
  children,
}) => {
  const k = clamp01(intensity);
  const ca = clamp01(chromaticAberration);

  const baseFilter = `contrast(${1 + 0.18 * k})`;

  return (
    <AbsoluteFill>
      {ca > 0 ? <ChromaSVGDefs /> : null}

      <AbsoluteFill style={{ filter: baseFilter }}>
        {ca > 0 ? <ChromaticSplit amount={ca}>{children}</ChromaticSplit> : children}
      </AbsoluteFill>

      {/* Crushed blacks — flat multiply approximates "lower-luminance only" for a CSS-only stack;
          true luminance-keyed crush would need a feComponentTransfer pass. */}
      <AbsoluteFill
        style={{
          backgroundColor: '#050505',
          mixBlendMode: 'multiply',
          opacity: 0.12 * k,
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundColor: '#4a0000',
          mixBlendMode: 'overlay',
          opacity: 0.08 * k,
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundColor: '#0a1428',
          mixBlendMode: 'screen',
          opacity: 0.06 * k,
          pointerEvents: 'none',
        }}
      />

      {vignette ? (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
            mixBlendMode: 'multiply',
            opacity: k,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export default EditLUT;
