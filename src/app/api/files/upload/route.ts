// app/api/files/upload/route.ts
// Enterprise-level secure file upload API endpoint
// Handles claim document uploads with full validation and security

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// ==========================================
// CONFIGURATION CONSTANTS
// ==========================================

const CONFIG = {
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024, // 100MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    'video/mp4', 'video/mov', 'video/avi',
    'audio/mp3', 'audio/wav', 'audio/m4a'
  ] as const,
  STORAGE_BUCKET: 'claim-documents',
  MAX_FILES_PER_CATEGORY: 5,
} as const

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

interface UploadedDocumentResponse {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: string
  fileHash: string
}

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const uploadRequestSchema = z.object({
  claimCode: z.string().min(1, 'Claim code is required'),
  harmType: z.enum(['emotionalDistress', 'transactionDelayed', 'creditDenied', 'unableToComplete', 'other'])
})

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Generate SHA-256 hash for file integrity verification
 */
async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate file against security and business rules
 */
function validateFile(file: File): { isValid: boolean; error?: string } {
  // Size validation
  if (file.size > CONFIG.MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
    }
  }

  // Empty file check
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'Empty files are not allowed'
    }
  }

  // MIME type validation
  if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type as typeof CONFIG.ALLOWED_FILE_TYPES[number])) {
    return {
      isValid: false,
      error: `File type '${file.type}' is not allowed`
    }
  }

  // Filename validation (security)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      isValid: false,
      error: 'Invalid filename detected'
    }
  }

  return { isValid: true }
}

/**
 * Create API response with consistent format
 */
function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  errorCode?: string,
  metadata?: Record<string, unknown>
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    errorCode,
    timestamp: new Date().toISOString(),
    metadata
  }
}

// ==========================================
// CORE BUSINESS LOGIC
// ==========================================

/**
 * Validate claim exists and is active
 */
async function validateClaimCode(claimCode: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    const { data: claim, error } = await supabase
      .from('claims')
      .select('unique_code, is_active, is_used, expires_at')
      .eq('unique_code', claimCode)
      .single()

    if (error || !claim) {
      return { isValid: false, error: 'Invalid claim code' }
    }

    if (!claim.is_active) {
      return { isValid: false, error: 'Claim is not active' }
    }

    if (claim.is_used) {
      return { isValid: false, error: 'Claim has already been used' }
    }

    if (claim.expires_at && new Date(claim.expires_at) < new Date()) {
      return { isValid: false, error: 'Claim has expired' }
    }

    return { isValid: true }
  } catch (error) {
    console.error('❌ Claim validation error:', error)
    return { isValid: false, error: 'Failed to validate claim' }
  }
}

/**
 * Get or create draft submission for file association
 */
async function getDraftSubmissionId(claimCode: string): Promise<string> {
  try {
    // Check for existing draft submission
    const { data: existingSubmission, error: fetchError } = await supabase
      .from('claim_submissions')
      .select('id')
      .eq('unique_code', claimCode)
      .eq('status', 'draft')
      .single()

    if (existingSubmission && !fetchError) {
      console.log(`📋 Using existing draft submission: ${existingSubmission.id}`)
      return existingSubmission.id
    }

    // Create new draft submission
    console.log(`📝 Creating new draft submission for claim: ${claimCode}`)
    const { data: newSubmission, error: createError } = await supabase
      .from('claim_submissions')
      .insert({
        unique_code: claimCode,
        form_data: {},
        status: 'draft',
        user_agent: 'File Upload API',
        validation_status: { isValid: false },
        validation_errors: []
      })
      .select('id')
      .single()

    if (createError) {
      throw new Error(`Failed to create draft submission: ${createError.message}`)
    }

    console.log(`✅ Created draft submission: ${newSubmission.id}`)
    return newSubmission.id

  } catch (error) {
    console.error('❌ Error getting draft submission:', error)
    throw new Error('Failed to get or create draft submission')
  }
}

/**
 * Check for duplicate files to prevent re-uploads
 */
async function checkForDuplicateFile(
  submissionId: string,
  fileHash: string
): Promise<{ isDuplicate: boolean; existingFile?: { id: string; file_path: string; file_name: string } }> {
  try {
    const { data: existingFiles, error } = await supabase
      .from('claim_documents')
      .select('id, file_path, file_name')
      .eq('file_hash', fileHash)
      .eq('submission_id', submissionId) 
      .eq('is_active', true)
      .limit(1)

    if (error) {
      console.error('❌ Duplicate check error:', error)
      throw new Error('Failed to check for duplicate files')
    }

    return {
      isDuplicate: existingFiles && existingFiles.length > 0,
      existingFile: existingFiles?.[0]
    }
  } catch (error) {
    console.error('❌ Duplicate check error:', error)
    throw error
  }
}

/**
 * Upload file to Supabase storage with secure path generation
 */
