// components/admin/ClaimsToggle.tsx
'use client'

import { useState, useEffect } from 'react'
import { Power, AlertTriangle, CheckCircle, Clock, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ClaimsSettings {
  isEnabled: boolean
  lastToggled: string
  toggledBy: string
  maintenanceMessage?: string
  scheduledToggle?: {
    date: string
    time: string
    action: 'enable' | 'disable'
  }
}

interface ClaimsToggleProps {
  userRole: 'owner' | 'admin' | 'editor'
  userName: string
}

export default function ClaimsToggle({ userRole, userName }: ClaimsToggleProps) {
  const [settings, setSettings] = useState<ClaimsSettings>({
    isEnabled: true,
    lastToggled: '2025-01-15T10:30:00Z',
    toggledBy: 'System'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduledAction, setScheduledAction] = useState<'enable' | 'disable'>('disable')

  // Load current settings
  useEffect(() => {
    fetchClaimsSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  }

  const fetchClaimsSettings = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/claims-toggle', {
        headers
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSettings(result.data)
          setMaintenanceMessage(result.data.maintenanceMessage || '')
        }
      } else {
        console.error('Failed to fetch claims settings:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch claims settings:', error)
    }
  }

  const toggleClaims = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/claims-toggle', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          isEnabled: !settings.isEnabled,
          toggledBy: userName,
          maintenanceMessage: maintenanceMessage
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSettings(result.data)
          setMessage(`Claims filing ${result.data.isEnabled ? 'enabled' : 'disabled'} successfully`)
        } else {
          setMessage(result.error || 'Failed to update claims status')
        }
      } else {
        const errorResult = await response.json()
        setMessage(errorResult.error || 'Failed to update claims status')
      }
    } catch (error) {
      setMessage('Error updating claims status')
      console.error('Toggle error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateMaintenanceMessage = async () => {
    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/claims-toggle', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          maintenanceMessage: maintenanceMessage
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setMessage('Maintenance message updated successfully')
          fetchClaimsSettings()
        } else {
          setMessage(result.error || 'Failed to update maintenance message')
        }
      } else {
        const errorResult = await response.json()
        setMessage(errorResult.error || 'Failed to update maintenance message')
      }
    } catch (error) {
      console.error('Update maintenance message error:', error)
      setMessage('Error updating maintenance message')
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleToggle = async () => {
    if (!scheduledDate || !scheduledTime) {
      setMessage('Please select both date and time for scheduling')
      return
    }

    setIsLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/admin/claims-toggle/schedule', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: scheduledDate,
          time: scheduledTime,
          action: scheduledAction,
          scheduledBy: userName
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setMessage(`Claims ${scheduledAction} scheduled for ${scheduledDate} at ${scheduledTime}`)
          setShowScheduler(false)
          fetchClaimsSettings()
        } else {
          setMessage(result.error || 'Failed to schedule toggle')
        }
      } else {
        const errorResult = await response.json()
        setMessage(errorResult.error || 'Failed to schedule toggle')
      }
    } catch (error) {
      console.error('Toggle scheduling error:', error)
      setMessage('Error scheduling toggle')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Check if user has permission to toggle claims
  const canToggleClaims = userRole === 'owner' || userRole === 'admin'

  if (!canToggleClaims) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">You don&apos;t have permission to control claims filing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('successfully') || message.includes('scheduled') 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Current Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Claims Filing Status</h2>
            <div className="flex items-center space-x-2">
              {settings.isEnabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-700 font-medium">ENABLED</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 font-medium">DISABLED</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Last changed: {formatDate(settings.lastToggled)} by {settings.toggledBy}
            </p>
          </div>

          <button
            onClick={toggleClaims}
            disabled={isLoading}
            className={`
              flex items-center px-6 py-3 rounded-lg font-medium transition-colors duration-200
              ${settings.isEnabled 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <Power className="h-5 w-5 mr-2" />
            {isLoading ? 'Processing...' : (settings.isEnabled ? 'Disable Claims' : 'Enable Claims')}
          </button>
        </div>
      </div>

      {/* Maintenance Message */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Message</h3>
        <p className="text-sm text-gray-600 mb-3">
          This message will be displayed to users when claims filing is disabled.
        </p>
        <div className="space-y-3">
          <textarea
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            placeholder="Enter maintenance message (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={updateMaintenanceMessage}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Message
          </button>
        </div>
      </div>

      {/* Scheduled Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Schedule Toggle</h3>
          <button
            onClick={() => setShowScheduler(!showScheduler)}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Clock className="h-4 w-4 inline mr-2" />
            {showScheduler ? 'Hide Scheduler' : 'Schedule Toggle'}
          </button>
        </div>

        {showScheduler && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={scheduledAction}
                  onChange={(e) => setScheduledAction(e.target.value as 'enable' | 'disable')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="enable">Enable Claims</option>
                  <option value="disable">Disable Claims</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={scheduleToggle}
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Schedule Toggle
            </button>
          </div>
        )}

        {settings.scheduledToggle && (
          <div className="mt-4 p-3 bg-purple-50 rounded-md">
            <p className="text-sm text-purple-800">
              <strong>Scheduled:</strong> Claims will be {settings.scheduledToggle.action}d on{' '}
              {settings.scheduledToggle.date} at {settings.scheduledToggle.time}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              setScheduledDate(new Date().toISOString().split('T')[0])
              setScheduledTime('23:59')
              setScheduledAction('disable')
              setShowScheduler(true)
            }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h4 className="font-medium text-gray-900">End of Day Disable</h4>
            <p className="text-sm text-gray-600 mt-1">Schedule claims to be disabled at end of today</p>
          </button>
          
          <button
            onClick={() => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              setScheduledDate(tomorrow.toISOString().split('T')[0])
              setScheduledTime('09:00')
              setScheduledAction('enable')
              setShowScheduler(true)
            }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h4 className="font-medium text-gray-900">Tomorrow Morning Enable</h4>
            <p className="text-sm text-gray-600 mt-1">Schedule claims to be enabled tomorrow at 9 AM</p>
          </button>
        </div>
      </div>
    </div>
  )
}