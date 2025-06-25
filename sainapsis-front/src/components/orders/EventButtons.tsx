'use client'

import { useState, useRef, useCallback } from 'react'
import { orderApi } from '@/lib/api'
import { EventType, OrderState } from '@/lib/types'
import { EVENT_CONFIG } from '@/lib/constants'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, CheckCircle, Loader2, ArrowRight, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface EventButtonsProps {
  orderId: string
  currentState: OrderState
  allowedEvents: EventType[]
  onEventProcessed: () => void
}

interface ConfirmationData {
  reason: string
  notes: string
}

interface EventStyling {
  background: string
  hover: string
  iconColor: string
  borderColor: string
  shadowColor: string
}

interface ConfirmationStyle {
  titleColor: string
  descColor: string
  bgColor: string
  borderColor: string
}

// Tipos para la API response
interface ProcessEventResponse {
  data: {
    old_state: string
    new_state: string
  }
}

interface ApiError {
  response?: {
    data?: {
      detail?: string
    }
  }
  message?: string
}

export function EventButtons({ 
  orderId, 
  currentState, 
  allowedEvents, 
  onEventProcessed 
}: EventButtonsProps) {
  const [processing, setProcessing] = useState<EventType | null>(null)
  const [confirmingEvent, setConfirmingEvent] = useState<EventType | null>(null)
  const [confirmationData, setConfirmationData] = useState<ConfirmationData>({
    reason: '',
    notes: ''
  })
  const processingRef = useRef<EventType | null>(null)

  const handleProcessEvent = useCallback(async (eventType: EventType, additionalMetadata: Record<string, string | number | boolean> = {}) => {
    if (processingRef.current) {
      console.log('Already processing an event, skipping...')
      return
    }

    try {
      processingRef.current = eventType
      setProcessing(eventType)
      
      console.log(`Processing event: ${eventType} for order: ${orderId}`)
      
      const response = await orderApi.processEvent(orderId, {
        event_type: eventType,
        metadata: {
          processed_via: 'web_interface',
          processed_at: new Date().toISOString(),
          ...additionalMetadata
        }
      }) as ProcessEventResponse

      console.log('Event processed successfully:', response.data)
      
      toast.success('Event processed successfully!', {
        description: `Order moved from ${response.data.old_state} to ${response.data.new_state}`,
      })

      
      // Reset confirmation data
      setConfirmationData({ reason: '', notes: '' })
      
      // Small delay to ensure the toast is visible before page refresh
      setTimeout(() => {
        onEventProcessed()
      }, 500)
      
    } catch (error) {
      console.error('Error processing event:', error)
      
      const apiError = error as ApiError
      let errorMessage = 'An unexpected error occurred'
      
      if (apiError.response?.data?.detail) {
        errorMessage = apiError.response.data.detail
      } else if (apiError.message) {
        errorMessage = apiError.message
      }
      
      toast.error('Failed to process event', {
        description: errorMessage
      })
    } finally {
      setTimeout(() => {
        setProcessing(null)
        processingRef.current = null
      }, 100)
    }
  }, [orderId, onEventProcessed])

  const getEventStyling = (event: EventType): EventStyling => {
    const eventConfig = EVENT_CONFIG[event]
    
    if (!eventConfig) {
      return {
        background: 'bg-gray-50',
        hover: 'hover:bg-gray-100',
        iconColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        shadowColor: 'shadow-gray-200/50'
      }
    }

    switch (eventConfig.variant) {
      case 'destructive':
        return {
          background: 'bg-red-50',
          hover: 'hover:bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          shadowColor: 'shadow-red-200/50'
        }
      case 'outline':
        return {
          background: 'bg-orange-50',
          hover: 'hover:bg-orange-100',
          iconColor: 'text-orange-600',
          borderColor: 'border-orange-200',
          shadowColor: 'shadow-orange-200/50'
        }
      case 'secondary':
        return {
          background: 'bg-slate-50',
          hover: 'hover:bg-slate-100',
          iconColor: 'text-slate-600',
          borderColor: 'border-slate-200',
          shadowColor: 'shadow-slate-200/50'
        }
      case 'default':
      default:
        return {
          background: 'bg-emerald-50',
          hover: 'hover:bg-emerald-100',
          iconColor: 'text-emerald-600',
          borderColor: 'border-emerald-200',
          shadowColor: 'shadow-emerald-200/50'
        }
    }
  }

  const handleEventClick = useCallback((event: EventType) => {
    if (processingRef.current) {
      console.log('Already processing, ignoring click')
      return
    }

    const eventConfig = EVENT_CONFIG[event]
    
    if (eventConfig?.requiresConfirmation) {
      setConfirmingEvent(event)
    } else {
      handleProcessEvent(event)
    }
  }, [handleProcessEvent])

  const handleConfirmEvent = () => {
    if (confirmingEvent) {
      const metadata: Record<string, string> = {}
      
      if (confirmationData.reason.trim()) {
        metadata.reason = confirmationData.reason.trim()
      }
      
      if (confirmationData.notes.trim()) {
        metadata.notes = confirmationData.notes.trim()
      }

      handleProcessEvent(confirmingEvent, metadata)
      setConfirmingEvent(null)
    }
  }

  const handleCancelConfirmation = () => {
    setConfirmingEvent(null)
    setConfirmationData({ reason: '', notes: '' })
  }

  const getConfirmationIcon = (eventType: EventType) => {
    const eventConfig = EVENT_CONFIG[eventType]
    if (eventConfig?.variant === 'destructive') {
      return <AlertTriangle className="h-6 w-6 text-red-600" />
    }
    return <AlertTriangle className="h-6 w-6 text-orange-600" />
  }

  const getConfirmationStyle = (eventType: EventType): ConfirmationStyle => {
    const eventConfig = EVENT_CONFIG[eventType]
    if (eventConfig?.variant === 'destructive') {
      return {
        titleColor: 'text-red-900',
        descColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }
    return {
      titleColor: 'text-orange-900',
      descColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  }

  if (allowedEvents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Actions Available</h3>
          <p className="text-gray-600 text-sm mb-4">
            This order is in a final state or awaiting external input
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
            {currentState.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Available Actions</h3>
              <p className="text-gray-600 text-sm mt-1">
                Choose an action to transition the order state
              </p>
            </div>
            <div className="flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700">
                {currentState.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allowedEvents.map((event, index) => {
              const isProcessing = processing === event
              const styling = getEventStyling(event)
              const eventConfig = EVENT_CONFIG[event]
              
              const eventLabel = eventConfig?.label || event.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
              const eventDescription = eventConfig?.description || 'Process this event to continue the workflow'
              const requiresConfirmation = eventConfig?.requiresConfirmation || false
              
              return (
                <button
                  key={`event-${event}-${index}`}
                  onClick={() => handleEventClick(event)}
                  disabled={processing !== null}
                  className={`
                    group relative w-full p-5 text-left rounded-lg transition-all duration-200
                    ${processing !== null
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-md cursor-pointer'
                    }
                    ${isProcessing 
                      ? `bg-blue-50 border-2 border-blue-300 shadow-lg` 
                      : `${styling.background} border ${styling.borderColor} ${styling.hover} hover:${styling.shadowColor}`
                    }
                  `}
                >
                  {/* Processing overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-blue-50/50 rounded-lg flex items-center justify-center z-10 backdrop-blur-[2px]">
                      <div className="flex items-center gap-2 text-blue-700 bg-white px-4 py-2 rounded-lg shadow-md border border-blue-200">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-medium text-sm">Processing...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 
                      ${isProcessing 
                        ? 'bg-blue-100 text-blue-600' 
                        : `bg-white ${styling.iconColor} border ${styling.borderColor} group-hover:scale-105`
                      }`}>
                      {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        eventConfig?.icon || <Zap className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`font-semibold ${isProcessing ? 'text-blue-900' : 'text-gray-900'}`}>
                          {eventLabel}
                        </div>
                        {requiresConfirmation && !isProcessing && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                            Requires Confirmation
                          </span>
                        )}
                      </div>
                      <div className={`text-sm leading-relaxed ${isProcessing ? 'text-blue-700' : 'text-gray-600'}`}>
                        {eventDescription}
                      </div>
                    </div>
                    {!isProcessing && (
                      <ArrowRight className={`h-5 w-5 ${styling.iconColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* Info section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  Each action will transition the order to a new state. Actions marked with 
                  <span className="inline-flex items-center mx-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                    Requires Confirmation
                  </span>
                  will prompt for additional details before processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={confirmingEvent !== null} onOpenChange={handleCancelConfirmation}>
        <AlertDialogContent className="max-w-md">
          {confirmingEvent && (
            <>
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  {getConfirmationIcon(confirmingEvent)}
                  <AlertDialogTitle className={getConfirmationStyle(confirmingEvent).titleColor}>
                    Confirm Action
                  </AlertDialogTitle>
                </div>
                <AlertDialogDescription className={getConfirmationStyle(confirmingEvent).descColor}>
                  You are about to process <strong>{EVENT_CONFIG[confirmingEvent]?.label}</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4">
                {/* Event Details */}
                <div className={`p-4 rounded-lg border ${getConfirmationStyle(confirmingEvent).bgColor} ${getConfirmationStyle(confirmingEvent).borderColor}`}>
                  <h4 className="font-medium text-sm mb-2">Action Details</h4>
                  <p className="text-sm text-gray-600">
                    {EVENT_CONFIG[confirmingEvent]?.description}
                  </p>
                </div>

                {/* Optional Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">
                    Reason (Optional)
                  </Label>
                  <Input
                    id="reason"
                    placeholder="Why are you processing this event?"
                    value={confirmationData.reason}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                {/* Optional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional context..."
                    rows={3}
                    value={confirmationData.notes}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelConfirmation}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmEvent}
                  className={
                    EVENT_CONFIG[confirmingEvent]?.variant === 'destructive'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-600'
                  }
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Process
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}