import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"
import {
  getAssessmentsAction,
  getEligiblePlacementsForAssessmentAction,
} from "@/actions/assessments"
import { AssessmentManager } from "@/components/assessments/assessment-manager"
import { RoomUnit, StudyProgram } from "@/types"

export default async function PenilaianPage() {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()
  const isStudent = currentUser?.role === USER_ROLES.MAHASISWA

  const [
    assessmentsRes,
    eligibleRes,
    { data: rooms },
    { data: studyPrograms },
  ] = await Promise.all([
    getAssessmentsAction(),
    getEligiblePlacementsForAssessmentAction(),
    supabase.from("rooms_units").select("*").eq("is_active", true).order("name"),
    supabase.from("study_programs").select("*").order("name"),
  ])

  let studentId: string | null = null
  if (isStudent && currentUser) {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
      .maybeSingle()
    studentId = student?.id || currentUser.id
  }

  const initialAssessments = isStudent && studentId
    ? (assessmentsRes.data || []).filter((a) => a.student_id === studentId)
    : assessmentsRes.data || []

  const eligiblePlacements = isStudent && studentId
    ? (eligibleRes.data || []).filter((p) => p.student_id === studentId)
    : eligibleRes.data || []

  return (
    <AssessmentManager
      initialAssessments={initialAssessments}
      eligiblePlacements={eligiblePlacements}
      rooms={(rooms as RoomUnit[]) || []}
      studyPrograms={(studyPrograms as StudyProgram[]) || []}
      isStudent={isStudent}
    />
  )
}

