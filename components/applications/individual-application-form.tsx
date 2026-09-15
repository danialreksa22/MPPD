"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createIndividualApplicationAction } from "@/actions/applications"
import { Institution, Period, StudyProgram, RoomUnit } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  User,
  Building2,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react"

interface IndividualApplicationFormProps {
  institutions: Institution[]
  periods: Period[]
  studyPrograms: StudyProgram[]
  rooms: RoomUnit[]
}

export function IndividualApplicationForm({
  institutions,
  periods,
  studyPrograms,
  rooms,
}: IndividualApplicationFormProps) {
  const router = useRouter()
  const [selectedInstId, setSelectedInstId] = useState<string>(
    institutions[0]?.id || ""
  )
  const [selectedCategory, setSelectedCategory] = useState<"praktik_klinik" | "mppd">(
    "praktik_klinik"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  // Filter prodi sesuai institusi yang dipilih
  const filteredPrograms = studyPrograms.filter(
    (p) => !selectedInstId || p.institution_id === selectedInstId
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const res = await createIndividualApplicationAction(formData)
    setIsSubmitting(false)

    if (res.success) {
      setFeedback({ message: res.message })
      setTimeout(() => {
        router.push("/dashboard/pengajuan")
      }, 1500)
    } else {
      setFeedback({ message: res.message, isError: true })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl text-xs ${
            feedback.isError
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Bagian 1: Institusi & Periode */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Institusi &amp; Periode Praktik</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Pilih kampus asal dan gelombang kepaniteraan / praktik klinik yang dituju.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="institution_id">
              Institusi Pendidikan *
            </label>
            <select
              id="institution_id"
              name="institution_id"
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              required
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="period_id">
              Gelombang / Periode Praktik *
            </label>
            <select
              id="period_id"
              name="period_id"
              required
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.academic_year})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="study_program_id">
              Program Studi / Profesi *
            </label>
            <select
              id="study_program_id"
              name="study_program_id"
              required
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
            >
              {filteredPrograms.length === 0 ? (
                <option value="">Belum ada program studi terdaftar</option>
              ) : (
                filteredPrograms.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name} ({prog.level})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Kategori Praktik *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("praktik_klinik")}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  selectedCategory === "praktik_klinik"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted/40"
                }`}
              >
                Praktik Klinik (Ners/Bidan/dll)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("mppd")}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  selectedCategory === "mppd"
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:bg-muted/40"
                }`}
              >
                MPPD Kedokteran (Koas)
              </button>
            </div>
            <input type="hidden" name="type" value={selectedCategory} />
          </div>
        </CardContent>
      </Card>

      {/* Bagian 2: Data Mahasiswa */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Data Identitas Mahasiswa</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Masukkan data diri lengkap mahasiswa yang diajukan sesuai KTP dan KTM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground" htmlFor="full_name">
                Nama Lengkap Mahasiswa *
              </label>
              <Input
                id="full_name"
                name="full_name"
                required
                placeholder="Contoh: Muhammad Rezky Alamsyah"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="gender">
                Jenis Kelamin *
              </label>
              <select
                id="gender"
                name="gender"
                required
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="nim">
                Nomor Induk Mahasiswa (NIM) *
              </label>
              <Input
                id="nim"
                name="nim"
                required
                placeholder="Contoh: C111221005"
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="nik">
                Nomor Induk Kependudukan (NIK KTP)
              </label>
              <Input
                id="nik"
                name="nik"
                maxLength={16}
                placeholder="730201..."
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="phone">
                Nomor WhatsApp / HP Aktif
              </label>
              <Input
                id="phone"
                name="phone"
                placeholder="08123456789"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="email">
                Alamat Email Mahasiswa
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="mahasiswa@kampus.ac.id"
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="desired_room_id">
              Pilihan Ruangan Pelayanan Awal (Opsional)
            </label>
            <select
              id="desired_room_id"
              name="desired_room_id"
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
            >
              <option value="">-- Ditentukan oleh Admin Diklat Saat Penempatan --</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Kuota: {r.capacity} orang)
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bagian 3: Catatan & Konfirmasi Pengajuan */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Catatan & Konfirmasi Pengajuan</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Pendaftaran mahasiswa diproses secara langsung. Dokumen fisik pendukung dapat diserahkan langsung ke bagian Diklat RSUD Bulukumba saat verifikasi bila diperlukan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="notes">
              Catatan Pengajuan Tambahan (Opsional)
            </label>
            <Input
              id="notes"
              name="notes"
              placeholder="Tambahkan catatan khusus, rotasi yang diminta, atau keterangan dinas bila ada..."
              className="text-xs"
            />
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Nomor registrasi pengajuan resmi akan diterbitkan otomatis.</span>
          </div>

          <Button type="submit" disabled={isSubmitting} className="gap-2 font-semibold shadow-xs">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mengirimkan Pengajuan...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Kirim Pengajuan Mahasiswa</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
