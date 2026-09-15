import {
  getLettersAction,
  getEligibleApplicationsForLetterAction,
  getEligibleStudentsForCompletionLetterAction,
} from "@/actions/letters"
import { getOfficialsAction } from "@/actions/officials"
import { LetterManager } from "@/components/letters/letter-manager"

export default async function SuratPage() {
  const [lettersRes, eligibleAppsRes, eligibleStudentsRes, officialsRes] = await Promise.all([
    getLettersAction(),
    getEligibleApplicationsForLetterAction(),
    getEligibleStudentsForCompletionLetterAction(),
    getOfficialsAction({ isActive: true }),
  ])

  return (
    <LetterManager
      initialLetters={lettersRes.data || []}
      eligibleApplications={eligibleAppsRes.data || []}
      eligibleStudents={eligibleStudentsRes.data || []}
      officials={officialsRes.data || []}
    />
  )
}
