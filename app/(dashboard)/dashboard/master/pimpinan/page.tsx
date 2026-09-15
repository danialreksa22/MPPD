import { getOfficialsAction } from "@/actions/officials"
import { OfficialsManager } from "@/components/master/officials-manager"

export const metadata = {
  title: "Master Data Pimpinan RSUD & Diklat — MAGGURU",
  description:
    "Pengelolaan data pimpinan struktural rumah sakit, Kepala Bidang Diklat, Ketua Komkordik, serta penandatangan naskah dinas resmi RSUD H. Andi Sulthan Daeng Radja Bulukumba.",
}

export const dynamic = "force-dynamic"

export default async function PimpinanMasterPage() {
  const officialsRes = await getOfficialsAction()
  const officials = officialsRes.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Pimpinan RSUD &amp; Kepala Bidang Diklat
        </h2>
        <p className="text-xs text-muted-foreground">
          Kelola pejabat struktural rumah sakit, kepala instalasi diklat, ketua komkordik, dan penetapan penandatangan utama naskah dinas resmi.
        </p>
      </div>

      <OfficialsManager initialOfficials={officials} />
    </div>
  )
}
