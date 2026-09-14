/** localStorage 封装：版本化 schema，解析失败静默回退默认值 */

export interface Prefs {
  theme: 'light' | 'dark'
  muted: boolean
  reminderMin: 0 | 20 | 30 | 45 | 60
  lastRoutineId: string | null
}

export interface DayProgress {
  date: string // YYYY-MM-DD（本地时区）
  routineId: string
  doneSegments: string[]
  finished: boolean
}

interface Schema {
  v: 1
  prefs: Prefs
  progress: DayProgress | null
}

const KEY = 'stretch-daily:v1'

export const DEFAULT_PREFS: Prefs = {
  theme: 'light',
  muted: false,
  reminderMin: 0,
  lastRoutineId: null,
}

export function todayStr(): string {
  const d = new Date()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function load(): Schema {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { v: 1, prefs: DEFAULT_PREFS, progress: null }
    const parsed = JSON.parse(raw) as Partial<Schema>
    if (parsed.v !== 1) return { v: 1, prefs: DEFAULT_PREFS, progress: null }
    return {
      v: 1,
      prefs: { ...DEFAULT_PREFS, ...(parsed.prefs ?? {}) },
      progress: parsed.progress ?? null,
    }
  } catch {
    return { v: 1, prefs: DEFAULT_PREFS, progress: null }
  }
}

function save(schema: Schema): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(schema))
  } catch {
    /* 存储不可用时静默降级 */
  }
}

export function loadPrefs(): Prefs {
  return load().prefs
}

export function savePrefs(prefs: Prefs): void {
  const s = load()
  save({ ...s, prefs })
}

/** 读取当日进度；次日或非同一方案自动重置 */
export function loadTodayProgress(routineId: string): DayProgress | null {
  const p = load().progress
  if (!p || p.date !== todayStr() || p.routineId !== routineId) return null
  return p
}

export function saveTodayProgress(progress: DayProgress): void {
  const s = load()
  save({ ...s, progress })
}
