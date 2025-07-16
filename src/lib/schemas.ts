// lib/schemas.ts
import { z } from 'zod'

// ==========================================
// UPLOADED FILE SCHEMA
// ==========================================

const uploadedFileSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  url: z.string(),
  size: z.number(),
  uploadedAt: z.string().optional(),
  fileHash: z.string().optional(),
  storagePath: z.string().optional()
})

// ==========================================
// INDIVIDUAL SCHEMA COMPONENTS
// ==========================================

// Contact information schema
const contactInfoSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'Valid ZIP code is required'),
  phone: z.string()
})

// Individual harm type schema - ALL FIELDS REQUIRED
const harmTypeSchema = z.object({
  selected: z.boolean(),
  details: z.string(),
  hasDocumentation: z.string(),
  uploadedFiles: z.array(uploadedFileSchema)
})

// All harm types schema
const harmTypesSchema = z.object({
  emotionalDistress: harmTypeSchema,
  transactionDelayed: harmTypeSchema,
  creditDenied: harmTypeSchema,
  unableToComplete: harmTypeSchema,
  other: harmTypeSchema
})

// Payment information schema - ALL FIELDS REQUIRED
const paymentSchema = z.object({
  method: z.enum(['paypal', 'venmo', 'zelle', 'prepaidCard', 'physicalCheck']).nullable(),
  paypalEmail: z.string(),
  venmoPhone: z.string(),
  zellePhone: z.string(),
  zelleEmail: z.string(),
  prepaidCardEmail: z.string()
})

// Digital signature schema - ALL FIELDS REQUIRED
const signatureSchema = z.object({
  signature: z.string().min(1, 'Digital signature is required'),
  printedName: z.string().min(1, 'Printed name is required'),
  date: z.string()
})

// ==========================================
// MAIN SCHEMAS
// ==========================================

// React Hook Form compatible schema with proper defaults
export const claimFormSchemaRHF = z.object({
  contactInfo: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Valid email is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(5, 'Valid ZIP code is required'),
    phone: z.string()
  }),
  harmTypes: z.object({
    emotionalDistress: z.object({
      selected: z.boolean(),
      details: z.string(),
      hasDocumentation: z.string(),
      uploadedFiles: z.array(uploadedFileSchema)
    }),
    transactionDelayed: z.object({
      selected: z.boolean(),
      details: z.string(),
      hasDocumentation: z.string(),
      uploadedFiles: z.array(uploadedFileSchema)
    }),
    creditDenied: z.object({
      selected: z.boolean(),
      details: z.string(),
      hasDocumentation: z.string(),
      uploadedFiles: z.array(uploadedFileSchema)
    }),
    unableToComplete: z.object({
      selected: z.boolean(),
      details: z.string(),
      hasDocumentation: z.string(),
      uploadedFiles: z.array(uploadedFileSchema)
    }),
    other: z.object({
      selected: z.boolean(),
      details: z.string(),
      hasDocumentation: z.string(),
      uploadedFiles: z.array(uploadedFileSchema)
    })
  }),
  payment: z.object({
    method: z.enum(['paypal', 'venmo', 'zelle', 'prepaidCard', 'physicalCheck']).nullable(),
    paypalEmail: z.string(),
    venmoPhone: z.string(),
    zellePhone: z.string(),
    zelleEmail: z.string(),
    prepaidCardEmail: z.string()
  }),
  signature: z.object({
    signature: z.string().min(1, 'Digital signature is required'),
    printedName: z.string().min(1, 'Printed name is required'),
    date: z.string()
  }),
  metadata: z.object({
    lastSaved: z.string(),
    completionStatus: z.object({
      contactInfo: z.boolean(),
      harmTypes: z.boolean(),
      payment: z.boolean(),
      signature: z.boolean()
    })
  }).optional()
}).refine((data) => {
  // Custom validation: payment details based on selected method
  const { method } = data.payment
  
  if (!method) return false // Payment method is required
  
  switch (method) {
    case 'paypal':
      return !!(data.payment.paypalEmail && data.payment.paypalEmail.length > 0)
    case 'venmo':
      return !!(data.payment.venmoPhone && data.payment.venmoPhone.length > 0)
    case 'zelle':
      return !!((data.payment.zellePhone && data.payment.zellePhone.length > 0) || 
                (data.payment.zelleEmail && data.payment.zelleEmail.length > 0))
    case 'prepaidCard':
      return !!(data.payment.prepaidCardEmail && data.payment.prepaidCardEmail.length > 0)
    case 'physicalCheck':
      return true
    default:
      return false
  }
}, {
  message: "Please provide the required information for your selected payment method",
  path: ["payment"]
}).refine((data) => {
  // Custom validation: require documentation details when selected
  const harmTypes = data.harmTypes
  
  // Check each harm type for documentation requirements
  const requiredDocs = [
    { type: harmTypes.transactionDelayed, name: 'transaction delayed' },
    { type: harmTypes.creditDenied, name: 'credit denied' },
    { type: harmTypes.unableToComplete, name: 'unable to complete' },
    { type: harmTypes.other, name: 'other harm' }
  ]
  
  for (const doc of requiredDocs) {
    if (doc.type.selected && doc.type.hasDocumentation === 'yes') {
      if (!doc.type.uploadedFiles || doc.type.uploadedFiles.length === 0) {
        return false
      }
    }
  }
  
  return true
}, {
  message: "Please upload required supporting documentation for selected harm types",
  path: ["harmTypes"]
})

