import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GraduationCap, Search, Filter, Users, Phone, Mail, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import type { Aluno } from '@/types'
import { getAlunos, createAluno, updateAluno, deleteAluno } from '@/services/alunos'
import { getUnidades } from '@/services/unidades'
import { getPlanos } from '@/services/planos'
import { getRecorrencias } from '@/services/recorrencias'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/Modal'
import { AlunoForm } from '@/components/alunos/AlunoForm'

export const AlunosPage: React.FC = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [openNew, setOpenNew] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['alunos', searchTerm],
    queryFn: () => getAlunos(searchTerm),
    staleTime: 60_000,
  })

  const { data: unidadesData } = useQuery({
    queryKey: ['unidades'],
    queryFn: () => getUnidades(),
    staleTime: 300_000,
  })

  const { data: planosData } = useQuery({
    queryKey: ['planos','all'],
    queryFn: () => getPlanos(undefined),
    staleTime: 300_000,
  })

  const { data: recorrenciasData } = useQuery({
    queryKey: ['recorrencias'],
    queryFn: () => getRecorrencias(),
    staleTime: 300_000,
  })

  useEffect(() => {
    if (Array.isArray(data)) setAlunos(data)
  }, [data])

  const unidadeMap = new Map((unidadesData || []).map((u: any) => [u.id, u.name || u.nome || '']))
  const planoMap = new Map((planosData || []).map((p: any) => [p.id, p.name]))
  const recorrenciaMap = new Map((recorrenciasData || []).map((r: any) => [r.id, String(r.type)]))
  const filteredAlunos = alunos.filter((a) => {
    const term = searchTerm.toLowerCase()
    const unidadeNome = (unidadeMap.get(a.unidade) || '').toLowerCase()
    return (
      a.nome.toLowerCase().includes(term) ||
      a.cpf.toLowerCase().includes(term) ||
      String(a.responsavel?.cpf || '').toLowerCase().includes(term) ||
      a.unidade.toLowerCase().includes(term) ||
      unidadeNome.includes(term)
    )
  })

  const totalAtivos = alunos.filter(a => a.status === 'Ativo').length
  const totalTrial = alunos.filter(a => a.status === 'Trial').length

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Aluno> & { nome: string }) => createAluno(payload),
    onSuccess: () => {
      setOpenNew(false)
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Aluno> }) => updateAluno(id, payload),
    onSuccess: () => {
      setOpenEdit(false)
      setSelectedAluno(null)
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAluno(id),
    onSuccess: () => {
      setOpenDelete(false)
      setDeletingId(null)
      queryClient.invalidateQueries({ queryKey: ['alunos'] })
    },
  })

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
        <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Falha ao carregar dados</h3>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Ocorreu um erro ao buscar dados no backend.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus alunos e planos</p>
        </div>
        <Button className="mt-4 sm:mt-0" onClick={() => setOpenNew(true)}>
          <GraduationCap className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold">{alunos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{totalAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trial</p>
                <p className="text-2xl font-bold">{totalTrial}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar alunos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </Input>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Lista de Alunos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAlunos.map((aluno) => (
          <Card key={aluno.id} hover>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{aluno.nome}</CardTitle>
                    <div className="text-xs text-muted-foreground">{aluno.cpf}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(aluno.planId || aluno.plano) && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
                          Plano: {planoMap.get(aluno.planId as any) || aluno.plano}
                        </span>
                      )}
                      {(aluno.recurrenceId || aluno.recorrencia) && (
                        <span className="inline-flex items-center rounded-full bg-accent/10 text-accent px-2 py-0.5 text-xs">
                          Recorrência: {recorrenciaMap.get(aluno.recurrenceId as any) || aluno.recorrencia}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedAluno(aluno); setOpenEdit(true) }}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { setDeletingId(aluno.id); setOpenDelete(true) }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{aluno.responsavel.nome}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{aluno.responsavel.telefone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{aluno.responsavel.email}</span>
              </div>
              {aluno.responsavel.cpf && (
                <div className="text-xs text-muted-foreground">
                  CPF do Responsável: {aluno.responsavel.cpf}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Unidade: {unidadeMap.get(aluno.unidade) || aluno.unidade || '—'} | Turma: {aluno.turma || '—'}
              </div>
              <div className="text-xs text-muted-foreground">
                Pagamento: {aluno.formaPagamento}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlunos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Tente alterar os termos de busca' : 'Comece cadastrando seu primeiro aluno'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setOpenNew(true)}>
                <GraduationCap className="h-4 w-4 mr-2" />
                Criar Aluno
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>

    {/* Modal: Novo Aluno */}
    <Dialog open={openNew} onOpenChange={setOpenNew}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Novo Aluno</DialogTitle>
          <DialogDescription>Preencha os dados para cadastrar um novo aluno.</DialogDescription>
        </DialogHeader>
        <AlunoForm
          onCancel={() => setOpenNew(false)}
          onSubmit={(payload) => createMutation.mutate(payload as Partial<Aluno> & { nome: string })}
        />
      </DialogContent>
    </Dialog>

    {/* Modal: Editar Aluno */}
    <Dialog open={openEdit} onOpenChange={setOpenEdit}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Editar Aluno</DialogTitle>
          <DialogDescription>Atualize os dados do aluno selecionado.</DialogDescription>
        </DialogHeader>
        <AlunoForm
          initialData={selectedAluno || undefined}
          onCancel={() => { setOpenEdit(false); setSelectedAluno(null) }}
          onSubmit={(payload) => selectedAluno && updateMutation.mutate({ id: selectedAluno.id, payload })}
        />
      </DialogContent>
    </Dialog>

    {/* Confirmar exclusão */}
    <ConfirmDialog
      open={openDelete}
      onOpenChange={setOpenDelete}
      title="Excluir Aluno"
      description="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
      confirmText="Excluir"
      cancelText="Cancelar"
      variant="destructive"
      onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
      isLoading={deleteMutation.isLoading}
    />
    </>
  )
}