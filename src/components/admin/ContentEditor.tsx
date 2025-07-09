// components/admin/ContentEditor.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw, Eye, AlertCircle, CheckCircle, Edit3 } from 'lucide-react'

interface ContentSection {
  id: string
  title: string
  content: string
  type: 'text' | 'html' | 'number' | 'date'
  category: 'hero' | 'settlement' | 'contact' | 'footer' | 'general'
  placeholder?: string
  required?: boolean
}

interface ContentEditorProps {
  userRole: 'owner' | 'admin' | 'editor'
  userName: string
}

// Static data that doesn't change - moved outside component to prevent unnecessary re-renders
const categories = [
  { id: 'hero', name: 'Hero Section', description: 'Main banner and headline content' },
  { id: 'settlement', name: 'Settlement Info', description: 'Case details and amounts' },
  { id: 'contact', name: 'Contact Details', description: 'Contact information and addresses' },
  { id: 'footer', name: 'Footer Content', description: 'Footer text and legal notices' },
  { id: 'general', name: 'General', description: 'Other site content' }
]

// Sample content structure - in production this would come from your API/database
const defaultSections: ContentSection[] = [
    // Hero Section
    {
      id: 'hero_title',
      title: 'Main Headline',
      content: 'Bob Johnson vs Smith & Jones, LLC',
      type: 'text',
      category: 'hero',
      required: true
    },
    {
      id: 'hero_subtitle',
      title: 'Subtitle',
      content: 'Class Action Settlement',
      type: 'text',
      category: 'hero'
    },
    {
      id: 'hero_description',
      title: 'Hero Description',
      content: 'If you received unwanted calls or text messages, you may be entitled to compensation under this class action settlement.',
      type: 'html',
      category: 'hero',
      placeholder: 'Main description text...'
    },
    
    // Settlement Info
    {
      id: 'settlement_amount',
      title: 'Settlement Amount',
      content: '$2,500,000',
      type: 'text',
      category: 'settlement',
      required: true
    },
    {
      id: 'case_number',
      title: 'Case Number',
      content: 'C-16-CV-24-001546',
      type: 'text',
      category: 'settlement',
      required: true
    },
    {
      id: 'filing_deadline',
      title: 'Filing Deadline',
      content: '2025-08-08',
      type: 'date',
      category: 'settlement',
      required: true
    },
    {
      id: 'individual_amount',
      title: 'Individual Claim Amount',
      content: 'Up to $500',
      type: 'text',
      category: 'settlement'
    },

    // Contact Details
    {
      id: 'contact_address',
      title: 'Mailing Address',
      content: 'P.O. Box 12345\nSettlement City, MD 20785',
      type: 'html',
      category: 'contact'
    },
    {
      id: 'contact_phone',
      title: 'Phone Number',
      content: '1-800-555-0123',
      type: 'text',
      category: 'contact'
    },
    {
      id: 'contact_email',
      title: 'Email Address',
      content: 'info@settlementclaims.com',
      type: 'text',
      category: 'contact'
    },

    // Footer
    {
      id: 'footer_notice',
      title: 'Legal Notice',
      content: 'This is not a solicitation from a lawyer.',
      type: 'text',
      category: 'footer'
    },
    {
      id: 'footer_court',
      title: 'Court Information',
      content: 'The Circuit Court for Prince George\'s County, Maryland authorized this notice.',
      type: 'html',
      category: 'footer'
    }
  ]

