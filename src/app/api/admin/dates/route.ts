// app/api/admin/dates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, hasPermission } from '../../../../lib/admin-auth'

// Types for dates management
interface ImportantDate {
  id: string
  title: string
  date: string
  time?: string
  description: string
  type: 'deadline' | 'event' | 'milestone' | 'announcement'
  isUrgent: boolean
  isVisible: boolean
  lastModified?: string
}

interface DateData {
  dates: ImportantDate[]
  lastUpdated: string
  updatedBy: string
  version: string
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

// Simple in-memory storage for demo (replace with database in production)
let datesData: DateData = {
  dates: [
    {
      id: 'filing-deadline',
      title: 'Filing Deadline',
      date: '2025-08-07',
      time: '23:59',
      description: 'Last day to file a claim',
      type: 'deadline',
      isUrgent: true,
      isVisible: true
    },
    {
      id: 'settlement-announcement',
      title: 'Settlement Announcement',
      date: '2025-01-15',
      description: 'Settlement was announced to the public',
      type: 'announcement',
      isUrgent: false,
      isVisible: true
    },
    {
      id: 'court-hearing',
      title: 'Final Court Hearing',
      date: '2025-09-15',
      time: '10:00',
      description: 'Final court hearing for settlement approval',
      type: 'event',
      isUrgent: false,
      isVisible: true
    }
  ],
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System',
  version: '1.0.0'
}

/**
 * Simple logging function (replace with proper logging service)
 */
function logSecurityEvent(event: string, email?: string, ip?: string, details?: unknown): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    email,
    ip,
    details
  }
  console.log('Security Event:', logEntry)
}

/**
 * Simple activity logging (replace with database logging)
 */
function logActivity(type: string, message: string, email: string, ip: string, details?: unknown): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    email,
    ip,
    details
  }
  console.log('Activity Log:', logEntry)
}

/**
 * GET /api/admin/dates
 * Get all important dates
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Dates API: Validating admin session...')
    
    // Validate authentication with Supabase
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      console.log('❌ Dates API: Authentication failed')
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication failed', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    console.log('✅ Dates API: User authenticated:', auth.user.email)

    // Check permissions
    if (!hasPermission(auth.user.role, 'manage_dates')) {
      logSecurityEvent('unauthorized_access', auth.user.email, getClientIP(request), {
        action: 'get_dates',
        reason: 'insufficient_permissions'
      })
      
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    console.log('✅ Dates API: Permissions verified, returning dates')

    // Return dates data
    return NextResponse.json({
      success: true,
      data: datesData,
      timestamp: new Date().toISOString()
    } as ApiResponse<DateData>)

  } catch (error) {
    console.error('❌ Dates GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/dates
 * Save all important dates
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Dates API: Validating admin session for save...')
    
    // Validate authentication with Supabase
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      console.log('❌ Dates API: Authentication failed')
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication failed', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    console.log('✅ Dates API: User authenticated:', auth.user.email)

    // Check permissions
    if (!hasPermission(auth.user.role, 'manage_dates')) {
      logSecurityEvent('unauthorized_access', auth.user.email, getClientIP(request), {
        action: 'save_dates',
        reason: 'insufficient_permissions'
      })
      
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { dates } = body

    console.log('📝 Dates API: Save request for', dates?.length || 0, 'dates')

    // Validate required fields
    if (!Array.isArray(dates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data - dates must be an array', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Validate dates structure
    const validationError = validateDates(dates)
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError, timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Store previous data for logging
    const previousData = { ...datesData }

    // Create updated dates data
    const updatedDates: DateData = {
      dates: dates.map(date => ({
        ...date,
        lastModified: new Date().toISOString()
      })),
      lastUpdated: new Date().toISOString(),
      updatedBy: auth.user.name,
      version: incrementVersion(datesData.version)
    }

    // Save dates
    datesData = updatedDates

    // Log the changes
    const changes = getDateChanges(previousData.dates, dates)
    logActivity(
      'date',
      `Important dates updated by ${auth.user.name}. ${changes.length} dates modified.`,
      auth.user.email,
      getClientIP(request),
      { 
        datesModified: changes.length,
        changes: changes.slice(0, 10), // Log first 10 changes
        totalDates: dates.length
      }
    )

    // Log security event for audit trail
    logSecurityEvent('dates_updated', auth.user.email, getClientIP(request), {
      datesCount: dates.length,
      changesCount: changes.length,
      updatedBy: auth.user.name
    })

    console.log(`✅ Dates API: Dates saved successfully (${changes.length} changes)`)

    return NextResponse.json({
      success: true,
      data: updatedDates,
      message: 'Dates saved successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<DateData>)

  } catch (error) {
    console.error('❌ Dates POST error:', error)
    logActivity(
      'system',
      `Failed to save dates: ${error}`,
      'System',
      getClientIP(request),
      { error: error instanceof Error ? error.message : 'Unknown error' }
    )
    
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/dates
 * Update a specific date
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Dates API: Validating admin session for update...')
    
    // Validate authentication with Supabase
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication failed', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(auth.user.role, 'manage_dates')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { dateId, updates } = body

    console.log('📝 Dates API: Update request for date:', dateId)

    // Validate required fields
    if (!dateId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (dateId, updates)', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Find and update the specific date
    const dateIndex = datesData.dates.findIndex(d => d.id === dateId)
    if (dateIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Date not found', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 404 }
      )
    }

    const oldDate = { ...datesData.dates[dateIndex] }
    datesData.dates[dateIndex] = {
      ...datesData.dates[dateIndex],
      ...updates,
      lastModified: new Date().toISOString()
    }
    datesData.lastUpdated = new Date().toISOString()
    datesData.updatedBy = auth.user.name

    // Log the specific change
    logActivity(
      'date',
      `Date "${datesData.dates[dateIndex].title}" updated by ${auth.user.name}`,
      auth.user.email,
      getClientIP(request),
      { 
        dateId,
        dateTitle: datesData.dates[dateIndex].title,
        changes: Object.keys(updates),
        oldValues: Object.keys(updates).reduce((acc, key) => {
          (acc as Record<string, unknown>)[key] = (oldDate as Record<string, unknown>)[key]
          return acc
        }, {} as Record<string, unknown>)
      }
    )

    console.log(`✅ Dates API: Date "${datesData.dates[dateIndex].title}" updated`)

    return NextResponse.json({
      success: true,
      data: datesData,
      message: 'Date updated successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<DateData>)

  } catch (error) {
    console.error('❌ Dates PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/dates
 * Delete a specific date
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🔍 Dates API: Validating admin session for delete...')
    
    // Validate authentication with Supabase
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication failed', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(auth.user.role, 'manage_dates')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    // Get dateId from URL search params
    const url = new URL(request.url)
    const dateId = url.searchParams.get('id')

    console.log('🗑️ Dates API: Delete request for date:', dateId)

    if (!dateId) {
      return NextResponse.json(
        { success: false, error: 'Date ID is required', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Find the date to delete
    const dateIndex = datesData.dates.findIndex(d => d.id === dateId)
    if (dateIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Date not found', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 404 }
      )
    }

    const deletedDate = datesData.dates[dateIndex]
    
    // Remove the date
    datesData.dates.splice(dateIndex, 1)
    datesData.lastUpdated = new Date().toISOString()
    datesData.updatedBy = auth.user.name

    // Log the deletion
    logActivity(
      'date',
      `Date "${deletedDate.title}" deleted by ${auth.user.name}`,
      auth.user.email,
      getClientIP(request),
      { 
        dateId,
        dateTitle: deletedDate.title,
        dateType: deletedDate.type,
        dateDate: deletedDate.date
      }
    )

    console.log(`✅ Dates API: Date "${deletedDate.title}" deleted`)

    return NextResponse.json({
      success: true,
      data: datesData,
      message: 'Date deleted successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<DateData>)

  } catch (error) {
    console.error('❌ Dates DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * Validate important dates structure
 */
