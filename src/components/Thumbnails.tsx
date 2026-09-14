import { Check } from 'lucide-react'
import type { Routine } from '../domain/types'
import { getExercise } from '../domain/routines'

interface ThumbnailsProps {
  routine: Routine
  current: number
  done: string[]
  onJump: (index: number) => void
}

export function Thumbnails({ routine, current, done, onJump }: ThumbnailsProps) {
  return (
    <ol className="thumbnails" aria-label="动作列表">
      {routine.exerciseIds.map((id, i) => {
        const ex = getExercise(id)
        const finished =
          ex.sides === 'both'
            ? done.includes(`${i}:left`) && done.includes(`${i}:right`)
            : done.includes(`${i}:none`)
        const cls = finished ? 'thumb done' : i === current ? 'thumb current' : 'thumb pending'
        return (
          <li key={id}>
            <button
              className={cls}
              onClick={() => onJump(i)}
              aria-current={i === current ? 'step' : undefined}
              aria-label={`${i + 1}. ${ex.name.zh}${finished ? '（已完成）' : ''}`}
            >
              {finished ? <Check size={14} /> : i + 1}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
