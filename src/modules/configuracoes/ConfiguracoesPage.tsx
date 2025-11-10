import React from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

import { UsuariosPage } from './UsuariosPage'
import { PlanosPage } from './PlanosPage'
import { RecorrenciasPage } from './RecorrenciasPage'
import { TiposPagamentoPage } from './TiposPagamentoPage'
import { IntegracoesPage } from './IntegracoesPage'

export const ConfiguracoesPage: React.FC = () => {
  const tabs = [
    { label: 'Usuários', to: '/configuracoes/usuarios' },
    { label: 'Planos', to: '/configuracoes/planos' },
    { label: 'Recorrências', to: '/configuracoes/recorrencias' },
    { label: 'Pagamento', to: '/configuracoes/pagamento' },
    { label: 'Integrações', to: '/configuracoes/integracoes' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Cadastros e gerenciamento do sistema</p>
      </div>

      <div className="flex items-center space-x-2 border-b border-border">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => (
              [
                'px-4 py-2 rounded-t-xl transition-colors',
                isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
              ].join(' ')
            )}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Overview />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="planos" element={<PlanosPage />} />
        <Route path="recorrencias" element={<RecorrenciasPage />} />
        <Route path="pagamento" element={<TiposPagamentoPage />} />
        <Route path="integracoes" element={<IntegracoesPage />} />
        <Route path="*" element={<Navigate to="/configuracoes" replace />} />
      </Routes>
    </div>
  )
}

const Overview: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Gerencie papéis e status dos usuários.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Planos e Recorrências</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cadastre planos e regras de recorrência.</p>
        </CardContent>
      </Card>
    </div>
  )
}