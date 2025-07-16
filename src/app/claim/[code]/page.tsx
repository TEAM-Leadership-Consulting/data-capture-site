'use client'

// app/claim/[code]/page.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import BrandedPaymentOptions from '@/components/BrandedPaymentOptions'
import Toast from '@/components/Toast'
import type { ClaimFormDataRHF } from '@/lib/schemas'
import { claimFormSchemaRHF } from '@/lib/schemas'
import type { DocumentDisplayItem as SharedDocumentDisplayItem, DocumentCategory } from '@/types/documents'
import { Send, ArrowLeft, Save } from 'lucide-react'


// ==========================================
// CONFIGURATION CONSTANTS
// ==========================================

const CONFIG = {
  SESSION_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  WARNING_TIMEOUT_MS: 4 * 60 * 1000, // 4 minutes (1 minute before timeout)
  AUTO_SAVE_INTERVAL_MS: 30 * 1000,  // 30 seconds
  MAX_FILE_SIZE_MB: 100,              // Enterprise-level file size limit
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
  DEFAULT_DEADLINE: 'March 26, 2025'
} as const

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface UploadedFile {
  id?: string
  name: string
  url: string
  size: number
  uploadedAt?: string
  fileHash?: string
  storagePath?: string
}

// Local document interface that aligns with shared types
interface LocalDocumentDisplayItem extends Omit<SharedDocumentDisplayItem, 'upload_category' | 'upload_status'> {
  upload_category: keyof ClaimFormDataRHF['harmTypes']
  upload_status: 'uploading' | 'completed' | 'error'
}

interface UploadProgress {
  category: DocumentCategory
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
}

interface ClaimStatus {
  exists: boolean
  isActive: boolean
  isUsed: boolean
  hasExpired: boolean
  claimData?: {
    id: string
    unique_code: string
    title: string
    is_active: boolean
    is_used: boolean
    expires_at: string | null
  }
}

interface SystemStatus {
  isEnabled: boolean
  maintenanceMessage: string
}

interface ClaimDeadline {
  date: string
  formatted: string
  isFromDatabase: boolean
}

interface ToastState {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
}

const fetchClaimDeadline = async (): Promise<ClaimDeadline> => {
  try {
    // Use public endpoint instead of admin endpoint
    const response = await fetch('/api/public/deadline')
    
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.deadline) {
        return data.deadline
      }
    }
    
    console.log('ℹ️ Could not fetch deadline from API, using default')
  } catch (error) {
    console.log('ℹ️ Error fetching deadline, using default:', error)
  }
  
  // Always return a safe default
  return {
    date: '2025-03-26',
    formatted: CONFIG.DEFAULT_DEADLINE.toUpperCase(),
    isFromDatabase: false
  }
}

const checkSystemStatus = async (): Promise<SystemStatus> => {
  try {
    const response = await fetch('/api/public/claims-status')
    if (response.ok) {
      const data = await response.json()
      return {
        isEnabled: data.isEnabled,
        maintenanceMessage: data.maintenanceMessage || 'Claims filing is temporarily unavailable. Please try again later.'
      }
    }
  } catch (error) {
    console.error('Error checking system status:', error)
  }
  
  return {
    isEnabled: false,
    maintenanceMessage: 'Unable to verify system status. Please try again later.'
  }
}
 
