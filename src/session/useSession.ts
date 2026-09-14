import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Exercise, Routine } from '../domain/types'
import { getExercise } from '../domain/routines'
import { initSession, sessionReducer, type SessionState } from './reducer'
import { startClock } from './timer'
import { playChime, playFanfare, playSwitchSide, playTick } from '../lib/audio'
import { loadTodayProgress, saveTodayProgress, todayStr } from '../lib/storage'

export interface SessionApi {
  state: SessionState
  exercise: Exercise
  /** 当前段剩余秒（向上取整显示） */
  secondsLeft: number
  /** 当前段进度 0-1 */
  progress: number
  /** 整套方案进度 0-1（按段数计） */
  totalProgress: number
  isRunning: boolean
  start: () => void
  pause: () => void
  resume: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  jump: (index: number) => void
  setRoutine: (routine: Routine) => void
}

export function totalSegments(routine: Routine): number {
  return routine.exerciseIds.reduce(
    (n, id) => n + (getExercise(id).sides === 'both' ? 2 : 1),
    0,
  )
}

export function useSession(routine: Routine): SessionApi {
  const [state, dispatch] = useReducer(sessionReducer, routine, initSession)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const stateRef = useRef(state)
  stateRef.current = state

  // 恢复当日进度
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const p = loadTodayProgress(routine.id)
    if (p && p.doneSegments.length > 0 && !p.finished) {
      dispatch({ type: 'jump', index: 0 })
      // 恢复已完成段，从第一个未完成段暂停等待
      const firstUndone = routine.exerciseIds.findIndex((id, i) => {
        const ex = getExercise(id)
        if (ex.sides === 'both') {
          return !p.doneSegments.includes(`${i}:left`) || !p.doneSegments.includes(`${i}:right`)
        }
        return !p.doneSegments.includes(`${i}:none`)
      })
      if (firstUndone > 0) dispatch({ type: 'jump', index: firstUndone })
    }
  }, [routine])

  // 墙上时钟 tick：到期推进、半程提示
  useEffect(() => {
    return startClock(() => {
      const s = stateRef.current
      const now = Date.now()
      setNowMs(now)
      if (s.status !== 'holding' || s.endsAt == null) return
      const remaining = s.endsAt - now
      if (remaining <= 0) {
        const ex = getExercise(s.routine.exerciseIds[s.index])
        const willSwitch = ex.sides === 'both' && s.side === 'left'
        const isLast = s.index >= s.routine.exerciseIds.length - 1
        dispatch({ type: 'advance' })
        if (willSwitch) playSwitchSide()
        else if (!willSwitch && isLast) playFanfare()
        else playChime()
      } else if (!s.halfPlayed && remaining <= s.remainingMs / 2 + 150) {
        dispatch({ type: 'halfPlayed' })
        playTick()
      }
    })
  }, [])

  // 段完成提示音（手动跳过时）
  const prevStatusRef = useRef(state.status)
  useEffect(() => {
    if (prevStatusRef.current !== 'done' && state.status === 'done') playFanfare()
    prevStatusRef.current = state.status
  }, [state.status])

  // 持久化当日进度
  useEffect(() => {
    if (state.done.length === 0) return
    saveTodayProgress({
      date: todayStr(),
      routineId: state.routine.id,
      doneSegments: state.done,
      finished: state.status === 'done',
    })
  }, [state.done, state.status, state.routine.id])

  const exercise = getExercise(state.routine.exerciseIds[state.index])
  const segmentTotalMs = exercise.duration * 1000
  const remainingMs =
    state.status === 'holding' && state.endsAt != null
      ? Math.max(0, state.endsAt - nowMs)
      : state.remainingMs

  const total = totalSegments(state.routine)

  const api: SessionApi = {
    state,
    exercise,
    secondsLeft: Math.ceil(remainingMs / 1000),
    progress: Math.min(1, Math.max(0, 1 - remainingMs / segmentTotalMs)),
    totalProgress: Math.min(1, state.done.length / total),
    isRunning: state.status === 'holding',
    start: useCallback(() => dispatch({ type: 'start' }), []),
    pause: useCallback(() => dispatch({ type: 'pause' }), []),
    resume: useCallback(() => dispatch({ type: 'resume' }), []),
    toggle: useCallback(() => {
      const s = stateRef.current
      dispatch({ type: s.status === 'holding' ? 'pause' : s.status === 'paused' ? 'resume' : 'start' })
    }, []),
    next: useCallback(() => dispatch({ type: 'next' }), []),
    prev: useCallback(() => dispatch({ type: 'prev' }), []),
    jump: useCallback((index: number) => dispatch({ type: 'jump', index }), []),
    setRoutine: useCallback((routine: Routine) => dispatch({ type: 'setRoutine', routine }), []),
  }
  return api
}
