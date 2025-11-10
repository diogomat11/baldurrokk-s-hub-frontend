import { api } from './api';

export interface PlanoDto {
  id: string;
  name: string;
  unit_id: string;
  frequency_per_week: number;
  value: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

export async function getPlanos(unitId?: string): Promise<PlanoDto[]> {
  const params: Record<string, string> = {};
  if (unitId) params.unit_id = unitId;
  params.status = 'Ativo';
  const { data } = await api.get<PlanoDto[]>('/plans', { params });
  return data || [];
}