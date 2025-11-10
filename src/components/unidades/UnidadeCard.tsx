import React from 'react'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Edit, 
  Trash2, 
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import type { Unidade } from '@/types'

interface UnidadeCardProps {
  unidade: Unidade & { turmas?: { id: string; nome: string; capacidade: number; alunos: number }[] }
  onEdit: () => void
  onDelete: () => void
}

export const UnidadeCard: React.FC<UnidadeCardProps> = ({
  unidade,
  onEdit,
  onDelete,
}) => {
  const totalAlunos = unidade.turmas?.reduce((acc, turma) => acc + turma.alunos, 0) || 0
  const capacidadeTotal = unidade.turmas?.reduce((acc, turma) => acc + turma.capacidade, 0) || 0

  return (
    <Card hover className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{unidade.nome}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <StatusBadge status={unidade.status} />
                <span className="text-xs text-muted-foreground">
                  {unidade.cidade}, {unidade.estado}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="text-danger hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações básicas */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{unidade.responsavel}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{unidade.telefone}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{unidade.email}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">
              {unidade.endereco}, {unidade.cidade}
            </span>
          </div>
        </div>

        {/* Repasse */}
        <div className="p-3 bg-muted rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Repasse</span>
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="font-semibold text-success">
                  {unidade.tipoRepasse === 'Percentual' 
                    ? `${unidade.valor}%` 
                    : formatCurrency(unidade.valor)
                  }
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {unidade.tipoRepasse}
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas de alunos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {totalAlunos}
            </div>
            <p className="text-xs text-muted-foreground">
              Alunos Ativos
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {unidade.turmas?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Turmas
            </p>
          </div>
        </div>

        {/* Capacidade */}
        {capacidadeTotal > 0 && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Capacidade</span>
              <span className="font-medium">
                {totalAlunos}/{capacidadeTotal}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((totalAlunos / capacidadeTotal) * 100, 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((totalAlunos / capacidadeTotal) * 100)}% ocupado
            </p>
          </div>
        )}

        {/* Turmas */}
        {unidade.turmas && unidade.turmas.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Turmas Ativas</p>
            <div className="space-y-2">
              {unidade.turmas.slice(0, 2).map((turma) => (
                <div 
                  key={turma.id}
                  className="flex items-center justify-between text-sm p-2 bg-muted rounded-lg"
                >
                  <span className="font-medium">{turma.nome}</span>
                  <span className="text-muted-foreground">
                    {turma.alunos}/{turma.capacidade}
                  </span>
                </div>
              ))}
              {unidade.turmas.length > 2 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{unidade.turmas.length - 2} turmas
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}