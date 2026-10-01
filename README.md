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
yarn compress-glb     # Status of expected public/renders/*.glb outputs
```

Scene modules live under [`src/scene/`](src/scene/) and [`src/game/scenes/`](src/game/scenes/). Tunables are in [`src/scene/config.ts`](src/scene/config.ts). The React game shell stays in [`src/game/`](src/game/).

### Standards & roadmap

- [`docs/standards-review.md`](docs/standards-review.md) — dry-run audit (best / anti-patterns, severity)
- [`docs/roadmap.md`](docs/roadmap.md) — phased plan to raise architecture, perf, assets, and CI to professional grade

**Art constraints:** flat shading + vertex colors, one low sun vector, Neutral tone mapping, no shadow maps on the sea (desk uses a soft key shadow). Optional boat GLB at `public/renders/stylized_boat_lowpoly.glb` with procedural fallback (`?proceduralBoat` forces it). DPR capped at 2 (1.5 mobile); bloom + reflection at half-res.

## Test

```bash
yarn test
```

## Build

```bash
yarn build
yarn preview
```

## Deploy

Push to `main`. GitHub Actions builds and deploys `dist` to GitHub Pages.

Before stakeholder demos, set real addresses in [`src/site.ts`](src/site.ts):

- `email` / mailto subject
- `calendlyUrl`

## Art & models

- [`assets/scene_*.png`](assets/) — scene plates (intro / sail / dock / desk)
- [`assets/objects/`](assets/objects/) — character / boat / lighthouse / desk refs
- Boat, lighthouse, rocks, buoys, pier, girl, desk are **procedural** low-poly meshes under [`src/scene/props/`](src/scene/props/); boat may swap to GLB when enabled
- [`public/renders/`](public/renders/) — optional GLB assets (boat + lighthouse experiments; girl/pier/desk pending)
