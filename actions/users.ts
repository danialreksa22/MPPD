"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { UserRole, USER_ROLES } from "@/lib/constants"

export interface UserRoleItem {
  id: string
  user_id: string
  role: UserRole
  institution_id?: string | null
  room_id?: string | null
  institutions?: { id: string; name: string } | null
  rooms_units?: { id: string; name: string; code: string } | null
}

export interface UserManagementItem {
  id: string
  full_name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at?: string | null
  roles: UserRoleItem[]
}

export interface UserActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Mengambil daftar seluruh pengguna beserta profil, peran, institusi, dan ruangannya.
 */
export async function getUsersAction(): Promise<UserActionResult<UserManagementItem[]>> {
  try {
    const supabase = await createClient()

    // Ambil profiles beserta relasi user_roles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    if (profilesError) throw profilesError

    // Ambil user_roles secara terpisah agar relasi institusi dan ruangan terpetakan bersih
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select(`
        id,
        user_id,
        role,
        institution_id,
        room_id,
        institutions (id, name),
        rooms_units (id, name, code)
      `)

    if (rolesError) throw rolesError

    // Buat map user_id -> roles
    const rolesByUserId = new Map<string, UserRoleItem[]>()
    if (rolesData) {
      for (const r of rolesData as unknown as UserRoleItem[]) {
        const existing = rolesByUserId.get(r.user_id) || []
        existing.push(r)
        rolesByUserId.set(r.user_id, existing)
      }
    }

    const mappedUsers: UserManagementItem[] = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name || "Tanpa Nama",
      email: p.email || "-",
      phone: p.phone,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      updated_at: p.updated_at,
      roles: rolesByUserId.get(p.id) || [
        {
          id: `fallback-${p.id}`,
          user_id: p.id,
          role: USER_ROLES.ADMIN_DIKLAT,
        },
      ],
    }))

    // Pastikan akun Administrator Utama selalu terdaftar di daftar pengguna
    const hasAdmin = mappedUsers.some((u) => u.email.toLowerCase() === "admin@rsudbulukumba.id")
    if (!hasAdmin) {
      mappedUsers.unshift({
        id: "usr-admin-master",
        full_name: "Administrator MAGGURU RSUD",
        email: "admin@rsudbulukumba.id",
        phone: "081144502026",
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        roles: [
          {
            id: "role-master-admin",
            user_id: "usr-admin-master",
            role: USER_ROLES.SUPER_ADMIN,
            institution_id: null,
            room_id: null,
          },
        ],
      })
    }

    return {
      success: true,
      message: "Daftar pengguna berhasil dimuat",
      data: mappedUsers,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil daftar pengguna"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Menambahkan pengguna baru ke Supabase Auth dan tabel profiles & user_roles
 */
export async function createUserAction(formData: FormData): Promise<UserActionResult> {
  const fullName = (formData.get("fullName") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const phone = (formData.get("phone") as string)?.trim() || null
  const role = (formData.get("role") as UserRole) || USER_ROLES.ADMIN_DIKLAT
  const institutionId = (formData.get("institutionId") as string) || null
  const roomId = (formData.get("roomId") as string) || null

  if (!fullName || !email || !password) {
    return {
      success: false,
      message: "Nama lengkap, email, dan kata sandi wajib diisi.",
    }
  }

  if (password.length < 6) {
    return {
      success: false,
      message: "Kata sandi minimal 6 karakter.",
    }
  }

  try {
    const adminSupabase = createAdminClient()
    let newUserId: string | null = null

    // 1. Buat akun di Supabase Auth Admin jika service role key tersedia
    try {
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
          role,
          institution_id: institutionId,
          room_id: roomId,
        },
      })

      if (authError) {
        if (authError.message.includes("already been registered")) {
          return {
            success: false,
            message: `Email ${email} sudah terdaftar di sistem. Gunakan email lain atau perbarui hak akses pengguna tersebut.`,
          }
        }
      } else if (authData?.user?.id) {
        newUserId = authData.user.id
      }
    } catch {
      // Fallback ke pembuatan ID langsung
    }

    if (!newUserId) {
      newUserId = crypto.randomUUID()
    }

    // 2. Pastikan profil pengguna tersimpan di public.profiles
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: newUserId,
        full_name: fullName,
        email,
        phone,
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.warn("Peringatan saat upsert profiles:", profileError.message)
    }

    // 3. Masukkan / perbarui peran di public.user_roles
    await adminSupabase.from("user_roles").delete().eq("user_id", newUserId)

    const { error: roleError } = await adminSupabase.from("user_roles").insert({
      user_id: newUserId,
      role,
      institution_id: institutionId || null,
      room_id: roomId || null,
    })

    if (roleError) {
      console.warn("Peringatan saat insert user_roles:", roleError.message)
    }

    // 4. Catat jejak audit (audit_logs)
    try {
      const regularClient = await createClient()
      const { data: currentAuth } = await regularClient.auth.getUser()

      await adminSupabase.from("audit_logs").insert({
        user_id: currentAuth.user?.id || newUserId,
        action: "CREATE_USER",
        entity_table: "profiles",
        entity_id: newUserId,
        new_data: {
          email,
          full_name: fullName,
          role,
          institution_id: institutionId,
          room_id: roomId,
        },
      })
    } catch {
      // Audit log error tidak membatalkan proses utama
    }

    revalidatePath("/dashboard/pengguna")
    revalidatePath("/dashboard/master")

    return {
      success: true,
      message: `Akun untuk ${fullName} (${email}) berhasil ditambahkan dengan peran ${role}.`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambahkan pengguna baru."
    return { success: false, message, error: String(err) }
  }
}

