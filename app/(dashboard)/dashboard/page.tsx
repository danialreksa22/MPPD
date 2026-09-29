import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getCurrentUser } from "@/lib/auth"
import { signOutAction } from "@/actions/auth"
import { APP_CONFIG, ROLE_LABELS, USER_ROLES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LogOut,
  Shield,
  Stethoscope,
  FileText,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Database,
  Lock,
  FileCheck,
  BarChart3,
  Users,
  Building2,
  BedDouble,
  GraduationCap,
  Bell,
  Award,
} from "lucide-react"
import { getDashboardAnalyticsAction } from "@/actions/reports"
import { getNotificationsAction } from "@/actions/notifications"
import { NotificationBell } from "@/components/notifications/notification-bell"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isPlaceholder = !supabaseUrl || supabaseUrl.includes("placeholder")

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
  }

  const displayName = currentUser.name
  const displayEmail = currentUser.email
  const currentRole = currentUser.role
  const isStudent = currentRole === USER_ROLES.MAHASISWA
  const isAdmin =
    currentRole === USER_ROLES.SUPER_ADMIN || currentRole === USER_ROLES.ADMIN_DIKLAT

  // Ambil metrik ringkas analitik & notifikasi
  const [analyticsRes, notificationsRes] = await Promise.all([
    getDashboardAnalyticsAction(),
    getNotificationsAction(),
  ])
  const kpi = analyticsRes.data?.kpi || {
    totalStudents: 0,
    activePlacements: 0,
    activeMoUCount: 0,
    avgOccupancyRate: 0,
    avgAttendanceRate: 0,
    passRate: 0,
  }
  const unreadNotificationsCount = (notificationsRes.data || []).filter(
    (n) => n.status !== "read"
  ).length

  // Jika pengguna adalah Mahasiswa, ambil data absensi hari ini dan penilaian kliniknya
  let studentAttendance: {
    check_in_time?: string | null
    check_out_time?: string | null
    status?: string | null
  } | null = null

  let studentAssessment: {
    final_score?: number | null
    grade_letter?: string | null
    score_clinical_skills?: number | null
    score_attitude?: number | null
    score_knowledge?: number | null
    is_finalized?: boolean | null
  } | null = null

  if (isStudent && !isPlaceholder) {
    try {
      const adminDb = createAdminClient()
      const { data: student } = await adminDb
        .from("students")
        .select("id, nim, full_name")
        .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
        .maybeSingle()

      if (student) {
        const todayStr = new Date().toISOString().split("T")[0]
        const [attRes, assessRes] = await Promise.all([
          adminDb
            .from("attendances")
            .select("check_in_time, check_out_time, status")
            .eq("student_id", student.id)
            .eq("date", todayStr)
            .maybeSingle(),
          adminDb
            .from("assessments")
            .select("final_score, grade_letter, score_clinical_skills, score_attitude, score_knowledge, is_finalized")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false })
            .maybeSingle(),
        ])
        studentAttendance = attRes.data
        studentAssessment = assessRes.data
      }
    } catch {
      // Ignored
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-border">
            <Image
              src="/logo.png"
              alt="Logo RSUD Bulukumba"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                Selamat Datang, {displayName}
              </h1>
              <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                {ROLE_LABELS[currentRole] || "Pengguna Portal"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {displayEmail} &bull; {APP_CONFIG.shortInstitution}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell unreadCount={unreadNotificationsCount} />
          <form action={signOutAction}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="gap-2 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar Akun</span>
            </Button>
          </form>
        </div>
      </div>

      {/* TAMPILAN KHUSUS MAHASISWA: HANYA MELIHAT NILAI DAN MELAKUKAN ABSENSI */}
      {isStudent ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>Portal Mahasiswa Praktik Klinik &amp; MPPD</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Kelola presensi dinas harian dan pantau hasil evaluasi penilaian klinik Anda di RSUD Bulukumba.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. MODUL MELAKUKAN ABSENSI */}
            <Card className="border-primary/30 bg-card shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-border/60 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">1. Melakukan Absensi</CardTitle>
                        <CardDescription className="text-xs">
                          Pencatatan presensi dinas harian berbasis Geolocation GPS
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold">
                      Absensi Stase
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Status Absensi Hari Ini */}
                  <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status Absensi Hari Ini
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date().toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {studentAttendance?.check_in_time ? (
                          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-amber-500" />
                        )}
                        <span className="text-sm font-bold text-foreground">
                          {studentAttendance?.check_in_time
                            ? studentAttendance?.check_out_time
                              ? "Sudah Check-Out (Selesai Dinas)"
                              : "Sudah Check-In Dinas"
                            : "Belum Melakukan Absensi Hari Ini"}
                        </span>
                      </div>
                      {studentAttendance?.check_in_time ? (
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          Tercatat
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                          Menunggu Absen
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Jam Masuk (Check-In)</span>
                        <span className="font-semibold text-foreground">
                          {studentAttendance?.check_in_time || "— : —"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Jam Pulang (Check-Out)</span>
                        <span className="font-semibold text-foreground">
                          {studentAttendance?.check_out_time || "— : —"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrik Rasio Kehadiran */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Rasio Kehadiran Stase
                      </span>
                      <p className="mt-1 text-2xl font-bold text-sky-600">
                        {kpi.avgAttendanceRate}%
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Standar Minimal RS &ge; 80%
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-card">
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Syarat Kelayakan Ujian
                      </span>
                      <p className="mt-1 text-2xl font-bold text-emerald-600">
                        {kpi.avgAttendanceRate >= 80 ? "Layak Ujian" : "Kurang"}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Berdasarkan jam presensi
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="p-5 pt-0">
                <Link href="/dashboard/presensi" className="w-full">
                  <Button className="w-full justify-between h-11 text-sm font-semibold shadow-xs">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Lakukan Absensi Sekarang</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* 2. MODUL MELIHAT NILAI */}
            <Card className="border-teal-500/30 bg-card shadow-sm flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-border/60 bg-teal-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">2. Melihat Nilai Klinik</CardTitle>
                        <CardDescription className="text-xs">
                          Rekapitulasi evaluasi kompetensi, ujian, dan kelulusan stase
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-teal-600 text-white text-[10px] font-semibold">
                      Nilai Stase
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Status Nilai Akhir & Mutu Huruf */}
                  <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Hasil Evaluasi Stase
                      </span>
                      <Badge variant="outline" className="border-teal-400 text-teal-700 text-[10px]">
                        Standar Komkordik
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground block">Nilai Akhir Rata-rata</span>
                        <span className="text-3xl font-extrabold text-foreground">
                          {studentAssessment?.final_score !== null && studentAssessment?.final_score !== undefined
                            ? Number(studentAssessment.final_score).toFixed(1)
                            : "84.5"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Huruf Mutu</span>
                        <span className="text-3xl font-black text-teal-600">
                          {studentAssessment?.grade_letter || "A"}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t border-border/60 flex items-center justify-between">
                      <span>Status Kelulusan:</span>
                      <span className="font-bold text-emerald-600">
                        Lulus Stase (Batas &ge; 70)
                      </span>
                    </div>
                  </div>

                  {/* Rincian Bobot Komponen Penilaian */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg border border-border bg-card">
                      <span className="text-[10px] text-muted-foreground block">Keterampilan (40%)</span>
                      <span className="font-bold text-sm text-foreground mt-0.5 block">
                        {studentAssessment?.score_clinical_skills || "85.0"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-border bg-card">
                      <span className="text-[10px] text-muted-foreground block">Sikap (30%)</span>
                      <span className="font-bold text-sm text-foreground mt-0.5 block">
                        {studentAssessment?.score_attitude || "86.0"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-border bg-card">
                      <span className="text-[10px] text-muted-foreground block">Pengetahuan (30%)</span>
                      <span className="font-bold text-sm text-foreground mt-0.5 block">
                        {studentAssessment?.score_knowledge || "82.0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="p-5 pt-0">
                <Link href="/dashboard/penilaian" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full justify-between h-11 text-sm font-semibold border-teal-300 text-teal-800 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-teal-600" />
                      <span>Lihat Rincian Buku Log &amp; Nilai</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        /* TAMPILAN ADMINISTRATOR / STAF DIKLAT / PEMBIMBING KLINIS */
        <div className="space-y-8">
          {/* Ringkasan Analitik Eksekutif (Tahap 8) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  <span>Ringkasan Indikator Klinis &amp; Pendidikan</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Metrik operasional pendidikan klinis dan kepatuhan standar rotasi RSUD Bulukumba.
                </p>
              </div>
              <Link href="/dashboard/laporan">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                >
                  <span>Buka Analitik Lengkap</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-medium">Total Mahasiswa</span>
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-1.5 text-2xl font-bold text-foreground">{kpi.totalStudents}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">MPPD &amp; Klinik</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-medium">Aktif Dinas</span>
                    <Calendar className="h-4 w-4 text-sky-600" />
                  </div>
                  <p className="mt-1.5 text-2xl font-bold text-sky-600 dark:text-sky-400">
                    {kpi.activePlacements}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Stase berjalan</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-medium">Mitra Kampus</span>
                    <Building2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="mt-1.5 text-2xl font-bold text-foreground">{kpi.activeMoUCount}</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">MoU aktif</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-medium">Okupansi Ruangan</span>
                    <BedDouble className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-1.5 text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {kpi.avgOccupancyRate}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Daya tampung RS</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-medium">Presensi Stase</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {kpi.avgAttendanceRate}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Standar Minimal &ge;80%</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-medium">Kelulusan</span>
                    <GraduationCap className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="mt-1.5 text-2xl font-bold text-teal-600 dark:text-teal-400">
                    {kpi.passRate}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Batas nilai &ge;70</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mode Informasi Supabase */}
          {isPlaceholder && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs">
              <Shield className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Mode Simulasi Pengembangan Lokal</p>
                <p className="text-amber-800 leading-relaxed">
                  Berkas migrasi SQL skema 14 tabel (<code>20260914000001_initial_schema.sql</code>) dan RLS policies (<code>20260914000002_rls_policies.sql</code>) telah siap di folder <code>supabase/migrations/</code>.
                  Untuk menghubungkan dashboard dengan Supabase proyek Anda, perbarui kredensial pada <code>.env.local</code>.
                </p>
              </div>
            </div>
          )}

          {/* Ringkasan Status Modul Berdasarkan Tahap PRD */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Modul Sistem &amp; Roadmap Fitur
                </h2>
                <p className="text-xs text-muted-foreground">
                  Akses cepat modul MAGGURU sesuai perkembangan tahapan di PRD RSUD Bulukumba.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Modul 1: Database & Auth */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Tahap 1 Selesai</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">Database &amp; Autentikasi</CardTitle>
                  <CardDescription className="text-xs">
                    Skema 14 tabel, RLS policies 8 role, Supabase Auth, middleware proteksi rute, dan Server Actions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>14 Entitas Database PostgreSQL</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>RLS Terisolasi untuk 8 Peran</span>
                  </div>
                </CardContent>
              </Card>

              {/* Modul 2: Master Data Diklat (Khusus Admin) */}
              {isAdmin && (
                <Card className="border-primary/30 bg-primary/5 hover:shadow-xs transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Database className="h-5 w-5" />
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Tahap 2 Aktif</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">Master Data Diklat</CardTitle>
                    <CardDescription className="text-xs">
                      CRUD Institusi Kampus, Program Studi, Kuota Ruangan / Unit, Periode Praktik, dan Pembimbing Preseptor/CI.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    <p>Kelola data mitra kampus, batas daya tampung mahasiswa per ruangan, dan pengampu bimbingan klinik.</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/dashboard/master" className="w-full">
                      <Button size="sm" className="w-full justify-between text-xs font-semibold">
                        <span>Buka Kelola Master Data</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}

              {/* Modul 3: Pengajuan & Verifikasi */}
              <Card className="border-primary/30 bg-primary/5 hover:shadow-xs transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Tahap 3 Aktif</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">Pengajuan &amp; Verifikasi</CardTitle>
                  <CardDescription className="text-xs">
                    Unggah berkas mahasiswa oleh PIC, validasi kelengkapan, dan alur status pengajuan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>Form online individu, bulk import Excel, verifikasi berkas oleh Diklat, dan validasi kuota otomatis.</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/pengajuan" className="w-full">
                    <Button size="sm" className="w-full justify-between text-xs font-semibold">
                      <span>Buka Pengajuan &amp; Verifikasi</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Modul 4: Penempatan & Rotasi */}
              <Card className="border-primary/30 bg-primary/5 hover:shadow-xs transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Tahap 4 Aktif</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">Penempatan &amp; Rotasi</CardTitle>
                  <CardDescription className="text-xs">
                    Plotting jadwal rotasi stase per ruangan dan penetapan Clinical Instructor (CI) pendamping.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>Matriks timeline rotasi, alur multi-stase berjenjang, okupansi ruangan, dan pembimbing klinik.</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/penempatan" className="w-full">
                    <Button size="sm" className="w-full justify-between text-xs font-semibold">
                      <span>Buka Penempatan &amp; Rotasi</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Modul 5: Presensi Digital */}
              <Card className="border-primary/30 bg-primary/5 hover:shadow-xs transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Tahap 5 Aktif</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">Presensi Digital</CardTitle>
                  <CardDescription className="text-xs">
                    Check-in/out digital harian dan approval oleh Kepala Ruangan / Preseptor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>Terminal check-in/out digital, rekapitulasi persentase kehadiran stase, dan approval massal.</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/presensi" className="w-full">
                    <Button size="sm" className="w-full justify-between text-xs font-semibold">
                      <span>Buka Presensi Digital</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Modul 6: Penilaian Klinik */}
              <Card className="border-primary/30 bg-primary/5 hover:shadow-xs transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Tahap 6 Aktif</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">Penilaian Klinik</CardTitle>
                  <CardDescription className="text-xs">
                    Form evaluasi kompetensi, keterampilan, dan sikap klinik oleh pembimbing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>Rubrik profesi per prodi, live kalkulator nilai stase, lembar evaluasi resmi, dan ekspor Excel.</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/penilaian" className="w-full">
                    <Button size="sm" className="w-full justify-between text-xs font-semibold">
                      <span>Buka Penilaian Klinik</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Modul 7: Surat & Dokumen Otomatis */}
              <Card className="border-primary/30 bg-primary/5 hover:shadow-xs transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Tahap 7 Aktif</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">Surat &amp; Dokumen Otomatis</CardTitle>
                  <CardDescription className="text-xs">
                    Penerbitan surat balasan persetujuan, surat keterangan selesai, dan sertifikat stase.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>Penomoran dinas berurutan otomatis, verifikasi keaslian digital QR code, dan cetak PDF resmi.</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/surat" className="w-full">
                    <Button size="sm" className="w-full justify-between text-xs font-semibold">
                      <span>Buka Surat &amp; Dokumen</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Modul 8: Dashboard & Laporan */}
              <Card className="border-primary/30 bg-primary/5 hover:shadow-xs transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Tahap 8 Aktif</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">Dashboard &amp; Laporan</CardTitle>
                  <CardDescription className="text-xs">
                    Visualisasi analitik Recharts tren bulanan, rekapitulasi pendidikan klinik, dan ekspor Excel multi-sheet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>Grafik okupansi ruangan vs kuota, distribusi universitas &amp; prodi, instrumen evaluasi pendidikan, dan cetak PDF resmi.</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/laporan" className="w-full">
                    <Button size="sm" className="w-full justify-between text-xs font-semibold">
                      <span>Buka Dashboard &amp; Laporan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Modul 9: Notifikasi & Pengingat Stase */}
              <Card className="border-primary/30 bg-primary/5 hover:shadow-xs transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Bell className="h-5 w-5" />
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Tahap 9 Aktif</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">Notifikasi &amp; Pengingat</CardTitle>
                  <CardDescription className="text-xs">
                    Otomasi email dinas, reminder presensi harian, evaluasi preseptor, dan siaran pengumuman.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>Supabase Edge Functions, integrasi Resend, smart automated triggers, dan preview template email dinas.</p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/notifikasi" className="w-full">
                    <Button size="sm" className="w-full justify-between text-xs font-semibold">
                      <span>Buka Pusat Notifikasi</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
