export type MissionGoal =
  /** 결합이나 반응으로 해당 분자를 count개 만들기 */
  | { type: 'make'; species: string; count: number }
  /** 나열된 반응 중 아무거나 합쳐서 count번 */
  | { type: 'react'; reactions: string[]; count: number }
  /** 나열된 반응을 각각 한 번 이상 */
  | { type: 'react-all'; reactions: string[] }
  /** 같은 분자를 서로 다른 방법(결합 'bond' 또는 반응 id)으로 만들기 */
  | { type: 'make-ways'; species: string; ways: string[] }
  /** 한 번의 점화로 반응 count개 이상 동시에 일으키기 */
  | { type: 'chain'; count: number }

export interface MissionDef {
  id: string
  title: string
  description: string
  hint: string
  goal: MissionGoal
  /** 팔레트에서 강조할 재료 */
  materials: string[]
}

export interface MissionProgress {
  count: number
  keys: string[]
}

export type MissionEvent =
  | { type: 'made'; species: string; via: string }
  | { type: 'reacted'; id: string }
  | { type: 'ignited'; count: number }

export const EMPTY_PROGRESS: MissionProgress = { count: 0, keys: [] }

export const MISSION_LIST: MissionDef[] = [
  {
    id: 'first-bond',
    title: '첫 번째 분자',
    description: '수소 원자 두 개를 겹쳐서 수소 분자(H₂)를 만드세요.',
    hint: 'H 타일을 실험대에 두 번 끌어다 같은 자리에 겹쳐 놓으세요.',
    goal: { type: 'make', species: 'H2', count: 1 },
    materials: ['H'],
  },
  {
    id: 'water',
    title: '생명의 물',
    description: '물(H₂O)을 3개 만드세요.',
    hint: 'H₂를 먼저 만들고 O 원자를 겹치면 물이 됩니다. 수소에 불을 붙여도 물이 생겨요.',
    goal: { type: 'make', species: 'H2O', count: 3 },
    materials: ['H', 'O'],
  },
  {
    id: 'pop-test',
    title: '퐁! 수소 확인',
    description: '수소 기체 하나에 불을 붙여 "퐁" 소리를 들어 보세요.',
    hint: '점화기(단축키 2)를 들고 H₂만 있는 곳을 클릭하세요.',
    goal: { type: 'react', reactions: ['h2-pop'], count: 1 },
    materials: ['H'],
  },
  {
    id: 'sodium-water',
    title: '물에 던진 금속',
    description: '나트륨을 물에 넣어 격렬한 반응을 일으키세요.',
    hint: 'H₂O 시약을 꺼내고 Na를 그 위에 떨어뜨리거나 던지세요.',
    goal: { type: 'react', reactions: ['na-water'], count: 1 },
    materials: ['Na', 'H2O'],
  },
  {
    id: 'hydrogen-boom',
    title: '수소 폭발',
    description: '수소와 산소를 섞고 불을 붙여 폭발시키세요.',
    hint: 'H₂와 O₂를 가까이 둔 채로 둘 다 점화 범위(주황 점선) 안에 들어오게 클릭하세요.',
    goal: { type: 'react', reactions: ['h2-o2'], count: 1 },
    materials: ['H', 'O2'],
  },
  {
    id: 'acid-base',
    title: '산과 염기',
    description: '중화 반응을 2번 일으키세요.',
    hint: '염기(NaOH)는 나트륨을 물에 넣으면 생깁니다. 염산(HCl)과 만나게 하세요.',
    goal: { type: 'react', reactions: ['neutralize-na', 'neutralize-k'], count: 2 },
    materials: ['HCl', 'Na', 'K', 'H2O'],
  },
  {
    id: 'salt-three-ways',
    title: '소금을 만드는 세 가지 방법',
    description: '소금(NaCl)을 서로 다른 3가지 방법으로 만드세요.',
    hint: '① Na와 Cl 원자를 겹치기 ② Na에 Cl₂ 기체 닿게 하기 ③ 염산과 NaOH 중화',
    goal: { type: 'make-ways', species: 'NaCl', ways: ['bond', 'na-cl2', 'neutralize-na'] },
    materials: ['Na', 'Cl', 'Cl2', 'HCl', 'H2O'],
  },
  {
    id: 'white-smoke',
    title: '하얀 연기',
    description: '두 기체를 만나게 해 하얀 연기를 피워 보세요.',
    hint: '암모니아(NH₃)는 N 하나와 H 셋으로 만들 수 있어요. 염산과 만나게 하세요.',
    goal: { type: 'react', reactions: ['nh3-hcl'], count: 1 },
    materials: ['N', 'H', 'HCl'],
  },
  {
    id: 'gas-stove',
    title: '가스레인지 불꽃',
    description: '메테인(CH₄)을 만들어 파란 불꽃으로 태우세요.',
    hint: 'C 하나에 H 넷을 차례로 겹치면 메테인이 됩니다.',
    goal: { type: 'react', reactions: ['ch4-burn'], count: 1 },
    materials: ['C', 'H'],
  },
  {
    id: 'flame-colors',
    title: '불꽃 반응 감별사',
    description: '나트륨과 칼륨의 불꽃 색을 모두 확인하세요.',
    hint: 'NaCl과 KCl을 만들어 각각 불을 붙여 보세요. 반응물이 사라지지 않아요.',
    goal: { type: 'react-all', reactions: ['flame-nacl', 'flame-kcl'] },
    materials: ['Na', 'K', 'Cl'],
  },
  {
    id: 'chain-reaction',
    title: '연쇄 반응',
    description: '한 번의 점화로 반응 3개를 동시에 일으키세요.',
    hint: '타는 물질 여러 개(H₂, Mg, C, CH₄…)를 한곳에 모아 두고 한가운데를 클릭하세요.',
    goal: { type: 'chain', count: 3 },
    materials: ['H', 'O2', 'Mg', 'C'],
  },
  {
    id: 'iron-sulfur',
    title: '철과 황',
    description: '철과 황을 함께 가열해 황화철을 만드세요.',
    hint: 'Fe와 S를 가까이 두고 점화기로 가운데를 클릭하세요.',
    goal: { type: 'react', reactions: ['fe-s'], count: 1 },
    materials: ['Fe', 'S'],
  },
  {
    id: 'limestone',
    title: '석회석에서 석회수까지',
    description: '석회석을 구워 생석회를 만들고, 거기에 물을 부으세요.',
    hint: 'CaCO₃ 시약에 불을 붙이면 CaO가 남아요. 그 위에 H₂O를 떨어뜨리세요.',
    goal: { type: 'react-all', reactions: ['caco3-heat', 'cao-water'] },
    materials: ['CaCO3', 'H2O'],
  },
  {
    id: 'alkali-family',
    title: '알칼리 금속 가족',
    description: '리튬·나트륨·칼륨을 모두 물에 넣어 반응의 세기를 비교하세요.',
    hint: '같은 족 금속은 아래로 갈수록 격렬합니다. Li → Na → K 순서로 넣어 보세요.',
    goal: { type: 'react-all', reactions: ['li-water', 'na-water', 'k-water'] },
    materials: ['Li', 'Na', 'K', 'H2O'],
  },
  {
    id: 'potassium',
    title: '최후의 실험',
    description: '칼륨을 물에 넣어 가장 격렬한 반응을 일으키세요.',
    hint: '나트륨보다 한 칸 아래, 보라색 K를 물에!',
    goal: { type: 'react', reactions: ['k-water'], count: 1 },
    materials: ['K', 'H2O'],
  },
]

