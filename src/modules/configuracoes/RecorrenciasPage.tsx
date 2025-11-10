import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Modal'
import { toast } from 'sonner'
import { supabase } from '@/services/supabase/client'
import { Pencil } from 'lucide-react'

type RecurrenceItem = {
  id: string
  type: 'Anual' | 'Semestral' | 'Trimestral' | 'Mensal'
  discount_percent: number
  units_applicable: string[]
  status: 'Ativo' | 'Inativo'
}

export const RecorrenciasPage: React.FC = () => {
  const [recs, setRecs] = React.useState<RecurrenceItem[]>([])
  const [units, setUnits] = React.useState<{ id: string; name: string }[]>([])
  const [openNew, setOpenNew] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    type: 'Mensal' as RecurrenceItem['type'],
    discount_percent: '',
    start_date: '',
    end_date: '',
    units_applicable: [] as string[],
    status: 'Ativo' as 'Ativo' | 'Inativo',
  })
  const [openEdit, setOpenEdit] = React.useState(false)
  const [editRec, setEditRec] = React.useState<RecurrenceItem | null>(null)

  const loadData = async () => {
    const [{ data: recsData, error: recsErr }, { data: unitsData, error: unitsErr }] = await Promise.all([
      supabase.from('recurrences').select('id,type,discount_percent,units_applicable,status'),
      supabase.from('units').select('id,name'),
    ])
    if (recsErr) toast.error('Erro ao carregar recorrências', { description: recsErr.message })
    if (unitsErr) toast.error('Erro ao carregar unidades', { description: unitsErr.message })
    setRecs((recsData || []) as any)
    setUnits((unitsData || []).map((u: any) => ({ id: u.id, name: u.name })))
  }

  React.useEffect(() => {
    loadData()
  }, [])

  const toggleUnit = (id: string) => {
    setForm((prev) => ({
      ...prev,
      units_applicable: prev.units_applicable.includes(id)
        ? prev.units_applicable.filter(u => u !== id)
        : [...prev.units_applicable, id],
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recorrências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button>Nova recorrência</Button>
              </DialogTrigger>
              <DialogContent size="lg">
                <DialogHeader>
                  <DialogTitle>Criar recorrência</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                    <SelectTrigger label="Tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    label="Desconto (%)"
                    placeholder="Ex.: 10"
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                  />
                  <div>
                    <label className="text-sm font-medium text-foreground">Início</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Fim</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
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

                <div className="mt-4">
                  <label className="text-sm font-medium text-foreground">Unidades aplicáveis</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {units.map(u => (
                      <label key={u.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.units_applicable.includes(u.id)}
                          onChange={() => toggleUnit(u.id)}
                        />
                        <span>{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenNew(false)} disabled={isSaving}>Cancelar</Button>
                  <Button onClick={async () => {
                    try {
                      setIsSaving(true)
                      if (!form.type) {
                        toast.error('Selecione o tipo de recorrência')
                        return
                      }
                      const { error } = await supabase.from('recurrences').insert([{
                        type: form.type,
                        discount_percent: Number(form.discount_percent || 0),
                        start_date: form.start_date || null,
                        end_date: form.end_date || null,
                        units_applicable: form.units_applicable,
                        status: form.status,
                      }])
                      if (error) {
                        toast.error('Erro ao criar recorrência', { description: error.message })
                        return
                      }
                      toast.success('Recorrência criada com sucesso')
                      setOpenNew(false)
                      setForm({ type: 'Mensal', discount_percent: '', start_date: '', end_date: '', units_applicable: [], status: 'Ativo' })
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
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Desconto (%)</th>
                  <th className="p-2">Unidades</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recs.map(r => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-2">{r.type}</td>
                    <td className="p-2">{Number(r.discount_percent).toFixed(2)}</td>
                    <td className="p-2">{r.units_applicable.length}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditRec(r); setOpenEdit(true) }}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {recs.length === 0 && (
                  <tr>
                    <td className="p-2 text-muted-foreground" colSpan={4}>Nenhuma recorrência cadastrada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Modal Editar Recorrência */}
          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogContent size="lg">
              <DialogHeader>
                <DialogTitle>Editar recorrência</DialogTitle>
              </DialogHeader>
              {editRec && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={editRec.type} onValueChange={(v) => setEditRec({ ...editRec, type: v as any })}>
                    <SelectTrigger label="Tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" label="Desconto (%)" value={String(editRec.discount_percent)} onChange={(e) => setEditRec({ ...editRec, discount_percent: Number(e.target.value || 0) })} />
                  <div>
                    <label className="text-sm font-medium text-foreground">Início</label>
                    <input type="date" value={(editRec as any).start_date || ''} onChange={(e) => setEditRec({ ...editRec, ...(editRec as any), start_date: e.target.value } as any)} className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Fim</label>
                    <input type="date" value={(editRec as any).end_date || ''} onChange={(e) => setEditRec({ ...editRec, ...(editRec as any), end_date: e.target.value } as any)} className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                  <Select value={editRec.status} onValueChange={(v) => setEditRec({ ...editRec, status: v as any })}>
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
              <div className="mt-4">
                <label className="text-sm font-medium text-foreground">Unidades aplicáveis</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {units.map(u => (
                    <label key={u.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={!!editRec?.units_applicable.includes(u.id)} onChange={() => {
                        if (!editRec) return
                        const exists = editRec.units_applicable.includes(u.id)
                        const next = exists ? editRec.units_applicable.filter(id => id !== u.id) : [...editRec.units_applicable, u.id]
                        setEditRec({ ...editRec, units_applicable: next })
                      }} />
                      <span>{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpenEdit(false); setEditRec(null) }}>Cancelar</Button>
                <Button onClick={async () => {
                  if (!editRec) return
                  try {
                    const { error } = await supabase.from('recurrences').update({
                      type: editRec.type,
                      discount_percent: Number(editRec.discount_percent || 0),
                      start_date: (editRec as any).start_date || null,
                      end_date: (editRec as any).end_date || null,
                      units_applicable: editRec.units_applicable,
                      status: editRec.status,
                    }).eq('id', editRec.id)
                    if (error) { toast.error('Erro ao atualizar recorrência', { description: error.message }); return }
                    toast.success('Recorrência atualizada com sucesso')
                    setOpenEdit(false)
                    setEditRec(null)
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