'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { OrderEvent, OrderState } from '@/lib/types'
import { ORDER_STATE_CONFIG, EVENT_CONFIG } from '@/lib/constants'
import { 
  Clock, 
  ArrowRight, 
  Activity, 
  ChevronDown, 
  ChevronRight,
  Info,
  Calendar,
  User,
  Tag,
  FileText,
  CheckCircle
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

interface OrderHistoryProps {
  orderId: string
  events: OrderEvent[]
  currentState: OrderState
}

export function OrderHistory({ orderId, events, currentState }: OrderHistoryProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set())

  const toggleEventExpansion = (index: number) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedEvents(newExpanded)
  }

  // Función para procesar metadata de forma segura
  const processMetadata = (metadata: any): Record<string, any> => {
    // Si es null o undefined, retornar objeto vacío
    if (metadata === null || metadata === undefined) {
      return {}
    }

    // Si es un string que parece JSON, intentar parsearlo
    if (typeof metadata === 'string') {
      // Verificar si el string no está vacío
      if (metadata.trim() === '') {
        return {}
      }
      
      try {
        const parsed = JSON.parse(metadata)
        // Si el parsing fue exitoso y es un objeto, devolverlo
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed
        }
        // Si es un array, convertirlo a objeto indexado
        if (Array.isArray(parsed)) {
          return parsed.reduce((acc, item, index) => {
            acc[`item_${index}`] = item
            return acc
          }, {})
        }
        // Si es un valor primitivo, crear un objeto con él
        return { value: parsed }
      } catch (error) {
        console.warn('Failed to parse metadata JSON:', metadata, error)
        // Si no se puede parsear, crear un objeto con el string original
        return { raw_value: metadata }
      }
    }

    // Si es un array, convertirlo a objeto indexado
    if (Array.isArray(metadata)) {
      return metadata.reduce((acc, item, index) => {
        acc[`item_${index}`] = item
        return acc
      }, {})
    }

    // Si ya es un objeto, devolverlo tal como está
    if (typeof metadata === 'object') {
      return metadata
    }

    // Para cualquier otro tipo (number, boolean, etc.), crear un objeto
    return { value: metadata }
  }

  const renderMetadataValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
          {value ? 'true' : 'false'}
        </Badge>
      )
    }
    
    if (typeof value === 'string') {
      // Handle dates - check for ISO format or specific date patterns
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || value.includes('_at') || key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
        try {
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            return (
              <div className="text-xs">
                <div className="font-medium">{format(date, 'PPp')}</div>
                <div className="text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</div>
              </div>
            )
          }
        } catch {
          // If date parsing fails, fall through to regular string handling
        }
      }
      
      // Handle emails
      if (value.includes('@')) {
        return <span className="font-mono text-blue-600 text-xs">{value}</span>
      }
      
      // Handle URLs
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
            {value}
          </a>
        )
      }
      
      // Regular strings
      return <span className="break-words text-xs">{value}</span>
    }
    
    if (typeof value === 'number') {
      return <span className="font-mono font-medium text-xs">{value.toLocaleString()}</span>
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {String(item)}
            </Badge>
          ))}
        </div>
      )
    }
    
    if (typeof value === 'object') {
      return (
        <div className="text-xs bg-gray-100 p-2 rounded font-mono max-w-md overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      )
    }
    
    return <span className="font-mono text-xs">{String(value)}</span>
  }

  const getMetadataIcon = (key: string) => {
    const lowerKey = key.toLowerCase()
    if (lowerKey.includes('user') || lowerKey.includes('customer')) return User
    if (lowerKey.includes('date') || lowerKey.includes('time')) return Calendar
    if (lowerKey.includes('action') || lowerKey.includes('event')) return Activity
    if (lowerKey.includes('note') || lowerKey.includes('reason')) return FileText
    return Tag
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Order History
          </CardTitle>
          <CardDescription>
            No events recorded yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No History Yet</h3>
            <p className="text-sm text-muted-foreground">
              Events will appear here as the order progresses through its workflow
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Order History
        </CardTitle>
        <CardDescription>
          Complete timeline of {events.length} event{events.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-gray-200 to-transparent" />
          
          <div className="space-y-6">
            {events.map((event, index) => {
              const eventConfig = EVENT_CONFIG[event.event_type as keyof typeof EVENT_CONFIG]
              const oldStateConfig = event.old_state ? ORDER_STATE_CONFIG[event.old_state] : null
              const newStateConfig = ORDER_STATE_CONFIG[event.new_state]
              const isExpanded = expandedEvents.has(index)
              
              // Procesar metadata de forma segura
              const processedMetadata = processMetadata(event.metadata)
              const hasMetadata = Object.keys(processedMetadata).length > 0
              const isLatest = index === 0
              
              // Debug: log para ver el evento completo
              console.log(`Event ${index}:`, {
                event_type: event.event_type,
                metadata: event.metadata,
                processedMetadata,
                hasMetadata
              })
              
              return (
                <div key={index} className="relative flex gap-4">
                  {/* Timeline Dot */}
                  <div className={`
                    flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                    ${isLatest 
                      ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100' 
                      : 'bg-white border-2 border-gray-200 text-gray-600'
                    }
                  `}>
                    {isLatest ? (
                      <Activity className="h-5 w-5" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </div>
                  
                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`
                      bg-white border rounded-lg p-4 shadow-sm
                      ${isLatest ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'}
                    `}>
                      {/* Event Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">
                              {eventConfig?.label || event.event_type}
                            </h4>
                            {isLatest && (
                              <Badge variant="default" className="text-xs bg-blue-600">
                                Latest
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {eventConfig?.description || 'Event processed successfully'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-900">
                            {format(new Date(event.created_at), 'MMM d, HH:mm')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* State Transition */}
                      {event.old_state && (
                        <div className="flex items-center gap-2 mb-3 p-3 bg-gray-50 rounded-md">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${oldStateConfig?.color || 'bg-gray-100'}`}
                          >
                            <span className="mr-1">{oldStateConfig?.icon}</span>
                            {oldStateConfig?.label || event.old_state}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${newStateConfig.color}`}
                          >
                            <span className="mr-1">{newStateConfig.icon}</span>
                            {newStateConfig.label}
                          </Badge>
                        </div>
                      )}



                      {/* Metadata Section */}
                      {hasMetadata && (
                        <Collapsible open={isExpanded} onOpenChange={() => toggleEventExpansion(index)}>
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-between p-2 h-auto text-xs hover:bg-gray-100"
                            >
                              <div className="flex items-center gap-2">
                                <Info className="h-3 w-3" />
                                <span>Event Details</span>
                                <Badge variant="secondary" className="text-xs">
                                  {Object.keys(processedMetadata).length}
                                </Badge>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="bg-gray-50 rounded-md p-3 space-y-3">
                              {Object.entries(processedMetadata).map(([key, value]) => {
                                const IconComponent = getMetadataIcon(key)
                                return (
                                  <div key={key} className="flex items-start gap-3">
                                    <IconComponent className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium text-gray-700 capitalize">
                                          {key.replace(/_/g, ' ')}
                                        </span>
                                        <div className="text-xs">
                                          {renderMetadataValue(key, value)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Order created {formatDistanceToNow(new Date(events[events.length - 1]?.created_at), { addSuffix: true })}</span>
            <Badge variant="outline" className="text-xs">
              {events.length} total events
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}