// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Claim {
  id: string
  unique_code: string
  title: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface ClaimSubmission {
  id: string
  claim_id: string
  unique_code: string
  form_data: unknown
  status: 'draft' | 'submitted'
  last_updated: string
  submitted_at?: string
}