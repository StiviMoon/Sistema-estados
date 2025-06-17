'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SupportTicketBadge } from '@/components/support/SupportTicketBadge'
import { supportApi } from '@/lib/api'
import { SupportTicket } from '@/lib/types'
import { 
  Ticket, 
  Eye, 
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useCallback } from 'react'
interface OrderSupportTicketsProps {
  orderId: string
}

export function OrderSupportTickets({ orderId }: OrderSupportTicketsProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

 

  const fetchTickets = useCallback(
    async (showRefreshToast = false) => {
      try {
        if (showRefreshToast) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }
        
        const response = await supportApi.getByOrderId(orderId)
        setTickets(response.data)
        
        if (showRefreshToast) {
          toast.success(`${response.data.length} support tickets loaded`)
        }
      } catch (error) {
        console.error('Error fetching support tickets:', error)
        if (showRefreshToast) {
          toast.error('Failed to refresh support tickets')
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [orderId]
  )

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Support Tickets
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => fetchTickets(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>
            No support tickets for this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Ticket className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No support tickets have been created for this order
            </p>
            <Link href="/support">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-2" />
                View All Tickets
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const openTickets = tickets.filter(t => t.status === 'open').length
  const totalValue = tickets.reduce((sum, ticket) => sum + ticket.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Support Tickets
              <Badge variant="secondary">{tickets.length}</Badge>
              {openTickets > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {openTickets} Open
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Support tickets related to this order
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => fetchTickets(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/support">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-2" />
                All Tickets
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Tickets</p>
            <p className="text-lg font-semibold">{tickets.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-lg font-semibold text-green-600">
              ${totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketItem key={ticket.id} ticket={ticket} />
          ))}
        </div>

        {/* View All Link */}
        {tickets.length > 2 && (
          <div className="mt-4 pt-3 border-t">
            <Link href={`/support?order=${orderId}`}>
              <Button variant="ghost" size="sm" className="w-full">
                View All {tickets.length} Tickets
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TicketItem({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">#{ticket.id.slice(-8)}</h4>
          <SupportTicketBadge status={ticket.status} />
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">${ticket.amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {ticket.reason}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(ticket.created_at), 'MMM d, HH:mm')}
          </span>
          {ticket.status === 'open' && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Needs Attention
            </span>
          )}
        </div>
        
        <Link href={`/support/${ticket.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </Link>
      </div>
    </div>
  )
}