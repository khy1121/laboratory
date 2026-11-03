import type { MoleculeDef, MoleculeStructure } from './types'

// ── 자주 쓰는 모양 ──────────────────────────────
// 좌표 단위는 결합 길이(≈1). z > 0 은 화면 앞, z < 0 은 뒤.

/** 두 원자 분자 (H₂, O₂ …) */
const diatomic = (a: string, b: string, order: 1 | 2 | 3, ratio = 0.5): MoleculeStructure => ({
  atoms: [
    [a, -ratio, 0],
    [b, 1 - ratio, 0],
  ],
  bonds: [[0, 1, order]],
})

/** 양이온 + 음이온 한 쌍 */
const ionPair = (cation: string, anion: string): MoleculeStructure => ({
  atoms: [
    [cation, -0.62, 0],
    [anion, 0.62, 0],
  ],
  bonds: [[0, 1, 'ion']],
})

/** 중심 원자에 두 원자가 굽은 각(deg)으로 붙은 모양 (H₂O, SO₂ …) */
const bent = (center: string, side: string, angleDeg: number, len: number, order: 1 | 2 = 1): MoleculeStructure => {
  const half = (angleDeg / 2) * (Math.PI / 180)
  return {
    atoms: [
      [center, 0, -0.15],
      [side, -Math.sin(half) * len, Math.cos(half) * len - 0.15],
      [side, Math.sin(half) * len, Math.cos(half) * len - 0.15],
    ],
    bonds: [
      [0, 1, order],
      [0, 2, order],
    ],
  }
}

/** 금속 양이온 하나에 수산화 이온(OH⁻) */
const hydroxide = (metal: string): MoleculeStructure => ({
  atoms: [
    [metal, -1.15, 0],
    ['O', 0.05, 0],
    ['H', 0.72, 0.6],
  ],
  bonds: [
    [0, 1, 'ion'],
    [1, 2, 1],
  ],
})

/** 2가 금속 양이온 양쪽에 음이온 (MgCl₂, CaCl₂) */
const linearSalt = (metal: string, anion: string): MoleculeStructure => ({
  atoms: [
    [anion, -1.15, 0],
    [metal, 0, 0],
    [anion, 1.15, 0],
  ],
  bonds: [
    [1, 0, 'ion'],
    [1, 2, 'ion'],
  ],
})

/** 사면체: 중심 하나, 셋은 평면, 하나는 뒤쪽 (CH₄, NH₄⁺) */
const tetrahedral = (center: string, side: string): MoleculeStructure => ({
  atoms: [
    [center, 0, 0, 0],
    [side, 0, -1, 0.1],
    [side, -0.9, 0.5, 0.1],
    [side, 0.9, 0.5, 0.1],
    [side, 0.25, 0.12, -0.9],
  ],
  bonds: [
    [0, 1, 1],
    [0, 2, 1],
    [0, 3, 1],
    [0, 4, 1],
  ],
})

