# Professionalization roadmap

Granular, independently mergeable phases to raise winzu-public to professional low-poly web standards.

Companion audit: `[standards-review.md](standards-review.md)`.  
Art flow: `[assets/scene_flow.md](../assets/scene_flow.md)`.  
Skill baseline: `[.cursor/skills/low_poly_web/SKILL.md](../.cursor/skills/low_poly_web/SKILL.md)`.

**Order:** hygiene → structure → cost → lifecycle → assets → process → ship.  
Implement one phase (or one unit inside a phase) per PR when possible.

---

## Phase 0 — Baseline contracts

**Goal:** Write down budgets and quality tiers so later phases have measurable “done.”

**Why:** Without numbers, “optimize ocean” and “professional FPS” are opinions.

### Units

| ID  | Work                                                     | Files                                          |
| --- | -------------------------------------------------------- | ---------------------------------------------- |
| 0.1 | Document FPS targets: 60 desktop, 30+ mobile (mid-range) | this doc (budgets table below)                 |
| 0.2 | Document quality tiers: `high` / `medium` / `low`        | this doc + later wire in `src/scene/config.ts` |
| 0.3 | Cross-link scene contracts to `scene_flow.md`            | README already links; keep in sync             |

### Budgets (contracts)

| Metric                        | High (desktop)                                   | Medium                | Low (mobile)      |
| ----------------------------- | ------------------------------------------------ | --------------------- | ----------------- |
| DPR                           | ≤ 2                                              | ≤ 1.5                 | ≤ 1.25            |
| Ocean segments                | ≤ 80                                             | ≤ 48                  | ≤ 32              |
| Reflection pass               | On or half-res                                   | Off or every N frames | Off               |
| Bloom                         | Half-res                                         | Half-res or off       | Off               |
| Frameloop                     | always (cinematics)                              | always or demand      | demand where safe |
| External GLB (each)           | meshopt; prefer < 200 KB                         | same                  | same              |
| Prop poly (procedural or GLB) | silhouette-first; no dense subdivision for style | same                  | same              |

### Acceptance

- [ ] Budgets table agreed and linked from README
- [ ] No code required for Phase 0 to close (docs-only)

### Risk

None. Do not bike-shed numbers past one iteration; tune after Phase 3 profiling.

---

## Phase 1 — Frame-loop hygiene

**Goal:** Stop redundant React work and per-frame GC without changing visuals.

**Why:** Highest confidence, lowest risk. Matches skill “avoid constant expensive per-frame React state updates.”

### Units

| ID  | Work                                                             | Files                                         |
| --- | ---------------------------------------------------------------- | --------------------------------------------- |
| 1.1 | Latch marker arrival with a ref (like `introDone` / `dockDone`)  | `src/game/scenes/ExteriorScene.tsx`           |
| 1.2 | Pool camera / look `Vector3` temps in exterior camera rig        | `ExteriorScene.tsx`                           |
| 1.3 | Pool desk look lerp temp (no `.clone()` per frame)               | `src/game/scenes/Scene3Desk.tsx`              |
| 1.4 | Move cursor style off `document.body` onto canvas wrapper / Game | `Scene3Desk.tsx`, optionally `Game.tsx` / CSS |

### Steps (1.1)

1. Add `markerLatched` ref (or latch last reported index).
2. Call `onReachMarker` only on the transition into radius / once per index.
3. Reset latch when `markersReached` advances from parent if needed.

### Acceptance

- [x] Reaching a marker triggers at most one React state update per index
- [x] Camera/desk look paths allocate no new `Vector3` inside `useFrame` hot paths
- [x] Cursor feedback still works; body style not mutated from scene code
- [x] `yarn test` green; sail → dock still works manually

### Risk

Latch reset bugs if markersReached decreases (it should not). Mirror intro/dock patterns.

---

## Phase 2 — Exterior modularization

**Goal:** Split exterior runtime so SeaWorld builds the graph and small modules own orchestration.

**Why:** Skill forbids a single scene god component. Construction is already split; runtime is not.

### Units

| ID  | Work                       | Suggested module                            | Responsibility                                       |
| --- | -------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| 2.1 | Extract intro cinematic    | `src/game/scenes/exterior/IntroDirector.ts` | Intro phases, girl board, `onIntroComplete` latch    |
| 2.2 | Extract sail interaction   | `.../SailController.ts`                     | Click plane, boat tick, marker latch, reach callback |
| 2.3 | Extract dock cinematic     | `.../DockDirector.ts`                       | Dock phases, `onDockComplete` latch                  |
| 2.4 | Extract frame update glue  | `.../ExteriorFrameLoop.ts`                  | Clock → prop updates, ocean, foam, runtime.time      |
| 2.5 | Extract post / debug mount | `.../ExteriorPost.ts`                       | Composer, reflection schedule, compare/gui lifecycle |
| 2.6 | Thin R3F shell             | `ExteriorScene.tsx`                         | Canvas, camera hookup, wire modules, `<primitive>`   |

