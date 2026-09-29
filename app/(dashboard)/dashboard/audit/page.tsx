import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"
import { getAuditLogsAction } from "@/actions/audit"
import { AuditTrailManager } from "@/components/audit/audit-trail-manager"
import { ShieldAlert, FileText, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Audit Trail & Keamanan Forensik — MAGGURU",
  description:
    "Log audit forensik, rekam mutasi data, dan kepatuhan UU Pelindungan Data Pribadi (PDP) RSUD H. Andi Sulthan Daeng Radja Bulukumba.",
}

export const dynamic = "force-dynamic"

export default async function AuditTrailPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (user.role !== USER_ROLES.SUPER_ADMIN && user.role !== USER_ROLES.DIREKTUR) {
    redirect("/dashboard")
  }

  const auditRes = await getAuditLogsAction({ limit: 150 })
  const logs = auditRes.data || []

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Audit Trail &amp; Keamanan Forensik
            </h1>
            <p className="text-xs text-muted-foreground">
              Pemantauan integritas data rotasi &amp; presensi klinik, kepatuhan tata kelola, serta rekam jejak anti-tampering sistem MAGGURU RSUD Bulukumba.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>RS Pendidikan Terakreditasi</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>UU PDP No. 27/2022</span>
          </div>
        </div>
      </div>

      {/* Main Audit Trail Component */}
      <AuditTrailManager initialLogs={logs} />
    </div>
  )
}
