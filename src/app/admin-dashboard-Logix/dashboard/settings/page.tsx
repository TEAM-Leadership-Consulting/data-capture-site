// app/admin-dashboard-Logix/dashboard/settings/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../../../components/admin/AdminLayout'
import { getCurrentAdminSession } from '../../../../lib/admin-auth'
import { useRouter } from 'next/navigation'
import { 
  AlertTriangle, 
  Loader2, 
  Save, 
  Shield,
  Mail,
  Database,
  Download,
  Upload
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

interface SystemSettings {
  // Email Settings
  notificationEmail: string
  emailOnNewClaim: boolean
  emailOnClaimToggle: boolean
  emailOnSystemError: boolean
  
  // Security Settings
  sessionTimeout: number
  maxLoginAttempts: number
  requirePasswordChange: boolean
  
  // System Settings
  maintenanceMode: boolean
  debugMode: boolean
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  
  // Display Settings
  itemsPerPage: number
  defaultView: 'card' | 'list'
  showPreview: boolean
}

export default function SettingsPage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null) // Added missing setError state
  const router = useRouter()

  const [settings, setSettings] = useState<SystemSettings>({
    // Default values
    notificationEmail: '',
    emailOnNewClaim: true,
    emailOnClaimToggle: true,
    emailOnSystemError: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requirePasswordChange: false,
    maintenanceMode: false,
    debugMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    itemsPerPage: 10,
    defaultView: 'card',
    showPreview: true
  })

  const checkAuthentication = useCallback(async () => {
    try {
      console.log('🔍 Settings: Checking authentication...')
      
      const sessionResult = await getCurrentAdminSession()
      
      if (!sessionResult.success || !sessionResult.user) {
        console.log('❌ Settings: No valid session, redirecting to login...')
        router.push('/admin-dashboard-Logix')
        return
      }

      // Only owners can access settings
      const userRole = sessionResult.user.role
      if (userRole !== 'owner') {
        console.log('❌ Settings: Access denied - not owner')
        setError('You do not have permission to access system settings.')
        setIsLoading(false)
        return
      }

      console.log('✅ Settings: User authenticated:', sessionResult.user.email)
      setUser(sessionResult.user)
      
      // Load settings (in a real app, this would come from an API)
      setSettings(prev => ({
        ...prev,
        notificationEmail: sessionResult.user?.email || ''
      }))

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

  const handleSaveSettings = async () => {
    if (!user) return
    
    setIsSaving(true)
    setMessage(null)
    setError(null)
    
    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('Settings saved:', settings)
      setMessage('Settings saved successfully!')
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
      
    } catch (error) {
      console.error('Failed to save settings:', error)
      setError('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackupNow = async () => {
    try {
      setMessage('Creating backup...')
      setError(null)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setMessage('Backup created successfully!')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Backup failed:', error)
      setError('Backup failed. Please try again.')
    }
  }

  const handleTestEmail = async () => {
    try {
      setMessage('Sending test email...')
      setError(null)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage(`Test email sent to ${settings.notificationEmail}!`)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Failed to send test email:', error)
      setError('Failed to send test email.')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !user) {
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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure system-wide settings and preferences
          </p>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`border rounded-md p-4 ${
            message.includes('Failed') || message.includes('failed') 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <p>{message}</p>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Email Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Email Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={settings.notificationEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@example.com"
                />
                <button
                  onClick={handleTestEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Test Email
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailOnNewClaim}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailOnNewClaim: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Email when new claims are submitted</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailOnClaimToggle}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailOnClaimToggle: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Email when claims filing is toggled</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.emailOnSystemError}
                  onChange={(e) => setSettings(prev => ({ ...prev, emailOnSystemError: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Email on system errors</span>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="5"
                  max="480"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="3"
                  max="10"
                />
              </div>
            </div>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.requirePasswordChange}
                onChange={(e) => setSettings(prev => ({ ...prev, requirePasswordChange: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Require password change every 90 days</span>
            </label>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Database className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">System Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Enable maintenance mode</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.debugMode}
                  onChange={(e) => setSettings(prev => ({ ...prev, debugMode: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Enable debug mode</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Enable automatic backups</span>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Backup Frequency
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Backup & Maintenance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Backup & Maintenance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleBackupNow}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Create Backup Now
            </button>
            
            <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Restore from Backup
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  • Settings changes take effect immediately<br />
                  • All configuration changes are logged<br />
                  • Only system owners can modify these settings<br />
                  • Always test changes in a safe environment first
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}