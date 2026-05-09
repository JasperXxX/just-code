/**
 * Pipeline A — CSV → Personalized 6-second card.
 * Composes TitleCard (the big greeting) with a LowerThird (name + role) and a
 * fade outro card. Driven entirely by input props from the CSV row.
 */
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { z } from 'zod';
import { TitleCard } from '../templates/TitleCard';
import { LowerThird } from '../templates/LowerThird';
import { COLORS } from '../templates/common';

export const personalizedCardSchema = z.object({
  name: z.string(),
  role: z.string(),
  message: z.string(),
  accent: z.string().default(COLORS.accent),
});

export type PersonalizedCardProps = z.infer<typeof personalizedCardSchema>;

export const personalizedCardDefaults: PersonalizedCardProps = {
  name: 'YOUR NAME',
  role: 'TEAM ATLAS',
  message: 'Welcome aboard.',
  accent: COLORS.accent,
};

export const PersonalizedCard: React.FC<PersonalizedCardProps> = ({
  name,
  role,
  message,
  accent,
}) => {
  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Sequence from={0} durationInFrames={120}>
        <TitleCard title={name.split(' ')[0]} subtitle={message} variant="bold" accent={accent} />
      </Sequence>
      <Sequence from={45} durationInFrames={75}>
        <LowerThird name={name} role={role} accentColor={accent} align="left" />
      </Sequence>
    </AbsoluteFill>
  );
};
