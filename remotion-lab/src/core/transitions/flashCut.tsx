import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';

export type FlashCutProps = {
  color?: string;
};

const FlashCutComponent: React.FC<TransitionPresentationComponentProps<FlashCutProps>> = ({
  children,
  presentationProgress,
  passedProps,
}) => {
  const color = passedProps.color ?? '#ffffff';
  // Hard cut + flash overlay that peaks at midpoint
  const flash = Math.sin(presentationProgress * Math.PI);
  return (
    <AbsoluteFill>
      {children}
      <AbsoluteFill style={{ backgroundColor: color, opacity: flash }} />
    </AbsoluteFill>
  );
};

export const flashCut = (props: FlashCutProps = {}): TransitionPresentation<FlashCutProps> => ({
  component: FlashCutComponent,
  props,
});
