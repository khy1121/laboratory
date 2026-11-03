import { sfx } from '../audio/sfx'
import type { ReactionDef } from '../chem/types'
import { type FxSystem, rand } from './particles'

const FIRE = ['#fff3b0', '#ffd166', '#ff9f1c', '#ff5d2a']

export function explosion(fx: FxSystem, x: number, y: number, color: string, power = 1) {
  const p = power
  fx.flashScreen(color, 0.55 * p, 1.6)
  fx.addShake(18 * p)

  fx.glow(x, y, 40, 300 * p, 0.45, '#ffffff')
  fx.glow(x, y, 80, 420 * p, 1.0, color, 0.9)
  fx.burst('spark', x, y, 150 * p, { speed: [250, 950 * p], life: [0.35, 0.9], size: [1.5, 3.5], color: [color, '#ffffff', '#ffd27a'], drag: 2.4, gravity: 320 })
  fx.burst('flame', x, y, 60 * p, { speed: [40, 280 * p], life: [0.5, 1.1], size: [30, 70], size2: 8, color: FIRE, drag: 3, gravity: -80, jitter: 20 })
  fx.burst('ember', x, y, 70 * p, { speed: [100, 520 * p], life: [1, 2.2], size: [2, 5], color: ['#ffb347', color], drag: 1.6, gravity: 220 })
  fx.burst('debris', x, y, 24 * p, { speed: [200, 600], life: [0.8, 1.6], size: [3, 7], color: ['#c9ccd6', '#7d8597', color], drag: 1, gravity: 900 })
  fx.ring(x, y, '#ffffff', 10, 240 * p, 0.5, 14)
  fx.later(0.08, () => fx.ring(x, y, color, 10, 340 * p, 0.8, 8))
  fx.later(0.15, () =>
    fx.burst('smoke', x, y, 34 * p, { speed: [20, 140], life: [1.6, 3.2], size: [30, 50], size2: 130, color: ['#3b4252', '#4c566a', '#2e3440'], drag: 1.6, gravity: -40, jitter: 30 }),
  )
  sfx.boom(p)
}

function gasLabel(fx: FxSystem, x: number, y: number, gas: string) {
  fx.later(0.3, () => fx.text(x + rand(-20, 20), y - 30, `${gas}↑`, '#e7f5ff'))
}

