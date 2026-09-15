"use client"

import * as React from "react"
import {
  NotificationItem,
  NotificationType,
  NOTIFICATION_TYPE_LABELS,
  NotificationFilterInput,
  ManualBroadcastInput,
} from "@/lib/validations/notifications"
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  sendManualBroadcastNotificationAction,
  triggerAutomatedRemindersAction,
} from "@/actions/notifications"
import { EmailPreviewDialog } from "./email-preview-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  RotateCcw,
  CalendarCheck,
  Stethoscope,
  Radio,
  Eye,
  Check,
} from "lucide-react"

interface NotificationCenterProps {
  initialNotifications: NotificationItem[]
}

export function NotificationCenter({
  initialNotifications,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(initialNotifications)
  const [filters, setFilters] = React.useState<NotificationFilterInput>({
    type: "all",
    status: "all",
    search: "",
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedNotification, setSelectedNotification] = React.useState<NotificationItem | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)

  // State untuk form broadcast
  const [broadcastForm, setBroadcastForm] = React.useState<ManualBroadcastInput>({
    recipient_role: "all",
    title: "",
    body: "",
    cta_url: "/dashboard",
    cta_text: "Buka Portal MAGGURU",
  })
  const [isBroadcasting, setIsBroadcasting] = React.useState(false)
  const [broadcastMessage, setBroadcastMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // State untuk pemicu otomatis
  const [isTriggeringReminders, setIsTriggeringReminders] = React.useState(false)
  const [reminderResult, setReminderResult] = React.useState<{
    success: boolean
    message: string
  } | null>(null)

  // Memuat data notifikasi dengan filter
  const refreshNotifications = async (newFilters?: Partial<NotificationFilterInput>) => {
    const activeFilters = { ...filters, ...newFilters }
    setFilters(activeFilters)
    setIsLoading(true)

    try {
      const res = await getNotificationsAction(activeFilters)
      if (res.success && res.data) {
        setNotifications(res.data)
      }
    } catch (err) {
      console.error("Gagal memperbarui notifikasi:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Tandai sudah dibaca
  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markNotificationAsReadAction(id)
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: "read", read_at: new Date().toISOString() } : n))
        )
      }
    } catch (err) {
      console.error("Gagal menandai notifikasi:", err)
    }
  }

  // Kirim Broadcast Manual
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBroadcasting(true)
    setBroadcastMessage(null)

    try {
      const res = await sendManualBroadcastNotificationAction(broadcastForm)
      if (res.success) {
        setBroadcastMessage({
          type: "success",
          text: res.message || "Siaran dinas berhasil dikirimkan!",
        })
        setBroadcastForm({
          recipient_role: "all",
          title: "",
          body: "",
          cta_url: "/dashboard",
          cta_text: "Buka Portal MAGGURU",
        })
        refreshNotifications()
      } else {
        setBroadcastMessage({ type: "error", text: res.message || "Gagal mengirim siaran" })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan"
      setBroadcastMessage({ type: "error", text: msg })
    } finally {
      setIsBroadcasting(false)
    }
  }

  // Jalankan Pemicu Pengingat Otomatis
  const handleTriggerAutomatedReminders = async () => {
    setIsTriggeringReminders(true)
    setReminderResult(null)

    try {
      const res = await triggerAutomatedRemindersAction({
        check_attendance: true,
        check_assessments: true,
        check_expiring_stase: true,
      })

      if (res.success) {
        setReminderResult({
          success: true,
          message: res.message || "Pemindaian pengingat otomatis selesai!",
        })
        refreshNotifications()
      } else {
        setReminderResult({
          success: false,
          message: res.message || "Gagal memproses pengingat otomatis",
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan"
      setReminderResult({ success: false, message: msg })
    } finally {
      setIsTriggeringReminders(false)
    }
  }

  // Stat Counter
  const totalSent = notifications.length
  const attendanceCount = notifications.filter((n) => n.type === "reminder_presensi").length
  const assessmentCount = notifications.filter((n) => n.type === "reminder_penilaian").length
  const unreadCount = notifications.filter((n) => n.status !== "read").length

  return (
    <div className="space-y-6">
      {/* 4 STAT KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Total Notifikasi</span>
              <Mail className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {totalSent}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Seluruh arsip pesan</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Pengingat Presensi</span>
              <CalendarCheck className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {attendanceCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Check-in harian</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Pengingat Evaluasi</span>
              <Stethoscope className="h-4 w-4 text-rose-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {assessmentCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Nilai stase preseptor</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Belum Dibaca</span>
              <Bell className="h-4 w-4 text-sky-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">
              {unreadCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Perlu perhatian</p>
          </CardContent>
        </Card>
      </div>

      {/* TABS UTAMA */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="history" className="text-xs font-medium gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Riwayat Notifikasi
          </TabsTrigger>
          <TabsTrigger value="triggers" className="text-xs font-medium gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Pemicu Otomatis
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="text-xs font-medium gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            Kirim Siaran
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: RIWAYAT & ANTREAN NOTIFIKASI */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-sm dark:border-slate-800">
            <CardContent className="p-4 space-y-4">
              {/* Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Cari judul, nama, atau email..."
                      value={filters.search}
                      onChange={(e) => refreshNotifications({ search: e.target.value })}
                      className="pl-8 text-xs h-8"
                    />
                  </div>

                  <Select
                    value={filters.type}
                    onValueChange={(val) =>
                      refreshNotifications({
                        type: (val as NotificationFilterInput["type"]) || "all",
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-44">
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis Pesan</SelectItem>
                      <SelectItem value="reminder_presensi">Reminder Presensi</SelectItem>
                      <SelectItem value="reminder_penilaian">Reminder Penilaian</SelectItem>
                      <SelectItem value="akhir_stase">Akhir Masa Stase</SelectItem>
                      <SelectItem value="status_pengajuan">Status Pengajuan</SelectItem>
                      <SelectItem value="surat_terbit">Penerbitan Surat</SelectItem>
                      <SelectItem value="broadcast">Siaran Dinas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.status}
                    onValueChange={(val) =>
                      refreshNotifications({
                        status: (val as NotificationFilterInput["status"]) || "all",
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-36">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="sent">Terkirim</SelectItem>
                      <SelectItem value="read">Telah Dibaca</SelectItem>
                      <SelectItem value="queued">Antrean</SelectItem>
                      <SelectItem value="failed">Gagal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshNotifications({ type: "all", status: "all", search: "" })}
                  className="h-8 text-xs text-slate-600 gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Filter
                </Button>
              </div>

              {/* Tabel Riwayat Notifikasi */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 w-8 text-center">No</th>
                      <th className="p-3">Jenis</th>
                      <th className="p-3">Subjek & Isi Pesan</th>
                      <th className="p-3">Penerima</th>
                      <th className="p-3">Waktu Kirim</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          Memuat data notifikasi...
                        </td>
                      </tr>
                    ) : notifications.length > 0 ? (
                      notifications.map((n, idx) => {
                        const typeMeta = NOTIFICATION_TYPE_LABELS[n.type as NotificationType] || {
                          label: n.type,
                          color: "bg-slate-100 text-slate-700",
                        }
                        const isRead = n.status === "read"

                        return (
                          <tr
                            key={n.id}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors ${
                              !isRead ? "bg-emerald-50/30 dark:bg-emerald-950/10 font-medium" : ""
                            }`}
                          >
                            <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-3">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border ${typeMeta.color}`}
                              >
                                {typeMeta.label}
                              </span>
                            </td>
                            <td className="p-3 max-w-xs sm:max-w-md">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {n.title}
                              </div>
                              <div className="text-slate-500 text-[11px] truncate">
                                {n.body}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {n.recipient_name}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 truncate">
                                {n.recipient_email}
                              </div>
                            </td>
                            <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                              {n.sent_at ? new Date(n.sent_at).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }) : "-"}
                            </td>
                            <td className="p-3 text-center">
                              {isRead ? (
                                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200">
                                  Dibaca
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]">
                                  Terkirim
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedNotification(n)
                                    setPreviewOpen(true)
                                  }}
                                  className="h-7 px-2 text-xs text-slate-600 hover:text-emerald-700 gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>Pratinjau</span>
                                </Button>
                                {!isRead && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(n.id)}
                                    className="h-7 px-2 text-[11px] text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Tandai Baca</span>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          Tidak ada notifikasi yang ditemukan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PEMICU PENGINGAT OTOMATIS */}
        <TabsContent value="triggers" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>Sistem Pengingat Otomatis (Smart Background Reminders)</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pusat pemindaian proaktif MAGGURU untuk menjaga kepatuhan presensi, kelengkapan nilai stase, dan kesiapan akhir rotasi klinis.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={handleTriggerAutomatedReminders}
                  disabled={isTriggeringReminders}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isTriggeringReminders ? "Memindai Data..." : "Jalankan Pemindaian Sekarang"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {reminderResult && (
                <div
                  className={`rounded-lg p-3 text-xs flex items-center gap-2 border ${
                    reminderResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{reminderResult.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Modul 1: Presensi Harian */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <CalendarCheck className="h-4 w-4" />
                    </div>
                    <Badge variant="outline" className="border-amber-200 text-amber-700 text-[10px]">
                      Harian Otomatis
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Pengingat Presensi Stase
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Memindai seluruh mahasiswa aktif dinas yang belum check-in pada hari berjalan dan mengirim notifikasi sebelum pergantian dinas.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-400 font-mono">
                    Target: Mahasiswa Praktik &amp; MPPD
                  </div>
                </div>

                {/* Modul 2: Evaluasi Preseptor */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <Badge variant="outline" className="border-rose-200 text-rose-700 text-[10px]">
                      H-3 Penutupan
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Pengingat Evaluasi Klinis
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Mendeteksi mahasiswa yang sisa masa rotasinya &le; 3 hari namun lembar evaluasi kompetensi klinisnya belum difinalisasi oleh Preseptor.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-400 font-mono">
                    Target: Preseptor / Supervisor Dokter
                  </div>
                </div>

                {/* Modul 3: Akhir Periode */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      <Clock className="h-4 w-4" />
                    </div>
                    <Badge variant="outline" className="border-purple-200 text-purple-700 text-[10px]">
                      H-7 Akhir Stase
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Pemberitahuan Akhir Stase
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Memberikan pengumuman persiapan penutupan stase, pengecekan minimal kehadiran 80%, dan prosedur penerbitan surat keterangan selesai.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-400 font-mono">
                    Target: Mahasiswa &amp; PIC Institusi
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: KIRIM SIARAN DINAS MANUAL */}
        <TabsContent value="broadcast" className="mt-4">
          <Card className="border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Send className="h-4 w-4 text-emerald-600" />
                  <span>Kirim Siaran Dinas Resmi (Broadcast Notification)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Kirimkan pengumuman penting, instruksi jadwal rotasi, atau surat edaran Diklat langsung ke kotak masuk pengguna MAGGURU.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSendBroadcast} className="space-y-4 max-w-2xl">
                {broadcastMessage && (
                  <div
                    className={`rounded-lg p-3 text-xs flex items-center gap-2 border ${
                      broadcastMessage.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{broadcastMessage.text}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kelompok Target Penerima
                  </label>
                  <Select
                    value={broadcastForm.recipient_role}
                    onValueChange={(val) =>
                      setBroadcastForm((prev) => ({
                        ...prev,
                        recipient_role: (val as ManualBroadcastInput["recipient_role"]) || "all",
                      }))
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Pilih target penerima" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Seluruh Pengguna (PIC Kampus, Preseptor, Mahasiswa)</SelectItem>
                      <SelectItem value="preceptor">Khusus Preseptor &amp; Supervisor Dokter</SelectItem>
                      <SelectItem value="student">Khusus Mahasiswa Praktik &amp; MPPD</SelectItem>
                      <SelectItem value="pic_institusi">Khusus PIC Perguruan Tinggi Mitra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Judul Pengumuman Dinas
                  </label>
                  <Input
                    placeholder="Contoh: Jadwal Orientasi Umum Stase MPPD Semester Genap"
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Isi Pesan / Edaran Resmi
                  </label>
                  <Textarea
                    placeholder="Tuliskan petunjuk operasional atau informasi penting yang ingin disampaikan..."
                    value={broadcastForm.body}
                    onChange={(e) => setBroadcastForm((prev) => ({ ...prev, body: e.target.value }))}
                    className="text-xs min-h-[120px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Teks Tombol Aksi (CTA Text)
                    </label>
                    <Input
                      placeholder="Buka Portal MAGGURU"
                      value={broadcastForm.cta_text}
                      onChange={(e) => setBroadcastForm((prev) => ({ ...prev, cta_text: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tautan URL Tombol Aksi
                    </label>
                    <Input
                      placeholder="/dashboard atau URL lengkap"
                      value={broadcastForm.cta_url}
                      onChange={(e) => setBroadcastForm((prev) => ({ ...prev, cta_url: e.target.value }))}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="submit"
                    disabled={isBroadcasting || !broadcastForm.title || !broadcastForm.body}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isBroadcasting ? "Mengirim Siaran..." : "Kirimkan Siaran Dinas Sekarang"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG PRATINJAU EMAIL */}
      <EmailPreviewDialog
        notification={selectedNotification}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  )
}
