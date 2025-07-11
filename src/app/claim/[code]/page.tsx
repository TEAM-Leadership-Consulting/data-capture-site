// app/claim/[code]/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase, type Claim } from '../../../lib/supabase'
import { claimFormSchema, type ClaimFormData } from '../../../lib/schemas'
import { Save, Send, ArrowLeft, CheckCircle, X, Upload, File, Trash2 } from 'lucide-react'
import BrandedPaymentOptions from '@/components/BrandedPaymentOptions'

// File Upload Component
interface FileUploadProps {
  label: string
  files: File[]
  onFilesChange: (files: File[]) => void
  maxFiles?: number
  maxSizePerFile?: number
  acceptedTypes?: string[]
  required?: boolean
  error?: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  files,
  onFilesChange,
  maxFiles = 5,
  maxSizePerFile = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  required = false,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // Validate files
    const validFiles: File[] = []
    const errors: string[] = []

    selectedFiles.forEach(file => {
      // Check file size
      if (file.size > maxSizePerFile) {
        errors.push(`${file.name} is too large (max ${Math.round(maxSizePerFile / 1024 / 1024)}MB)`)
        return
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''))
        }
        return file.type === type || file.name.toLowerCase().endsWith(type)
      })

      if (!isValidType) {
        errors.push(`${file.name} is not a supported file type`)
        return
      }

      validFiles.push(file)
    })

    // Check total file limit
    const totalFiles = files.length + validFiles.length
    if (totalFiles > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      return
    }

    if (errors.length > 0) {
      alert('File upload errors:\n' + errors.join('\n'))
      return
    }

    onFilesChange([...files, ...validFiles])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="mt-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Click to upload or drag and drop files here
          </p>
          <p className="text-xs text-gray-500">
            Supported: PDF, DOC, DOCX, TXT, Images (max {Math.round(maxSizePerFile / 1024 / 1024)}MB each, {maxFiles} files total)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>
      </div>

      {/* Display uploaded files */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}

      {required && files.length === 0 && (
        <p className="text-red-600 text-sm mt-1">Please upload at least one supporting document.</p>
      )}
    </div>
  )
}

// Timeout Warning Modal Component
interface TimeoutWarningModalProps {
  isOpen: boolean
  onExtendSession: () => void
  onLogout: () => void
  onClose: () => void
}

const TimeoutWarningModal: React.FC<TimeoutWarningModalProps> = ({
  isOpen,
  onExtendSession,
  onLogout,
  onClose
}) => {
  const [countdown, setCountdown] = useState(120)
  const [isActive, setIsActive] = useState(false)

  // Reset and start countdown when modal opens
  useEffect(() => {
    if (isOpen && !isActive) {
      setCountdown(120)
      setIsActive(true)
    } else if (!isOpen) {
      setIsActive(false)
    }
  }, [isOpen, isActive])

  // Simple countdown effect
  useEffect(() => {
    if (!isActive || countdown <= 0) return

    const timer = setTimeout(() => {
      setCountdown(prev => {
        const newCount = prev - 1
        if (newCount <= 0) {
          setIsActive(false)
          onLogout()
          return 0
        }
        return newCount
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, isActive, onLogout])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-in fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-lg">⚠️</span>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Session Timeout Warning
            </h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            Your session will expire soon due to inactivity. You will be automatically 
            logged out and redirected to the login page.
          </p>
          
          <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-2xl font-mono font-bold text-red-700">
              {formatTime(countdown)}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mt-3">
            <strong>Don&apos;t worry:</strong> Your form progress has been automatically saved. 
            You can log back in and continue where you left off.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onExtendSession}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold transition-colors"
          >
            Continue Working
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors"
          >
            Log Out Now
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          For security purposes, sessions automatically expire after 15 minutes of inactivity.
        </div>
      </div>
    </div>
  )
}

// Activity Timeout Hook
interface UseActivityTimeoutProps {
  timeoutMinutes?: number
  onTimeout?: () => void
  warningMinutes?: number
  onWarning?: () => void
  isActive?: boolean
}

const useActivityTimeout = ({
  timeoutMinutes = 15,
  onTimeout,
  warningMinutes = 2,
  onWarning,
  isActive = true
}: UseActivityTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
  }, [])

  const handleTimeout = useCallback(() => {
    clearTimeouts()
    localStorage.removeItem('claim_session_active')
    
    if (onTimeout) {
      onTimeout()
    } else {
      // Force redirect using window.location for more reliable navigation
      window.location.href = '/'
    }
  }, [onTimeout, clearTimeouts])

  const handleWarning = useCallback(() => {
    if (onWarning) {
      onWarning()
    }
  }, [onWarning])

  const resetTimeout = useCallback(() => {
    if (!isActive) return

    lastActivityRef.current = Date.now()
    clearTimeouts()

    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000
    if (warningMs > 0) {
      warningTimeoutRef.current = setTimeout(handleWarning, warningMs)
    }

    const timeoutMs = timeoutMinutes * 60 * 1000
    timeoutRef.current = setTimeout(handleTimeout, timeoutMs)
  }, [timeoutMinutes, warningMinutes, handleTimeout, handleWarning, isActive, clearTimeouts])

  const trackActivity = useCallback((event: Event) => {
    if (!isActive) return
    
    const meaningfulEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    if (meaningfulEvents.includes(event.type)) {
      const now = Date.now()
      if (now - lastActivityRef.current > 30000) { // 30 seconds throttle
        lastActivityRef.current = now
        resetTimeout()
      }
    }
  }, [resetTimeout, isActive])

  useEffect(() => {
    if (!isActive) {
      clearTimeouts()
      return
    }

    localStorage.setItem('claim_session_active', 'true')
    resetTimeout()

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity)
      })
      clearTimeouts()
      localStorage.removeItem('claim_session_active')
    }
  }, [trackActivity, resetTimeout, isActive, clearTimeouts])

  useEffect(() => {
    return () => {
      clearTimeouts()
      localStorage.removeItem('claim_session_active')
    }
  }, [clearTimeouts])

  return {
    resetTimeout,
    getRemainingTime: () => {
      if (!timeoutRef.current || !isActive) return 0
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = (timeoutMinutes * 60 * 1000) - elapsed
      return Math.max(0, remaining)
    }
  }
}

