"use client"

import * as React from "react"
import * as XLSX from "xlsx"
import {
  DashboardKpiData,
  MonthlyTrendData,
  RoomOccupancyData,
  InstitutionDistributionData,
  StudyProgramDistributionData,
  AccreditationReportDataset,
  ReportFilterInput,
} from "@/lib/validations/reports"
import { getDashboardAnalyticsAction, getAccreditationReportDataAction } from "@/actions/reports"
import { MonthlyTrendChart } from "./monthly-trend-chart"
import { RoomOccupancyChart } from "./room-occupancy-chart"
import { InstitutionDistributionChart } from "./institution-distribution-chart"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Users,
  Building2,
  BedDouble,
  GraduationCap,
  CalendarCheck2,
  FileSpreadsheet,
  RotateCcw,
  Search,
  CheckCircle2,
  TrendingUp,
  FileText,
  BarChart3,
} from "lucide-react"

interface ReportsManagerProps {
  initialAnalytics: {
    kpi: DashboardKpiData
    monthlyTrend: MonthlyTrendData[]
    roomOccupancy: RoomOccupancyData[]
    institutionDistribution: InstitutionDistributionData[]
    studyProgramDistribution: StudyProgramDistributionData[]
  }
  initialAccreditation: AccreditationReportDataset
  filterOptions: {
    periods: Array<{ id: string; name: string; academic_year: string }>
    institutions: Array<{ id: string; name: string }>
    rooms: Array<{ id: string; name: string; service_type: string }>
  }
}

