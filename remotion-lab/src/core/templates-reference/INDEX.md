# Templates Reference — Cookbook für Eurogang-Vlog

12 kuratierte Templates aus [reactvideoeditor/remotion-templates](https://github.com/reactvideoeditor/remotion-templates) (MIT). **Kein Drop-in** — das sind Demo-Komponenten mit eingebautem Demo-Content. Wertvoll ist die **Mechanik**, die du in deine eigenen `EurogangVlogTripFX_*.tsx` extrahierst.

**Nicht in `Root.tsx` registriert.** Reine Referenz.

> **Hinweis:** `zoom-pulse.tsx` und `ken-burns.tsx` waren ursprünglich Next.js (`next/image`, `style jsx`). Beide wurden zu reinen Remotion-Komponenten umgeschrieben — direkt importierbar.

## Übersicht & Mapping zu deinem Stack

| Template | Pattern | Wo es dir hilft |
|---|---|---|
| `spotlight-reveal.tsx` | `clipPath: circle(${r}% at 50% 50%)` + glow ring via radial-gradient | **EurogangVlogTripFX_MaskRevealCircle.tsx** — Pattern direkt übernehmen |
| `iris-transition.tsx` | clipPath circle, erst zu, dann auf — zwei Scenes parallel | **MaskReveal Spec** (beide Videos parallel, expandierender Spot) |
| `camera-shake.tsx` | `Math.sin(frame * 0.8) * amplitude` X, cosine Y, decaying amplitude | **V1 Beat-Akzent** statt `resolve_apply_fusion_effect(camera_shake)` als Remotion-Overlay |
| `zoom-pulse.tsx` | `(sin(t·2π/period)+1)/2` → scale lerp | **V1 ambient pulse** oder per-onset zoom |
| `vignette-pulse.tsx` | radial-gradient transparent→black, sine-strength | **V5/V7 Adjustment** — Alternative zu FlashFrame, weicher |
| `whip-pan.tsx` | zwei Scenes mit `translateX` + `scaleX` (motion-blur Stretch) | **Cut-Transition** zwischen B-Roll-Beats |
| `film-burn.tsx` | 3 radial-gradients, moving centers via sin/cos, peak intensity mid-anim | **V5 Light Leak Replacement** (komplett in Remotion statt Overlay-File) |
| `noise-grain.tsx` | SVG rects, deterministic pseudo-random per (cell, frame) | **V6 Film Grain** in Remotion-Render statt externes Overlay |
| `ken-burns.tsx` | scale 1→max + translate, easeOut über Duration | **B-Roll / Photo-Reveals** auf V3 |
| `letterbox-reveal.tsx` | top/bottom black bars von 50% auf 12% | **Cinematic Intro** für Eurogang Title Card |
| `text-highlight.tsx` | per-word `interpolate(frame, [start, start+0.5*frames])` für gradient bg width | **Submagic-Style Captions** — Word-by-Word Highlight |
| `glitch-text.tsx` | RGB-Split via 3 Layer (cyan/magenta/white) + sine-displacement | **V2 Title FX** oder Glitch-Akzent zwischen Cuts |

## Pattern-Highlights für deine Specs

### Mask-Reveal (FX Spec)

Aus `spotlight-reveal.tsx` und `iris-transition.tsx`:

```tsx
const radius = interpolate(frame, [0, durationInFrames * 0.8], [0, 75], {
  extrapolateRight: "clamp",
});

// Beide Videos parallel mounten:
<OffthreadVideo src={videoB} />  // unten
<div style={{ clipPath: `circle(${radius}% at 50% 50%)` }}>
  <OffthreadVideo src={videoA} />  // oben, durch Mask sichtbar
</div>

// Glow-Ring genau am Rand:
<div style={{
  background: `radial-gradient(circle at 50% 50%,
    transparent ${radius - 2}%,
    rgba(139, 92, 246, ${glowOpacity}) ${radius}%,
    transparent ${radius + 3}%)`
}} />
```

Das ist **genau dein Eurogang-Spec**: parallel laufende Videos, expandierender Spot, kein harter Cut.

### Beat-Sync ohne FlashFrame

Statt FlashFrame (jedes 2. Onset @ 0.55 — zu dicht laut Memory) → `vignette-pulse` oder `camera-shake` triggern bei starken Onsets:

```tsx
// onsets.json laden, dann pro Onset:
const isNearOnset = onsets.some(o => Math.abs(frame - o.frame) < 4);
const shakeAmp = isNearOnset ? 12 : 0;
```

## Verwendung

```tsx
// Wenn du eine Template direkt rendern willst (nur zum Anschauen):
import SpotlightReveal from "./templates-reference/spotlight-reveal";

// in Root.tsx:
<Composition
  id="ref-spotlight-reveal"
  component={SpotlightReveal}
  durationInFrames={90}
  fps={30}
  width={1080}
  height={1920}
/>
```

Üblicherweise aber: **Pattern lesen, in eigene `EurogangVlogTripFX_*.tsx` einbauen, References-Datei nicht anfassen.**

## Tot wenn du sie nicht brauchst

Die Files dürfen auch komplett gelöscht werden — sie sind reine Doku. Original liegt unter https://github.com/reactvideoeditor/remotion-templates falls du mal eine andere Kategorie brauchst (Charts, Logos, Intros).