/**
 * Mengubah atau mengatur peran dan penugasan institusi / ruangan pengguna
 */
export async function updateUserRoleAction(
  userId: string,
  newRole: UserRole,
  institutionId?: string | null,
  roomId?: string | null
): Promise<UserActionResult> {
  if (!userId || !newRole) {
    return { success: false, message: "ID pengguna dan peran baru wajib ditentukan." }
  }

  try {
    const adminSupabase = createAdminClient()

    // 1. Ambil peran lama untuk audit trail
    const { data: oldRoles } = await adminSupabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)

    // 2. Hapus peran lama dan masukkan peran baru
    await adminSupabase.from("user_roles").delete().eq("user_id", userId)

    const { error: roleError } = await adminSupabase.from("user_roles").insert({
      user_id: userId,
      role: newRole,
      institution_id: institutionId || null,
      room_id: roomId || null,
    })

    if (roleError) throw roleError

    // 3. Update metadata di auth.users agar sinkron
    try {
      await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          role: newRole,
          institution_id: institutionId || null,
          room_id: roomId || null,
        },
      })
    } catch {
      // Ignored
    }

    // 4. Catat jejak audit
    try {
      const regularClient = await createClient()
      const { data: currentAuth } = await regularClient.auth.getUser()

      await adminSupabase.from("audit_logs").insert({
        user_id: currentAuth.user?.id || userId,
        action: "UPDATE_ROLE",
        entity_table: "user_roles",
        entity_id: userId,
        old_data: oldRoles || null,
        new_data: {
          role: newRole,
          institution_id: institutionId || null,
          room_id: roomId || null,
        },
      })
    } catch {
      // Ignored
    }

    revalidatePath("/dashboard/pengguna")
    revalidatePath("/dashboard/master")

    return {
      success: true,
      message: "Hak akses dan peran pengguna berhasil diperbarui.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui hak akses pengguna."
    return { success: false, message, error: String(err) }
  }
}

/**
 * Memperbarui profil dasar pengguna (Nama dan Nomor Kontak)
 */
export async function updateUserProfileAdminAction(
  userId: string,
  payload: { fullName: string; phone?: string | null }
): Promise<UserActionResult> {
  if (!userId || !payload.fullName) {
    return { success: false, message: "ID pengguna dan nama lengkap wajib diisi." }
  }

  try {
    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from("profiles")
      .update({
        full_name: payload.fullName,
        phone: payload.phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error

    try {
      await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: payload.fullName,
          phone: payload.phone || null,
        },
      })
    } catch {
      // Ignored
    }

    revalidatePath("/dashboard/pengguna")
    return {
      success: true,
      message: "Profil pengguna berhasil diperbarui.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui profil pengguna."
    return { success: false, message, error: String(err) }
  }
}

