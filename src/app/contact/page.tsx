// app/contact/page.tsx
'use client'

import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, HelpCircle, FileText } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    claimCode: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitMessage('Thank you for your message. We will respond within 2 business days.')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        claimCode: ''
      })
    } catch {
      setSubmitMessage('There was an error sending your message. Please try again or call us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Contact Us
            </h1>
            <p className="text-lg sm:text-xl text-blue-100">
              Questions about the Bob Johnson vs Smith & Jones, LLC settlement? We&apos;re here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Contact Details */}
            <div className="space-y-4 sm:space-y-6">
              {/* Address */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Settlement Administrator</h3>
                    <div className="text-gray-600 space-y-1 text-sm sm:text-base">
                      <p className="font-medium">Bob Johnson vs Smith & Jones, LLC</p>
                      <p>c/o Settlement Administrator</p>
                      <p>P.O. Box 24</p>
                      <p>Seal Point, OR 12345</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
                    <a 
                      href="tel:555-222-1212" 
                      className="text-blue-600 hover:text-blue-700 font-semibold text-lg break-all"
                    >
                      555-222-1212
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
                    <a 
                      href="mailto:Questions@JohnsonSmithJones.com" 
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base break-all"
                    >
                      Questions@JohnsonSmithJones.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Support Hours</h3>
                    <div className="text-gray-600 space-y-1 text-sm sm:text-base">
                      <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                      <p>Saturday: 10:00 AM - 2:00 PM EST</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Website */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Website</h3>
                    <a 
                      href="https://www.JohnsonSmithJones.com" 
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base break-all"
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      www.JohnsonSmithJones.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <a href="/faqs" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors py-1 min-h-[44px]">
                    <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Frequently Asked Questions</span>
                  </a>
                  <a href="/documents" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors py-1 min-h-[44px]">
                    <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Important Documents</span>
                  </a>
                  <a href="/important-dates" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors py-1 min-h-[44px]">
                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Important Dates</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Send us a Message</h2>
                
                {submitMessage && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 text-sm sm:text-base">{submitMessage}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="claimCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Claim Code (if applicable)
                      </label>
                      <input
                        type="text"
                        id="claimCode"
                        name="claimCode"
                        value={formData.claimCode}
                        onChange={handleChange}
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="Enter your claim code"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Please select a subject</option>
                      <option value="claim-code">Need a Claim Code</option>
                      <option value="filing-help">Help Filing My Claim</option>
                      <option value="technical-issue">Technical Issue</option>
                      <option value="settlement-question">Settlement Questions</option>
                      <option value="deadline-question">Deadline Questions</option>
                      <option value="document-request">Document Request</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide details about your question or issue..."
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-yellow-800">
                      <strong>Important:</strong> This contact form is for general questions only. 
                      To file a claim, you must use your claim code and access the secure claim form.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] text-base sm:text-lg"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}