'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { OrderStateBadge } from '@/components/orders/OrderStateBadge'
import { EventButtons } from '@/components/orders/EventButtons'
import { OrderHistory } from '@/components/orders/OrderHistory'
import { orderApi } from '@/lib/api'
import { Order, OrderEvent, EventType, OrderMetadata } from '@/lib/types'
import { ORDER_STATE_CONFIG } from '@/lib/constants'
import { 
  ArrowLeft, 
  RefreshCw, 
  Package, 
  DollarSign, 
  Calendar, 
  User, 
  Mail,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Helpers para type safety en metadata
const getMetadataString = (metadata: OrderMetadata, key: string): string | undefined => {
  if (!metadata || typeof metadata !== 'object') return undefined
  
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

const getMetadataPriority = (metadata: OrderMetadata): 'high' | 'medium' | 'low' | undefined => {
  if (!metadata || typeof metadata !== 'object') return undefined
  
  const priority = (metadata as Record<string, unknown>).priority
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority
  }
  return undefined
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Unwrap params using React.use()
  const resolvedParams = use(params)
  const orderId = resolvedParams.id

  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [allowedEvents, setAllowedEvents] = useState<string[]>([])
  const [history, setHistory] = useState<OrderEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrderData = useCallback(async (showRefreshToast = false) => {
  try {
    if (showRefreshToast) setRefreshing(true)
    else setLoading(true)

    // Fetch detalles, eventos filtrados y el historial
    const [orderResponse, filteredEventsResponse, historyResponse] = await Promise.all([
      orderApi.getById(orderId),
      orderApi.getFilteredAllowedEvents(orderId),
      orderApi.getHistory(orderId)
    ])

    setOrder(orderResponse.data)
    setAllowedEvents(filteredEventsResponse.data.filtered_events)
    setHistory(historyResponse.data.events || [])

    if (filteredEventsResponse.data.small_order_rule_applied) {
      toast.message('Verificación omitida por reglas de negocio')
    }

    if (showRefreshToast) {
      toast.success('Order data refreshed')
    }
  } catch (error: unknown) {
    console.error('Error fetching order data:', error)
    
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { status?: number } }).response === 'object' &&
      (error as { response?: { status?: number } }).response !== null &&
      'status' in (error as { response?: { status?: number } }).response!
    ) {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 404) {
        toast.error('Order not found')
        router.push('/orders')
        return
      }
    }

    toast.warning('No se pudo aplicar reglas, usando API clásica')
    try {
      const [orderResponse, eventsResponse, historyResponse] = await Promise.all([
        orderApi.getById(orderId),
        orderApi.getAllowedEvents(orderId),
        orderApi.getHistory(orderId)
      ])
      setOrder(orderResponse.data)
      setAllowedEvents(eventsResponse.data)
      setHistory(historyResponse.data.events || [])
    } catch {
      toast.error('Failed to fetch order data')
    }
  } finally {
    setLoading(false)
    setRefreshing(false)
  }
}, [orderId, router])


  useEffect(() => {
    if (orderId) {
      fetchOrderData()
    }
  }, [orderId, fetchOrderData])

  const handleEventProcessed = () => {
    fetchOrderData(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The order youre looking for doesnt exist or has been removed.
          </p>
          <Button onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const stateConfig = ORDER_STATE_CONFIG[order.state]

  // Extraer valores de metadata de forma type-safe
  const customerName = getMetadataString(order.metadata, 'customer_name')
  const customerEmail = getMetadataString(order.metadata, 'customer_email')
  const notes = getMetadataString(order.metadata, 'notes')
  const priority = getMetadataPriority(order.metadata)

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
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchOrderData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <OrderStateBadge state={order.state} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Information
              </CardTitle>
              <CardDescription>
                Basic order details and current status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Section */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{stateConfig.icon}</div>
                  <div>
                    <h3 className="font-semibold">{stateConfig.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stateConfig.description}
                    </p>
                  </div>
                </div>
                <OrderStateBadge state={order.state} />
              </div>

              <Separator />

              {/* Order Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-xl font-semibold">
                        ${order.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Products</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {order.product_ids.map((productId) => (
                          <Badge key={productId} variant="secondary">
                            {productId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {format(new Date(order.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {format(new Date(order.updated_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {(customerName || customerEmail || notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customerName && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Name</p>
                      <p className="font-medium">{customerName}</p>
                    </div>
                  </div>
                )}

                {customerEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{customerEmail}</p>
                    </div>
                  </div>
                )}

                {priority && (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Priority</p>
                      <Badge 
                        variant={priority === 'high' ? 'destructive' : 
                                priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}

                {notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="mt-1 text-sm bg-gray-50 p-3 rounded-md">
                        {notes}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Event Actions */}
          <EventButtons
            orderId={order.id}
            currentState={order.state}
            allowedEvents={allowedEvents as EventType[]}
            onEventProcessed={handleEventProcessed}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Products</span>
                <span className="font-medium">{order.product_ids.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <span className="font-medium">{history.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Available Actions</span>
                <span className="font-medium">{allowedEvents.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Order Value</span>
                <span className="font-semibold text-green-600">
                  ${order.amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <OrderHistory 
            orderId={order.id}
            events={history}
            currentState={order.state}
          />
        </div>
      </div>
    </div>
  )
}