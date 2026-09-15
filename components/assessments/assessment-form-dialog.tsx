"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  FileEdit,
  GraduationCap,
  Sparkles,
} from "lucide-react"
import {
  EligiblePlacementItem,
  saveAssessmentAction,
  AssessmentWithRelations,
} from "@/actions/assessments"
import {
  calculateFinalScore,
  calculateGradeLetter,
  ASSESSMENT_RUBRIC_TEMPLATES,
  DEFAULT_ASSESSMENT_WEIGHTS,
} from "@/lib/constants"

interface AssessmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eligiblePlacements: EligiblePlacementItem[]
  editingAssessment?: AssessmentWithRelations | null
  initialPlacementId?: string | null
}

function detectRubric(
  placementId: string,
  eligiblePlacements: EligiblePlacementItem[],
  existingRubric?: string | null
) {
  if (existingRubric) return existingRubric
  const target = eligiblePlacements.find((p) => p.id === placementId)
  if (target) {
    const prodi = target.study_program_name.toLowerCase()
    if (prodi.includes("dokter") || prodi.includes("kedokteran") || prodi.includes("mppd")) {
      return "mppd_kedokteran"
    } else if (prodi.includes("perawat") || prodi.includes("ners")) {
      return "keperawatan"
    } else if (prodi.includes("bidan") || prodi.includes("kebidanan")) {
      return "kebidanan"
    }
  }
  return "standard"
}

