import { ArrowRight, CheckCircle2, Clock, History, ListOrdered } from 'lucide-react'
import type { Routine } from '../domain/types'
import { ROUTINES, routineDuration } from '../domain/routines'

interface RoutinePickerProps {
  lastRoutineId: string | null
  todayFinished: boolean
  onSelect: (routine: Routine) => void
}

function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} 分钟`
}

export function RoutinePicker({ lastRoutineId, todayFinished, onSelect }: RoutinePickerProps) {
  const last = lastRoutineId ? ROUTINES.find((r) => r.id === lastRoutineId) : undefined

  return (
    <div className="picker">
      <div className="picker-hero">
        <h1>每日拉伸</h1>
        <p className="picker-sub">Stretch Daily · 选择一套方案，开始今天的放松</p>
      </div>

      {last && (
        <div className="last-routine">
          <History size={16} aria-hidden />
          <span>
            上次：<strong>{last.name.zh}</strong>
            {todayFinished && (
              <em className="last-done">
                <CheckCircle2 size={14} /> 今日已完成
              </em>
            )}
          </span>
          <button className="btn-text" onClick={() => onSelect(last)}>
            继续上次 <ArrowRight size={14} />
          </button>
        </div>
      )}

      <div className="routine-grid">
        {ROUTINES.map((r) => (
          <button key={r.id} className="routine-card" onClick={() => onSelect(r)}>
            <div className="routine-card-head">
              <h2>{r.name.zh}</h2>
              <p className="routine-en">{r.name.en}</p>
            </div>
            <span className="routine-scene">{r.scene.zh}</span>
            <p className="routine-desc">{r.description}</p>
            <div className="routine-meta">
              <span>
                <Clock size={14} aria-hidden /> {formatMinutes(routineDuration(r))}
              </span>
              <span>
                <ListOrdered size={14} aria-hidden /> {r.exerciseIds.length} 个动作
              </span>
            </div>
          </button>
        ))}
      </div>

      <footer className="picker-footer">
        <p>本应用不构成医疗建议。如感到疼痛，请立即停止并咨询专业人士。</p>
        <p>
          <a href="https://github.com/anubhavitis/stretch-daily" target="_blank" rel="noreferrer">
            灵感来源 stretch-daily
          </a>
        </p>
      </footer>
    </div>
  )
}
