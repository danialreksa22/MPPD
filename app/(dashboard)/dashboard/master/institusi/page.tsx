import { createClient } from "@/lib/supabase/server"
import { InstitutionManager } from "@/components/master/institution-manager"
import { Institution } from "@/types"

export default async function InstitusiPage() {
  const supabase = await createClient()

  const { data: institutions } = await supabase
    .from("institutions")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Daftar Institusi Pendidikan Mitra
        </h2>
        <p className="text-xs text-muted-foreground">
          Kelola data kampus, universitas, STIKES, dan politeknik mitra praktik klinik &amp; MPPD RSUD Bulukumba.
        </p>
      </div>

      <InstitutionManager initialData={(institutions as Institution[]) || []} />
    </div>
  )
}
