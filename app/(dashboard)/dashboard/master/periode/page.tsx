import { createClient } from "@/lib/supabase/server"
import { PeriodManager } from "@/components/master/period-manager"
import { Period } from "@/types"

export default async function PeriodePage() {
  const supabase = await createClient()

  const { data: periods } = await supabase
    .from("periods")
    .select("*")
    .order("start_date", { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Daftar Periode &amp; Gelombang Praktik
        </h2>
        <p className="text-xs text-muted-foreground">
          Kelola jadwal batch praktik klinik mahasiswa profesi dan kepaniteraan MPPD Kedokteran.
        </p>
      </div>

      <PeriodManager initialData={(periods as Period[]) || []} />
    </div>
  )
}
