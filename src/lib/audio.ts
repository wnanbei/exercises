/** Web Audio 振荡器合成：背景音乐 + 提示音效。无音频资源文件。 */

let ctx: AudioContext | null = null
let muted = false

export function setMuted(value: boolean): void {
  muted = value
  if (muted) stopMusic()
}

/** 需在首次用户手势中调用以解锁 AudioContext（iOS 兼容） */
export function unlockAudio(): void {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

function tone(
  freq: number,
  startIn: number,
  dur: number,
  gain = 0.12,
  type: OscillatorType = 'sine',
): void {
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

/** 换边提示 */
export function playSwitchSide(): void {
  tone(520, 0, 0.1, 0.1, 'triangle')
  tone(780, 0.1, 0.14, 0.1, 'triangle')
}

/** 新动作开始提示（上行双音，提醒用户进入下一个动作） */
export function playBeginCue(): void {
  tone(659.25, 0, 0.22, 0.1)
  tone(880, 0.14, 0.32, 0.1)
}

/** 保持倒数第 5 秒提示（柔和双音铃，预示即将结束） */
export function playEndingSoon(): void {
  tone(1046.5, 0, 0.2, 0.08)
  tone(783.99, 0.16, 0.28, 0.07)
}

/** 整套完成 */
export function playFanfare(): void {
  tone(523, 0, 0.2, 0.12)
  tone(659, 0.16, 0.2, 0.12)
  tone(784, 0.32, 0.36, 0.12)
  tone(1047, 0.5, 0.5, 0.08)
}

/* ==========================================================================
   背景音乐：60 BPM（1 拍 = 1 秒，与秒数节奏一致）。
   慢速分解和弦琶音——每拍一个和弦音轻柔划过（慢起音、长衰减，音音相融），
   节奏感保留但不催促；根音与五音长音垫底；无节拍器式脉冲。
   ========================================================================== */

interface MusicNodes {
  master: GainNode
  padGain: GainNode
  padOscs: OscillatorNode[]
  echoSend: DelayNode
}

let musicTimer: number | null = null
let musicNodes: MusicNodes | null = null
let beat = 0
let nextBeatTime = 0
let chordIdx = 0

/** C → Am → Dm → G 的进行，音区集中在柔和的中低频 */
const CHORDS: readonly number[][] = [
  [130.81, 164.81, 196.0, 220.0], // C6
  [110.0, 130.81, 164.81, 196.0], // Am7
  [146.83, 174.61, 220.0, 261.63], // Dm7
  [98.0, 130.81, 146.83, 196.0], // Gsus4
]

/** 8 拍琶音走向：上行后回荡，最后一个音落回根音前的停顿感 */
const ARP_PATTERN = [0, 1, 2, 3, 2, 1, 2, 3] as const

function padChange(t: number): void {
  if (!ctx || !musicNodes) return

  // 旧和弦缓慢释出
  const oldOscs = musicNodes.padOscs
  const oldGain = musicNodes.padGain
  oldGain.gain.setTargetAtTime(0, t, 1.0)
  for (const o of oldOscs) o.stop(t + 4)

  // 新和弦：仅根音与五音长音垫底，慢起音
  const chord = CHORDS[chordIdx % CHORDS.length]
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.setTargetAtTime(1, t, 2.2)
  g.connect(musicNodes.master)
  const oscs = [chord[0], chord[2]].map((f, i) => {
    const o = ctx!.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    o.detune.value = i === 0 ? 2 : -2
    const og = ctx!.createGain()
    og.gain.value = 0.035
    o.connect(og).connect(g)
    o.start(t)
    return o
  })
  musicNodes.padGain = g
  musicNodes.padOscs = oscs
  chordIdx++
}

/** 一拍一个琶音音：慢起音、长衰减，融入下一拍 */
function arpNote(freq: number, t: number): void {
  if (!ctx || !musicNodes) return
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.055, t + 0.25)
  g.gain.setTargetAtTime(0, t + 0.9, 0.55)
  g.connect(musicNodes.master)
  g.connect(musicNodes.echoSend)
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.value = freq
  o.connect(g)
  o.start(t)
  o.stop(t + 3.2)
}

function scheduleBeat(t: number): void {
  if (beat % 8 === 0) padChange(t)
  const chord = CHORDS[(chordIdx + CHORDS.length - 1) % CHORDS.length]
  arpNote(chord[ARP_PATTERN[beat % ARP_PATTERN.length]], t)
  beat++
}

/** 开始背景音乐（播放/休息期间持续；已在播放或静音时为空操作） */
export function startMusic(): void {
  if (!ctx || muted || musicTimer != null) return

  const master = ctx.createGain()
  master.gain.value = 0.45
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 2400
  master.connect(lp).connect(ctx.destination)

  // 短延迟回声总线，给旋律一点空间感
  const echo = ctx.createDelay(0.6)
  echo.delayTime.value = 0.32
  const fb = ctx.createGain()
  fb.gain.value = 0.28
  echo.connect(fb).connect(echo)
  const wet = ctx.createGain()
  wet.gain.value = 0.14
  echo.connect(wet).connect(master)

  const padGain = ctx.createGain()
  padGain.gain.value = 0
  padGain.connect(master)

  musicNodes = { master, padGain, padOscs: [], echoSend: echo }
  beat = 0
  nextBeatTime = ctx.currentTime + 0.08

  // 前瞻调度：每次检查未来 0.6s 内的拍点，后台标签页也不易断拍
  musicTimer = window.setInterval(() => {
    if (!ctx || !musicNodes) return
    while (nextBeatTime < ctx.currentTime + 0.6) {
      scheduleBeat(nextBeatTime)
      nextBeatTime += 1
    }
  }, 200)
}

/** 停止背景音乐（淡出） */
export function stopMusic(): void {
  if (musicTimer != null) {
    window.clearInterval(musicTimer)
    musicTimer = null
  }
  if (!ctx || !musicNodes) {
    musicNodes = null
    return
  }
  const t = ctx.currentTime
  const { master, padGain, padOscs } = musicNodes
  padGain.gain.setTargetAtTime(0, t, 0.4)
  for (const o of padOscs) o.stop(t + 2)
  master.gain.setTargetAtTime(0, t, 0.3)
  window.setTimeout(() => {
    try {
      master.disconnect()
    } catch {
      /* 已断开 */
    }
  }, 1500)
  musicNodes = null
}