/** 반응 연출을 재생하고, 생성물이 나타날 때까지의 지연(초)을 반환한다 */
export function playReactionFx(fx: FxSystem, r: ReactionDef, x: number, y: number): number {
  const p = r.power ?? 1
  const c = r.color

  switch (r.fx) {
    case 'explosion':
      explosion(fx, x, y, c, p)
      return 0.3

    case 'violent-water': {
      const dur = 1.5
      sfx.fizz(dur)
      sfx.crackle(dur, 0.5)
      fx.glow(x, y, 60, 120, dur, '#4dabf7', 0.35)
      fx.emit(x, y, dur, (f, em, dt, prog) => {
        // 물 위를 미친 듯이 돌아다니는 금속 덩어리
        const d = em.data
        d.retarget = (d.retarget ?? 0) - dt
        if (d.retarget <= 0) {
          d.tx = em.x + rand(-70, 70)
          d.ty = em.y + rand(-30, 30)
          d.retarget = rand(0.06, 0.18)
        }
        d.bx = (d.bx ?? em.x) + ((d.tx ?? em.x) - (d.bx ?? em.x)) * Math.min(1, dt * 14)
        d.by = (d.by ?? em.y) + ((d.ty ?? em.y) - (d.by ?? em.y)) * Math.min(1, dt * 14)
        const intensity = 0.5 + prog * 1.5
        f.glow(d.bx, d.by, 14, 26, 0.12, '#ffffff')
        f.glow(d.bx, d.by, 30 * intensity, 50 * intensity, 0.2, c, 0.8)
        f.burst('spark', d.bx, d.by, Math.ceil(3 * intensity), { speed: [120, 380], life: [0.2, 0.45], size: [1, 2.5], color: [c, '#ffffff'], gravity: 400 })
        if (Math.random() < 0.6) f.burst('bubble', d.bx, d.by, 1, { speed: [10, 40], angle: -Math.PI / 2, spread: 0.6, life: [0.6, 1.2], size: [3, 7], color: '#a5d8ff', gravity: -120, jitter: 12 })
        if (Math.random() < 0.35) f.burst('smoke', d.bx, d.by, 1, { speed: [20, 50], angle: -Math.PI / 2, spread: 0.4, life: [0.8, 1.4], size: [10, 18], size2: 50, color: '#dee2e6', gravity: -50 })
        f.addShake(1.5 * intensity * p)
      })
      fx.later(dur, () => explosion(fx, x, y, c, 0.85 * p))
      if (r.gas) gasLabel(fx, x, y, r.gas)
      return dur + 0.3
    }

    case 'pop':
      fx.flashScreen(c, 0.25, 3)
      fx.addShake(5)
      fx.glow(x, y, 30, 140, 0.35, c)
      fx.burst('spark', x, y, 40, { speed: [150, 420], life: [0.2, 0.5], size: [1, 2.5], color: [c, '#ffffff'], drag: 3 })
      fx.burst('flame', x, y, 14, { speed: [20, 90], life: [0.25, 0.5], size: [14, 26], size2: 4, color: FIRE, gravity: -100 })
      fx.ring(x, y, '#ffffff', 8, 110, 0.35, 6)
      sfx.pop()
      return 0.15

    case 'flash': {
      fx.flashScreen(c, Math.min(0.95, 0.75 * p), 0.9)
      fx.addShake(5 * p)
      fx.glow(x, y, 60, 520 * p, 1.1, '#ffffff')
      fx.glow(x, y, 30, 220 * p, 1.4, c)
      fx.burst('spark', x, y, 90 * p, { speed: [200, 700], life: [0.4, 1], size: [1.5, 3], color: ['#ffffff', c], drag: 2, gravity: 120 })
      fx.burst('debris', x, y, 18, { speed: [60, 220], life: [1, 1.8], size: [4, 7], color: '#f8f9fa', gravity: 500, drag: 1 })
      fx.ring(x, y, c, 10, 260 * p, 0.6, 10)
      fx.later(0.3, () =>
        fx.burst('smoke', x, y, 20, { speed: [15, 70], life: [1.5, 2.6], size: [20, 34], size2: 90, color: '#e9ecef', gravity: -35, drag: 1.2 }),
      )
      sfx.flash()
      return 0.5
    }

    case 'flame':
    case 'flame-test': {
      const dur = r.fx === 'flame-test' ? 2.2 : 1.6
      const base = r.fx === 'flame-test' ? [c, c, '#ffffff'] : [c, c]
      const top = r.fx === 'flame-test' ? [c] : FIRE
      sfx.whoosh(dur)
      fx.emit(x, y, dur, (f, em, _dt, prog) => {
        const k = Math.sin(prog * Math.PI) + 0.3
        f.burst('flame', em.x, em.y + 10, Math.ceil(4 * k), { speed: [60, 160], angle: -Math.PI / 2, spread: 0.25, life: [0.2, 0.4], size: [10, 20], size2: 4, color: base, gravity: -200, jitter: 10 })
        f.burst('flame', em.x, em.y, Math.ceil(3 * k), { speed: [90, 220], angle: -Math.PI / 2, spread: 0.3, life: [0.4, 0.8], size: [18, 34], size2: 2, color: top, gravity: -260, drag: 1, jitter: 14 })
        if (Math.random() < 0.4) f.burst('ember', em.x, em.y, 1, { speed: [80, 220], angle: -Math.PI / 2, spread: 0.6, life: [0.8, 1.5], size: [1.5, 3], color: top, gravity: -60 })
        if (Math.random() < 0.15) f.burst('smoke', em.x, em.y - 90, 1, { speed: [20, 50], angle: -Math.PI / 2, spread: 0.4, life: [1.2, 2], size: [14, 24], size2: 70, color: '#495057', gravity: -40 })
      })
      fx.glow(x, y - 20, 80, 160, dur, c, 0.5)
      return r.fx === 'flame-test' ? 0 : dur * 0.6
    }

    case 'fizz': {
      const dur = 1.7
      sfx.fizz(dur)
      fx.emit(x, y, dur, (f, em) => {
        f.burst('bubble', em.x, em.y + 10, 2, { speed: [30, 90], angle: -Math.PI / 2, spread: 0.5, life: [0.8, 1.6], size: [2, 7], color: '#c5f6fa', gravity: -160, jitter: 30 })
        if (Math.random() < 0.3) f.burst('spark', em.x, em.y, 1, { speed: [40, 120], life: [0.2, 0.4], size: [1, 2], color: c })
      })
      fx.glow(x, y, 40, 90, dur, c, 0.4)
      if (r.gas) gasLabel(fx, x, y, r.gas)
      return dur * 0.7
    }

    case 'smoke':
      fx.burst('smoke', x, y, 70, { speed: [30, 160], life: [2, 4], size: [16, 30], size2: 140, color: ['#f8f9fa', '#e9ecef', '#dee2e6'], drag: 1.3, gravity: -22, jitter: 20 })
      fx.ring(x, y, '#ffffff', 10, 160, 0.7, 4)
      fx.glow(x, y, 50, 160, 0.6, '#ffffff', 0.4)
      sfx.whoosh(1.4)
      return 0.6

    case 'neutralize': {
      const colors = ['#ff6bcb', c, '#ffffff']
      colors.forEach((col, i) => fx.later(i * 0.12, () => fx.ring(x, y, col, 10, 140 + i * 40, 0.8, 8)))
      fx.glow(x, y, 40, 200, 0.8, c, 0.8)
      fx.burst('ember', x, y, 50, { speed: [30, 160], life: [0.8, 1.6], size: [2, 4], color: colors, drag: 1.5, gravity: -30, jitter: 30 })
      sfx.chime()
      return 0.45
    }
  }
}

