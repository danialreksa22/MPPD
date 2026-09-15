"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RoomUnit, Preceptor, Period } from "@/types"
import {
  PlacementWithRelations,
  EligibleStudent,
  deletePlacementAction,
  updatePlacementStatusAction,
} from "@/actions/placements"
import { PlacementStatus } from "@/lib/constants"
import { PlacementStatusBadge } from "./placement-status-badge"
import { SinglePlacementDialog } from "./single-placement-dialog"
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
  CalendarDays,
  Plus,
  Search,
  Calendar,
  DoorClosed,
  User,
  Users,
  Sparkles,
  Trash2,
  CheckCircle2,
  PlayCircle,
  LayoutGrid,
  List,
  Layers,
  ArrowRight,
} from "lucide-react"

interface PlacementManagerProps {
  initialPlacements: PlacementWithRelations[]
  eligibleStudents: EligibleStudent[]
  rooms: RoomUnit[]
  preceptors: Preceptor[]
  periods: Period[]
}

export function PlacementManager({
  initialPlacements,
  eligibleStudents,
  rooms,
  preceptors,
  periods,
}: PlacementManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [periodFilter, setPeriodFilter] = useState<string>("all")
  const [roomFilter, setRoomFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"matrix" | "table" | "rooms">("matrix")

  // Modal dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Status Counts
  const statusCounts = initialPlacements.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Filtered Placements
  const filteredPlacements = initialPlacements.filter((p) => {
    const studentName = p.students?.full_name?.toLowerCase() || ""
    const studentNim = p.students?.nim?.toLowerCase() || ""
    const roomName = p.rooms_units?.name?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()

    const matchesSearch =
      studentName.includes(query) || studentNim.includes(query) || roomName.includes(query)

    const matchesPeriod = periodFilter === "all" || p.period_id === periodFilter
    const matchesRoom = roomFilter === "all" || p.room_id === roomFilter
    const matchesStatus = statusFilter === "all" || p.status === statusFilter

    return matchesSearch && matchesPeriod && matchesRoom && matchesStatus
  })

  // Format Tanggal
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Handle Hapus Penempatan
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus jadwal penempatan untuk ${name}?`)) return

    startTransition(async () => {
      const res = await deletePlacementAction(id)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  // Handle Ubah Status Penempatan
  const handleUpdateStatus = (id: string, newStatus: PlacementStatus) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.set("placement_id", id)
      formData.set("status", newStatus)

      const res = await updatePlacementStatusAction(formData)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.message)
      }
    })
  }

  // Kelompokkan data penempatan per mahasiswa untuk Matrix View
  const studentMatrixMap = new Map<
    string,
    {
      student: NonNullable<PlacementWithRelations["students"]>
      application: NonNullable<PlacementWithRelations["student_applications"]>
      rotations: PlacementWithRelations[]
    }
  >()

  filteredPlacements.forEach((p) => {
    if (p.students) {
      if (!studentMatrixMap.has(p.student_id)) {
        studentMatrixMap.set(p.student_id, {
          student: p.students,
          application: p.student_applications || {
            id: p.application_id,
            application_number: "-",
            status: "-",
          },
          rotations: [],
        })
      }
      studentMatrixMap.get(p.student_id)!.rotations.push(p)
    }
  })

  const studentMatrixList = Array.from(studentMatrixMap.values())

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Penempatan &amp; Penjadwalan Rotasi Praktik
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Alokasikan mahasiswa klinik &amp; MPPD ke ruangan pelayanan, atur jalur rotasi multi-stase, dan tentukan pembimbing CI/DPJP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/penempatan/rotasi">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Rancang Rotasi Multi-Stase</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Plotting Stase Baru</span>
          </Button>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari mahasiswa, NIM, atau ruangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Periode */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
          >
            <option value="all">Semua Periode Gelombang</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Ruangan */}
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
          >
            <option value="all">Semua Ruangan</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="scheduled">Terjadwal ({statusCounts["scheduled"] || 0})</option>
            <option value="active">Aktif Berjalan ({statusCounts["active"] || 0})</option>
            <option value="completed">Selesai ({statusCounts["completed"] || 0})</option>
            <option value="cancelled">Dibatalkan ({statusCounts["cancelled"] || 0})</option>
          </select>

          {/* View Mode Switcher */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "matrix"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tampilan Matriks Rotasi"
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tampilan Tabel Jadwal"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("rooms")}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "rooms"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Tampilan Okupansi Ruangan"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: MATRIX / TIMELINE VIEW */}
      {viewMode === "matrix" && (
        <div className="space-y-3">
          {studentMatrixList.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-muted-foreground">
                Tidak ada data penempatan rotasi yang sesuai dengan filter pencarian.
              </CardContent>
            </Card>
          ) : (
            studentMatrixList.map((item) => (
              <Card key={item.student.id} className="border-border/80 overflow-hidden">
                <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                      {item.student.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">
                          {item.student.full_name}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          ({item.student.nim})
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {item.student.institutions?.name || "-"} &bull;{" "}
                        {item.student.study_programs?.name || "-"}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] self-start sm:self-auto font-mono">
                    Reg: {item.application.application_number}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Alur Rotasi Stase:
                  </div>

                  {/* Horizontal Rotation Timeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {item.rotations
                      .sort((a, b) => a.rotation_order - b.rotation_order)
                      .map((rot) => (
                        <div
                          key={rot.id}
                          className="rounded-lg border border-border p-3 bg-card flex flex-col justify-between gap-2 relative hover:border-primary/50 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                Stase {rot.rotation_order}
                              </span>
                              <PlacementStatusBadge status={rot.status} />
                            </div>

                            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mt-1">
                              <DoorClosed className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{rot.rooms_units?.name || "-"}</span>
                            </h4>

                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span>
                                {formatDate(rot.start_date)} - {formatDate(rot.end_date)}
                              </span>
                            </p>

                            {rot.preceptors && (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">CI/DPJP: {rot.preceptors.name}</span>
                              </p>
                            )}
                          </div>

                          {/* Quick Status Toggle */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px]">
                            <span className="text-muted-foreground">Ubah:</span>
                            <div className="flex items-center gap-1">
                              {rot.status === "scheduled" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(rot.id, "active")}
                                  className="text-emerald-700 hover:underline font-medium"
                                  disabled={isPending}
                                >
                                  Mulai Dinas
                                </button>
                              )}
                              {rot.status === "active" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(rot.id, "completed")}
                                  className="text-slate-700 hover:underline font-medium"
                                  disabled={isPending}
                                >
                                  Selesai
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(rot.id, item.student.full_name)
                                }
                                className="text-rose-600 hover:underline ml-1"
                                disabled={isPending}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === "table" && (
        <Card className="border-border/80">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead className="w-[200px]">Mahasiswa</TableHead>
                    <TableHead>Institusi &amp; Prodi</TableHead>
                    <TableHead>Ruangan Pelayanan</TableHead>
                    <TableHead className="text-center">Stase Ke</TableHead>
                    <TableHead>Rentang Tanggal</TableHead>
                    <TableHead>Pembimbing CI/DPJP</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {filteredPlacements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Tidak ada data penempatan yang sesuai.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlacements.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-semibold text-foreground">
                            {p.students?.full_name || "-"}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            NIM: {p.students?.nim || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-foreground">
                            {p.students?.institutions?.name || "-"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {p.students?.study_programs?.name || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground flex items-center gap-1.5">
                            <DoorClosed className="h-3.5 w-3.5 text-primary" />
                            <span>{p.rooms_units?.name || "-"}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Kapasitas: {p.rooms_units?.capacity} Mahasiswa
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary">
                          #{p.rotation_order}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{formatDate(p.start_date)}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground pl-4">
                            s/d {formatDate(p.end_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {p.preceptors ? (
                            <div>
                              <p className="font-medium text-foreground">{p.preceptors.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {p.preceptors.type === "supervisor_dokter" ? "Dokter DPJP" : "CI"} &bull;{" "}
                                {p.preceptors.specialization}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">
                              Belum ditunjuk
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <PlacementStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {p.status === "scheduled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(p.id, "active")}
                                disabled={isPending}
                                className="h-7 px-2 text-[10px] text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                title="Mulai Dinas Aktif"
                              >
                                <PlayCircle className="h-3 w-3 mr-1" />
                                Mulai
                              </Button>
                            )}
                            {p.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(p.id, "completed")}
                                disabled={isPending}
                                className="h-7 px-2 text-[10px] text-slate-700 border-slate-300 hover:bg-slate-100"
                                title="Selesaikan Stase"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Selesai
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                handleDelete(p.id, p.students?.full_name || "Mahasiswa")
                              }
                              disabled={isPending}
                              className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
      )}

      {/* VIEW 3: ROOM OCCUPANCY VIEW */}
      {viewMode === "rooms" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const activeInRoom = initialPlacements.filter(
              (p) => p.room_id === room.id && p.status === "active"
            )
            const scheduledInRoom = initialPlacements.filter(
              (p) => p.room_id === room.id && p.status === "scheduled"
            )
            const occupied = activeInRoom.length
            const remaining = Math.max(0, room.capacity - occupied)
            const occupancyPct =
              room.capacity > 0 ? Math.min(100, Math.round((occupied / room.capacity) * 100)) : 0

            return (
              <Card key={room.id} className="border-border/80 flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <DoorClosed className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{room.name}</CardTitle>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Kode: {room.code || "-"} &bull; {room.service_type}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        remaining === 0
                          ? "border-rose-300 text-rose-700 bg-rose-50"
                          : occupancyPct >= 80
                          ? "border-amber-300 text-amber-700 bg-amber-50"
                          : "border-emerald-300 text-emerald-700 bg-emerald-50"
                      }`}
                    >
                      {remaining === 0 ? "Penuh" : `${remaining} Sisa`}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  {/* Progress Bar Okupansi */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Daya Tampung: {room.capacity} Mahasiswa</span>
                      <span className="font-semibold text-foreground">
                        {occupied} Aktif ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          remaining === 0
                            ? "bg-rose-500"
                            : occupancyPct >= 80
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Daftar Mahasiswa yang sedang aktif berdinas di ruangan ini */}
                  <div>
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1 mb-1">
                      <Users className="h-3 w-3 text-primary" />
                      Sedang Dinas ({activeInRoom.length}):
                    </span>
                    {activeInRoom.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">
                        Belum ada mahasiswa aktif saat ini.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border/50 max-h-32 overflow-y-auto pr-1 text-[11px]">
                        {activeInRoom.map((p) => (
                          <li key={p.id} className="py-1 flex items-center justify-between">
                            <span className="truncate font-medium text-foreground">
                              {p.students?.full_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                              s/d {formatDate(p.end_date)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {scheduledInRoom.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      &bull; {scheduledInRoom.length} mahasiswa terjadwal untuk periode berikutnya.
                    </p>
                  )}
                </CardContent>

                <div className="p-3 bg-muted/20 border-t border-border/50 flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">
                    Lokasi: {room.location || "Gedung RSUD"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary"
                    onClick={() => {
                      setRoomFilter(room.id)
                      setViewMode("matrix")
                    }}
                  >
                    <span>Lihat Jadwal</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog Single Placement */}
      <SinglePlacementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        eligibleStudents={eligibleStudents}
        rooms={rooms}
        preceptors={preceptors}
        periods={periods}
        defaultPeriodId={periodFilter !== "all" ? periodFilter : undefined}
      />
    </div>
  )
}
