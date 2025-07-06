// app/faqs/page.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react'

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
}

const faqs: FAQ[] = [
  {
    id: 1,
    category: "Getting Started",
    question: "How do I obtain a claim code?",
    answer: "Claim codes are provided by your legal representative, insurance company, or case administrator. If you believe you should have received a claim code but haven't, please contact our support team or your case administrator directly."
  },
  {
    id: 2,
    category: "Getting Started",
    question: "What if I don't have a claim code?",
    answer: "You cannot access the claim filing system without a valid claim code. Please contact the organization or legal representative who informed you about the claim to obtain your unique code."
  },
  {
    id: 3,
    category: "Filing Process",
    question: "How long does it take to complete a claim form?",
    answer: "Most claimants complete the form in 15-30 minutes. The system automatically saves your progress, so you can take breaks and return later to finish."
  },
  {
    id: 4,
    category: "Filing Process",
    question: "Can I save my progress and return later?",
    answer: "Yes, the system automatically saves your progress as you complete each section. You can safely close your browser and return using the same claim code to continue where you left off."
  },
  {
    id: 5,
    category: "Filing Process",
    question: "What information do I need to complete my claim?",
    answer: "You'll need personal information (name, address, contact details), incident details (date, description, damage amount), and any witness information if applicable. Having relevant documents and receipts ready will help speed up the process."
  },
  {
    id: 6,
    category: "Technical Support",
    question: "What browsers are supported?",
    answer: "Our portal works best with current versions of Chrome, Firefox, Safari, and Edge. For the best experience, please ensure your browser is up to date and JavaScript is enabled."
  },
  {
    id: 7,
    category: "Technical Support",
    question: "I'm having trouble submitting my form. What should I do?",
    answer: "First, check that all required fields are completed and any error messages are addressed. If you continue to experience issues, try refreshing the page or clearing your browser cache. Contact our technical support if problems persist."
  },
  {
    id: 8,
    category: "Security & Privacy",
    question: "Is my personal information secure?",
    answer: "Yes, we use bank-level encryption (SSL/TLS) to protect all data transmission. Your information is stored securely and accessed only by authorized personnel involved in processing your claim."
  },
  {
    id: 9,
    category: "Security & Privacy",
    question: "Who has access to my claim information?",
    answer: "Only authorized legal professionals, case administrators, and our secure technical staff have access to your information. We follow strict privacy protocols and never share your data with unauthorized third parties."
  },
  {
    id: 10,
    category: "After Submission",
    question: "What happens after I submit my claim?",
    answer: "You'll receive an immediate confirmation via email. Our legal team will review your submission within 2-3 business days. If additional information is needed, we'll contact you directly."
  },
  {
    id: 11,
    category: "After Submission",
    question: "How long does claim processing take?",
    answer: "Most claims are processed within 5-10 business days. Complex cases may take longer. You'll receive email updates throughout the process and be notified of any delays."
  },
  {
    id: 12,
    category: "After Submission",
    question: "Can I make changes to my claim after submission?",
    answer: "Once submitted, claims cannot be modified through the portal. If you need to make corrections or additions, please contact our support team immediately with your claim code and details of the changes needed."
  },
  {
    id: 13,
    category: "After Submission",
    question: "How will I be notified about my claim status?",
    answer: "You'll receive email notifications at key stages: submission confirmation, review completion, and final decision. Please ensure your email address is correct and check your spam folder."
  },
  {
    id: 14,
    category: "Legal Questions",
    question: "Do I need a lawyer to file a claim?",
    answer: "No, you can complete the claim form yourself. However, if your case is complex or involves significant damages, you may want to consult with a legal professional before submitting."
  },
  {
    id: 15,
    category: "Legal Questions",
    question: "What if my claim is denied?",
    answer: "If your claim is denied, you'll receive a detailed explanation of the decision. You may have options for appeal or reconsideration, which will be outlined in your notification letter."
  },
  {
    id: 16,
    category: "Legal Questions",
    question: "Are there any fees to file a claim?",
    answer: "No, there are no fees to file a claim through this portal. The process is completely free for eligible claimants. Be wary of anyone asking for payment to file your claim."
  },
  {
    id: 17,
    category: "Documentation",
    question: "What documents should I gather before filing?",
    answer: "Gather any receipts, invoices, medical records, photos, correspondence, or other evidence related to your claim. While not all documents are required, having them ready will help you provide complete information."
  },
  {
    id: 18,
    category: "Documentation",
    question: "Can I upload documents during the filing process?",
    answer: "The current version of the portal is for information submission only. If additional documents are needed, our review team will contact you with specific instructions for document submission."
  },
  {
    id: 19,
    category: "Deadlines",
    question: "What is the deadline to file my claim?",
    answer: "The claim filing deadline varies by case. Check the Important Dates page for your specific deadline. Missing the deadline may result in your claim not being processed."
  },
  {
    id: 20,
    category: "Deadlines",
    question: "What happens if I miss the filing deadline?",
    answer: "Claims submitted after the deadline may not be processed. However, there may be exceptions for extraordinary circumstances. Contact our support team immediately if you've missed the deadline."
  }
]

export default function FAQsPage() {
  const [openItems, setOpenItems] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))]

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
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="h-16 w-16 mx-auto mb-6 text-blue-300" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-blue-100">
              Find answers to common questions about our claims filing process
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="md:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
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
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No FAQs found matching your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-3">
                          {faq.category}
                        </span>
                        <span className="text-lg font-medium text-gray-900">
                          {faq.question}
                        </span>
                      </div>
                      {openItems.includes(faq.id) ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    
                    {openItems.includes(faq.id) && (
                      <div className="px-6 pb-4">
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-gray-700 leading-relaxed">
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
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{faqs.length}</div>
                <div className="text-gray-600">Total FAQs</div>
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">{categories.length - 1}</div>
                <div className="text-gray-600">Categories</div>
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-gray-600">Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Browse by Category
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.slice(1).map(category => {
                const categoryCount = faqs.filter(faq => faq.category === category).length
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`p-4 rounded-lg border-2 transition-colors text-left ${
                      selectedCategory === category
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">{category}</div>
                    <div className="text-sm text-gray-600">{categoryCount} questions</div>
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