export const MISSIONS: Record<string, MissionDef> = Object.fromEntries(MISSION_LIST.map((m) => [m.id, m]))

export function goalTarget(g: MissionGoal): number {
  switch (g.type) {
    case 'make':
    case 'react':
    case 'chain':
      return g.count
    case 'react-all':
      return g.reactions.length
    case 'make-ways':
      return g.ways.length
  }
}

/** 이벤트를 반영한 새 진행도. 변화가 없으면 같은 객체를 돌려준다 */
export function applyMissionEvent(g: MissionGoal, p: MissionProgress, ev: MissionEvent): MissionProgress {
  const addKey = (key: string) => (p.keys.includes(key) ? p : { count: p.keys.length + 1, keys: [...p.keys, key] })

  switch (g.type) {
    case 'make':
      return ev.type === 'made' && ev.species === g.species ? { ...p, count: p.count + 1 } : p
    case 'react':
      return ev.type === 'reacted' && g.reactions.includes(ev.id) ? { ...p, count: p.count + 1 } : p
    case 'react-all':
      return ev.type === 'reacted' && g.reactions.includes(ev.id) ? addKey(ev.id) : p
    case 'make-ways':
      return ev.type === 'made' && ev.species === g.species && g.ways.includes(ev.via) ? addKey(ev.via) : p
    case 'chain':
      return ev.type === 'ignited' && ev.count > p.count ? { ...p, count: ev.count } : p
  }
}

export const isComplete = (g: MissionGoal, p: MissionProgress) => p.count >= goalTarget(g)

export const currentMission = (completed: string[]) => MISSION_LIST.find((m) => !completed.includes(m.id))
