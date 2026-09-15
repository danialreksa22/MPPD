import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Pusat Notifikasi & Pengingat Stase | MAGGURU RSUD Bulukumba",
  description:
    "Pusat komunikasi dinas, pengingat presensi digital harian, evaluasi preseptor, pemberitahuan akhir stase, dan siaran resmi RSUD H. Andi Sulthan Daeng Radja Bulukumba.",
}

export default function NotifikasiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-fit print:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Kembali ke Dashboard Utama</span>
      </Link>
      <div>{children}</div>
    </div>
  )
}
