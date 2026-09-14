export interface LocalizedText {
  zh: string
  en: string
}

export type PositionKind = 'seated' | 'standing' | 'kneeling' | 'supine'

/** 关节角度增量(度)，相对基础姿态的中性角度，缺省为 0 */
export interface Pose {
  torso?: number
  neck?: number
  armL?: { shoulder?: number; elbow?: number }
  armR?: { shoulder?: number; elbow?: number }
  legL?: { hip?: number; knee?: number }
  legR?: { hip?: number; knee?: number }
}

/** 方向箭头：锚定关节名 + 方向向量（SVG 坐标，x 右 / y 下），渲染时换算 */
export interface ArrowSpec {
  anchor: string
  dx: number
  dy: number
  label?: string
}

/** id 为 body-muscles 肌群标识，intensity 0-10 */
export interface MuscleLoad {
  id: string
  intensity: number
}

export interface Exercise {
  id: string
  name: LocalizedText
  position: PositionKind
  sides: 'none' | 'both'
  duration: number
  instruction: { setup: string; action: string; feel: string }
  muscles: MuscleLoad[]
  pose: { start: Pose; end: Pose }
  arrows: ArrowSpec[]
}

export interface Routine {
  id: string
  name: LocalizedText
  scene: LocalizedText
  description: string
  exerciseIds: string[]
}
