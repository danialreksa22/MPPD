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
  Key,
  Copy,
  Check,
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
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<{
    message: string
    isError?: boolean
    account?: {
      email: string
      password?: string
      isExisting?: boolean
    }
  } | null>(null)

  function handleCopyCredentials(email: string, pass: string) {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${pass}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
      setFeedback({
        message: res.message,
        account: res.data?.studentAccount,
      })
      setTimeout(() => {
        router.push("/dashboard/pengajuan")
      }, 4000)
    } else {
      setFeedback({ message: res.message, isError: true })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs space-y-3 transition-all ${
            feedback.isError
              ? "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.isError ? (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>

          {feedback.account && (
            <div className="mt-2 pt-2.5 border-t border-emerald-200 dark:border-emerald-800/80 bg-card p-3 rounded-lg border border-border shadow-xs text-foreground space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  Kredensial Akun Mahasiswa Praktik / MPPD:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyCredentials(
                      feedback.account!.email,
                      feedback.account!.password || "Magguru@[NIM]"
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Salin Kredensial</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-muted/40 p-2.5 rounded-md">
                <div>
                  <span className="text-muted-foreground font-sans text-[11px]">Email Login:</span>{" "}
                  <strong className="text-primary font-semibold select-all">
                    {feedback.account.email}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-sans text-[11px]">Kata Sandi Default:</span>{" "}
                  <strong className="text-foreground font-semibold select-all">
                    {feedback.account.password || "Magguru@[NIM]"}
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground font-sans">
                Mahasiswa dapat langsung masuk ke portal MAGGURU dengan email &amp; sandi di atas untuk presensi GPS dan penilaian stase.
              </p>
            </div>
          )}
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5" htmlFor="email">
                  <span>Alamat Email Mahasiswa</span>
                  <span className="text-[10px] font-normal text-muted-foreground">(Akun Login)</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                  <Key className="h-2.5 w-2.5" /> Auto-generate Akun
                </span>
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="mahasiswa@kampus.ac.id (opsional, auto: [nim]@student.magguru.id)"
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Akun pengguna role <strong>Mahasiswa/MPPD</strong> otomatis dibuat dengan kata sandi default <code>Magguru@[NIM]</code>.
              </p>
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
