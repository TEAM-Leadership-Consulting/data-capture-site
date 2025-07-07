// app/important-dates/page.tsx
'use client'

import { useState } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface ImportantDate {
  id: number
  title: string
  date: string
  time?: string
  description: string
  type: 'deadline' | 'event' | 'milestone' | 'announcement'
  status: 'upcoming' | 'today' | 'passed'
  isUrgent?: boolean
}

const importantDates: ImportantDate[] = [
  {
    id: 1,
    title: "Claim Filing Deadline",
    date: "2025-08-08",
    description: "Final deadline to submit all claim forms. Claims submitted after this date will not be processed.",
    type: "deadline",
    status: "upcoming",
    isUrgent: true
  },
  {
    id: 2,
    title: "Exclude Yourself or Object Deadline",
    date: "2025-03-26",
    description: "Final deadline to exclude yourself from the settlement or object to the settlement terms.",
    type: "deadline",
    status: "upcoming",
    isUrgent: true
  },
  {
    id: 3,
    title: "Final Approval Hearing",
    date: "2025-04-15",
    time: "10:00 AM EST",
    description: "Court hearing for final approval of the settlement. All interested parties may attend.",
    type: "event",
    status: "upcoming"
  },
  {
    id: 4,
    title: "Settlement Notice Distribution",
    date: "2024-12-01",
    description: "Official settlement notices were mailed to all potential Settlement Class Members.",
    type: "announcement",
    status: "passed"
  },
  {
    id: 5,
    title: "Claims Portal Launch",
    date: "2024-12-15",
    description: "Online claims filing portal officially launched for Settlement Class Members.",
    type: "milestone",
    status: "passed"
  }
]

export default function ImportantDatesPage() {
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const today = new Date()
  const filteredDates = importantDates
    .map(date => ({
      ...date,
      status: getDateStatus(date.date, today)
    }))
    .filter(date => {
      const matchesType = filterType === 'all' || date.type === filterType
      const matchesStatus = filterStatus === 'all' || date.status === filterStatus
      return matchesType && matchesStatus
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  function getDateStatus(dateString: string, today: Date): 'upcoming' | 'today' | 'passed' {
    const date = new Date(dateString)
    const todayString = today.toDateString()
    const dateStringFormatted = date.toDateString()
    
    if (dateStringFormatted === todayString) return 'today'
    if (date > today) return 'upcoming'
    return 'passed'
  }

  function formatDate(dateString: string, includeTime?: string) {
    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    return includeTime ? `${formattedDate} at ${includeTime}` : formattedDate
  }

  function getDaysUntil(dateString: string) {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  function getStatusIcon(status: string, isUrgent?: boolean) {
    if (status === 'today') return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
    if (status === 'passed') return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
    if (isUrgent) return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
    return <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
  }

  function getStatusBadge(status: string, isUrgent?: boolean) {
    if (status === 'today') return 'bg-orange-100 text-orange-800'
    if (status === 'passed') return 'bg-green-100 text-green-800'
    if (status === 'upcoming' && isUrgent) return 'bg-red-100 text-red-800'
    return 'bg-blue-100 text-blue-800'
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'deadline': return <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
      case 'event': return <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
      case 'milestone': return <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      case 'announcement': return <Info className="h-5 w-5 sm:h-6 sm:w-6" />
      default: return <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-blue-300" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Important Dates
            </h1>
            <p className="text-lg sm:text-xl text-blue-100">
              Key deadlines, events, and milestones for Bob Johnson vs Smith & Jones, LLC
            </p>
          </div>
        </div>
      </section>

      {/* Key Dates Summary */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-indigo-200 via-blue-100 to-indigo-200 border-l-4 sm:border-l-8 border-indigo-500 border-r-4 sm:border-r-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
              Critical Settlement Deadlines
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-red-600 mb-2">
                  March 26, 2025
                </h3>
                <p className="text-sm sm:text-base text-gray-700">
                  Deadline to exclude yourself or object to the Settlement
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-blue-600 mb-2">
                  April 15, 2025
                </h3>
                <p className="text-sm sm:text-base text-gray-700">
                  Final approval hearing
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm sm:col-span-2 lg:col-span-1">
                <h3 className="text-base sm:text-lg font-semibold text-green-600 mb-2">
                  August 8, 2025
                </h3>
                <p className="text-sm sm:text-base text-gray-700">
                  Deadline to file a claim
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 sm:py-8 bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <select
                  id="type-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="deadline">Deadlines</option>
                  <option value="event">Events</option>
                  <option value="milestone">Milestones</option>
                  <option value="announcement">Announcements</option>
                </select>
              </div>

              <div className="flex-1">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="today">Today</option>
                  <option value="passed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dates Timeline */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4 sm:space-y-6">
              {filteredDates.map((date, index) => (
                <div key={date.id} className="relative">
                  {/* Timeline connector - Hidden on mobile for cleaner look */}
                  {index < filteredDates.length - 1 && (
                    <div className="hidden sm:block absolute left-6 sm:left-8 top-12 sm:top-16 bottom-0 w-0.5 bg-gray-300"></div>
                  )}
                  
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${
                      date.status === 'passed' ? 'bg-green-100 text-green-600' :
                      date.isUrgent ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getTypeIcon(date.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white rounded-lg shadow-sm border p-4 sm:p-6 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words">{date.title}</h3>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(date.status, date.isUrgent)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(date.status, date.isUrgent)}`}>
                              {date.status === 'today' ? 'Today' :
                               date.status === 'passed' ? 'Completed' :
                               date.isUrgent ? 'Urgent' : 'Upcoming'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 mb-3 space-y-1 sm:space-y-0 sm:space-x-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="font-medium text-sm sm:text-base break-words">{formatDate(date.date, date.time)}</span>
                        </div>
                        {date.status === 'upcoming' && (
                          <span className="text-sm sm:ml-4">
                            ({getDaysUntil(date.date)} days remaining)
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3">{date.description}</p>

                      {/* Type badge */}
                      <div>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded capitalize">
                          {date.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDates.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-base sm:text-lg">No dates found matching your filter criteria.</p>
              </div>
            )}
         
          </div>
        </div>
      </section>
    </div>
  )
}