import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { UserRole, USER_ROLES } from "@/lib/constants"

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: UserRole
  institutionId?: string | null
  roomId?: string | null
  isMasterAdmin?: boolean
}

/**
 * Mendapatkan identitas dan hak akses pengguna yang sedang aktif.
 * Mengutamakan sesi Supabase Auth riil dan memverifikasi tabel `public.user_roles`
 * menggunakan client admin (bypass RLS) agar peran pengguna akurat.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()
  const authCookieRaw =
    cookieStore.get("magguru_auth_session")?.value ||
    cookieStore.get("magguru_demo_session")?.value

  let sessionUser: CurrentUser | null = null
  if (authCookieRaw) {
    try {
      sessionUser = JSON.parse(authCookieRaw)
    } catch {
      // Abaikan jika cookie rusak
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isPlaceholder = !supabaseUrl || supabaseUrl.includes("placeholder")

  // Jika lingkungan masih simulasi offline tanpa koneksi Supabase
  if (isPlaceholder) {
    return (
      sessionUser || {
        id: "usr-admin-master",
        name: "Administrator MAGGURU RSUD",
        email: "admin@rsudbulukumba.id",
        role: USER_ROLES.SUPER_ADMIN,
        isMasterAdmin: true,
      }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (authUser) {
      let adminDb: ReturnType<typeof createAdminClient> | null = null
      try {
        adminDb = createAdminClient()
      } catch {
        // Abaikan jika service role belum ada
      }

      let profileData = null
      let roleData = null

      if (adminDb) {
        const [pRes, rRes] = await Promise.all([
          adminDb
            .from("profiles")
            .select("full_name, email, phone")
            .eq("id", authUser.id)
            .maybeSingle(),
          adminDb
            .from("user_roles")
            .select("role, institution_id, room_id")
            .eq("user_id", authUser.id)
            .maybeSingle(),
        ])
        profileData = pRes.data
        roleData = rRes.data
      } else {
        const [pRes, rRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, email, phone")
            .eq("id", authUser.id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role, institution_id, room_id")
            .eq("user_id", authUser.id)
            .maybeSingle(),
        ])
        profileData = pRes.data
        roleData = rRes.data
      }

      const email = authUser.email || profileData?.email || "pengguna@rsudbulukumba.id"
      const normalizedEmail = email.toLowerCase().trim()
      const isMasterEmail =
        normalizedEmail === "admin@rsudbulukumba.id" ||
        normalizedEmail === "superadmin@rsudbulukumba.id"

      let resolvedRole: UserRole = USER_ROLES.MAHASISWA
      if (isMasterEmail) {
        resolvedRole = USER_ROLES.SUPER_ADMIN
      } else if (roleData?.role) {
        resolvedRole = roleData.role as UserRole
      } else if (authUser.user_metadata?.role) {
        resolvedRole = authUser.user_metadata.role as UserRole
      } else if (sessionUser?.role && sessionUser.email?.toLowerCase() === normalizedEmail) {
        resolvedRole = sessionUser.role
      }

      return {
        id: authUser.id,
        name:
          profileData?.full_name ||
          authUser.user_metadata?.full_name ||
          sessionUser?.name ||
          email.split("@")[0],
        email,
        role: resolvedRole,
        institutionId: roleData?.institution_id || null,
        roomId: roleData?.room_id || null,
        isMasterAdmin: resolvedRole === USER_ROLES.SUPER_ADMIN,
      }
    }
  } catch (err) {
    console.error("Gagal memeriksa sesi pengguna:", err)
  }

  // Jika tidak ada Supabase auth user, gunakan cookie sesi jika tersedia
  return sessionUser
}
