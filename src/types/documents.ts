// types/documents.ts - UPDATED VERSION

/**
 * Document upload categories based on your claim form
 * UPDATED: Added emotionalDistress category
 */
export type DocumentCategory = 
  | 'emotionalDistress'
  | 'transactionDelayed'
  | 'creditDenied' 
  | 'unableToComplete'
  | 'other'

/**
 * Document upload status for tracking upload progress
 */
export type DocumentUploadStatus = 
  | 'pending'
  | 'uploading'
  | 'completed'
  | 'error'
  | 'deleted'

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Document record as stored in database
 */
export interface ClaimDocument {
  id: string
  submission_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  upload_category: DocumentCategory
  uploaded_at: string
  is_deleted: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Document with file content for new uploads
 */
export interface DocumentWithFile extends Omit<ClaimDocument, 'id' | 'submission_id' | 'uploaded_at' | 'created_at' | 'updated_at'> {
  file: File
  upload_status: DocumentUploadStatus
  upload_progress?: number
  error_message?: string
  temp_id?: string // For tracking before database ID is assigned
}

/**
 * Document display item (union of existing and new documents)
 */
export interface DocumentDisplayItem {
  id?: string // Database ID for existing documents
  temp_id?: string // Temporary ID for new uploads
  file_name: string
  file_size: number
  file_type: string
  upload_category: DocumentCategory
  upload_status: DocumentUploadStatus
  upload_progress?: number
  error_message?: string
  file_path?: string // Storage path for existing documents
  file?: File // File object for new uploads
  is_existing: boolean // Flag to distinguish existing vs new
  uploaded_at?: string
  preview_url?: string // For image previews
}

/**
 * Document upload configuration
 */
export interface DocumentUploadConfig {
  maxFiles: number
  maxSizePerFile: number // in bytes
  acceptedTypes: string[]
  allowedExtensions: string[]
  storageBucket: string
  storageFolder?: string
}

/**
 * Document upload result
 */
export interface DocumentUploadResult {
  success: boolean
  document?: ClaimDocument
  error?: string
  file_path?: string
}

/**
 * Batch upload result
 */
export interface BatchUploadResult {
  successful: DocumentUploadResult[]
  failed: DocumentUploadResult[]
  total: number
  successCount: number
  errorCount: number
}

/**
 * Document state for managing uploads by category
 * UPDATED: Added emotionalDistress
 */
export interface DocumentState {
  emotionalDistress: DocumentDisplayItem[]
  transactionDelayed: DocumentDisplayItem[]
  creditDenied: DocumentDisplayItem[]
  unableToComplete: DocumentDisplayItem[]
  other: DocumentDisplayItem[]
}

/**
 * Document upload progress tracking
 */
export interface UploadProgress {
  category: DocumentCategory
  fileName: string
  progress: number
  status: DocumentUploadStatus
  error?: string
}

/**
 * File type validation constants
 */
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
  ],
  spreadsheets: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
} as const

export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.txt', '.rtf',
  '.xls', '.xlsx', '.csv'
] as const

/**
 * Default upload configuration
 */
export const DEFAULT_UPLOAD_CONFIG: DocumentUploadConfig = {
  maxFiles: 5,
  maxSizePerFile: 10 * 1024 * 1024, // 10MB
  acceptedTypes: [
    ...ALLOWED_FILE_TYPES.images,
    ...ALLOWED_FILE_TYPES.documents,
    ...ALLOWED_FILE_TYPES.spreadsheets
  ],
  allowedExtensions: [...ALLOWED_EXTENSIONS],
  storageBucket: 'claim-documents',
  storageFolder: 'uploads'
}

/**
 * Document category labels for UI display
 * UPDATED: Added emotionalDistress
 */
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  emotionalDistress: 'Emotional Distress Documentation',
  transactionDelayed: 'Transaction Delayed Documentation',
  creditDenied: 'Credit Denied Documentation',
  unableToComplete: 'Unable to Complete Transaction Documentation',
  other: 'Other Supporting Documentation'
}

/**
 * Hook return type for document upload operations
 */
export interface UseDocumentUploadReturn {
  uploadFile: (file: File, category: DocumentCategory, submissionId: string) => Promise<DocumentUploadResult>
  uploadProgress: number
  isUploading: boolean
  error: string | null
  clearError: () => void
  cancelUpload: () => void
  checkFileValidity: (file: File) => FileValidationResult
  getErrorMessage: () => string | null
  getUploadStatus: () => {
    isUploading: boolean
    progress: number
    error: string | null
    isComplete: boolean
    isCancelled: boolean
  }
  cleanup: () => void
}