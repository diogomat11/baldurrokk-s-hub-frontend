import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Printer, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { StatusBadge } from '@/components/ui/Badge'

type RepasseDetail = {
    id: string
    period_start: string
    period_end: string
    gross_value: number
    advance_deduction: number
    net_value: number
    status: string
    entity_type: string
    entity_id: string
    receipt_url?: string
    paid_at?: string
}

type InvoiceItem = {
    id: string
    student_name: string
    amount_net: number
    due_date: string
}

type MovementItem = {
    id: string
    type: string
    amount: number
    advance_date: string
    description: string
}

export const RepasseDetails: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [repasse, setRepasse] = React.useState<RepasseDetail | null>(null)
    const [invoices, setInvoices] = React.useState<InvoiceItem[]>([])
    const [movements, setMovements] = React.useState<MovementItem[]>([])
    const [pendingInvoices, setPendingInvoices] = React.useState<InvoiceItem[]>([])
    const [entityName, setEntityName] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        if (id) loadData(id)
    }, [id])

    const loadData = async (repassId: string) => {
        try {
            setIsLoading(true)
            // 1. Fetch Repasse
            const { data: r, error: errR } = await supabase.from('repasses').select('*').eq('id', repassId).single()
            if (errR) throw errR
            setRepasse(r)

            // 2. Fetch Entity Name
            let name = 'Desconhecido'
            if (r.entity_type === 'Equipe') {
                const { data: p } = await supabase.from('professionals').select('name').eq('id', r.entity_id).maybeSingle()
                if (p) name = p.name
            } else if (r.entity_type === 'Unidade') {
                const { data: u } = await supabase.from('units').select('name').eq('id', r.entity_id).maybeSingle()
                if (u) name = u.name
            }
            setEntityName(name)

            // 3. Fetch Linked Invoices
            const { data: inv } = await supabase
                .from('invoices')
                .select('id, amount_net, due_date, students(name)')
                .eq('repass_id', repassId)

            setInvoices((inv || []).map((i: any) => ({
                id: i.id,
                student_name: i.students?.name || 'Aluno',
                amount_net: i.amount_net,
                due_date: i.due_date
            })))

            // 4. Fetch Linked Movements
            const { data: mov } = await supabase
                .from('financial_movements')
                .select('id, type, amount, advance_date, description')
                .eq('repass_id', repassId)

            setMovements((mov || []).map((m: any) => ({
                id: m.id,
                type: m.type,
                amount: m.amount,
                advance_date: m.advance_date,
                description: m.description
            })))

            // 5. Fetch "Pending Invoices" (Not Paid, Same Period, Same Unit)
            // Limitation: If Repasse is Professional, we might skip this unless we track class linkage.
            // Assuming Unit logic for now.
            if (r.entity_type === 'Unidade') {
                const { data: pend } = await supabase
                    .from('invoices')
                    .select('id, amount_net, due_date, students(name)')
                    .eq('unit_id', r.entity_id)
                    .neq('status', 'Paga') // Not paid
                    .gte('due_date', r.period_start)
                    .lte('due_date', r.period_end)

                setPendingInvoices((pend || []).map((i: any) => ({
                    id: i.id,
                    student_name: i.students?.name || 'Aluno',
                    amount_net: i.amount_net,
                    due_date: i.due_date
                })))
            }

        } catch (e: any) {
            toast.error('Erro ao carregar detalhes', { description: e.message })
        } finally {
            setIsLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) return <div className="p-8 text-center bg-background">Carregando detalhes...</div>
    if (!repasse) return <div className="p-8 text-center text-red-500 bg-background">Repasse não encontrado</div>

    const bonusSum = movements.filter(m => m.type === 'Bonificacao').reduce((acc, m) => acc + m.amount, 0)
    const advanceSum = movements.filter(m => m.type === 'Adiantamento').reduce((acc, m) => acc + m.amount, 0)
    // const invoiceSum = invoices.reduce((acc, i) => acc + i.amount_net, 0) // Unused for Total, used only for reference?

    return (
        <div className="bg-background min-h-screen p-6 print:p-0">
            <style>{`
        @media print {
          @page { margin: 1cm; size: A4; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          /* Hide main layout elements commonly found in app shells */
          nav, aside, header, footer { display: none !important; }
          /* Ensure content takes full width */
          .max-w-4xl { max-width: none !important; }
        }
      `}</style>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between no-print">
                    <Button variant="ghost" onClick={() => navigate('/financeiro/repasses')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <div className="space-x-2">
                        <Button onClick={handlePrint} variant="outline">
                            <Printer className="mr-2 h-4 w-4" /> Imprimir
                        </Button>
                        {repasse.receipt_url && (
                            <Button variant="outline" onClick={() => window.open(repasse.receipt_url!, '_blank')}>
                                <Download className="mr-2 h-4 w-4" /> Comprovante
                            </Button>
                        )}
                    </div>
                </div>

                {/* Report Content */}
                <Card className="border-none shadow-none print:shadow-none print:border-none">
                    <CardHeader className="border-b pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold uppercase tracking-wide">Demonstrativo de Repasse</h1>
                                <p className="text-muted-foreground">{entityName}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {repasse.entity_type}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Período</div>
                                <div className="font-medium mb-2">{formatDate(repasse.period_start).slice(3)}</div>

                                <div className="text-sm text-muted-foreground">Status</div>
                                <StatusBadge status={repasse.status} />

                                {repasse.paid_at && (
                                    <div className="mt-2 text-sm text-green-600 font-medium">
                                        Pago em: {formatDate(repasse.paid_at)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">

                        {/* Summary */}
                        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg print:bg-gray-100">
                            <div>
                                <div className="text-xs text-muted-foreground uppercase">Valor Base (Fixo/%)</div>
                                <div className="text-lg font-semibold">{formatCurrency(repasse.gross_value)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase">Bonificações</div>
                                <div className="text-lg font-semibold text-green-600">+{formatCurrency(bonusSum)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground uppercase">Adiantamentos</div>
                                <div className="text-lg font-semibold text-red-600">-{formatCurrency(advanceSum)}</div>
                            </div>
                            <div className="border-l pl-4">
                                <div className="text-xs text-muted-foreground uppercase font-bold">Total a Pagar</div>
                                <div className="text-xl font-bold">{formatCurrency(repasse.net_value)}</div>
                            </div>
                        </div>

                        {/* Sections */}

                        {/* Invoices */}
                        <div>
                            <h3 className="text-sm font-bold uppercase border-b mb-3 pb-1">Mensalidades Recebidas</h3>
                            {invoices.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma mensalidade vinculada.</p> : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-muted-foreground text-xs text-left">
                                            <th className="pb-2">Aluno</th>
                                            <th className="pb-2">Vencimento</th>
                                            <th className="pb-2 text-right">Valor Líquido</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map(i => (
                                            <tr key={i.id} className="border-b border-dashed">
                                                <td className="py-1">{i.student_name}</td>
                                                <td className="py-1">{formatDate(i.due_date)}</td>
                                                <td className="py-1 text-right">{formatCurrency(i.amount_net)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Bonus / Advances */}
                        {(movements.length > 0) && (
                            <div>
                                <h3 className="text-sm font-bold uppercase border-b mb-3 pb-1">Lançamentos (Faltas / Adiantamentos / Bônus)</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-muted-foreground text-xs text-left">
                                            <th className="pb-2">Data</th>
                                            <th className="pb-2">Descrição</th>
                                            <th className="pb-2">Tipo</th>
                                            <th className="pb-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.map(m => (
                                            <tr key={m.id} className="border-b border-dashed">
                                                <td className="py-1">{formatDate(m.advance_date)}</td>
                                                <td className="py-1">{m.description || '-'}</td>
                                                <td className="py-1 text-xs">{m.type}</td>
                                                <td className={`py-1 text-right font-medium ${m.type === 'Bonificacao' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {m.type === 'Bonificacao' ? '+' : '-'}{formatCurrency(m.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pending Invoices (Informational) */}
                        {pendingInvoices.length > 0 && (
                            <div className="print:break-before-auto">
                                <h3 className="text-sm font-bold uppercase border-b mb-3 pb-1 text-orange-600 mt-6">Pendências de Recebimento (não repassado)</h3>
                                <p className="text-xs text-muted-foreground mb-2">Mensalidades deste período que ainda não foram pagas pelos alunos.</p>
                                <table className="w-full text-sm text-muted-foreground opacity-80">
                                    <thead>
                                        <tr className="text-xs text-left">
                                            <th className="pb-2">Aluno</th>
                                            <th className="pb-2">Vencimento</th>
                                            <th className="pb-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingInvoices.map(i => (
                                            <tr key={i.id} className="border-b border-dashed">
                                                <td className="py-1">{i.student_name}</td>
                                                <td className="py-1">{formatDate(i.due_date)}</td>
                                                <td className="py-1 text-right">{formatCurrency(i.amount_net)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
