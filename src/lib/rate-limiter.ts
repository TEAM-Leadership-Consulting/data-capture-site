// lib/rate-limiter.ts - PRODUCTION RATE LIMITING SERVICE
import { supabase } from './supabase'

export interface RateLimitResult {
  allowed: boolean
  count: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (identifier: string) => string
}

// Default configurations for different types of operations
export const RATE_LIMITS = {
  // Authentication attempts
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 resets per hour
  twoFactorAttempts: { windowMs: 5 * 60 * 1000, maxRequests: 3 }, // 3 attempts per 5 minutes
  
  // File operations
  fileUpload: { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 uploads per hour
  documentDownload: { windowMs: 60 * 60 * 1000, maxRequests: 100 }, // 100 downloads per hour
  
  // API operations
  claimSubmission: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 5 }, // 5 claims per day
  adminAction: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 actions per minute
  contentUpdate: { windowMs: 60 * 60 * 1000, maxRequests: 50 }, // 50 updates per hour
  
  // General API
  apiGeneral: { windowMs: 15 * 60 * 1000, maxRequests: 1000 }, // 1000 requests per 15 minutes
  apiStrict: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
} as const

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try various headers to get real client IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) return realIP
  if (clientIP) return clientIP
  if (cfConnectingIP) return cfConnectingIP
  
  // Fallback to a default identifier
  return 'unknown'
}

/**
 * Core rate limiting function using Supabase for persistence
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  options: {
    skipSuccessfulRequests?: boolean
    skipFailedRequests?: boolean
    increment?: boolean
  } = {}
): Promise<RateLimitResult> {
  const { 
    skipSuccessfulRequests = false, 
    skipFailedRequests = false,
    increment = true 
  } = options
  
  const now = Date.now()
  const windowStart = now - windowMs
  const resetTime = now + windowMs
  
  try {
    // Clean up old records first (async, don't wait)
    cleanupOldRecords(windowStart).catch(console.error)
    
    // Get current count for this key within the window
    const { data: existingRecords, error: selectError } = await supabase
      .from('rate_limits')
      .select('count, created_at, successful, failed')
      .eq('key', key)
      .gte('created_at', new Date(windowStart).toISOString())
      .order('created_at', { ascending: false })
    
    if (selectError) {
      console.error('Rate limit select error:', selectError)
      // Fail open - allow request if we can't check rate limit
      return {
        allowed: true,
        count: 0,
        remaining: maxRequests,
        resetTime
      }
    }
    
    // Calculate current count
    let currentCount = 0
    let _lastRecord = null
    
    if (existingRecords && existingRecords.length > 0) {
      _lastRecord = existingRecords[0]
      
      for (const record of existingRecords) {
        const recordTime = new Date(record.created_at).getTime()
        if (recordTime >= windowStart) {
          if (!skipSuccessfulRequests || !record.successful) {
            if (!skipFailedRequests || record.successful) {
              currentCount += record.count || 1
            }
          }
        }
      }
    }
    
    const remaining = Math.max(0, maxRequests - currentCount)
    const allowed = currentCount < maxRequests
    
    // If we're incrementing and the request is allowed, record it
    if (increment && allowed) {
      // Try to update existing record from this minute, or create new one
      const oneMinuteAgo = now - 60000
      const recentRecord = existingRecords?.find(r => 
        new Date(r.created_at).getTime() > oneMinuteAgo
      )
      
      if (recentRecord) {
        // Update existing recent record
        await supabase
          .from('rate_limits')
          .update({ 
            count: (recentRecord.count || 1) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('key', key)
          .eq('created_at', recentRecord.created_at)
      } else {
        // Create new record
        await supabase
          .from('rate_limits')
          .insert({
            key,
            count: 1,
            window_ms: windowMs,
            max_requests: maxRequests,
            created_at: new Date().toISOString()
          })
      }
      
      return {
        allowed: true,
        count: currentCount + 1,
        remaining: remaining - 1,
        resetTime
      }
    }
    
    return {
      allowed,
      count: currentCount,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil(windowMs / 1000)
    }
    
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      count: 0,
      remaining: maxRequests,
      resetTime
    }
  }
}

/**
 * Record a successful operation for rate limiting purposes
 */
export async function recordSuccess(key: string): Promise<void> {
  try {
    await supabase
      .from('rate_limits')
      .update({ successful: true })
      .eq('key', key)
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      .order('created_at', { ascending: false })
      .limit(1)
  } catch (error) {
    console.error('Error recording success:', error)
  }
}

/**
 * Record a failed operation for rate limiting purposes
 */
export async function recordFailure(key: string): Promise<void> {
  try {
    await supabase
      .from('rate_limits')
      .update({ failed: true })
      .eq('key', key)
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      .order('created_at', { ascending: false })
      .limit(1)
  } catch (error) {
    console.error('Error recording failure:', error)
  }
}

/**
 * Clean up old rate limit records
 */
async function cleanupOldRecords(beforeTimestamp: number): Promise<void> {
  try {
    const cutoffDate = new Date(beforeTimestamp).toISOString()
    
    const { error } = await supabase
      .from('rate_limits')
      .delete()
      .lt('created_at', cutoffDate)
    
    if (error) {
      console.error('Error cleaning up rate limit records:', error)
    }
  } catch (error) {
    console.error('Error in cleanup:', error)
  }
}

/**
 * Check if an IP is rate limited for a specific operation
 */
