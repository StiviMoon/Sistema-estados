'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { orderApi } from '@/lib/api'
import { Order } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { 
  Home,
  Package,
  Plus,
  Menu,
  X,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  initialOrders?: Order[]
}

export function Sidebar({ initialOrders = [] }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Fix hydration issues
  useEffect(() => {
    setMounted(true)
    setLastRefresh(new Date().toLocaleTimeString('en', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }))
  }, [])

  // Detect mobile screen
  useEffect(() => {
    if (!mounted) return
    
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 768
      setIsMobile(isMobileSize)
      if (!isMobileSize) {
        setIsOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [mounted])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Auto-refresh orders data - useCallback para evitar warnings de dependencias
  const refreshOrders = useCallback(async (showLoading = true) => {
    if (!mounted) return
    
    try {
      if (showLoading) setIsRefreshing(true)
      const response = await orderApi.getAll()
      setOrders(response.data)
      setLastRefresh(new Date().toLocaleTimeString('en', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }))
    } catch (error) {
      console.error('Error refreshing sidebar orders:', error)
    } finally {
      if (showLoading) setIsRefreshing(false)
    }
  }, [mounted])

  // Refresh on initial load and when pathname changes
  useEffect(() => {
    if (!mounted) return
    refreshOrders(false)
  }, [pathname, mounted, refreshOrders])

  // Auto-refresh every 30 seconds when on orders pages
  useEffect(() => {
    if (!mounted) return
    
    if (pathname.startsWith('/orders') || pathname === '/') {
      const interval = setInterval(() => {
        refreshOrders(false)
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [pathname, mounted, refreshOrders])

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.state === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.state)).length,
    completed: orders.filter(o => o.state === 'delivered').length,
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      current: pathname === '/',
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: Package,
      current: pathname.startsWith('/orders') && pathname !== '/orders/create',
      count: stats.total > 0 ? stats.total : undefined
    },
    {
      name: 'Create Order',
      href: '/orders/create',
      icon: Plus,
      current: pathname === '/orders/create',
    },  {
      name: 'Support',
      href: '/support',
      icon: User,
      current: pathname === '/support',
    },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Sainapsis</h2>
            <p className="text-xs text-gray-500">Order System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshOrders(true)}
            disabled={isRefreshing}
            className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 flex items-center justify-center md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  item.current
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                )} />
                <span className="font-medium">{item.name}</span>
                <div className="ml-auto flex items-center gap-2">
                  {item.count && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs px-2 py-0.5 transition-colors",
                        item.current ? "bg-blue-100 text-blue-700" : ""
                      )}
                    >
                      {item.count}
                    </Badge>
                  )}
                  {!item.current && (
                    <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Enhanced Stats Section */}
      {stats.total > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="space-y-3">
            {/* Total Orders */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">TOTAL ORDERS</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-yellow-50 rounded-md">
                <div className="font-semibold text-yellow-700">{stats.pending}</div>
                <div className="text-yellow-600">Pending</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-md">
                <div className="font-semibold text-blue-700">{stats.processing}</div>
                <div className="text-blue-600">Active</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-md">
                <div className="font-semibold text-green-700">{stats.completed}</div>
                <div className="text-green-600">Done</div>
              </div>
            </div>
            
            {/* Last Updated */}
            {lastRefresh && (
              <div className="text-center">
                <div className="text-xs text-gray-500">
                  Updated {lastRefresh}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.total === 0 && (
        <div className="p-4 border-t border-gray-100">
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mb-3">No orders yet</p>
            <Link href="/orders/create">
              <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                <Plus className="h-3 w-3 mr-1" />
                Create First Order
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 h-10 w-10 p-0 bg-white border border-gray-200 shadow-sm rounded-md flex items-center justify-center md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-64 h-full">
          <SidebarContent />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 transform transition-transform">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}