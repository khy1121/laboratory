import { useEffect } from 'react'
import { Bench } from './components/Bench'
import { Codex } from './components/Codex'
import { Header } from './components/Header'
import { InfoCard } from './components/InfoCard'
import { MissionComplete, MissionHUD, MissionList } from './components/Missions'
import { DragGhost, EmptyHint, Toasts } from './components/Overlays'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { connectWorldToStore } from './engine/controls'
import { useLabStore } from './store/useLabStore'

export default function App() {
  useEffect(() => connectWorldToStore(), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useLabStore.getState()
      if (e.key === '1') s.setTool('hand')
      else if (e.key === '2' || e.key === 'f') s.setTool(s.tool === 'fire' ? 'hand' : 'fire')
      else if (e.key === 'Escape') {
        if (s.missionListOpen) s.setMissionListOpen(false)
        else if (s.codexOpen) s.setCodexOpen(false)
        else s.setTool('hand')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-lab-bg text-slate-100">
      <Header />
      <div id="app-shake" className="flex min-h-0 flex-1 max-md:flex-col-reverse">
        <Sidebar />
        <main className="relative min-h-0 min-w-0 flex-1">
          <Bench />
          <EmptyHint />
          <MissionHUD />
          <InfoCard />
          <MissionComplete />
          <Toolbar />
        </main>
      </div>
      <Toasts />
      <DragGhost />
      <Codex />
      <MissionList />
    </div>
  )
}
