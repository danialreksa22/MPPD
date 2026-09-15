import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const cookieStore = await cookies()
  const authSession =
    cookieStore.get("magguru_auth_session")?.value ||
    cookieStore.get("magguru_demo_session")?.value

  // Jika sudah memiliki sesi login aktif, langsung arahkan ke dashboard
  if (authSession) {
    redirect("/dashboard")
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect("/dashboard")
    }
  } catch {
    // Abaikan kegagalan jaringan
  }

  // Jika belum login, langsung arahkan ke halaman login portal
  redirect("/login")
}
