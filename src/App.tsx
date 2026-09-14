import { useCallback, useEffect, useState } from 'react'
import type { Routine } from './domain/types'
import { ROUTINES, getRoutine } from './domain/routines'
import { useSession } from './session/useSession'
import { unlockAudio, setMuted as audioSetMuted } from './lib/audio'
import { loadPrefs, savePrefs, type Prefs } from './lib/storage'
import { Header } from './components/Header'
import { RoutineRail } from './components/RoutineRail'
import { Stage } from './components/Stage'
import { Thumbnails } from './components/Thumbnails'
import { DetailPanel } from './components/DetailPanel'
import { Tooltip } from './components/Tooltip'

export default function App() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  // 直接进入拉伸页：默认上次的方案，否则第一套
  const [routineId, setRoutineId] = useState<string>(
    () => prefs.lastRoutineId ?? ROUTINES[0].id,
  )
  const routine = getRoutine(routineId)

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
    document.documentElement.style.colorScheme = prefs.theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', prefs.theme === 'dark' ? '#151A14' : '#E6EADA')
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

  const switchRoutine = useCallback((r: Routine) => {
    updatePrefs({ lastRoutineId: r.id })
    setRoutineId(r.id)
  }, [updatePrefs])

  return (
    <>
      <Header
        theme={prefs.theme}
        muted={prefs.muted}
        onToggleTheme={() => updatePrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' })}
        onToggleMute={() => updatePrefs({ muted: !prefs.muted })}
      />
      <SessionScreen
        key={routine.id}
        routine={routine}
        muted={prefs.muted}
        onSwitch={switchRoutine}
      />
    </>
  )
}

function SessionScreen({
  routine,
  muted,
  onSwitch,
}: {
  routine: Routine
  muted: boolean
  onSwitch: (r: Routine) => void
}) {
  const s = useSession(routine, muted)
  const [notesOpen, setNotesOpen] = useState(true)

  // 键盘：空格开始/暂停，←/→ 切换动作
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return
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
    if (r.id === routine.id) return
    if (s.state.done.length > 0 && s.state.phase !== 'finished') {
      if (!window.confirm('当前练习已有进度，切换方案将丢失进度，确定切换？')) return
    }
    onSwitch(r)
  }

  const total = routine.exerciseIds.length

  return (
    <>
      <RoutineRail currentId={routine.id} onSwitch={trySwitch} />

      <main className="ds-main">
        <Stage
          routineName={routine.name.zh}
          exercise={s.exercise}
          index={s.state.index}
          total={total}
          side={s.state.side}
          phase={s.state.phase}
          restKind={s.state.restKind}
          secondsLeft={s.secondsLeft}
          progress={s.progress}
          onToggle={s.toggle}
          onPrev={s.prev}
          onNext={s.next}
        />

        <Thumbnails
          routine={routine}
          current={s.state.index}
          done={s.state.done}
          onJump={s.goto}
        />

        <DetailPanel
          exercise={s.exercise}
          open={notesOpen}
          onToggle={() => setNotesOpen((v) => !v)}
        />

        <div className="ds-foot">
          <Tooltip label="今天已完成的段数，次日自动清零">
            <span role="status" style={{ cursor: 'help' }}>
              {s.state.phase === 'finished'
                ? '已完成 — 做得很好'
                : `今日 ${s.state.done.length} / ${s.totalSegments} 段`}
            </span>
          </Tooltip>
          <Tooltip label="清除今日记录，重新计数">
            <button onClick={s.resetProgress} className="ds-quiet">
              重置
            </button>
          </Tooltip>
        </div>
      </main>
    </>
  )
}
