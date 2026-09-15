import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Helper untuk menyegarkan (refresh) session cookie Supabase di Next.js Middleware
 * dan menerapkan proteksi rute berbasis status autentikasi.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Jika URL masih placeholder atau belum dikonfigurasi, izinkan akses preview lokal
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Cek cookie sesi autentikasi portal MAGGURU
  const authSessionCookie =
    request.cookies.get("magguru_auth_session")?.value ||
    request.cookies.get("magguru_demo_session")?.value

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let sessionUser = null
  if (authSessionCookie) {
    try {
      const parsed = JSON.parse(authSessionCookie)
      sessionUser = { id: parsed.id || "usr-admin-master", email: parsed.email || "admin@rsudbulukumba.id" }
    } catch {
      // Ignored
    }
  }

  const user = authUser || sessionUser

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password")

  const isProtectedRoute = pathname.startsWith("/dashboard")

  // Jika pengguna belum login dan mencoba mengakses rute terproteksi (/dashboard)
  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("returnUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Jika pengguna sudah login dan mencoba mengakses halaman login/register
  if (user && isAuthRoute) {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}
