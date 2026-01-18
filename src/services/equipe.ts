import { api } from '@/services/api'
import type { Profissional, CargoProfissional, StatusProfissional } from '@/types'

// DTO vindo do backend (tabela 'professionals')
type ProfessionalDto = {
  id: string
  name: string
  cpf?: string
  role_position?: string
  salary?: number
  specialties?: string[]
  phone?: string
  email?: string
  unit_ids?: string[]
  hired_at?: string
  status?: 'Ativo' | 'Inativo' | 'Licença' | 'Active' | 'Inactive'
  created_at: string
  updated_at: string
  repass_type?: 'Fixo' | 'Percentual'
  repass_value?: number
}

const mapCargo = (role?: string): CargoProfissional => {
  const v = String(role || '').toLowerCase()
  if (v.includes('coord')) return 'Coordenador'
  if (v.includes('admin')) return 'Administrador'
  if (v.includes('recep')) return 'Recepcionista'
  return 'Professor'
}

const mapStatus = (s?: ProfessionalDto['status']): StatusProfissional => {
  if (!s) return 'Ativo'
  const v = String(s)
  return v === 'Inactive' ? 'Inativo' : v === 'Active' ? 'Ativo' : (v as StatusProfissional)
}

const mapDtoToProfissional = (dto: ProfessionalDto): Profissional => ({
  id: dto.id,
  nome: dto.name,
  cpf: dto.cpf || '',
  cargo: mapCargo(dto.role_position),
  salario: dto.salary ?? 0,
  especialidades: Array.isArray(dto.specialties) ? dto.specialties : [],
  telefone: dto.phone || '',
  email: dto.email || '',
  unidades: Array.isArray(dto.unit_ids) ? dto.unit_ids : [],
  dataContratacao: dto.hired_at || '',
  status: mapStatus(dto.status),
  created_at: dto.created_at,
  updated_at: dto.updated_at,
  repass_type: dto.repass_type || 'Fixo',
  repass_value: dto.repass_value || 0
})

export async function getEquipe(search?: string): Promise<Profissional[]> {
  const params = search && search.trim() ? { q: search.trim() } : undefined
  const res = await api.get<ProfessionalDto[]>('/professionals', { params })
  const list = Array.isArray(res.data) ? res.data : []
  return list.map(mapDtoToProfissional)
}

// Mapeia Profissional (frontend) para DTO do backend
const mapProfissionalToDto = (p: Partial<Profissional> & { nome?: string }): Partial<ProfessionalDto> => {
  const trimOrUndefined = (v?: string) => {
    const s = (v ?? '').trim();
    return s.length ? s : undefined;
  };
  const numberOrUndefined = (n?: number) => {
    return typeof n === 'number' && !Number.isNaN(n) ? n : undefined;
  };
  const arrOrUndefined = <T>(arr?: T[]) => {
    return Array.isArray(arr) && arr.length ? arr : undefined;
  };

  return {
    name: p.nome || '',
    cpf: trimOrUndefined(p.cpf),
    role_position: trimOrUndefined(p.cargo),
    salary: numberOrUndefined(p.salario),
    specialties: arrOrUndefined(p.especialidades),
    phone: trimOrUndefined(p.telefone),
    email: trimOrUndefined(p.email),
    unit_ids: arrOrUndefined(p.unidades),
    // Datas: enviar undefined quando vazio para evitar erro 22007
    hired_at: trimOrUndefined(p.dataContratacao),
    status: p.status as ProfessionalDto['status'],
    repass_type: p.repass_type || 'Fixo',
    repass_value: p.repass_value || 0
  };
}

export async function createProfissional(input: Partial<Profissional> & { nome: string }): Promise<Profissional> {
  const payload = mapProfissionalToDto(input)
  const res = await api.post<ProfessionalDto>('/professionals', payload)
  return mapDtoToProfissional(res.data)
}

export async function updateProfissional(id: string, input: Partial<Profissional>): Promise<Profissional> {
  const payload = mapProfissionalToDto(input)
  const res = await api.put<ProfessionalDto>(`/professionals/${id}`, payload)
  return mapDtoToProfissional(res.data)
}

export async function deleteProfissional(id: string): Promise<void> {
  await api.delete(`/professionals/${id}`)
}