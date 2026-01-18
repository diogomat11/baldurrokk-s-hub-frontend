import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Wallet, TrendingUp, TrendingDown, Eye, Plus } from 'lucide-react'
import { PaginationControl } from '@/components/ui/PaginationControl'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Modal'

type MovementItem = {
    id: string
    entity_type: 'Equipe' | 'Unidade'
    entity_id: string
    entity_name?: string
    unit_id?: string
    unit_name?: string
    amount: number
    advance_date: string
    status: 'Aberta' | 'Paga' | 'Cancelada'
    type: 'Adiantamento' | 'Bonificacao'
    description?: string
    receipt_url?: string
}

const initialData: MovementItem[] = []

export const LancamentosPage: React.FC = () => {
    const [data, setData] = React.useState<MovementItem[]>(initialData)
    const [search, setSearch] = React.useState('')
    const [mes, setMes] = React.useState(new Date().toISOString().slice(0, 7))
    const [tipo, setTipo] = React.useState('all') // Adiantamento, Bonificacao
    const [isLoading, setIsLoading] = React.useState(false)
    const [openNew, setOpenNew] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)

    // Options for Modal
    const [selectedEntity, setSelectedEntity] = React.useState<{ type: string; id: string } | null>(null)
    const [entityOptions, setEntityOptions] = React.useState<{ id: string; name: string; type: string }[]>([])
    const [form, setForm] = React.useState({
        type: 'Adiantamento' as 'Adiantamento' | 'Bonificacao',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
    })

    // Pagination
    const [currentPage, setCurrentPage] = React.useState(1)
    const [itemsPerPage, setItemsPerPage] = React.useState(25)

    // Load Filter Options (Professionals + Units) and Data
    const loadOptions = async () => {
        const { data: profs } = await supabase.from('professionals').select('id,name')
        const { data: units } = await supabase.from('units').select('id,name')

        const opts = [
            ...(profs || []).map((p: any) => ({ id: p.id, name: p.name, type: 'Equipe' })),
            ...(units || []).map((u: any) => ({ id: u.id, name: u.name, type: 'Unidade' }))
        ]
        setEntityOptions(opts.sort((a, b) => a.name.localeCompare(b.name)))
    }

    const loadData = async () => {
        try {
            setIsLoading(true)
            const [y, m] = mes.split('-').map(Number)
            const start = `${mes}-01`
            const end = `${mes}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`

            let q = supabase
                .from('financial_movements')
                .select(`
          id, entity_type, entity_id, unit_id, amount, advance_date, status, type, description, receipt_url
        `) // Note: joined tables might need aliases or separate handling if polymorphism is cleaner via logic
                // But assuming FK setup (entity_id is just UUID, no FK unless we check type).
                // Actually financial_movements usually has entity_type and entity_id.
                // We might need to fetch names manually if no direct FK.
                // Or left join both.
                .gte('advance_date', start)
                .lte('advance_date', end)
                .order('advance_date', { ascending: false })

            if (tipo !== 'all') {
                q = q.eq('type', tipo)
            }

            const { data: rows, error } = await q
            if (error) throw error

            // Enrich with names manually if needed
            // Assuming 0029 migration preserved structure where entity_id is just uuid.
            // We can fetch entities in bulk or just lookup from loaded options.

            // enriched block removed

            // Fix names
            // We'll map naming logic
            const ui: MovementItem[] = await Promise.all(rows.map(async (r: any) => {
                let name = '—'
                if (r.entity_type === 'Equipe') {
                    const { data: p } = await supabase.from('professionals').select('name').eq('id', r.entity_id).maybeSingle()
                    if (p) name = p.name
                } else if (r.entity_type === 'Unidade') {
                    const { data: u } = await supabase.from('units').select('name').eq('id', r.entity_id).maybeSingle()
                    if (u) name = u.name
                }

                return {
                    id: r.id,
                    entity_type: r.entity_type,
                    entity_id: r.entity_id,
                    entity_name: name,
                    unit_id: r.unit_id,
                    unit_name: r.units?.name,
                    amount: Number(r.amount),
                    advance_date: r.advance_date,
                    status: r.status,
                    type: r.type,
                    description: r.description || '',
                    receipt_url: r.receipt_url
                }
            }))

            setData(ui)
        } catch (e: any) {
            toast.error('Erro ao carregar lançamentos', { description: e.message })
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        loadOptions()
    }, [])

    React.useEffect(() => {
        loadData()
    }, [mes, tipo])

    // Filter logic
    const filtered = React.useMemo(() => {
        return data.filter(d => {
            const matchSearch = !search || d.entity_name?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase())
            return matchSearch
        })
    }, [data, search])

    const paginated = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        const end = start + itemsPerPage
        return filtered.slice(start, end)
    }, [filtered, currentPage, itemsPerPage])

    const totals = React.useMemo(() => ({
        credits: filtered.filter(d => d.type === 'Bonificacao').reduce((acc, d) => acc + d.amount, 0),
        debits: filtered.filter(d => d.type === 'Adiantamento').reduce((acc, d) => acc + d.amount, 0),
        count: filtered.length
    }), [filtered])

    const handleSave = async () => {
        if (!selectedEntity || !form.amount || !form.date) {
            toast.error('Preencha os campos obrigatórios')
            return
        }
        try {
            setIsSaving(true)
            const { error } = await supabase.from('financial_movements').insert([{
                entity_type: selectedEntity.type,
                entity_id: selectedEntity.id,
                amount: Number(form.amount),
                advance_date: form.date,
                type: form.type,
                description: form.description,
                status: 'Aberta'
            }])
            if (error) throw error
            toast.success('Lançamento criado com sucesso')
            setOpenNew(false)
            loadData()
            // Reset form
            setForm({ type: 'Adiantamento', amount: '', date: new Date().toISOString().slice(0, 10), description: '' })
            setSelectedEntity(null)
        } catch (e: any) {
            toast.error('Erro ao salvar', { description: e.message })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Total Bonificações" value={formatCurrency(totals.credits)} icon={TrendingUp} color="success" />
                <MetricCard title="Total Adiantamentos" value={formatCurrency(totals.debits)} icon={TrendingDown} color="warning" />
                <MetricCard title="Saldo do Período" value={formatCurrency(totals.credits - totals.debits)} icon={Wallet} color={totals.credits >= totals.debits ? "primary" : "danger"} />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Lançamentos (Adiantamentos/Bonificações)</CardTitle>
                        <Dialog open={openNew} onOpenChange={setOpenNew}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Novo Lançamento
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Novo Lançamento</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Tipo</label>
                                        <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Adiantamento">Adiantamento (Débito)</SelectItem>
                                                <SelectItem value="Bonificacao">Bonificação (Crédito)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium">Beneficiário (Profissional/Unidade)</label>
                                        <Select
                                            value={selectedEntity ? `${selectedEntity.type}:${selectedEntity.id}` : ''}
                                            onValueChange={(v) => {
                                                const [t, id] = v.split(':')
                                                setSelectedEntity({ type: t, id })
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {entityOptions.map(opt => (
                                                    <SelectItem key={`${opt.type}:${opt.id}`} value={`${opt.type}:${opt.id}`}>
                                                        {opt.name} ({opt.type === 'Equipe' ? 'Prof' : 'Unid'})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input label="Valor" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                                    <Input label="Data" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                    <Input label="Motivo/Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
                                    <Button onClick={handleSave} disabled={isSaving}>Salvar</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-muted-foreground">Mês Referência</label>
                            <input type="month" className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm" value={mes} onChange={e => setMes(e.target.value)} />
                        </div>
                        <Select value={tipo} onValueChange={setTipo}>
                            <SelectTrigger><SelectValue placeholder="Todos Tipos" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="Adiantamento">Adiantamentos</SelectItem>
                                <SelectItem value="Bonificacao">Bonificações</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                        <table className="min-w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="text-left">
                                    <th className="px-4 py-3 font-medium">Data</th>
                                    <th className="px-4 py-3 font-medium">Beneficiário</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium">Motivo</th>
                                    <th className="px-4 py-3 font-medium">Valor</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={7} className="p-4 text-center">Carregando...</td></tr>
                                ) : paginated.length === 0 ? (
                                    <tr><td colSpan={7} className="p-4 text-center">Nenhum lançamento encontrado</td></tr>
                                ) : (
                                    paginated.map(item => (
                                        <tr key={item.id} className="border-t">
                                            <td className="px-4 py-3">{formatDate(item.advance_date)}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.entity_name}</div>
                                                <div className="text-xs text-muted-foreground">{item.entity_type === 'Equipe' ? 'Profissional' : 'Unidade'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.type === 'Bonificacao' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.description || '-'}</td>
                                            <td className="px-4 py-3 font-medium">{formatCurrency(item.amount)}</td>
                                            <td className="px-4 py-3"><StatusBadge status={item.status === 'Aberta' ? 'Pendente' : item.status} /></td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="icon" disabled={!item.receipt_url} onClick={() => item.receipt_url && window.open(item.receipt_url, '_blank')}>
                                                    <Eye className={`h-4 w-4 ${item.receipt_url ? 'text-primary' : 'text-muted-foreground'}`} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4">
                        <PaginationControl
                            currentPage={currentPage}
                            totalItems={filtered.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
