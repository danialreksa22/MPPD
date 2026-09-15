import { Badge } from "@/components/ui/badge"
import { PLACEMENT_STATUS_LABELS, PlacementStatus } from "@/lib/constants"
import { Calendar, PlayCircle, CheckCircle2, XCircle } from "lucide-react"

interface PlacementStatusBadgeProps {
  status: PlacementStatus
  className?: string
}

export function PlacementStatusBadge({ status, className = "" }: PlacementStatusBadgeProps) {
  const config = PLACEMENT_STATUS_LABELS[status] || {
    label: status,
    color: "bg-muted text-muted-foreground border-border",
  }

  const renderIcon = () => {
    switch (status) {
      case "scheduled":
        return <Calendar className="h-3 w-3" />
      case "active":
        return <PlayCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      case "completed":
        return <CheckCircle2 className="h-3 w-3 text-slate-600 dark:text-slate-400" />
      case "cancelled":
        return <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
      default:
        return null
    }
  }

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium border ${config.color} ${className}`}
    >
      {renderIcon()}
      <span>{config.label}</span>
    </Badge>
  )
}
