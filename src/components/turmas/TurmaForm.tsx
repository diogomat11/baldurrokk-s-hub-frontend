import React, { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { MultiSelect } from '@/components/ui/MultiSelect'
import type { TurmaDto, NewTurmaPayload } from '@/services/turmas'
import { toast } from 'sonner'
import { getUnidades } from '@/services/unidades'
import { getEquipe } from '@/services/equipe'

type TeacherOption = { value: string; label: string }
type UnitOption = { value: string; label: string }

export interface TurmaFormProps {
  initialData?: TurmaDto | null
  onSubmit: (payload: NewTurmaPayload | { id: string; changes: Partial<NewTurmaPayload> }) => Promise<void> | void
  onCancel?: () => void
}

export const TurmaForm: React.FC<TurmaFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [unitId, setUnitId] = useState<string>(initialData?.unit_id || '')
  const [name, setName] = useState<string>(initialData?.name || '')
  const [category, setCategory] = useState<string>(initialData?.category || '')
  const [vacancies, setVacancies] = useState<number>(initialData?.vacancies ?? 0)
  const [status, setStatus] = useState<string>(initialData?.status || 'Ativo')
  const [teacherIds, setTeacherIds] = useState<string[]>(initialData?.teacher_ids || [])
  const [scheduleSlots, setScheduleSlots] = useState<Array<{ day: string; start: string; end: string }>>(() => {
    const slots = (initialData?.schedule?.slots || []) as Array<{ day: string; start: string; end: string }>
    return Array.isArray(slots) && slots.length ? slots : [{ day: 'Segunda', start: '08:00', end: '09:00' }]
  })

  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([])
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await getUnidades()
        setUnitOptions(units.map(u => ({ value: (u as any).id, label: (u as any).name || (u as any).nome || (u as any).id })))
      } catch { /* silent */ }
    }
    const loadTeachers = async () => {
      try {
        const equipe = await getEquipe()
        const profs = equipe.filter(p => String(p.cargo).toLowerCase().includes('prof'))
        setTeacherOptions(profs.map(p => ({ value: p.id, label: p.nome })))
      } catch { /* silent */ }
    }
    loadUnits()
    loadTeachers()
  }, [])

  // MultiSelect usa values diretamente; mantemos teacherIds como fonte da verdade

  const addSlot = () => {
    setScheduleSlots(prev => ([...prev, { day: 'Segunda', start: '08:00', end: '09:00' }]))
  }
  const updateSlot = (idx: number, patch: Partial<{ day: string; start: string; end: string }>) => {
    setScheduleSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }
  const removeSlot = (idx: number) => {
    setScheduleSlots(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const schedule = { slots: scheduleSlots }
    try {
      if (!unitId) {
        toast.error('Selecione uma unidade')
        return
      }
      if (!name.trim()) {
        toast.error('Informe o nome da turma')
        return
      }
      if (!Array.isArray(scheduleSlots) || scheduleSlots.length === 0) {
        toast.error('Adicione ao menos um horário')
        return
      }
      if (initialData) {
        await onSubmit({ id: initialData.id, changes: { unit_id: unitId, name, category, vacancies, status, schedule, teacher_ids: teacherIds } })
      } else {
        await onSubmit({ unit_id: unitId, name, category, vacancies, status, schedule, teacher_ids: teacherIds })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">Unidade</label>
          <Select value={unitId} onValueChange={setUnitId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.filter((u) => !!u.value).map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">Nome da turma</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Ballet Kids A" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Categoria</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Ballet" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">Capacidade (vagas)</label>
          <Input type="number" value={vacancies} onChange={(e) => setVacancies(Number(e.target.value) || 0)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Professores</label>
          <MultiSelect
            options={teacherOptions}
            values={teacherIds}
            onChange={(vals) => setTeacherIds(vals)}
            placeholder="Selecione professores"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Horários</label>
        <div className="space-y-2 mt-2">
          {scheduleSlots.map((slot, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div>
                <label className="text-xs text-muted-foreground">Dia</label>
                <Select value={slot.day} onValueChange={(v) => updateSlot(idx, { day: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Início</label>
                <Input type="time" value={slot.start} onChange={(e) => updateSlot(idx, { start: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fim</label>
                <Input type="time" value={slot.end} onChange={(e) => updateSlot(idx, { end: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => removeSlot(idx)}>Remover</Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="accent" onClick={addSlot}>Adicionar horário</Button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        )}
        <Button type="submit" disabled={isSubmitting}>{initialData ? 'Salvar alterações' : 'Criar Turma'}</Button>
      </div>
    </form>
  )
}