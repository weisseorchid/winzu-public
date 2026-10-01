import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'node:url'

/**
 * Generate public/og.png (1200×630) from a local art-direction still.
 * Source lives under assets/idea/ (gitignored); the PNG output is committed.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const night = path.join(
  root,
  'assets',
  'idea',
  'ChatGPT Image 28 sept 2026, 07_34_24.png',
)

const ogBase = await sharp(night)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .modulate({ brightness: 0.85 })
  .toBuffer()

const svg = Buffer.from(`
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="460" width="1200" height="170" fill="rgba(22,21,19,0.55)"/>
  <text x="64" y="545" font-family="Georgia, serif" font-size="72" fill="#f3efe6">Winzu</text>
  <text x="64" y="590" font-family="Arial, sans-serif" font-size="28" fill="#e6b15a">From paperwork fog to a clear map</text>
</svg>
`)

const out = path.join(root, 'public', 'og.png')
await sharp(ogBase)
  .composite([{ input: svg, top: 0, left: 0 }])
  .png()
  .toFile(out)

console.log('wrote public/og.png')
