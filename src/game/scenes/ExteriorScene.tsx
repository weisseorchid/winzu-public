import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from 'react'
import * as THREE from 'three'
import {
  ARRIVE_RADIUS,
  DOCK_POSITION,
  LIGHTHOUSE_POSITION,
  MARKER_POSITIONS,
  createBoatState,
  resolveSailTarget,
  setBoatTarget,
  tickBoat,
} from '../BoatController'
import type { SceneId } from '../types'
import {
  COLORS,
  LAYOUT,
  LIGHTHOUSE,
  OCEAN,
  PERF,
  REF_ASPECT,
  createRuntime,
  responsiveVFov,
  type SceneRuntime,
} from '../../scene/config'
import { LAYOUT_WORLD, placeAndFit } from '../../scene/layout'
import { applyScenicCamera } from '../../scene/math/uvPlacement'
import { updateSkySun } from '../../scene/sky/SkyDome'
import { updateSunDisc } from '../../scene/sky/SunDisc'
import { updateOcean } from '../../scene/ocean/OceanMaterial'
import {
  setSunFogDensity,
  updateLightRig,
} from '../../scene/lighting/LightRig'
import { updateMountains } from '../../scene/bg/Mountains'
import { updateClouds } from '../../scene/bg/Clouds'
import { loadBoatGlb } from '../../scene/props/loadBoatGlb'
import { loadLighthouseGlb } from '../../scene/props/loadOptionalGlb'
import { createComposer } from '../../scene/post/composer'
import {
  mountCompareOverlay,
  wantsCompare,
} from '../../scene/debug/CompareOverlay'
import { mountDebugGui, wantsDebug } from '../../scene/debug/DebugGui'
import { createSeaWorld } from './SeaWorld'
import {
  DOCK,
  INTRO,
  dockPhase,
  introPhase,
  segmentProgress,
} from '../director/timelines'

export type ExteriorApi = {
  scene: SceneId
  markersReached: number
  onReachMarker: (index: number) => void
  onIntroComplete: () => void
  onDockComplete: () => void
  reducedMotion: boolean
}

function isMobile() {
  return (
    typeof navigator !== 'undefined' &&
    /Mobi|Android/i.test(navigator.userAgent)
  )
}

function ExteriorCameraRig({
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
    const vFov = wantsDebug()
      ? runtime.current.vFov
      : responsiveVFov(aspect)

    if (scene === 'intro' && !reducedMotion) {
      const t = introT.current
      const look = segmentProgress(t, 0, INTRO.look)
      const walk = segmentProgress(t, INTRO.look, INTRO.walk)
      const from = new THREE.Vector3(pier.x + 2.5, 2.8, pier.z + 4.5)
      const mid = new THREE.Vector3(pier.x + 1.2, 3.2, pier.z + 2.2)
      const toBoat = new THREE.Vector3(
        LAYOUT_WORLD.boat.x + 1.5,
        3.6,
        LAYOUT_WORLD.boat.z + 5,
      )
      if (look < 1) {
        persp.position.lerpVectors(from, mid, look)
        persp.lookAt(lx, 3.5, lz)
      } else {
        persp.position.lerpVectors(mid, toBoat, walk)
        const lookTarget = new THREE.Vector3().lerpVectors(
          new THREE.Vector3(lx, 3.5, lz),
          LAYOUT_WORLD.boat,
          walk,
        )
        lookTarget.y = 1.2
        persp.lookAt(lookTarget)
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
      const follow = new THREE.Vector3(
        boatPos.current.x + 2.2,
        4.2,
        boatPos.current.z + 6.5,
      )
      const establishCam = new THREE.Vector3(lx + 4, 5.5, lz + 8)
      persp.position.lerpVectors(follow, establishCam, establish)
      const lookY = THREE.MathUtils.lerp(1.2, 4.5, establish)
      persp.lookAt(lx, lookY, lz)
      persp.fov = THREE.MathUtils.lerp(vFov, 42, approach * 0.3 + establish * 0.4)
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
      const follow = new THREE.Vector3(
        boatPos.current.x * 0.12,
        runtime.current.height + 0.15,
        runtime.current.cameraZ,
      )
      persp.position.x = THREE.MathUtils.lerp(persp.position.x, follow.x, 1 - Math.exp(-dt * 1.2))
      persp.position.y = THREE.MathUtils.lerp(
        persp.position.y,
        follow.y,
        1 - Math.exp(-dt * 1.2),
      )
      const look = new THREE.Vector3(
        THREE.MathUtils.lerp(0, boatPos.current.x, 0.08),
        0.4,
        boatPos.current.z - 8,
      )
      persp.lookAt(look)
    }

    if (!wantsDebug()) {
      persp.fov = vFov
      persp.updateProjectionMatrix()
    }
  })

  return null
}