**Do not** fold SeaWorld props into React JSX. Keep imperative factories.

### Acceptance

- [x] `ExteriorScene.tsx` is a thin shell (rough guide: under ~200 lines of orchestration)
- [x] Each module has a clear public API (`update`, `dispose`, or tick helpers)
- [x] No behavior change: intro → sail → dock → desk still matches `scene_flow.md`
- [x] Debug (`?debug`) and compare (`?compare`) still work

### Risk

Large diff. Land as sequential PRs (2.1 → 2.6), each behavior-identical. Prefer move-then-clean over rewrite.

---

## Phase 3 — Perf / visual budget

**Goal:** Hit Phase 0 budgets while keeping the cinematic low-poly look.

**Why:** Cost is concentrated in ocean, reflection, clouds, foam, sail CPU morph.

### Units

| ID  | Work                                                                 | Files                                                       |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| 3.1 | Cut `OCEAN.segments` to budget; revisit `toNonIndexed`               | `config.ts`, `OceanMaterial.ts`                             |
| 3.2 | Gate reflection: off on low/medium, or every N frames                | `ExteriorScene` / ExteriorPost, `ReflectionPass.ts`, `PERF` |
| 3.3 | Add quality profile selector (UA or `?quality=`)                     | `config.ts`, Game or Exterior mount                         |
| 3.4 | Merge cloud lobes per bank or InstancedMesh                          | `Clouds.ts`                                                 |
| 3.5 | Share foam materials; merge/instance waterline foam                  | `Foam.ts`                                                   |
| 3.6 | Sail billow in vertex shader (drop per-frame `computeVertexNormals`) | `Boat.ts`                                                   |
| 3.7 | Soften SkyDome segment counts if unused density remains              | `SkyDome.ts`                                                |

### Steps (recommended order)

1. 3.1 + 3.2 — largest FPS wins with plate compare (`?compare`, `yarn shot` / `yarn anchors`).
2. 3.3 — encode tiers so mobile does not pay desktop post.
3. 3.4–3.6 — draw calls and CPU.
4. Re-check anchors; adjust grade/bloom only if plates drift.

### Acceptance

- [x] High tier still plate-credible under `?compare`
- [x] Low tier disables reflection (and bloom if needed) and uses budget ocean segs
- [x] Cloud/foam draw count materially down (target: banks merged; foam mats shared)
- [x] Sail animates without CPU `computeVertexNormals` each frame
- [ ] Manual: mid-range laptop / phone hit 60 / 30+ in sail scene

### Risk

Over-cutting ocean segs can break displacement silhouette. Prefer shader facets + fewer segs over dense mesh. Keep reflection removal reversible via `PERF` flag.

---

## Phase 4 — Lifecycle and Canvas strategy

**Goal:** Predictable create/dispose and documented Canvas cost.

**Why:** Dual Canvas remount leaks if SeaWorld is not disposed; always-on loops drain battery.

### Units

| ID  | Work                                                                                                           | Files                           |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 4.1 | Implement `disposeSeaWorld` (traverse geo/mat/texture)                                                         | `SeaWorld.ts`, Exterior cleanup |
| 4.2 | Dispose foam/boat/cloud handles consistently                                                                   | prop factories + SeaWorld       |
| 4.3 | **Chosen approach:** keep dual Canvas for now; document remount cost; ensure 4.1–4.2 eliminate leaks           | `docs` + cleanup                |
| 4.4 | Use `frameloop="demand"` on desk when idle (invalidate on pointer/focus); keep exterior `always` while sailing | `Scene3Desk.tsx`                |

**Decision locked:** Dual Canvas stays through Phase 4 (less risk than one-Canvas refactor). Revisit single Canvas only if dispose is proven and remount stutter remains a demo issue.

### Acceptance

- [x] Exterior→desk→exterior (if re-enter) does not grow GPU memory unboundedly in DevTools
- [x] Unmount path disposes composer, reflection, and scenic graph
- [x] Desk does not spin forever with no interaction when demand mode is active
- [x] Roadmap/README note documents dual-Canvas tradeoff

### Risk

Demand frameloop can freeze animations if invalidate is missed. Wire invalidate on: focus change, pointer move over canvas, any ongoing camera blend.

---

## Phase 5 — Asset pipeline

**Goal:** Real GLB compression and gated enablement; procedural remains default until green.

**Why:** Skill prefers compressed GLB for external assets; loaders normalize to Lambert flat + MeshoptDecoder.

### Units

