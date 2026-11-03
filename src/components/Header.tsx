import clsx from 'clsx'
import { BookOpen, FlaskConical, Target, Volume2, VolumeX, Wand2 } from 'lucide-react'
import { motion } from 'motion/react'
import { MOLECULE_LIST } from '../chem/molecules'
import { REACTION_LIST } from '../chem/reactions'
import { type Mode, useLabStore } from '../store/useLabStore'

export function Header() {
  const molecules = useLabStore((s) => s.discoveredMolecules.length)
  const reactions = useLabStore((s) => s.discoveredReactions.length)
  const muted = useLabStore((s) => s.muted)
  const toggleMute = useLabStore((s) => s.toggleMute)
  const setCodexOpen = useLabStore((s) => s.setCodexOpen)

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-4 border-b border-lab-line bg-lab-panel/90 px-4 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-lab-cyan to-indigo-500 shadow-[0_0_20px_-4px] shadow-lab-cyan">
          <FlaskConical className="size-4.5 text-lab-bg" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <h1 className="text-[15px] font-extrabold tracking-tight">CHEM LAB</h1>
          <p className="text-[11px] text-slate-400 max-sm:hidden">가상 화학 실험실</p>
        </div>
      </div>

      <ModeToggle />

      <div className="ml-auto flex items-center gap-4">
        <Progress label="분자" value={molecules} total={MOLECULE_LIST.length} color="bg-lab-cyan" />
        <Progress label="반응" value={reactions} total={REACTION_LIST.length} color="bg-lab-amber" />
        <button
          type="button"
          onClick={() => setCodexOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-lab-line px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-lab-cyan/60 hover:bg-lab-cyan/10"
        >
          <BookOpen className="size-4" />
          <span className="max-sm:hidden">도감</span>
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? '소리 켜기' : '소리 끄기'}
          className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-slate-100"
        >
          {muted ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
        </button>
      </div>
    </header>
  )
}

const MODES: { id: Mode; label: string; icon: typeof Target }[] = [
  { id: 'free', label: '자유 실험', icon: Wand2 },
  { id: 'mission', label: '미션', icon: Target },
]

function ModeToggle() {
  const mode = useLabStore((s) => s.mode)
  const setMode = useLabStore((s) => s.setMode)
  return (
    <div className="ml-2 flex rounded-xl border border-lab-line bg-black/30 p-1">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setMode(m.id)}
          className={clsx(
            'relative flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-semibold transition-colors',
            mode === m.id ? (m.id === 'mission' ? 'text-amber-100' : 'text-cyan-50') : 'text-slate-400 hover:text-slate-200',
          )}
        >
          {mode === m.id && (
            <motion.span
              layoutId="mode-pill"
              className={clsx('absolute inset-0 rounded-lg', m.id === 'mission' ? 'bg-lab-amber/20 ring-1 ring-lab-amber/50' : 'bg-lab-cyan/15 ring-1 ring-lab-cyan/40')}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <m.icon className="relative size-3.5" />
          <span className="relative max-sm:hidden">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

function Progress({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return (
    <div className="w-28 max-md:hidden">
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold tabular-nums text-slate-200">
          {value}/{total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color} transition-[width] duration-700`} style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}
