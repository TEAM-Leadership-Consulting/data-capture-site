// components/FilePreview.tsx - PRODUCTION READY VERSION (Fixed ESLint/TS errors)
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  X,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  FileText,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  ExternalLink,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  Copy,
  Check
} from 'lucide-react'
import { DocumentDisplayItem, DOCUMENT_CATEGORY_LABELS } from '../types/documents'

// ==========================================
// INTERFACE DEFINITIONS
// ==========================================

interface FilePreviewProps {
  document: DocumentDisplayItem | null
  isOpen: boolean
  onClose: () => void
  onDelete?: (documentId: string) => void
  onDownload?: (document: DocumentDisplayItem) => void
  onNext?: () => void
  onPrevious?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
  className?: string
}

interface PreviewState {
  zoom: number
  rotation: number
  isFullscreen: boolean
  isLoading: boolean
  error: string | null
  documentUrl: string | null
}

interface CopyState {
  isCopied: boolean
  copyText: string
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get appropriate icon for file type
 */
const getFileIcon = (fileType: string, className = "h-8 w-8") => {
  if (fileType.startsWith('image/')) {
    return <ImageIcon className={`${className} text-blue-600`} />
  } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
    return <FileSpreadsheet className={`${className} text-green-600`} />
  } else if (fileType.includes('pdf')) {
    return <FileText className={`${className} text-red-600`} />
  } else {
    return <File className={`${className} text-gray-600`} />
  }
}

/**
 * Check if file type can be previewed as image
 */
const isPreviewableImage = (fileType: string): boolean => {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(fileType)
}

/**
 * Check if file type can be previewed as PDF
 */
const isPreviewablePDF = (fileType: string): boolean => {
  return fileType === 'application/pdf'
}

/**
 * Check if file type can be previewed as text
 */
const isPreviewableText = (fileType: string): boolean => {
  return fileType === 'text/plain' || fileType.includes('text/')
}

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format date for display
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Get document URL from various possible sources
 */
const getDocumentUrl = (document: DocumentDisplayItem): string | null => {
  // Check for preview URL first (already generated)
  if (document.preview_url) {
    return document.preview_url
  }
  
  // Check for file_path (can be used to construct URL)
  if (document.file_path) {
    return document.file_path
  }
  
  // For file objects (new uploads), create blob URL
  if (document.file) {
    return URL.createObjectURL(document.file)
  }
  
  return null
}

// ==========================================
// COPY TO CLIPBOARD UTILITY
// ==========================================

const useCopyToClipboard = () => {
  const [copyState, setCopyState] = useState<CopyState>({
    isCopied: false,
    copyText: ''
  })

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState({ isCopied: true, copyText: text })
      setTimeout(() => {
        setCopyState({ isCopied: false, copyText: '' })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [])

  return { copyState, copyToClipboard }
}

// ==========================================
// ZOOM AND ROTATION CONTROLS
// ==========================================

interface ZoomControlsProps {
  zoom: number
  _rotation: number
  onZoomIn: () => void
  onZoomOut: () => void
  onRotate: () => void
  onReset: () => void
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  _rotation,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset
}) => (
  <div className="flex items-center space-x-2 bg-black bg-opacity-50 rounded-lg px-3 py-2">
    <button
      onClick={onZoomOut}
      disabled={zoom <= 0.25}
      className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50"
      title="Zoom out"
    >
      <ZoomOut className="h-4 w-4" />
    </button>
    
    <span className="text-white text-sm px-2">
      {Math.round(zoom * 100)}%
    </span>
    
    <button
      onClick={onZoomIn}
      disabled={zoom >= 5}
      className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded disabled:opacity-50"
      title="Zoom in"
    >
      <ZoomIn className="h-4 w-4" />
    </button>
    
    <div className="w-px h-4 bg-white bg-opacity-30" />
    
    <button
      onClick={onRotate}
      className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded"
      title="Rotate 90°"
    >
      <RotateCw className="h-4 w-4" />
    </button>
    
    <button
      onClick={onReset}
      className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded text-xs px-2"
      title="Reset view"
    >
      Reset
    </button>
  </div>
)

// ==========================================
// DOCUMENT INFO PANEL
// ==========================================

interface DocumentInfoPanelProps {
  document: DocumentDisplayItem
  isVisible: boolean
  onClose: () => void
  copyToClipboard: (text: string) => void
  copyState: CopyState
}

