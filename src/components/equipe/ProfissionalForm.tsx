import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { getUnidades } from '@/services/unidades'
import type { Profissional, CargoProfissional, StatusProfissional } from '@/types'

interface ProfissionalFormProps {
  initialData?: Partial<Profissional>
  onSubmit: (data: Partial<Profissional>) => void | Promise<void>
  onCancel: () => void
}

export const ProfissionalForm: React.FC<ProfissionalFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [nome, setNome] = useState(initialData?.nome || '')
  const [cpf, setCpf] = useState(initialData?.cpf || '')
  const [cargo, setCargo] = useState<CargoProfissional>(initialData?.cargo || 'Professor')
  const [salario, setSalario] = useState<number>(initialData?.salario ?? 0)
  const [especialidades, setEspecialidades] = useState<string[]>(initialData?.especialidades || [])
  const [telefone, setTelefone] = useState(initialData?.telefone || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [unidades, setUnidades] = useState<string[]>(initialData?.unidades || [])
  const [dataContratacao, setDataContratacao] = useState(initialData?.dataContratacao || '')
  const [status, setStatus] = useState<StatusProfissional>(initialData?.status || 'Ativo')
  const [tipoRepasse, setTipoRepasse] = useState<'Fixo' | 'Percentual'>('Fixo')
  const [percentualRepasse, setPercentualRepasse] = useState<number>(0)

  // Carregar lista de unidades para multiselect
  const unidadesQuery = useQuery({ queryKey: ['unidades'], queryFn: () => getUnidades() })

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome || '')
      setCpf(initialData.cpf || '')
      setCargo(initialData.cargo || 'Professor')
      setSalario(initialData.salario ?? 0)
      setEspecialidades(initialData.especialidades || [])
      setTelefone(initialData.telefone || '')
      setEmail(initialData.email || '')
      setUnidades(initialData.unidades || [])
      setDataContratacao(initialData.dataContratacao || '')
      setStatus(initialData.status || 'Ativo')
      setTipoRepasse(initialData.repass_type || 'Fixo')
      setPercentualRepasse(initialData.repass_value || 0)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Partial<Profissional> = {
      nome,
      cpf,
      cargo,
      salario,
      especialidades,
      unidades,
      dataContratacao,
      status,
      repass_type: tipoRepasse,
      repass_value: tipoRepasse === 'Fixo' ? salario : percentualRepasse,
    }
    onSubmit(payload)
  }

  const especialidadesString = especialidades.join(', ')

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input label="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} />
      </div>

      {/* Cargo e Data de contratação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={cargo} onValueChange={(v) => setCargo(v as CargoProfissional)}>
          <SelectTrigger label="Cargo">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Professor">Professor</SelectItem>
            <SelectItem value="Coordenador">Coordenador</SelectItem>
            <SelectItem value="Administrador">Administrador</SelectItem>
            <SelectItem value="Recepcionista">Recepcionista</SelectItem>
            <SelectItem value="Estagiário">Estagiário</SelectItem>
          </SelectContent>
        </Select>
        <Input label="Data de Contratação" type="date" value={dataContratacao} onChange={(e) => setDataContratacao(e.target.value)} />
        {/* Espaço vazio para alinhamento em 3 colunas */}
        <div className="hidden md:block" />
      </div>

      {/* Tipo de repasse e campo condicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={tipoRepasse} onValueChange={(v) => setTipoRepasse(v as 'Fixo' | 'Percentual')}>
          <SelectTrigger label="Tipo de Repasse">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Fixo">Fixo</SelectItem>
            <SelectItem value="Percentual">Percentual</SelectItem>
          </SelectContent>
        </Select>

        {tipoRepasse === 'Fixo' ? (
          <Input label="Salário" type="number" value={String(salario)} onChange={(e) => setSalario(Number(e.target.value) || 0)} />
        ) : (
          <Input label="Percentual de Repasse (%)" type="number" value={String(percentualRepasse)} onChange={(e) => setPercentualRepasse(Number(e.target.value) || 0)} />
        )}

        {/* Placeholder para manter grid em 3 colunas */}
        <div className="hidden md:block" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <Input
        label="Especialidades (separadas por vírgula)"
        value={especialidadesString}
        onChange={(e) => setEspecialidades(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
      />

      {/* Combobox multisseleção de Unidades com busca */}
      <MultiSelect
        label="Unidades"
        placeholder="Selecione unidades..."
        values={unidades}
        onChange={setUnidades}
        options={(unidadesQuery.data || []).map((u) => ({ label: u.nome, value: u.id }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={status} onValueChange={(v) => setStatus(v as StatusProfissional)}>
          <SelectTrigger label="Status">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
            <SelectItem value="Licença">Licença</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}

export default ProfissionalForm