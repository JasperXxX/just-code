# Operation Total Remotion — Decisions Log

> Append-only. Every assumption made without consulting the user goes here, with reasoning.

## 2026-05-05 — Setup

**D1.** Skip `create-video` interactive scaffold; set up manually.
*Reason:* `create-video` prompts for template choice, not safe to run autonomously. Manually creating the project gives full control of structure and lets us match Operation Total Remotion's required directory layout (studies/, templates/, pipelines/, outputs/) exactly.

**D2.** Use npm (already on host as v11.9 + pnpm 10.33). Standardize on npm to keep one lockfile.
*Reason:* host has both, npm is simpler for a single-package repo, fewer cross-tool surprises.

**D3.** Install all major `@remotion/*` add-ons up front — even if unused initially. About 30 MB total node_modules cost.
*Reason:* directive says "investigate all surfaces"; less friction if every package is already there.

**D4.** No `~/.env` exists on host → AI augmentation surface (Phase 1 surface 6: AI-generated assets) is degraded. Will use procedural / mathematical generation instead.
*Reason:* observed `test -f ~/.env` returned false. Not going to fabricate keys.

**D5.** Asset strategy: prefer procedural / programmatic content over downloads. Download CC0 fonts via `@fontsource` / `@remotion/google-fonts`. Download videos sparingly (only when needed for a demonstration that programmatic content can't satisfy).
*Reason:* every download requires a `LICENSES.md` entry and adds review surface. Programmatic content is auditable, deterministic, and license-clean by construction.

**D6.** Resolution targets: 1920×1080 (16:9) for landscape work, 1080×1920 (9:16) for vertical/social, 1080×1080 (1:1) for square. fps default 30, occasionally 24 (film) or 60 (motion).
*Reason:* covers broadcast, TikTok/Reels, and Instagram feed in one matrix.

**D7.** Render outputs go to `outputs/v{N}/` with `v0` reserved for the very first smoke MP4. Each capability study renders into `studies/<name>/v1.mp4` and `v2.mp4`.
*Reason:* matches the directive's verification protocol.

**D8.** Self-contained — do NOT touch `~/davinci-flow/` or its `remotion-dev/` sister project. They run in parallel under a separate session.
*Reason:* directive explicit.

## 2026-05-08 — Library discoverability refactor

**D9.** Library was discoverable only by reading 31 files. Restructured for agent-native navigation.
*Reason:* When a user (or future agent) asks "make me a vlog with mood X" or "an ad with energy Y", the repo had no clear entry point. Moves: 8 FX-demo compositions out of `src/core/fx/` into `src/projects/eurogang/compositions/fx-demos/` (they were never effects — always full Eurogang demo-comps wrapping one effect for isolated render-tests). 3 top-level files (`HelloWorld`, `ValorantEdit`, `FlowEdit`) cleaned up. New: `/CLAUDE.md` (agent entry), `src/core/CATALOGUE.md` (semantic tagged index of all reusables), `src/core/README.md` (conventions), `src/core/index.ts` (barrel export), `src/projects/README.md`, `src/templates/README.md`. 
*Out of scope:* extracting pure-effect logic from FX demo-compositions (deferred until a real second-consumer needs `BassPump` etc. as a primitive).
*See:* `docs/specs/2026-05-07-library-discoverability-design.md`, `docs/MIGRATIONS/2026-05-08-library-discoverability.md`.
