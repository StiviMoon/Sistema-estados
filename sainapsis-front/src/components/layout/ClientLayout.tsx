'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { orderApi } from '@/lib/api'
import { Order } from '@/lib/types'

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [initialOrders, setInitialOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Initial fetch for sidebar
  useEffect(() => {
    const fetchInitialOrders = async () => {
      try {
        const response = await orderApi.getAll()
        setInitialOrders(response.data)
      } catch (error) {
        console.error('Error fetching initial orders for layout:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialOrders()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <Sidebar initialOrders={initialOrders} />
        </div>

        {/* Mobile Sidebar - Handled inside Sidebar component */}
        <div className="md:hidden">
          <Sidebar initialOrders={initialOrders} />
        </div>

        {/* Main Content */}
        <div className="flex-1 md:pl-64">
          {/* Header Bar - Mobile responsive */}
          <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Spacer for mobile menu button */}
                <div className="w-10 md:w-0"></div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Order Management
                  </h1>
                  <p className="text-sm text-gray-500 hidden sm:block">
                    Manage your orders efficiently
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500 hidden sm:block">
                  {loading ? 'Loading...' : `${initialOrders.length} orders`}
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">U</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}