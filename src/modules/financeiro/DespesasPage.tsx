import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Wallet, CheckCircle, Eye } from 'lucide-react'
import { PaginationControl } from '@/components/ui/PaginationControl'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { markExpensePaid } from '@/services/financeiro'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Modal'

type DespesaItem = {
  id: string
  fornecedor: string
  tipo: 'Salário' | 'Aluguel' | 'Utilidades' | 'Outros'
  valor: number
  vencimento: string
  status: 'Pendente' | 'Pago' | 'Vencido' | 'Atrasado' | 'Cancelado'
  receipt_url?: string
}

const initialData: DespesaItem[] = []

export const DespesasPage: React.FC = () => {
  const [despesas, setDespesas] = React.useState<DespesaItem[]>(initialData)
  const [searchFornecedor, setSearchFornecedor] = React.useState('')
  const [mes, setMes] = React.useState('2025-10')
  const [status, setStatus] = React.useState('all')
  const [tipo, setTipo] = React.useState('all')
  const [isLoading, setIsLoading] = React.useState(false)
  const [openNew, setOpenNew] = React.useState(false)
  const [units, setUnits] = React.useState<{ id: string; name: string }[]>([])
  const [form, setForm] = React.useState({
    unit_id: '',
    category: 'Outros',
    description: '',
    amount: '',
    expense_date: '',
    status: 'Pendente' as DespesaItem['status'],
  })
  const [isSaving, setIsSaving] = React.useState(false)

  const filtered = React.useMemo(() => {
    return despesas.filter((d) => {
      const matchesSearch = !searchFornecedor || d.fornecedor.toLowerCase().includes(searchFornecedor.toLowerCase())
      const matchesMes = !mes || d.vencimento.startsWith(mes)
      const matchesStatus = status === 'all' || d.status === (status as DespesaItem['status'])
      const matchesTipo = tipo === 'all' || d.tipo === (tipo as DespesaItem['tipo'])
      return matchesSearch && matchesMes && matchesStatus && matchesTipo
    })
  }, [despesas, searchFornecedor, mes, status, tipo])

  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(25)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchFornecedor, mes, status, tipo])

  const paginatedDespesas = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filtered.slice(start, end)
  }, [filtered, currentPage, itemsPerPage])

  const totalMes = React.useMemo(() => filtered.reduce((acc, d) => acc + d.valor, 0), [filtered])
  const totalPendentes = React.useMemo(() => filtered.filter(d => d.status === 'Pendente').reduce((acc, d) => acc + d.valor, 0), [filtered])
  const totalPagas = React.useMemo(() => filtered.filter(d => d.status === 'Pago').reduce((acc, d) => acc + d.valor, 0), [filtered])

  const loadDespesas = async () => {
    try {
      setIsLoading(true)
      const [y, m] = mes.split('-').map(Number)
      const start = `${mes}-01`
      const end = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`

      const { data, error } = await supabase
        .from('expenses')
        .select('id,description,category,amount,expense_date,status')
        .gte('expense_date', start)
        .lte('expense_date', end)

      if (error) {
        toast.error('Erro ao carregar despesas', { description: error.message })
        return
      }

      const mapStatus = (s: string): DespesaItem['status'] => {
        switch (s) {
          case 'Aberta': return 'Pendente'
          case 'Paga': return 'Pago'
          case 'Cancelada': return 'Cancelado'
          default: return 'Pendente'
        }
      }

      const ui: DespesaItem[] = (data || []).map((row: any) => ({
        id: row.id,
        fornecedor: row.description || '—',
        tipo: (row.category || 'Outros') as DespesaItem['tipo'],
        valor: Number(row.amount || 0),
        vencimento: row.expense_date,
        status: mapStatus(String(row.status || 'Aberta')),
        receipt_url: row.receipt_url
      }))
      setDespesas(ui)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadDespesas()
    // carregar unidades para o formulário
    supabase
      .from('units')
      .select('id,name')
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error('Erro ao carregar unidades:', error)
          return
        }
        setUnits((data || []).map((u: any) => ({ id: u.id, name: u.name })))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes])

  const handleMarcarPago = async (id: string) => {
    try {
      await markExpensePaid(id)
      toast.success('Despesa marcada como paga')
      await loadDespesas()
    } catch (e: any) {
      toast.error('Falha ao marcar despesa paga', { description: e?.message || String(e) })
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total do mês (filtro)" value={formatCurrency(totalMes)} icon={Wallet} color="accent" />
        <MetricCard title="Pendentes" value={formatCurrency(totalPendentes)} icon={Wallet} color="warning" />
        <MetricCard title="Pagas" value={formatCurrency(totalPagas)} icon={CheckCircle} color="success" />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              type="text"
              label="Fornecedor"
              placeholder="Buscar fornecedor"
              value={searchFornecedor}
              onChange={(e) => setSearchFornecedor(e.target.value)}
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
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger label="Tipo">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Salário">Salário</SelectItem>
                <SelectItem value="Aluguel">Aluguel</SelectItem>
                <SelectItem value="Utilidades">Utilidades</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-end">
              <Dialog open={openNew} onOpenChange={setOpenNew}>
                <DialogTrigger asChild>
                  <Button className="w-full">Nova despesa</Button>
                </DialogTrigger>
                <DialogContent size="lg">
                  <DialogHeader>
                    <DialogTitle>Criar nova despesa</DialogTitle>
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
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as DespesaItem['tipo'] })}>
                      <SelectTrigger label="Categoria">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Salário">Salário</SelectItem>
                        <SelectItem value="Aluguel">Aluguel</SelectItem>
                        <SelectItem value="Utilidades">Utilidades</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      label="Descrição"
                      placeholder="Ex.: Internet, Luz, Aluguel"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                    <Input
                      type="number"
                      label="Valor"
                      placeholder="Ex.: 450,00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                    <div>
                      <label className="text-sm font-medium text-foreground">Data</label>
                      <input
                        type="date"
                        value={form.expense_date}
                        onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                        className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DespesaItem['status'] })}>
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
                        if (!form.unit_id || !form.description || !form.amount || !form.expense_date) {
                          toast.error('Preencha todos os campos obrigatórios')
                          return
                        }
                        const toFinanceStatus = (s: DespesaItem['status']) => (
                          s === 'Pago' ? 'Paga' : (s === 'Cancelado' ? 'Cancelada' : 'Aberta')
                        )
                        const { error } = await supabase
                          .from('expenses')
                          .insert([{
                            unit_id: form.unit_id,
                            category: form.category,
                            description: form.description,
                            amount: Number(form.amount),
                            expense_date: form.expense_date,
                            status: toFinanceStatus(form.status),
                          }])
                        if (error) {
                          toast.error('Erro ao criar despesa', { description: error.message })
                          return
                        }
                        toast.success('Despesa criada com sucesso')
                        setOpenNew(false)
                        setForm({ unit_id: '', category: 'Outros', description: '', amount: '', expense_date: '', status: 'Pendente' })
                        await loadDespesas()
                      } catch (e: any) {
                        toast.error('Falha ao salvar', { description: e?.message || String(e) })
                      } finally {
                        setIsSaving(false)
                      }
                    }} disabled={isSaving}>Salvar</Button>
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
                  <th className="px-4 py-3 text-xs text-muted-foreground">Fornecedor</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Vencimento</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                      Carregando despesas...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                      Nenhuma despesa encontrada
                    </td>
                  </tr>
                ) : (
                  paginatedDespesas.map((d) => (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-4 py-3">{d.fornecedor}</td>
                      <td className="px-4 py-3">{d.tipo}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(d.valor)}</td>
                      <td className="px-4 py-3">{formatDate(d.vencimento)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {['Paga', 'Pago'].includes(d.status) ? (
                            <span title={d.receipt_url ? "Ver Comprovante" : "Despesa sem comprovante Anexo"}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => d.receipt_url && window.open(d.receipt_url, '_blank')}
                                disabled={!d.receipt_url}
                              >
                                <Eye className={`h-4 w-4 ${d.receipt_url ? "text-blue-600" : "text-muted-foreground"}`} />
                              </Button>
                            </span>
                          ) : (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleMarcarPago(d.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Marcar pago
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