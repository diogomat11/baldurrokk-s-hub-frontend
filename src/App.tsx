import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Páginas de autenticação
import { LoginPage } from '@/modules/auth/LoginPage'

// Páginas principais
import { DashboardPage } from '@/modules/dashboard/DashboardPage'
import { UnidadesPage } from '@/modules/unidades/UnidadesPage'
import { EquipePage } from '@/modules/equipe/EquipePage'
import { AlunosPage } from '@/modules/alunos/AlunosPage'
import { FinanceiroPage } from '@/modules/financeiro/FinanceiroPage'
import { RelatoriosPage } from '@/modules/relatorios/RelatoriosPage'
import { ConfiguracoesPage } from '@/modules/configuracoes/ConfiguracoesPage'
import { TurmasPage } from '@/modules/turmas/TurmasPage'

// Componentes de loading
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Hook para verificar autenticação
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Rota pública para usuários já autenticados
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <div className="min-h-screen bg-app">
      <Routes>
        {/* Rotas de autenticação */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        
        {/* Rotas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirecionamento da raiz para dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Gestão de unidades */}
          <Route path="unidades" element={<UnidadesPage />} />
          
          {/* Gestão de equipe */}
          <Route path="equipe" element={<EquipePage />} />
          
          {/* Gestão de alunos */}
          <Route path="alunos" element={<AlunosPage />} />

          {/* Gestão de turmas */}
          <Route path="turmas" element={<TurmasPage />} />
          
          {/* Módulo financeiro */}
          <Route path="financeiro/*" element={<FinanceiroPage />} />
          
          {/* Relatórios */}
          <Route path="relatorios" element={<RelatoriosPage />} />
          
          {/* Configurações */}
          <Route path="configuracoes/*" element={<ConfiguracoesPage />} />
        </Route>
        
        {/* Rota catch-all - redireciona para dashboard ou login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default App