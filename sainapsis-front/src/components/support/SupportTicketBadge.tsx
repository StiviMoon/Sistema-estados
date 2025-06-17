// components/support/SupportTicketBadge.tsx
import { Badge } from '@/components/ui/badge'
import { SupportTicketStatus } from '@/lib/types'
import { SUPPORT_TICKET_STATUS_CONFIG } from '@/lib/constants'

interface SupportTicketBadgeProps {
  status: SupportTicketStatus
  className?: string
}

export function SupportTicketBadge({ status, className }: SupportTicketBadgeProps) {
  const config = SUPPORT_TICKET_STATUS_CONFIG[status]
  
  return (
    <Badge className={`${config.color} ${className || ''}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}