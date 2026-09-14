import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { FIGURE_VIEW, MIRROR_CX, jointPoints } from '../domain/figures'
import type { Exercise, Pose } from '../domain/types'
import type { SessionStatus, Side } from '../session/reducer'
import { Figure } from './Figure'

const RING_R = 30
const RING_C = 2 * Math.PI * RING_R

interface StageProps {
  exercise: Exercise
  side: Side
  status: SessionStatus
  secondsLeft: number
  progress: number
  onRestart: () => void
  onPrev: () => void
  onNext: () => void
}

export function Stage({
  exercise,
  side,
  status,
  secondsLeft,
  progress,
  onRestart,
  onPrev,
  onNext,
}: StageProps) {
  const mirrored = side === 'right'
  const [pose, setPose] = useState<Pose>(exercise.pose.start)
  const touchX = useRef<number | null>(null)

  // 段切换：先定格起始姿势，下一帧过渡到结束姿势（触发 CSS transition）
  useEffect(() => {
    setPose(exercise.pose.start)
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPose(exercise.pose.end))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [exercise, side])

  const joints = jointPoints(exercise.position, exercise.pose.end)
  const px = (x: number) => (mirrored ? 2 * MIRROR_CX - x : x)

  return (
    <div
      className="stage card"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) < 56) return
        if (dx < 0) onNext()
        else onPrev()
      }}
    >
      <div className="stage-title">
        <div className="stage-names">
          <h2>{exercise.name.zh}</h2>
          <p>{exercise.name.en}</p>
        </div>
        {side !== 'none' && (
          <span key={side} className="side-badge">
            {side === 'left' ? '左侧' : '右侧'}
          </span>
        )}
      </div>

      <div className="stage-canvas">
        <svg
          viewBox={`0 0 ${FIGURE_VIEW.w} ${FIGURE_VIEW.h}`}
          className="stage-svg"
          role="img"
          aria-label={`${exercise.name.zh}动作示意`}
        >
          <defs>
            <marker
              id="arrowhead"
              markerUnits="userSpaceOnUse"
              markerWidth="10"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path d="M 0 0 L 9 4.5 L 0 9 Z" className="arrowhead" />
            </marker>
          </defs>
          <g transform={mirrored ? `translate(${2 * MIRROR_CX} 0) scale(-1 1)` : undefined}>
            <g className="breathe">
              <Figure position={exercise.position} pose={exercise.pose.start} ghost />
              <Figure position={exercise.position} pose={pose} />
            </g>
          </g>
          <g className="arrows">
            {exercise.arrows.map((ar, i) => {
              const j = joints[ar.anchor] ?? joints.torso
              const x1 = px(j.x)
              const y1 = j.y
              const dx = mirrored ? -ar.dx : ar.dx
              return (
                <g key={i} className="arrow">
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x1 + dx}
                    y2={y1 + ar.dy}
                    markerEnd="url(#arrowhead)"
                  />
                  {ar.label && (
                    <text x={x1 + dx + 4} y={y1 + ar.dy - 4} className="arrow-label">
                      {ar.label}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        <div className="ring" role="timer" aria-label={`剩余 ${secondsLeft} 秒`}>
          <svg viewBox="0 0 72 72">
            <circle cx={36} cy={36} r={RING_R} className="ring-track" />
            <circle
              cx={36}
              cy={36}
              r={RING_R}
              className="ring-fill"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
            />
          </svg>
          <span className="ring-seconds">{status === 'done' ? '✓' : secondsLeft}</span>
        </div>
      </div>

      {status === 'done' && (
        <div className="stage-done">
          <span className="done-check" aria-hidden>
            <Check size={30} />
          </span>
          <h2>完成！</h2>
          <p>整套拉伸已结束，身体应该轻松一些了。</p>
          <button className="btn-primary" onClick={onRestart}>
            <RotateCcw size={16} /> 再来一次
          </button>
        </div>
      )}
    </div>
  )
}
