// app/admin-dashboard-Logix/dashboard/faqs/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../../../components/admin/AdminLayout'
import FAQManager from '../../../../components/admin/FAQManager'
import { getCurrentAdminSession } from '../../../../lib/admin-auth'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, HelpCircle, Search, Filter, Eye } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

export default function FAQsPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuthentication = useCallback(async () => {
    try {
      console.log('🔍 FAQs: Checking authentication...')
      
      // Get current session from Supabase
      const sessionResult = await getCurrentAdminSession()
      
      if (!sessionResult.success || !sessionResult.user) {
        console.log('❌ FAQs: No valid session, redirecting to login...')
        router.push('/admin-dashboard-Logix')
        return
      }

      // Check if user has permission to access FAQ management
      const userRole = sessionResult.user.role
      if (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'editor') {
        setError('You do not have permission to access FAQ management.')
        setIsLoading(false)
        return
      }

      console.log('✅ FAQs: User authenticated:', sessionResult.user.email)
      
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
              <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
              <p className="text-gray-600 mt-1">
                Manage frequently asked questions and answers
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Role: <span className="font-medium text-gray-900">{user.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">FAQ Manager</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Manager Component */}
        <FAQManager 
          userName={user.name}
        />

        {/* FAQ Management Guide */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">FAQ Management Guide</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <HelpCircle className="h-4 w-4 mr-2 text-blue-600" />
                Writing Effective FAQs
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Questions:</strong> Use clear, natural language that users would ask</li>
                <li>• <strong>Answers:</strong> Be concise but complete, avoid jargon</li>
                <li>• <strong>Structure:</strong> Start with most important information first</li>
                <li>• <strong>Tone:</strong> Be helpful and professional, anticipate follow-ups</li>
                <li>• <strong>Updates:</strong> Review regularly and update outdated information</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-2 text-purple-600" />
                Categories
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Getting Started:</strong> Basic information for new users</li>
                <li>• <strong>Filing Process:</strong> Step-by-step claim submission help</li>
                <li>• <strong>Technical Support:</strong> Website and system issues</li>
                <li>• <strong>Security & Privacy:</strong> Data protection and safety</li>
                <li>• <strong>Legal Questions:</strong> Legal process and requirements</li>
                <li>• <strong>After Submission:</strong> What happens next</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Search className="h-4 w-4 mr-2 text-green-600" />
                Search and Organization
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use the search bar to quickly find specific FAQs</li>
                <li>• Filter by category to focus on specific topics</li>
                <li>• Reorder FAQs using the up/down arrows</li>
                <li>• Most important questions should appear first</li>
                <li>• Group related questions in the same category</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Eye className="h-4 w-4 mr-2 text-orange-600" />
                Visibility Control
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Toggle visibility to show/hide FAQs from users</li>
                <li>• Hidden FAQs remain in the admin system</li>
                <li>• Useful for draft questions or seasonal content</li>
                <li>• Test new FAQs internally before making them public</li>
                <li>• All FAQs are visible in the admin interface</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Writing Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-900 mb-3">Writing Tips for Great FAQs</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-800 mb-2">Question Best Practices</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Start with question words: &quot;How&quot;, &quot;What&quot;, &quot;When&quot;, &quot;Why&quot;</li>
                <li>• Use language your users would naturally use</li>
                <li>• Be specific enough to be helpful</li>
                <li>• Keep questions under 100 characters when possible</li>
                <li>• Avoid duplicate or very similar questions</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-green-800 mb-2">Answer Best Practices</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Answer the question directly in the first sentence</li>
                <li>• Provide additional context or steps if needed</li>
                <li>• Use bullet points for multi-step processes</li>
                <li>• Include relevant links or contact information</li>
                <li>• Keep answers under 200 words for readability</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common FAQ Categories */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">FAQ Category Guidelines</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Essential Categories</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• Getting Started</div>
                <div>• Filing Process</div>
                <div>• Technical Support</div>
                <div>• After Submission</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Legal & Compliance</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• Legal Questions</div>
                <div>• Documentation</div>
                <div>• Deadlines</div>
                <div>• Security & Privacy</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Organization Tips</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• 5-10 FAQs per category</div>
                <div>• Most common questions first</div>
                <div>• Logical flow within categories</div>
                <div>• Regular content review</div>
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
              href="/admin-dashboard-Logix/dashboard/dates"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900 mb-1">Important Dates</h3>
              <p className="text-sm text-gray-600">Manage deadlines</p>
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
                  • FAQ changes appear immediately on the public website<br />
                  • Use visibility toggle to test new FAQs before publishing<br />
                  • Keep answers current - review regularly for accuracy<br />
                  • All FAQ modifications are logged with timestamps and user information
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}