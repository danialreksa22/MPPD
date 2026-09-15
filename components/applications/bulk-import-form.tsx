"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import { createBulkApplicationAction } from "@/actions/applications"
import { Institution, Period, StudyProgram } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Info,
} from "lucide-react"

interface BulkStudentParsed {
  nim: string
  nik?: string
  full_name: string
  gender: string
  phone?: string
  email?: string
}

interface BulkImportFormProps {
  institutions: Institution[]
  periods: Period[]
  studyPrograms: StudyProgram[]
}

export function BulkImportForm({
  institutions,
  periods,
  studyPrograms,
}: BulkImportFormProps) {
  const router = useRouter()
  const [selectedInstId, setSelectedInstId] = useState<string>(
    institutions[0]?.id || ""
  )
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    periods[0]?.id || ""
  )
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    studyPrograms[0]?.id || ""
  )
  const [selectedCategory, setSelectedCategory] = useState<"praktik_klinik" | "mppd">(
    "praktik_klinik"
  )
  const [parsedStudents, setParsedStudents] = useState<BulkStudentParsed[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  const filteredPrograms = studyPrograms.filter(
    (p) => !selectedInstId || p.institution_id === selectedInstId
  )

  // Download template CSV
  function handleDownloadTemplate() {
    const csvContent =
      "nim,nik,full_name,gender,phone,email\n" +
      "C111221001,7302011234560001,Andi Ahmad Rezky,L,081241112233,ahmad@student.unhas.ac.id\n" +
      "C111221002,7302015678900002,Nurul Annisa Putri,P,081342223344,annisa@student.unhas.ac.id\n"

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "template_pengajuan_mahasiswa_rsud_bulukumba.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle file upload and parse using XLSX
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsParsing(true)
    setFeedback(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

      if (!json || json.length === 0) {
        setFeedback({ message: "File kosong atau tidak memiliki baris data.", isError: true })
        setIsParsing(false)
        return
      }

      // Map format
      const students: BulkStudentParsed[] = json.map((row: Record<string, unknown>) => ({
        nim: String(row.nim || row.NIM || "").trim(),
        nik: String(row.nik || row.NIK || "").trim(),
        full_name: String(row.full_name || row.nama || row.NAMA || row["Nama Lengkap"] || "").trim(),
        gender: String(row.gender || row.jk || row["Jenis Kelamin"] || "L").toUpperCase().startsWith("P")
          ? "P"
          : "L",
        phone: String(row.phone || row.hp || row.telepon || "").trim(),
        email: String(row.email || row.Email || "").trim(),
      }))

      // Validasi baris valid
      const validStudents = students.filter((s) => s.nim.length > 0 && s.full_name.length > 0)

      if (validStudents.length === 0) {
        setFeedback({
          message: "Tidak ditemukan baris yang memiliki kolom NIM dan Nama Lengkap yang valid.",
          isError: true,
        })
      } else {
        setParsedStudents(validStudents)
        setFeedback({
          message: `Berhasil membaca ${validStudents.length} data mahasiswa dari berkas ${file.name}.`,
        })
      }
    } catch {
      setFeedback({
        message: "Gagal membaca format file. Pastikan format CSV atau Excel (.xlsx) valid.",
        isError: true,
      })
    } finally {
      setIsParsing(false)
    }
  }

  // Submit bulk application
  async function handleSubmit() {
    if (parsedStudents.length === 0) {
      setFeedback({ message: "Pilih dan unggah berkas Excel/CSV terlebih dahulu.", isError: true })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    const res = await createBulkApplicationAction(
      selectedInstId,
      selectedPeriodId,
      selectedProgramId,
      selectedCategory,
      JSON.stringify(parsedStudents),
      `Berkas unggahan: ${fileName}`
    )

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
    <div className="space-y-6">
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

      {/* Bagian 1: Parameter Pengajuan */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Parameter Pengajuan Kolektif</CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="h-8 gap-1.5 text-xs text-primary border-primary/30"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Template CSV</span>
            </Button>
          </div>
          <CardDescription className="text-xs">
            Pilih institusi, periode gelombang, dan program studi untuk kumpulan mahasiswa yang diajukan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Institusi Pendidikan *
            </label>
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
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
            <label className="text-xs font-semibold text-foreground">
              Gelombang / Periode Praktik *
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
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
            <label className="text-xs font-semibold text-foreground">
              Program Studi / Profesi *
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
            >
              {filteredPrograms.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.name} ({prog.level})
                </option>
              ))}
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
                Praktik Klinik
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
                MPPD Kedokteran
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bagian 2: Unggah Berkas Excel / CSV */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Unggah File Excel atau CSV</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Unggah file format .xlsx, .xls, atau .csv sesuai format kolom template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-card/40 hover:bg-muted/20 transition-colors text-center">
            <FileSpreadsheet className="h-10 w-10 text-primary mb-2" />
            <div className="text-xs font-semibold text-foreground mb-1">
              Pilih Berkas Spreadsheet Mahasiswa
            </div>
            <p className="text-[11px] text-muted-foreground max-w-sm mb-3">
              Mendukung format .xlsx, .xls, atau .csv (maksimal 100 mahasiswa per satu pengajuan).
            </p>

            <label className={`cursor-pointer ${isParsing ? "pointer-events-none opacity-60" : ""}`}>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90">
                {isParsing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>{isParsing ? "Membaca Berkas..." : "Pilih File Excel/CSV"}</span>
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isParsing}
                className="hidden"
              />
            </label>

            {fileName && (
              <div className="mt-3 text-xs font-mono font-medium text-primary">
                File terpilih: {fileName}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bagian 3: Pratinjau Tabel Mahasiswa */}
      {parsedStudents.length > 0 && (
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">
                  Pratinjau Data ({parsedStudents.length} Mahasiswa)
                </CardTitle>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2 font-semibold shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses Pengajuan...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Kirim Pengajuan Kolektif</span>
                  </>
                )}
              </Button>
            </div>
            <CardDescription className="text-xs">
              Pastikan data nama, NIM, dan jenis kelamin sudah tepat sebelum diajukan ke Diklat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-card overflow-hidden max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>L/P</TableHead>
                    <TableHead>NIK KTP</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedStudents.map((s, idx) => (
                    <TableRow key={idx} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-medium text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-primary">
                        {s.nim}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {s.full_name}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-[11px] text-muted-foreground">
                          {s.gender}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {s.nik || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.phone || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.email || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Total {parsedStudents.length} calon mahasiswa akan didaftarkan ke sistem MAGGURU.
              </span>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 font-semibold shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses Pengajuan...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Kirim Pengajuan Kolektif</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
