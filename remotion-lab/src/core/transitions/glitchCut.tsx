import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';

export type GlitchCutProps = {
  splitPx?: number;
};

const GlitchCutComponent: React.FC<TransitionPresentationComponentProps<GlitchCutProps>> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const splitPx = passedProps.splitPx ?? 16;
  const p =
    presentationDirection === 'entering'
      ? 1 - presentationProgress
      : presentationProgress;
  const offset = p * splitPx;

  return (
    <AbsoluteFill>
      {/* R channel offset */}
      <AbsoluteFill
        style={{
          filter: 'url(#rgb-redOnly)',
          transform: `translateX(${-offset}px)`,
          mixBlendMode: 'screen',
        }}
      >
        {children}
      </AbsoluteFill>
      {/* G channel center */}
      <AbsoluteFill style={{ filter: 'url(#rgb-greenOnly)', mixBlendMode: 'screen' }}>
        {children}
      </AbsoluteFill>
      {/* B channel offset */}
      <AbsoluteFill
        style={{
          filter: 'url(#rgb-blueOnly)',
          transform: `translateX(${offset}px)`,
          mixBlendMode: 'screen',
        }}
      >
        {children}
      </AbsoluteFill>
      {/* Slice tear at peak */}
      {p > 0.45 && (
        <AbsoluteFill
          style={{
            clipPath: `inset(${20 + Math.sin(p * 30) * 8}% 0 ${30 + Math.cos(p * 25) * 8}% 0)`,
            transform: `translateX(${(p - 0.5) * 30}px)`,
            opacity: 0.85,
          }}
        >
          {children}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const glitchCut = (props: GlitchCutProps = {}): TransitionPresentation<GlitchCutProps> => ({
  component: GlitchCutComponent,
  props,
});
