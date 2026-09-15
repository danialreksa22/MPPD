import { z } from "zod"

export const reportFilterSchema = z.object({
  period_id: z.string().optional().default("all"),
  institution_id: z.string().optional().default("all"),
  room_id: z.string().optional().default("all"),
  student_category: z.enum(["all", "praktik_klinik", "mppd"]).optional().default("all"),
  year: z.coerce.number().optional().default(new Date().getFullYear()),
})

export type ReportFilterInput = z.infer<typeof reportFilterSchema>

export interface DashboardKpiData {
  totalStudents: number
  activePlacements: number
  completedPlacements: number
  activeMoUCount: number
  avgOccupancyRate: number
  avgAttendanceRate: number
  avgClinicalScore: number
  passRate: number
}

export interface MonthlyTrendData {
  month: string
  shortMonth: string
  mppd: number
  praktik_klinik: number
  total: number
}

export interface RoomOccupancyData {
  id: string
  name: string
  code: string | null
  capacity: number
  activeStudents: number
  occupancyRate: number
  serviceType: string
  status: "aman" | "hampir_penuh" | "penuh"
}

export interface InstitutionDistributionData {
  id: string
  name: string
  studentCount: number
  percentage: number
  color: string
}

export interface StudyProgramDistributionData {
  id: string
  name: string
  degree: string | null
  studentCount: number
  institutionName: string
}

export interface AccreditationSummary {
  standardCode: string
  hospitalName: string
  division: string
  evaluationYear: number
  totalEducatedStudents: number
  totalActiveClinicalMentors: number
  totalPartnerUniversities: number
  mentorToStudentRatio: string
  complianceScore: number
  attendanceAverage: number
  averagePassScore: number
}

export interface AccreditationStudentItem {
  nim: string
  fullName: string
  institutionName: string
  studyProgramName: string
  type: "praktik_klinik" | "mppd"
  roomName: string
  periodName: string
  startDate: string
  endDate: string
  attendanceRate: number
  finalScore: number | null
  gradeLetter: string | null
}

export interface AccreditationReportDataset {
  summary: AccreditationSummary
  students: AccreditationStudentItem[]
  roomOccupancy: RoomOccupancyData[]
  institutions: {
    id: string
    name: string
    mouNumber: string | null
    mouValidUntil: string | null
    studentCount: number
    isActive: boolean
  }[]
}
