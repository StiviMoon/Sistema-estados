import { OrderState, EventType, SupportTicketStatus } from './types'

// Configuración de estados de órdenes
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
  reviewing: {
    label: 'Reviewing',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '🔍',
    description: 'Order is under review'
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
  icon: string
  label: string
  description: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
  requiresConfirmation: boolean
}> = {
  pendingBiometricalVerification: {
    label: 'Require Verification',
    description: 'Put order on hold for biometrical verification',
    variant: 'outline',
    requiresConfirmation: true,
    icon: '🔍'
  },
  noVerificationNeeded: {
    label: 'Skip Verification',
    description: 'Skip verification and proceed to payment',
    variant: 'default',
    requiresConfirmation: false,
    icon: '✅'
  },
  paymentFailed: {
    label: 'Payment Failed',
    description: 'Mark payment as failed',
    variant: 'destructive',
    requiresConfirmation: true,
    icon: '❌'  
  },
  orderCancelled: {
    label: 'Cancel Order',
    description: 'Cancel order (system)',
    variant: 'destructive',
    requiresConfirmation: true,
    icon: '❌'
  },
  biometricalVerificationSuccessful: {
    label: 'Verification Success',
    description: 'Biometrical verification successful',
    variant: 'default',
    requiresConfirmation: false,
    icon: '✅'
  },
  verificationFailed: {
    label: 'Verification Failed',
    description: 'Verification failed, cancel order',
    variant: 'destructive',
    requiresConfirmation: true,
    icon: '❌'
  },
  orderCancelledByUser: {
    label: 'Cancel by User',
    description: 'User requested cancellation',
    variant: 'destructive',
    requiresConfirmation: true,
    icon: '❌'
  },
  paymentSuccessful: {
    label: 'Payment Success',
    description: 'Payment processed successfully',
    variant: 'default',
    requiresConfirmation: false,
    icon: '✅'
  },
  preparingShipment: {
    label: 'Prepare Shipment',
    description: 'Start preparing order for shipment',
    variant: 'default',
    requiresConfirmation: false,
    icon: '✅'
  },
  itemDispatched: {
    label: 'Dispatch Item',
    description: 'Item has been dispatched',
    variant: 'default',
    requiresConfirmation: false,
    icon: '✅'
  },
  itemReceivedByCustomer: {
    label: 'Mark Delivered',
    description: 'Customer received the item',
    variant: 'default',
    requiresConfirmation: false,
    icon: '✅'
  },
  deliveryIssue: {
    label: 'Delivery Issue',
    description: 'There was an issue with delivery',
    variant: 'outline',
    requiresConfirmation: true,
    icon: '⚠️'
  },
  returnInitiatedByCustomer: {
    label: 'Initiate Return',
    description: 'Customer wants to return item',
    variant: 'outline',
    requiresConfirmation: true,
    icon: '↩️'
  },
  itemReceivedBack: {
    label: 'Item Received',
    description: 'Returned item received',
    variant: 'default',
    requiresConfirmation: false,
    icon: '✅'
  },
  refundProcessed: {
    label: 'Process Refund',
    description: 'Process refund to customer',
    variant: 'default',
    requiresConfirmation: false,
    icon: '✅'
  },
  manualReviewRequired: {
    label: 'Manual Review',
    description: 'Order requires manual review',
    variant: 'outline',
    requiresConfirmation: true,
    icon: '⚠️'
  },
  reviewApproved: {
    label: 'Review Approved',
    description: 'Order review approved',
    variant: 'default',
    requiresConfirmation: false,
    icon: '✅'  
  },
  reviewRejected: {
    label: 'Review Rejected',
    description: 'Order review rejected',
    variant: 'destructive',
    requiresConfirmation: true,
    icon: '❌'
  }
}

// Configuración de estados de tickets de soporte
export const SUPPORT_TICKET_STATUS_CONFIG: Record<SupportTicketStatus, {
  label: string
  color: string
  icon: string
  description: string
}> = {
  open: {
    label: 'Open',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '🔴',
    description: 'Ticket is open and awaiting attention'
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '🟡',
    description: 'Ticket is being worked on'
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅',
    description: 'Issue has been resolved'
  },
  closed: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '⚫',
    description: 'Ticket is closed'
  }
}

// API Endpoints
export const API_ENDPOINTS = {
  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  PROCESS_EVENT: (id: string) => `/orders/${id}/events`,
  ALLOWED_EVENTS: (id: string) => `/orders/${id}/allowed-events`,
  ORDER_HISTORY: (id: string) => `/orders/${id}/history`,
  HEALTH: '/health',
  
  // Support Tickets
  SUPPORT_TICKETS: '/support/tickets',
  SUPPORT_TICKET_BY_ID: (id: string) => `/support/tickets/${id}`,
  SUPPORT_TICKETS_BY_ORDER: (orderId: string) => `/support/orders/${orderId}/tickets`,
  SUPPORT_UPDATE_STATUS: (id: string) => `/support/tickets/${id}/status`,
  SUPPORT_STATS: '/support/tickets/stats/summary',
  

  V2_ORDER_BY_ID: (id: string) => `/api/v2/orders/${id}`,
  V2_ALLOWED_EVENTS_FILTERED: (id: string) => `/api/v2/orders/${id}/allowed-events-filtered`,
  V2_PROCESS_EVENT_ENHANCED: (id: string) => `/api/v2/orders/${id}/events-enhanced`,
  V2_BUSINESS_RULES_PREVIEW: (id: string) => `/api/v2/orders/${id}/business-preview`,
  V2_ADMIN_TOGGLE_RULE: (ruleId: string) => `/api/v2/orders/admin/rules/${ruleId}/toggle`,
  V2_CHANGE_THRESHOLD: '/api/v2/orders/admin/small-order-threshold',
  V2_TEST_SMALL_ORDER_RULE: '/api/v2/orders/test/small-order-rule',
} as const