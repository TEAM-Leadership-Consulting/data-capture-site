// app/admin-dashboard-Logix/dashboard/claims/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../../../components/admin/AdminLayout'
import ClaimsToggle from '../../../../components/admin/ClaimsToggle'
import { getCurrentAdminSession } from '../../../../lib/admin-auth'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

export default function ClaimsPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuthentication = useCallback(async () => {
    try {
      console.log('🔍 Claims: Checking authentication...')
      
      // Get current session from Supabase
      const sessionResult = await getCurrentAdminSession()
      
      if (!sessionResult.success || !sessionResult.user) {
        console.log('❌ Claims: No valid session, redirecting to login...')
        router.push('/admin-dashboard-Logix')
        return
      }

      // Check if user has permission to access claims control
      const userRole = sessionResult.user.role
      if (userRole !== 'owner' && userRole !== 'admin') {
        setError('You do not have permission to access claims control.')
        setIsLoading(false)
        return
      }

      console.log('✅ Claims: User authenticated:', sessionResult.user.email)
      
      // Set authenticated user
      setUser(sessionResult.user)

    } catch (error) {
      console.error('Authentication error:', error)
      setError('Authentication failed. Please log in again.')
      router.push('/admin-dashboard-Logix')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuthentication()
  }, [checkAuthentication])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading claims control...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin-dashboard-Logix/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Claims Control</h1>
              <p className="text-gray-600 mt-1">
                Manage claim filing availability and maintenance settings
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                Role: <span className="font-medium text-gray-900">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Claims Toggle Component */}
        <ClaimsToggle 
          userRole={user.role}
          userName={user.name}
        />

        {/* Help and Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">How to Use Claims Control</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Enable/Disable Claims</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Click the toggle button to enable or disable claim filing</li>
                <li>• When disabled, users will see a maintenance message</li>
                <li>• All changes are logged with timestamps and user information</li>
                <li>• Existing submitted claims are never affected</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Maintenance Messages</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Customize the message users see when filing is disabled</li>
                <li>• Use clear, professional language</li>
                <li>• Include estimated timeframes when possible</li>
                <li>• Save changes before toggling claims status</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scheduling Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Scheduling Features</h3>
          <div className="text-sm text-blue-700">
            <p>
              Use the scheduling feature to automatically enable or disable claims filing at specific times.
              This is useful for maintenance windows or deadline management.
            </p>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin-dashboard-Logix/dashboard"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-1">Dashboard</h3>
              <p className="text-sm text-gray-600">System overview and stats</p>
            </a>
            
            <a
              href="/admin-dashboard-Logix/dashboard/content"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-1">Content Management</h3>
              <p className="text-sm text-gray-600">Edit site content and messaging</p>
            </a>
            
            <a
              href="/admin-dashboard-Logix/dashboard/dates"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-1">Important Dates</h3>
              <p className="text-sm text-gray-600">Manage deadlines and schedules</p>
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Security Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  • All claims control actions are logged with timestamps and user information<br />
                  • Changes take effect immediately for all users<br />
                  • Only Owners and Admins can access claims control<br />
                  • Use scheduled toggles for planned maintenance windows
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}