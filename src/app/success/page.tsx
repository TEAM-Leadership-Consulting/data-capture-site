// app/claim/success/page.tsx

'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Download, Calendar, Shield, Mail } from 'lucide-react'
import { Suspense } from 'react'

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClaimSuccessPage />
    </Suspense>
  )
}

function ClaimSuccessPage() {
  const searchParams = useSearchParams()
  const claimCode = searchParams.get('code') || 'Not Available'
  
  const submissionDetails = {
    claimCode,
    submissionDate: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const downloadReceipt = () => {
    const receiptContent = `
SETTLEMENT CLAIM SUBMISSION RECEIPT

Claim Code: ${submissionDetails.claimCode}
Submission Date: ${submissionDetails.submissionDate}
Status: Successfully Submitted

IMPORTANT INFORMATION:
• Keep this receipt for your records
• Claims are typically processed within 60-90 days
• Do not submit duplicate claims
• Contact the settlement administrator if you have questions

This is your confirmation of successful claim submission.
No email confirmation will be sent.

Generated: ${new Date().toLocaleString()}
    `

    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claim-receipt-${submissionDetails.claimCode}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const printPage = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Claim Submitted Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            Your settlement claim has been received and is being processed.
          </p>
        </div>

        {/* Submission Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Submission Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Claim Code</h3>
              <p className="text-2xl font-bold text-blue-700">{submissionDetails.claimCode}</p>
              <p className="text-sm text-blue-600 mt-1">Save this code for your records</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Submission Date</h3>
              <p className="text-lg font-semibold text-green-700">{submissionDetails.submissionDate}</p>
              <p className="text-sm text-green-600 mt-1">Your claim was submitted at this time</p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadReceipt}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </button>
            <button
              onClick={printPage}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Print This Page
            </button>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Important Reminders</h3>
              <ul className="text-sm text-amber-800 space-y-2">
                <li>• <strong>No email confirmation will be sent</strong> - please save your claim code and this page</li>
                <li>• Claims are typically processed within 60-90 days</li>
                <li>• Do not submit duplicate claims with the same information</li>
                <li>• Keep your downloaded receipt for your records</li>
                <li>• Contact the settlement administrator if you have questions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">What Happens Next?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-sm font-semibold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Review Process</h3>
                <p className="text-sm text-gray-600">Your claim will be reviewed for completeness and eligibility according to the settlement terms.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-sm font-semibold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Document Verification</h3>
                <p className="text-sm text-gray-600">Any supporting documentation you uploaded will be verified and processed.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-sm font-semibold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Decision Notification</h3>
                <p className="text-sm text-gray-600">You will be notified of the claim decision according to the settlement administration process.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-sm font-semibold text-green-600">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Payment Processing</h3>
                <p className="text-sm text-gray-600">If approved, payment will be processed via your selected payment method.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Need Help?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Questions about your claim?</h3>
                <p className="text-sm text-gray-600">Contact the settlement administrator through the official settlement website.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Check important dates</h3>
                <Link href="/important-dates" className="text-sm text-blue-600 hover:text-blue-800">
                  View settlement timeline →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
      
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            font-size: 12pt;
            line-height: 1.5;
          }
          
          .bg-gray-50 {
            background: white !important;
          }
          
          .shadow-sm {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
        }
      `}</style>
    </div>
  )
}