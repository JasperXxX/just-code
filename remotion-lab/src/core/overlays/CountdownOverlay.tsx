import {AbsoluteFill, useCurrentFrame, spring, useVideoConfig} from 'remotion';

export const CountdownOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const numbers = ['3', '2', '1', 'GO'];
  const idx = Math.min(Math.floor(frame / 18), 3);
  const localFrame = frame % 18;

  const scale = spring({frame: localFrame, fps, config: {damping: 8, stiffness: 150}});
  const opacity = localFrame < 15 ? 1 : 1 - (localFrame - 15) / 3;

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{
        color: idx === 3 ? '#FF0000' : 'white',
        fontSize: idx === 3 ? 200 : 300,
        fontWeight: 900,
        fontFamily: 'Arial Black, sans-serif',
        transform: `scale(${scale})`,
        opacity,
        textShadow: '0 0 40px rgba(255,255,255,0.5)',
      }}>{numbers[idx]}</div>
    </AbsoluteFill>
  );
};
