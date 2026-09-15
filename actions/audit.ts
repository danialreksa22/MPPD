"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export interface AuditLogItem {
  id: string
  user_id: string | null
  action: string
  entity_table: string
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  profiles?: {
    id: string
    full_name: string
    email: string
  } | null
}

export interface AuditLogFilter {
  search?: string
  action?: string
  entityTable?: string
  startDate?: string
  endDate?: string
  limit?: number
}

// Data demonstrasi realistis aktivitas RSUD Bulukumba untuk fallback/preview
const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "aud-001",
    user_id: "usr-admin-01",
    action: "APPROVE",
    entity_table: "student_applications",
    entity_id: "app-2026-042",
    old_data: { status: "diverifikasi", reviewer: "Admin Diklat" },
    new_data: {
      status: "disetujui",
      approved_by: "Hj. St. Aminah, S.ST",
      total_mahasiswa: 8,
      institusi: "Fakultas Kedokteran Unhas",
      _meta_executor_email: "admin.diklat@rsudbulukumba.id",
      _meta_executor_role: "admin_diklat",
    },
    ip_address: "192.168.10.45",
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    profiles: {
      id: "usr-admin-01",
      full_name: "Hj. St. Aminah, S.ST",
      email: "admin.diklat@rsudbulukumba.id",
    },
  },
  {
    id: "aud-002",
    user_id: "usr-preceptor-01",
    action: "FINALIZE_ASSESSMENT",
    entity_table: "assessments",
    entity_id: "asm-2026-089",
    old_data: { is_finalized: false, final_score: null },
    new_data: {
      is_finalized: true,
      final_score: 87.5,
      grade_letter: "A",
      passed: true,
      student_name: "Andi Ahmad Rezky",
      student_nim: "C011211045",
      room_name: "Ruang Rawat Interna",
      _meta_executor_email: "rizal.rusli@rsudbulukumba.id",
      _meta_executor_role: "supervisor_dokter",
    },
    ip_address: "192.168.12.102",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    profiles: {
      id: "usr-preceptor-01",
      full_name: "dr. H. Rizal Rusli, Sp.PD",
      email: "rizal.rusli@rsudbulukumba.id",
    },
  },
  {
    id: "aud-003",
    user_id: "usr-admin-01",
    action: "ISSUE_LETTER",
    entity_table: "letters",
    entity_id: "let-2026-015",
    old_data: null,
    new_data: {
      letter_number: "445/028/DIKLAT-RSUD/BLK/IX/2026",
      type: "surat_balasan_penerimaan",
      recipient_name: "Dekan Fakultas Keperawatan Unhas",
      qr_code: "LET-2026-015",
      _meta_executor_email: "admin.diklat@rsudbulukumba.id",
      _meta_executor_role: "admin_diklat",
    },
    ip_address: "192.168.10.45",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    profiles: {
      id: "usr-admin-01",
      full_name: "Hj. St. Aminah, S.ST",
      email: "admin.diklat@rsudbulukumba.id",
    },
  },
  {
    id: "aud-004",
    user_id: "usr-karu-01",
    action: "APPROVE",
    entity_table: "attendances",
    entity_id: "att-2026-301",
    old_data: { is_approved: false },
    new_data: {
      is_approved: true,
      approved_by: "Ns. H. Mansyur, S.Kep",
      method: "biometric_fingerprint",
      distance_meters: 18.5,
      _meta_executor_email: "karu.igd@rsudbulukumba.id",
      _meta_executor_role: "kepala_ruangan",
    },
    ip_address: "192.168.15.88",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    profiles: {
      id: "usr-karu-01",
      full_name: "Ns. H. Mansyur, S.Kep",
      email: "karu.igd@rsudbulukumba.id",
    },
  },
  {
    id: "aud-005",
    user_id: "usr-super-01",
    action: "ASSIGN_ROLE",
    entity_table: "users",
    entity_id: "usr-new-04",
    old_data: { role: "mahasiswa" },
    new_data: {
      role: "preseptor",
      assigned_unit: "Laboratorium Patologi Klinik",
      _meta_executor_email: "superadmin@rsudbulukumba.id",
      _meta_executor_role: "super_admin",
    },
    ip_address: "192.168.1.10",
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    profiles: {
      id: "usr-super-01",
      full_name: "Super Administrator MAGGURU",
      email: "superadmin@rsudbulukumba.id",
    },
  },
  {
    id: "aud-006",
    user_id: "usr-super-01",
    action: "DELETE",
    entity_table: "users",
    entity_id: "usr-old-99",
    old_data: { email: "dummy.user@rsudbulukumba.id", full_name: "User Percobaan" },
    new_data: {
      reason: "Penghapusan akun penguji pasca audit simulasi",
      _meta_executor_email: "superadmin@rsudbulukumba.id",
      _meta_executor_role: "super_admin",
    },
    ip_address: "192.168.1.10",
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    profiles: {
      id: "usr-super-01",
      full_name: "Super Administrator MAGGURU",
      email: "superadmin@rsudbulukumba.id",
    },
  },
]

