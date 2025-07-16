// app/api/public/claims-status/route.ts
import { NextResponse } from 'next/server'

// Simple version that works immediately - no database dependency
export async function GET() {
  try {
    console.log('🔍 Public Claims Status API: GET request')
    
    // For now, return enabled by default
    // Later you can replace this with database calls
    return NextResponse.json({
      success: true,
      isEnabled: true,
      maintenanceMessage: 'Claims filing is temporarily unavailable for maintenance. Please check back later.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Public Claims Status API error:', error)
    
    // Default to enabled to avoid blocking users
    return NextResponse.json({
      success: true,
      isEnabled: true,
      maintenanceMessage: 'System temporarily unavailable. Please try again later.',
      timestamp: new Date().toISOString()
    })
  }
}

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