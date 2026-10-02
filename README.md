# Winzu

Static stakeholder **game**: a cinematic pier departure, sail a marker trail to the lighthouse, dock, then inspect the office desk — open the map for Bar Norte’s living graph, or open paperwork for the documents that matter.

Built with Vite, React, TypeScript, and Three.js. No backend. Deployable on GitHub Pages.

## Play

1. Watch the intro (girl boards the boat), or skip ahead
2. Click the water to sail along floating markers
3. Reach the final marker — automatic docking
4. At the desk: click the **map** for the living graph, or **letters** for document questions
5. Ask the map; use shore CTAs (mail / Calendly)

**Skip to desk** is always available for quick demos.

## Develop

```bash
yarn install
yarn dev
```

Open the URL Vite prints (base path is `/winzu-public/`).

### Visual tooling

- `?compare` — reference overlay (`public/reference.png`) with opacity + split-wipe
- `?debug` — lil-gui for sun, camera, fog, bloom, exposure
- Scene plates: [`assets/scene_0.png`](assets/scene_0.png)–[`scene_3.png`](assets/scene_3.png)
- Flow: [`assets/scene_flow.md`](assets/scene_flow.md)
- Soft color anchors: [`assets/anchors.json`](assets/anchors.json)

```bash
# With yarn preview (or yarn dev) running:
yarn shot m7          # Playwright screenshot → shots/m7.png
yarn anchors m7       # Sample shot vs reference at anchor UVs (soft check)
yarn compress-glb     # meshopt + budgets: assets/renders-src → public/renders
yarn compress-plates  # size-gate plates: assets/scene_*.png → public/plates/
yarn generate-og      # public/og.png from assets/idea still
```

Scene modules live under [`src/scene/`](src/scene/) and [`src/game/scenes/`](src/game/scenes/). Tunables are in [`src/scene/config.ts`](src/scene/config.ts). The React game shell stays in [`src/game/`](src/game/).

### Standards & roadmap

- [`docs/standards-review.md`](docs/standards-review.md) — dry-run audit (best / anti-patterns, severity)
- [`docs/roadmap.md`](docs/roadmap.md) — phased plan to raise architecture, perf, assets, and CI to professional grade

**Art constraints:** flat shading + vertex colors, one low sun vector, Neutral tone mapping, no shadow maps on the sea (desk uses a soft key shadow). Boat + lighthouse load meshopt GLBs from `public/renders/` (Lambert-normalized on load; lighthouse keeps HDR lantern + beam dressing); `?proceduralBoat` / `?proceduralLighthouse` force procedural meshes. Girl / pier / desk stay procedural until assets land. DPR capped at 2 (1.5 mobile); bloom + reflection at half-res.

**Canvas strategy (Phase 4):** Exterior and desk keep **separate** R3F `Canvas` instances. Dock→desk remounts a fresh WebGL context (shader recompile cost is accepted for now). Exterior unmount runs `disposeSeaWorld` + composer/reflection dispose so GPU resources do not accumulate across remounts. Desk uses `frameloop="demand"` (invalidate on pointer / focus / camera blend); exterior stays `always` for sailing cinematics. Revisit a single shared Canvas only if remount stutter remains a demo issue after dispose is proven.

## Test

```bash
yarn test
```

## CI

PRs and pushes to `main` run [`.github/workflows/ci.yml`](.github/workflows/ci.yml): `format:check`, `lint`, `test`, and `build`. Expect CI green before merge (enable branch protection on `main` in repo settings if desired).

## Build

```bash
yarn build
yarn preview
```

## Deploy

Push to `main`. [CI](.github/workflows/ci.yml) must finish green first; then [Pages](.github/workflows/pages.yml) builds `dist` and deploys. Manual deploy: Actions → Deploy to GitHub Pages → Run workflow.

Shore CTAs (mail / Calendly) come from [`src/site.ts`](src/site.ts).

## Demo checklist

- [ ] Skip to desk button, or open with `?scene=desk` (aliases: `scene0`–`scene3` / `0`–`3`)
- [ ] Happy path: intro → sail markers → dock → desk
- [ ] At desk: open map, run an ask preset, then mail + Calendly CTAs
- [ ] Toggle EN / ES in the header
- [ ] Reduced motion (OS): starts at sail; intro/dock/sail animations skip
- [ ] Optional: `?quality=low`, `?proceduralBoat`

## Art & models

- [`assets/scene_*.png`](assets/) — scene plates (intro / sail / dock / desk); compress with `yarn compress-plates` → `public/plates/`
- [`assets/objects/`](assets/objects/) — character / boat / lighthouse / desk refs
- Rocks, buoys, pier, girl, desk are **procedural** low-poly meshes under [`src/scene/props/`](src/scene/props/); boat + lighthouse swap to GLB when `useGlb` is on
- [`assets/renders-src/`](assets/renders-src/) — authored GLBs; `yarn compress-glb` writes meshopt copies to [`public/renders/`](public/renders/)
- **GLB budgets** (script fails over): boat ≤ 50 KB / 2k tris; lighthouse ≤ 100 KB / 5k tris; girl/pier/desk ≤ 200 KB / 8k tris (when sources exist)
- Girl / pier / desk GLB flags stay off until authored sources land
