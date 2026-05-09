import {AbsoluteFill, useCurrentFrame, random} from 'remotion';

export const WaveformBar: React.FC = () => {
  const frame = useCurrentFrame();
  const barCount = 40;

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 100px 200px'}}>
      <div style={{display: 'flex', gap: 4, alignItems: 'flex-end'}}>
        {Array.from({length: barCount}, (_, i) => {
          const height = 20 + random(`bar-${i}-${frame}`) * 150;
          return (
            <div key={i} style={{
              width: 8,
              height,
              backgroundColor: 'white',
              opacity: 0.7,
              borderRadius: 2,
            }} />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