function ExteriorWorld(props: ExteriorApi) {
  const {
    scene,
    markersReached,
    onReachMarker,
    onIntroComplete,
    onDockComplete,
    reducedMotion,
  } = props

  const boatState = useRef(createBoatState())
  const runtime = useRef(createRuntime())
  const introT = useRef(0)
  const dockT = useRef(0)
  const introDone = useRef(false)
  const dockDone = useRef(false)
  const resolution = useRef(new THREE.Vector2(1821, 864))
  const { gl, scene: threeScene, camera, size } = useThree()

  const visuals = useMemo(
    () => createSeaWorld(runtime.current),
    [],
  )
  const composerBundle = useMemo(
    () => createComposer(gl, threeScene, camera),
    [gl, threeScene, camera],
  )

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera
    applyScenicCamera(persp, {
      aspect: size.width / Math.max(1, size.height) || REF_ASPECT,
      vFov: runtime.current.vFov,
      pitchDeg: runtime.current.pitchDeg,
      height: runtime.current.height,
      z: runtime.current.cameraZ,
    })

    placeAndFit(
      persp,
      visuals.leftRock,
      LAYOUT_WORLD.leftRock,
      LAYOUT.leftRock.width,
    )
    placeAndFit(
      persp,
      visuals.midRock,
      LAYOUT_WORLD.midRock,
      LAYOUT.midRock.width,
    )
    placeAndFit(
      persp,
      visuals.nearRock,
      LAYOUT_WORLD.nearRock,
      LAYOUT.nearRock.width,
    )
    placeAndFit(
      persp,
      visuals.lighthouse.group,
      LAYOUT_WORLD.lighthouse,
      LAYOUT.lighthouse.width,
    )
    placeAndFit(
      persp,
      visuals.whiteBuoy.group,
      LAYOUT_WORLD.whiteBuoy,
      LAYOUT.whiteBuoy.width,
    )
    placeAndFit(
      persp,
      visuals.redBuoy.group,
      LAYOUT_WORLD.redBuoy,
      LAYOUT.redBuoy.width,
    )
    placeAndFit(persp, visuals.boat.group, LAYOUT_WORLD.boat, LAYOUT.boat.width)
    placeAndFit(persp, visuals.pier.group, LAYOUT_WORLD.pier, LAYOUT.pier.width)
    placeAndFit(
      persp,
      visuals.islandDock.group,
      LAYOUT_WORLD.islandDock,
      LAYOUT.islandDock.width,
    )

    visuals.pier.group.position.y = 0
    visuals.islandDock.group.position.y = 0.05
    visuals.islandDock.group.rotation.y = 0.4

    boatState.current.position.set(
      LAYOUT_WORLD.boat.x,
      0.15,
      LAYOUT_WORLD.boat.z,
    )

    // Girl starts on pier
    visuals.girl.group.position.set(
      LAYOUT_WORLD.pier.x,
      0.55,
      LAYOUT_WORLD.pier.z - 0.8,
    )
    visuals.girl.setPose('look')
  }, [camera, size.width, size.height, visuals])

  useEffect(() => {
    let cancelled = false
    loadBoatGlb().then((obj) => {
      if (cancelled || !obj) return
      visuals.boat.setVisual?.(obj)
      const persp = camera as THREE.PerspectiveCamera
      placeAndFit(
        persp,
        visuals.boat.group,
        LAYOUT_WORLD.boat,
        LAYOUT.boat.width,
      )
    })
    loadLighthouseGlb().then((obj) => {
      if (cancelled || !obj || !LIGHTHOUSE.useGlb) return
      while (visuals.lighthouse.group.children.length) {
        visuals.lighthouse.group.remove(visuals.lighthouse.group.children[0]!)
      }
      visuals.lighthouse.group.add(obj)
      const persp = camera as THREE.PerspectiveCamera
      placeAndFit(
        persp,
        visuals.lighthouse.group,
        LAYOUT_WORLD.lighthouse,
        LAYOUT.lighthouse.width,
      )
    })
    return () => {
      cancelled = true
    }
  }, [camera, visuals])

  useEffect(() => {
    introT.current = 0
    dockT.current = 0
    introDone.current = false
    dockDone.current = false
    if (scene === 'intro') {
      visuals.girl.group.position.set(
        LAYOUT_WORLD.pier.x,
        0.55,
        LAYOUT_WORLD.pier.z - 0.8,
      )
      visuals.girl.setPose('look')
    }
    if (scene === 'sail') {
      visuals.girl.group.position.set(0.05, 0.55, 0.15)
      visuals.boat.group.add(visuals.girl.group)
      visuals.girl.setPose('sit')
    }
    if (scene === 'dock') {
      if (visuals.girl.group.parent !== visuals.root) {
        visuals.root.add(visuals.girl.group)
      }
    }
  }, [scene, visuals])

  useEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping
    gl.toneMappingExposure = runtime.current.exposure
    gl.shadowMap.enabled = false
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.autoClear = true

    const dprCap = isMobile() ? PERF.dprMobile : PERF.dprDesktop
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap))

    const parent = gl.domElement.parentElement
    let compare: ReturnType<typeof mountCompareOverlay> | null = null
    let debug: ReturnType<typeof mountDebugGui> | null = null

    const pushSceneUniforms = () => {
      gl.toneMappingExposure = runtime.current.exposure
      composerBundle.bloom.strength = runtime.current.bloomStrength
      composerBundle.bloom.threshold = runtime.current.bloomThreshold
      updateSkySun(visuals.sky, runtime.current.sunDir)
      updateMountains(visuals.mountains, runtime.current.sunDir)
      updateClouds(
        visuals.clouds,
        runtime.current.sunDir,
        runtime.current.fogDensity,
      )
      updateLightRig(
        visuals.lights,
        runtime.current.sunDir,
        runtime.current.sunIntensity,
      )
      setSunFogDensity(visuals.root, runtime.current.fogDensity)
      updateOcean(visuals.oceanMat, {
        sunDir: runtime.current.sunDir,
        time: runtime.current.time,
        fogDensity: runtime.current.fogDensity,
        reflectMap: visuals.reflection.target.texture,
        waveAmp: OCEAN.amplitude,
        waveFreq: OCEAN.frequency,
        waveSpeed: OCEAN.speed,
        facetScale: OCEAN.facetScale,
      })
    }

    if (parent && wantsCompare()) compare = mountCompareOverlay(parent)
    if (wantsDebug()) {
      debug = mountDebugGui(runtime.current, {
        bloom: composerBundle.bloom,
        onChange: pushSceneUniforms,
      })
    }
    pushSceneUniforms()

    const onResize = () => {
      const w = size.width
      const h = size.height
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
      composerBundle.setSize(w, h, dpr)
      visuals.reflection.setSize(w * dpr, h * dpr)
    }
    onResize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      compare?.dispose()
      debug?.dispose()
      composerBundle.dispose()
      visuals.reflection.dispose()
    }
  }, [
    gl,
    composerBundle,
    visuals,
    size.width,
    size.height,
  ])

  // Reduced motion: skip intro immediately
  useEffect(() => {
    if (reducedMotion && scene === 'intro') onIntroComplete()
  }, [reducedMotion, scene, onIntroComplete])

  const canSail = scene === 'sail'

  const onNavigate = (x: number, z: number) => {
    if (!canSail) return
    const resolved = resolveSailTarget(x, z, markersReached)
    setBoatTarget(boatState.current, resolved.x, resolved.z)
  }

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    runtime.current.time = t
    const persp = camera as THREE.PerspectiveCamera

    // Intro cinematic
    if (scene === 'intro' && !reducedMotion) {
      introT.current += dt
      const phase = introPhase(introT.current)
      const pier = LAYOUT_WORLD.pier
      const boatPos = LAYOUT_WORLD.boat
      if (phase === 'look') {
        visuals.girl.setPose('look')
      } else if (phase === 'walk') {
        visuals.girl.setPose('walk')
        const p = segmentProgress(introT.current, INTRO.look, INTRO.walk)
        visuals.girl.group.position.set(
          THREE.MathUtils.lerp(pier.x, boatPos.x, p),
          0.55,
          THREE.MathUtils.lerp(pier.z - 0.8, boatPos.z + 0.3, p),
        )
      } else if (phase === 'board') {
        visuals.girl.setPose('sit')
        const p = segmentProgress(
          introT.current,
          INTRO.look + INTRO.walk,
          INTRO.board,
        )
        visuals.girl.group.position.set(
          THREE.MathUtils.lerp(boatPos.x, boatPos.x + 0.05, p),
          THREE.MathUtils.lerp(0.55, 0.7, p),
          THREE.MathUtils.lerp(boatPos.z + 0.3, boatPos.z + 0.15, p),
        )
      } else if (!introDone.current) {
        introDone.current = true
        visuals.girl.group.position.set(0.05, 0.55, 0.15)
        visuals.boat.group.add(visuals.girl.group)
        visuals.girl.setPose('sit')
        onIntroComplete()
      }
      visuals.girl.update(t, reducedMotion)
    }

    // Dock cinematic
    if (scene === 'dock' && !reducedMotion) {
      dockT.current += dt
      const phase = dockPhase(dockT.current)
      const [dx, dy, dz] = DOCK_POSITION
      if (phase === 'approach') {
        setBoatTarget(boatState.current, dx, dz)
        tickBoat(boatState.current, dt, 3.2, 2.8)
        visuals.girl.setPose('sit')
        if (visuals.girl.group.parent !== visuals.boat.group) {
          visuals.boat.group.add(visuals.girl.group)
          visuals.girl.group.position.set(0.05, 0.55, 0.15)
        }
      } else if (phase === 'exit') {
        boatState.current.target = null
        boatState.current.position.set(dx, dy, dz)
        if (visuals.girl.group.parent === visuals.boat.group) {
          visuals.root.add(visuals.girl.group)
        }
        const p = segmentProgress(dockT.current, DOCK.approach, DOCK.exit)
        visuals.girl.setPose('step')
        visuals.girl.group.position.set(
          THREE.MathUtils.lerp(dx, LAYOUT_WORLD.islandDock.x, p),
          0.55,
          THREE.MathUtils.lerp(dz, LAYOUT_WORLD.islandDock.z - 0.5, p),
        )
      } else if (phase === 'establish') {
        visuals.girl.setPose('look')
      } else if (!dockDone.current) {
        dockDone.current = true
        onDockComplete()
      }
      visuals.girl.update(t, reducedMotion)
    }

    if (reducedMotion && scene === 'dock' && !dockDone.current) {
      dockDone.current = true
      onDockComplete()
    }

    // Sail arrivals
    if (scene === 'sail' && !reducedMotion) {
      tickBoat(boatState.current, dt)
      const boat = boatState.current.position
      if (markersReached < MARKER_POSITIONS.length) {
        const wp = MARKER_POSITIONS[markersReached]!
        const d = Math.hypot(boat.x - wp[0], boat.z - wp[2])
        if (d < ARRIVE_RADIUS) onReachMarker(markersReached)
      }
    }

    visuals.boat.group.position.x = boatState.current.position.x
    visuals.boat.group.position.z = boatState.current.position.z
    visuals.boat.update(t, boatState.current.heading, reducedMotion)
    visuals.foam.updateWake(
      visuals.boat.group.position,
      boatState.current.heading + Math.PI,
    )
    visuals.whiteBuoy.update(t)
    visuals.redBuoy.update(t)
    visuals.markerTrail.update(t)
    // Ambient lantern glow (set dressing, not a game objective)
    visuals.lighthouse.update(t, true)

    if (scene === 'sail' || scene === 'dock') {
      if (visuals.girl.group.parent === visuals.boat.group) {
        visuals.girl.update(t, reducedMotion)
      }
    }

    updateSunDisc(visuals.sun, runtime.current.sunDir, camera)
    updateSkySun(visuals.sky, runtime.current.sunDir)
    updateMountains(visuals.mountains, runtime.current.sunDir)
    updateClouds(
      visuals.clouds,
      runtime.current.sunDir,
      runtime.current.fogDensity,
    )
    updateLightRig(
      visuals.lights,
      runtime.current.sunDir,
      runtime.current.sunIntensity,
    )

    visuals.reflection.render(gl, persp, threeScene)
    resolution.current.set(size.width, size.height)
    updateOcean(visuals.oceanMat, {
      sunDir: runtime.current.sunDir,
      time: t,
      fogDensity: runtime.current.fogDensity,
      reflectMap: visuals.reflection.target.texture,
      resolution: resolution.current,
      waveAmp: OCEAN.amplitude,
      waveFreq: OCEAN.frequency,
      waveSpeed: OCEAN.speed,
      facetScale: OCEAN.facetScale,
    })

    composerBundle.bloom.strength = runtime.current.bloomStrength
    composerBundle.bloom.threshold = runtime.current.bloomThreshold
    gl.toneMappingExposure = runtime.current.exposure
    composerBundle.composer.render()
  }, 1)

  const boatPosRef = useRef(boatState.current.position)
  boatPosRef.current = boatState.current.position

  return (
    <>
      <color attach="background" args={[COLORS.clear]} />
      <ExteriorCameraRig
        runtime={runtime}
        scene={scene}
        boatPos={boatPosRef}
        reducedMotion={reducedMotion}
        introT={introT}
        dockT={dockT}
      />
      <primitive object={visuals.root} />

      {canSail && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, -20]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (reducedMotion) return
            e.stopPropagation()
            onNavigate(e.point.x, e.point.z)
          }}
        >
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {MARKER_POSITIONS.map((pos, i) => (
        <mesh
          key={`mk-${i}`}
          position={[pos[0], 0.4, pos[2]]}
          onClick={(e) => {
            if (!canSail || markersReached !== i || reducedMotion) return
            e.stopPropagation()
            setBoatTarget(boatState.current, pos[0], pos[2])
          }}
        >
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshBasicMaterial
            color={markersReached === i ? '#FCCE95' : '#D8D3CC'}
            transparent
            opacity={markersReached === i ? 0.18 : 0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}

export function ExteriorScene(props: ExteriorApi) {
  const dprMax = isMobile() ? PERF.dprMobile : PERF.dprDesktop
  return (
    <Canvas
      dpr={[1, dprMax]}
      shadows={false}
      camera={{
        position: [0, 4, 14],
        fov: 45,
        near: 0.1,
        far: 220,
      }}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NeutralToneMapping,
      }}
      style={{ width: '100%', height: '100%' }}
      frameloop="always"
    >
      <Suspense fallback={null}>
        <ExteriorWorld {...props} />
      </Suspense>
    </Canvas>
  )
}
