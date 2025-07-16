// lib/admin-auth.ts - COMPLETE VERSION WITH PROPER AUTHENTICATION CONTEXT (FIXED)
import { createClient } from '@supabase/supabase-js'

// Get environment variables with proper error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

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

// ============================================================================
// SUPABASE CLIENT INITIALIZATION WITH PROPER AUTH CONTEXT
// ============================================================================

// Client for admin operations (only create if service key exists)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Client for authentication - FIXED: Ensure proper session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
  mfaEnabled?: boolean
  permissions?: string[]
}

export interface AuthResponse {
  success: boolean
  user?: AdminUser
  session?: unknown
  error?: string
  requires2FA?: boolean
  lockoutTime?: number 
}

export interface MFAEnrollResponse {
  success: boolean
  qr_code?: string
  secret?: string
  uri?: string
  factorId?: string
  error?: string
}

export interface MFAVerifyResponse {
  success: boolean
  user?: AdminUser
  session?: unknown
  error?: string
}

/**
 * FIXED: Properly typed authenticated user interface
 */
interface AuthenticatedUser {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
  created_at: string
  email_confirmed_at?: string
}

/**
 * Interface for security event logging
 */
interface SecurityEventDetails {
  email?: string
  ip?: string
  userAgent?: string
  error?: string
  challengeId?: string
  url?: string
  factorId?: string
}

/**
 * Interface for activity logging
 */
interface ActivityLogOptions {
  ip?: string
  userAgent?: string
  role?: string
  mfaEnabled?: boolean
  requiresConfirmation?: boolean
  factorId?: string
}

/**
 * FIXED: Rate limiting implementation with proper interface usage
 */
interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

// Simple in-memory rate limiting store (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * FIXED: Implement rate limiting functionality
 */
async function simpleRateLimit(
  key: string, 
  maxAttempts: number, 
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  
  // Clean expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key)
  }
  
  const currentEntry = rateLimitStore.get(key)
  
  if (!currentEntry) {
    // First attempt
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs
    }
  }
  
  if (currentEntry.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentEntry.resetTime
    }
  }
  
  // Increment count
  currentEntry.count++
  rateLimitStore.set(key, currentEntry)
  
  return {
    allowed: true,
    remaining: maxAttempts - currentEntry.count,
    resetTime: currentEntry.resetTime
  }
}

// ============================================================================
// AUTHENTICATION WRAPPER FOR DATABASE OPERATIONS
// ============================================================================

/**
 * CRITICAL FIX: Wrapper function to ensure all database operations run with authenticated context
 * FIXED: Replaced 'any' type with proper AuthenticatedUser interface
 */
export async function withAuthenticatedContext<T>(
  operation: (user: AuthenticatedUser) => Promise<T>,
  errorMessage: string = 'Authentication required for this operation'
): Promise<T> {
  try {
    console.log('🔐 Verifying authentication context before database operation...')
    
    // FIXED: Use getUser() instead of getSession() for security decisions
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('❌ Authentication error:', error)
      throw new Error(`Authentication failed: ${error.message}`)
    }
    
    if (!user) {
      console.error('❌ No authenticated user found')
      throw new Error(errorMessage)
    }
    
    console.log('✅ Authentication verified, proceeding with operation for user:', user.email)
    
    // Execute operation with authenticated context
    return await operation(user as AuthenticatedUser)
    
  } catch (error) {
    console.error('❌ Authentication wrapper error:', error)
    throw error instanceof Error ? error : new Error('Authentication verification failed')
  }
}

/**
 * CRITICAL FIX: Ensure Supabase client has authenticated context
 * Call this before any database operations that require authentication
 */
export async function ensureAuthenticatedClient(): Promise<void> {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Database operations require authenticated user context')
  }
  
  console.log('✅ Supabase client verified with authenticated context for:', user.email)
}

// ============================================================================
// PERMISSIONS AND ROLE MANAGEMENT
// ============================================================================

// Role-based permissions mapping
const ROLE_PERMISSIONS = {
  owner: [
    'admin:*',
    'content:*',
    'claims:*', 
    'users:*',
    'system:*',
    'export:*'
  ],
  admin: [
    'admin:read',
    'content:*',
    'claims:toggle',
    'claims:read',
    'faq:*',
    'dates:*',
    'analytics:read',
    'export:basic'
  ],
  editor: [
    'content:edit',
    'content:read',
    'faq:*',
    'dates:*'
  ]
} as const

