import Link from "next/link"
import { MasterNav } from "@/components/master/master-nav"
import { ArrowLeft, Database } from "lucide-react"

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Dashboard Utama</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Manajemen Master Data Diklat
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Kelola data institusi mitra, program studi, kapasitas ruangan, periode praktik, dan pembimbing klinik.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <MasterNav />

      {/* Content Area */}
      <div>{children}</div>
    </div>
  )
}
