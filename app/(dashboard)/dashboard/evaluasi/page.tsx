import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"
import { getStaseEvaluationsAction } from "@/actions/evaluations"
import { StaseEvaluationManager } from "@/components/evaluations/stase-evaluation-manager"
import { PlacementToEvaluate } from "@/components/evaluations/evaluation-form-dialog"
import { RoomUnit } from "@/types"

export const dynamic = "force-dynamic"

export default async function EvaluasiPage() {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()
  const isStudent = currentUser?.role === USER_ROLES.MAHASISWA

  let currentStudentId: string | null = null
  if (isStudent && currentUser) {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
      .maybeSingle()
    currentStudentId = student?.id || currentUser.id
  }

  const [evaluationsRes, { data: rooms }, { data: rawPlacements }] = await Promise.all([
    getStaseEvaluationsAction(),
    supabase.from("rooms_units").select("*").eq("is_active", true).order("name"),
    currentStudentId
      ? supabase
          .from("placements")
          .select(
            `
            id,
            room_id,
            rotation_order,
            start_date,
            end_date,
            rooms_units (name),
            preceptors (id, name)
          `
          )
          .eq("student_id", currentStudentId)
          .order("rotation_order", { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  const myPlacements: PlacementToEvaluate[] = (rawPlacements || []).map((p) => {
    const room = p.rooms_units as unknown as { name: string } | null
    const preceptor = p.preceptors as unknown as { id: string; name: string } | null
    return {
      id: p.id,
      room_id: p.room_id,
      room_name: room?.name || "Ruangan",
      rotation_order: p.rotation_order,
      start_date: p.start_date,
      end_date: p.end_date,
      preceptor_id: preceptor?.id || null,
      preceptor_name: preceptor?.name || null,
    }
  })

  return (
    <StaseEvaluationManager
      evaluations={evaluationsRes.data || []}
      myPlacements={myPlacements}
      rooms={(rooms as RoomUnit[]) || []}
      currentStudentId={currentStudentId}
      isStudent={isStudent}
    />
  )
}
