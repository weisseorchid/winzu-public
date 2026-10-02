import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { barNorte, type NodeType } from '../../data/barNorte'
import { useI18n } from '../../i18n'
import { COLORS, resolveQualityProfile } from '../../scene/config'
import { disposeObject3D } from '../../scene/dispose'
import {
  createDeskScene,
  setDeskHighlight,
  type DeskPropId,
} from '../../scene/props/Desk'
import { loadDeskGlb } from '../../scene/props/loadOptionalGlb'
import { findDeskId, resolveDeskIntent } from '../interaction/DeskPicker'

const TYPE_COLOR: Record<NodeType, string> = {
  asset: '#7F2417',
  debt: '#212224',
  coverage: '#FCCE95',
  counterparty: '#4C5761',
}

export type DeskSceneApi = {
  deskFocus: null | 'map' | 'doc'
  selectedId: string | null
  highlightIds: string[]
  onSelectNode: (id: string) => void
  onOpenMap: () => void
  onOpenDoc: (docId: string) => void
  onCloseFocus: () => void
}

function DeskGraph({
  selectedId,
  highlightIds,
  onSelect,
  visible,
}: {
  selectedId: string | null
  highlightIds: string[]
  onSelect: (id: string) => void
  visible: boolean
}) {
  const { locale } = useI18n()

  const edges = useMemo(() => {
    return barNorte.edges.flatMap((edge) => {
      const from = barNorte.nodes.find((n) => n.id === edge.from)
      const to = barNorte.nodes.find((n) => n.id === edge.to)
      if (!from || !to) return []
      const a = new THREE.Vector3(
        from.position[0] * 0.28,
        from.position[1] * 0.28 + 0.2,
        from.position[2] * 0.28,
      )
      const b = new THREE.Vector3(
        to.position[0] * 0.28,
        to.position[1] * 0.28 + 0.2,
        to.position[2] * 0.28,
      )
      const geo = new THREE.BufferGeometry().setFromPoints([a, b])
      const mat = new THREE.LineBasicMaterial({
        color: COLORS.offWhite,
        transparent: true,
        opacity: 0.35,
      })
      return [
        {
          id: edge.id,
          from: edge.from,
          to: edge.to,
          line: new THREE.Line(geo, mat),
          mat,
        },
      ]
    })
  }, [])

  useEffect(() => {
    return () => {
      for (const e of edges) {
        e.line.geometry.dispose()
        e.mat.dispose()
      }
    }
  }, [edges])

  useEffect(() => {
    for (const e of edges) {
      const hot = highlightIds.includes(e.from) || highlightIds.includes(e.to)
      e.mat.color.set(hot ? COLORS.sail : COLORS.offWhite)
      e.mat.opacity = hot ? 0.8 : 0.35
    }
  }, [edges, highlightIds])

  if (!visible) return null

  return (
    <group position={[0, 1.35, 0]}>
      {edges.map((e) => (
        <primitive key={e.id} object={e.line} />
      ))}
      {barNorte.nodes.map((node) => {
        const color = TYPE_COLOR[node.type]
        const selected = selectedId === node.id
        const highlight = highlightIds.includes(node.id)
        return (
          <group
            key={node.id}
            position={[
              node.position[0] * 0.28,
              node.position[1] * 0.28 + 0.2,
              node.position[2] * 0.28,
            ]}
          >
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                onSelect(node.id)
              }}
              scale={selected || highlight ? 1.35 : 1}
            >
              <icosahedronGeometry args={[0.09, 0]} />
              <meshLambertMaterial
                color={color}
                flatShading
                emissive={color}
                emissiveIntensity={selected || highlight ? 0.55 : 0.15}
              />
            </mesh>
            <Text
              position={[0, 0.16, 0]}
              fontSize={0.07}
              color="#D8D3CC"
              anchorX="center"
              anchorY="middle"
              maxWidth={0.7}
            >
              {node.label[locale]}
            </Text>
          </group>
        )
      })}
    </group>
  )
}

