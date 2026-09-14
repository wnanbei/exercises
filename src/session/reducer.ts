import type { Routine } from '../domain/types'
import { getExercise } from '../domain/routines'

export type Side = 'left' | 'right' | 'none'

/**
 * `idle`     — 未开始；remaining 为当前段完整时长
 * `holding`  — 倒计时中，以墙上时钟 endsAt 为准
 * `paused`   — 保持中途暂停；remaining 为冻结的剩余毫秒
 * `resting`  — 两段之间的短暂间隙，结束后自动开始下一段
 * `finished` — 方案最后一个动作完成
 */
export type Phase = 'idle' | 'holding' | 'paused' | 'resting' | 'finished'

export interface SessionState {
  routine: Routine
  index: number
  side: Side
  phase: Phase
  /** 当前段剩余毫秒（holding 时以 endsAt 重算） */
  remaining: number
  /** holding 期间的墙上时钟截止时间，其余为 null */
  endsAt: number | null
  /** 间隙类型：换边短一些，换动作略长 */
  restKind: 'side' | 'next' | null
  /** 已完成段 key：`${index}:${side}` */
  done: string[]
  /** 当前段倒数第 5 秒提示是否已播放 */
  endingSoonFired: boolean
}

export type SessionAction =
  | { type: 'start'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'endingSoonFired' }
  | { type: 'expire'; now: number }
  | { type: 'restElapsed'; now: number }
  | { type: 'goto'; index: number; now: number }
  | { type: 'resetProgress' }

/** 换边间隙 */
export const SIDE_REST_MS = 1600
/** 换动作间隙 */
export const NEXT_REST_MS = 1800

export function sideOf(routine: Routine, index: number): Side {
  return getExercise(routine.exerciseIds[index]).sides === 'both' ? 'left' : 'none'
}

export function segmentMs(routine: Routine, index: number): number {
  return getExercise(routine.exerciseIds[index]).duration * 1000
}

export function initSession(routine: Routine): SessionState {
  return {
    routine,
    index: 0,
    side: sideOf(routine, 0),
    phase: 'idle',
    remaining: segmentMs(routine, 0),
    endsAt: null,
    restKind: null,
    done: [],
    endingSoonFired: false,
  }
}

function beginHold(state: SessionState, now: number): SessionState {
  const ms = segmentMs(state.routine, state.index)
  return {
    ...state,
    phase: 'holding',
    remaining: ms,
    endsAt: now + ms,
    restKind: null,
    endingSoonFired: false,
  }
}

function markDone(state: SessionState): string[] {
  const key = `${state.index}:${state.side}`
  return state.done.includes(key) ? state.done : [...state.done, key]
}

export function sessionReducer(s: SessionState, a: SessionAction): SessionState {
  switch (a.type) {
    case 'start':
      if (s.phase !== 'idle') return s
      return beginHold(s, a.now)

    case 'pause': {
      if (s.phase !== 'holding' || s.endsAt === null) return s
      return {
        ...s,
        phase: 'paused',
        remaining: Math.max(0, s.endsAt - a.now),
        endsAt: null,
      }
    }

    case 'resume':
      return s.phase === 'paused'
        ? { ...s, phase: 'holding', endsAt: a.now + s.remaining }
        : s

    case 'tick': {
      if (s.phase !== 'holding' || s.endsAt === null) return s
      return { ...s, remaining: Math.max(0, s.endsAt - a.now) }
    }

    case 'endingSoonFired':
      return { ...s, endingSoonFired: true }

    case 'expire': {
      if (s.phase !== 'holding') return s
      const ex = getExercise(s.routine.exerciseIds[s.index])
      const done = markDone(s)

      // 双侧动作先做左侧，左侧到时后换右侧再计一次
      if (ex.sides === 'both' && s.side === 'left') {
        return {
          ...s,
          done,
          side: 'right',
          phase: 'resting',
          restKind: 'side',
          remaining: segmentMs(s.routine, s.index),
          endsAt: null,
          endingSoonFired: false,
        }
      }

      const isLast = s.index >= s.routine.exerciseIds.length - 1
      if (isLast) {
        return { ...s, done, phase: 'finished', remaining: 0, endsAt: null }
      }

      const next = s.index + 1
      return {
        ...s,
        done,
        index: next,
        side: sideOf(s.routine, next),
        phase: 'resting',
        restKind: 'next',
        remaining: segmentMs(s.routine, next),
        endsAt: null,
        endingSoonFired: false,
      }
    }

    case 'restElapsed':
      return s.phase === 'resting' ? beginHold(s, a.now) : s

    case 'goto': {
      const total = s.routine.exerciseIds.length
      const index = Math.min(Math.max(0, a.index), total - 1)
      const wasActive = s.phase === 'holding' || s.phase === 'resting'
      const next: SessionState = {
        ...s,
        index,
        side: sideOf(s.routine, index),
        phase: 'idle',
        remaining: segmentMs(s.routine, index),
        endsAt: null,
        restKind: null,
        endingSoonFired: false,
      }
      // 会话进行中跳转则保持推进； idle/paused/finished 时跳转后等待开始
      return wasActive ? beginHold(next, a.now) : next
    }

    case 'resetProgress':
      return {
        ...s,
        done: [],
        phase: s.phase === 'finished' ? 'idle' : s.phase,
        remaining:
          s.phase === 'finished' ? segmentMs(s.routine, s.index) : s.remaining,
      }

    default:
      return s
  }
}
