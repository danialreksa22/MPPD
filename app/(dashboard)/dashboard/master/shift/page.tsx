import { getWorkShiftsAction } from "@/actions/shifts"
import { ShiftsManager } from "@/components/master/shifts-manager"

export const metadata = {
  title: "Master Data Shift & Jam Dinas — MAGGURU",
  description:
    "Pengelolaan data shift kerja dinas (Pagi, Siang, Malam/Jaga, Non-Shift) dan toleransi keterlambatan mahasiswa RSUD H. Andi Sulthan Daeng Radja Bulukumba.",
}

export const dynamic = "force-dynamic"

export default async function ShiftMasterPage() {
  const shiftsRes = await getWorkShiftsAction()
  const shifts = shiftsRes.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Shift Kerja &amp; Jam Absensi Dinas
        </h2>
        <p className="text-xs text-muted-foreground">
          Konfigurasi jadwal jam dinas masuk, jam pulang, jendela buka check-in/out, toleransi menit keterlambatan, dan status dinas lintas hari.
        </p>
      </div>

      <ShiftsManager initialShifts={shifts} />
    </div>
  )
}
