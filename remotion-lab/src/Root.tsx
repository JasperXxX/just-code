import React from 'react';
import { Composition } from 'remotion';
import { HelloWorld } from './studies/hello-world/HelloWorld';

// ====== Studies (Phase 1) ======
import { PrimitivesReference } from './studies/primitives/PrimitivesReference';
import { AnimationProgression } from './studies/animation/AnimationProgression';
import { TypographySystems } from './studies/typography/TypographySystems';
import { DataDriven, dataDrivenDefaults } from './studies/data/DataDriven';
import { AudioReactive } from './studies/audio/AudioReactive';
import { Generative } from './studies/generative/Generative';
import { TransitionReel } from './studies/transitions/TransitionReel';

// ====== Templates (Phase 2) ======
import { LowerThird, lowerThirdDefaults, lowerThirdSchema } from './templates/LowerThird';
import { TitleCard, titleCardDefaults, titleCardSchema } from './templates/TitleCard';
import { EndCard, endCardDefaults, endCardSchema } from './templates/EndCard';
import { QuoteCard, quoteCardDefaults, quoteCardSchema } from './templates/QuoteCard';
import { StatReveal, statRevealDefaults, statRevealSchema } from './templates/StatReveal';
import { BarChart, barChartDefaults, barChartSchema } from './templates/BarChart';
import { MapReveal, mapRevealDefaults, mapRevealSchema } from './templates/MapReveal';
import { PhotoCarousel, photoCarouselDefaults, photoCarouselSchema } from './templates/PhotoCarousel';
import { SubtitleBurner, subtitleBurnerDefaults, subtitleBurnerSchema } from './templates/SubtitleBurner';
import { ProductTrailer, productTrailerDefaults, productTrailerSchema } from './templates/ProductTrailer';

// ====== Pipelines (Phase 3) ======
import { PersonalizedCard, personalizedCardDefaults, personalizedCardSchema } from './pipelines/PersonalizedCard';
import { UrlExplainer, urlExplainerDefaults, urlExplainerSchema, urlExplainerDurationFrames } from './pipelines/UrlExplainer';
import { MusicVideoFromBeats, musicVideoDefaults, musicVideoSchema } from './pipelines/MusicVideoFromBeats';

// ====== Ambitions (Phase 4) ======
import { ParticleGalaxy } from './ambitions/ParticleGalaxy';
import { ThreeScene } from './ambitions/ThreeScene';
import { LiveDashboard, liveDashboardDefaults, liveDashboardSchema, fetchLiveWeather } from './ambitions/LiveDashboard';
import { AdShowcase } from './ambitions/AdShowcase';

// ====== F1 Vlog template (Phase 5) ======
import { F1Vlog, f1VlogDefaults, f1VlogSchema, computeTotalDuration } from './templates/F1Vlog/F1Vlog';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="HelloWorld" component={HelloWorld} durationInFrames={120} fps={30} width={1920} height={1080} defaultProps={{ title: 'OPERATION', subtitle: 'TOTAL REMOTION' }} />

      {/* ====== Phase 1 — Studies ====== */}
      <Composition id="StudyPrimitives"   component={PrimitivesReference}    durationInFrames={360} fps={30} width={1920} height={1080} />
      <Composition id="StudyAnimation"    component={AnimationProgression}   durationInFrames={450} fps={30} width={1920} height={1080} />
      <Composition id="StudyTypography"   component={TypographySystems}      durationInFrames={270} fps={30} width={1920} height={1080} />
      <Composition id="StudyData"         component={DataDriven}             durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={dataDrivenDefaults} />
      <Composition id="StudyAudio"        component={AudioReactive}          durationInFrames={180} fps={30} width={1920} height={1080} />
      <Composition id="StudyGenerative"   component={Generative}             durationInFrames={360} fps={30} width={1920} height={1080} />
      <Composition id="StudyTransitions"  component={TransitionReel}         durationInFrames={620} fps={30} width={1920} height={1080} />

      {/* ====== Phase 2 — Templates ====== */}
      <Composition id="LowerThird"         component={LowerThird}            durationInFrames={120} fps={30} width={1920} height={1080} defaultProps={lowerThirdDefaults}        schema={lowerThirdSchema} />
      <Composition id="TitleCardBold"      component={TitleCard}             durationInFrames={120} fps={30} width={1920} height={1080} defaultProps={titleCardDefaults}         schema={titleCardSchema} />
      <Composition id="EndCard"            component={EndCard}               durationInFrames={120} fps={30} width={1920} height={1080} defaultProps={endCardDefaults}           schema={endCardSchema} />
      <Composition id="QuoteCard"          component={QuoteCard}             durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={quoteCardDefaults}         schema={quoteCardSchema} />
      <Composition id="StatReveal"         component={StatReveal}            durationInFrames={120} fps={30} width={1920} height={1080} defaultProps={statRevealDefaults}        schema={statRevealSchema} />
      <Composition id="BarChart"           component={BarChart}              durationInFrames={120} fps={30} width={1920} height={1080} defaultProps={barChartDefaults}          schema={barChartSchema} />
      <Composition id="MapReveal"          component={MapReveal}             durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={mapRevealDefaults}         schema={mapRevealSchema} />
      <Composition id="PhotoCarousel"      component={PhotoCarousel}         durationInFrames={600} fps={30} width={1920} height={1080} defaultProps={photoCarouselDefaults}     schema={photoCarouselSchema} />
      <Composition id="SubtitleBurner"     component={SubtitleBurner}        durationInFrames={330} fps={30} width={1920} height={1080} defaultProps={subtitleBurnerDefaults}    schema={subtitleBurnerSchema} />
      <Composition id="ProductTrailer"     component={ProductTrailer}        durationInFrames={780} fps={30} width={1920} height={1080} defaultProps={productTrailerDefaults}    schema={productTrailerSchema} />

      {/* ====== Phase 3 — Pipelines ====== */}
      <Composition
        id="PersonalizedCard"
        component={PersonalizedCard}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={personalizedCardDefaults}
        schema={personalizedCardSchema}
      />
      <Composition
        id="UrlExplainer"
        component={UrlExplainer}
        durationInFrames={urlExplainerDurationFrames(urlExplainerDefaults.sentences.length)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={urlExplainerDefaults}
        schema={urlExplainerSchema}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: urlExplainerDurationFrames(props.sentences.length),
        })}
      />
      <Composition
        id="MusicVideoFromBeats"
        component={MusicVideoFromBeats}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={musicVideoDefaults}
        schema={musicVideoSchema}
      />

      {/* ====== Phase 4 — Ambitions ====== */}
      <Composition id="ParticleGalaxy" component={ParticleGalaxy} durationInFrames={300} fps={30} width={1920} height={1080} />
      <Composition id="ThreeScene"     component={ThreeScene}     durationInFrames={300} fps={30} width={1920} height={1080} />
      <Composition
        id="LiveDashboard"
        component={LiveDashboard}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={liveDashboardDefaults}
        schema={liveDashboardSchema}
        calculateMetadata={async ({ props }) => {
          const live = await fetchLiveWeather(props.lat, props.lon, props.city);
          return { props: live };
        }}
      />
      <Composition id="AdShowcase" component={AdShowcase} durationInFrames={900} fps={30} width={1920} height={1080} />

      {/* ====== Phase 5 — F1 Vlog template ====== */}
      <Composition
        id="F1Vlog"
        component={F1Vlog}
        durationInFrames={computeTotalDuration(f1VlogDefaults.scenes)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={f1VlogDefaults}
        schema={f1VlogSchema}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: computeTotalDuration(props.scenes),
        })}
      />
    </>
  );
};
