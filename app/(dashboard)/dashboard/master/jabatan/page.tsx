import { getPositionsAction } from "@/actions/positions"
import { PositionsManager } from "@/components/master/positions-manager"

export const metadata = {
  title: "Master Data Jabatan — MAGGURU",
  description:
    "Pengelolaan katalog jabatan struktural, fungsional medik, kepala ruangan, dan pengelola komite koordinasi pendidikan RSUD H. Andi Sulthan Daeng Radja Bulukumba.",
}

export const dynamic = "force-dynamic"

export default async function PositionsMasterPage() {
  const res = await getPositionsAction()
  const positions = res.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Katalog Jabatan Rumah Sakit &amp; Komkordik
        </h2>
        <p className="text-xs text-muted-foreground">
          Pengaturan nama posisi, kode jabatan, kategori struktural/fungsional, dan level wewenang pembimbingan klinik.
        </p>
      </div>

      <PositionsManager initialPositions={positions} />
    </div>
  )
}