| ID  | Work                                                                           | Files                                      |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| 5.1 | Implement `compress-glb` with gltf-transform + meshopt                         | `scripts/compress-glb.mjs`, `package.json` |
| 5.2 | Define per-asset poly/size budgets; fail script if over                        | same + README                              |
| 5.3 | Normalize materials to Lambert flat on load (boat pattern) for lighthouse/etc. | `loadOptionalGlb.ts`, loaders              |
| 5.4 | Enable `useGlb` per asset only after visual sign-off                           | `config.ts`                                |
| 5.5 | Rename/split plate vs OG scripts; compress plates if still shipped for compare | `compress-plates.mjs`                      |
| 5.6 | Delete unused `HorizonMist`                                                    | removed `HorizonMist.ts`                   |

### Acceptance

- [x] `yarn compress-glb` produces meshopt GLBs under `public/renders/`
- [x] Boat/lighthouse (and later girl/pier/desk) meet size budgets
- [x] Enabling a flag does not introduce Standard maps / smooth shading by accident
- [x] Procedural fallback and `?proceduralBoat` still work

### Risk

Tiny experimental GLBs may need re-export from DCC, not just compress. Do not flip all flags in one PR.

---

## Phase 6 — Quality gates

**Goal:** Broken logic and style cannot ship silently.

**Why:** Quality must gate PRs and deploys; Pages alone used to build-only.

### Units

| ID  | Work                                                                                  | Files                                      |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| 6.1 | Add PR CI: `format:check`, `lint`, `test`, `build`                                    | `.github/workflows/ci.yml` (done)          |
| 6.2 | Keep `pages.yml` deploy on `main` after build (optionally need CI green)              | `pages.yml` (done: after CI success)       |
| 6.3 | Expand pure tests: timelines phases, `sceneFromQuery` / force scene, DeskPicker edges | `*.test.ts` (done)                         |
| 6.4 | Optional: content id alignment test (doc ids ↔ desk props ↔ presets)                  | new test under `src/data` or `src/content` |

**Defer:** R3F component / visual regression in CI. Keep `yarn shot` / `yarn anchors` as manual or opt-in artifacts.

### Acceptance

- [x] PR cannot merge green without format + lint + test + build (branch protection or documented expectation)
- [x] Timeline and query-init covered by tests
- [x] Existing director/boat/desk/ask tests still pass

### Risk

Format check may require a one-time format PR. Do that separately before enabling the gate.

---

## Phase 7 — Ship polish

**Goal:** Stakeholder-demo ready Pages site.

**Why:** Placeholders and wrong asset base paths undermine an otherwise strong experience.

### Units

| ID  | Work                                                               | Files                                                    |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------- |
| 7.1 | Replace `site.ts` example email / Calendly                         | `src/site.ts` (done: live CTAs confirmed)                |
| 7.2 | Fix favicon/OG to respect Vite `BASE_URL`                          | `index.html` (done: `%BASE_URL%favicon.ico`)             |
| 7.3 | Demo checklist in README (skip paths, CTAs, EN/ES, reduced motion) | `README.md` (done)                                       |
| 7.4 | Prune dead exports/aliases (e.g. deprecated waypoints)             | `BoatController.ts` (done: removed `WAYPOINT_POSITIONS`) |
| 7.5 | Optional short `docs/architecture.md` pointing at layers           | skipped                                                  |

### Acceptance

- [x] Live Pages: favicon + OG resolve under `/winzu-public/`
- [x] CTAs are real or intentionally hidden
- [x] Demo checklist used once successfully end-to-end
- [x] No known dead public exports left in game/scene entry surfaces

### Risk

OG image generation (`generate-og`) must write to a path that exists in `dist`. Verify after build.

---

## Suggested PR sequence

```text
Phase 0  (docs already landed with this file)
Phase 1  → 1.1 alone, then 1.2–1.4
Phase 2  → one extract PR at a time (2.1 … 2.6)
Phase 3  → 3.1+3.2 first; then 3.3; then draws/sail
Phase 4  → dispose first; then desk demand loop
Phase 5  → compress script; enable one GLB at a time
Phase 6  → format PR if needed; then ci.yml; then tests
Phase 7  → site + base URLs; checklist last
```

---

## Progress tracker

| Phase                     | Status          | Notes                |
| ------------------------- | --------------- | -------------------- |
| 0 Baseline contracts      | Done (this doc) | Budgets locked above |
| 1 Frame-loop hygiene      | Done            | 1.1–1.4              |
| 2 Exterior modularization | Done            | 2.1–2.6              |
| 3 Perf / visual budget    | Done            | 3.1–3.7              |
| 4 Lifecycle / Canvas      | Done            | Dual Canvas kept     |
| 5 Asset pipeline          | Done            | Boat + LH GLB on     |
| 6 Quality gates           | Done            | 6.4 optional skipped |
| 7 Ship polish             | Done            | 7.5 optional skipped |

Update the Status column when a phase merges.
