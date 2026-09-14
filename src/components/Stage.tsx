import { useEffect, useRef, useState } from 'react'
import { FIGURE_VIEW, MIRROR_CX, jointPoints } from '../domain/figures'
import type { Exercise, Pose, PositionKind } from '../domain/types'
import type { Phase, Side } from '../session/reducer'
import { Figure } from './Figure'
import { MuscleMap } from './MuscleMap'
import { Controls } from './Controls'

const POSITION_ZH: Record<PositionKind, string> = {
  seated: '坐姿',
  standing: '站姿',
  kneeling: '跪姿',
  supine: '仰卧',
}

interface StageProps {
  routineName: string
  exercise: Exercise
  /** 第几个动作（0 起）与总数 */
  index: number
  total: number
  side: Side
  phase: Phase
  restKind: 'side' | 'next' | null
  secondsLeft: number
  progress: number
  onToggle: () => void
  onPrev: () => void
  onNext: () => void
}

/**
 * 编辑部式展开：左栏题注与衬线大标题，右侧小人与肌肉图板，
 * 下方发丝线之上是倒计时读数与控制。刻意不对称——
 * 居中的堆叠正是让页面读起来像模板的原因。
 */
export function Stage({
  routineName,
  exercise,
  index,
  total,
  side,
  phase,
  restKind,
  secondsLeft,
  progress,
  onToggle,
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

  const finished = phase === 'finished'
  const sideLabel = finished
    ? '完成 — 做得很好'
    : phase === 'resting'
      ? restKind === 'side'
        ? '换边…'
        : '下一个…'
      : exercise.sides === 'both'
        ? side === 'left'
          ? '左侧'
          : '右侧'
        : '双侧'

  const stageClass = ['ds-stage', phase === 'holding' ? 'ds-stage--active' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <section className="ds-spread">
      <header className="ds-spread__head">
        <p className="ds-eyebrow">
          {routineName} <span aria-hidden="true">·</span> {POSITION_ZH[exercise.position]}{' '}
          <span aria-hidden="true">·</span> 第 {index + 1} / {total} 个
        </p>
        <h1 className="ds-title">{exercise.name.zh}</h1>
        <p className="ds-target">{exercise.name.en}</p>
      </header>

      <div
        className="ds-spread__figure"
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
        <div
          className={stageClass}
          style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}
        >
          <svg
            viewBox={`0 0 ${FIGURE_VIEW.w} ${FIGURE_VIEW.h}`}
            role="img"
            aria-label={`${exercise.name.zh}动作示意，剩余 ${secondsLeft} 秒`}
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
            <g className="breathe">
              <Figure position={exercise.position} pose={exercise.pose.start} ghost />
              <Figure position={exercise.position} pose={pose} />
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
        </div>

        <figure className="ds-spread__maps">
          <MuscleMap
            muscles={exercise.muscles}
            progress={phase === 'holding' ? progress : 0}
            side={side}
          />
          <figcaption className="ds-caption">
            <span>前</span>
            <span>后</span>
          </figcaption>
        </figure>
      </div>

      <div className="ds-readout">
        <div className="ds-readout__count">
          <span className="ds-count">{finished ? '✓' : secondsLeft}</span>
          <span className="ds-count__unit">{finished ? 'done' : '秒'}</span>
        </div>

        <div className="ds-readout__meter">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="保持进度"
            className="ds-meter"
          >
            <div className="ds-meter__fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="ds-side">{sideLabel}</p>
        </div>

        <Controls phase={phase} onToggle={onToggle} onPrev={onPrev} onNext={onNext} />
      </div>
    </section>
  )
}