export const MOLECULE_LIST: MoleculeDef[] = [
  { id: 'H2', formula: 'H₂', name: '수소 기체', composition: { H: 2 }, state: 'gas', description: '가장 가벼운 기체. 공기와 섞이면 불꽃 하나로 폭발합니다.', structure: diatomic('H', 'H', 1) },
  { id: 'O2', formula: 'O₂', name: '산소', composition: { O: 2 }, state: 'gas', description: '산소 원자 둘이 이중 결합으로 묶인 기체. 불이 타려면 꼭 필요합니다.', structure: diatomic('O', 'O', 2) },
  { id: 'O3', formula: 'O₃', name: '오존', composition: { O: 3 }, state: 'gas', description: '산소 원자 3개가 117°로 굽은 분자. 성층권에서 자외선을 막아 줍니다.', structure: bent('O', 'O', 117, 1) },
  { id: 'N2', formula: 'N₂', name: '질소', composition: { N: 2 }, state: 'gas', description: '삼중 결합으로 매우 안정한 기체. 공기의 대부분입니다.', structure: diatomic('N', 'N', 3) },
  { id: 'F2', formula: 'F₂', name: '플루오린 기체', composition: { F: 2 }, state: 'gas', description: '연한 노란색의 가장 반응성이 큰 기체. 유리도 녹입니다.', structure: diatomic('F', 'F', 1) },
  { id: 'Cl2', formula: 'Cl₂', name: '염소 기체', composition: { Cl: 2 }, state: 'gas', description: '황록색 독성 기체. 수돗물 소독에 쓰입니다.', structure: diatomic('Cl', 'Cl', 1) },
  { id: 'H2O', formula: 'H₂O', name: '물', composition: { H: 2, O: 1 }, state: 'liquid', description: '104.5°로 굽은 극성 분자. 생명의 용매.', structure: bent('O', 'H', 104.5, 0.85) },
  {
    id: 'H2O2',
    formula: 'H₂O₂',
    name: '과산화수소',
    composition: { H: 2, O: 2 },
    state: 'liquid',
    description: '산소 둘이 직접 이어진 불안정한 분자. 소독약으로 쓰이며 쉽게 물과 산소로 분해됩니다.',
    structure: {
      atoms: [
        ['O', -0.55, 0, 0],
        ['O', 0.55, 0, 0],
        ['H', -0.85, 0.8, 0.4],
        ['H', 0.85, -0.8, -0.4],
      ],
      bonds: [
        [0, 1, 1],
        [0, 2, 1],
        [1, 3, 1],
      ],
    },
  },
  { id: 'H2S', formula: 'H₂S', name: '황화수소', composition: { H: 2, S: 1 }, state: 'gas', description: '썩은 달걀 냄새가 나는 유독 기체. 물처럼 굽었지만 각도는 92°로 더 좁습니다.', structure: bent('S', 'H', 92, 0.95) },
  { id: 'CO', formula: 'CO', name: '일산화탄소', composition: { C: 1, O: 1 }, state: 'gas', description: '탄소와 산소가 삼중 결합한 무색무취의 유독 기체. 불완전 연소로 생깁니다.', structure: diatomic('C', 'O', 3) },
  {
    id: 'CO2',
    formula: 'CO₂',
    name: '이산화탄소',
    composition: { C: 1, O: 2 },
    state: 'gas',
    description: 'O=C=O 직선형 분자. 탄산음료의 기포이자 대표적인 온실가스.',
    structure: {
      atoms: [
        ['O', -1.05, 0],
        ['C', 0, 0],
        ['O', 1.05, 0],
      ],
      bonds: [
        [1, 0, 2],
        [1, 2, 2],
      ],
    },
  },
  { id: 'SO2', formula: 'SO₂', name: '이산화황', composition: { S: 1, O: 2 }, state: 'gas', description: '황이 탈 때 나오는 자극적인 기체. 산성비의 원인입니다.', structure: bent('S', 'O', 119, 1, 2) },
  { id: 'CH4', formula: 'CH₄', name: '메테인', composition: { C: 1, H: 4 }, state: 'gas', description: '탄소를 중심으로 수소 넷이 사면체(109.5°)로 붙은 도시가스의 주성분.', structure: tetrahedral('C', 'H') },
  {
    id: 'NH3',
    formula: 'NH₃',
    name: '암모니아',
    composition: { N: 1, H: 3 },
    state: 'gas',
    description: '질소 위에 비공유 전자쌍이 있어 삼각뿔 모양. 코를 찌르는 염기성 기체입니다.',
    structure: {
      atoms: [
        ['N', 0, -0.2, 0.3],
        ['H', -0.9, 0.45, 0],
        ['H', 0.9, 0.45, 0],
        ['H', 0, 0.55, -0.8],
      ],
      bonds: [
        [0, 1, 1],
        [0, 2, 1],
        [0, 3, 1],
      ],
    },
  },
  { id: 'HF', formula: 'HF', name: '플루오린화수소', composition: { H: 1, F: 1 }, state: 'aqueous', description: '유리를 녹이는 산. 수소와 플루오린이 아주 강하게 붙어 있습니다.', structure: diatomic('H', 'F', 1, 0.55) },
  { id: 'HCl', formula: 'HCl', name: '염산', composition: { H: 1, Cl: 1 }, state: 'aqueous', description: '물에 녹은 염화수소. 위액에도 들어 있는 강산입니다.', structure: diatomic('H', 'Cl', 1, 0.55) },
  { id: 'LiCl', formula: 'LiCl', name: '염화리튬', composition: { Li: 1, Cl: 1 }, state: 'solid', description: '불꽃 속에서 진홍색을 내는 이온 결정.', structure: ionPair('Li', 'Cl') },
  { id: 'NaCl', formula: 'NaCl', name: '염화나트륨 (소금)', composition: { Na: 1, Cl: 1 }, state: 'solid', description: 'Na⁺와 Cl⁻가 번갈아 쌓인 정육면체 이온 결정.', structure: ionPair('Na', 'Cl') },
  { id: 'KCl', formula: 'KCl', name: '염화칼륨', composition: { K: 1, Cl: 1 }, state: 'solid', description: '저나트륨 소금으로 쓰이는 이온 결정.', structure: ionPair('K', 'Cl') },
  { id: 'LiOH', formula: 'LiOH', name: '수산화리튬', composition: { Li: 1, O: 1, H: 1 }, state: 'aqueous', description: '우주선에서 이산화탄소를 흡수하는 데 쓰이는 염기.', structure: hydroxide('Li') },
  { id: 'NaOH', formula: 'NaOH', name: '수산화나트륨', composition: { Na: 1, O: 1, H: 1 }, state: 'aqueous', description: 'Na⁺와 OH⁻로 이루어진 강한 염기. 비누를 만들 때 쓰입니다.', structure: hydroxide('Na') },
  { id: 'KOH', formula: 'KOH', name: '수산화칼륨', composition: { K: 1, O: 1, H: 1 }, state: 'aqueous', description: '수산화나트륨보다 더 잘 녹는 강염기.', structure: hydroxide('K') },
  {
    id: 'CaOH2',
    formula: 'Ca(OH)₂',
    name: '수산화칼슘 (소석회)',
    composition: { Ca: 1, O: 2, H: 2 },
    state: 'aqueous',
    description: '생석회에 물을 부으면 생기는 염기. 석회수의 정체입니다.',
    structure: {
      atoms: [
        ['Ca', 0, 0],
        ['O', -1.2, 0],
        ['H', -1.8, 0.6],
        ['O', 1.2, 0],
        ['H', 1.8, 0.6],
      ],
      bonds: [
        [0, 1, 'ion'],
        [1, 2, 1],
        [0, 3, 'ion'],
        [3, 4, 1],
      ],
    },
  },
  { id: 'MgO', formula: 'MgO', name: '산화마그네슘', composition: { Mg: 1, O: 1 }, state: 'solid', description: '마그네슘이 타고 남은 하얀 가루.', structure: ionPair('Mg', 'O') },
  { id: 'CaO', formula: 'CaO', name: '산화칼슘 (생석회)', composition: { Ca: 1, O: 1 }, state: 'solid', description: '석회석을 구워 만드는 하얀 덩어리. 물을 만나면 뜨거워집니다.', structure: ionPair('Ca', 'O') },
  { id: 'MgCl2', formula: 'MgCl₂', name: '염화마그네슘', composition: { Mg: 1, Cl: 2 }, state: 'solid', description: '두부를 굳히는 간수의 주성분.', structure: linearSalt('Mg', 'Cl') },
  { id: 'CaCl2', formula: 'CaCl₂', name: '염화칼슘', composition: { Ca: 1, Cl: 2 }, state: 'solid', description: '습기를 빨아들이는 제습제이자 겨울철 제설제.', structure: linearSalt('Ca', 'Cl') },
  {
    id: 'CaCO3',
    formula: 'CaCO₃',
    name: '탄산칼슘 (석회석)',
    composition: { Ca: 1, C: 1, O: 3 },
    state: 'solid',
    description: '조개껍데기·대리석·분필의 성분. 탄산 이온은 평평한 삼각형입니다.',
    structure: {
      atoms: [
        ['Ca', -1.75, 0],
        ['O', -0.6, 0],
        ['C', 0.4, 0],
        ['O', 0.9, 0.87],
        ['O', 0.9, -0.87],
      ],
      bonds: [
        [0, 1, 'ion'],
        [2, 1, 1],
        [2, 3, 2],
        [2, 4, 1],
      ],
    },
  },
  { id: 'FeS', formula: 'FeS', name: '황화철', composition: { Fe: 1, S: 1 }, state: 'solid', description: '철과 황을 함께 가열하면 생기는 검은 덩어리. 자석에 붙지 않습니다.', structure: ionPair('Fe', 'S') },
  {
    id: 'Fe2O3',
    formula: 'Fe₂O₃',
    name: '산화철 (녹)',
    composition: { Fe: 2, O: 3 },
    state: 'solid',
    description: '철이 산소와 만나 생기는 붉은 녹. 화성의 붉은색도 이것입니다.',
    structure: {
      atoms: [
        ['O', -1.3, 0.55],
        ['Fe', -0.65, -0.35],
        ['O', 0, 0.55],
        ['Fe', 0.65, -0.35],
        ['O', 1.3, 0.55],
      ],
      bonds: [
        [1, 0, 'ion'],
        [1, 2, 'ion'],
        [3, 2, 'ion'],
        [3, 4, 'ion'],
      ],
    },
  },
  {
    id: 'NH4Cl',
    formula: 'NH₄Cl',
    name: '염화암모늄',
    composition: { N: 1, H: 4, Cl: 1 },
    state: 'solid',
    description: '암모늄 이온(NH₄⁺)과 염화 이온이 붙은 하얀 연기의 정체.',
    structure: {
      atoms: [
        ['N', -0.45, 0, 0],
        ['H', -0.45, -0.95, 0.1],
        ['H', -1.3, 0.5, 0.1],
        ['H', 0.1, 0.6, 0.1],
        ['H', -0.25, 0.1, -0.9],
        ['Cl', 1.35, 0, 0],
      ],
      bonds: [
        [0, 1, 1],
        [0, 2, 1],
        [0, 3, 1],
        [0, 4, 1],
        [0, 5, 'ion'],
      ],
    },
  },
]

export const MOLECULES: Record<string, MoleculeDef> = Object.fromEntries(
  MOLECULE_LIST.map((m) => [m.id, m]),
)

/** 팔레트에서 바로 꺼내 쓸 수 있는 시약 */
export const REAGENTS = ['H2O', 'O2', 'Cl2', 'F2', 'HCl', 'CaCO3'] as const
