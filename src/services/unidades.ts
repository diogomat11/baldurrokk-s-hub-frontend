import { api } from '@/services/api'
import type { Unidade, TipoRepasse } from '@/types'

// DTO vindo do backend (tabela 'units')
type UnitDto = {
  id: string
  name: string
  responsible?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  email?: string
  repass_type?: 'Percentual' | 'Fixo' | 'Valor Fixo'
  repass_value?: number
  status?: 'Ativa' | 'Inativa' | 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

const mapDtoToUnidade = (dto: UnitDto): Unidade => ({
  id: dto.id,
  nome: dto.name,
  responsavel: dto.responsible || '',
  endereco: dto.address || '',
  cidade: dto.city || '',
  estado: dto.state || '',
  cep: dto.zip || '',
  telefone: dto.phone || '',
  email: dto.email || '',
  tipoRepasse: (dto.repass_type === 'Percentual' ? 'Percentual' : 'Valor Fixo') as TipoRepasse,
  valor: dto.repass_value ?? 0,
  status: (dto.status === 'Active' ? 'Ativa' : dto.status === 'Inactive' ? 'Inativa' : (dto.status || 'Ativa')) as Unidade['status'],
  created_at: dto.created_at,
  updated_at: dto.updated_at,
  turmas: [],
})

export async function getUnidades(search?: string): Promise<Unidade[]> {
  const params = search && search.trim() ? { q: search.trim() } : undefined
  const res = await api.get<UnitDto[]>('/units', { params })
  const list = Array.isArray(res.data) ? res.data : []
  return list.map(mapDtoToUnidade)
}