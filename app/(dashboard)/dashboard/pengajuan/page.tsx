import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ApplicationList, ApplicationItem } from "@/components/applications/application-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function PengajuanPage() {
  const supabase = await createClient()

  const { data: applications } = await supabase
    .from("student_applications")
    .select(
      `
      id,
      application_number,
      status,
      notes,
      created_at,
      institutions (id, name, type),
      periods (id, name, academic_year),
      student_documents (id, document_type, verified_status)
    `
    )
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Pengajuan &amp; Verifikasi Mahasiswa
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola pengajuan praktik klinik dan MPPD, validasi berkas administrasi, dan setujui permohonan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/pengajuan/baru">
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-xs">
              <Plus className="h-4 w-4" />
              Pengajuan Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Main List */}
      <ApplicationList initialData={(applications as unknown as ApplicationItem[]) || []} />
    </div>
  )
}
