import { createClient } from "@/lib/supabase/server"
import {
  getTodayAttendancesAction,
  getAttendanceSummaryAction,
} from "@/actions/attendances"
import { getWorkShiftsAction } from "@/actions/shifts"
import { AttendanceManager } from "@/components/attendances/attendance-manager"
import { RoomUnit, Period } from "@/types"

export default async function PresensiPage() {
  const supabase = await createClient()

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

  const activePlacements = (rawPlacements || []).map((p) => {
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

  return (
    <AttendanceManager
      initialAttendances={todayRes.data || []}
      summaryData={summaryRes.data || []}
      activePlacements={activePlacements}
      rooms={(rooms as RoomUnit[]) || []}
      periods={(periods as Period[]) || []}
      shifts={shiftsRes.data || []}
    />
  )
}
