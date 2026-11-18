import { LighthouseAnimation } from '../components/LighthouseAnimation/LighthouseAnimation'

export function HomePage() {
  return (
    <main className="main">
      <div className="shell main__inner">
        <div className="lighthouse">
          <LighthouseAnimation duration={14} />
        </div>
      </div>
    </main>
  )
}