// ==========================================
// DEFAULT FORM VALUES
// ==========================================
// Enhanced claim update with proper anon context
const updateClaimSecurely = async (claimCode: string) => {
  try {
    console.log('🔍 Starting secure claim update...')
    
    // STEP 1: Ensure we're using anon role (no session)
    console.log('🔄 Verifying anon context...')
    const { data: { session }, error: _sessionError } = await supabase.auth.getSession()
    
    if (session) {
      console.log('⚠️ WARNING: Found active session, clearing for anon access')
      console.log('📊 Session user:', session.user?.email)
      await supabase.auth.signOut()
      
      // Wait a bit for signout to complete
      await new Promise(resolve => setTimeout(resolve, 100))
    } else {
      console.log('✅ Already using anon context')
    }
    
    // STEP 2: Verify the claim meets RLS conditions EXACTLY
    console.log('🔍 Pre-validating claim conditions...')
    const { data: claimCheck, error: checkError } = await supabase
      .from('claims')
      .select('unique_code, is_active, is_used, used_at')
      .eq('unique_code', claimCode)
      .single()
    
    console.log('📊 Claim check result:', claimCheck)
    console.log('📊 Check error:', checkError)
    
    if (checkError) {
      throw new Error(`Failed to validate claim: ${checkError.message}`)
    }
    
    if (!claimCheck) {
      throw new Error(`Claim ${claimCode} not found`)
    }
    
    // Validate exact RLS conditions
    if (!claimCheck.is_active) {
      throw new Error(`Claim ${claimCode} is not active (is_active: ${claimCheck.is_active})`)
    }
    
    if (claimCheck.is_used) {
      throw new Error(`Claim ${claimCode} is already used (is_used: ${claimCheck.is_used})`)
    }
    
    console.log('✅ Pre-validation passed - claim meets all RLS conditions')
    
    // STEP 3: Use the EXACT same WHERE conditions as RLS policy
    console.log('🔄 Executing update with exact RLS WHERE conditions...')
    
    const updateData = {
      is_used: true,
      used_at: new Date().toISOString()
    }
    
    console.log('📊 Update data:', updateData)
    console.log('📊 WHERE conditions: unique_code =', claimCode, 'AND is_active = true AND is_used = false')
    
    const { data: updateResult, error: updateError } = await supabase
      .from('claims')
      .update(updateData)
      .eq('unique_code', claimCode)
      .eq('is_active', true)     // Explicit RLS condition
      .eq('is_used', false)      // Explicit RLS condition  
      .select('unique_code, is_used, used_at, is_active')
    
    console.log('📊 Raw update result:', updateResult)
    console.log('📊 Raw update error:', updateError)
    
    // STEP 4: Detailed error analysis
    if (updateError) {
      console.error('❌ Update failed with error:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      })
      throw updateError
    }
    
    if (!updateResult || updateResult.length === 0) {
      console.error('❌ CRITICAL: No rows affected despite pre-validation passing!')
      console.error('   This indicates a Supabase client context issue')
      
      // Additional debugging: try to read the claim again to see if context changed
      const { data: postCheck } = await supabase
        .from('claims')
        .select('unique_code, is_active, is_used, used_at')
        .eq('unique_code', claimCode)
        .single()
      
      console.error('📊 Post-update check (should be unchanged):', postCheck)
      
      throw new Error('Update failed - no rows affected despite meeting all conditions')
    }
    
    console.log('✅ Update successful:', updateResult[0])
    
    // STEP 5: Verify the update persisted
    console.log('🔍 Verifying update persistence...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('claims')
      .select('unique_code, is_used, used_at, is_active')
      .eq('unique_code', claimCode)
      .single()
    
    console.log('📊 Verification result:', verifyData)
    
    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`)
    }
    
    if (!verifyData.is_used) {
      throw new Error('Update did not persist - claim is still marked as unused')
    }
    
    console.log('✅ Update verified successfully')
    return updateResult[0]
    
  } catch (error) {
    console.error('❌ Secure claim update failed:', error)
    throw error
  }
}

const defaultValues: ClaimFormDataRHF = {
  contactInfo: {
    fullName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  },
  harmTypes: {
    emotionalDistress: { selected: false, details: '', hasDocumentation: '', uploadedFiles: [] },
    transactionDelayed: { selected: false, details: '', hasDocumentation: '', uploadedFiles: [] },
    creditDenied: { selected: false, details: '', hasDocumentation: '', uploadedFiles: [] },
    unableToComplete: { selected: false, details: '', hasDocumentation: '', uploadedFiles: [] },
    other: { selected: false, details: '', hasDocumentation: '', uploadedFiles: [] }
  },
  payment: {
    method: null,
    paypalEmail: '',
    venmoPhone: '',
    zellePhone: '',
    zelleEmail: '',
    prepaidCardEmail: ''
  },
  signature: {
    signature: '',
    printedName: '',
    date: ''
  }
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function ClaimForm() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  
  // ==========================================
  // STATE MANAGEMENT SECTION
  // ==========================================
  
  const [isLoading, setIsLoading] = useState(true)
  const [_claimStatus, setClaimStatus] = useState<ClaimStatus>({ 
    exists: false, 
    isActive: false, 
    isUsed: false,
    hasExpired: false
  })
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isEnabled: true,
    maintenanceMessage: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [timeoutWarning, setTimeoutWarning] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [claimDeadline, setClaimDeadline] = useState<ClaimDeadline>({
    date: '2025-03-26',
    formatted: CONFIG.DEFAULT_DEADLINE.toUpperCase(),
    isFromDatabase: false
  })
  const [toast, setToast] = useState<ToastState>({ 
    message: '', 
    type: 'success', 
    isVisible: false 
  })

  
  // Ref management for timeouts and intervals
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // ==========================================
  // FORM SETUP SECTION
  // ==========================================
  
  const { 
    control,
    register,
    handleSubmit, 
    watch, 
    setValue, 
    getValues, 
    formState: { errors, isValid }
  } = useForm<ClaimFormDataRHF>({
    resolver: zodResolver(claimFormSchemaRHF),
    defaultValues,
    mode: 'onChange'
  })
  
  const watchedValues = watch()
  const watchPaymentMethod = watch('payment.method')
  
  // ==========================================
  // TYPE CONVERSION UTILITIES SECTION
  // ==========================================
  
  // Get MIME type from file extension
  const getMimeTypeFromExtension = useCallback((fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'txt': 'text/plain',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'mp4': 'video/mp4',
      'mov': 'video/mov',
      'avi': 'video/avi',
      'mp3': 'audio/mp3',
      'wav': 'audio/wav',
      'm4a': 'audio/m4a'
    }
    return mimeTypes[extension || ''] || 'application/octet-stream'
  }, [])
  
  // ==========================================
  // SECURE FILE UPLOAD FUNCTIONALITY
  // ==========================================
  
  // Convert UploadedFile to LocalDocumentDisplayItem
  const convertToDocumentDisplayItem = useCallback((
    file: UploadedFile, 
    harmType: keyof ClaimFormDataRHF['harmTypes']
  ): LocalDocumentDisplayItem => {
    return {
      id: file.id,
      temp_id: file.id || `temp-${Date.now()}`,
      file_name: file.name,
      file_path: file.url, // Already contains secure API URL
      file_size: file.size,
      file_type: getMimeTypeFromExtension(file.name),
      upload_category: harmType,
      upload_status: 'completed',
      uploaded_at: file.uploadedAt,
      preview_url: file.url, // Secure API endpoint
      is_existing: true
    }
  }, [getMimeTypeFromExtension])
  
  // ==========================================
  // TOAST FUNCTIONALITY SECTION
  // ==========================================
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`)
    
    // Convert 'info' and 'warning' to supported types
    const toastType = (type === 'info' || type === 'warning') ? 'success' : type
    
    setToast({
      message,
      type: toastType,
      isVisible: true
    })
  }, [])
  
  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])
  
  // ==========================================
  // SECURE FILE UPLOAD FUNCTIONALITY
  // ==========================================
  
  const uploadFile = useCallback(async (file: File, harmType: string): Promise<UploadedFile | null> => {
    try {
      console.log(`🔒 Starting secure upload for: ${file.name}`)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('claimCode', code) // Uses existing code from URL params
      formData.append('harmType', harmType)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      console.log('✅ Secure upload successful')
      
      return {
        id: result.data.document.id,
        name: result.data.document.name,
        url: result.data.document.url, // This will be /api/files/[id]?claim=CODE
        size: result.data.document.size,
        uploadedAt: result.data.document.uploadedAt,
        fileHash: result.data.document.fileHash,
        storagePath: result.data.document.id // Use document ID as reference
      }

    } catch (error) {
      console.error('❌ Secure upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showToast(`Failed to upload ${file.name}: ${errorMessage}`, 'error')
      return null
    }
  }, [code, showToast])
  
  // ==========================================
  // SECURE FILE REMOVAL FUNCTIONALITY
  // ==========================================
  
  const removeFile = useCallback(async (harmType: keyof ClaimFormDataRHF['harmTypes'], fileIndex: number) => {
    const currentFiles = getValues(`harmTypes.${harmType}.uploadedFiles`) || []
    const fileToRemove = currentFiles[fileIndex]
    
    try {
      console.log(`🗑️ Removing file: ${fileToRemove.name}`)
      
      const response = await fetch(`/api/files/${fileToRemove.id}?claim=${code}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Update form state
      const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex)
      setValue(`harmTypes.${harmType}.uploadedFiles`, updatedFiles)
      
      console.log('✅ File removed successfully')
      showToast('File removed successfully', 'success')
      
    } catch (error) {
      console.error('❌ Error removing file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showToast(`Failed to remove file: ${errorMessage}`, 'error')
    }
  }, [code, getValues, setValue, showToast])
  
  // ==========================================
  // DOCUMENT MANAGEMENT SECTION
  // ==========================================
  
  // Get documents for a specific harm type
  const getDocumentsForCategory = useCallback((harmType: keyof ClaimFormDataRHF['harmTypes']): LocalDocumentDisplayItem[] => {
    const uploadedFiles = watchedValues.harmTypes?.[harmType]?.uploadedFiles || []
    return uploadedFiles.map(file => convertToDocumentDisplayItem(file, harmType))
  }, [watchedValues, convertToDocumentDisplayItem])
  
  // Handle document upload from DocumentUpload component
  const handleDocumentUpload = useCallback(async (harmType: keyof ClaimFormDataRHF['harmTypes'], files: File[]) => {
    try {
      // Start upload progress tracking
      files.forEach(file => {
        setUploadProgress(prev => [...prev.filter(p => p.fileName !== file.name), {
          category: harmType as DocumentCategory,
          fileName: file.name,
          progress: 0,
          status: 'uploading' as const
        }])
      })
      
      showToast(`Uploading ${files.length} file(s)...`, 'info')
      
      const uploadPromises = files.map(async (file) => {
        // Update progress periodically
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => prev.map(p => 
            p.fileName === file.name && p.status === 'uploading'
              ? { ...p, progress: Math.min(p.progress + 10, 90) }
              : p
          ))
        }, 200)
        
        try {
          const uploadedFile = await uploadFile(file, harmType)
          clearInterval(progressInterval)
          
          // Mark as completed
          setUploadProgress(prev => prev.map(p => 
            p.fileName === file.name 
              ? { ...p, progress: 100, status: 'completed' as const }
              : p
          ))
          
          return uploadedFile
        } catch (error) {
          clearInterval(progressInterval)
          
          // Mark as error
          setUploadProgress(prev => prev.map(p => 
            p.fileName === file.name 
              ? { ...p, progress: 0, status: 'error' as const }
              : p
          ))
          
          throw error
        }
      })
      
      const uploadedFiles = await Promise.all(uploadPromises)
      const successfulUploads = uploadedFiles.filter(file => file !== null) as UploadedFile[]
      
      if (successfulUploads.length > 0) {
        // Get current files and add new ones
        const currentFiles = watchedValues.harmTypes?.[harmType]?.uploadedFiles || []
        const updatedFiles = [...currentFiles, ...successfulUploads]
        setValue(`harmTypes.${harmType}.uploadedFiles`, updatedFiles)
        
        showToast(`${successfulUploads.length} file(s) uploaded successfully`, 'success')
      }
      
      // Clean up progress after delay
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(p => !files.some(f => f.name === p.fileName)))
      }, 2000)
      
    } catch (error) {
      console.error('Error in document upload process:', error)
      showToast('An error occurred during file upload', 'error')
      
      // Clean up progress on error
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(p => !files.some(f => f.name === p.fileName)))
      }, 2000)
    }
  }, [uploadFile, setValue, watchedValues, showToast])
  
  // Handle document removal from DocumentUpload component
  const handleDocumentRemove = useCallback(async (harmType: keyof ClaimFormDataRHF['harmTypes'], documentId: string) => {
    const currentFiles = watchedValues.harmTypes?.[harmType]?.uploadedFiles || []
    const fileIndex = currentFiles.findIndex(file => 
      file.id === documentId || `temp-${Date.now()}` === documentId
    )
    
    if (fileIndex !== -1) {
      await removeFile(harmType, fileIndex)
    }
  }, [watchedValues, removeFile])
  
  // Get upload progress for specific category
  const getCategoryUploadProgress = useCallback((category: DocumentCategory): UploadProgress[] => {
    return uploadProgress.filter(p => p.category === category)
  }, [uploadProgress])
  
  // Check if category is currently uploading
  const _isCategoryUploading = useCallback((category: DocumentCategory): boolean => {
    return uploadProgress.some(p => p.category === category && p.status === 'uploading')
  }, [uploadProgress])
  
  // ==========================================
  // SESSION TIMEOUT MANAGEMENT SECTION
  // ==========================================
  
  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    
    setTimeoutWarning(false)
    
    warningTimeoutRef.current = setTimeout(() => {
      setTimeoutWarning(true)
    }, CONFIG.WARNING_TIMEOUT_MS)
    
    timeoutRef.current = setTimeout(() => {
      showToast('Session timed out due to inactivity. Redirecting...', 'error')
      setTimeout(() => router.push('/'), 2000)
    }, CONFIG.SESSION_TIMEOUT_MS)
  }, [router, showToast])
  
  const handleUserActivity = useCallback(() => {
    resetTimeout()
  }, [resetTimeout])
  
  // ==========================================
  // ENHANCED AUTO-SAVE FUNCTIONALITY SECTION
  // ==========================================

  const autoSaveData = useCallback(async (data: ClaimFormDataRHF) => {
    try {
      console.log('🔄 Auto-saving for claim:', code)
      
      // STEP 1: Quick validation that claim still exists and is valid
      const { data: claimCheck, error: claimError } = await supabase
        .from('claims')
        .select('is_active, is_used')
        .eq('unique_code', code)
        .maybeSingle()
      
      if (claimError) {
        console.log('ℹ️ Auto-save disabled - claim validation failed:', claimError.message)
        if (saveIntervalRef.current) {
          clearInterval(saveIntervalRef.current)
          saveIntervalRef.current = null
        }
        return
      }
      
      if (!claimCheck || !claimCheck.is_active || claimCheck.is_used) {
        console.log('ℹ️ Auto-save disabled - claim no longer valid')
        if (saveIntervalRef.current) {
          clearInterval(saveIntervalRef.current)
          saveIntervalRef.current = null
        }
        return
      }
      
      // STEP 2: Prepare save data
      const saveData = {
        unique_code: code,
        section_name: 'complete_form',
        section_data: data,
        save_timestamp: new Date().toISOString(),
        user_session_id: sessionId,
        is_manual_save: false
      }
      
      // STEP 3: Attempt save with proper error handling
      const { error } = await supabase
        .from('claim_auto_saves')
        .upsert(saveData, {
          onConflict: 'unique_code',
          ignoreDuplicates: false
        })
      
      if (error) {
        console.log('ℹ️ Auto-save temporarily unavailable:', error.message)
        
        // Disable auto-save for session if persistent issues
        if (error.code === '42501' || error.code === '42P01') {
          console.log('ℹ️ Disabling auto-save for this session')
          if (saveIntervalRef.current) {
            clearInterval(saveIntervalRef.current)
            saveIntervalRef.current = null
          }
        }
        return
      }
      
      // STEP 4: Success handling
      setLastSaved(new Date())
      console.log('✅ Auto-save completed')
      
    } catch (error) {
      console.log('ℹ️ Auto-save error:', error)
      // Don't show errors to user for background auto-save failures
    }
  }, [code, sessionId])

  const handleManualSave = useCallback(async () => {
    const data = getValues()
    
    try {
      console.log('💾 Manual save requested for claim:', code)
      
      // STEP 1: Validate claim is still valid
      const { data: claimCheck, error: claimError } = await supabase
        .from('claims')
        .select('is_active, is_used')
        .eq('unique_code', code)
        .maybeSingle()
      
      if (claimError || !claimCheck || !claimCheck.is_active || claimCheck.is_used) {
        showToast('Cannot save - claim is no longer valid', 'error')
        return
      }
      
      // STEP 2: Temporarily stop auto-save
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
      
      // STEP 3: Prepare manual save data
      const saveData = {
        unique_code: code,
        section_name: 'complete_form',
        section_data: data,
        save_timestamp: new Date().toISOString(),
        user_session_id: sessionId,
        is_manual_save: true
      }
      
      // STEP 4: Attempt manual save
      const { error } = await supabase
        .from('claim_auto_saves')
        .upsert(saveData, {
          onConflict: 'unique_code',
          ignoreDuplicates: false
        })
      
      if (error) {
        console.error('❌ Manual save failed:', error)
        
        if (error.code === '42501') {
          showToast('Save feature not available', 'error')
        } else if (error.code === '42P01') {
          showToast('Save feature temporarily disabled', 'error')
        } else {
          showToast('Unable to save - please try again', 'error')
        }
        return
      }
      
      // STEP 5: Success handling
      setLastSaved(new Date())
      showToast('Progress saved successfully', 'success')
      console.log('✅ Manual save completed')
      
    } catch (error) {
      console.error('❌ Manual save error:', error)
      showToast('Save temporarily unavailable', 'error')
      
    } finally {
      // STEP 6: Always restart auto-save
      setTimeout(() => {
        if (!saveIntervalRef.current) {
          saveIntervalRef.current = setInterval(() => {
            const currentData = getValues()
            autoSaveData(currentData)
          }, CONFIG.AUTO_SAVE_INTERVAL_MS)
        }
      }, 1000)
    }
  }, [code, sessionId, getValues, showToast, autoSaveData])


  // ==========================================
  // SIMPLIFIED FORM SUBMISSION
  // ==========================================
  
  const onSubmit: SubmitHandler<ClaimFormDataRHF> = async (data) => {
  setIsSubmitting(true)
  
  try {
    console.log('🚀 Starting secure form submission...')
    console.log('📊 Starting secure form submission with Supabase client')
console.log('📊 Form submission initiated for claim:', code)
    
    data.signature.date = new Date().toLocaleDateString()
    
    // Get existing draft submission - simple version for form submission
    let { data: submission } = await supabase
      .from('claim_submissions')
      .select('id')
      .eq('unique_code', code)
      .eq('status', 'draft')
      .single()

    if (!submission) {
      const { data: newSubmission, error: createError } = await supabase
        .from('claim_submissions')
        .insert({
          unique_code: code,
          form_data: {},
          status: 'draft',
          user_agent: navigator.userAgent,
          validation_status: { isValid: false },
          validation_errors: []
        })
        .select('id')
        .single()

      if (createError) {
        throw createError
      }
      submission = newSubmission
    }
    
    console.log(`📋 Using submission ID: ${submission.id}`)
    
    // Update submission to submitted status
    console.log('📝 Updating submission to submitted status...')
    const { error: submissionError } = await supabase
      .from('claim_submissions')
      .update({
        form_data: data,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        validation_status: { isValid: true },
        validation_errors: []
      })
      .eq('id', submission.id)
    
    if (submissionError) {
      console.error('❌ Submission update error:', submissionError)
      throw submissionError
    }
    
    console.log('✅ Submission updated successfully')
    
    // Secure claim update
    console.log('🔒 Starting secure claim update...')
    const claimUpdateResult = await updateClaimSecurely(code)
    console.log('✅ Claim update completed:', claimUpdateResult)
    
    // Success handling
    showToast('Claim submitted successfully!', 'success')
    
    setTimeout(() => {
      router.push(`/success?code=${code}`)
    }, 2000)
    
  } catch (error) {
    console.error('❌ Secure form submission failed:', error)
    
    // Enhanced error reporting
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    showToast(`Failed to submit claim: ${errorMessage}`, 'error')
  } finally {
    setIsSubmitting(false)
  }
}

const renderHarmTypeSection = (
  harmKey: keyof ClaimFormDataRHF['harmTypes'],
  title: string,
  requiresDocumentation = false
) => {
  const hasDocumentation = watchedValues.harmTypes?.[harmKey]?.hasDocumentation === 'yes'

  return (
    <div className="border border-gray-300 rounded-lg p-6 mb-4" key={harmKey}>
      {/* Checkbox and Title Section */}
      <div className="mb-6">
  {/* Title - Left Aligned */}
  <label htmlFor={`harm-${harmKey}`} className="block text-sm font-medium text-gray-900 cursor-pointer mb-3">
    {title}
  </label>
  
  {/* Checkbox - Below Title */}
  <div className="flex items-center space-x-2">
    <Controller
      name={`harmTypes.${harmKey}.selected`}
      control={control}
      render={({ field }) => (
        <input
          type="checkbox"
          checked={field.value || false}
          onChange={(e) => {
            field.onChange(e.target.checked)
          }}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          id={`harm-${harmKey}`}
        />
      )}
    />
    </div>
</div>
      
      {/* Content Section */}
     
<div className="ml-0 pl-1 space-y-6">
  {/* Description Textarea */}
  <div>
    <Controller
      name={`harmTypes.${harmKey}.details`}
      control={control}
      render={({ field }) => (
        <textarea
          {...field}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Please describe how you ${harmKey.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
        />
      )}
    />
  </div>
        
        {requiresDocumentation && (
          <>
            {/* Documentation Question Section */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Do you have supporting documentation?
              </label>
              <Controller
  name={`harmTypes.${harmKey}.hasDocumentation`}
  control={control}
  render={({ field }) => (
    <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
      <button
        type="button"
        onClick={() => field.onChange('yes')}
        className={`flex items-center justify-center cursor-pointer px-8 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] ${
          field.value === 'yes' 
            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
        }`}
      >
        <span className={`text-sm font-medium ${
          field.value === 'yes' ? 'text-blue-700' : 'text-gray-700'
        }`}>Yes</span>
      </button>
      
      <button
        type="button"
        onClick={() => field.onChange('no')}
        className={`flex items-center justify-center cursor-pointer px-8 py-3 rounded-lg border-2 transition-all duration-200 min-w-[140px] ${
          field.value === 'no' 
            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
        }`}
      >
        <span className={`text-sm font-medium ${
          field.value === 'no' ? 'text-blue-700' : 'text-gray-700'
        }`}>No</span>
      </button>
    </div>
  )}
/>
            </div>

            {/* File Upload Section */}
            {hasDocumentation && (
              <div className="space-y-4">
                <div className="text-center">
                  <label className="block text-sm font-medium text-blue-600 mb-4">
                    Upload supporting documentation for {harmKey.replace(/([A-Z])/g, ' $1').toLowerCase()} *
                  </label>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:border-blue-400 hover:bg-blue-25 transition-colors">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      Click to upload or drag and drop files here
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Supported: PDF, DOC, DOCX, TXT, Images (max 10MB each, 5 files total)
                    </p>
                    
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length > 0) {
                          handleDocumentUpload(harmKey, files)
                        }
                      }}
                      className="hidden"
                      id={`file-upload-${harmKey}`}
                    />
                    <label
                      htmlFor={`file-upload-${harmKey}`}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      Choose Files
                    </label>
                  </div>
                </div>
                
                {/* Uploaded Files Display */}
                {getDocumentsForCategory(harmKey).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 text-center">
                      Uploaded Documents ({getDocumentsForCategory(harmKey).length}/5)
                    </h4>
                    <div className="space-y-2">
                      {getDocumentsForCategory(harmKey).map((document, index) => (
                        <div key={document.id || document.temp_id || `${document.file_name}-${index}`} 
                             className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                                <span className="text-blue-600 text-xs font-medium">
                                  {document.file_name.split('.').pop()?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{document.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(document.file_size)}
                                {document.uploaded_at ? ` • ${new Date(document.uploaded_at).toLocaleString()}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                             <button
                              type="button"
                              onClick={() => handleDocumentRemove(harmKey, document.id || document.temp_id || '')}
                              className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded border border-red-300 hover:border-red-500 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Upload Progress */}
                {getCategoryUploadProgress(harmKey as DocumentCategory).length > 0 && (
                  <div className="space-y-2">
                    {getCategoryUploadProgress(harmKey as DocumentCategory).map((progress) => (
                      <div key={progress.fileName} className="bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Validation Message */}
                {hasDocumentation && getDocumentsForCategory(harmKey).length === 0 && (
                  <p className="text-sm text-red-600 text-center">
                    Please upload at least one supporting document
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

  // ==========================================
  // COMPONENT LIFECYCLE EFFECTS SECTION
  // ==========================================
  
  useEffect(() => {
    const loadDeadline = async () => {
      const deadline = await fetchClaimDeadline()
      setClaimDeadline(deadline)
    }
    loadDeadline()
  }, [])
  
  useEffect(() => {
    if (!code) return
    
    const validateClaimCode = async (claimCode: string): Promise<ClaimStatus> => {
      try {
        const { data: claim, error } = await supabase
          .from('claims')
          .select('*')
          .eq('unique_code', claimCode)
          .single()
        
        if (error || !claim) {
          return { exists: false, isActive: false, isUsed: false, hasExpired: false }
        }
        
        const hasExpired = claim.expires_at ? new Date(claim.expires_at) < new Date() : false
        
        return {
          exists: true,
          isActive: claim.is_active,
          isUsed: claim.is_used,
          hasExpired,
          claimData: claim
        }
      } catch (error) {
        console.error('Error validating claim code:', error)
        return { exists: false, isActive: false, isUsed: false, hasExpired: false }
      }
    }
    
    // ==========================================
    // ENHANCED loadSavedData - FIRST-TIME USER FRIENDLY
    // ==========================================

    const loadSavedData = async () => {
      try {
        console.log('🔍 Checking for saved data for claim:', code)
        
        // STEP 1: Use proper query that handles zero results gracefully
        // Use .maybeSingle() instead of .single() to handle no-data case
        const { data: savedRecord, error: fetchError } = await supabase
          .from('claim_auto_saves')
          .select('section_data, save_timestamp, is_manual_save')
          .eq('unique_code', code)
          .order('save_timestamp', { ascending: false })
          .limit(1)
          .maybeSingle() // This handles zero results without error
        
        // STEP 2: Handle different scenarios appropriately
        if (fetchError) {
          // Only log actual errors, not "no data found" cases
          console.error('❌ Error accessing auto-save data:', fetchError)
          
          // Check if it's a table/permissions issue
          if (fetchError.code === '42P01') {
            console.log('ℹ️ Auto-save table not available - continuing without saved data')
          } else if (fetchError.code === '42501') {
            console.log('ℹ️ Auto-save access restricted - continuing without saved data')
          } else {
            console.log('ℹ️ Auto-save temporarily unavailable - continuing without saved data')
          }
          
          // Continue without saved data - this is not critical for form functionality
          return
        }
        
        // STEP 3: Handle no saved data (normal for first-time users)
        if (!savedRecord) {
          console.log('✅ No saved data found - this is normal for first-time users')
          return // Exit gracefully, no error needed
        }
        
        // STEP 4: Process found saved data
        console.log('📊 Found saved data from:', new Date(savedRecord.save_timestamp).toLocaleString())
        
        const savedData = savedRecord.section_data as ClaimFormDataRHF
        
        // STEP 5: Validate saved data structure
        if (!savedData || typeof savedData !== 'object') {
          console.warn('⚠️ Saved data has invalid structure - starting fresh')
          return
        }
        
        // STEP 6: Safely merge saved data with defaults
        try {
          const mergedData: ClaimFormDataRHF = {
            contactInfo: {
              fullName: savedData.contactInfo?.fullName || '',
              email: savedData.contactInfo?.email || '',
              address: savedData.contactInfo?.address || '',
              city: savedData.contactInfo?.city || '',
              state: savedData.contactInfo?.state || '',
              zipCode: savedData.contactInfo?.zipCode || '',
              phone: savedData.contactInfo?.phone || ''
            },
            harmTypes: {
              emotionalDistress: {
                selected: savedData.harmTypes?.emotionalDistress?.selected || false,
                details: savedData.harmTypes?.emotionalDistress?.details || '',
                hasDocumentation: savedData.harmTypes?.emotionalDistress?.hasDocumentation || '',
                uploadedFiles: savedData.harmTypes?.emotionalDistress?.uploadedFiles || []
              },
              transactionDelayed: {
                selected: savedData.harmTypes?.transactionDelayed?.selected || false,
                details: savedData.harmTypes?.transactionDelayed?.details || '',
                hasDocumentation: savedData.harmTypes?.transactionDelayed?.hasDocumentation || '',
                uploadedFiles: savedData.harmTypes?.transactionDelayed?.uploadedFiles || []
              },
              creditDenied: {
                selected: savedData.harmTypes?.creditDenied?.selected || false,
                details: savedData.harmTypes?.creditDenied?.details || '',
                hasDocumentation: savedData.harmTypes?.creditDenied?.hasDocumentation || '',
                uploadedFiles: savedData.harmTypes?.creditDenied?.uploadedFiles || []
              },
              unableToComplete: {
                selected: savedData.harmTypes?.unableToComplete?.selected || false,
                details: savedData.harmTypes?.unableToComplete?.details || '',
                hasDocumentation: savedData.harmTypes?.unableToComplete?.hasDocumentation || '',
                uploadedFiles: savedData.harmTypes?.unableToComplete?.uploadedFiles || []
              },
              other: {
                selected: savedData.harmTypes?.other?.selected || false,
                details: savedData.harmTypes?.other?.details || '',
                hasDocumentation: savedData.harmTypes?.other?.hasDocumentation || '',
                uploadedFiles: savedData.harmTypes?.other?.uploadedFiles || []
              }
            },
            payment: {
              method: savedData.payment?.method || null,
              paypalEmail: savedData.payment?.paypalEmail || '',
              venmoPhone: savedData.payment?.venmoPhone || '',
              zellePhone: savedData.payment?.zellePhone || '',
              zelleEmail: savedData.payment?.zelleEmail || '',
              prepaidCardEmail: savedData.payment?.prepaidCardEmail || ''
            },
            signature: {
              signature: savedData.signature?.signature || '',
              printedName: savedData.signature?.printedName || '',
              date: savedData.signature?.date || ''
            }
          }
          
          // STEP 7: Apply data to form
          setValue('contactInfo', mergedData.contactInfo)
          setValue('harmTypes', mergedData.harmTypes)
          setValue('payment', mergedData.payment)
          setValue('signature', mergedData.signature)
          
          // STEP 8: Update UI state
          setLastSaved(new Date(savedRecord.save_timestamp))
          
          const saveType = savedRecord.is_manual_save ? 'manual' : 'auto'
          const timeAgo = getTimeAgo(new Date(savedRecord.save_timestamp))
          
          showToast(`Previous progress restored (${saveType} save ${timeAgo})`, 'success')
          console.log('✅ Saved data restored successfully')
          
        } catch (restoreError) {
          console.error('❌ Error restoring saved data:', restoreError)
          console.log('ℹ️ Continuing with fresh form due to restoration error')
          showToast('Unable to restore previous progress - starting fresh', 'info')
        }
        
      } catch (error) {
        // Catch-all for unexpected errors
        console.error('❌ Unexpected error in loadSavedData:', error)
        console.log('ℹ️ Continuing without saved data due to unexpected error')
        
        // Don't show error to user unless it's something they should know about
        // Auto-save is a convenience feature, not critical functionality
      }
    }
    
    const initializeForm = async () => {
      setIsLoading(true)
      
      // First check if the claims system is enabled
      const systemStatusResult = await checkSystemStatus()
      setSystemStatus(systemStatusResult)
      
      if (!systemStatusResult.isEnabled) {
        showToast(systemStatusResult.maintenanceMessage, 'error')
        // Set loading to false to show the maintenance message
        setIsLoading(false)
        return
      }
      
      const status = await validateClaimCode(code)
      setClaimStatus(status)
      
      if (!status.exists) {
        showToast('Invalid claim code', 'error')
        setTimeout(() => router.push('/'), 2000)
        return
      }
      
      if (status.isUsed) {
        setTimeout(() => router.push('/already-used'), 1000)
        return
      }
      
      if (status.hasExpired || !status.isActive) {
        setTimeout(() => router.push('/expired'), 1000)
        return
      }
      
      await loadSavedData()
      setIsLoading(false)
      resetTimeout()
    }
    
    initializeForm()
  }, [code, router, setValue, resetTimeout, showToast])
  
   // User activity tracking effect
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current)
    }
  }, [handleUserActivity])
  
  // ==========================================
  // LOADING AND DISABLED STATES SECTION
  // ==========================================
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating claim code...</p>
        </div>
      </div>
    )
  }
  
  // Claims system disabled - show maintenance message
  if (!systemStatus.isEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Claims Filing Temporarily Disabled</h1>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {systemStatus.maintenanceMessage}
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // ==========================================
  // MAIN RENDER SECTION
  // ==========================================
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast Component */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={hideToast} 
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Settlement Claim Form Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">Settlement Claim Form</h1>
          <p className="text-gray-600 mt-2 text-center">Claim Code: <span className="font-semibold">{code}</span></p>
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-1 text-center">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {/* Important Settlement Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-center text-lg font-bold text-blue-800 mb-4">IMPORTANT SETTLEMENT NOTICE</h2>
          <div className="text-sm text-blue-700 space-y-2">
            <p className="text-center">
              <strong>NOTE:</strong> THIS CLAIM FORM WILL NOT BE VALID WITHOUT YOUR SIGNATURE. YOU MUST ALSO CERTIFY THAT THE 
              ADDRESS LISTED ABOVE IS CORRECT, OR PROVIDE YOUR CURRENT ADDRESS. IF YOU SUBMIT THE FORM WITHOUT 
              THAT INFORMATION, YOU WILL NOT RECEIVE A HIGHER CASH PAYMENT FROM THE SETTLEMENT FUND. You will still be 
              <span className="underline">eligible to receive a lower automatic payment</span>.
            </p>
            <p className="text-center text-red-600 font-semibold">
              THE DEADLINE TO SUBMIT A CLAIM IS: {claimDeadline.formatted}
              {!claimDeadline.isFromDatabase && (
                <span className="block text-xs text-orange-600 mt-1">
                  </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Security Notice:</strong> Your session will automatically expire after 5 minutes of inactivity. Your progress is automatically saved.
          </p>
        </div>
        
        {/* Timeout Warning Modal */}
        {timeoutWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Timeout Warning</h3>
              <p className="text-gray-600 mb-4">
                Your session will expire in 1 minute due to inactivity. Click anywhere to continue.
              </p>
              <button
                onClick={() => setTimeoutWarning(false)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Continue Session
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Section I: Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Section I: Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Controller
                  name="contactInfo.fullName"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.contactInfo?.fullName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  )}
                />
                {errors.contactInfo?.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactInfo.fullName.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Controller
                  name="contactInfo.email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.contactInfo?.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  )}
                />
                {errors.contactInfo?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactInfo.email.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <Controller
                  name="contactInfo.address"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.contactInfo?.address ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  )}
                />
                {errors.contactInfo?.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactInfo.address.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <Controller
                  name="contactInfo.city"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.contactInfo?.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  )}
                />
                {errors.contactInfo?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactInfo.city.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <Controller
                  name="contactInfo.state"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.contactInfo?.state ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  )}
                />
                {errors.contactInfo?.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactInfo.state.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <Controller
                  name="contactInfo.zipCode"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.contactInfo?.zipCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  )}
                />
                {errors.contactInfo?.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactInfo.zipCode.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Controller
                  name="contactInfo.phone"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
              </div>
            </div>
          </div>
          
          {/* Section II: Type of Harm Experienced */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Section II: Type of Harm Experienced</h2>
            <p className="text-sm text-gray-600 mb-6">Please select all types of harm you experienced (check all that apply):</p>
            
            {renderHarmTypeSection(
              'emotionalDistress',
              'Emotional distress due to security concerns related to personal, account, and financial information'
            )}
            
            {renderHarmTypeSection(
              'transactionDelayed',
              'Transaction delayed due to additional vetting requirements related to the incident',
              true
            )}
            
            {renderHarmTypeSection(
              'creditDenied',
              'Credit denied due to security concerns related to the incident',
              true
            )}
            
            {renderHarmTypeSection(
              'unableToComplete',
              'Unable to complete a transaction due to account restrictions related to the incident',
              true
            )}
            
            {renderHarmTypeSection(
              'other',
              'Other harm not described above',
              true
            )}
            
            {errors.harmTypes && (
              <p className="mt-4 text-sm text-red-600">{errors.harmTypes.message}</p>
            )}
          </div>
          
          {/* Section III: Payment Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Section III: Payment Method</h2>
            
            <BrandedPaymentOptions 
              register={register} 
              errors={errors.payment} 
              selectedMethod={watchPaymentMethod}
            />
            
            {errors.payment && (
              <p className="mt-4 text-sm text-red-600">{errors.payment.message}</p>
            )}
          </div>
          
          {/* Section IV: Digital Signature */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Section IV: Digital Signature</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Signature *
                </label>
                <Controller
                  name="signature.signature"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.signature?.signature ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Type your full name as your digital signature"
                    />
                  )}
                />
                {errors.signature?.signature && (
                  <p className="mt-1 text-sm text-red-600">{errors.signature.signature.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Printed Name *
                </label>
                <Controller
                  name="signature.printedName"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.signature?.printedName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Print your full name"
                    />
                  )}
                />
                {errors.signature?.printedName && (
                  <p className="mt-1 text-sm text-red-600">{errors.signature.printedName.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="text"
                  value="Date will be set automatically when form is submitted"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  The date will be automatically filled when you submit the form
                </p>
              </div>
            </div>
          </div>
          
        {/* Form Actions */}
<div className="bg-white rounded-lg shadow-sm p-6">

  {/* Main Submit Button */}
  <button
    type="submit"
    disabled={isSubmitting || !isValid}
    className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
  >
    {isSubmitting ? (
      <>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
        Submitting...
      </>
    ) : (
      <>
        <Send className="h-5 w-5 mr-3" />
        Submit Claim
      </>
    )}
  </button>
  
  {/* Secondary Action Buttons */}
  <div className="grid grid-cols-2 gap-4">
    <button
      type="button"
      onClick={() => router.push('/')}
      className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Home
    </button>
    
    <button
      type="button"
      onClick={handleManualSave}
      className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <Save className="h-4 w-4 mr-2" />
      Save Draft
    </button>
  </div>
  
  {!isValid && (
    <p className="mt-4 text-sm text-red-600 text-center">
      Please fill in all required fields before submitting.
    </p>
  )}
</div>
        </form>
        
         </div>
    </div>
  )
}