// app/api/admin/faqs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '../../../../lib/admin-auth'
import { faqs as initialFaqs, categories } from '../../../../data/faqs'
import type { FAQ } from '../../../../data/faqs'

interface FAQData {
  faqs: FAQ[]
  categories: string[]
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

// Use shared FAQ data
const faqData = {
  faqs: [...initialFaqs], // Copy the array so we can modify it
  categories,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System',
  version: '1.0.0'
}

/**
 * GET /api/admin/faqs
 * Get all FAQs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 FAQs API: GET request received')
    
    // Use session-based authentication instead of header-based
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      console.log('❌ FAQs API: Authentication failed:', auth.error)
      return NextResponse.json(
        { 
          success: false, 
          error: auth.error || 'Authentication required',
          timestamp: new Date().toISOString() 
        } as ApiResponse,
        { status: 401 }
      )
    }

    console.log('✅ FAQs API: User authenticated:', auth.user.email)

    // Get URL parameters for filtering
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const visible = url.searchParams.get('visible')
    const search = url.searchParams.get('search')

    console.log('📋 FAQs API: Filtering - category:', category, 'visible:', visible, 'search:', search)

    // Apply filters if provided
    let filteredFAQs = faqData.faqs

    if (category && category !== 'All') {
      filteredFAQs = filteredFAQs.filter(faq => faq.category === category)
    }

    if (visible !== null) {
      const isVisible = visible === 'true'
      filteredFAQs = filteredFAQs.filter(faq => faq.isVisible === isVisible)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredFAQs = filteredFAQs.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower)
      )
    }

    // Sort by order
    filteredFAQs.sort((a, b) => a.order - b.order)

    const responseData = {
      ...faqData,
      faqs: filteredFAQs,
      totalVisible: faqData.faqs.filter(f => f.isVisible).length,
      totalHidden: faqData.faqs.filter(f => !f.isVisible).length
    }

    console.log('✅ FAQs API: Returning', filteredFAQs.length, 'FAQs')
    
    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof responseData>)

  } catch (error) {
    console.error('❌ FAQs GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/faqs
 * Save all FAQs
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 FAQs API: POST request received')
    
    // Use session-based authentication
    const auth = await validateAdminSession(request)
    
    if (!auth.success || !auth.user) {
      console.log('❌ FAQs API: Authentication failed:', auth.error)
      return NextResponse.json(
        { 
          success: false, 
          error: auth.error || 'Authentication required',
          timestamp: new Date().toISOString() 
        } as ApiResponse,
        { status: 401 }
      )
    }

    console.log('✅ FAQs API: User authenticated:', auth.user.email)

    // Parse request body
    const body = await request.json()
    const { faqs } = body

    console.log('📝 FAQs API: Save request for', faqs?.length || 0, 'FAQs')

    // Validate required fields
    if (!Array.isArray(faqs)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data - faqs must be an array', timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Validate FAQs structure
    const validationError = validateFAQs(faqs)
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError, timestamp: new Date().toISOString() } as ApiResponse,
        { status: 400 }
      )
    }

    // Update the in-memory data

faqData.faqs = faqs.map((faq: FAQ) => ({
  ...faq,
  lastModified: new Date().toISOString(),
  modifiedBy: auth.user!.name // Now TypeScript knows auth.user is not undefined
}))

faqData.categories = Array.from(new Set(faqs.map((faq: FAQ) => faq.category))).sort()
faqData.lastUpdated = new Date().toISOString()
faqData.updatedBy = auth.user.name // Safe to use now
faqData.version = incrementVersion(faqData.version)

    console.log('✅ FAQs API: FAQs updated successfully')
    console.log('📊 FAQs API: New FAQ count:', faqData.faqs.length)

    const responseData = {
      ...faqData,
      totalVisible: faqData.faqs.filter(f => f.isVisible).length,
      totalHidden: faqData.faqs.filter(f => !f.isVisible).length
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'FAQs saved successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse<typeof responseData>)

  } catch (error) {
    console.error('❌ FAQs POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', timestamp: new Date().toISOString() } as ApiResponse,
      { status: 500 }
    )
  }
}

// Helper functions
function validateFAQs(faqs: unknown[]): string | null {
  const seenIds = new Set<number>()
  
  for (const faq of faqs) {
    const faqObj = faq as Record<string, unknown>
    
    if (!faqObj.id || typeof faqObj.id !== 'number') {
      return 'Invalid FAQ ID'
    }
    
    if (seenIds.has(faqObj.id)) {
      return `Duplicate FAQ ID: ${faqObj.id}`
    }
    seenIds.add(faqObj.id)
    
    if (!faqObj.question || typeof faqObj.question !== 'string' || faqObj.question.trim().length === 0) {
      return 'Invalid FAQ question'
    }
    
    if (!faqObj.answer || typeof faqObj.answer !== 'string' || faqObj.answer.trim().length === 0) {
      return 'Invalid FAQ answer'
    }
    
    if (!faqObj.category || typeof faqObj.category !== 'string') {
      return 'Invalid FAQ category'
    }
    
    if (typeof faqObj.isVisible !== 'boolean') {
      return 'Invalid FAQ visibility flag'
    }
    
    if (!faqObj.order || typeof faqObj.order !== 'number' || faqObj.order < 1) {
      return 'Invalid FAQ order'
    }
  }
  
  return null
}

function incrementVersion(version: string): string {
  const parts = version.split('.')
  const patch = parseInt(parts[2] || '0') + 1
  return `${parts[0] || '1'}.${parts[1] || '0'}.${patch}`
}