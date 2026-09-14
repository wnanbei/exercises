import { ArrowLeft, Bell, Moon, Sun, Volume2, VolumeX } from 'lucide-react'

interface HeaderProps {
  title: string
  theme: 'light' | 'dark'
  muted: boolean
  reminderMin: number
  onBack?: () => void
  onToggleTheme: () => void
  onToggleMute: () => void
  onReminderChange: (minutes: number) => void
}

export function Header({
  title,
  theme,
  muted,
  reminderMin,
  onBack,
  onToggleTheme,
  onToggleMute,
  onReminderChange,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        {onBack && (
          <button className="icon-btn" onClick={onBack} aria-label="返回方案选择">
            <ArrowLeft size={19} />
          </button>
        )}
        <span className="header-title">{title}</span>
      </div>
      <div className="header-actions">
        <label className="reminder">
          <Bell size={16} aria-hidden />
          <select
            value={reminderMin}
            onChange={(e) => onReminderChange(Number(e.target.value))}
            aria-label="定时提醒"
          >
            <option value={0}>提醒关</option>
            <option value={20}>20 分钟</option>
            <option value={30}>30 分钟</option>
            <option value={45}>45 分钟</option>
            <option value={60}>60 分钟</option>
          </select>
        </label>
        <button
          className="icon-btn"
          onClick={onToggleMute}
          aria-label={muted ? '取消静音' : '静音'}
        >
          {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
        </button>
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? '切换亮色主题' : '切换暗色主题'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>
    </header>
  )
}
