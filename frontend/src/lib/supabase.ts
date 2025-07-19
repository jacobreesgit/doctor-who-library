/**
 * Supabase Configuration
 * 
 * Supabase client setup for authentication and database operations
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xtbtskijrehnybtgnuka.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0YnRza2lqcmVobnlidGdudWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mjg0NjYsImV4cCI6MjA2ODQwNDQ2Nn0.iZ_2qsiRx79oYTlFl_9XPQaKfQ1MYNCEBPep7F0DSE4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for user features
export interface UserFavorite {
  id: string
  user_id: string
  library_item_id: string
  created_at: string
}

export interface UserWatchHistory {
  id: string
  user_id: string
  library_item_id: string
  watched_at: string
  progress?: number // For tracking partial viewing
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: 'admin' | 'user'
  created_at: string
  updated_at: string
}