import { useEffect, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import './LighthouseAnimation.css'

const FRAME_COUNT = 5
const FRAMES = Array.from(
  { length: FRAME_COUNT },
  (_, i) => `/animations/sprite_${i + 1}.png`,
)

interface LighthouseAnimationProps {
  duration?: number
  paused?: boolean
}

export function LighthouseAnimation({
  duration = 12,
  paused = false,
}: LighthouseAnimationProps) {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)

  // Ping-pong: 1→…→end→…→1 (endpoints once each per turn)
  const stepCount = (FRAME_COUNT - 1) * 2
  const fadeSeconds = Math.min(0.7, duration / stepCount / 4)

  useEffect(() => {
    if (paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const slotMs = (duration * 1000) / stepCount
    let cancelled = false
    let index = 0
    let direction = 1

    const slotTimer = window.setInterval(() => {
      if (cancelled) return

      if (index === FRAME_COUNT - 1) direction = -1
      else if (index === 0) direction = 1

      index += direction
      setActive(index)
    }, slotMs)

    return () => {
      cancelled = true
      window.clearInterval(slotTimer)
    }
  }, [duration, paused, stepCount])

  return (
    <div
      className={`lighthouse-animation${paused ? ' paused' : ''}`}
      style={{ '--fade': `${fadeSeconds}s` } as CSSProperties}
      role="img"
      aria-label={t('lighthouse.label')}
    >
      {FRAMES.map((src, index) => (
        <img
          key={src}
          className={`lighthouse-animation__frame${index === active ? ' is-active' : ''}`}
          src={src}
          alt=""
          width={1080}
          height={720}
          draggable={false}
        />
      ))}
    </div>
  )
}