const DocumentInfoPanel: React.FC<DocumentInfoPanelProps> = ({
  document,
  isVisible,
  onClose,
  copyToClipboard,
  copyState
}) => {
  if (!isVisible) return null

  const documentUrl = getDocumentUrl(document)

  return (
    <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border w-80 z-10">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Document Info</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-3 text-sm">
          <div>
            <label className="font-medium text-gray-700">File Name:</label>
            <p className="text-gray-900 break-words">{document.file_name}</p>
          </div>
          
          <div>
            <label className="font-medium text-gray-700">Size:</label>
            <p className="text-gray-900">{formatFileSize(document.file_size || 0)}</p>
          </div>
          
          <div>
            <label className="font-medium text-gray-700">Type:</label>
            <p className="text-gray-900">{document.file_type}</p>
          </div>
          
          {document.upload_category && (
            <div>
              <label className="font-medium text-gray-700">Category:</label>
              <p className="text-gray-900">{DOCUMENT_CATEGORY_LABELS[document.upload_category] || document.upload_category}</p>
            </div>
          )}
          
          {document.uploaded_at && (
            <div>
              <label className="font-medium text-gray-700">Uploaded:</label>
              <p className="text-gray-900">{formatDate(document.uploaded_at)}</p>
            </div>
          )}
          
          {document.id && (
            <div>
              <label className="font-medium text-gray-700">Document ID:</label>
              <div className="flex items-center space-x-2">
                <p className="text-gray-900 font-mono text-xs">{document.id}</p>
                <button
                  onClick={() => copyToClipboard(document.id!)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Copy ID"
                >
                  {copyState.isCopied && copyState.copyText === document.id ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {documentUrl && (
            <div>
              <label className="font-medium text-gray-700">URL:</label>
              <div className="flex items-center space-x-2">
                <p className="text-gray-900 font-mono text-xs truncate flex-1">{documentUrl}</p>
                <button
                  onClick={() => copyToClipboard(documentUrl)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Copy URL"
                >
                  {copyState.isCopied && copyState.copyText === documentUrl ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// MAIN FILE PREVIEW COMPONENT
// ==========================================

const FilePreview: React.FC<FilePreviewProps> = ({
  document,
  isOpen,
  onClose,
  onDelete,
  onDownload,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  className = ''
}) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [state, setState] = useState<PreviewState>({
    zoom: 1,
    rotation: 0,
    isFullscreen: false,
    isLoading: false,
    error: null,
    documentUrl: null
  })
  
  const [showInfo, setShowInfo] = useState(false)
  const [textContent, setTextContent] = useState<string>('')
  const modalRef = useRef<HTMLDivElement>(null)
  const { copyState, copyToClipboard } = useCopyToClipboard()

  // ==========================================
  // DOCUMENT URL LOADING
  // ==========================================

  useEffect(() => {
    if (!document || !isOpen) {
      setState(prev => ({ ...prev, documentUrl: null, error: null }))
      return
    }

    const loadDocumentUrl = () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      try {
        const url = getDocumentUrl(document)
        
        if (!url) {
          setState(prev => ({ 
            ...prev, 
            error: 'No document URL available',
            isLoading: false 
          }))
          return
        }

        setState(prev => ({ 
          ...prev, 
          documentUrl: url, 
          isLoading: false 
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Failed to load document',
          isLoading: false 
        }))
      }
    }

    loadDocumentUrl()
  }, [document, isOpen])

  // ==========================================
  // TEXT CONTENT LOADING
  // ==========================================

  useEffect(() => {
    if (!document || !state.documentUrl || !isPreviewableText(document.file_type || '')) {
      setTextContent('')
      return
    }

    const loadTextContent = async () => {
      try {
        const response = await fetch(state.documentUrl!)
        const text = await response.text()
        setTextContent(text)
      } catch (error) {
        console.error('Failed to load text content:', error)
        setTextContent('Failed to load text content')
      }
    }

    loadTextContent()
  }, [document, state.documentUrl])

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  /**
   * Zoom and rotation handlers
   */
  const handleZoomIn = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      zoom: Math.min(prev.zoom * 1.2, 5) 
    }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      zoom: Math.max(prev.zoom / 1.2, 0.25) 
    }))
  }, [])

  const handleRotate = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      rotation: (prev.rotation + 90) % 360 
    }))
  }, [])

  const handleResetView = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      zoom: 1, 
      rotation: 0 
    }))
  }, [])

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        if (hasPrevious && onPrevious) {
          onPrevious()
        }
        break
      case 'ArrowRight':
        if (hasNext && onNext) {
          onNext()
        }
        break
      case '+':
      case '=':
        handleZoomIn()
        break
      case '-':
        handleZoomOut()
        break
      case 'r':
      case 'R':
        handleRotate()
        break
      case '0':
        handleResetView()
        break
    }
  }, [isOpen, onClose, hasNext, hasPrevious, onNext, onPrevious, handleZoomIn, handleZoomOut, handleRotate, handleResetView])

  useEffect(() => {
    // Fixed: Use globalThis.document instead of the component document prop
    globalThis.document.addEventListener('keydown', handleKeyDown)
    return () => globalThis.document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  /**
   * Fullscreen toggle
   */
  const toggleFullscreen = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isFullscreen: !prev.isFullscreen 
    }))
  }, [])

  /**
   * Action handlers
   */
  const handleDelete = useCallback(() => {
    if (!document || !onDelete) return
    
    const documentId = document.id || document.temp_id
    if (!documentId) return
    
    if (confirm(`Are you sure you want to delete "${document.file_name}"?`)) {
      onDelete(documentId)
      onClose()
    }
  }, [document, onDelete, onClose])

  const handleDownload = useCallback(() => {
    if (!document || !onDownload) return
    onDownload(document)
  }, [document, onDownload])

  const handleExternalOpen = useCallback(() => {
    if (!state.documentUrl) return
    window.open(state.documentUrl, '_blank')
  }, [state.documentUrl])

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  /**
   * Render document content based on type
   */
  const renderDocumentContent = () => {
    if (state.isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
            <p className="mt-4 text-gray-600">Loading document...</p>
          </div>
        </div>
      )
    }

    if (state.error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
            <p className="mt-4 text-red-600">Error loading document</p>
            <p className="mt-2 text-sm text-gray-500">{state.error}</p>
          </div>
        </div>
      )
    }

    if (!document || !state.documentUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">No document to preview</p>
          </div>
        </div>
      )
    }

    const fileType = document.file_type || ''

    if (isPreviewableImage(fileType)) {
      return (
        <div className="flex items-center justify-center h-full relative">
          <Image
            src={state.documentUrl}
            alt={document.file_name}
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{
              transform: `scale(${state.zoom}) rotate(${state.rotation}deg)`
            }}
            onError={() => {
              setState(prev => ({ 
                ...prev, 
                error: 'Failed to load image' 
              }))
            }}
            priority
          />
          
          {/* Zoom controls overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <ZoomControls
              zoom={state.zoom}
              _rotation={state.rotation}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onRotate={handleRotate}
              onReset={handleResetView}
            />
          </div>
        </div>
      )
    }

    if (isPreviewablePDF(fileType)) {
      return (
        <div className="h-full">
          <iframe
            src={state.documentUrl}
            className="w-full h-full border-0"
            title={`Preview of ${document.file_name}`}
            onError={() => {
              setState(prev => ({ 
                ...prev, 
                error: 'Failed to load PDF' 
              }))
            }}
          />
        </div>
      )
    }

    if (isPreviewableText(fileType)) {
      return (
        <div className="h-full overflow-auto p-6">
          <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
            {textContent || 'Loading text content...'}
          </pre>
        </div>
      )
    }

    // Fallback for non-previewable files
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        {getFileIcon(fileType, "h-16 w-16")}
        <p className="mt-4 text-lg font-medium">Preview not available</p>
        <p className="text-sm">This file type cannot be previewed in browser</p>
        <div className="mt-6 space-x-3">
          {onDownload && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          )}
          <button
            onClick={handleExternalOpen}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Externally
          </button>
        </div>
      </div>
    )
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative h-full flex flex-col ${
          state.isFullscreen ? '' : 'max-w-7xl mx-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-white border-b flex items-center justify-between p-4 z-20">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(document?.file_type || '', "h-6 w-6")}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {document?.file_name || 'Unknown file'}
              </h3>
              <p className="text-sm text-gray-500">
                {document ? formatFileSize(document.file_size || 0) : ''} • {document?.file_type || 'Unknown type'}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Navigation */}
            {(hasPrevious || hasNext) && (
              <>
                <button
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous document"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next document"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="w-px h-6 bg-gray-200" />
              </>
            )}

            {/* Info button */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded hover:bg-gray-100 ${
                showInfo ? 'text-blue-600 bg-blue-50' : 'text-gray-400'
              }`}
              title="Document information"
            >
              <Info className="h-5 w-5" />
            </button>

            {/* Download button */}
            {onDownload && (
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                title="Download document"
              >
                <Download className="h-5 w-5" />
              </button>
            )}

            {/* External open button */}
            <button
              onClick={handleExternalOpen}
              className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              title="Open in new tab"
            >
              <ExternalLink className="h-5 w-5" />
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              title={state.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {state.isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                title="Delete document"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              title="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Document Info Panel */}
          {document && (
            <DocumentInfoPanel
              document={document}
              isVisible={showInfo}
              onClose={() => setShowInfo(false)}
              copyToClipboard={copyToClipboard}
              copyState={copyState}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden">
          {renderDocumentContent()}
        </div>
      </div>
    </div>
  )
}

export default FilePreview