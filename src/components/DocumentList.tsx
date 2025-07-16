// components/DocumentList.tsx
'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  File,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Eye,
  Trash2,
  Search,
  SortAsc,
  SortDesc,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Grid3X3,
  List,
  RefreshCw 
} from 'lucide-react'
import {
  DocumentDisplayItem,
  DocumentCategory,
  DOCUMENT_CATEGORY_LABELS
} from '../types/documents'

interface DocumentListProps {
  documents: DocumentDisplayItem[]
  onPreview?: (document: DocumentDisplayItem) => void
  onDownload?: (document: DocumentDisplayItem) => void
  onDelete?: (documentId: string) => void
  onRefresh?: () => void
  isLoading?: boolean
  error?: string | null
  showSearch?: boolean
  showFilters?: boolean
  showStats?: boolean
  viewMode?: 'list' | 'grid'
  onViewModeChange?: (mode: 'list' | 'grid') => void
  className?: string
}

type SortField = 'name' | 'size' | 'type' | 'category' | 'uploaded'
type SortDirection = 'asc' | 'desc'
type FilterStatus = 'all' | 'completed' | 'uploading' | 'error'

/**
 * Type union for sortable values in document comparison
 * Covers all possible data types used in sorting operations
 */
type SortableValue = string | number | DocumentCategory

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// File type icon mapping
const getFileIcon = (fileType: string, className = "h-5 w-5") => {
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

// Format file size utility
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date utility
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Just now'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

/**
 * Type-safe comparison function for sortable values
 * Handles string, number, and DocumentCategory comparisons
 */
const compareSortableValues = (a: SortableValue, b: SortableValue, direction: SortDirection): number => {
  // Handle same type comparisons
  if (typeof a === typeof b) {
    if (a < b) return direction === 'asc' ? -1 : 1
    if (a > b) return direction === 'asc' ? 1 : -1
    return 0
  }
  
  // Handle mixed type comparisons by converting to strings
  const aString = String(a)
  const bString = String(b)
  
  if (aString < bString) return direction === 'asc' ? -1 : 1
  if (aString > bString) return direction === 'asc' ? 1 : -1
  return 0
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

// Document status badge
const StatusBadge: React.FC<{ status: DocumentDisplayItem['upload_status'] }> = ({ status }) => {
  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Completed' },
    uploading: { icon: Clock, color: 'text-blue-600 bg-blue-50', label: 'Uploading' },
    error: { icon: AlertCircle, color: 'text-red-600 bg-red-50', label: 'Error' },
    pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', label: 'Pending' },
    deleted: { icon: Trash2, color: 'text-gray-600 bg-gray-50', label: 'Deleted' }
  }

  const config = statusConfig[status] || statusConfig.completed
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  )
}

