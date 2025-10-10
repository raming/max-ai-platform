import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className
}: StatsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {trend && (
              <span className={cn(
                'font-medium',
                trend.value > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            )}
            {description && <span>{description}</span>}
            {trend && <span>{trend.label}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}