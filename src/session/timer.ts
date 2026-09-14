/** 墙上时钟驱动：单一 interval + visibilitychange 重同步，后台标签页恢复不漂移 */

export function startClock(onTick: () => void, intervalMs = 250): () => void {
  const id = window.setInterval(onTick, intervalMs)
  const onVisible = () => {
    if (document.visibilityState === 'visible') onTick()
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)
  return () => {
    window.clearInterval(id)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', onVisible)
  }
}