// Get admin emails from environment variable
const getAdminEmails = (): string[] => {
  const adminEmails = process.env.ADMIN_EMAILS || ''
  const emailArray = adminEmails.split(',').map(email => email.trim()).filter(Boolean)
  
  // Fallback for development if env var is not set
  if (emailArray.length === 0) {
    console.warn('No ADMIN_EMAILS environment variable found. Using fallback email.')
    return ['admin@example.com'] // Fallback for development
  }
  
  return emailArray
}

// Check if email is authorized admin
const isAuthorizedAdmin = (email: string): boolean => {
  const adminEmails = getAdminEmails()
  return adminEmails.includes(email.toLowerCase())
}

// Get admin role based on email
const getAdminRole = (email: string): 'owner' | 'admin' | 'editor' => {
  const adminEmails = getAdminEmails()
  const index = adminEmails.indexOf(email.toLowerCase())
  
  // First email is owner, second is admin, rest are editors
  if (index === 0) return 'owner'
  if (index === 1) return 'admin'
  return 'editor'
}

// ============================================================================
// UTILITY FUNCTIONS FOR LOGGING
// ============================================================================

async function logActivity(
  action: string, 
  message: string, 
  userEmail?: string,
  options?: ActivityLogOptions
): Promise<void> {
  try {
    // Use authenticated context for logging when possible
    const logData = {
      type: 'info' as const,
      level: 'info' as const,
      message,
      user_email: userEmail,
      resource_type: 'admin_auth',
      timestamp: new Date().toISOString(),
      metadata: {
        action,
        ...options
      }
    }

    // Try to log to database if possible
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert(logData)

      if (error) {
        console.error('Failed to log activity:', error)
      }
    } catch {
      // If database logging fails, just console log
      console.log('Activity logged to console only:', logData)
    }
  } catch (error) {
    // Don't throw on logging errors, just console log
    console.error('Activity logging failed:', error)
  }
}

async function logSecurityEvent(
  eventType: string, 
  details: SecurityEventDetails
): Promise<void> {
  try {
    console.warn(`[SECURITY] ${eventType}:`, {
      timestamp: new Date().toISOString(),
      type: eventType,
      ...details
    })
    
    // Try to log to database if possible
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: eventType,
          message: details.email ? `Security event for ${details.email}` : 'Security event',
          user_email: details.email,
          metadata: details,
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to log security event to database:', error)
      }
    } catch {
      // Security events might happen before authentication, so don't require auth
      console.log('Security event logged to console only (no auth context)')
    }
  } catch (error) {
    console.error('Security event logging failed:', error)
  }
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * FIXED: Admin login with proper authentication context verification
 */
export async function adminLogin(
  email: string,
  password: string,
  clientIp?: string,
  clientUserAgent?: string
): Promise<AuthResponse> {
  try {
    const cleanEmail = email.toLowerCase().trim()
    
    console.log(`🔐 Admin login attempt for: ${cleanEmail}`)
    
    // Check if email is authorized
    if (!isAuthorizedAdmin(cleanEmail)) {
      await logSecurityEvent('unauthorized_login_attempt', { 
        email: cleanEmail, 
        ip: clientIp, 
        userAgent: clientUserAgent 
      })
      
      return {
        success: false,
        error: 'Unauthorized email address'
      }
    }

    // Check rate limiting
    const rateLimitResult = await simpleRateLimit(
      `login:${clientIp || 'unknown'}`, 
      10, 
      900000 // 15 minutes
    )
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent('rate_limit_exceeded', { 
        email: cleanEmail, 
        ip: clientIp, 
        userAgent: clientUserAgent 
      })
      
      return {
        success: false,
        error: 'Too many login attempts. Please try again later.',
        lockoutTime: rateLimitResult.resetTime
      }
    }

    // FIXED: Attempt authentication and immediately verify context
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    })

    if (error) {
      await logSecurityEvent('login_failed', { 
        email: cleanEmail, 
        ip: clientIp, 
        error: error.message 
      })
      
      return {
        success: false,
        error: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password' 
          : error.message
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Authentication failed - no user data'
      }
    }

    // FIXED: Verify authentication context immediately after login
    console.log('🔍 Verifying authentication context after login...')
    const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()
    
    if (verifyError || !verifiedUser) {
      console.error('❌ Authentication context verification failed:', verifyError)
      return {
        success: false,
        error: 'Authentication verification failed'
      }
    }

    console.log('✅ Authentication context verified successfully')

    // Check MFA status using updated API
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const hasMFA = factors && factors.all && factors.all.length > 0

    // FIXED: Proper session access - Check if session exists and if MFA is required
    const hasValidSession = data.session !== null
    const requiresMFA = hasMFA && !hasValidSession

    // Create admin user object
    const adminUser: AdminUser = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
      role: getAdminRole(data.user.email!),
      lastLogin: new Date().toISOString(),
      created_at: data.user.created_at,
      email_confirmed_at: data.user.email_confirmed_at || undefined,
      mfaEnabled: hasMFA ? true : undefined,
      permissions: [...ROLE_PERMISSIONS[getAdminRole(data.user.email!)]]
    }

    // If MFA is required but not verified, return challenge
    if (requiresMFA) {
      return {
        success: true,
        requires2FA: true,
        user: { ...adminUser, id: '' } // Don't send full user data before MFA
      }
    }

    // Log successful login
    await logActivity('login', `Admin user ${adminUser.email} logged in`, adminUser.email, {
      ip: clientIp,
      userAgent: clientUserAgent,
      role: adminUser.role,
      mfaEnabled: Boolean(hasMFA)
    })

    // FIXED: Return entire MFA response as session data (matches original implementation)
    return {
      success: true,
      user: adminUser,
      session: data
    }

  } catch (error) {
    console.error('Login error:', error)
    await logSecurityEvent('login_error', { 
      email: email, 
      ip: clientIp, 
      error: (error as Error).message 
    })
    return {
      success: false,
      error: 'Authentication service temporarily unavailable'
    }
  }
}

