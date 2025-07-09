// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { signInAdmin } from '../../../../lib/admin-auth'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

/**
 * POST /api/auth/login
 * Authenticate admin user with Supabase (includes automatic MFA handling)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login API: Processing login request...')
    
    // Parse request body
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      console.log('❌ Login API: Missing email or password')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email and password are required',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Login API: Invalid email format:', email)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 400 }
      )
    }

    console.log('🔍 Login API: Attempting authentication for:', email)

    // Attempt authentication with Supabase (handles MFA automatically)
    const authResult = await signInAdmin(email.toLowerCase().trim(), password)

    if (!authResult.success) {
      console.log('❌ Login API: Authentication failed:', authResult.error)
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error || 'Authentication failed',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 401 }
      )
    }

    if (!authResult.user) {
      console.log('❌ Login API: No user data returned')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed - no user data',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 401 }
      )
    }

    console.log('✅ Login API: Authentication successful for:', authResult.user.email)

    // Return successful authentication
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          name: authResult.user.name,
          role: authResult.user.role,
          lastLogin: authResult.user.lastLogin
        },
        session: authResult.session
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    } as ApiResponse)

  } catch (error) {
    console.error('❌ Login API: System error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/login
 * Return login endpoint information
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      endpoint: '/api/auth/login',
      methods: ['POST'],
      supportsMultiFactor: true, // Supabase handles MFA
      provider: 'Supabase'
    },
    timestamp: new Date().toISOString()
  } as ApiResponse)
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}