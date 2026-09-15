import { createClient } from "@/lib/supabase/server"
import { StudyProgramManager } from "@/components/master/study-program-manager"
import { StudyProgram, Institution } from "@/types"

export default async function ProgramStudiPage() {
  const supabase = await createClient()

  const [{ data: programs }, { data: institutions }] = await Promise.all([
    supabase
      .from("study_programs")
      .select("*, institutions(name)")
      .order("name", { ascending: true }),
    supabase
      .from("institutions")
      .select("*")
      .order("name", { ascending: true }),
  ])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Daftar Program Studi &amp; Profesi
        </h2>
        <p className="text-xs text-muted-foreground">
          Kelola program studi yang terafiliasi dengan institusi pendidikan mitra di RSUD Bulukumba.
        </p>
      </div>

      <StudyProgramManager
        initialData={(programs as (StudyProgram & { institutions?: { name: string } | null })[]) || []}
        institutions={(institutions as Institution[]) || []}
      />
    </div>
  )
}
