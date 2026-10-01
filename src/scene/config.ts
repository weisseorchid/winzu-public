import * as THREE from 'three'

/** Reference framing: 1821×864 ≈ 2.11:1 */
export const REF_ASPECT = 1821 / 864
export const REF_WIDTH = 1821
export const REF_HEIGHT = 864

export const CAMERA = {
  /** Vertical FOV at the reference aspect (degrees). */
  vFov: 45,
  /** Cap when aspect is narrower than REF_ASPECT. */
  vFovMax: 65,
  pitchDeg: -7,
  yawDeg: 0,
  height: 4,
  /** World Z — looking down −Z. */
  z: 14,
  near: 0.1,
  far: 360,
  lookDistance: 40,
}

/** One sun vector drives disc, key light, glitter, sky glow, fog tint. */
/** Azimuth 30°, elevation 4.5° — low disc on the bright left horizon. */
export const SUN_DIR = new THREE.Vector3(-0.4985, 0.0785, -0.863).normalize()

export const SUN = {
  /** Disc center in screen UV (u, v from top). */
  uv: { u: 0.176, v: 0.213 },
  radiusFrac: 0.024,
  /**
   * Hard plate disc (scene_1 / scene_2): pale yellow cream, soft peach rim.
   * Keep hdr under bloom threshold so the silhouette stays crisp.
   */
  coreColor: new THREE.Color('#F0A850'),
  coreGold: new THREE.Color('#FFDC8C'),
  discColor: new THREE.Color('#FFDC8C'),
  /** Below BLOOM.threshold — no bloom smear on the disc edge. */
  hdr: 1.38,
  /** Thin warm contact nest; peach wash lives in the sky atmosphere. */
  glow: 0.14,
  keyIntensity: 1.42,
  keyColor: new THREE.Color('#F5B281'),
  hemiSky: new THREE.Color('#8A90A0'),
  hemiGround: new THREE.Color('#A9978F'),
  hemiIntensity: 0.48,
}

/**
 * Local albedo / atmosphere — palette_ref + reference-plate sky samples.
 * Sky: warm orange left → cool blue right, soft vertical cool-off to zenith.
 */
export const COLORS = {
  skyNearSun: new THREE.Color('#F5C49A'),
  skyTopLeft: new THREE.Color('#D4A890'),
  skyTopRight: new THREE.Color('#6E82A8'),
  horizonLeft: new THREE.Color('#F0A878'),
  horizonRight: new THREE.Color('#5A6E92'),
  waterDeep: new THREE.Color('#152E42'),
  waterHorizon: new THREE.Color('#35566A'),
  rockWarm: new THREE.Color('#6A564C'),
  rockDark: new THREE.Color('#2A2C30'),
  rock: new THREE.Color('#7A6558'),
  rockLight: new THREE.Color('#B09080'),
  tower: new THREE.Color('#212224'),
  lantern: new THREE.Color('#FCCE95'),
  sail: new THREE.Color('#8A2818'),
  sailLit: new THREE.Color('#D46848'),
  sailHi: new THREE.Color('#E87858'),
  buoyRed: new THREE.Color('#CC7E52'),
  buoyWhite: new THREE.Color('#D8D3CC'),
  wood: new THREE.Color('#4A3F3C'),
  woodLit: new THREE.Color('#8C6F62'),
  woodDark: new THREE.Color('#212224'),
  foam: new THREE.Color('#E4DFD6'),
  grass: new THREE.Color('#3A4955'),
  clear: new THREE.Color('#A8ADC0'),
  offWhite: new THREE.Color('#D8D3CC'),
  dustyPeach: new THREE.Color('#C3A18E'),
  slate: new THREE.Color('#7B818C'),
  oceanLight: new THREE.Color('#3A4955'),
  blueGrey: new THREE.Color('#4C5761'),
}

export const FOG = {
  density: 0.009,
  mistBandPx: 42,
  near: 18,
  far: 95,
  /** Height falloff — higher values haze valleys / low ground more. */
  heightScale: 0.055,
}

export const BLOOM = {
  /** Hot core + lantern bloom — keep sky/cloud under threshold. */
  strength: 0.12,
  radius: 0.12,
  threshold: 1.85,
}