export function playBond(fx: FxSystem, x: number, y: number, color: string) {
  fx.ring(x, y, color, 8, 70, 0.45, 5)
  fx.glow(x, y, 30, 90, 0.35, color, 0.7)
  fx.burst('spark', x, y, 18, { speed: [80, 260], life: [0.2, 0.45], size: [1, 2], color: [color, '#ffffff'], drag: 3 })
  sfx.bond()
}

export function playFail(fx: FxSystem, x: number, y: number) {
  fx.burst('smoke', x, y, 8, { speed: [10, 50], life: [0.6, 1], size: [8, 14], size2: 30, color: '#868e96', gravity: -30 })
  fx.text(x, y - 20, '…', '#adb5bd', 0.9)
  sfx.fail()
}

export function playSpark(fx: FxSystem, x: number, y: number) {
  fx.glow(x, y, 20, 60, 0.25, '#ffb347')
  fx.burst('spark', x, y, 14, { speed: [100, 300], life: [0.15, 0.35], size: [1, 2], color: ['#ffd166', '#ffffff'], gravity: 300 })
  sfx.spark()
}

export function playPoof(fx: FxSystem, x: number, y: number) {
  fx.burst('smoke', x, y, 12, { speed: [20, 80], life: [0.5, 0.9], size: [8, 16], size2: 36, color: '#adb5bd', gravity: -30 })
  sfx.plop()
}

export function playSpawn(fx: FxSystem, x: number, y: number, color: string) {
  fx.ring(x, y, color, 4, 40, 0.3, 3)
  sfx.plop()
}

const CONFETTI = ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#da77f2', '#ffa94d', '#ffffff']

/** 미션 완료: 양쪽 아래에서 꽃가루 대포 + 가운데 빛 */
export function playCelebration(fx: FxSystem, w: number, h: number) {
  const floor = h - 80
  for (const [x, angle] of [
    [w * 0.08, -Math.PI / 2 + 0.45],
    [w * 0.92, -Math.PI / 2 - 0.45],
  ] as const) {
    fx.burst('debris', x, floor, 90, { speed: [500, 1100], angle, spread: 0.35, life: [2, 3.2], size: [5, 9], color: CONFETTI, gravity: 700, drag: 1.4 })
    fx.burst('spark', x, floor, 40, { speed: [400, 900], angle, spread: 0.3, life: [0.4, 0.8], size: [1.5, 3], color: CONFETTI, gravity: 400, drag: 2 })
  }
  fx.glow(w / 2, h * 0.4, 60, 360, 0.9, '#ffd43b', 0.5)
  fx.ring(w / 2, h * 0.4, '#ffd43b', 20, 300, 0.8, 6)
  fx.later(0.15, () => fx.ring(w / 2, h * 0.4, '#ffffff', 20, 400, 0.9, 4))
  sfx.fanfare()
}
