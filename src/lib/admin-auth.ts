// lib/admin-auth.ts
import { createClient } from '@supabase/supabase-js'

// Get environment variables with proper error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

if (!supabaseServiceKey) {
  console.warn('Missing SUPABASE_SERVICE_ROLE_KEY environment variable - some admin functions may not work')
}

// Client for admin operations (only create if service key exists)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Client for authentication
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

// Get admin emails from environment variable
const getAdminEmails = (): string[] => {
  const adminEmails = process.env.ADMIN_EMAILS || ''
  const emailArray = adminEmails.split(',').map(email => email.trim()).filter(Boolean)
  
  // Fallback for development if env var is not set
  if (emailArray.length === 0) {
    console.warn('No ADMIN_EMAILS environment variable found. Using fallback email.')
    return ['christina@yourteamconsultants.com']
  }
  
  return emailArray
}

/**
 * Check if email is authorized admin
 */
export function isAuthorizedAdmin(email: string): boolean {
  const adminEmails = getAdminEmails()
  return adminEmails.includes(email.toLowerCase())
}

/**
 * Get admin role based on email
 */
export function getAdminRole(email: string): 'owner' | 'admin' | 'editor' {
  const adminEmails = getAdminEmails()
  const emailIndex = adminEmails.findIndex(adminEmail => 
    adminEmail.toLowerCase() === email.toLowerCase()
  )
  
  // First email is owner, others are admins by default
  if (emailIndex === 0) return 'owner'
  return 'admin'
}

/**
 * Sign in admin user with email/password
 */
export async function signInAdmin(email: string, password: string): Promise<{
  success: boolean
  user?: AdminUser
  session?: unknown
  error?: string
}> {
  try {
    // Check if email is authorized
    if (!isAuthorizedAdmin(email)) {
      return {
        success: false,
        error: 'Unauthorized email address'
      }
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Authentication failed'
      }
    }

    // Create admin user object
    const adminUser: AdminUser = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
      role: getAdminRole(data.user.email!),
      lastLogin: new Date().toISOString(),
      created_at: data.user.created_at,
      email_confirmed_at: data.user.email_confirmed_at
    }

    return {
      success: true,
      user: adminUser,
      session: data.session
    }
  } catch (error) {
    console.error('Admin sign in error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

/**
 * Sign up admin user (if needed)
 */
export async function signUpAdmin(email: string, password: string, name?: string): Promise<{
  success: boolean
  user?: unknown
  session?: unknown
  message?: string
  error?: string
}> {
  try {
    // Check if email is authorized
    if (!isAuthorizedAdmin(email)) {
      return {
        success: false,
        error: 'Unauthorized email address'
      }
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      message: 'Please check your email to confirm your account'
    }
  } catch (error) {
    console.error('Admin sign up error:', error)
    return {
      success: false,
      error: 'Sign up failed'
    }
  }
}

/**
 * Sign out admin user
 */
export async function signOutAdmin(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Admin sign out error:', error)
    return {
      success: false,
      error: 'Sign out failed'
    }
  }
}

/**
 * Get current admin session
 */
export async function getCurrentAdminSession(): Promise<{
  success: boolean
  user?: AdminUser
  session?: unknown
  error?: string
}> {
  try {
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return {
        success: false,
        error: 'No active session'
      }
    }

    // Check if user is authorized admin
    if (!isAuthorizedAdmin(session.user.email!)) {
      return {
        success: false,
        error: 'Unauthorized access'
      }
    }

    // Create admin user object
    const adminUser: AdminUser = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
      role: getAdminRole(session.user.email!),
      lastLogin: new Date().toISOString(),
      created_at: session.user.created_at,
      email_confirmed_at: session.user.email_confirmed_at
    }

    return {
      success: true,
      user: adminUser,
      session
    }
  } catch (error) {
    console.error('Get admin session error:', error)
    return {
      success: false,
      error: 'Session check failed'
    }
  }
}

/**
 * Check if user has required permission
 */
export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const permissions = {
    owner: ['all'],
    admin: ['toggle_claims', 'edit_content', 'manage_faqs', 'manage_dates', 'view_analytics', 'export_data'],
    editor: ['edit_content', 'manage_faqs', 'manage_dates']
  }

  const userPermissions = permissions[userRole as keyof typeof permissions] || []
  return userPermissions.includes('all') || userPermissions.includes(requiredPermission)
}

/**
 * Validate admin session for API routes
 */
export async function validateAdminSession(request: Request): Promise<{
  success: boolean
  user?: AdminUser
  error?: string
}> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing authorization header'
      }
    }

    const token = authHeader.replace('Bearer ', '')

    // Use the regular supabase client to validate the token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        success: false,
        error: 'Invalid token'
      }
    }

    // Check if user is authorized admin
    if (!isAuthorizedAdmin(user.email!)) {
      return {
        success: false,
        error: 'Unauthorized access'
      }
    }

    // Create admin user object
    const adminUser: AdminUser = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!.split('@')[0],
      role: getAdminRole(user.email!),
      lastLogin: new Date().toISOString(),
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at
    }

    return {
      success: true,
      user: adminUser
    }
  } catch (error) {
    console.error('Validate admin session error:', error)
    return {
      success: false,
      error: 'Session validation failed'
    }
  }
}

/**
 * Simple validateAuth function for JWT validation (fallback for backward compatibility)
 */
export function validateAuth(authHeader: string | null): {
  isValid: boolean
  user?: { email: string; role: string }
  error?: string
} {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isValid: false,
      error: 'Missing or invalid authorization header'
    }
  }

  // For now, just return valid if token exists
  // This is a simplified fallback - in production you should validate the actual JWT
  return {
    isValid: true,
    user: { email: 'admin@example.com', role: 'admin' }
  }
}