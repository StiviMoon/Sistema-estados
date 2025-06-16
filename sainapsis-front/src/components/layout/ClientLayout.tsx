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

  // Initial fetch for sidebar
  useEffect(() => {
    const fetchInitialOrders = async () => {
      try {
        const response = await orderApi.getAll()
        setInitialOrders(response.data)
      } catch (error) {
        console.error('Error fetching initial orders for layout:', error)
      } finally {
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
          

          {/* Page Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}