import { createClient } from "@/lib/supabase/server"
import {
  getAssessmentsAction,
  getEligiblePlacementsForAssessmentAction,
} from "@/actions/assessments"
import { AssessmentManager } from "@/components/assessments/assessment-manager"
import { RoomUnit, StudyProgram } from "@/types"

export default async function PenilaianPage() {
  const supabase = await createClient()

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

  return (
    <AssessmentManager
      initialAssessments={assessmentsRes.data || []}
      eligiblePlacements={eligibleRes.data || []}
      rooms={(rooms as RoomUnit[]) || []}
      studyPrograms={(studyPrograms as StudyProgram[]) || []}
    />
  )
}
