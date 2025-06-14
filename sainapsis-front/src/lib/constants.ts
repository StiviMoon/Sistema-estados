import { OrderState, EventType } from './types'

// Configuración de estados
export const ORDER_STATE_CONFIG: Record<OrderState, {
  label: string
  color: string
  icon: string
  description: string
}> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏳',
    description: 'Order is pending verification'
  },
  on_hold: {
    label: 'On Hold',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '⏸️',
    description: 'Order is on hold for verification'
  },
  pending_payment: {
    label: 'Pending Payment',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '💳',
    description: 'Waiting for payment processing'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅',
    description: 'Order confirmed and approved'
  },
  processing: {
    label: 'Processing',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '⚙️',
    description: 'Order is being processed'
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '🚚',
    description: 'Order has been shipped'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '📦',
    description: 'Order delivered to customer'
  },
  returning: {
    label: 'Returning',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '↩️',
    description: 'Customer initiated return'
  },
  returned: {
    label: 'Returned',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '📮',
    description: 'Item returned successfully'
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: '💰',
    description: 'Refund processed'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌',
    description: 'Order cancelled'
  }
}

// Configuración de eventos
export const EVENT_CONFIG: Record<EventType, {
  label: string
  description: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
  requiresConfirmation: boolean
}> = {
  pendingBiometricalVerification: {
    label: 'Require Verification',
    description: 'Put order on hold for biometrical verification',
    variant: 'outline',
    requiresConfirmation: true
  },
  noVerificationNeeded: {
    label: 'Skip Verification',
    description: 'Skip verification and proceed to payment',
    variant: 'default',
    requiresConfirmation: false
  },
  paymentFailed: {
    label: 'Payment Failed',
    description: 'Mark payment as failed',
    variant: 'destructive',
    requiresConfirmation: true
  },
  orderCancelled: {
    label: 'Cancel Order',
    description: 'Cancel order (system)',
    variant: 'destructive',
    requiresConfirmation: true
  },
  biometricalVerificationSuccessful: {
    label: 'Verification Success',
    description: 'Biometrical verification successful',
    variant: 'default',
    requiresConfirmation: false
  },
  verificationFailed: {
    label: 'Verification Failed',
    description: 'Verification failed, cancel order',
    variant: 'destructive',
    requiresConfirmation: true
  },
  orderCancelledByUser: {
    label: 'Cancel by User',
    description: 'User requested cancellation',
    variant: 'destructive',
    requiresConfirmation: true
  },
  paymentSuccessful: {
    label: 'Payment Success',
    description: 'Payment processed successfully',
    variant: 'default',
    requiresConfirmation: false
  },
  preparingShipment: {
    label: 'Prepare Shipment',
    description: 'Start preparing order for shipment',
    variant: 'default',
    requiresConfirmation: false
  },
  itemDispatched: {
    label: 'Dispatch Item',
    description: 'Item has been dispatched',
    variant: 'default',
    requiresConfirmation: false
  },
  itemReceivedByCustomer: {
    label: 'Mark Delivered',
    description: 'Customer received the item',
    variant: 'default',
    requiresConfirmation: false
  },
  deliveryIssue: {
    label: 'Delivery Issue',
    description: 'There was an issue with delivery',
    variant: 'outline',
    requiresConfirmation: true
  },
  returnInitiatedByCustomer: {
    label: 'Initiate Return',
    description: 'Customer wants to return item',
    variant: 'outline',
    requiresConfirmation: true
  },
  itemReceivedBack: {
    label: 'Item Received',
    description: 'Returned item received',
    variant: 'default',
    requiresConfirmation: false
  },
  refundProcessed: {
    label: 'Process Refund',
    description: 'Process refund to customer',
    variant: 'default',
    requiresConfirmation: false
  }
}

// API Endpoints
export const API_ENDPOINTS = {
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  PROCESS_EVENT: (id: string) => `/orders/${id}/events`,
  ALLOWED_EVENTS: (id: string) => `/orders/${id}/allowed-events`,
  ORDER_HISTORY: (id: string) => `/orders/${id}/history`,
  HEALTH: '/health'
} as const