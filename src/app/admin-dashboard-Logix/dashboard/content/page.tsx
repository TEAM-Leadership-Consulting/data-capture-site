// app/admin-dashboard-Logix/dashboard/content/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../../../components/admin/AdminLayout'
import ContentEditor from '../../../../components/admin/ContentEditor'
import { getCurrentAdminSession } from '../../../../lib/admin-auth'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, FileText, Edit3, Save, RefreshCw } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

export default function ContentPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuthentication = useCallback(async () => {
    try {
      console.log('🔍 Content: Checking authentication...')
      
      // Get current session from Supabase
      const sessionResult = await getCurrentAdminSession()
      
      if (!sessionResult.success || !sessionResult.user) {
        console.log('❌ Content: No valid session, redirecting to login...')
        router.push('/admin-dashboard-Logix')
        return
      }

      // Check if user has permission to access content management
      const userRole = sessionResult.user.role
      if (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'editor') {
        setError('You do not have permission to access content management.')
        setIsLoading(false)
        return
      }

      console.log('✅ Content: User authenticated:', sessionResult.user.email)
      
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
              <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
              <p className="text-gray-600 mt-1">
                Edit and manage all website content and text
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Role: <span className="font-medium text-gray-900">{user.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Content Editor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Editor Component */}
        <ContentEditor 
          userRole={user.role} 
          userName={user.name}
        />

        {/* Content Management Guide */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Content Management Guide</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Edit3 className="h-4 w-4 mr-2 text-blue-600" />
                Editing Content
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Text fields:</strong> Simple text content like headlines and titles</li>
                <li>• <strong>HTML fields:</strong> Rich content with formatting, links, and line breaks</li>
                <li>• <strong>Date fields:</strong> Important dates like deadlines in YYYY-MM-DD format</li>
                <li>• <strong>Required fields:</strong> Marked with * and must have content</li>
                <li>• Changes are automatically validated before saving</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Save className="h-4 w-4 mr-2 text-green-600" />
                Saving Changes
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Always click &quot;Save Changes&quot; to apply your edits</li>
                <li>• Unsaved changes are highlighted with a warning</li>
                <li>• Use &quot;Preview&quot; mode to see how content will appear</li>
                <li>• Changes take effect immediately on the public site</li>
                <li>• All changes are logged with your name and timestamp</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Content Categories</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Hero:</strong> Main banner, headline, and call-to-action</li>
                <li>• <strong>Settlement:</strong> Case details, amounts, and deadlines</li>
                <li>• <strong>Contact:</strong> Phone, email, and address information</li>
                <li>• <strong>Footer:</strong> Legal notices and disclaimers</li>
                <li>• <strong>General:</strong> Other site content and messages</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 text-orange-600" />
                Best Practices
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Keep headlines clear and concise</li>
                <li>• Use HTML formatting sparingly (bold, italics, line breaks)</li>
                <li>• Double-check dates and dollar amounts</li>
                <li>• Test changes in preview mode before saving</li>
                <li>• Use &quot;Reset&quot; carefully - it restores default content</li>
              </ul>
            </div>
          </div>
        </div>

        {/* HTML Formatting Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">HTML Formatting Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Common HTML Tags</h4>
              <div className="text-sm text-blue-700 space-y-1 font-mono bg-blue-100 p-3 rounded">
                <div>&lt;br&gt; - Line break</div>
                <div>&lt;strong&gt;text&lt;/strong&gt; - Bold text</div>
                <div>&lt;em&gt;text&lt;/em&gt; - Italic text</div>
                <div>&lt;u&gt;text&lt;/u&gt; - Underlined text</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Links and Lists</h4>
              <div className="text-sm text-blue-700 space-y-1 font-mono bg-blue-100 p-3 rounded">
                <div>&lt;a href=&quot;URL&quot;&gt;link text&lt;/a&gt;</div>
                <div>&lt;ul&gt;&lt;li&gt;item&lt;/li&gt;&lt;/ul&gt; - Bullet list</div>
                <div>&lt;ol&gt;&lt;li&gt;item&lt;/li&gt;&lt;/ol&gt; - Numbered list</div>
                <div>&lt;p&gt;paragraph&lt;/p&gt; - Paragraph</div>
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
            
            {(user.role === 'owner' || user.role === 'admin') && (
              <a
                href="/admin-dashboard-Logix/dashboard/claims"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-1">Claims Control</h3>
                <p className="text-sm text-gray-600">Enable/disable filing</p>
              </a>
            )}
            
            <a
              href="/admin-dashboard-Logix/dashboard/faqs"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-1">FAQ Management</h3>
              <p className="text-sm text-gray-600">Edit questions & answers</p>
            </a>
            
            <a
              href="/admin-dashboard-Logix/dashboard/dates"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-1">Important Dates</h3>
              <p className="text-sm text-gray-600">Manage deadlines</p>
            </a>
          </div>
        </div>

        {/* Security and Backup Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Reminders</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  • Content changes take effect immediately on the live website<br />
                  • All edits are automatically backed up and logged<br />
                  • Use preview mode to review changes before saving<br />
                  • Contact the administrator if you need to restore previous content
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}