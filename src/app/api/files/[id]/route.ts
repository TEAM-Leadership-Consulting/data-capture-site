// app/api/files/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const claimCode = searchParams.get('claim')
    const { id: documentId } = await params

    console.log(`🗑️ Deleting document ${documentId} for claim ${claimCode}`)

    if (!claimCode || !documentId) {
      return NextResponse.json(
        createApiResponse(false, null, 'Missing claim code or document ID'),
        { status: 400 }
      )
    }

    // Get document with storage path
    const { data: document, error: fetchError } = await supabase
      .from('claim_documents')
      .select('file_path, submission_id')
      .eq('id', documentId)
      .eq('is_active', true)
      .single()

    if (fetchError || !document) {
      console.log('❌ Document not found:', fetchError)
      return NextResponse.json(
        createApiResponse(false, null, 'Document not found'),
        { status: 404 }
      )
    }

    // Extract storage path from public URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/claim-documents/harmType/filename
    const urlParts = document.file_path.split('/')
    const bucketIndex = urlParts.findIndex((part: string) => part === 'claim-documents')
    
    if (bucketIndex === -1) {
      console.log('❌ Could not extract storage path from:', document.file_path)
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid file path'),
        { status: 400 }
      )
    }

    const storagePath = urlParts.slice(bucketIndex + 1).join('/')
    console.log(`📁 Storage path: ${storagePath}`)

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('claim-documents')
      .remove([storagePath])

    if (storageError) {
      console.log('⚠️ Storage deletion failed:', storageError)
      // Continue with database deletion even if storage fails
    } else {
      console.log('✅ File removed from storage')
    }

    // Soft delete from database
    const { error: deleteError } = await supabase
      .from('claim_documents')
      .update({ is_active: false })
      .eq('id', documentId)

    if (deleteError) {
      console.log('❌ Database deletion failed:', deleteError)
      return NextResponse.json(
        createApiResponse(false, null, 'Failed to delete document'),
        { status: 500 }
      )
    }

    console.log('✅ Document deleted successfully')

    return NextResponse.json(
      createApiResponse(true, { deleted: true }),
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Delete error:', error)
    return NextResponse.json(
      createApiResponse(false, null, 'Internal server error'),
      { status: 500 }
    )
  }
}