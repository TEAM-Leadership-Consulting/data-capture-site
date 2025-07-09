// app/admin-dashboard-Logix/dashboard/dates/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../../../components/admin/AdminLayout'
import DateManager from '../../../../components/admin/DateManager'
import { getCurrentAdminSession } from '../../../../lib/admin-auth'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Calendar, Clock, Bell, Info } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

export default function DatesPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuthentication = useCallback(async () => {
    try {
      console.log('🔍 Dates: Checking authentication...')
      
      // Get current session from Supabase
      const sessionResult = await getCurrentAdminSession()
      
      if (!sessionResult.success || !sessionResult.user) {
        console.log('❌ Dates: No valid session, redirecting to login...')
        router.push('/admin-dashboard-Logix')
        return
      }

      // Check if user has permission to access date management
      const userRole = sessionResult.user.role
      if (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'editor') {
        setError('You do not have permission to access date management.')
        setIsLoading(false)
        return
      }

      console.log('✅ Dates: User authenticated:', sessionResult.user.email)
      
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
          <p className="text-gray-600">Verifying authentication...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
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
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Important Dates</h1>
              <p className="text-gray-600 mt-1">
                Manage deadlines, events, milestones, and announcements
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Role: <span className="font-medium text-gray-900">{user.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Date Manager</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Manager Component */}
        <DateManager 
          userName={user.name}
        />

        {/* Date Management Guide */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Date Management Guide</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-red-600" />
                Date Types
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Deadline:</strong> Important filing deadlines (shown in red)</li>
                <li>• <strong>Event:</strong> Court hearings, meetings, presentations (blue)</li>
                <li>• <strong>Milestone:</strong> Key project milestones and checkpoints (green)</li>
                <li>• <strong>Announcement:</strong> Public notices and communications (purple)</li>
                <li>Each type has different visual styling on the public site</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-orange-600" />
                Date Status
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Future:</strong> More than 30 days away (green indicator)</li>
                <li>• <strong>Upcoming:</strong> Within 30 days (orange indicator)</li>
                <li>• <strong>Today:</strong> Current date (blue indicator)</li>
                <li>• <strong>Passed:</strong> Past dates (gray indicator)</li>
                <li>Status indicators help prioritize time-sensitive items</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Bell className="h-4 w-4 mr-2 text-yellow-600" />
                Urgent Dates
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Mark critical dates as &quot;urgent&quot; for special highlighting</li>
                <li>• Urgent dates appear with warning colors and icons</li>
                <li>• Use sparingly for truly time-critical items</li>
                <li>• Urgent deadlines get priority placement on the site</li>
                <li>• Consider upcoming deadlines for urgent marking</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Info className="h-4 w-4 mr-2 text-blue-600" />
                Visibility Control
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Toggle visibility to show/hide dates from public view</li>
                <li>• Hidden dates remain in the admin system</li>
                <li>• Useful for internal planning dates or draft entries</li>
                <li>• All dates are visible in the admin interface</li>
                <li>• Visibility can be changed at any time</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-900 mb-3">Best Practices for Date Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-800 mb-2">Adding Dates</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Use clear, descriptive titles</li>
                <li>• Include specific times for events when relevant</li>
                <li>• Write detailed descriptions explaining the significance</li>
                <li>• Choose the most appropriate date type</li>
                <li>• Double-check date accuracy before saving</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-green-800 mb-2">Organization Tips</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Keep descriptions concise but informative</li>
                <li>• Use consistent naming conventions</li>
                <li>• Mark only truly critical dates as urgent</li>
                <li>• Hide internal planning dates from public view</li>
                <li>• Regularly review and update upcoming dates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Date Format Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Date and Time Formatting</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Date Format</h4>
              <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded">
                <div className="font-mono">YYYY-MM-DD</div>
                <div className="mt-2">Examples:</div>
                <div className="font-mono">2025-08-08 (August 8, 2025)</div>
                <div className="font-mono">2025-12-31 (December 31, 2025)</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Time Format (Optional)</h4>
              <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded">
                <div className="font-mono">HH:MM (24-hour format)</div>
                <div className="mt-2">Examples:</div>
                <div className="font-mono">09:00 (9:00 AM)</div>
                <div className="font-mono">14:30 (2:30 PM)</div>
                <div className="font-mono">23:59 (11:59 PM)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Navigation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a
              href="/admin-dashboard-Logix/dashboard"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-1">Dashboard</h3>
              <p className="text-sm text-gray-600">System overview</p>
            </a>
            
            <a
              href="/admin-dashboard-Logix/dashboard/content"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-1">Content Management</h3>
              <p className="text-sm text-gray-600">Edit site content</p>
            </a>
            
            <a
              href="/admin-dashboard-Logix/dashboard/faqs"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-1">FAQ Management</h3>
              <p className="text-sm text-gray-600">Edit questions & answers</p>
            </a>
            
            {(user.role === 'owner' || user.role === 'admin') && (
              <a
                href="/admin-dashboard-Logix/dashboard/claims"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-1">Claims Control</h3>
                <p className="text-sm text-gray-600">Enable/disable filing</p>
              </a>
            )}
          </div>
        </div>

        {/* Important Reminders */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Reminders</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  • Date changes appear immediately on the public website<br />
                  • Use the visibility toggle to hide internal planning dates<br />
                  • Mark only critical deadlines as urgent<br />
                  • All date modifications are logged with timestamps and user information
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}