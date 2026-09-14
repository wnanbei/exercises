import type { Exercise } from '../domain/types'
import { MuscleMap } from './MuscleMap'
import { Icon, CHEVRON_DOWN } from './Icon'

interface Props {
  exercise: Exercise
  open: boolean
  onToggle: () => void
}

/**
 * 「动作说明」——以正文排版呈现在发丝线之下，而非装进卡片：
 * 上方的展开已经承载了动作名称与目标。
 */
export function DetailPanel({ exercise, open, onToggle }: Props) {
  return (
    <section className="ds-notes">
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="ds-detail"
        className="ds-notes__toggle ds-quiet"
      >
        <span className="ds-eyebrow">动作说明</span>
        <span
          className="ds-notes__chev"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          <Icon size={16} stroke="currentColor">
            <path d={CHEVRON_DOWN} />
          </Icon>
        </span>
      </button>

      <div id="ds-detail" hidden={!open} className="ds-notes__body">
        <div className="ds-notes__prose">
          <p className="ds-lede">{exercise.instruction.action}</p>
          <p className="ds-how">
            <strong>准备姿势</strong> — {exercise.instruction.setup}
          </p>
          <p className="ds-how">
            <strong>应感受到</strong> — {exercise.instruction.feel}
          </p>
        </div>

        <figure className="ds-notes__figure">
          <MuscleMap muscles={exercise.muscles} progress={1} />
          <figcaption className="ds-caption">
            <span>前</span>
            <span>后</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
