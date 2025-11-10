import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Em ambientes de desenvolvimento sem Supabase configurado, fornecemos um stub seguro
// para evitar que a aplicação quebre com tela branca na inicialização.
type StubResponse<T = any> = { data: T | null; error: { message: string } | null }

const createStub = () => {
  const ok = <T>(data: T | null = null): StubResponse<T> => ({ data, error: null })
  const err = (message = 'supabase_not_configured'): StubResponse => ({ data: null, error: { message } })

  const auth = {
    async getSession() { return ok<{ session: any | null }>({ session: null }) },
    async signInWithPassword() { return err() },
    async signOut() { return ok() },
    async signUp() { return err() },
    async refreshSession() { return ok<{ user: any | null; session: any | null }>({ user: null, session: null }) },
  }

  const from = (_table: string) => ({
    select() { return { eq: (_: string, __: any) => ({ async single() { return ok(null) } }) } },
    async insert() { return err('stub_insert_not_supported') },
    async update() { return err('stub_update_not_supported') },
  })

  const rpc = async (_fn: string, _args?: any) => err('stub_rpc_not_supported')

  return { auth, from, rpc }
}

export const supabase: any = (!supabaseUrl || !supabaseAnonKey)
  ? createStub()
  : createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'public' },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })

// Tipos para o Supabase (opcional, para melhor DX)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'Admin' | 'Gerente' | 'Financeiro' | 'Aluno'
          avatar_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'Admin' | 'Gerente' | 'Financeiro' | 'Aluno'
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'Admin' | 'Gerente' | 'Financeiro' | 'Aluno'
          avatar_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      unidades: {
        Row: {
          id: string
          nome: string
          responsavel: string
          endereco: string
          cidade: string
          estado: string
          cep: string
          telefone: string
          email: string
          tipo_repasse: 'Percentual' | 'Valor Fixo'
          valor: number
          status: 'Ativa' | 'Inativa'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          responsavel: string
          endereco: string
          cidade: string
          estado: string
          cep: string
          telefone: string
          email: string
          tipo_repasse: 'Percentual' | 'Valor Fixo'
          valor: number
          status?: 'Ativa' | 'Inativa'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          responsavel?: string
          endereco?: string
          cidade?: string
          estado?: string
          cep?: string
          telefone?: string
          email?: string
          tipo_repasse?: 'Percentual' | 'Valor Fixo'
          valor?: number
          status?: 'Ativa' | 'Inativa'
          created_at?: string
          updated_at?: string
        }
      }
      profissionais: {
        Row: {
          id: string
          nome: string
          cpf: string
          cargo: 'Professor' | 'Coordenador' | 'Administrador' | 'Recepcionista'
          salario: number
          especialidades: string[]
          telefone: string
          email: string
          unidades: string[]
          data_contratacao: string
          status: 'Ativo' | 'Inativo' | 'Licença'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cpf: string
          cargo: 'Professor' | 'Coordenador' | 'Administrador' | 'Recepcionista'
          salario: number
          especialidades: string[]
          telefone: string
          email: string
          unidades: string[]
          data_contratacao: string
          status?: 'Ativo' | 'Inativo' | 'Licença'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string
          cargo?: 'Professor' | 'Coordenador' | 'Administrador' | 'Recepcionista'
          salario?: number
          especialidades?: string[]
          telefone?: string
          email?: string
          unidades?: string[]
          data_contratacao?: string
          status?: 'Ativo' | 'Inativo' | 'Licença'
          created_at?: string
          updated_at?: string
        }
      }
      alunos: {
        Row: {
          id: string
          avatar?: string
          nome: string
          data_nascimento: string
          data_inicio: string
          cpf: string
          endereco: string
          responsavel_nome: string
          responsavel_telefone: string
          responsavel_email: string
          unidade: string
          turma: string
          plano: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual'
          forma_pagamento: 'Cartão' | 'Pix' | 'Dinheiro' | 'Transferência'
          recorrencia: 'Mensal' | 'Trimestral' | 'Semestral'
          descontos: number
          status: 'Ativo' | 'Inativo' | 'Trial'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          avatar?: string
          nome: string
          data_nascimento: string
          data_inicio: string
          cpf: string
          endereco: string
          responsavel_nome: string
          responsavel_telefone: string
          responsavel_email: string
          unidade: string
          turma: string
          plano: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual'
          forma_pagamento: 'Cartão' | 'Pix' | 'Dinheiro' | 'Transferência'
          recorrencia: 'Mensal' | 'Trimestral' | 'Semestral'
          descontos?: number
          status?: 'Ativo' | 'Inativo' | 'Trial'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          avatar?: string
          nome?: string
          data_nascimento?: string
          data_inicio?: string
          cpf?: string
          endereco?: string
          responsavel_nome?: string
          responsavel_telefone?: string
          responsavel_email?: string
          unidade?: string
          turma?: string
          plano?: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual'
          forma_pagamento?: 'Cartão' | 'Pix' | 'Dinheiro' | 'Transferência'
          recorrencia?: 'Mensal' | 'Trimestral' | 'Semestral'
          descontos?: number
          status?: 'Ativo' | 'Inativo' | 'Trial'
          created_at?: string
          updated_at?: string
        }
      }
      turmas: {
        Row: {
          id: string
          nome: string
          unidade: string
          professor: string
          capacidade: number
          horarios: {
            dia: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo'
            inicio: string
            fim: string
          }[]
          status: 'Ativa' | 'Inativa' | 'Suspensa'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          unidade: string
          professor: string
          capacidade: number
          horarios: {
            dia: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo'
            inicio: string
            fim: string
          }[]
          status?: 'Ativa' | 'Inativa' | 'Suspensa'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          unidade?: string
          professor?: string
          capacidade?: number
          horarios?: {
            dia: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo'
            inicio: string
            fim: string
          }[]
          status?: 'Ativa' | 'Inativa' | 'Suspensa'
          created_at?: string
          updated_at?: string
        }
      }
      faturas: {
        Row: {
          id: string
          aluno_id: string
          unidade_id: string
          mes: string
          valor: number
          vencimento: string
          status: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado'
          comprovante?: string
          observacoes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          aluno_id: string
          unidade_id: string
          mes: string
          valor: number
          vencimento: string
          status?: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado'
          comprovante?: string
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          aluno_id?: string
          unidade_id?: string
          mes?: string
          valor?: number
          vencimento?: string
          status?: 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado'
          comprovante?: string
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
      }
      despesas: {
        Row: {
          id: string
          fornecedor: string
          tipo: 'Salário' | 'Aluguel' | 'Utilidades' | 'Equipamentos' | 'Marketing' | 'Outros'
          valor: number
          vencimento: string
          status: 'Pendente' | 'Pago' | 'Vencido'
          observacoes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fornecedor: string
          tipo: 'Salário' | 'Aluguel' | 'Utilidades' | 'Equipamentos' | 'Marketing' | 'Outros'
          valor: number
          vencimento: string
          status?: 'Pendente' | 'Pago' | 'Vencido'
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fornecedor?: string
          tipo?: 'Salário' | 'Aluguel' | 'Utilidades' | 'Equipamentos' | 'Marketing' | 'Outros'
          valor?: number
          vencimento?: string
          status?: 'Pendente' | 'Pago' | 'Vencido'
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
      }
      adiantamentos: {
        Row: {
          id: string
          tipo: 'Salário' | 'Férias' | '13º Salário' | 'Outros'
          nome: string
          valor: number
          data: string
          status: 'Pendente' | 'Pago' | 'Atrasado'
          observacao?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tipo: 'Salário' | 'Férias' | '13º Salário' | 'Outros'
          nome: string
          valor: number
          data: string
          status?: 'Pendente' | 'Pago' | 'Atrasado'
          observacao?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tipo?: 'Salário' | 'Férias' | '13º Salário' | 'Outros'
          nome?: string
          valor?: number
          data?: string
          status?: 'Pendente' | 'Pago' | 'Atrasado'
          observacao?: string
          created_at?: string
          updated_at?: string
        }
      }
      repasses: {
        Row: {
          id: string
          profissional_unidade: string
          tipo: 'Comissão' | 'Participação' | 'Bonus'
          valor: number
          mes: string
          status: 'Pendente' | 'Pago' | 'Atrasado'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profissional_unidade: string
          tipo: 'Comissão' | 'Participação' | 'Bonus'
          valor: number
          mes: string
          status?: 'Pendente' | 'Pago' | 'Atrasado'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profissional_unidade?: string
          tipo?: 'Comissão' | 'Participação' | 'Bonus'
          valor?: number
          mes?: string
          status?: 'Pendente' | 'Pago' | 'Atrasado'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}