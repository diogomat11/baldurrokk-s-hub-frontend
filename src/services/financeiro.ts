import { api } from '@/services/api'
import { supabase } from '@/services/supabase/client'

export type PaymentMethod = 'PIX' | 'Dinheiro' | 'Cartão' | 'Transferência'

export async function markInvoicePaid(
  id: string,
  opts: {
    payment_method?: PaymentMethod
    paid_at?: string
    receipt_url?: string | null
    professional_id?: string | null
  } = {}
) {
  const payload = {
    payment_method: opts.payment_method ?? 'PIX',
    paid_at: opts.paid_at ?? new Date().toISOString(),
    receipt_url: opts.receipt_url ?? null,
    professional_id: opts.professional_id ?? null,
  }
  await api.put(`/invoices/${id}/mark-paid`, payload)
}

export async function markExpensePaid(id: string) {
  await api.put(`/expenses/${id}/mark-paid`, {})
}

export async function markRepassPaid(
  id: string,
  opts: { paid_at?: string; receipt_url?: string | null } = {}
) {
  const payload = {
    paid_at: opts.paid_at ?? new Date().toISOString(),
    receipt_url: opts.receipt_url ?? null,
  }
  await api.put(`/repasses/${id}/mark-paid`, payload)
}

export async function sendInvoiceWhatsapp(id: string, phone?: string) {
  const payload = phone ? { phone } : {}
  await api.post(`/invoices/${id}/send-whatsapp`, payload)
}

export type RepassPreviewItem = {
  entity_id: string
  entity_name: string
  entity_type: string
  total_invoices: number
  total_bonuses: number
  total_advances: number
  final_value: number
  invoice_count: number
  movement_count: number
  repass_type: string
  repass_base_value: number
}

export async function generateRepassPreview(
  month: string,
  entityType: 'Profissional' | 'Unidade' | 'Ambos',
  entityId?: string
): Promise<RepassPreviewItem[]> {
  const { data, error } = await supabase.rpc('generate_repass_preview', {
    p_month: `${month}-01`,
    p_entity_type: entityType,
    p_entity_id: entityId || null
  })
  if (error) throw error
  return data
}

export async function confirmRepass(
  month: string,
  entityType: string,
  entityId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('confirm_repass', {
    p_month: `${month}-01`,
    p_entity_type: entityType,
    p_entity_id: entityId
  })
  if (error) throw error
  return data
}