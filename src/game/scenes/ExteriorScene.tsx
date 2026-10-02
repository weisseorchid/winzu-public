import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createBoatState } from '../BoatController'
import type { SceneId } from '../types'
import {
  COLORS,
  resolveQualityProfile,
  createRuntime,
} from '../../scene/config'
import { createSeaWorld, disposeSeaWorld } from './SeaWorld'
import { createIntroDirector } from './exterior/IntroDirector'
import { createDockDirector } from './exterior/DockDirector'
import { createSailController } from './exterior/SailController'
import { updateExteriorFrame } from './exterior/ExteriorFrameLoop'
import { createExteriorPost } from './exterior/ExteriorPost'
import { ExteriorCameraRig } from './exterior/ExteriorCameraRig'
import { SailInput } from './exterior/SailInput'
import { fitExteriorLayout } from './exterior/fitExteriorLayout'
import { loadExteriorGlbs } from './exterior/loadExteriorGlbs'

export type ExteriorApi = {
  scene: SceneId
  markersReached: number
  onReachMarker: (index: number) => void
  onIntroComplete: () => void
  onDockComplete: () => void
  reducedMotion: boolean
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
  const quality = useMemo(() => resolveQualityProfile(), [])
  const resolution = useRef(new THREE.Vector2(1821, 864))
  const onIntroCompleteRef = useRef(onIntroComplete)
  const onDockCompleteRef = useRef(onDockComplete)
  const onReachMarkerRef = useRef(onReachMarker)
  onIntroCompleteRef.current = onIntroComplete
  onDockCompleteRef.current = onDockComplete
  onReachMarkerRef.current = onReachMarker

  const { gl, scene: threeScene, camera, size } = useThree()

  const visuals = useMemo(
    () => createSeaWorld(runtime.current, quality),
    [quality],
  )
  const intro = useMemo(
    () =>
      createIntroDirector({
        onComplete: () => onIntroCompleteRef.current(),
      }),
    [],
  )
  const dock = useMemo(
    () =>
      createDockDirector({
        onComplete: () => onDockCompleteRef.current(),
        boatState: boatState.current,
      }),
    [],
  )
  const sail = useMemo(
    () =>
      createSailController({
        boatState: boatState.current,
        onReachMarker: (i) => onReachMarkerRef.current(i),
      }),
    [],
  )
  const post = useMemo(
    () => createExteriorPost(gl, threeScene, camera),
    [gl, threeScene, camera],
  )

  useEffect(() => {
    fitExteriorLayout(
      camera as THREE.PerspectiveCamera,
      visuals,
      boatState.current,
      runtime.current,
      size.width / Math.max(1, size.height),
    )
  }, [camera, size.width, size.height, visuals])

  useEffect(() => {
    return loadExteriorGlbs(camera as THREE.PerspectiveCamera, visuals)
  }, [camera, visuals])

  useEffect(() => {
    intro.reset()
    dock.reset()
    sail.resetLatch()
    if (scene === 'intro') intro.enter(visuals)
    if (scene === 'sail') {
      visuals.girl.group.position.set(0.05, 0.55, 0.15)
      visuals.boat.group.add(visuals.girl.group)
      visuals.girl.setPose('sit')
    }
    if (scene === 'dock') dock.enter(visuals)
  }, [scene, visuals, intro, dock, sail])

  useEffect(() => {
    post.mount({
      runtime: runtime.current,
      visuals,
      size: { width: size.width, height: size.height },
      dprCap: quality.dprCap,
      quality,
    })
    return () => {
      post.dispose(visuals)
      disposeSeaWorld(visuals)
    }
  }, [post, visuals, quality])

  useEffect(() => {
    post.setSize(size.width, size.height)
  }, [post, size.width, size.height])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    runtime.current.time = t
    const persp = camera as THREE.PerspectiveCamera

    if (scene === 'intro') intro.update(dt, t, visuals, reducedMotion)
    if (scene === 'dock') dock.update(dt, t, visuals, reducedMotion)
    if (scene === 'sail') sail.update(dt, markersReached, reducedMotion)

    updateExteriorFrame({
      t,
      scene,
      reducedMotion,
      runtime: runtime.current,
      visuals,
      boatState: boatState.current,
      camera,
    })

    post.renderFrame({
      runtime: runtime.current,
      visuals,
      camera: persp,
      size: { width: size.width, height: size.height },
      resolution: resolution.current,
      elapsed: t,
    })
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
        introT={intro.t}
        dockT={dock.t}
      />
      <primitive object={visuals.root} />
      <SailInput
        canSail={scene === 'sail'}
        markersReached={markersReached}
        reducedMotion={reducedMotion}
        sail={sail}
      />
    </>
  )
}

export function ExteriorScene(props: ExteriorApi) {
  const dprMax = useMemo(() => resolveQualityProfile().dprCap, [])
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
