import { expand, isMolecule } from '../chem/composition'
import { ELEMENTS } from '../chem/elements'
import { MOLECULES } from '../chem/molecules'
import type { BondOrder, Composition } from '../chem/types'

export interface LayoutAtom {
  el: string
  dx: number
  dy: number
  /** 화면 앞(+)/뒤(−) 깊이. 그리기 순서와 크기에 반영 */
  z: number
  r: number
}

export interface LayoutBond {
  a: number
  b: number
  order: BondOrder
}

export interface MoleculeLayout {
  atoms: LayoutAtom[]
  bonds: LayoutBond[]
  radius: number
}

const MOLECULE_SCALE = 0.78
/** 구조 좌표 1 단위(결합 길이)를 몇 px로 그릴지 */
const BOND_PX = 36
/** 비공유 전자쌍이 있어 굽은 모양이 되는 중심 원자 (미완성 덩어리 자동 배치용) */
const BENT_CENTERS = new Set(['O', 'N', 'S'])

const deg = (d: number) => (d * Math.PI) / 180

function neighborAngles(center: string, n: number): number[] {
  if (n === 1) return [0]
  if (n === 2) return BENT_CENTERS.has(center) ? [deg(90 - 52), deg(90 + 52)] : [0, Math.PI]
  if (n === 3) return [deg(90), deg(210), deg(330)]
  if (n === 4) return [deg(45), deg(135), deg(225), deg(315)]
  return Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2 - Math.PI / 2)
}

function finish(atoms: LayoutAtom[], bonds: LayoutBond[]): MoleculeLayout {
  // 무게중심을 원점으로
  const cx = atoms.reduce((s, a) => s + a.dx, 0) / atoms.length
  const cy = atoms.reduce((s, a) => s + a.dy, 0) / atoms.length
  for (const a of atoms) {
    a.dx -= cx
    a.dy -= cy
  }
  const radius = Math.max(...atoms.map((a) => Math.hypot(a.dx, a.dy) + a.r))
  return { atoms, bonds, radius }
}

/** 정의된 실제 구조로 배치 */
function structureLayout(species: string): MoleculeLayout {
  const { structure } = MOLECULES[species]
  const atoms: LayoutAtom[] = structure.atoms.map(([el, x, y, z = 0]) => ({
    el,
    dx: x * BOND_PX,
    dy: y * BOND_PX,
    z,
    r: ELEMENTS[el].radius * MOLECULE_SCALE * (1 + z * 0.12),
  }))
  const bonds: LayoutBond[] = structure.bonds.map(([a, b, order]) => ({ a, b, order }))
  return finish(atoms, bonds)
}

/** 미완성 덩어리: 원자가가 가장 큰 원자를 중심에 두고 나머지를 둘러 배치 */
function autoLayout(comp: Composition): MoleculeLayout {
  const list = expand(comp)
  let ci = 0
  list.forEach((el, i) => {
    if (ELEMENTS[el].valence > ELEMENTS[list[ci]].valence) ci = i
  })
  const center = list[ci]
  const rest = list.filter((_, i) => i !== ci)
  const rc = ELEMENTS[center].radius * MOLECULE_SCALE

  const atoms: LayoutAtom[] = [{ el: center, dx: 0, dy: 0, z: 0, r: rc }]
  const angles = neighborAngles(center, rest.length)
  rest.forEach((el, i) => {
    const r = ELEMENTS[el].radius * MOLECULE_SCALE
    const d = (rc + r) * 1.08
    atoms.push({ el, dx: Math.cos(angles[i]) * d, dy: Math.sin(angles[i]) * d, z: 0, r })
  })
  const bonds = rest.map((_, i) => ({ a: 0, b: i + 1, order: 1 as const }))
  return finish(atoms, bonds)
}

export function computeLayout(comp: Composition, species: string | null = null): MoleculeLayout {
  if (isMolecule(species)) return structureLayout(species)

  const list = expand(comp)
  if (list.length === 1) {
    const r = ELEMENTS[list[0]].radius
    return { atoms: [{ el: list[0], dx: 0, dy: 0, z: 0, r }], bonds: [], radius: r }
  }
  return autoLayout(comp)
}
