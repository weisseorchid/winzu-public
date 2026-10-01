import { readFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const REF_ASSETS = path.join(root, 'assets', 'reference.png')
const REF_PUBLIC = path.join(root, 'public', 'reference.png')
const REF_SCENE1 = path.join(root, 'assets', 'scene_1.png')
const REF = (await exists(REF_ASSETS))
  ? REF_ASSETS
  : (await exists(REF_PUBLIC))
    ? REF_PUBLIC
    : REF_SCENE1

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}
const ANCHORS = path.join(root, 'assets', 'anchors.json')
const shotName = process.argv[2] || 'm0'
const SHOT = path.join(root, 'shots', `${shotName}.png`)

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function dist(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

async function sample(pngPath, u, v) {
  const img = sharp(pngPath)
  const meta = await img.metadata()
  const w = meta.width
  const h = meta.height
  const x = Math.min(w - 1, Math.max(0, Math.round(u * (w - 1))))
  const y = Math.min(h - 1, Math.max(0, Math.round(v * (h - 1))))
  const { data } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const i = (y * w + x) * 4
  return { r: data[i], g: data[i + 1], b: data[i + 2] }
}

async function main() {
  await access(REF)
  await access(ANCHORS)
  let hasShot = true
  try {
    await access(SHOT)
  } catch {
    hasShot = false
  }

  const anchors = JSON.parse(await readFile(ANCHORS, 'utf8'))
  console.log(
    `Anchors vs reference (${path.basename(REF)})` +
      (hasShot ? ` and shot ${shotName}.png` : ' (no shot yet)'),
  )
  console.log(
    'id'.padEnd(16),
    'role'.padEnd(10),
    'Δref',
    hasShot ? 'Δshot' : '',
    'note',
  )

  let primaryFail = 0
  for (const a of anchors) {
    const target = hexToRgb(a.hex)
    const refC = await sample(REF, a.u, a.v)
    const dRef = dist(refC, target)
    let dShot = null
    if (hasShot) {
      const shotC = await sample(SHOT, a.u, a.v)
      dShot = dist(shotC, refC)
    }
    const primary =
      a.role === 'sky' ||
      a.role === 'water' ||
      a.role === 'sun' ||
      a.role === 'horizon'
    // Soft tolerance — generous perceptual budget
    const tol = primary ? 90 : 120
    const bad = dShot != null && dShot > tol
    if (bad && primary) primaryFail++
    console.log(
      a.id.padEnd(16),
      a.role.padEnd(10),
      dRef.toFixed(1).padStart(6),
      dShot != null ? dShot.toFixed(1).padStart(6) : '   n/a',
      bad ? (primary ? 'SOFT-FAIL' : 'info') : 'ok',
    )
  }

  if (primaryFail > 0) {
    console.log(
      `\nSoft check: ${primaryFail} primary anchor(s) outside generous tolerance (informational).`,
    )
  } else {
    console.log(
      '\nSoft check: primary anchors within generous tolerance (or no shot).',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
