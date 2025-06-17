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

// Estados de tickets de soporte
export type SupportTicketStatus = 
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'

// Tipo para metadata que puede ser un objeto o un string JSON serializado
export type OrderMetadata = 
  | Record<string, string | number | boolean | null | undefined>
  | string
  | null
  | undefined

// Tipo para metadata de tickets
export type SupportTicketMetadata = 
  | Record<string, string | number | boolean | null | undefined>
  | string
  | null
  | undefined

// Modelos de datos - Orders
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

// Modelos de datos - Support Tickets
export interface SupportTicket {
  id: string
  order_id: string
  reason: string
  amount: number
  status: SupportTicketStatus
  metadata: SupportTicketMetadata
  created_at: string
}

// Request para actualizar estado del ticket
export interface UpdateTicketStatusRequest {
  status: SupportTicketStatus
  metadata?: SupportTicketMetadata
}

// Respuesta al actualizar ticket
export interface UpdateTicketStatusResponse {
  message: string
  ticket_id: string
  new_status: SupportTicketStatus
  updated_ticket: SupportTicket
}

// Estadísticas de tickets
export interface SupportTicketStats {
  total_tickets: number
  by_status: Record<SupportTicketStatus, {
    count: number
    avg_amount: number
  }>
  generated_at: string
  error?: string
}