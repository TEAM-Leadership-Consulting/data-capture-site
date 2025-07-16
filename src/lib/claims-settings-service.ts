// lib/claims-settings-service.ts
// Production-ready database service for claims settings using Supabase

import { supabase } from './supabase'

interface ClaimsSettings {
  isEnabled: boolean
  lastToggled: string
  toggledBy: string
  maintenanceMessage: string
  scheduledToggle?: {
    date: string
    time: string
    action: 'enable' | 'disable'
    scheduledBy: string
    scheduledAt: string
  }
}

interface ActivityLogEntry {
  id: string
  activity_type: string
  action: string
  details: Record<string, unknown>
  performed_by: string
  timestamp: string
  ip_address?: string
  user_agent?: string
}

const CLAIMS_SETTINGS_KEY = 'claims_configuration'
const DEFAULT_MAINTENANCE_MESSAGE = 'Claims filing is temporarily unavailable for maintenance. Please check back later.'

/**
 * Get current claims settings from database
 */
export async function getClaimsSettings(): Promise<ClaimsSettings> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value, updated_at')
      .eq('setting_key', CLAIMS_SETTINGS_KEY)
      .single()
    
    if (error) {
      console.error('❌ Failed to fetch claims settings:', error)
      
      // Return safe defaults if database read fails
      return {
        isEnabled: true,
        lastToggled: new Date().toISOString(),
        toggledBy: 'System',
        maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE
      }
    }
    
    return data.setting_value as ClaimsSettings
    
  } catch (error) {
    console.error('❌ Error getting claims settings:', error)
    
    // Return safe defaults on any error
    return {
      isEnabled: true,
      lastToggled: new Date().toISOString(),
      toggledBy: 'System',
      maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE
    }
  }
}

/**
 * Update claims settings in database
 */
export async function updateClaimsSettings(
  updates: Partial<ClaimsSettings>,
  updatedBy: string = 'System'
): Promise<ClaimsSettings> {
  try {
    // Get current settings first
    const currentSettings = await getClaimsSettings()
    
    // Merge updates with current settings
    const newSettings: ClaimsSettings = {
      ...currentSettings,
      ...updates,
      lastToggled: new Date().toISOString()
    }
    
    // Update in database
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        setting_value: newSettings,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', CLAIMS_SETTINGS_KEY)
      .select('setting_value')
      .single()
    
    if (error) {
      console.error('❌ Failed to update claims settings:', error)
      throw error
    }
    
    console.log(`✅ Claims settings updated by ${updatedBy}:`, {
      isEnabled: newSettings.isEnabled,
      hasScheduledToggle: !!newSettings.scheduledToggle
    })
    
    // Log the activity
    await logClaimsActivity(
      newSettings.isEnabled ? 'enabled' : 'disabled',
      newSettings,
      updatedBy
    )
    
    return data.setting_value as ClaimsSettings
    
  } catch (error) {
    console.error('❌ Error updating claims settings:', error)
    throw error
  }
}

/**
 * Check and execute any scheduled toggles
 */
export async function checkAndExecuteScheduledToggle(): Promise<ClaimsSettings> {
  try {
    const settings = await getClaimsSettings()
    
    if (!settings.scheduledToggle) {
      return settings
    }
    
    const scheduledDateTime = new Date(`${settings.scheduledToggle.date}T${settings.scheduledToggle.time}`)
    const now = new Date()
    
    // If the scheduled time has passed, execute the toggle
    if (now >= scheduledDateTime) {
      console.log('⏰ Executing scheduled toggle:', settings.scheduledToggle.action)
      
      const updatedSettings = await updateClaimsSettings(
        {
          isEnabled: settings.scheduledToggle.action === 'enable',
          scheduledToggle: undefined // Clear the schedule after execution
        },
        `Scheduled by ${settings.scheduledToggle.scheduledBy}`
      )
      
      return updatedSettings
    }
    
    return settings
    
  } catch (error) {
    console.error('❌ Error checking scheduled toggle:', error)
    
    // Return current settings on error
    return await getClaimsSettings()
  }
}

/**
 * Initialize the system_settings table if it doesn't exist
 */
export async function initializeSystemSettings(): Promise<void> {
  try {
    // Check if the system_settings table exists by trying to read from it
    const { error } = await supabase
      .from('system_settings')
      .select('id')
      .limit(1)
    
    if (error?.code === '42P01') {
      // Table doesn't exist - user needs to run the migration
      console.error('❌ system_settings table does not exist. Please run the database migration first.')
      throw new Error('Database tables not initialized. Please run the migration SQL first.')
    }
    
    // Ensure claims settings record exists
    await ensureClaimsSettingsRecord()
    
  } catch (error) {
    console.error('❌ Failed to initialize system settings:', error)
    throw error
  }
}

/**
 * Ensure claims settings record exists with default values
 */
async function ensureClaimsSettingsRecord(): Promise<void> {
  try {
    const { data: existingRecord } = await supabase
      .from('system_settings')
      .select('*')
      .eq('setting_key', CLAIMS_SETTINGS_KEY)
      .single()
    
    if (!existingRecord) {
      console.log('🔧 Creating default claims settings record...')
      
      const defaultSettings: ClaimsSettings = {
        isEnabled: true,
        lastToggled: new Date().toISOString(),
        toggledBy: 'System',
        maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE
      }
      
      const { error } = await supabase
        .from('system_settings')
        .insert({
          setting_key: CLAIMS_SETTINGS_KEY,
          setting_value: defaultSettings,
          updated_by: 'System',
          version: 1
        })
      
      if (error) {
        console.error('❌ Failed to create claims settings record:', error)
        throw error
      }
      
      console.log('✅ Default claims settings record created')
    }
  } catch (error) {
    console.error('❌ Failed to ensure claims settings record:', error)
    throw error
  }
}

/**
 * Log claims-related activities for audit trail
 */
async function logClaimsActivity(
  action: 'enabled' | 'disabled' | 'scheduled',
  settings: ClaimsSettings,
  user: string
): Promise<void> {
  try {
    await supabase
      .from('system_activity_log')
      .insert({
        activity_type: 'claims_toggle',
        action,
        details: {
          isEnabled: settings.isEnabled,
          scheduledToggle: settings.scheduledToggle,
          maintenanceMessage: settings.maintenanceMessage
        },
        performed_by: user,
        timestamp: new Date().toISOString()
      })
  } catch (error) {
    // Don't throw on logging errors - just log them
    console.error('⚠️ Failed to log claims activity:', error)
  }
}

/**
 * Get claims activity history
 */
export async function getClaimsActivityHistory(limit: number = 50): Promise<ActivityLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('system_activity_log')
      .select('*')
      .eq('activity_type', 'claims_toggle')
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('❌ Failed to fetch claims activity history:', error)
      return []
    }
    
    return data || []
    
  } catch (error) {
    console.error('❌ Error getting claims activity history:', error)
    return []
  }
}