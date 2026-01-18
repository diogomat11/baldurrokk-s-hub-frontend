// Tipos de usuário e autenticação
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'Admin' | 'Gerente' | 'Financeiro' | 'Aluno';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Tipos de unidades
export interface Unidade {
  id: string;
  nome: string;
  responsavel: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  tipoRepasse: TipoRepasse;
  valor: number;
  status: StatusUnidade;
  created_at: string;
  updated_at: string;
  turmas?: Turma[];
  managerIds?: string[];
}

export type TipoRepasse = 'Percentual' | 'Valor Fixo';
export type StatusUnidade = 'Ativa' | 'Inativa';

// Tipos de equipe técnica
export interface Profissional {
  id: string;
  nome: string;
  cpf: string;
  cargo: CargoProfissional;
  salario: number;
  especialidades: string[];
  telefone: string;
  email: string;
  unidades: string[];
  dataContratacao: string;
  status: StatusProfissional;
  created_at: string;
  updated_at: string;
  repass_type?: 'Fixo' | 'Percentual';
  repass_value?: number;
}

export type CargoProfissional = 'Professor' | 'Coordenador' | 'Administrador' | 'Recepcionista';
export type StatusProfissional = 'Ativo' | 'Inativo' | 'Licença';

// Tipos de alunos
export interface Aluno {
  id: string;
  avatar?: string;
  nome: string;
  dataNascimento: string;
  dataInicio: string;
  dataSaida?: string;
  cpf: string;
  endereco: string;
  responsavel: ResponsavelAluno;
  unidade: string;
  turma: string;
  planId?: string;
  recurrenceId?: string;
  plano: PlanoAluno;
  formaPagamento: FormaPagamento;
  recorrencia: RecorrenciaPagamento;
  descontos: number;
  status: StatusAluno;
  created_at: string;
  updated_at: string;
}

export interface ResponsavelAluno {
  nome: string;
  telefone: string;
  email: string;
  cpf?: string;
}

export type PlanoAluno = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
export type FormaPagamento = 'Cartão' | 'Pix' | 'Dinheiro' | 'Transferência';
export type RecorrenciaPagamento = 'Mensal' | 'Trimestral' | 'Semestral';
export type StatusAluno = 'Ativo' | 'Inativo' | 'Trial';

// Tipos financeiros
export interface Fatura {
  id: string;
  aluno: Aluno;
  unidade: string;
  mes: string;
  valor: number;
  vencimento: string;
  status: StatusFatura;
  comprovante?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export type StatusFatura = 'Pendente' | 'Pago' | 'Vencido' | 'Cancelado';

export interface Despesa {
  id: string;
  fornecedor: string;
  tipo: TipoDespesa;
  valor: number;
  vencimento: string;
  status: StatusDespesa;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export type TipoDespesa = 'Salário' | 'Aluguel' | 'Utilidades' | 'Equipamentos' | 'Marketing' | 'Outros';
export type StatusDespesa = 'Pendente' | 'Pago' | 'Vencido';

export interface Adiantamento {
  id: string;
  tipo: TipoAdiantamento;
  nome: string;
  valor: number;
  data: string;
  status: StatusAdiantamento;
  observacao?: string;
  created_at: string;
  updated_at: string;
}

export type TipoAdiantamento = 'Salário' | 'Férias' | '13º Salário' | 'Outros';
export type StatusAdiantamento = 'Pendente' | 'Pago' | 'Atrasado';

export interface Repasse {
  id: string;
  profissionalUnidade: string;
  tipo: TipoRepasseOperacao;
  valor: number;
  mes: string;
  status: StatusRepasse;
  created_at: string;
  updated_at: string;
}

export type TipoRepasseOperacao = 'Comissão' | 'Participação' | 'Bonus';
export type StatusRepasse = 'Pendente' | 'Pago' | 'Atrasado';

// Tipos de turmas
export interface Turma {
  id: string;
  nome: string;
  unidade: string;
  professor: string;
  capacidade: number;
  horarios: HorarioTurma[];
  status: StatusTurma;
  created_at: string;
  updated_at: string;
  alunos?: Aluno[];
}

export interface HorarioTurma {
  dia: DiaSemana;
  inicio: string;
  fim: string;
}

export type DiaSemana = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
export type StatusTurma = 'Ativa' | 'Inativa' | 'Suspensa';

// Tipos de notificações
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  action_url?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Tipos para métricas do dashboard
export interface DashboardMetrics {
  totalUnidades: number;
  totalAlunos: number;
  faturamentoMensal: number;
  inadimplencia: number;
  churn: number;
  receitaPorUnidade: ReceitaUnidade[];
  evolucaoFaturamento: EvolutioFaturamento[];
}

export interface ReceitaUnidade {
  unidade: string;
  receita: number;
  alunos: number;
}

export interface EvolutioFaturamento {
  mes: string;
  receita: number;
  despesas: number;
  lucro: number;
}

// Tipos para formulários
export interface FormErrors {
  [key: string]: string | string[] | undefined;
}

// Tipos para API responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para configurações
export interface AppConfig {
  whatsappEnabled: boolean;
  empresa: {
    nome: string;
    logo?: string;
    cores: string[];
  };
  planos: {
    nome: string;
    valor: number;
    recorrencia: string;
  }[];
  configuracoes: {
    autoLogout: number;
    theme: 'light' | 'dark';
    language: 'pt-BR';
  };
}

// Tipos para integrações
export interface IntegracaoWhatsApp {
  provider: 'stub' | 'meta';
  phoneNumberId?: string;
  token?: string;
  verifyToken?: string;
  enabled: boolean;
}

// Tipos para relatórios
export interface FiltroRelatorio {
  dataInicio: string;
  dataFim: string;
  unidade?: string;
  status?: string;
  tipo?: string;
}

export interface RelatorioGenerado {
  id: string;
  nome: string;
  tipo: TipoRelatorio;
  filtros: FiltroRelatorio;
  url: string;
  created_at: string;
  expires_at: string;
}

export type TipoRelatorio = 'mensalidades' | 'alunos' | 'equipe' | 'despesas' | 'repasses';

// Tipos para validação
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  placeholder?: string;
  validation?: ValidationRule;
  options?: { label: string; value: string }[];
}