function validateDates(dates: unknown[]): string | null {
  for (const date of dates) {
    const dateObj = date as Record<string, unknown>
    
    if (!dateObj.id || typeof dateObj.id !== 'string') {
      return 'Invalid date ID'
    }
    
    if (!dateObj.title || typeof dateObj.title !== 'string') {
      return 'Invalid date title'
    }
    
    if (!dateObj.date || typeof dateObj.date !== 'string') {
      return 'Invalid date value'
    }
    
    // Validate date format
    if (isNaN(Date.parse(dateObj.date))) {
      return `Invalid date format for "${dateObj.title}"`
    }
    
    if (!dateObj.description || typeof dateObj.description !== 'string') {
      return 'Invalid date description'
    }
    
    if (!['deadline', 'event', 'milestone', 'announcement'].includes(dateObj.type as string)) {
      return 'Invalid date type'
    }
    
    if (typeof dateObj.isUrgent !== 'boolean') {
      return 'Invalid urgent flag'
    }
    
    if (typeof dateObj.isVisible !== 'boolean') {
      return 'Invalid visible flag'
    }
    
    // Validate time format if provided
    if (dateObj.time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dateObj.time as string)) {
      return `Invalid time format for "${dateObj.title}"`
    }
  }
  
  return null
}

/**
 * Compare old and new dates to identify changes
 */
function getDateChanges(oldDates: ImportantDate[], newDates: ImportantDate[]) {
  const changes: Array<{
    dateId: string
    dateTitle: string
    type: 'modified' | 'added' | 'removed'
    changes?: string[]
  }> = []

  // Check for modified and added dates
  for (const newDate of newDates) {
    const oldDate = oldDates.find(d => d.id === newDate.id)
    
    if (!oldDate) {
      changes.push({
        dateId: newDate.id,
        dateTitle: newDate.title,
        type: 'added'
      })
    } else {
      const fieldChanges: string[] = []
      
      if (oldDate.title !== newDate.title) fieldChanges.push('title')
      if (oldDate.date !== newDate.date) fieldChanges.push('date')
      if (oldDate.time !== newDate.time) fieldChanges.push('time')
      if (oldDate.description !== newDate.description) fieldChanges.push('description')
      if (oldDate.type !== newDate.type) fieldChanges.push('type')
      if (oldDate.isUrgent !== newDate.isUrgent) fieldChanges.push('urgent')
      if (oldDate.isVisible !== newDate.isVisible) fieldChanges.push('visibility')
      
      if (fieldChanges.length > 0) {
        changes.push({
          dateId: newDate.id,
          dateTitle: newDate.title,
          type: 'modified',
          changes: fieldChanges
        })
      }
    }
  }

  // Check for removed dates
  for (const oldDate of oldDates) {
    const newDate = newDates.find(d => d.id === oldDate.id)
    
    if (!newDate) {
      changes.push({
        dateId: oldDate.id,
        dateTitle: oldDate.title,
        type: 'removed'
      })
    }
  }

  return changes
}

/**
 * Increment version string
 */
function incrementVersion(version: string): string {
  const parts = version.split('.')
  const patch = parseInt(parts[2] || '0') + 1
  return `${parts[0] || '1'}.${parts[1] || '0'}.${patch}`
}

/**
 * Helper function to get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}