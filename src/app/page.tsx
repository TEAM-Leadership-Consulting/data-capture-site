// app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Scale, AlertCircle } from 'lucide-react'

export default function HomePage() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Handle input change - preserve exact case but clear errors
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCode(value)
    if (error) setError('') // Clear error when user starts typing
  }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError('')

  try {
    // Use the exact code as entered (case-sensitive)
    const normalizedCode = code.trim()

    // Check if the code exists, is active, and hasn't been used
    const { data, error: supabaseError } = await supabase
      .from('claims')
      .select('*')
      .eq('unique_code', normalizedCode)
      .eq('is_active', true)
      .eq('is_used', false) // NEW: Check if not used
      .single()

    if (supabaseError || !data) {
      // Check what the specific issue is
      const { data: codeCheck } = await supabase
        .from('claims')
        .select('is_used, is_active, expires_at')
        .eq('unique_code', normalizedCode)
        .single()

      if (codeCheck) {
        if (codeCheck.is_used) {
          setError('This claim code has already been used and cannot be used again.')
          return
        }
        if (!codeCheck.is_active) {
          setError('This claim code is no longer active.')
          return
        }
        if (codeCheck.expires_at && new Date(codeCheck.expires_at) < new Date()) {
          setError('This claim code has expired.')
          return
        }
      }
      
      setError('Invalid claim code. Please check your code and try again.')
      return
    }

    // Check if code has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setError('This claim code has expired.')
      return
    }

    // Redirect to claim form using exact code
    router.push(`/claim/${normalizedCode}`)
  } catch {
    setError('An error occurred. Please try again.')
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-white to-blue-100 pt-20">
      {/* Court Order Header */}
      <section className="bg-white shadow-lg relative border-l-8 border-r-8 border-blue-600">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-blue-50"></div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Scale className="h-12 w-12 text-blue-800" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Bob Johnson vs Smith & Jones, LLC
            </h1>
            <p className="text-lg font-semibold text-blue-800 mb-6">
              Case No. C-16-CV-24-001546 (Circuit Court for Prince George&apos;s County, Maryland)
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-800 p-8 text-left shadow-md">
              <p className="text-lg font-bold text-blue-900 mb-6 text-center underline decoration-2 underline-offset-4">
                BY ORDER OF THE CIRCUIT COURT FOR PRINCE GEORGE&apos;S COUNTY
              </p>
              <p className="text-xl text-gray-800 leading-relaxed font-medium">
                If you paid a Service Fee to MockPay in connection with MockPay&apos;s collection of 
                charges arising from residential real property located in Maryland, including 
                rent and community association dues, during the period beginning April 19, 2018 
                through and including December 26, 2024, you could be part of a Class Action 
                Settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-4 bg-yellow-100 border-l-8 border-blue-600 border-r-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm italic text-yellow-800">
              The Circuit Court for Prince George&apos;s County, Maryland authorized this notice. This is not a solicitation from a lawyer.
            </p>
          </div>
        </div>
      </section>

      {/* Settlement Details */}
      <section className="py-12 bg-white shadow-lg relative border-l-8 border-r-8 border-blue-600">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <ul className="space-y-4 text-gray-800">
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <p>
                  Through a proposed Class Action Settlement, MockPay, LLC (&quot;MockPay&quot;) has agreed without any admission of wrongdoing to resolve a 
                  lawsuit over whether MockPay acted as a collection agency and charged Service Fees to Maryland tenants without a collection 
                  agency license or bond, allegedly in violation of Maryland law.
                </p>
              </li>
              
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <p>
                  The proposed Class Action Settlement avoids costs and risks from continuing the lawsuit, pays money to Settlement Class Members 
                  who file Valid Claims, and releases MockPay from liability to Settlement Class Members.
                </p>
              </li>
              
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <p>
                  Under the proposed Settlement, MockPay will fund a common fund of <strong>$2,500,000</strong> (the &quot;Common Fund&quot;). This Common Fund will be 
                  used to make payments to all Settlement Class Members who file Valid Claims, after deducting Class Counsel&apos;s Court-approved 
                  expenses and attorneys&apos; fees. In return, Settlement Class Members give up any right to sue for claims resulting from, arising 
                  out of, or regarding the factual predicate alleged in the Lawsuit.
                </p>
              </li>
              
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <p>
                  Court-appointed lawyers for Settlement Class Members will ask the Court to approve a payment of 1/3 of the Common Fund as 
                  attorneys&apos; fees, plus their expenses of litigation, for investigating the facts, litigating the case, and negotiating the Settlement.
                </p>
              </li>
              
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <p>
                  In addition, MockPay has agreed to pay the costs of settlement administration, and to pay the Class Representative an incentive 
                  payment of up to $12,000 in addition to the Common Fund, subject to Court Approval.
                </p>
              </li>
              
              <li className="flex items-start">
                <span className="text-blue-600 mr-3 mt-1">•</span>
                <p>
                  The two sides disagree on whether a class action could have been maintained, whether MockPay did anything wrong, and how much 
                  money was at stake.
                </p>
              </li>
            </ul>
            
            <div className="mt-8 bg-red-50 border-l-4 border-red-500 p-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-1 flex-shrink-0" />
                <p className="text-red-800 font-semibold text-lg">
                  If you are a Settlement Class Member, your legal rights are affected whether you act, or don&apos;t act. Read the Notice carefully.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Rights and Options Table */}
      <section className="py-12 bg-gradient-to-r from-blue-200 via-gray-100 to-blue-200 border-l-8 border-r-8 border-blue-600">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              LEGAL RIGHTS AND OPTIONS FOR SETTLEMENT CLASS MEMBERS
            </h2>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="bg-gray-200 px-6 py-4 font-bold text-gray-900 align-top w-1/4">
                      FILE A CLAIM
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      If you paid a Service Fee to MockPay in connection with MockPay&apos;s collection of charges arising from 
                      residential real property located in Maryland, including rent and community association dues, during the 
                      period beginning April 19, 2018 through and including December 26, 2024, you are a Settlement Class Member 
                      and you can file a claim online <a href="#claim-form" className="text-blue-600 hover:underline">here</a>, or download and mail a Claim Form 
                      <a href="/documents" className="text-blue-600 hover:underline"> here</a> or you can ask the Settlement 
                      Administrator to mail you a Claim Form by calling (555) 222-1212. The deadline to file a claim is <strong>August 8, 2025</strong>.
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="bg-gray-200 px-6 py-4 font-bold text-gray-900 align-top">
                      DO NOTHING
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      If you do not file a Valid Claim, you will not receive any payment, even if you are a Settlement Class Member. 
                      You will still be bound by the Settlement and will still release MockPay from liability to you. If you remain in the 
                      Settlement Class, you can&apos;t sue, continue to sue, or be part of any other lawsuit against MockPay about the 
                      claims which were made or could have been made in the Lawsuit.
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="bg-gray-200 px-6 py-4 font-bold text-gray-900 align-top">
                      EXCLUDE YOURSELF
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      If you &quot;opt-out&quot; or exclude yourself, you will get no settlement benefits. This is the only option that allows you 
                      to ever bring an action against MockPay about legal claims sharing the factual predicate of the claims asserted 
                      in this case. If you wish to exclude yourself from the Settlement, you must mail a request for exclusion to the 
                      Settlement Administrator postmarked no later than <strong>March 26, 2025</strong>, as explained 
                      <a href="/documents" className="text-blue-600 hover:underline"> herein</a>.
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-200">
                    <td className="bg-gray-200 px-6 py-4 font-bold text-gray-900 align-top">
                      OBJECT
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      If you have objections, you may write to the Court about why you don&apos;t like the Settlement. The deadline to 
                      object is <strong>March 26, 2025</strong>.
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="bg-gray-200 px-6 py-4 font-bold text-gray-900 align-top">
                      GO TO A HEARING
                    </td>
                    <td className="px-6 py-4 text-gray-800">
                      If you write to the Court with an objection, you can also ask to speak in Court about the fairness of the 
                      Settlement.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Claim Code Entry Section */}
      <section id="claim-form" className="py-16 bg-white shadow-lg relative border-l-8 border-r-8 border-blue-600">
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 via-white to-green-50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Enter Your Claim Code
              </h2>
              <p className="text-lg text-gray-600">
                Have a claim code? Enter it below to access your claim form.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Note: Claim codes are case-sensitive (e.g., 2xQ9YNw)
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Claim Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={handleCodeChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono tracking-wider"
                    placeholder="Enter your claim code (e.g., 2xQ9YNw)"
                    required
                  />
                  {error && (
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your claim code exactly as provided
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !code.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Verifying...' : 'Access Claim Form'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Important Dates */}
      <section className="py-12 bg-gradient-to-r from-indigo-200 via-blue-100 to-indigo-200 border-l-8 border-blue-600 border-r-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Important Dates
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  March 26, 2025
                </h3>
                <p className="text-gray-700">
                  Deadline to exclude yourself or object to the Settlement
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-2">
                  April 15, 2025
                </h3>
                <p className="text-gray-700">
                  Final approval hearing
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  August 8, 2025
                </h3>
                <p className="text-gray-700">
                  Deadline to file a claim
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}