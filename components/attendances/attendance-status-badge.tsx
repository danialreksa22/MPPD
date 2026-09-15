import { Badge } from "@/components/ui/badge"
import { ATTENDANCE_STATUS_LABELS, AttendanceStatus } from "@/lib/constants"
import { CheckCircle2, Clock, AlertCircle, XCircle, ShieldCheck } from "lucide-react"

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
  isApproved?: boolean
  showApproval?: boolean
  className?: string
}

export function AttendanceStatusBadge({
  status,
  isApproved = false,
  showApproval = false,
  className = "",
}: AttendanceStatusBadgeProps) {
  const config = ATTENDANCE_STATUS_LABELS[status] || {
    label: status,
    color: "bg-muted text-muted-foreground border-border",
  }

  const renderIcon = () => {
    switch (status) {
      case "hadir":
        return <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      case "izin":
        return <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
      case "sakit":
        return <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
      case "alpa":
        return <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
      default:
        return null
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <Badge
        variant="outline"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium border ${config.color} ${className}`}
      >
        {renderIcon()}
        <span>{config.label}</span>
      </Badge>

      {showApproval && (
        <Badge
          variant="outline"
          className={`text-[10px] font-medium ${
            isApproved
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
          }`}
        >
          {isApproved ? (
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Disetujui
            </span>
          ) : (
            "Menunggu Review"
          )}
        </Badge>
      )}
    </div>
  )
}
