import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Modal'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { Pencil } from 'lucide-react'

type PlanItem = {
  id: string
  name: string
  unit_id: string
  frequency_per_week: number
  value: number
  status: 'Ativo' | 'Inativo'
}

export const PlanosPage: React.FC = () => {
  const [plans, setPlans] = React.useState<PlanItem[]>([])
  const [units, setUnits] = React.useState<{ id: string; name: string }[]>([])
  const [openNew, setOpenNew] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    unit_id: '',
    name: '',
    frequency_per_week: 1,
    value: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  })
  const [openEdit, setOpenEdit] = React.useState(false)
  const [editPlan, setEditPlan] = React.useState<PlanItem | null>(null)

  const loadData = async () => {
    const [{ data: plansData, error: plansErr }, { data: unitsData, error: unitsErr }] = await Promise.all([
      supabase.from('plans').select('id,name,unit_id,frequency_per_week,value,status'),
      supabase.from('units').select('id,name'),
    ])
    if (plansErr) toast.error('Erro ao carregar planos', { description: plansErr.message })
    if (unitsErr) toast.error('Erro ao carregar unidades', { description: unitsErr.message })
    setPlans((plansData || []) as any)
    setUnits((unitsData || []).map((u: any) => ({ id: u.id, name: u.name })))
  }

  React.useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button>Novo plano</Button>
              </DialogTrigger>
              <DialogContent size="lg">
                <DialogHeader>
                  <DialogTitle>Criar plano</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                    <SelectTrigger label="Unidade">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    label="Nome"
                    placeholder="Ex.: Futebol 2x/semana"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    label="Frequência semanal"
                    min={1}
                    max={7}
                    value={String(form.frequency_per_week)}
                    onChange={(e) => setForm({ ...form, frequency_per_week: Math.max(1, Math.min(7, Number(e.target.value) || 1)) })}
                  />
                  <Input
                    type="number"
                    label="Valor"
                    placeholder="Ex.: 200,00"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                  />
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
                  <Button variant="outline" onClick={() => setOpenNew(false)} disabled={isSaving}>Cancelar</Button>
                  <Button onClick={async () => {
                    try {
                      setIsSaving(true)
                      if (!form.unit_id || !form.name || !form.value) {
                        toast.error('Preencha unidade, nome e valor')
                        return
                      }
                      const { error } = await supabase.from('plans').insert([{
                        unit_id: form.unit_id,
                        name: form.name,
                        frequency_per_week: form.frequency_per_week,
                        value: Number(form.value),
                        status: form.status,
                      }])
                      if (error) {
                        toast.error('Erro ao criar plano', { description: error.message })
                        return
                      }
                      toast.success('Plano criado com sucesso')
                      setOpenNew(false)
                      setForm({ unit_id: '', name: '', frequency_per_week: 1, value: '', status: 'Ativo' })
                      await loadData()
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

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Nome</th>
                  <th className="p-2">Unidade</th>
                  <th className="p-2">Frequência</th>
                  <th className="p-2">Valor</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{units.find(u => u.id === p.unit_id)?.name || p.unit_id}</td>
                    <td className="p-2">{p.frequency_per_week}x/sem</td>
                    <td className="p-2">R$ {Number(p.value).toFixed(2)}</td>
                    <td className="p-2">{p.status}</td>
                    <td className="p-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditPlan(p); setOpenEdit(true) }}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {plans.length === 0 && (
                  <tr>
                    <td className="p-2 text-muted-foreground" colSpan={5}>Nenhum plano cadastrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Modal Editar Plano */}
          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>Editar plano</DialogTitle>
              </DialogHeader>
              {editPlan && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={editPlan.unit_id} onValueChange={(v) => setEditPlan({ ...editPlan, unit_id: v })}>
                    <SelectTrigger label="Unidade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="text" label="Nome" value={editPlan.name} onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })} />
                  <Input type="number" label="Frequência semanal" value={String(editPlan.frequency_per_week)} onChange={(e) => setEditPlan({ ...editPlan, frequency_per_week: Math.max(1, Math.min(7, Number(e.target.value) || 1)) })} />
                  <Input type="number" label="Valor" value={String(editPlan.value)} onChange={(e) => setEditPlan({ ...editPlan, value: Number(e.target.value) })} />
                  <Select value={editPlan.status} onValueChange={(v) => setEditPlan({ ...editPlan, status: v as any })}>
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
                <Button variant="outline" onClick={() => { setOpenEdit(false); setEditPlan(null) }}>Cancelar</Button>
                <Button onClick={async () => {
                  if (!editPlan) return
                  try {
                    const { error } = await supabase.from('plans').update({
                      unit_id: editPlan.unit_id,
                      name: editPlan.name,
                      frequency_per_week: editPlan.frequency_per_week,
                      value: Number(editPlan.value),
                      status: editPlan.status,
                    }).eq('id', editPlan.id)
                    if (error) { toast.error('Erro ao atualizar plano', { description: error.message }); return }
                    toast.success('Plano atualizado com sucesso')
                    setOpenEdit(false)
                    setEditPlan(null)
                    await loadData()
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