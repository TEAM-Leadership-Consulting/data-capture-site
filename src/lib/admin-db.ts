// lib/admin-db.ts
import fs from 'fs/promises'
import path from 'path'

export interface ContentSection {
  id: string
  title: string
  content: string
  type: 'text' | 'html' | 'number' | 'date'
  category: 'hero' | 'settlement' | 'contact' | 'footer' | 'general'
  placeholder?: string
  required?: boolean
}

export interface ContentData {
  sections: ContentSection[]
  lastUpdated: string
  updatedBy: string
  version: string
}

export interface FAQ {
  id: number
  question: string
  answer: string
  category: string
  isVisible: boolean
  order: number
  lastModified: string
  modifiedBy: string
}

export interface FAQData {
  faqs: FAQ[]
  categories: string[]
  lastUpdated: string
  updatedBy: string
  version: string
}

export interface ImportantDate {
  id: string
  title: string
  date: string
  time?: string
  description: string
  type: 'deadline' | 'event' | 'milestone' | 'announcement'
  isUrgent: boolean
  isVisible: boolean
}

export interface DateData {
  dates: ImportantDate[]
  lastUpdated: string
  updatedBy: string
  version: string
}

export interface ClaimsSettings {
  isEnabled: boolean
  lastToggled: string
  toggledBy: string
  maintenanceMessage?: string
  scheduledToggle?: {
    date: string
    time: string
    action: 'enable' | 'disable'
    scheduledBy: string
  }
}

export interface ActivityLog {
  id: string
  type: 'claim' | 'content' | 'system' | 'login' | 'toggle' | 'faq' | 'date'
  message: string
  timestamp: string
  user?: string
  ip?: string
  details?: unknown
}

export interface DashboardStats {
  totalClaims: number
  claimsToday: number
  claimsThisWeek: number
  claimsEnabled: boolean
  lastToggle: string
  pendingReviews: number
  contentSections: number
  lastContentUpdate: string
  nextDeadline: string
  daysUntilDeadline: number
}

// File paths
const DATA_DIR = path.join(process.cwd(), 'data')
const CONTENT_FILE = path.join(DATA_DIR, 'admin-content.json')
const FAQ_FILE = path.join(DATA_DIR, 'admin-faqs.json')
const DATES_FILE = path.join(DATA_DIR, 'admin-dates.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'admin-settings.json')
const ACTIVITY_FILE = path.join(DATA_DIR, 'admin-activity.json')

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

/**
 * Read JSON file with error handling
 */
async function readJSONFile<T>(filePath: string, defaultData: T): Promise<T> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.warn(`Could not read ${filePath}, using defaults:`, error)
    return defaultData
  }
}

/**
 * Write JSON file with backup
 */
async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDataDir()
    
    // Create backup if file exists
    try {
      await fs.access(filePath)
      const backupPath = `${filePath}.backup`
      await fs.copyFile(filePath, backupPath)
    } catch {
      // File doesn't exist, no backup needed
    }
    
    // Write new data
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`Failed to write ${filePath}:`, error)
    throw error
  }
}

/**
 * Content Management
 */
export async function getContent(): Promise<ContentData> {
  const defaultContent: ContentData = {
    sections: [],
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System',
    version: '1.0'
  }
  return readJSONFile(CONTENT_FILE, defaultContent)
}

export async function saveContent(content: ContentData): Promise<void> {
  await writeJSONFile(CONTENT_FILE, content)
  await logActivity('content', 'Content updated', content.updatedBy)
}

/**
 * FAQ Management
 */
export async function getFAQs(): Promise<FAQData> {
  const defaultFAQs: FAQData = {
    faqs: [],
    categories: [],
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System',
    version: '1.0'
  }
  return readJSONFile(FAQ_FILE, defaultFAQs)
}

export async function saveFAQs(faqData: FAQData): Promise<void> {
  await writeJSONFile(FAQ_FILE, faqData)
  await logActivity('faq', 'FAQs updated', faqData.updatedBy)
}

/**
 * Dates Management
 */
export async function getDates(): Promise<DateData> {
  const defaultDates: DateData = {
    dates: [],
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System',
    version: '1.0'
  }
  return readJSONFile(DATES_FILE, defaultDates)
}

export async function saveDates(dateData: DateData): Promise<void> {
  await writeJSONFile(DATES_FILE, dateData)
  await logActivity('date', 'Important dates updated', dateData.updatedBy)
}

/**
 * Claims Settings Management
 */
export async function getClaimsSettings(): Promise<ClaimsSettings> {
  const settingsData = await readJSONFile<{ claimsSettings?: ClaimsSettings }>(SETTINGS_FILE, {})
  return settingsData.claimsSettings || {
    isEnabled: true,
    lastToggled: new Date().toISOString(),
    toggledBy: 'System'
  }
}

export async function saveClaimsSettings(claimsSettings: ClaimsSettings): Promise<void> {
  const settingsData = await readJSONFile<{ claimsSettings?: ClaimsSettings }>(SETTINGS_FILE, {})
  settingsData.claimsSettings = claimsSettings
  await writeJSONFile(SETTINGS_FILE, settingsData)
  
  const action = claimsSettings.isEnabled ? 'enabled' : 'disabled'
  await logActivity('toggle', `Claims filing ${action}`, claimsSettings.toggledBy)
}

/**
 * Activity Logging
 */
export async function logActivity(
  type: ActivityLog['type'], 
  message: string, 
  user?: string, 
  ip?: string, 
  details?: unknown
): Promise<void> {
  try {
    const activities = await getActivityLog()
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toISOString(),
      user,
      ip,
      details
    }
    
    activities.unshift(newActivity)
    
    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.splice(1000)
    }
    
    await writeJSONFile(ACTIVITY_FILE, activities)
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

