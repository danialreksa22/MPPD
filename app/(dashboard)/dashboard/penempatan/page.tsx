import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import {
  getPlacementsAction,
  getEligibleStudentsForPlacementAction,
} from "@/actions/placements"
import { PlacementManager } from "@/components/placements/placement-manager"
import { RoomUnit, Preceptor, Period } from "@/types"

export default async function PenempatanPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (user.role === USER_ROLES.MAHASISWA) {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  const [
    placementsRes,
    eligibleRes,
    { data: rooms },
    { data: preceptors },
    { data: periods },
  ] = await Promise.all([
    getPlacementsAction(),
    getEligibleStudentsForPlacementAction(),
    supabase.from("rooms_units").select("*").eq("is_active", true).order("name"),
    supabase.from("preceptors").select("*").eq("is_active", true).order("name"),
    supabase.from("periods").select("*").order("start_date", { ascending: false }),
  ])

  return (
    <PlacementManager
      initialPlacements={placementsRes.data || []}
      eligibleStudents={eligibleRes.data || []}
      rooms={(rooms as RoomUnit[]) || []}
      preceptors={(preceptors as Preceptor[]) || []}
      periods={(periods as Period[]) || []}
    />
  )
}
