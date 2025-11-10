import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'

const unidadeSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  responsavel: z.string().min(2, 'Nome do responsável é obrigatório'),
  endereco: z.string().min(5, 'Endereço é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 00000-000'),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (00) 00000-0000'),
  email: z.string().email('Email inválido'),
  tipoRepasse: z.enum(['Percentual', 'Valor Fixo']),
  valor: z.number().min(0, 'Valor deve ser maior que zero'),
  status: z.enum(['Ativa', 'Inativa']),
})

type UnidadeFormData = z.infer<typeof unidadeSchema>

interface UnidadeFormProps {
  initialData?: any
  onSubmit: (data: UnidadeFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export const UnidadeForm: React.FC<UnidadeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<UnidadeFormData>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      responsavel: initialData?.responsavel || '',
      endereco: initialData?.endereco || '',
      cidade: initialData?.cidade || '',
      estado: initialData?.estado || 'SP',
      cep: initialData?.cep || '',
      telefone: initialData?.telefone || '',
      email: initialData?.email || '',
      tipoRepasse: initialData?.tipoRepasse || 'Percentual',
      valor: initialData?.valor || 0,
      status: initialData?.status || 'Ativa',
    },
  })

  const tipoRepasse = watch('tipoRepasse')

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 5) {
      value = value
    } else {
      value = value.replace(/(\d{5})(\d{0,3})/, '$1-$2')
    }
    setValue('cep', value)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 2) {
      value = `(${value}`
    } else if (value.length <= 7) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    } else {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`
    }
    setValue('telefone', value)
  }

  const handleEstadoChange = (value: string) => {
    setValue('estado', value)
  }

  const handleTipoRepasseChange = (value: string) => {
    setValue('tipoRepasse', value as 'Percentual' | 'Valor Fixo')
  }

  const handleStatusChange = (value: string) => {
    setValue('status', value as 'Ativa' | 'Inativa')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Informações Básicas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome da Unidade"
              placeholder="Ex: Unidade Centro"
              error={errors.nome?.message}
              required
              {...register('nome')}
            />

            <Input
              label="Responsável"
              placeholder="Nome do responsável"
              error={errors.responsavel?.message}
              required
              {...register('responsavel')}
            />
          </div>

          <Input
            label="Endereço"
            placeholder="Rua, número, bairro"
            error={errors.endereco?.message}
            required
            {...register('endereco')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Cidade"
              placeholder="Cidade"
              error={errors.cidade?.message}
              required
              {...register('cidade')}
            />

            <Select
              value={watch('estado')}
              onValueChange={handleEstadoChange}
              label="Estado"
              required
              error={errors.estado?.message}
            >
              <option value="">Selecione o estado</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="MG">Minas Gerais</option>
              <option value="ES">Espírito Santo</option>
              <option value="PR">Paraná</option>
              <option value="SC">Santa Catarina</option>
              <option value="RS">Rio Grande do Sul</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CEP"
              placeholder="00000-000"
              value={watch('cep')}
              onChange={handleCepChange}
              error={errors.cep?.message}
              required
            />

            <Input
              label="Telefone"
              placeholder="(00) 00000-0000"
              value={watch('telefone')}
              onChange={handlePhoneChange}
              error={errors.telefone?.message}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="contato@unidade.com"
            error={errors.email?.message}
            required
            {...register('email')}
          />
        </CardContent>
      </Card>

      {/* Informações Financeiras */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Informações Financeiras</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={tipoRepasse}
              onValueChange={handleTipoRepasseChange}
              label="Tipo de Repasse"
              required
              error={errors.tipoRepasse?.message}
            >
              <option value="">Selecione o tipo</option>
              <option value="Percentual">Percentual</option>
              <option value="Valor Fixo">Valor Fixo</option>
            </Select>

            <Input
              label={tipoRepasse === 'Percentual' ? 'Percentual (%)' : 'Valor (R$)'}
              type="number"
              placeholder={tipoRepasse === 'Percentual' ? '15' : '5000'}
              error={errors.valor?.message}
              required
              {...register('valor', { valueAsNumber: true })}
            />

            <Select
              value={watch('status')}
              onValueChange={handleStatusChange}
              label="Status"
              required
              error={errors.status?.message}
            >
              <option value="">Selecione o status</option>
              <option value="Ativa">Ativa</option>
              <option value="Inativa">Inativa</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              <span>Salvando...</span>
            </div>
          ) : (
            initialData ? 'Atualizar' : 'Criar'
          )}
        </Button>
      </div>
    </form>
  )
}