import type { MoleculeDef } from './types'

export const MOLECULE_LIST: MoleculeDef[] = [
  { id: 'H2', formula: 'H₂', name: '수소 기체', composition: { H: 2 }, state: 'gas', description: '가장 가벼운 기체. 공기와 섞이면 불꽃 하나로 폭발합니다.' },
  { id: 'O2', formula: 'O₂', name: '산소', composition: { O: 2 }, state: 'gas', description: '우리가 숨 쉬는 기체. 불이 타려면 꼭 필요합니다.' },
  { id: 'O3', formula: 'O₃', name: '오존', composition: { O: 3 }, state: 'gas', description: '산소 원자 3개. 성층권에서 자외선을 막아 줍니다.' },
  { id: 'N2', formula: 'N₂', name: '질소', composition: { N: 2 }, state: 'gas', description: '삼중 결합으로 매우 안정한 기체. 공기의 대부분입니다.' },
  { id: 'Cl2', formula: 'Cl₂', name: '염소 기체', composition: { Cl: 2 }, state: 'gas', description: '황록색 독성 기체. 수돗물 소독에 쓰입니다.' },
  { id: 'H2O', formula: 'H₂O', name: '물', composition: { H: 2, O: 1 }, state: 'liquid', description: '굽은 모양(104.5°)의 극성 분자. 생명의 용매.' },
  { id: 'H2O2', formula: 'H₂O₂', name: '과산화수소', composition: { H: 2, O: 2 }, state: 'liquid', description: '소독약으로 쓰이는 불안정한 분자. 쉽게 물과 산소로 분해됩니다.' },
  { id: 'CO', formula: 'CO', name: '일산화탄소', composition: { C: 1, O: 1 }, state: 'gas', description: '불완전 연소로 생기는 무색무취의 유독 기체.' },
  { id: 'CO2', formula: 'CO₂', name: '이산화탄소', composition: { C: 1, O: 2 }, state: 'gas', description: '직선형 분자. 탄산음료의 기포이자 대표적인 온실가스.' },
  { id: 'CH4', formula: 'CH₄', name: '메테인', composition: { C: 1, H: 4 }, state: 'gas', description: '도시가스의 주성분. 파란 불꽃으로 탑니다.' },
  { id: 'NH3', formula: 'NH₃', name: '암모니아', composition: { N: 1, H: 3 }, state: 'gas', description: '코를 찌르는 냄새의 염기성 기체. 비료의 원료입니다.' },
  { id: 'HCl', formula: 'HCl', name: '염산', composition: { H: 1, Cl: 1 }, state: 'aqueous', description: '물에 녹은 염화수소. 위액에도 들어 있는 강산입니다.' },
  { id: 'NaCl', formula: 'NaCl', name: '염화나트륨 (소금)', composition: { Na: 1, Cl: 1 }, state: 'solid', description: '정육면체 결정을 이루는 이온 결합 화합물.' },
  { id: 'NaOH', formula: 'NaOH', name: '수산화나트륨', composition: { Na: 1, O: 1, H: 1 }, state: 'aqueous', description: '강한 염기. 비누를 만들 때 쓰입니다.' },
  { id: 'KCl', formula: 'KCl', name: '염화칼륨', composition: { K: 1, Cl: 1 }, state: 'solid', description: '저나트륨 소금으로 쓰이는 이온 결정.' },
  { id: 'KOH', formula: 'KOH', name: '수산화칼륨', composition: { K: 1, O: 1, H: 1 }, state: 'aqueous', description: '수산화나트륨보다 더 잘 녹는 강염기.' },
  { id: 'MgO', formula: 'MgO', name: '산화마그네슘', composition: { Mg: 1, O: 1 }, state: 'solid', description: '마그네슘이 타고 남은 하얀 가루.' },
  { id: 'MgCl2', formula: 'MgCl₂', name: '염화마그네슘', composition: { Mg: 1, Cl: 2 }, state: 'solid', description: '두부를 굳히는 간수의 주성분.' },
  { id: 'NH4Cl', formula: 'NH₄Cl', name: '염화암모늄', composition: { N: 1, H: 4, Cl: 1 }, state: 'solid', description: '암모니아와 염화수소가 만나 생기는 하얀 연기의 정체.' },
]

export const MOLECULES: Record<string, MoleculeDef> = Object.fromEntries(
  MOLECULE_LIST.map((m) => [m.id, m]),
)

/** 팔레트에서 바로 꺼내 쓸 수 있는 시약 */
export const REAGENTS = ['H2O', 'O2', 'Cl2', 'HCl'] as const