function DeskWorld(props: DeskSceneApi) {
  const {
    deskFocus,
    selectedId,
    highlightIds,
    onSelectNode,
    onOpenMap,
    onOpenDoc,
    onCloseFocus,
  } = props

  const { camera, gl, size, invalidate } = useThree()
  const desk = useMemo(() => createDeskScene(), [])
  const hoverId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadDeskGlb().then((obj) => {
      if (cancelled || !obj) return
      desk.group.add(obj)
      invalidate()
    })
    return () => {
      cancelled = true
    }
  }, [desk, invalidate])

  useEffect(
    () => () => {
      disposeObject3D(desk.group)
    },
    [desk],
  )

  const camBlend = useRef(0)
  const lookTemp = useRef(new THREE.Vector3())
  const overview = useMemo(
    () => ({
      pos: new THREE.Vector3(0.2, 3.4, 3.8),
      look: new THREE.Vector3(0, 0.9, 0),
    }),
    [],
  )
  const mapCam = useMemo(
    () => ({
      pos: new THREE.Vector3(0.1, 2.6, 2.2),
      look: new THREE.Vector3(0, 1.2, 0),
    }),
    [],
  )
  const docCam = useMemo(
    () => ({
      pos: new THREE.Vector3(0.9, 2.4, 2.0),
      look: new THREE.Vector3(0.5, 1.0, 0),
    }),
    [],
  )

  useEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping
    gl.toneMappingExposure = 1.05
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
    gl.outputColorSpace = THREE.SRGBColorSpace
    invalidate()
  }, [gl, invalidate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseFocus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCloseFocus])

  useEffect(
    () => () => {
      gl.domElement.style.cursor = 'auto'
    },
    [gl],
  )

  // Focus / selection changes need a fresh frame under demand mode.
  useEffect(() => {
    invalidate()
  }, [deskFocus, selectedId, highlightIds, invalidate])

  useFrame((_, dt) => {
    const target = deskFocus ? 1 : 0
    camBlend.current = THREE.MathUtils.lerp(
      camBlend.current,
      target,
      1 - Math.exp(-dt * 3.2),
    )
    const focusCam = deskFocus === 'doc' ? docCam : mapCam
    const persp = camera as THREE.PerspectiveCamera
    persp.position.lerpVectors(overview.pos, focusCam.pos, camBlend.current)
    lookTemp.current.copy(overview.look).lerp(focusCam.look, camBlend.current)
    persp.lookAt(lookTemp.current)
    persp.fov = THREE.MathUtils.lerp(42, 38, camBlend.current)
    persp.aspect = size.width / Math.max(1, size.height)
    persp.updateProjectionMatrix()

    // Keep demand loop alive while the camera blend settles.
    if (Math.abs(camBlend.current - target) > 0.001) invalidate()
  })

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    invalidate()
    const id = findDeskId(e.object)
    if (hoverId.current && hoverId.current !== id) {
      const prev = desk.pickables.get(hoverId.current as DeskPropId)
      setDeskHighlight(prev, false)
    }
    if (id && id !== hoverId.current) {
      const next = desk.pickables.get(id as DeskPropId)
      setDeskHighlight(next, true)
      gl.domElement.style.cursor = 'pointer'
    }
    if (!id) gl.domElement.style.cursor = 'auto'
    hoverId.current = id
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    invalidate()
    const id = findDeskId(e.object)
    if (!id) {
      onCloseFocus()
      return
    }
    const intent = resolveDeskIntent(id)
    if (intent.kind === 'map') onOpenMap()
    else if (intent.kind === 'doc') onOpenDoc(intent.docId)
  }

  return (
    <>
      <color attach="background" args={[COLORS.woodDark]} />
      <primitive
        object={desk.group}
        onPointerMove={onPointerMove}
        onPointerOut={() => {
          if (hoverId.current) {
            setDeskHighlight(
              desk.pickables.get(hoverId.current as DeskPropId),
              false,
            )
            hoverId.current = null
          }
          gl.domElement.style.cursor = 'auto'
          invalidate()
        }}
        onClick={onClick}
      />
      <DeskGraph
        selectedId={selectedId}
        highlightIds={highlightIds}
        onSelect={onSelectNode}
        visible={deskFocus === 'map'}
      />
    </>
  )
}

export function Scene3Desk(props: DeskSceneApi) {
  const dprMax = useMemo(() => resolveQualityProfile().dprCap, [])
  return (
    <Canvas
      dpr={[1, dprMax]}
      shadows
      camera={{ position: [0.2, 3.4, 3.8], fov: 42, near: 0.1, far: 40 }}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NeutralToneMapping,
      }}
      style={{ width: '100%', height: '100%' }}
      frameloop="demand"
    >
      <Suspense fallback={null}>
        <DeskWorld {...props} />
      </Suspense>
    </Canvas>
  )
}
