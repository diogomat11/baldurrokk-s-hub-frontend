import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { FileBarChart, CheckCircle, Eye, FileText, Loader2, ArrowRight, ListPlus } from 'lucide-react'
import { PaginationControl } from '@/components/ui/PaginationControl'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { markRepassPaid, generateRepassPreview, confirmRepass, RepassPreviewItem } from '@/services/financeiro'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/Modal'
import { MultiSelect, MultiSelectOption } from '@/components/ui/MultiSelect'

type RepassItem = {
  id: string
  referencia: string // Profissional/Unidade
  tipo: 'Profissional' | 'Unidade'
  valor: number
  gross_value: number
  advance_deduction: number
  mes: string // YYYY-MM
  mes_origem?: string
  status: 'Pendente' | 'Pago'
  receipt_url?: string
}

export const RepassesPage: React.FC = () => {
  const navigate = useNavigate()
  const [repasses, setRepasses] = React.useState<RepassItem[]>([])
  const [mes, setMes] = React.useState(new Date().toISOString().slice(0, 7))
  const [status, setStatus] = React.useState('all')
  const [tipo, setTipo] = React.useState('all')
  const [isLoading, setIsLoading] = React.useState(false)

  // Generation Modal State
  const [openGenerate, setOpenGenerate] = React.useState(false)
  const [genStep, setGenStep] = React.useState<'config' | 'preview'>('config')
  const [genMonth, setGenMonth] = React.useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  })
  const [genType, setGenType] = React.useState<'Profissional' | 'Unidade' | 'Ambos'>('Ambos')

  // Entity Selection Support
  const [entityOptions, setEntityOptions] = React.useState<MultiSelectOption[]>([])
  const [selectedEntities, setSelectedEntities] = React.useState<string[]>([])
  const [loadingOptions, setLoadingOptions] = React.useState(false)

  const [previewData, setPreviewData] = React.useState<RepassPreviewItem[]>([])
  const [selectedPreviews, setSelectedPreviews] = React.useState<string[]>([]) // Entity IDs from preview
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Load Entity Options when GenType changes
  React.useEffect(() => {
    async function loadOpts() {
      if (!openGenerate) return
      if (genType === 'Ambos') {
        setEntityOptions([])
        setSelectedEntities([])
        return
      }
      setLoadingOptions(true)
      try {
        let opts: MultiSelectOption[] = []
        if (genType === 'Profissional') {
          const { data } = await supabase.from('professionals').select('id, name').order('name')
          opts = (data || []).map((p: any) => ({ label: p.name, value: p.id }))
        } else if (genType === 'Unidade') {
          const { data } = await supabase.from('units').select('id, name').order('name')
          opts = (data || []).map((u: any) => ({ label: u.name, value: u.id }))
        }
        setEntityOptions(opts)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOpts()
  }, [genType, openGenerate])

  const filtered = React.useMemo(() => {
    return repasses.filter((r) => {
      const matchesMes = !mes || r.mes === mes
      const matchesStatus = status === 'all' || r.status === (status as RepassItem['status'])
      const matchesTipo = tipo === 'all' || r.tipo === (tipo as RepassItem['tipo'])
      return matchesMes && matchesStatus && matchesTipo
    })
  }, [repasses, mes, status, tipo])

  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(25)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [mes, status, tipo])

  const paginatedRepasses = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filtered.slice(start, end)
  }, [filtered, currentPage, itemsPerPage])

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
        .select('id,entity_type,entity_id,period_start,period_end,net_value,gross_value,advance_deduction,status,receipt_url')
        .gte('period_start', start)
        .lte('period_end', end)
      if (rpcStatus) q = (q as any).eq('status', rpcStatus)

      const { data, error } = await q
      if (error) {
        toast.error('Erro ao carregar repasses', { description: error.message })
        return
      }

      const { data: profs } = await supabase.from('professionals').select('id,name')
      const { data: units } = await supabase.from('units').select('id,name')

      const getName = (type: string, id: string) => {
        if (type === 'Equipe') return (profs || []).find((p: any) => p.id === id)?.name || 'Profissional'
        if (type === 'Unidade') return (units || []).find((u: any) => u.id === id)?.name || 'Unidade'
        return 'Desconhecido'
      }

      const tipoMap = (et: string): 'Profissional' | 'Unidade' => (et === 'Equipe' ? 'Profissional' : 'Unidade')

      const ui: RepassItem[] = (data || []).map((row: any) => ({
        id: row.id,
        referencia: getName(String(row.entity_type), String(row.entity_id)),
        tipo: tipoMap(String(row.entity_type)),
        valor: Number(row.net_value || 0),
        gross_value: Number(row.gross_value || 0),
        advance_deduction: Number(row.advance_deduction || 0),
        mes: String(row.period_start || '').slice(0, 7),
        mes_origem: row.origin_month ? String(row.origin_month).slice(0, 7) : String(row.period_start || '').slice(0, 7),
        status: String(row.status || 'Aberta') === 'Paga' ? 'Pago' : 'Pendente',
        receipt_url: row.receipt_url
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

  // Generation Logic
  const handlePreview = async () => {
    try {
      setIsGenerating(true)
      // Pass NULL to RPC to get all, then filter in JS
      const data = await generateRepassPreview(genMonth, genType)

      let filteredData = data
      if (genType !== 'Ambos' && selectedEntities.length > 0) {
        filteredData = data.filter(d => selectedEntities.includes(d.entity_id))
      }

      setPreviewData(filteredData)
      // Default select all with positive values or meaningful data
      setSelectedPreviews(filteredData.filter(d => d.final_value !== 0 || d.invoice_count > 0 || d.movement_count > 0).map(d => d.entity_id))
      setGenStep('preview')
    } catch (e: any) {
      toast.error('Erro ao processar', { description: e.message })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirmGeneration = async () => {
    try {
      setIsGenerating(true)
      let successCount = 0

      for (const entityId of selectedPreviews) {
        const item = previewData.find(d => d.entity_id === entityId)
        if (!item) continue
        await confirmRepass(genMonth, item.entity_type === 'Profissional' ? 'Profissional' : item.entity_type, entityId)
        successCount++
      }

      toast.success(`${successCount} repasses gerados com sucesso`)
      setOpenGenerate(false)
      setGenStep('config')
      if (mes === genMonth) loadRepasses() // Refresh if viewing same month
    } catch (e: any) {
      toast.error('Erro ao gerar repasses', { description: e.message })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEnviarWhatsapp = async (_: string, ref: string) => {
    toast.info(`Funcionalidade WhatsApp para ${ref} em implementação.`)
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
          <div className="flex justify-between items-center">
            <CardTitle>Repasses</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/financeiro/lancamentos')}>
              <ListPlus className="h-4 w-4 mr-2" />
              Gerenciar Lançamentos
            </Button>
          </div>
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
              <Dialog open={openGenerate} onOpenChange={(open) => {
                setOpenGenerate(open)
                if (!open) {
                  setGenStep('config')
                  setSelectedEntities([])
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="accent" className="w-full">
                    Gerar repasses
                  </Button>
                </DialogTrigger>
                <DialogContent size="lg" className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Gerar Repasses Automáticos</DialogTitle>
                  </DialogHeader>

                  {genStep === 'config' ? (
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Mês de Referência</label>
                          <input type="month" className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm"
                            value={genMonth} onChange={e => setGenMonth(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Tipo</label>
                          <Select value={genType} onValueChange={(v: any) => setGenType(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ambos">Ambos (Profissionais e Unidades)</SelectItem>
                              <SelectItem value="Profissional">Apenas Profissionais</SelectItem>
                              <SelectItem value="Unidade">Apenas Unidades</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {genType !== 'Ambos' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Beneficiários (1, vários ou todos)</label>
                          <MultiSelect
                            options={entityOptions}
                            values={selectedEntities}
                            onChange={setSelectedEntities}
                            placeholder={loadingOptions ? "Carregando..." : (selectedEntities.length === 0 ? "Todos (ou selecione específicos)" : "Selecionados")}
                            disabled={loadingOptions}
                          />
                          <p className="text-xs text-muted-foreground">Deixe vazio para processar todos os beneficiários deste tipo.</p>
                        </div>
                      )}

                      <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground">
                        <p>O sistema irá buscar todas as mensalidades pagas e lançamentos (adiantamentos/bônus) para calcular o repasse.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Confirmar Geração ({previewData.length} itens)</h4>
                        <Button variant="ghost" size="sm" onClick={() => setGenStep('config')}>Voltar</Button>
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full text-xs">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2 text-left"><input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" checked={selectedPreviews.length === previewData.length} onChange={(e) => setSelectedPreviews(e.target.checked ? previewData.map(d => d.entity_id) : [])} /></th>
                              <th className="px-3 py-2 text-left">Nome</th>
                              <th className="px-3 py-2 text-right">Base / Mensal.</th>
                              <th className="px-3 py-2 text-right">Bônus</th>
                              <th className="px-3 py-2 text-right">Adiant.</th>
                              <th className="px-3 py-2 text-right font-bold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map(item => {
                              const baseVal = item.repass_type === 'Fixo'
                                ? item.repass_base_value
                                : (item.total_invoices * item.repass_base_value / 100)

                              return (
                                <tr key={item.entity_id} className="border-t">
                                  <td className="px-3 py-2">
                                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" checked={selectedPreviews.includes(item.entity_id)} onChange={(e) => {
                                      if (e.target.checked) setSelectedPreviews([...selectedPreviews, item.entity_id])
                                      else setSelectedPreviews(selectedPreviews.filter(id => id !== item.entity_id))
                                    }} />
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="font-medium">{item.entity_name}</div>
                                    <div className="text-xs text-muted-foreground">{item.entity_type}</div>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <div>{formatCurrency(baseVal)}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {item.repass_type === 'Fixo' ? 'Fixo' : `${item.invoice_count} itens`}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-right text-green-600">{formatCurrency(item.total_bonuses)}</td>
                                  <td className="px-3 py-2 text-right text-red-600">{formatCurrency(item.total_advances)}</td>
                                  <td className="px-3 py-2 text-right font-bold">{formatCurrency(item.final_value)}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    {genStep === 'config' ? (
                      <Button onClick={handlePreview} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continuar <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={handleConfirmGeneration} disabled={isGenerating || selectedPreviews.length === 0} variant="success">
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gerar {selectedPreviews.length} Repasses
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                  <th className="px-4 py-3 text-xs text-muted-foreground">Valor Bruto</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Descontos</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Líquido</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Mês Ref.</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={8}>
                      Carregando repasses...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={8}>
                      Nenhum repasse encontrado
                    </td>
                  </tr>
                ) : (
                  paginatedRepasses.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3">{r.referencia}</td>
                      <td className="px-4 py-3">{r.tipo}</td>
                      <td className="px-4 py-3">{formatCurrency(r.gross_value || r.valor)}</td>
                      <td className="px-4 py-3 text-red-600">{formatCurrency(r.advance_deduction)}</td>
                      <td className="px-4 py-3 font-medium text-green-700">{formatCurrency(r.valor)}</td>
                      <td className="px-4 py-3">{r.mes}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="Ver Detalhes/PDF" onClick={() => navigate(`/financeiro/repasses/${r.id}`)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          {['Paga', 'Pago'].includes(r.status) ? (
                            <span title={r.receipt_url ? "Ver Comprovante" : "Repasse sem comprovante Anexo"}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => r.receipt_url && window.open(r.receipt_url, '_blank')}
                                disabled={!r.receipt_url}
                              >
                                <Eye className={`h-4 w-4 ${r.receipt_url ? "text-blue-600" : "text-muted-foreground"}`} />
                              </Button>
                            </span>
                          ) : (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleMarcarPago(r.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Pagar
                              </Button>
                              {r.tipo === 'Profissional' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEnviarWhatsapp(r.id, r.referencia)}
                                  className="px-2"
                                >
                                  <img src="/whatsapp-logo.png" alt="WhatsApp" className="h-4 w-4" />
                                </Button>
                              )}
                            </>
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
        <PaginationControl
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </Card>
    </div>
  )
}