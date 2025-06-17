// Estados de la orden (matching backend)
export type OrderState = 
  | 'pending'
  | 'on_hold'
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'returning'
  | 'returned'
  | 'refunded'
  | 'cancelled'

// Tipos de eventos (matching backend)
export type EventType =
  | 'pendingBiometricalVerification'
  | 'noVerificationNeeded'
  | 'paymentFailed'
  | 'orderCancelled'
  | 'biometricalVerificationSuccessful'
  | 'verificationFailed'
  | 'orderCancelledByUser'
  | 'paymentSuccessful'
  | 'preparingShipment'
  | 'itemDispatched'
  | 'itemReceivedByCustomer'
  | 'deliveryIssue'
  | 'returnInitiatedByCustomer'
  | 'itemReceivedBack'
  | 'refundProcessed'

// Tipo para metadata que puede ser un objeto o un string JSON serializado
export type OrderMetadata = 
  | Record<string, string | number | boolean | null | undefined>
  | string
  | null
  | undefined

// Modelos de datos
export interface Order {
  id: string
  product_ids: string[]
  amount: number
  state: OrderState
  metadata: OrderMetadata
  created_at: string
  updated_at: string
}

export interface CreateOrderRequest {
  product_ids: string[]
  amount: number
  metadata?: OrderMetadata
}

export interface ProcessEventRequest {
  event_type: EventType
  metadata?: OrderMetadata
}

export interface EventResponse {
  order_id: string
  old_state: OrderState
  new_state: OrderState
  event_type: EventType
  processed_at: string
}

export interface OrderHistory {
  order_id: string
  events: OrderEvent[]
  total_events: number
}

export interface OrderEvent {
  event_type: string
  old_state: OrderState | null
  new_state: OrderState
  metadata: OrderMetadata
  created_at: string
}