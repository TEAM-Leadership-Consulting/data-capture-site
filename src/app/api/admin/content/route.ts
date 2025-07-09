// app/api/admin/content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, hasPermission } from '../../../../lib/admin-auth'

// Types for content management
interface ContentSection {
  id: string
  title: string
  content: string
  type: 'text' | 'html' | 'number' | 'date'
  category: 'hero' | 'settlement' | 'contact' | 'footer' | 'general'
  required?: boolean
  maxLength?: number
  placeholder?: string
  description?: string
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

// Simple in-memory storage for demo (replace with database in production)
let contentData: ContentData = {
  sections: [
    {
      id: 'hero-title',
      title: 'Main Headline',
      content: 'Bob Johnson vs Smith & Jones, LLC',
      type: 'text',
      category: 'hero',
      required: true,
      maxLength: 100,
      description: 'The main title displayed on the homepage'
    },
    {
      id: 'hero-subtitle',
      title: 'Subtitle',
      content: 'Case No. C-16-CV-24-001546',
      type: 'text',
      category: 'hero',
      required: true,
      maxLength: 200,
      description: 'Subtitle or case number displayed below the main title'
    },
    {
      id: 'settlement-description',
      title: 'Settlement Description',
      content: 'This website provides information about the Bob Johnson vs Smith & Jones, LLC class action settlement.',
      type: 'html',
      category: 'settlement',
      required: true,
      description: 'Main description of the settlement on the homepage'
    },
    {
      id: 'contact-email',
      title: 'Contact Email',
      content: 'info@settlementadmin.com',
      type: 'text',
      category: 'contact',
      required: true,
      description: 'Email address for settlement inquiries'
    },
    {
      id: 'contact-phone',
      title: 'Contact Phone',
      content: '1-800-555-0123',
      type: 'text',
      category: 'contact',
      required: true,
      description: 'Phone number for settlement inquiries'
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
 * GET /api/admin/content
 * Get all content sections
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Content API: Validating admin session...')
    
    // Validate authentication with Supabase
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      console.log('❌ Content API: Authentication failed')
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication failed', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    console.log('✅ Content API: User authenticated:', auth.user.email)

    // Check permissions
    if (!hasPermission(auth.user.role, 'edit_content')) {
      logSecurityEvent('unauthorized_access', auth.user.email, getClientIP(request), {
        action: 'get_content',
        reason: 'insufficient_permissions'
      })
      
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    console.log('✅ Content API: Permissions verified, returning content')

    // Return content data
    return NextResponse.json({
      success: true,
      data: contentData,
      timestamp: new Date().toISOString()
    } as ApiResponse<ContentData>)

  } catch (error) {
    console.error('❌ Content GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/content
 * Save content sections
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Content API: Validating admin session for save...')
    
    // Validate authentication with Supabase
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      console.log('❌ Content API: Authentication failed')
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication failed', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    console.log('✅ Content API: User authenticated:', auth.user.email)

    // Check permissions
    if (!hasPermission(auth.user.role, 'edit_content')) {
      logSecurityEvent('unauthorized_access', auth.user.email, getClientIP(request), {
        action: 'save_content',
        reason: 'insufficient_permissions'
      })
      
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { sections } = body

    console.log('📝 Content API: Save request for', sections?.length || 0, 'sections')

    // Validate required fields
    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data - sections must be an array', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Validate sections structure
    const validationError = validateSections(sections)
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError, timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Store previous content for logging
    const previousContent = { ...contentData }

    // Create updated content data
    const updatedContent: ContentData = {
      sections,
      lastUpdated: new Date().toISOString(),
      updatedBy: auth.user.name,
      version: incrementVersion(contentData.version)
    }

    // Save content
    contentData = updatedContent

    // Log the changes
    const changes = getContentChanges(previousContent.sections, sections)
    logActivity(
      'content',
      `Content updated by ${auth.user.name}. ${changes.length} sections modified.`,
      auth.user.email,
      getClientIP(request),
      { 
        sectionsModified: changes.length,
        changes: changes.slice(0, 10), // Log first 10 changes to avoid huge logs
        totalSections: sections.length
      }
    )

    // Log security event for audit trail
    logSecurityEvent('content_updated', auth.user.email, getClientIP(request), {
      sectionsCount: sections.length,
      changesCount: changes.length,
      updatedBy: auth.user.name
    })

    console.log(`✅ Content API: Content saved successfully (${changes.length} changes)`)

    return NextResponse.json({
      success: true,
      data: updatedContent,
      message: 'Content saved successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<ContentData>)

  } catch (error) {
    console.error('❌ Content POST error:', error)
    logActivity(
      'system',
      `Failed to save content: ${error}`,
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
 * PUT /api/admin/content
 * Update a specific content section
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Content API: Validating admin session for section update...')
    
    // Validate authentication with Supabase
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Authentication failed', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 401 }
      )
    }

    // Check permissions
    if (!hasPermission(auth.user.role, 'edit_content')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { sectionId, content } = body

    console.log('📝 Content API: Update request for section:', sectionId)

    // Validate required fields
    if (!sectionId || content === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (sectionId, content)', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Find and update the specific section
    const sectionIndex = contentData.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Section not found', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 404 }
      )
    }

    const oldContent = contentData.sections[sectionIndex].content
    contentData.sections[sectionIndex].content = content
    contentData.lastUpdated = new Date().toISOString()
    contentData.updatedBy = auth.user.name

    // Log the specific change
    logActivity(
      'content',
      `Section "${contentData.sections[sectionIndex].title}" updated by ${auth.user.name}`,
      auth.user.email,
      getClientIP(request),
      { 
        sectionId,
        sectionTitle: contentData.sections[sectionIndex].title,
        oldContent: oldContent.substring(0, 100) + (oldContent.length > 100 ? '...' : ''),
        newContent: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      }
    )

    console.log(`✅ Content API: Section "${contentData.sections[sectionIndex].title}" updated`)

    return NextResponse.json({
      success: true,
      data: contentData,
      message: 'Section updated successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<ContentData>)

  } catch (error) {
    console.error('❌ Content PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * Validate content sections structure
 */
function validateSections(sections: unknown[]): string | null {
  for (const section of sections) {
    const sectionObj = section as Record<string, unknown>
    
    if (!sectionObj.id || typeof sectionObj.id !== 'string') {
      return 'Invalid section ID'
    }
    
    if (!sectionObj.title || typeof sectionObj.title !== 'string') {
      return 'Invalid section title'
    }
    
    if (sectionObj.content === undefined || typeof sectionObj.content !== 'string') {
      return 'Invalid section content'
    }
    
    if (!['text', 'html', 'number', 'date'].includes(sectionObj.type as string)) {
      return 'Invalid section type'
    }
    
    if (!['hero', 'settlement', 'contact', 'footer', 'general'].includes(sectionObj.category as string)) {
      return 'Invalid section category'
    }
    
    // Validate required sections have content
    if (sectionObj.required && !(sectionObj.content as string).trim()) {
      return `Required section "${sectionObj.title}" cannot be empty`
    }
    
    // Validate content length if maxLength is specified
    if (sectionObj.maxLength && (sectionObj.content as string).length > (sectionObj.maxLength as number)) {
      return `Section "${sectionObj.title}" exceeds maximum length of ${sectionObj.maxLength} characters`
    }
  }
  
  return null
}

/**
 * Compare old and new sections to identify changes
 */
function getContentChanges(oldSections: ContentSection[], newSections: ContentSection[]) {
  const changes: Array<{
    sectionId: string
    sectionTitle: string
    type: 'modified' | 'added' | 'removed'
    oldContent?: string
    newContent?: string
  }> = []

  // Check for modified and added sections
  for (const newSection of newSections) {
    const oldSection = oldSections.find(s => s.id === newSection.id)
    
    if (!oldSection) {
      changes.push({
        sectionId: newSection.id,
        sectionTitle: newSection.title,
        type: 'added',
        newContent: newSection.content
      })
    } else if (oldSection.content !== newSection.content) {
      changes.push({
        sectionId: newSection.id,
        sectionTitle: newSection.title,
        type: 'modified',
        oldContent: oldSection.content,
        newContent: newSection.content
      })
    }
  }

  // Check for removed sections
  for (const oldSection of oldSections) {
    const newSection = newSections.find(s => s.id === oldSection.id)
    
    if (!newSection) {
      changes.push({
        sectionId: oldSection.id,
        sectionTitle: oldSection.title,
        type: 'removed',
        oldContent: oldSection.content
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}