"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RoomUnit } from "@/types"
import { manualRecordAttendanceAction } from "@/actions/attendances"
import { AttendanceStatus } from "@/lib/constants"
import { WorkShift, DEFAULT_SHIFTS } from "@/lib/validations/shifts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Layers,
} from "lucide-react"

interface PlacementOption {
  id: string
  student_id: string
  student_name: string
  student_nim: string
  room_id: string
  room_name: string
  rotation_order: number
}

interface ManualAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activePlacements: PlacementOption[]
  rooms?: RoomUnit[]
  shifts?: WorkShift[]
}

export function ManualAttendanceDialog({
  open,
  onOpenChange,
  activePlacements,
  shifts = DEFAULT_SHIFTS,
}: ManualAttendanceDialogProps) {
  const effectiveShifts = shifts.length > 0 ? shifts : DEFAULT_SHIFTS
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split("T")[0]

  const [selectedPlacementId, setSelectedPlacementId] = useState<string>("")
  const [selectedShiftId, setSelectedShiftId] = useState<string>(
    effectiveShifts[0]?.id || "shift-pagi"
  )
  const [date, setDate] = useState<string>(todayStr)
  const [status, setStatus] = useState<AttendanceStatus>("hadir")
  const [checkInTime, setCheckInTime] = useState<string>(
    effectiveShifts[0]?.start_time || "07:00"
  )
  const [checkOutTime, setCheckOutTime] = useState<string>(
    effectiveShifts[0]?.end_time || "14:00"
  )
  const [notes, setNotes] = useState<string>("")

  const currentPlacement = activePlacements.find((p) => p.id === selectedPlacementId)
  const currentShift = effectiveShifts.find((s) => s.id === selectedShiftId) || effectiveShifts[0]

  const handleShiftChange = (shiftId: string) => {
    setSelectedShiftId(shiftId)
    const found = effectiveShifts.find((s) => s.id === shiftId)
    if (found) {
      setCheckInTime(found.start_time)
      setCheckOutTime(found.end_time)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!selectedPlacementId || !currentPlacement) {
      setErrorMsg("Mahasiswa dan jadwal penempatan wajib dipilih")
      return
    }
    if (!date) {
      setErrorMsg("Tanggal dinas wajib diisi")
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set("student_id", currentPlacement.student_id)
      formData.set("placement_id", currentPlacement.id)
      formData.set("room_id", currentPlacement.room_id)
      formData.set("shift_id", currentShift ? currentShift.id : "")
      formData.set("shift_name", currentShift ? currentShift.name : "")
      formData.set("date", date)
      formData.set("status", status)
      formData.set("check_in_time", status === "hadir" ? checkInTime : "")
      formData.set("check_out_time", status === "hadir" ? checkOutTime : "")
      formData.set("notes", notes)

      const res = await manualRecordAttendanceAction(formData)
      if (res.success) {
        setSuccessMsg(res.message)
        setTimeout(() => {
          onOpenChange(false)
          setSuccessMsg(null)
          router.refresh()
        }, 1200)
      } else {
        setErrorMsg(res.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Pencatatan Presensi Manual &amp; Dispensasi
          </DialogTitle>
          <DialogDescription className="text-xs">
            Catat kehadiran secara manual untuk mahasiswa dinas luar atau pengajuan dispensasi izin/sakit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mahasiswa & Penempatan */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Pilih Mahasiswa &amp; Ruangan Dinas <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedPlacementId}
              onChange={(e) => setSelectedPlacementId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">-- Pilih Mahasiswa / Penempatan --</option>
              {activePlacements.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.student_nim} - {p.student_name} ({p.room_name} - Stase {p.rotation_order})
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal Dinas & Status Kehadiran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Tanggal Dinas <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Status Kehadiran <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="hadir">Hadir Dinas</option>
                <option value="izin">Izin (Dispensasi)</option>
                <option value="sakit">Sakit</option>
                <option value="alpa">Alpa / Tanpa Keterangan</option>
              </select>
            </div>
          </div>

          {/* Shift Dinas (hanya jika hadir) */}
          {status === "hadir" && (
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Pilih Shift Dinas
              </label>
              <select
                value={selectedShiftId}
                onChange={(e) => handleShiftChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {effectiveShifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.start_time} - {shift.end_time})
                    {shift.is_cross_day ? " [Lintas Hari]" : ""} &bull; Toleransi {shift.late_tolerance_minutes}m
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Jam Masuk & Jam Pulang (hanya jika hadir) */}
          {status === "hadir" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Jam Check-In Masuk</label>
                <Input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Jam Check-Out Pulang</label>
                <Input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          {/* Catatan / Alasan Izin */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">
              Catatan / Keterangan Dispensasi
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Mengikuti simposium ilmiah atau surat dokter terlampir."
              rows={2}
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Simpan Presensi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
