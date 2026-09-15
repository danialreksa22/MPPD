import { createClient } from "@/lib/supabase/server"
import { NewApplicationContainer } from "@/components/applications/new-application-container"
import { Institution, Period, StudyProgram, RoomUnit } from "@/types"

export default async function PengajuanBaruPage() {
  const supabase = await createClient()

  const [
    { data: institutions },
    { data: periods },
    { data: studyPrograms },
    { data: rooms },
  ] = await Promise.all([
    supabase.from("institutions").select("*").eq("is_active", true).order("name"),
    supabase.from("periods").select("*").order("start_date", { ascending: false }),
    supabase.from("study_programs").select("*").order("name"),
    supabase.from("rooms_units").select("*").eq("is_active", true).order("name"),
  ])

  return (
    <NewApplicationContainer
      institutions={(institutions as Institution[]) || []}
      periods={(periods as Period[]) || []}
      studyPrograms={(studyPrograms as StudyProgram[]) || []}
      rooms={(rooms as RoomUnit[]) || []}
    />
  )
}
