import clsx from 'clsx'
import type { CSSProperties } from 'react'
import { ELEMENT_LIST } from '../chem/elements'
import { currentMission } from '../chem/missions'
import { MOLECULES, REAGENTS } from '../chem/molecules'
import { startPaletteDrag } from '../engine/controls'
import { useLabStore } from '../store/useLabStore'
import s from './ElementTile.module.scss'

const CATEGORY_LABEL = {
  nonmetal: '비금속',
  alkali: '알칼리 금속',
  alkaline: '알칼리 토금속',
  halogen: '할로젠',
  noble: '비활성 기체',
  transition: '전이 금속',
} as const

const NO_MATERIALS: string[] = []

export function Sidebar() {
  const materials = useLabStore((st) => (st.mode === 'mission' ? currentMission(st.completedMissions)?.materials : undefined) ?? NO_MATERIALS)
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-lab-line bg-lab-panel/80 p-4 backdrop-blur max-md:h-44 max-md:border-t md:w-64 md:border-r">
      <section>
        <SectionTitle>원소</SectionTitle>
        <div className="grid grid-cols-4 gap-2 max-md:grid-cols-8">
          {ELEMENT_LIST.map((el) => (
            <button
              key={el.symbol}
              type="button"
              className={clsx(s.tile, materials.includes(el.symbol) && s.highlight)}
              style={{ '--c': el.color } as CSSProperties}
              title={`${el.name} · ${CATEGORY_LABEL[el.category]}\n${el.description}`}
              onPointerDown={(e) => startPaletteDrag(el.symbol, e)}
            >
              <span className={s.number}>{el.number}</span>
              <span className={s.symbol}>{el.symbol}</span>
              <span className={s.name}>{el.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>시약</SectionTitle>
        <div className="grid grid-cols-1 gap-2 max-md:grid-cols-4">
          {REAGENTS.map((id) => {
            const m = MOLECULES[id]
            return (
              <button
                key={id}
                type="button"
                className={clsx(s.tile, s.reagent, materials.includes(id) && s.highlight)}
                style={{ '--c': '#5ce1ff' } as CSSProperties}
                title={m.description}
                onPointerDown={(e) => startPaletteDrag(id, e)}
              >
                <span className={s.symbol}>{m.formula}</span>
                <span className={s.name}>{m.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      <p className="mt-auto text-[11px] leading-relaxed text-slate-500 max-md:hidden">
        끌어다 놓기 · 클릭하면 실험대에 꺼내기
        <br />
        원자끼리 겹쳐 놓으면 결합 · 우클릭으로 지우기
      </p>
    </aside>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">{children}</h2>
}
