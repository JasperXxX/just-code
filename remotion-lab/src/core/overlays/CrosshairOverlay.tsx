import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';

export const CrosshairOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const rotation = interpolate(frame, [0, 47], [0, 360]);
  const scale = interpolate(frame, [0, 24, 47], [0.8, 1, 0.8]);

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg width={400} height={400} style={{transform: `rotate(${rotation}deg) scale(${scale})`}}>
        <circle cx={200} cy={200} r={150} stroke="white" strokeWidth={2} fill="none" strokeDasharray="10 5" />
        <circle cx={200} cy={200} r={100} stroke="white" strokeWidth={1} fill="none" />
        <line x1={50} y1={200} x2={350} y2={200} stroke="white" strokeWidth={1} />
        <line x1={200} y1={50} x2={200} y2={350} stroke="white" strokeWidth={1} />
      </svg>
    </AbsoluteFill>
  );
};