// Main claim form schema with nested structure (for validation)
export const claimFormSchema = z.object({
  // Section I: Contact Information
  contactInfo: contactInfoSchema,

  // Section II: Harm Types (nested structure)
  harmTypes: harmTypesSchema,

  // Section III: Payment Information
  payment: paymentSchema,

  // Section IV: Digital Signature
  signature: signatureSchema,

  // Metadata for tracking
  metadata: z.object({
    lastSaved: z.string().optional(),
    completionStatus: z.object({
      contactInfo: z.boolean().default(false),
      harmTypes: z.boolean().default(false),
      payment: z.boolean().default(false),
      signature: z.boolean().default(false)
    }).optional()
  }).optional()

}).refine((data) => {
  // Custom validation: payment details based on selected method
  const { method } = data.payment
  
  if (!method) return true // Allow null during form filling
  
  switch (method) {
    case 'paypal':
      return !!(data.payment.paypalEmail && data.payment.paypalEmail.length > 0)
    case 'venmo':
      return !!(data.payment.venmoPhone && data.payment.venmoPhone.length > 0)
    case 'zelle':
      return !!((data.payment.zellePhone && data.payment.zellePhone.length > 0) || 
                (data.payment.zelleEmail && data.payment.zelleEmail.length > 0))
    case 'prepaidCard':
      return !!(data.payment.prepaidCardEmail && data.payment.prepaidCardEmail.length > 0)
    case 'physicalCheck':
      return true
    default:
      return false
  }
}, {
  message: "Please provide the required information for your selected payment method",
  path: ["payment"]
}).refine((data) => {
  // Custom validation: require documentation details when selected
  const harmTypes = data.harmTypes
  
  // Check each harm type for documentation requirements
  const requiredDocs = [
    { type: harmTypes.transactionDelayed, name: 'transaction delayed' },
    { type: harmTypes.creditDenied, name: 'credit denied' },
    { type: harmTypes.unableToComplete, name: 'unable to complete' },
    { type: harmTypes.other, name: 'other harm' }
  ]
  
  for (const doc of requiredDocs) {
    if (doc.type.selected && doc.type.hasDocumentation === 'yes') {
      if (!doc.type.uploadedFiles || doc.type.uploadedFiles.length === 0) {
        return false
      }
    }
  }
  
  return true
}, {
  message: "Please upload required supporting documentation for selected harm types",
  path: ["harmTypes"]
})

// ==========================================
// TYPE EXPORTS
// ==========================================

export type ClaimFormData = z.infer<typeof claimFormSchema>
export type ClaimFormDataRHF = z.infer<typeof claimFormSchemaRHF>

// ==========================================
// OTHER SCHEMAS
// ==========================================

// File upload validation schema
export const fileUploadSchema = z.object({
  name: z.string(),
  size: z.number().max(100 * 1024 * 1024, 'File size must be less than 100MB'), // Updated to 100MB
  type: z.string().refine((type) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'video/mp4', 'video/mov', 'video/avi',
      'audio/mp3', 'audio/wav', 'audio/m4a'
    ]
    return allowedTypes.includes(type)
  }, 'Invalid file type')
})

// Contact form schema (existing)
export const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  claimCode: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

// Admin schemas
export const createClaimSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  isActive: z.boolean().default(true),
})

export type CreateClaimData = z.infer<typeof createClaimSchema>

// Export individual schemas for progressive validation (if needed)
export { contactInfoSchema, harmTypesSchema, paymentSchema, signatureSchema }