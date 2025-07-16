'use client'

import { useParams, useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'

export default function ExpiredPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string || 'Unknown'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            Code Expired
          </h1>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            This claim code (<span className="font-mono font-semibold break-all">{code}</span>) has expired and can no longer be used.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
            Please contact our support team if you need assistance or believe this is an error.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors min-h-[48px] text-base font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  )
}