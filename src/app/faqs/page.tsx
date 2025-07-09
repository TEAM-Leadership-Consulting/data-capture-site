// app/faqs/page.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react'
import { faqs, categories } from '../../data/faqs'

export default function FAQsPage() {
  const [openItems, setOpenItems] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const allCategories = ['All', ...categories]

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-blue-300" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg sm:text-xl text-blue-100">
              Find answers to common questions about our claims filing process
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-6 sm:py-8 bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="sm:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {allCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-base sm:text-lg">No FAQs found matching your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full px-4 sm:px-6 py-4 text-left flex items-start justify-between hover:bg-gray-50 transition-colors min-h-[64px]"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="inline-block px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-2 sm:mr-3 sm:mb-0">
                          {faq.category}
                        </span>
                        <div className="sm:inline">
                          <span className="text-base sm:text-lg font-medium text-gray-900 leading-tight break-words">
                            {faq.question}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {openItems.includes(faq.id) ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </button>
                    
                    {openItems.includes(faq.id) && (
                      <div className="px-4 sm:px-6 pb-4">
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
              <div className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{faqs.length}</div>
                <div className="text-sm sm:text-base text-gray-600">Total FAQs</div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{categories.length - 1}</div>
                <div className="text-sm sm:text-base text-gray-600">Categories</div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-sm sm:text-base text-gray-600">Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-8 sm:py-12 bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-6 sm:mb-8">
              Browse by Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {categories.slice(1).map(category => {
                const categoryCount = faqs.filter(faq => faq.category === category).length
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-left min-h-[60px] ${
                      selectedCategory === category
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-sm sm:text-base break-words">{category}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{categoryCount} questions</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}