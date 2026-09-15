import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getNotificationsAction } from "@/actions/notifications"
import { UserRole } from "@/lib/constants"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const authCookieRaw =
    cookieStore.get("magguru_auth_session")?.value ||
    cookieStore.get("magguru_demo_session")?.value
  let sessionUser: { name: string; email: string; role: UserRole; isMasterAdmin?: boolean } | null = null

  if (authCookieRaw) {
    try {
      sessionUser = JSON.parse(authCookieRaw)
    } catch {
      // Ignored
    }
  }

  let user = null
  let profile = null
  let roles: { role: UserRole }[] = []

  if (!sessionUser) {
    try {
      const supabase = await createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        user = authUser
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        profile = profileData

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)

        if (roleData) {
          roles = roleData as { role: UserRole }[]
        }
      }
    } catch {
      // Fallback
    }
  }

  const userProfile = {
    name: sessionUser?.name || profile?.full_name || user?.user_metadata?.full_name || "Administrator RSUD",
    email: sessionUser?.email || profile?.email || user?.email || "admin@rsudbulukumba.id",
    role: (sessionUser?.role || roles[0]?.role || "super_admin") as UserRole,
    isDemo: false,
  }

  const notificationsRes = await getNotificationsAction()
  const unreadNotificationsCount = (notificationsRes.data || []).filter(
    (n) => n.status !== "read"
  ).length

  return (
    <DashboardShell
      userProfile={userProfile}
      unreadNotificationsCount={unreadNotificationsCount}
    >
      {children}
    </DashboardShell>
  )
}
