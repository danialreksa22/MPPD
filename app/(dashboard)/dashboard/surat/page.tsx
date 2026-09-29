import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"
import {
  getLettersAction,
  getEligibleApplicationsForLetterAction,
  getEligibleStudentsForCompletionLetterAction,
} from "@/actions/letters"
import { getOfficialsAction } from "@/actions/officials"
import { LetterManager } from "@/components/letters/letter-manager"

export default async function SuratPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (user.role === USER_ROLES.MAHASISWA) {
    redirect("/dashboard")
  }

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
