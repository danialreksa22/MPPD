import { createClient } from "@/lib/supabase/server"
import { PreceptorManager } from "@/components/master/preceptor-manager"
import { Preceptor } from "@/types"

export default async function PreceptorPage() {
  const supabase = await createClient()

  const { data: preceptors } = await supabase
    .from("preceptors")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Daftar Pembimbing Klinik &amp; Supervisor Dokter
        </h2>
        <p className="text-xs text-muted-foreground">
          Kelola data Clinical Instructor (CI) dan Dokter DPJP pembimbing kepaniteraan klinik MPPD RSUD Bulukumba.
        </p>
      </div>

      <PreceptorManager initialData={(preceptors as Preceptor[]) || []} />
    </div>
  )
}
