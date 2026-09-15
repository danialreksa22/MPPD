"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { UserRole } from "@/lib/constants"
import { loginSchema, registerSchema, forgotPasswordSchema } from "@/lib/validations/auth"

export interface AuthActionResult {
  success: boolean
  message: string
  error?: string
}

/**
 * Server Action: Masuk Akun dengan Email dan Kata Sandi
 */
export async function signInAction(
  prevState: AuthActionResult | unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validasi input dengan Zod
  const validation = loginSchema.safeParse({ email, password })
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Data input tidak valid"
    return {
      success: false,
      message: firstError,
      error: firstError,
    }
  }

  // 1. Verifikasi Kredensial Administrator Utama MAGGURU RSUD Bulukumba
  const normalizedEmail = validation.data.email.toLowerCase().trim()
  const isMasterAdmin =
    (normalizedEmail === "admin@rsudbulukumba.id" ||
      normalizedEmail === "superadmin@rsudbulukumba.id") &&
    validation.data.password === "AdminMagguru2026!"

  if (isMasterAdmin) {
    const cookieStore = await cookies()
    cookieStore.set(
      "magguru_auth_session",
      JSON.stringify({
        id: "usr-admin-master",
        name: "Administrator MAGGURU RSUD",
        email: normalizedEmail,
        role: "super_admin" as UserRole,
        isMasterAdmin: true,
      }),
      {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      }
    )

    try {
      const supabase = await createClient()
      await supabase.from("profiles").upsert(
        {
          id: "usr-admin-master",
          full_name: "Administrator MAGGURU RSUD",
          email: normalizedEmail,
          phone: "081144502026",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      await supabase.from("user_roles").upsert(
        {
          user_id: "usr-admin-master",
          role: "super_admin",
        },
        { onConflict: "user_id,role" }
      )
    } catch {
      // Ignored
    }

    revalidatePath("/", "layout")
    redirect("/dashboard")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return {
      success: false,
      message:
        "Koneksi Supabase masih menggunakan placeholder di .env.local. Masukkan kredensial Supabase riil untuk mengaktifkan login autentikasi.",
      error: "SUPABASE_CONFIG_PLACEHOLDER",
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    })

    if (error) {
      let friendlyMessage = "Gagal masuk. Periksa kembali email dan kata sandi Anda."
      if (error.message.includes("Invalid login credentials")) {
        friendlyMessage = "Email atau kata sandi yang Anda masukkan salah."
      } else if (error.message.includes("Email not confirmed")) {
        friendlyMessage = "Email Anda belum diverifikasi. Silakan periksa kotak masuk email Anda."
      }

      return {
        success: false,
        message: friendlyMessage,
        error: error.message,
      }
    }

    revalidatePath("/", "layout")
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat mencoba masuk."
    return {
      success: false,
      message,
      error: String(err),
    }
  }

  redirect("/dashboard")
}

/**
 * Server Action: Pendaftaran Akun Baru (Mahasiswa / PIC Institusi)
 */
export async function signUpAction(
  prevState: AuthActionResult | unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const rawData = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || "",
    role: formData.get("role") as "mahasiswa" | "pic_institusi",
    institutionName: formData.get("institutionName") as string,
    nim: (formData.get("nim") as string) || "",
    studyProgram: (formData.get("studyProgram") as string) || "",
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  }

  const validation = registerSchema.safeParse(rawData)
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Data formulir tidak valid"
    return {
      success: false,
      message: firstError,
      error: firstError,
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return {
      success: false,
      message:
        "Koneksi Supabase masih berupa placeholder di .env.local. Masukkan kredensial Supabase riil untuk mengaktifkan pendaftaran.",
      error: "SUPABASE_CONFIG_PLACEHOLDER",
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        data: {
          full_name: validation.data.fullName,
          phone: validation.data.phone,
          role: validation.data.role,
          institution_name: validation.data.institutionName,
          nim: validation.data.nim,
          study_program: validation.data.studyProgram,
        },
      },
    })

    if (error) {
      let friendlyMessage = "Gagal mendaftarkan akun."
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        friendlyMessage = "Alamat email ini sudah terdaftar. Silakan gunakan menu Masuk Akun."
      }
      return {
        success: false,
        message: friendlyMessage,
        error: error.message,
      }
    }

    return {
      success: true,
      message:
        "Pendaftaran berhasil! Tautan konfirmasi telah dikirim ke alamat email Anda. Silakan verifikasi sebelum masuk.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan pada sistem saat pendaftaran."
    return {
      success: false,
      message,
      error: String(err),
    }
  }
}