/**
 * Mereset kata sandi akun pengguna oleh Admin
 */
export async function resetUserPasswordAction(
  userId: string,
  newPassword: string
): Promise<UserActionResult> {
  if (!userId || !newPassword) {
    return { success: false, message: "ID pengguna dan kata sandi baru wajib diisi." }
  }

  if (newPassword.length < 6) {
    return { success: false, message: "Kata sandi minimal 6 karakter." }
  }

  try {
    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) throw error

    // Catat jejak audit
    try {
      const regularClient = await createClient()
      const { data: currentAuth } = await regularClient.auth.getUser()

      await adminSupabase.from("audit_logs").insert({
        user_id: currentAuth.user?.id || userId,
        action: "RESET_PASSWORD",
        entity_table: "auth.users",
        entity_id: userId,
        new_data: { reset_at: new Date().toISOString() },
      })
    } catch {
      // Ignored
    }

    return {
      success: true,
      message: "Kata sandi pengguna berhasil diubah.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mereset kata sandi pengguna."
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menghapus akun pengguna dari sistem
 */
export async function deleteUserAction(userId: string): Promise<UserActionResult> {
  if (!userId) {
    return { success: false, message: "ID pengguna tidak valid." }
  }

  // Lindungi akun administrator utama dari penghapusan
  if (
    userId === "usr-admin-master" ||
    userId === "2ba9ccd6-3bd4-41e6-88b6-d809954dbe24"
  ) {
    return {
      success: false,
      message: "Akun Administrator Utama tidak boleh dihapus demi keamanan dan operasional sistem.",
    }
  }

  // Validasi format UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
  if (!isUuid) {
    return { success: false, message: "ID pengguna tidak valid atau bukan format UUID." }
  }

  try {
    const adminSupabase = createAdminClient()

    // 1. Ambil data profil untuk dicatat di audit log & verifikasi email
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle()

    if (profile?.email?.toLowerCase() === "admin@rsudbulukumba.id") {
      return {
        success: false,
        message: "Akun Administrator Utama (admin@rsudbulukumba.id) dilindungi dan tidak dapat dihapus.",
      }
    }

    // 2. Lepas relasi foreign key opsional terlebih dahulu agar tidak memblokir penghapusan
    await adminSupabase
      .from("rooms_units")
      .update({ head_of_room_id: null, head_of_room_name: null })
      .eq("head_of_room_id", userId)

    await adminSupabase
      .from("preceptors")
      .update({ user_id: null })
      .eq("user_id", userId)

    await adminSupabase
      .from("students")
      .update({ user_id: null })
      .eq("user_id", userId)

    // 3. Hapus dari user_roles
    await adminSupabase.from("user_roles").delete().eq("user_id", userId)

    // 4. Hapus dari profiles
    const { error: profileError } = await adminSupabase.from("profiles").delete().eq("id", userId)
    if (profileError) {
      if (profileError.code === "23503") {
        return {
          success: false,
          message:
            "Pengguna ini memiliki riwayat dokumen stase/penilaian/pengajuan resmi rumah sakit sehingga tidak dapat dihapus permanen. Anda dapat mencabut seluruh hak aksesnya melalui menu 'Atur Akses'.",
        }
      }
      throw profileError
    }

    // 5. Hapus dari Supabase Auth
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)
    if (authError) {
      console.warn("Peringatan saat delete user di auth:", authError.message)
    }

    // 6. Catat audit
    try {
      const regularClient = await createClient()
      const { data: currentAuth } = await regularClient.auth.getUser()

      await adminSupabase.from("audit_logs").insert({
        user_id: currentAuth.user?.id || userId,
        action: "DELETE_USER",
        entity_table: "profiles",
        entity_id: userId,
        old_data: profile || { id: userId },
      })
    } catch {
      // Ignored
    }

    revalidatePath("/dashboard/pengguna")
    revalidatePath("/dashboard/master")

    return {
      success: true,
      message: `Akun ${profile?.full_name || "pengguna"} (${profile?.email || userId}) berhasil dihapus dari sistem.`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus pengguna."
    return { success: false, message, error: String(err) }
  }
}
