import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const dist = resolve(import.meta.dirname, '../dist')
await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'))
