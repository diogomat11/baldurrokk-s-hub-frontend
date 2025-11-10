import React from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface LineChartProps {
  data: any[]
  xKey: string
  lines: {
    key: string
    label: string
    color: string
  }[]
  height?: number
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  lines,
  height = 300,
}) => {
  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [value.toLocaleString('pt-BR'), name]
    }
    return [value, name]
  }

  const formatYAxis = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR')
    }
    return value
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey={xKey} 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={formatYAxis}
          />
          <Tooltip
            formatter={formatTooltipValue}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
          />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}