'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SupportTicketBadge } from '@/components/support/SupportTicketBadge'
import { supportApi } from '@/lib/api'
import { SupportTicket, SupportTicketStatus, UpdateTicketStatusRequest } from '@/lib/types'
import { SUPPORT_TICKET_STATUS_CONFIG } from '@/lib/constants'
import { 
  ArrowLeft, 
  RefreshCw, 
  Ticket, 
  DollarSign, 
  Calendar, 
  FileText,
  AlertTriangle,
  ExternalLink,
  Save
} from 'lucide-react'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'

interface SupportTicketDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function SupportTicketDetailPage({ params }: SupportTicketDetailPageProps) {
  const resolvedParams = use(params)
  const ticketId = resolvedParams.id

  const router = useRouter()
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState<SupportTicketStatus>('open')
  const [notes, setNotes] = useState('')

  const fetchTicketData = useCallback(async (showRefreshToast = false) => {
    try {
      setLoading(true)
      const response = await supportApi.getById(ticketId)
      setTicket(response.data)
      setNewStatus(response.data.status)
      
      if (showRefreshToast) {
        toast.success('Ticket data refreshed')
      }
    } catch (error: unknown) {
      console.error('Error fetching ticket data:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status?: number } }
        if (apiError.response?.status === 404) {
          toast.error('Ticket not found')
          router.push('/support')
        } else {
          toast.error('Failed to fetch ticket data')
        }
      } else {
        toast.error('Failed to fetch ticket data')
      }
    } finally {
      setLoading(false)
    }
  }, [ticketId, router])

  useEffect(() => {
    if (ticketId) {
      fetchTicketData()
    }
  }, [ticketId, fetchTicketData])

  const handleUpdateStatus = async () => {
    if (!ticket) return

    try {
      setUpdating(true)
      
      const updateData: UpdateTicketStatusRequest = {
        status: newStatus,
        metadata: {
          updated_by: 'support_agent',
          update_notes: notes,
          updated_at: new Date().toISOString()
        }
      }

      await supportApi.updateStatus(ticket.id, updateData)
      
      toast.success('Ticket status updated successfully')
      setNotes('')
      fetchTicketData(true)
    } catch (error: unknown) {
      console.error('Error updating ticket:', error)
      toast.error('Failed to update ticket status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ticket Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The support ticket youre looking for doesnt exist or has been removed.
          </p>
          <Button onClick={() => router.push('/support')}>
            Back to Support Tickets
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = SUPPORT_TICKET_STATUS_CONFIG[ticket.status]
  const hasChanges = newStatus !== ticket.status || notes.trim() !== ''

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Support Ticket #{ticket.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchTicketData(true)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <SupportTicketBadge status={ticket.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Ticket Information
              </CardTitle>
              <CardDescription>
                Support ticket details and current status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Section */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{statusConfig.icon}</div>
                  <div>
                    <h3 className="font-semibold">{statusConfig.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {statusConfig.description}
                    </p>
                  </div>
                </div>
                <SupportTicketBadge status={ticket.status} />
              </div>

              <Separator />

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Order Amount</p>
                      <p className="text-xl font-semibold">
                        ${ticket.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Related Order</p>
                      <Link 
                        href={`/orders/${ticket.order_id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        #{ticket.order_id.slice(0, 8)}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {format(new Date(ticket.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Issue Description</h4>
                    <p className="text-blue-800">{ticket.reason}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="status">Update Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as SupportTicketStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPORT_TICKET_STATUS_CONFIG).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="notes">Update Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this status update..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleUpdateStatus}
                disabled={!hasChanges || updating}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {updating ? 'Updating...' : 'Update Ticket'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ticket ID</span>
                <span className="font-mono text-sm">#{ticket.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Order ID</span>
                <span className="font-mono text-sm">#{ticket.order_id.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <span className="font-medium capitalize">{ticket.status.replace('_', ' ')}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Order Value</span>
                <span className="font-semibold text-green-600">
                  ${ticket.amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}