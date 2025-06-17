'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supportApi } from '@/lib/api'
import { SupportTicket, SupportTicketStatus } from '@/lib/types'
import { SUPPORT_TICKET_STATUS_CONFIG } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SupportTicketBadge } from '@/components/support/SupportTicketBadge'
import { 
  Search, 
  Eye,
  DollarSign,
  Ticket,
  RefreshCw,
  AlertTriangle,
  Clock,
  ArrowUpDown
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

type SortField = 'created_at' | 'amount' | 'status'
type SortDirection = 'asc' | 'desc'

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<SupportTicketStatus | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await supportApi.getAll()
      setTickets(response.data)
      toast.success(`Loaded ${response.data.length} support tickets`)
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch support tickets'
      
      if (err && typeof err === 'object' && 'response' in err) {
        const apiError = err as { response?: { data?: { detail?: string } }; message?: string }
        errorMessage = apiError.response?.data?.detail || apiError.message || errorMessage
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const filteredAndSortedTickets = useMemo(() => {
    let filtered = tickets

    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.reason.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterStatus)
    }

    filtered.sort((a, b) => {
      let aValue: string | number = a[sortField]
      let bValue: string | number = b[sortField]

      if (sortField === 'created_at') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [tickets, searchTerm, filterStatus, sortField, sortDirection])

  const totalPages = Math.ceil(filteredAndSortedTickets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTickets = filteredAndSortedTickets.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const statusStats = useMemo(() => {
    const stats: Record<SupportTicketStatus | 'all', number> = {
      all: tickets.length,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    }
    
    tickets.forEach(ticket => {
      if (stats.hasOwnProperty(ticket.status)) {
        stats[ticket.status]++
      }
    })
    
    return stats
  }, [tickets])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchTickets} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage and track all support tickets
          </p>
        </div>
        <Link href="/orders">
          <Button variant="outline" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            View Orders
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Tickets</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold">
                  ${tickets.reduce((sum, ticket) => sum + ticket.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Open</p>
                <p className="text-2xl font-bold">{statusStats.open || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold">{statusStats.in_progress || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by ID, order, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as SupportTicketStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({statusStats.all})</SelectItem>
                  {Object.entries(SUPPORT_TICKET_STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        {config.label} ({statusStats[status as SupportTicketStatus] || 0})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={fetchTickets}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedTickets.length)} of {filteredAndSortedTickets.length} tickets
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('created_at')}
            className="flex items-center gap-1"
          >
            Created {sortField === 'created_at' && <ArrowUpDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('amount')}
            className="flex items-center gap-1"
          >
            Amount {sortField === 'amount' && <ArrowUpDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('status')}
            className="flex items-center gap-1"
          >
            Status {sortField === 'status' && <ArrowUpDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Tickets Grid */}
      {paginatedTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters or search term.' 
                  : 'No support tickets have been created yet.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1
            const isCurrentPage = page === currentPage
            const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2
            
            if (!showPage) {
              if (page === currentPage - 3 || page === currentPage + 3) {
                return <span key={page} className="px-2">...</span>
              }
              return null
            }
            
            return (
              <Button
                key={page}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            )
          })}
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            #{ticket.id.slice(-8)}
          </CardTitle>
          <SupportTicketBadge status={ticket.status} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Order</span>
            <Link href={`/orders/${ticket.order_id}`} className="text-sm font-mono text-blue-600 hover:underline">
              #{ticket.order_id.slice(-8)}
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-semibold">${ticket.amount.toLocaleString()}</span>
          </div>
          
          <div>
            <span className="text-sm text-muted-foreground">Reason</span>
            <p className="text-sm mt-1 line-clamp-2">{ticket.reason}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm">{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Link href={`/support/${ticket.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}