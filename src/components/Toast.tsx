// components/Toast.tsx
'use client'

import { useEffect } from 'react'
import { CheckCircle, X, AlertCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  isVisible: boolean
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000) // Auto-close after 5 seconds
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className={`p-3 sm:p-4 rounded-lg border flex items-center gap-2 sm:gap-4 shadow-lg transition-all duration-300 ${
        type === 'success' 
          ? 'bg-green-50 border-green-300 text-green-900' 
          : 'bg-red-50 border-red-300 text-red-900'
      }`}>
        {type === 'success' ? (
          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0" />
        )}
        <span className="text-sm sm:text-base font-medium flex-1">{message}</span>
        <button
          onClick={onClose}
          className="hover:opacity-70 transition-opacity p-1 flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  )
}

export default Toast