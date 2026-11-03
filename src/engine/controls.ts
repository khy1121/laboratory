import type { PointerEvent as ReactPointerEvent } from 'react'
import { sfx } from '../audio/sfx'
import { isMolecule } from '../chem/composition'
import type { MissionEvent } from '../chem/missions'
import { MOLECULES } from '../chem/molecules'
import { playCelebration } from '../fx/effects'
import { rand } from '../fx/particles'
import { useLabStore } from '../store/useLabStore'
import { benchRef, world } from './world'

function trackMission(ev: MissionEvent) {
  const s = useLabStore.getState()
  if (!s.recordMission(ev)) return
  // 반응 연출과 겹치지 않게 살짝 늦춰서 축하
  setTimeout(() => playCelebration(world.fx, world.width, world.height), 600)
  setTimeout(() => useLabStore.getState().dismissCelebration(), 3600)
}

/** 실험대 이벤트 → UI 상태(발견, 토스트, 반응 카드, 미션) 연결. 앱 시작 시 한 번 호출 */
export function connectWorldToStore() {
  const store = useLabStore
  sfx.muted = store.getState().muted
  const unsubMute = store.subscribe((s) => (sfx.muted = s.muted))

  const unsubWorld = world.on((e) => {
    const s = store.getState()
    switch (e.type) {
      case 'spawned':
        s.markSpawned()
        if (e.source !== 'palette' && isMolecule(e.species)) trackMission({ type: 'made', species: e.species, via: e.via ?? 'bond' })
        if (e.source !== 'palette' && isMolecule(e.species) && s.discoverMolecule(e.species)) {
          const m = MOLECULES[e.species]
          s.pushToast(`새 분자 발견! ${m.formula} ${m.name}`, 'discover')
          setTimeout(() => sfx.discover(), 250)
        }
        break
      case 'reaction': {
        const isNew = s.discoverReaction(e.reaction.id)
        s.showReaction(e.reaction, isNew)
        if (isNew) setTimeout(() => sfx.chime(), 900)
        trackMission({ type: 'reacted', id: e.reaction.id })
        break
      }
      case 'nothing':
        s.pushToast(
          e.reason === 'molecules'
            ? '완성된 분자끼리는 붙지 않아요. 불을 붙이거나 다른 물질과 만나게 해 보세요.'
            : '이 조합으로는 분자를 만들 수 없어요.',
          'muted',
        )
        break
      case 'ignited':
        trackMission({ type: 'ignited', count: e.count })
        break
      case 'ignite-empty':
        break
    }
  })

  return () => {
    unsubMute()
    unsubWorld()
  }
}

/** 팔레트 타일에서 실험대로 끌어다 놓기. 제자리 클릭이면 실험대 가운데쯤에 꺼낸다 */
export function startPaletteDrag(species: string, ev: ReactPointerEvent) {
  ev.preventDefault()
  const sx = ev.clientX
  const sy = ev.clientY
  let moved = false
  const { setPaletteDrag } = useLabStore.getState()
  setPaletteDrag({ species, x: sx, y: sy })

  const move = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) moved = true
    setPaletteDrag({ species, x: e.clientX, y: e.clientY })
  }
  const up = (e: PointerEvent) => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    setPaletteDrag(null)
    const canvas = benchRef.el
    if (!canvas) return
    const r = canvas.getBoundingClientRect()
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
    if (inside && moved) {
      const ent = world.spawn(species, e.clientX - r.left, e.clientY - r.top, 'palette')
      world.release(ent)
    } else if (!moved) {
      world.spawn(species, rand(r.width * 0.3, r.width * 0.7), rand(r.height * 0.25, r.height * 0.55), 'palette')
    }
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

export type DemoId = 'na-water' | 'h2-o2' | 'mg-burn'

export function runDemo(id: DemoId) {
  const { width: w, height: h } = world
  const cx = w / 2
  const cy = h * 0.45
  const s = useLabStore.getState()

  switch (id) {
    case 'na-water':
      world.spawn('H2O', cx, cy + 60, 'palette')
      world.after(0.7, () => {
        const na = world.spawn('Na', cx, cy - 160, 'palette', 0, 420)
        na.cooldown = 0
      })
      break
    case 'h2-o2':
      world.spawn('H2', cx - 40, cy, 'palette')
      world.spawn('H2', cx + 10, cy - 50, 'palette')
      world.spawn('O2', cx + 40, cy + 10, 'palette')
      s.setTool('fire')
      s.pushToast('🔥 점화기를 들었어요. 기체들을 클릭해 불을 붙이세요!')
      break
    case 'mg-burn':
      world.spawn('Mg', cx, cy, 'palette')
      s.setTool('fire')
      s.pushToast('🔥 마그네슘을 클릭해 불을 붙이세요. 눈부심 주의!')
      break
  }
}
