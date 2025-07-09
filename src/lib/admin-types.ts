// lib/admin-types.ts

// User and Authentication Types
export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor'
  lastLogin?: string
  created_at?: string
  email_confirmed_at?: string
}

export interface JWTPayload {
  email: string
  name: string
  role: string
  iat: number
  exp: number
}

export interface TwoFactorCode {
  email: string
  code: string
  expiresAt: number
  attempts: number
  createdAt: number
}

export interface LoginAttempt {
  count: number
  lastAttempt: number
  ip?: string
}

export interface AuthResponse {
  success: boolean
  user?: AdminUser
  token?: string
  error?: string
  requires2FA?: boolean
}

// Content Management Types
export interface ContentSection {
  id: string
  title: string
  content: string
  type: 'text' | 'html' | 'number' | 'date'
  category: 'hero' | 'settlement' | 'contact' | 'footer' | 'general'
  placeholder?: string
  required?: boolean
  maxLength?: number
  validation?: string
}

export interface ContentData {
  sections: ContentSection[]
  lastUpdated: string
  updatedBy: string
  version: string
  backup?: ContentSection[]
}

// FAQ Management Types
export interface FAQ {
  id: number
  question: string
  answer: string
  category: string
  isVisible: boolean
  order: number
  lastModified: string
  modifiedBy: string
  tags?: string[]
  featured?: boolean
}

export interface FAQData {
  faqs: FAQ[]
  categories: string[]
  lastUpdated: string
  updatedBy: string
  version: string
  totalVisible?: number
  totalHidden?: number
}

export interface FAQCategory {
  name: string
  description?: string
  count: number
  isVisible: boolean
}

// Important Dates Types
export interface ImportantDate {
  id: string
  title: string
  date: string
  time?: string
  description: string
  type: 'deadline' | 'event' | 'milestone' | 'announcement'
  isUrgent: boolean
  isVisible: boolean
  location?: string
  reminderDays?: number[]
  createdBy?: string
  lastModified?: string
}

export interface DateData {
  dates: ImportantDate[]
  lastUpdated: string
  updatedBy: string
  version: string
}

export type DateStatus = 'passed' | 'today' | 'upcoming' | 'future'

// Claims Management Types
export interface ClaimsSettings {
  isEnabled: boolean
  lastToggled: string
  toggledBy: string
  maintenanceMessage?: string
  scheduledToggle?: ScheduledToggle
  autoToggleRules?: AutoToggleRule[]
  maxClaimsPerDay?: number
  notificationEmails?: string[]
}

export interface ScheduledToggle {
  date: string
  time: string
  action: 'enable' | 'disable'
  scheduledBy: string
  reason?: string
  executed?: boolean
  executedAt?: string
}

export interface AutoToggleRule {
  id: string
  condition: 'date_reached' | 'claims_limit' | 'manual'
  value: string | number
  action: 'enable' | 'disable'
  isActive: boolean
}

// Activity and Logging Types
export interface ActivityLog {
  id: string
  type: 'claim' | 'content' | 'system' | 'login' | 'toggle' | 'faq' | 'date' | 'user' | 'security'
  message: string
  timestamp: string
  user?: string
  ip?: string
  userAgent?: string
  details?: Record<string, unknown>
  severity?: 'info' | 'warning' | 'error' | 'critical'
}

export interface SecurityEvent {
  id: string
  type: 'failed_login' | 'successful_login' | 'account_locked' | 'suspicious_activity' | 'unauthorized_access'
  email?: string
  ip?: string
  userAgent?: string
  timestamp: string
  details?: Record<string, unknown>
  resolved?: boolean
}

// Dashboard and Statistics Types
export interface DashboardStats {
  totalClaims: number
  claimsToday: number
  claimsThisWeek: number
  claimsThisMonth: number
  claimsEnabled: boolean
  lastToggle: string
  pendingReviews: number
  contentSections: number
  lastContentUpdate: string
  nextDeadline: string
  daysUntilDeadline: number
  systemHealth: 'healthy' | 'warning' | 'error'
  lastBackup?: string
}

export interface ClaimStatistics {
  total: number
  approved: number
  pending: number
  rejected: number
  todayCount: number
  weekCount: number
  monthCount: number
  averagePerDay: number
  peakDay: { date: string; count: number }
}

export interface ContentStatistics {
  totalSections: number
  requiredComplete: number
  htmlSections: number
  categories: number
  lastUpdate: string
  updatedBy: string
}

// System and Settings Types
export interface SystemSettings {
  claimsSettings: ClaimsSettings
  security: SecuritySettings
  notifications: NotificationSettings
  backup: BackupSettings
  ui: UISettings
  features: FeatureFlags
  maintenance: MaintenanceSettings
  analytics: AnalyticsSettings
  permissions: PermissionSettings
  systemInfo: SystemInfo
}

