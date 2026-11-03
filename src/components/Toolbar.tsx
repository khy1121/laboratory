import clsx from 'clsx'
import { Flame, Hand, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { world } from '../engine/world'
import { type Tool, useLabStore } from '../store/useLabStore'

const TOOLS: { id: Tool; label: string; key: string; icon: typeof Hand }[] = [
  { id: 'hand', label: '손', key: '1', icon: Hand },
  { id: 'fire', label: '점화기', key: '2', icon: Flame },
]

export function Toolbar() {
  const tool = useLabStore((s) => s.tool)
  const setTool = useLabStore((s) => s.setTool)

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-lab-line bg-lab-panel/85 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-md">
      {TOOLS.map((t) => {
        const active = tool === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTool(t.id)}
            className={clsx(
              'relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
              active ? (t.id === 'fire' ? 'text-orange-200' : 'text-cyan-100') : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {active && (
              <motion.span
                layoutId="tool-pill"
                className={clsx(
                  'absolute inset-0 rounded-xl',
                  t.id === 'fire' ? 'bg-orange-500/20 ring-1 ring-orange-400/50' : 'bg-lab-cyan/15 ring-1 ring-lab-cyan/40',
                )}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <t.icon className="relative size-4" />
            <span className="relative">{t.label}</span>
            <kbd className="relative rounded bg-white/5 px-1 text-[10px] text-slate-500">{t.key}</kbd>
          </button>
        )
      })}
      <div className="mx-1 h-6 w-px bg-lab-line" />
      <button
        type="button"
        onClick={() => world.clear()}
        className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 className="size-4" />
        비우기
      </button>
    </div>
  )
}
