import * as THREE from 'three'
import { COLORS, FOG, OCEAN, SUN } from '../config'
import { bindSkyUniforms, withSharedGlsl } from '../glsl/includes'

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uWaveAmp;
uniform float uWaveFreq;
uniform float uWaveSpeed;

varying vec3 vWorldPos;
varying vec3 vViewPos;

float waveHeight(vec2 xz) {
  float t = uTime * uWaveSpeed;
  float f = uWaveFreq;
  float w =
      sin(xz.x * f + t)
    + sin(xz.y * f * 1.3 + t * 0.8)
    + sin((xz.x + xz.y) * f * 0.6 + t * 0.4);
  return w * (1.0 / 3.0) * uWaveAmp;
}

void main() {
  vec3 pos = position;
  // Fade displacement toward the horizon so distant water stays flat.
  // Stronger mid fade avoids PlaneGeometry quad crease checkerboard.
  float camDist = length(cameraPosition.xz - (modelMatrix * vec4(pos, 1.0)).xz);
  float ampFade = mix(1.0, 0.0, smoothstep(18.0, 90.0, camDist));
  pos.y += waveHeight(pos.xz) * ampFade;

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const fragmentShader = withSharedGlsl(
  /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vViewPos;

uniform vec3 uWaterDeep;
uniform vec3 uWaterHorizon;
uniform float uFogDensity;
uniform float uFogHeightScale;
uniform float uTime;
uniform float uFacetScale;
uniform sampler2D uReflectMap;
uniform float uHasReflect;
uniform vec2 uReflectRes;
uniform vec2 uResolution;

// Analytic low-poly facet normal from a triangular lattice in XZ.
vec3 latticeNormal(vec2 xz, float scale) {
  float dist = length(vViewPos);
  float s = scale * mix(2.2, 0.5, smoothstep(8.0, 70.0, dist));
  vec2 p = (xz + vec2(uTime * 0.08, uTime * 0.05)) / max(s, 0.05);

  const vec2 n1 = vec2(1.0, 0.0);
  const vec2 n2 = vec2(0.5, 0.8660254);
  float f1 = dot(p, n1);
  float f2 = dot(p, n2);
  vec2 cell = floor(vec2(f1, f2));
  vec2 f = fract(vec2(f1, f2));

  // Corner hashes of the lattice cell (no tri flip — that read as checkerboard)
  float h0 = hash21(cell) * 2.0 - 1.0;
  float h1 = hash21(cell + vec2(1.0, 0.0)) * 2.0 - 1.0;
  float h2 = hash21(cell + vec2(0.0, 1.0)) * 2.0 - 1.0;
  float h3 = hash21(cell + vec2(1.0, 1.0)) * 2.0 - 1.0;

  float contrast = mix(0.1, 0.025, smoothstep(10.0, 75.0, dist));
  // Soft bilinear slope inside the cell — hard floor tiles read as a checkerboard
  vec2 ff = f * f * (3.0 - 2.0 * f);
  float hx = mix(h1 - h0, h3 - h2, ff.y);
  float hz = mix(h2 - h0, h3 - h1, ff.x);
  return normalize(vec3(hx * contrast, 1.0, hz * contrast));
}

void main() {
  vec3 V = normalize(cameraPosition - vWorldPos);

  vec3 latN = latticeNormal(vWorldPos.xz, uFacetScale);
  if (dot(latN, V) < 0.0) latN = -latN;
  // Lattice-only normals: PlaneGeometry triangulation + dFdx geoN paints a
  // mid-ground checkerboard on near-flat water. Facets stay via the lattice.
  vec3 N = normalize(latN);

  vec3 R = reflect(-V, N);
  vec3 sky = skyAtmosphere(R);
  // Soften sun chrome so water doesn't pick up a bright specular ribbon
  float sunFacing = pow(max(0.0, dot(normalize(R), normalize(uSunDir))), 6.0);
  sky = mix(sky, fogHorizonColor(R), sunFacing * 0.55);
  sky *= mix(1.0, 0.55, sunFacing);

  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.2);
  float dist = length(vViewPos);
  float screenV = gl_FragCoord.y / max(uResolution.y, 1.0);
  // Delay deep fade so mid water stays dark longer before the horizon band
  float deepMix = smoothstep(0.52, 0.78, screenV);
  deepMix = max(deepMix, smoothstep(55.0, 140.0, dist));
  float elev = normalize(vec3(V.x, max(V.y, 0.0), V.z)).y;
  float horizonStrip = 1.0 - smoothstep(-0.002, 0.022, elev);
  deepMix = max(deepMix, horizonStrip * smoothstep(50.0, 110.0, dist) * 0.45);

  // Keep far water dark — a bright rim read as a second fog horizon under the mountains
  vec3 mistCol = fogHorizonColor(normalize(vec3(V.x, 0.0, V.z)));
  vec3 farWater = mix(uWaterDeep, uWaterHorizon, 0.55);
  farWater = mix(farWater, mistCol, horizonStrip * 0.12);
  vec3 water = mix(uWaterDeep, farWater, deepMix);
  // Cool depth without cyan — slight darken + blue-grey lift at mid
  water = mix(water, uWaterDeep * vec3(0.88, 0.96, 1.08), (1.0 - deepMix) * 0.28);
  float fresAmt = mix(0.04, 0.14, deepMix) * fres;
  vec3 col = mix(water, sky, fresAmt);

  // Facet read comes from latticeNormal / geoN — do NOT multiply by
  // hash21(floor(worldXZ)): that created the mid-ground checkerboard grid.

  if (uHasReflect > 0.5) {
    vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    float j = (hash21(floor(gl_FragCoord.xy * 0.25)) - 0.5) * 0.004;
    uv = clamp(uv + vec2(j, j * 0.3), 0.001, 0.999);
    vec3 refl = texture2D(uReflectMap, uv).rgb;
    float reflAmt = fres * (1.0 - deepMix * 0.5) * 0.05;
    col = mix(col, col + refl, reflAmt);
  }

  // Fog toward horizon — stay cool/dark so the waterline doesn't bleach
  float fogFactor = fogFactorExp2(dist, uFogDensity, vWorldPos.y, uFogHeightScale);
  fogFactor *= mix(0.1, 0.85, deepMix);
  vec3 fogCol = mix(uWaterDeep, uWaterHorizon, 0.65);
  fogCol = mix(fogCol, mistCol, horizonStrip * 0.2);
  col = mix(col, fogCol, fogFactor);

  gl_FragColor = vec4(col, 1.0);
}
`,
  { sky: true, common: true },
)

export type OceanMaterial = THREE.ShaderMaterial & {
  userData: { reflectMap?: THREE.Texture | null }
}

export function createOceanMaterial(sunDir: THREE.Vector3): OceanMaterial {
  const mat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: {
      uSunDir: { value: sunDir.clone() },
      uSkyNearSun: { value: COLORS.skyNearSun },
      uSkyTopLeft: { value: COLORS.skyTopLeft },
      uSkyTopRight: { value: COLORS.skyTopRight },
      uHorizonLeft: { value: COLORS.horizonLeft },
      uHorizonRight: { value: COLORS.horizonRight },
      uSunHdr: { value: SUN.hdr },
      uSunGlow: { value: SUN.glow },
      uSunCoreColor: { value: SUN.coreColor.clone() },
      uSunCoreGold: { value: SUN.coreGold.clone() },
      uWaterDeep: { value: COLORS.waterDeep },
      uWaterHorizon: { value: COLORS.waterHorizon },
      uFogDensity: { value: FOG.density },
      uFogHeightScale: { value: FOG.heightScale },
      uTime: { value: 0 },
      uWaveAmp: { value: OCEAN.amplitude },
      uWaveFreq: { value: OCEAN.frequency },
      uWaveSpeed: { value: OCEAN.speed },
      uFacetScale: { value: OCEAN.facetScale },
      uReflectMap: { value: null },
      uHasReflect: { value: 0 },
      uReflectRes: { value: new THREE.Vector2(912, 432) },
      uResolution: { value: new THREE.Vector2(1821, 864) },
    },
    vertexShader,
    fragmentShader,
  }) as OceanMaterial
  bindSkyUniforms(mat.uniforms, sunDir, COLORS, SUN.hdr, {
    glow: SUN.glow,
    coreColor: SUN.coreColor,
    coreGold: SUN.coreGold,
  })
  return mat
}

export function createOceanMesh(material: THREE.ShaderMaterial): THREE.Mesh {
  // Large enough that the far rim sits past the mountain bands — otherwise the
  // triangulated plane edge becomes a jagged fake horizon in front of the mist.
  const geo = new THREE.PlaneGeometry(480, 480, OCEAN.segments, OCEAN.segments)
  geo.rotateX(-Math.PI / 2)
  // Non-indexed so each triangle can shade flat via dFdx/dFdy
  const nonIndexed = geo.toNonIndexed()
  geo.dispose()
  const mesh = new THREE.Mesh(nonIndexed, material)
  // Bias toward −Z so most extent covers the scenic horizon
  mesh.position.set(0, 0, -90)
  mesh.name = 'Ocean'
  mesh.frustumCulled = false
  mesh.receiveShadow = false
  mesh.castShadow = false
  return mesh
}

export function updateOcean(
  material: THREE.ShaderMaterial,
  opts: {
    sunDir: THREE.Vector3
    time: number
    fogDensity: number
    reflectMap?: THREE.Texture | null
    resolution?: THREE.Vector2
    waveAmp?: number
    waveFreq?: number
    waveSpeed?: number
    facetScale?: number
  },
) {
  material.uniforms.uSunDir.value.copy(opts.sunDir)
  material.uniforms.uTime.value = opts.time
  material.uniforms.uFogDensity.value = opts.fogDensity
  if (opts.waveAmp != null) material.uniforms.uWaveAmp.value = opts.waveAmp
  if (opts.waveFreq != null) material.uniforms.uWaveFreq.value = opts.waveFreq
  if (opts.waveSpeed != null)
    material.uniforms.uWaveSpeed.value = opts.waveSpeed
  if (opts.facetScale != null)
    material.uniforms.uFacetScale.value = opts.facetScale
  if (opts.resolution) {
    material.uniforms.uResolution.value.copy(opts.resolution)
  }
  if (opts.reflectMap) {
    material.uniforms.uReflectMap.value = opts.reflectMap
    material.uniforms.uHasReflect.value = 1
    const img = opts.reflectMap.image as
      { width?: number; height?: number } | undefined
    if (img?.width && img?.height) {
      material.uniforms.uReflectRes.value.set(img.width, img.height)
    }
  }
}
