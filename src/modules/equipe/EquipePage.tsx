import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, UserCog, Mail, Phone, Pencil, Trash2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import type { Profissional } from '@/types'
import { getEquipe, createProfissional, updateProfissional, deleteProfissional } from '@/services/equipe'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/Modal'
import { ProfissionalForm } from '@/components/equipe/ProfissionalForm'

export const EquipePage: React.FC = () => {
  const [equipe, setEquipe] = useState<Profissional[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [openNew, setOpenNew] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['equipe', debouncedSearchTerm],
    queryFn: () => getEquipe(debouncedSearchTerm),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (Array.isArray(data)) setEquipe(data)
  }, [data])

  const filteredEquipe = equipe.filter((p) => {
    const term = searchTerm.toLowerCase()
    return (
      p.nome.toLowerCase().includes(term) ||
      p.cpf.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    )
  })

  const totalProfessores = equipe.filter(p => p.cargo === 'Professor').length
  const totalAtivos = equipe.filter(p => p.status === 'Ativo').length

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Profissional> & { nome: string }) => createProfissional(payload),
    onSuccess: () => {
      setOpenNew(false)
      queryClient.invalidateQueries({ queryKey: ['equipe'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Profissional> }) => updateProfissional(id, payload),
    onSuccess: () => {
      setOpenEdit(false)
      setSelectedProfissional(null)
      queryClient.invalidateQueries({ queryKey: ['equipe'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfissional(id),
    onSuccess: () => {
      setOpenDelete(false)
      setDeletingId(null)
      queryClient.invalidateQueries({ queryKey: ['equipe'] })
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
        <h1 className="text-3xl font-bold text-foreground">Equipe</h1>
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
            <h1 className="text-3xl font-bold text-foreground">Equipe</h1>
            <p className="text-muted-foreground mt-1">Gestão de profissionais e cargos</p>
          </div>
          <Button className="mt-4 sm:mt-0" onClick={() => setOpenNew(true)}>
            <UserCog className="h-4 w-4 mr-2" />
            Novo Profissional
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total na Equipe</p>
                  <p className="text-2xl font-bold">{equipe.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <UserCog className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Professores</p>
                  <p className="text-2xl font-bold">{totalProfessores}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <UserCog className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{totalAtivos}</p>
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
              placeholder="Buscar profissionais..."
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

        {/* Lista de Profissionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEquipe.map((p) => (
            <Card key={p.id} hover>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{p.nome}</CardTitle>
                      <div className="text-xs text-muted-foreground">{p.cargo}</div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeletingId(p.id); setOpenDelete(true) }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 cursor-pointer" onClick={() => { setSelectedProfissional(p); setOpenEdit(true) }}>
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{p.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{p.telefone}</span>
                </div>
                <div className="text-xs text-muted-foreground">Salário: R$ {p.salario?.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-muted-foreground">Unidades: {p.unidades.length}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEquipe.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum profissional encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente alterar os termos de busca' : 'Comece cadastrando seu primeiro profissional'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setOpenNew(true)}>
                  <UserCog className="h-4 w-4 mr-2" />
                  Criar Profissional
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div >

      {/* Modal: Novo Profissional */}
      < Dialog open={openNew} onOpenChange={setOpenNew} >
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Novo Profissional</DialogTitle>
            <DialogDescription>Preencha os dados para cadastrar um novo profissional.</DialogDescription>
          </DialogHeader>
          <ProfissionalForm
            onCancel={() => setOpenNew(false)}
            onSubmit={(payload) => createMutation.mutate(payload as Partial<Profissional> & { nome: string })}
          />
        </DialogContent>
      </Dialog >

      {/* Modal: Editar Profissional */}
      < Dialog open={openEdit} onOpenChange={setOpenEdit} >
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Editar Profissional</DialogTitle>
            <DialogDescription>Atualize os dados do profissional selecionado.</DialogDescription>
          </DialogHeader>
          <ProfissionalForm
            initialData={selectedProfissional || undefined}
            onCancel={() => { setOpenEdit(false); setSelectedProfissional(null) }}
            onSubmit={(payload) => { if (!selectedProfissional) return; updateMutation.mutate({ id: selectedProfissional.id, payload }) }}
          />
        </DialogContent>
      </Dialog >

      {/* Confirmar exclusão */}
      < ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Excluir Profissional"
        description="Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => { if (!deletingId) return; deleteMutation.mutate(deletingId) }}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}