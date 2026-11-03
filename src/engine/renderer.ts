import { speciesLabel, speciesName } from '../chem/composition'
import { ELEMENTS } from '../chem/elements'
import type { Entity, LabWorld, Preview } from './world'

export interface ViewState {
  hoverId: number | null
  dragId: number | null
  preview: { targetId: number; kind: Preview } | null
  pointer: { x: number; y: number } | null
  tool: 'hand' | 'fire'
}

const FONT = '"Pretendard Variable", Pretendard, system-ui, sans-serif'

const easeOutBack = (t: number) => {
  const c = 1.9
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))))
  return `rgb(${ch(n >> 16)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
}

export class Renderer {
  private sprites = new Map<string, HTMLCanvasElement>()
  private bg: HTMLCanvasElement | null = null
  private dpr = 1
  private w = 0
  private h = 0

  private ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w
    this.h = h
    this.dpr = dpr
    this.sprites.clear()
    this.bg = this.makeBackground()
  }

  private makeBackground() {
    const c = document.createElement('canvas')
    c.width = this.w * this.dpr
    c.height = this.h * this.dpr
    const g = c.getContext('2d')!
    g.scale(this.dpr, this.dpr)

    const base = g.createLinearGradient(0, 0, 0, this.h)
    base.addColorStop(0, '#0a1222')
    base.addColorStop(1, '#05080f')
    g.fillStyle = base
    g.fillRect(0, 0, this.w, this.h)

    // 모눈
    g.strokeStyle = 'rgba(120, 170, 255, 0.05)'
    g.lineWidth = 1
    for (let x = 0; x < this.w; x += 40) {
      g.beginPath()
      g.moveTo(x + 0.5, 0)
      g.lineTo(x + 0.5, this.h)
      g.stroke()
    }
    for (let y = 0; y < this.h; y += 40) {
      g.beginPath()
      g.moveTo(0, y + 0.5)
      g.lineTo(this.w, y + 0.5)
      g.stroke()
    }

    // 실험대 바닥
    const floorY = this.h - 70
    const floor = g.createLinearGradient(0, floorY, 0, this.h)
    floor.addColorStop(0, 'rgba(92, 225, 255, 0.10)')
    floor.addColorStop(0.04, 'rgba(20, 30, 50, 0.9)')
    floor.addColorStop(1, '#03050a')
    g.fillStyle = floor
    g.fillRect(0, floorY, this.w, this.h - floorY)
    g.strokeStyle = 'rgba(92, 225, 255, 0.35)'
    g.beginPath()
    g.moveTo(0, floorY + 0.5)
    g.lineTo(this.w, floorY + 0.5)
    g.stroke()

    // 비네트
    const v = g.createRadialGradient(this.w / 2, this.h * 0.45, Math.min(this.w, this.h) * 0.3, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75)
    v.addColorStop(0, 'rgba(0,0,0,0)')
    v.addColorStop(1, 'rgba(0,0,0,0.55)')
    g.fillStyle = v
    g.fillRect(0, 0, this.w, this.h)
    return c
  }

  /** 원자 구체 스프라이트 (광택 + 기호) */
  private atomSprite(symbol: string, r: number) {
    const key = `${symbol}|${r.toFixed(1)}`
    let c = this.sprites.get(key)
    if (c) return c
    const el = ELEMENTS[symbol]
    const pad = r * 0.9
    const size = (r + pad) * 2
    c = document.createElement('canvas')
    c.width = c.height = Math.ceil(size * this.dpr)
    const g = c.getContext('2d')!
    g.scale(this.dpr, this.dpr)
    const m = size / 2

    const halo = g.createRadialGradient(m, m, r * 0.6, m, m, r + pad)
    halo.addColorStop(0, el.color + '55')
    halo.addColorStop(1, el.color + '00')
    g.fillStyle = halo
    g.fillRect(0, 0, size, size)

    const body = g.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r)
    body.addColorStop(0, shade(el.color, 0.7))
    body.addColorStop(0.45, el.color)
    body.addColorStop(1, shade(el.color, -0.55))
    g.fillStyle = body
    g.beginPath()
    g.arc(m, m, r, 0, Math.PI * 2)
    g.fill()

    // 가장자리 림 라이트
    g.strokeStyle = shade(el.color, 0.5)
    g.globalAlpha = 0.5
    g.lineWidth = 1.2
    g.beginPath()
    g.arc(m, m, r - 0.6, Math.PI * 0.15, Math.PI * 0.85)
    g.stroke()
    g.globalAlpha = 1

    g.fillStyle = luminance(el.color) > 0.6 ? '#1a2233' : '#ffffff'
    g.font = `800 ${Math.round(r * 0.78)}px ${FONT}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(symbol, m, m + 1)

    this.sprites.set(key, c)
    return c
  }

  draw(world: LabWorld, view: ViewState) {
    const { ctx, w, h } = this
    const { fx } = world
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    if (this.bg) ctx.drawImage(this.bg, 0, 0, w, h)

    ctx.save()
    ctx.translate(fx.shakeX, fx.shakeY)

    for (const e of world.entities) this.drawEntity(world, e, view)
    fx.draw(ctx)
    this.drawCursor(world, view)

    ctx.restore()
    fx.drawFlash(ctx, w, h)
  }

  private drawEntity(world: LabWorld, e: Entity, view: ViewState) {
    const { ctx } = this
    const age = world.time - e.born
    let s = age < 0.4 ? Math.max(0.01, easeOutBack(age / 0.4)) : 1
    const dragging = view.dragId === e.id
    const hover = view.hoverId === e.id
    if (dragging) s *= 1.08

    const isCluster = e.species === null
    const isTarget = view.preview?.targetId === e.id

    ctx.save()
    ctx.translate(e.x, e.y)
    ctx.scale(s, s)

    // 미완성 덩어리: 회전하는 점선 고리
    if (isCluster) {
      ctx.save()
      ctx.rotate(world.time * 0.8)
      ctx.setLineDash([6, 6])
      ctx.strokeStyle = 'rgba(173, 181, 189, 0.6)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, 0, e.r + 8, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    if (isTarget && view.preview) {
      const col = view.preview.kind === 'react' ? '#ff922b' : view.preview.kind === 'bond' ? '#63e6be' : '#fa5252'
      const pulse = 1 + Math.sin(world.time * 10) * 0.06
      ctx.strokeStyle = col
      ctx.lineWidth = 3
      ctx.shadowColor = col
      ctx.shadowBlur = 16
      ctx.beginPath()
      ctx.arc(0, 0, (e.r + 12) * pulse, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    } else if (hover || dragging) {
      ctx.strokeStyle = 'rgba(124, 245, 255, 0.55)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, e.r + 8, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 결합선
    const { atoms, bonds } = e.layout
    ctx.lineCap = 'round'
    for (const [i, j] of bonds) {
      ctx.strokeStyle = 'rgba(220, 235, 255, 0.45)'
      ctx.lineWidth = 7
      ctx.beginPath()
      ctx.moveTo(atoms[i].dx, atoms[i].dy)
      ctx.lineTo(atoms[j].dx, atoms[j].dy)
      ctx.stroke()
    }

    // 원자: 아래쪽부터 그려 입체감
    const order = atoms.map((_, i) => i).sort((a, b) => atoms[a].dy - atoms[b].dy)
    if (isCluster) ctx.globalAlpha = 0.75
    for (const i of order) {
      const a = atoms[i]
      const sp = this.atomSprite(a.el, a.r)
      const size = sp.width / this.dpr
      ctx.drawImage(sp, a.dx - size / 2, a.dy - size / 2, size, size)
    }
    ctx.globalAlpha = 1
    ctx.restore()

    // 라벨
    if (atoms.length > 1 || hover || dragging) {
      ctx.font = `700 13px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      ctx.fillStyle = isCluster ? '#adb5bd' : '#e7f5ff'
      const label = speciesLabel(e.species, e.comp) + (isCluster ? ' ?' : '')
      ctx.fillText(label, e.x, e.y + e.r * s + 8)
      if (hover || dragging) {
        ctx.font = `500 11px ${FONT}`
        ctx.fillStyle = '#91a7c4'
        ctx.fillText(speciesName(e.species), e.x, e.y + e.r * s + 24)
      }
      ctx.shadowBlur = 0
    }

    if (isTarget && view.preview && view.preview.kind !== 'none') {
      ctx.font = `800 12px ${FONT}`
      ctx.textAlign = 'center'
      ctx.fillStyle = view.preview.kind === 'react' ? '#ffa94d' : '#63e6be'
      ctx.fillText(view.preview.kind === 'react' ? '⚠ 반응!' : '+ 결합', e.x, e.y - e.r - 26)
    }
  }

  private drawCursor(world: LabWorld, view: ViewState) {
    if (view.tool !== 'fire' || !view.pointer) return
    const { ctx } = this
    const { x, y } = view.pointer
    // 점화 범위 표시
    ctx.save()
    ctx.setLineDash([4, 8])
    ctx.lineDashOffset = -world.time * 30
    ctx.strokeStyle = 'rgba(255, 146, 43, 0.35)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x, y, 110, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}
