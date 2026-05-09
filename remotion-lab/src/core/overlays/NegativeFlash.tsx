import {AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig} from 'remotion';

export const NegativeFlash: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  // Flash: starts white, then inverts
  const flashProgress = interpolate(frame, [0, 3, 6], [1, 0.8, 0], {extrapolateRight: 'clamp'});
  const textOpacity = interpolate(frame, [3, 8, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      {/* White flash */}
      <AbsoluteFill style={{backgroundColor: `rgba(255,255,255,${flashProgress})`}} />

      {/* Negative text block */}
      <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{
          backgroundColor: 'white',
          padding: '15px 60px',
          opacity: textOpacity,
        }}>
          <span style={{
            color: 'black',
            fontSize: 90,
            fontFamily: 'Druk Heavy Trial, Druk Trial, Arial Black, sans-serif',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            {text}
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
