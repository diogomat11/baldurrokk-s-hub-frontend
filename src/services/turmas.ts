import { api } from './api'

export interface TurmaDto {
  id: string
  unit_id: string
  name: string
  category: string | null
  vacancies: number | null
  status: string
  schedule: any | null
  teacher_ids: string[] | null
}

export type NewTurmaPayload = {
  unit_id: string
  name: string
  category?: string | null
  vacancies?: number | null
  status?: string
  schedule: any
  teacher_ids?: string[] | null
}

export type UpdateTurmaPayload = Partial<NewTurmaPayload>

export async function getTurmas(filters?: { unitId?: string; status?: string }): Promise<TurmaDto[]> {
  const params: Record<string, string> = {}
  if (filters?.unitId) params.unit_id = filters.unitId
  if (filters?.status) params.status = filters.status
  const { data } = await api.get<TurmaDto[]>('/classes', { params })
  return data || []
}

export async function createTurma(input: NewTurmaPayload): Promise<TurmaDto> {
  const payload: NewTurmaPayload = {
    unit_id: input.unit_id,
    name: input.name,
    category: input.category ?? null,
    vacancies: typeof input.vacancies === 'number' ? input.vacancies : null,
    status: input.status ?? 'Ativo',
    // schedule é jsonb no backend; enviar objeto diretamente
    schedule: input.schedule ?? { slots: [] },
    teacher_ids: Array.isArray(input.teacher_ids) ? input.teacher_ids : [],
  }
  const { data } = await api.post<TurmaDto>('/classes', payload)
  return data
}

export async function updateTurma(id: string, input: UpdateTurmaPayload): Promise<TurmaDto> {
  const payload: UpdateTurmaPayload = {
    unit_id: input.unit_id,
    name: input.name,
    category: input.category ?? null,
    vacancies: typeof input.vacancies === 'number' ? input.vacancies : undefined,
    status: input.status,
    schedule: input.schedule,
    teacher_ids: Array.isArray(input.teacher_ids) ? input.teacher_ids : undefined,
  }
  const { data } = await api.put<TurmaDto>(`/classes/${id}`, payload)
  return data
}

export async function deleteTurma(id: string): Promise<void> {
  await api.delete(`/classes/${id}`)
}