'use client'

import { useParams, useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'

export default function ExpiredPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <Clock className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Code Expired
          </h1>
          <p className="text-gray-600 mb-6">
            This claim code ({code}) has expired and can no longer be used.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please contact our support team if you need assistance or believe this is an error.
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