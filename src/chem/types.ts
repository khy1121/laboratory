/** 원소 기호 → 개수. 예: H₂O = { H: 2, O: 1 } */
export type Composition = Record<string, number>

export type ElementCategory = 'nonmetal' | 'alkali' | 'alkaline' | 'halogen' | 'noble' | 'transition'

export interface ElementDef {
  symbol: string
  name: string
  number: number
  /** 분자 배치에서 중심 원자를 고를 때 사용 (결합할 수 있는 손의 수) */
  valence: number
  /** 가장 바깥 껍질의 전자 수 (홑원자 전자껍질 표시용) */
  valenceElectrons: number
  color: string
  radius: number
  category: ElementCategory
  description: string
}

export type MatterState = 'gas' | 'liquid' | 'solid' | 'aqueous'

/** 1 = 단일, 2 = 이중, 3 = 삼중, 'ion' = 이온 결합 (앞 원자가 양이온) */
export type BondOrder = 1 | 2 | 3 | 'ion'

/** 실제 분자 모양. 좌표 단위는 결합 길이(≈1), z는 화면 앞(+)/뒤(−) 깊이 */
export interface MoleculeStructure {
  atoms: [el: string, x: number, y: number, z?: number][]
  bonds: [a: number, b: number, order: BondOrder][]
}

export interface MoleculeDef {
  id: string
  formula: string
  name: string
  composition: Composition
  state: MatterState
  description: string
  structure: MoleculeStructure
}

export type FxKind =
  | 'explosion'
  | 'violent-water'
  | 'pop'
  | 'flash'
  | 'flame'
  | 'flame-test'
  | 'fizz'
  | 'smoke'
  | 'neutralize'

/** contact: 두 물질이 닿으면 즉시 반응 / fire: 점화기로 불을 붙여야 반응 */
export type ReactionTrigger = 'contact' | 'fire'

export interface ReactionDef {
  id: string
  name: string
  trigger: ReactionTrigger
  /** 종(원소 기호 또는 분자 id) → 필요 개수 */
  reactants: Record<string, number>
  products: Record<string, number>
  /** 불꽃 반응처럼 반응물이 사라지지 않는 경우 */
  keepReactants?: boolean
  fx: FxKind
  color: string
  power?: number
  /** 빠져나가는 기체 (화면에 ↑ 라벨로 표시) */
  gas?: string
  equation: string
  description: string
  warning?: string
  hint: string
}
