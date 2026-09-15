import { createClient } from "@/lib/supabase/server"
import { getEligibleStudentsForPlacementAction } from "@/actions/placements"
import { MultiRotationBuilder } from "@/components/placements/multi-rotation-builder"
import { RoomUnit, Preceptor, Period } from "@/types"

export default async function RotasiMultiStasePage() {
  const supabase = await createClient()

  const [eligibleRes, { data: rooms }, { data: preceptors }, { data: periods }] =
    await Promise.all([
      getEligibleStudentsForPlacementAction(),
      supabase.from("rooms_units").select("*").eq("is_active", true).order("name"),
      supabase.from("preceptors").select("*").eq("is_active", true).order("name"),
      supabase.from("periods").select("*").order("start_date", { ascending: false }),
    ])

  return (
    <MultiRotationBuilder
      eligibleStudents={eligibleRes.data || []}
      rooms={(rooms as RoomUnit[]) || []}
      preceptors={(preceptors as Preceptor[]) || []}
      periods={(periods as Period[]) || []}
    />
  )
}
