import { createClient } from "@/lib/supabase/server"
import { RoomManager } from "@/components/master/room-manager"
import { RoomUnit } from "@/types"

export default async function RuanganPage() {
  const supabase = await createClient()

  const { data: rooms } = await supabase
    .from("rooms_units")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Daftar Ruangan Pelayanan &amp; Kuota Mahasiswa
        </h2>
        <p className="text-xs text-muted-foreground">
          Kelola unit pelayanan, kapasitas tampung per stase, serta lokasi ruangan di RSUD Bulukumba.
        </p>
      </div>

      <RoomManager initialData={(rooms as RoomUnit[]) || []} />
    </div>
  )
}
