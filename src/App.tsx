import { useCallback, useEffect, useState } from 'react'
import type { Routine } from './domain/types'
import { ROUTINES, getRoutine } from './domain/routines'
import { useSession } from './session/useSession'
import { unlockAudio, setMuted as audioSetMuted, playChime } from './lib/audio'
import { loadPrefs, savePrefs, loadTodayProgress, type Prefs } from './lib/storage'
import { setReminder } from './lib/reminders'
import { RoutinePicker } from './components/RoutinePicker'
import { Header } from './components/Header'
import { Stage } from './components/Stage'
import { InstructionPanel } from './components/InstructionPanel'
import { MuscleMap } from './components/MuscleMap'
import { Thumbnails } from './components/Thumbnails'
import { Controls } from './components/Controls'

export default function App() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch }
      savePrefs(next)
      return next
    })
  }, [])

  // 主题应用
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', prefs.theme === 'dark' ? '#1A1815' : '#FAF8F4')
  }, [prefs.theme])

  // 静音同步 + 首次手势解锁音频
  useEffect(() => audioSetMuted(prefs.muted), [prefs.muted])
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // 定时提醒
  useEffect(() => {
    setReminder(prefs.reminderMin, () => {
      playChime()
      setToast('该起来拉伸一下了')
      window.setTimeout(() => setToast(null), 5000)
    })
    return () => setReminder(0, () => {})
  }, [prefs.reminderMin])

  const selectRoutine = useCallback(
    (r: Routine) => {
      updatePrefs({ lastRoutineId: r.id })
      setRoutine(r)
    },
    [updatePrefs],
  )

  const todayFinished = routine
    ? (loadTodayProgress(routine.id)?.finished ?? false)
    : prefs.lastRoutineId
      ? (loadTodayProgress(prefs.lastRoutineId)?.finished ?? false)
      : false

  return (
    <>
      <Header
        title={routine ? routine.name.zh : '每日拉伸 · Stretch Daily'}
        theme={prefs.theme}
        muted={prefs.muted}
        reminderMin={prefs.reminderMin}
        onBack={routine ? () => setRoutine(null) : undefined}
        onToggleTheme={() => updatePrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' })}
        onToggleMute={() => updatePrefs({ muted: !prefs.muted })}
        onReminderChange={(m) => updatePrefs({ reminderMin: m as Prefs['reminderMin'] })}
      />
      {routine ? (
        <SessionScreen key={routine.id} routine={routine} onSwitch={selectRoutine} />
      ) : (
        <main className="picker-main">
          <RoutinePicker
            lastRoutineId={prefs.lastRoutineId}
            todayFinished={todayFinished}
            onSelect={selectRoutine}
          />
        </main>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button className="btn-text" onClick={() => setRoutine(getRoutine(ROUTINES[0].id))}>
            开始拉伸
          </button>
        </div>
      )}
    </>
  )
}

function SessionScreen({
  routine,
  onSwitch,
}: {
  routine: Routine
  onSwitch: (r: Routine) => void
}) {
  const s = useSession(routine)

  // 键盘：空格开始/暂停，←/→ 切换
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        s.toggle()
      } else if (e.key === 'ArrowRight') s.next()
      else if (e.key === 'ArrowLeft') s.prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [s])

  const trySwitch = (r: Routine) => {
    if (s.state.done.length > 0 && s.state.status !== 'done') {
      if (!window.confirm('当前练习已有进度，切换方案将丢失进度，确定切换？')) return
    }
    onSwitch(r)
  }

  return (
    <main className="session">
      <div
        className="session-progress"
        role="progressbar"
        aria-valuenow={Math.round(s.totalProgress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="session-progress-fill" style={{ width: `${s.totalProgress * 100}%` }} />
      </div>
      <div className="session-main">
        <Stage
          exercise={s.exercise}
          side={s.state.side}
          status={s.state.status}
          secondsLeft={s.secondsLeft}
          progress={s.progress}
          onRestart={s.start}
          onPrev={s.prev}
          onNext={s.next}
        />
        <Thumbnails
          routine={routine}
          current={s.state.index}
          done={s.state.done}
          onJump={s.jump}
        />
        <RoutineSwitcher currentId={routine.id} onSwitch={trySwitch} />
      </div>
      <aside className="session-side">
        <InstructionPanel exercise={s.exercise} />
        <MuscleMap muscles={s.exercise.muscles} progress={s.progress} />
      </aside>
      <Controls status={s.state.status} onToggle={s.toggle} onPrev={s.prev} onNext={s.next} />
    </main>
  )
}

function RoutineSwitcher({
  currentId,
  onSwitch,
}: {
  currentId: string
  onSwitch: (r: Routine) => void
}) {
  return (
    <div className="routine-switcher" aria-label="切换方案">
      {ROUTINES.map((r) => (
        <button
          key={r.id}
          className={r.id === currentId ? 'switch-chip active' : 'switch-chip'}
          onClick={() => onSwitch(r)}
        >
          {r.name.zh}
        </button>
      ))}
    </div>
  )
}
