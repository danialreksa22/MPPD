"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createWorkShiftAction,
  updateWorkShiftAction,
  deleteWorkShiftAction,
} from "@/actions/shifts"
import { WorkShift } from "@/lib/validations/shifts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Sunset,
  Moon,
  Check,
} from "lucide-react"

interface ShiftsManagerProps {
  initialShifts: WorkShift[]
}

const COLOR_MAP: Record<string, { badge: string; bg: string; text: string }> = {
  sky: {
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    bg: "bg-sky-500/10 text-sky-600",
    text: "text-sky-600",
  },
  amber: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    bg: "bg-amber-500/10 text-amber-600",
    text: "text-amber-600",
  },
  indigo: {
    badge: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-500/10 text-indigo-600",
    text: "text-indigo-600",
  },
  emerald: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/10 text-emerald-600",
    text: "text-emerald-600",
  },
  purple: {
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
    bg: "bg-purple-500/10 text-purple-600",
    text: "text-purple-600",
  },
  rose: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    bg: "bg-rose-500/10 text-rose-600",
    text: "text-rose-600",
  },
}

export function ShiftsManager({ initialShifts }: ShiftsManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [shifts, setShifts] = useState<WorkShift[]>(initialShifts)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WorkShift | null>(null)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<WorkShift | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  // Form State
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formStartTime, setFormStartTime] = useState("07:00")
  const [formEndTime, setFormEndTime] = useState("14:00")
  const [formCheckInStart, setFormCheckInStart] = useState("06:30")
  const [formCheckInEnd, setFormCheckInEnd] = useState("08:30")
  const [formCheckOutStart, setFormCheckOutStart] = useState("14:00")
  const [formCheckOutEnd, setFormCheckOutEnd] = useState("16:00")
  const [formLateTolerance, setFormLateTolerance] = useState(15)
  const [formIsCrossDay, setFormIsCrossDay] = useState(false)
  const [formColor, setFormColor] = useState<"sky" | "amber" | "indigo" | "emerald" | "purple" | "rose">("sky")
  const [formDescription, setFormDescription] = useState("")
  const [formIsActive, setFormIsActive] = useState(true)

  const resetForm = () => {
    setFormName("")
    setFormCode("")
    setFormStartTime("07:00")
    setFormEndTime("14:00")
    setFormCheckInStart("06:30")
    setFormCheckInEnd("08:30")
    setFormCheckOutStart("14:00")
    setFormCheckOutEnd("16:00")
    setFormLateTolerance(15)
    setFormIsCrossDay(false)
    setFormColor("sky")
    setFormDescription("")
    setFormIsActive(true)
    setEditingItem(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (item: WorkShift) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormCode(item.code)
    setFormStartTime(item.start_time.slice(0, 5))
    setFormEndTime(item.end_time.slice(0, 5))
    setFormCheckInStart(item.check_in_start.slice(0, 5))
    setFormCheckInEnd(item.check_in_end.slice(0, 5))
    setFormCheckOutStart(item.check_out_start.slice(0, 5))
    setFormCheckOutEnd(item.check_out_end.slice(0, 5))
    setFormLateTolerance(item.late_tolerance_minutes)
    setFormIsCrossDay(item.is_cross_day)
    setFormColor((item.color as "sky" | "amber" | "indigo" | "emerald" | "purple" | "rose") || "sky")
    setFormDescription(item.description || "")
    setFormIsActive(item.is_active)
    setIsDialogOpen(true)
  }

  // Filtered data
  const filteredShifts = shifts.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? item.is_active : !item.is_active)

    return matchesSearch && matchesStatus
  })

  // Summary counts
  const totalCount = shifts.length
  const pagiCount = shifts.filter((s) => s.code.includes("PAGI") && s.is_active).length
  const siangCount = shifts.filter((s) => s.code.includes("SIANG") && s.is_active).length
  const malamCount = shifts.filter((s) => (s.code.includes("MALAM") || s.is_cross_day) && s.is_active).length

  // Save handler
  const handleSave = () => {
    if (!formName.trim() || !formCode.trim()) {
      setFeedback({ message: "Nama dan kode shift wajib diisi.", isError: true })
      return
    }

    setFeedback(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("name", formName.trim())
      formData.set("code", formCode.trim().toUpperCase())
      formData.set("start_time", formStartTime)
      formData.set("end_time", formEndTime)
      formData.set("check_in_start", formCheckInStart)
      formData.set("check_in_end", formCheckInEnd)
      formData.set("check_out_start", formCheckOutStart)
      formData.set("check_out_end", formCheckOutEnd)
      formData.set("late_tolerance_minutes", String(formLateTolerance))
      formData.set("is_cross_day", String(formIsCrossDay))
      formData.set("color", formColor)
      formData.set("description", formDescription.trim())
      formData.set("is_active", String(formIsActive))

      let res
      if (editingItem) {
        res = await updateWorkShiftAction(editingItem.id, formData)
      } else {
        res = await createWorkShiftAction(formData)
      }

      if (res.success) {
        setFeedback({ message: res.message, isError: false })
        setIsDialogOpen(false)

        if (editingItem) {
          setShifts((prev) =>
            prev.map((s) =>
              s.id === editingItem.id
                ? {
                    ...s,
                    name: formName.trim(),
                    code: formCode.trim().toUpperCase(),
                    start_time: formStartTime,
                    end_time: formEndTime,
                    check_in_start: formCheckInStart,
                    check_in_end: formCheckInEnd,
                    check_out_start: formCheckOutStart,
                    check_out_end: formCheckOutEnd,
                    late_tolerance_minutes: formLateTolerance,
                    is_cross_day: formIsCrossDay,
                    color: formColor,
                    description: formDescription.trim() || null,
                    is_active: formIsActive,
                  }
                : s
            )
          )
        } else {
          const newId = (res.data as { id?: string })?.id || `shift-${Date.now()}`
          const newShift: WorkShift = {
            id: newId,
            name: formName.trim(),
            code: formCode.trim().toUpperCase(),
            start_time: formStartTime,
            end_time: formEndTime,
            check_in_start: formCheckInStart,
            check_in_end: formCheckInEnd,
            check_out_start: formCheckOutStart,
            check_out_end: formCheckOutEnd,
            late_tolerance_minutes: formLateTolerance,
            is_cross_day: formIsCrossDay,
            color: formColor,
            description: formDescription.trim() || null,
            is_active: formIsActive,
          }
          setShifts((prev) => [...prev, newShift])
        }

        resetForm()
        router.refresh()
      } else {
        setFeedback({ message: res.message || "Gagal menyimpan shift", isError: true })
      }
    })
  }

  // Delete handler
  const handleDelete = (id: string) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await deleteWorkShiftAction(id)
      if (res.success) {
        setFeedback({ message: res.message, isError: false })
        setShifts((prev) => prev.filter((s) => s.id !== id))
        setDeleteConfirmItem(null)
        router.refresh()
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs shadow-xs ${
            feedback.isError
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold underline hover:opacity-80 ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Shift Terdaftar</span>
              <Clock className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading mt-1 text-foreground">
              {totalCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Standar shift dinas RSUD Bulukumba
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Shift Pagi</span>
              <Sun className="h-4 w-4 text-sky-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-sky-700 dark:text-sky-400 mt-1">
              {pagiCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Dinas pagi ruangan &amp; poliklinik
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Shift Siang / Sore</span>
              <Sunset className="h-4 w-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-amber-700 dark:text-amber-400 mt-1">
              {siangCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Dinas siang perawatan &amp; IGD
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Shift Malam / Jaga</span>
              <Moon className="h-4 w-4 text-indigo-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-indigo-700 dark:text-indigo-400 mt-1">
              {malamCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Dinas jaga malam lintas hari
          </CardContent>
        </Card>
      </div>

      {/* Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5 w-full">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama shift, kode..."
              className="pl-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val || "all")}
          >
            <SelectTrigger className="h-9 w-full sm:w-40 text-xs">
              <SelectValue placeholder="Status Aktif" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Semua Status
              </SelectItem>
              <SelectItem value="active" className="text-xs">
                Aktif Saja
              </SelectItem>
              <SelectItem value="inactive" className="text-xs">
                Nonaktif
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="h-9 text-xs gap-1.5 font-semibold shrink-0 shadow-sm w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Shift Baru</span>
        </Button>
      </div>

      {/* Table of Shifts */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs">
              <TableHead className="w-12 text-center">No</TableHead>
              <TableHead>Nama &amp; Kode Shift</TableHead>
              <TableHead>Jam Dinas</TableHead>
              <TableHead>Jendela Check-In</TableHead>
              <TableHead>Jendela Check-Out</TableHead>
              <TableHead className="text-center">Toleransi Telat</TableHead>
              <TableHead className="text-center">Lintas Hari</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-xs">
                  Tidak ada shift dinas yang sesuai dengan filter pencarian.
                </TableCell>
              </TableRow>
            ) : (
              filteredShifts.map((item, index) => {
                const colorStyle = COLOR_MAP[item.color] || COLOR_MAP.sky

                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors text-xs">
                    <TableCell className="text-center font-mono text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    {/* Nama & Kode Shift */}
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{item.name}</span>
                          <Badge
                            variant="outline"
                            className={`px-1.5 py-0 text-[10px] font-bold border ${colorStyle.badge}`}
                          >
                            {item.code}
                          </Badge>
                        </div>
                        {item.description && (
                          <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Jam Dinas */}
                    <TableCell>
                      <span className="font-mono font-bold text-foreground">
                        {item.start_time} – {item.end_time}
                      </span>
                    </TableCell>

                    {/* Jendela Check-in */}
                    <TableCell>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {item.check_in_start} s/d {item.check_in_end}
                      </span>
                    </TableCell>

                    {/* Jendela Check-out */}
                    <TableCell>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {item.check_out_start} s/d {item.check_out_end}
                      </span>
                    </TableCell>

                    {/* Toleransi */}
                    <TableCell className="text-center">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        +{item.late_tolerance_minutes} mnt
                      </span>
                    </TableCell>

                    {/* Lintas Hari */}
                    <TableCell className="text-center">
                      {item.is_cross_day ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                        >
                          Lintas Hari
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">-</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <Badge
                        variant={item.is_active ? "default" : "secondary"}
                        className={`text-[10px] ${
                          item.is_active
                            ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(item)}
                          disabled={isPending}
                          title="Edit Shift"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmItem(item)}
                          disabled={isPending}
                          title="Hapus Shift"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL FORM: CREATE / EDIT SHIFT */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-heading flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>
                {editingItem ? "Ubah Konfigurasi Shift Dinas" : "Tambah Shift Dinas Baru"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atur jam kerja, jendela waktu check-in/out, toleransi keterlambatan, dan status dinas malam.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {/* Nama & Kode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="shift-name" className="text-xs font-semibold">
                  Nama Shift
                </Label>
                <Input
                  id="shift-name"
                  placeholder="Contoh: Shift Pagi (Dinas Pagi)"
                  className="h-9 text-xs font-medium"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shift-code" className="text-xs font-semibold">
                  Kode Shift
                </Label>
                <Input
                  id="shift-code"
                  placeholder="PAGI"
                  className="h-9 text-xs font-mono uppercase font-bold"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {/* Jam Dinas Masuk & Pulang */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="start-time" className="text-xs font-semibold">
                  Jam Masuk Dinas (Mulai)
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  className="h-9 text-xs font-mono font-medium"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="end-time" className="text-xs font-semibold">
                  Jam Pulang Dinas (Selesai)
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  className="h-9 text-xs font-mono font-medium"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Jendela Check-in */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-2.5">
              <span className="font-semibold text-xs text-foreground">
                Jendela Waktu Check-In Mahasiswa
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Mulai Buka Check-In</Label>
                  <Input
                    type="time"
                    className="h-8 text-xs font-mono"
                    value={formCheckInStart}
                    onChange={(e) => setFormCheckInStart(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Batas Akhir Check-In</Label>
                  <Input
                    type="time"
                    className="h-8 text-xs font-mono"
                    value={formCheckInEnd}
                    onChange={(e) => setFormCheckInEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Jendela Check-out */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-2.5">
              <span className="font-semibold text-xs text-foreground">
                Jendela Waktu Check-Out Mahasiswa
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Mulai Buka Check-Out</Label>
                  <Input
                    type="time"
                    className="h-8 text-xs font-mono"
                    value={formCheckOutStart}
                    onChange={(e) => setFormCheckOutStart(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Batas Akhir Check-Out</Label>
                  <Input
                    type="time"
                    className="h-8 text-xs font-mono"
                    value={formCheckOutEnd}
                    onChange={(e) => setFormCheckOutEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Toleransi Keterlambatan & Warna Badge */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="late-tol" className="text-xs font-semibold">
                  Toleransi Telat (Menit)
                </Label>
                <Input
                  id="late-tol"
                  type="number"
                  min={0}
                  max={120}
                  className="h-9 text-xs font-mono"
                  value={formLateTolerance}
                  onChange={(e) => setFormLateTolerance(parseInt(e.target.value, 10) || 0)}
                />
                <span className="text-[10px] text-muted-foreground">
                  Lewat dari {formStartTime} + {formLateTolerance} mnt dicatat &ldquo;Terlambat&rdquo;
                </span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Warna Penanda Shift</Label>
                <Select
                  value={formColor}
                  onValueChange={(val) => {
                    if (val) setFormColor(val as "sky" | "amber" | "indigo" | "emerald" | "purple" | "rose")
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sky">Sky (Biru Terang / Pagi)</SelectItem>
                    <SelectItem value="amber">Amber (Oranye / Sore)</SelectItem>
                    <SelectItem value="indigo">Indigo (Ungu / Malam)</SelectItem>
                    <SelectItem value="emerald">Emerald (Hijau / Full Day)</SelectItem>
                    <SelectItem value="purple">Purple (Ungu Tua)</SelectItem>
                    <SelectItem value="rose">Rose (Merah Muda)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1">
              <Label htmlFor="shift-desc" className="text-xs font-semibold">
                Keterangan / Ruangan Terkait (Opsional)
              </Label>
              <Input
                id="shift-desc"
                placeholder="Contoh: Dinas pagi ruangan rawat inap, ICU, IGD"
                className="h-9 text-xs"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Checkbox Options */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formIsCrossDay}
                  onChange={(e) => setFormIsCrossDay(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    Dinas Lintas Hari / Lewat Tengah Malam
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Centang untuk dinas jaga malam (contoh: 21:00 s.d. 07:00 hari berikutnya).
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="font-medium text-foreground">
                  Status Shift Aktif
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold shadow-sm"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{editingItem ? "Simpan Perubahan" : "Tambahkan Shift"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <Dialog
        open={Boolean(deleteConfirmItem)}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-heading text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Hapus Shift Dinas</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus shift dinas{" "}
              <strong className="text-foreground">{deleteConfirmItem?.name}</strong>? Tindakan ini akan tercatat pada log audit sistem.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmItem(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem.id)}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Ya, Hapus Shift</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
