/** Web Audio 振荡器合成音效：滴答 / 铃声 / 换边 / 完成。无音频资源文件。 */

let ctx: AudioContext | null = null
let muted = false

export function setMuted(value: boolean): void {
  muted = value
}

/** 需在首次用户手势中调用以解锁 AudioContext（iOS 兼容） */
export function unlockAudio(): void {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

function tone(freq: number, startIn: number, dur: number, gain = 0.12, type: OscillatorType = 'sine'): void {
  if (!ctx || muted) return
  const t0 = ctx.currentTime + startIn
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

/** 半程滴答 */
export function playTick(): void {
  tone(880, 0, 0.09, 0.07, 'triangle')
}

/** 单段结束铃声 */
export function playChime(): void {
  tone(660, 0, 0.18, 0.12)
  tone(990, 0.12, 0.28, 0.1)
}

/** 换边提示 */
export function playSwitchSide(): void {
  tone(520, 0, 0.1, 0.1, 'triangle')
  tone(780, 0.1, 0.14, 0.1, 'triangle')
}

/** 整套完成 */
export function playFanfare(): void {
  tone(523, 0, 0.2, 0.12)
  tone(659, 0.16, 0.2, 0.12)
  tone(784, 0.32, 0.36, 0.12)
  tone(1047, 0.5, 0.5, 0.08)
}
