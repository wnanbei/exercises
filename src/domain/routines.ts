import type { Exercise, Routine } from './types'
import neckData from '../data/exercises/neck.json'
import shoulderData from '../data/exercises/shoulders.json'
import torsoData from '../data/exercises/torso.json'
import lowerBodyData from '../data/exercises/lowerBody.json'
import routinesData from '../data/routines.json'

/** 全部动作（数据见 src/data/exercises/*.json） */
export const EXERCISES: Exercise[] = [
  ...(neckData as Exercise[]),
  ...(shoulderData as Exercise[]),
  ...(torsoData as Exercise[]),
  ...(lowerBodyData as Exercise[]),
]

const byId = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id: string): Exercise {
  const ex = byId.get(id)
  if (!ex) throw new Error(`unknown exercise: ${id}`)
  return ex
}

/** 全部方案（数据见 src/data/routines.json） */
export const ROUTINES: Routine[] = routinesData as Routine[]

export function getRoutine(id: string): Routine {
  const r = ROUTINES.find((r) => r.id === id)
  if (!r) throw new Error(`unknown routine: ${id}`)
  return r
}

/** 方案总时长（秒，双侧动作计两遍） */
export function routineDuration(r: Routine): number {
  return r.exerciseIds.reduce((sum, id) => {
    const ex = getExercise(id)
    return sum + ex.duration * (ex.sides === 'both' ? 2 : 1)
  }, 0)
}
