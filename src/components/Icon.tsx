import type { CSSProperties, ReactNode } from 'react'

interface Props {
  size?: number
  stroke?: string
  strokeWidth?: number
  fill?: string
  style?: CSSProperties
  children: ReactNode
}

/** 24×24 图标网格的轻量封装，所有图形都绘制在这套网格上 */
export function Icon({
  size = 20,
  stroke = 'currentColor',
  strokeWidth = 2,
  fill = 'none',
  style,
  children,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const PLAY_PATH = 'M8 5.5 L19 12 L8 18.5 Z'
export const PAUSE_PATH = 'M7 5 H10.5 V19 H7 Z M13.5 5 H17 V19 H13.5 Z'
export const REPLAY_PATH =
  'M12 5 V2 L7.5 6 L12 10 V7 A5 5 0 1 1 7 12 H4.5 A7.5 7.5 0 1 0 12 5 Z'
export const PREV_PATH = 'M15 6 L9 12 L15 18'
export const NEXT_PATH = 'M9 6 L15 12 L9 18'
export const CHECK_PATH = 'M4 12.5 L9.5 18 L20 6.5'
export const CHEVRON_DOWN = 'M6 9 L12 15 L18 9'
export const SUN_PATH =
  'M12 3 V5 M12 19 V21 M3 12 H5 M19 12 H21 M5.6 5.6 L7 7 M17 17 L18.4 18.4 M18.4 5.6 L17 7 M7 17 L5.6 18.4 M12 8 A4 4 0 1 0 12 16 A4 4 0 1 0 12 8'
export const MOON_PATH = 'M20 13.5 A8 8 0 1 1 10.5 4 A6.5 6.5 0 0 0 20 13.5 Z'
export const SPEAKER_PATH = 'M11 5 L6 9 H3 V15 H6 L11 19 Z'
export const WAVE_ON = 'M15 9 C17 10.5 17 13.5 15 15 M17.5 6.5 C21 9 21 15 17.5 17.5'
export const WAVE_OFF = 'M16 9 L21 15 M21 9 L16 15'
