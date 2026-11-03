import { isAtom, isMolecule, speciesComposition } from '../chem/composition'
import { ELEMENTS, isNoble } from '../chem/elements'
import { MOLECULES } from '../chem/molecules'
import { combine, findContactReaction, matchFireReactions } from '../chem/reactor'
import type { Composition, ReactionDef } from '../chem/types'
import { playBond, playFail, playPoof, playReactionFx, playSpark, playSpawn } from '../fx/effects'
import { FxSystem, rand } from '../fx/particles'
import { computeLayout, type MoleculeLayout } from './layout'

export interface Entity {
  id: number
  /** 원소 기호 / 분자 id / 미완성 덩어리는 null */
  species: string | null
  comp: Composition
  layout: MoleculeLayout
  x: number
  y: number
  vx: number
  vy: number
  r: number
  dragging: boolean
  born: number
  /** 이 시간 동안은 접촉 반응하지 않음 (생성 직후 연쇄 방지) */
  cooldown: number
}

export type SpawnSource = 'palette' | 'formed' | 'product'

export type WorldEvent =
  | { type: 'reaction'; reaction: ReactionDef; x: number; y: number }
  /** via: 결합으로 생겼으면 'bond', 반응 생성물이면 반응 id */
  | { type: 'spawned'; species: string | null; source: SpawnSource; via?: string }
  | { type: 'nothing'; reason: 'molecules' | 'incompatible' | 'noble' }
  | { type: 'ignite-empty' }
  | { type: 'ignited'; count: number }

export type Preview = 'react' | 'bond' | 'none'

const IGNITE_RADIUS = 110
const MAX_SPEED = 1400

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

export function speciesColor(species: string | null, comp: Composition): string {
  if (isAtom(species)) return ELEMENTS[species].color
  const els = Object.keys(comp)
  return ELEMENTS[els[0]]?.color ?? '#ffffff'
}

export class LabWorld {
  entities: Entity[] = []
  fx = new FxSystem()
  width = 800
  height = 600
  time = 0
  private nextId = 1
  private timers: { at: number; fn: () => void }[] = []
  private listeners = new Set<(e: WorldEvent) => void>()

  on(fn: (e: WorldEvent) => void) {
    this.listeners.add(fn)
    return () => void this.listeners.delete(fn)
  }

  private emit(e: WorldEvent) {
    this.listeners.forEach((fn) => fn(e))
  }

  resize(w: number, h: number) {
    this.width = w
    this.height = h
  }

  after(sec: number, fn: () => void) {
    this.timers.push({ at: this.time + sec, fn })
  }

  spawn(species: string, x: number, y: number, source: SpawnSource, vx = 0, vy = 0, via?: string): Entity {
    return this.spawnComp(species, speciesComposition(species), x, y, source, vx, vy, via)
  }

  private spawnComp(species: string | null, comp: Composition, x: number, y: number, source: SpawnSource, vx = 0, vy = 0, via?: string): Entity {
    const layout = computeLayout(comp, species)
    const e: Entity = {
      id: this.nextId++,
      species,
      comp,
      layout,
      x,
      y,
      vx,
      vy,
      r: layout.radius,
      dragging: false,
      born: this.time,
      cooldown: 0.4,
    }
    this.entities.push(e)
    if (source === 'palette') playSpawn(this.fx, x, y, speciesColor(species, comp))
    this.emit({ type: 'spawned', species, source, via })
    return e
  }

  remove(e: Entity, poof = false) {
    const i = this.entities.indexOf(e)
    if (i === -1) return
    this.entities.splice(i, 1)
    if (poof) playPoof(this.fx, e.x, e.y)
  }

  has(e: Entity) {
    return this.entities.includes(e)
  }

  clear() {
    this.entities.forEach((e) => playPoof(this.fx, e.x, e.y))
    this.entities = []
    this.timers = []
  }

