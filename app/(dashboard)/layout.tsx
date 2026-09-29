import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getNotificationsAction } from "@/actions/notifications"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  const userProfile = {
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
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