export async function checkRateLimit(
  operation: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[operation]
  const key = `${operation}:${identifier}`
  
  return rateLimit(key, config.maxRequests, config.windowMs, { increment: false })
}

/**
 * Apply rate limit for a specific operation
 */
export async function applyRateLimit(
  operation: keyof typeof RATE_LIMITS,
  identifier: string,
  success?: boolean
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[operation]
  const key = `${operation}:${identifier}`
  
  const result = await rateLimit(key, config.maxRequests, config.windowMs)
  
  // Record success/failure if specified
  if (result.allowed && success !== undefined) {
    if (success) {
      await recordSuccess(key)
    } else {
      await recordFailure(key)
    }
  }
  
  return result
}

/**
 * Middleware factory for Next.js API routes
 */
export function createRateLimitMiddleware(
  operation: keyof typeof RATE_LIMITS,
  options: {
    keyGenerator?: (request: Request) => string
    onLimitReached?: (request: Request, result: RateLimitResult) => Response
    skipCondition?: (request: Request) => boolean
  } = {}
) {
  return async function rateLimitMiddleware(
    request: Request,
    next: () => Promise<Response>
  ): Promise<Response> {
    try {
      // Skip rate limiting if condition is met
      if (options.skipCondition?.(request)) {
        return next()
      }
      
      // Generate rate limit key
      const identifier = options.keyGenerator?.(request) || getClientIdentifier(request)
      
      // Check rate limit
      const result = await applyRateLimit(operation, identifier)
      
      if (!result.allowed) {
        // Handle rate limit exceeded
        if (options.onLimitReached) {
          return options.onLimitReached(request, result)
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: result.retryAfter,
            resetTime: result.resetTime
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': RATE_LIMITS[operation].maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': (result.retryAfter || 60).toString()
            }
          }
        )
      }
      
      // Add rate limit headers to successful response
      const response = await next()
      
      response.headers.set('X-RateLimit-Limit', RATE_LIMITS[operation].maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
      
      return response
      
    } catch (error) {
      console.error('Rate limit middleware error:', error)
      // Continue without rate limiting if middleware fails
      return next()
    }
  }
}

/**
 * Get rate limit status for multiple operations for an identifier
 */
export async function getRateLimitStatus(
  identifier: string,
  operations: Array<keyof typeof RATE_LIMITS>
): Promise<Record<string, RateLimitResult>> {
  const results: Record<string, RateLimitResult> = {}
  
  await Promise.all(
    operations.map(async (operation) => {
      try {
        const result = await checkRateLimit(operation, identifier)
        results[operation] = result
      } catch (error) {
        console.error(`Error checking rate limit for ${operation}:`, error)
        results[operation] = {
          allowed: true,
          count: 0,
          remaining: RATE_LIMITS[operation].maxRequests,
          resetTime: Date.now() + RATE_LIMITS[operation].windowMs
        }
      }
    })
  )
  
  return results
}

/**
 * Reset rate limits for an identifier (admin function)
 */
export async function resetRateLimit(
  identifier: string,
  operation?: keyof typeof RATE_LIMITS
): Promise<{ success: boolean; error?: string }> {
  try {
    let query = supabase.from('rate_limits').delete()
    
    if (operation) {
      query = query.like('key', `${operation}:${identifier}%`)
    } else {
      query = query.like('key', `%:${identifier}`)
    }
    
    const { error } = await query
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error resetting rate limit:', error)
    return { success: false, error: 'Failed to reset rate limit' }
  }
}

/**
 * Get rate limit statistics (admin function)
 */
export async function getRateLimitStats(
  timeframe: '1h' | '24h' | '7d' = '24h'
): Promise<{
  totalRequests: number
  blockedRequests: number
  topIPs: Array<{ ip: string; requests: number }>
  topOperations: Array<{ operation: string; requests: number }>
}> {
  try {
    const timeframeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[timeframe]
    
    const since = new Date(Date.now() - timeframeMs).toISOString()
    
    const { data: records, error } = await supabase
      .from('rate_limits')
      .select('key, count, successful, failed')
      .gte('created_at', since)
    
    if (error || !records) {
      throw error
    }
    
    const stats = {
      totalRequests: 0,
      blockedRequests: 0,
      topIPs: new Map<string, number>(),
      topOperations: new Map<string, number>()
    }
    
    for (const record of records) {
      const count = record.count || 1
      stats.totalRequests += count
      
      if (record.failed) {
        stats.blockedRequests += count
      }
      
      // Extract operation and IP from key (format: "operation:ip")
      const [operation, ...ipParts] = record.key.split(':')
      const ip = ipParts.join(':')
      
      stats.topIPs.set(ip, (stats.topIPs.get(ip) || 0) + count)
      stats.topOperations.set(operation, (stats.topOperations.get(operation) || 0) + count)
    }
    
    return {
      totalRequests: stats.totalRequests,
      blockedRequests: stats.blockedRequests,
      topIPs: Array.from(stats.topIPs.entries())
        .map(([ip, requests]) => ({ ip, requests }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10),
      topOperations: Array.from(stats.topOperations.entries())
        .map(([operation, requests]) => ({ operation, requests }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10)
    }
  } catch (error) {
    console.error('Error getting rate limit stats:', error)
    return {
      totalRequests: 0,
      blockedRequests: 0,
      topIPs: [],
      topOperations: []
    }
  }
}