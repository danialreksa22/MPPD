"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RoomUnit, Preceptor, Period } from "@/types"
import { EligibleStudent, createSinglePlacementAction } from "@/actions/placements"
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
  CalendarPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  DoorClosed,
  GraduationCap,
} from "lucide-react"

interface SinglePlacementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eligibleStudents: EligibleStudent[]
  rooms: RoomUnit[]
  preceptors: Preceptor[]
  periods: Period[]
  defaultPeriodId?: string
}

export function SinglePlacementDialog({
  open,
  onOpenChange,
  eligibleStudents,
  rooms,
  preceptors,
  periods,
  defaultPeriodId,
}: SinglePlacementDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    defaultPeriodId || (periods[0]?.id ?? "")
  )
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || "")
  const [selectedPreceptorId, setSelectedPreceptorId] = useState<string>("")
  const [rotationOrder, setRotationOrder] = useState<number>(1)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  // Cari mahasiswa terpilih untuk auto-fill data pengajuan
  const currentStudent = eligibleStudents.find((s) => s.id === selectedStudentId)

  // Filter pembimbing yang aktif
  const activePreceptors = preceptors.filter((p) => p.is_active)

  // Ruangan terpilih
  const currentRoom = rooms.find((r) => r.id === selectedRoomId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!selectedStudentId) {
      setErrorMsg("Mahasiswa wajib dipilih")
      return
    }
    if (!selectedPeriodId) {
      setErrorMsg("Periode gelombang praktik wajib dipilih")
      return
    }
    if (!selectedRoomId) {
      setErrorMsg("Ruangan pelayanan wajib dipilih")
      return
    }
    if (!startDate || !endDate) {
      setErrorMsg("Rentang tanggal mulai dan selesai stase wajib diisi")
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg("Tanggal selesai tidak boleh lebih awal dari tanggal mulai")
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set("student_id", selectedStudentId)
      formData.set("application_id", currentStudent?.application_id || "")
      formData.set("period_id", selectedPeriodId)
      formData.set("room_id", selectedRoomId)
      formData.set("preceptor_id", selectedPreceptorId)
      formData.set("rotation_order", String(rotationOrder))
      formData.set("start_date", startDate)
      formData.set("end_date", endDate)
      formData.set("status", "scheduled")

      const res = await createSinglePlacementAction(formData)
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-base">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Plotting Jadwal Penempatan Mahasiswa
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tetapkan mahasiswa yang telah diverifikasi ke ruangan pelayanan dan tentukan pembimbing
            klinik pendamping.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mahasiswa Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Pilih Mahasiswa Siap Penempatan <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">-- Pilih Mahasiswa --</option>
              {eligibleStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nim} - {s.full_name} ({s.institution_name})
                </option>
              ))}
            </select>
            {currentStudent && (
              <div className="rounded-md bg-muted/40 border border-border p-2 text-[11px] text-muted-foreground flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span>
                  Prodi: <strong>{currentStudent.study_program_name}</strong> &bull; No. Reg:{" "}
                  <strong>{currentStudent.application_number}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Gelombang / Periode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Periode Gelombang Praktik <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.academic_year})
                </option>
              ))}
            </select>
          </div>

          {/* Ruangan & Urutan Stase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <DoorClosed className="h-3.5 w-3.5 text-primary" />
                Ruangan Pelayanan <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Kapasitas: {r.capacity})
                  </option>
                ))}
              </select>
              {currentRoom && (
                <p className="text-[10px] text-muted-foreground">
                  Jenis: {currentRoom.service_type} &bull; Daya Tampung: {currentRoom.capacity}{" "}
                  Mahasiswa
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Urutan Stase</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={rotationOrder}
                onChange={(e) => setRotationOrder(parseInt(e.target.value) || 1)}
                className="h-9 text-xs"
                required
              />
              <p className="text-[10px] text-muted-foreground">Stase ke-1, 2, 3...</p>
            </div>
          </div>

          {/* Pembimbing Preseptor / CI */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Pembimbing Klinik / CI / DPJP (Opsional)
            </label>
            <select
              value={selectedPreceptorId}
              onChange={(e) => setSelectedPreceptorId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">-- Tetapkan Nanti / Belum Ditunjuk --</option>
              {activePreceptors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type === "supervisor_dokter" ? "Dokter Spesialis DPJP" : "CI"}) -{" "}
                  {p.specialization}
                </option>
              ))}
            </select>
          </div>

          {/* Rentang Tanggal Stase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tanggal Mulai Stase <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tanggal Selesai Stase <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
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
              Simpan Jadwal Penempatan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
