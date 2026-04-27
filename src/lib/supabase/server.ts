import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          return cookieStore.get(key)?.value
        },
        set(key, value, options) {
          try {
            cookieStore.set(key, value, options)
          } catch {
            // Called from Server Component – handled by middleware
          }
        },
        remove(key, options) {
          try {
            cookieStore.set(key, '', options)
          } catch {
            // Called from Server Component – handled by middleware
          }
        },
      },
    }
  )
}

// Admin client (bypasses RLS) - server-side only
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
