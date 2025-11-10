import { api } from '@/services/api'
import type { Aluno, FormaPagamento, StatusAluno } from '@/types'

// DTO vindo do backend (tabela 'students')
type StudentDto = {
  id: string
  name: string
  cpf?: string
  birthdate?: string
  start_date?: string
  leaving_date?: string
  payment_method?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_email?: string
  guardian_cpf?: string
  status?: 'Ativo' | 'Inativo' | 'Trial' | 'Active' | 'Inactive'
  unit_id?: string
  class_id?: string
  plan_id?: string
  recurrence_id?: string
  address?: string
  created_at: string
  updated_at: string
}

const mapPaymentMethod = (pm?: string): FormaPagamento => {
  const v = String(pm || '').toLowerCase()
  if (v.includes('pix')) return 'Pix'
  // Tratar enum do backend: 'crédito' e 'débito' mapeiam para 'Cartão'
  if (/(cr[eé]dito|d[eé]bito)/.test(v)) return 'Cartão'
  if (v.includes('din') || v.includes('cash')) return 'Dinheiro'
  if (v.includes('transf')) return 'Transferência'
  // fallback
  return 'Pix'
}

const mapStatus = (s?: StudentDto['status']): StatusAluno => {
  if (!s) return 'Ativo'
  const v = String(s)
  return v === 'Inactive' ? 'Inativo' : v === 'Active' ? 'Ativo' : (v as StatusAluno)
}

const mapDtoToAluno = (dto: StudentDto): Aluno => ({
  id: dto.id,
  avatar: '',
  nome: dto.name,
  dataNascimento: dto.birthdate || '',
  dataInicio: dto.start_date || '',
  dataSaida: dto.leaving_date || '',
  cpf: dto.cpf || '',
  endereco: dto.address || '',
  responsavel: {
    nome: dto.guardian_name || '',
    telefone: dto.guardian_phone || '',
    email: dto.guardian_email || '',
    cpf: dto.guardian_cpf || '',
  },
  unidade: dto.unit_id || '',
  turma: dto.class_id || '',
  planId: dto.plan_id || undefined,
  recurrenceId: dto.recurrence_id || undefined,
  plano: 'Mensal',
  formaPagamento: mapPaymentMethod(dto.payment_method),
  recorrencia: 'Mensal',
  descontos: 0,
  status: mapStatus(dto.status),
  created_at: dto.created_at,
  updated_at: dto.updated_at,
})

export async function getAlunos(search?: string): Promise<Aluno[]> {
  const params = search && search.trim() ? { q: search.trim() } : undefined
  const res = await api.get<StudentDto[]>('/students', { params })
  const list = Array.isArray(res.data) ? res.data : []
  return list.map(mapDtoToAluno)
}

// Mapeia Aluno (frontend) para DTO do backend
const mapAlunoToDto = (
  aluno: Partial<Aluno> & { nome?: string } & { planId?: string; recurrenceId?: string }
): Partial<StudentDto> => {
  const trimOrUndefined = (v?: string) => {
    const s = (v ?? '').trim();
    return s.length ? s : undefined;
  };
  const toPaymentEnum = (pm?: FormaPagamento) => {
    switch (pm) {
      case 'Pix':
        return 'PIX';
      case 'Cartão':
        // Padrão para cartão: usar 'Crédito'
        return 'Crédito';
      case 'Dinheiro':
        return 'Dinheiro';
      case 'Transferência':
        // Não existe no enum, aproxima para PIX
        return 'PIX';
      default:
        return undefined;
    }
  };

  return {
    name: aluno.nome || '',
    cpf: trimOrUndefined(aluno.cpf),
    // Datas: enviar undefined quando vazio para evitar erro 22007 (invalid_datetime_format)
    birthdate: trimOrUndefined(aluno.dataNascimento),
    start_date: trimOrUndefined(aluno.dataInicio),
    leaving_date: trimOrUndefined(aluno.dataSaida),
    // Converter forma de pagamento para enum aceito pelo backend
    payment_method: toPaymentEnum(aluno.formaPagamento),
    guardian_name: trimOrUndefined(aluno.responsavel?.nome),
    guardian_phone: trimOrUndefined(aluno.responsavel?.telefone),
    guardian_email: trimOrUndefined(aluno.responsavel?.email),
    guardian_cpf: trimOrUndefined(aluno.responsavel?.cpf),
    status: aluno.status as StudentDto['status'],
    unit_id: trimOrUndefined(aluno.unidade),
    class_id: trimOrUndefined(aluno.turma),
    plan_id: trimOrUndefined(aluno.planId),
    recurrence_id: trimOrUndefined(aluno.recurrenceId),
    address: trimOrUndefined(aluno.endereco),
  };
}

export async function createAluno(
  input: Partial<Aluno> & { nome: string } & { planId?: string; recurrenceId?: string }
): Promise<Aluno> {
  const payload = mapAlunoToDto(input)
  const res = await api.post<StudentDto>('/students', payload)
  return mapDtoToAluno(res.data)
}

export async function updateAluno(
  id: string,
  input: Partial<Aluno> & { planId?: string; recurrenceId?: string }
): Promise<Aluno> {
  const payload = mapAlunoToDto(input)
  const res = await api.put<StudentDto>(`/students/${id}`, payload)
  return mapDtoToAluno(res.data)
}

export async function deleteAluno(id: string): Promise<void> {
  await api.delete(`/students/${id}`)
}