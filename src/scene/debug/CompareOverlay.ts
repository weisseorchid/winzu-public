/** DOM compare overlay: reference image + opacity + split-wipe (?compare). */

export type ComparePlate = 'scene0' | 'scene1' | 'scene2' | 'scene3'

export type CompareOverlay = {
  root: HTMLDivElement
  dispose: () => void
}

const PLATE_FILES: Record<ComparePlate, string> = {
  scene0: 'plates/scene_0.png',
  scene1: 'reference.png',
  scene2: 'plates/scene_2.png',
  scene3: 'plates/scene_3.png',
}

export function wantsCompare(): boolean {
  return new URLSearchParams(location.search).has('compare')
}

/** Parse ?compare or ?compare=scene0|scene1|scene2|scene3 (bare flag → scene1). */
export function resolveComparePlate(): ComparePlate {
  const raw = new URLSearchParams(location.search).get('compare')
  if (!raw || raw === '' || raw === '1' || raw === 'true') return 'scene1'
  const key = raw.replace(/[_-]/g, '').toLowerCase()
  if (key === 'scene0' || key === '0') return 'scene0'
  if (key === 'scene2' || key === '2') return 'scene2'
  if (key === 'scene3' || key === '3') return 'scene3'
  return 'scene1'
}

export function comparePlateUrl(
  plate: ComparePlate = resolveComparePlate(),
): string {
  const base = import.meta.env.BASE_URL
  return `${base}${PLATE_FILES[plate]}`
}

export function mountCompareOverlay(parent: HTMLElement): CompareOverlay {
  const plate = resolveComparePlate()
  const src = comparePlateUrl(plate)

  const root = document.createElement('div')
  root.id = 'compare-overlay'
  Object.assign(root.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '20',
    pointerEvents: 'none',
    overflow: 'hidden',
  } as CSSStyleDeclaration)

  const img = document.createElement('img')
  img.src = src
  img.alt = `reference ${plate}`
  Object.assign(img.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: '0.45',
    pointerEvents: 'none',
  } as CSSStyleDeclaration)
  root.appendChild(img)

  const wipe = document.createElement('div')
  Object.assign(wipe.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    bottom: '0',
    width: '50%',
    overflow: 'hidden',
    pointerEvents: 'none',
  } as CSSStyleDeclaration)
  const wipeImg = document.createElement('img')
  wipeImg.src = img.src
  wipeImg.alt = ''
  Object.assign(wipeImg.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%',
    width: `${parent.clientWidth || window.innerWidth}px`,
    objectFit: 'cover',
    opacity: '1',
  } as CSSStyleDeclaration)
  wipe.appendChild(wipeImg)
  root.appendChild(wipe)

  const panel = document.createElement('div')
  Object.assign(panel.style, {
    position: 'absolute',
    left: '12px',
    bottom: '12px',
    zIndex: '21',
    pointerEvents: 'auto',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(10,12,16,0.7)',
    color: '#D8D3CC',
    font: '12px/1.2 ui-monospace, monospace',
    borderRadius: '8px',
  } as CSSStyleDeclaration)

  const plateTag = document.createElement('span')
  plateTag.textContent = plate
  panel.appendChild(plateTag)

  const opLabel = document.createElement('label')
  opLabel.textContent = 'Opacity'
  const op = document.createElement('input')
  op.type = 'range'
  op.min = '0'
  op.max = '1'
  op.step = '0.01'
  op.value = '0.45'
  op.oninput = () => {
    img.style.opacity = op.value
  }
  opLabel.appendChild(op)

  const wipeLabel = document.createElement('label')
  wipeLabel.textContent = 'Wipe'
  const wipeRange = document.createElement('input')
  wipeRange.type = 'range'
  wipeRange.min = '0'
  wipeRange.max = '1'
  wipeRange.step = '0.01'
  wipeRange.value = '0.5'
  wipeRange.oninput = () => {
    const f = Number(wipeRange.value)
    wipe.style.width = `${f * 100}%`
    wipeImg.style.width = `${parent.clientWidth || window.innerWidth}px`
  }
  wipeLabel.appendChild(wipeRange)

  panel.appendChild(opLabel)
  panel.appendChild(wipeLabel)
  root.appendChild(panel)
  parent.appendChild(root)

  const onResize = () => {
    wipeImg.style.width = `${parent.clientWidth || window.innerWidth}px`
  }
  window.addEventListener('resize', onResize)

  return {
    root,
    dispose: () => {
      window.removeEventListener('resize', onResize)
      root.remove()
    },
  }
}
