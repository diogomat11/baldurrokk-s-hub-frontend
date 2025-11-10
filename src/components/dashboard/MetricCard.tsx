import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  size = 'md',
  className,
}) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    accent: 'text-accent bg-accent/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  return (
    <Card hover className={cn('card-hover', className)}>
      <CardContent className={cn('space-y-3', sizeClasses[size])}>
        <div className="flex items-center justify-between">
          <div className={cn('p-3 rounded-2xl', colorClasses[color])}>
            <Icon className={iconSizes[size]} />
          </div>
          {trend && (
            <div className={cn(
              'flex items-center space-x-1 text-sm font-medium',
              trend.isPositive ? 'text-success' : 'text-danger'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            'font-bold text-foreground',
            size === 'sm' ? 'text-2xl' : size === 'md' ? 'text-3xl' : 'text-4xl'
          )}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}