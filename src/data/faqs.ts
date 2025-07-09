export interface FAQ {
  id: number
  question: string
  answer: string
  category: string
  isVisible?: boolean
  order?: number
  lastModified?: string
  modifiedBy?: string
}

export const faqs: FAQ[] = [
  {
    id: 1,
    category: "Getting Started",
    question: "How do I obtain a claim code?",
    answer: "Claim codes are provided by your legal representative, insurance company, or case administrator. If you believe you should have received a claim code but haven't, please contact our support team or your case administrator directly.",
    isVisible: true,
    order: 1,
    lastModified: new Date().toISOString(),
    modifiedBy: "System"
  },
  {
    id: 2,
    category: "Getting Started", 
    question: "What if I don't have a claim code?",
    answer: "You cannot access the claim filing system without a valid claim code. Please contact the organization or legal representative who informed you about the claim to obtain your unique code.",
    isVisible: true,
    order: 2,
    lastModified: new Date().toISOString(),
    modifiedBy: "System"
  }, 
  {
    id: 3,
    category: "Filing Process",
    question: "How long does it take to complete a claim form?",
    answer: "Most claimants complete the form in 15-30 minutes. The system automatically saves your progress, so you can take breaks and return later to finish.",
 isVisible: true,
  order: 3,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 4,
    category: "Filing Process",
    question: "Can I save my progress and return later?",
    answer: "Yes, the system automatically saves your progress as you complete each section. You can safely close your browser and return using the same claim code to continue where you left off.",
 isVisible: true,
  order: 4,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 5,
    category: "Filing Process",
    question: "What information do I need to complete my claim?",
    answer: "You'll need personal information (name, address, contact details), incident details (date, description, damage amount), and any witness information if applicable. Having relevant documents and receipts ready will help speed up the process.",
 isVisible: true,
  order: 5,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 6,
    category: "Technical Support",
    question: "What browsers are supported?",
    answer: "Our portal works best with current versions of Chrome, Firefox, Safari, and Edge. For the best experience, please ensure your browser is up to date and JavaScript is enabled.",
 isVisible: true,
  order: 6,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 7,
    category: "Technical Support",
    question: "I'm having trouble submitting my form. What should I do?",
    answer: "First, check that all required fields are completed and any error messages are addressed. If you continue to experience issues, try refreshing the page or clearing your browser cache. Contact our technical support if problems persist.",
 isVisible: true,
  order: 7,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 8,
    category: "Security & Privacy",
    question: "Is my personal information secure?",
    answer: "Yes, we use bank-level encryption (SSL/TLS) to protect all data transmission. Your information is stored securely and accessed only by authorized personnel involved in processing your claim.",
 isVisible: true,
  order: 8,
  lastModified: new Date().toISOString(),
  modifiedBy: "System" 
},
  {
    id: 9,
    category: "Security & Privacy",
    question: "Who has access to my claim information?",
    answer: "Only authorized legal professionals, case administrators, and our secure technical staff have access to your information. We follow strict privacy protocols and never share your data with unauthorized third parties.",
 isVisible: true,
  order: 9,
  lastModified: new Date().toISOString(),
  modifiedBy: "System" 
},
  {
    id: 10,
    category: "After Submission",
    question: "What happens after I submit my claim?",
    answer: "You'll receive an immediate confirmation via email. Our legal team will review your submission within 2-3 business days. If additional information is needed, we'll contact you directly.",
 isVisible: true,
  order: 10,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 11,
    category: "After Submission",
    question: "How long does claim processing take?",
    answer: "Most claims are processed within 5-10 business days. Complex cases may take longer. You'll receive email updates throughout the process and be notified of any delays.",
 isVisible: true,
  order: 11,
  lastModified: new Date().toISOString(),
  modifiedBy: "System" 
},
  {
    id: 12,
    category: "After Submission",
    question: "Can I make changes to my claim after submission?",
    answer: "Once submitted, claims cannot be modified through the portal. If you need to make corrections or additions, please contact our support team immediately with your claim mode and details of the changes needed.",
 isVisible: true,
  order: 12,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"
},
  {
    id: 13,
    category: "After Submission",
    question: "How will I be notified about my claim status?",
    answer: "You'll receive email notifications at key stages: submission confirmation, review completion, and final decision. Please ensure your email address is correct and check your spam folder.",
 isVisible: true,
  order: 13,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 14,
    category: "Legal Questions",
    question: "Do I need a lawyer to file a claim?",
    answer: "No, you can complete the claim form yourself. However, if your case is complex or involves significant damages, you may want to consult with a legal professional before submitting.",
 isVisible: true,
  order: 14,
  lastModified: new Date().toISOString(),
  modifiedBy: "System" 
},
  {
    id: 15,
    category: "Legal Questions",
    question: "What if my claim is denied?",
    answer: "If your claim is denied, you'll receive a detailed explanation of the decision. You may have options for appeal or reconsideration, which will be outlined in your notification letter.",
 isVisible: true,
  order: 15,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 16,
    category: "Legal Questions",
    question: "Are there any fees to file a claim?",
    answer: "No, there are no fees to file a claim through this portal. The process is completely free for eligible claimants. Be wary of anyone asking for payment to file your claim.",
 isVisible: true,
  order: 16,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 17,
    category: "Documentation",
    question: "What documents should I gather before filing?",
    answer: "Gather any receipts, invoices, medical records, photos, correspondence, or other evidence related to your claim. While not all documents are required, having them ready will help you provide complete information.",
 isVisible: true,
  order: 17,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 18,
    category: "Documentation",
    question: "Can I upload documents during the filing process?",
    answer: "The current version of the portal is for information submission only. If additional documents are needed, our review team will contact you with specific instructions for document submission.",
 isVisible: true,
  order: 18,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 19,
    category: "Deadlines",
    question: "What is the deadline to file my claim?",
    answer: "The claim filing deadline varies by case. Check the Important Dates page for your specific deadline. Missing the deadline may result in your claim not being processed.",
 isVisible: true,
  order: 19,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"  
},
  {
    id: 20,
    category: "Deadlines",
    question: "What happens if I miss the filing deadline?",
    answer: "Claims submitted after the deadline may not be processed. However, there may be exceptions for extraordinary circumstances. Contact our support team immediately if you've missed the deadline.",
   isVisible: true,
  order: 20,
  lastModified: new Date().toISOString(),
  modifiedBy: "System"}
  ]

export const categories = [
  'Getting Started',
  'Filing Process', 
  'Technical Support',
  'Security & Privacy',
  'After Submission',
  'Legal Questions',
  'Documentation',
  'Deadlines'
]