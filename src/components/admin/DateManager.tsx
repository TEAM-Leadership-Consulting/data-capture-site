// components/admin/DateManager.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react'

interface ImportantDate {
  id: string
  title: string
  date: string
  time?: string
  description: string
  type: 'deadline' | 'event' | 'milestone' | 'announcement'
  isUrgent: boolean
  isVisible: boolean
}

interface DateManagerProps {
  userName: string
}

export default function DateManager({ userName }: DateManagerProps) {
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    type: 'deadline' as ImportantDate['type'],
    isUrgent: false,
    isVisible: true
  })
  const [editData, setEditData] = useState<ImportantDate | null>(null)

  // Utility functions first
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      date: '',
      time: '',
      description: '',
      type: 'deadline',
      isUrgent: false,
      isVisible: true
    })
  }, [])

  const getStatusInfo = useCallback((date: ImportantDate) => {
    const today = new Date()
    const dateObj = new Date(date.date)
    const diffTime = dateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: 'passed', color: 'text-gray-500', icon: CheckCircle }
    } else if (diffDays === 0) {
      return { status: 'today', color: 'text-blue-600', icon: Clock }
    } else if (diffDays <= 30) {
      return { status: 'upcoming', color: 'text-orange-600', icon: AlertTriangle }
    } else {
      return { status: 'future', color: 'text-green-600', icon: Calendar }
    }
  }, [])

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'deadline': return 'bg-red-100 text-red-800'
      case 'event': return 'bg-blue-100 text-blue-800'
      case 'milestone': return 'bg-green-100 text-green-800'
      case 'announcement': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const formatDate = useCallback((dateString: string, time?: string) => {
    const date = new Date(dateString)
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    return time ? `${formatted} at ${time}` : formatted
  }, [])

  // API functions
  const loadDates = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/dates')
      if (response.ok) {
        const data = await response.json()
        setDates(data.dates || [])
      }
    } catch (error) {
      console.error('Failed to load dates:', error)
      setMessage('Failed to load dates')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveDates = useCallback(async (updatedDates: ImportantDate[]) => {
    try {
      const response = await fetch('/api/admin/dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: updatedDates,
          updatedBy: userName,
          updatedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        setDates(updatedDates)
        setMessage('Dates updated successfully!')
        setTimeout(() => setMessage(''), 5000)
        return true
      } else {
        const errorData = await response.json().catch(() => null)
        setMessage(errorData?.message || 'Failed to save dates')
        setTimeout(() => setMessage(''), 5000)
        return false
      }
    } catch (error) {
      setMessage('Error saving dates')
      console.error('Save error:', error)
      setTimeout(() => setMessage(''), 5000)
      return false
    }
  }, [userName])

  // CRUD operations
  const addDate = useCallback(async () => {
    if (!formData.title || !formData.date) {
      setMessage('Title and date are required')
      setTimeout(() => setMessage(''), 5000)
      return
    }

    const newDate: ImportantDate = {
      id: Date.now().toString(),
      ...formData
    }

    const success = await saveDates([...dates, newDate])
    if (success) {
      setShowAddForm(false)
      resetForm()
    }
  }, [formData, dates, saveDates, resetForm])

  const updateDate = useCallback(async (id: string, updates: Partial<ImportantDate>) => {
    const updatedDates = dates.map(date => 
      date.id === id ? { ...date, ...updates } : date
    )
    await saveDates(updatedDates)
    setEditingId(null)
    setEditData(null)
  }, [dates, saveDates])

  const deleteDate = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this date?')) {
      const updatedDates = dates.filter(date => date.id !== id)
      await saveDates(updatedDates)
    }
  }, [dates, saveDates])

  const toggleVisibility = useCallback(async (id: string) => {
    const date = dates.find(d => d.id === id)
    if (date) {
      await updateDate(id, { isVisible: !date.isVisible })
    }
  }, [dates, updateDate])

  // Edit operations
  const startEdit = useCallback((date: ImportantDate) => {
    setEditingId(date.id)
    setEditData({ ...date })
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditData(null)
  }, [])

  const saveEdit = useCallback(async () => {
    if (editData && editingId) {
      if (!editData.title || !editData.date) {
        setMessage('Title and date are required')
        setTimeout(() => setMessage(''), 5000)
        return
      }
      await updateDate(editingId, editData)
    }
  }, [editData, editingId, updateDate])

  // Effects
  useEffect(() => {
    loadDates()
  }, [loadDates])

  // Computed values
  const sortedDates = [...dates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  const stats = {
    deadlines: dates.filter(d => d.type === 'deadline').length,
    events: dates.filter(d => d.type === 'event').length,
    urgent: dates.filter(d => d.isUrgent).length,
    visible: dates.filter(d => d.isVisible).length
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md flex items-center transition-all duration-300 ${
          message.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.includes('successfully') ? (
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Important Dates</h2>
            <p className="text-gray-600">Manage deadlines, events, and milestones</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Date
          </button>
        </div>

        {showAddForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-4">Add New Important Date</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Claim Filing Deadline"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as ImportantDate['type']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="deadline">Deadline</option>
                  <option value="event">Event</option>
                  <option value="milestone">Milestone</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time (optional)</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Detailed description of this date..."
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isUrgent}
                    onChange={(e) => setFormData({...formData, isUrgent: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Mark as urgent</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({...formData, isVisible: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Visible to users</span>
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={addDate}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Date
              </button>
              <button
                onClick={() => {setShowAddForm(false); resetForm()}}
                className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading dates...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => {
              const statusInfo = getStatusInfo(date)
              const StatusIcon = statusInfo.icon
              const isEditing = editingId === date.id

              return (
                <div
                  key={date.id}
                  className={`border rounded-lg p-4 transition-all hover:border-gray-300 ${
                    date.isUrgent ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                  } ${!date.isVisible ? 'opacity-60' : ''}`}
                >
                  {isEditing && editData ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                          <input
                            type="text"
                            value={editData.title}
                            onChange={(e) => setEditData({...editData, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={editData.type}
                            onChange={(e) => setEditData({...editData, type: e.target.value as ImportantDate['type']})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="deadline">Deadline</option>
                            <option value="event">Event</option>
                            <option value="milestone">Milestone</option>
                            <option value="announcement">Announcement</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                          <input
                            type="date"
                            value={editData.date}
                            onChange={(e) => setEditData({...editData, date: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                          <input
                            type="time"
                            value={editData.time || ''}
                            onChange={(e) => setEditData({...editData, time: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={editData.description}
                            onChange={(e) => setEditData({...editData, description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editData.isUrgent}
                              onChange={(e) => setEditData({...editData, isUrgent: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Mark as urgent</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editData.isVisible}
                              onChange={(e) => setEditData({...editData, isVisible: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Visible to users</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={saveEdit}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                          <h3 className="font-medium text-gray-900">{date.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(date.type)}`}>
                            {date.type}
                          </span>
                          {date.isUrgent && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Urgent
                            </span>
                          )}
                          {!date.isVisible && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{formatDate(date.date, date.time)}</p>
                        <p className="text-sm text-gray-700">{date.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => toggleVisibility(date.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                          title={date.isVisible ? 'Hide from users' : 'Show to users'}
                        >
                          {date.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => startEdit(date)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                          title="Edit date"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteDate(date.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                          title="Delete date"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {dates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No important dates added yet. Click {'"'}Add Date{'"'} to get started.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.deadlines}
            </div>
            <div className="text-sm text-red-800">Deadlines</div> 
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.events}
            </div>
            <div className="text-sm text-blue-800">Events</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.urgent}
            </div>
            <div className="text-sm text-yellow-800">Urgent Items</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.visible}
            </div>
            <div className="text-sm text-green-800">Visible to Users</div>
          </div>
        </div>
      </div>
    </div>
  )
}