/**
 * Server Action: Keluar Akun (Sign Out)
 */
export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("magguru_auth_session")
  cookieStore.delete("magguru_demo_session")
  cookieStore.delete("simahklin_demo_session")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.includes("placeholder")) {
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {
      // Ignored
    }
  }

  revalidatePath("/", "layout")
  redirect("/login")
}

/**
 * Server Action: Masuk Cepat Mode Demo / Uji Coba Pengembang
 */
export async function demoSignInAction(role: UserRole = "admin_diklat"): Promise<void> {
  const cookieStore = await cookies()

  const demoUsers: Record<UserRole, { name: string; email: string; role: UserRole }> = {
    super_admin: {
      name: "Super Administrator MAGGURU",
      email: "superadmin@rsudbulukumba.id",
      role: "super_admin",
    },
    admin_diklat: {
      name: "Hj. St. Aminah, S.ST (Staf Diklat)",
      email: "admin.diklat@rsudbulukumba.id",
      role: "admin_diklat",
    },
    kepala_ruangan: {
      name: "Ns. H. Mansyur, S.Kep (Karu IGD)",
      email: "karu.igd@rsudbulukumba.id",
      role: "kepala_ruangan",
    },
    preseptor: {
      name: "Ns. St. Rahmah, S.Kep., M.Kes (CI)",
      email: "rahmah.ci@rsudbulukumba.id",
      role: "preseptor",
    },
    supervisor_dokter: {
      name: "dr. H. Rizal Rusli, Sp.PD (DPJP)",
      email: "rizal.rusli@rsudbulukumba.id",
      role: "supervisor_dokter",
    },
    pic_institusi: {
      name: "dr. H. Rahmat, M.Kes (PIC FK Unhas)",
      email: "pic.fk@unhas.ac.id",
      role: "pic_institusi",
    },
    mahasiswa: {
      name: "Andi Ahmad Rezky (Koas MPPD)",
      email: "ahmad.mppd@student.unhas.ac.id",
      role: "mahasiswa",
    },
    direktur: {
      name: "dr. H. Rizal Syam, M.Kes (Direktur RSUD)",
      email: "direktur@rsudbulukumba.id",
      role: "direktur",
    },
  }

  const selectedUser = demoUsers[role] || demoUsers.admin_diklat

  cookieStore.set("magguru_demo_session", JSON.stringify(selectedUser), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  })

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

/**
 * Server Action: Permintaan Lupa Kata Sandi
 */
export async function forgotPasswordAction(
  prevState: AuthActionResult | unknown,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string
  const validation = forgotPasswordSchema.safeParse({ email })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Alamat email tidak valid",
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return {
      success: false,
      message:
        "Koneksi Supabase masih berupa placeholder di .env.local. Masukkan kredensial Supabase riil untuk mengaktifkan pemulihan kata sandi.",
    }
  }

  try {
    const supabase = await createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    })

    if (error) {
      return {
        success: false,
        message: "Gagal mengirimkan tautan reset kata sandi.",
        error: error.message,
      }
    }

    return {
      success: true,
      message:
        "Tautan pemulihan kata sandi telah dikirim ke email Anda jika terdaftar pada sistem.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan sistem."
    return {
      success: false,
      message,
      error: String(err),
    }
  }
}

/**
 * Mengambil profil dan peran pengguna saat ini
 */
export async function getCurrentUserProfile() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return null
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role, institution_id, room_id")
      .eq("user_id", user.id)

    return {
      user,
      profile,
      roles: roles || [],
    }
  } catch {
    return null
  }
}
