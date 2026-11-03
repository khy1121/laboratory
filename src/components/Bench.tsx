import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'
import { Renderer } from '../engine/renderer'
import { benchRef, world, type Entity } from '../engine/world'
import { useLabStore } from '../store/useLabStore'

interface DragState {
  e: Entity
  ox: number
  oy: number
  vx: number
  vy: number
  lx: number
  ly: number
  lt: number
}

const MAX_THROW = 1200
const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v))

export function Bench() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tool = useLabStore((s) => s.tool)
  const toolRef = useRef(tool)
  const drag = useRef<DragState | null>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const hoverId = useRef<number | null>(null)

  useEffect(() => {
    toolRef.current = tool
  }, [tool])

  useEffect(() => {
    const canvas = canvasRef.current!
    benchRef.el = canvas
    const renderer = new Renderer(canvas.getContext('2d')!)

    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      world.resize(rect.width, rect.height)
      renderer.resize(rect.width, rect.height, dpr)
    })
    ro.observe(canvas)

    const shakeEl = document.getElementById('app-shake')
    const clock = { last: performance.now(), raf: 0 }
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - clock.last) / 1000)
      clock.last = now
      if (drag.current && !world.has(drag.current.e)) drag.current = null

      world.update(dt)

      // 점화기 커서: 작은 불꽃
      const p = pointer.current
      if (toolRef.current === 'fire' && p) {
        world.fx.burst('flame', p.x, p.y, 1, { speed: [30, 70], angle: -Math.PI / 2, spread: 0.3, life: [0.15, 0.3], size: [6, 10], size2: 2, color: ['#ffd166', '#ff9f1c', '#4dabf7'], gravity: -150 })
      }

      let preview = null
      const d = drag.current
      if (d) {
        const target = world.findOverlap(d.e)
        if (target) preview = { targetId: target.id, kind: world.preview(d.e, target) }
      }

      renderer.draw(world, {
        hoverId: hoverId.current,
        dragId: d?.e.id ?? null,
        preview,
        pointer: p,
        tool: toolRef.current,
      })

      if (shakeEl) {
        const s = world.fx.shake
        shakeEl.style.transform = s > 2 ? `translate(${world.fx.shakeX * 0.35}px, ${world.fx.shakeY * 0.35}px)` : ''
      }
      clock.raf = requestAnimationFrame(loop)
    }
    clock.raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(clock.raf)
      ro.disconnect()
      benchRef.el = null
    }
  }, [])

  const local = (ev: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: ev.clientX - r.left, y: ev.clientY - r.top }
  }

  const updateCursor = () => {
    const c = canvasRef.current
    if (!c) return
    c.style.cursor = toolRef.current === 'fire' ? 'none' : drag.current ? 'grabbing' : hoverId.current !== null ? 'grab' : 'default'
  }

  const onPointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0) return
    const p = local(ev)
    if (toolRef.current === 'fire') {
      world.ignite(p.x, p.y)
      return
    }
    const e = world.hitTest(p.x, p.y)
    if (!e) return
    canvasRef.current!.setPointerCapture(ev.pointerId)
    world.bringToFront(e)
    e.dragging = true
    e.vx = e.vy = 0
    drag.current = { e, ox: p.x - e.x, oy: p.y - e.y, vx: 0, vy: 0, lx: p.x, ly: p.y, lt: performance.now() }
    updateCursor()
  }

  const onPointerMove = (ev: PointerEvent) => {
    const p = local(ev)
    pointer.current = p
    const d = drag.current
    if (d && world.has(d.e)) {
      const now = performance.now()
      const dt = Math.max(4, now - d.lt) / 1000
      d.vx = d.vx * 0.5 + ((p.x - d.lx) / dt) * 0.5
      d.vy = d.vy * 0.5 + ((p.y - d.ly) / dt) * 0.5
      d.lx = p.x
      d.ly = p.y
      d.lt = now
      d.e.x = Math.max(d.e.r, Math.min(world.width - d.e.r, p.x - d.ox))
      d.e.y = Math.max(d.e.r, Math.min(world.height - d.e.r, p.y - d.oy))
    } else {
      hoverId.current = world.hitTest(p.x, p.y)?.id ?? null
    }
    updateCursor()
  }

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (d && world.has(d.e)) {
      // 놓기 직전에 멈춰 있었다면 던지지 않음
      const still = performance.now() - d.lt > 80
      d.e.vx = still ? 0 : clamp(d.vx, MAX_THROW)
      d.e.vy = still ? 0 : clamp(d.vy, MAX_THROW)
      world.release(d.e)
    }
    updateCursor()
  }

  const onContextMenu = (ev: MouseEvent) => {
    ev.preventDefault()
    const p = local(ev)
    const e = world.hitTest(p.x, p.y)
    if (e) world.remove(e, true)
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => {
        pointer.current = null
        hoverId.current = null
      }}
      onContextMenu={onContextMenu}
    />
  )
}
