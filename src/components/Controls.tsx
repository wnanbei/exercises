import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import type { SessionStatus } from '../session/reducer'

interface ControlsProps {
  status: SessionStatus
  onToggle: () => void
  onPrev: () => void
  onNext: () => void
}

export function Controls({ status, onToggle, onPrev, onNext }: ControlsProps) {
  const playing = status === 'holding'
  return (
    <div className="controls">
      <button className="ctrl-btn" onClick={onPrev} aria-label="上一动作">
        <SkipBack size={22} />
      </button>
      <button
        className="ctrl-btn ctrl-main"
        onClick={onToggle}
        aria-label={playing ? '暂停' : '开始'}
      >
        {playing ? <Pause size={26} /> : <Play size={26} />}
      </button>
      <button className="ctrl-btn" onClick={onNext} aria-label="下一动作">
        <SkipForward size={22} />
      </button>
      <p className="controls-hint" aria-hidden>
        空格 开始/暂停 · ← → 切换动作
      </p>
    </div>
  )
}
