"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Trash2,
} from "lucide-react"
import {
  RosterScheduleWithRelations,
  RosterSwapWithRelations,
  deleteRosterScheduleAction,
  respondRosterSwapAction,
} from "@/actions/roster"
import { RoomUnit } from "@/types"
import { WorkShift } from "@/lib/validations/shifts"
import { RosterCalendar } from "./roster-calendar"
import { RosterGeneratorDialog } from "./roster-generator-dialog"
import { RosterSwapDialog } from "./roster-swap-dialog"

interface StudentOption {
  id: string
  nim: string
  full_name: string
  room_id: string
}

interface RosterManagerProps {
  initialSchedules: RosterScheduleWithRelations[]
  initialSwaps: RosterSwapWithRelations[]
  rooms: RoomUnit[]
  shifts: WorkShift[]
  students: StudentOption[]
  currentStudentId?: string | null
  isStudent?: boolean
}

export function RosterManager({
  initialSchedules,
  initialSwaps,
  rooms,
  shifts,
  students,
  currentStudentId,
  isStudent = false,
}: RosterManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Tab State
  const [activeTab, setActiveTab] = useState<"calendar" | "matrix" | "swaps">("calendar")

  // Date Nav State
  const now = new Date()
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth() + 1) // 1-12
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Modals
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [isSwapOpen, setIsSwapOpen] = useState(false)
  const [selectedMySchedule, setSelectedMySchedule] = useState<RosterScheduleWithRelations | null>(null)

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  // Filter schedules
  const filteredSchedules = initialSchedules.filter((s) => {
    const matchesRoom = selectedRoomId === "all" || s.room_id === selectedRoomId
    const sDate = new Date(s.date)
    const matchesMonth = sDate.getMonth() + 1 === currentMonth && sDate.getFullYear() === currentYear

    if (!matchesRoom || !matchesMonth) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = s.students?.full_name?.toLowerCase().includes(q)
      const matchNim = s.students?.nim?.toLowerCase().includes(q)
      const matchRoom = s.rooms_units?.name?.toLowerCase().includes(q)
      if (!matchName && !matchNim && !matchRoom) return false
    }

    return true
  })

  // Quick swap handler
  const handleOpenSwap = (schedule: RosterScheduleWithRelations) => {
    setSelectedMySchedule(schedule)
    setIsSwapOpen(true)
  }

  // Delete individual schedule
  const handleDeleteSchedule = (id: string) => {
    if (!confirm("Hapus jadwal dinas ini?")) return
    startTransition(async () => {
      const res = await deleteRosterScheduleAction(id)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  // Approve / reject swap
  const handleRespondSwap = (swapId: string, status: "approved" | "rejected") => {
    startTransition(async () => {
      const res = await respondRosterSwapAction({ swap_id: swapId, status })
      if (res.success) {
        alert(res.message)
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  // Metrics
  const totalSchedules = filteredSchedules.length
  const pagiCount = filteredSchedules.filter((s) => s.work_shifts?.code?.includes("PAGI")).length
  const siangCount = filteredSchedules.filter(
    (s) => s.work_shifts?.code?.includes("SIANG") || s.work_shifts?.code?.includes("SORE")
  ).length
  const malamCount = filteredSchedules.filter((s) => s.work_shifts?.code?.includes("MALAM")).length
  const pendingSwapsCount = initialSwaps.filter((s) => s.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Roster Jaga &amp; Kalender Dinas Mahasiswa
            </h1>
            <Badge variant="outline" className="text-[11px] border-primary/30 text-primary">
              RSUD Bulukumba
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Penjadwalan dinas rotasi klinis (Pagi, Sore, Malam, Libur), kalender jaga interaktif, dan permohonan tukar shift.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isStudent && (
            <Button
              size="sm"
              onClick={() => setIsGeneratorOpen(true)}
              className="text-xs gap-1.5 bg-primary font-semibold shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              <span>Buat Roster Otomatis</span>
            </Button>
          )}

          {isStudent && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (filteredSchedules.length > 0) {
                  handleOpenSwap(filteredSchedules[0])
                } else {
                  alert("Tidak ada jadwal dinas aktif Anda yang dapat diajukan tukar.")
                }
              }}
              className="text-xs gap-1.5 border-primary/30 text-primary font-semibold"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Ajukan Tukar Dinas</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Ringkasan Metrik Shift */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Shift Pagi (Dinas Pagi)</span>
              <Sun className="h-4 w-4 text-sky-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-sky-600 dark:text-sky-400 mt-1">
              {pagiCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            07:00 &ndash; 14:00 WITA
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Shift Siang (Dinas Sore)</span>
              <Sunset className="h-4 w-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-amber-600 dark:text-amber-400 mt-1">
              {siangCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            14:00 &ndash; 21:00 WITA
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Shift Malam (Dinas Malam)</span>
              <Moon className="h-4 w-4 text-indigo-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-indigo-600 dark:text-indigo-400 mt-1">
              {malamCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            21:00 &ndash; 07:00 WITA
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Permohonan Tukar Shift</span>
              <ArrowLeftRight className="h-4 w-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400 mt-1">
              {pendingSwapsCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            {pendingSwapsCount > 0 ? "Menunggu verifikasi pembimbing" : "Semua permohonan selesai"}
          </CardContent>
        </Card>
      </div>

      {/* Navigasi Tab & Toolbar Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            size="sm"
            variant={activeTab === "calendar" ? "default" : "ghost"}
            onClick={() => setActiveTab("calendar")}
            className="text-xs gap-1.5 font-medium"
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Kalender Bulanan</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === "matrix" ? "default" : "ghost"}
            onClick={() => setActiveTab("matrix")}
            className="text-xs gap-1.5 font-medium"
          >
            <Clock className="h-4 w-4" />
            <span>Daftar Jadwal Harian ({filteredSchedules.length})</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === "swaps" ? "default" : "ghost"}
            onClick={() => setActiveTab("swaps")}
            className="text-xs gap-1.5 font-medium"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Tukar Dinas</span>
            {pendingSwapsCount > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4">
                {pendingSwapsCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Month Selector & Room Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Ganti Bulan */}
          <div className="flex items-center rounded-lg border border-border bg-card shadow-2xs">
            <Button
              size="icon"
              variant="ghost"
              onClick={prevMonth}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold px-2 text-foreground min-w-[120px] text-center">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={nextMonth}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Ruangan */}
          {!isStudent && (
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
          )}
        </div>
      </div>

      {/* TAB 1: KALENDER BULANAN */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          <RosterCalendar
            schedules={filteredSchedules}
            currentYear={currentYear}
            currentMonth={currentMonth}
            isStudent={isStudent}
            onRequestSwap={handleOpenSwap}
          />
        </div>
      )}

      {/* TAB 2: DAFTAR JADWAL HARIAN */}
      {activeTab === "matrix" && (
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Daftar Alokasi Jadwal Shift Dinas
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Menampilkan seluruh mahasiswa dan penugasan shift pada {monthNames[currentMonth - 1]} {currentYear}.
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari mahasiswa, NIM, atau ruangan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12 text-center text-xs">No</TableHead>
                    <TableHead className="text-xs">Tanggal</TableHead>
                    <TableHead className="text-xs">Mahasiswa</TableHead>
                    <TableHead className="text-xs">Ruangan Dinas</TableHead>
                    <TableHead className="text-center text-xs">Shift Dinas</TableHead>
                    <TableHead className="text-xs">Jam Operasional</TableHead>
                    <TableHead className="text-xs">Catatan</TableHead>
                    {!isStudent && <TableHead className="text-right text-xs">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {filteredSchedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isStudent ? 7 : 8} className="h-28 text-center text-muted-foreground">
                        Belum ada jadwal dinas yang terdaftar untuk filter ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchedules.map((s, idx) => (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {new Date(s.date).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">
                            {s.students?.full_name || "Mahasiswa"}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            NIM: {s.students?.nim || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground">
                            {s.rooms_units?.name || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {s.shift_id ? (
                            <Badge
                              variant="outline"
                              className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-300"
                            >
                              {s.work_shifts?.name || "Shift Aktif"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] bg-slate-50 text-slate-600 border-slate-200">
                              Lepas Jaga / Libur
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {s.work_shifts
                            ? `${s.work_shifts.start_time.slice(0, 5)} - ${s.work_shifts.end_time.slice(0, 5)} WITA`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground italic text-[11px]">
                          {s.notes || "-"}
                        </TableCell>
                        {!isStudent && (
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSchedule(s.id)}
                              disabled={isPending}
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: PERMOHONAN TUKAR DINAS */}
      {activeTab === "swaps" && (
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold text-foreground">
              Daftar Permohonan Pertukaran Dinas Mahasiswa
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Daftar pertukaran jadwal jaga yang diajukan oleh mahasiswa stase untuk diverifikasi oleh Kepala Ruangan / CI.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12 text-center text-xs">No</TableHead>
                    <TableHead className="text-xs">Tanggal Pengajuan</TableHead>
                    <TableHead className="text-xs">Mahasiswa Pemohon</TableHead>
                    <TableHead className="text-xs">Jadwal Ditukar</TableHead>
                    <TableHead className="text-xs">Rekan Stase Tujuan</TableHead>
                    <TableHead className="text-xs">Alasan</TableHead>
                    <TableHead className="text-center text-xs">Status</TableHead>
                    {!isStudent && <TableHead className="text-right text-xs">Aksi Verifikasi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {initialSwaps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isStudent ? 7 : 8} className="h-28 text-center text-muted-foreground">
                        Belum ada permohonan tukar dinas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialSwaps.map((swap, idx) => (
                      <TableRow key={swap.id} className="hover:bg-muted/30">
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {new Date(swap.created_at).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">
                            {swap.requester_student?.full_name || "Pemohon"}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            NIM: {swap.requester_student?.nim || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground">
                            {swap.requester_schedule?.date} ({swap.requester_schedule?.work_shifts?.name || "Dinas"})
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">
                            {swap.target_student?.full_name || "Rekan Stase"}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            Jadwal: {swap.target_schedule?.date} ({swap.target_schedule?.work_shifts?.name || "Dinas"})
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {swap.reason}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              swap.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : swap.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                          >
                            {swap.status === "approved"
                              ? "Disetujui"
                              : swap.status === "rejected"
                              ? "Ditolak"
                              : "Menunggu Review"}
                          </Badge>
                        </TableCell>
                        {!isStudent && (
                          <TableCell className="text-right">
                            {swap.status === "pending" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => handleRespondSwap(swap.id, "approved")}
                                  disabled={isPending}
                                  className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                  Setujui
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRespondSwap(swap.id, "rejected")}
                                  disabled={isPending}
                                  className="h-7 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  Tolak
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                Selesai
                              </span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generator Modal */}
      {!isStudent && (
        <RosterGeneratorDialog
          open={isGeneratorOpen}
          onOpenChange={setIsGeneratorOpen}
          rooms={rooms}
          students={students}
          selectedRoomId={selectedRoomId}
        />
      )}

      {/* Swap Modal */}
      <RosterSwapDialog
        open={isSwapOpen}
        onOpenChange={setIsSwapOpen}
        mySchedule={selectedMySchedule}
        allRoomSchedules={initialSchedules}
        myStudentId={currentStudentId || ""}
      />
    </div>
  )
}
