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
import type { Aluno, FormaPagamento, StatusAluno } from '@/types'
import { getUnidades } from '@/services/unidades'
import { getTurmas } from '@/services/turmas'
import { getPlanos } from '@/services/planos'
import { getRecorrencias } from '@/services/recorrencias'

interface AlunoFormProps {
  initialData?: Partial<Aluno>
  onSubmit: (data: Partial<Aluno> & { planId?: string; recurrenceId?: string }) => void | Promise<void>
  onCancel: () => void
}

export const AlunoForm: React.FC<AlunoFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [nome, setNome] = useState(initialData?.nome || '')
  const [cpf, setCpf] = useState(initialData?.cpf || '')
  const [dataNascimento, setDataNascimento] = useState(initialData?.dataNascimento || '')
  const [dataInicio, setDataInicio] = useState(initialData?.dataInicio || '')
  const [dataSaida, setDataSaida] = useState(initialData?.dataSaida || '')
  const [endereco, setEndereco] = useState(initialData?.endereco || '')
  const [responsavelNome, setResponsavelNome] = useState(initialData?.responsavel?.nome || '')
  const [responsavelTelefone, setResponsavelTelefone] = useState(initialData?.responsavel?.telefone || '')
  const [responsavelEmail, setResponsavelEmail] = useState(initialData?.responsavel?.email || '')
  const [responsavelCpf, setResponsavelCpf] = useState(initialData?.responsavel?.cpf || '')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(initialData?.formaPagamento || 'Pix')
  const [status, setStatus] = useState<StatusAluno>(initialData?.status || 'Ativo')
  const [unidade, setUnidade] = useState(initialData?.unidade || '')
  const [turma, setTurma] = useState(initialData?.turma || '')
  const [planId, setPlanId] = useState<string>('')
  const [recurrenceId, setRecurrenceId] = useState<string>('')
  const [mostrarTodosPlanos, setMostrarTodosPlanos] = useState(false)

  const unidadesQuery = useQuery({ queryKey: ['unidades'], queryFn: () => getUnidades() })
  const turmasQuery = useQuery({
    queryKey: ['turmas', unidade],
    queryFn: () => getTurmas(unidade ? { unitId: unidade } : undefined),
    enabled: !!unidade,
  })
  const planosQuery = useQuery({
    queryKey: ['planos', mostrarTodosPlanos ? 'all' : unidade],
    queryFn: () => getPlanos(mostrarTodosPlanos ? undefined : (unidade || undefined)),
    enabled: mostrarTodosPlanos || !!unidade,
  })
  const recorrenciasQuery = useQuery({ queryKey: ['recorrencias'], queryFn: () => getRecorrencias() })

  useEffect(() => {
    // Ao trocar de unidade, resetar fallback e plano selecionado
    setMostrarTodosPlanos(false)
    setPlanId('')
  }, [unidade])

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome || '')
      setCpf(initialData.cpf || '')
      setDataNascimento(initialData.dataNascimento || '')
      setDataInicio(initialData.dataInicio || '')
      setDataSaida(initialData.dataSaida || '')
      setEndereco(initialData.endereco || '')
      setResponsavelNome(initialData.responsavel?.nome || '')
      setResponsavelTelefone(initialData.responsavel?.telefone || '')
      setResponsavelEmail(initialData.responsavel?.email || '')
      setResponsavelCpf(initialData.responsavel?.cpf || '')
      setFormaPagamento(initialData.formaPagamento || 'Pix')
      setStatus(initialData.status || 'Ativo')
      setUnidade(initialData.unidade || '')
      setTurma(initialData.turma || '')
      setPlanId(initialData.planId || '')
      setRecurrenceId(initialData.recurrenceId || '')
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  const payload: Partial<Aluno> & { planId?: string; recurrenceId?: string } = {
      nome,
      cpf,
      dataNascimento,
      dataInicio,
      dataSaida,
      endereco,
      responsavel: {
        nome: responsavelNome,
        telefone: responsavelTelefone,
        email: responsavelEmail,
        cpf: responsavelCpf,
      },
      formaPagamento,
      status,
      unidade,
      turma,
      planId: planId || undefined,
      recurrenceId: recurrenceId || undefined,
    }
    onSubmit(payload)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input label="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Data de Nascimento" type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
        <Input label="Data de Início" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        <Input label="Data de Saída" type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} />
      </div>
      <Input label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input label="Responsável" value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} />
        <Input label="Telefone" value={responsavelTelefone} onChange={(e) => setResponsavelTelefone(e.target.value)} />
        <Input label="Email" type="email" value={responsavelEmail} onChange={(e) => setResponsavelEmail(e.target.value)} />
        <Input label="CPF do Responsável" value={responsavelCpf} onChange={(e) => setResponsavelCpf(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}>
          <SelectTrigger label="Forma de Pagamento">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pix">Pix</SelectItem>
            <SelectItem value="Cartão">Cartão</SelectItem>
            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
            <SelectItem value="Transferência">Transferência</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v as StatusAluno)}>
          <SelectTrigger label="Status">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
            <SelectItem value="Trial">Trial</SelectItem>
          </SelectContent>
        </Select>

        <Select value={unidade} onValueChange={(v) => { setUnidade(v); setTurma(''); setPlanId(''); }}>
          <SelectTrigger label="Unidade">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(unidadesQuery.data || []).map(u => (
              <SelectItem key={u.id} value={u.id}>{u.nome || u.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={turma} onValueChange={(v) => setTurma(v)}>
          <SelectTrigger label="Turma">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(turmasQuery.data || []).map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={planId} onValueChange={(v) => setPlanId(v)}>
          <SelectTrigger label="Plano">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(planosQuery.data || []).map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {unidade && (planosQuery.data?.length === 0) && (
          <div className="text-sm text-muted-foreground">
            Nenhum plano ativo nesta unidade.
            <Button type="button" variant="link" onClick={() => setMostrarTodosPlanos(true)}>
              Ver planos de todas unidades
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={recurrenceId} onValueChange={(v) => setRecurrenceId(v)}>
          <SelectTrigger label="Recorrência">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(recorrenciasQuery.data || []).map(r => (
              <SelectItem key={r.id} value={r.id}>{String(r.type)}</SelectItem>
            ))}
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

export default AlunoForm