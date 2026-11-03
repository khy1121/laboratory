import { describe, expect, it } from 'vitest'
import { compEquals, formatFormula, speciesComposition } from './composition'
import { ELEMENTS } from './elements'
import { MOLECULE_LIST, MOLECULES } from './molecules'
import { combine, findContactReaction, matchFireReactions } from './reactor'
import { applyMissionEvent, EMPTY_PROGRESS, isComplete, MISSION_LIST, type MissionGoal } from './missions'
import { REACTION_LIST } from './reactions'

const atom = (s: string) => ({ [s]: 1 })

describe('combine', () => {
  it('H + H → H₂', () => {
    expect(combine(atom('H'), atom('H'), false)).toEqual({ kind: 'molecule', id: 'H2' })
  })

  it('H₂ + O → H₂O', () => {
    expect(combine({ H: 2 }, atom('O'), false)).toEqual({ kind: 'molecule', id: 'H2O' })
  })

  it('H + O → 미완성 덩어리', () => {
    expect(combine(atom('H'), atom('O'), false)).toEqual({ kind: 'cluster', comp: { H: 1, O: 1 } })
  })

  it('완성된 분자끼리는 결합하지 않음', () => {
    expect(combine({ H: 2 }, { O: 2 }, true)).toBeNull()
  })

  it('어떤 분자에도 속하지 않는 조합은 실패', () => {
    expect(combine(atom('Na'), atom('K'), false)).toBeNull()
  })
})

describe('reactions', () => {
  it('Na가 물에 닿으면 반응', () => {
    expect(findContactReaction('Na', 'H2O')?.id).toBe('na-water')
    expect(findContactReaction('H2O', 'Na')?.id).toBe('na-water')
  })

  it('반응하지 않는 조합', () => {
    expect(findContactReaction('H2O', 'O2')).toBeUndefined()
  })

  it('점화: H₂ + O₂가 단독 H₂ 연소보다 우선', () => {
    const pool = [{ species: 'H2' }, { species: 'O2' }, { species: 'H2' }]
    const ids = matchFireReactions(pool).map((m) => m.reaction.id)
    expect(ids).toEqual(['h2-o2', 'h2-pop'])
  })

  it('모든 반응의 종이 정의되어 있음', () => {
    for (const r of REACTION_LIST) {
      for (const s of [...Object.keys(r.reactants), ...Object.keys(r.products)]) {
        expect(s in ELEMENTS || s in MOLECULES, `${r.id}: ${s}`).toBe(true)
      }
    }
  })

  it('분자 조성이 겹치지 않음', () => {
    for (const a of MOLECULE_LIST)
      for (const b of MOLECULE_LIST)
        if (a !== b) expect(compEquals(a.composition, b.composition)).toBe(false)
  })

  it('분자 구조의 원자 목록이 조성과 일치하고 결합 인덱스가 유효함', () => {
    for (const m of MOLECULE_LIST) {
      const counted: Record<string, number> = {}
      for (const [el] of m.structure.atoms) counted[el] = (counted[el] ?? 0) + 1
      expect(counted, m.id).toEqual(m.composition)
      for (const [a, b] of m.structure.bonds) {
        expect(a, m.id).toBeLessThan(m.structure.atoms.length)
        expect(b, m.id).toBeLessThan(m.structure.atoms.length)
        expect(a, m.id).not.toBe(b)
      }
      // 모든 원자가 결합으로 이어져 있음
      const linked = new Set(m.structure.bonds.flatMap(([a, b]) => [a, b]))
      expect(linked.size, m.id).toBe(m.structure.atoms.length)
    }
  })

  it('비활성 기체는 어떤 분자에도 들어가지 않음', () => {
    for (const m of MOLECULE_LIST) for (const el of Object.keys(m.composition)) expect(ELEMENTS[el].category, `${m.id}: ${el}`).not.toBe('noble')
    expect(combine(atom('He'), atom('H'), false)).toBeNull()
  })

  it('새 접촉 반응: Li/Ca/CaO + 물, H₂ + F₂', () => {
    expect(findContactReaction('Li', 'H2O')?.id).toBe('li-water')
    expect(findContactReaction('Ca', 'H2O')?.id).toBe('ca-water')
    expect(findContactReaction('CaO', 'H2O')?.id).toBe('cao-water')
    expect(findContactReaction('F2', 'H2')?.id).toBe('h2-f2')
  })

  it('점화: Fe + S가 단독 Fe·S 연소보다 우선', () => {
    const ids = matchFireReactions([{ species: 'Fe' }, { species: 'S' }, { species: 'S' }]).map((m) => m.reaction.id)
    expect(ids).toEqual(['fe-s', 's-burn'])
  })
})

describe('formatFormula', () => {
  it('금속 먼저, 산소 마지막', () => {
    expect(formatFormula(speciesComposition('NaOH'))).toBe('NaHO')
    expect(formatFormula({ H: 2, O: 1 })).toBe('H₂O')
  })
})

describe('missions', () => {
  it('make: 같은 분자를 만든 횟수를 센다', () => {
    const g: MissionGoal = { type: 'make', species: 'H2O', count: 2 }
    let p = applyMissionEvent(g, EMPTY_PROGRESS, { type: 'made', species: 'H2O', via: 'bond' })
    p = applyMissionEvent(g, p, { type: 'made', species: 'H2', via: 'bond' })
    expect(isComplete(g, p)).toBe(false)
    p = applyMissionEvent(g, p, { type: 'made', species: 'H2O', via: 'h2-pop' })
    expect(isComplete(g, p)).toBe(true)
  })

  it('make-ways: 같은 방법은 한 번만 인정', () => {
    const g: MissionGoal = { type: 'make-ways', species: 'NaCl', ways: ['bond', 'na-cl2'] }
    let p = applyMissionEvent(g, EMPTY_PROGRESS, { type: 'made', species: 'NaCl', via: 'bond' })
    p = applyMissionEvent(g, p, { type: 'made', species: 'NaCl', via: 'bond' })
    expect(p.count).toBe(1)
    p = applyMissionEvent(g, p, { type: 'made', species: 'NaCl', via: 'na-cl2' })
    expect(isComplete(g, p)).toBe(true)
  })

  it('chain: 한 번의 점화에서 최대 반응 수', () => {
    const g: MissionGoal = { type: 'chain', count: 3 }
    const p = applyMissionEvent(g, EMPTY_PROGRESS, { type: 'ignited', count: 2 })
    expect(isComplete(g, p)).toBe(false)
    expect(isComplete(g, applyMissionEvent(g, p, { type: 'ignited', count: 3 }))).toBe(true)
  })

  it('미션이 참조하는 반응·재료가 모두 존재', () => {
    for (const m of MISSION_LIST) {
      for (const s of m.materials) expect(s in ELEMENTS || s in MOLECULES, `${m.id}: ${s}`).toBe(true)
      const g = m.goal
      const ids = g.type === 'react' || g.type === 'react-all' ? g.reactions : g.type === 'make-ways' ? g.ways.filter((w) => w !== 'bond') : []
      for (const id of ids) expect(REACTION_LIST.some((r) => r.id === id), `${m.id}: ${id}`).toBe(true)
    }
  })
})
