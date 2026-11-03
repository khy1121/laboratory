export type ParticleKind = 'spark' | 'glow' | 'flame' | 'ember' | 'smoke' | 'bubble' | 'ring' | 'debris' | 'text'

export interface Particle {
  kind: ParticleKind
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  size2: number
  color: string
  /** 초당 감속 계수 */
  drag: number
  gravity: number
  rot: number
  vr: number
  alpha: number
  text?: string
}

export interface Emitter {
  x: number
  y: number
  t: number
  dur: number
  tick: (fx: FxSystem, em: Emitter, dt: number, progress: number) => void
  data: Record<string, number>
}

type Range = [number, number]

export interface BurstOptions {
  speed?: Range
  life?: Range
  size?: Range
  size2?: number | 'same'
  color?: string | string[]
  gravity?: number
  drag?: number
  /** 방향(라디안)과 퍼짐 각도. 기본은 전방향 */
  angle?: number
  spread?: number
  /** 생성 위치를 흩뿌릴 반경 */
  jitter?: number
  alpha?: number
}

const MAX_PARTICLES = 5000
const ADDITIVE: ReadonlySet<ParticleKind> = new Set(['spark', 'glow', 'flame', 'ember', 'ring'])

export const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(v: T | T[]): T => (Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v)

const spriteCache = new Map<string, HTMLCanvasElement>()

/** 부드러운 원형 그라데이션 스프라이트 (glow/flame/smoke 공용) */
function softSprite(color: string, hardness: number): HTMLCanvasElement {
  const key = `${color}|${hardness}`
  let c = spriteCache.get(key)
  if (c) return c
  c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, color)
  grad.addColorStop(hardness, color + '99')
  grad.addColorStop(1, color + '00')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  spriteCache.set(key, c)
  return c
}

export class FxSystem {
  particles: Particle[] = []
  emitters: Emitter[] = []
  shake = 0
  shakeX = 0
  shakeY = 0
  flash = { color: '#ffffff', a: 0, decay: 2 }
  private timers: { at: number; fn: () => void }[] = []
  private time = 0

  add(p: Partial<Particle> & Pick<Particle, 'kind' | 'x' | 'y'>) {
    if (this.particles.length >= MAX_PARTICLES) return
    const life = p.life ?? 1
    this.particles.push({
      vx: 0,
      vy: 0,
      size: 4,
      color: '#ffffff',
      drag: 0,
      gravity: 0,
      rot: 0,
      vr: 0,
      alpha: 1,
      ...p,
      life,
      max: life,
      size2: p.size2 ?? p.size ?? 4,
    })
  }

  burst(kind: ParticleKind, x: number, y: number, n: number, o: BurstOptions = {}) {
    const [s0, s1] = o.speed ?? [50, 200]
    const [l0, l1] = o.life ?? [0.4, 0.9]
    const [z0, z1] = o.size ?? [2, 4]
    for (let i = 0; i < n; i++) {
      const a = o.angle !== undefined ? o.angle + rand(-1, 1) * (o.spread ?? Math.PI) : rand(0, Math.PI * 2)
      const sp = rand(s0, s1)
      const size = rand(z0, z1)
      const j = o.jitter ?? 0
      this.add({
        kind,
        x: x + rand(-j, j),
        y: y + rand(-j, j),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(l0, l1),
        size,
        size2: o.size2 === 'same' || o.size2 === undefined ? size : o.size2,
        color: pick(o.color ?? '#ffffff'),
        gravity: o.gravity ?? 0,
        drag: o.drag ?? 0,
        rot: rand(0, Math.PI * 2),
        vr: rand(-8, 8),
        alpha: o.alpha ?? 1,
      })
    }
  }

  glow(x: number, y: number, size: number, size2: number, life: number, color: string, alpha = 1) {
    this.add({ kind: 'glow', x, y, size, size2, life, color, alpha })
  }

  ring(x: number, y: number, color: string, from: number, to: number, life: number, width = 6) {
    this.add({ kind: 'ring', x, y, size: from, size2: to, life, color, alpha: width })
  }

  text(x: number, y: number, text: string, color: string, life = 1.6) {
    this.add({ kind: 'text', x, y, vy: -40, text, color, life, size: 18, size2: 22 })
  }