function AssessmentFormInner({
  onOpenChange,
  eligiblePlacements,
  editingAssessment,
  initialPlacementId,
}: Omit<AssessmentFormDialogProps, "open">) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Default placement id
  const defaultPlacementId =
    editingAssessment?.placement_id ||
    initialPlacementId ||
    eligiblePlacements[0]?.id ||
    ""

  // Form State initialized once on mount
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>(defaultPlacementId)
  const [rubricKey, setRubricKey] = useState<string>(() =>
    detectRubric(
      defaultPlacementId,
      eligiblePlacements,
      editingAssessment?.rubric_template
    )
  )
  const [skillsScore, setSkillsScore] = useState<number>(
    editingAssessment?.score_clinical_skills ?? 80
  )
  const [attitudeScore, setAttitudeScore] = useState<number>(
    editingAssessment?.score_attitude ?? 85
  )
  const [knowledgeScore, setKnowledgeScore] = useState<number>(
    editingAssessment?.score_knowledge ?? 80
  )
  const [feedback, setFeedback] = useState<string>(editingAssessment?.feedback || "")
  const [assessmentDate, setAssessmentDate] = useState<string>(
    editingAssessment?.assessment_date || new Date().toISOString().split("T")[0]
  )

  // Cari data penempatan terpilih
  const selectedPlacement = eligiblePlacements.find((p) => p.id === selectedPlacementId)
  const isEditingLocked = Boolean(editingAssessment?.is_finalized)

  // Hitung live preview
  const liveFinalScore = calculateFinalScore(skillsScore, attitudeScore, knowledgeScore)
  const liveGrade = calculateGradeLetter(liveFinalScore)
  const rubric = ASSESSMENT_RUBRIC_TEMPLATES[rubricKey] || ASSESSMENT_RUBRIC_TEMPLATES.standard

  const handleSave = (asFinal: boolean) => {
    if (!selectedPlacement && !editingAssessment) {
      setErrorMsg("Pilih mahasiswa dan jadwal stase terlebih dahulu.")
      return
    }

    if (isEditingLocked) {
      setErrorMsg("Penilaian ini telah difinalisasi dan dikunci.")
      return
    }

    setErrorMsg(null)
    setSuccessMsg(null)

    const targetPlacementId = selectedPlacement?.id || editingAssessment?.placement_id
    const targetStudentId = selectedPlacement?.student_id || editingAssessment?.student_id

    if (!targetPlacementId || !targetStudentId) {
      setErrorMsg("Data penempatan atau mahasiswa tidak valid.")
      return
    }

    startTransition(async () => {
      const res = await saveAssessmentAction({
        id: editingAssessment?.id,
        placement_id: targetPlacementId,
        student_id: targetStudentId,
        score_clinical_skills: skillsScore,
        score_attitude: attitudeScore,
        score_knowledge: knowledgeScore,
        rubric_template: rubricKey,
        feedback: feedback.trim() || null,
        assessment_date: assessmentDate,
        is_finalized: asFinal,
      })

      if (!res.success) {
        setErrorMsg(res.message)
      } else {
        setSuccessMsg(res.message)
        setTimeout(() => {
          onOpenChange(false)
          router.refresh()
        }, 1200)
      }
    })
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg font-heading flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <span>
            {editingAssessment
              ? isEditingLocked
                ? "Lihat Penilaian Klinik (Terkunci)"
                : "Edit Penilaian Klinik Mahasiswa"
              : "Form Penilaian Klinik Stase"}
          </span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5 py-2 text-xs">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive border border-destructive/20 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Pilih Mahasiswa & Stase */}
        <div className="space-y-1.5">
          <Label htmlFor="placement-select" className="text-xs font-semibold">
            Pilih Mahasiswa Stase
          </Label>
          {editingAssessment ? (
            <div className="p-3 bg-muted/40 rounded-lg border flex flex-col gap-1">
              <span className="font-semibold text-foreground text-sm">
                {editingAssessment.students?.full_name} ({editingAssessment.students?.nim})
              </span>
              <span className="text-muted-foreground text-[11px]">
                {editingAssessment.students?.study_programs?.name} &bull;{" "}
                {editingAssessment.students?.institutions?.name} &bull; Ruangan:{" "}
                <strong className="text-primary font-medium">
                  {editingAssessment.placements?.rooms_units?.name}
                </strong>
              </span>
            </div>
          ) : (
            <Select
              value={selectedPlacementId}
              onValueChange={(val) => {
                if (val) {
                  setSelectedPlacementId(val)
                  const detected = detectRubric(val, eligiblePlacements)
                  setRubricKey(detected)
                }
              }}
            >
              <SelectTrigger id="placement-select" className="h-9 text-xs">
                <SelectValue placeholder="Pilih mahasiswa yang akan dinilai..." />
              </SelectTrigger>
              <SelectContent>
                {eligiblePlacements.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.student_name} ({p.student_nim}) — {p.room_name} (Stase #{p.rotation_order})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 2. Pilihan Rubrik Penilaian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              <span>Rubrik Kompetensi Profesi</span>
            </Label>
            <Select
              value={rubricKey}
              onValueChange={(val) => {
                if (val) setRubricKey(val)
              }}
              disabled={isEditingLocked}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ASSESSMENT_RUBRIC_TEMPLATES).map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id} className="text-xs">
                    {tmpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assessment-date" className="text-xs font-semibold">
              Tanggal Evaluasi Stase
            </Label>
            <Input
              id="assessment-date"
              type="date"
              className="h-9 text-xs"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              disabled={isEditingLocked}
            />
          </div>
        </div>

        {/* Rincian Sub-Kompetensi Rubrik Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Panduan Indikator Kompetensi: {rubric.name}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{rubric.description}</p>
        </div>

        {/* 3. Input 3 Komponen Nilai dengan Preview Bobot */}
        <div className="space-y-4 pt-1">
          {/* Komponen 1: Keterampilan */}
          <div className="border rounded-lg p-3.5 space-y-2 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-foreground">
                  1. Keterampilan Klinik (Clinical Skills)
                </span>
                <Badge variant="outline" className="ml-2 text-[10px] border-primary/30 text-primary">
                  Bobot {(DEFAULT_ASSESSMENT_WEIGHTS.skills * 100)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="h-8 w-20 text-center font-mono font-bold text-xs"
                  value={skillsScore}
                  onChange={(e) => setSkillsScore(Number(e.target.value))}
                  disabled={isEditingLocked}
                />
                <span className="text-muted-foreground text-[11px]">/ 100</span>
              </div>
            </div>
            <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
              {rubric.skillsItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Komponen 2: Sikap */}
          <div className="border rounded-lg p-3.5 space-y-2 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-foreground">
                  2. Sikap &amp; Perilaku Profesional (Attitude)
                </span>
                <Badge
                  variant="outline"
                  className="ml-2 text-[10px] border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                >
                  Bobot {(DEFAULT_ASSESSMENT_WEIGHTS.attitude * 100)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="h-8 w-20 text-center font-mono font-bold text-xs"
                  value={attitudeScore}
                  onChange={(e) => setAttitudeScore(Number(e.target.value))}
                  disabled={isEditingLocked}
                />
                <span className="text-muted-foreground text-[11px]">/ 100</span>
              </div>
            </div>
            <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
              {rubric.attitudeItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Komponen 3: Pengetahuan */}
          <div className="border rounded-lg p-3.5 space-y-2 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-foreground">
                  3. Pengetahuan &amp; Penalaran Klinis (Knowledge)
                </span>
                <Badge
                  variant="outline"
                  className="ml-2 text-[10px] border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300"
                >
                  Bobot {(DEFAULT_ASSESSMENT_WEIGHTS.knowledge * 100)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="h-8 w-20 text-center font-mono font-bold text-xs"
                  value={knowledgeScore}
                  onChange={(e) => setKnowledgeScore(Number(e.target.value))}
                  disabled={isEditingLocked}
                />
                <span className="text-muted-foreground text-[11px]">/ 100</span>
              </div>
            </div>
            <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-0.5">
              {rubric.knowledgeItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Live Score Summary Box */}
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs text-muted-foreground font-medium">
              Simulasi Nilai Akhir Terbobot (40% + 30% + 30%)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-heading font-black text-primary">
                {liveFinalScore.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                (Skala 100)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="font-bold text-sm text-foreground">
                  Mutu {liveGrade.letter}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  (IP: {liveGrade.gpa.toFixed(1)})
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                {liveGrade.passed ? "Lulus Ambang Stase" : "Perlu Remedial (<70.0)"}
              </span>
            </div>

            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center font-heading font-black text-base shadow-xs ${liveGrade.color}`}
            >
              {liveGrade.letter}
            </div>
          </div>
        </div>

        {/* 5. Catatan Kualitatif / Feedback */}
        <div className="space-y-1.5">
          <Label htmlFor="feedback-text" className="text-xs font-semibold">
            Umpan Balik &amp; Saran Pembimbing Klinik (Feedback DPJP/CI)
          </Label>
          <Textarea
            id="feedback-text"
            rows={3}
            placeholder="Berikan evaluasi performa klinis, catatan penguasaan kasus, dan saran pengembangan..."
            className="text-xs"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isEditingLocked}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Batal
        </Button>

        {!isEditingLocked && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isPending}
              className="gap-1.5 text-xs font-medium"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileEdit className="h-3.5 w-3.5" />
              )}
              <span>Simpan Draf</span>
            </Button>

            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              <span>Finalisasi &amp; Kunci Nilai</span>
            </Button>
          </div>
        )}
      </DialogFooter>
    </DialogContent>
  )
}

export function AssessmentFormDialog(props: AssessmentFormDialogProps) {
  const { open, onOpenChange, editingAssessment, initialPlacementId } = props

  if (!open) return null

  const formKey = editingAssessment?.id || initialPlacementId || "new_assessment_form"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AssessmentFormInner key={formKey} {...props} />
    </Dialog>
  )
}
