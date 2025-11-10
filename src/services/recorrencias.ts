import { api } from './api';

export type RecurrenceType = 'Monthly' | 'Quarterly' | 'Yearly' | string;

export interface RecorrenciaDto {
  id: string;
  type: RecurrenceType;
  discount_percent: number | null;
  start_date: string | null;
  end_date: string | null;
  units_applicable: string[] | null;
  status: string;
}

export async function getRecorrencias(): Promise<RecorrenciaDto[]> {
  const params: Record<string, string> = { status: 'Ativo' };
  const { data } = await api.get<RecorrenciaDto[]>('/recurrences', { params });
  return data || [];
}