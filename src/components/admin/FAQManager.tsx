// components/admin/FAQManager.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
  isVisible: boolean
  order: number
  lastModified: string
  modifiedBy: string
}

interface FAQManagerProps {
  userName: string
}

const categories = [
  'Getting Started',
  'Filing Process', 
  'Technical Support',
  'Security & Privacy',
  'After Submission',
  'Legal Questions',
  'Documentation',
  'Deadlines',
  'General Questions'
]

export default function FAQManager({ userName }: FAQManagerProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedFAQs, setExpandedFAQs] = useState<number[]>([])
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General Questions',
    isVisible: true
  })
  const [editData, setEditData] = useState<FAQ | null>(null)

  // Utility functions
  const resetForm = useCallback(() => {
    setFormData({
      question: '',
      answer: '',
      category: 'General Questions',
      isVisible: true
    })
  }, [])

  const toggleExpanded = useCallback((id: number) => {
    setExpandedFAQs(prev => 
      prev.includes(id) 
        ? prev.filter(faqId => faqId !== id)
        : [...prev, id]
    )
  }, [])
      
    const loadFAQs = useCallback(async () => {
  console.log('🔄 Starting to load FAQs...')
  setIsLoading(true)
  try {
    console.log('📡 Fetching from /api/admin/faqs')
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setMessage('Authentication required. Please log in again.')
      return
    }

    const response = await fetch('/api/admin/faqs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    console.log('📊 Response status:', response.status)
    console.log('📊 Response ok:', response.ok)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Full API Response:', result)
      
      // Handle the correct response structure: result.data.faqs
      let faqsData = []
      if (result.success && result.data && result.data.faqs) {
        faqsData = result.data.faqs
      } else if (result.faqs) {
        // Fallback if direct faqs property
        faqsData = result.faqs
      }
      
      console.log('📋 Extracted FAQs:', faqsData)
      console.log('📊 Number of FAQs:', faqsData.length)
      
      setFaqs(faqsData)
      
      if (faqsData.length === 0) {
        setMessage('No FAQs found. Click "Add FAQ" to create your first FAQ.')
        setTimeout(() => setMessage(''), 5000)
      } else {
        setMessage(`Loaded ${faqsData.length} FAQs successfully!`)
        setTimeout(() => setMessage(''), 3000)
      }
    } else {
      console.error('❌ Response not ok. Status:', response.status)
      const errorText = await response.text()
      console.error('❌ Error response:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      
      if (response.status === 401) {
        setMessage('Authentication required. Please log in again.')
      } else {
        setMessage(errorData?.error || `Failed to load FAQs (Status: ${response.status})`)
      }
      setTimeout(() => setMessage(''), 5000)
    }
   } catch (err) {
    console.error('❌ Network/Parse error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    setMessage(`Failed to load FAQs: ${errorMessage}`)
    setTimeout(() => setMessage(''), 5000)
  } finally {
    setIsLoading(false)
    console.log('✅ Load FAQs complete')
  }
}, [])

  const saveFAQs = useCallback(async (updatedFAQs: FAQ[]) => {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setMessage('Authentication required. Please log in again.')
      return false
    }

    const response = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        faqs: updatedFAQs,
        updatedBy: userName,
        updatedAt: new Date().toISOString()
      })
    })

    if (response.ok) {
      setFaqs(updatedFAQs)
      setMessage('FAQs updated successfully!')
      setTimeout(() => setMessage(''), 5000)
      return true
    } else {
      const errorData = await response.json().catch(() => null)
      setMessage(errorData?.message || 'Failed to save FAQs')
      setTimeout(() => setMessage(''), 5000)
      return false
    }
  } catch (error) {
    setMessage('Error saving FAQs')
    console.error('Save error:', error)
    setTimeout(() => setMessage(''), 5000)
    return false
  }
}, [userName])

  // CRUD operations
  const addFAQ = useCallback(async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      setMessage('Question and answer are required')
      setTimeout(() => setMessage(''), 5000)
      return
    }

    const newFAQ: FAQ = {
      id: Date.now(),
      ...formData,
      order: faqs.length + 1,
      lastModified: new Date().toISOString(),
      modifiedBy: userName
    }

    const success = await saveFAQs([...faqs, newFAQ])
    if (success) {
      setShowAddForm(false)
      resetForm()
    }
  }, [formData, faqs, saveFAQs, resetForm, userName])

  const updateFAQ = useCallback(async (id: number, updates: Partial<FAQ>) => {
    const updatedFAQs = faqs.map(faq => 
      faq.id === id 
        ? { 
            ...faq, 
            ...updates, 
            lastModified: new Date().toISOString(),
            modifiedBy: userName
          } 
        : faq
    )
    await saveFAQs(updatedFAQs)
    setEditingId(null)
    setEditData(null)
  }, [faqs, saveFAQs, userName])

  const deleteFAQ = useCallback(async (id: number) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      const updatedFAQs = faqs.filter(faq => faq.id !== id)
      await saveFAQs(updatedFAQs)
    }
  }, [faqs, saveFAQs])

  const toggleVisibility = useCallback(async (id: number) => {
    const faq = faqs.find(f => f.id === id)
    if (faq) {
      await updateFAQ(id, { isVisible: !faq.isVisible })
    }
  }, [faqs, updateFAQ])

  const moveUp = useCallback(async (id: number) => {
    const index = faqs.findIndex(f => f.id === id)
    if (index > 0) {
      const newFAQs = [...faqs]
      ;[newFAQs[index], newFAQs[index - 1]] = [newFAQs[index - 1], newFAQs[index]]
      await saveFAQs(newFAQs)
    }
  }, [faqs, saveFAQs])

  const moveDown = useCallback(async (id: number) => {
    const index = faqs.findIndex(f => f.id === id)
    if (index < faqs.length - 1) {
      const newFAQs = [...faqs]
      ;[newFAQs[index], newFAQs[index + 1]] = [newFAQs[index + 1], newFAQs[index]]
      await saveFAQs(newFAQs)
    }
  }, [faqs, saveFAQs])

  // Edit operations
  const startEdit = useCallback((faq: FAQ) => {
    setEditingId(faq.id)
    setEditData({ ...faq })
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditData(null)
  }, [])

  const saveEdit = useCallback(async () => {
    if (editData && editingId) {
      if (!editData.question.trim() || !editData.answer.trim()) {
        setMessage('Question and answer are required')
        setTimeout(() => setMessage(''), 5000)
        return
      }
      await updateFAQ(editingId, editData)
    }
  }, [editData, editingId, updateFAQ])

  // Effects
  useEffect(() => {
    loadFAQs()
  }, [loadFAQs])

  // Computed values
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: faqs.length,
    visible: faqs.filter(f => f.isVisible).length,
    categories: new Set(faqs.map(f => f.category)).size,
    hidden: faqs.filter(f => !f.isVisible).length
  }

  return (
    <div className="space-y-6">
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

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">FAQ Management</h2>
            <p className="text-gray-600">Manage frequently asked questions</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </button>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-4">Add New FAQ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter the question..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({...formData, answer: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter the answer..."
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({...formData, isVisible: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Visible to users</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={addFAQ}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save FAQ
              </button>
              <button
                onClick={() => {setShowAddForm(false); resetForm()}}
                className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* FAQ list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <HelpCircle className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading FAQs...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => {
              const isEditing = editingId === faq.id

              return (
                <div
                  key={faq.id}
                  className={`border rounded-lg p-4 transition-all hover:border-gray-300 ${
                    !faq.isVisible ? 'border-gray-300 bg-gray-50 opacity-75' : 'border-gray-200 bg-white'
                  }`}
                >
                  {isEditing && editData ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                        <input
                          type="text"
                          value={editData.question}
                          onChange={(e) => setEditData({...editData, question: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                        <textarea
                          value={editData.answer}
                          onChange={(e) => setEditData({...editData, answer: e.target.value})}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select
                            value={editData.category}
                            onChange={(e) => setEditData({...editData, category: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center pt-6">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editData.isVisible}
                              onChange={(e) => setEditData({...editData, isVisible: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Visible to users</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={saveEdit}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <HelpCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {faq.category}
                          </span>
                          {!faq.isVisible && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                              Hidden
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                        <button
                          onClick={() => toggleExpanded(faq.id)}
                          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {expandedFAQs.includes(faq.id) ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide answer
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show answer
                            </>
                          )}
                        </button>
                        {expandedFAQs.includes(faq.id) && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">{faq.answer}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Last modified: {new Date(faq.lastModified).toLocaleDateString()} by {faq.modifiedBy}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => moveUp(faq.id)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                          title="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveDown(faq.id)}
                          disabled={index === filteredFAQs.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                          title="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleVisibility(faq.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                          title={faq.isVisible ? 'Hide from users' : 'Show to users'}
                        >
                          {faq.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => startEdit(faq)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                          title="Edit FAQ"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteFAQ(faq.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                          title="Delete FAQ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {filteredFAQs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || selectedCategory !== 'All' 
                  ? 'No FAQs match your search criteria.'
                  : 'No FAQs added yet. Click "Add FAQ" to get started.'
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">FAQ Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-800">Total FAQs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.visible}</div>
            <div className="text-sm text-green-800">Visible</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.categories}</div>
            <div className="text-sm text-purple-800">Categories</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.hidden}</div>
            <div className="text-sm text-yellow-800">Hidden</div>
          </div>
        </div>
      </div>
    </div>
  )
}