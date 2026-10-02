/**
 * Compress scene plates for the ?compare overlay.
 *
 *   assets/scene_N.png  →  public/plates/scene_N.png
 *
 * Keeps PNG for CompareOverlay compatibility. Fails if any plate exceeds
 * the per-file byte budget after compression.
 *
 * Usage: yarn compress-plates
 */
import { access, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'assets')
const outDir = path.join(root, 'public', 'plates')

/** Soft cap so compare plates stay lightweight in Pages deploys. */
const MAX_BYTES = 500 * 1024
/** Longest edge — enough for full-bleed compare wipe. */
const MAX_EDGE = 1280

const PLATES = ['scene_0.png', 'scene_1.png', 'scene_2.png', 'scene_3.png']

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

await mkdir(outDir, { recursive: true })

console.log('compress-plates: assets/scene_*.png → public/plates/')

let ok = 0
let failed = 0

for (const name of PLATES) {
  const srcPath = path.join(srcDir, name)
  const outPath = path.join(outDir, name)

  if (!(await exists(srcPath))) {
    console.error(`  ✗ ${name}  missing source`)
    failed += 1
    continue
  }

  try {
    const before = (await stat(srcPath)).size
    await sharp(srcPath)
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 9, palette: true, quality: 70, colors: 128 })
      .toFile(outPath)

    const after = (await stat(outPath)).size
    if (after > MAX_BYTES) {
      console.error(
        `  ✗ ${name}  ${formatBytes(before)} → ${formatBytes(after)}  BUDGET: > ${formatBytes(MAX_BYTES)}`,
      )
      failed += 1
      continue
    }

    console.log(`  ✓ ${name}  ${formatBytes(before)} → ${formatBytes(after)}`)
    ok += 1
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  ✗ ${name}  ${msg}`)
    failed += 1
  }
}

console.log(`done: ${ok} compressed, ${failed} failed`)
if (failed > 0) process.exit(1)
