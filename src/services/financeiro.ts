import { api } from '@/services/api'

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