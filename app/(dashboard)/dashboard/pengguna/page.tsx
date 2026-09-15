import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getUsersAction } from "@/actions/users"
import { UserManagementClient } from "@/components/users/user-management-client"
import { ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Manajemen Pengguna & Hak Akses — MAGGURU",
  description:
    "Kelola akun pengguna, penugasan peran (role-based access control), dan hak akses portal MAGGURU RSUD Bulukumba.",
}

export const dynamic = "force-dynamic"

export default async function UserManagementPage() {
  const supabase = await createClient()

  const [usersRes, { data: institutions }, { data: rooms }] = await Promise.all([
    getUsersAction(),
    supabase.from("institutions").select("id, name").eq("is_active", true).order("name"),
    supabase.from("rooms_units").select("id, name, code").eq("is_active", true).order("name"),
  ])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Manajemen Pengguna &amp; Hak Akses
            </h1>
            <p className="text-xs text-muted-foreground">
              Kelola akun seluruh pengguna portal MAGGURU, peran operasional, serta penugasan unit ruangan dan institusi mitra RSUD H. Andi Sulthan Daeng Radja Bulukumba.
            </p>
          </div>
        </div>
      </div>

      {/* Client Component */}
      <UserManagementClient
        initialUsers={usersRes.data || []}
        institutions={institutions || []}
        rooms={rooms || []}
      />
    </div>
  )
}
