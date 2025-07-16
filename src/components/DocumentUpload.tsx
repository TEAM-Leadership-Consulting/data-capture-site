// components/DocumentUpload.tsx - PRODUCTION READY VERSION (Fixed ESLint/TS errors)
'use client'

import React, { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { 
  Upload, 
  File, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet
} from 'lucide-react'
import { 
  DocumentDisplayItem, 
  DocumentCategory, 
  UploadProgress,
  DEFAULT_UPLOAD_CONFIG
} from '../types/documents'

interface DocumentUploadProps {
  category: DocumentCategory
  documents: DocumentDisplayItem[]
  onUpload: (files: File[]) => Promise<void>
  onRemove: (documentId: string) => Promise<void>
  isUploading?: boolean
  uploadProgress?: UploadProgress[]
  required?: boolean
  maxFiles?: number
  disabled?: boolean
  className?: string
}

// File type icons
const getFileIcon = (fileType: string) => {
  const iconClass = "h-8 w-8 text-gray-400"
  
  if (fileType.startsWith('image/')) {
    return <ImageIcon className={iconClass} />
  } else if (fileType.includes('pdf')) {
    return <FileText className={iconClass} />
  } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return <FileSpreadsheet className={iconClass} />
  } else {
    return <File className={iconClass} />
  }
}

interface DocumentPreviewProps {
  document: DocumentDisplayItem
  isOpen: boolean
  onClose: () => void
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null

