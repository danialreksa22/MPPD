import { createBrowserClient } from "@supabase/ssr"

/**
 * Client Supabase untuk pemanggilan di sisi browser (Client Components).
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