// Document actions dropdown
const DocumentActions: React.FC<{
  document: DocumentDisplayItem
  onPreview?: (document: DocumentDisplayItem) => void
  onDownload?: (document: DocumentDisplayItem) => void
  onDelete?: (documentId: string) => void
}> = ({ document, onPreview, onDownload, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-6 z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]">
            {document.upload_status === 'completed' && onPreview && (
              <button
                onClick={() => handleAction(() => onPreview(document))}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
            )}
            
            {document.file_path && onDownload && (
              <button
                onClick={() => handleAction(() => onDownload(document))}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => handleAction(() => onDelete(document.id || document.temp_id || ''))}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// List view item
const DocumentListItem: React.FC<{
  document: DocumentDisplayItem
  onPreview?: (document: DocumentDisplayItem) => void
  onDownload?: (document: DocumentDisplayItem) => void
  onDelete?: (documentId: string) => void
}> = ({ document, onPreview, onDownload, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="flex-shrink-0">
          {getFileIcon(document.file_type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {document.file_name}
            </p>
            <StatusBadge status={document.upload_status} />
          </div>
          
          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
            <span>{formatFileSize(document.file_size)}</span>
            <span>•</span>
            <span>{DOCUMENT_CATEGORY_LABELS[document.upload_category]}</span>
            <span>•</span>
            <span>{formatDate(document.uploaded_at)}</span>
          </div>

          {document.upload_status === 'uploading' && document.upload_progress !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{document.upload_progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${document.upload_progress}%` }}
                />
              </div>
            </div>
          )}

          {document.upload_status === 'error' && document.error_message && (
            <p className="text-xs text-red-600 mt-1">{document.error_message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        <DocumentActions
          document={document}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

// Grid view item
const DocumentGridItem: React.FC<{
  document: DocumentDisplayItem
  onPreview?: (document: DocumentDisplayItem) => void
  onDownload?: (document: DocumentDisplayItem) => void
  onDelete?: (documentId: string) => void
}> = ({ document, onPreview, onDownload, onDelete }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-shrink-0">
          {getFileIcon(document.file_type, "h-8 w-8")}
        </div>
        <DocumentActions
          document={document}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900 truncate" title={document.file_name}>
          {document.file_name}
        </h3>

        <div className="flex justify-between items-center">
          <StatusBadge status={document.upload_status} />
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Size:</span>
            <span>{formatFileSize(document.file_size)}</span>
          </div>
          <div className="flex justify-between">
            <span>Uploaded:</span>
            <span>{formatDate(document.uploaded_at)}</span>
          </div>
        </div>

        {document.upload_status === 'uploading' && document.upload_progress !== undefined && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{document.upload_progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${document.upload_progress}%` }}
              />
            </div>
          </div>
        )}

        {document.upload_status === 'error' && document.error_message && (
          <p className="text-xs text-red-600 mt-1 line-clamp-2">{document.error_message}</p>
        )}
      </div>
    </div>
  )
}

// Statistics component
const DocumentStats: React.FC<{ documents: DocumentDisplayItem[] }> = ({ documents }) => {
  const stats = useMemo(() => {
    const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0)
    const statusCounts = documents.reduce((acc, doc) => {
      acc[doc.upload_status] = (acc[doc.upload_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const categoryCounts = documents.reduce((acc, doc) => {
      acc[doc.upload_category] = (acc[doc.upload_category] || 0) + 1
      return acc
    }, {} as Record<DocumentCategory, number>)

    return {
      total: documents.length,
      totalSize,
      completed: statusCounts.completed || 0,
      uploading: statusCounts.uploading || 0,
      errors: statusCounts.error || 0,
      categoryCounts
    }
  }, [documents])

  return (
    <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total Files</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</div>
        <div className="text-sm text-gray-600">Total Size</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        <div className="text-sm text-gray-600">Completed</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
        <div className="text-sm text-gray-600">Errors</div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Main DocumentList component
const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onPreview,
  onDownload,
  onDelete,
  onRefresh,
  isLoading = false,
  error = null,
  showSearch = true,
  showFilters = true,
  showStats = true,
  viewMode = 'list',
  onViewModeChange,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('uploaded')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | 'all'>('all')

  // Filtered and sorted documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.file_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => doc.upload_status === filterStatus)
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(doc => doc.upload_category === filterCategory)
    }

    // Apply sorting with type-safe value extraction
    filtered.sort((a, b) => {
      let aValue: SortableValue, bValue: SortableValue

      switch (sortField) {
        case 'name':
          aValue = a.file_name.toLowerCase()
          bValue = b.file_name.toLowerCase()
          break
        case 'size':
          aValue = a.file_size
          bValue = b.file_size
          break
        case 'type':
          aValue = a.file_type
          bValue = b.file_type
          break
        case 'category':
          aValue = a.upload_category
          bValue = b.upload_category
          break
        case 'uploaded':
          aValue = new Date(a.uploaded_at || 0).getTime()
          bValue = new Date(b.uploaded_at || 0).getTime()
          break
        default:
          return 0
      }

      return compareSortableValues(aValue, bValue, sortDirection)
    })

    return filtered
  }, [documents, searchTerm, filterStatus, filterCategory, sortField, sortDirection])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField, sortDirection])

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-sm text-red-800">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Statistics */}
      {showStats && documents.length > 0 && (
        <DocumentStats documents={documents} />
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="uploading">Uploading</option>
                <option value="error">Error</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as DocumentCategory | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          {onViewModeChange && (
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Sort controls for list view */}
      {viewMode === 'list' && filteredDocuments.length > 0 && (
        <div className="flex items-center space-x-4 text-sm text-gray-600 border-b border-gray-200 pb-2">
          <span>Sort by:</span>
          {(['name', 'size', 'type', 'category', 'uploaded'] as SortField[]).map((field) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={`flex items-center space-x-1 capitalize hover:text-gray-900 ${
                sortField === field ? 'text-blue-600 font-medium' : ''
              }`}
            >
              <span>{field === 'uploaded' ? 'Upload Date' : field}</span>
              {sortField === field && (
                sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Document list/grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-600">Loading documents...</span>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-8">
          <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your filters'}
          </p>
          {documents.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setFilterCategory('all')
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filteredDocuments.map((document, index) => (
            <DocumentListItem
              key={document.id || document.temp_id || `${document.file_name}-${index}`}
              document={document}
              onPreview={onPreview}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((document, index) => (
            <DocumentGridItem
              key={document.id || document.temp_id || `${document.file_name}-${index}`}
              document={document}
              onPreview={onPreview}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DocumentList