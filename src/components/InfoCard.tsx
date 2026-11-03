import { Flame, Sparkles, TriangleAlert, X, Zap } from 'lucide-react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useLabStore } from '../store/useLabStore'

export function InfoCard() {
  const active = useLabStore((s) => s.activeReaction)
  const close = useLabStore((s) => s.closeReaction)
  // 미션 모드에서는 왼쪽 위 미션 카드와 겹치지 않게 아래로
  const mission = useLabStore((s) => s.mode === 'mission')

  return (
    <div className={clsx('pointer-events-none absolute right-4 z-10 w-[min(340px,calc(100%-2rem))]', mission ? 'bottom-20' : 'top-4')}>
      <AnimatePresence mode="popLayout">
        {active && (
          <motion.article
            key={active.reaction.id + active.isNew}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-lab-line bg-lab-panel/90 shadow-2xl shadow-black/60 backdrop-blur-md"
            style={{ boxShadow: `0 0 0 1px ${active.reaction.color}22, 0 20px 50px -20px ${active.reaction.color}66` }}
          >
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${active.reaction.color}, transparent)` }} />
            <div className="p-4">
              <div className="mb-2 flex items-start gap-2">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-wider text-slate-400">
                    {active.reaction.trigger === 'fire' ? <Flame className="size-3.5" /> : <Zap className="size-3.5" />}
                    {active.reaction.trigger === 'fire' ? '점화 반응' : '접촉 반응'}
                    {active.isNew && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.25, type: 'spring' }}
                        className="flex items-center gap-1 rounded-full bg-lab-amber/15 px-2 py-0.5 text-lab-amber"
                      >
                        <Sparkles className="size-3" /> 새 발견!
                      </motion.span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold">{active.reaction.name}</h3>
                </div>
                <button type="button" onClick={close} className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-slate-200" aria-label="닫기">
                  <X className="size-4" />
                </button>
              </div>

              <p className="mb-3 rounded-lg bg-black/30 px-3 py-2 text-center font-mono text-[15px] font-semibold tracking-wide" style={{ color: active.reaction.color }}>
                {active.reaction.equation}
              </p>
              <p className="text-[13px] leading-relaxed text-slate-300">{active.reaction.description}</p>

              {active.reaction.warning && (
                <p className="mt-3 flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[12px] leading-relaxed text-amber-200">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {active.reaction.warning}
                </p>
              )}
            </div>
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  )
}
