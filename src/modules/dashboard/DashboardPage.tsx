import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { LineChart } from '@/components/charts/LineChart'
import { PieChart } from '@/components/charts/PieChart'
import { formatCurrency } from '@/lib/utils'
import { getDashboardMetrics } from '@/services/dashboard'
import { PageLoading } from '@/components/ui/LoadingSpinner'

export const DashboardPage: React.FC = () => {
  const { data: dashboardMetrics, isLoading, isError } = useQuery({
    queryKey: ['dashboard','metrics'],
    queryFn: () => getDashboardMetrics(),
    staleTime: 60_000,
  })

  if (isLoading) return <PageLoading />
  if (isError || !dashboardMetrics) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Não foi possível carregar as métricas.</p>
      </div>
    )
  }

  const recentActivities = [
    {
      id: 1,
      type: 'student',
      title: 'Novo aluno cadastrado',
      description: 'João Silva se inscreveu na Unidade Centro',
      time: '5 minutos atrás',
      icon: Users,
      color: 'text-success',
    },
    {
      id: 2,
      type: 'payment',
      title: 'Pagamento recebido',
      description: 'Mensalidade de Maria Santos (R$ 350,00)',
      time: '1 hora atrás',
      icon: DollarSign,
      color: 'text-success',
    },
    {
      id: 3,
      type: 'overdue',
      title: 'Faturas vencidas',
      description: '3 faturas venceram hoje',
      time: '2 horas atrás',
      icon: AlertTriangle,
      color: 'text-warning',
    },
    {
      id: 4,
      type: 'unit',
      title: 'Nova unidade aberta',
      description: 'Unidade Norte iniciou atividades',
      time: '1 dia atrás',
      icon: Building2,
      color: 'text-accent',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral da sua operação
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Unidades"
          value={dashboardMetrics.totalUnidades}
          icon={Building2}
          trend={{ value: 16.7, isPositive: true }}
          color="primary"
        />
        <MetricCard
          title="Total de Alunos"
          value={dashboardMetrics.totalAlunos}
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
          color="accent"
        />
        <MetricCard
          title="Faturamento Mensal"
          value={formatCurrency(dashboardMetrics.faturamentoMensal)}
          icon={DollarSign}
          trend={{ value: 8.2, isPositive: true }}
          color="success"
        />
        <MetricCard
          title="Inadimplência"
          value={`${dashboardMetrics.inadimplencia}%`}
          icon={TrendingDown}
          trend={{ value: 2.1, isPositive: false }}
          color="danger"
        />
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução do Faturamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Evolução do Faturamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={dashboardMetrics.evolucaoFaturamento}
              xKey="mes"
              lines={[
                { key: 'receita', label: 'Receita', color: '#10B981' },
                { key: 'despesas', label: 'Despesas', color: '#EF4444' },
                { key: 'lucro', label: 'Lucro', color: '#3B82F6' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Receita por Unidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Receita por Unidade</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={dashboardMetrics.receitaPorUnidade}
              valueKey="receita"
              labelKey="unidade"
              colors={[
                '#3B82F6',
                '#10B981',
                '#F59E0B',
                '#EF4444',
                '#8B5CF6',
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Linha de métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Churn Rate"
          value={`${dashboardMetrics.churn}%`}
          icon={TrendingDown}
          trend={{ value: 1.2, isPositive: false }}
          color="warning"
          size="sm"
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(70)}
          icon={DollarSign}
          trend={{ value: 5.3, isPositive: true }}
          color="accent"
          size="sm"
        />
        <MetricCard
          title="Capacidade Média"
          value="85%"
          icon={Target}
          trend={{ value: 3.7, isPositive: true }}
          color="success"
          size="sm"
        />
      </div>

      {/* Atividades recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 rounded-xl hover:bg-muted transition-colors"
              >
                <div className={`p-2 rounded-xl bg-muted ${activity.color}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}