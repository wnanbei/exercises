import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'

interface Props {
  label: ReactNode
  /** 默认在触发元素上方；靠近顶栏的元素可翻转到下方 */
  placement?: 'top' | 'bottom'
  children: ReactElement<{
    'aria-describedby'?: string
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    onFocus?: () => void
    onBlur?: () => void
  }>
}

const SHOW_DELAY = 350

/**
 * 同时只允许一个提示框可见。hover 在焦点跳转（键盘、滚动）时不会留下事件，
 * 因此开启者在此广播，先前打开的提示框自行关闭。
 */
const listeners = new Set<(activeId: string) => void>()

function claim(id: string) {
  for (const notify of listeners) notify(id)
}

/**
 * hover/focus 提示框。刻意不用 `title`：原生提示出现慢、无法定制样式，
 * 且键盘与触屏用户永远看不到。
 */
export function Tooltip({ label, placement = 'top', children }: Props) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ x: -9999, y: -9999 })
  const timer = useRef<number | undefined>(undefined)
  const anchorRef = useRef<HTMLSpanElement | null>(null)
  const id = useId()

  // 相对触发元素定位，并收敛边界使气泡不超出屏幕
  useLayoutEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    const bubble = anchor?.querySelector<HTMLElement>('[role="tooltip"]')
    if (!anchor || !bubble) return

    const a = anchor.getBoundingClientRect()
    const half = bubble.offsetWidth / 2
    const margin = 12
    const x = Math.min(
      Math.max(a.left + a.width / 2, margin + half),
      window.innerWidth - margin - half,
    )
    setCoords({ x, y: placement === 'top' ? a.top - 8 : a.bottom + 8 })
  }, [open, placement])

  useEffect(() => {
    const onClaim = (activeId: string) => {
      if (activeId !== id) {
        window.clearTimeout(timer.current)
        setOpen(false)
      }
    }
    listeners.add(onClaim)
    return () => {
      listeners.delete(onClaim)
      window.clearTimeout(timer.current)
    }
  }, [id])

  const openNow = () => {
    claim(id)
    setOpen(true)
  }
  const show = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(openNow, SHOW_DELAY)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setOpen(false)
  }

  const trigger = cloneElement(children, {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    // 键盘用户立即显示——他们已经提交了焦点
    onFocus: openNow,
    onBlur: hide,
  })

  return (
    <span
      ref={anchorRef}
      style={{ position: 'relative', display: 'inline-flex', flex: 'none' }}
      onMouseLeave={hide}
    >
      {trigger}
      <span
        role="tooltip"
        id={id}
        style={{
          // fixed 而非 absolute：屏外的气泡不会撑宽页面滚动范围
          position: 'fixed',
          left: coords.x,
          top: coords.y,
          transform: `translate(-50%, ${placement === 'top' ? '-100%' : '0'}) translateY(${
            open ? '0' : placement === 'top' ? '4px' : '-4px'
          })`,
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transition: 'opacity 140ms ease, transform 140ms ease',
          pointerEvents: 'none',
          zIndex: 20,
          // 窄屏上永不超过视口
          maxWidth: 'min(220px, calc(100vw - 24px))',
          width: 'max-content',
          padding: '6px 10px',
          borderRadius: 10,
          background: 'var(--c-ink)',
          color: 'var(--c-bg)',
          fontSize: 12,
          lineHeight: 1.45,
          letterSpacing: '0.01em',
          textAlign: 'center',
          boxShadow: '0 4px 14px rgba(38,48,36,0.22)',
        }}
      >
        {label}
      </span>
    </span>
  )
}
