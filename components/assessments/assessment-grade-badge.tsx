import React from "react"
import { Badge } from "@/components/ui/badge"
import { calculateGradeLetter, PASSING_SCORE_THRESHOLD } from "@/lib/constants"
import { CheckCircle2, AlertCircle, Clock, Award } from "lucide-react"

interface AssessmentGradeBadgeProps {
  score: number | null
  gradeLetter?: string | null
  isFinalized?: boolean
  showDetails?: boolean
  size?: "sm" | "md" | "lg"
}

export function AssessmentGradeBadge({
  score,
  gradeLetter,
  isFinalized = false,
  showDetails = false,
  size = "md",
}: AssessmentGradeBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground border-dashed text-xs gap-1 font-normal"
      >
        <Clock className="h-3 w-3" />
        <span>Belum Dinilai</span>
      </Badge>
    )
  }

  const scale = calculateGradeLetter(score)
  const letter = gradeLetter || scale.letter
  const isPassed = score >= PASSING_SCORE_THRESHOLD

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.2",
    md: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3.5 py-1 font-bold",
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Badge
        variant="outline"
        className={`font-semibold border shadow-2xs gap-1.5 ${scale.color} ${sizeClasses[size]}`}
      >
        <Award className="h-3.5 w-3.5" />
        <span>Mutu {letter}</span>
        <span className="font-mono opacity-80">({score.toFixed(1)})</span>
      </Badge>

      {showDetails && (
        <div className="flex items-center gap-1.5 text-xs">
          {isPassed ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Lulus
            </span>
          ) : (
            <span className="text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Remedial
            </span>
          )}

          <span className="text-muted-foreground text-[10px]">
            • {isFinalized ? "Final" : "Draf"}
          </span>
        </div>
      )}
    </div>
  )
}
