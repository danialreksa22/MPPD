import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  label?: string
}

export function LoadingSpinner({
  className,
  size = "md",
  label = "Memuat data...",
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 p-6 text-muted-foreground", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {label && <p className="text-xs font-medium">{label}</p>}
    </div>
  )
}
