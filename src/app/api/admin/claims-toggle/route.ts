// app/api/admin/claims-toggle/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, hasPermission } from '../../../../lib/admin-auth'

interface ClaimsSettings {
  isEnabled: boolean
  lastToggled: string
  toggledBy: string
  maintenanceMessage: string
  scheduledToggle?: {
    date: string
    time: string
    action: 'enable' | 'disable'
    scheduledBy: string
    scheduledAt: string
  }
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

// Simple in-memory storage (replace with database in production)
let claimsSettings: ClaimsSettings = {
  isEnabled: true,
  lastToggled: new Date().toISOString(),
  toggledBy: 'System',
  maintenanceMessage: 'Claims filing is temporarily unavailable. Please try again later.'
}

/**
 * GET /api/admin/claims-toggle
 * Get current claims settings including any scheduled toggle
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Claims Toggle API: GET request')
    
    // Validate authentication
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(auth.user.role, 'toggle_claims')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    console.log('✅ Claims Toggle API: Returning current settings')
    
    return NextResponse.json({
      success: true,
      data: claimsSettings,
      timestamp: new Date().toISOString()
    } as ApiResponse<ClaimsSettings>)

  } catch (error) {
    console.error('❌ Claims Toggle GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/claims-toggle
 * Toggle claims filing on/off immediately
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Claims Toggle API: POST request')
    
    // Validate authentication
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(auth.user.role, 'toggle_claims')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { isEnabled, maintenanceMessage } = body

    // Validate input
    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isEnabled must be a boolean', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Update settings
    claimsSettings = {
      ...claimsSettings,
      isEnabled,
      lastToggled: new Date().toISOString(),
      toggledBy: auth.user.name,
      maintenanceMessage: maintenanceMessage || claimsSettings.maintenanceMessage,
      // Clear any scheduled toggle since we're manually toggling
      scheduledToggle: undefined
    }

    console.log(`✅ Claims Toggle API: Claims ${isEnabled ? 'enabled' : 'disabled'} by ${auth.user.name}`)

    return NextResponse.json({
      success: true,
      data: claimsSettings,
      message: `Claims filing ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      timestamp: new Date().toISOString()
    } as ApiResponse<ClaimsSettings>)

  } catch (error) {
    console.error('❌ Claims Toggle POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/claims-toggle
 * Schedule a future toggle (enable/disable at specific date/time)
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Claims Toggle API: PUT request (schedule)')
    
    // Validate authentication
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(auth.user.role, 'toggle_claims')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { date, time, action } = body

    // Validate input
    if (!date || !time || !action) {
      return NextResponse.json(
        { success: false, error: 'Date, time, and action are required', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    if (action !== 'enable' && action !== 'disable') {
      return NextResponse.json(
        { success: false, error: 'Action must be "enable" or "disable"', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Validate date/time format and that it's in the future
    const scheduledDateTime = new Date(`${date}T${time}`)
    if (isNaN(scheduledDateTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date or time format', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    if (scheduledDateTime <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Scheduled time must be in the future', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Update settings with scheduled toggle
    claimsSettings = {
      ...claimsSettings,
      scheduledToggle: {
        date,
        time,
        action,
        scheduledBy: auth.user.name,
        scheduledAt: new Date().toISOString()
      }
    }

    console.log(`✅ Claims Toggle API: Scheduled ${action} for ${date} ${time} by ${auth.user.name}`)

    return NextResponse.json({
      success: true,
      data: claimsSettings,
      message: `Claims filing scheduled to ${action} on ${date} at ${time}`,
      timestamp: new Date().toISOString()
    } as ApiResponse<ClaimsSettings>)

  } catch (error) {
    console.error('❌ Claims Toggle PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/claims-toggle
 * Cancel any scheduled toggle
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🔍 Claims Toggle API: DELETE request (cancel schedule)')
    
    // Validate authentication
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(auth.user.role, 'toggle_claims')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    // Clear scheduled toggle
    claimsSettings = {
      ...claimsSettings,
      scheduledToggle: undefined
    }

    console.log(`✅ Claims Toggle API: Scheduled toggle cancelled by ${auth.user.name}`)

    return NextResponse.json({
      success: true,
      data: claimsSettings,
      message: 'Scheduled toggle cancelled successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<ClaimsSettings>)

  } catch (error) {
    console.error('❌ Claims Toggle DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
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