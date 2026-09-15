"use client"

import React, { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Printer,
  Award,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Calendar,
  Building2,
  User,
  GraduationCap,
} from "lucide-react"
import { AssessmentWithRelations } from "@/actions/assessments"
import {
  calculateGradeLetter,
  DEFAULT_ASSESSMENT_WEIGHTS,
  PASSING_SCORE_THRESHOLD,
  ASSESSMENT_RUBRIC_TEMPLATES,
} from "@/lib/constants"

interface EvaluationSheetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: AssessmentWithRelations | null
}

export function EvaluationSheetDialog({
  open,
  onOpenChange,
  assessment,
}: EvaluationSheetDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!assessment) return null

  const student = assessment.students
  const placement = assessment.placements
  const evaluator = assessment.evaluator

  const skillsScore = assessment.score_clinical_skills || 0
  const attitudeScore = assessment.score_attitude || 0
  const knowledgeScore = assessment.score_knowledge || 0
  const finalScore = assessment.final_score || 0

  const skillsWeighted = (skillsScore * DEFAULT_ASSESSMENT_WEIGHTS.skills).toFixed(2)
  const attitudeWeighted = (attitudeScore * DEFAULT_ASSESSMENT_WEIGHTS.attitude).toFixed(2)
  const knowledgeWeighted = (knowledgeScore * DEFAULT_ASSESSMENT_WEIGHTS.knowledge).toFixed(2)

  const gradeScale = calculateGradeLetter(finalScore)
  const isPassed = finalScore >= PASSING_SCORE_THRESHOLD

  // Deteksi template rubrik
  const rubricKey = assessment.rubric_template || "standard"
  const rubric = ASSESSMENT_RUBRIC_TEMPLATES[rubricKey] || ASSESSMENT_RUBRIC_TEMPLATES.standard

  const handlePrint = () => {
    window.print()
  }

  const formattedAssessmentDate = new Date(
    assessment.assessment_date || assessment.created_at
  ).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-heading flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Lembar Evaluasi Praktik Klinik Mahasiswa</span>
            </DialogTitle>
            <Badge
              variant={assessment.is_finalized ? "default" : "outline"}
              className={
                assessment.is_finalized
                  ? "bg-emerald-600 text-white"
                  : "border-amber-400 text-amber-700 bg-amber-50"
              }
            >
              {assessment.is_finalized ? "Nilai Final / Terkunci" : "Draf Sementara"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Printable Paper Area */}
        <div ref={printRef} className="p-6 sm:p-8 bg-card text-card-foreground space-y-6">
          {/* Header Kop Resmi */}
          <div className="text-center border-b-2 border-primary/40 pb-4">
            <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Pemerintah Kabupaten Bulukumba
            </h3>
            <h1 className="text-lg sm:text-xl font-heading font-black text-foreground uppercase tracking-tight">
              RSUD H. Andi Sulthan Daeng Radja
            </h1>
            <h2 className="text-xs sm:text-sm font-semibold text-primary uppercase">
              Instalasi Pendidikan &amp; Pelatihan (Diklat) &bull; Komkordik
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Jl. Serikaya No. 17, Kec. Ujung Bulu, Kab. Bulukumba, Sulawesi Selatan 92511
            </p>
            <div className="mt-3 inline-block bg-primary/10 text-primary px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
              Lembar Penilaian Evaluasi Praktik Klinik Stase
            </div>
          </div>

          {/* Identitas Mahasiswa & Stase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-muted/30 p-4 rounded-lg border border-border/60">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Nama Mahasiswa:</span>
                <span className="font-medium text-foreground">{student?.full_name || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">NIM / Stambuk:</span>
                <span className="font-mono text-foreground">{student?.nim || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Institusi Asal:</span>
                <span className="text-foreground">{student?.institutions?.name || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-semibold text-foreground pl-5.5">Program Studi:</span>
                <span className="text-foreground">
                  {student?.study_programs?.name || "-"}{" "}
                  {student?.study_programs?.degree ? `(${student.study_programs.degree})` : ""}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Stethoscope className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Stase / Ruangan:</span>
                <span className="font-semibold text-primary">
                  {placement?.rooms_units?.name || "-"} (Stase #{placement?.rotation_order || 1})
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Periode Dinas:</span>
                <span className="text-foreground">
                  {placement?.start_date} s.d. {placement?.end_date}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Pembimbing / CI:</span>
                <span className="text-foreground">
                  {placement?.preceptors?.name || evaluator?.full_name || "Preseptor Ruangan"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-semibold text-foreground pl-5.5">Rubrik Evaluasi:</span>
                <span className="text-foreground">{rubric.name}</span>
              </div>
            </div>
          </div>

          {/* Tabel Nilai Komponen */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rincian Capaian Evaluasi Stase
            </h4>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 font-semibold border-b text-foreground">
                  <tr>
                    <th className="p-2.5">No</th>
                    <th className="p-2.5">Komponen Kompetensi</th>
                    <th className="p-2.5 text-center">Bobot</th>
                    <th className="p-2.5 text-center">Skor Mentah (0-100)</th>
                    <th className="p-2.5 text-right">Nilai Terbobot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-2.5 font-medium text-center">1</td>
                    <td className="p-2.5">
                      <p className="font-semibold text-foreground">Keterampilan Klinik (Clinical Skills)</p>
                      <p className="text-[11px] text-muted-foreground">
                        {rubric.skillsItems.slice(0, 2).join("; ")}
                      </p>
                    </td>
                    <td className="p-2.5 text-center font-mono">40%</td>
                    <td className="p-2.5 text-center font-mono font-semibold">{skillsScore.toFixed(1)}</td>
                    <td className="p-2.5 text-right font-mono font-semibold">{skillsWeighted}</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-medium text-center">2</td>
                    <td className="p-2.5">
                      <p className="font-semibold text-foreground">Sikap &amp; Perilaku Profesional (Attitude)</p>
                      <p className="text-[11px] text-muted-foreground">
                        {rubric.attitudeItems.slice(0, 2).join("; ")}
                      </p>
                    </td>
                    <td className="p-2.5 text-center font-mono">30%</td>
                    <td className="p-2.5 text-center font-mono font-semibold">{attitudeScore.toFixed(1)}</td>
                    <td className="p-2.5 text-right font-mono font-semibold">{attitudeWeighted}</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-medium text-center">3</td>
                    <td className="p-2.5">
                      <p className="font-semibold text-foreground">Pengetahuan &amp; Penalaran Klinis (Knowledge)</p>
                      <p className="text-[11px] text-muted-foreground">
                        {rubric.knowledgeItems.slice(0, 2).join("; ")}
                      </p>
                    </td>
                    <td className="p-2.5 text-center font-mono">30%</td>
                    <td className="p-2.5 text-center font-mono font-semibold">{knowledgeScore.toFixed(1)}</td>
                    <td className="p-2.5 text-right font-mono font-semibold">{knowledgeWeighted}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-primary/5 font-semibold border-t-2 border-primary/30">
                  <tr>
                    <td colSpan={4} className="p-2.5 text-right font-bold text-foreground">
                      Nilai Akhir Stase:
                    </td>
                    <td className="p-2.5 text-right font-mono text-sm font-bold text-primary">
                      {finalScore.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Box Hasil Akhir & Mutu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card flex flex-col justify-center items-center text-center space-y-1">
              <span className="text-xs text-muted-foreground">Huruf Mutu &amp; Indeks Prestasi</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-heading font-black text-primary">
                  {gradeScale.letter}
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold text-foreground">{gradeScale.label}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">Bobot: {gradeScale.gpa.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card flex flex-col justify-center items-center text-center space-y-1">
              <span className="text-xs text-muted-foreground">Status Keputusan Stase</span>
              <div className="flex items-center gap-2">
                {isPassed ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-base">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>LULUS STASE KLINIK</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-base">
                    <AlertCircle className="h-5 w-5" />
                    <span>BELUM MEMENUHI SYARAT (REMEDIAL)</span>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                (Standar Kelulusan Stase RSUD Bulukumba: Minimal 70.00 / Mutu B)
              </span>
            </div>
          </div>

          {/* Feedback & Catatan Evaluasi */}
          {assessment.feedback && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Catatan &amp; Saran Pembimbing Klinik:
              </h4>
              <p className="text-xs text-foreground bg-muted/20 p-3 rounded border italic leading-relaxed">
                &ldquo;{assessment.feedback}&rdquo;
              </p>
            </div>
          )}

          {/* Kolom Tanda Tangan */}
          <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-center">
            <div>
              <p className="text-muted-foreground">Mengetahui,</p>
              <p className="font-semibold text-foreground">Kepala Instalasi Diklat RSUD</p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-[10px] text-muted-foreground italic">(Tanda Tangan &amp; Stempel)</span>
              </div>
              <p className="font-semibold text-foreground underline mt-1">
                drg. Hj. Rismayanti, M.Kes
              </p>
              <p className="text-[10px] text-muted-foreground">NIP. 19780512 200604 2 015</p>
            </div>

            <div>
              <p className="text-muted-foreground">Bulukumba, {formattedAssessmentDate}</p>
              <p className="font-semibold text-foreground">Preseptor / Dokter Pembimbing</p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-[10px] text-muted-foreground italic">(Tanda Tangan)</span>
              </div>
              <p className="font-semibold text-foreground underline mt-1">
                {placement?.preceptors?.name || evaluator?.full_name || "Pembimbing Ruangan"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {placement?.preceptors?.nip
                  ? `NIP. ${placement.preceptors.nip}`
                  : "Pembimbing Klinik RSUD Bulukumba"}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" />
            <span>Cetak Lembar Evaluasi (Print / PDF)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