  hitTest(x: number, y: number): Entity | undefined {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i]
      if (dist(e, { x, y }) <= e.r + 6) return e
    }
    return undefined
  }

  bringToFront(e: Entity) {
    this.entities.splice(this.entities.indexOf(e), 1)
    this.entities.push(e)
  }

  findOverlap(e: Entity): Entity | undefined {
    let best: Entity | undefined
    let bestD = Infinity
    for (const o of this.entities) {
      if (o === e) continue
      const d = dist(e, o)
      if (d < e.r + o.r + 4 && d < bestD) {
        best = o
        bestD = d
      }
    }
    return best
  }

  preview(a: Entity, b: Entity): Preview {
    if (findContactReaction(a.species, b.species)) return 'react'
    if ([a, b].some((e) => Object.keys(e.comp).some(isNoble))) return 'none'
    return combine(a.comp, b.comp, isMolecule(a.species) && isMolecule(b.species)) ? 'bond' : 'none'
  }

  /** 드래그를 놓았을 때: 겹친 대상과 반응 또는 결합 시도 */
  release(e: Entity) {
    e.dragging = false
    const other = this.findOverlap(e)
    if (other) this.interact(e, other)
  }

  private interact(a: Entity, b: Entity) {
    const reaction = findContactReaction(a.species, b.species)
    if (reaction) {
      this.runReaction(reaction, [a, b], (a.x + b.x) / 2, (a.y + b.y) / 2)
      return
    }

    const bothMolecules = isMolecule(a.species) && isMolecule(b.species)
    const noble = [a, b].some((e) => Object.keys(e.comp).some(isNoble))
    const result = noble ? null : combine(a.comp, b.comp, bothMolecules)
    if (!result) {
      playFail(this.fx, (a.x + b.x) / 2, (a.y + b.y) / 2)
      this.pushApart(a, b, noble ? 420 : 260)
      this.emit({ type: 'nothing', reason: noble ? 'noble' : bothMolecules ? 'molecules' : 'incompatible' })
      return
    }

    const { x, y } = b
    this.remove(a)
    this.remove(b)
    const formed =
      result.kind === 'molecule'
        ? this.spawn(result.id, x, y, 'formed', 0, 0, 'bond')
        : this.spawnComp(null, result.comp, x, y, 'formed', 0, 0, 'bond')
    playBond(this.fx, x, y, result.kind === 'molecule' ? '#7cf5ff' : '#adb5bd')
    formed.vy = -40
  }

  ignite(x: number, y: number) {
    playSpark(this.fx, x, y)
    const pool = this.entities
      .filter((e) => dist(e, { x, y }) < IGNITE_RADIUS + e.r)
      .sort((a, b) => dist(a, { x, y }) - dist(b, { x, y }))
    const matches = matchFireReactions(pool)
    if (!matches.length) {
      this.emit({ type: 'ignite-empty' })
      return
    }
    this.emit({ type: 'ignited', count: matches.length })
    // 가까운 것부터 차례로 터지는 연쇄 반응
    matches.forEach((m, i) =>
      this.after(i * 0.16, () => {
        if (!m.used.every((e) => this.has(e))) return
        const cx = m.used.reduce((s, e) => s + e.x, 0) / m.used.length
        const cy = m.used.reduce((s, e) => s + e.y, 0) / m.used.length
        this.runReaction(m.reaction, m.used, cx, cy)
      }),
    )
  }

  private runReaction(r: ReactionDef, used: Entity[], x: number, y: number) {
    if (r.keepReactants) used.forEach((e) => (e.cooldown = 2.5))
    else used.forEach((e) => this.remove(e))

    const delay = playReactionFx(this.fx, r, x, y)
    this.emit({ type: 'reaction', reaction: r, x, y })
    if (r.keepReactants) return

    this.after(delay, () => {
      const products = Object.entries(r.products).flatMap(([s, n]) => Array<string>(n).fill(s))
      products.forEach((s) => {
        const a = rand(0, Math.PI * 2)
        const sp = rand(80, 220)
        const p = this.spawn(s, x + Math.cos(a) * 10, y + Math.sin(a) * 10, 'product', Math.cos(a) * sp, Math.sin(a) * sp, r.id)
        p.cooldown = 1.2
      })
    })
  }

  private pushApart(a: Entity, b: Entity, impulse: number) {
    const d = dist(a, b) || 1
    const nx = (a.x - b.x) / d
    const ny = (a.y - b.y) / d
    a.vx += nx * impulse
    a.vy += ny * impulse
    b.vx -= nx * impulse
    b.vy -= ny * impulse
  }

  update(dt: number) {
    this.time += dt

    const due = this.timers.filter((t) => t.at <= this.time)
    if (due.length) {
      this.timers = this.timers.filter((t) => t.at > this.time)
      due.forEach((t) => t.fn())
    }

    for (const e of this.entities) {
      e.cooldown -= dt
      if (e.dragging) continue

      // 기체는 살짝 뜨고 고체는 가라앉는다
      const state = isMolecule(e.species) ? MOLECULES[e.species].state : null
      const buoyancy = state === 'gas' ? -14 : state === 'solid' ? 40 : 0
      e.vy += buoyancy * dt
      e.vx += rand(-1, 1) * 30 * dt
      e.vy += rand(-1, 1) * 30 * dt

      const k = Math.exp(-1.2 * dt)
      e.vx *= k
      e.vy *= k
      const sp = Math.hypot(e.vx, e.vy)
      if (sp > MAX_SPEED) {
        e.vx *= MAX_SPEED / sp
        e.vy *= MAX_SPEED / sp
      }
      e.x += e.vx * dt
      e.y += e.vy * dt

      // 벽 반사
      if (e.x < e.r) {
        e.x = e.r
        e.vx = Math.abs(e.vx) * 0.6
      } else if (e.x > this.width - e.r) {
        e.x = this.width - e.r
        e.vx = -Math.abs(e.vx) * 0.6
      }
      const floor = this.height - e.r - 70
      if (e.y < e.r) {
        e.y = e.r
        e.vy = Math.abs(e.vy) * 0.6
      } else if (e.y > floor) {
        e.y = floor
        e.vy = -Math.abs(e.vy) * 0.5
      }
    }

    this.collide()
    this.fx.update(dt)
  }

  private collide() {
    const list = this.entities
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        const d = dist(a, b)
        const min = a.r + b.r
        if (d >= min) continue

        if (a.cooldown <= 0 && b.cooldown <= 0) {
          const reaction = findContactReaction(a.species, b.species)
          if (reaction) {
            a.dragging = b.dragging = false
            this.runReaction(reaction, [a, b], (a.x + b.x) / 2, (a.y + b.y) / 2)
            return // 목록이 바뀌었으니 다음 프레임에 이어서
          }
        }
        // 드래그 중에는 겹침을 허용해 결합 대상 위로 올릴 수 있게 한다
        if (a.dragging || b.dragging) continue

        const nx = (b.x - a.x) / (d || 1)
        const ny = (b.y - a.y) / (d || 1)
        const overlap = (min - d) / 2
        a.x -= nx * overlap
        a.y -= ny * overlap
        b.x += nx * overlap
        b.y += ny * overlap
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
        if (rel < 0) {
          const imp = -rel * 0.8
          a.vx -= nx * imp
          a.vy -= ny * imp
          b.vx += nx * imp
          b.vy += ny * imp
        }
      }
    }
  }
}

/** 앱 전체에서 공유하는 실험대 인스턴스 */
export const world = new LabWorld()
export const benchRef: { el: HTMLCanvasElement | null } = { el: null }

// 개발 중 브라우저 콘솔·자동화 스크립트에서 바로 다룰 수 있게
if (import.meta.env.DEV) (window as unknown as { __lab: LabWorld }).__lab = world
