import React from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { PieChart } from '@/components/charts/PieChart'
import { Receipt, DollarSign, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

import { MensalidadesPage } from './MensalidadesPage'
import { DespesasPage } from './DespesasPage'
import { RepassesPage } from './RepassesPage'
import { LancamentosPage } from './LancamentosPage'
import { RepasseDetails } from './RepasseDetails'

export const FinanceiroPage: React.FC = () => {
  const tabs = [
    { label: 'Recebíveis', to: '/financeiro/mensalidades' },
    { label: 'Despesas', to: '/financeiro/despesas' },
    { label: 'Repasses', to: '/financeiro/repasses' },
    { label: 'Lançamentos', to: '/financeiro/lancamentos' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Gestão de recebíveis, despesas e repasses
        </p>
      </div>

      <div className="flex items-center space-x-2 border-b border-border">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => (
              [
                'px-4 py-2 rounded-t-xl transition-colors',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')
            )}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Overview />} />
        <Route path="mensalidades" element={<MensalidadesPage />} />
        <Route path="despesas" element={<DespesasPage />} />
        <Route path="repasses" element={<RepassesPage />} />
        <Route path="repasses/:id" element={<RepasseDetails />} />
        <Route path="lancamentos" element={<LancamentosPage />} />
        <Route path="*" element={<Navigate to="/financeiro" replace />} />
      </Routes>
    </div>
  )
}

const Overview: React.FC = () => {
  const kpis = {
    receber: 12450.75,
    pagas: 8750.0,
    despesasMes: 5320.9,
  }

  const recebiveisPorStatus = [
    { label: 'Pendente', total: 4200 },
    { label: 'Pago', total: 8750 },
    { label: 'Vencido', total: 500 },
  ]

  const despesasPorTipo = [
    { label: 'Salário', total: 2500 },
    { label: 'Aluguel', total: 1800 },
    { label: 'Utilidades', total: 450 },
    { label: 'Outros', total: 570 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="A receber"
          value={formatCurrency(kpis.receber)}
          icon={Receipt}
          trend={{ value: 2.1, isPositive: true }}
          color="accent"
        />
        <MetricCard
          title="Pagas"
          value={formatCurrency(kpis.pagas)}
          icon={DollarSign}
          trend={{ value: 1.2, isPositive: true }}
          color="success"
        />
        <MetricCard
          title="Despesas do mês"
          value={formatCurrency(kpis.despesasMes)}
          icon={Wallet}
          trend={{ value: 0.8, isPositive: false }}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recebíveis por status</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={recebiveisPorStatus} valueKey="total" labelKey="label" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={despesasPorTipo} valueKey="total" labelKey="label" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}