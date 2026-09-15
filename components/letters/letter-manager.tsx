"use client"

import React, { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  FileText,
  Plus,
  Search,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Award,
  Calendar,
  Send,
  Loader2,
  QrCode,
  FileCheck,
} from "lucide-react"
import {
  LetterWithRelations,
  EligibleApplicationItem,
  EligibleStudentItem,
  verifyLetterAction,
} from "@/actions/letters"
import { HospitalOfficial } from "@/actions/officials"
import { LetterType, LETTER_TYPE_LABELS } from "@/lib/constants"
import { LetterPreviewDialog } from "./letter-preview-dialog"
import { LetterGeneratorDialog } from "./letter-generator-dialog"

interface LetterManagerProps {
  initialLetters: LetterWithRelations[]
  eligibleApplications: EligibleApplicationItem[]
  eligibleStudents: EligibleStudentItem[]
  officials?: HospitalOfficial[]
}

export function LetterManager({
  initialLetters,
  eligibleApplications,
  eligibleStudents,
  officials = [],
}: LetterManagerProps) {
  const [isPending, startTransition] = useTransition()

  // Tab State
  const [activeTab, setActiveTab] = useState<"letters" | "verification" | "pending_apps">("letters")

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")

  // Dialog States
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)
  const [initialTypeForGenerator, setInitialTypeForGenerator] =
    useState<LetterType>("balasan_disetujui")
  const [initialAppIdForGenerator, setInitialAppIdForGenerator] = useState<string | null>(null)
  const [initialStudentIdForGenerator, setInitialStudentIdForGenerator] =
    useState<string | null>(null)

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedLetterForPreview, setSelectedLetterForPreview] =
    useState<LetterWithRelations | null>(null)

  // Verification Form State
  const [verificationQuery, setVerificationQuery] = useState("")
  const [verificationResult, setVerificationResult] = useState<LetterWithRelations | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [hasVerified, setHasVerified] = useState(false)

  // Filtered Letters
  const filteredLetters = initialLetters.filter((l) => {
    if (selectedType !== "all" && l.letter_type !== selectedType) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchNumber = l.letter_number.toLowerCase().includes(q)
      const matchInst =
        l.student_applications?.institutions?.name?.toLowerCase().includes(q) ||
        l.students?.institutions?.name?.toLowerCase().includes(q)
      const matchStudent = l.students?.full_name?.toLowerCase().includes(q)
      const matchSubject = l.subject?.toLowerCase().includes(q)
      if (!matchNumber && !matchInst && !matchStudent && !matchSubject) return false
    }
    return true
  })

  // Metric counts
  const totalLetters = initialLetters.length
  const approvedLettersCount = initialLetters.filter(
    (l) => l.letter_type === "balasan_disetujui"
  ).length
  const completionLettersCount = initialLetters.filter(
    (l) => l.letter_type === "keterangan_selesai"
  ).length
  const certificatesCount = initialLetters.filter(
    (l) => l.letter_type === "sertifikat"
  ).length

  // Pending applications that have no letter yet
  const pendingApps = eligibleApplications.filter((app) => !app.has_letter)

  // Open Generator Helper
  const handleOpenGenerator = (
    type: LetterType = "balasan_disetujui",
    appId: string | null = null,
    stId: string | null = null
  ) => {
    setInitialTypeForGenerator(type)
    setInitialAppIdForGenerator(appId)
    setInitialStudentIdForGenerator(stId)
    setIsGeneratorOpen(true)
  }

  const handleOpenPreview = (letter: LetterWithRelations) => {
    setSelectedLetterForPreview(letter)
    setIsPreviewOpen(true)
  }

  // Handle Verification
  const handleVerify = () => {
    if (!verificationQuery.trim()) return

    setVerificationError(null)
    setVerificationResult(null)
    setHasVerified(false)

    startTransition(async () => {
      const res = await verifyLetterAction(verificationQuery.trim())
      setHasVerified(true)
      if (res.success && res.data) {
        setVerificationResult(res.data)
      } else {
        setVerificationError(res.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Dokumen &amp; Naskah Dinas Resmi
            </h1>
            <Badge variant="outline" className="text-[11px] border-primary/30 text-primary">
              RSUD Bulukumba
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Penerbitan surat balasan persetujuan, surat penolakan, surat keterangan selesai praktik, dan sertifikat kelulusan stase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleOpenGenerator("balasan_disetujui")}
            className="text-xs gap-1.5 font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Terbitkan Surat Baru</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Naskah Dinas</span>
              <FileText className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading mt-1">
              {totalLetters}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Surat resmi tersimpan di database
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Surat Balasan Disetujui</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400 mt-1">
              {approvedLettersCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Izin praktik klinik diterbitkan
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Surat Keterangan Selesai</span>
              <FileCheck className="h-4 w-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-blue-700 dark:text-blue-400 mt-1">
              {completionLettersCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Keterangan selesai praktik diterbitkan
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Sertifikat Kelulusan</span>
              <Award className="h-4 w-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-amber-700 dark:text-amber-400 mt-1">
              {certificatesCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Piagam penghargaan stase diterbitkan
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <Button
          size="sm"
          variant={activeTab === "letters" ? "default" : "ghost"}
          onClick={() => setActiveTab("letters")}
          className="text-xs gap-1.5 font-medium"
        >
          <FileText className="h-4 w-4" />
          <span>Riwayat Naskah Dinas ({filteredLetters.length})</span>
        </Button>

        <Button
          size="sm"
          variant={activeTab === "pending_apps" ? "default" : "ghost"}
          onClick={() => setActiveTab("pending_apps")}
          className="text-xs gap-1.5 font-medium"
        >
          <Building2 className="h-4 w-4" />
          <span>Pengajuan Belum Bersurat ({pendingApps.length})</span>
        </Button>

        <Button
          size="sm"
          variant={activeTab === "verification" ? "default" : "ghost"}
          onClick={() => setActiveTab("verification")}
          className="text-xs gap-1.5 font-medium"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Cek Keaslian Dokumen Digital</span>
        </Button>
      </div>

      {/* TAB 1: RIWAYAT NASKAH DINAS */}
      {activeTab === "letters" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor surat, penerima, perihal..."
                className="pl-8 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select
              value={selectedType}
              onValueChange={(val) => setSelectedType(val || "all")}
            >
              <SelectTrigger className="h-9 w-full sm:w-56 text-xs">
                <SelectValue placeholder="Semua Jenis Dokumen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Jenis Dokumen
                </SelectItem>
                {Object.entries(LETTER_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    {v.shortLabel} ({v.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-xl bg-card overflow-hidden shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Nomor Surat &amp; Tanggal</TableHead>
                  <TableHead>Jenis Dokumen</TableHead>
                  <TableHead>Penerima / Institusi</TableHead>
                  <TableHead>Perihal / Dokumen</TableHead>
                  <TableHead>Penandatangan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLetters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                      Belum ada arsip dokumen resmi yang sesuai dengan kriteria filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLetters.map((l, idx) => {
                    const typeInfo = LETTER_TYPE_LABELS[l.letter_type]
                    const targetName =
                      l.students?.full_name ||
                      l.student_applications?.institutions?.name ||
                      "Institusi Terkait"
                    const targetSub = l.students
                      ? `NIM: ${l.students.nim} • ${l.students.study_programs?.name || ""}`
                      : `${l.student_applications?.study_programs?.name || ""} (${l.student_applications?.application_number || ""})`

                    return (
                      <TableRow key={l.id} className="hover:bg-muted/30 transition-colors text-xs">
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {idx + 1}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-foreground">
                              {l.letter_number}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {l.issued_date}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium border ${typeInfo?.color}`}
                          >
                            {typeInfo?.shortLabel || l.letter_type}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{targetName}</span>
                            <span className="text-[10px] text-muted-foreground">{targetSub}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-foreground line-clamp-1">
                            {l.subject || typeInfo?.label}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col text-[11px]">
                            <span className="font-medium text-foreground">
                              {l.signer_name || "Direktur RSUD"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {l.signer_title || "RSUD Bulukumba"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenPreview(l)}
                              className="h-8 px-2 text-xs gap-1 text-primary hover:text-primary"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Cetak / PDF</span>
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
        </div>
      )}

      {/* TAB 2: PENGAJUAN BELUM BERSURAT */}
      {activeTab === "pending_apps" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Daftar permohonan institusi kampus yang statusnya telah diproses (Disetujui / Ditolak) namun belum diterbitkan surat dinas balasannya:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingApps.length === 0 ? (
              <div className="col-span-full border rounded-xl p-8 text-center text-xs text-muted-foreground bg-card">
                Seluruh pengajuan institusi yang disetujui/ditolak telah diterbitkan surat balasannya.
              </div>
            ) : (
              pendingApps.map((app) => (
                <Card key={app.id} className="border-border/80 hover:border-primary/40 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {app.application_number}
                      </span>
                      <Badge
                        variant={app.status === "disetujui" ? "default" : "destructive"}
                        className="text-[10px] uppercase"
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold mt-1">
                      {app.institution_name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {app.study_program_name} &bull; {app.student_count} Mahasiswa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 text-xs space-y-2">
                    <div className="text-[11px] text-muted-foreground border-t pt-2 space-y-0.5">
                      <p>Periode: {app.start_date} s.d. {app.end_date}</p>
                      <p>No. Surat Kampus: {app.institution_letter_number || "-"}</p>
                    </div>

                    <Button
                      size="sm"
                      className="w-full text-xs font-semibold mt-2 gap-1.5"
                      onClick={() =>
                        handleOpenGenerator(
                          app.status === "disetujui" ? "balasan_disetujui" : "balasan_ditolak",
                          app.id
                        )
                      }
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Terbitkan Surat Balasan</span>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VERIFIKASI KEASLIAN DOKUMEN DIGITAL */}
      {activeTab === "verification" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-border/80">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <QrCode className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-heading">
                Verifikasi Keaslian Naskah Dinas RSUD Bulukumba
              </CardTitle>
              <CardDescription className="text-xs">
                Masukkan nomor surat resmi atau kode verifikasi digital untuk memeriksa keabsahan dokumen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Contoh: 420/DIKLAT-RSUD-BLK/IX/2026/001 atau Kode ID"
                  className="h-10 text-xs font-mono"
                  value={verificationQuery}
                  onChange={(e) => setVerificationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
                <Button
                  onClick={handleVerify}
                  disabled={isPending || !verificationQuery.trim()}
                  className="gap-1.5 text-xs font-semibold px-5"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span>Periksa</span>
                </Button>
              </div>

              {/* Hasil Verifikasi Sukses */}
              {hasVerified && verificationResult && (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>DOKUMEN RESMI TERVERIFIKASI &amp; SAH</span>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                    Dokumen ini tercatat secara legal dalam basis data Bagian Diklat RSUD H. Andi Sulthan Daeng Radja Bulukumba.
                  </p>

                  <div className="bg-white/80 dark:bg-slate-900/60 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs space-y-1 font-mono text-slate-800 dark:text-slate-200">
                    <div className="grid grid-cols-[120px_10px_1fr]">
                      <span>Nomor Surat</span>
                      <span>:</span>
                      <span className="font-bold">{verificationResult.letter_number}</span>
                    </div>
                    <div className="grid grid-cols-[120px_10px_1fr]">
                      <span>Jenis Dokumen</span>
                      <span>:</span>
                      <span>{LETTER_TYPE_LABELS[verificationResult.letter_type]?.label}</span>
                    </div>
                    <div className="grid grid-cols-[120px_10px_1fr]">
                      <span>Tanggal Terbit</span>
                      <span>:</span>
                      <span>{verificationResult.issued_date}</span>
                    </div>
                    <div className="grid grid-cols-[120px_10px_1fr]">
                      <span>Penerima</span>
                      <span>:</span>
                      <span className="font-sans font-semibold">
                        {verificationResult.students?.full_name ||
                          verificationResult.student_applications?.institutions?.name}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenPreview(verificationResult)}
                    className="w-full text-xs font-semibold gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Buka Pratinjau Dokumen Asli</span>
                  </Button>
                </div>
              )}

              {/* Hasil Verifikasi Gagal */}
              {hasVerified && verificationError && (
                <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="h-5 w-5" />
                    <span>DOKUMEN TIDAK TERDAFTAR</span>
                  </div>
                  <p>{verificationError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog Preview Dokumen & Print */}
      <LetterPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        letter={selectedLetterForPreview}
      />

      {/* Dialog Generator Surat Baru */}
      <LetterGeneratorDialog
        open={isGeneratorOpen}
        onOpenChange={setIsGeneratorOpen}
        eligibleApplications={eligibleApplications}
        eligibleStudents={eligibleStudents}
        officials={officials}
        initialType={initialTypeForGenerator}
        initialApplicationId={initialAppIdForGenerator}
        initialStudentId={initialStudentIdForGenerator}
      />
    </div>
  )
}
