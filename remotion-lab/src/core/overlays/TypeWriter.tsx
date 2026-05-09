import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

export const TypeWriter: React.FC<{text: string; color?: string}> = ({text, color = '#FFFFFF'}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const charsToShow = Math.min(Math.floor(frame / 2), text.length);
  const displayText = text.substring(0, charsToShow);
  const showCursor = frame % 8 < 4;

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{
        color,
        fontSize: 60,
        fontFamily: 'Courier New, monospace',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textShadow: `0 0 10px ${color}40`,
      }}>
        {displayText}
        {showCursor && charsToShow < text.length && <span style={{opacity: 0.8}}>|</span>}
      </div>
    </AbsoluteFill>
  );
};
