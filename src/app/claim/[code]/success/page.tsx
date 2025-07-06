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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Claim Submitted Successfully!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Your claim has been submitted and is now being processed.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Claim Information
              </h2>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Claim Code:</span>
                  <span className="font-mono font-semibold">{code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-semibold">Under Review</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start text-left">
                <FileText className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">What happens next?</h3>
                  <p className="text-gray-600">
                    Our claims team will review your submission and may contact you for additional information if needed.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start text-left">
                <Clock className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Processing time</h3>
                  <p className="text-gray-600">
                    Most claims are processed within 5-10 business days. You will receive updates via email.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Submit Another Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}