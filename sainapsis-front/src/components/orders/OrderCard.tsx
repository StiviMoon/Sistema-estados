import Link from 'next/link'
import { Order } from '@/lib/types'
import { ORDER_STATE_CONFIG } from '@/lib/constants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Calendar, DollarSign } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface OrderCardProps {
  order: Order
  onViewDetails?: (id: string) => void
  showActions?: boolean
  compact?: boolean
}

export function OrderCard({ 
  order, 
  onViewDetails, 
  showActions = true, 
  compact = false 
}: OrderCardProps) {
  const stateConfig = ORDER_STATE_CONFIG[order.state]
  
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order.id)
    }
  }
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-center justify-between">
          <CardTitle className={`font-semibold truncate ${compact ? 'text-base' : 'text-lg'}`}>
            #{order.id.slice(-8)}
          </CardTitle>
          <Badge className={`${stateConfig.color} text-xs`}>
            <span className="mr-1">{stateConfig.icon}</span>
            {stateConfig.label}
          </Badge>
        </div>
        {!compact && (
          <CardDescription className="text-sm">
            {stateConfig.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className={`space-y-${compact ? '2' : '3'}`}>
          {/* Amount */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Amount</span>
            </div>
            <span className="font-semibold">${order.amount.toLocaleString()}</span>
          </div>
          
          {/* Products */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Products</span>
            <span className="text-sm font-medium">{order.product_ids.length} items</span>
          </div>
          
          {/* Created */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Created</span>
            </div>
            <span className="text-sm">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </span>
          </div>
          
          {!compact && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Updated</span>
              <span className="text-sm">
                {format(new Date(order.updated_at), 'MMM d, HH:mm')}
              </span>
            </div>
          )}

          {/* Product IDs Preview */}
          {order.product_ids.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">Products:</div>
              <div className="flex flex-wrap gap-1">
                {order.product_ids.slice(0, 3).map((productId, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {productId}
                  </Badge>
                ))}
                {order.product_ids.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{order.product_ids.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-4">
            {onViewDetails ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleViewDetails}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            ) : (
              <Link href={`/orders/${order.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}