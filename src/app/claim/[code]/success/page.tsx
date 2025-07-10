// app/claim/[code]/success/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, ArrowLeft, FileText, Clock } from 'lucide-react'

export default function SuccessPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 text-center">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-4 sm:mb-6" />
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Claim Submitted Successfully!
            </h1>
            
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
              Your claim has been submitted and is now being processed.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Claim Information
              </h2>
              <div className="space-y-2 sm:space-y-3 text-left">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm sm:text-base">Claim Code:</span>
                  <span className="font-mono font-semibold text-sm sm:text-base break-all">{code}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm sm:text-base">Submitted:</span>
                  <span className="font-semibold text-sm sm:text-base">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm sm:text-base">Status:</span>
                  <span className="text-green-600 font-semibold text-sm sm:text-base">Under Review</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-6 sm:mb-8">
              <div className="flex items-start text-left">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">What happens next?</h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Our claims team will review your submission and may contact you for additional information if needed.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start text-left">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Processing time</h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Most claims are processed within 5-10 business days. You will receive updates via email.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4 sm:pt-6">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors min-h-[48px] text-base sm:text-lg font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}