async function uploadToStorage(
  file: File,
  claimCode: string,
  harmType: string
): Promise<{ storagePath: string; publicUrl: string }> {
  try {
    // Generate secure file path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const sanitizedHarmType = harmType.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `${claimCode}-${sanitizedHarmType}-${timestamp}.${fileExt}`
    const storagePath = `${sanitizedHarmType}/${fileName}`

    console.log(`📁 Uploading to storage path: ${storagePath}`)

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(CONFIG.STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Generate public URL
    const { data: { publicUrl } } = supabase.storage
      .from(CONFIG.STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    console.log('✅ File uploaded to storage successfully')
    return { storagePath, publicUrl }

  } catch (error) {
    console.error('❌ Storage upload error:', error)
    throw error
  }
}

/**
 * Store document metadata in database
 */
async function storeDocumentMetadata(
  submissionId: string,
  file: File,
  fileHash: string,
  storagePath: string,
  publicUrl: string,
  harmType: string
): Promise<{
  id: string;
  file_name: string;
  uploaded_at: string;
  [key: string]: unknown;
}> {
  try {
    const documentData = {
      submission_id: submissionId, // Fixed: use correct column name
      file_name: file.name,
      file_path: publicUrl,
      file_size: file.size,
      file_type: file.type,
      upload_category: harmType,
      uploaded_at: new Date().toISOString(),
      is_active: true, 
     }

    console.log('💾 Storing document metadata...')
    const { data: document, error: dbError } = await supabase
      .from('claim_documents')
      .insert(documentData)
      .select('*')
      .single()

    if (dbError) {
      console.error('❌ Database insert error:', dbError)
      throw new Error(`Failed to store document metadata: ${dbError.message}`)
    }

    console.log('✅ Document metadata stored successfully')
    return document

  } catch (error) {
    console.error('❌ Database storage error:', error)
    throw error
  }
}

// ==========================================
// MAIN API HANDLER
// ==========================================

/**
 * POST /api/files/upload
 * Secure file upload endpoint for claim documents
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('🚀 API Route called')
  console.log('🚀 File upload API: Processing upload request...')

  try {
    // ==========================================
    // REQUEST PARSING AND VALIDATION
    // ==========================================

    const formData = await request.formData()
    const file = formData.get('file') as File
    const claimCode = formData.get('claimCode') as string
    const harmType = formData.get('harmType') as string

    // Validate required fields
    if (!file || !claimCode || !harmType) {
      return NextResponse.json(
        createApiResponse(false, null, 'Missing required fields: file, claimCode, and harmType are required', 'MISSING_FIELDS'),
        { status: 400 }
      )
    }

    // Validate request schema
    const validation = uploadRequestSchema.safeParse({ claimCode, harmType })
    if (!validation.success) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid request parameters', 'VALIDATION_ERROR', {
          validationErrors: validation.error.errors
        }),
        { status: 400 }
      )
    }

    // ==========================================
    // FILE VALIDATION
    // ==========================================

    const fileValidation = validateFile(file)
    if (!fileValidation.isValid) {
      return NextResponse.json(
        createApiResponse(false, null, fileValidation.error, 'FILE_VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // ==========================================
    // SECURITY CHECKS
    // ==========================================

    // Validate claim code
    const claimValidation = await validateClaimCode(claimCode)
    if (!claimValidation.isValid) {
      return NextResponse.json(
        createApiResponse(false, null, claimValidation.error, 'CLAIM_VALIDATION_ERROR'),
        { status: 403 }
      )
    }

    // Generate file hash for integrity and duplicate detection
    const fileHash = await generateFileHash(file)
    console.log(`🔍 File hash generated: ${fileHash}`)

    // ==========================================
    // BUSINESS LOGIC EXECUTION
    // ==========================================

    // Get or create draft submission
    const submissionId = await getDraftSubmissionId(claimCode)
    console.log(`🆔 Using submission ID: ${submissionId}`)

    // Check for duplicate files
    const duplicateCheck = await checkForDuplicateFile(submissionId, fileHash)
    if (duplicateCheck.isDuplicate) {
      console.log(`ℹ️ Duplicate file detected: ${file.name}`)
      return NextResponse.json(
        createApiResponse(false, null, `File "${file.name}" has already been uploaded`, 'DUPLICATE_FILE'),
        { status: 409 }
      )
    }

    // Upload to storage
    const { storagePath, publicUrl } = await uploadToStorage(file, claimCode, harmType)

    // Store metadata in database
    const documentRecord = await storeDocumentMetadata(
      submissionId,
      file,
      fileHash,
      storagePath,
      publicUrl,
      harmType
    )

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    const responseData: UploadedDocumentResponse = {
      id: documentRecord.id,
      name: file.name,
      url: `/api/files/${documentRecord.id}?claim=${claimCode}`, // Secure access URL
      size: file.size,
      uploadedAt: documentRecord.uploaded_at,
      fileHash
    }

    console.log('✅ File upload completed successfully')

    return NextResponse.json(
      createApiResponse(true, { document: responseData }, undefined, undefined, {
        uploadStats: {
          fileSize: file.size,
          fileName: file.name,
          harmType,
          processingTime: Date.now()
        }
      }),
      { status: 201 }
    )

  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================

    console.error('❌ File upload API error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const isServerError = !errorMessage.includes('validation') && !errorMessage.includes('Invalid')

    return NextResponse.json(
      createApiResponse(false, null, errorMessage, 'UPLOAD_ERROR', {
        errorType: isServerError ? 'server_error' : 'client_error'
      }),
      { status: isServerError ? 500 : 400 }
    )
  }
}

// ==========================================
// ADDITIONAL HTTP METHODS (SECURITY)
// ==========================================

export async function GET() {
  return NextResponse.json(
    createApiResponse(false, null, 'Method not allowed', 'METHOD_NOT_ALLOWED'),
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    createApiResponse(false, null, 'Method not allowed', 'METHOD_NOT_ALLOWED'),
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    createApiResponse(false, null, 'Method not allowed', 'METHOD_NOT_ALLOWED'),
    { status: 405 }
  )
}