export default function ContentEditor({ userName }: ContentEditorProps) {
  const [sections, setSections] = useState<ContentSection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('hero')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Use useCallback to memoize the loadContent function
  const loadContent = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/content')
      if (response.ok) {
        const data = await response.json()
        setSections(data.sections || defaultSections)
      } else {
        // If no content exists, use defaults
        setSections(defaultSections)
      }
    } catch (error) {
      console.error('Failed to load content:', error)
      setSections(defaultSections)
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array since defaultSections is static

  useEffect(() => {
    loadContent()
  }, [loadContent]) // Now properly includes loadContent in dependencies

  const updateContent = useCallback((sectionId: string, newContent: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, content: newContent }
        : section
    ))
    setUnsavedChanges(true)
  }, [])

  const saveContent = useCallback(async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections,
          updatedBy: userName,
          updatedAt: new Date().toISOString()
        }),
      })

      if (response.ok) {
        setMessage('Content saved successfully!')
        setUnsavedChanges(false)
        setTimeout(() => setMessage(''), 5000) // Clear message after 5 seconds
      } else {
        const errorData = await response.json().catch(() => null)
        setMessage(errorData?.message || 'Failed to save content')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      setMessage('Error saving content')
      console.error('Save error:', error)
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setIsLoading(false)
    }
  }, [sections, userName])

  const resetContent = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all content to defaults? This cannot be undone.')) {
      setSections([...defaultSections]) // Create a new array to ensure state update
      setUnsavedChanges(true)
      setMessage('Content reset to defaults. Click Save to apply changes.')
      setTimeout(() => setMessage(''), 5000)
    }
  }, [])

  const filteredSections = sections.filter(section => section.category === activeCategory)

  const renderInput = useCallback((section: ContentSection) => {
    const inputProps = {
      value: section.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        updateContent(section.id, e.target.value),
      className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
      placeholder: section.placeholder || `Enter ${section.title.toLowerCase()}...`,
      required: section.required
    }

    switch (section.type) {
      case 'html':
        return (
          <textarea
            {...inputProps}
            rows={4}
            className={inputProps.className + " font-mono text-sm"}
          />
        )
      case 'date':
        return (
          <input
            type="date"
            {...inputProps}
          />
        )
      case 'number':
        return (
          <input
            type="number"
            {...inputProps}
          />
        )
      default:
        return (
          <input
            type="text"
            {...inputProps}
          />
        )
    }
  }, [updateContent])

  // Calculate statistics
  const stats = {
    totalSections: sections.length,
    requiredComplete: sections.filter(s => s.required && s.content.trim()).length,
    totalRequired: sections.filter(s => s.required).length,
    htmlSections: sections.filter(s => s.type === 'html').length,
    categories: categories.length
  }

  return (
    <div className="space-y-6">
      {/* Status message */}
      {message && (
        <div className={`p-4 rounded-md flex items-center transition-all duration-300 ${
          message.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.includes('successfully') ? (
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Unsaved changes warning */}
      {unsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
            <span className="text-yellow-800">You have unsaved changes</span>
          </div>
        </div>
      )}

      {/* Header with actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Content Management</h2>
            <p className="text-gray-600">Edit site content and text displayed to users</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center justify-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </button>
            <button
              onClick={resetContent}
              className="flex items-center justify-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </button>
            <button
              onClick={saveContent}
              disabled={isLoading || !unsavedChanges}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content sections */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {categories.find(cat => cat.id === activeCategory)?.name}
            </h3>
            <p className="text-sm text-gray-600">
              {categories.find(cat => cat.id === activeCategory)?.description}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading content...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        {section.title}
                        {section.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {section.type === 'html' && (
                        <p className="text-xs text-gray-500 mt-1">
                          HTML content - use basic HTML tags like &lt;br&gt;, &lt;strong&gt;, etc.
                        </p>
                      )}
                    </div>
                    <Edit3 className="h-4 w-4 text-gray-400" />
                  </div>

                  {previewMode ? (
                    <div className="p-3 bg-gray-50 rounded border min-h-[40px]">
                      {section.type === 'html' ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: section.content }} 
                          className="prose prose-sm max-w-none"
                        />
                      ) : (
                        <span className="text-gray-900">{section.content || 'No content'}</span>
                      )}
                    </div>
                  ) : (
                    renderInput(section)
                  )}
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredSections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No content sections found for this category.
            </div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSections}</div>
            <div className="text-sm text-blue-800">Total Sections</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.requiredComplete}/{stats.totalRequired}
            </div>
            <div className="text-sm text-green-800">Required Complete</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.htmlSections}
            </div>
            <div className="text-sm text-yellow-800">HTML Sections</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.categories}
            </div>
            <div className="text-sm text-purple-800">Categories</div> 
          </div>
        </div>
      </div>
    </div>
  )
}