  const isImage = document.file_type?.startsWith('image/')
  const isPDF = document.file_type?.includes('pdf')
  const previewUrl = document.preview_url || document.file_path

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{document.file_name}</h3>
            <p className="text-sm text-gray-500">
              {Math.round((document.file_size || 0) / 1024)} KB • {document.file_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {(isImage && previewUrl) ? (
            <div className="flex items-center justify-center">
              <Image
                src={previewUrl}
                alt={document.file_name}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain"
                onError={() => {
                  console.error('Failed to load image preview')
                }}
                priority
              />
            </div>
          ) : (isPDF && previewUrl) ? (
            <div className="flex items-center justify-center">
              <iframe
                src={previewUrl}
                className="w-full h-96 border rounded"
                title={`Preview of ${document.file_name}`}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              {getFileIcon(document.file_type || '')}
              <p className="mt-4 text-lg">Preview not available</p>
              <p className="text-sm">This file type cannot be previewed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  category,
  documents,
  onUpload,
  onRemove,
  uploadProgress = [],
  required = false,
  maxFiles = DEFAULT_UPLOAD_CONFIG.maxFiles,
  disabled = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)
  const [localErrors, setLocalErrors] = useState<string[]>([])
  const [dragErrors, setDragErrors] = useState<string[]>([])
  const [previewDocument, setPreviewDocument] = useState<DocumentDisplayItem | null>(null)
  const dragCounter = useRef(0)

  // File validation
  const validateFiles = useCallback((files: File[]): { validFiles: File[], errors: string[] } => {
    const validFiles: File[] = []
    const errors: string[] = []
    
    for (const file of files) {
      // Size validation
      if (file.size > DEFAULT_UPLOAD_CONFIG.maxSizePerFile) {
        errors.push(`${file.name}: File size exceeds ${Math.round(DEFAULT_UPLOAD_CONFIG.maxSizePerFile / 1024 / 1024)}MB limit`)
        continue
      }
      
      // Type validation
      if (!DEFAULT_UPLOAD_CONFIG.acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not supported`)
        continue
      }
      
      // Extension validation - Fixed: Use proper typing instead of 'any'
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      const allowedExtensions = DEFAULT_UPLOAD_CONFIG.allowedExtensions as readonly string[]
      if (!allowedExtensions.includes(extension as string)) {
        errors.push(`${file.name}: File extension not allowed`)
        continue
      }
      
      validFiles.push(file)
    }
    
    return { validFiles, errors }
  }, [])

  // Main file selection handler
  const handleFileSelect = useCallback(async (files: File[]) => {
    if (disabled || isProcessingFiles) return
    
    setIsProcessingFiles(true)
    setLocalErrors([])
    setDragErrors([])
    
    try {
      // Validate files
      const { validFiles, errors } = validateFiles(files)
      
      if (errors.length > 0) {
        setLocalErrors(errors)
        return
      }
      
      // Check max files limit
      const totalFiles = documents.length + validFiles.length
      if (totalFiles > maxFiles) {
        setLocalErrors([`Cannot upload more than ${maxFiles} files. Currently have ${documents.length} files.`])
        return
      }
      
      if (validFiles.length === 0) {
        setLocalErrors(['No valid files to upload'])
        return
      }
      
      // Call parent upload handler
      await onUpload(validFiles)
      
    } catch (error) {
      console.error('Error processing files:', error)
      setLocalErrors(['Failed to process files. Please try again.'])
    } finally {
      setIsProcessingFiles(false)
    }
  }, [validateFiles, onUpload, isProcessingFiles, disabled, documents.length, maxFiles])

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(false)
    dragCounter.current = 0
    setDragErrors([])
    
    const files = Array.from(e.dataTransfer.files)
    
    if (files.length === 0) {
      setDragErrors(['No files were dropped'])
      return
    }
    
    await handleFileSelect(files)
  }, [handleFileSelect])

  // Input change handler
  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Reset input to allow re-selection of same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (files.length > 0) {
      await handleFileSelect(files)
    }
  }, [handleFileSelect])

  // Click to upload handler
  const handleClickToUpload = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled || isProcessingFiles) return
    
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 10)
  }, [disabled, isProcessingFiles])

  // Preview handlers
  const handlePreview = useCallback((document: DocumentDisplayItem) => {
    setPreviewDocument(document)
  }, [])

  const handlePreviewClose = useCallback(() => {
    setPreviewDocument(null)
  }, [])

  // Remove document handler
  const handleRemoveDocument = useCallback(async (document: DocumentDisplayItem) => {
    if (!document.id && !document.temp_id) return
    
    const documentId = document.id || document.temp_id || ''
    await onRemove(documentId)
  }, [onRemove])

  const categoryProgress = uploadProgress.find(p => p.category === category)
  const hasErrors = localErrors.length > 0 || dragErrors.length > 0
  const allErrors = [...localErrors, ...dragErrors]
  const canUploadMore = documents.length < maxFiles
  const isAtMaxFiles = documents.length >= maxFiles

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : hasErrors
            ? 'border-red-300 bg-red-50'
            : isAtMaxFiles
            ? 'border-gray-200 bg-gray-100'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        } ${disabled || isProcessingFiles || isAtMaxFiles ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={canUploadMore ? handleClickToUpload : undefined}
      >
        <div className="text-center">
          {isProcessingFiles ? (
            <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          ) : (
            <Upload className={`mx-auto h-12 w-12 ${
              isDragging ? 'text-blue-600' : 
              hasErrors ? 'text-red-400' : 
              isAtMaxFiles ? 'text-gray-300' :
              'text-gray-400'
            }`} />
          )}
          
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              {isProcessingFiles ? 'Processing files...' :
               isDragging ? 'Drop files here' : 
               isAtMaxFiles ? `Maximum ${maxFiles} files reached` :
               'Upload Documents'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {isProcessingFiles ? 'Please wait...' : 
               isAtMaxFiles ? 'Remove files to upload more' :
               'Drag and drop files here, or click to browse'}
            </p>
            {!isAtMaxFiles && (
              <p className="text-xs text-gray-500 mt-2">
                Supports: PDF, DOC, DOCX, TXT, JPG, PNG (max {Math.round(DEFAULT_UPLOAD_CONFIG.maxSizePerFile / 1024 / 1024)}MB each)
              </p>
            )}
            {required && documents.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                * Required - Please upload at least one document
              </p>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={DEFAULT_UPLOAD_CONFIG.acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0"
          disabled={disabled || isProcessingFiles || isAtMaxFiles}
          style={{ 
            cursor: disabled || isProcessingFiles || isAtMaxFiles ? 'not-allowed' : 'pointer',
            zIndex: 1
          }}
        />
      </div>

      {/* Error Messages */}
      {allErrors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Errors</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {allErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {categoryProgress && categoryProgress.status === 'uploading' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin mr-2" />
            <span className="text-sm text-blue-800">
              Uploading {categoryProgress.fileName}... {categoryProgress.progress}%
            </span>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Documents ({documents.length}/{maxFiles})
          </h4>
          
          <div className="space-y-2">
            {documents.map((document, index) => {
              const documentProgress = uploadProgress.find(p => p.fileName === document.file_name)
              const isUploading = document.upload_status === 'uploading'
              const hasError = document.upload_status === 'error'
              
              return (
                <div
                  key={document.id || document.temp_id || index}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    hasError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* File info */}
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(document.file_type || '')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {document.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round((document.file_size || 0) / 1024)} KB
                      </p>
                      
                      {/* Upload progress */}
                      {isUploading && documentProgress && (
                        <div className="mt-1">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${documentProgress.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {documentProgress.progress}%
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Error message */}
                      {hasError && document.error_message && (
                        <p className="text-xs text-red-600 mt-1">
                          {document.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center space-x-2 ml-3">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    ) : hasError ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 ml-2">
                    {/* Preview button */}
                    {document.upload_status === 'completed' && (
                      <button
                        onClick={() => handlePreview(document)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Preview document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveDocument(document)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      disabled={isUploading}
                      title="Remove document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          isOpen={true}
          onClose={handlePreviewClose}
        />
      )}
    </div>
  )
}

export default DocumentUpload