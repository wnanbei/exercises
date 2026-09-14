import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Exercise, Routine } from '../domain/types'
import { getExercise } from '../domain/routines'
import {
  initSession,
  sessionReducer,
  segmentMs,
  NEXT_REST_MS,
  SIDE_REST_MS,
  type SessionState,
} from './reducer'
import { startClock } from './timer'
import {
  playBeginCue,
  playEndingSoon,
  playFanfare,
  playSwitchSide,
  startMusic,
  stopMusic,
  unlockAudio,
} from '../lib/audio'
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
  /** 总段数（双侧动作计两段） */
  totalSegments: number
  isRunning: boolean
  toggle: () => void
  next: () => void
  prev: () => void
  goto: (index: number) => void
  restart: () => void
  resetProgress: () => void
}

export function totalSegments(routine: Routine): number {
  return routine.exerciseIds.reduce(
    (n, id) => n + (getExercise(id).sides === 'both' ? 2 : 1),
    0,
  )
}

export function useSession(routine: Routine, muted: boolean): SessionApi {
  const [state, dispatch] = useReducer(sessionReducer, routine, initSession)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const stateRef = useRef(state)
  stateRef.current = state

  // 恢复当日进度：跳到第一个未完成段，等待开始
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const p = loadTodayProgress(routine.id)
    if (!p || p.doneSegments.length === 0 || p.finished) return
    const firstUndone = routine.exerciseIds.findIndex((id, i) => {
      const ex = getExercise(id)
      if (ex.sides === 'both') {
        return !p.doneSegments.includes(`${i}:left`) || !p.doneSegments.includes(`${i}:right`)
      }
      return !p.doneSegments.includes(`${i}:none`)
    })
    if (firstUndone > 0) dispatch({ type: 'goto', index: firstUndone, now: Date.now() })
  }, [routine])

  // 墙上时钟 tick：保持中到期推进、半程提示；后台标签页恢复不漂移
  useEffect(() => {
    return startClock(() => {
      const s = stateRef.current
      const now = Date.now()
      setNowMs(now)
      if (s.phase !== 'holding' || s.endsAt == null) return
      const remaining = s.endsAt - now
      if (remaining <= 0) {
        const isLast = s.index >= s.routine.exerciseIds.length - 1
        dispatch({ type: 'expire', now })
        // 段结束保持安静（开始提示音紧随后），仅整套完成时庆祝
        if (isLast) playFanfare()
      } else if (!s.endingSoonFired && remaining <= 5000) {
        dispatch({ type: 'endingSoonFired' })
        playEndingSoon()
      }
    })
  }, [])

  // 段间隙：到点自动开始下一段（点击播放后全程无需再动手）
  useEffect(() => {
    if (state.phase !== 'resting') return
    const gap = state.restKind === 'side' ? SIDE_REST_MS : NEXT_REST_MS
    const id = window.setTimeout(() => {
      dispatch({ type: 'restElapsed', now: Date.now() })
      // 新保持开始提示音：换边与换动作使用不同音色
      if (state.restKind === 'side') playSwitchSide()
      else playBeginCue()
    }, gap)
    return () => window.clearTimeout(id)
  }, [state.phase, state.restKind, state.index, state.side])

  // 背景音乐：保持与间隙期间持续，暂停/完成/静音/卸载时淡出
  const musicOn = (state.phase === 'holding' || state.phase === 'resting') && !muted
  useEffect(() => {
    if (musicOn) startMusic()
    else stopMusic()
  }, [musicOn])
  useEffect(() => () => stopMusic(), [])

  // 持久化当日进度
  useEffect(() => {
    if (state.done.length === 0) return
    saveTodayProgress({
      date: todayStr(),
      routineId: state.routine.id,
      doneSegments: state.done,
      finished: state.phase === 'finished',
    })
  }, [state.done, state.phase, state.routine.id])

  const exercise = getExercise(state.routine.exerciseIds[state.index])
  const total = segmentMs(state.routine, state.index)
  // 钳制到 [0, total]：开始/恢复/间隙结束时 nowMs 尚未随 tick 刷新，
  // 滞后会让剩余值短暂超出总时长（秒数闪现 31）
  const remainingMs =
    state.phase === 'holding' && state.endsAt != null
      ? Math.min(total, Math.max(0, state.endsAt - nowMs))
      : state.remaining

  const toggle = useCallback(() => {
    unlockAudio() // 必须在用户手势内调用，后续提示音与音乐才有声
    const now = Date.now()
    const phase = stateRef.current.phase
    if (phase === 'holding') dispatch({ type: 'pause', now })
    else if (phase === 'paused') dispatch({ type: 'resume', now })
    else if (phase === 'idle') {
      dispatch({ type: 'start', now })
      playBeginCue()
    } else if (phase === 'finished') {
      // 再练一遍：回到第一个动作并立即播放
      dispatch({ type: 'goto', index: 0, now })
      dispatch({ type: 'start', now })
      playBeginCue()
    }
    // resting 间隙极短，不响应
  }, [])

  const goto = useCallback(
    (index: number) => dispatch({ type: 'goto', index, now: Date.now() }),
    [],
  )
  const next = useCallback(() => goto(stateRef.current.index + 1), [goto])
  const prev = useCallback(() => goto(stateRef.current.index - 1), [goto])
  const restart = useCallback(() => {
    unlockAudio()
    dispatch({ type: 'goto', index: 0, now: Date.now() })
  }, [])
  const resetProgress = useCallback(() => dispatch({ type: 'resetProgress' }), [])

  return {
    state,
    exercise,
    secondsLeft: Math.ceil(remainingMs / 1000),
    progress: Math.min(1, Math.max(0, 1 - remainingMs / total)),
    totalProgress: Math.min(1, state.done.length / totalSegments(routine)),
    totalSegments: totalSegments(routine),
    isRunning: state.phase === 'holding' || state.phase === 'resting',
    toggle,
    next,
    prev,
    goto,
    restart,
    resetProgress,
  }
}
