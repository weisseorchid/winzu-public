import type { ThreeEvent } from '@react-three/fiber'
import { MARKER_POSITIONS } from '../../BoatController'
import type { SailController } from './SailController'

export function SailInput({
  canSail,
  markersReached,
  reducedMotion,
  sail,
}: {
  canSail: boolean
  markersReached: number
  reducedMotion: boolean
  sail: SailController
}) {
  return (
    <>
      {canSail && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, -20]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (reducedMotion) return
            e.stopPropagation()
            sail.navigate(e.point.x, e.point.z, markersReached)
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
            if (!canSail) return
            e.stopPropagation()
            sail.clickMarker(i, markersReached, reducedMotion)
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
