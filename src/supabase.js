import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const configured = supabaseUrl && supabaseUrl !== 'your_supabase_url_here'

export const supabase = configured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isConfigured = configured
