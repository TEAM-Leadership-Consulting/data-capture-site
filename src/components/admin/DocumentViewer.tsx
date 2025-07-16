// components/admin/DocumentViewer.tsx - FIXED TO WORK WITH YOUR EXISTING CODEBASE
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Download, Trash2, FileText, Image, AlertCircle } from 'lucide-react'

// FIXED: Import from your existing types file that matches your actual database
import type { ClaimDocument, DocumentCategory } from '../../types/documents'
// FIXED: Import supabase client directly to avoid schema mismatch
import { supabase } from '../../lib/supabase'
// FIXED: Import from your existing admin auth (using only existing exports)
import { getCurrentAdminSession } from '../../lib/admin-auth'

interface DocumentViewerProps {
  submissionId: string  // FIXED: Using your actual database column name
  uniqueCode: string
  canDelete?: boolean
  canDownload?: boolean
}

// FIXED: Extend your actual ClaimDocument interface
interface DocumentWithUrl extends ClaimDocument {
  downloadUrl?: string
  isLoadingUrl?: boolean
}

// FIXED: Document category labels that work with your existing types
const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  emotionalDistress: 'Emotional Distress Documentation',
  transactionDelayed: 'Transaction Delayed Documentation',
  creditDenied: 'Credit Denied Documentation',
  unableToComplete: 'Unable to Complete Transaction Documentation',
  other: 'Other Supporting Documentation'
}

// FIXED: Document functions that use your actual database schema
async function getClaimDocumentsWithCorrectSchema(submissionId: string): Promise<ClaimDocument[]> {
  try {
    console.log(`[getClaimDocuments] Fetching documents for submission: ${submissionId}`)
    
    const { data, error } = await supabase
      .from('claim_documents')
      .select('*')
      .eq('submission_id', submissionId)  // Your actual column name
      .eq('is_active', true)              // Your actual column name
      .order('uploaded_at', { ascending: false })
    
    if (error) {
      console.error('[getClaimDocuments] Database error:', error)
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }
    
    console.log(`[getClaimDocuments] Retrieved ${data?.length || 0} documents`)
    return (data as ClaimDocument[]) || []
    
  } catch (error) {
    console.error('[getClaimDocuments] Error:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred while fetching documents')
  }
}

async function getDocumentDownloadUrlWithCorrectSchema(filePath: string): Promise<string | null> {
  try {
    console.log(`[getDocumentDownloadUrl] Generating URL for path: ${filePath}`)
    
    const { data, error } = await supabase.storage
      .from('claim-documents')
      .createSignedUrl(filePath, 3600)
    
    if (error) {
      console.error('[getDocumentDownloadUrl] Error:', error)
      throw new Error(`Failed to generate download URL: ${error.message}`)
    }
    
    console.log('[getDocumentDownloadUrl] Successfully generated signed URL')
    return data.signedUrl
    
  } catch (error) {
    console.error('[getDocumentDownloadUrl] Error:', error)
    return null
  }
}

