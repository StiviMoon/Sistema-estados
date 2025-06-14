import * as z from 'zod'

export const createOrderSchema = z.object({
  product_ids: z
    .array(z.string().min(1, 'Product ID cannot be empty'))
    .min(1, 'At least one product is required')
    .max(10, 'Maximum 10 products allowed'),
  
  amount: z
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999.99, 'Amount too large'),
  
  metadata: z.object({
    customer_name: z.string().optional(),
    customer_email: z.string().email('Invalid email format').optional().or(z.literal('')),
    notes: z.string().max(500, 'Notes too long').optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    source: z.string().optional(),
  }).optional()
})

export type CreateOrderFormData = z.infer<typeof createOrderSchema>