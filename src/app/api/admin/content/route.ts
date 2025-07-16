// app/api/admin/content/route.ts - SECURE PRODUCTION VERSION
import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, hasPermission } from '../../../../lib/admin-auth'
import { createRateLimitMiddleware, getClientIdentifier } from '../../../../lib/rate-limiter'
import { sanitizeFormData, SANITIZATION_CONFIGS, SanitizationConfig } from '../../../../lib/input-sanitizer'
import { supabase } from '../../../../lib/supabase'
import { createHash } from 'crypto'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ContentSection {
  id: string
  section_key: string
  title: string
  content: string
  content_type: 'text' | 'html' | 'number' | 'date'
  category: 'hero' | 'settlement' | 'contact' | 'footer' | 'general'
  is_required?: boolean
  max_length?: number
  placeholder?: string
  description?: string
  version?: number
  is_published?: boolean
  updated_at?: string
  updated_by?: string
  created_by?: string
}

interface ContentData {
  sections: ContentSection[]
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

interface SecurityEventData {
  message: string
  user_email?: string
  metadata?: Record<string, unknown>
  request?: NextRequest
}

interface ActivityLogData {
  level: 'info' | 'warning' | 'error'
  resource_type?: string
  resource_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  metadata?: Record<string, unknown>
  request?: NextRequest
}

interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Log security events for monitoring and audit
 */
async function logSecurityEvent(
  eventType: string, 
  data: SecurityEventData
): Promise<void> {
  try {
    console.warn(`[SECURITY] ${eventType}:`, {
      timestamp: new Date().toISOString(),
      type: eventType,
      ...data
    })
    
    // Insert into security_events table
    await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        message: data.message,
        user_email: data.user_email,
        ip_address: data.request ? getClientIdentifier(data.request) : null,
        user_agent: data.request?.headers.get('user-agent'),
        metadata: data.metadata || {},
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Log user activities for audit trail
 */
async function logActivity(
  action: string,
  description: string,
  userEmail: string,
  data: ActivityLogData
): Promise<void> {
  try {
    console.log(`[ACTIVITY] ${action}:`, {
      timestamp: new Date().toISOString(),
      action,
      description,
      user_email: userEmail,
      ...data
    })
    
    // Insert into activity_logs table
    await supabase
      .from('activity_logs')
      .insert({
        action,
        description,
        user_email: userEmail,
        level: data.level,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        old_values: data.old_values || {},
        new_values: data.new_values || {},
        ip_address: data.request ? getClientIdentifier(data.request) : null,
        user_agent: data.request?.headers.get('user-agent'),
        metadata: data.metadata || {},
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

/**
 * Type guard for error objects
 */
function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Safely extract error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message
  }
  return String(error)
}

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Rate limiting middleware
const rateLimitMiddleware = createRateLimitMiddleware('contentUpdate', {
  keyGenerator: (request) => getClientIdentifier(request),
  skipCondition: (request) => request.method === 'GET'
})

/**
 * Apply security middleware wrapper
 */
async function withSecurityMiddleware(
  request: NextRequest,
  handler: (request: NextRequest, context: { user: AuthenticatedUser }) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, async () => {
      return new NextResponse(null, { status: 200 })
    })
    
    if (rateLimitResponse.status === 429) {
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers
      })
    }
    
    // Authentication
    const authResult = await validateAdminSession(request)
    if (!authResult.success || !authResult.user) {
      await logSecurityEvent('unauthorized_access', {
        message: 'Unauthorized access attempt to content API',
        request
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized', 
          timestamp: new Date().toISOString() 
        } as ApiResponse,
        { status: 401 }
      )
    }
    
    // Execute handler with authenticated user context
    return handler(request, { user: authResult.user })
    
  } catch (error) {
    console.error('Security middleware error:', error)
    await logSecurityEvent('security_error', {
      message: 'Security middleware error',
      metadata: { error: getErrorMessage(error) },
      request
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Security error', 
        timestamp: new Date().toISOString() 
      } as ApiResponse,
      { status: 500 }
    )
  }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET - Retrieve content sections
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return withSecurityMiddleware(request, async (req, { user }) => {
    try {
      // Check permissions
      if (!hasPermission(user, 'content:read')) {
        await logSecurityEvent('unauthorized_access', {
          message: `User ${user.email} attempted to read content without permission`,
          user_email: user.email,
          request: req
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient permissions', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 403 }
        )
      }
      
      // Fetch content sections from database
      const { data: sections, error } = await supabase
        .from('content_sections')
        .select(`
          id,
          section_key,
          title,
          content,
          content_type,
          category,
          is_required,
          max_length,
          placeholder,
          description,
          version,
          is_published,
          updated_at,
          updated_by
        `)
        .eq('is_published', true)
        .order('category', { ascending: true })
        .order('title', { ascending: true })
      
      if (error) {
        console.error('Database error fetching content:', error)
        await logActivity('content_view', 'Failed to fetch content sections', user.email, {
          level: 'error',
          metadata: { error: error.message },
          request: req
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to retrieve content', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 500 }
        )
      }
      
      // Get the latest update info
      const lastUpdated = sections.length > 0 
        ? Math.max(...sections.map(s => new Date(s.updated_at || 0).getTime()))
        : Date.now()
      
      const contentData: ContentData = {
        sections: sections || [],
        lastUpdated: new Date(lastUpdated).toISOString(),
        updatedBy: sections.find(s => s.updated_by)?.updated_by || 'System',
        version: '1.0.0' // Could be calculated from max version
      }
      
      // Log successful access
      await logActivity('content_view', 'Content sections retrieved', user.email, {
        level: 'info',
        metadata: { sectionCount: sections?.length || 0 },
        request: req
      })
      
      return NextResponse.json({
        success: true,
        data: contentData,
        timestamp: new Date().toISOString()
      } as ApiResponse<ContentData>)
      
    } catch (error) {
      console.error('Content GET error:', error)
      await logActivity('content_view', 'Content retrieval error', user.email, {
        level: 'error',
        metadata: { error: getErrorMessage(error) },
        request: req
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error', 
          timestamp: new Date().toISOString() 
        } as ApiResponse,
        { status: 500 }
      )
    }
  })
}

/**
 * POST - Create new content section
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return withSecurityMiddleware(request, async (req, { user }) => {
    try {
      // Check permissions
      if (!hasPermission(user, 'content:edit')) {
        await logSecurityEvent('unauthorized_access', {
          message: `User ${user.email} attempted to create content without permission`,
          user_email: user.email,
          request: req
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient permissions', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 403 }
        )
      }
      
      // Parse and sanitize request body
      const body = await req.json()
      const clientIp = getClientIdentifier(req)
      
      const sanitizationConfig: Record<string, SanitizationConfig> = {
        title: { ...SANITIZATION_CONFIGS.name },
        content: body.content_type === 'html' 
          ? {
              ...SANITIZATION_CONFIGS.richText,
              allowedTags: [...SANITIZATION_CONFIGS.richText.allowedTags],
              allowedAttributes: Object.fromEntries(
                Object.entries(SANITIZATION_CONFIGS.richText.allowedAttributes).map(
                  ([key, value]) => [key, [...value]]
                )
              )
            }
          : { ...SANITIZATION_CONFIGS.text },
        section_key: { ...SANITIZATION_CONFIGS.text },
        description: { ...SANITIZATION_CONFIGS.text },
        placeholder: { ...SANITIZATION_CONFIGS.text }
      }
      
      const sanitizationResult = await sanitizeFormData(
        body, 
        sanitizationConfig,
        { userIp: clientIp, userId: user.id }
      )
      
      if (Object.keys(sanitizationResult.threats).length > 0) {
        await logSecurityEvent('malicious_content', {
          message: 'Malicious content detected in content creation request',
          user_email: user.email,
          metadata: { threats: sanitizationResult.threats },
          request: req
        })
      }
      
      const sanitizedData = sanitizationResult.sanitized
      
      // Validate required fields
      const requiredFields = ['section_key', 'title', 'content', 'content_type', 'category']
      const missingFields = requiredFields.filter(field => !sanitizedData[field])
      
      if (missingFields.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Missing required fields: ${missingFields.join(', ')}`, 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 400 }
        )
      }
      
      // Check if section_key already exists
      const { data: existingSection } = await supabase
        .from('content_sections')
        .select('id')
        .eq('section_key', sanitizedData.section_key)
        .single()
      
      if (existingSection) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Section key already exists', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 409 }
        )
      }
      
      // Create new section
      const { data: newSection, error } = await supabase
        .from('content_sections')
        .insert({
          section_key: sanitizedData.section_key,
          title: sanitizedData.title,
          content: sanitizedData.content,
          content_type: sanitizedData.content_type,
          category: sanitizedData.category,
          is_required: sanitizedData.is_required || false,
          max_length: sanitizedData.max_length,
          placeholder: sanitizedData.placeholder,
          description: sanitizedData.description,
          created_by: user.id,
          updated_by: user.id,
          is_published: false, // New sections start as draft
          version: 1
        })
        .select()
        .single()
      
      if (error) {
        console.error('Database error creating content section:', error)
        await logActivity('content_update', 'Failed to create content section', user.email, {
          level: 'error',
          metadata: { error: error.message, section_key: sanitizedData.section_key },
          request: req
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create content section', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 500 }
        )
      }
      
      // Create version history entry
      await supabase
        .from('content_versions')
        .insert({
          section_id: newSection.id,
          version: 1,
          title: newSection.title,
          content: newSection.content,
          content_hash: createHash('sha256')
            .update(newSection.content)
            .digest('hex'),
          change_summary: 'Initial creation',
          created_by: user.id
        })
      
      // Log successful creation
      await logActivity('content_update', 'Content section created', user.email, {
        level: 'info',
        resource_type: 'content_section',
        resource_id: newSection.id,
        new_values: { 
          section_key: newSection.section_key, 
          title: newSection.title,
          category: newSection.category
        },
        request: req
      })
      
      return NextResponse.json({
        success: true,
        data: newSection,
        message: 'Content section created successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<ContentSection>)
      
    } catch (error) {
      console.error('Content POST error:', error)
      await logActivity('content_update', 'Content creation error', user.email, {
        level: 'error',
        metadata: { error: getErrorMessage(error) },
        request: req
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error', 
          timestamp: new Date().toISOString() 
        } as ApiResponse,
        { status: 500 }
      )
    }
  })
}

/**
 * PUT - Update existing content section
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  return withSecurityMiddleware(request, async (req, { user }) => {
    try {
      // Check permissions
      if (!hasPermission(user, 'content:edit')) {
        await logSecurityEvent('unauthorized_access', {
          message: `User ${user.email} attempted to update content without permission`,
          user_email: user.email,
          request: req
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient permissions', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 403 }
        )
      }
      
      // Parse and sanitize request body
      const body = await req.json()
      const clientIp = getClientIdentifier(req)
      
      const sanitizationConfig: Record<string, SanitizationConfig> = {
        title: { ...SANITIZATION_CONFIGS.name },
        content: body.content_type === 'html' 
          ? {
              ...SANITIZATION_CONFIGS.richText,
              allowedTags: [...SANITIZATION_CONFIGS.richText.allowedTags],
              allowedAttributes: Object.fromEntries(
                Object.entries(SANITIZATION_CONFIGS.richText.allowedAttributes).map(
                  ([key, value]) => [key, [...value]]
                )
              )
            }
          : { ...SANITIZATION_CONFIGS.text },
        description: { ...SANITIZATION_CONFIGS.text },
        placeholder: { ...SANITIZATION_CONFIGS.text }
      }
      
      const sanitizationResult = await sanitizeFormData(
        body, 
        sanitizationConfig,
        { userIp: clientIp, userId: user.id }
      )
      
      const sanitizedData = sanitizationResult.sanitized
      
      if (!sanitizedData.id) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Section ID is required', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 400 }
        )
      }
      
      // Get existing section for comparison
      const { data: existingSection, error: fetchError } = await supabase
        .from('content_sections')
        .select('*')
        .eq('id', sanitizedData.id)
        .single()
      
      if (fetchError || !existingSection) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Content section not found', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 404 }
        )
      }
      
      // Update section
      const { data: updatedSection, error: updateError } = await supabase
        .from('content_sections')
        .update({
          title: sanitizedData.title || existingSection.title,
          content: sanitizedData.content || existingSection.content,
          content_type: sanitizedData.content_type || existingSection.content_type,
          category: sanitizedData.category || existingSection.category,
          is_required: sanitizedData.is_required ?? existingSection.is_required,
          max_length: sanitizedData.max_length ?? existingSection.max_length,
          placeholder: sanitizedData.placeholder ?? existingSection.placeholder,
          description: sanitizedData.description ?? existingSection.description,
          updated_by: user.id,
          version: existingSection.version + 1
        })
        .eq('id', sanitizedData.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Database error updating content section:', updateError)
        await logActivity('content_update', 'Failed to update content section', user.email, {
          level: 'error',
          metadata: { error: updateError.message, section_id: sanitizedData.id },
          request: req
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to update content section', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 500 }
        )
      }
      
      // Create version history entry if content changed
      if (existingSection.content !== updatedSection.content) {
        await supabase
          .from('content_versions')
          .insert({
            section_id: updatedSection.id,
            version: updatedSection.version,
            title: updatedSection.title,
            content: updatedSection.content,
            content_hash: createHash('sha256')
              .update(updatedSection.content)
              .digest('hex'),
            change_summary: sanitizedData.change_summary || 'Content updated',
            created_by: user.id
          })
      }
      
      // Log successful update
      await logActivity('content_update', 'Content section updated', user.email, {
        level: 'info',
        resource_type: 'content_section',
        resource_id: updatedSection.id,
        old_values: { 
          title: existingSection.title,
          content: existingSection.content.substring(0, 100) + '...'
        },
        new_values: { 
          title: updatedSection.title,
          content: updatedSection.content.substring(0, 100) + '...'
        },
        request: req
      })
      
      return NextResponse.json({
        success: true,
        data: updatedSection,
        message: 'Content section updated successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<ContentSection>)
      
    } catch (error) {
      console.error('Content PUT error:', error)
      await logActivity('content_update', 'Content update error', user.email, {
        level: 'error',
        metadata: { error: getErrorMessage(error) },
        request: req
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error', 
          timestamp: new Date().toISOString() 
        } as ApiResponse,
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE - Delete content section
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return withSecurityMiddleware(request, async (req, { user }) => {
    try {
      // Check permissions - only owners and admins can delete
      if (!hasPermission(user, 'content:delete') && !['owner', 'admin'].includes(user.role)) {
        await logSecurityEvent('unauthorized_access', {
          message: `User ${user.email} attempted to delete content without permission`,
          user_email: user.email,
          request: req
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient permissions', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 403 }
        )
      }
      
      const { searchParams } = new URL(req.url)
      const sectionId = searchParams.get('id')
      
      if (!sectionId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Section ID is required', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 400 }
        )
      }
      
      // Get section info before deletion
      const { data: sectionToDelete } = await supabase
        .from('content_sections')
        .select('*')
        .eq('id', sectionId)
        .single()
      
      if (!sectionToDelete) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Content section not found', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 404 }
        )
      }
      
      // Check if section is required
      if (sectionToDelete.is_required) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete required content section', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 400 }
        )
      }
      
      // Delete section (this will cascade to version history)
      const { error: deleteError } = await supabase
        .from('content_sections')
        .delete()
        .eq('id', sectionId)
      
      if (deleteError) {
        console.error('Database error deleting content section:', deleteError)
        await logActivity('content_update', 'Failed to delete content section', user.email, {
          level: 'error',
          metadata: { error: deleteError.message, section_id: sectionId },
          request: req
        })
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to delete content section', 
            timestamp: new Date().toISOString() 
          } as ApiResponse,
          { status: 500 }
        )
      }
      
      // Log successful deletion
      await logActivity('content_update', 'Content section deleted', user.email, {
        level: 'warning',
        resource_type: 'content_section',
        resource_id: sectionId,
        old_values: { 
          section_key: sectionToDelete.section_key,
          title: sectionToDelete.title,
          category: sectionToDelete.category
        },
        request: req
      })
      
      return NextResponse.json({
        success: true,
        message: 'Content section deleted successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse)
      
    } catch (error) {
      console.error('Content DELETE error:', error)
      await logActivity('content_update', 'Content deletion error', user.email, {
        level: 'error',
        metadata: { error: getErrorMessage(error) },
        request: req
      })
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error', 
          timestamp: new Date().toISOString() 
        } as ApiResponse,
        { status: 500 }
      )
    }
  })
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}