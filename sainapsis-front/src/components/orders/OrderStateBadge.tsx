import { Badge } from '@/components/ui/badge'
import { ORDER_STATE_CONFIG } from '@/lib/constants'
import { OrderState } from '@/lib/types'

interface OrderStateBadgeProps {
  state: OrderState
  showIcon?: boolean
  className?: string
}

export function OrderStateBadge({ state, showIcon = true, className }: OrderStateBadgeProps) {
  const config = ORDER_STATE_CONFIG[state]
  
  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        Unknown
      </Badge>
    )
  }

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${className}`}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  )
}