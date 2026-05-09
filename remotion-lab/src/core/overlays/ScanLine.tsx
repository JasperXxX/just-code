import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';

export const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 47], [0, 1080]);

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      <div style={{
        position: 'absolute',
        top: y,
        left: 0,
        width: '100%',
        height: 3,
        background: 'linear-gradient(90deg, transparent, white, transparent)',
        boxShadow: '0 0 20px rgba(255,255,255,0.5)',
      }} />
    </AbsoluteFill>
  );
};
