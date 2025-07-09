// app/admin-dashboard-Logix/dashboard/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import Dashboard from '../../../components/admin/Dashboard'
import { getCurrentAdminSession } from '../../../lib/admin-auth'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Activity } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const verifyAuthentication = useCallback(async () => {
    try {
      console.log('🔍 Dashboard: Checking authentication...')
      
      // Check if we just came from a successful login
      const loginSuccess = localStorage.getItem('login_success')
      if (loginSuccess) {
        localStorage.removeItem('login_success')
        console.log('✅ Dashboard: Login success flag found')
      }

      // Get current session from Supabase
      const sessionResult = await getCurrentAdminSession()
      
      console.log('📋 Dashboard: Session result:', sessionResult)
      
      if (!sessionResult.success || !sessionResult.user) {
        console.log('❌ Dashboard: No valid session, redirecting to login...')
        setError('Session expired. Please log in again.')
        router.push('/admin-dashboard-Logix')
        return
      }

      console.log('✅ Dashboard: Valid session found')
      setUser(sessionResult.user)

    } catch (error) {
      console.error('❌ Dashboard: Authentication error:', error)
      setError('Authentication failed. Please log in again.')
      router.push('/admin-dashboard-Logix')
    } finally {
      setIsLoading(false)
    }
  }, [router])



  useEffect(() => {
    console.log('🔄 Dashboard: Component mounted, checking auth...')
    verifyAuthentication()
  }, [verifyAuthentication])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
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
            onClick={() => router.push('/admin-dashboard-Logix')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Login
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
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome to the Admin Dashboard</h1>
              <p className="mt-1 text-blue-100">
                Manage your claims portal with confidence and security
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-blue-100">Logged in as</div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-blue-200 capitalize">{user.role} Access</div>
              </div>
              <Activity className="h-8 w-8 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Dashboard Component */}
        <Dashboard 
          userRole={user.role} 
          userName={user.name}
        />

        {/* Quick Access Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Access</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin-dashboard-Logix/dashboard/content"
              className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Content</h3>
                  <p className="text-sm text-gray-600">Edit site content</p>
                </div>
              </div>
            </a>

            {(user.role === 'owner' || user.role === 'admin') && (
              <a
                href="/admin-dashboard-Logix/dashboard/claims"
                className="group block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Claims</h3>
                    <p className="text-sm text-gray-600">Control form access</p>
                  </div>
                </div>
              </a>
            )}

            <a
              href="/admin-dashboard-Logix/dashboard/faqs"
              className="group block p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">FAQs</h3>
                  <p className="text-sm text-gray-600">Manage Q&As</p>
                </div>
              </div>
            </a>

            <a
              href="/admin-dashboard-Logix/dashboard/dates"
              className="group block p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Dates</h3>
                  <p className="text-sm text-gray-600">Key deadlines</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Your Session</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Email: {user.email}</div>
                <div>Role: <span className="capitalize font-medium">{user.role}</span></div>
                <div>Status: Active</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Access Level</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Content Management: ✓</div>
                <div>FAQ Management: ✓</div>
                <div>Date Management: ✓</div>
                {(user.role === 'owner' || user.role === 'admin') && (
                  <div>Claims Control: ✓</div>
                )}
                {user.role === 'owner' && (
                  <div>System Settings: ✓</div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Security</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Supabase Auth: ✓</div>
                <div>Secure Session: ✓</div>
                <div>Activity Logging: ✓</div>
                <div>Auto Logout: 1 hour</div>
              </div>
            </div>
          </div>
        </div>

        {/* Help and Support */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Getting Started</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use the navigation menu to access different sections</li>
                <li>• All changes are automatically saved and logged</li>
                <li>• Your session will timeout after 1 hour of inactivity</li>
                <li>• Contact support if you encounter any issues</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Best Practices</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Review changes before saving important content</li>
                <li>• Use clear, professional language in all text</li>
                <li>• Test functionality after making changes</li>
                <li>• Log out when finished to maintain security</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}