'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { orderApi } from '@/lib/api'
import { CreateOrderRequest } from '@/lib/types'
import { ArrowLeft, Plus, X, Package, DollarSign, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Schema de validación con Zod
const createOrderSchema = z.object({
  product_ids: z.array(z.string().min(1, 'Product ID cannot be empty')).min(1, 'At least one product is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  metadata: z.object({
    customer_name: z.string().optional(),
    customer_email: z.string().email().optional().or(z.literal('')),
    notes: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    source: z.string().optional(),
  }).optional()
})

type CreateOrderForm = z.infer<typeof createOrderSchema>

export default function CreateOrderPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentProductId, setCurrentProductId] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      product_ids: [],
      amount: 0,
      metadata: {
        customer_name: '',
        customer_email: '',
        notes: '',
        priority: 'medium',
        source: 'web_form'
      }
    }
  })

  const watchedProductIds = watch('product_ids')
  const watchedAmount = watch('amount')

  const addProductId = () => {
    if (currentProductId.trim()) {
      const currentIds = watchedProductIds || []
      if (!currentIds.includes(currentProductId.trim())) {
        setValue('product_ids', [...currentIds, currentProductId.trim()])
        setCurrentProductId('')
      } else {
        toast.error('Product ID already added')
      }
    }
  }

  const removeProductId = (productId: string) => {
    const currentIds = watchedProductIds || []
    setValue('product_ids', currentIds.filter(id => id !== productId))
  }

  const onSubmit = async (data: CreateOrderForm) => {
    try {
      setIsSubmitting(true)
      
      const orderData: CreateOrderRequest = {
        product_ids: data.product_ids,
        amount: data.amount,
        metadata: {
          ...data.metadata,
          created_via: 'web_form',
          created_at: new Date().toISOString()
        }
      }

      const response = await orderApi.create(orderData)
      
      toast.success('Order created successfully!', {
        description: `Order #${response.data.id.slice(0, 8)} has been created`,
      })
      
      router.push(`/orders/${response.data.id}`)
      
    } catch (error: unknown) {
      console.error('Error creating order:', error)
      
      let errorMessage = 'An unexpected error occurred'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { detail?: string } } }
        errorMessage = apiError.response?.data?.detail || errorMessage
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast.error('Failed to create order', {
        description: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Order</h1>
          <p className="text-muted-foreground">
            Fill out the form below to create a new order
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product IDs Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products
                </CardTitle>
                <CardDescription>
                  Add the product IDs for this order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter product ID (e.g., PROD-001)"
                    value={currentProductId}
                    onChange={(e) => setCurrentProductId(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addProductId()
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={addProductId}
                    disabled={!currentProductId.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Product IDs List */}
                {watchedProductIds && watchedProductIds.length > 0 && (
                  <div className="space-y-2">
                    <Label>Added Products ({watchedProductIds.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {watchedProductIds.map((productId) => (
                        <Badge key={productId} variant="secondary" className="flex items-center gap-1">
                          {productId}
                          <button
                            type="button"
                            onClick={() => removeProductId(productId)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {errors.product_ids && (
                  <p className="text-sm text-destructive">{errors.product_ids.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Order Amount */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Order Amount
                </CardTitle>
                <CardDescription>
                  Enter the total amount for this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-10"
                    {...register('amount', { valueAsNumber: true })}
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Customer Information
                </CardTitle>
                <CardDescription>
                  Optional customer details and order metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input
                      id="customer_name"
                      placeholder="John Doe"
                      {...register('metadata.customer_name')}
                      className='mt-2'
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">Customer Email</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      placeholder="john@example.com"
                      {...register('metadata.customer_email')}
                      className='mt-2'
                    />
                    {errors.metadata?.customer_email && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.metadata.customer_email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="flex h-10 w-full rounded-md mt-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('metadata.priority')}
                    
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes for this order..."
                    rows={3}
                    {...register('metadata.notes')}
                    className='mt-2'
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Products:</span>
                    <span className="font-medium">
                      {watchedProductIds?.length || 0} items
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">
                      ${(watchedAmount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Initial State:</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      ⏳ Pending
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Next Steps:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Order will be created in Pending state</li>
                    <li>• You can process events to move it through workflow</li>
                    <li>• View order details and history after creation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !watchedProductIds?.length || !watchedAmount}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  reset()
                  setCurrentProductId('')
                }}
              >
                Clear Form
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}