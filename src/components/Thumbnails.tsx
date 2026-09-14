import { FIGURE_VIEW } from '../domain/figures'
import type { Routine } from '../domain/types'
import { getExercise } from '../domain/routines'
import { Figure } from './Figure'
import { Icon, CHECK_PATH } from './Icon'
import { Tooltip } from './Tooltip'

interface ThumbnailsProps {
  routine: Routine
  current: number
  done: string[]
  onJump: (index: number) => void
}

/** 动作序列缩略图带，同时承担今日进度展示 */
export function Thumbnails({ routine, current, done, onJump }: ThumbnailsProps) {
  return (
    <nav aria-label="动作序列">
      <ol className="ds-thumbs">
        {routine.exerciseIds.map((id, i) => {
          const ex = getExercise(id)
          const complete =
            ex.sides === 'both'
              ? done.includes(`${i}:left`) && done.includes(`${i}:right`)
              : done.includes(`${i}:none`)
          const active = i === current
          return (
            <li key={id}>
              <Tooltip
                label={
                  <>
                    <strong style={{ fontWeight: 600 }}>{ex.name.zh}</strong>
                    <br />
                    {ex.name.en} <span aria-hidden="true">·</span>{' '}
                    {complete ? '今日已完成' : `第 ${i + 1} / ${routine.exerciseIds.length} 个`}
                  </>
                }
              >
                <button
                  onClick={() => onJump(i)}
                  aria-label={`${ex.name.zh}${complete ? ' — 已完成' : ''}`}
                  aria-current={active ? 'step' : undefined}
                  className={`ds-thumb${active ? ' ds-thumb--active' : ''}`}
                >
                  <svg
                    viewBox={`0 0 ${FIGURE_VIEW.w} ${FIGURE_VIEW.h}`}
                    aria-hidden="true"
                  >
                    <Figure position={ex.position} pose={ex.pose.end} />
                  </svg>
                  {complete && (
                    <span className="ds-thumb__check">
                      <Icon size={9} stroke="var(--c-onaccent)" strokeWidth={3.6}>
                        <path d={CHECK_PATH} />
                      </Icon>
                    </span>
                  )}
                </button>
              </Tooltip>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
