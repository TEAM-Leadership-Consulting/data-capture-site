// lib/schemas.ts
import { z } from 'zod'

// Enhanced claim form schema with new sections
export const claimFormSchema = z.object({
  // Section I: Contact Information
  fullName: z.string().min(1, 'Full name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'Valid ZIP code is required'),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required'),

  // Section II: Harm Types (flattened for easier form handling)
  harmEmotionalDistress: z.boolean().optional(),
  harmTransactionDelayed: z.boolean().optional(),
  harmCreditDenied: z.boolean().optional(),
  harmUnableToComplete: z.boolean().optional(),
  harmOther: z.boolean().optional(),

  // Section II: Harm Details (flattened)
  harmDetailsEmotionalDistress: z.string().optional(),
  harmDetailsTransactionDelayed: z.string().optional(),
  harmDetailsCreditDenied: z.string().optional(),
  harmDetailsUnableToComplete: z.string().optional(),
  harmDetailsOther: z.string().optional(),

  // Section II: Supporting Documentation (changed to string to fix TypeScript issues)
  supportingDocsTransactionDelayed: z.string().optional(),
  supportingDocsCreditDenied: z.string().optional(),
  supportingDocsUnableToComplete: z.string().optional(),
  supportingDocsOther: z.string().optional(),

  // Section III: Payment Method
  paymentMethod: z.enum([
    'paypal',
    'venmo', 
    'zelle',
    'prepaidCard',
    'physicalCheck'
  ], {
    required_error: 'Please select a payment method',
  }),

  // Payment Details (flattened for easier form handling)
  paypalEmail: z.string().email().optional(),
  venmoPhone: z.string().optional(),
  zellePhone: z.string().optional(),
  zelleEmail: z.string().email().optional(),
  prepaidCardEmail: z.string().email().optional(),

  // Signature Section
  signature: z.string().min(1, 'Digital signature is required'),
  printedName: z.string().min(1, 'Printed name is required'),
  signatureDate: z.string().min(1, 'Signature date is required'),

  // Legacy fields (maintain backward compatibility)
  incidentDate: z.string().optional(),
  incidentDescription: z.string().optional(),
  damageAmount: z.string().optional(),
  witnessName: z.string().optional(),
  witnessContact: z.string().optional(),
}).refine((data) => {
  // Custom validation: ensure at least one harm type is selected if any harm section is filled
  const hasHarmSelected = data.harmEmotionalDistress || 
                         data.harmTransactionDelayed || 
                         data.harmCreditDenied || 
                         data.harmUnableToComplete || 
                         data.harmOther;
  
  // Only require harm selection if this is a settlement claim (has payment method)
  if (data.paymentMethod && !hasHarmSelected) {
    return false;
  }
  return true;
}, {
  message: "Please select at least one type of harm you experienced",
  path: ["harmEmotionalDistress"]
}).refine((data) => {
  // Custom validation: payment details based on selected method
  if (!data.paymentMethod) return true;
  
  switch (data.paymentMethod) {
    case 'paypal':
      return !!(data.paypalEmail && data.paypalEmail.length > 0);
    case 'venmo':
      return !!(data.venmoPhone && data.venmoPhone.length > 0);
    case 'zelle':
      return !!((data.zellePhone && data.zellePhone.length > 0) || 
                (data.zelleEmail && data.zelleEmail.length > 0));
    case 'prepaidCard':
      return !!(data.prepaidCardEmail && data.prepaidCardEmail.length > 0);
    case 'physicalCheck':
      return true; // No additional details needed
    default:
      return false;
  }
}, {
  message: "Please provide the required information for your selected payment method",
  path: ["paymentMethod"]
});

export type ClaimFormData = z.infer<typeof claimFormSchema>

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