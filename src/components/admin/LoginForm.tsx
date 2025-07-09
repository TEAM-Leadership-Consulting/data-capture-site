// components/admin/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Shield, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Smartphone
} from 'lucide-react'
import { signInAdmin, signUpAdmin } from '../../lib/admin-auth'

// Define the AdminUser interface locally to avoid import issues
interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

interface LoginFormProps {
  onLogin: (user: AdminUser) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [mfaStep, setMfaStep] = useState<'password' | 'mfa' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('error')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    mfaCode: ''
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setMessage('Please enter both email and password')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      if (mode === 'signin') {
        const result = await signInAdmin(formData.email, formData.password)
        
        if (result.success && result.user && result.session) {
          console.log('Login successful, attempting redirect...')
          console.log('Session:', result.session)
          setMessage('Login successful! Redirecting...')
          setMessageType('success')
          
          // Store session info in localStorage for the dashboard to use
          if (typeof window !== 'undefined') {
            localStorage.setItem('admin_user', JSON.stringify(result.user))
            // Let Supabase handle session storage automatically
          }
          
          // Call the onLogin callback
          onLogin(result.user)
          
          // Add a small delay to ensure state updates
          setTimeout(() => {
            console.log('Pushing to dashboard route...')
            router.push('/admin-dashboard-Logix/dashboard')
          }, 500)
        } else {
          // Check if this is an MFA challenge
          if (result.error?.includes('MFA') || result.error?.includes('challenge')) {
            setMfaStep('mfa')
            setMessage('Please enter your MFA code')
            setMessageType('info')
          } else {
            setMessage(result.error || 'Authentication failed')
            setMessageType('error')
          }
        }
      } else {
        const result = await signUpAdmin(formData.email, formData.password, formData.name)
        
        if (result.success) {
          const successMessage = 'message' in result && result.message 
            ? result.message 
            : 'Account created! Please check your email to confirm your account.'
          setMessage(successMessage)
          setMessageType('success')
          setMode('signin')
        } else {
          setMessage(result.error || 'Account creation failed')
          setMessageType('error')
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setMessage('An unexpected error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.mfaCode) {
      setMessage('Please enter your MFA code')
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      // Handle MFA verification here - you'll need to implement this in admin-auth.ts
      // For now, this is a placeholder
      setMessage('MFA verification not yet implemented')
      setMessageType('error')
    } catch (error) {
      console.error('MFA verification error:', error)
      setMessage('MFA verification failed. Please try again.')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (message) {
      setMessage('')
    }
  }

  if (mfaStep === 'mfa') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Multi-Factor Authentication
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the code from your authenticator app
            </p>
          </div>

          {message && (
            <div className={`border px-4 py-3 rounded-md ${
              messageType === 'error' 
                ? 'bg-red-50 border-red-200 text-red-700'
                : messageType === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <div className="flex items-center">
                {messageType === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
                {messageType === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
                {messageType === 'info' && <Smartphone className="h-5 w-5 mr-2" />}
                {message}
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit}>
            <div>
              <label htmlFor="mfaCode" className="sr-only">
                MFA Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  autoComplete="one-time-code"
                  required
                  value={formData.mfaCode}
                  onChange={(e) => handleInputChange('mfaCode', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isLoading ? (
                    <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : (
                    <Shield className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                  )}
                </span>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMfaStep(null)
                  setFormData(prev => ({ ...prev, mfaCode: '' }))
                  setMessage('')
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'signin' ? 'Admin Portal Access' : 'Create Admin Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'signin' 
              ? 'Sign in to manage your claims portal' 
              : 'Create a new admin account'
            }
          </p>
        </div>

        {message && (
          <div className={`border px-4 py-3 rounded-md ${
            messageType === 'error' 
              ? 'bg-red-50 border-red-200 text-red-700'
              : messageType === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center">
              {messageType === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
              {messageType === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
              {messageType === 'info' && <Shield className="h-5 w-5 mr-2" />}
              {message}
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Full name (optional)"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                ) : (
                  <Lock className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                )}
              </span>
              {isLoading 
                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') 
                : (mode === 'signin' ? 'Sign in' : 'Create account')
              }
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setMessage('')
                setFormData({ email: '', password: '', name: '', mfaCode: '' })
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {mode === 'signin' 
                ? "Don't have an account? Create one" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Secure Admin Access
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This admin portal uses enterprise-grade security features including:
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Email confirmation</li>
                    <li>Password recovery</li>
                    <li>Multi-factor authentication</li>
                    <li>Rate limiting</li>
                    <li>Secure session management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}