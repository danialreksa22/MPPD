"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftRight, Loader2, Calendar, Clock, AlertTriangle } from "lucide-react"
import { RosterScheduleWithRelations, requestRosterSwapAction } from "@/actions/roster"

interface RosterSwapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mySchedule: RosterScheduleWithRelations | null
  allRoomSchedules: RosterScheduleWithRelations[]
  myStudentId: string
}

export function RosterSwapDialog({
  open,
  onOpenChange,
  mySchedule,
  allRoomSchedules,
  myStudentId,
}: RosterSwapDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Jadwal rekan stase lain (bukan milik mahasiswa ini dan punya shift)
  const peerSchedules = allRoomSchedules.filter(
    (s) => s.student_id !== myStudentId && s.shift_id !== null
  )

  const [targetScheduleId, setTargetScheduleId] = useState<string>(
    peerSchedules[0]?.id || ""
  )
  const [reason, setReason] = useState<string>("")

  const selectedTargetSchedule = peerSchedules.find((s) => s.id === targetScheduleId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mySchedule) return
    if (!selectedTargetSchedule) {
      alert("Silakan pilih jadwal rekan stase yang bersedia bertukar shift.")
      return
    }
    if (!reason.trim()) {
      alert("Alasan tukar dinas wajib diisi.")
      return
    }

    startTransition(async () => {
      const res = await requestRosterSwapAction({
        requester_schedule_id: mySchedule.id,
        requester_student_id: myStudentId,
        target_schedule_id: selectedTargetSchedule.id,
        target_student_id: selectedTargetSchedule.student_id,
        reason: reason.trim(),
      })

      if (res.success) {
        alert(res.message)
        onOpenChange(false)
        router.refresh()
      } else {
        alert(res.message || "Gagal mengajukan tukar dinas.")
      }
    })
  }

  if (!mySchedule) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Pengajuan Tukar Dinas Mahasiswa
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ajukan permohonan pertukaran shift dinas dengan rekan stase di ruangan yang sama. Permohonan akan diverifikasi oleh Kepala Ruangan / CI.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Kartu Jadwal Anda Saat Ini */}
          <div className="p-3 bg-muted/30 rounded-xl border border-border space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Jadwal Dinas Anda yang Ingin Ditukar:
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {mySchedule.date} ({mySchedule.rooms_units?.name || "Ruangan"})
              </span>
              <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/30">
                {mySchedule.work_shifts?.name || "Shift Terjadwal"}
              </Badge>
            </div>
          </div>

          {/* Pilih Jadwal Rekan yang Akan Ditukar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Pilih Rekan Stase &amp; Jadwal Tujuannya:
            </label>
            {peerSchedules.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                Tidak ditemukan jadwal rekan stase lain yang tersedia untuk ditukar pada periode ini.
              </div>
            ) : (
              <select
                value={targetScheduleId}
                onChange={(e) => setTargetScheduleId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden"
                required
              >
                {peerSchedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.students?.full_name} &bull; {s.date} ({s.work_shifts?.name || "Dinas"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Alasan Tukar Dinas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Alasan Permohonan Tukar Dinas:
            </label>
            <Textarea
              placeholder="Contoh: Mengikuti ujian proposal / kepentingan darurat keluarga"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || peerSchedules.length === 0}
              className="text-xs gap-1.5 bg-primary font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Mengirimkan...</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>Kirim Permohonan Tukar Dinas</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