/**
 * FIXED: Admin logout with proper cleanup
 */
export async function adminLogout(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Get current user for logging before signout
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Log logout
    if (user?.email) {
      await logActivity('logout', `Admin user ${user.email} logged out`, user.email)
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

// ============================================================================
// SESSION MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * FIXED: Get current admin session with proper authentication verification
 */
export async function getCurrentAdminSession(): Promise<{
  success: boolean
  user?: AdminUser
  session?: unknown
  error?: string
}> {
  try {
    console.log('🔍 Getting current admin session...')
    
    // FIXED: Use getUser() instead of getSession() for security decisions
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.log('❌ User verification error:', userError)
      return {
        success: false,
        error: 'User verification failed'
      }
    }

    if (!user) {
      console.log('❌ No authenticated user found')
      return {
        success: false,
        error: 'No active session'
      }
    }

    // Verify user is authorized admin
    if (!isAuthorizedAdmin(user.email!)) {
      console.log('❌ User not authorized as admin:', user.email)
      await logSecurityEvent('unauthorized_session_access', { email: user.email })
      return {
        success: false,
        error: 'Unauthorized access'
      }
    }

    // Get session for additional context
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.warn('⚠️ Session retrieval warning:', sessionError)
      // Continue with user data even if session retrieval fails
    }

    // Check MFA status using updated API
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const hasMFA = factors && factors.all && factors.all.length > 0

    // Create admin user object
    const adminUser: AdminUser = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!.split('@')[0],
      role: getAdminRole(user.email!),
      lastLogin: new Date().toISOString(),
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at || undefined,
      mfaEnabled: hasMFA ? true : undefined,
      permissions: [...ROLE_PERMISSIONS[getAdminRole(user.email!)]]
    }

    console.log('✅ Admin session verified successfully for:', user.email)

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
 * FIXED: Validate admin session for API routes with proper authentication
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

    // FIXED: Use getUser() with token for validation
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return {
        success: false,
        error: 'Invalid token'
      }
    }

    // Check if user is authorized admin
    if (!isAuthorizedAdmin(user.email!)) {
      await logSecurityEvent('unauthorized_api_access', {
        email: user.email,
        url: request.url
      })
      
      return {
        success: false,
        error: 'Unauthorized access'
      }
    }

    // Check MFA status using updated API
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const hasMFA = factors && factors.all && factors.all.length > 0

    // Create admin user object
    const adminUser: AdminUser = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!.split('@')[0],
      role: getAdminRole(user.email!),
      lastLogin: new Date().toISOString(),
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at || undefined,
      mfaEnabled: hasMFA ? true : undefined,
      permissions: [...ROLE_PERMISSIONS[getAdminRole(user.email!)]]
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

