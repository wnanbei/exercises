import type { Routine } from '../domain/types'
import { getExercise } from '../domain/routines'

export type Side = 'left' | 'right' | 'none'
export type SessionStatus = 'idle' | 'holding' | 'paused' | 'done'

export interface SessionState {
  routine: Routine
  status: SessionStatus
  index: number
  side: Side
  /** 运行中：当前段的墙上时钟截止时间（epoch ms） */
  endsAt: number | null
  /** 暂停时冻结的剩余毫秒 */
  remainingMs: number
  /** 已完成段 key：`${index}:${side}` */
  done: string[]
  /** 当前段是否已播放半程提示 */
  halfPlayed: boolean
}

export type SessionAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'advance' } // 当前段到时：换边 / 下一动作 / 完成
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'jump'; index: number }
  | { type: 'setRoutine'; routine: Routine }
  | { type: 'halfPlayed' }

export function initSession(routine: Routine): SessionState {
  return {
    routine,
    status: 'idle',
    index: 0,
    side: sideOf(routine, 0),
    endsAt: null,
    remainingMs: segmentMs(routine, 0),
    done: [],
    halfPlayed: false,
  }
}

function sideOf(routine: Routine, index: number): Side {
  return getExercise(routine.exerciseIds[index]).sides === 'both' ? 'left' : 'none'
}

function segmentMs(routine: Routine, index: number): number {
  return getExercise(routine.exerciseIds[index]).duration * 1000
}

function startSegment(state: SessionState, index: number, side: Side, now: number): SessionState {
  const ms = segmentMs(state.routine, index)
  return {
    ...state,
    status: 'holding',
    index,
    side,
    endsAt: now + ms,
    remainingMs: ms,
    halfPlayed: false,
  }
}

function markDone(state: SessionState): string[] {
  const key = `${state.index}:${state.side}`
  return state.done.includes(key) ? state.done : [...state.done, key]
}

export function sessionReducer(s: SessionState, a: SessionAction): SessionState {
  const now = Date.now()
  switch (a.type) {
    case 'start':
      if (s.status === 'idle' || s.status === 'done') {
        const fresh = startSegment({ ...s, done: [], index: 0 }, 0, sideOf(s.routine, 0), now)
        return fresh
      }
      return s.status === 'paused'
        ? { ...s, status: 'holding', endsAt: now + s.remainingMs }
        : s

    case 'pause':
      if (s.status !== 'holding' || s.endsAt == null) return s
      return { ...s, status: 'paused', remainingMs: Math.max(0, s.endsAt - now), endsAt: null }

    case 'resume':
      return s.status === 'paused'
        ? { ...s, status: 'holding', endsAt: now + s.remainingMs }
        : s

    case 'advance': {
      if (s.status !== 'holding') return s
      const ex = getExercise(s.routine.exerciseIds[s.index])
      const done = markDone(s)
      if (ex.sides === 'both' && s.side === 'left') {
        return { ...startSegment({ ...s, done }, s.index, 'right', now) }
      }
      if (s.index < s.routine.exerciseIds.length - 1) {
        const next = s.index + 1
        return startSegment({ ...s, done }, next, sideOf(s.routine, next), now)
      }
      return { ...s, done, status: 'done', endsAt: null, remainingMs: 0 }
    }

    case 'next': {
      if (s.index >= s.routine.exerciseIds.length - 1) {
        return { ...s, done: markDone(s), status: 'done', endsAt: null, remainingMs: 0 }
      }
      const next = s.index + 1
      const base = { ...s, done: s.status === 'holding' ? markDone(s) : s.done }
      if (s.status === 'paused' || s.status === 'idle') {
        return {
          ...base,
          index: next,
          side: sideOf(s.routine, next),
          remainingMs: segmentMs(s.routine, next),
          halfPlayed: false,
          status: 'paused',
        }
      }
      return startSegment(base, next, sideOf(s.routine, next), now)
    }

    case 'prev': {
      const prevIdx = Math.max(0, s.index - 1)
      if (s.status === 'paused' || s.status === 'idle') {
        return {
          ...s,
          index: prevIdx,
          side: sideOf(s.routine, prevIdx),
          remainingMs: segmentMs(s.routine, prevIdx),
          halfPlayed: false,
          status: 'paused',
        }
      }
      return startSegment(s, prevIdx, sideOf(s.routine, prevIdx), now)
    }

    case 'jump': {
      const idx = Math.min(Math.max(0, a.index), s.routine.exerciseIds.length - 1)
      const status = s.status === 'idle' || s.status === 'done' ? 'paused' : s.status
      if (status === 'paused') {
        return {
          ...s,
          index: idx,
          side: sideOf(s.routine, idx),
          remainingMs: segmentMs(s.routine, idx),
          halfPlayed: false,
          status: 'paused',
        }
      }
      return startSegment(s, idx, sideOf(s.routine, idx), now)
    }

    case 'setRoutine':
      return initSession(a.routine)

    case 'halfPlayed':
      return { ...s, halfPlayed: true }

    default:
      return s
  }
}
