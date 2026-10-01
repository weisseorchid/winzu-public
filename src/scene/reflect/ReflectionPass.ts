import * as THREE from 'three'

export type ReflectionPass = {
  target: THREE.WebGLRenderTarget
  camera: THREE.PerspectiveCamera
  /** Marker only — props live in the main scene. */
  layer: THREE.Group
  render: (
    renderer: THREE.WebGLRenderer,
    mainCamera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
  ) => void
  setSize: (w: number, h: number) => void
  dispose: () => void
  trackHidden: (...objs: THREE.Object3D[]) => void
}

/**
 * Half-res mirrored render of scenic props (hide non-prop roots while capturing).
 */
export function createReflectionPass(halfRes = true): ReflectionPass {
  const target = new THREE.WebGLRenderTarget(4, 4, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  })
  target.texture.name = 'ReflectionRT'

  const camera = new THREE.PerspectiveCamera()
  const layer = new THREE.Group()
  layer.name = 'ReflectionLayerMarker'
  const hideWhileReflecting: THREE.Object3D[] = []
  const _look = new THREE.Vector3()
  const _target = new THREE.Vector3()

  const setSize = (w: number, h: number) => {
    const rw = halfRes ? Math.max(1, Math.ceil(w / 2)) : w
    const rh = halfRes ? Math.max(1, Math.ceil(h / 2)) : h
    target.setSize(rw, rh)
  }

  const trackHidden = (...objs: THREE.Object3D[]) => {
    hideWhileReflecting.push(...objs)
  }

  const render = (
    renderer: THREE.WebGLRenderer,
    mainCamera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
  ) => {
    camera.copy(mainCamera)
    const p = mainCamera.position
    camera.position.set(p.x, -p.y, p.z)
    mainCamera.getWorldDirection(_look)
    _look.y *= -1
    camera.up.set(0, 1, 0)
    _target.copy(camera.position).add(_look)
    camera.lookAt(_target)
    camera.fov = mainCamera.fov
    camera.aspect = mainCamera.aspect
    camera.near = mainCamera.near
    camera.far = mainCamera.far
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld(true)

    const prevVis = hideWhileReflecting.map((o) => o.visible)
    for (const o of hideWhileReflecting) o.visible = false

    const prevTarget = renderer.getRenderTarget()
    const prevClear = renderer.autoClear
    renderer.setRenderTarget(target)
    renderer.autoClear = true
    renderer.setClearColor(0x000000, 0)
    renderer.clear()
    renderer.render(scene, camera)
    renderer.setRenderTarget(prevTarget)
    renderer.autoClear = prevClear

    hideWhileReflecting.forEach((o, i) => {
      o.visible = prevVis[i]!
    })
  }

  return {
    target,
    camera,
    layer,
    render,
    setSize,
    dispose: () => target.dispose(),
    trackHidden,
  }
}
