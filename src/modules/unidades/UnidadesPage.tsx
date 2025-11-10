import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, MapPin, Phone, Mail, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Modal'
import { UnidadeCard } from '@/components/unidades/UnidadeCard'
import { UnidadeForm } from '@/components/unidades/UnidadeForm'
import { formatCurrency } from '@/lib/utils'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { getUnidades } from '@/services/unidades'

// Dados serão carregados do Supabase via serviço

export const UnidadesPage: React.FC = () => {
  const [unidades, setUnidades] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUnidade, setSelectedUnidade] = useState<any>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['unidades', searchTerm],
    queryFn: () => getUnidades(searchTerm),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (Array.isArray(data)) {
      setUnidades(data)
    }
  }, [data])

  const filteredUnidades = unidades.filter(unidade =>
    unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unidade.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unidade.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateUnidade = (data: any) => {
    const newUnidade = {
      id: Date.now().toString(),
      ...data,
      turmas: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setUnidades([...unidades, newUnidade])
    setShowCreateModal(false)
  }

  const handleEditUnidade = (data: any) => {
    setUnidades(unidades.map(u => 
      u.id === selectedUnidade.id 
        ? { ...u, ...data, updated_at: new Date().toISOString() }
        : u
    ))
    setShowEditModal(false)
    setSelectedUnidade(null)
  }

  const handleDeleteUnidade = (id: string) => {
    setUnidades(unidades.filter(u => u.id !== id))
  }

  const totalAlunos = unidades.reduce((acc, unidade) => 
    acc + unidade.turmas.reduce((turmaAcc, turma) => turmaAcc + turma.alunos, 0), 0
  )

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
        <h1 className="text-3xl font-bold text-foreground">Unidades</h1>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Unidades</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas unidades e turmas
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Unidades
                </p>
                <p className="text-2xl font-bold">{unidades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unidades Ativas
                </p>
                <p className="text-2xl font-bold">
                  {unidades.filter(u => u.status === 'Ativa').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Turmas
                </p>
                <p className="text-2xl font-bold">
                  {unidades.reduce((acc, u) => acc + u.turmas.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Alunos
                </p>
                <p className="text-2xl font-bold">{totalAlunos}</p>
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
            placeholder="Buscar unidades..."
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

      {/* Grid de Unidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUnidades.map((unidade) => (
          <UnidadeCard
            key={unidade.id}
            unidade={unidade}
            onEdit={() => {
              setSelectedUnidade(unidade)
              setShowEditModal(true)
            }}
            onDelete={() => handleDeleteUnidade(unidade.id)}
          />
        ))}
      </div>

      {filteredUnidades.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma unidade encontrada
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente alterar os termos de busca'
                : 'Comece criando sua primeira unidade'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Unidade
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Nova Unidade</DialogTitle>
          </DialogHeader>
          <UnidadeForm
            onSubmit={handleCreateUnidade}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
          </DialogHeader>
          <UnidadeForm
            initialData={selectedUnidade}
            onSubmit={handleEditUnidade}
            onCancel={() => {
              setShowEditModal(false)
              setSelectedUnidade(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
