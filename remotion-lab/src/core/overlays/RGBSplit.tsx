import React from 'react';
import { AbsoluteFill } from 'remotion';

/**
 * Chromatic aberration / RGB-split overlay.
 * Wrap content in this to apply a 3-channel offset.
 *
 * Requires the SVG channel filters to be present in the document — these
 * are injected once by <SvgChannelFilters/>.
 */
export const RGBSplit: React.FC<{
  amount: number;
  children: React.ReactNode;
  blend?: 'screen' | 'normal';
}> = ({ amount, children, blend = 'screen' }) => {
  if (amount < 0.1) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: 'url(#rgb-redOnly)', transform: `translate(${-amount}px, ${-amount * 0.3}px)`, mixBlendMode: blend }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ filter: 'url(#rgb-greenOnly)', mixBlendMode: blend }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ filter: 'url(#rgb-blueOnly)', transform: `translate(${amount}px, ${amount * 0.3}px)`, mixBlendMode: blend }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Drop this once at the top of the composition tree. */
export const SvgChannelFilters: React.FC = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
    <defs>
      <filter id="rgb-redOnly">
        <feColorMatrix
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
        />
      </filter>
      <filter id="rgb-greenOnly">
        <feColorMatrix
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
        />
      </filter>
      <filter id="rgb-blueOnly">
        <feColorMatrix
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
        />
      </filter>
    </defs>
  </svg>
);
