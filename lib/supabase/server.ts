import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Client Supabase untuk pemanggilan di Server Components, Server Actions, dan Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Dipanggil dari Server Component, abaikan jika middleware sudah me-refresh session.
        }
      },
    },
  })
}
