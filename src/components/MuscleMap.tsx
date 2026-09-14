import { useEffect, useMemo, useRef, useState } from 'react'
import { BodyChart, INTENSITY_COLORS, ViewSide, type BodyState } from 'body-muscles'
import type { MuscleLoad } from '../domain/types'
import { MUSCLE_ZH } from '../domain/muscles'

// 将点亮色板替换为设计规范的珊瑚→深红渐进（模块级一次性覆盖）
const CORAL_SCALE = [
  '#8a9a94', '#f4c8b8', '#f2b3a0', '#efa08a', '#ec8a70',
  '#e9765a', '#e76f51', '#d95f41', '#c74f33', '#a83e26',
  '#7f2d1b',
]
Object.assign(INTENSITY_COLORS, Object.fromEntries(CORAL_SCALE.map((c, i) => [i, c])))

interface MuscleMapProps {
  muscles: MuscleLoad[]
  /** 保持进度 0-1，驱动强度 30% → 100% 渐进点亮 */
  progress: number
}

export function MuscleMap({ muscles, progress }: MuscleMapProps) {
  const [view, setView] = useState<ViewSide>(ViewSide.FRONT)
  const [hovered, setHovered] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BodyChart | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = new BodyChart(containerRef.current, {
      view,
      bodyState: {},
      onMuscleHover: (id) => setHovered(id),
      onMuscleClick: (id) => setHovered(id),
    })
    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [view])

  const bodyState = useMemo<BodyState>(() => {
    const state: BodyState = {}
    const scale = 0.3 + 0.7 * progress
    for (const m of muscles) {
      state[m.id] = {
        intensity: Math.max(0, Math.min(10, Math.round(m.intensity * scale))),
        selected: false,
      }
    }
    return state
  }, [muscles, progress])

  useEffect(() => {
    chartRef.current?.update({ bodyState })
  }, [bodyState])

  return (
    <div className="muscle-map card">
      <div className="muscle-map-tabs" role="tablist" aria-label="视图切换">
        <button
          role="tab"
          aria-selected={view === ViewSide.FRONT}
          className={view === ViewSide.FRONT ? 'tab active' : 'tab'}
          onClick={() => setView(ViewSide.FRONT)}
        >
          前视图
        </button>
        <button
          role="tab"
          aria-selected={view === ViewSide.BACK}
          className={view === ViewSide.BACK ? 'tab active' : 'tab'}
          onClick={() => setView(ViewSide.BACK)}
        >
          后视图
        </button>
      </div>
      <div ref={containerRef} className="muscle-map-body" />
      <p className="muscle-map-caption" aria-live="polite">
        {hovered ? (MUSCLE_ZH[hovered] ?? hovered) : '悬停或点按肌群查看名称'}
      </p>
    </div>
  )
}
