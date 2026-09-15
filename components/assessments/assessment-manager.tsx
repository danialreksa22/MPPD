"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
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
  Stethoscope,
  Award,
  Plus,
  Search,
  Download,
  Printer,
  Edit,
  Lock,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  PieChart,
  Users,
} from "lucide-react"
import {
  AssessmentWithRelations,
  EligiblePlacementItem,
  finalizeAssessmentAction,
  deleteAssessmentAction,
} from "@/actions/assessments"
import { RoomUnit, StudyProgram } from "@/types"
import { AssessmentGradeBadge } from "./assessment-grade-badge"
import { AssessmentFormDialog } from "./assessment-form-dialog"
import { EvaluationSheetDialog } from "./evaluation-sheet-dialog"
import { PASSING_SCORE_THRESHOLD } from "@/lib/constants"

interface AssessmentManagerProps {
  initialAssessments: AssessmentWithRelations[]
  eligiblePlacements: EligiblePlacementItem[]
  rooms: RoomUnit[]
  studyPrograms: StudyProgram[]
}

export function AssessmentManager({
  initialAssessments,
  eligiblePlacements,
  rooms,
  studyPrograms,
}: AssessmentManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Tab State
  const [activeTab, setActiveTab] = useState<"assessments" | "distribution" | "queue">("assessments")

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoom, setSelectedRoom] = useState<string>("all")
  const [selectedProdi, setSelectedProdi] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all") // all, final, draft

  // Modal Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedAssessmentToEdit, setSelectedAssessmentToEdit] =
    useState<AssessmentWithRelations | null>(null)
  const [initialPlacementId, setInitialPlacementId] = useState<string | null>(null)

  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [selectedAssessmentToPrint, setSelectedAssessmentToPrint] =
    useState<AssessmentWithRelations | null>(null)

  // Filter logic
  const filteredAssessments = initialAssessments.filter((a) => {
    // Room filter
    if (selectedRoom !== "all" && a.placements?.room_id !== selectedRoom) {
      return false
    }
    // Prodi filter
    if (selectedProdi !== "all" && a.students?.study_programs?.id !== selectedProdi) {
      return false
    }
    // Status filter
    if (selectedStatus === "final" && !a.is_finalized) return false
    if (selectedStatus === "draft" && a.is_finalized) return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = a.students?.full_name?.toLowerCase().includes(q)
      const matchNim = a.students?.nim?.toLowerCase().includes(q)
      const matchRoom = a.placements?.rooms_units?.name?.toLowerCase().includes(q)
      const matchInst = a.students?.institutions?.name?.toLowerCase().includes(q)
      if (!matchName && !matchNim && !matchRoom && !matchInst) return false
    }

    return true
  })

  // Metric computations
  const totalAssessed = initialAssessments.length
  const finalizedCount = initialAssessments.filter((a) => a.is_finalized).length
  const averageScore =
    totalAssessed > 0
      ? (
          initialAssessments.reduce((acc, curr) => acc + (curr.final_score || 0), 0) /
          totalAssessed
        ).toFixed(1)
      : "0.0"

  const passedCount = initialAssessments.filter(
    (a) => (a.final_score || 0) >= PASSING_SCORE_THRESHOLD
  ).length
  const passRate =
    totalAssessed > 0 ? Math.round((passedCount / totalAssessed) * 100) : 100

  const pendingGradingCount = eligiblePlacements.filter(
    (p) => !p.existing_assessment_id || !p.is_finalized
  ).length

  // Grade Distribution
  const gradeDistribution = {
    A: initialAssessments.filter((a) => a.grade_letter === "A").length,
    "A-": initialAssessments.filter((a) => a.grade_letter === "A-").length,
    "B+": initialAssessments.filter((a) => a.grade_letter === "B+").length,
    B: initialAssessments.filter((a) => a.grade_letter === "B").length,
    remedial: initialAssessments.filter(
      (a) => ["B-", "C+", "C", "D", "E"].includes(a.grade_letter || "")
    ).length,
  }

  // Export Excel
  const handleExportExcel = () => {
    const rows = filteredAssessments.map((a, idx) => ({
      No: idx + 1,
      "NIM / Stambuk": a.students?.nim || "-",
      "Nama Mahasiswa": a.students?.full_name || "-",
      Institusi: a.students?.institutions?.name || "-",
      "Program Studi": a.students?.study_programs?.name || "-",
      "Ruangan / Stase": a.placements?.rooms_units?.name || "-",
      "Urutan Stase": `Stase #${a.placements?.rotation_order || 1}`,
      "Keterampilan (40%)": a.score_clinical_skills || 0,
      "Sikap (30%)": a.score_attitude || 0,
      "Pengetahuan (30%)": a.score_knowledge || 0,
      "Nilai Akhir": a.final_score || 0,
      "Huruf Mutu": a.grade_letter || "-",
      "Status Kelulusan":
        (a.final_score || 0) >= PASSING_SCORE_THRESHOLD ? "LULUS" : "REMEDIAL",
      "Pembimbing Klinik":
        a.placements?.preceptors?.name || a.evaluator?.full_name || "-",
      "Tanggal Evaluasi": a.assessment_date,
      Status: a.is_finalized ? "FINAL" : "DRAF",
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai Klinik")
    const dateStr = new Date().toISOString().split("T")[0]
    XLSX.writeFile(wb, `Rekap_Nilai_Klinik_RSUD_Bulukumba_${dateStr}.xlsx`)
  }

  // Action Handlers
  const handleOpenNewForm = (placementId?: string) => {
    setSelectedAssessmentToEdit(null)
    setInitialPlacementId(placementId || null)
    setIsFormOpen(true)
  }

  const handleEdit = (assessment: AssessmentWithRelations) => {
    setSelectedAssessmentToEdit(assessment)
    setInitialPlacementId(assessment.placement_id)
    setIsFormOpen(true)
  }

  const handlePrint = (assessment: AssessmentWithRelations) => {
    setSelectedAssessmentToPrint(assessment)
    setIsPrintOpen(true)
  }

  const handleFinalize = (assessmentId: string) => {
    if (!confirm("Apakah Anda yakin ingin memfinalisasi dan mengunci nilai stase ini? Nilai final tidak dapat diubah kembali.")) {
      return
    }
    startTransition(async () => {
      await finalizeAssessmentAction(assessmentId)
      router.refresh()
    })
  }

  const handleDelete = (assessmentId: string) => {
    if (!confirm("Hapus draf penilaian ini?")) return
    startTransition(async () => {
      await deleteAssessmentAction(assessmentId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Penilaian Klinik &amp; Evaluasi Stase
            </h1>
            <Badge variant="outline" className="text-[11px] border-primary/30 text-primary">
              RSUD Bulukumba
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Evaluasi keterampilan klinik (40%), sikap profesional (30%), dan pengetahuan klinis (30%) oleh CI &amp; DPJP.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="text-xs gap-1.5 font-medium shadow-2xs"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenNewForm()}
            className="text-xs gap-1.5 shadow-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Input Nilai Klinik</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Evaluasi Stase</span>
              <Award className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading mt-1">
              {totalAssessed}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            {finalizedCount} nilai final terkunci
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Rata-Rata Nilai Stase</span>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400 mt-1">
              {averageScore}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Skala 0 &ndash; 100 terbobot
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Tingkat Kelulusan (&ge; 70.0)</span>
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-blue-700 dark:text-blue-400 mt-1">
              {passRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            {passedCount} dari {totalAssessed} mahasiswa lulus stase
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Menunggu Penilaian</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-amber-700 dark:text-amber-400 mt-1">
              {pendingGradingCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Mahasiswa stase aktif / draf
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <Button
          size="sm"
          variant={activeTab === "assessments" ? "default" : "ghost"}
          onClick={() => setActiveTab("assessments")}
          className="text-xs gap-1.5 font-medium"
        >
          <Award className="h-4 w-4" />
          <span>Daftar Penilaian Stase ({filteredAssessments.length})</span>
        </Button>

        <Button
          size="sm"
          variant={activeTab === "distribution" ? "default" : "ghost"}
          onClick={() => setActiveTab("distribution")}
          className="text-xs gap-1.5 font-medium"
        >
          <PieChart className="h-4 w-4" />
          <span>Distribusi Huruf Mutu</span>
        </Button>

        <Button
          size="sm"
          variant={activeTab === "queue" ? "default" : "ghost"}
          onClick={() => setActiveTab("queue")}
          className="text-xs gap-1.5 font-medium"
        >
          <Users className="h-4 w-4" />
          <span>Antrean Siap Dinilai ({pendingGradingCount})</span>
        </Button>
      </div>

      {/* TAB 1: DAFTAR PENILAIAN STASE */}
      {activeTab === "assessments" && (
        <div className="space-y-4">
          {/* Multi-Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari mahasiswa, NIM, atau ruangan..."
                className="pl-8 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select
              value={selectedRoom}
              onValueChange={(val) => setSelectedRoom(val || "all")}
            >
              <SelectTrigger className="h-9 w-full sm:w-44 text-xs">
                <SelectValue placeholder="Semua Ruangan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Ruangan Stase
                </SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedProdi}
              onValueChange={(val) => setSelectedProdi(val || "all")}
            >
              <SelectTrigger className="h-9 w-full sm:w-48 text-xs">
                <SelectValue placeholder="Semua Program Studi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Program Studi
                </SelectItem>
                {studyPrograms.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(val) => setSelectedStatus(val || "all")}
            >
              <SelectTrigger className="h-9 w-full sm:w-36 text-xs">
                <SelectValue placeholder="Status Nilai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="final" className="text-xs">Final Terkunci</SelectItem>
                <SelectItem value="draft" className="text-xs">Draf Sementara</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabel Penilaian */}
          <div className="border rounded-xl bg-card overflow-hidden shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Mahasiswa &amp; Institusi</TableHead>
                  <TableHead>Ruangan &amp; Stase</TableHead>
                  <TableHead className="text-center">Keterampilan (40%)</TableHead>
                  <TableHead className="text-center">Sikap (30%)</TableHead>
                  <TableHead className="text-center">Pengetahuan (30%)</TableHead>
                  <TableHead className="text-center">Nilai Akhir</TableHead>
                  <TableHead>Pembimbing (CI/DPJP)</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-xs">
                      Belum ada data evaluasi klinik yang sesuai dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssessments.map((a, idx) => (
                    <TableRow key={a.id} className="hover:bg-muted/30 transition-colors text-xs">
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {a.students?.full_name}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {a.students?.nim} &bull; {a.students?.study_programs?.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {a.students?.institutions?.name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground flex items-center gap-1">
                            <Stethoscope className="h-3 w-3 text-primary" />
                            {a.placements?.rooms_units?.name || "-"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Stase #{a.placements?.rotation_order || 1} &bull; {a.assessment_date}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-mono font-semibold">
                        {a.score_clinical_skills?.toFixed(1) || "-"}
                      </TableCell>

                      <TableCell className="text-center font-mono font-semibold">
                        {a.score_attitude?.toFixed(1) || "-"}
                      </TableCell>

                      <TableCell className="text-center font-mono font-semibold">
                        {a.score_knowledge?.toFixed(1) || "-"}
                      </TableCell>

                      <TableCell className="text-center">
                        <AssessmentGradeBadge
                          score={a.final_score}
                          gradeLetter={a.grade_letter}
                          isFinalized={a.is_finalized}
                          showDetails={true}
                          size="sm"
                        />
                      </TableCell>

                      <TableCell>
                        <span className="text-[11px] text-foreground font-medium">
                          {a.placements?.preceptors?.name || a.evaluator?.full_name || "Preseptor Ruangan"}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Cetak Lembar Evaluasi */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrint(a)}
                            title="Cetak Lembar Evaluasi Resmi"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>

                          {/* Edit Nilai */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(a)}
                            title={a.is_finalized ? "Lihat Rincian Nilai" : "Edit Nilai"}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          {/* Kunci Nilai jika masih Draf */}
                          {!a.is_finalized && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFinalize(a.id)}
                              disabled={isPending}
                              title="Kunci & Finalisasi Nilai"
                              className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Hapus Draf */}
                          {!a.is_finalized && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(a.id)}
                              disabled={isPending}
                              title="Hapus Draf Penilaian"
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 2: DISTRIBUSI HURUF MUTU */}
      {activeTab === "distribution" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 text-center p-4">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Mutu A (&ge;85.0)
              </span>
              <p className="text-2xl font-black font-heading text-emerald-700 mt-1">
                {gradeDistribution.A}
              </p>
              <span className="text-[10px] text-muted-foreground">Sangat Baik</span>
            </Card>

            <Card className="border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 text-center p-4">
              <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                Mutu A- (80-84.9)
              </span>
              <p className="text-2xl font-black font-heading text-teal-700 mt-1">
                {gradeDistribution["A-"]}
              </p>
              <span className="text-[10px] text-muted-foreground">Amat Baik</span>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 text-center p-4">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                Mutu B+ (75-79.9)
              </span>
              <p className="text-2xl font-black font-heading text-blue-700 mt-1">
                {gradeDistribution["B+"]}
              </p>
              <span className="text-[10px] text-muted-foreground">Baik Sekali</span>
            </Card>

            <Card className="border-cyan-200 bg-cyan-50/50 dark:bg-cyan-950/20 text-center p-4">
              <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                Mutu B (70-74.9)
              </span>
              <p className="text-2xl font-black font-heading text-cyan-700 mt-1">
                {gradeDistribution.B}
              </p>
              <span className="text-[10px] text-muted-foreground">Batas Kelulusan Minimal</span>
            </Card>

            <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 text-center p-4 col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                Remedial (&lt;70.0)
              </span>
              <p className="text-2xl font-black font-heading text-rose-700 mt-1">
                {gradeDistribution.remedial}
              </p>
              <span className="text-[10px] text-muted-foreground">Perlu Ujian Ulang</span>
            </Card>
          </div>

          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">
                Standar Penilaian Mutu Akademik RSUD H. Andi Sulthan Daeng Radja Bulukumba
              </CardTitle>
              <CardDescription className="text-xs">
                Pedoman penetapan nilai akhir stase praktik klinik dan MPPD kedokteran berdasarkan Keputusan Direktur RSUD Bulukumba.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/40 rounded-lg border">
                  <h4 className="font-semibold text-foreground mb-1">1. Bobot Keterampilan (40%)</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Diukur melalui Mini-CEX, DOPS, tindakan medis aseptik, pengkajian langsung ke pasien, dan keterampilan prosedur SOP.
                  </p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg border">
                  <h4 className="font-semibold text-foreground mb-1">2. Bobot Sikap &amp; Etika (30%)</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Diukur melalui kedisiplinan jadwal jaga, komunikasi terapeutik, etika profesi, kepatuhan hak pasien, dan patient safety.
                  </p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg border">
                  <h4 className="font-semibold text-foreground mb-1">3. Bobot Pengetahuan (30%)</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Diukur melalui Case-Based Discussion (CBD), responsi bedside teaching bersama DPJP, dan penguasaan jurnal/EBM.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: ANTREAN MAHASISWA SIAP DINILAI */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Daftar mahasiswa stase aktif atau selesai yang belum dinilai atau masih berstatus draf:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligiblePlacements.map((p) => (
              <Card key={p.id} className="border-border/80 hover:border-primary/40 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {p.student_nim}
                    </span>
                    {p.existing_assessment_id ? (
                      p.is_finalized ? (
                        <Badge className="bg-emerald-600 text-white text-[10px]">Nilai Final</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
                          Draf
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-slate-600 border-dashed text-[10px]">
                        Belum Dinilai
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">
                    {p.student_name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {p.study_program_name} &bull; {p.institution_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3 w-3 text-primary" />
                      {p.room_name} (Stase #{p.rotation_order})
                    </span>
                    <span>{p.start_date} s.d. {p.end_date}</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full text-xs font-semibold mt-2 gap-1.5"
                    onClick={() => handleOpenNewForm(p.id)}
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>{p.existing_assessment_id ? "Buka Evaluasi" : "Nilai Sekarang"}</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal Dialog Form Penilaian */}
      <AssessmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        eligiblePlacements={eligiblePlacements}
        editingAssessment={selectedAssessmentToEdit}
        initialPlacementId={initialPlacementId}
      />

      {/* Modal Dialog Cetak Lembar Evaluasi */}
      <EvaluationSheetDialog
        open={isPrintOpen}
        onOpenChange={setIsPrintOpen}
        assessment={selectedAssessmentToPrint}
      />
    </div>
  )
}
