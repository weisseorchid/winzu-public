import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'shots')

const WIDTH = 1821
const HEIGHT = 864
const milestone = process.argv[2] || 'm0'
const base = process.env.SHOT_URL || 'http://127.0.0.1:5173/winzu-public/'

/** Map yarn shot <name> → ?scene= force param. */
const MILESTONE_SCENE = {
  scene0: 'intro',
  scene1: 'sail',
  scene2: 'dock',
  scene3: 'desk',
  intro: 'intro',
  sail: 'sail',
  dock: 'dock',
  desk: 'desk',
}

function buildUrl() {
  const url = new URL(base)
  url.searchParams.set('shot', '1')
  const scene = MILESTONE_SCENE[milestone]
  if (scene) url.searchParams.set('scene', scene)
  return url.toString()
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  })
  const url = buildUrl()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 })
  // Let shaders / first frames settle (dock/intro settle a bit longer)
  const settle =
    milestone === 'scene0' || milestone === 'intro' ? 3500 : 2500
  await page.waitForTimeout(settle)
  const out = path.join(outDir, `${milestone}.png`)
  await page.screenshot({ path: out, type: 'png' })
  await browser.close()
  console.log(`Wrote ${out} from ${url}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
