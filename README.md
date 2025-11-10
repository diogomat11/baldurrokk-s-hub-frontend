# Baldurrokk's Hub - Frontend

Sistema de gestão completo para academias e centros esportivos, desenvolvido com React, TypeScript e design moderno.

## 🚀 Tecnologias

- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **TailwindCSS** + **shadcn/ui** para estilização
- **Zustand** para gerenciamento de estado
- **React Router DOM v7** para roteamento
- **React Hook Form** + **Zod** para formulários
- **TanStack Query** para cache de dados
- **Supabase** para autenticação e backend
- **Lucide React** para ícones
- **Recharts** para gráficos

## 📋 Funcionalidades

### 🔐 Autenticação
- Login seguro com Supabase Auth
- Auto-logout após 20 minutos de inatividade
- Gerenciamento de roles (Admin, Gerente, Financeiro, Aluno)
- Refresh automático de tokens

### 📊 Dashboard
- Métricas principais em cards informativos
- Gráficos de evolução de faturamento
- Receita por unidade
- Atividades recentes
- Indicadores de performance (KPIs)

### 🏢 Gestão de Unidades
- Cadastro completo de unidades
- Informações de responsável e localização
- Configuração de repasses
- Status ativo/inativo
- Gestão de turmas por unidade

### 👥 Equipe Técnica
- Cadastro de profissionais
- Controle de cargos e salários
- Gestão de especialidades
- Atribuição a unidades
- Status de contratação

### 🎓 Gestão de Alunos
- Cadastro completo com foto
- Controle de planos e mensalidades
- Gestão de responsáveis
- Atribuição a turmas e unidades
- Histórico de pagamentos

### 💰 Módulo Financeiro
- **Recebíveis**: Geração e controle de mensalidades
- **Despesas**: Controle de gastos operacionais
- **Repasses**: Gestão de comissões e participações
- **Adiantamentos**: Controle de adiantamentos salariais
- Integração com WhatsApp para cobranças
- Upload de comprovantes

### 📈 Relatórios
- Exportação em CSV/XLSX
- Filtros por período, unidade e status
- Relatórios de mensalidades, alunos, equipe, despesas e repasses

### ⚙️ Configurações
- Gestão de usuários e permissões
- Configuração de planos e valores
- Integração com WhatsApp
- Configurações do sistema

## 🎨 Design System

### Cores Principais
- **Primary**: `#0F172A` - Cor principal da interface
- **Accent**: `#3B82F6` - Cor de destaque e ações
- **Success**: `#10B981` - Estados positivos
- **Warning**: `#F59E0B` - Estados de alerta
- **Danger**: `#EF4444` - Estados de erro

### Tipografia
- **Fonte**: Inter (Google Fonts)
- **Hierarquia**: Títulos, subtítulos e texto corpo bem definidos

### Componentes
- Cards com cantos arredondados (border-radius: 1rem)
- Shadows consistentes
- Transições suaves (200ms)
- Estados hover e focus bem definidos

## 🏗️ Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes básicos (Button, Input, Card, etc.)
│   ├── layout/          # Layouts (Sidebar, Topbar, MainLayout)
│   ├── forms/           # Componentes de formulário
│   ├── tables/          # Componentes de tabelas
│   ├── modals/          # Modais e diálogos
│   ├── charts/          # Componentes de gráficos
│   └── dashboard/       # Componentes específicos do dashboard
├── modules/             # Módulos da aplicação
│   ├── auth/            # Autenticação
│   ├── dashboard/       # Dashboard
│   ├── unidades/        # Gestão de unidades
│   ├── equipe/          # Gestão de equipe
│   ├── alunos/          # Gestão de alunos
│   ├── financeiro/      # Módulo financeiro
│   ├── relatorios/      # Relatórios
│   └── configuracoes/   # Configurações
├── hooks/               # Custom hooks
├── store/               # Gerenciamento de estado (Zustand)
├── services/            # Serviços (API, Supabase, WhatsApp)
├── styles/              # Estilos globais
├── types/               # Definições TypeScript
└── lib/                 # Utilitários
```

## 🚦 Getting Started

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd baldurrokk-s-hub-frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_URL=http://localhost:3001
VITE_API_KEY=your_api_key_here
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse a aplicação em `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

## 📱 Responsividade

O sistema é totalmente responsivo com breakpoints:
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

### Sidebar
- Collapses automaticamente em telas menores que 768px
- Overlay com blur effect em mobile
- Animations suaves para expansão/colapso

### Cards e Grids
- Layout adaptativo baseado no tamanho da tela
- Stack vertical em mobile
- Colunas múltiplas em desktop

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa linter (ESLint)

## 🎯 Features Avançadas

### Estado de Loading
- Spinners consistentes em toda aplicação
- Estados de loading para botões
- Loading skeletons para melhor UX

### Notificações
- Toast notifications com Sonner
- Tipos: success, error, warning, info
- Posicionamento responsivo

### Validação de Formulários
- Schema validation com Zod
- Feedback visual em tempo real
- Máscaras para campos específicos (CPF, telefone, CEP)

### Performance
- Code splitting por módulos
- Lazy loading de componentes pesados
- Cache inteligente com React Query
- Otimização de bundle com Vite

## 🔒 Segurança

- Autenticação JWT via Supabase
- Role-based access control (RBAC)
- Validação de entrada em frontend e backend
- Proteção contra XSS e CSRF
- Sanitização de dados

## 📊 Monitoramento

- Error boundary para capturar erros
- Logging de ações importantes
- Tracking de performance
- Métricas de uso

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

Desenvolvido por MiniMax Agent

---

**Baldurrokk's Hub** - Transformando a gestão de academias em uma experiência digital moderna e eficiente.