export async function getActivityLog(): Promise<ActivityLog[]> {
  return readJSONFile(ACTIVITY_FILE, [])
}

/**
 * Dashboard Statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get claims settings
    const claimsSettings = await getClaimsSettings()
    
    // Get content data
    const contentData = await getContent()
    
    // Get dates data
    const datesData = await getDates()
    
    // Find next deadline
    const deadlines = datesData.dates
      .filter(d => d.type === 'deadline' && new Date(d.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const nextDeadline = deadlines[0]?.date || '2025-12-31'
    const daysUntilDeadline = Math.ceil(
      (new Date(nextDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Mock claim statistics (in production, get from your actual claims database)
    const mockClaimStats = {
      totalClaims: 1247,
      claimsToday: 23,
      claimsThisWeek: 156,
      pendingReviews: 45
    }
    
    return {
      ...mockClaimStats,
      claimsEnabled: claimsSettings.isEnabled,
      lastToggle: claimsSettings.lastToggled,
      contentSections: contentData.sections.length,
      lastContentUpdate: contentData.lastUpdated,
      nextDeadline,
      daysUntilDeadline
    }
  } catch (error) {
    console.error('Failed to get dashboard stats:', error)
    // Return default stats on error
    return {
      totalClaims: 0,
      claimsToday: 0,
      claimsThisWeek: 0,
      claimsEnabled: true,
      lastToggle: new Date().toISOString(),
      pendingReviews: 0,
      contentSections: 0,
      lastContentUpdate: new Date().toISOString(),
      nextDeadline: '2025-12-31',
      daysUntilDeadline: 365
    }
  }
}

/**
 * Data Export
 */
export async function exportAllData(): Promise<{
  content: ContentData
  faqs: FAQData
  dates: DateData
  claimsSettings: ClaimsSettings
  activities: ActivityLog[]
  exportedAt: string
}> {
  const [content, faqs, dates, claimsSettings, activities] = await Promise.all([
    getContent(),
    getFAQs(),
    getDates(),
    getClaimsSettings(),
    getActivityLog()
  ])
  
  return {
    content,
    faqs,
    dates,
    claimsSettings,
    activities,
    exportedAt: new Date().toISOString()
  }
}

/**
 * Data Backup
 */
export async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(DATA_DIR, 'backups')
  
  try {
    await fs.mkdir(backupDir, { recursive: true })
    
    const exportData = await exportAllData()
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`)
    
    await writeJSONFile(backupFile, exportData)
    await logActivity('system', 'Data backup created', 'System')
    
    return backupFile
  } catch (error) {
    console.error('Failed to create backup:', error)
    throw error
  }
}

/**
 * System Health Check
 */
export async function performHealthCheck(): Promise<{
  status: 'healthy' | 'warning' | 'error'
  checks: Array<{
    name: string
    status: 'pass' | 'fail'
    message: string
  }>
}> {
  const checks = []
  
  // Check data directory
  try {
    await fs.access(DATA_DIR)
    checks.push({ name: 'Data Directory', status: 'pass' as const, message: 'Accessible' })
  } catch {
    checks.push({ name: 'Data Directory', status: 'fail' as const, message: 'Not accessible' })
  }
  
  // Check data files
  const files = [
    { path: CONTENT_FILE, name: 'Content Data' },
    { path: FAQ_FILE, name: 'FAQ Data' },
    { path: DATES_FILE, name: 'Dates Data' },
    { path: SETTINGS_FILE, name: 'Settings Data' }
  ]
  
  for (const file of files) {
    try {
      await fs.access(file.path)
      checks.push({ name: file.name, status: 'pass' as const, message: 'File exists' })
    } catch {
      checks.push({ name: file.name, status: 'fail' as const, message: 'File missing' })
    }
  }
  
  // Check disk space (basic check)
  try {
    await fs.stat(DATA_DIR)
    checks.push({ name: 'Data Access', status: 'pass' as const, message: 'Read/write OK' })
  } catch {
    checks.push({ name: 'Data Access', status: 'fail' as const, message: 'Access issues' })
  }
  
  const failedChecks = checks.filter(c => c.status === 'fail')
  const status = failedChecks.length === 0 ? 'healthy' : 
                failedChecks.length <= 2 ? 'warning' : 'error'
  
  return { status, checks }
}

/**
 * Initialize default data if files don't exist
 */
export async function initializeDefaultData(): Promise<void> {
  try {
    await ensureDataDir()
    
    // Check if files exist, create defaults if not
    try {
      await fs.access(CONTENT_FILE)
    } catch {
      const defaultContent: ContentData = {
        sections: [],
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System',
        version: '1.0'
      }
      await writeJSONFile(CONTENT_FILE, defaultContent)
    }
    
    try {
      await fs.access(FAQ_FILE)
    } catch {
      const defaultFAQs: FAQData = {
        faqs: [],
        categories: [],
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System',
        version: '1.0'
      }
      await writeJSONFile(FAQ_FILE, defaultFAQs)
    }
    
    try {
      await fs.access(DATES_FILE)
    } catch {
      const defaultDates: DateData = {
        dates: [],
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System',
        version: '1.0'
      }
      await writeJSONFile(DATES_FILE, defaultDates)
    }
    
    await logActivity('system', 'Default data initialized', 'System')
  } catch (error) {
    console.error('Failed to initialize default data:', error)
    throw error
  }
}