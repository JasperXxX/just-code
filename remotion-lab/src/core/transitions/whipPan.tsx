import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';

export type WhipPanProps = {
  direction?: 'horizontal' | 'vertical';
  blurPx?: number;
};

const WhipPanComponent: React.FC<TransitionPresentationComponentProps<WhipPanProps>> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const direction = passedProps.direction ?? 'horizontal';
  const blurPx = passedProps.blurPx ?? 32;

  // Both scenes whip in the same direction.
  // Exiting goes -100% offscreen; entering comes from +100%.
  const offset =
    presentationDirection === 'entering'
      ? (1 - presentationProgress) * 110
      : -presentationProgress * 110;

  // Blur peaks at midpoint
  const blurAmt = Math.sin(presentationProgress * Math.PI) * blurPx;

  const transform =
    direction === 'horizontal'
      ? `translateX(${offset}%)`
      : `translateY(${offset}%)`;

  return (
    <AbsoluteFill
      style={{
        transform,
        filter: `blur(${blurAmt}px)`,
        willChange: 'transform, filter',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const whipPan = (props: WhipPanProps = {}): TransitionPresentation<WhipPanProps> => ({
  component: WhipPanComponent,
  props,
});
