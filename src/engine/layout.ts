import { expand } from '../chem/composition'
import { ELEMENTS } from '../chem/elements'
import type { Composition } from '../chem/types'

export interface LayoutAtom {
  el: string
  dx: number
  dy: number
  r: number
}

export interface MoleculeLayout {
  atoms: LayoutAtom[]
  /** 중심 원자(0번)와 연결된 원자 인덱스 쌍 */
  bonds: [number, number][]
  radius: number
}

const MOLECULE_SCALE = 0.8
/** 비공유 전자쌍이 있어 굽은 모양이 되는 중심 원자 */
const BENT_CENTERS = new Set(['O', 'N'])

const deg = (d: number) => (d * Math.PI) / 180

function neighborAngles(center: string, n: number): number[] {
  if (n === 1) return [0]
  if (n === 2) return BENT_CENTERS.has(center) ? [deg(90 - 52), deg(90 + 52)] : [0, Math.PI]
  if (n === 3) return [deg(90), deg(210), deg(330)]
  if (n === 4) return [deg(45), deg(135), deg(225), deg(315)]
  return Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2 - Math.PI / 2)
}

export function computeLayout(comp: Composition): MoleculeLayout {
  const list = expand(comp)

  if (list.length === 1) {
    const r = ELEMENTS[list[0]].radius
    return { atoms: [{ el: list[0], dx: 0, dy: 0, r }], bonds: [], radius: r }
  }

  // 원자가가 가장 큰 원자를 중심에
  let ci = 0
  list.forEach((el, i) => {
    if (ELEMENTS[el].valence > ELEMENTS[list[ci]].valence) ci = i
  })
  const center = list[ci]
  const rest = list.filter((_, i) => i !== ci)
  const rc = ELEMENTS[center].radius * MOLECULE_SCALE

  const atoms: LayoutAtom[] = [{ el: center, dx: 0, dy: 0, r: rc }]
  const angles = neighborAngles(center, rest.length)
  rest.forEach((el, i) => {
    const r = ELEMENTS[el].radius * MOLECULE_SCALE
    const d = (rc + r) * 1.08
    atoms.push({ el, dx: Math.cos(angles[i]) * d, dy: Math.sin(angles[i]) * d, r })
  })

  // 무게중심을 원점으로
  const cx = atoms.reduce((s, a) => s + a.dx, 0) / atoms.length
  const cy = atoms.reduce((s, a) => s + a.dy, 0) / atoms.length
  for (const a of atoms) {
    a.dx -= cx
    a.dy -= cy
  }

  const radius = Math.max(...atoms.map((a) => Math.hypot(a.dx, a.dy) + a.r))
  const bonds = rest.map((_, i) => [0, i + 1] as [number, number])
  return { atoms, bonds, radius }
}
