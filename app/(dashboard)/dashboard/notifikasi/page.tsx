import { getNotificationsAction } from "@/actions/notifications"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { Bell, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function NotifikasiPage() {
  const notificationsRes = await getNotificationsAction()
  const initialNotifications = notificationsRes.data || []

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pusat Notifikasi &amp; Pengingat Stase
            </h1>
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px]">
              <Sparkles className="h-3 w-3" />
              Automated Triggers Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoring komunikasi dinas, otomasi email status pengajuan, reminder presensi harian, evaluasi preseptor, dan siaran pengumuman resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 text-xs gap-1.5 py-1 px-2.5">
            <Bell className="h-3.5 w-3.5 text-emerald-600" />
            Supabase Edge Functions &bull; Resend Integrated
          </Badge>
        </div>
      </div>

      {/* Main Notification Center */}
      <NotificationCenter initialNotifications={initialNotifications} />
    </div>
  )
}
