import { addComp, compEquals, isSubset } from './composition'
import { MOLECULE_LIST } from './molecules'
import { CONTACT_REACTIONS, FIRE_REACTIONS } from './reactions'
import type { Composition, ReactionDef } from './types'

export type CombineResult =
  | { kind: 'molecule'; id: string }
  | { kind: 'cluster'; comp: Composition }
  | null

/**
 * 끌어다 놓아 두 덩어리를 붙일 때의 결과.
 * 완성된 분자끼리는 결합하지 않고 반응만 한다 (H₂ + O₂ ≠ H₂O₂).
 */
export function combine(a: Composition, b: Composition, bothMolecules: boolean): CombineResult {
  if (bothMolecules) return null
  const sum = addComp(a, b)
  const exact = MOLECULE_LIST.find((m) => compEquals(m.composition, sum))
  if (exact) return { kind: 'molecule', id: exact.id }
  if (MOLECULE_LIST.some((m) => isSubset(sum, m.composition))) return { kind: 'cluster', comp: sum }
  return null
}

export function findContactReaction(a: string | null, b: string | null): ReactionDef | undefined {
  if (!a || !b) return undefined
  return CONTACT_REACTIONS.find((r) => {
    const keys = Object.keys(r.reactants)
    if (a === b) return keys.length === 1 && r.reactants[a] === 2
    return keys.length === 2 && r.reactants[a] === 1 && r.reactants[b] === 1
  })
}

export interface FireMatch<T> {
  reaction: ReactionDef
  used: T[]
}

/** 점화 범위 안의 물질(가까운 순)로 만들 수 있는 반응들을 우선순위대로 묶는다 */
export function matchFireReactions<T extends { species: string | null }>(pool: T[]): FireMatch<T>[] {
  const left = [...pool]
  const out: FireMatch<T>[] = []
  for (const reaction of FIRE_REACTIONS) {
    for (;;) {
      const used = take(left, reaction.reactants)
      if (!used) break
      out.push({ reaction, used })
    }
  }
  return out
}

function take<T extends { species: string | null }>(left: T[], need: Record<string, number>): T[] | null {
  const picked: T[] = []
  for (const [species, n] of Object.entries(need)) {
    let count = 0
    for (const item of left) {
      if (count === n) break
      if (item.species === species && !picked.includes(item)) {
        picked.push(item)
        count++
      }
    }
    if (count < n) return null
  }
  for (const p of picked) left.splice(left.indexOf(p), 1)
  return picked
}
