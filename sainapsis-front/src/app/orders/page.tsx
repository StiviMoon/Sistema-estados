'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { orderApi } from '@/lib/api'
import { Order, OrderState } from '@/lib/types'
import { ORDER_STATE_CONFIG } from '@/lib/constants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState<OrderState | 'all'>('all')
  const [sortField, setSortField] = useState<'created_at' | 'amount' | 'updated_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await orderApi.getAll()
      setOrders(response.data)
      toast.success(`Loaded ${response.data.length} orders`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch orders'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_ids.some(pid => pid.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply state filter
    if (filterState !== 'all') {
      filtered = filtered.filter(order => order.state === filterState)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle date fields
      if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [orders, searchTerm, filterState, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage)

  // Handle sorting
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Get state statistics
  const stateStats = useMemo(() => {
    const stats: Record<OrderState | 'all', number> = {
      all: orders.length,
      pending: 0,
      on_hold: 0,
      pending_payment: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      returning: 0,
      returned: 0,
      refunded: 0,
      cancelled: 0
    }
    
    // Count orders by state
    orders.forEach(order => {
      if (stats.hasOwnProperty(order.state)) {
        stats[order.state]++
      }
    })
    
    return stats
  }, [orders])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchOrders} className="flex items-center gap-2">
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
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track all your orders
          </p>
        </div>
        <Link href="/orders/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Order
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
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
                  ${orders.reduce((sum, order) => sum + order.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div>
                <p className="text-sm font-medium">Confirmed</p>
                <p className="text-2xl font-bold">{stateStats.confirmed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{stateStats.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders by ID or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* State Filter */}
            <div className="w-full sm:w-48">
              <Select value={filterState} onValueChange={(value) => setFilterState(value as OrderState | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States ({stateStats.all})</SelectItem>
                  {Object.entries(ORDER_STATE_CONFIG).map(([state, config]) => (
                    <SelectItem key={state} value={state}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        {config.label} ({stateStats[state as OrderState] || 0})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              onClick={fetchOrders}
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
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedOrders.length)} of {filteredAndSortedOrders.length} orders
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
            onClick={() => handleSort('updated_at')}
            className="flex items-center gap-1"
          >
            Updated {sortField === 'updated_at' && <ArrowUpDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {paginatedOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterState !== 'all' 
                  ? 'Try adjusting your filters or search term.' 
                  : 'Get started by creating your first order.'
                }
              </p>
              {!searchTerm && filterState === 'all' && (
                <Link href="/orders/create">
                  <Button>Create First Order</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
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

// Order Card Component
function OrderCard({ order }: { order: Order }) {
  const stateConfig = ORDER_STATE_CONFIG[order.state]
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            #{order.id.slice(-8)}
          </CardTitle>
          <Badge className={`${stateConfig.color} text-xs`}>
            <span className="mr-1">{stateConfig.icon}</span>
            {stateConfig.label}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          {stateConfig.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-semibold">${order.amount.toLocaleString()}</span>
          </div>
          
          {/* Products */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Products</span>
            <span className="text-sm">{order.product_ids.length} items</span>
          </div>
          
          {/* Created */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
          </div>
          
          {/* Updated */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Updated</span>
            <span className="text-sm">{format(new Date(order.updated_at), 'MMM d, HH:mm')}</span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link href={`/orders/${order.id}`} className="flex-1">
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

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
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