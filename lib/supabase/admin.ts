import { createClient } from "@supabase/supabase-js"

/**
 * Client Supabase dengan Service Role Key untuk operasi administratif
 * (hanya boleh dijalankan di server-side yang terisolasi, seperti Edge Functions / Webhook).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    )
  }

  // Polyfill WebSocket di lingkungan server/testing Node.js jika belum ada
  if (typeof globalThis.WebSocket === "undefined") {
    // @ts-expect-error Mock class untuk mencegah realtime websocket init crash di server runtime
    globalThis.WebSocket = class DummyWebSocket {}
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
