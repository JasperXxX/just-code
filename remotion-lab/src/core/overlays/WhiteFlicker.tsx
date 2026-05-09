import {AbsoluteFill, useCurrentFrame} from 'remotion';

export const WhiteFlicker: React.FC = () => {
  const frame = useCurrentFrame();
  const isOn = frame % 3 === 0;

  return (
    <AbsoluteFill style={{
      backgroundColor: isOn ? 'rgba(255,255,255,0.7)' : 'transparent',
    }} />
  );
};
