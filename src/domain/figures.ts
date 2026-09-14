import type { Pose, PositionKind } from './types'

/**
 * 参数化小人骨架：侧面视图（面朝右）。
 * 角度约定：0°= 正上方，90°= 正前方（右），180°= 正下方，270°= 正后方（左）。
 * 所有角度为身体局部坐标系的绝对角度；Pose 中的增量叠加在中性角度上。
 */

export const FIGURE_VIEW = { w: 220, h: 240 }
export const MIRROR_CX = 110

export const SEG = {
  torso: 46,
  neck: 8,
  headR: 11,
  upperArm: 25,
  forearm: 22,
  thigh: 40,
  shank: 38,
} as const

export interface JointAngles {
  torso: number
  neck: number
  shoulderL: number
  elbowL: number
  shoulderR: number
  elbowR: number
  hipL: number
  kneeL: number
  hipR: number
  kneeR: number
}

interface NeutralConfig {
  hip: { x: number; y: number }
  rootRotate: number
  angles: JointAngles
  groundY: number
}

const NEUTRALS: Record<PositionKind, NeutralConfig> = {
  standing: {
    hip: { x: 96, y: 126 },
    rootRotate: 0,
    groundY: 206,
    angles: {
      torso: 0, neck: 0,
      shoulderL: 178, elbowL: 180, shoulderR: 182, elbowR: 180,
      hipL: 179, kneeL: 180, hipR: 181, kneeR: 180,
    },
  },
  seated: {
    hip: { x: 88, y: 132 },
    rootRotate: 0,
    groundY: 176,
    angles: {
      torso: 0, neck: 0,
      shoulderL: 178, elbowL: 180, shoulderR: 182, elbowR: 180,
      hipL: 88, kneeL: 180, hipR: 92, kneeR: 180,
    },
  },
  kneeling: {
    hip: { x: 96, y: 122 },
    rootRotate: 0,
    groundY: 166,
    angles: {
      torso: 0, neck: 0,
      shoulderL: 178, elbowL: 180, shoulderR: 182, elbowR: 180,
      hipL: 182, kneeL: 272, hipR: 178, kneeR: 268,
    },
  },
  supine: {
    hip: { x: 110, y: 176 },
    rootRotate: -90,
    groundY: 190,
    angles: {
      torso: 0, neck: 0,
      shoulderL: 178, elbowL: 180, shoulderR: 182, elbowR: 180,
      hipL: 179, kneeL: 180, hipR: 181, kneeR: 180,
    },
  },
}

export function neutralConfig(position: PositionKind): NeutralConfig {
  return NEUTRALS[position]
}

/** 合并中性角度与 Pose 增量，得到绝对角度 */
export function resolveAngles(position: PositionKind, pose: Pose): JointAngles {
  const n = NEUTRALS[position].angles
  return {
    torso: n.torso + (pose.torso ?? 0),
    neck: n.neck + (pose.neck ?? 0),
    shoulderL: n.shoulderL + (pose.armL?.shoulder ?? 0),
    elbowL: n.elbowL + (pose.armL?.elbow ?? 0),
    shoulderR: n.shoulderR + (pose.armR?.shoulder ?? 0),
    elbowR: n.elbowR + (pose.armR?.elbow ?? 0),
    hipL: n.hipL + (pose.legL?.hip ?? 0),
    kneeL: n.kneeL + (pose.legL?.knee ?? 0),
    hipR: n.hipR + (pose.legR?.hip ?? 0),
    kneeR: n.kneeR + (pose.legR?.knee ?? 0),
  }
}

function vec(angleDeg: number, len: number): { x: number; y: number } {
  const r = (angleDeg * Math.PI) / 180
  return { x: len * Math.sin(r), y: -len * Math.cos(r) }
}

export type JointMap = Record<string, { x: number; y: number }>

/** 计算全部关节的 SVG 世界坐标（含 root 旋转，未镜像），供箭头锚定使用 */
export function jointPoints(position: PositionKind, pose: Pose): JointMap {
  const cfg = NEUTRALS[position]
  const a = resolveAngles(position, pose)
  const root = cfg.rootRotate
  const at = (from: { x: number; y: number }, ang: number, len: number) => {
    const d = vec(ang + root, len)
    return { x: from.x + d.x, y: from.y + d.y }
  }
  const hip = cfg.hip
  const neckBase = at(hip, a.torso, SEG.torso)
  const head = at(neckBase, a.neck, SEG.neck + SEG.headR - 2)
  const shoulderL = at(hip, a.torso, SEG.torso * 0.93)
  const elbowL = at(shoulderL, a.shoulderL, SEG.upperArm)
  const handL = at(elbowL, a.elbowL, SEG.forearm)
  const shoulderR = at(hip, a.torso, SEG.torso * 0.9)
  const elbowR = at(shoulderR, a.shoulderR, SEG.upperArm)
  const handR = at(elbowR, a.elbowR, SEG.forearm)
  const kneeL = at(hip, a.hipL, SEG.thigh)
  const footL = at(kneeL, a.kneeL, SEG.shank)
  const kneeR = at(hip, a.hipR, SEG.thigh)
  const footR = at(kneeR, a.kneeR, SEG.shank)
  return {
    head, neck: neckBase, torso: at(hip, a.torso, SEG.torso / 2), hip,
    shoulderL, elbowL, handL, shoulderR, elbowR, handR,
    kneeL, footL, kneeR, footR,
  }
}
