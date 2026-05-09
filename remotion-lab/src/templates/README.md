# `src/templates/` — Standalone & Brief-Driven Templates

Two flavours live here:

1. **Standalone templates** — single-file Remotion compositions with Zod schemas + sensible defaults. Drop-in usable, no project context needed. Useful for one-off cards, lower thirds, charts, etc.
2. **Brief-driven templates** — folders (e.g. `F1Vlog/`) with their own schema, modes, overlays, and JSON briefs that produce many variants from one composition.

Templates **consume** from `src/core/` (overlays, transitions, lib helpers).

Templates **don't** depend on `src/projects/` — they should be reusable across projects (or for new projects).

---

## Standalone templates (single-file)

Each is a self-contained `.tsx` with `<Component>`, `<componentDefaults>`, `<componentSchema>` exported. Render via Composition ID.

| Template | Composition ID(s) | Purpose |
|---|---|---|
| `BarChart.tsx` | `BarChart` | animated horizontal/vertical bar chart |
| `EndCard.tsx` | `EndCard` | end-of-video card with rotating decorative rings |
| `LowerThird.tsx` | `LowerThird` | broadcast-style lower-third name+title strip |
| `MapReveal.tsx` | `MapReveal` | animated zoom + pin-drop on equirect projection |
| `PhotoCarousel.tsx` | `PhotoCarousel` | Ken Burns + crossfade carousel |
| `ProductTrailer.tsx` | `ProductTrailer` | composes 4 templates from JSON brief — 26-sec trailer |
| `QuoteCard.tsx` | `QuoteCard` | quote with auto-fit font sizing + word-by-word reveal |
| `StatReveal.tsx` | `StatReveal` | spring-driven number counter with tabular-nums |
| `SubtitleBurner.tsx` | `SubtitleBurner` | subtitle styles — classic, kinetic, tiktok-bold |
| `TitleCard.tsx` | `TitleCardBold`, `TitleCardEditorial`, `TitleCardMinimal` | title card, 3 visual variants via `variant` prop |

`common.ts` — shared utilities used by multiple standalone templates.

---

## Brief-driven templates (folders)

### `F1Vlog/` — multi-mode F1 vlog with telemetry

```
F1Vlog/
├── F1Vlog.tsx           main composition — picks mode per scene
├── schema.ts            Zod schema (clipRef, telemetrySample, eventCaption, vlog/edit/bridge scenes, team-colors)
├── modes/               three scene modes
│   ├── VlogScene.tsx    talking-head with lower-third
│   ├── EditMontage.tsx  beat-synced clip montage
│   └── ModeBridge.tsx   transition between modes
├── overlays/            project-specific overlays
│   ├── EventCaption.tsx
│   ├── LowerThird.tsx
│   └── TelemetryHUD.tsx  speed/gear/RPM/lap HUD
└── colorgrade/          F1-specific color grading
```

Briefs in `briefs/*.json` at repo root drive the variant generation:
- `briefs/v2_canonical.json`
- `briefs/variant_lemans24.json`
- `briefs/variant_monaco_pole.json`
- `briefs/variant_racestart.json`

Render any brief by setting `defaultProps` to the brief's content (see `Root.tsx` `F1Vlog` Composition).

---

## Adding a new template

**Standalone (single-file):**
1. Create `src/templates/<Name>.tsx`
2. Export the component, defaults constant, and Zod schema
3. Import + register in `src/Root.tsx` with `defaultProps` and `schema`
4. Verify it renders standalone — `npx remotion render src/index.ts <Name> outputs/templates/<Name>.mp4`
5. Add to the table above

**Brief-driven (folder):**
1. Create `src/templates/<Name>/`
2. Inside: `<Name>.tsx`, `schema.ts`, optional `modes/`, `overlays/`, etc.
3. Brief JSONs go to `briefs/`
4. Register in `src/Root.tsx` (often with `calculateMetadata` for variable duration)
