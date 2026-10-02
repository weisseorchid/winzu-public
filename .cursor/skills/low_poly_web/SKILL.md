# Low Poly Interactive Web

## Visual language

All 3D assets should follow:

- low polygon count
- flat or deliberately faceted shading
- restrained material count
- stylized rather than photorealistic rendering
- simple geometric silhouettes
- warm directional lighting
- ambient occlusion where useful
- minimal texture usage
- GLB preferred for external assets

## Geometry

Prefer:

- IcosahedronGeometry
- low-segment SphereGeometry
- BoxGeometry
- CylinderGeometry
- custom BufferGeometry

Avoid unnecessarily dense geometry.

## Materials

Prefer:

- MeshStandardMaterial
- MeshToonMaterial
- MeshBasicMaterial when appropriate

Use:

flatShading: true

when it contributes to the visual style.

## Animation

Prefer:

- subtle floating
- camera movement
- procedural animation
- spring-like transitions
- pointer interaction

Avoid constant expensive per-frame React state updates.

## Performance

Target:

- 60 FPS desktop
- 30+ FPS mobile
- minimal draw calls
- compressed GLB
- texture compression
- instancing for repeated objects
- LOD for large scenes

## Architecture

Separate:

- DOM UI
- React state
- R3F scene
- assets
- animation
- interaction

Never put the entire scene into one component.
