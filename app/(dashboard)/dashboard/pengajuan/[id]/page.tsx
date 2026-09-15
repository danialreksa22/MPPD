import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getApplicationDetailAction } from "@/actions/applications"
import {
  ApplicationVerificationCard,
  VerificationApplication,
  VerificationStudent,
  RoomItem,
} from "@/components/applications/application-verification-card"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PengajuanDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [detailRes, { data: rooms }] = await Promise.all([
    getApplicationDetailAction(id),
    supabase.from("rooms_units").select("*").eq("is_active", true).order("name"),
  ])

  if (!detailRes.success || !detailRes.data?.application) {
    notFound()
  }

  const { application, student } = detailRes.data

  return (
    <div className="space-y-6">
      <ApplicationVerificationCard
        application={application as unknown as VerificationApplication}
        student={student as unknown as VerificationStudent | null}
        rooms={(rooms as RoomItem[]) || []}
      />
    </div>
  )
}
