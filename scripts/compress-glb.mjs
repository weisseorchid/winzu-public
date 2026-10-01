/**
 * Placeholder GLB compress step.
 * When real .glb sources exist under assets/renders-src/, run:
 *   yarn compress-glb
 * and write meshopt/draco outputs into public/renders/.
 *
 * Until then this script documents the expected filenames and exits 0.
 */
import { access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'public', 'renders')

const EXPECTED = [
  'stylized_boat_lowpoly.glb',
  'stylized_lighthouse_lowpoly.glb',
  'stylized_girl_lowpoly.glb',
  'stylized_pier_lowpoly.glb',
  'stylized_desk_lowpoly.glb',
]

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

console.log('compress-glb: expected outputs in public/renders/')
for (const name of EXPECTED) {
  const p = path.join(outDir, name)
  const ok = await exists(p)
  console.log(`  ${ok ? '✓' : '·'} ${name}`)
}
console.log(
  'Add meshopt/gltf-transform pipeline when source GLBs are ready. Procedural fallbacks are active.',
)