export function ReportsManager({
  initialAnalytics,
  initialAccreditation,
  filterOptions,
}: ReportsManagerProps) {
  const [filters, setFilters] = React.useState<ReportFilterInput>({
    period_id: "all",
    institution_id: "all",
    room_id: "all",
    student_category: "all",
    year: new Date().getFullYear(),
  })

  const [analytics, setAnalytics] = React.useState(initialAnalytics)
  const [accreditation, setAccreditation] = React.useState(initialAccreditation)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [studentSearch, setStudentSearch] = React.useState("")

  const handleFilterChange = async (newFilters: Partial<ReportFilterInput>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    setIsRefreshing(true)

    try {
      const [analyticsRes, accredRes] = await Promise.all([
        getDashboardAnalyticsAction(updated),
        getAccreditationReportDataAction(updated),
      ])

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data)
      }
      if (accredRes.success && accredRes.data) {
        setAccreditation(accredRes.data)
      }
    } catch (err) {
      console.error("Gagal memperbarui analitik:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleResetFilters = () => {
    const defaultFilters: ReportFilterInput = {
      period_id: "all",
      institution_id: "all",
      room_id: "all",
      student_category: "all",
      year: new Date().getFullYear(),
    }
    handleFilterChange(defaultFilters)
  }

  // Ekspor Excel Multi-Sheet Komprehensif
  const handleExportMultiSheetExcel = () => {
    const wb = XLSX.utils.book_new()
    const timestamp = new Date().toISOString().split("T")[0]

    // Sheet 1: Ringkasan Eksekutif & KPI
    const executiveSummaryRows = [
      { Indikator: "Rumah Sakit", Nilai: accreditation.summary.hospitalName },
      { Indikator: "Unit Pengelola", Nilai: accreditation.summary.division },
      { Indikator: "Standar Layanan", Nilai: "Standar RS Pendidikan Utama" },
      { Indikator: "Tahun Evaluasi", Nilai: accreditation.summary.evaluationYear },
      { Indikator: "Total Mahasiswa Praktik / MPPD", Nilai: analytics.kpi.totalStudents },
      { Indikator: "Mahasiswa Sedang Aktif Dinas", Nilai: analytics.kpi.activePlacements },
      { Indikator: "Mahasiswa Telah Selesai Rotasi", Nilai: analytics.kpi.completedPlacements },
      { Indikator: "Kemitraan MoU Perguruan Tinggi", Nilai: analytics.kpi.activeMoUCount },
      { Indikator: "Rasio CI / Preseptor : Mahasiswa", Nilai: accreditation.summary.mentorToStudentRatio },
      { Indikator: "Rerata Okupansi Ruangan (%)", Nilai: `${analytics.kpi.avgOccupancyRate}%` },
      { Indikator: "Kepatuhan Kehadiran Stase (%)", Nilai: `${analytics.kpi.avgAttendanceRate}%` },
      { Indikator: "Rerata Nilai Evaluasi Klinis", Nilai: analytics.kpi.avgClinicalScore },
      { Indikator: "Tingkat Kelulusan Stase (%)", Nilai: `${analytics.kpi.passRate}%` },
    ]
    const ws1 = XLSX.utils.json_to_sheet(executiveSummaryRows)
    XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan Eksekutif")

    // Sheet 2: Rekapitulasi Rotasi Mahasiswa
    const studentRotationRows = accreditation.students.map((st, idx) => ({
      No: idx + 1,
      NIM: st.nim,
      Nama_Lengkap: st.fullName,
      Institusi: st.institutionName,
      Program_Studi: st.studyProgramName,
      Kategori: st.type === "mppd" ? "MPPD Kedokteran" : "Praktik Klinik",
      Ruangan_Stase: st.roomName,
      Periode: st.periodName,
      Tanggal_Mulai: st.startDate,
      Tanggal_Selesai: st.endDate,
      Kehadiran_Persen: `${st.attendanceRate}%`,
      Nilai_Akhir: st.finalScore !== null ? st.finalScore : "Belum Dinilai",
      Huruf_Mutu: st.gradeLetter || "-",
      Status_Kelulusan: (st.finalScore || 0) >= 70 ? "LULUS" : "REMEDIAL / BELUM LULUS",
    }))
    const ws2 = XLSX.utils.json_to_sheet(studentRotationRows)
    XLSX.utils.book_append_sheet(wb, ws2, "Rekap Rotasi Mahasiswa")

    // Sheet 3: Okupansi Ruangan RSUD
    const roomOccupancyRows = analytics.roomOccupancy.map((room, idx) => ({
      No: idx + 1,
      Kode_Ruangan: room.code || "-",
      Nama_Ruangan: room.name,
      Jenis_Layanan: room.serviceType,
      Kapasitas_Maksimal: room.capacity,
      Mahasiswa_Aktif: room.activeStudents,
      Tingkat_Okupansi: `${room.occupancyRate}%`,
      Sisa_Kapasitas: Math.max(0, room.capacity - room.activeStudents),
      Status: room.status.toUpperCase(),
    }))
    const ws3 = XLSX.utils.json_to_sheet(roomOccupancyRows)
    XLSX.utils.book_append_sheet(wb, ws3, "Okupansi Ruangan")

    // Sheet 4: Kemitraan Kampus (MoU)
    const institutionRows = accreditation.institutions.map((inst, idx) => ({
      No: idx + 1,
      Nama_Institusi: inst.name,
      Nomor_MoU: inst.mouNumber || "Dalam Pengurusan",
      Masa_Berlaku: inst.mouValidUntil || "Aktif",
      Total_Mahasiswa_Terkirim: inst.studentCount,
      Status_Kemitraan: inst.isActive ? "AKTIF" : "NONAKTIF",
    }))
    const ws4 = XLSX.utils.json_to_sheet(institutionRows)
    XLSX.utils.book_append_sheet(wb, ws4, "Kemitraan Perguruan Tinggi")

    // Sheet 5: Tren Bulanan
    const trendRows = analytics.monthlyTrend.map((tr) => ({
      Bulan: tr.month,
      MPPD_Kedokteran: tr.mppd,
      Praktik_Klinik: tr.praktik_klinik,
      Total_Mahasiswa: tr.total,
    }))
    const ws5 = XLSX.utils.json_to_sheet(trendRows)
    XLSX.utils.book_append_sheet(wb, ws5, "Tren Bulanan")

    XLSX.writeFile(wb, `Laporan_Komprehensif_MAGGURU_RSUD_Bulukumba_${timestamp}.xlsx`)
  }

  // Filter pencarian mahasiswa pada Tab Rekap
  const filteredStudents = React.useMemo(() => {
    if (!studentSearch.trim()) return accreditation.students
    const q = studentSearch.toLowerCase()
    return accreditation.students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q) ||
        s.institutionName.toLowerCase().includes(q) ||
        s.studyProgramName.toLowerCase().includes(q) ||
        s.roomName.toLowerCase().includes(q)
    )
  }, [accreditation.students, studentSearch])

  return (
    <div className="space-y-6">
      {/* FILTER TOOLBAR ELEGAN */}
      <Card className="border-slate-200 shadow-sm print:hidden dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Filter & Parameter Analitik
              </span>
              {isRefreshing && (
                <Badge variant="outline" className="animate-pulse bg-emerald-50 text-emerald-700 text-[10px]">
                  Memperbarui Data...
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs text-slate-600 hover:text-slate-900 gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filter
              </Button>
              <Button
                size="sm"
                onClick={handleExportMultiSheetExcel}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Ekspor Excel Multi-Sheet
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Filter Periode */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Periode Akademik</label>
              <Select
                value={filters.period_id}
                onValueChange={(val) => handleFilterChange({ period_id: val || "all" })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  {filterOptions.periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.academic_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Institusi */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Institusi Perguruan Tinggi</label>
              <Select
                value={filters.institution_id}
                onValueChange={(val) => handleFilterChange({ institution_id: val || "all" })}
              >
                <SelectTrigger className="h-8 text-xs truncate">
                  <SelectValue placeholder="Semua Institusi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Institusi</SelectItem>
                  {filterOptions.institutions.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Ruangan */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Ruangan / Stase</label>
              <Select
                value={filters.room_id}
                onValueChange={(val) => handleFilterChange({ room_id: val || "all" })}
              >
                <SelectTrigger className="h-8 text-xs truncate">
                  <SelectValue placeholder="Semua Ruangan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Ruangan</SelectItem>
                  {filterOptions.rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Kategori */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Kategori Peserta</label>
              <Select
                value={filters.student_category}
                onValueChange={(val) =>
                  handleFilterChange({
                    student_category: (val as "all" | "praktik_klinik" | "mppd") || "all",
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="mppd">MPPD Kedokteran</SelectItem>
                  <SelectItem value="praktik_klinik">Praktik Klinik (Ners/Bidan/Umum)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Tahun */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Tahun Kalender</label>
              <Input
                type="number"
                min={2020}
                max={2030}
                value={filters.year}
                onChange={(e) => handleFilterChange({ year: parseInt(e.target.value) || 2026 })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS KONTROL MODUL */}
      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 print:hidden">
          <TabsTrigger value="visual" className="text-xs font-medium gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Visual &amp; Tren Analitik
          </TabsTrigger>
          <TabsTrigger value="students" className="text-xs font-medium gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Rekap Peserta ({filteredStudents.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VISUAL & TREN ANALITIK */}
        <TabsContent value="visual" className="mt-6 space-y-6">
          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Total Mahasiswa</span>
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {analytics.kpi.totalStudents}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">MPPD & Klinik</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Mahasiswa Aktif</span>
                  <CalendarCheck2 className="h-4 w-4 text-sky-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">
                  {analytics.kpi.activePlacements}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Sedang dinas stase</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">MoU Kampus</span>
                  <Building2 className="h-4 w-4 text-indigo-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {analytics.kpi.activeMoUCount}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Perguruan tinggi</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Rerata Okupansi</span>
                  <BedDouble className="h-4 w-4 text-amber-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {analytics.kpi.avgOccupancyRate}%
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Kapasitas ruangan</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Kehadiran Stase</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {analytics.kpi.avgAttendanceRate}%
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Standar Kehadiran &ge;80%</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">Kelulusan Stase</span>
                  <GraduationCap className="h-4 w-4 text-teal-600" />
                </div>
                <p className="mt-2 text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {analytics.kpi.passRate}%
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Skor rerata {analytics.kpi.avgClinicalScore}</p>
              </CardContent>
            </Card>
          </div>

          {/* CHARTS GRID 1: TREN & OKUPANSI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyTrendChart
              data={analytics.monthlyTrend}
              year={filters.year || new Date().getFullYear()}
            />
            <RoomOccupancyChart data={analytics.roomOccupancy} />
          </div>

          {/* CHARTS GRID 2: DISTRIBUSI INSTITUSI & PRODI */}
          <div>
            <InstitutionDistributionChart
              institutions={analytics.institutionDistribution}
              studyPrograms={analytics.studyProgramDistribution}
            />
          </div>
        </TabsContent>

        {/* TAB 2: REKAPITULASI MAHASISWA & ROTASI */}
        <TabsContent value="students" className="mt-6 space-y-4">
          <Card className="border-slate-200 shadow-sm dark:border-slate-800">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cari nama, NIM, prodi, stase..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 text-xs h-9"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Menampilkan <strong>{filteredStudents.length}</strong> entri rotasi mahasiswa
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Nama & NIM</th>
                      <th className="p-3">Institusi & Prodi</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Ruangan Stase</th>
                      <th className="p-3">Periode Dinas</th>
                      <th className="p-3 text-center">Kehadiran</th>
                      <th className="p-3 text-right">Nilai Akhir</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((st, idx) => (
                        <tr key={`${st.nim}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-900 dark:text-white">{st.fullName}</div>
                            <div className="font-mono text-[10px] text-slate-500">{st.nim}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-800 dark:text-slate-200">{st.institutionName}</div>
                            <div className="text-[11px] text-slate-500">{st.studyProgramName}</div>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                st.type === "mppd"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]"
                                  : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 text-[10px]"
                              }
                            >
                              {st.type === "mppd" ? "MPPD Kedokteran" : "Praktik Klinik"}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                            {st.roomName}
                          </td>
                          <td className="p-3 text-[11px] text-slate-500">
                            {st.startDate} s/d {st.endDate}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold">
                            <span
                              className={
                                st.attendanceRate >= 80
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }
                            >
                              {st.attendanceRate}%
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            {st.finalScore !== null ? st.finalScore : "-"}
                            {st.gradeLetter && (
                              <span className="ml-1.5 font-bold text-slate-500">({st.gradeLetter})</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {(st.finalScore || 0) >= 70 ? (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none text-[10px]">
                                Lulus
                              </Badge>
                            ) : st.finalScore !== null ? (
                              <Badge variant="destructive" className="text-[10px]">
                                Remedial
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Berjalan
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          Tidak ditemukan data mahasiswa yang sesuai dengan filter pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
