/**
 * studies/transitions — reel of every built-in transition + 4 custom ones.
 * 12 transitions × 24 frames each + 12 scenes × 36 frames each = 720 frames @ 30fps = 24s.
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import {
  TransitionSeries,
  linearTiming,
  springTiming,
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { iris } from '@remotion/transitions/iris';
import { none } from '@remotion/transitions/none';

// === Custom presentations ===

const WhipPanComp: React.FC<TransitionPresentationComponentProps<{ direction: 'horizontal' | 'vertical'; blurPx: number }>> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps,
}) => {
  const offset = presentationDirection === 'entering'
    ? (1 - presentationProgress) * 110
    : -presentationProgress * 110;
  const blurAmt = Math.sin(presentationProgress * Math.PI) * passedProps.blurPx;
  const transform = passedProps.direction === 'horizontal' ? `translateX(${offset}%)` : `translateY(${offset}%)`;
  return (
    <AbsoluteFill style={{ transform, filter: `blur(${blurAmt}px)` }}>
      {children}
    </AbsoluteFill>
  );
};
const whipPan = (direction: 'horizontal' | 'vertical' = 'horizontal', blurPx = 30): TransitionPresentation<any> => ({
  component: WhipPanComp,
  props: { direction, blurPx },
});

const FlashCutComp: React.FC<TransitionPresentationComponentProps<{ color: string }>> = ({
  children,
  presentationProgress,
  passedProps,
}) => {
  const flash = Math.sin(presentationProgress * Math.PI);
  return (
    <AbsoluteFill>
      {children}
      <AbsoluteFill style={{ backgroundColor: passedProps.color, opacity: flash }} />
    </AbsoluteFill>
  );
};
const flashCut = (color = '#ffffff'): TransitionPresentation<any> => ({
  component: FlashCutComp,
  props: { color },
});

const ZoomBlurComp: React.FC<TransitionPresentationComponentProps<{}>> = ({
  children,
  presentationProgress,
  presentationDirection,
}) => {
  const p = presentationDirection === 'entering' ? 1 - presentationProgress : presentationProgress;
  const scale = 1 + p * 0.4;
  const blur = p * 14;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)` }}>
      {children}
    </AbsoluteFill>
  );
};
const zoomBlur = (): TransitionPresentation<any> => ({
  component: ZoomBlurComp,
  props: {},
});

const RotateScaleComp: React.FC<TransitionPresentationComponentProps<{}>> = ({
  children,
  presentationProgress,
  presentationDirection,
}) => {
  const p = presentationDirection === 'entering' ? 1 - presentationProgress : presentationProgress;
  return (
    <AbsoluteFill
      style={{
        transform: `rotate(${p * 14}deg) scale(${1 - p * 0.3})`,
        opacity: 1 - p,
        transformOrigin: 'center center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
const rotateScale = (): TransitionPresentation<any> => ({
  component: RotateScaleComp,
  props: {},
});

// === Scene factory ===
const Scene: React.FC<{ label: string; bg: string; fg?: string }> = ({ label, bg, fg = '#fff' }) => (
  <AbsoluteFill style={{ background: bg, alignItems: 'center', justifyContent: 'center' }}>
    <div
      style={{
        color: fg,
        fontFamily: 'SF Pro Display, sans-serif',
        fontSize: 240,
        fontWeight: 800,
        letterSpacing: '-0.03em',
      }}
    >
      {label}
    </div>
  </AbsoluteFill>
);

const TransitionLabel: React.FC<{ name: string }> = ({ name }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 60,
        background: 'rgba(10,10,20,0.85)',
        color: '#fff',
        padding: '14px 28px',
        borderRadius: 8,
        fontFamily: 'SF Mono, ui-monospace, monospace',
        fontSize: 22,
        letterSpacing: 2,
      }}
    >
      {name}
    </div>
  </AbsoluteFill>
);

const SCENE_FRAMES = 30;
const TRANS_FRAMES = 16;

type TItem = {
  name: string;
  presentation: TransitionPresentation<any>;
  timing: ReturnType<typeof linearTiming>;
};

const transitions: TItem[] = [
  { name: 'fade', presentation: fade(), timing: linearTiming({ durationInFrames: TRANS_FRAMES }) },
  { name: 'slide(from-left)', presentation: slide({ direction: 'from-left' }), timing: springTiming({ config: { damping: 200 }, durationInFrames: TRANS_FRAMES }) },
  { name: 'slide(from-bottom)', presentation: slide({ direction: 'from-bottom' }), timing: linearTiming({ durationInFrames: TRANS_FRAMES }) },
  { name: 'wipe(from-right)', presentation: wipe({ direction: 'from-right' }), timing: linearTiming({ durationInFrames: TRANS_FRAMES }) },
  { name: 'flip(from-left)', presentation: flip({ direction: 'from-left' }), timing: linearTiming({ durationInFrames: TRANS_FRAMES + 4 }) },
  { name: 'clockWipe', presentation: clockWipe({ width: 1920, height: 1080 }), timing: linearTiming({ durationInFrames: TRANS_FRAMES }) },
  { name: 'iris(out)', presentation: iris({ width: 1920, height: 1080 }), timing: linearTiming({ durationInFrames: TRANS_FRAMES }) },
  { name: 'none (hard cut)', presentation: none(), timing: linearTiming({ durationInFrames: 1 }) },
  { name: 'whipPan(horizontal)', presentation: whipPan('horizontal', 30), timing: linearTiming({ durationInFrames: TRANS_FRAMES, easing: Easing.bezier(0.4, 0, 0.2, 1) }) },
  { name: 'flashCut(white)', presentation: flashCut('#fff'), timing: linearTiming({ durationInFrames: TRANS_FRAMES }) },
  { name: 'zoomBlur', presentation: zoomBlur(), timing: linearTiming({ durationInFrames: TRANS_FRAMES }) },
  { name: 'rotateScale', presentation: rotateScale(), timing: springTiming({ config: { damping: 14 }, durationInFrames: TRANS_FRAMES + 4 }) },
];

const COLORS = ['#5e9eff', '#9b59ff', '#ff5e9e', '#ff9b59', '#2dd4bf', '#fbbf24', '#a78bfa', '#f87171', '#34d399', '#60a5fa', '#fb923c', '#e879f9', '#22d3ee'];

export const TransitionReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
          <Scene label="01" bg={COLORS[0]} />
          <TransitionLabel name="START" />
        </TransitionSeries.Sequence>
        {transitions.map((t, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Transition timing={t.timing} presentation={t.presentation} />
            <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
              <Scene label={String(i + 2).padStart(2, '0')} bg={COLORS[(i + 1) % COLORS.length]} />
              <TransitionLabel name={t.name} />
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
