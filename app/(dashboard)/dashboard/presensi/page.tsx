import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"
import {
  getTodayAttendancesAction,
  getAttendanceSummaryAction,
} from "@/actions/attendances"
import { getWorkShiftsAction } from "@/actions/shifts"
import { AttendanceManager } from "@/components/attendances/attendance-manager"
import { RoomUnit, Period } from "@/types"

export default async function PresensiPage() {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()
  const isStudent = currentUser?.role === USER_ROLES.MAHASISWA

  const [
    todayRes,
    summaryRes,
    shiftsRes,
    { data: rooms },
    { data: periods },
    { data: rawPlacements },
  ] = await Promise.all([
    getTodayAttendancesAction(),
    getAttendanceSummaryAction(),
    getWorkShiftsAction(true),
    supabase.from("rooms_units").select("*").eq("is_active", true).order("name"),
    supabase.from("periods").select("*").order("start_date", { ascending: false }),
    supabase
      .from("placements")
      .select(
        `
        id,
        student_id,
        room_id,
        rotation_order,
        students (nim, full_name),
        rooms_units (name)
      `
      )
      .in("status", ["active", "scheduled"]),
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

  const allPlacements = (rawPlacements || []).map((p) => {
    const student = p.students as unknown as { nim: string; full_name: string } | null
    const room = p.rooms_units as unknown as { name: string } | null
    return {
      id: p.id,
      student_id: p.student_id,
      student_name: student?.full_name || "Mahasiswa",
      student_nim: student?.nim || "-",
      room_id: p.room_id,
      room_name: room?.name || "Ruangan",
      rotation_order: p.rotation_order,
    }
  })

  const activePlacements = isStudent && studentId
    ? allPlacements.filter((p) => p.student_id === studentId)
    : allPlacements

  const initialAttendances = isStudent && studentId
    ? (todayRes.data || []).filter((a) => a.student_id === studentId)
    : todayRes.data || []

  const summaryData = isStudent && studentId
    ? (summaryRes.data || []).filter((s) => s.student_id === studentId)
    : summaryRes.data || []

  return (
    <AttendanceManager
      initialAttendances={initialAttendances}
      summaryData={summaryData}
      activePlacements={activePlacements}
      rooms={(rooms as RoomUnit[]) || []}
      periods={(periods as Period[]) || []}
      shifts={shiftsRes.data || []}
      isStudent={isStudent}
    />
  )
}

