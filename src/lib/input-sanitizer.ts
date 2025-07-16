// lib/input-sanitizer.ts - PRODUCTION INPUT SANITIZATION SERVICE

export interface SanitizationConfig {
  allowHtml?: boolean
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  maxLength?: number
  stripScripts?: boolean
  normalizWhitespace?: boolean
  preventSqlInjection?: boolean
  preventXss?: boolean
  logSuspiciousContent?: boolean
}

export interface SanitizationResult {
  sanitized: string
  wasModified: boolean
  threats: string[]
  originalLength: number
  sanitizedLength: number
}

// Default configuration for different content types
export const SANITIZATION_CONFIGS = {
  // Plain text content
  text: {
    allowHtml: false,
    maxLength: 1000,
    stripScripts: true,
    normalizWhitespace: true,
    preventSqlInjection: true,
    preventXss: true,
    logSuspiciousContent: true
  },
  
  // Rich text content (like descriptions)
  richText: {
    allowHtml: true,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes: {
      '*': ['class'],
      'a': ['href', 'title', 'target'],
      'img': ['src', 'alt', 'width', 'height']
    },
    maxLength: 10000,
    stripScripts: true,
    normalizWhitespace: true,
    preventSqlInjection: true,
    preventXss: true,
    logSuspiciousContent: true
  },
  
  // Email addresses
  email: {
    allowHtml: false,
    maxLength: 254, // RFC 5321 limit
    stripScripts: true,
    normalizWhitespace: true,
    preventSqlInjection: true,
    preventXss: true,
    logSuspiciousContent: true
  },
  
  // Names and titles
  name: {
    allowHtml: false,
    maxLength: 100,
    stripScripts: true,
    normalizWhitespace: true,
    preventSqlInjection: true,
    preventXss: true,
    logSuspiciousContent: true
  },
  
  // Addresses
  address: {
    allowHtml: false,
    maxLength: 500,
    stripScripts: true,
    normalizWhitespace: true,
    preventSqlInjection: true,
    preventXss: true,
    logSuspiciousContent: true
  },
  
  // Phone numbers
  phone: {
    allowHtml: false,
    maxLength: 20,
    stripScripts: true,
    normalizWhitespace: true,
    preventSqlInjection: true,
    preventXss: true,
    logSuspiciousContent: true
  },
  
  // URLs
  url: {
    allowHtml: false,
    maxLength: 2000,
    stripScripts: true,
    normalizWhitespace: true,
    preventSqlInjection: true,
    preventXss: true,
    logSuspiciousContent: true
  }
} as const

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\bUNION\b.*\bSELECT\b)/gi,
  /(\bSELECT\b.*\bFROM\b)/gi,
  /(\bINSERT\b.*\bINTO\b)/gi,
  /(\bUPDATE\b.*\bSET\b)/gi,
  /(\bDELETE\b.*\bFROM\b)/gi,
  /(\bDROP\b.*\bTABLE\b)/gi,
  /(\bCREATE\b.*\bTABLE\b)/gi,
  /(\bALTER\b.*\bTABLE\b)/gi,
  /(\bEXEC\b|\bEXECUTE\b)/gi,
  /(\bSP_\w+)/gi,
  /(\bXP_\w+)/gi,
  /(--|\/\*|\*\/)/g,
  /(\b(OR|AND)\b.*[=<>].*(\b(OR|AND)\b|$))/gi,
  /(['"])\s*(OR|AND)\s*\1\s*=\s*\1/gi,
  /(['"])\s*;\s*(DROP|DELETE|UPDATE|INSERT)/gi
]

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
  /<.*?[\s\/]on\w+\s*=.*?>/gi,
  /expression\s*\(/gi,
  /@import/gi,
  /url\s*\(/gi,
  /<style[^>]*>.*?<\/style>/gi
]

// Command injection patterns
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$()]/g,
  /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|nslookup|dig|curl|wget|nc|telnet|ssh|scp|rsync)\b/gi,
  /\.(bat|cmd|exe|sh|bash|zsh|csh|tcsh|fish|ps1|vbs|js|jar|py|pl|php|rb)$/gi,
  /\b(rm|mv|cp|mkdir|rmdir|chmod|chown|kill|killall|pkill|sudo|su|passwd|useradd|userdel|groupadd|groupdel)\b/gi
]

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./g,
  /\.\.[\\/]/g,
  /[\\/]\.\./g,
  /[\\/]\.\.[\\/]/g,
  /%2e%2e/gi,
  /%252e%252e/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /%c0%ae%c0%ae/gi,
  /%c1%9c/gi
]