export const GRADE = {
  exposure: 1.18,
  contrast: 1.12,
  saturation: 1.04,
  warmth: 0.016,
  vignette: 0.12,
}

export const PERF = {
  dprDesktop: 2,
  dprMobile: 1.5,
  bloomHalfRes: true,
  reflectionHalfRes: true,
}

/** Calm low-poly ocean. */
export const OCEAN = {
  segments: 180,
  amplitude: 0.14,
  frequency: 0.1,
  speed: 0.55,
  facetScale: 2.4,
}

/**
 * Procedural boat is the stern-camera mesh (sail sheeted to port).
 * The GLB sail is cut fore-and-aft, so from behind it reads as an edge.
 */
export const BOAT = {
  useGlb: false,
  glbPath: 'renders/stylized_boat_lowpoly.glb',
  /** Target bounding-box width before layout fit (matches procedural hull). */
  targetWidth: 1.1,
}

/** Lighthouse GLB stays gated until a non-stub asset lands. */
export const LIGHTHOUSE = {
  useGlb: false,
  glbPath: 'renders/stylized_lighthouse_lowpoly.glb',
  targetWidth: 4.2,
}

export const GIRL = {
  useGlb: false,
  glbPath: 'renders/stylized_girl_lowpoly.glb',
}

export const PIER = {
  useGlb: false,
  glbPath: 'renders/stylized_pier_lowpoly.glb',
}

export const DESK = {
  useGlb: false,
  glbPath: 'renders/stylized_desk_lowpoly.glb',
}

/** Screen-space layout targets (u = x/width, v = y/height from top). */
export const LAYOUT = {
  leftRock: { u: 0.12, v: 0.39, width: 0.15 },
  lighthouse: { u: 0.39, v: 0.4, width: 0.165, height: 0.25 },
  midRock: { u: 0.6, v: 0.4, width: 0.135 },
  nearRock: { u: 0.73, v: 0.61, width: 0.18 },
  whiteBuoy: { u: 0.265, v: 0.46, width: 0.016 },
  redBuoy: { u: 0.615, v: 0.6, width: 0.035 },
  boat: { u: 0.36, v: 0.89, width: 0.1, sailTopV: 0.5 },
  /** Shore pier — Scene 0 (left foreground). */
  pier: { u: 0.12, v: 0.82, width: 0.24 },
  /** Island dock — Scene 2 (near lighthouse). */
  islandDock: { u: 0.46, v: 0.46, width: 0.14 },
} as const

/** Mutable runtime overrides (driven by lil-gui / responsive framing). */
export type SceneRuntime = {
  sunDir: THREE.Vector3
  vFov: number
  pitchDeg: number
  height: number
  cameraZ: number
  fogDensity: number
  bloomStrength: number
  bloomThreshold: number
  sunIntensity: number
  exposure: number
  time: number
}

export function createRuntime(): SceneRuntime {
  return {
    sunDir: SUN_DIR.clone(),
    vFov: CAMERA.vFov,
    pitchDeg: CAMERA.pitchDeg,
    height: CAMERA.height,
    cameraZ: CAMERA.z,
    fogDensity: FOG.density,
    bloomStrength: BLOOM.strength,
    bloomThreshold: BLOOM.threshold,
    sunIntensity: SUN.keyIntensity,
    exposure: GRADE.exposure,
    time: 0,
  }
}

/** Horizontal FOV (degrees) at reference aspect + vFOV. */
export function hFovFromV(vFovDeg: number, aspect: number): number {
  const v = THREE.MathUtils.degToRad(vFovDeg)
  return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(v / 2) * aspect))
}

/** Responsive vFOV: hold hFOV of the reference framing, cap at vFovMax. */
export function responsiveVFov(aspect: number): number {
  if (aspect >= REF_ASPECT) return CAMERA.vFov
  const hRef = hFovFromV(CAMERA.vFov, REF_ASPECT)
  const v = THREE.MathUtils.radToDeg(
    2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(hRef) / 2) / aspect),
  )
  return Math.min(v, CAMERA.vFovMax)
}