  emit(x: number, y: number, dur: number, tick: Emitter['tick'], data: Record<string, number> = {}) {
    this.emitters.push({ x, y, t: 0, dur, tick, data })
  }

  later(sec: number, fn: () => void) {
    this.timers.push({ at: this.time + sec, fn })
  }

  addShake(m: number) {
    this.shake = Math.max(this.shake, m)
  }

  flashScreen(color: string, a: number, decay = 2) {
    if (a >= this.flash.a) this.flash = { color, a, decay }
  }

  update(dt: number) {
    this.time += dt

    const due = this.timers.filter((t) => t.at <= this.time)
    if (due.length) {
      this.timers = this.timers.filter((t) => t.at > this.time)
      due.forEach((t) => t.fn())
    }

    for (const em of this.emitters) {
      em.t += dt
      em.tick(this, em, dt, Math.min(1, em.t / em.dur))
    }
    this.emitters = this.emitters.filter((em) => em.t < em.dur)

    for (const p of this.particles) {
      p.life -= dt
      const k = Math.exp(-p.drag * dt)
      p.vx *= k
      p.vy = p.vy * k + p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vr * dt
      if (p.kind === 'bubble') p.x += Math.sin((p.max - p.life) * 12 + p.rot) * 20 * dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)

    this.shake *= Math.exp(-6 * dt)
    if (this.shake < 0.2) this.shake = 0
    this.shakeX = (Math.random() * 2 - 1) * this.shake
    this.shakeY = (Math.random() * 2 - 1) * this.shake

    this.flash.a = Math.max(0, this.flash.a - this.flash.decay * dt * Math.max(0.3, this.flash.a))
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    for (const p of this.particles) if (!ADDITIVE.has(p.kind)) this.drawOne(ctx, p)
    ctx.globalCompositeOperation = 'lighter'
    for (const p of this.particles) if (ADDITIVE.has(p.kind)) this.drawOne(ctx, p)
    ctx.restore()
  }

  drawFlash(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.flash.a <= 0.01) return
    ctx.save()
    ctx.globalAlpha = Math.min(1, this.flash.a)
    ctx.fillStyle = this.flash.color
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }

  private drawOne(ctx: CanvasRenderingContext2D, p: Particle) {
    const t = 1 - p.life / p.max // 0 → 1
    const fade = p.life / p.max
    const size = p.size + (p.size2 - p.size) * t

    switch (p.kind) {
      case 'spark': {
        ctx.globalAlpha = fade * p.alpha
        ctx.strokeStyle = p.color
        ctx.lineWidth = size
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035)
        ctx.stroke()
        break
      }
      case 'glow':
      case 'ember':
      case 'flame': {
        const a = p.kind === 'flame' ? Math.sin(fade * Math.PI) : fade
        ctx.globalAlpha = a * p.alpha
        const s = size * 2
        ctx.drawImage(softSprite(p.color, p.kind === 'ember' ? 0.5 : 0.25), p.x - s / 2, p.y - s / 2, s, s)
        break
      }
      case 'smoke': {
        ctx.globalAlpha = Math.sin(fade * Math.PI) * 0.45 * p.alpha
        const s = size * 2
        ctx.drawImage(softSprite(p.color, 0.35), p.x - s / 2, p.y - s / 2, s, s)
        break
      }
      case 'bubble': {
        ctx.globalAlpha = Math.min(1, fade * 2) * 0.8
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(p.x - size * 0.35, p.y - size * 0.35, size * 0.25, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'ring': {
        ctx.globalAlpha = fade
        ctx.strokeStyle = p.color
        ctx.lineWidth = Math.max(0.5, p.alpha * fade)
        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.stroke()
        break
      }
      case 'debris': {
        ctx.globalAlpha = Math.min(1, fade * 3) * p.alpha
        ctx.fillStyle = p.color
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillRect(-size / 2, -size / 2, size, size)
        ctx.restore()
        break
      }
      case 'text': {
        ctx.globalAlpha = Math.min(1, fade * 2)
        ctx.fillStyle = p.color
        ctx.font = `700 ${size}px "Pretendard Variable", system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.6)'
        ctx.shadowBlur = 6
        ctx.fillText(p.text ?? '', p.x, p.y)
        ctx.shadowBlur = 0
        break
      }
    }
  }
}
