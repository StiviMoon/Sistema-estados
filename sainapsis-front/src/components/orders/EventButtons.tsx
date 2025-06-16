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
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
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
  gradient: string
  border: string
  icon: string
  iconBg: string
  accent: string
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
        gradient: 'from-gray-50 to-gray-100',
        border: 'border-gray-200 hover:border-gray-300',
        icon: '⚡',
        iconBg: 'bg-gray-100',
        accent: 'bg-gray-500'
      }
    }

    switch (eventConfig.variant) {
      case 'destructive':
        return {
          gradient: 'from-red-50 to-red-100',
          border: 'border-red-200 hover:border-red-300',
          icon: '❌',
          iconBg: 'bg-red-100',
          accent: 'bg-red-500'
        }
      case 'outline':
        return {
          gradient: 'from-orange-50 to-orange-100',
          border: 'border-orange-200 hover:border-orange-300',
          icon: '⚠️',
          iconBg: 'bg-orange-100',
          accent: 'bg-orange-500'
        }
      case 'secondary':
        return {
          gradient: 'from-gray-50 to-gray-100',
          border: 'border-gray-200 hover:border-gray-300',
          icon: '⚙️',
          iconBg: 'bg-gray-100',
          accent: 'bg-gray-500'
        }
      case 'default':
      default:
        return {
          gradient: 'from-green-50 to-green-100',
          border: 'border-green-200 hover:border-green-300',
          icon: '✅',
          iconBg: 'bg-green-100',
          accent: 'bg-green-500'
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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Actions Available</h3>
          <p className="text-gray-600 text-sm mb-4">
            This order is in a final state or awaiting external input
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
            {currentState.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-lg">⚡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Available Actions</h3>
              <p className="text-blue-700 text-sm">
                {allowedEvents.length} action{allowedEvents.length !== 1 ? 's' : ''} available • Current state: {currentState}
              </p>
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
                    group relative w-full p-5 text-left rounded-xl transition-all duration-300 transform
                    ${processing !== null
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                    }
                    ${isProcessing 
                      ? `bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 shadow-lg ring-2 ring-blue-400 ring-opacity-50` 
                      : `bg-gradient-to-br ${styling.gradient} border ${styling.border}`
                    }
                  `}
                >
                  {/* Overlay de procesamiento mejorado */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl flex items-center justify-center z-10 backdrop-blur-sm">
                      <div className="flex items-center gap-3 text-blue-700 bg-white/90 px-4 py-2 rounded-full shadow-lg border border-blue-200">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="font-semibold text-sm">Processing...</span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                          <div 
                            className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" 
                            style={{animationDelay: '0.2s'}}
                          ></div>
                          <div 
                            className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" 
                            style={{animationDelay: '0.4s'}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Indicador de borde con animación cuando está procesando */}
                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl transition-all duration-300 ${
                    isProcessing 
                      ? 'bg-gradient-to-b from-blue-500 to-indigo-500 w-2 shadow-lg' 
                      : styling.accent
                  }`}></div>
                  
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 ${
                      isProcessing 
                        ? 'bg-blue-100 ring-2 ring-blue-300 ring-opacity-50 scale-110' 
                        : styling.iconBg
                    }`}>
                      <span className={`text-lg transition-all duration-300 ${
                        isProcessing ? 'animate-pulse' : ''
                      }`}>
                        {isProcessing ? '⚡' : styling.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`font-semibold transition-colors duration-300 ${
                          isProcessing ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {eventLabel}
                        </div>
                        {requiresConfirmation && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                            Confirm
                          </span>
                        )}
                        {isProcessing && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <div className={`text-sm leading-relaxed transition-colors duration-300 ${
                        isProcessing ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {eventDescription}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* Info Banner */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Order State Machine</p>
                <p className="text-blue-800 leading-relaxed">
                  Each action transitions the order according to your business rules. 
                  Actions marked &quot;Confirm&quot; require confirmation before processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Confirmation Modal */}
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