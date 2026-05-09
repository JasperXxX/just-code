import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Series,
  staticFile,
} from 'remotion';
import { f1VlogSchema, f1VlogDefaults, computeTotalDuration } from './schema';
import type { F1VlogProps } from './schema';
import { VlogScene } from './modes/VlogScene';
import { EditMontage } from './modes/EditMontage';
import { ModeBridge } from './modes/ModeBridge';
import { Vignette } from '../../core';

export { f1VlogSchema, f1VlogDefaults, computeTotalDuration };
export type { F1VlogProps };

const resolveAudio = (src: string): string => {
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith('/')) return staticFile(src.slice(1));
  return staticFile(src);
};

export const F1Vlog: React.FC<F1VlogProps> = (props) => {
  const { scenes, team, teamColor, teamColorSecondary, voiceOverSrc, musicSrc } = props;

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Series>
        {scenes.map((scene) => {
          if (scene.mode === 'vlog') {
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={scene.durationFrames}
                layout="none"
              >
                <VlogScene
                  scene={scene}
                  team={team}
                  teamColor={teamColor}
                  teamColorSecondary={teamColorSecondary}
                />
              </Series.Sequence>
            );
          }

          if (scene.mode === 'edit') {
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={scene.durationFrames}
                layout="none"
              >
                <EditMontage scene={scene} team={team} teamColor={teamColor} />
              </Series.Sequence>
            );
          }

          return (
            <Series.Sequence
              key={scene.id}
              durationInFrames={scene.durationFrames}
              layout="none"
            >
              <ModeBridge scene={scene} voiceOverSrc={voiceOverSrc} />
            </Series.Sequence>
          );
        })}
      </Series>

      {voiceOverSrc ? <Audio src={resolveAudio(voiceOverSrc)} volume={1} /> : null}
      {musicSrc ? <Audio src={resolveAudio(musicSrc)} volume={0.4} /> : null}

      {/* Reuse-proof: imported from src/core barrel — shows core/ → F1Vlog reuse works */}
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};
