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
  cep?: string
  phone?: string
  email?: string
  repass_type?: 'Percentual' | 'Fixo' | 'Valor Fixo'
  repass_value?: number
  status?: 'Ativa' | 'Inativa' | 'Active' | 'Inactive' | 'Ativo' | 'Inativo'
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
  cep: dto.cep || '',
  telefone: dto.phone || '',
  email: dto.email || '',
  tipoRepasse: (dto.repass_type === 'Percentual' ? 'Percentual' : 'Valor Fixo') as TipoRepasse,
  valor: dto.repass_value ?? 0,
  status: (dto.status === 'Ativo' || dto.status === 'Active' ? 'Ativa' : dto.status === 'Inativo' || dto.status === 'Inactive' ? 'Inativa' : (dto.status || 'Ativa')) as Unidade['status'],
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

export async function createUnidade(data: Omit<Unidade, 'id' | 'created_at' | 'updated_at' | 'turmas'>): Promise<Unidade> {
  const payload = {
    name: data.nome,
    // responsible: data.responsavel,
    address: data.endereco,
    city: data.cidade,
    state: data.estado,
    cep: data.cep, // Changed from zip
    phone: data.telefone,
    email: data.email,
    repass_type: data.tipoRepasse === 'Valor Fixo' ? 'Fixo' : 'Percentual',
    repass_value: data.valor,
    status: data.status === 'Ativa' ? 'Ativo' : 'Inativo',
    // manager_ids: data.managerIds // Ensure backend supports this or remove if not
  }
  const res = await api.post<UnitDto>('/units', payload)
  return mapDtoToUnidade(res.data)
}

export async function updateUnidade(id: string, data: Partial<Unidade>): Promise<Unidade> {
  const payload: any = {}
  if (data.nome !== undefined) payload.name = data.nome
  // if (data.responsavel !== undefined) payload.responsible = data.responsavel
  if (data.endereco !== undefined) payload.address = data.endereco
  if (data.cidade !== undefined) payload.city = data.cidade
  if (data.estado !== undefined) payload.state = data.estado
  if (data.cep !== undefined) payload.cep = data.cep // Changed from payload.zip to payload.cep
  if (data.telefone !== undefined) payload.phone = data.telefone
  if (data.email !== undefined) payload.email = data.email
  if (data.tipoRepasse !== undefined) payload.repass_type = data.tipoRepasse === 'Valor Fixo' ? 'Fixo' : 'Percentual'
  if (data.valor !== undefined) payload.repass_value = data.valor
  if (data.status !== undefined) payload.status = data.status === 'Ativa' ? 'Ativo' : 'Inativo'
  // if (data.managerIds !== undefined) payload.manager_ids = data.managerIds

  const res = await api.put<UnitDto>(`/units/${id}`, payload)
  return mapDtoToUnidade(res.data)
}