// components/Footer.tsx
import Link from 'next/link'
import { Scale, Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Case Information */}
          <div className="lg:col-span-2">
            <div className="flex items-start space-x-3 mb-4">
              <Scale className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold leading-tight">
                  Bob Johnson vs Smith & Jones, LLC
                </h3>
                <p className="text-sm text-gray-400">
                  Case No. C-16-CV-24-001546
                </p>
              </div>
            </div>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
              This website provides information about the Bob Johnson vs Smith & Jones, LLC 
              class action settlement. The Circuit Court for Prince George&apos;s County, Maryland 
              authorized this notice.
            </p>
            <p className="text-xs text-gray-400">
              This is not a solicitation from a lawyer.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm py-1 inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#claim-form" className="text-gray-300 hover:text-white transition-colors text-sm py-1 inline-block">
                  File A Claim
                </Link>
              </li>
              <li>
                <Link href="/documents" className="text-gray-300 hover:text-white transition-colors text-sm py-1 inline-block">
                  Important Documents
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-gray-300 hover:text-white transition-colors text-sm py-1 inline-block">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/important-dates" className="text-gray-300 hover:text-white transition-colors text-sm py-1 inline-block">
                  Important Dates
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm py-1 inline-block">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-sm text-gray-300 min-w-0">
                  <p className="font-medium">Bob Johnson vs Smith & Jones, LLC</p>
                  <p>c/o Settlement Administrator</p>
                  <p>P.O. Box 24</p>
                  <p>Seal Point, OR 12345</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <a 
                  href="tel:555-222-1212" 
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  555-222-1212
                </a>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <a 
                  href="mailto:Questions@JohnsonSmithJones.com" 
                  className="text-sm text-gray-300 hover:text-white transition-colors break-words"
                >
                  Questions@JohnsonSmithJones.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-400">
              <p>© 2025 Bob Johnson vs Smith & Jones, LLC Settlement</p>
              <p className="mt-1">
                Website: <a 
                  href="https://www.JohnsonSmithJones.com" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  www.JohnsonSmithJones.com
                </a>
              </p>
            </div>
            <div className="text-sm text-gray-400">
              <p>Secure SSL encrypted website</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}