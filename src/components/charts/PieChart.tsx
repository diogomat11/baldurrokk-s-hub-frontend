import React from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface PieChartProps {
  data: any[]
  valueKey: string
  labelKey: string
  colors?: string[]
  height?: number
  showLegend?: boolean
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  valueKey,
  labelKey,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'],
  height = 300,
  showLegend = true,
}) => {
  const formatTooltipValue = (value: any, name: any) => {
    if (typeof value === 'number') {
      return [value.toLocaleString('pt-BR'), name]
    }
    return [value, name]
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Não mostrar labels para segmentos muito pequenos
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey={valueKey}
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip
            formatter={formatTooltipValue}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))',
              }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
      
      {/* Lista de valores para melhor visualização */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-muted-foreground">{item[labelKey]}</span>
            </div>
            <span className="font-medium">
              {typeof item[valueKey] === 'number' 
                ? item[valueKey].toLocaleString('pt-BR')
                : item[valueKey]
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}