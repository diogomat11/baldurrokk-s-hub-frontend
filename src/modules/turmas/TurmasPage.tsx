import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, Users, Calendar, Pencil, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Modal'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { TurmaForm } from '@/components/turmas/TurmaForm'
import { getTurmas, createTurma, updateTurma, deleteTurma, TurmaDto } from '@/services/turmas'
import { getUnidades } from '@/services/unidades'

export const TurmasPage: React.FC = () => {
  const [unitFilter, setUnitFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState<number>(1)
  const pageSize = 12
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<TurmaDto | null>(null)
  const [units, setUnits] = useState<Array<{ id: string; name?: string; nome?: string }>>([])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['turmas', unitFilter, statusFilter],
    queryFn: () => getTurmas({ unitId: unitFilter === 'all' ? undefined : unitFilter, status: statusFilter === 'all' ? undefined : statusFilter }),
    staleTime: 30_000,
  })

  useEffect(() => {
    const loadUnits = async () => {
      try { setUnits(await getUnidades()) } catch { /* silent */ }
    }
    loadUnits()
  }, [])

  const turmas = useMemo(() => Array.isArray(data) ? data : [], [data])
  const categories = useMemo(() => {
    const set = new Set<string>()
    turmas.forEach(t => { if (t.category) set.add(t.category) })
    return Array.from(set)
  }, [turmas])

  const filteredTurmas = useMemo(() => (
    turmas.filter(t => (
      (!searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (unitFilter === 'all' || t.unit_id === unitFilter) &&
      (categoryFilter === 'all' || (t.category || '') === categoryFilter)
    ))
  ), [turmas, searchTerm, unitFilter, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filteredTurmas.length / pageSize))
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredTurmas.slice(start, start + pageSize)
  }, [filteredTurmas, page])

  const totalVagas = turmas.reduce((acc, t) => acc + (t.vacancies || 0), 0)
  const totalProfessores = turmas.reduce((acc, t) => acc + (Array.isArray(t.teacher_ids) ? t.teacher_ids.length : 0), 0)

  const handleCreate = async (payload: Parameters<typeof createTurma>[0]) => {
    try {
      const created = await createTurma(payload)
      toast.success(`Turma "${created.name}" criada`)
      setShowCreate(false)
      setPage(1)
      await refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao criar turma')
    }
  }

  const handleUpdate = async (args: { id: string; changes: Partial<Parameters<typeof updateTurma>[1]> }) => {
    try {
      const updated = await updateTurma(args.id, args.changes)
      toast.success(`Turma "${updated.name}" atualizada`)
      setEditItem(null)
      await refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao atualizar turma')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTurma(id)
      toast.success('Turma excluída')
      await refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao excluir turma')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <PageLoading />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Turmas</h1>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Falha ao carregar turmas</h3>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Ocorreu um erro ao buscar dados no backend.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground mt-1">Cadastro e gestão de turmas por unidade</p>
        </div>
        <Button className="mt-4 sm:mt-0" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Turma
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Turmas</p>
                <p className="text-2xl font-bold">{turmas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Professores envolvidos</p>
                <p className="text-2xl font-bold">{totalProfessores}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vagas totais</p>
                <p className="text-2xl font-bold">{totalVagas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar turmas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div>
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger label="Unidade">
              <SelectValue placeholder="Todas as unidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {units.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name || u.nome || u.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger label="Status">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
            <SelectTrigger label="Categoria">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Turmas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {pageItems.map(t => (
          <Card key={t.id} hover>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{t.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">Unidade: {units.find(u => u.id === t.unit_id)?.name || units.find(u => u.id === t.unit_id)?.nome || t.unit_id}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs">Vagas: {t.vacancies ?? 0}</span>
                      <span className="inline-flex items-center rounded-full bg-success/10 text-success px-2 py-0.5 text-xs">Professores: {Array.isArray(t.teacher_ids) ? t.teacher_ids.length : 0}</span>
                      <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">{t.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setEditItem(t)}>
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">Categoria: {t.category || '—'}</div>
              <div className="text-sm text-muted-foreground">Horários: {Array.isArray(t.schedule?.slots) ? t.schedule.slots.map((s: any) => `${s.day} ${s.start}-${s.end}`).join(', ') : '—'}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTurmas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma turma encontrada</h3>
            <p className="text-muted-foreground mb-4">{searchTerm ? 'Tente alterar os termos de busca' : 'Comece criando sua primeira turma'}</p>
            {!searchTerm && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Turma
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {filteredTurmas.length > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Próxima</Button>
        </div>
      )}

      {/* Modal Nova Turma */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Nova Turma</DialogTitle>
          </DialogHeader>
          <TurmaForm onSubmit={async (payload) => { await handleCreate(payload as any) }} onCancel={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal Editar Turma */}
      <Dialog open={!!editItem} onOpenChange={(open) => setEditItem(open ? editItem : null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
          </DialogHeader>
          {editItem && (
            <TurmaForm initialData={editItem} onSubmit={async (args) => { const { id, changes } = args as any; await handleUpdate({ id, changes }) }} onCancel={() => setEditItem(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}