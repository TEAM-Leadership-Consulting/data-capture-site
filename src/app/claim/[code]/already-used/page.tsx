'use client'

import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

export default function AlreadyUsedPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Code Already Used
          </h1>
          <p className="text-gray-600 mb-6">
            This claim code ({code}) has already been used to submit a claim. 
            Each claim code can only be used once.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If you believe this is an error or need assistance, please contact our support team.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  )
}