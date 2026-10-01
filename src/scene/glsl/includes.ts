import commonGlsl from './common.glsl?raw'
import skyColorGlsl from './skyColor.glsl?raw'
import * as THREE from 'three'
import { SUN } from '../config'

/** Prepend shared GLSL chunks into a shader string. */
export function withSharedGlsl(
  source: string,
  opts?: { sky?: boolean; common?: boolean },
): string {
  const parts: string[] = []
  if (opts?.common !== false) parts.push(commonGlsl)
  if (opts?.sky) parts.push(skyColorGlsl)
  parts.push(source)
  return parts.join('\n')
}

export const skyUniforms = {
  uSunDir: { value: null as unknown as import('three').Vector3 },
  uSkyNearSun: { value: null as unknown as import('three').Color },
  uSkyTopLeft: { value: null as unknown as import('three').Color },
  uSkyTopRight: { value: null as unknown as import('three').Color },
  uHorizonLeft: { value: null as unknown as import('three').Color },
  uHorizonRight: { value: null as unknown as import('three').Color },
}

export function bindSkyUniforms(
  uniforms: Record<string, { value: unknown }>,
  sunDir: import('three').Vector3,
  colors: {
    skyNearSun: import('three').Color
    skyTopLeft: import('three').Color
    skyTopRight: import('three').Color
    horizonLeft: import('three').Color
    horizonRight: import('three').Color
  },
  sunHdr = SUN.hdr,
  sunExtras?: {
    glow?: number
    coreColor?: import('three').Color
    coreGold?: import('three').Color
  },
) {
  uniforms.uSunDir.value = sunDir
  uniforms.uSkyNearSun.value = colors.skyNearSun
  uniforms.uSkyTopLeft.value = colors.skyTopLeft
  uniforms.uSkyTopRight.value = colors.skyTopRight
  uniforms.uHorizonLeft.value = colors.horizonLeft
  uniforms.uHorizonRight.value = colors.horizonRight

  if (!uniforms.uSunHdr) uniforms.uSunHdr = { value: sunHdr }
  else uniforms.uSunHdr.value = sunHdr

  const glow = sunExtras?.glow ?? SUN.glow
  const core = sunExtras?.coreColor ?? SUN.coreColor
  const gold = sunExtras?.coreGold ?? SUN.coreGold

  if (!uniforms.uSunGlow) uniforms.uSunGlow = { value: glow }
  else uniforms.uSunGlow.value = glow

  if (!uniforms.uSunCoreColor) uniforms.uSunCoreColor = { value: core.clone() }
  else (uniforms.uSunCoreColor.value as THREE.Color).copy(core)

  if (!uniforms.uSunCoreGold) uniforms.uSunCoreGold = { value: gold.clone() }
  else (uniforms.uSunCoreGold.value as THREE.Color).copy(gold)
}
