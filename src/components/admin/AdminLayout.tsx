// components/admin/AdminLayout.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { signOutAdmin } from '../../lib/admin-auth'
import { 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Shield,
  User,
  Bell,
  Activity
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

interface AdminLayoutProps {
  children: React.ReactNode
  user: AdminUser
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Navigation items based on user role (FIXED PATHS)
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin-dashboard-Logix/dashboard',
      icon: LayoutDashboard,
      roles: ['owner', 'admin', 'editor']
    },
    {
      name: 'Content Management',
      href: '/admin-dashboard-Logix/dashboard/content',
      icon: FileText,
      roles: ['owner', 'admin', 'editor']
    },
    {
      name: 'Claims Control',
      href: '/admin-dashboard-Logix/dashboard/claims',
      icon: Activity,
      roles: ['owner', 'admin']
    },
    {
      name: 'FAQ Management',
      href: '/admin-dashboard-Logix/dashboard/faqs',
      icon: HelpCircle,
      roles: ['owner', 'admin', 'editor']
    },
    {
      name: 'Important Dates',
      href: '/admin-dashboard-Logix/dashboard/dates',
      icon: Calendar,
      roles: ['owner', 'admin', 'editor']
    },
    {
      name: 'Settings',
      href: '/admin-dashboard-Logix/dashboard/settings',
      icon: Settings,
      roles: ['owner']
    }
  ]

  // Filter navigation based on user role
  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(user.role)
  )

  const handleLogout = async () => {
    try {
      console.log('🚪 AdminLayout: Logging out...')
      const result = await signOutAdmin()
      
      if (result.success) {
        console.log('✅ AdminLayout: Logout successful')
      } else {
        console.error('❌ AdminLayout: Logout error:', result.error)
      }
      
      // Clear any stored data
      localStorage.removeItem('admin_user')
      localStorage.removeItem('login_success')
      
      // Redirect to correct login page
      console.log('🔄 AdminLayout: Redirecting to login page...')
      router.push('/admin-dashboard-Logix')
    } catch (error) {
      console.error('AdminLayout: Logout error:', error)
      // Still redirect even if logout fails
      router.push('/admin-dashboard-Logix')
    }
  }

  const isActiveRoute = (href: string) => {
    return pathname === href
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'editor':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed and Sticky */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleBadgeColor(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content area - Flexible and scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top header - Fixed */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-2 text-xl font-semibold text-gray-900 lg:ml-0">
                Administration Panel
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <Bell className="h-5 w-5" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block">{user.name}</span>
                </button>

                {/* User dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}