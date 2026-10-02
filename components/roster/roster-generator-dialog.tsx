"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Calendar, Users, Layers, AlertCircle } from "lucide-react"
import { generateBatchRosterAction } from "@/actions/roster"
import { RoomUnit } from "@/types"

interface StudentOption {
  id: string
  nim: string
  full_name: string
  room_id: string
}

interface RosterGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rooms: RoomUnit[]
  students: StudentOption[]
  selectedRoomId?: string
}

export function RosterGeneratorDialog({
  open,
  onOpenChange,
  rooms,
  students,
  selectedRoomId = "all",
}: RosterGeneratorDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const todayStr = new Date().toISOString().split("T")[0]
  const defaultEndStr = new Date(Date.now() + 27 * 86400000).toISOString().split("T")[0]

  const [roomId, setRoomId] = useState<string>(
    selectedRoomId !== "all" ? selectedRoomId : rooms[0]?.id || ""
  )
  const [startDate, setStartDate] = useState<string>(todayStr)
  const [endDate, setEndDate] = useState<string>(defaultEndStr)
  const [pattern, setPattern] = useState<"pagi_siang_malam_libur" | "pagi_siang_libur" | "pagi_only" | "rotasi_kelompok">(
    "pagi_siang_malam_libur"
  )
  const [notes, setNotes] = useState<string>("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  // Mahasiswa di ruangan terpilih
  const roomStudents = students.filter((s) => s.room_id === roomId)

  // Otomatis pilih semua mahasiswa di ruangan saat ruangan berubah
  React.useEffect(() => {
    if (roomStudents.length > 0) {
      setSelectedStudentIds(roomStudents.map((s) => s.id))
    } else {
      setSelectedStudentIds([])
    }
  }, [roomId, students])

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === roomStudents.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(roomStudents.map((s) => s.id))
    }
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId) {
      alert("Silakan pilih ruangan dinas terlebih dahulu.")
      return
    }
    if (selectedStudentIds.length === 0) {
      alert("Pilih minimal satu mahasiswa untuk dijadwalkan.")
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("Tanggal mulai tidak boleh lebih besar dari tanggal selesai.")
      return
    }

    startTransition(async () => {
      const res = await generateBatchRosterAction({
        room_id: roomId,
        student_ids: selectedStudentIds,
        start_date: startDate,
        end_date: endDate,
        pattern,
        notes: notes || undefined,
      })

      if (res.success) {
        alert(res.message)
        onOpenChange(false)
        router.refresh()
      } else {
        alert(res.message || "Gagal men-generate roster dinas.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Generator Roster Dinas Otomatis
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate jadwal dinas shift mahasiswa secara otomatis menggunakan pola siklus rotasi standar RSUD Bulukumba.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Pilih Ruangan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Ruangan Dinas Pelayanan</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden"
              required
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          {/* Rentang Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Tanggal Mulai
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Tanggal Selesai
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Pola Rotasi Shift */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Pola Siklus Rotasi Shift
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  pattern === "pagi_siang_malam_libur"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/40 text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="pattern"
                  checked={pattern === "pagi_siang_malam_libur"}
                  onChange={() => setPattern("pagi_siang_malam_libur")}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold block">Pola 4 Hari (24 Jam)</span>
                  <span className="text-[11px] text-muted-foreground">
                    Pagi ☀️ &rarr; Siang ⛅ &rarr; Malam 🌙 &rarr; Lepas Jaga 🏖️ (IGD, ICU, VK)
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  pattern === "pagi_siang_libur"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/40 text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="pattern"
                  checked={pattern === "pagi_siang_libur"}
                  onChange={() => setPattern("pagi_siang_libur")}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold block">Pola 3 Hari (2 Shift)</span>
                  <span className="text-[11px] text-muted-foreground">
                    Pagi ☀️ &rarr; Siang ⛅ &rarr; Libur 🏖️ (Bangsal Rawat Inap)
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  pattern === "pagi_only"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/40 text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="pattern"
                  checked={pattern === "pagi_only"}
                  onChange={() => setPattern("pagi_only")}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold block">Dinas Pagi Saja</span>
                  <span className="text-[11px] text-muted-foreground">
                    Pagi terus setiap hari kerja (Poliklinik Rawat Jalan, Lab, Radiologi)
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  pattern === "rotasi_kelompok"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted/40 text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="pattern"
                  checked={pattern === "rotasi_kelompok"}
                  onChange={() => setPattern("rotasi_kelompok")}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold block">Rotasi Bergantian Tim</span>
                  <span className="text-[11px] text-muted-foreground">
                    Pagi, Siang, Malam bergiliran antar kelompok mahasiswa
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Pilih Mahasiswa Stase di Ruangan Ini */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                Pilih Mahasiswa ({selectedStudentIds.length} dari {roomStudents.length})
              </span>
              {roomStudents.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-primary hover:underline font-medium text-[11px]"
                >
                  {selectedStudentIds.length === roomStudents.length ? "Batal Pilih Semua" : "Pilih Semua"}
                </button>
              )}
            </div>

            {roomStudents.length === 0 ? (
              <div className="p-3 bg-muted/40 rounded-xl text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Tidak ada mahasiswa aktif pada ruangan ini.
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 border border-border rounded-xl p-2 bg-background">
                {roomStudents.map((s) => {
                  const isChecked = selectedStudentIds.includes(s.id)
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStudent(s.id)}
                        className="rounded-xs border-border"
                      />
                      <span className="font-mono text-[11px] text-muted-foreground">{s.nim}</span>
                      <span className="font-semibold text-foreground">{s.full_name}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Catatan / Keterangan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Catatan / Keterangan (Opsional)</label>
            <Input
              placeholder="Contoh: Roster rotasi stase bedah gelombang 1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs"
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
              disabled={isPending || roomStudents.length === 0}
              className="text-xs gap-1.5 bg-primary font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sedang Men-generate...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Jadwal Roster Sekarang</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
