// app/api/public/deadline/route.ts
// Public endpoint for getting claim deadline information

import { NextResponse } from 'next/server'

interface ClaimDeadline {
  date: string
  formatted: string
  isFromDatabase: boolean
}

interface ApiResponse {
  success: boolean
  deadline: ClaimDeadline
  timestamp: string
}

const DEFAULT_DEADLINE = 'March 26, 2025'

/**
 * GET /api/public/deadline
 * Public endpoint to get claim filing deadline
 * No authentication required
 */
export async function GET() {
  try {
    console.log('🔍 Public Deadline API: GET request')
    
    // For now, return the default deadline
    // Later you can connect this to a database or admin-configured settings
    const deadline: ClaimDeadline = {
      date: '2025-03-26',
      formatted: DEFAULT_DEADLINE.toUpperCase(),
      isFromDatabase: false
    }
    
    console.log('✅ Public Deadline API: Returning deadline:', deadline.formatted)
    
    return NextResponse.json({
      success: true,
      deadline,
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    console.error('❌ Public Deadline API error:', error)
    
    // Always return a safe default deadline
    return NextResponse.json({
      success: true,
      deadline: {
        date: '2025-03-26',
        formatted: DEFAULT_DEADLINE.toUpperCase(),
        isFromDatabase: false
      },
      timestamp: new Date().toISOString()
    } as ApiResponse)
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}