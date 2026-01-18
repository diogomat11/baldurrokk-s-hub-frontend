import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Receipt, CheckCircle, MessageSquare, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { markInvoicePaid } from '@/services/financeiro'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Modal'
import { PaginationControl } from '@/components/ui/PaginationControl'

type FaturaItem = {
  id: string
  aluno: string
  unidade: string
  mes: string // YYYY-MM
  valor: number
  vencimento: string
  status: 'Pendente' | 'Paga' | 'Pago' | 'Vencido' | 'Atrasado' | 'Cancelado' | 'Vencida' | 'Aberta'
  receipt_url?: string
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
  const [selectedInvoice, setSelectedInvoice] = React.useState<string | null>(null)
  const [paymentProof, setPaymentProof] = React.useState<File | null>(null)
  const [professionals, setProfessionals] = React.useState<{ id: string; name: string }[]>([])
  const [paymentForm, setPaymentForm] = React.useState({
    paid_at: new Date().toISOString().slice(0, 10),
    payment_method: 'PIX' as 'Dinheiro' | 'PIX' | 'Crédito' | 'Débito',
    professional_id: '',
  })
  const [whatsappModal, setWhatsappModal] = React.useState({ open: false, invoiceId: '', type: 'PIX' })
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

  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(25)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, mes, status, unidade])

  const paginatedFaturas = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filtered.slice(start, end)
  }, [filtered, currentPage, itemsPerPage])

  const total = React.useMemo(() => faturas.reduce((acc, f) => acc + f.valor, 0), [faturas])
  const totalPendentes = React.useMemo(() => faturas.filter(f => f.status === 'Pendente').reduce((acc, f) => acc + f.valor, 0), [faturas])
  const totalPagas = React.useMemo(() => faturas.filter(f => f.status === 'Pago').reduce((acc, f) => acc + f.valor, 0), [faturas])
  const totalVencidas = React.useMemo(() => faturas.filter(f => f.status === 'Vencido' || f.status === 'Atrasado').reduce((acc, f) => acc + f.valor, 0), [faturas])

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return
    try {
      setIsSaving(true)
      let proofUrl = null

      if (paymentForm.payment_method !== 'Dinheiro' && !paymentProof) {
        toast.error('É obrigatório anexar comprovante para pagamentos diferentes de dinheiro')
        setIsSaving(false)
        return
      }

      if (paymentProof) {
        const inv = faturas.find(f => f.id === selectedInvoice)
        const alunoName = inv?.aluno?.replace(/[^a-z0-9]/gi, '_') || 'comprovante'
        const mesRef = inv?.mes?.replace('-', '_') || 'mes'
        const fileExt = paymentProof.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'bin'
        const fileName = `${alunoName}-${mesRef}-${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(`${fileName}`, paymentProof)

        if (uploadError) throw new Error('Falha ao fazer upload do comprovante')

        const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName)
        proofUrl = publicUrl
      }

      await markInvoicePaid(selectedInvoice, {
        payment_method: paymentForm.payment_method,
        paid_at: paymentForm.paid_at,
        receipt_url: proofUrl,
        professional_id: paymentForm.payment_method === 'Dinheiro' ? paymentForm.professional_id : null,
      })

      toast.success('Fatura marcada como paga')
      setSelectedInvoice(null)
      setPaymentProof(null) // Reset proof
      await loadFaturas()
    } catch (e: any) {
      toast.error('Falha ao marcar fatura paga', { description: e?.message || String(e) })
    } finally {
      setIsSaving(false)
    }
  }

  const openPaymentModal = async (id: string) => {
    setSelectedInvoice(id)
    setPaymentForm({
      paid_at: new Date().toISOString().slice(0, 10),
      payment_method: 'PIX',
      professional_id: '',
    })
    setPaymentProof(null)
    setProfessionals([]) // Limpa lista anterior

    try {
      // 1. Busca fatura para saber aluno e unidade
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('student_id, unit_id')
        .eq('id', id)
        .single()
      if (invErr || !inv) throw new Error('Fatura não encontrada')

      // 2. Busca dados do aluno (turma)
      const { data: stu, error: stuErr } = await supabase
        .from('students')
        .select('class_id')
        .eq('id', inv.student_id)
        .single()

      let teacherIds: string[] = []

      // 3. Se aluno tem turma, busca professores da turma
      if (stu?.class_id) {
        const { data: cls } = await supabase
          .from('classes')
          .select('teacher_ids')
          .eq('id', stu.class_id)
          .single()
        if (cls?.teacher_ids) teacherIds = cls.teacher_ids
      }

      // 4. Busca profissionais: (Professores da Turma) OU (Gestores da Unidade)
      // Buscamos todos que batem com IDs ou são Gestores daquela unidade
      const { data: profs, error: profErr } = await supabase
        .from('professionals')
        .select('id, name, unit_ids, role_position')
        .eq('status', 'Ativo')

      if (profErr) throw profErr

      const filteredProfs = (profs || []).filter(p => {
        const isTeacher = teacherIds.includes(p.id)
        const isManager = p.role_position === 'Gestor' && p.unit_ids && p.unit_ids.includes(inv.unit_id)
        return isTeacher || isManager
      })

      setProfessionals(filteredProfs)

    } catch (error) {
      console.error('Erro ao carregar profissionais:', error)
      toast.error('Erro ao carregar lista de professores')
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
      setWhatsappModal({ ...whatsappModal, open: true, invoiceId: id, type: 'PIX' })
    } catch (e: any) {
      toast.error('Erro ao abrir' + e)
    }
  }

  const handleConfirmWhatsapp = async () => {
    if (!whatsappModal.invoiceId) return
    try {
      const id = whatsappModal.invoiceId
      const paymentType = whatsappModal.type

      // Carrega dados da fatura e do aluno/responsável
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select('id,student_id,unit_id,due_date,amount_total,amount_net,status')
        .eq('id', id)
        .limit(1)
        .maybeSingle()
      if (invErr || !inv) {
        toast.error('Não foi possível carregar a fatura', { description: invErr?.message })
        setWhatsappModal({ ...whatsappModal, open: false })
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
        setWhatsappModal({ ...whatsappModal, open: false })
        return
      }

      const phoneRaw = String(stu.guardian_phone || '').trim()
      if (!phoneRaw) {
        toast.error('Responsável sem telefone cadastrado')
        setWhatsappModal({ ...whatsappModal, open: false })
        return
      }
      const normalizePhone = (p: string) => {
        const digits = String(p).replace(/\D+/g, '')
        if (digits.length === 13 && digits.startsWith('55')) return digits
        if (digits.length === 11) return `55${digits}`
        if (digits.length === 10) return `55${digits}`
        return digits
      }
      const phone = normalizePhone(phoneRaw)
      if (!phone) {
        toast.error('Telefone do responsável inválido')
        setWhatsappModal({ ...whatsappModal, open: false })
        return
      }

      // Busca template da categoria adequada (Cobrança para mensalidades)
      const defaultMensalidade = "Olá {{responsavel}}, segue abaixo valor da mensalidade do aluno(a) {{aluno}}, referente ao mês {{mes}} vencimento em {{data_vencimento}}, abaixo chave PIX para pagamento {{tipo_chave}} - {{chave_pix}}"
      const defaultCobranca = "Olá {{responsavel}}, segue abaixo valor da mensalidade do aluno(a) {{aluno}}, referente ao mês {{mes}} vencido em {{data_vencimento}}.\nAbaixo chave PIX para pagamento {{tipo_chave}} - {{chave_pix}}.\nLembramos que atrasos podem implicar em suspensão das aulas"
      const defaultCartao = "Olá {{responsavel}}, segue abaixo valor da mensalidade do aluno(a) {{aluno}}, referente ao mês {{mes}} vencimento em {{data_vencimento}}. Para pagamento via Cartão, utilize o link: {{link_pagamento}}"

      const faturaUi = faturas.find(f => f.id === id)
      const isVencida = faturaUi && (faturaUi.status === 'Vencido' || faturaUi.status === 'Atrasado')

      let templateText = ''
      if (paymentType === 'Cartão') {
        try {
          const { data: tplRows } = await supabase
            .from('integrations')
            .select('id, whatsapp_template')
            .in('id', ['whatsapp:cobranca:cartao', 'whatsapp:cobranca:default'])
          const tplCartao = (tplRows || []).find((r: any) => String(r.id) === 'whatsapp:cobranca:cartao')
          const tplDef = (tplRows || []).find((r: any) => String(r.id) === 'whatsapp:cobranca:default')
          templateText = tplCartao?.whatsapp_template || tplDef?.whatsapp_template || defaultCartao
        } catch {
          templateText = defaultCartao
        }
      } else { // PIX
        try {
          const { data: tplRows } = await supabase
            .from('integrations')
            .select('id, whatsapp_template')
            .in('id', ['whatsapp:cobranca:mensalidade', 'whatsapp:cobranca:cobranca', 'whatsapp:cobranca:default'])
          const tplMens = (tplRows || []).find((r: any) => String(r.id) === 'whatsapp:cobranca:mensalidade')
          const tplCobr = (tplRows || []).find((r: any) => String(r.id) === 'whatsapp:cobranca:cobranca')
          const tplDef = (tplRows || []).find((r: any) => String(r.id) === 'whatsapp:cobranca:default')
          templateText = (isVencida ? (tplCobr?.whatsapp_template || defaultCobranca) : (tplMens?.whatsapp_template || defaultMensalidade))
          if (!templateText) templateText = tplDef?.whatsapp_template || (isVencida ? defaultCobranca : defaultMensalidade)
        } catch { /* mantém default */ }
      }

      const amount = Number(inv.amount_net ?? inv.amount_total ?? 0)
      const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
      const due = String(inv.due_date || '')
      const mesFmt = (due || '').slice(0, 7)
      const vencFmt = formatDate(due)

      // Carrega PIX de Dados Bancários (apenas se for PIX)
      if (paymentType === 'PIX' && !pixConfigRef.current) {
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
            } catch { }
          }
        } catch { }
      }

      const vars: Record<string, string> = {
        responsavel: String(stu.guardian_name || 'Responsável'),
        aluno: String(stu.name || 'Aluno'),
        mes: mesFmt,
        data_vencimento: vencFmt,
        valor: valorFmt,
        tipo_chave: pixConfigRef.current?.pix_type || 'PIX',
        chave_pix: pixConfigRef.current?.pix_key || 'informar',
        link_pagamento: 'https://link.de.pagamento.exemplo/fatura/' + id, // Placeholder for card link
      }
      const fillTemplate = (t: string, v: Record<string, string>) => (
        t
          .replace(/\{\{(\w+)\}\}/g, (_, key) => v[key] ?? '')
          .replace(/\[(responsável|responsavel|aluno|nomeAluno|nome aluno|mês|mes|dataVencimento|data_vencimento|valor|tipo chave|tipo_chave|chave pix|chave_pix|link pagamento|link_pagamento)\]/gi, (m) => {
            const k = m.replace(/\[|\]/g, '')
            const map: Record<string, string> = {
              'responsável': v.responsavel, 'responsavel': v.responsavel,
              'aluno': v.aluno, 'nomeAluno': v.aluno, 'nome aluno': v.aluno,
              'mês': v.mes, 'mes': v.mes,
              'dataVencimento': v.data_vencimento, 'data_vencimento': v.data_vencimento,
              'valor': v.valor,
              'tipo chave': v.tipo_chave, 'tipo_chave': v.tipo_chave,
              'chave pix': v.chave_pix, 'chave_pix': v.chave_pix,
              'link pagamento': v.link_pagamento, 'link_pagamento': v.link_pagamento,
            }
            return map[k] ?? ''
          })
      )

      const message = fillTemplate(templateText, vars)
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      if (typeof window !== 'undefined') window.open(url, '_blank')
      toast.success('Abrindo WhatsApp Web', { description: `${stu.guardian_name || 'Responsável'} • ${stu.name || 'Aluno'}` })

      setWhatsappModal({ ...whatsappModal, open: false })
    } catch (e: any) {
      toast.error('Falha ao abrir WhatsApp', { description: e?.message || String(e) })
      setWhatsappModal({ ...whatsappModal, open: false })
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
        receipt_url: inv.receipt_url,
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
      supabase.from('professionals').select('id,name').eq('status', 'Ativo'),
    ])
    if (unitsErr) console.error('[Supabase] Erro ao carregar units:', unitsErr)
    if (studentsErr) console.error('[Supabase] Erro ao carregar students:', studentsErr)
    setUnits((unitsData || []).map((u: any) => ({ id: u.id, name: u.name })))
    setStudents((studentsData || []).map((s: any) => ({ id: s.id, name: s.name })))
    const profsData = (await supabase.from('professionals').select('id,name').eq('status', 'Ativo')).data
    setProfessionals((profsData || []).map((p: any) => ({ id: p.id, name: p.name })))
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
                  paginatedFaturas.map((f) => (
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
                          {['Paga', 'Pago'].includes(f.status) ? (
                            <span title={f.receipt_url ? "Ver Comprovante" : "Mensalidade sem comprovante Anexo"}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => f.receipt_url && window.open(f.receipt_url, '_blank')}
                                disabled={!f.receipt_url}
                              >
                                <Eye className={`h-4 w-4 ${f.receipt_url ? "text-blue-600" : "text-muted-foreground"}`} />
                              </Button>
                            </span>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEnviarWhatsapp(f.id)}
                                title="Enviar WhatsApp"
                                className="px-2"
                              >
                                <img src="/whatsapp-logo.png" alt="WhatsApp" className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => void openPaymentModal(f.id)}
                                title="Marcar como Pago"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Pagar
                              </Button>
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
          <PaginationControl
            currentPage={currentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Data do Pagamento</label>
              <Input
                type="date"
                value={paymentForm.paid_at}
                onChange={(e) => setPaymentForm({ ...paymentForm, paid_at: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Crédito">Crédito</SelectItem>
                  <SelectItem value="Débito">Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentForm.payment_method === 'Dinheiro' && (
              <div>
                <label className="text-sm font-medium">Professor (Recebedor)</label>
                <Select
                  value={paymentForm.professional_id}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, professional_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecionar um professor gerará um adiantamento automático.
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Comprovante (Imagem/PDF)</label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setPaymentProof(file)
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Cancelar</Button>
            <Button onClick={handleConfirmPayment} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={whatsappModal.open} onOpenChange={(open) => setWhatsappModal({ ...whatsappModal, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Cobrança WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Tipo de Pagamento na Mensagem</label>
              <Select
                value={whatsappModal.type}
                onValueChange={(v) => setWhatsappModal({ ...whatsappModal, type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX (Chave)</SelectItem>
                  <SelectItem value="Cartão">Cartão (Link)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Isso selecionará o modelo de mensagem adequado (PIX ou Cartão).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappModal({ ...whatsappModal, open: false })}>Cancelar</Button>
            <Button onClick={handleConfirmWhatsapp}>
              Enviar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}