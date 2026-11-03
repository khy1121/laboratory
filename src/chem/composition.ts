import { ELEMENTS } from './elements'
import { MOLECULES } from './molecules'
import type { Composition } from './types'

/** 화학식 표기 순서: 금속 → 탄소 → 질소 → 수소 → 황 → 할로젠 → 산소 */
const ORDER = ['K', 'Na', 'Li', 'Ca', 'Mg', 'Fe', 'C', 'N', 'H', 'S', 'F', 'Cl', 'O']
const SUB = '₀₁₂₃₄₅₆₇₈₉'

const rank = (el: string) => {
  const i = ORDER.indexOf(el)
  return i === -1 ? ORDER.length : i
}

export const subscript = (n: number) =>
  String(n)
    .split('')
    .map((d) => SUB[Number(d)])
    .join('')

export function addComp(a: Composition, b: Composition): Composition {
  const out: Composition = { ...a }
  for (const [el, n] of Object.entries(b)) out[el] = (out[el] ?? 0) + n
  return out
}

export function compEquals(a: Composition, b: Composition): boolean {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((k) => a[k] === b[k])
}

/** a의 모든 원자가 b 안에 들어 있는가 */
export function isSubset(a: Composition, b: Composition): boolean {
  return Object.entries(a).every(([el, n]) => (b[el] ?? 0) >= n)
}

/** 원자 목록으로 펼침: { H: 2, O: 1 } → ['H', 'H', 'O'] */
export function expand(c: Composition): string[] {
  return Object.keys(c)
    .sort((a, b) => rank(a) - rank(b))
    .flatMap((el) => Array<string>(c[el]).fill(el))
}

export function formatFormula(c: Composition): string {
  return Object.keys(c)
    .sort((a, b) => rank(a) - rank(b))
    .map((el) => el + (c[el] > 1 ? subscript(c[el]) : ''))
    .join('')
}

export const isAtom = (species: string | null): species is string =>
  species !== null && species in ELEMENTS

export const isMolecule = (species: string | null): species is string =>
  species !== null && species in MOLECULES

export function speciesComposition(species: string): Composition {
  if (isAtom(species)) return { [species]: 1 }
  const m = MOLECULES[species]
  if (!m) throw new Error(`Unknown species: ${species}`)
  return m.composition
}

export function speciesLabel(species: string | null, comp: Composition): string {
  if (isMolecule(species)) return MOLECULES[species].formula
  return formatFormula(comp)
}

export function speciesName(species: string | null): string {
  if (isAtom(species)) return ELEMENTS[species].name
  if (isMolecule(species)) return MOLECULES[species].name
  return '미완성 분자'
}