async function deleteClaimDocumentWithCorrectSchema(documentId: string): Promise<boolean> {
  try {
    console.log(`[deleteClaimDocument] Soft deleting document: ${documentId}`)
    
    const { error } = await supabase
      .from('claim_documents')
      .update({
        is_active: false,  // Your actual column name
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
    
    if (error) {
      console.error('[deleteClaimDocument] Error:', error)
      throw new Error(`Failed to delete document: ${error.message}`)
    }
    
    console.log('[deleteClaimDocument] Document soft deleted successfully')
    return true
    
  } catch (error) {
    console.error('[deleteClaimDocument] Error:', error)
    return false
  }
}

// FIXED: Simple authentication check function
async function ensureAuthenticated(): Promise<boolean> {
  try {
    const sessionResult = await getCurrentAdminSession()
    return sessionResult.success && !!sessionResult.user
  } catch (error) {
    console.error('Authentication check failed:', error)
    return false
  }
}

export default function DocumentViewer({ 
  submissionId,  // FIXED: Matches your database schema
  uniqueCode,
  canDelete = false, 
  canDownload = true 
}: DocumentViewerProps) {
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // FIXED: Simple authentication verification
  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await ensureAuthenticated()
      setIsAuthenticated(authenticated)
      
      if (!authenticated) {
        setError('Authentication required to view documents')
        setLoading(false)
      }
    }
    
    verifyAuth()
  }, [])

  // FIXED: Load documents with simple auth check
  const loadDocuments = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log(`📂 Loading documents for submission: ${submissionId}`)
      
      // FIXED: Simple auth check before operation
      const authenticated = await ensureAuthenticated()
      if (!authenticated) {
        throw new Error('Authentication required to load documents')
      }
      
      const docs = await getClaimDocumentsWithCorrectSchema(submissionId)
      
      // Convert to DocumentWithUrl using your actual schema
      const docsWithUrl: DocumentWithUrl[] = docs.map(doc => ({
        ...doc,
        downloadUrl: undefined,
        isLoadingUrl: false
      }))
      
      console.log(`✅ Loaded ${docsWithUrl.length} documents`)
      setDocuments(docsWithUrl)
      
    } catch (err) {
      console.error('❌ Error loading documents:', err)
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [submissionId, isAuthenticated])

  // Load documents when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments()
    }
  }, [isAuthenticated, loadDocuments])

  // FIXED: Download handler using your actual schema
  const handleDownload = useCallback(async (fileDocument: DocumentWithUrl) => {
    try {
      console.log(`📥 Starting download for: ${fileDocument.file_name}`)
      
      // Simple auth check
      const authenticated = await ensureAuthenticated()
      if (!authenticated) {
        alert('Authentication required. Please log in again.')
        return
      }
      
      // Set loading state
      setDocuments(prev => prev.map(doc => 
        doc.id === fileDocument.id 
          ? { ...doc, isLoadingUrl: true }
          : doc
      ))

      // FIXED: Use your actual schema field name
      const downloadUrl = await getDocumentDownloadUrlWithCorrectSchema(fileDocument.file_path)
      
      if (downloadUrl) {
        // Update document with URL
        setDocuments(prev => prev.map(doc => 
          doc.id === fileDocument.id 
            ? { ...doc, downloadUrl, isLoadingUrl: false }
            : doc
        ))

        // Trigger download
        const link = globalThis.document.createElement('a')
        link.href = downloadUrl
        link.download = fileDocument.file_name  // FIXED: Use your actual field name
        globalThis.document.body.appendChild(link)
        link.click()
        globalThis.document.body.removeChild(link)
        
        console.log(`✅ Download completed for: ${fileDocument.file_name}`)
      } else {
        throw new Error('Failed to generate download URL')
      }
      
    } catch (err) {
      console.error('❌ Error downloading document:', err)
      setDocuments(prev => prev.map(doc => 
        doc.id === fileDocument.id 
          ? { ...doc, isLoadingUrl: false }
          : doc
      ))
      alert(err instanceof Error ? err.message : 'Failed to download document')
    }
  }, [])

  // FIXED: Delete handler using your actual schema
  const handleDelete = useCallback(async (fileDocument: ClaimDocument) => {
    if (!confirm(`Are you sure you want to delete "${fileDocument.file_name}"?`)) {
      return
    }

    try {
      console.log(`🗑️ Starting delete for: ${fileDocument.file_name}`)
      
      // Simple auth check
      const authenticated = await ensureAuthenticated()
      if (!authenticated) {
        alert('Authentication required. Please log in again.')
        return
      }
      
      const success = await deleteClaimDocumentWithCorrectSchema(fileDocument.id)
      
      if (success) {
        setDocuments(prev => prev.filter(doc => doc.id !== fileDocument.id))
        console.log(`✅ Delete completed for: ${fileDocument.file_name}`)
      } else {
        throw new Error('Delete operation failed')
      }
      
    } catch (err) {
      console.error('❌ Error deleting document:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" aria-label="Image file icon" />
    }
    return <FileText className="h-5 w-5 text-gray-500" aria-label="Document file icon" />
  }

  // FIXED: Use the category labels that work with your types
  const formatDocumentCategory = (category: DocumentCategory): string => {
    return DOCUMENT_CATEGORY_LABELS[category] || category
  }

  // FIXED: Type checking for your actual categories
  const isValidDocumentCategory = (category: string): category is DocumentCategory => {
    return ['emotionalDistress', 'transactionDelayed', 'creditDenied', 'unableToComplete', 'other'].includes(category)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-5 w-5 mr-2" />
        {error}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" aria-label="No documents icon" />
        <p>No documents uploaded for this claim</p>
      </div>
    )
  }

  // FIXED: Group documents by category using your actual database schema
  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.upload_category  // FIXED: Using your actual database schema
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(doc)
    return acc
  }, {} as Record<DocumentCategory, DocumentWithUrl[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Supporting Documents
        </h3>
        <span className="text-sm text-gray-500">
          Claim: {uniqueCode}
        </span>
      </div>

      {Object.entries(documentsByCategory).map(([category, docs]) => {
        if (!isValidDocumentCategory(category)) {
          console.warn(`Invalid document category: ${category}`)
          return null
        }

        return (
          <div key={category} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {formatDocumentCategory(category)} ({docs.length})
            </h4>
            
            <div className="space-y-2">
              {docs.map((fileDocument) => (
                <div 
                  key={fileDocument.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(fileDocument.file_type)}  {/* FIXED: Using your actual database schema */}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {fileDocument.file_name}  {/* FIXED: Using your actual database schema */}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileDocument.file_size)} • 
                        Uploaded {new Date(fileDocument.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canDownload && (
                      <button
                        onClick={() => handleDownload(fileDocument)}
                        disabled={fileDocument.isLoadingUrl}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        {fileDocument.isLoadingUrl ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500"></div>
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        <span className="ml-1">Download</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(fileDocument)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="ml-1">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Summary - FIXED: Using your actual database schema */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-400" aria-label="Document summary icon" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Document Summary
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Total documents: {documents.length}</p>
              <p>Total size: {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}</p>
              <p>Categories: {Object.keys(documentsByCategory).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}