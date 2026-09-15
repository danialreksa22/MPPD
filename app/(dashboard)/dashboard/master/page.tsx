import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { seedDefaultMasterDataAction } from "@/actions/master-data"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Building2,
  GraduationCap,
  Hospital,
  Calendar,
  Stethoscope,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Award,
} from "lucide-react"

export default async function MasterOverviewPage() {
  const supabase = await createClient()

  const [
    { count: instCount },
    { count: progCount },
    { count: roomCount },
    { count: periodCount },
    { count: preceptorCount },
    { count: userCount },
    { count: officialCount },
  ] = await Promise.all([
    supabase.from("institutions").select("*", { count: "exact", head: true }),
    supabase.from("study_programs").select("*", { count: "exact", head: true }),
    supabase.from("rooms_units").select("*", { count: "exact", head: true }),
    supabase.from("periods").select("*", { count: "exact", head: true }),
    supabase.from("preceptors").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("hospital_officials").select("*", { count: "exact", head: true }),
  ])

  const totalInstitutions = instCount || 0
  const totalPrograms = progCount || 0
  const totalRooms = roomCount || 0
  const totalPeriods = periodCount || 0
  const totalPreceptors = preceptorCount || 0
  const totalUsers = userCount || 0
  const totalOfficials = (officialCount ?? 0) > 0 ? (officialCount ?? 0) : 3

  const hasData =
    totalInstitutions > 0 ||
    totalPrograms > 0 ||
    totalRooms > 0 ||
    totalPeriods > 0 ||
    totalPreceptors > 0 ||
    totalOfficials > 0

  async function handleSeed() {
    "use server"
    await seedDefaultMasterDataAction()
  }

  return (
    <div className="space-y-6">
      {/* Quick Seed Notification if database is empty */}
      {!hasData && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Inisialisasi Data Master RSUD Bulukumba
              </h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Tabel master data masih kosong. Anda dapat langsung memuat data standar institusi mitra
              (Unhas, Poltekkes, STIKES Panrita), program studi, 7 ruangan pelayanan, periode TA 2026/2027,
              serta pembimbing klinik dengan 1 klik.
            </p>
          </div>

          <form action={handleSeed}>
            <Button size="sm" type="submit" className="gap-2 font-semibold shrink-0 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Muat Data Standar</span>
            </Button>
          </form>
        </div>
      )}

      {hasData && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Database terhubung ke Supabase. Seluruh data di bawah tersimpan secara langsung dan real-time.
            </span>
          </div>
          <form action={handleSeed}>
            <Button variant="outline" size="sm" type="submit" className="text-xs h-7 gap-1.5">
              <Sparkles className="h-3 w-3" />
              <span>Muat Ulang Data Standar</span>
            </Button>
          </form>
        </div>
      )}

      {/* Grid Kartu Metrik 5 Entitas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Institusi */}
        <Card className="flex flex-col justify-between border-border/80 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">
                {totalInstitutions}
              </span>
            </div>
            <CardTitle className="text-base mt-2">Institusi Pendidikan</CardTitle>
            <CardDescription className="text-xs">
              Perguruan tinggi, fakultas kedokteran, dan politeknik mitra kerja sama (MoU).
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Link href="/dashboard/master/institusi" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <span>Kelola Institusi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* 2. Program Studi */}
        <Card className="flex flex-col justify-between border-border/80 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">
                {totalPrograms}
              </span>
            </div>
            <CardTitle className="text-base mt-2">Program Studi / Profesi</CardTitle>
            <CardDescription className="text-xs">
              Profesi Dokter (MPPD/Koas), Keperawatan, Kebidanan, Farmasi, dan Gizi.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Link href="/dashboard/master/program-studi" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <span>Kelola Program Studi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* 3. Ruangan & Kuota */}
        <Card className="flex flex-col justify-between border-border/80 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                <Hospital className="h-5 w-5" />
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">
                {totalRooms}
              </span>
            </div>
            <CardTitle className="text-base mt-2">Ruangan &amp; Unit Pelayanan</CardTitle>
            <CardDescription className="text-xs">
              Kapasitas kuota daya tampung mahasiswa per unit pelayanan rumah sakit.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Link href="/dashboard/master/ruangan" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <span>Kelola Ruangan &amp; Kuota</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* 4. Periode Praktik */}
        <Card className="flex flex-col justify-between border-border/80 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">
                {totalPeriods}
              </span>
            </div>
            <CardTitle className="text-base mt-2">Periode / Gelombang</CardTitle>
            <CardDescription className="text-xs">
              Jadwal gelombang praktik aktif dan tahun akademik kalender kepaniteraan.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Link href="/dashboard/master/periode" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <span>Kelola Periode</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* 5. Preseptor / Pembimbing */}
        <Card className="flex flex-col justify-between border-border/80 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">
                {totalPreceptors}
              </span>
            </div>
            <CardTitle className="text-base mt-2">Preseptor / CI &amp; DPJP</CardTitle>
            <CardDescription className="text-xs">
              Clinical Instructor (CI) dan Supervisor Dokter spesialis pembimbing klinik.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Link href="/dashboard/master/preseptor" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <span>Kelola Pembimbing</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* 6. Pimpinan RSUD & Kabid Diklat */}
        <Card className="flex flex-col justify-between border-border/80 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Award className="h-5 w-5" />
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">
                {totalOfficials}
              </span>
            </div>
            <CardTitle className="text-base mt-2">Pimpinan RSUD &amp; Diklat</CardTitle>
            <CardDescription className="text-xs">
              Direktur, Wakil Direktur, Kepala Bidang Diklat, dan penandatangan surat naskah dinas.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Link href="/dashboard/master/pimpinan" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <span>Kelola Pejabat &amp; Diklat</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* 7. Akun Pengguna & Hak Akses */}
        <Card className="flex flex-col justify-between border-border/80 hover:border-primary/40 transition-all hover:shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <span className="font-heading text-2xl font-bold text-foreground">
                {totalUsers}
              </span>
            </div>
            <CardTitle className="text-base mt-2">Akun Pengguna &amp; Hak Akses</CardTitle>
            <CardDescription className="text-xs">
              Manajemen seluruh akun pengguna, penetapan peran (RBAC), dan hak akses portal.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Link href="/dashboard/pengguna" className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                <span>Kelola Pengguna &amp; Akses</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
