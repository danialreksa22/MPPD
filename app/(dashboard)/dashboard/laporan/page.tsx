import {
  getReportFilterOptionsAction,
  getDashboardAnalyticsAction,
  getAccreditationReportDataAction,
} from "@/actions/reports"
import { ReportsManager } from "@/components/reports/reports-manager"
import { ShieldCheck, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function LaporanPage() {
  const [filterOptsRes, analyticsRes, accredRes] = await Promise.all([
    getReportFilterOptionsAction(),
    getDashboardAnalyticsAction(),
    getAccreditationReportDataAction(),
  ])

  const filterOptions = {
    periods: filterOptsRes.periods || [],
    institutions: filterOptsRes.institutions || [],
    rooms: filterOptsRes.rooms || [],
  }

  const initialAnalytics = analyticsRes.data || {
    kpi: {
      totalStudents: 0,
      activePlacements: 0,
      completedPlacements: 0,
      activeMoUCount: 0,
      avgOccupancyRate: 0,
      avgAttendanceRate: 0,
      avgClinicalScore: 0,
      passRate: 0,
    },
    monthlyTrend: [],
    roomOccupancy: [],
    institutionDistribution: [],
    studyProgramDistribution: [],
  }

  const initialAccreditation = accredRes.data || {
    summary: {
      standardCode: "Standar RS Pendidikan",
      hospitalName: "RSUD H. Andi Sulthan Daeng Radja Bulukumba",
      division: "Bidang Pendidikan dan Pelatihan (Diklat)",
      evaluationYear: new Date().getFullYear(),
      totalEducatedStudents: 0,
      totalActiveClinicalMentors: 0,
      totalPartnerUniversities: 0,
      mentorToStudentRatio: "1 : 5",
      complianceScore: 100,
      attendanceAverage: 0,
      averagePassScore: 0,
    },
    students: [],
    roomOccupancy: [],
    institutions: [],
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman (Non-Printable) */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 dark:border-slate-800 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pusat Analitik & Laporan Komprehensif
            </h1>
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px]">
              <ShieldCheck className="h-3 w-3" />
              RS Pendidikan Utama
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoring dinamika rotasi mahasiswa, okupansi ruangan, tingkat kepatuhan stase, dan instrumen evaluasi pendidikan RSUD Bulukumba.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 text-xs gap-1.5 py-1 px-2.5">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
            Recharts v3 &bull; Multi-Sheet XLSX
          </Badge>
        </div>
      </div>

      {/* Main Reports Manager */}
      <ReportsManager
        initialAnalytics={initialAnalytics}
        initialAccreditation={initialAccreditation}
        filterOptions={filterOptions}
      />
    </div>
  )
}
