import { getServiceTypesAction } from "@/actions/service-types"
import { ServiceTypesManager } from "@/components/master/service-types-manager"

export const metadata = {
  title: "Master Data Jenis Pelayanan — MAGGURU",
  description:
    "Pengelolaan katalog jenis pelayanan rumah sakit (Rawat Jalan, Rawat Inap, Gawat Darurat, Kamar Operasi, ICU, Penunjang) RSUD H. Andi Sulthan Daeng Radja Bulukumba.",
}

export const dynamic = "force-dynamic"

export default async function ServiceTypesMasterPage() {
  const res = await getServiceTypesAction()
  const serviceTypes = res.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Katalog Jenis Pelayanan Rumah Sakit
        </h2>
        <p className="text-xs text-muted-foreground">
          Konfigurasi jenis layanan medis, asuhan keperawatan, penunjang diagnostik, dan unit penempatan stase dinas mahasiswa.
        </p>
      </div>

      <ServiceTypesManager initialServiceTypes={serviceTypes} />
    </div>
  )
}