// LDAP injection patterns
const LDAP_INJECTION_PATTERNS = [
  /[()&|!]/g,
  /\*[\w\s]*\*/g,
  /\(\s*\|\s*\(/g,
  /\(\s*&\s*\(/g,
  /\(\s*!\s*\(/g
]

/**
 * Log security events
 */
function logSecurityEvent(eventType: string, data: {
  message: string
  ip_address?: string
  user_id?: string
  metadata?: Record<string, unknown>
}): void {
  console.warn(`[SECURITY] ${eventType}:`, {
    timestamp: new Date().toISOString(),
    type: eventType,
    ...data
  })
}

/**
 * Normalize whitespace in text
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
    .trim() // Remove leading/trailing whitespace
}

/**
 * Remove or escape HTML entities
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  
  return text.replace(/[&<>"'/]/g, (match) => htmlEntities[match] || match)
}

/**
 * Basic HTML sanitization without external dependencies
 */
function sanitizeHtml(input: string, config: SanitizationConfig): string {
  let sanitized = input

  // If HTML is not allowed, strip all tags
  if (!config.allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '')
    return escapeHtml(sanitized)
  }

  // Basic HTML sanitization when HTML is allowed
  const allowedTags = config.allowedTags || []
  const _allowedAttributes = config.allowedAttributes || {}

  // Remove dangerous tags completely
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
  sanitized = sanitized.replace(/<object[^>]*>.*?<\/object>/gi, '')
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '')
  sanitized = sanitized.replace(/<link[^>]*>/gi, '')
  sanitized = sanitized.replace(/<meta[^>]*>/gi, '')
  sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gi, '')

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '')

  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/data:text\/html/gi, '')

  // If specific tags are allowed, remove others
  if (allowedTags.length > 0) {
    const tagPattern = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})\b)[^>]*>`, 'gi')
    sanitized = sanitized.replace(tagPattern, '')
  }

  return sanitized
}

/**
 * Detect SQL injection attempts
 */
function detectSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Detect XSS attempts
 */
function detectXss(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Detect command injection attempts
 */
function detectCommandInjection(input: string): boolean {
  return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Detect path traversal attempts
 */
function detectPathTraversal(input: string): boolean {
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Detect LDAP injection attempts
 */
function detectLdapInjection(input: string): boolean {
  return LDAP_INJECTION_PATTERNS.some(pattern => pattern.test(input))
}

/**
 * Remove SQL injection patterns
 */
function sanitizeSqlInjection(input: string): string {
  let sanitized = input
  
  SQL_INJECTION_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  // Additional SQL-specific sanitization
  sanitized = sanitized
    .replace(/['";]/g, '') // Remove quotes and semicolons
    .replace(/--.*$/gm, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove block comments
  
  return sanitized
}

/**
 * Remove XSS patterns
 */
function sanitizeXss(input: string): string {
  let sanitized = input
  
  // Remove dangerous patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '')
  
  return sanitized
}

/**
 * Sanitize file paths
 */
function sanitizeFilePath(input: string): string {
  let sanitized = input
  
  // Remove path traversal sequences
  PATH_TRAVERSAL_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f\x7f-\x9f]/g, '')
  
  // Normalize path separators
  sanitized = sanitized.replace(/[\\\/]+/g, '/')
  
  return sanitized
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Validate URL format
 */
function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsedUrl.protocol)
  } catch {
    return false
  }
}

/**
 * Validate phone number format
 */
function validatePhone(phone: string): boolean {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Check if it's a reasonable phone number length (7-15 digits)
  return digitsOnly.length >= 7 && digitsOnly.length <= 15
}

/**
 * Main sanitization function
 */
export async function sanitizeInput(
  input: string,
  config: SanitizationConfig = SANITIZATION_CONFIGS.text,
  context?: {
    userIp?: string
    userId?: string
    fieldName?: string
  }
): Promise<SanitizationResult> {
  if (typeof input !== 'string') {
    return {
      sanitized: '',
      wasModified: true,
      threats: ['invalid_input_type'],
      originalLength: 0,
      sanitizedLength: 0
    }
  }
  
  const originalLength = input.length
  const threats: string[] = []
  let sanitized = input
  
  // Length check
  if (config.maxLength && sanitized.length > config.maxLength) {
    sanitized = sanitized.substring(0, config.maxLength)
    threats.push('excessive_length')
  }
  
  // Threat detection
  if (config.preventSqlInjection && detectSqlInjection(sanitized)) {
    threats.push('sql_injection_attempt')
    sanitized = sanitizeSqlInjection(sanitized)
  }
  
  if (config.preventXss && detectXss(sanitized)) {
    threats.push('xss_attempt')
    sanitized = sanitizeXss(sanitized)
  }
  
  if (detectCommandInjection(sanitized)) {
    threats.push('command_injection_attempt')
    sanitized = sanitized.replace(COMMAND_INJECTION_PATTERNS[0], '')
  }
  
  if (detectPathTraversal(sanitized)) {
    threats.push('path_traversal_attempt')
    sanitized = sanitizeFilePath(sanitized)
  }
  
  if (detectLdapInjection(sanitized)) {
    threats.push('ldap_injection_attempt')
    sanitized = sanitized.replace(LDAP_INJECTION_PATTERNS[0], '')
  }
  
  // HTML sanitization
  if (config.stripScripts || config.allowHtml) {
    sanitized = sanitizeHtml(sanitized, config)
  }
  
  // Whitespace normalization
  if (config.normalizWhitespace) {
    sanitized = normalizeWhitespace(sanitized)
  }
  
  // Log suspicious content
  if (config.logSuspiciousContent && threats.length > 0 && context?.userIp) {
    logSecurityEvent('suspicious_activity', {
      message: `Suspicious input detected in field: ${context.fieldName || 'unknown'}`,
      ip_address: context.userIp,
      user_id: context.userId,
      metadata: {
        threats,
        originalInput: input.substring(0, 100), // Only log first 100 chars
        fieldName: context.fieldName,
        sanitizationApplied: true
      }
    })
  }
  
  const sanitizedLength = sanitized.length
  const wasModified = sanitized !== input
  
  return {
    sanitized,
    wasModified,
    threats,
    originalLength,
    sanitizedLength
  }
}

/**
 * Sanitize form data object
 */
export async function sanitizeFormData(
  data: Record<string, unknown>,
  fieldConfigs: Record<string, SanitizationConfig> = {},
  context?: {
    userIp?: string
    userId?: string
  }
): Promise<{
  sanitized: Record<string, unknown>
  threats: Record<string, string[]>
  wasModified: boolean
}> {
  const sanitized: Record<string, unknown> = {}
  const threats: Record<string, string[]> = {}
  let wasModified = false
  
  for (const [fieldName, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      const config = fieldConfigs[fieldName] || SANITIZATION_CONFIGS.text
      const result = await sanitizeInput(value, config, {
        ...context,
        fieldName
      })
      
      sanitized[fieldName] = result.sanitized
      
      if (result.threats.length > 0) {
        threats[fieldName] = result.threats
      }
      
      if (result.wasModified) {
        wasModified = true
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      const nestedResult = await sanitizeFormData(value as Record<string, unknown>, fieldConfigs, context)
      sanitized[fieldName] = nestedResult.sanitized
      
      if (Object.keys(nestedResult.threats).length > 0) {
        threats[fieldName] = Object.values(nestedResult.threats).flat()
      }
      
      if (nestedResult.wasModified) {
        wasModified = true
      }
    } else {
      // Non-string values passed through
      sanitized[fieldName] = value
    }
  }
  
  return {
    sanitized,
    threats,
    wasModified
  }
}

/**
 * Validate specific field types
 */
export function validateField(
  value: string,
  type: 'email' | 'url' | 'phone' | 'text'
): { isValid: boolean; error?: string } {
  switch (type) {
    case 'email':
      return {
        isValid: validateEmail(value),
        error: validateEmail(value) ? undefined : 'Invalid email format'
      }
    
    case 'url':
      return {
        isValid: validateUrl(value),
        error: validateUrl(value) ? undefined : 'Invalid URL format'
      }
    
    case 'phone':
      return {
        isValid: validatePhone(value),
        error: validatePhone(value) ? undefined : 'Invalid phone number format'
      }
    
    case 'text':
      return { isValid: true }
    
    default:
      return { isValid: true }
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path components
  let sanitized = fileName.replace(/^.*[\\\/]/, '')
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f\x7f-\x9f]/g, '_')
  
  // Remove multiple dots (except before extension)
  sanitized = sanitized.replace(/\.{2,}/g, '.')
  
  // Remove leading/trailing spaces and dots
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '')
  
  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'unnamed_file'
  }
  
  // Ensure reasonable length
  if (sanitized.length > 200) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'))
    const name = sanitized.substring(0, sanitized.lastIndexOf('.'))
    sanitized = name.substring(0, 200 - ext.length) + ext
  }
  
  return sanitized
}