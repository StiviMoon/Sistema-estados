import axios, { AxiosResponse } from 'axios'
import { 
  Order, 
  CreateOrderRequest, 
  ProcessEventRequest, 
  EventResponse, 
  OrderHistory,
  SupportTicket, 
  UpdateTicketStatusRequest, 
  UpdateTicketStatusResponse,
  SupportTicketStats, 
  FilteredEventsResponse
} from './types'
import { API_ENDPOINTS } from './constants'

// Configurar axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Interceptor para logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Orders API
export const orderApi = {
  // Health check
  healthCheck: (): Promise<AxiosResponse> => 
    api.get(API_ENDPOINTS.HEALTH),

  // Get all orders
  getAll: (): Promise<AxiosResponse<Order[]>> => 
    api.get(API_ENDPOINTS.ORDERS),

  // Get order by ID
  getById: (id: string): Promise<AxiosResponse<Order>> => 
    api.get(API_ENDPOINTS.ORDER_BY_ID(id)),

  // Create new order
  create: (data: CreateOrderRequest): Promise<AxiosResponse<Order>> => 
    api.post(API_ENDPOINTS.ORDERS, data),

  // Process event
  processEvent: (id: string, data: ProcessEventRequest): Promise<AxiosResponse<EventResponse>> => 
    api.post(API_ENDPOINTS.PROCESS_EVENT(id), data),

  // Get allowed events
  getAllowedEvents: (id: string): Promise<AxiosResponse<string[]>> => 
    api.get(API_ENDPOINTS.ALLOWED_EVENTS(id)),

  // Get order history
  getHistory: (id: string): Promise<AxiosResponse<OrderHistory>> => 
    api.get(API_ENDPOINTS.ORDER_HISTORY(id)),

   getFilteredAllowedEvents: (
    id: string
  ): Promise<AxiosResponse<FilteredEventsResponse>> =>
    api.get(API_ENDPOINTS.V2_ALLOWED_EVENTS_FILTERED(id)),
}

// Support Tickets API
export const supportApi = {
  // Get all tickets
  getAll: (): Promise<AxiosResponse<SupportTicket[]>> => 
    api.get(API_ENDPOINTS.SUPPORT_TICKETS),

  // Get ticket by ID
  getById: (id: string): Promise<AxiosResponse<SupportTicket>> => 
    api.get(API_ENDPOINTS.SUPPORT_TICKET_BY_ID(id)),

  // Get tickets by order ID
  getByOrderId: (orderId: string): Promise<AxiosResponse<SupportTicket[]>> => 
    api.get(API_ENDPOINTS.SUPPORT_TICKETS_BY_ORDER(orderId)),

  // Update ticket status
  updateStatus: (
    id: string, 
    data: UpdateTicketStatusRequest
  ): Promise<AxiosResponse<UpdateTicketStatusResponse>> => 
    api.patch(API_ENDPOINTS.SUPPORT_UPDATE_STATUS(id), data),

  // Get tickets statistics
  getStats: (): Promise<AxiosResponse<SupportTicketStats>> => 
    api.get(API_ENDPOINTS.SUPPORT_STATS),

  // Test endpoint
  test: (): Promise<AxiosResponse> => 
    api.get('/support/test'),
}

// Export default
export default api