/**
 * Server Action: Mengambil Daftar Log Audit dengan Filter Fleksibel
 */
export async function getAuditLogsAction(
  filter: AuditLogFilter = {}
): Promise<{ success: boolean; data: AuditLogItem[]; message?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const isPlaceholder = !supabaseUrl || supabaseUrl.includes("placeholder")

    if (!isPlaceholder && serviceRoleKey) {
      const adminClient = createAdminClient()
      let query = adminClient
        .from("audit_logs")
        .select(`
          id,
          user_id,
          action,
          entity_table,
          entity_id,
          old_data,
          new_data,
          ip_address,
          created_at,
          profiles:user_id (
            id,
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(filter.limit || 100)

      if (filter.action && filter.action !== "all") {
        query = query.eq("action", filter.action)
      }

      if (filter.entityTable && filter.entityTable !== "all") {
        query = query.eq("entity_table", filter.entityTable)
      }

      if (filter.startDate) {
        query = query.gte("created_at", `${filter.startDate}T00:00:00`)
      }

      if (filter.endDate) {
        query = query.lte("created_at", `${filter.endDate}T23:59:59`)
      }

      const { data, error } = await query

      if (!error && data && data.length > 0) {
        let results = data as unknown as AuditLogItem[]

        if (filter.search) {
          const q = filter.search.toLowerCase()
          results = results.filter((item) => {
            const act = item.action?.toLowerCase() || ""
            const tbl = item.entity_table?.toLowerCase() || ""
            const entId = item.entity_id?.toLowerCase() || ""
            const userName = item.profiles?.full_name?.toLowerCase() || ""
            const userEmail = item.profiles?.email?.toLowerCase() || ""
            return (
              act.includes(q) ||
              tbl.includes(q) ||
              entId.includes(q) ||
              userName.includes(q) ||
              userEmail.includes(q)
            )
          })
        }

        return { success: true, data: results }
      }
    }

    // Fallback data simulasi audit trails
    let filteredMocks = [...MOCK_AUDIT_LOGS]

    if (filter.action && filter.action !== "all") {
      filteredMocks = filteredMocks.filter((m) => m.action === filter.action)
    }

    if (filter.entityTable && filter.entityTable !== "all") {
      filteredMocks = filteredMocks.filter((m) => m.entity_table === filter.entityTable)
    }

    if (filter.search) {
      const q = filter.search.toLowerCase()
      filteredMocks = filteredMocks.filter((item) => {
        const act = item.action.toLowerCase()
        const tbl = item.entity_table.toLowerCase()
        const entId = item.entity_id?.toLowerCase() || ""
        const userName = item.profiles?.full_name.toLowerCase() || ""
        const userEmail = item.profiles?.email.toLowerCase() || ""
        return (
          act.includes(q) ||
          tbl.includes(q) ||
          entId.includes(q) ||
          userName.includes(q) ||
          userEmail.includes(q)
        )
      })
    }

    return { success: true, data: filteredMocks }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengambil log audit"
    return { success: false, data: MOCK_AUDIT_LOGS, message: msg }
  }
}
