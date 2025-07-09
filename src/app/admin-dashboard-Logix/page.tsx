// app/admin-dashboard-Logix/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '../../components/admin/LoginForm'
import { getCurrentAdminSession } from '../../lib/admin-auth'  
import { Loader2 } from 'lucide-react'
import Head from 'next/head'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

export default function AdminLoginPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

  const checkExistingAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking existing auth on login page...')
      // Check if user is already authenticated with Supabase
      const sessionResult = await getCurrentAdminSession()
      
      console.log('Session result:', sessionResult)
      
      if (sessionResult.success && sessionResult.user) {
        console.log('✅ Existing session found, redirecting to dashboard...')
        // Add a flag to prevent infinite redirects
        localStorage.setItem('redirect_from_login', 'true')
        router.push('/admin-dashboard-Logix/dashboard')
        return
      } else {
        console.log('❌ No existing session found')
        // Clear any redirect flags
        localStorage.removeItem('redirect_from_login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setIsCheckingAuth(false)
    }
  }, [router])

  useEffect(() => {
    checkExistingAuth()
  }, [checkExistingAuth])

  const handleLogin = (user: AdminUser) => {
    // Store the user info and redirect
    console.log('🎉 User logged in successfully:', user)
    console.log('🚀 Redirecting to dashboard...')
    
    // Set a flag to indicate successful login
    localStorage.setItem('login_success', 'true')
    localStorage.setItem('admin_user', JSON.stringify(user))
    
    router.push('/admin-dashboard-Logix/dashboard')
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login-page">
      <Head>
        <meta name="description" content="Secure admin login for claims portal management" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Head>
      
      {/* Login Form */}
      <LoginForm onLogin={handleLogin} />
      
      {/* Security notice footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white py-2">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs">
            🔒 Secure Admin Portal - Enterprise Authentication
          </p>
        </div>
      </div>
      
      <style jsx global>{`
        .admin-login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .admin-login-page input[type="password"] {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        @media print {
          .admin-login-page {
            display: none !important;
          }
        }
        
        .admin-login-page input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
        }
      `}</style>
    </div>
  )
}