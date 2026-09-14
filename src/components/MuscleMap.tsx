import { useEffect, useMemo, useRef, useState } from 'react'
import { BodyChart, INTENSITY_COLORS, ViewSide, type BodyState } from 'body-muscles'
import type { MuscleLoad } from '../domain/types'
import { MUSCLE_ZH } from '../domain/muscles'

// 先捕获库的强度 0 底色（用于渲染后重绘无负荷肌肉），再覆盖强度色板
const IDLE_FILL = INTENSITY_COLORS[0]

// 珊瑚 → 深红渐进（仅覆盖 1-10，保留 [0] 供重绘判断）
const CORAL_SCALE = [
  '#f4c8b8', '#f2b3a0', '#efa08a', '#ec8a70', '#e9765a',
  '#e76f51', '#d95f41', '#c74f33', '#a83e26', '#7f2d1b',
]
Object.assign(INTENSITY_COLORS, Object.fromEntries(CORAL_SCALE.map((c, i) => [i + 1, c])))

/** 张力随保持进度爬升：起步即过半（便于看清目标肌群），近半程到峰 */
function ramp(intensity: number, progress: number): number {
  const factor = 0.55 + 0.45 * Math.min(1, Math.max(0, progress) / 0.45)
  return Math.max(1, Math.min(10, Math.round(intensity * factor)))
}

function toBodyState(muscles: MuscleLoad[], progress: number): BodyState {
  const state: BodyState = {}
  for (const m of muscles) {
    state[m.id] = { intensity: ramp(m.intensity, progress), selected: false }
  }
  return state
}

/** 按当前保持侧过滤：仅保留该侧与中央肌群（nape/spine 等无侧别后缀） */
function filterBySide(muscles: MuscleLoad[], side?: 'left' | 'right' | 'none'): MuscleLoad[] {
  if (side !== 'left' && side !== 'right') return muscles
  return muscles.filter((m) => {
    if (m.id.endsWith('-left')) return side === 'left'
    if (m.id.endsWith('-right')) return side === 'right'
    return true
  })
}

interface ChartProps {
  muscles: MuscleLoad[]
  progress: number
  view: ViewSide
  onHover: (id: string | null) => void
}

/** 单个解剖视图。BodyChart 自持 DOM，创建一次后原地更新。 */
function Chart({ muscles, progress, view, onHover }: ChartProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<BodyChart | null>(null)
  const hoverRef = useRef(onHover)
  hoverRef.current = onHover

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const chart = new BodyChart(host, {
      view,
      bodyState: {},
      onMuscleHover: (id) => hoverRef.current(id),
      onMuscleClick: (id) => hoverRef.current(id),
    })
    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
  }, [view])

  const bodyState = useMemo(() => toBodyState(muscles, progress), [muscles, progress])

  useEffect(() => {
    chartRef.current?.update({ bodyState })
    // 库给无负荷肌肉硬编码了蓝灰色，与主题冲突；仅重绘这些路径，
    // 带负荷的保留热力色。
    const host = hostRef.current
    if (!host) return
    for (const path of host.querySelectorAll<SVGPathElement>('path')) {
      if (path.getAttribute('fill') === IDLE_FILL) {
        path.setAttribute('fill', 'var(--c-sunk)')
        path.setAttribute('stroke', 'var(--c-line2)')
        path.setAttribute('stroke-width', '0.25')
      }
    }
  }, [bodyState])

  return <div ref={hostRef} className="ds-map" />
}

interface MuscleMapProps {
  muscles: MuscleLoad[]
  /** 保持进度 0-1，驱动强度渐进点亮 */
  progress: number
  /** 传入 left/right 时仅点亮该侧肌肉；缺省显示完整双侧 */
  side?: 'left' | 'right' | 'none'
}

/** 前/后双视图的肌肉图板 */
export function MuscleMap({ muscles, progress, side }: MuscleMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const visible = useMemo(() => filterBySide(muscles, side), [muscles, side])
  const caption =
    hovered != null
      ? (MUSCLE_ZH[hovered] ?? hovered)
      : side === 'left' || side === 'right'
        ? `当前保持：${side === 'left' ? '左侧' : '右侧'} · 颜色越深负荷越大`
        : '颜色越深，负荷越大'
  return (
    <div>
      <div className="ds-map-pair">
        <Chart muscles={visible} progress={progress} view={ViewSide.FRONT} onHover={setHovered} />
        <Chart muscles={visible} progress={progress} view={ViewSide.BACK} onHover={setHovered} />
      </div>
      <p className="ds-map-caption" aria-live="polite">
        {caption}
      </p>
    </div>
  )
}
