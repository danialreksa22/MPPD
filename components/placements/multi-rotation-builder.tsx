"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RoomUnit, Preceptor, Period } from "@/types"
import {
  EligibleStudent,
  createMultiRotationScheduleAction,
} from "@/actions/placements"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from "lucide-react"

interface RotationStageRow {
  room_id: string
  preceptor_id: string
  start_date: string
  end_date: string
  rotation_order: number
}

interface MultiRotationBuilderProps {
  eligibleStudents: EligibleStudent[]
  rooms: RoomUnit[]
  preceptors: Preceptor[]
  periods: Period[]
}

export function MultiRotationBuilder({
  eligibleStudents,
  rooms,
  preceptors,
  periods,
}: MultiRotationBuilderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    eligibleStudents[0]?.id || ""
  )
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    periods[0]?.id || ""
  )

  // Inisialisasi awal dengan 2 stase rotasi default
  const [stages, setStages] = useState<RotationStageRow[]>([
    {
      room_id: rooms[0]?.id || "",
      preceptor_id: "",
      start_date: "2026-10-01",
      end_date: "2026-10-31",
      rotation_order: 1,
    },
    {
      room_id: rooms[1]?.id || rooms[0]?.id || "",
      preceptor_id: "",
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      rotation_order: 2,
    },
  ])

  const currentStudent = eligibleStudents.find((s) => s.id === selectedStudentId)
  const activePreceptors = preceptors.filter((p) => p.is_active)

  // Tambah stase rotasi
  const handleAddStage = () => {
    const lastStage = stages[stages.length - 1]
    let nextStart = ""
    let nextEnd = ""

    if (lastStage && lastStage.end_date) {
      const d = new Date(lastStage.end_date)
      d.setDate(d.getDate() + 1)
      nextStart = d.toISOString().split("T")[0]
      const dEnd = new Date(d)
      dEnd.setDate(dEnd.getDate() + 27) // +4 minggu
      nextEnd = dEnd.toISOString().split("T")[0]
    }

    setStages((prev) => [
      ...prev,
      {
        room_id: rooms[0]?.id || "",
        preceptor_id: "",
        start_date: nextStart,
        end_date: nextEnd,
        rotation_order: prev.length + 1,
      },
    ])
  }

  // Hapus stase rotasi
  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) return
    setStages((prev) => {
      const filtered = prev.filter((_, i) => i !== index)
      return filtered.map((item, idx) => ({
        ...item,
        rotation_order: idx + 1,
      }))
    })
  }

  // Update field stase
  const handleStageChange = (
    index: number,
    field: keyof RotationStageRow,
    val: string | number
  ) => {
    setStages((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: val }
      return updated
    })
  }

  // Simpan alur rotasi
  const handleSubmit = () => {
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
    if (stages.length === 0) {
      setErrorMsg("Minimal tambahkan 1 stase rotasi")
      return
    }

    for (let i = 0; i < stages.length; i++) {
      const s = stages[i]
      if (!s.room_id) {
        setErrorMsg(`Ruangan untuk Stase ${i + 1} belum dipilih`)
        return
      }
      if (!s.start_date || !s.end_date) {
        setErrorMsg(`Rentang tanggal untuk Stase ${i + 1} belum lengkap`)
        return
      }
      if (new Date(s.start_date) > new Date(s.end_date)) {
        setErrorMsg(`Tanggal selesai Stase ${i + 1} tidak boleh sebelum tanggal mulai`)
        return
      }
    }

    startTransition(async () => {
      const payload = {
        student_id: selectedStudentId,
        application_id: currentStudent?.application_id || "",
        period_id: selectedPeriodId,
        rotations: stages.map((s, idx) => ({
          room_id: s.room_id,
          preceptor_id: s.preceptor_id || null,
          rotation_order: idx + 1,
          start_date: s.start_date,
          end_date: s.end_date,
        })),
      }

      const res = await createMultiRotationScheduleAction(payload)
      if (res.success) {
        setSuccessMsg(res.message)
        setTimeout(() => {
          router.push("/dashboard/penempatan")
        }, 1500)
      } else {
        setErrorMsg(res.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/penempatan">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Rancang Alur Rotasi Multi-Stase
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Alokasikan jalur rotasi beruntun per departemen (IGD, ICU, Bedah, Interna) untuk satu mahasiswa praktik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStage}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Stase
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isPending}
            className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Simpan Seluruh Rotasi
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg} Mengalihkan ke jadwal penempatan...</span>
        </div>
      )}

      {/* Bagian 1: Identitas Mahasiswa & Periode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Pilih Mahasiswa &amp; Periode Praktik
          </CardTitle>
          <CardDescription className="text-xs">
            Pilih kandidat mahasiswa dari permohonan yang telah disetujui Tim Diklat RSUD Bulukumba.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Nama Mahasiswa *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              {eligibleStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nim} - {s.full_name} ({s.institution_name})
                </option>
              ))}
            </select>
            {currentStudent && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <GraduationCap className="h-3 w-3 text-primary" />
                <span>
                  Prodi: <strong>{currentStudent.study_program_name}</strong> &bull; Institusi:{" "}
                  <strong>{currentStudent.institution_name}</strong>
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Periode Gelombang *
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.academic_year})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bagian 2: Alur Stase Rotasi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Tahapan Stase Departemen ({stages.length} Stase Terkonfigurasi)
            </h3>
            <p className="text-xs text-muted-foreground">
              Tentukan urutan ruangan, rentang waktu stase, dan pembimbing klinik pendamping.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const currentRoom = rooms.find((r) => r.id === stage.room_id)
            return (
              <Card key={idx} className="border-border/80 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary" />
                <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-xs text-foreground">
                      Stase {idx + 1}: {currentRoom?.name || "Pilih Ruangan"}
                    </span>
                  </div>

                  {stages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStage(idx)}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                      title="Hapus Stase Ini"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Ruangan Pelayanan *
                    </label>
                    <select
                      value={stage.room_id}
                      onChange={(e) => handleStageChange(idx, "room_id", e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Kapasitas: {r.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Pembimbing Preseptor / CI / DPJP
                    </label>
                    <select
                      value={stage.preceptor_id}
                      onChange={(e) => handleStageChange(idx, "preceptor_id", e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">-- Tetapkan Nanti --</option>
                      {activePreceptors.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.type === "supervisor_dokter" ? "DPJP" : "CI"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tanggal Mulai Stase *
                    </label>
                    <Input
                      type="date"
                      value={stage.start_date}
                      onChange={(e) => handleStageChange(idx, "start_date", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tanggal Selesai Stase *
                    </label>
                    <Input
                      type="date"
                      value={stage.end_date}
                      onChange={(e) => handleStageChange(idx, "end_date", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Action Bottom */}
        <div className="flex justify-between items-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStage}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Tahap Stase Rotasi
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isPending}
            className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Simpan Seluruh Alur Rotasi</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
