/**
 * Web Audio로 즉석 합성하는 효과음. 음원 파일 없이 동작한다.
 * 브라우저 정책상 첫 사용자 입력 이후에 AudioContext가 열린다.
 */
class Sfx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  muted = false

  private ensure(): AudioContext | null {
    if (this.muted) return null
    if (!this.ctx) {
      this.ctx = new AudioContext()
      const comp = this.ctx.createDynamicsCompressor()
      comp.threshold.value = -14
      comp.ratio.value = 6
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.55
      this.master.connect(comp).connect(this.ctx.destination)

      const len = this.ctx.sampleRate * 2
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const data = this.noise.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private env(ctx: AudioContext, peak: number, attack: number, decay: number, at = ctx.currentTime) {
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(peak, at + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
    g.connect(this.master!)
    return g
  }

  private noiseSrc(ctx: AudioContext, at: number, dur: number) {
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    src.loop = true
    src.start(at, Math.random())
    src.stop(at + dur)
    return src
  }

  private tone(type: OscillatorType, from: number, to: number, peak: number, dur: number, delay = 0) {
    const ctx = this.ensure()
    if (!ctx) return
    const at = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(from, at)
    osc.frequency.exponentialRampToValueAtTime(to, at + dur)
    osc.connect(this.env(ctx, peak, 0.005, dur, at))
    osc.start(at)
    osc.stop(at + dur + 0.05)
  }

  boom(power = 1) {
    const ctx = this.ensure()
    if (!ctx) return
    const t = ctx.currentTime
    const dur = 1.2 + power * 0.6
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(2400, t)
    lp.frequency.exponentialRampToValueAtTime(60, t + dur)
    this.noiseSrc(ctx, t, dur).connect(lp).connect(this.env(ctx, Math.min(1, 0.7 * power), 0.004, dur))
    this.tone('sine', 110, 28, Math.min(1, 0.9 * power), 0.9)
    this.crackle(0.8, 0.15)
  }

  pop() {
    const ctx = this.ensure()
    if (!ctx) return
    const t = ctx.currentTime
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1400
    bp.Q.value = 0.8
    this.noiseSrc(ctx, t, 0.2).connect(bp).connect(this.env(ctx, 0.8, 0.002, 0.15))
    this.tone('sine', 520, 140, 0.5, 0.18)
  }

  fizz(dur = 1.5) {
    const ctx = this.ensure()
    if (!ctx) return
    const t = ctx.currentTime
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 3500
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.1)
    g.gain.setValueAtTime(0.18, t + dur * 0.7)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    g.connect(this.master!)
    this.noiseSrc(ctx, t, dur).connect(hp).connect(g)
    // 보글보글
    for (let i = 0; i < dur * 14; i++) {
      const f = 300 + Math.random() * 700
      this.tone('sine', f, f * 1.8, 0.06, 0.05, Math.random() * dur)
    }
  }

  crackle(dur = 1, density = 0.3) {
    const ctx = this.ensure()
    if (!ctx) return
    const count = Math.floor(dur * 60 * density)
    for (let i = 0; i < count; i++) {
      const at = ctx.currentTime + Math.random() * dur
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 1800 + Math.random() * 3000
      this.noiseSrc(ctx, at, 0.03).connect(hp).connect(this.env(ctx, 0.15 + Math.random() * 0.25, 0.001, 0.02, at))
    }
  }

  whoosh(dur = 1.5) {
    const ctx = this.ensure()
    if (!ctx) return
    const t = ctx.currentTime
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 0.7
    bp.frequency.setValueAtTime(250, t)
    bp.frequency.exponentialRampToValueAtTime(900, t + 0.3)
    bp.frequency.exponentialRampToValueAtTime(400, t + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.45, t + 0.15)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    g.connect(this.master!)
    this.noiseSrc(ctx, t, dur).connect(bp).connect(g)
    this.crackle(dur, 0.12)
  }

  flash() {
    this.tone('sawtooth', 2400, 300, 0.12, 0.6)
    this.tone('sine', 1800, 900, 0.2, 0.4)
    this.whoosh(1.2)
  }

  chime() {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone('triangle', f, f, 0.18, 0.5, i * 0.07))
  }

  bond() {
    this.tone('sine', 660, 880, 0.25, 0.12)
    this.tone('triangle', 990, 1320, 0.12, 0.18, 0.05)
  }

  fail() {
    this.tone('triangle', 220, 150, 0.25, 0.22)
  }

  plop() {
    this.tone('sine', 300, 700, 0.2, 0.08)
  }

  spark() {
    const ctx = this.ensure()
    if (!ctx) return
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 4000
    this.noiseSrc(ctx, ctx.currentTime, 0.06).connect(hp).connect(this.env(ctx, 0.4, 0.001, 0.05))
  }

  fanfare() {
    ;[523.25, 659.25, 783.99].forEach((f, i) => this.tone('triangle', f, f, 0.2, 0.18, i * 0.11))
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f) => this.tone('triangle', f, f * 1.002, 0.14, 1.1, 0.36))
    this.tone('sine', 2093, 2093, 0.08, 0.9, 0.36)
  }

  discover() {
    ;[783.99, 1046.5, 1318.5].forEach((f, i) => this.tone('sine', f, f, 0.2, 0.6, i * 0.09))
  }
}

export const sfx = new Sfx()
