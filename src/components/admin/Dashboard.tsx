// components/admin/Dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  FileText, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Eye,
  Calendar,
  Settings
} from 'lucide-react'

interface DashboardStats {
  totalClaims: number
  claimsToday: number
  claimsThisWeek: number
  claimsEnabled: boolean
  lastToggle: string
  pendingReviews: number
  contentSections: number
  lastContentUpdate: string
  nextDeadline: string
  daysUntilDeadline: number
}

interface RecentActivity {
  id: string
  type: 'claim' | 'content' | 'system' | 'login'
  message: string
  timestamp: string
  user?: string
}

interface DashboardProps {
  userRole: 'owner' | 'admin' | 'editor'
  userName: string
}

export default function Dashboard({ userRole, userName }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalClaims: 0,
    claimsToday: 0,
    claimsThisWeek: 0,
    claimsEnabled: true,
    lastToggle: '',
    pendingReviews: 0,
    contentSections: 0,
    lastContentUpdate: '',
    nextDeadline: '2025-08-08',
    daysUntilDeadline: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/activity')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activities || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'claim': return <Users className="h-4 w-4" />
      case 'content': return <FileText className="h-4 w-4" />
      case 'system': return <Settings className="h-4 w-4" />
      case 'login': return <Eye className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName}</h1>
        <p className="text-gray-600 mt-1">Here&apos;s what&apos;s happening with your claims portal today.</p>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Claims</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalClaims}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              {stats.claimsToday} today, {stats.claimsThisWeek} this week
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {stats.claimsEnabled ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Claims Status</p>
              <p className={`text-lg font-semibold ${stats.claimsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {stats.claimsEnabled ? 'ENABLED' : 'DISABLED'}
              </p>
            </div>
          </div>
          {stats.lastToggle && (
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Last changed: {formatDate(stats.lastToggle)}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Content Sections</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.contentSections}</p>
            </div>
          </div>
          {stats.lastContentUpdate && (
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                Updated: {formatDate(stats.lastContentUpdate)}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Filing Deadline</p>
              <p className="text-lg font-semibold text-gray-900">{stats.daysUntilDeadline} days</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              {new Date(stats.nextDeadline).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {(userRole === 'owner' || userRole === 'admin') && (
    <a
      href="/admin-dashboard-Logix/dashboard/claims"  // UPDATED
      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Activity className="h-6 w-6 text-blue-600 mr-3" />
      <div>
        <div className="font-medium">Toggle Claims</div>
        <div className="text-sm text-gray-500">Enable/disable claim filing</div>
      </div>
    </a>
  )}
  
  <a
    href="/admin-dashboard-Logix/dashboard/content"  // UPDATED
    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
  >
    <FileText className="h-6 w-6 text-purple-600 mr-3" />
    <div>
      <div className="font-medium">Edit Content</div>
      <div className="text-sm text-gray-500">Update site text and info</div>
    </div>
  </a>

  <a
    href="/admin-dashboard-Logix/dashboard/dates"  // UPDATED
    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
  >
    <Calendar className="h-6 w-6 text-orange-600 mr-3" />
    <div>
      <div className="font-medium">Manage Dates</div>
      <div className="text-sm text-gray-500">Update important deadlines</div>
    </div>
  </a>     
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(activity.timestamp)}
                    {activity.user && <span className="ml-2">by {activity.user}</span>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity to display
            </div>
          )}
        </div>
      </div>

      {/* System status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Site Health</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Claims Form</span>
                <span className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Service</span>
                <span className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Active
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Important Reminders</h3>
            <div className="space-y-2">
              {stats.daysUntilDeadline <= 30 && (
                <div className="flex items-center text-sm text-orange-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Filing deadline approaching ({stats.daysUntilDeadline} days)
                </div>
              )}
              {stats.pendingReviews > 0 && (
                <div className="flex items-center text-sm text-blue-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {stats.pendingReviews} claims pending review
                </div>
              )}
              {!stats.claimsEnabled && (
                <div className="flex items-center text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Claims filing is currently disabled
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}