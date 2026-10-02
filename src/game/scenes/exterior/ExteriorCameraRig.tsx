import { useFrame, useThree } from '@react-three/fiber'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import { LIGHTHOUSE_POSITION } from '../../BoatController'
import type { SceneId } from '../../types'
import { responsiveVFov, type SceneRuntime } from '../../../scene/config'
import { LAYOUT_WORLD } from '../../../scene/layout'
import { applyScenicCamera } from '../../../scene/math/uvPlacement'
import { wantsDebug } from '../../../scene/debug/DebugGui'
import { DOCK, INTRO, segmentProgress } from '../../director/timelines'

const _from = new THREE.Vector3()
const _mid = new THREE.Vector3()
const _toBoat = new THREE.Vector3()
const _lookA = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()
const _follow = new THREE.Vector3()
const _establishCam = new THREE.Vector3()
const _sailLook = new THREE.Vector3()

export function ExteriorCameraRig({
  runtime,
  scene,
  boatPos,
  reducedMotion,
  introT,
  dockT,
}: {
  runtime: MutableRefObject<SceneRuntime>
  scene: SceneId
  boatPos: MutableRefObject<{ x: number; y: number; z: number }>
  reducedMotion: boolean
  introT: MutableRefObject<number>
  dockT: MutableRefObject<number>
}) {
  const { camera, size } = useThree()
  const [lx, , lz] = LIGHTHOUSE_POSITION
  const pier = LAYOUT_WORLD.pier

  useFrame((_, dt) => {
    const persp = camera as THREE.PerspectiveCamera
    const aspect = size.width / Math.max(1, size.height)
    const vFov = wantsDebug() ? runtime.current.vFov : responsiveVFov(aspect)

    if (scene === 'intro' && !reducedMotion) {
      const t = introT.current
      const look = segmentProgress(t, 0, INTRO.look)
      const walk = segmentProgress(t, INTRO.look, INTRO.walk)
      _from.set(pier.x + 2.5, 2.8, pier.z + 4.5)
      _mid.set(pier.x + 1.2, 3.2, pier.z + 2.2)
      _toBoat.set(LAYOUT_WORLD.boat.x + 1.5, 3.6, LAYOUT_WORLD.boat.z + 5)
      if (look < 1) {
        persp.position.lerpVectors(_from, _mid, look)
        persp.lookAt(lx, 3.5, lz)
      } else {
        persp.position.lerpVectors(_mid, _toBoat, walk)
        _lookA.set(lx, 3.5, lz)
        _lookTarget.lerpVectors(_lookA, LAYOUT_WORLD.boat, walk)
        _lookTarget.y = 1.2
        persp.lookAt(_lookTarget)
      }
      persp.fov = vFov
      persp.aspect = aspect
      persp.updateProjectionMatrix()
      return
    }

    if (scene === 'dock' && !reducedMotion) {
      const t = dockT.current
      const approach = segmentProgress(t, 0, DOCK.approach)
      const establish = segmentProgress(
        t,
        DOCK.approach + DOCK.exit,
        DOCK.establish,
      )
      _follow.set(boatPos.current.x + 2.2, 4.2, boatPos.current.z + 6.5)
      _establishCam.set(lx + 4, 5.5, lz + 8)
      persp.position.lerpVectors(_follow, _establishCam, establish)
      const lookY = THREE.MathUtils.lerp(1.2, 4.5, establish)
      persp.lookAt(lx, lookY, lz)
      persp.fov = THREE.MathUtils.lerp(
        vFov,
        42,
        approach * 0.3 + establish * 0.4,
      )
      persp.aspect = aspect
      persp.updateProjectionMatrix()
      void dt
      return
    }

    applyScenicCamera(persp, {
      aspect,
      vFov: runtime.current.vFov || vFov,
      pitchDeg: runtime.current.pitchDeg,
      height: runtime.current.height,
      z: runtime.current.cameraZ,
    })

    // Mild follow while sailing so motion reads without breaking scenic frame
    if (scene === 'sail' && !reducedMotion) {
      _follow.set(
        boatPos.current.x * 0.12,
        runtime.current.height + 0.15,
        runtime.current.cameraZ,
      )
      persp.position.x = THREE.MathUtils.lerp(
        persp.position.x,
        _follow.x,
        1 - Math.exp(-dt * 1.2),
      )
      persp.position.y = THREE.MathUtils.lerp(
        persp.position.y,
        _follow.y,
        1 - Math.exp(-dt * 1.2),
      )
      _sailLook.set(
        THREE.MathUtils.lerp(0, boatPos.current.x, 0.08),
        0.4,
        boatPos.current.z - 8,
      )
      persp.lookAt(_sailLook)
    }

    if (!wantsDebug()) {
      persp.fov = vFov
      persp.updateProjectionMatrix()
    }
  })

  return null
}
