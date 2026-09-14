import type { Routine } from '../domain/types'
import { ROUTINES, routineDuration } from '../domain/routines'
import { Tooltip } from './Tooltip'

interface Props {
  currentId: string
  onSwitch: (routine: Routine) => void
}

/** 方案选择条：直接在拉伸页上切换锻炼方案 */
export function RoutineRail({ currentId, onSwitch }: Props) {
  return (
    <section className="ds-rail" aria-label="锻炼方案">
      <div className="ds-rail__inner">
        <p className="ds-eyebrow ds-rail__label">方案</p>
        {ROUTINES.map((r) => {
          const active = r.id === currentId
          return (
            <Tooltip key={r.id} placement="bottom" label={r.description}>
              <button
                className={
                  active ? 'ds-rail__item ds-rail__item--active' : 'ds-rail__item ds-hoverable'
                }
                aria-pressed={active}
                onClick={() => onSwitch(r)}
              >
                <span className="ds-rail__name">{r.name.zh}</span>
                <span className="ds-rail__meta">
                  {Math.round(routineDuration(r) / 60)} 分钟 · {r.exerciseIds.length} 个动作
                </span>
              </button>
            </Tooltip>
          )
        })}
      </div>
    </section>
  )
}