// Toast Component
interface ToastProps {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 animate-in slide-in-from-bottom duration-300">
      <div className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-6 rounded-xl shadow-2xl border-2 ${
        type === 'success' 
          ? 'bg-green-50 border-green-300 text-green-900' 
          : 'bg-red-50 border-red-300 text-red-900'
      }`}>
        {type === 'success' && <CheckCircle className="h-5 w-5 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />}
        <span className="text-sm sm:text-lg font-semibold flex-1">{message}</span>
        <button
          onClick={onClose}
          className="hover:opacity-70 transition-opacity p-1 flex-shrink-0"
        >
          <X className="h-4 w-4 sm:h-6 sm:w-6" />
        </button>
      </div>
    </div>
  )
}

export default function ClaimFormPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [claim, setClaim] = useState<Claim | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(false)
  
  // File uploads state
  const [uploadedFiles, setUploadedFiles] = useState<{
    transactionDelayed: File[]
    creditDenied: File[]
    unableToComplete: File[]
    other: File[]
  }>({
    transactionDelayed: [],
    creditDenied: [],
    unableToComplete: [],
    other: []
  })
  
  // Timeout warning modal state
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false
  })

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    mode: 'onChange'
  })

  // Watch all form values for auto-save
  const watchedValues = watch()

  // Watch supporting documentation fields to show/hide file uploads
  const watchSupportingDocsTransactionDelayed = watch('supportingDocsTransactionDelayed')
  const watchSupportingDocsCreditDenied = watch('supportingDocsCreditDenied')
  const watchSupportingDocsUnableToComplete = watch('supportingDocsUnableToComplete')
  const watchSupportingDocsOther = watch('supportingDocsOther')

  // Toast helper functions
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, isVisible: true })
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  // File upload handlers
  const handleFileUpload = useCallback((category: keyof typeof uploadedFiles, files: File[]) => {
    setUploadedFiles(prev => ({
      ...prev,
      [category]: files
    }))
  }, [])

  const saveDraft = useCallback(async (formData: Partial<ClaimFormData>, forceSync = false) => {
    if (!claim || (isSaving && !forceSync) || isSubmitting || isDataLoading) return

    setIsSaving(true)
    try {
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => value !== undefined)
      )

      console.log('Saving form data:', cleanedData)

      const { error } = await supabase
        .from('claim_submissions')
        .upsert({
          claim_id: claim.id,
          unique_code: code,
          form_data: cleanedData,
          status: 'draft',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'claim_id',
          ignoreDuplicates: false
        })

      if (error) throw error
      
      if (!forceSync) {
        showToast('Draft saved successfully')
      }
    } catch (error) {
      console.error('Save error:', error)
      if (!forceSync) {
        showToast('Save failed', 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }, [claim, isSaving, isSubmitting, isDataLoading, code, showToast])

  // Timeout handling functions
  const handleTimeoutWarning = useCallback(() => {
    setShowTimeoutWarning(true)
    showToast('Session expiring soon! Your progress has been saved.', 'error')
  }, [showToast])

  const handleSessionTimeout = useCallback(() => {
    // Save current form data before logout
    if (claim && watchedValues && Object.keys(watchedValues).length > 0) {
      saveDraft(watchedValues, true) // Force save before logout
    }
    
    // Clear session data
    localStorage.removeItem('claim_session_active')
    
    // Show timeout message
    showToast('Session expired. Redirecting to login...', 'error')
    
    // Force redirect immediately
    setTimeout(() => {
      window.location.href = '/'
    }, 1000)
  }, [claim, watchedValues, saveDraft, showToast])

  const handleExtendSession = useCallback(() => {
    setShowTimeoutWarning(false)
    // Trigger activity to reset the timer
    document.dispatchEvent(new Event('mousedown'))
    showToast('Session extended successfully!', 'success')
  }, [showToast])

  const handleLogoutNow = useCallback(() => {
    setShowTimeoutWarning(false)
    handleSessionTimeout()
  }, [handleSessionTimeout])

  // Initialize activity timeout
  useActivityTimeout({
    timeoutMinutes: 15,
    warningMinutes: 2,
    onTimeout: handleSessionTimeout,
    onWarning: handleTimeoutWarning,
    isActive: !isLoading && !!claim // Only active when form is loaded
  })

  const loadClaimData = useCallback(async () => {
    try {
      setIsDataLoading(true) // Set this FIRST to prevent auto-save triggers
      
      // Verify claim code
      const { data: claimData, error: claimError } = await supabase
        .from('claims')
        .select('*')
        .eq('unique_code', code)
        .eq('is_active', true)
        .single()

      if (claimError || !claimData) {
        router.push('/')
        return
      }

      setClaim(claimData)

      // Check if a claim has already been submitted for this code
      const { data: submittedClaims, error: submittedError } = await supabase
        .from('claim_submissions')
        .select('*')
        .eq('unique_code', code)
        .eq('status', 'submitted')

      // Handle error properly - don't treat "no results" as an error
      if (submittedError) {
        console.warn('Error checking submitted claims:', submittedError)
      }

      // Check if we actually have any submitted claims
      if (submittedClaims && submittedClaims.length > 0) {
        // Redirect to already used page
        router.push(`/claim/${code}/already-used`)
        return
      }

      // Load existing draft submission if any
      console.log('Looking for draft with code:', code)
      const { data: submissionData, error: submissionError } = await supabase
        .from('claim_submissions')
        .select('*')
        .eq('unique_code', code)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)

      console.log('Draft query result:', { submissionData, submissionError })

      if (submissionError) {
        console.warn('Error loading draft:', submissionError)
      }

      // Use the first result if we have data
      const latestDraft = submissionData && submissionData.length > 0 ? submissionData[0] : null

      if (latestDraft?.form_data) {
        let formData: Partial<ClaimFormData>
        
        try {
          // Handle corrupted data - check if it's a string that needs parsing
          if (typeof latestDraft.form_data === 'string') {
            console.log('Parsing stringified form data...')
            formData = JSON.parse(latestDraft.form_data)
          } else if (typeof latestDraft.form_data === 'object' && latestDraft.form_data !== null) {
            // Check if it's the corrupted object format (has numeric string keys)
            const keys = Object.keys(latestDraft.form_data)
            if (keys.some(key => /^\d+$/.test(key))) {
              console.log('Detected corrupted data format, attempting to reconstruct...')
              // Try to reconstruct the original JSON string
              const reconstructed = keys
  .sort((a, b) => parseInt(a) - parseInt(b))
  .map(key => (latestDraft.form_data as Record<string, string>)[key])
  .join('')

              formData = JSON.parse(reconstructed)
            } else {
              // Normal object format
              formData = latestDraft.form_data as Partial<ClaimFormData>
            }
          } else {
            console.warn('Unexpected form_data format:', typeof latestDraft.form_data)
            formData = {}
          }
          
          console.log('Loading saved data:', formData)
          
          // Use reset instead of setValue to avoid triggering watch multiple times
          reset(formData, {
            keepDirty: false,
            keepTouched: false,
            keepIsValid: false
          })
          
        } catch (error) {
          console.error('Error parsing saved form data:', error)
          console.log('Corrupted data:', latestDraft.form_data)
          // If parsing fails, start with empty form
          reset({}, {
            keepDirty: false,
            keepTouched: false,
            keepIsValid: false
          })
        }
        
        setTimeout(() => {
          setIsDataLoading(false)
        }, 100)
      } else {
        console.log('No draft data found to load')
        setIsDataLoading(false)
      }
    } catch (error) {
      console.error('Error loading claim data:', error)
      setIsDataLoading(false)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }, [code, router, reset])

  // Load claim data and any existing submission
  useEffect(() => {
    loadClaimData()
  }, [loadClaimData])

  // Auto-save functionality with proper guards
  useEffect(() => {
    // Don't set up auto-save if still loading data or no claim
    if (isDataLoading || !claim) return

    let isInitialLoad = true

    const subscription = watch((value, { name, type }) => {
      // Skip auto-save on initial load/mount
      if (isInitialLoad) {
        isInitialLoad = false
        return
      }

      // Skip if still loading data or no actual field changes
      if (isDataLoading || !name || type !== 'change') return

      // Clear any existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        // Double-check we're still in a valid state
        if (!isDataLoading && !isSaving && !isSubmitting && claim) {
          saveDraft(value as ClaimFormData)
        }
      }, 2000)
    })
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      subscription.unsubscribe()
    }
  }, [watch, saveDraft, isDataLoading, claim, isSaving, isSubmitting])

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Validate file uploads based on documentation requirements
  const validateFileUploads = () => {
    const errors: string[] = []

    if (watchSupportingDocsTransactionDelayed === 'yes' && uploadedFiles.transactionDelayed.length === 0) {
      errors.push('Please upload supporting documentation for transaction delays.')
    }
    if (watchSupportingDocsCreditDenied === 'yes' && uploadedFiles.creditDenied.length === 0) {
      errors.push('Please upload supporting documentation for credit denial.')
    }
    if (watchSupportingDocsUnableToComplete === 'yes' && uploadedFiles.unableToComplete.length === 0) {
      errors.push('Please upload supporting documentation for incomplete transactions.')
    }
    if (watchSupportingDocsOther === 'yes' && uploadedFiles.other.length === 0) {
      errors.push('Please upload supporting documentation for other harm.')
    }

    return errors
  }

  const onSubmit: SubmitHandler<ClaimFormData> = async (data) => {
    if (!claim) return

    console.log('Form submitted with data:', data)
    console.log('Form errors:', errors)

    // Validate file uploads
    const fileErrors = validateFileUploads()
    if (fileErrors.length > 0) {
      console.error('File validation errors:', fileErrors)
      showToast('Please upload required supporting documentation', 'error')
      return
    }

    // Check if at least one harm type is selected
    const hasHarmSelected = data.harmEmotionalDistress || 
                           data.harmTransactionDelayed || 
                           data.harmCreditDenied || 
                           data.harmUnableToComplete || 
                           data.harmOther

    if (!hasHarmSelected) {
      showToast('Please select at least one type of harm you experienced', 'error')
      return
    }

    // Validate payment method details
    if (!data.paymentMethod) {
      showToast('Please select a payment method', 'error')
      return
    }

    // Validate payment details based on selected method
    let paymentDetailsValid = true
    let paymentError = ''

    switch (data.paymentMethod) {
      case 'paypal':
        if (!data.paypalEmail || data.paypalEmail.length === 0) {
          paymentDetailsValid = false
          paymentError = 'Please provide your PayPal email address'
        }
        break
      case 'venmo':
        if (!data.venmoPhone || data.venmoPhone.length === 0) {
          paymentDetailsValid = false
          paymentError = 'Please provide your Venmo phone number'
        }
        break
      case 'zelle':
        if ((!data.zellePhone || data.zellePhone.length === 0) && 
            (!data.zelleEmail || data.zelleEmail.length === 0)) {
          paymentDetailsValid = false
          paymentError = 'Please provide either your Zelle phone number or email address'
        }
        break
      case 'prepaidCard':
        if (!data.prepaidCardEmail || data.prepaidCardEmail.length === 0) {
          paymentDetailsValid = false
          paymentError = 'Please provide your email address for the prepaid card'
        }
        break
      case 'physicalCheck':
        // No additional validation needed
        break
      default:
        paymentDetailsValid = false
        paymentError = 'Invalid payment method selected'
    }

    if (!paymentDetailsValid) {
      showToast(paymentError, 'error')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('Starting submission process...')
      
      // TODO: In a real implementation, you would upload files to storage first
      // and save the file URLs/references with the form data
      
      const submissionData = {
        ...data,
        // Add file information to the submission
        uploadedFilesCounts: {
          transactionDelayed: uploadedFiles.transactionDelayed.length,
          creditDenied: uploadedFiles.creditDenied.length,
          unableToComplete: uploadedFiles.unableToComplete.length,
          other: uploadedFiles.other.length
        }
      }

      console.log('Submitting to Supabase:', submissionData)

      // First, check if there's an existing draft for this claim
      const { data: existingDraft, error: fetchError } = await supabase
        .from('claim_submissions')
        .select('id')
        .eq('unique_code', code)
        .eq('status', 'draft')
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking for existing draft:', fetchError)
        throw fetchError
      }

      let result
      if (existingDraft) {
        // Update the existing draft to submitted status
        console.log('Updating existing draft to submitted status...')
        result = await supabase
          .from('claim_submissions')
          .update({
            form_data: submissionData,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDraft.id)
      } else {
        // Create new submission record
        console.log('Creating new submission record...')
        result = await supabase
          .from('claim_submissions')
          .insert({
            claim_id: claim.id,
            unique_code: code,
            form_data: submissionData,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      if (result.error) {
        console.error('Supabase submission error:', result.error)
        throw result.error
      }

      console.log('Submission successful, clearing session...')

      // Clear session data on successful submission
      localStorage.removeItem('claim_session_active')

      // Clear any pending auto-save timeouts
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
        autoSaveTimeoutRef.current = null
      }

      console.log('Redirecting to success page...')
      router.push(`/claim/${code}/success`)
    } catch (error) {
      console.error('Error submitting claim:', error)
      showToast('Error submitting claim. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading claim form...</p>
        </div>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600">Claim not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Timeout Warning Modal */}
      <TimeoutWarningModal
        isOpen={showTimeoutWarning}
        onExtendSession={handleExtendSession}
        onLogout={handleLogoutNow}
        onClose={() => setShowTimeoutWarning(false)}
      />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {claim.title}
              </h1>
              {claim.description && (
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{claim.description}</p>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-700 font-medium">
                  IMPORTANT SETTLEMENT NOTICE
                </p>
                <p className="text-xs sm:text-sm text-blue-700 mt-2">
                  <strong>NOTE:</strong> THIS CLAIM FORM WILL NOT BE VALID WITHOUT YOUR SIGNATURE. YOU MUST ALSO CERTIFY 
                  THAT THE ADDRESS LISTED ABOVE IS CORRECT, OR PROVIDE YOUR CURRENT ADDRESS. IF YOU SUBMIT THE FORM 
                  WITHOUT THAT INFORMATION, YOU WILL NOT RECEIVE A HIGHER CASH PAYMENT FROM THE SETTLEMENT FUND. 
                  You will still be eligible to receive a lower automatic payment.
                </p>
                <p className="text-xs sm:text-sm text-red-600 mt-2 font-medium">
                  THE DEADLINE TO SUBMIT A CLAIM IS: <strong>MARCH 26, 2025</strong>
                </p>
              </div>
            
              {/* Show loading state when data is being populated */}
              {isDataLoading && (
                <div className="mt-3 sm:mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs sm:text-sm text-yellow-800">Loading your saved data...</p>
                </div>
              )}

              {/* Session timeout notice */}
              <div className="mt-3 sm:mt-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-800">
                  <strong>Security Notice:</strong> Your session will automatically expire after 15 minutes of inactivity. 
                  Your progress is automatically saved.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Section I: Contact Information Update */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Section I: Contact Information
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                If the contact information at the top of this form is incorrect, please update it below.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    {...register('fullName')}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.fullName && (
                    <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register('email')}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  id="address"
                  {...register('address')}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.address && (
                  <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    {...register('city')}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.city && (
                    <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    id="state"
                    {...register('state')}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.state && (
                    <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    {...register('zipCode')}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.zipCode && (
                    <p className="text-red-600 text-sm mt-1">{errors.zipCode.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register('phone')}
                  className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Section II: Harm Types and Details */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Section II: Types of Harm Experienced
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Please select all types of harm you experienced and provide details:
              </p>

              <div className="space-y-3 sm:space-y-4">
                {/* Emotional Distress */}
                <div className="border rounded-md p-3 sm:p-4">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('harmEmotionalDistress')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Emotional distress or mental anguish
                    </span>
                  </label>
                  <textarea
                    {...register('harmDetailsEmotionalDistress')}
                    placeholder="Please describe the emotional distress you experienced..."
                    rows={3}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Transaction Delayed */}
                <div className="border rounded-md p-3 sm:p-4">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('harmTransactionDelayed')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Transaction was delayed
                    </span>
                  </label>
                  <textarea
                    {...register('harmDetailsTransactionDelayed')}
                    placeholder="Please describe how your transaction was delayed..."
                    rows={3}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-2">
                    <span className="text-sm text-gray-700">Do you have supporting documentation?</span>
                    <div className="flex gap-3 mt-1">
                      <label className="relative">
                        <input
                          type="radio"
                          value="yes"
                          {...register('supportingDocsTransactionDelayed')}
                          className="sr-only peer"
                        />
                        <div className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-md cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-900 hover:border-blue-400">
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      </label>
                      <label className="relative">
                        <input
                          type="radio"
                          value="no"
                          {...register('supportingDocsTransactionDelayed')}
                          className="sr-only peer"
                        />
                        <div className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-md cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-900 hover:border-blue-400">
                          <span className="text-sm font-medium">No</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* File Upload for Transaction Delayed */}
                  {watchSupportingDocsTransactionDelayed === 'yes' && (
                    <FileUpload
                      label="Upload supporting documentation for transaction delays"
                      files={uploadedFiles.transactionDelayed}
                      onFilesChange={(files) => handleFileUpload('transactionDelayed', files)}
                      required={true}
                    />
                  )}
                </div>

                {/* Credit Denied */}
                <div className="border rounded-md p-3 sm:p-4">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('harmCreditDenied')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Credit was denied
                    </span>
                  </label>
                  <textarea
                    {...register('harmDetailsCreditDenied')}
                    placeholder="Please describe how your credit was denied..."
                    rows={3}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-2">
                    <span className="text-sm text-gray-700">Do you have supporting documentation?</span>
                    <div className="flex gap-3 mt-1">
                      <label className="relative">
                        <input
                          type="radio"
                          value="yes"
                          {...register('supportingDocsCreditDenied')}
                          className="sr-only peer"
                        />
                        <div className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-md cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-900 hover:border-blue-400">
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      </label>
                      <label className="relative">
                        <input
                          type="radio"
                          value="no"
                          {...register('supportingDocsCreditDenied')}
                          className="sr-only peer"
                        />
                        <div className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-md cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-900 hover:border-blue-400">
                          <span className="text-sm font-medium">No</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* File Upload for Credit Denied */}
                  {watchSupportingDocsCreditDenied === 'yes' && (
                    <FileUpload
                      label="Upload supporting documentation for credit denial"
                      files={uploadedFiles.creditDenied}
                      onFilesChange={(files) => handleFileUpload('creditDenied', files)}
                      required={true}
                    />
                  )}
                </div>

                {/* Unable to Complete */}
                <div className="border rounded-md p-3 sm:p-4">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('harmUnableToComplete')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Unable to complete transaction
                    </span>
                  </label>
                  <textarea
                    {...register('harmDetailsUnableToComplete')}
                    placeholder="Please describe how you were unable to complete a transaction..."
                    rows={3}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-2">
                    <span className="text-sm text-gray-700">Do you have supporting documentation?</span>
                    <div className="flex gap-3 mt-1">
                      <label className="relative">
                        <input
                          type="radio"
                          value="yes"
                          {...register('supportingDocsUnableToComplete')}
                          className="sr-only peer"
                        />
                        <div className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-md cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-900 hover:border-blue-400">
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      </label>
                      <label className="relative">
                        <input
                          type="radio"
                          value="no"
                          {...register('supportingDocsUnableToComplete')}
                          className="sr-only peer"
                        />
                        <div className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-md cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-900 hover:border-blue-400">
                          <span className="text-sm font-medium">No</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* File Upload for Unable to Complete */}
                  {watchSupportingDocsUnableToComplete === 'yes' && (
                    <FileUpload
                      label="Upload supporting documentation for incomplete transactions"
                      files={uploadedFiles.unableToComplete}
                      onFilesChange={(files) => handleFileUpload('unableToComplete', files)}
                      required={true}
                    />
                  )}
                </div>

                {/* Other */}
                <div className="border rounded-md p-3 sm:p-4">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      {...register('harmOther')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Other harm
                    </span>
                  </label>
                  <textarea
                    {...register('harmDetailsOther')}
                    placeholder="Please describe any other harm you experienced..."
                    rows={3}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="mt-2">
                    <span className="text-sm text-gray-700">Do you have supporting documentation?</span>
                    <div className="flex gap-3 mt-1">
                      <label className="relative">
                        <input
                          type="radio"
                          value="yes"
                          {...register('supportingDocsOther')}
                          className="sr-only peer"
                        />
                        <div className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-md cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-900 hover:border-blue-400">
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      </label>
                      <label className="relative">
                        <input
                          type="radio"
                          value="no"
                          {...register('supportingDocsOther')}
                          className="sr-only peer"
                        />
                        <div className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-md cursor-pointer peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-900 hover:border-blue-400">
                          <span className="text-sm font-medium">No</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* File Upload for Other */}
                  {watchSupportingDocsOther === 'yes' && (
                    <FileUpload
                      label="Upload supporting documentation for other harm"
                      files={uploadedFiles.other}
                      onFilesChange={(files) => handleFileUpload('other', files)}
                      required={true}
                    />
                  )}
                </div>
              </div>

              {errors.harmEmotionalDistress && (
                <p className="text-red-600 text-sm mt-2">{errors.harmEmotionalDistress.message}</p>
              )}
            </div>

            {/* Section III: Payment Method */}
            <BrandedPaymentOptions 
              register={register}
              watchedValues={watchedValues}
              errors={errors}
            />

            {/* Section IV: Digital Signature */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Section IV: Digital Signature
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                By signing below, you certify that the information provided is true and accurate to the best of your knowledge.
              </p>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-1">
                    Digital Signature *
                  </label>
                  <input
                    type="text"
                    id="signature"
                    {...register('signature')}
                    placeholder="Type your full name as your digital signature"
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-script text-lg"
                  />
                  {errors.signature && (
                    <p className="text-red-600 text-sm mt-1">{errors.signature.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="printedName" className="block text-sm font-medium text-gray-700 mb-1">
                    Printed Name *
                  </label>
                  <input
                    type="text"
                    id="printedName"
                    {...register('printedName')}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.printedName && (
                    <p className="text-red-600 text-sm mt-1">{errors.printedName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signatureDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="signatureDate"
                    {...register('signatureDate')}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.signatureDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.signatureDate.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs sm:text-sm text-red-800">
                  <strong>IMPORTANT:</strong> By submitting this form, you acknowledge that you have read and understand the settlement terms. 
                  Submission of false information may result in denial of your claim and potential legal consequences.
                </p>
              </div>
            </div>

            {/* Submit Section */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                {/* Main Submit Button - Full Width */}
                <button
                  type="submit"
                  disabled={isSubmitting || isDataLoading}
                  className="w-full flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold min-h-[56px] text-lg"
                >
                  <Send className="h-6 w-6 mr-3" />
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>

                {/* Secondary Buttons - Evenly Spaced */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[48px] text-sm font-medium"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </button>

                  <button
                    type="button"
                    onClick={() => saveDraft(watchedValues)}
                    disabled={isSaving || isDataLoading}
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm font-medium"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs sm:text-sm text-gray-600">
                  {isDataLoading 
                    ? 'Loading your saved data...' 
                    : 'Your form will be automatically saved as you complete each section. Session expires after 15 minutes of inactivity.'
                  }
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}