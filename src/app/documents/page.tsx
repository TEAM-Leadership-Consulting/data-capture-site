// app/documents/page.tsx
'use client'

import { useState } from 'react'
import { FileText, Download, Eye, Search, Filter, Calendar } from 'lucide-react'

interface DocumentItem {
  id: number
  title: string
  description: string
  type: string
  category: string
  fileSize: string
  lastUpdated: string
  downloadUrl: string
  viewUrl?: string
}

const documents: DocumentItem[] = [
  {
    id: 1,
    title: "Claim Filing Guidelines",
    description: "Comprehensive guide on how to properly file your claim, including required documentation and deadlines.",
    type: "PDF",
    category: "Guidelines",
    fileSize: "2.3 MB",
    lastUpdated: "2024-01-15",
    downloadUrl: "/documents/Claim Filing Guidelines.pdf",
    viewUrl: "/documents/Claim Filing Guidelines.pdf"
  },
  {
    id: 2,
    title: "Terms and Conditions",
    description: "Legal terms and conditions governing the claim filing process and settlement procedures.",
    type: "PDF",
    category: "Legal",
    fileSize: "1.8 MB",
    lastUpdated: "2024-01-10",
    downloadUrl: "/documents/Terms and Conditions.pdf",
    viewUrl: "/documents/Terms and Conditions.pdf"
  },
  {
    id: 3,
    title: "Privacy Policy",
    description: "Information about how we collect, use, and protect your personal information during the claims process.",
    type: "PDF",
    category: "Legal",
    fileSize: "1.2 MB",
    lastUpdated: "2024-01-05",
    downloadUrl: "/documents/Privacy Policy.pdf",
    viewUrl: "/documents/Privacy Policy.pdf"
  },
  {
    id: 4,
    title: "Required Documentation Checklist",
    description: "Complete checklist of all documents you may need to support your claim submission.",
    type: "PDF",
    category: "Guidelines",
    fileSize: "0.8 MB",
    lastUpdated: "2024-01-20",
    downloadUrl: "/documents/Required Documentation Checklist.pdf",
    viewUrl: "/documents/Required Documentation Checklist.pdf"
  },
  {
    id: 5,
    title: "Settlement Process Overview",
    description: "Detailed explanation of the settlement process, timelines, and what to expect after filing your claim.",
    type: "PDF",
    category: "Process",
    fileSize: "3.1 MB",
    lastUpdated: "2024-01-12",
    downloadUrl: "/documents/Settlement Process Overview.pdf",
    viewUrl: "/documents/Settlement Process Overview.pdf"
  },
  {
    id: 6,
    title: "Frequently Asked Questions",
    description: "Downloadable version of our comprehensive FAQ document with additional technical details.",
    type: "PDF",
    category: "Support",
    fileSize: "1.5 MB",
    lastUpdated: "2024-01-18",
    downloadUrl: "/documents/Frequently Asked Questions.pdf",
    viewUrl: "/documents/Frequently Asked Questions.pdf"
  },
  {
    id: 7,
    title: "Contact Information Directory",
    description: "Complete directory of contact information for support staff, legal representatives, and administrators.",
    type: "PDF",
    category: "Support",
    fileSize: "0.6 MB",
    lastUpdated: "2024-01-22",
    downloadUrl: "/documents/Contact Information Directory.pdf",
    viewUrl: "/documents/Contact Information Directory.pdf"
  },
  {
    id: 8,
    title: "Appeals Process Guide",
    description: "Step-by-step guide for filing an appeal if your initial claim is denied or you disagree with the decision.",
    type: "PDF",
    category: "Process",
    fileSize: "2.0 MB",
    lastUpdated: "2024-01-08",
    downloadUrl: "/documents/Appeals Process Guide.pdf",
    viewUrl: "/documents/Appeals Process Guide.pdf"
  }
]

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('title')

  const categories = ['All', ...Array.from(new Set(documents.map(doc => doc.category)))]

  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'date':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDownload = (documentItem: DocumentItem) => {
    // Create a download link
    const link = document.createElement('a')
    link.href = documentItem.downloadUrl
    link.download = documentItem.title + '.pdf'
    link.click()
  }

  const handleView = (documentItem: DocumentItem) => {
    // Open the PDF in a new tab/window
    window.open(documentItem.viewUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-blue-300" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Important Documents
            </h1>
            <p className="text-lg sm:text-xl text-blue-100">
              Access and download essential documents related to your claim filing process
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-6 sm:py-8 bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row lg:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="sm:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'All' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sort By */}
              <div className="sm:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="title">Sort by Title</option>
                  <option value="date">Sort by Date</option>
                  <option value="category">Sort by Category</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documents Grid */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-base sm:text-lg">No documents found matching your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredDocuments.map((documentItem) => (
                  <div key={documentItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center min-w-0 flex-1">
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {documentItem.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0 ml-2">
                        {documentItem.type}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 leading-tight break-words">
                      {documentItem.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
                      {documentItem.description}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 mb-3 sm:mb-4 space-y-1 sm:space-y-0">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span>Updated: {formatDate(documentItem.lastUpdated)}</span>
                      </div>
                      <span className="hidden sm:inline mx-2">•</span>
                      <span>{documentItem.fileSize}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleView(documentItem)}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[40px]"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(documentItem)}
                        className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors min-h-[40px]"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  )
}