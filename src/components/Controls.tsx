import type { Phase } from '../session/reducer'
import { Icon, NEXT_PATH, PAUSE_PATH, PLAY_PATH, PREV_PATH, REPLAY_PATH } from './Icon'
import { Tooltip } from './Tooltip'

interface ControlsProps {
  phase: Phase
  onToggle: () => void
  onPrev: () => void
  onNext: () => void
}

/** 播放控制：点击播放后自动计时并依次推进方案内所有动作 */
export function Controls({ phase, onToggle, onPrev, onNext }: ControlsProps) {
  const holding = phase === 'holding'
  const finished = phase === 'finished'
  const resting = phase === 'resting'

  const mainLabel = finished
    ? '再练一遍 · 空格'
    : holding
      ? '暂停 · 空格'
      : resting
        ? '即将开始下一个…'
        : '播放全部动作并计时 · 空格'

  return (
    <div className="ds-readout__controls">
      <Tooltip label="上一个动作 · ←">
        <button onClick={onPrev} aria-label="上一个动作" className="ds-side-btn ds-hoverable">
          <Icon size={18}>
            <path d={PREV_PATH} />
          </Icon>
        </button>
      </Tooltip>

      <Tooltip label={mainLabel}>
        <button
          onClick={onToggle}
          aria-label={finished ? '再练一遍' : holding ? '暂停' : '播放'}
          className="ds-play-btn ds-primary"
        >
          <Icon size={24} fill="currentColor" stroke="none">
            <path d={finished ? REPLAY_PATH : holding ? PAUSE_PATH : PLAY_PATH} />
          </Icon>
        </button>
      </Tooltip>

      <Tooltip label="下一个动作 · →">
        <button onClick={onNext} aria-label="下一个动作" className="ds-side-btn ds-hoverable">
          <Icon size={18}>
            <path d={NEXT_PATH} />
          </Icon>
        </button>
      </Tooltip>
    </div>
  )
}
