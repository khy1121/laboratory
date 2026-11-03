import clsx from 'clsx'
import { Lock, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { MOLECULE_LIST } from '../chem/molecules'
import { REACTION_LIST } from '../chem/reactions'
import { useLabStore } from '../store/useLabStore'

const STATE_LABEL = { gas: '기체', liquid: '액체', solid: '고체', aqueous: '수용액' } as const

export function Codex() {
  const open = useLabStore((s) => s.codexOpen)
  const setOpen = useLabStore((s) => s.setCodexOpen)
  const molecules = useLabStore((s) => s.discoveredMolecules)
  const reactions = useLabStore((s) => s.discoveredReactions)
  const resetProgress = useLabStore((s) => s.resetProgress)
  const [tab, setTab] = useState<'molecules' | 'reactions'>('molecules')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="flex max-h-[85dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-lab-line bg-lab-panel shadow-2xl"
            initial={{ y: 30, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-lab-line px-5 py-4">
              <h2 className="text-lg font-extrabold">발견 도감</h2>
              <div className="ml-4 flex rounded-lg bg-black/30 p-1">
                {(['molecules', 'reactions'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={clsx('rounded-md px-3 py-1 text-sm font-semibold transition', tab === t ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200')}
                  >
                    {t === 'molecules' ? `분자 ${molecules.length}/${MOLECULE_LIST.length}` : `반응 ${reactions.length}/${REACTION_LIST.length}`}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/5" aria-label="닫기">
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {tab === 'molecules' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {MOLECULE_LIST.map((m) => {
                    const found = molecules.includes(m.id)
                    return (
                      <div key={m.id} className={clsx('rounded-xl border p-3', found ? 'border-lab-cyan/30 bg-lab-cyan/5' : 'border-lab-line bg-black/20')}>
                        {found ? (
                          <>
                            <div className="text-xl font-extrabold text-lab-cyan">{m.formula}</div>
                            <div className="text-sm font-semibold">{m.name}</div>
                            <div className="mt-1 text-[11px] text-slate-500">{STATE_LABEL[m.state]}</div>
                            <p className="mt-1.5 text-[11.5px] leading-snug text-slate-400">{m.description}</p>
                          </>
                        ) : (
                          <div className="flex h-full min-h-20 flex-col items-center justify-center gap-1 text-slate-600">
                            <Lock className="size-4" />
                            <span className="text-sm font-bold">???</span>
                            <span className="text-[10px]">원자 {Object.values(m.composition).reduce((a, b) => a + b, 0)}개</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {REACTION_LIST.map((r) => {
                    const found = reactions.includes(r.id)
                    return (
                      <div key={r.id} className={clsx('rounded-xl border p-3', found ? 'bg-white/[0.03]' : 'border-lab-line bg-black/20')} style={found ? { borderColor: r.color + '55' } : undefined}>
                        <div className="flex items-center gap-2">
                          {!found && <Lock className="size-3.5 text-slate-600" />}
                          <span className={clsx('font-bold', !found && 'text-slate-500')}>{found ? r.name : '???'}</span>
                          <span className="ml-auto text-[10px] text-slate-500">{r.trigger === 'fire' ? '🔥 점화' : '⚡ 접촉'}</span>
                        </div>
                        <p className="mt-1 font-mono text-[12.5px]" style={{ color: found ? r.color : undefined }}>
                          {found ? r.equation : <span className="font-sans text-slate-500">힌트: {r.hint}</span>}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-lab-line px-5 py-3 text-right">
              <button
                type="button"
                onClick={() => confirm('발견 기록을 모두 지울까요?') && resetProgress()}
                className="text-xs text-slate-500 hover:text-red-300"
              >
                기록 초기화
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
