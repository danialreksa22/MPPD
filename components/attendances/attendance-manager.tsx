"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RoomUnit, Period } from "@/types"
import {
  AttendanceWithRelations,
  AttendanceSummaryItem,
  checkInAction,
  checkOutAction,
  approveAttendanceAction,
  bulkApproveAttendancesAction,
} from "@/actions/attendances"
import { AttendanceStatus } from "@/lib/constants"
import { AttendanceStatusBadge } from "./attendance-status-badge"
import { ManualAttendanceDialog } from "./manual-attendance-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Clock,
  CheckCircle2,
  DoorClosed,
  Search,
  ShieldCheck,
  Plus,
  Loader2,
  ListChecks,
  BarChart3,
  Smartphone,
  LogOut,
  AlertTriangle,
  MapPin,
  Fingerprint,
  Camera,
  Eye,
  Layers,
} from "lucide-react"
import { WorkShift, autoDetectCurrentShift, DEFAULT_SHIFTS } from "@/lib/validations/shifts"
import { SmartMobileCheckinDialog } from "./smart-mobile-checkin-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface PlacementOption {
  id: string
  student_id: string
  student_name: string
  student_nim: string
  room_id: string
  room_name: string
  rotation_order: number
}

interface AttendanceManagerProps {
  initialAttendances: AttendanceWithRelations[]
  summaryData: AttendanceSummaryItem[]
  activePlacements: PlacementOption[]
  rooms: RoomUnit[]
  periods: Period[]
  shifts?: WorkShift[]
}

