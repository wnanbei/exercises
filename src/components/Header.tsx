import { Icon, MOON_PATH, SUN_PATH, SPEAKER_PATH, WAVE_OFF, WAVE_ON } from './Icon'
import { Tooltip } from './Tooltip'

interface HeaderProps {
  theme: 'light' | 'dark'
  muted: boolean
  onToggleTheme: () => void
  onToggleMute: () => void
}

export function Header({ theme, muted, onToggleTheme, onToggleMute }: HeaderProps) {
  return (
    <header className="ds-header">
      <span className="ds-brand">每日拉伸 · Stretch Daily</span>

      <div className="ds-header__actions">
        <Tooltip
          placement="bottom"
          label={
            muted
              ? '声音已关 — 开启背景音乐与提醒音效'
              : '声音已开 — 舒缓背景音乐，倒数 5 秒与新动作提醒'
          }
        >
          <button
            onClick={onToggleMute}
            aria-label={muted ? '开启提示音' : '关闭提示音'}
            aria-pressed={!muted}
            className="ds-round-btn ds-hoverable"
          >
            <Icon size={17} stroke="var(--c-ink2)">
              <path d={SPEAKER_PATH} fill="var(--c-ink2)" stroke="none" />
              <path d={muted ? WAVE_OFF : WAVE_ON} />
            </Icon>
          </button>
        </Tooltip>

        <Tooltip placement="bottom" label={theme === 'dark' ? '切换到浅色' : '切换到深色'}>
          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
            className="ds-round-btn ds-hoverable"
          >
            <Icon size={17} stroke="var(--c-ink2)">
              <path d={theme === 'dark' ? SUN_PATH : MOON_PATH} />
            </Icon>
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
