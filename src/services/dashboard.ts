import { api } from '@/services/api'

export interface ReceitaUnidade {
  unidade: string
  receita: number
  alunos: number
}

export interface EvolucaoItem {
  mes: string
  receita: number
  despesas: number
  lucro: number
}

export interface DashboardMetrics {
  totalUnidades: number
  totalAlunos: number
  faturamentoMensal: number
  inadimplencia: number
  churn: number
  receitaPorUnidade: ReceitaUnidade[]
  evolucaoFaturamento: EvolucaoItem[]
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await api.get<DashboardMetrics>('/dashboard/metrics')
  return data
}