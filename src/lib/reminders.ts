/** 定时提醒：每 N 分钟触发一次回调（0 表示关闭） */

let timer: number | null = null

export function setReminder(minutes: number, onFire: () => void): void {
  clearReminder()
  if (minutes <= 0) return
  timer = window.setInterval(onFire, minutes * 60 * 1000)
}

export function clearReminder(): void {
  if (timer != null) {
    window.clearInterval(timer)
    timer = null
  }
}
