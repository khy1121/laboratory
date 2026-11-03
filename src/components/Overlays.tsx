import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { isAtom } from '../chem/composition'
import { ELEMENTS } from '../chem/elements'
import { MOLECULES } from '../chem/molecules'
import { type DemoId, runDemo } from '../engine/controls'
import { useLabStore } from '../store/useLabStore'

export function Toasts() {
  const toasts = useLabStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed top-18 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={clsx(
              'rounded-full border px-4 py-2 text-sm font-semibold shadow-xl backdrop-blur-md',
              t.tone === 'discover' && 'border-lab-amber/40 bg-lab-amber/15 text-amber-100 shadow-lab-amber/20',
              t.tone === 'info' && 'border-lab-cyan/30 bg-lab-panel/90 text-cyan-50',
              t.tone === 'muted' && 'border-lab-line bg-lab-panel/90 text-slate-300',
            )}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function DragGhost() {
  const drag = useLabStore((s) => s.paletteDrag)
  if (!drag) return null
  const color = isAtom(drag.species) ? ELEMENTS[drag.species].color : '#5ce1ff'
  const label = isAtom(drag.species) ? drag.species : MOLECULES[drag.species].formula
  return (
    <div
      className="pointer-events-none fixed z-50 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-extrabold text-white"
      style={{
        left: drag.x,
        top: drag.y,
        background: `radial-gradient(circle at 35% 30%, #ffffffaa, ${color} 45%, #000000aa)`,
        boxShadow: `0 0 24px ${color}`,
      }}
    >
      {label}
    </div>
  )
}

const DEMOS: { id: DemoId; emoji: string; label: string }[] = [
  { id: 'na-water', emoji: '💥', label: '나트륨 + 물' },
  { id: 'h2-o2', emoji: '🎈', label: '수소 폭발' },
  { id: 'mg-burn', emoji: '✨', label: '마그네슘 연소' },
]

export function EmptyHint() {
  const hasSpawned = useLabStore((s) => s.hasSpawned)
  return (
    <AnimatePresence>
      {!hasSpawned && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[5] grid place-items-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
        >
          <div className="text-center">
            <h2 className="bg-gradient-to-r from-lab-cyan via-white to-lab-amber bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
              실험을 시작해 볼까요?
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              왼쪽에서 원소를 끌어다 놓고, 겹쳐서 분자를 만들어 보세요.
              <br />
              점화기 🔥 로 불을 붙이면 무슨 일이 일어날까요?
            </p>
            <div className="pointer-events-auto mt-6 flex flex-wrap justify-center gap-2">
              {DEMOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => runDemo(d.id)}
                  className="rounded-full border border-lab-line bg-lab-panel/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-lab-amber/60 hover:bg-lab-amber/10"
                >
                  {d.emoji} {d.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
