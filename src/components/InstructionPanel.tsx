import { Activity, Footprints, Hand } from 'lucide-react'
import type { Exercise } from '../domain/types'
import { muscleLabel } from '../domain/muscles'

export function InstructionPanel({ exercise }: { exercise: Exercise }) {
  const chips = [...new Set(exercise.muscles.map((m) => muscleLabel(m.id)))]
  return (
    <div className="instruction card">
      <section className="instruction-row">
        <span className="instruction-icon" aria-hidden>
          <Footprints size={17} />
        </span>
        <div>
          <h3>准备姿势</h3>
          <p>{exercise.instruction.setup}</p>
        </div>
      </section>
      <section className="instruction-row">
        <span className="instruction-icon" aria-hidden>
          <Hand size={17} />
        </span>
        <div>
          <h3>动作要领</h3>
          <p>{exercise.instruction.action}</p>
        </div>
      </section>
      <section className="instruction-row">
        <span className="instruction-icon" aria-hidden>
          <Activity size={17} />
        </span>
        <div>
          <h3>应感受到</h3>
          <p>{exercise.instruction.feel}</p>
        </div>
      </section>
      <div className="muscle-chips" aria-label="目标肌群">
        {chips.map((c) => (
          <span key={c} className="chip">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}
