# 🚀 Baldurrokk's Hub - Guia de Execução

## Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn
- Conta no Supabase (para autenticação)

## 🔧 Instalação e Configuração

### 1. Instalar dependências

```bash
cd baldurrokk-s-hub-frontend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env com suas credenciais
```

**Arquivo .env:**
```env
# Supabase (obrigatório)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Backend (opcional para desenvolvimento)
VITE_API_URL=http://localhost:3001
VITE_API_KEY=your-api-key

# Configurações da aplicação
VITE_WHATSAPP_ENABLED=true
VITE_APP_NAME="Baldurrokk's Hub"
```

### 3. Executar o projeto

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📱 Funcionalidades Implementadas

### ✅ Concluído

#### 🔐 Sistema de Autenticação
- Login/logout com Supabase Auth
- Controle de acesso por roles (Admin, Gerente, Financeiro, Aluno)
- Auto-logout após 20 minutos de inatividade
- Refresh automático de tokens

#### 🎨 Design System
- Paleta de cores profissional e moderna
- Tipografia com hierarquia clara
- Componentes UI com shadcn/ui + TailwindCSS
- Ícones Lucide React
- Animações e transições suaves

#### 📊 Dashboard
- Métricas em cards informativos
- Gráficos de evolução de faturamento (LineChart)
- Gráficos de receita por unidade (PieChart)
- Atividades recentes
- Indicadores de performance (KPIs)

#### 🏢 Gestão de Unidades
- Cadastro completo de unidades
- Informações de responsável e localização
- Configuração de repasses (Percentual/Valor Fixo)
- Status ativo/inativo
- Visualização de turmas vinculadas
- Busca e filtros
- Interface de cards responsivos

#### 🧭 Navegação e Layout
- Sidebar responsiva com menu lateral
- Topbar com busca, notificações e menu do usuário
- Layout principal com área de conteúdo
- Autenticação com layout dedicado

#### 🛠️ Componentes Base
- Button (com variações)
- Input (com validação)
- Card (com hover effects)
- Modal (com tamanhos)
- Select (com busca)
- Badge (com status)
- Avatar (com upload)
- LoadingSpinner
- Componentes de gráficos

### 🚧 Em Desenvolvimento

#### 👥 Gestão de Equipe
#### 🎓 Gestão de Alunos
#### 💰 Módulo Financeiro
#### 📈 Relatórios
#### ⚙️ Configurações

## 🎯 Como Usar

### Login
Use as credenciais de demonstração:
- **Admin:** admin@baldurrokk.com / 123456
- **Gerente:** gerente@baldurrokk.com / 123456
- **Financeiro:** financeiro@baldurrokk.com / 123456

### Navegação
1. Use a sidebar para navegar entre os módulos
2. Clique no botão "Nova Unidade" para criar uma unidade
3. Use a busca no topo para encontrar unidades rapidamente

### Responsividade
- A sidebar colapsa automaticamente em mobile
- Os cards se reorganizam baseado no tamanho da tela
- Todos os componentes são totalmente responsivos

## 🔧 Personalização

### Cores
Edite o arquivo `tailwind.config.js` para modificar as cores:

```js
colors: {
  primary: "#0F172A",     // Cor principal
  accent: "#3B82F6",      // Cor de destaque
  success: "#10B981",     // Estados positivos
  warning: "#F59E0B",     // Alertas
  danger: "#EF4444",      // Erros
}
```

### Componentes
Todos os componentes estão em `src/components/` e podem ser customizados conforme necessário.

## 📦 Estrutura do Projeto

```
baldurrokk-s-hub-frontend/
├── public/                    # Arquivos estáticos
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── ui/              # Componentes básicos
│   │   ├── layout/          # Layouts
│   │   ├── charts/          # Gráficos
│   │   └── unidades/        # Componentes específicos
│   ├── modules/             # Páginas/Módulos
│   ├── hooks/               # Custom hooks
│   ├── store/               # Estado global (Zustand)
│   ├── services/            # Serviços (API, Supabase)
│   ├── styles/              # Estilos globais
│   ├── types/               # TypeScript types
│   └── lib/                 # Utilitários
└── README.md
```

## 🎨 Destaques do Design

### Psicologia das Cores
- **Azul (#0F172A):** Confiança e profissionalismo
- **Verde (#10B981):** Sucesso e crescimento
- **Amarelo (#F59E0B):** Atenção e alerta
- **Vermelho (#EF4444):** Erros e ações críticas

### Hierarquia Visual
- Títulos grandes e contrastantes
- Cards com sombras sutis
- Espaçamento consistente
- Ícones contextuais

### UX/UI
- Micro-interações suaves
- Feedback visual imediato
- Estados de loading elegantes
- Navegação intuitiva

## 🤝 Próximos Passos

1. **Backend:** Integrar com API backend
2. **Autenticação:** Configurar Supabase tables
3. **Database:** Criar esquema de dados
4. **Alunos:** Implementar gestão completa
5. **Financeiro:** Desenvolver módulo financeiro
6. **Relatórios:** Sistema de relatórios
7. **Mobile:** PWA ou app nativo

---

**Desenvolvido com ❤️ por MiniMax Agent**