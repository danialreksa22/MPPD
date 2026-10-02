"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Star, Loader2, Sparkles, Shield, HeartHandshake, Building2, Stethoscope, ShieldAlert } from "lucide-react"
import { submitStaseEvaluationAction } from "@/actions/evaluations"
import { EVALUATION_ASPECTS } from "@/lib/validations/evaluations"

export interface PlacementToEvaluate {
  id: string
  room_id: string
  room_name: string
  rotation_order: number
  start_date: string
  end_date: string
  preceptor_id?: string | null
  preceptor_name?: string | null
  already_evaluated?: boolean
}

interface EvaluationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  placement: PlacementToEvaluate | null
  studentId: string
  onSuccess?: () => void
}

export function EvaluationFormDialog({
  open,
  onOpenChange,
  placement,
  studentId,
  onSuccess,
}: EvaluationFormDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 4 Skor Aspek (1 - 5)
  const [teachingScore, setTeachingScore] = useState<number>(5)
  const [facilitiesScore, setFacilitiesScore] = useState<number>(4)
  const [casesScore, setCasesScore] = useState<number>(4)
  const [safetyScore, setSafetyScore] = useState<number>(5)

  const [strengths, setStrengths] = useState<string>("")
  const [suggestions, setSuggestions] = useState<string>("")
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true)

  const aspectIcons = [
    <HeartHandshake key="1" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    <Building2 key="2" className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
    <Stethoscope key="3" className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
    <ShieldAlert key="4" className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  ]

  const scores = [teachingScore, facilitiesScore, casesScore, safetyScore]
  const setters = [setTeachingScore, setFacilitiesScore, setCasesScore, setSafetyScore]

  const currentOverall = ((teachingScore + facilitiesScore + casesScore + safetyScore) / 4).toFixed(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!placement) return

    startTransition(async () => {
      const res = await submitStaseEvaluationAction({
        placement_id: placement.id,
        student_id: studentId,
        room_id: placement.room_id,
        preceptor_id: placement.preceptor_id || null,
        aspect_teaching_score: teachingScore,
        aspect_facilities_score: facilitiesScore,
        aspect_cases_score: casesScore,
        aspect_safety_score: safetyScore,
        strengths: strengths.trim() || undefined,
        suggestions: suggestions.trim() || undefined,
        is_anonymous: isAnonymous,
      })

      if (res.success) {
        alert(res.message)
        onOpenChange(false)
        onSuccess?.()
        router.refresh()
      } else {
        alert(res.message || "Gagal mengirim kuesioner evaluasi.")
      }
    })
  }

  if (!placement) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300">
              Evaluasi Mutu Stase Komkordik
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Stase #{placement.rotation_order}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Kuesioner Kepuasan &amp; Evaluasi Balik Mahasiswa
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {placement.room_name} &bull; Periode: {placement.start_date} s/d {placement.end_date}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Skor Rata-Rata Dinamis */}
          <div className="p-3 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-xl border border-emerald-300/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground block">
                Indeks Kepuasan Keseluruhan
              </span>
              <span className="text-[11px] text-muted-foreground">
                Kalkulasi rata-rata 4 aspek standar RS Pendidikan
              </span>
            </div>
            <div className="flex items-center gap-1 bg-background px-3 py-1.5 rounded-lg border border-border font-mono font-extrabold text-lg text-emerald-700 dark:text-emerald-400 shadow-2xs">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              <span>{currentOverall} / 5.0</span>
            </div>
          </div>

          {/* 4 Komponen Aspek Standar Komkordik */}
          <div className="space-y-3">
            {EVALUATION_ASPECTS.map((aspect, idx) => (
              <div
                key={aspect.key}
                className="p-3 rounded-xl border border-border bg-card space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded-md bg-muted mt-0.5">{aspectIcons[idx]}</div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-tight">
                        {aspect.label}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        {aspect.desc}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold font-mono shrink-0">
                    Skor: {scores[idx]}
                  </Badge>
                </div>

                {/* Rating Bintang Interaktif */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setters[idx](star)}
                      className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold ${
                        star <= scores[idx]
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= scores[idx] ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                        }`}
                      />
                      <span>{star}</span>
                    </button>
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {scores[idx] === 5
                      ? "Sangat Baik"
                      : scores[idx] === 4
                      ? "Baik"
                      : scores[idx] === 3
                      ? "Cukup"
                      : scores[idx] === 2
                      ? "Kurang"
                      : "Sangat Kurang"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Hal Positif / Kelebihan Ruangan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Hal-Hal Positif Selama Bimbingan di Ruangan Ini (Opsional)
            </label>
            <Textarea
              placeholder="Contoh: Pembimbing sangat sabar dalam mengajarkan teknik anamnesis dan diskusi kasus harian..."
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Saran Konstruktif untuk Perbaikan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Saran &amp; Masukan Perbaikan untuk Ruangan / Diklat (Opsional)
            </label>
            <Textarea
              placeholder="Contoh: Ketersediaan handrub dan APD di dekat troli tindakan mohon dapat ditambah..."
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Pengaturan Privasi Anonim */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-start gap-2.5">
            <input
              type="checkbox"
              id="is_anonymous_check"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mt-0.5 rounded-xs"
            />
            <label htmlFor="is_anonymous_check" className="text-xs cursor-pointer select-none">
              <span className="font-bold text-foreground block flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Kirim sebagai Evaluasi Anonim (Direkomendasikan)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Nama dan NIM Anda tidak akan diperlihatkan kepada pembimbing ruangan demi menjamin independensi dan kejujuran evaluasi.
              </span>
            </label>
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
              disabled={isPending}
              className="text-xs gap-1.5 bg-primary font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Mengirimkan Evaluasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Kirim Kuesioner Evaluasi</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
