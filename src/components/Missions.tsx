import clsx from 'clsx'
import { Check, ChevronDown, Lightbulb, ListChecks, Lock, RotateCcw, Trophy, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useState } from 'react'
import { isAtom } from '../chem/composition'
import { currentMission, EMPTY_PROGRESS, goalTarget, MISSION_LIST, MISSIONS } from '../chem/missions'
import { MOLECULES } from '../chem/molecules'
import { useLabStore } from '../store/useLabStore'

const materialLabel = (s: string) => (isAtom(s) ? s : MOLECULES[s].formula)

/** 실험대 왼쪽 위의 현재 미션 카드 */
export function MissionHUD() {
  const mode = useLabStore((s) => s.mode)
  const completed = useLabStore((s) => s.completedMissions)
  const progress = useLabStore((s) => s.missionProgress)
  const celebrating = useLabStore((s) => s.celebrating)
  const setListOpen = useLabStore((s) => s.setMissionListOpen)
  const [hintOpen, setHintOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  if (mode !== 'mission') return null
  const mission = currentMission(completed)
  const index = mission ? MISSION_LIST.indexOf(mission) : MISSION_LIST.length

  return (
    <div className="pointer-events-none absolute top-4 left-4 z-10 w-[min(320px,calc(100%-2rem))]">
      <motion.div
        layout
        className="pointer-events-auto overflow-hidden rounded-2xl border border-lab-amber/30 bg-lab-panel/90 shadow-2xl shadow-black/60 backdrop-blur-md"
      >
        <div className="flex items-center gap-2 border-b border-lab-line/70 px-4 py-2.5">
          <span className="text-[11px] font-extrabold tracking-[0.18em] text-lab-amber">
            MISSION {Math.min(index + 1, MISSION_LIST.length)}/{MISSION_LIST.length}
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            <IconButton label="미션 목록" onClick={() => setListOpen(true)}>
              <ListChecks className="size-4" />
            </IconButton>
            <IconButton label={collapsed ? '펼치기' : '접기'} onClick={() => setCollapsed(!collapsed)}>
              <ChevronDown className={clsx('size-4 transition-transform', collapsed && '-rotate-90')} />
            </IconButton>
          </div>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {!collapsed && (
            <motion.div
              key={mission?.id ?? 'done'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="p-4"
            >
              {mission ? (
                <>
                  <h3 className="text-base font-extrabold">{mission.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-300">{mission.description}</p>
                  <ProgressBar value={(progress[mission.id] ?? EMPTY_PROGRESS).count} total={goalTarget(mission.goal)} done={celebrating === mission.id} />

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {mission.materials.map((m) => (
                      <span key={m} className="rounded-md bg-lab-amber/10 px-1.5 py-0.5 text-[11px] font-bold text-amber-200">
                        {materialLabel(m)}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setHintOpen(!hintOpen)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-200"
                  >
                    <Lightbulb className="size-3.5" />
                    {hintOpen ? '힌트 숨기기' : '힌트 보기'}
                  </button>
                  <AnimatePresence>
                    {hintOpen && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden text-[12.5px] leading-relaxed text-amber-100/80"
                      >
                        <span className="mt-1.5 block">{mission.hint}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="text-center">
                  <Trophy className="mx-auto size-8 text-lab-amber" />
                  <h3 className="mt-2 text-base font-extrabold">모든 미션 완료!</h3>
                  <p className="mt-1 text-[13px] text-slate-400">당신은 이제 실험실의 주인입니다.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function ProgressBar({ value, total, done }: { value: number; total: number; done: boolean }) {
  const pct = Math.min(100, (value / total) * 100)
  return (
    <div className="mt-3 flex items-center gap-2.5">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={clsx('h-full rounded-full', done ? 'bg-emerald-400' : 'bg-gradient-to-r from-lab-amber to-orange-400')}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums text-slate-300">
        {Math.min(value, total)}/{total}
      </span>
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-slate-100">
      {children}
    </button>
  )
}

/** 미션 완료 배너 */
export function MissionComplete() {
  const celebrating = useLabStore((s) => s.celebrating)
  const mission = celebrating ? MISSIONS[celebrating] : null

  return (
    <AnimatePresence>
      {mission && (
        <motion.div
          key={mission.id}
          className="pointer-events-none absolute inset-x-0 top-[32%] z-20 flex justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 2.2, opacity: 0, filter: 'blur(12px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 18 }}
              className="bg-gradient-to-b from-white via-amber-200 to-lab-amber bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow-[0_0_30px_rgba(255,182,39,0.5)] md:text-6xl"
            >
              MISSION COMPLETE
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-3 text-lg font-bold text-amber-100"
            >
              ✓ {mission.title}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** 전체 미션 목록 */
export function MissionList() {
  const open = useLabStore((s) => s.missionListOpen)
  const setOpen = useLabStore((s) => s.setMissionListOpen)
  const completed = useLabStore((s) => s.completedMissions)
  const progress = useLabStore((s) => s.missionProgress)
  const resetMissions = useLabStore((s) => s.resetMissions)
  const current = currentMission(completed)

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
            className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-lab-line bg-lab-panel shadow-2xl"
            initial={{ y: 30, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-lab-line px-5 py-4">
              <h2 className="text-lg font-extrabold">미션</h2>
              <span className="text-sm text-slate-400">
                {completed.length}/{MISSION_LIST.length} 완료
              </span>
              <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/5" aria-label="닫기">
                <X className="size-5" />
              </button>
            </div>

            <ol className="space-y-2 overflow-y-auto p-4">
              {MISSION_LIST.map((m, i) => {
                const done = completed.includes(m.id)
                const isCurrent = current?.id === m.id
                const p = progress[m.id] ?? EMPTY_PROGRESS
                return (
                  <li
                    key={m.id}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5',
                      done && 'border-emerald-500/25 bg-emerald-500/5',
                      isCurrent && 'border-lab-amber/40 bg-lab-amber/5',
                      !done && !isCurrent && 'border-lab-line bg-black/20 opacity-60',
                    )}
                  >
                    <span
                      className={clsx(
                        'grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold',
                        done ? 'bg-emerald-400 text-lab-bg' : isCurrent ? 'bg-lab-amber text-lab-bg' : 'bg-white/5 text-slate-500',
                      )}
                    >
                      {done ? <Check className="size-4" strokeWidth={3} /> : isCurrent ? i + 1 : <Lock className="size-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">{done || isCurrent ? m.title : '???'}</div>
                      <div className="truncate text-xs text-slate-400">{done || isCurrent ? m.description : '이전 미션을 완료하면 열립니다'}</div>
                    </div>
                    {isCurrent && (
                      <span className="text-xs font-bold tabular-nums text-amber-200">
                        {p.count}/{goalTarget(m.goal)}
                      </span>
                    )}
                  </li>
                )
              })}
            </ol>

            <div className="border-t border-lab-line px-5 py-3 text-right">
              <button
                type="button"
                onClick={() => confirm('미션 진행을 처음부터 다시 할까요?') && resetMissions()}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-300"
              >
                <RotateCcw className="size-3.5" /> 처음부터
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
