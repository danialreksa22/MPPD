import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"
import { getRosterSchedulesAction, getRosterSwapsAction } from "@/actions/roster"
import { getWorkShiftsAction } from "@/actions/shifts"
import { RosterManager } from "@/components/roster/roster-manager"
import { RoomUnit } from "@/types"

export const dynamic = "force-dynamic"

export default async function RosterPage() {
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

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [
    schedulesRes,
    swapsRes,
    shiftsRes,
    { data: rooms },
    { data: rawPlacements },
  ] = await Promise.all([
    getRosterSchedulesAction({ month: currentMonth, year: currentYear }),
    getRosterSwapsAction(),
    getWorkShiftsAction(true),
    supabase.from("rooms_units").select("*").eq("is_active", true).order("name"),
    supabase
      .from("placements")
      .select(
        `
        id,
        student_id,
        room_id,
        students (id, nim, full_name)
      `
      )
      .in("status", ["active", "scheduled"]),
  ])

  const studentsList = (rawPlacements || []).map((p) => {
    const s = p.students as unknown as { id: string; nim: string; full_name: string } | null
    return {
      id: s?.id || p.student_id,
      nim: s?.nim || "-",
      full_name: s?.full_name || "Mahasiswa",
      room_id: p.room_id,
    }
  })

  // Jika mahasiswa, filter jadwal miliknya dan rekan satu ruangan
  const allSchedules = schedulesRes.data || []
  const initialSchedules = isStudent && currentStudentId
    ? allSchedules.filter((s) => s.student_id === currentStudentId)
    : allSchedules

  return (
    <RosterManager
      initialSchedules={initialSchedules}
      initialSwaps={swapsRes.data || []}
      rooms={(rooms as RoomUnit[]) || []}
      shifts={shiftsRes.data || []}
      students={studentsList}
      currentStudentId={currentStudentId}
      isStudent={isStudent}
    />
  )
}
