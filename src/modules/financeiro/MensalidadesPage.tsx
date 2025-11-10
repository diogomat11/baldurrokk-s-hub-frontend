import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Receipt, CheckCircle, MessageSquare } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { markInvoicePaid } from '@/services/financeiro'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Modal'

type FaturaItem = {
  id: string
  aluno: string
  unidade: string
  mes: string // YYYY-MM
  valor: number
  vencimento: string
  status: 'Pendente' | 'Pago' | 'Vencido' | 'Atrasado' | 'Cancelado'
}

// Dados de exemplo removidos para evitar avisos de variável não utilizada

export const MensalidadesPage: React.FC = () => {
  const [faturas, setFaturas] = React.useState<FaturaItem[]>([])
  const [search, setSearch] = React.useState('')
  const [mes, setMes] = React.useState('2025-10')
  const [status, setStatus] = React.useState('all')
  const [unidade, setUnidade] = React.useState('all')
  const [dueDay, setDueDay] = React.useState<number>(10)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [openNew, setOpenNew] = React.useState(false)
  const [units, setUnits] = React.useState<{ id: string; name: string }[]>([])
  const [students, setStudents] = React.useState<{ id: string; name: string }[]>([])
  const [form, setForm] = React.useState({
    unit_id: '',
    student_id: '',
    amount: '',
    due_date: '',
    payment_method: 'PIX' as 'Dinheiro' | 'PIX' | 'Crédito' | 'Débito',
    status: 'Pendente' as FaturaItem['status'],
  })
  const [isSaving, setIsSaving] = React.useState(false)
  const pixConfigRef = React.useRef<{ pix_type: string; pix_key: string } | null>(null)

  const filtered = React.useMemo(() => {
    return faturas.filter((f) => {
      const matchesSearch = !search || f.aluno.toLowerCase().includes(search.toLowerCase())
      const matchesMes = !mes || f.mes === mes
      const matchesStatus = status === 'all' || f.status === status
      const matchesUnidade = unidade === 'all' || f.unidade === unidade
      return matchesSearch && matchesMes && matchesStatus && matchesUnidade
    })
  }, [faturas, search, mes, status, unidade])

  const total = React.useMemo(() => faturas.reduce((acc, f) => acc + f.valor, 0), [faturas])
  const totalPendentes = React.useMemo(() => faturas.filter(f => f.status === 'Pendente').reduce((acc, f) => acc + f.valor, 0), [faturas])
  const totalPagas = React.useMemo(() => faturas.filter(f => f.status === 'Pago').reduce((acc, f) => acc + f.valor, 0), [faturas])
  const totalVencidas = React.useMemo(() => faturas.filter(f => f.status === 'Vencido' || f.status === 'Atrasado').reduce((acc, f) => acc + f.valor, 0), [faturas])

  const handleMarcarPago = async (id: string) => {
    try {
      await markInvoicePaid(id, { payment_method: 'PIX' })
      toast.success('Fatura marcada como paga')
      await loadFaturas()
    } catch (e: any) {
      toast.error('Falha ao marcar fatura paga', { description: e?.message || String(e) })
    }
  }

  const handleGerarMensalidades = async () => {
    try {
      setIsGenerating(true)
      const generationDate = mes ? `${mes}-01` : new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase.rpc('generate_invoices_for_active_students', {
        p_generation_date: generationDate,
        p_due_day: dueDay,
      })
      if (error) {
        toast.error('Erro ao gerar mensalidades', { description: error.message })
        return
      }
      const count = typeof data === 'number' ? data : 0
      toast.success('Mensalidades geradas', { description: `${count} fatura(s) criadas para ${mes}` })
      await loadFaturas()
    } catch (e: any) {
      toast.error('Erro inesperado ao gerar mensalidades', { description: e?.message || String(e) })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEnviarWhatsapp = async (id: string) => {
    try {
      // Carrega dados da fatura e do aluno/responsável
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('id,student_id,unit_id,due_date,amount_total,amount_net,status')
        .eq('id', id)
        .limit(1)
        .maybeSingle()
      if (invErr || !inv) {
        toast.error('Não foi possível carregar a fatura', { description: invErr?.message })
        return
      }
      const { data: stu, error: stuErr } = await supabase
        .from('students')
        .select('id,name,guardian_name,guardian_phone')
        .eq('id', String(inv.student_id))
        .limit(1)
        .maybeSingle()
      if (stuErr || !stu) {
        toast.error('Não foi possível carregar o aluno/responsável', { description: stuErr?.message })
        return
      }

      const phoneRaw = String(stu.guardian_phone || '').trim()
      if (!phoneRaw) {
        toast.error('Responsável sem telefone cadastrado')
        return
      }
      const normalizePhone = (p: string) => {
        const digits = String(p).replace(/\D+/g, '')
        // Se já vier com DDI 55 e 11 dígitos, mantém; caso contrário, tenta aplicar DDI BR
        if (digits.length === 13 && digits.startsWith('55')) return digits
        if (digits.length === 11) return `55${digits}`
        if (digits.length === 10) return `55${digits}`
        // último recurso: usa como veio
        return digits
      }
      const phone = normalizePhone(phoneRaw)
      if (!phone) {
        toast.error('Telefone do responsável inválido')
        return
      }

      // Busca template da categoria adequada (Cobrança para mensalidades)
      const defaultMensalidade = "Olá {{responsavel}}, segue abaixo valor da mensalidade do aluno(a) {{aluno}}, referente ao mês {{mes}} vencimento em {{data_vencimento}}, abaixo chave PIX para pagamento {{tipo_chave}} - {{chave_pix}}"
      const defaultCobranca = "Olá {{responsavel}}, segue abaixo valor da mensalidade do aluno(a) {{aluno}}, referente ao mês {{mes}} vencido em {{data_vencimento}}.\nAbaixo chave PIX para pagamento {{tipo_chave}} - {{chave_pix}}.\nLembramos que atrasos podem implicar em suspensão das aulas"
      const faturaUi = faturas.find(f => f.id === id)
      const isVencida = faturaUi && (faturaUi.status === 'Vencido' || faturaUi.status === 'Atrasado')

      let templateText = defaultMensalidade
      try {
        const { data: tplRows } = await supabase
          .from('integrations')
          .select('id, whatsapp_template')
          .in('id', ['whatsapp:cobranca:mensalidade','whatsapp:cobranca:cobranca','whatsapp:cobranca:default'])
        const tplMens = (tplRows || []).find((r: any) => String(r.id) === 'whatsapp:cobranca:mensalidade')
        const tplCobr = (tplRows || []).find((r: any) => String(r.id) === 'whatsapp:cobranca:cobranca')
        const tplDef = (tplRows || []).find((r: any) => String(r.id) === 'whatsapp:cobranca:default')
        templateText = (isVencida ? (tplCobr?.whatsapp_template || defaultCobranca) : (tplMens?.whatsapp_template || defaultMensalidade))
        if (!templateText) templateText = tplDef?.whatsapp_template || (isVencida ? defaultCobranca : defaultMensalidade)
      } catch { /* mantém default */ }

      const amount = Number(inv.amount_net ?? inv.amount_total ?? 0)
      const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
      const due = String(inv.due_date || '')
      const mesFmt = (due || '').slice(0, 7)
      const vencFmt = formatDate(due)
      // Carrega PIX de Dados Bancários
      if (!pixConfigRef.current) {
        try {
          const { data: pixRow } = await supabase
            .from('integrations')
            .select('id, whatsapp_template')
            .eq('id', 'banking:pix')
            .maybeSingle()
          if (pixRow && (pixRow as any).whatsapp_template) {
            try {
              const j = JSON.parse(String((pixRow as any).whatsapp_template))
              pixConfigRef.current = { pix_type: String(j.pix_type || 'PIX'), pix_key: String(j.pix_key || 'informar') }
            } catch {}
          }
        } catch {}
      }

      const vars: Record<string,string> = {
        responsavel: String(stu.guardian_name || 'Responsável'),
        aluno: String(stu.name || 'Aluno'),
        mes: mesFmt,
        data_vencimento: vencFmt,
        valor: valorFmt,
        tipo_chave: pixConfigRef.current?.pix_type || 'PIX',
        chave_pix: pixConfigRef.current?.pix_key || 'informar',
      }
      const fillTemplate = (t: string, v: Record<string,string>) => (
        t
          .replace(/\{\{(\w+)\}\}/g, (_, key) => v[key] ?? '')
          .replace(/\[(responsável|responsavel|aluno|nomeAluno|nome aluno|mês|mes|dataVencimento|data_vencimento|valor|tipo chave|tipo_chave|chave pix|chave_pix)\]/gi, (m) => {
            const k = m.replace(/\[|\]/g, '')
            const map: Record<string,string> = {
              'responsável': v.responsavel, 'responsavel': v.responsavel,
              'aluno': v.aluno, 'nomeAluno': v.aluno, 'nome aluno': v.aluno,
              'mês': v.mes, 'mes': v.mes,
              'dataVencimento': v.data_vencimento, 'data_vencimento': v.data_vencimento,
              'valor': v.valor,
              'tipo chave': v.tipo_chave, 'tipo_chave': v.tipo_chave,
              'chave pix': v.chave_pix, 'chave_pix': v.chave_pix,
            }
            return map[k] ?? ''
          })
      )

      const message = fillTemplate(templateText, vars)
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      if (typeof window !== 'undefined') window.open(url, '_blank')
      toast.success('Abrindo WhatsApp Web', { description: `${stu.guardian_name || 'Responsável'} • ${stu.name || 'Aluno'}` })
    } catch (e: any) {
      toast.error('Falha ao abrir WhatsApp', { description: e?.message || String(e) })
    }
  }

  const mapStatus = (s: string): FaturaItem['status'] => {
    switch (s) {
      case 'Aberta': return 'Pendente'
      case 'Paga': return 'Pago'
      case 'Vencida': return 'Vencido'
      case 'Cancelada': return 'Cancelado'
      default: return 'Pendente'
    }
  }

  const loadFaturas = async () => {
    try {
      setIsLoading(true)
      const monthStart = `${mes}-01`
      // Para obter o último dia do mês, criamos um Date e formatamos
      // Último dia do mês calculado, caso necessário no futuro
      // const [y, m] = mes.split('-').map(Number)
      // const last = new Date(y, m, 0).getDate()
      // const monthEnd = `${mes}-${String(last).padStart(2, '0')}`

      // Usa RPC segura para evitar erro 500 (recursão RLS)
      const rpcStatus = (() => {
        if (status === 'all') return null
        switch (status) {
          case 'Pendente': return 'Aberta'
          case 'Pago': return 'Paga'
          case 'Vencido': return 'Vencida'
          case 'Atrasado': return 'Vencida' // backend não diferencia Atrasado
          case 'Cancelado': return 'Cancelada'
          default: return null
        }
      })()

      const { data: invoices, error } = await supabase
        .rpc('list_invoices_for_month', {
          p_month: monthStart,
          p_unit_id: null,
          p_status: rpcStatus,
        })

      if (error) {
        console.error('[Supabase] Erro ao carregar invoices:', error)
        toast.error('Erro ao carregar mensalidades', { description: error.message })
        return
      }

      const uiData: FaturaItem[] = (invoices || []).map((inv: any) => ({
        id: inv.id,
        aluno: inv.student_name || inv.student_id,
        unidade: inv.unit_name || inv.unit_id,
        mes: (inv.due_date || '').slice(0, 7),
        valor: Number(inv.amount_net ?? inv.amount_total ?? 0),
        vencimento: inv.due_date,
        status: mapStatus(inv.status || 'Aberta'),
      }))

      setFaturas(uiData)
    } finally {
      setIsLoading(false)
    }
  }

  const loadFormLookups = async () => {
    const [{ data: unitsData, error: unitsErr }, { data: studentsData, error: studentsErr }] = await Promise.all([
      supabase.from('units').select('id,name'),
      supabase.from('students').select('id,name').eq('status', 'Ativo'),
    ])
    if (unitsErr) console.error('[Supabase] Erro ao carregar units:', unitsErr)
    if (studentsErr) console.error('[Supabase] Erro ao carregar students:', studentsErr)
    setUnits((unitsData || []).map((u: any) => ({ id: u.id, name: u.name })))
    setStudents((studentsData || []).map((s: any) => ({ id: s.id, name: s.name })))
  }

  React.useEffect(() => {
    loadFaturas()
    loadFormLookups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total" value={formatCurrency(total)} icon={Receipt} color="accent" />
        <MetricCard title="Pendentes" value={formatCurrency(totalPendentes)} icon={Receipt} color="warning" />
        <MetricCard title="Pagas" value={formatCurrency(totalPagas)} icon={CheckCircle} color="success" />
        <MetricCard title="Vencidas/Atrasadas" value={formatCurrency(totalVencidas)} icon={Receipt} color="danger" />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Recebíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              type="text"
              label="Buscar aluno"
              placeholder="Digite o nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                <SelectItem value="Vencido">Vencido</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unidade} onValueChange={setUnidade}>
              <SelectTrigger label="Unidade">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Centro">Centro</SelectItem>
                <SelectItem value="Sul">Sul</SelectItem>
                <SelectItem value="Norte">Norte</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              label="Dia vencimento"
              placeholder="Ex.: 10"
              value={String(dueDay)}
              min={1}
              max={28}
              onChange={(e) => setDueDay(Math.min(28, Math.max(1, Number(e.target.value) || 1)))}
            />
            <div className="flex items-end">
              <div className="flex gap-2 w-full">
                <Dialog open={openNew} onOpenChange={setOpenNew}>
                  <DialogTrigger asChild>
                    <Button className="flex-1" variant="outline">Nova fatura</Button>
                  </DialogTrigger>
                  <DialogContent size="lg">
                    <DialogHeader>
                      <DialogTitle>Criar nova fatura</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                        <SelectTrigger label="Unidade">
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                        <SelectTrigger label="Aluno">
                          <SelectValue placeholder="Selecione o aluno" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        label="Valor"
                        placeholder="Ex.: 200,00"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      />
                      <div>
                        <label className="text-sm font-medium text-foreground">Vencimento</label>
                        <input
                          type="date"
                          value={form.due_date}
                          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                          className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                      <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v as any })}>
                        <SelectTrigger label="Forma de pagamento">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="Crédito">Crédito</SelectItem>
                          <SelectItem value="Débito">Débito</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FaturaItem['status'] })}>
                        <SelectTrigger label="Status">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Pago">Pago</SelectItem>
                          <SelectItem value="Cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpenNew(false)} disabled={isSaving}>Cancelar</Button>
                      <Button onClick={async () => {
                        try {
                          setIsSaving(true)
                          if (!form.unit_id || !form.student_id || !form.amount || !form.due_date) {
                            toast.error('Preencha todos os campos obrigatórios')
                            return
                          }
                          const toFinanceStatus = (s: FaturaItem['status']) => (
                            s === 'Pago' ? 'Paga' : (s === 'Cancelado' ? 'Cancelada' : 'Aberta')
                          )
                          const amountNum = Number(form.amount)
                          const { error } = await supabase
                            .from('invoices')
                            .insert([{
                              unit_id: form.unit_id,
                              student_id: form.student_id,
                              due_date: form.due_date,
                              amount_total: amountNum,
                              amount_net: amountNum,
                              payment_method: form.payment_method,
                              status: toFinanceStatus(form.status),
                            }])
                          if (error) {
                            toast.error('Erro ao criar fatura', { description: error.message })
                            return
                          }
                          toast.success('Fatura criada com sucesso')
                          setOpenNew(false)
                          setForm({ unit_id: '', student_id: '', amount: '', due_date: '', payment_method: 'PIX', status: 'Pendente' })
                          await loadFaturas()
                        } catch (e: any) {
                          toast.error('Falha ao salvar', { description: e?.message || String(e) })
                        } finally {
                          setIsSaving(false)
                        }
                      }} disabled={isSaving}>Salvar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button onClick={handleGerarMensalidades} className="flex-1" disabled={isGenerating || isLoading}>
                  {isGenerating ? 'Gerando…' : (isLoading ? 'Carregando…' : 'Gerar mensalidades')}
                </Button>
              </div>
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
                  <th className="px-4 py-3 text-xs text-muted-foreground">Aluno</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Unidade</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Mês</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Vencimento</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                      Carregando mensalidades...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                      Nenhuma fatura encontrada
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => (
                    <tr key={f.id} className="border-t border-border">
                      <td className="px-4 py-3">{f.aluno}</td>
                      <td className="px-4 py-3">{f.unidade}</td>
                      <td className="px-4 py-3">{f.mes}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(f.valor)}</td>
                      <td className="px-4 py-3">{formatDate(f.vencimento)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEnviarWhatsapp(f.id)}
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            disabled={f.status === 'Pago'}
                            onClick={() => handleMarcarPago(f.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar pago
                          </Button>
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