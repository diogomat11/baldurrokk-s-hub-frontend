import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Modal'
import { supabase } from '@/services/supabase/client'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'

type PaymentConfig = {
  id?: string
  method: 'Cartão' | 'Pix' | 'Dinheiro' | 'Transferência'
  fee_percent: number
  status: 'Ativo' | 'Inativo'
}

const ALL_METHODS: PaymentConfig['method'][] = ['Cartão', 'Pix', 'Dinheiro', 'Transferência']

export const TiposPagamentoPage: React.FC = () => {
  const [configs, setConfigs] = React.useState<PaymentConfig[]>([])
  const [openNew, setOpenNew] = React.useState(false)
  const [openEdit, setOpenEdit] = React.useState(false)
  const [form, setForm] = React.useState<PaymentConfig>({ method: 'Pix', fee_percent: 0, status: 'Ativo' })
  const [editCfg, setEditCfg] = React.useState<PaymentConfig | null>(null)

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase.from('payment_settings').select('id,method,fee_percent,status')
      if (error) {
        // Se não existir backend, inicializa com defaults
        setConfigs(ALL_METHODS.map(m => ({ method: m, fee_percent: 0, status: 'Ativo' })))
        return
      }
      setConfigs((data || []) as any)
    } catch {
      setConfigs(ALL_METHODS.map(m => ({ method: m, fee_percent: 0, status: 'Ativo' })))
    }
  }

  React.useEffect(() => { loadConfigs() }, [])

  const availableForCreate = ALL_METHODS.filter(m => !configs.find(c => c.method === m))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tipos de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Novo tipo</Button>
              </DialogTrigger>
              <DialogContent size="lg">
                <DialogHeader>
                  <DialogTitle>Cadastrar tipo de pagamento</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as any })}>
                    <SelectTrigger label="Método">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(availableForCreate.length ? availableForCreate : ALL_METHODS).map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" label="Taxa (%)" value={String(form.fee_percent)} onChange={(e) => setForm({ ...form, fee_percent: Number(e.target.value || 0) })} />
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                    <SelectTrigger label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
                  <Button onClick={async () => {
                    try {
                      const { error } = await supabase.from('payment_settings').insert([{ method: form.method, fee_percent: form.fee_percent, status: form.status }])
                      if (error) { toast.error('Erro ao salvar tipo', { description: error.message }); return }
                      toast.success('Tipo de pagamento cadastrado')
                      setOpenNew(false)
                      setForm({ method: 'Pix', fee_percent: 0, status: 'Ativo' })
                      await loadConfigs()
                    } catch (e: any) {
                      toast.error('Falha ao salvar', { description: e?.message || String(e) })
                    }
                  }}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Método</th>
                  <th className="p-2">Taxa (%)</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {configs.map(c => (
                  <tr key={`${c.id || c.method}`} className="border-t border-border">
                    <td className="p-2">{c.method}</td>
                    <td className="p-2">{Number(c.fee_percent || 0).toFixed(2)}</td>
                    <td className="p-2">{c.status}</td>
                    <td className="p-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditCfg(c); setOpenEdit(true) }}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {configs.length === 0 && (
                  <tr>
                    <td className="p-2 text-muted-foreground" colSpan={4}>Nenhuma configuração cadastrada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal: Editar tipo */}
          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>Editar tipo de pagamento</DialogTitle>
              </DialogHeader>
              {editCfg && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={editCfg.method} onValueChange={(v) => setEditCfg({ ...editCfg, method: v as any })}>
                    <SelectTrigger label="Método">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_METHODS.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" label="Taxa (%)" value={String(editCfg.fee_percent)} onChange={(e) => setEditCfg({ ...editCfg, fee_percent: Number(e.target.value || 0) })} />
                  <Select value={editCfg.status} onValueChange={(v) => setEditCfg({ ...editCfg, status: v as any })}>
                    <SelectTrigger label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpenEdit(false); setEditCfg(null) }}>Cancelar</Button>
                <Button onClick={async () => {
                  if (!editCfg) return
                  try {
                    const { error } = await supabase.from('payment_settings').update({
                      method: editCfg.method,
                      fee_percent: Number(editCfg.fee_percent || 0),
                      status: editCfg.status,
                    }).eq('id', editCfg.id)
                    if (error) { toast.error('Erro ao atualizar tipo', { description: error.message }); return }
                    toast.success('Tipo de pagamento atualizado')
                    setOpenEdit(false)
                    setEditCfg(null)
                    await loadConfigs()
                  } catch (e: any) {
                    toast.error('Falha ao salvar', { description: e?.message || String(e) })
                  }
                }}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}