import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  applyMissionEvent,
  currentMission,
  EMPTY_PROGRESS,
  isComplete,
  type MissionDef,
  type MissionEvent,
  type MissionProgress,
} from '../chem/missions'
import type { ReactionDef } from '../chem/types'

export type Tool = 'hand' | 'fire'
export type Mode = 'free' | 'mission'

export interface Toast {
  id: number
  text: string
  tone: 'info' | 'discover' | 'muted'
}

interface LabState {
  tool: Tool
  muted: boolean
  discoveredMolecules: string[]
  discoveredReactions: string[]
  activeReaction: { reaction: ReactionDef; isNew: boolean } | null
  toasts: Toast[]
  codexOpen: boolean
  hasSpawned: boolean
  paletteDrag: { species: string; x: number; y: number } | null
  mode: Mode
  completedMissions: string[]
  missionProgress: Record<string, MissionProgress>
  /** 방금 완료한 미션 (축하 배너 표시용) */
  celebrating: string | null
  missionListOpen: boolean

  setTool: (t: Tool) => void
  toggleMute: () => void
  /** 처음 발견했으면 true */
  discoverMolecule: (id: string) => boolean
  discoverReaction: (id: string) => boolean
  showReaction: (reaction: ReactionDef, isNew: boolean) => void
  closeReaction: () => void
  pushToast: (text: string, tone?: Toast['tone']) => void
  removeToast: (id: number) => void
  setCodexOpen: (open: boolean) => void
  markSpawned: () => void
  setPaletteDrag: (d: LabState['paletteDrag']) => void
  resetProgress: () => void
  setMode: (m: Mode) => void
  /** 미션 모드일 때 현재 미션에 이벤트를 반영. 방금 완료했으면 그 미션을 반환 */
  recordMission: (ev: MissionEvent) => MissionDef | null
  dismissCelebration: () => void
  setMissionListOpen: (open: boolean) => void
  resetMissions: () => void
}

let toastId = 1

export const useLabStore = create<LabState>()(
  persist(
    (set, get) => ({
      tool: 'hand',
      muted: false,
      discoveredMolecules: [],
      discoveredReactions: [],
      activeReaction: null,
      toasts: [],
      codexOpen: false,
      hasSpawned: false,
      paletteDrag: null,
      mode: 'free',
      completedMissions: [],
      missionProgress: {},
      celebrating: null,
      missionListOpen: false,

      setTool: (tool) => set({ tool }),
      toggleMute: () => set({ muted: !get().muted }),
      discoverMolecule: (id) => {
        if (get().discoveredMolecules.includes(id)) return false
        set({ discoveredMolecules: [...get().discoveredMolecules, id] })
        return true
      },
      discoverReaction: (id) => {
        if (get().discoveredReactions.includes(id)) return false
        set({ discoveredReactions: [...get().discoveredReactions, id] })
        return true
      },
      showReaction: (reaction, isNew) => set({ activeReaction: { reaction, isNew } }),
      closeReaction: () => set({ activeReaction: null }),
      pushToast: (text, tone = 'info') => {
        const id = toastId++
        set({ toasts: [...get().toasts.slice(-3), { id, text, tone }] })
        setTimeout(() => get().removeToast(id), 2800)
      },
      removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
      setCodexOpen: (codexOpen) => set({ codexOpen }),
      markSpawned: () => {
        if (!get().hasSpawned) set({ hasSpawned: true })
      },
      setPaletteDrag: (paletteDrag) => set({ paletteDrag }),
      resetProgress: () => set({ discoveredMolecules: [], discoveredReactions: [] }),
      setMode: (mode) => set({ mode }),
      recordMission: (ev) => {
        const { mode, completedMissions, missionProgress } = get()
        if (mode !== 'mission') return null
        const m = currentMission(completedMissions)
        if (!m) return null
        const prev = missionProgress[m.id] ?? EMPTY_PROGRESS
        const next = applyMissionEvent(m.goal, prev, ev)
        if (next === prev) return null
        const progress = { ...missionProgress, [m.id]: next }
        if (!isComplete(m.goal, next)) {
          set({ missionProgress: progress })
          return null
        }
        set({ missionProgress: progress, completedMissions: [...completedMissions, m.id], celebrating: m.id })
        return m
      },
      dismissCelebration: () => set({ celebrating: null }),
      setMissionListOpen: (missionListOpen) => set({ missionListOpen }),
      resetMissions: () => set({ completedMissions: [], missionProgress: {} }),
    }),
    {
      name: 'chem-lab',
      partialize: (s) => ({
        muted: s.muted,
        discoveredMolecules: s.discoveredMolecules,
        discoveredReactions: s.discoveredReactions,
        mode: s.mode,
        completedMissions: s.completedMissions,
        missionProgress: s.missionProgress,
      }),
    },
  ),
)
