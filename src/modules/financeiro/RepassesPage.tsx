import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { FileBarChart, CheckCircle, MessageSquare } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { markRepassPaid } from '@/services/financeiro'

type RepassItem = {
  id: string
  referencia: string // Profissional/Unidade
  tipo: 'Profissional' | 'Unidade'
  valor: number
  mes: string // YYYY-MM
  status: 'Pendente' | 'Pago'
}

const initialData: RepassItem[] = [
  { id: '1', referencia: 'Unidade Centro', tipo: 'Unidade', valor: 1800, mes: '2025-10', status: 'Pendente' },
  { id: '2', referencia: 'Prof. Maria Santos', tipo: 'Profissional', valor: 950, mes: '2025-10', status: 'Pago' },
  { id: '3', referencia: 'Unidade Sul', tipo: 'Unidade', valor: 1200, mes: '2025-10', status: 'Pendente' },
]

export const RepassesPage: React.FC = () => {
  const [repasses, setRepasses] = React.useState<RepassItem[]>(initialData)
  const [mes, setMes] = React.useState('2025-10')
  const [status, setStatus] = React.useState('all')
  const [tipo, setTipo] = React.useState('all')
  const [isLoading, setIsLoading] = React.useState(false)

  const filtered = React.useMemo(() => {
    return repasses.filter((r) => {
      const matchesMes = !mes || r.mes === mes
      const matchesStatus = status === 'all' || r.status === (status as RepassItem['status'])
      const matchesTipo = tipo === 'all' || r.tipo === (tipo as RepassItem['tipo'])
      return matchesMes && matchesStatus && matchesTipo
    })
  }, [repasses, mes, status, tipo])

  const total = React.useMemo(() => filtered.reduce((acc, r) => acc + r.valor, 0), [filtered])
  const totalPendentes = React.useMemo(() => filtered.filter(r => r.status === 'Pendente').reduce((acc, r) => acc + r.valor, 0), [filtered])
  const totalPagos = React.useMemo(() => filtered.filter(r => r.status === 'Pago').reduce((acc, r) => acc + r.valor, 0), [filtered])

  const loadRepasses = async () => {
    try {
      setIsLoading(true)
      const [y, m] = mes.split('-').map(Number)
      const start = `${mes}-01`
      const end = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`

      const rpcStatus = status === 'all' ? null : (status === 'Pendente' ? 'Aberta' : (status === 'Pago' ? 'Paga' : null))

      let q = supabase
        .from('repasses')
        .select('id,entity_type,entity_id,period_start,period_end,net_value,status')
        .gte('period_start', start)
        .lte('period_end', end)
      if (rpcStatus) q = (q as any).eq('status', rpcStatus)

      const { data, error } = await q
      if (error) {
        toast.error('Erro ao carregar repasses', { description: error.message })
        return
      }

      const tipoMap = (et: string): 'Profissional' | 'Unidade' => (et === 'Equipe' ? 'Profissional' : 'Unidade')
      const ui: RepassItem[] = (data || []).map((row: any) => ({
        id: row.id,
        referencia: `${tipoMap(String(row.entity_type))} ${String(row.entity_id).slice(0, 8)}`,
        tipo: tipoMap(String(row.entity_type)),
        valor: Number(row.net_value || 0),
        mes: String(row.period_start || '').slice(0, 7),
        status: String(row.status || 'Aberta') === 'Paga' ? 'Pago' : 'Pendente',
      }))

      setRepasses(ui)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadRepasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes])

  const handleMarcarPago = async (id: string) => {
    try {
      await markRepassPaid(id)
      toast.success('Repasse marcado como pago')
      await loadRepasses()
    } catch (e: any) {
      toast.error('Falha ao marcar repasse pago', { description: e?.message || String(e) })
    }
  }

  const handleGerarRepasses = () => {
    toast.info('Geração de repasses iniciada (mock)')
  }

  const handleExportarCsv = () => {
    toast.info('Exportação CSV iniciada (mock)')
  }

  const handleEnviarWhatsapp = async (id: string) => {
    try {
      // Carrega dados do repasse
      const { data: rep, error: repErr } = await supabase
        .from('repasses')
        .select('id,entity_type,entity_id,period_start,receipt_url')
        .eq('id', id)
        .limit(1)
        .maybeSingle()
      if (repErr || !rep) { toast.error('Não foi possível carregar o repasse', { description: repErr?.message }); return }

      const isEquipe = String(rep.entity_type) === 'Equipe'
      if (!isEquipe) { toast.info('Envio via WhatsApp disponível apenas para repasses de Profissionais'); return }

      // Tenta buscar em professionals; se não houver, fallback para equipe_tecnica
      let prof: any = null
      {
        const { data: p1, error: e1 } = await supabase
          .from('professionals')
          .select('id,name,telefone')
          .eq('id', String(rep.entity_id))
          .limit(1)
          .maybeSingle()
        if (!e1 && p1) prof = p1
      }
      if (!prof) {
        const { data: p2 } = await supabase
          .from('equipe_tecnica')
          .select('id,nome,telefone')
          .eq('id', String(rep.entity_id))
          .limit(1)
          .maybeSingle()
        if (p2) prof = p2
      }
      if (!prof) { toast.error('Não foi possível carregar o profissional'); return }

      const phoneRaw = String((prof as any).telefone || '').trim()
      if (!phoneRaw) { toast.error('Profissional sem telefone cadastrado'); return }
      const normalizePhone = (p: string) => {
        const digits = String(p).replace(/\D+/g, '')
        if (digits.length === 13 && digits.startsWith('55')) return digits
        if (digits.length === 11) return `55${digits}`
        if (digits.length === 10) return `55${digits}`
        return digits
      }
      const phone = normalizePhone(phoneRaw)
      if (!phone) { toast.error('Telefone do profissional inválido'); return }

      // Template de repasse
      const defaultRepasse = "Olá {{profissional}} segue abaixo demonstrativo de repasse do mês de {{mes}}, peço que faça conferência para que possamos efetuar o pagamento.\n{{link_pdf}}"
      let templateText = defaultRepasse
      try {
        const { data: tplRows } = await supabase
          .from('integrations')
          .select('id, whatsapp_template')
          .eq('id', 'whatsapp:repasse:default')
          .maybeSingle()
        templateText = (tplRows as any)?.whatsapp_template || defaultRepasse
      } catch {}

      const mesFmt = String(rep.period_start || '').slice(0, 7)
      const linkPdf = String((rep as any).receipt_url || '').trim()
      const vars: Record<string,string> = {
        profissional: String((prof as any).name || (prof as any).nome || 'Profissional'),
        mes: mesFmt,
        link_pdf: linkPdf || '[anexo_pdf de Repasse]'
      }
      const fillTemplate = (t: string, v: Record<string,string>) => (
        t
          .replace(/\{\{(\w+)\}\}/g, (_, key) => v[key] ?? '')
          .replace(/\[(Profissional|Mês|Mes|anexo_pdf de Repasse)\]/gi, (m) => {
            const k = m.replace(/\[|\]/g, '')
            const map: Record<string,string> = {
              'Profissional': v.profissional,
              'Mês': v.mes,
              'Mes': v.mes,
              'anexo_pdf de Repasse': v.link_pdf,
            }
            return map[k] ?? ''
          })
      )
      const message = fillTemplate(templateText, vars)
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      if (typeof window !== 'undefined') window.open(url, '_blank')
      toast.success('Abrindo WhatsApp Web', { description: `${(prof as any).name || 'Profissional'} • ${mesFmt}` })
    } catch (e: any) {
      toast.error('Falha ao abrir WhatsApp', { description: e?.message || String(e) })
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total (filtro)" value={formatCurrency(total)} icon={FileBarChart} color="accent" />
        <MetricCard title="Pendentes" value={formatCurrency(totalPendentes)} icon={FileBarChart} color="warning" />
        <MetricCard title="Pagos" value={formatCurrency(totalPagos)} icon={CheckCircle} color="success" />
        <MetricCard title="Itens" value={filtered.length} icon={FileBarChart} color="primary" />
      </div>

      {/* Filtros e ações */}
      <Card>
        <CardHeader>
          <CardTitle>Repasses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Mês</label>
              <input
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger label="Status">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger label="Tipo">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Profissional">Profissional</SelectItem>
                <SelectItem value="Unidade">Unidade</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-end">
              <Button variant="accent" className="w-full" onClick={handleGerarRepasses}>
                Gerar repasses
              </Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={handleExportarCsv}>
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs text-muted-foreground">Referência</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Mês</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                      Carregando repasses...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                      Nenhum repasse encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3">{r.referencia}</td>
                      <td className="px-4 py-3">{r.tipo}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(r.valor)}</td>
                      <td className="px-4 py-3">{r.mes}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            disabled={r.status === 'Pago'}
                            onClick={() => handleMarcarPago(r.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar pago
                          </Button>
                          {r.tipo === 'Profissional' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEnviarWhatsapp(r.id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}