export function AttendanceManager({
  initialAttendances,
  summaryData,
  activePlacements,
  rooms,
  periods,
  shifts = DEFAULT_SHIFTS,
}: AttendanceManagerProps) {
  const effectiveShifts = shifts && shifts.length > 0 ? shifts : DEFAULT_SHIFTS
  const detectedShift = autoDetectCurrentShift(effectiveShifts, new Date())
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Tab State
  const [activeTab, setActiveTab] = useState<"today" | "summary" | "terminal">("today")

  // Filter States
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all")
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [approvalFilter, setApprovalFilter] = useState<string>("all")

  // Modal manual attendance
  const [isManualOpen, setIsManualOpen] = useState(false)
  // Modal mobile smart check-in
  const [isMobileCheckinOpen, setIsMobileCheckinOpen] = useState(false)
  // Selfie preview state
  const [previewSelfie, setPreviewSelfie] = useState<{
    name: string
    url: string
    time?: string | null
    distance?: number | null
  } | null>(null)

  // Terminal Self Check-In state
  const [terminalPlacementId, setTerminalPlacementId] = useState<string>(
    activePlacements[0]?.id || ""
  )
  const [terminalShiftId, setTerminalShiftId] = useState<string>(
    detectedShift?.id || effectiveShifts[0]?.id || "shift-pagi"
  )
  const [terminalStatus, setTerminalStatus] = useState<AttendanceStatus>("hadir")
  const [terminalNotes, setTerminalNotes] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<string>("")

  // Clock in WITA
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Format Jam
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return "-"
    return new Date(timeStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Filter Presensi Hari Ini
  const filteredAttendances = initialAttendances.filter((att) => {
    const studentName = att.students?.full_name?.toLowerCase() || ""
    const studentNim = att.students?.nim?.toLowerCase() || ""
    const roomName = att.rooms_units?.name?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()

    const matchesSearch =
      studentName.includes(query) || studentNim.includes(query) || roomName.includes(query)
    const matchesRoom = selectedRoomId === "all" || att.room_id === selectedRoomId
    const matchesApproval =
      approvalFilter === "all"
        ? true
        : approvalFilter === "approved"
        ? att.is_approved
        : !att.is_approved
    const matchesShift =
      selectedShiftFilter === "all"
        ? true
        : att.shift_id === selectedShiftFilter ||
          (att.shift_name && att.shift_name.toLowerCase().includes(selectedShiftFilter.toLowerCase()))

    return matchesSearch && matchesRoom && matchesApproval && matchesShift
  })

  // Filter Rekapitulasi
  const filteredSummary = summaryData.filter((item) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      item.student_name.toLowerCase().includes(query) ||
      item.student_nim.toLowerCase().includes(query) ||
      item.room_name.toLowerCase().includes(query)
    return matchesSearch
  })

  // Pending Approvals
  const pendingAttendances = initialAttendances.filter((a) => !a.is_approved)

  // Quick Approval Single
  const handleApprove = (id: string, isApproved: boolean) => {
    startTransition(async () => {
      const res = await approveAttendanceAction(id, isApproved)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  // Bulk Approval All Pending
  const handleBulkApprove = () => {
    const ids = pendingAttendances.map((a) => a.id)
    if (ids.length === 0) return

    startTransition(async () => {
      const res = await bulkApproveAttendancesAction(ids)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  // Terminal Check-In Submit
  const handleTerminalCheckIn = () => {
    if (!terminalPlacementId) return

    startTransition(async () => {
      const chosenShift = effectiveShifts.find((s) => s.id === terminalShiftId) || effectiveShifts[0]
      const formData = new FormData()
      formData.set("placement_id", terminalPlacementId)
      if (chosenShift) {
        formData.set("shift_id", chosenShift.id)
        formData.set("shift_name", chosenShift.name)
      }
      formData.set("date", todayStr)
      formData.set("status", terminalStatus)
      formData.set("notes", terminalNotes)

      const res = await checkInAction(formData)
      if (res.success) {
        alert(res.message)
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  // Terminal Check-Out Submit
  const handleTerminalCheckOut = (attendanceId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("attendance_id", attendanceId)

      const res = await checkOutAction(formData)
      if (res.success) {
        alert(res.message)
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  // Check if current terminal placement already checked in today
  const terminalTodayAtt = initialAttendances.find(
    (a) => a.placement_id === terminalPlacementId && a.date === todayStr
  )

  // Statistik Rekapitulasi
  const totalStudents = summaryData.length
  const eligibleCount = summaryData.filter((s) => s.is_eligible).length
  const avgPercentage =
    totalStudents > 0
      ? Math.round(
          summaryData.reduce((acc, curr) => acc + curr.attendance_percentage, 0) / totalStudents
        )
      : 100

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Presensi Digital &amp; Rekapitulasi Kehadiran
            </h1>
            {periods.length > 0 && (
              <Badge variant="outline" className="text-[11px] border-primary/30 text-primary">
                {periods.find((p) => p.is_active)?.name || periods[0]?.name}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Check-in/out harian mahasiswa klinik RSUD Bulukumba, persetujuan pembimbing ruangan, dan rekap kepatuhan dinas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingAttendances.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkApprove}
              disabled={isPending}
              className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              Setujui Semua Hari Ini ({pendingAttendances.length})
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsMobileCheckinOpen(true)}
            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            <Smartphone className="h-4 w-4" />
            <span>Presensi Mobile (GPS &amp; Biometrik)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsManualOpen(true)}
            className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Manual / Izin</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "today"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ListChecks className="h-3.5 w-3.5" />
          <span>Presensi Hari Ini &amp; Approval</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activeTab === "today"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {initialAttendances.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "summary"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Rekapitulasi Kehadiran (% Rate)</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] ${
              activeTab === "summary"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {summaryData.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("terminal")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "terminal"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>Terminal Presensi Digital</span>
        </button>
      </div>

      {/* TAB 1: PRESENSI HARI INI & PERSATUJUAN */}
      {activeTab === "today" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari mahasiswa, NIM, atau ruangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 text-xs w-36"
              />

              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
              >
                <option value="all">Semua Ruangan</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedShiftFilter}
                onChange={(e) => setSelectedShiftFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
              >
                <option value="all">Semua Shift Dinas</option>
                {effectiveShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
              >
                <option value="all">Semua Approval</option>
                <option value="approved">Telah Disetujui</option>
                <option value="pending">Menunggu Review</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <Card className="border-border/80">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="w-[200px]">Mahasiswa</TableHead>
                      <TableHead>Ruangan Dinas</TableHead>
                      <TableHead className="text-center">Shift Dinas</TableHead>
                      <TableHead className="text-center">Jam Masuk</TableHead>
                      <TableHead className="text-center">Jam Pulang</TableHead>
                      <TableHead className="text-center">Metode &amp; Lokasi</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Approval</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {filteredAttendances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                          Belum ada log presensi untuk tanggal terpilih ({selectedDate}).
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendances.map((att) => (
                        <TableRow key={att.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="font-semibold text-foreground">
                              {att.students?.full_name || "Mahasiswa"}
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              NIM: {att.students?.nim || "-"} &bull;{" "}
                              {att.students?.institutions?.name || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground flex items-center gap-1.5">
                              <DoorClosed className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{att.rooms_units?.name || "-"}</span>
                            </div>
                            {att.notes && (
                              <p className="text-[10px] text-muted-foreground italic mt-0.5">
                                Catatan: {att.notes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {att.shift_name ? (
                              <div className="flex flex-col items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/30"
                                >
                                  {att.shift_name}
                                </Badge>
                                {att.is_late ? (
                                  <span className="text-[9px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded px-1.5 py-0.5">
                                    Terlambat {att.late_minutes ?? 0}m
                                  </span>
                                ) : att.check_in_time ? (
                                  <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                                    Tepat Waktu
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono text-foreground font-semibold">
                            {formatTime(att.check_in_time)}
                          </TableCell>
                          <TableCell className="text-center font-mono text-muted-foreground">
                            {formatTime(att.check_out_time)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              {att.verification_method === "fingerprint" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-sky-50 text-sky-700 border-sky-300 gap-1"
                                >
                                  <Fingerprint className="h-3 w-3 text-sky-600" />
                                  Sidik Jari HP
                                </Badge>
                              )}
                              {att.verification_method === "face_id" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-purple-50 text-purple-700 border-purple-300 gap-1"
                                >
                                  <Eye className="h-3 w-3 text-purple-600" />
                                  Face ID HP
                                </Badge>
                              )}
                              {att.verification_method === "camera_selfie" && (
                                <div className="flex items-center gap-1">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 gap-1"
                                  >
                                    <Camera className="h-3 w-3 text-amber-600" />
                                    Selfie
                                  </Badge>
                                  {att.selfie_snapshot && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewSelfie({
                                          name: att.students?.full_name || "Mahasiswa",
                                          url: att.selfie_snapshot!,
                                          time: att.check_in_time,
                                          distance: att.distance_meters,
                                        })
                                      }
                                      className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                      title="Lihat Foto Selfie"
                                    >
                                      <Eye className="h-3.5 w-3.5 text-primary" />
                                    </button>
                                  )}
                                </div>
                              )}
                              {!att.verification_method && (
                                <span className="text-[10px] text-muted-foreground">Terminal / Web</span>
                              )}

                              {att.distance_meters !== undefined && att.distance_meters !== null && (
                                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-mono">
                                  <MapPin className="h-2.5 w-2.5 text-primary shrink-0" />
                                  <span>{Math.round(att.distance_meters)}m RSUD</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <AttendanceStatusBadge status={att.status} />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                att.is_approved
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}
                            >
                              {att.is_approved ? "Disetujui" : "Menunggu Review"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!att.is_approved ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(att.id, true)}
                                  disabled={isPending}
                                  className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title="Setujui Kehadiran"
                                >
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Setujui
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(att.id, false)}
                                  disabled={isPending}
                                  className="h-7 px-2 text-[10px] text-muted-foreground"
                                  title="Batalkan Persetujuan"
                                >
                                  Batal
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: REKAPITULASI KEHADIRAN (% RATE) */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Rata-Rata Kehadiran Mahasiswa
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-1">{avgPercentage}%</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  %
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Memenuhi Syarat Evaluasi (&ge; 80%)
                  </span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {eligibleCount} / {totalStudents} Mahasiswa
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Perlu Perhatian / Remediasi (&lt; 80%)
                  </span>
                  <p className="text-2xl font-bold text-rose-600 mt-1">
                    {totalStudents - eligibleCount} Mahasiswa
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Filter */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari mahasiswa atau ruangan stase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Summary Table */}
          <Card className="border-border/80">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="w-[220px]">Mahasiswa</TableHead>
                      <TableHead>Ruangan Stase</TableHead>
                      <TableHead className="text-center">Total Hari</TableHead>
                      <TableHead className="text-center text-emerald-700">Hadir</TableHead>
                      <TableHead className="text-center text-blue-700">Izin</TableHead>
                      <TableHead className="text-center text-amber-700">Sakit</TableHead>
                      <TableHead className="text-center text-rose-700">Alpa</TableHead>
                      <TableHead className="w-[160px]">Tingkat Kehadiran</TableHead>
                      <TableHead className="text-center">Kelayakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {filteredSummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                          Belum ada rekapitulasi data kehadiran penempatan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSummary.map((s, idx) => (
                        <TableRow key={`${s.placement_id}-${idx}`} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="font-semibold text-foreground">{s.student_name}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              {s.student_nim} &bull; {s.institution_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{s.room_name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              Stase ke-{s.rotation_order}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold font-mono">
                            {s.total_records}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-emerald-700">
                            {s.hadir_count}
                          </TableCell>
                          <TableCell className="text-center text-blue-700">{s.izin_count}</TableCell>
                          <TableCell className="text-center text-amber-700">{s.sakit_count}</TableCell>
                          <TableCell className="text-center text-rose-700 font-semibold">
                            {s.alpa_count}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-bold text-foreground">
                                  {s.attendance_percentage}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className={`h-full ${
                                    s.attendance_percentage >= 80
                                      ? "bg-emerald-500"
                                      : s.attendance_percentage >= 70
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${Math.min(100, s.attendance_percentage)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                s.is_eligible
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "border-rose-300 bg-rose-50 text-rose-700"
                              }`}
                            >
                              {s.is_eligible ? "Memenuhi Syarat" : "Kurang (< 80%)"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: TERMINAL PRESENSI DIGITAL */}
      {activeTab === "terminal" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-primary/30 shadow-sm">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                Terminal Presensi Digital Mahasiswa
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                RSUD H. Andi Sulthan Daeng Radja Bulukumba
              </p>
              <div className="mt-2 text-2xl font-mono font-extrabold text-primary tracking-wider">
                {currentTime || "07:30:00"} WITA
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Pilih Mahasiswa &amp; Ruangan Dinas Anda
                </label>
                <select
                  value={terminalPlacementId}
                  onChange={(e) => setTerminalPlacementId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {activePlacements.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.student_nim} - {p.student_name} ({p.room_name} - Stase {p.rotation_order})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Pilihan (Terminal) */}
              {!terminalTodayAtt && terminalStatus === "hadir" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      Shift Dinas Mahasiswa:
                    </span>
                    <span className="text-[10px] text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">
                      Auto-Deteksi Jam
                    </span>
                  </label>
                  <select
                    value={terminalShiftId}
                    onChange={(e) => setTerminalShiftId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden"
                  >
                    {effectiveShifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.start_time} - {s.end_time})
                        {s.is_cross_day ? " [Lintas Hari]" : ""} &bull; Toleransi {s.late_tolerance_minutes}m
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Pilihan */}
              {!terminalTodayAtt && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Status Kehadiran</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTerminalStatus("hadir")}
                      className={`h-9 rounded-lg text-xs font-semibold border transition-all ${
                        terminalStatus === "hadir"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Hadir Dinas
                    </button>
                    <button
                      type="button"
                      onClick={() => setTerminalStatus("izin")}
                      className={`h-9 rounded-lg text-xs font-semibold border transition-all ${
                        terminalStatus === "izin"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Izin
                    </button>
                    <button
                      type="button"
                      onClick={() => setTerminalStatus("sakit")}
                      className={`h-9 rounded-lg text-xs font-semibold border transition-all ${
                        terminalStatus === "sakit"
                          ? "bg-amber-600 text-white border-amber-600"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Sakit
                    </button>
                  </div>
                </div>
              )}

              {/* Catatan jika izin/sakit */}
              {!terminalTodayAtt && terminalStatus !== "hadir" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Keterangan Alasan Izin / Sakit
                  </label>
                  <Input
                    placeholder="Tuliskan alasan permohonan dispensasi..."
                    value={terminalNotes}
                    onChange={(e) => setTerminalNotes(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {/* Status hari ini jika sudah check-in */}
              {terminalTodayAtt && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Anda Telah Melakukan Check-In Hari Ini</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                    Waktu Masuk:{" "}
                    <strong>{formatTime(terminalTodayAtt.check_in_time)} WITA</strong> &bull;
                    Waktu Pulang:{" "}
                    <strong>{formatTime(terminalTodayAtt.check_out_time) || "Belum Check-Out"}</strong>
                  </p>
                </div>
              )}

              {/* Presensi Mobile Cerdas Shortcut Banner */}
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50 p-4 dark:border-emerald-900/60 dark:from-emerald-950/30 dark:to-sky-950/30 space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                        Presensi Mobile Cerdas (GPS &amp; Biometrik)
                        <span className="text-[9px] bg-emerald-600 text-white font-semibold px-1.5 py-0.5 rounded-full">
                          Anti-Fake GPS
                        </span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Radius 250m RSUD Bulukumba &bull; Sidik Jari / Face ID HP / Liveness Selfie
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsMobileCheckinOpen(true)}
                    className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shrink-0 shadow-xs w-full sm:w-auto"
                  >
                    <Fingerprint className="h-3.5 w-3.5" />
                    Buka Presensi Mobile
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {!terminalTodayAtt ? (
                  <Button
                    type="button"
                    onClick={handleTerminalCheckIn}
                    disabled={isPending || !terminalPlacementId}
                    className="w-full h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    Check-In Masuk Dinas Sekarang
                  </Button>
                ) : !terminalTodayAtt.check_out_time ? (
                  <Button
                    type="button"
                    onClick={() => handleTerminalCheckOut(terminalTodayAtt.id)}
                    disabled={isPending}
                    className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Check-Out Pulang Dinas Sekarang
                  </Button>
                ) : (
                  <div className="p-3 bg-muted/40 rounded-lg text-center text-xs text-muted-foreground">
                    Dinas hari ini telah lengkap (Check-In &amp; Check-Out selesai).
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Dialog Presensi Manual */}
      <ManualAttendanceDialog
        open={isManualOpen}
        onOpenChange={setIsManualOpen}
        activePlacements={activePlacements}
        rooms={rooms}
        shifts={effectiveShifts}
      />

      {/* Modal Dialog Presensi Mobile Cerdas (GPS & Biometrik) */}
      <SmartMobileCheckinDialog
        open={isMobileCheckinOpen}
        onOpenChange={setIsMobileCheckinOpen}
        activePlacements={activePlacements}
        defaultPlacementId={terminalPlacementId}
        shifts={effectiveShifts}
      />

      {/* Modal Preview Liveness Selfie */}
      {previewSelfie && (
        <Dialog
          open={!!previewSelfie}
          onOpenChange={(open) => !open && setPreviewSelfie(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Camera className="h-4 w-4 text-primary" />
                Bukti Liveness Selfie Mahasiswa
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {previewSelfie.name} &bull;{" "}
                {previewSelfie.time
                  ? new Date(previewSelfie.time).toLocaleTimeString("id-ID")
                  : ""}{" "}
                WITA
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-hidden rounded-xl border border-border bg-black aspect-video flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSelfie.url}
                alt={`Selfie ${previewSelfie.name}`}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Jarak ke RSUD:{" "}
                {previewSelfie.distance != null
                  ? `${Math.round(previewSelfie.distance)} meter`
                  : "-"}
              </span>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]"
              >
                Terverifikasi Valid
              </Badge>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