// ============================================================================
// PERMISSION MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Check if user has required permission (enhanced from original)
 */
export function hasPermission(user: AdminUser, requiredPermission: string): boolean {
  // Owner has all permissions
  if (user.role === 'owner') {
    return true
  }

  // Check permissions array
  if (!user.permissions || user.permissions.length === 0) {
    return false
  }

  // Check wildcard permissions
  const hasWildcard = user.permissions.some(permission => {
    const [scope] = permission.split(':')
    return permission === `${scope}:*` && requiredPermission.startsWith(`${scope}:`)
  })

  if (hasWildcard) {
    return true
  }

  // Check exact permission match
  return user.permissions.includes(requiredPermission)
}

// ============================================================================
// MFA FUNCTIONS
// ============================================================================

/**
 * Verify MFA challenge using Supabase's built-in MFA
 */
export async function verifyMFA(
  challengeId: string, 
  code: string,
  ip?: string,
  userAgent?: string
): Promise<MFAVerifyResponse> {
  try {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId: challengeId,
      challengeId,
      code
    })

    if (error) {
      await logSecurityEvent('mfa_verification_failed', {
        challengeId,
        error: error.message,
        ip,
        userAgent
      })
      
      return {
        success: false,
        error: error.message
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'MFA verification failed'
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
      email_confirmed_at: data.user.email_confirmed_at || undefined,
      mfaEnabled: true,
      permissions: [...ROLE_PERMISSIONS[getAdminRole(data.user.email!)]]
    }

    // Log successful MFA verification
    await logActivity('mfa_verified', `MFA verified for ${adminUser.email}`, adminUser.email, {
      ip,
      userAgent,
      factorId: challengeId
    })

    return {
      success: true,
      user: adminUser,
      session: data
    }

  } catch (error) {
    console.error('MFA verification error:', error)
    return {
      success: false,
      error: 'MFA verification failed'
    }
  }
}

/**
 * Enroll user in MFA (TOTP)
 */
export async function enrollMFA(): Promise<MFAEnrollResponse> {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'Claims Management System',
      friendlyName: 'Admin Account'
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Type-safe access to TOTP enrollment response
    if (data.type === 'totp') {
      return {
        success: true,
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
        factorId: data.id
      }
    }

    return {
      success: false,
      error: 'Unexpected enrollment response type'
    }

  } catch (error) {
    console.error('MFA enrollment error:', error)
    return {
      success: false,
      error: 'MFA enrollment failed'
    }
  }
}

/**
 * Complete MFA enrollment
 */
export async function completeMFAEnrollment(factorId: string, code: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: factorId,
      code
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    await logActivity('mfa_enrolled', 'MFA enrollment completed', data.user?.email || '', {
      factorId
    })

    return {
      success: true
    }

  } catch (error) {
    console.error('MFA enrollment completion error:', error)
    return {
      success: false,
      error: 'MFA enrollment completion failed'
    }
  }
}

// ============================================================================
// LEGACY SUPPORT FUNCTIONS
// ============================================================================

/**
 * Simple validateAuth function for JWT validation (preserves original fallback)
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

  // For now, just return valid if token exists (preserves original behavior)
  // This is a simplified fallback - in production you should validate the actual JWT
  return {
    isValid: true,
    user: { email: 'admin@example.com', role: 'admin' }
  }
}

// ============================================================================
// CONVENIENCE EXPORTS (FOR BACKWARD COMPATIBILITY)
// ============================================================================

/**
 * Alias for adminLogin to maintain backward compatibility
 */
export const signInAdmin = adminLogin

/**
 * Alias for adminLogout to maintain backward compatibility  
 */
export const signOutAdmin = adminLogout

/**
 * Sign up admin user functionality
 */
export async function signUpAdmin(email: string, password: string, name?: string): Promise<{
  success: boolean
  user?: unknown
  session?: unknown
  message?: string
  error?: string
}> {
  try {
    const cleanEmail = email.toLowerCase().trim()
    
    // Check if email is authorized
    if (!isAuthorizedAdmin(cleanEmail)) {
      return {
        success: false,
        error: 'Unauthorized email address'
      }
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: name || cleanEmail.split('@')[0]
        }
      }
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    // Log signup
    await logActivity('user_signup', `Admin user signup for ${cleanEmail}`, cleanEmail, {
      role: getAdminRole(cleanEmail),
      requiresConfirmation: !data.session 
    })

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