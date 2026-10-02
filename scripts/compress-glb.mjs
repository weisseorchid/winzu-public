/**
 * Compress authored GLBs with gltf-transform + meshopt.
 *
 *   assets/renders-src/<name>.glb  →  public/renders/<name>.glb
 *
 * Missing sources are skipped (exit 0). A present source that fails to
 * transform or exceeds its size/tri budget fails the run (exit 1).
 *
 * Usage: yarn compress-glb
 */
import { access, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'assets', 'renders-src')
const outDir = path.join(root, 'public', 'renders')

/** Per-asset budgets (Phase 0: prefer < 200 KB; silhouette-first polys). */
const ASSETS = [
  {
    name: 'stylized_boat_lowpoly.glb',
    maxBytes: 50 * 1024,
    maxTris: 2000,
  },
  {
    name: 'stylized_lighthouse_lowpoly.glb',
    maxBytes: 100 * 1024,
    maxTris: 5000,
  },
  {
    name: 'stylized_girl_lowpoly.glb',
    maxBytes: 200 * 1024,
    maxTris: 8000,
  },
  {
    name: 'stylized_pier_lowpoly.glb',
    maxBytes: 200 * 1024,
    maxTris: 8000,
  },
  {
    name: 'stylized_desk_lowpoly.glb',
    maxBytes: 200 * 1024,
    maxTris: 8000,
  },
]

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  return `${(n / 1024).toFixed(1)} KB`
}

function countTris(document) {
  let tris = 0
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices()
      const pos = prim.getAttribute('POSITION')
      if (idx) tris += idx.getCount() / 3
      else if (pos) tris += pos.getCount() / 3
    }
  }
  return Math.round(tris)
}

await MeshoptEncoder.ready

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder })

await mkdir(outDir, { recursive: true })

console.log('compress-glb: assets/renders-src → public/renders (meshopt)')

let compressed = 0
let skipped = 0
let failed = 0

for (const asset of ASSETS) {
  const { name, maxBytes, maxTris } = asset
  const srcPath = path.join(srcDir, name)
  const outPath = path.join(outDir, name)

  if (!(await exists(srcPath))) {
    console.log(`  · ${name}  (no source — skip)`)
    skipped += 1
    continue
  }

  try {
    const before = (await stat(srcPath)).size
    const document = await io.read(srcPath)
    await document.transform(
      dedup(),
      prune(),
      meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
    )
    await io.write(outPath, document)
    const after = (await stat(outPath)).size
    const tris = countTris(document)

    const overSize = after > maxBytes
    const overTris = tris > maxTris
    if (overSize || overTris) {
      const reasons = []
      if (overSize) {
        reasons.push(`size ${formatBytes(after)} > ${formatBytes(maxBytes)}`)
      }
      if (overTris) reasons.push(`tris ${tris} > ${maxTris}`)
      console.error(
        `  ✗ ${name}  ${formatBytes(before)} → ${formatBytes(after)}, ${tris} tris  BUDGET: ${reasons.join('; ')}`,
      )
      failed += 1
      continue
    }

    console.log(
      `  ✓ ${name}  ${formatBytes(before)} → ${formatBytes(after)}, ${tris} tris`,
    )
    compressed += 1
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  ✗ ${name}  ${msg}`)
    failed += 1
  }
}

console.log(
  `done: ${compressed} compressed, ${skipped} skipped, ${failed} failed`,
)

if (failed > 0) process.exit(1)