export interface SecuritySettings {
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
  require2FA: boolean
  codeExpiryMinutes: number
  allowedIPs: string[]
  logFailedAttempts: boolean
  passwordPolicy: PasswordPolicy
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxAge: number
}

export interface NotificationSettings {
  emailOnClaimSubmission: boolean
  emailOnToggle: boolean
  emailOnLogin: boolean
  emailOnSecurityEvent: boolean
  adminEmail: string
  dailyReports: boolean
  weeklyReports: boolean
  monthlyReports: boolean
}

export interface BackupSettings {
  autoBackup: boolean
  backupFrequency: 'hourly' | 'daily' | 'weekly'
  retentionDays: number
  lastBackup: string
  backupLocation: string
  encryptBackups: boolean
}

export interface UISettings {
  theme: 'light' | 'dark' | 'auto'
  compactMode: boolean
  showPreview: boolean
  defaultDashboardView: 'overview' | 'detailed'
  itemsPerPage: number
  language: string
  timezone: string
}

export interface FeatureFlags {
  enableScheduling: boolean
  enableBulkOperations: boolean
  enableContentPreview: boolean
  enableActivityLog: boolean
  enableExport: boolean
  enableAdvancedAnalytics: boolean
  enableAPIAccess: boolean
}

export interface MaintenanceSettings {
  lastSystemCheck: string
  nextScheduledMaintenance: string
  maintenanceWindow: string
  systemHealth: SystemHealth
  autoUpdates: boolean
  maintenanceMode: boolean
}

export interface SystemHealth {
  database: 'healthy' | 'warning' | 'error'
  email: 'healthy' | 'warning' | 'error'
  storage: 'healthy' | 'warning' | 'error'
  api: 'healthy' | 'warning' | 'error'
  overall: 'healthy' | 'warning' | 'error'
}

export interface AnalyticsSettings {
  trackUserActivity: boolean
  trackContentChanges: boolean
  trackSystemEvents: boolean
  retentionDays: number
  anonymizeData: boolean
  shareUsageStats: boolean
}

export interface PermissionSettings {
  owner: RolePermissions
  admin: RolePermissions
  editor: RolePermissions
}

export interface RolePermissions {
  canManageUsers: boolean
  canToggleClaims: boolean
  canEditContent: boolean
  canManageFAQs: boolean
  canManageDates: boolean
  canViewAnalytics: boolean
  canChangeSettings: boolean
  canExportData: boolean
  canViewLogs: boolean
  canManageBackups: boolean
}

export interface SystemInfo {
  version: string
  environment: 'development' | 'staging' | 'production'
  deployedAt: string
  lastUpdated: string
  updatedBy: string
  nodeVersion?: string
  platform?: string
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'warning' | 'error'
  checks: HealthCheckItem[]
  timestamp: string
  uptime: number
}

export interface HealthCheckItem {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  responseTime?: number
  details?: Record<string, unknown>
}

// Export and Import Types
export interface ExportData {
  content: ContentData
  faqs: FAQData
  dates: DateData
  claimsSettings: ClaimsSettings
  activities: ActivityLog[]
  settings: SystemSettings
  exportedAt: string
  exportedBy: string
  version: string
}

export interface ImportResult {
  success: boolean
  imported: {
    content: boolean
    faqs: boolean
    dates: boolean
    settings: boolean
    activities: boolean
  }
  errors: string[]
  warnings: string[]
}

// Utility Types
export type UserRole = 'owner' | 'admin' | 'editor'
export type ContentType = 'text' | 'html' | 'number' | 'date'
export type ContentCategory = 'hero' | 'settlement' | 'contact' | 'footer' | 'general'
export type DateType = 'deadline' | 'event' | 'milestone' | 'announcement'
export type ActivityType = 'claim' | 'content' | 'system' | 'login' | 'toggle' | 'faq' | 'date' | 'user' | 'security'
export type SystemStatus = 'healthy' | 'warning' | 'error'
export type LogLevel = 'info' | 'warning' | 'error' | 'critical'

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface TwoFactorFormData {
  code: string
}

export interface ContentFormData {
  sections: ContentSection[]
}

export interface FAQFormData {
  question: string
  answer: string
  category: string
  isVisible: boolean
}

export interface DateFormData {
  title: string
  date: string
  time?: string
  description: string
  type: DateType
  isUrgent: boolean
  isVisible: boolean
}

// Component Props Types
export interface AdminLayoutProps {
  children: React.ReactNode
  user: AdminUser
}

export interface DashboardProps {
  userRole: UserRole
  userName: string
}

export interface ContentEditorProps {
  userRole: UserRole
  userName: string
}

export interface ClaimsToggleProps {
  userRole: UserRole
  userName: string
}

export interface FAQManagerProps {
  userRole: UserRole
  userName: string
}

export interface DateManagerProps {
  userRole: UserRole
  userName: string
}

export interface LoginFormProps {
  onLogin: (user: AdminUser) => void
}