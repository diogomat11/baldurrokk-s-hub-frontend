import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { supabase } from '@/services/supabase/client'
import { MultiSelect } from '@/components/ui/MultiSelect'

const unidadeSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  responsavel: z.string().optional(),
  managerIds: z.array(z.string()).optional(),
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
      managerIds: initialData?.manager_ids || [],
      endereco: initialData?.endereco || '',
      cidade: initialData?.cidade || '',
      estado: initialData?.estado || 'GO',
      cep: initialData?.cep || '',
      telefone: initialData?.telefone || '',
      email: initialData?.email || '',
      tipoRepasse: initialData?.tipoRepasse || 'Percentual',
      valor: initialData?.valor || 0,
      status: initialData?.status || 'Ativa',
    },
  })

  const [managerOptions, setManagerOptions] = React.useState<{ label: string; value: string }[]>([])

  React.useEffect(() => {
    supabase
      .from('professionals')
      .select('id, name')
      .eq('status', 'Ativo')
      .then(({ data }: any) => {
        if (data) {
          setManagerOptions(data.map((p: any) => ({ label: p.name, value: p.id })))
        }
      })
  }, [])

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

            <div className="space-y-2">
              <MultiSelect
                label="Responsáveis"
                placeholder="Selecione os responsáveis"
                options={managerOptions}
                values={watch('managerIds') || []}
                onChange={(vals) => setValue('managerIds', vals)}
              />
            </div>
            {/* Mantemos o campo 'responsavel' invisível ou sincronizado se necessário para compatibilidade, 
                mas a UI agora usa MultiSelect. 
                Se o backend esperar 'manager_ids', devemos garantir que o form envie isso.
             */}
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

            <Select value={watch('estado')} onValueChange={handleEstadoChange}>
              <SelectTrigger label="Estado" required error={!!errors.estado?.message}>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AC">Acre</SelectItem>
                <SelectItem value="AL">Alagoas</SelectItem>
                <SelectItem value="AP">Amapá</SelectItem>
                <SelectItem value="AM">Amazonas</SelectItem>
                <SelectItem value="BA">Bahia</SelectItem>
                <SelectItem value="CE">Ceará</SelectItem>
                <SelectItem value="DF">Distrito Federal</SelectItem>
                <SelectItem value="ES">Espírito Santo</SelectItem>
                <SelectItem value="GO">Goiás</SelectItem>
                <SelectItem value="MA">Maranhão</SelectItem>
                <SelectItem value="MT">Mato Grosso</SelectItem>
                <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                <SelectItem value="MG">Minas Gerais</SelectItem>
                <SelectItem value="PA">Pará</SelectItem>
                <SelectItem value="PB">Paraíba</SelectItem>
                <SelectItem value="PR">Paraná</SelectItem>
                <SelectItem value="PE">Pernambuco</SelectItem>
                <SelectItem value="PI">Piauí</SelectItem>
                <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                <SelectItem value="RO">Rondônia</SelectItem>
                <SelectItem value="RR">Roraima</SelectItem>
                <SelectItem value="SC">Santa Catarina</SelectItem>
                <SelectItem value="SP">São Paulo</SelectItem>
                <SelectItem value="SE">Sergipe</SelectItem>
                <SelectItem value="TO">Tocantins</SelectItem>
              </SelectContent>
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
            <Select value={tipoRepasse} onValueChange={handleTipoRepasseChange}>
              <SelectTrigger label="Tipo de Repasse" required error={!!errors.tipoRepasse?.message}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Percentual">Percentual</SelectItem>
                <SelectItem value="Valor Fixo">Valor Fixo</SelectItem>
              </SelectContent>
            </Select>

            <Input
              label={tipoRepasse === 'Percentual' ? 'Percentual (%)' : 'Valor (R$)'}
              type="number"
              placeholder={tipoRepasse === 'Percentual' ? '15' : '5000'}
              error={errors.valor?.message}
              required
              {...register('valor', { valueAsNumber: true })}
            />

            <Select value={watch('status')} onValueChange={handleStatusChange}>
              <SelectTrigger label="Status" required error={!!errors.status?.message}>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativa">Ativa</SelectItem>
                <SelectItem value="Inativa">Inativa</SelectItem>
              </SelectContent>
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
    </form >
  )
}